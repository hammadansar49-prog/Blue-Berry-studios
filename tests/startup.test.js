const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadMain() {
  let requestHandler, listenPort, readPath, shownError;
  const electron = {
    app: { disableHardwareAcceleration(){}, requestSingleInstanceLock(){return true;}, on(){}, whenReady(){return {then(){}};}, quit(){} },
    BrowserWindow: function(){}, Menu:{}, shell:{}, ipcMain:{handle(){}}, dialog:{showErrorBox(title, message){shownError=message;}}
  };
  const context = { require(name) {
    if(name === 'electron') return electron;
    if(name === './printing') return {registerPrinting(){}};
    if(name === 'fs') return {readFile(file, cb){ readPath=file; cb(null, Buffer.from('ok')); }};
    if(name === 'http') return {createServer(handler){requestHandler=handler;return {on(){},listen(port, host, cb){listenPort=port;cb();}};}};
    return require(name);
  }, __dirname:path.resolve(__dirname,'../electron'), process, console, URL, Buffer };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../electron/main.js'),'utf8'),context);
  return {context, async start(){await context.startLocalServer(path.resolve(__dirname,'..'));}, get port(){return listenPort;}, request(url,host='localhost:17843') {
    const result={status:200, body:'',headers:{}};
    requestHandler({url,method:'GET',headers:{host}}, {setHeader(k,v){result.headers[k]=v;},writeHead(status){result.status=status;},end(body){result.body=String(body);}});
    return result;
  }};
}
test('desktop uses a stable loopback port for persistent local storage',async()=>{
  const main=loadMain();await main.start();assert.equal(main.port,17843);
});
test('local server serves app assets but denies private source and foreign hosts',async()=>{
  const main=loadMain();await main.start();
  assert.equal(main.request('/index.html').status,200);
  assert.equal(main.request('/assets/jsbarcode.min.js').status,200);
  for(const url of ['/electron/main.js','/.git/config','/package.json','/../package.json','/assets/../../package.json']) assert.equal(main.request(url).status,403,url);
  assert.equal(main.request('/index.html','attacker.example:17843').status,403);
});
test('Google callback refuses unsolicited credentials and consumes state once',async()=>{
  const main=loadMain();await main.start();
  assert.equal(main.request('/__google_done?idToken=bad').status,403);
  vm.runInContext("googleState = {token:'trusted', expires:Date.now()+10000}",main.context);
  assert.equal(main.request('/__google_done?idToken=test&state=trusted').status,200);
  assert.equal(main.request('/__google_done?idToken=test&state=trusted').status,403);
});
test('missing Firebase CDN does not throw on offline startup',()=>{
  const context={window:{},console};vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../firebase-config.js'),'utf8'),context);
  assert.equal(context.window.fbAuth,null);assert.equal(context.window.fbDB,null);
});

test('offline spreadsheet library preserves exported rows on import',()=>{
  const XLSX=require('../assets/xlsx.full.min.js');
  const workbook=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet([['Item','Qty','Amount'],['Milk',2,350]]),'Sales');
  const bytes=XLSX.write(workbook,{bookType:'xlsx',type:'buffer'});
  const restored=XLSX.read(bytes,{type:'buffer'});
  assert.deepEqual(XLSX.utils.sheet_to_json(restored.Sheets.Sales,{header:1}),[['Item','Qty','Amount'],['Milk',2,350]]);
});
test('all application script sources ship locally and Firebase is pinned',()=>{
  const root=path.resolve(__dirname,'..');
  for(const page of ['index.html','google.html']){
    const html=fs.readFileSync(path.join(root,page),'utf8');
    for(const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)){
      assert.ok(!/^https?:/.test(match[1]),match[1]);
      assert.ok(fs.existsSync(path.join(root,match[1].split('?')[0])),match[1]);
    }
  }
  assert.equal(require('../assets/firebase-app-compat.js').SDK_VERSION,'10.12.2');
});
