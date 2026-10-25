// Explicit opt-in live integration check. Uses disposable accounts and deletes only its own records.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
if(!process.argv.includes('--live'))throw Error('Run with --live to test the configured Firebase project');
const config=fs.readFileSync('firebase-config.js','utf8'),key=config.match(/apiKey:\s*"([^"]+)"/)[1],project=config.match(/projectId:\s*"([^"]+)"/)[1];
const base=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`,created=[],accounts=[];
async function req(url,method='GET',body,token){const res=await fetch(url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});const json=await res.json().catch(()=>({}));if(!res.ok)throw Error(method+' '+new URL(url).pathname+': '+(json.error?.message||res.status));return json;}
const auth=(action,body)=>req(`https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${key}`,'POST',body);
const field=v=>typeof v==='string'?{stringValue:v}:Array.isArray(v)?{arrayValue:{values:v.map(field)}}:typeof v==='number'?{integerValue:String(v)}:{booleanValue:v};
const fields=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,field(v)]));
(async()=>{let owner;const cleanupErrors=[];try{
 const password=crypto.randomBytes(24).toString('base64url');
 owner=await auth('signUp',{email:`karobar-qa-${Date.now()}@example.com`,password,returnSecureToken:true});accounts.push(owner);
 let branch,code;for(let n=0;n<4;n++){code=String(crypto.randomInt(100000,1000000));try{branch=await auth('signUp',{email:code+'@branch.karobar.app',password,returnSecureToken:true});accounts.push(branch);break;}catch(e){if(!e.message.includes('EMAIL_EXISTS'))throw e;}}if(!branch)throw Error('Could not allocate isolated branch login');
 const ownerPath='users/'+owner.localId,branchPath='branches/'+branch.localId,mapPath='branchMap/'+branch.localId,lookupPath='branchLookup/'+code,codePath='globalBranchCodes/'+code;
 const data={business:{name:'Disposable sync verification'},settings:{},sales:[],parties:[],payments:[],items:[],users:[]};
 const entries=[[ownerPath,{data:JSON.stringify(data),memberUids:[branch.localId]}],[branchPath,{ownerUid:owner.localId,authUid:branch.localId,branchCode:code,status:'active',name:'QA Branch'}],[mapPath,{ownerUid:owner.localId,branchCode:code,branchName:'QA Branch'}],[lookupPath,{ownerUid:owner.localId,branchId:branch.localId}],[codePath,{ownerUid:owner.localId,branchId:branch.localId}]];
 await req(base+':commit','POST',{writes:entries.map(([p,d])=>({update:{name:`projects/${project}/databases/(default)/documents/${p}`,fields:fields(d)}}))},owner.idToken);created.push(...entries.map(([p])=>p));
 const login=await auth('signInWithPassword',{email:code+'@branch.karobar.app',password,returnSecureToken:true});
 const mapping=await req(base+'/'+mapPath,'GET',null,login.idToken);assert.equal(mapping.fields.ownerUid.stringValue,owner.localId);
 const original=await req(base+'/'+ownerPath,'GET',null,login.idToken);assert.equal(JSON.parse(original.fields.data.stringValue).business.name,data.business.name);
 data.sales.push({id:'qa-branch-sale',total:125,received:100});
 await req(base+'/'+ownerPath+'?updateMask.fieldPaths=data','PATCH',{fields:fields({data:JSON.stringify(data)})},login.idToken);
 const updated=await req(base+'/'+ownerPath,'GET',null,owner.idToken);assert.equal(JSON.parse(updated.fields.data.stringValue).sales[0].id,'qa-branch-sale');
 let denied=false;try{await req(base+'/'+ownerPath);}catch(e){denied=e.message.includes('permission')||e.message.includes('PERMISSION');}assert.ok(denied,'Anonymous access must be denied');
 console.log('PASS live Firebase: atomic branch setup, branch password login, owner-store read/write, anonymous access denied');
 }finally{
 if(owner)for(const p of created.reverse()){try{await req(base+'/'+p,'DELETE',null,owner.idToken);}catch(e){cleanupErrors.push(p+': '+e.message);}}
 for(const account of accounts.reverse()){try{await auth('delete',{idToken:account.idToken});}catch(e){cleanupErrors.push('Temporary account '+account.localId+': '+e.message);}}
 if(cleanupErrors.length)throw Error('Cleanup needs attention: '+cleanupErrors.join('; '));
 console.log('Temporary test records and accounts removed');
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
