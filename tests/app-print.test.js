const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
// Evaluate the actual top-level function, without booting the app or Firebase.
function load(name, context) {
  const start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name + ' exists');
  const rest = source.slice(start);
  const next = rest.slice(1).search(/\n(?:async )?function /);
  vm.runInContext(next < 0 ? rest : rest.slice(0, next + 1), context);
}

test('saving another settings tab preserves printer visibility preferences', () => {
  const settings = { showLogo: true, showCoName: true, showAddress: true,
    showEmail: true, showCoPhone: true, showQR: true, showSign: true, showTerms: true };
  const context = vm.createContext({ store: { settings }, persist() {},
    document: { getElementById: () => null, querySelector: () => null } });
  load('applyLiveSettings', context);
  context.applyLiveSettings();
  for (const [name, value] of Object.entries(settings)) assert.equal(value, true, name);
});

test('an unchecked printer option still saves when its control is present', () => {
  const settings = { showLogo: true, showCoName: true };
  const context = vm.createContext({ store: { settings }, persist() {},
    document: { getElementById: id => id === 'set_coLogo' ? { checked: false } : null,
      querySelector: () => null } });
  load('applyLiveSettings', context);
  context.applyLiveSettings();
  assert.equal(settings.showLogo, false);
  assert.equal(settings.showCoName, true);
});

function printContext(editing) {
  const jobs = [];
  const popups = [];
  const values = { pos_cust: 'Current customer', pos_phone: '03001234567',
    pos_recv: '100', pos_paymode: 'Cash', pos_disc: '0' };
  const previous = { id: 'existing', no: 'INV-09', party: 'Previous customer',
    total: 50, received: 50, rows: [] };
  const context = vm.createContext({
    store: { settings: { stockMaintain: false, negativeStock: false },
      counters: { sale: 10 }, sales: editing ? [previous] : [], parties: [], payments: [], items: [] },
    posRows: [{ item: 'Current product', qty: 1, price: 100, disc: 0 }],
    posAdditional: 0, posBillDisc: 0, posLoyalty: 0,
    posEditingId: editing ? 'existing' : null, posActiveTab: 'tab',
    viewInv: { no: 'STALE', party: 'Stale preview customer' },
    document: { getElementById: id => id === 'iv_body'
      ? { innerHTML: 'STALE PREVIEW WITH PRINT BUTTONS' } : { value: values[id] } },
    window: { open() { return { document: { write: html => popups.push(html), close() {},
      querySelectorAll: () => [] }, focus() {}, print() {}, close() {} }; } },
    karobarPrintInvoice(invoice, pdf = false) { jobs.push({ invoice, pdf }); },
    printCSS: () => '', buildInvoiceHTML: inv => inv.party,
    id: (() => { let n = 0; return () => 'id-' + ++n; })(),
    dispDate: () => '13/10/2026', rs: String, persist() {}, refreshView() {},
    closeModal() {}, posCloseTab() {}, toast() {}, logActivity() {}, setTimeout: fn => fn()
  });
  return { context, jobs, popups };
}

for (const editing of [false, true]) {
  test((editing ? 'edited' : 'new') + ' POS sale prints saved data, not stale preview markup', () => {
    const { context, jobs, popups } = printContext(editing);
    for(const helper of ['validateSaleRows','syncSalePayment','snapshotSaleRows','saleTaxSettings'])load(helper,context);
    load('confirmSaveAndPrint', context);
    context.confirmSaveAndPrint();
    assert.equal(jobs.length, 1, 'one invoice reaches the shared print pipeline');
    assert.equal(jobs[0].invoice, context.store.sales[0]);
    assert.equal(jobs[0].invoice.party, 'Current customer');
    assert.equal(jobs[0].invoice.total, 100);
    assert.equal(jobs[0].invoice.rows[0].item, 'Current product');
    assert.equal(popups.length, 0, 'POS must not bypass the shared pipeline');
  });
}

for (const [name, pdf] of [['printInvoice', false], ['downloadInvoice', true]]) {
  test(name + ' sends the viewed invoice to the shared pipeline', () => {
    const { context, jobs, popups } = printContext(false);
    load(name, context);
    context[name]();
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].invoice, context.viewInv);
    assert.equal(jobs[0].pdf, pdf);
    assert.equal(popups.length, 0);
  });
}
