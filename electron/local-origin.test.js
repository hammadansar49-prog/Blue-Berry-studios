const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
test('desktop origin stays the same across restarts; occupied port does not change it',async()=>{
  const {listenPersistent}=require('./local-origin');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'karobar-origin-'));
  let first,second,occupied;
  try{
    first=http.createServer();await listenPersistent(first,dir);const port=first.address().port;
    await new Promise(r=>first.close(r));
    second=http.createServer();await listenPersistent(second,dir);assert.equal(second.address().port,port);
    occupied=http.createServer();await assert.rejects(listenPersistent(occupied,dir),{code:'EADDRINUSE'});
  }finally{
    for(const server of [first,second,occupied])if(server?.listening)await new Promise(r=>server.close(r));
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
