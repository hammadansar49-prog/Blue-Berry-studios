const fs=require('fs'),path=require('path');
function trialState(file,hours,now=Date.now()){
 if(!hours)return {expired:false,enabled:false};
 let state;
 try{state=JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){if(e.code!=='ENOENT')return {enabled:true,expired:true,reason:'Trial record could not be verified'};state={startedAt:now,lastSeen:now};}
 if(!Number.isFinite(state.startedAt)||!Number.isFinite(state.lastSeen)||state.startedAt>state.lastSeen)return {enabled:true,expired:true,reason:'Invalid trial record'};
 const expiresAt=state.startedAt+hours*3600000;
 const expired=!!state.expired||now>=expiresAt||now+300000<state.lastSeen;
 state.lastSeen=Math.max(now,state.lastSeen);state.expired=expired;
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(state));fs.renameSync(file+'.tmp',file);
 return {enabled:true,expired,expiresAt};
}
module.exports={trialState};
