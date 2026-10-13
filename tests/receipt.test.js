const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'printing.js'), 'utf8');
const context = vm.createContext({window:{}});
vm.runInContext(source.slice(0, source.indexOf('function preparePrintHTML(')), context);
const invoice = { no: 'INV-10', date: '13/10/2026', party: 'Customer',
  rows: [{ item: 'Product', qty: 1, price: 100 }], total: 100, received: 100 };
const business = { name: 'Company', phone: '03001234567', email: 'test@example.com', address: 'Street 1' };
test('discount receipt explicitly reconciles subtotal, discount and net total',()=>{
 const r=context.thermalReceipt({...invoice,rows:[{item:'Fabric',qty:100,price:125,disc:10}],total:11250,received:12000},{},business,[],[]);
 assert.match(r.text,/Subtotal: 12,500.00/);assert.match(r.text,/Discount 10%: -1,250.00/);
 assert.match(r.text,/Item discount: -1,250.00/);assert.match(r.text,/11,250.00/);assert.match(r.text,/Change: 750.00/);
});
test('partially returned invoice prints remaining quantities',()=>{
 const r=context.thermalReceipt({...invoice,rows:[{item:'Product',qty:10,returned:3,price:100}],total:700},{},business,[],[]);
 assert.match(r.text,/7 x/);assert.match(r.text,/Total quantity: 7/);
});
function receipt(settings = {}, inv = invoice) {
  return context.thermalReceipt(inv, settings, business, [], []);
}

test('thermal paper profiles and custom width bounds are respected', () => {
  for (const [pageSize, width] of [['2inch', 58], ['3inch', 80], ['4inch', 112]]) {
    const result = receipt({ pageSize });
    assert.equal(result.widthMm, width);
    assert.ok(result.css.includes('width:' + width + 'mm'));
  }
  assert.equal(receipt({pageSize:'custom', customWidth:1}).widthMm, 48);
  assert.equal(receipt({pageSize:'custom', customWidth:1000}).widthMm, 112);
  assert.equal(receipt({pageSize:'custom', customWidth:72}).widthMm, 72);
});

for (const quantity of [10, 100]) {
  test('integer quantity ' + quantity + ' retains its trailing zeros', () => {
    const result = receipt({itemQtyDec:0}, {...invoice,
      rows:[{item:'Product',qty:quantity,price:100}],total:quantity*100});
    assert.ok(result.html.includes('>' + quantity + ' x 100.00<'));
    assert.ok(result.text.includes('Total quantity: ' + quantity));
  });
}

test('fractional quantities trim only insignificant decimal zeros', () => {
  const result = receipt({itemQtyDec:3}, {...invoice,
    rows:[{item:'Product',qty:10.25,price:100}],total:1025});
  assert.ok(result.html.includes('>10.25 x 100.00<'));
});

test('disabled company and summary fields are excluded from printed content', () => {
  const result = receipt({showCoName:false,showAddress:false,showCoPhone:false,
    showEmail:false,tReceived:false,tBalance:false,tTotalQty:false,showTerms:false,
    terms:'PRIVATE TERMS',textBold:false});
  for (const hidden of ['Company','Street 1','03001234567','test@example.com',
    'Received','Balance due','Total quantity','PRIVATE TERMS']) {
    assert.ok(!result.html.includes(hidden), hidden);
    assert.ok(!result.text.includes(hidden), hidden);
  }
  assert.ok(result.css.includes('font-weight:400'));
});

test('graphical receipts preserve Urdu and escape untrusted product/customer HTML', () => {
  const result = receipt({}, {...invoice, party:'احمد <script>alert(1)</script>',
    rows:[{item:'چائے <img src=x onerror="alert(1)"> & coffee',qty:1,price:100}]});
  assert.ok(result.html.includes('احمد'));
  assert.ok(result.html.includes('چائے'));
  assert.ok(result.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(result.html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; coffee'));
  assert.ok(!result.html.includes('<script>'));
  assert.ok(!result.html.includes('<img src=x'));
});

test('overpayment prints change while preserving invoice total', () => {
  const result = receipt({}, {...invoice,received:150});
  assert.ok(result.text.includes('TOTAL Rs: 100.00'));
  assert.ok(result.text.includes('Change: 50.00'));
  assert.ok(!result.text.includes('Balance due'));
});
