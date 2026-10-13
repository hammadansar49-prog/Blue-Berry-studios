const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'..','electron','printing.js'),'utf8');

function harness(userData, options = {}) {
  const handlers = new Map(), windows = [], jobs = [];
  class BrowserWindow {
    constructor(settings) {
      this.settings = settings;
      this.destroyed = false;
      windows.push(this);
      this.webContents = {
        setWindowOpenHandler() {}, on() {},
        loadURL: async url => { this.url = url; },
        executeJavaScript: async script => script.includes('getBoundingClientRect') ? (options.height || 100) : undefined,
        insertCSS: async css => { this.css = css; },
        print: (job, callback) => { jobs.push(job); callback(!options.printError, options.printError); },
        printToPDF: async job => { jobs.push(job); return Buffer.from('mock-pdf'); }
      };
    }
    isDestroyed() { return this.destroyed; }
    destroy() { this.destroyed = true; }
  }
  const electron = { BrowserWindow, ipcMain:{handle:(name,fn)=>handlers.set(name,fn)},
    app:{getPath:()=>userData}, dialog:{showSaveDialog:async()=>({canceled:true})} };
  const module = {exports:{}};
  vm.runInNewContext(source,{module,Buffer,process,setTimeout,clearTimeout,
    require(name) {
      if(name==='electron') return electron;
      if(name==='child_process') return {execFile(file,args,opts,cb) { cb(new Error('No physical printer access in tests'),'',''); }};
      if(name==='./print-core') return require('../electron/print-core');
      return require(name);
    }
  },{filename:'electron/printing.js'});
  const main = {karobarAppURL:'http://127.0.0.1:12345/index.html',
    webContents:{mainFrame:{url:'http://127.0.0.1:12345/index.html'},getPrintersAsync:async()=>[]}};
  module.exports.registerPrinting(()=>main);
  const event = {sender:main.webContents,senderFrame:main.webContents.mainFrame};
  return {handlers,windows,jobs,main,event,...module.exports};
}

test('all print IPC routes reject foreign senders, subframes, and navigated pages', async () => {
  const h = harness(os.tmpdir());
  for (const route of ['karobar-printer-config','karobar-print-list','karobar-print-html','karobar-print-raw','karobar-print-pdf']) {
    for (const event of [{sender:{},senderFrame:h.event.senderFrame},
      {sender:h.event.sender,senderFrame:{url:h.main.karobarAppURL}}]) {
      const result = await h.handlers.get(route)(event,{});
      assert.equal(result.ok,false);
      assert.match(result.error,/Untrusted/);
    }
    h.main.webContents.mainFrame.url='https://example.com/';
    const result = await h.handlers.get(route)(h.event,{});
    assert.equal(result.ok,false);
    assert.match(result.error,/Untrusted/);
    h.main.webContents.mainFrame.url=h.main.karobarAppURL;
  }
  assert.equal(h.windows.length,0);
});

test('printer configuration survives a new main-process instance and rejects control characters', async t => {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(),'karobar-config-test-'));
  t.after(()=>fs.promises.rm(dir,{recursive:true,force:true}));
  const first = harness(dir);
  const write = first.handlers.get('karobar-printer-config');
  assert.equal((await write(first.event,{thermal:'Receipt printer',silent:true,escpos:true,unexpected:'discard'})).ok,true);
  const second = harness(dir);
  const read = await second.handlers.get('karobar-printer-config')(second.event);
  assert.equal(read.ok,true);
  assert.equal(read.config.thermal,'Receipt printer');
  assert.equal(read.config.silent,true);
  assert.equal(read.config.escpos,true);
  assert.equal(read.config.unexpected,undefined);
  assert.equal((await write(first.event,{thermal:'bad\nprinter'})).ok,false);
  const unchanged = await second.handlers.get('karobar-printer-config')(second.event);
  assert.equal(unchanged.config.thermal,'Receipt printer');
});

test('printer callback failure reaches caller and destroys hidden print window', async () => {
  const h = harness(os.tmpdir(),{printError:'Driver rejected paper size'});
  const result = await h.handlers.get('karobar-print-html')(h.event,{html:'<p>Receipt</p>',kind:'regular',paper:'A4'});
  assert.equal(result.ok,false);
  assert.match(result.error,/Driver rejected paper size/);
  assert.equal(h.windows.length,1);
  assert.equal(h.windows[0].destroyed,true);
  assert.equal(h.windows[0].settings.webPreferences.sandbox,true);
  assert.equal(h.windows[0].settings.webPreferences.nodeIntegration,false);
  const retry = await h.handlers.get('karobar-print-html')(h.event,{html:'<p>Retry</p>',kind:'regular'});
  assert.match(retry.error,/Driver rejected/);
  assert.equal(h.windows.length,2,'failed job releases busy lock');
});

test('thermal printing converts millimetres to microns and destroys the completed window', async () => {
  const h = harness(os.tmpdir(),{height:125});
  const result = await h.renderJob({html:'<p>Receipt</p>',kind:'thermal',widthMm:58,silent:false},'html');
  assert.equal(result.ok,true);
  assert.equal(h.jobs[0].pageSize.width,58000);
  assert.equal(h.jobs[0].pageSize.height,125000);
  assert.equal(h.windows[0].destroyed,true);
  const content = decodeURIComponent(h.windows[0].url.split(',').slice(1).join(','));
  assert.ok(content.startsWith('<!doctype html><meta http-equiv="Content-Security-Policy"'));
});

test('overlong thermal receipt fails before submitting to driver and cleans up', async () => {
  const h = harness(os.tmpdir(),{height:2001});
  await assert.rejects(h.renderJob({html:'<p>Receipt</p>',kind:'thermal',widthMm:80},'html'),/exceeds 2 metres/);
  assert.equal(h.jobs.length,0);
  assert.equal(h.windows[0].destroyed,true);
});
