const { test } = require('node:test');
const assert = require('node:assert/strict');
const { windowsStatus, validateJob, escpos } = require('../electron/print-core');

test('printer presence alone is not proof of connectivity', () => {
  assert.equal(windowsStatus(null).state, 'unknown');
  assert.equal(windowsStatus({ PrinterStatus: 2 }).state, 'unknown');
  assert.equal(windowsStatus({ PrinterStatus: 3, DetectedErrorState: 2 }).state, 'ready');
  assert.equal(windowsStatus({ PrinterStatus: 3, WorkOffline: true }).state, 'offline');
  assert.equal(windowsStatus({ PrinterStatus: 3, DetectedErrorState: 4 }).state, 'error');
});
test('custom print dimensions and device selection are bounded', () => {
  assert.equal(validateJob({html:'<p>Bill</p>', kind:'thermal', widthMm:58}).widthMm,58);
  for(const widthMm of [0, -1, NaN, 301]) assert.throws(()=>validateJob({html:'x',kind:'thermal',widthMm}));
  assert.throws(()=>validateJob({html:'x',kind:'label',widthMm:50,heightMm:0}));
  assert.throws(()=>validateJob({html:'x',deviceName: 123}));
});
test('ESC/POS commands use explicit capabilities, feed and drawer options', () => {
  const data=escpos({text:'Total 100',bold:true,feedLines:2,cut:true,drawer:true,escposConfirmed:true});
  assert.ok(data.includes(Buffer.from([27,69,1])));
  assert.ok(data.includes(Buffer.from([29,86,0])));
  assert.ok(data.includes(Buffer.from([27,112,0,25,250])));
  assert.throws(()=>escpos({text:'Bill',cut:true}),/ESC\/POS/);
});
test('RAW never silently corrupts Unicode or accepts injected control commands', () => {
  assert.throws(()=>escpos({text:'اردو',escposConfirmed:true}),/graphical/i);
  assert.throws(()=>escpos({text:'hello\x1bp',escposConfirmed:true}),/control/i);
  const data=escpos({text:'Bill',escposConfirmed:true});
  assert.ok(!data.includes(Buffer.from([29,86])));
});
test('ESC/POS includes validated company logo raster before receipt text',()=>{
 const data=escpos({text:'Bill',escposConfirmed:true,logo:{widthBytes:1,height:2,data:Buffer.from([255,128]).toString('base64')}});
 assert.ok(data.includes(Buffer.from([29,118,48,0,1,0,2,0,255,128])));
 assert.throws(()=>escpos({text:'Bill',escposConfirmed:true,logo:{widthBytes:2,height:2,data:'AA=='}}),/raster length/);
});
