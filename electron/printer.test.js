const assert = require('assert');
const { availablePrinters, checkPrinter, receiptPageSize } = require('./printer');

assert.deepStrictEqual(availablePrinters([{ name: 'Receipt', status: 0, isDefault: true }]), [
  { name: 'Receipt', displayName: 'Receipt', isDefault: true, status: 0 }
]);
assert.match(checkPrinter([], 'Receipt').error, /not installed/);
assert.match(checkPrinter([{ name: 'Receipt', status: 0x80 }], 'Receipt').error, /offline/);
assert.match(checkPrinter([{ name: 'Receipt', status: 0x10 }], 'Receipt').error, /out of paper/);
assert.strictEqual(checkPrinter([{ name: 'Receipt', status: 0 }], 'Receipt').ok, true);
assert.deepStrictEqual(availablePrinters([{ name: 'Microsoft Print to PDF' }, { name: 'Receipt', status: 0 }]).map(p => p.name), ['Receipt']);
assert.deepStrictEqual(receiptPageSize(58, 300), { width: 58000, height: 90000 });
assert.deepStrictEqual(receiptPageSize(80, 0), { width: 80000, height: 80000 });
assert.deepStrictEqual(receiptPageSize(72,300),{width:72000,height:90000});
assert.throws(() => receiptPageSize(113, 300), /Unsupported/);
const { printJobOptions, peripheralCommands }=require('./printer');
assert.throws(()=>printJobOptions({copies:0}),/Copies/);
assert.throws(()=>printJobOptions({copies:1.5}),/Copies/);
assert.throws(()=>printJobOptions({printingType:'raw-script'}),/Unsupported/);
assert.deepStrictEqual(printJobOptions({copies:3,printingType:'image',autoCut:true}),{copies:3,printingType:'image',autoCut:true,openDrawer:false});
assert.deepStrictEqual([...peripheralCommands({autoCut:true,openDrawer:true})],[27,100,3,29,86,0,27,112,0,25,250]);
assert.strictEqual(peripheralCommands({}).length,0);
