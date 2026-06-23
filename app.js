/* ============ STORAGE ============ */
const KEY='mybiz_v2';
let store = load() || seed();
function load(){ try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null} }
function persist(){ localStorage.setItem(KEY, JSON.stringify(store)) }
function seed(){ const d={business:{name:''},parties:[],items:[],sales:[],purchases:[],counters:{sale:1}}; localStorage.setItem(KEY,JSON.stringify(d)); return d; }
function id(){ return Math.random().toString(36).slice(2,9) }
const rs = n => 'Rs '+Number(n||0).toLocaleString('en-IN');

/* ============ MENU CONFIG ============ */
const MENU=[
  {k:'home', t:'Home', ic:'🏠'},
  {k:'parties', t:'Parties', ic:'👥', plus:true},
  {k:'items', t:'Items', ic:'🛍️', plus:true},
  {t:'Sale', ic:'🧾', sub:[
    {k:'sale', t:'Sale Invoices', plus:true},{k:'estimate', t:'Estimate/ Quotation', plus:true},
    {k:'paymentin', t:'Payment-In', plus:true},{k:'saleorder', t:'Sale Order', plus:true},
    {k:'challan', t:'Delivery Challan', plus:true},{k:'salereturn', t:'Sale Return/ Cr. Note', plus:true}]},
  {t:'Purchase & Expense', ic:'🛒', sub:[
    {k:'purchase', t:'Purchase Bills', plus:true},{k:'paymentout', t:'Payment-Out', plus:true},
    {k:'expenses', t:'Expenses', plus:true},{k:'purchaseorder', t:'Purchase Order', plus:true},
    {k:'purchasereturn', t:'Purchase Return/ Dr. Note', plus:true}]},
  {t:'Grow Your Business', ic:'📈', sub:[{k:'grow', t:'Marketing Tools'}]},
  {t:'Cash & Bank', ic:'🏦', sub:[
    {k:'bank', t:'Bank Accounts'},{k:'cash', t:'Cash In Hand'},{k:'cheques', t:'Cheques'}]},
  {k:'reports', t:'Reports', ic:'📊'},
  {t:'Sync, Share & Backup', ic:'🔄', sub:[{k:'backup', t:'Backup to Computer'}]},
  {t:'Utilities', ic:'🛠️', sub:[{k:'utilities', t:'Import Items'}]}
];

const menuEl=document.getElementById('menu');
function buildMenu(){
  menuEl.innerHTML = MENU.map((m,i)=>{
    if(m.sub){
      return `<div class="mi" data-grp="${i}"><span class="ic">${m.ic}</span>${m.t}<span class="chev">▼</span></div>
        <div class="submenu" id="grp${i}">${m.sub.map(s=>`<div class="smi" data-view="${s.k}">${s.t}${s.plus?'<span class="plus">+</span>':''}</div>`).join('')}</div>`;
    }
    return `<div class="mi" data-view="${m.k}"><span class="ic">${m.ic}</span>${m.t}${m.plus?'<span class="plus">+</span>':''}</div>`;
  }).join('');
  menuEl.querySelectorAll('.mi[data-grp]').forEach(el=>el.onclick=()=>{
    el.classList.toggle('open'); document.getElementById('grp'+el.dataset.grp).classList.toggle('show');
  });
  menuEl.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>nav(el.dataset.view,el));
}
function nav(view,el){
  menuEl.querySelectorAll('.mi,.smi').forEach(x=>x.classList.remove('active'));
  if(el) el.classList.add('active'); else menuEl.querySelector(`[data-view="${view}"]`)?.classList.add('active');
  render(view);
}
function render(view){
  const map={home:vWelcome,parties:vParties,items:vItems,sale:vHome,purchase:vPurchase,reports:vReports};
  (map[view]||vGeneric(view))();
}

/* ============ WELCOME ============ */
function vWelcome(){
  content.innerHTML=`<div class="welcome-screen">
    <div class="wel-logo">🫐</div>
    <h1>Welcome to <span class="bb">Blue Berry studios</span></h1>
    <div class="wel-by"><span class="d">design by</span> <span class="n">HAMMAD ANSAR</span></div>
  </div>`;
}

/* ============ HOME (FIRST SALE) ============ */
function vHome(){
  content.innerHTML=`
  <div class="home-wrap">
    <div class="home-left">
      <h1>Enter details to make your first Sale 🚀</h1>
      <div class="lead">First sale is made in less than a minute</div>
      <div class="hl-divider"></div>
      <div class="sec-row">
        <div style="flex:1">
          <div class="sec-h"><span class="cir">📄</span> Invoice Details :</div>
          <div class="kv"><div class="k">Invoice Number : 01</div></div>
          <div class="kv"><div class="k">Invoice Date : ${dispDate()}</div></div>
        </div>
        <div style="flex:1">
          <div class="sec-h"><span class="cir">👤</span> Bill To :</div>
          <div class="cust-field"><label>Customer Name<b>*</b></label><input id="h_cust"></div>
        </div>
      </div>
      <div class="add-sample" onclick="nav('items')">📦 Add Sample Item</div>
      <div class="sec-h"><span class="cir">🛡️</span> Invoice Calculation :</div>
      <div class="calc-row"><div class="lab">Invoice Amount<b>*</b></div>
        <div class="rs-input"><span class="rs">Rs</span><input id="h_amt" value="0.00" oninput="hCalc()"></div></div>
      <div class="calc-row"><div class="lab">Received</div>
        <div class="rs-input"><span class="rs">Rs</span><input id="h_recv" value="0.00" oninput="hCalc()"></div></div>
      <div class="balance-bar"><span>Balance</span><span class="amt" id="h_bal">Rs 0.00</span></div>
      <button class="create-btn" onclick="openSale()">🧾 Create Your First Invoice</button>
    </div>
    <div class="home-right">
      <h2>1Cr Vyaparis have created invoices ⚡</h2>
      <div class="invoice-paper">
        <div class="inv-tag">Sample Invoice</div>
        <div class="inv-head"><div class="ti">Invoice</div></div>
        <div class="inv-tax">TAX INVOICE</div>
        <div class="inv-meta"><div><b>Bill To</b><br><span class="muted">Enter Customer Name</span></div>
          <div class="r"><b style="color:#333">Invoice Details</b><br>Invoice No. #1<br>Date : ${dispDate()}</div></div>
        <table class="pinv"><thead><tr><th>#</th><th>Item name</th><th>Qty</th><th>Price/ Unit</th><th>Amt</th></tr></thead>
          <tbody><tr><td>1</td><td>Item 1</td><td>2</td><td>Rs 500</td><td>Rs 1000</td></tr>
          <tr><td>2</td><td>Item 2</td><td>1</td><td>Rs 500</td><td>Rs 500</td></tr>
          <tr><td></td><td><b>Total</b></td><td>3</td><td></td><td><b>Rs 1500</b></td></tr></tbody></table>
        <div class="inv-bottom"><div class="inv-words"><b>Amount In Words -</b><br><span class="muted">One Thousand Five Hundred Rupees only</span></div>
          <div class="inv-tot"><div class="tr"><span>Sub Total</span><span>Rs 1500</span></div>
            <div class="tr hl"><span>Total</span><span>Rs 1500</span></div>
            <div class="tr"><span><b>Balance Due</b></span><span>Rs 1500</span></div></div></div>
      </div>
    </div>
  </div>`;
}
function hCalc(){ const a=pf('h_amt'),r=pf('h_recv'); document.getElementById('h_bal').textContent='Rs '+(a-r).toFixed(2); }
function firstInvoice(){
  const cust=document.getElementById('h_cust').value.trim(), amt=pf('h_amt'), recv=pf('h_recv');
  if(!cust) return toast('Enter Customer Name');
  if(amt<=0) return toast('Enter Invoice Amount');
  store.sales.push({id:id(),no:'01',party:cust,date:dispDate(),total:amt,received:recv});
  if(!store.parties.find(p=>p.name===cust)) store.parties.push({id:id(),name:cust,type:'customer',balance:amt-recv});
  persist(); toast('Invoice created!'); nav('sale');
}

/* ============ CREATE INVOICE MODAL ============ */
let saleRows=[];
function openSale(){
  saleRows=[];
  document.getElementById('s_cust').value='';
  document.getElementById('s_phone').value='';
  document.getElementById('s_discp').value=''; document.getElementById('s_disc').value='0';
  document.getElementById('s_taxsel').value='0'; document.getElementById('s_tax').value='0';
  document.getElementById('s_recv').value='0'; document.getElementById('s_full').checked=false;
  document.getElementById('s_rows').innerHTML='';
  document.getElementById('p_date').textContent=dispDate();
  document.getElementById('p_cophone').textContent = store.business.phone||'3341100761';
  addSaleRow(); addSaleRow();
  showModal('saleModal');
}
function addSaleRow(){
  const i=saleRows.length; saleRows.push({item:'',qty:0,price:0});
  const tr=document.createElement('tr');
  tr.innerHTML=`<td>${i+1}</td>
    <td><input placeholder="Item name" oninput="setSale(${i},'item',this.value)"></td>
    <td><input type="number" placeholder="0" style="width:90px" oninput="setSale(${i},'qty',this.value)"></td>
    <td><input type="number" placeholder="0" style="width:110px" oninput="setSale(${i},'price',this.value)"></td>
    <td class="tot-cell"><span class="rt">0</span> <span class="delx" onclick="delSale(${i},this)">✕</span></td>`;
  document.getElementById('s_rows').appendChild(tr);
}
function delSale(i,el){ saleRows[i]=null; el.closest('tr').remove(); recalcSale(); }
function setSale(i,f,v){ if(!saleRows[i])return; saleRows[i][f]=f==='item'?v:(+v||0); recalcSale(); }
function fullRecv(){ if(document.getElementById('s_full').checked){ document.getElementById('s_recv').value=saleTotals().total; } recalcSale(); }
function saleTotals(){
  let sub=0; saleRows.forEach(r=>{ if(r) sub+=r.qty*r.price; });
  const discp=pf('s_discp'); let disc=discp>0?sub*discp/100:pf('s_disc');
  const taxp=+document.getElementById('s_taxsel').value||0; const tax=(sub-disc)*taxp/100;
  const total=sub-disc+tax; const recv=pf('s_recv');
  return {sub,disc,tax,total,recv,balance:total-recv};
}
function recalcSale(){
  document.querySelectorAll('#s_rows tr').forEach((tr,idx)=>{ const r=saleRows[idx]; if(!r)return;
    const c=tr.querySelector('.rt'); if(c)c.textContent=(r.qty*r.price)||0; });
  const t=saleTotals();
  if(pf('s_discp')>0) document.getElementById('s_disc').value=t.disc.toFixed(0);
  document.getElementById('s_tax').value=t.tax.toFixed(0);
  document.getElementById('s_sub').textContent=t.sub;
  const balEl=document.getElementById('s_bal');
  if(t.balance<0){ balEl.innerHTML='<span style="color:#1aa260">Return to Customer: '+Math.abs(t.balance)+'</span>'; }
  else balEl.textContent=t.balance;
  document.getElementById('s_total').textContent=t.total;
  drawInv();
}
function drawInv(){
  const t=saleTotals();
  document.getElementById('p_co').textContent=store.business.name||'My Company';
  document.getElementById('p_co2').textContent=store.business.name||'My Company';
  const rows=saleRows.filter(Boolean).filter(r=>r.item||r.qty||r.price);
  document.getElementById('p_rows').innerHTML = rows.length? rows.map((r,i)=>
    `<tr><td>${i+1}</td><td><b>${r.item||'Item'}</b></td><td class="right">${r.qty}</td><td class="right">Rs ${r.price}</td><td class="right">Rs ${(r.qty*r.price).toLocaleString('en-IN')}.00</td></tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;color:#bbb">No items</td></tr>`;
  const f=n=>'Rs '+Number(n).toLocaleString('en-IN')+'.00';
  document.getElementById('p_ttl').textContent=f(t.total);
  document.getElementById('p_sub').textContent=f(t.sub);
  document.getElementById('p_total').textContent=f(t.total);
  document.getElementById('p_recv').textContent=f(t.recv);
  document.getElementById('p_balance').textContent = t.balance<0 ? 'Return '+f(Math.abs(t.balance)) : f(t.balance);
  document.getElementById('p_words').textContent=words(t.total)+' Rupees only';
  const co=store.business.name||'My Company', ph=store.business.phone||'3341100761';
  const data=encodeURIComponent(`Invoice from ${co} | Total Rs ${t.total} | Contact ${ph}`);
  document.getElementById('p_qr').src=`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${data}`;
}
function words(n){ n=Math.round(n); if(n===0)return 'Zero';
  const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function two(x){ return x<20?a[x]:b[Math.floor(x/10)]+(x%10?' '+a[x%10]:''); }
  function three(x){ return (x>=100?a[Math.floor(x/100)]+' Hundred'+(x%100?' ':''):'')+(x%100?two(x%100):''); }
  let s='';const cr=Math.floor(n/10000000);n%=10000000;const lk=Math.floor(n/100000);n%=100000;const th=Math.floor(n/1000);n%=1000;
  if(cr)s+=three(cr)+' Crore ';if(lk)s+=three(lk)+' Lakh ';if(th)s+=three(th)+' Thousand ';if(n)s+=three(n);
  return s.trim();
}
function saveSale(){
  const cust=document.getElementById('s_cust').value.trim(); if(!cust)return toast('Enter Customer Name');
  const rows=saleRows.filter(Boolean).filter(r=>r.item&&r.qty); if(!rows.length)return toast('Add at least one item');
  const t=saleTotals();
  store.sales.push({id:id(),no:String(store.counters.sale).padStart(2,'0'),party:cust,phone:document.getElementById('s_phone').value,date:dispDate(),rows,total:t.total,received:t.recv});
  store.counters.sale++;
  let p=store.parties.find(x=>x.name===cust);
  if(!p){ p={id:id(),name:cust,phone:document.getElementById('s_phone').value,type:'customer',balance:0}; store.parties.push(p); }
  p.balance+=t.balance;
  persist(); closeModal('saleModal'); toast('Invoice saved!'); nav('sale');
}

/* ============ PARTIES ============ */
function vParties(){
  if(!store.parties.length){
    content.innerHTML=`<div class="empty-page">
      <h2>Party Details</h2>
      <p>Add your customers and suppliers to manage your business easily. Track payments and grow your business without any hassle!</p>
      <div class="empty-ill">👥🪪</div>
      <button class="btn-big red" onclick="addParty()">＋ Add Your First Party</button></div>`;
    return;
  }
  content.innerHTML=`<div class="page-head"><h2>Parties</h2><button class="btn btn-red" onclick="addParty()">+ Add Party</button></div>
    <div class="panel"><table class="data"><thead><tr><th>Name</th><th>Phone</th><th>Type</th><th class="right">Balance</th></tr></thead><tbody>
    ${store.parties.map(p=>`<tr><td class="bold">${p.name}</td><td class="muted">${p.phone||'-'}</td><td>${p.type}</td>
      <td class="right"><span class="pill ${p.balance>0?'due':'paid'}">${rs(Math.abs(p.balance))}</span></td></tr>`).join('')}
    </tbody></table></div>`;
}
function addParty(){
  formModal('Add Party',`<div class="field"><label>Party Name *</label><input id="f_name"></div>
    <div class="field"><label>Phone</label><input id="f_phone"></div>
    <div class="field"><label>Type</label><select id="f_type"><option value="customer">Customer</option><option value="supplier">Supplier</option></select></div>
    <div class="field"><label>Opening Balance</label><input id="f_bal" type="number" value="0"></div>`,
  ()=>{ const n=document.getElementById('f_name').value.trim(); if(!n)return toast('Enter name');
    store.parties.push({id:id(),name:n,phone:document.getElementById('f_phone').value,type:document.getElementById('f_type').value,balance:+document.getElementById('f_bal').value||0});
    persist(); closeModal('formModal'); toast('Party added'); vParties(); });
}

/* ============ ITEMS ============ */
function vItems(){
  if(!store.items.length){
    content.innerHTML=`<div class="empty-page">
      <h2>Item / Service Details</h2>
      <p>Add products and services you sell. Track stock, set prices and create invoices in seconds.</p>
      <div class="empty-ill">🛍️📦</div>
      <button class="btn-big red" onclick="openItem()">＋ Add Your First Item</button></div>`;
    return;
  }
  content.innerHTML=`<div class="page-head"><h2>Items</h2><button class="btn btn-red" onclick="openItem()">+ Add Item</button></div>
    <div class="panel"><table class="data"><thead><tr><th>Item</th><th class="right">Sale Price</th><th class="right">Purchase Price</th><th class="right">Stock</th></tr></thead><tbody>
    ${store.items.map(i=>`<tr><td class="bold">${i.name}</td><td class="right">${rs(i.price)}</td><td class="right muted">${rs(i.pprice)}</td><td class="right">${i.stock||0}</td></tr>`).join('')}
    </tbody></table></div>`;
}
function openItem(){ document.getElementById('i_name').value=''; document.getElementById('i_price').value=''; document.getElementById('i_pprice').value=''; showModal('itemModal'); }
function saveItem(again){
  const n=document.getElementById('i_name').value.trim(); if(!n)return toast('Enter Item Name');
  store.items.push({id:id(),name:n,price:+document.getElementById('i_price').value||0,pprice:+document.getElementById('i_pprice').value||0,stock:0});
  persist(); toast('Item saved');
  if(again){ document.getElementById('i_name').value=''; document.getElementById('i_price').value=''; document.getElementById('i_pprice').value=''; }
  else { closeModal('itemModal'); vItems(); nav('items'); }
}

/* ============ SALE / PURCHASE LISTS ============ */
function vSale(){
  if(!store.sales.length){
    content.innerHTML=`<div class="empty-page"><div class="empty-ill">🧾</div>
      <p>Make Sale invoices & Print or share with your customers directly via WhatsApp or Email.</p>
      <button class="btn-big red" onclick="openSale()">＋ Add Your First Sale Invoice</button></div>`;
    return;
  }
  content.innerHTML=`<div class="page-head"><h2>Sale Invoices</h2><button class="btn btn-red" onclick="openSale()">+ Add Sale</button></div>`;
  txnAppend('sales','Sale Invoices');
}
function txnAppend(key){ const d=document.createElement('div'); content.appendChild(d);
  const rows=[...store[key]].reverse();
  d.innerHTML=`<div class="panel"><table class="data"><thead><tr><th>No.</th><th>Party</th><th>Date</th><th class="right">Amount</th><th class="right">Balance</th><th>Status</th></tr></thead><tbody>
    ${rows.map(s=>`<tr><td class="bold">${s.no}</td><td>${s.party}</td><td>${s.date}</td><td class="right">${rs(s.total)}</td>
      <td class="right bold">${rs(s.total-s.received)}</td><td>${s.total-s.received<=0?'<span class="pill paid">Paid</span>':'<span class="pill due">Unpaid</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
}
function vPurchase(){
  if(!store.purchases.length){
    content.innerHTML=`<div class="empty-page">
      <div class="empty-ill">🛒🧾</div>
      <p>Make Purchase invoices & Print or share with your customers directly via WhatsApp or Email.</p>
      <button class="btn-big orange" onclick="toast('Purchase form coming up')">＋ Add Your First Purchase Invoice</button></div>`;
    return;
  }
  txn('purchases','Purchase Bills');
}
function txn(key,title){
  const rows=[...store[key]].reverse();
  content.innerHTML=`<div class="page-head"><h2>${title}</h2></div>
    <div class="panel"><table class="data"><thead><tr><th>No.</th><th>Party</th><th>Date</th><th class="right">Amount</th><th class="right">Balance</th><th>Status</th></tr></thead><tbody>
    ${rows.map(s=>`<tr><td class="bold">${s.no}</td><td>${s.party}</td><td>${s.date}</td><td class="right">${rs(s.total)}</td>
      <td class="right bold">${rs(s.total-s.received)}</td><td>${s.total-s.received<=0?'<span class="pill paid">Paid</span>':'<span class="pill due">Unpaid</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

/* ============ REPORTS ============ */
function vReports(){
  const ts=store.sales.reduce((a,b)=>a+b.total,0), tp=store.purchases.reduce((a,b)=>a+b.total,0);
  content.innerHTML=`<div class="page-head"><h2>Reports</h2></div>
    <div class="panel"><table class="data"><tbody>
    <tr><td class="bold">Total Sale</td><td class="right">${rs(ts)}</td></tr>
    <tr><td class="bold">Total Purchase</td><td class="right">${rs(tp)}</td></tr>
    <tr><td class="bold">Net Profit</td><td class="right">${rs(ts-tp)}</td></tr></tbody></table></div>`;
}

/* ============ GENERIC EMPTY ============ */
function vGeneric(view){ return ()=>{ content.innerHTML=`<div class="empty-page"><div class="empty-ill">📋</div>
  <h2>${view.charAt(0).toUpperCase()+view.slice(1)}</h2><p>This section works just like Vyapar. Add your first record to get started.</p></div>`; }; }

/* ============ HELPERS ============ */
const content=document.getElementById('content');
function pf(id){ return parseFloat(document.getElementById(id).value)||0 }
function dispDate(){ const d=new Date(); return String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear(); }
function showModal(id){ document.getElementById(id).classList.add('show') }
function closeModal(id){ document.getElementById(id).classList.remove('show') }
function formModal(t,html,onSave){ document.getElementById('formTitle').textContent=t; document.getElementById('formBody').innerHTML=html; document.getElementById('formSave').onclick=onSave; showModal('formModal'); }
let tT; function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.add('show'); clearTimeout(tT); tT=setTimeout(()=>t.classList.remove('show'),2000); }

/* item modal Product/Service toggle + tabs */
document.querySelector('#itemModal .switch')?.addEventListener('click',function(){
  this.querySelector('i').style.left=this.querySelector('i').style.left==='22px'?'2px':'22px';
});
document.querySelectorAll('#itemModal .im-tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('#itemModal .im-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active');
});

/* ============ INIT ============ */
buildMenu();
if(store.business.name) document.getElementById('bizName').textContent=store.business.name;
nav('home');
