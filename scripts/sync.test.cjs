const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8').split('/* ============ FIREBASE CLOUD SYNC ============ */')[1];
const drain = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
function harness(cache = new Map(), docs = new Map()) {
  const timers = new Map();
  let auth, listener, seq = 0, fail = false, delayed = null, writeDelay=null;
  const base = () => ({ business: { name: 'Original', logo: '', phone: '' }, users: [], settings: {} });
  const snap = data => ({ exists: !!data, data: () => data, metadata: { hasPendingWrites: false } });
  const elements = new Map();
  const context = { console: { error() {}, warn() {} }, store: base(), defaults: base, KEY: 'mybiz_v2',
    localStorage: { getItem: k => cache.get(k) || null, setItem: (k,v) => cache.set(k,v), removeItem: k => cache.delete(k) },
    document: { readyState: 'complete', getElementById: id => { if (!elements.has(id)) elements.set(id, {style:{},textContent:''}); return elements.get(id); }, querySelector: () => null },
    setTimeout: fn => { timers.set(++seq, fn); return seq; }, clearTimeout: id => timers.delete(id), setInterval() {},
    firebase: { firestore: { FieldValue: { serverTimestamp: () => 1 } } },
    ensure() {}, applySavedPrintPreference() {}, updateBadge() {}, buildMenu() {}, refreshAll() {}, closeModal() {}, nav() {}, logDiagnostic() {}, toast() {},
  };
  context.window = context;
  context.fbAuth = { getRedirectResult: () => Promise.resolve(), onAuthStateChanged: fn => {auth=fn;}, signOut: async () => auth(null) };
  context.fbDB = { collection: collection => ({ doc: id => ({
    get: () => { const value=snap(collection==='users'?docs.get(id):docs.get(collection+'/'+id)); if(collection==='users'&&delayed){const fn=delayed;delayed=null;return new Promise(resolve=>fn(()=>resolve(value)));} return Promise.resolve(value); },
    set: async data => { if(fail) throw {code:'unavailable'}; docs.set(id,data); if(writeDelay){const fn=writeDelay;writeDelay=null;await new Promise(r=>fn(r));} },
    onSnapshot: fn => {listener=fn;return ()=>{listener=null;};}
  }) }) };
  context.fbDB.runTransaction=async fn=>{
    if(fail)throw {code:'unavailable'};
    const jobs=[];const result=await fn({get:ref=>ref.get(),set:(ref,value)=>jobs.push(()=>ref.set(value))});
    for(const job of jobs)await job();return result;
  };
  vm.createContext(context); vm.runInContext(source,context);
  return { context, cache, docs, base, elements,
    login: async (id,email=id+'@example.com') => { auth({uid:id,email}); await drain(); },
    logout: async () => {await context.fbLogout();await drain();},
    edit: (field,value) => {context.store.business[field]=value;context.cloudPush();},
    tick: async () => {const jobs=[...timers.values()];timers.clear();jobs.forEach(fn=>fn());await drain();},
    fail: value => {fail=value;},
    delayRead: fn => {delayed=fn;},
    delayWrite: fn => {writeDelay=fn;},
    emit: data => listener(snap(data))
  };
}
test('failed save survives cloud refresh and retries', async () => {
  const h=harness(); await h.login('a');h.fail(true);h.edit('logo','new-logo');await h.tick();
  h.context.cloudRefresh(false);await drain();assert.equal(h.context.store.business.logo,'new-logo');
  h.fail(false);h.context.cloudRefresh(false);await h.tick();assert.equal(JSON.parse(h.docs.get('a').data).business.logo,'new-logo');
});
test('pending changes survive restart and stay isolated to the account',async()=>{
  const h=harness();await h.login('a');h.edit('logo','pending-logo');
  const next=harness(h.cache);next.docs.set('a',h.docs.get('a'));
  await next.login('b');assert.equal(next.context.store.business.logo,'');
  await next.login('a');assert.equal(next.context.store.business.logo,'pending-logo');await next.tick();
  assert.equal(JSON.parse(next.docs.get('a').data).business.logo,'pending-logo');
});
test('refresh started before an edit cannot overwrite that edit',async()=>{
  const h=harness();await h.login('a');await h.tick();let finish;
  const remote=h.base();remote.business.phone='remote-phone';h.docs.set('a',{data:JSON.stringify(remote)});
  h.delayRead(fn=>{finish=fn;});h.context.cloudRefresh(false);h.edit('logo','new-logo');finish();await drain();
  assert.equal(h.context.store.business.logo,'new-logo');
});
test('old account refresh cannot leak data into the new account',async()=>{
  const h=harness();await h.login('a');await h.tick();let finish;
  const remote=h.base();remote.business.name='Account A';h.docs.set('a',{data:JSON.stringify(remote)});
  h.delayRead(fn=>{finish=fn;});h.context.cloudRefresh(false);await h.login('b');finish();await drain();
  assert.notEqual(h.context.store.business.name,'Account A');
});
test('logout retains pending data for the same account',async()=>{
  const h=harness();await h.login('a');h.fail(true);h.edit('phone','123');await h.logout();await h.login('a');
  assert.equal(h.context.store.business.phone,'123');
});
test('recovery preserves remote fields that were not edited locally',async()=>{
  const h=harness();await h.login('a');await h.tick();h.edit('logo','local-logo');
  const next=harness(h.cache),remote=h.base();remote.business.phone='remote-phone';
  next.docs.set('a',{data:JSON.stringify(remote)});await next.login('a');await next.tick();
  assert.equal(next.context.store.business.logo,'local-logo');assert.equal(next.context.store.business.phone,'remote-phone');
});
test('remote snapshot cannot erase an unsaved logo',async()=>{
  const h=harness();await h.login('a');await h.tick();h.fail(true);h.edit('logo','local-logo');await h.tick();
  const remote=h.base();remote.business.phone='remote-phone';h.emit({data:JSON.stringify(remote)});
  assert.equal(h.context.store.business.logo,'local-logo');
});
test('an old login response cannot replace the active account',async()=>{
  const h=harness();let finish;h.delayRead(fn=>{finish=fn;});await h.login('a');await h.login('b');finish();await drain();
  assert.equal(h.context.store.currentUser.name,'b@example.com');
});
test('write acknowledged after account switch is not replayed over newer cloud data',async()=>{
  const h=harness();await h.login('a');await h.tick();let finish;
  h.delayWrite(fn=>{finish=fn;});h.edit('logo','v1');await h.tick();await h.login('b');finish();await drain();
  const remote=h.base();remote.business.logo='v2';h.docs.set('a',{data:JSON.stringify(remote)});
  await h.login('a');assert.equal(h.context.store.business.logo,'v2');
});
test('recovery keeps both local and remote record additions',async()=>{
  const h=harness();await h.login('a');h.context.store.sales=[];h.context.cloudPush();await h.tick();
  h.context.store.sales=[{id:'local',total:10}];h.context.cloudPush();
  const next=harness(h.cache),remote=JSON.parse(h.docs.get('a').data);remote.sales=[{id:'remote',total:20}];next.docs.set('a',{data:JSON.stringify(remote)});
  await next.login('a');await next.tick();assert.deepEqual(JSON.parse(next.docs.get('a').data).sales.map(s=>s.id).sort(),['local','remote']);
});
test('retry merges a different device update before writing',async()=>{
  const h=harness();await h.login('a');await h.tick();h.edit('logo','local-logo');
  const remote=JSON.parse(h.docs.get('a').data);remote.business.phone='remote-phone';h.docs.set('a',{data:JSON.stringify(remote)});
  await h.tick();const saved=JSON.parse(h.docs.get('a').data);assert.equal(saved.business.phone,'remote-phone');assert.equal(saved.business.logo,'local-logo');
});
test('two tabs cannot turn a newly committed sale into a deletion',async()=>{
  const a=harness();await a.login('a');a.context.store.sales=[];a.context.cloudPush();await a.tick();
  const b=harness(a.cache,a.docs);await b.login('a');let finish;
  a.delayWrite(fn=>{finish=fn;});a.context.store.sales.push({id:'sale-a',total:10});a.context.cloudPush();await a.tick();
  b.edit('phone','222');finish();await drain();await b.tick();await a.tick();
  assert.equal(JSON.parse(a.docs.get('a').data).sales[0]?.id,'sale-a');
});
test('pending saves from two tabs survive closing both before upload',async()=>{
  const a=harness();await a.login('a');await a.tick();const b=harness(a.cache,a.docs);await b.login('a');
  a.edit('logo','tab-a-logo');b.edit('phone','tab-b-phone');
  const next=harness(a.cache,a.docs);await next.login('a');await next.tick();
  const saved=JSON.parse(next.docs.get('a').data);assert.equal(saved.business.logo,'tab-a-logo');assert.equal(saved.business.phone,'tab-b-phone');
});

test('branch account loads owner store and writes back to the owner, not a new store',async()=>{
 const docs=new Map(),owner={business:{name:'Owner shop'},settings:{},users:[],sales:[]};
 docs.set('owner',{data:JSON.stringify(owner)});
 docs.set('branchMap/branch-user',{ownerUid:'owner',branchCode:'123456',branchName:'Lahore'});
 docs.set('branches/branch-user',{ownerUid:'owner',branchCode:'123456',name:'Lahore',status:'active',address:'Lahore Road'});
 const h=harness(new Map(),docs);await h.login('branch-user','123456@branch.karobar.app');
 assert.equal(h.context.store.currentUser.role,'branch');assert.equal(h.context.store.currentUser.branchAddress,'Lahore Road');assert.equal(h.context.store.business.name,'Owner shop');
 h.context.store.sales.push({id:'branch-sale',total:100});h.context.cloudPush();await h.tick();
 assert.equal(JSON.parse(docs.get('owner').data).sales[0].id,'branch-sale');assert.equal(docs.has('branch-user'),false);
});
test('disabled and missing branch records never become owner sessions',async()=>{
 for(const status of ['disabled','missing']){
  const docs=new Map([['owner',{data:JSON.stringify({business:{name:'Private owner shop'},settings:{},users:[]})}],['branchMap/branch-user',{ownerUid:'owner',branchCode:'123456'}]]);
  if(status==='disabled')docs.set('branches/branch-user',{status:'disabled'});
  const h=harness(new Map(),docs);await h.login('branch-user','123456@branch.karobar.app');
  assert.notEqual(h.context.store.currentUser?.role,'branch');assert.notEqual(h.context.store.business.name,'Private owner shop');
 }
});
test('simultaneous device sales remain in the shared store',async()=>{
 const a=harness();await a.login('owner');a.context.store.sales=[];a.context.cloudPush();await a.tick();
 const b=harness(new Map(),a.docs);await b.login('owner');
 a.context.store.sales.push({id:'device-a-sale',total:100});a.context.cloudPush();
 b.context.store.sales.push({id:'device-b-sale',total:200});b.context.cloudPush();
 await a.tick();await b.tick();
 assert.deepEqual(JSON.parse(a.docs.get('owner').data).sales.map(s=>s.id).sort(),['device-a-sale','device-b-sale']);
});
