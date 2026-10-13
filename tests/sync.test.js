const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const start=source.indexOf('  var fbUser = null;');
const end=source.indexOf('  // ---- Auth UI handlers',start);
function harness(storage=new Map()){
  const baseline={sales:[{id:'base'}],items:[],users:[]};
  const remote={data:JSON.stringify(baseline)};
  let listener, scheduled, fail=false;
  const status={textContent:'',style:{}};
  const ref={get:async()=>({exists:true,data:()=>remote}),
    set:async value=>{Object.assign(remote,value);},
    onSnapshot:fn=>{listener=fn;return ()=>{};}};
  const database={collection:()=>({doc:()=>ref}),runTransaction:async fn=>{
    if(fail)throw Object.assign(new Error('offline'),{code:'unavailable'});
    let write;
    await fn({get:ref.get,set:(_ref,value)=>{write=value;}});
    if(write)Object.assign(remote,write);
  }};
  const context=vm.createContext({window:{fbDB:database,fbAuth:{currentUser:{uid:'owner'},signOut(){}},addEventListener(){}},
    store:{...structuredClone(baseline),currentUser:{name:'Owner'}},KEY:'test',
    document:{getElementById:()=>status},firebase:{firestore:{FieldValue:{serverTimestamp:()=>0}}},
    localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null,removeItem:k=>storage.delete(k)},updateBadge(){},setTimeout:fn=>{scheduled=fn;return 1;},clearTimeout(){},
    toast(){},console:{error(){}}});
  vm.runInContext(source.slice(start,end)+`
    fbUser={uid:'owner'};dataUid='owner';cloudReady=true;lastPushedJSON=cloudJSON();
    globalThis.listen=()=>startSnapshot('owner');
    globalThis.reload=()=>loadUserData('owner');
    globalThis.cache=()=>cacheConfirmedStore(cloudJSON());
    globalThis.restore=(uid,code)=>restoreAuthenticatedOffline(uid,{code});
  `,context);
  return {context,remote,status,storage,offline(){fail=true;},online(){fail=false;},
    async push(){context.window.cloudPush();if(scheduled){const run=scheduled;scheduled=null;run();}for(let i=0;i<8;i++)await new Promise(setImmediate);},
    snapshot(){context.listen();listener({exists:true,metadata:{hasPendingWrites:false},data:()=>remote});}};
}
test('remote snapshots preserve unsynced local edits and report conflict',()=>{
  const h=harness();h.context.store.sales.push({id:'local'});
  h.remote.data=JSON.stringify({sales:[{id:'base'},{id:'other-device'}],items:[]});
  h.snapshot();
  assert.equal(h.context.store.sales[1].id,'local');
  assert.match(h.status.textContent,/conflict|unsynced/i);
});
test('concurrent cloud changes cannot be overwritten by full-store save',async()=>{
  const h=harness();h.context.store.sales.push({id:'local'});
  h.remote.data=JSON.stringify({sales:[{id:'base'},{id:'other-device'}],items:[]});
  await h.push();
  assert.equal(JSON.parse(h.remote.data).sales[1].id,'other-device');
  assert.equal(h.context.store.sales[1].id,'local');
  assert.match(h.status.textContent,/conflict/i);
});
test('successful transaction saves edits without persisting per-device identity',async()=>{
  const h=harness();h.context.store.sales.push({id:'local'});await h.push();
  assert.equal(JSON.parse(h.remote.data).sales[1].id,'local');
  assert.equal(JSON.parse(h.remote.data).currentUser,undefined);
});
test('failed offline save can retry without discarding local edits',async()=>{
  const h=harness();h.context.store.sales.push({id:'local'});h.offline();await h.push();
  assert.equal(JSON.parse(h.remote.data).sales.length,1);
  assert.equal(h.context.store.sales.length,2);
  h.online();await h.push();
  assert.equal(JSON.parse(h.remote.data).sales[1].id,'local');
});
test('clean local store accepts remote updates',()=>{
  const h=harness();h.remote.data=JSON.stringify({sales:[{id:'base'},{id:'remote'}],items:[]});
  h.snapshot();assert.equal(h.context.store.sales[1].id,'remote');
});
test('pending edits survive a new session without restoring another owner draft',async()=>{
  const first=harness();first.context.store.sales.push({id:'offline-sale'});first.offline();await first.push();
  assert.ok(first.storage.has('karobar.pending.owner'));
  first.storage.set('karobar.pending.other-owner',JSON.stringify({base:'{}',data:'{"sales":[{"id":"secret"}]}'}));
  const second=harness(first.storage);second.context.reload();
  for(let i=0;i<8;i++)await new Promise(setImmediate);
  assert.equal(second.context.store.sales[1].id,'offline-sale');
  assert.ok(!JSON.stringify(second.context.store).includes('secret'));
});
test('cloud payload strips legacy plaintext staff credentials',async()=>{
  const h=harness();h.context.store.users.push({id:'staff',name:'Staff',pass:'secret',password:'secret2'});
  await h.push();const staff=JSON.parse(h.remote.data).users[0];
  assert.equal(staff.name,'Staff');assert.equal(staff.pass,undefined);assert.equal(staff.password,undefined);
});
test('matching cached Firebase identity reopens its confirmed store offline',()=>{
  const h=harness();h.context.cache();h.context.store={sales:[],currentUser:null};
  assert.equal(h.context.restore('owner','unavailable'),true);
  assert.equal(h.context.store.sales[0].id,'base');
  assert.match(h.status.textContent,/Offline/);
});
test('offline fallback never bypasses permission denial or missing/different Firebase identity',()=>{
  const h=harness();h.context.cache();
  assert.equal(h.context.restore('owner','permission-denied'),false);
  assert.equal(h.context.restore('other-owner','unavailable'),false);
  h.context.window.fbAuth.currentUser=null;
  assert.equal(h.context.restore('owner','unavailable'),false);
  h.context.window.fbAuth.currentUser={uid:'other-owner'};
  assert.equal(h.context.restore('owner','unavailable'),false);
});
test('offline fallback rejects a cache belonging to another auth UID',()=>{
  const h=harness();h.context.cache();
  const entry=JSON.parse(h.storage.get('karobar.auth-cache.owner'));entry.authUid='other-owner';
  h.storage.set('karobar.auth-cache.owner',JSON.stringify(entry));
  assert.equal(h.context.restore('owner','unavailable'),false);
});
test('offline editing preserves a pending draft and does not write using cached authorization',async()=>{
  const h=harness();h.context.cache();assert.equal(h.context.restore('owner','unavailable'),true);
  h.context.store.sales.push({id:'offline-sale'});await h.push();
  assert.equal(JSON.parse(h.remote.data).sales.length,1);
  assert.equal(JSON.parse(h.storage.get('karobar.pending.owner')).data.includes('offline-sale'),true);
});
