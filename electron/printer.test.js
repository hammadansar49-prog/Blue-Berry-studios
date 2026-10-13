const assert = require('assert');
const { availablePrinters, checkPrinter } = require('./printer');

assert.deepStrictEqual(availablePrinters([{ name: 'Receipt', status: 0, isDefault: true }]), [
  { name: 'Receipt', displayName: 'Receipt', isDefault: true, status: 0 }
]);
assert.match(checkPrinter([], 'Receipt').error, /not installed/);
assert.match(checkPrinter([{ name: 'Receipt', status: 0x80 }], 'Receipt').error, /offline/);
assert.match(checkPrinter([{ name: 'Receipt', status: 0x10 }], 'Receipt').error, /out of paper/);
assert.strictEqual(checkPrinter([{ name: 'Receipt', status: 0 }], 'Receipt').ok, true);
assert.deepStrictEqual(availablePrinters([{ name: 'Microsoft Print to PDF' }, { name: 'Receipt', status: 0 }]).map(p => p.name), ['Receipt']);
