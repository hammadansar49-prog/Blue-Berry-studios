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
assert.throws(() => receiptPageSize(72, 300), /Unsupported/);
