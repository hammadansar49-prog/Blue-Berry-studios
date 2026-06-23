/* ============ STORAGE ============ */
const KEY='mybiz_v2';
let store = load() || seed();
function load(){ try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null} }
function persist(){ localStorage.setItem(KEY, JSON.stringify(store)) }
function seed(){ const d=defaults(); localStorage.setItem(KEY,JSON.stringify(d)); return d; }
function defaults(){ return {business:{name:'',phone:'',logo:'',email:'',btype:'',category:'',address:'',pincode:'',signature:''},parties:[],items:[],sales:[],purchases:[],
  expenses:[],payments:[],banks:[],categories:['General'],counters:{sale:1}}; }
function ensure(){ const d=defaults(); for(const k in d){ if(store[k]===undefined) store[k]=d[k]; } if(!store.business) store.business=d.business; }
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
  {t:'Grow Your Business', ic:'📈', sub:[{k:'grow', t:'Marketing Tools'},{k:'loyalty', t:'Loyalty Points'}]},
  {t:'Cash & Bank', ic:'🏦', sub:[
    {k:'bank', t:'Bank Accounts'},{k:'cash', t:'Cash In Hand'},{k:'cheques', t:'Cheques'},{k:'loan', t:'Loan Accounts'}]},
  {k:'reports', t:'Reports', ic:'📊'},
  {t:'Sync, Share & Backup', ic:'🔄', sub:[{k:'backup', t:'Backup to Computer'},{k:'autobackup', t:'Auto Backup'},{k:'share', t:'Share Data'}]},
  {t:'Utilities', ic:'🛠️', sub:[
    {k:'importitems', t:'Import Items'},{k:'importparties', t:'Import Parties'},{k:'bulkupdate', t:'Bulk Update Items'},
    {k:'barcode', t:'Barcode Generator'},{k:'exporttally', t:'Export to Tally'},{k:'exportitems', t:'Export Items'},
    {k:'verifydata', t:'Verify My Data'},{k:'recyclebin', t:'Recycle Bin'}]},
  {k:'settings', t:'Settings', ic:'⚙️'}
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
    menuEl.querySelectorAll('.mi,.smi').forEach(x=>x.classList.remove('active')); el.classList.add('active');
    renderHub(+el.dataset.grp);
  });
  menuEl.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>nav(el.dataset.view,el));
}
function nav(view,el){
  menuEl.querySelectorAll('.mi,.smi').forEach(x=>x.classList.remove('active'));
  if(el) el.classList.add('active'); else menuEl.querySelector(`[data-view="${view}"]`)?.classList.add('active');
  render(view);
}
function render(view){
  const map={home:vWelcome,parties:vParties,items:vItems,sale:vHome,purchase:vPurchase,reports:vReports,
    settings:vSettings,paymentin:vPaymentIn,paymentout:vPaymentOut,expenses:vExpenses,
    bank:vBank,cash:vCash,cheques:vCheques,loan:vLoan,
    barcode:vBarcode,recyclebin:vRecycle,importitems:vImport,estimate:vEstimate,profile:vProfile};
  (map[view]||vGeneric(view))();
}

/* ============ HUB PAGE (group cards) ============ */
function renderHub(gi){
  const g=MENU[gi]; if(!g||!g.sub)return;
  content.innerHTML=`<div class="page-head"><h2>${g.t}</h2></div>
    <div class="hub-grid">${g.sub.map(s=>`<div class="hub-card" data-go="${s.k}">
      <div class="hub-ic">${g.ic}</div><div class="hub-t">${s.t}</div>
      <div class="hub-go">Open →</div></div>`).join('')}</div>`;
  content.querySelectorAll('.hub-card').forEach(c=>c.onclick=()=>nav(c.dataset.go));
}

/* ============ WELCOME ============ */
function vWelcome(){
  content.innerHTML=`<div class="welcome-screen">
    <div class="wel-logo">BB</div>
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
          <div class="cust-field"><label>Customer Name<b>*</b></label><input id="h_cust" oninput="hPreview()"></div>
        </div>
      </div>
      <div class="add-sample" onclick="nav('items')">📦 Add Sample Item</div>
      <div class="sec-h"><span class="cir">🛡️</span> Invoice Calculation :</div>
      <div class="calc-row"><div class="lab">Invoice Amount<b>*</b></div>
        <div class="rs-input"><span class="rs">Rs</span><input id="h_amt" value="0.00" oninput="hCalc()"></div></div>
      <div class="calc-row"><div class="lab">Received</div>
        <div class="rs-input"><span class="rs">Rs</span><input id="h_recv" value="0.00" oninput="hCalc()"></div></div>
      <div class="balance-bar"><span>Balance</span><span class="amt" id="h_bal">Rs 0.00</span></div>
      <button class="create-btn" onclick="quickSale()">🧾 Create Invoice &amp; Add Payment</button>
      <div style="text-align:center;margin-top:12px"><span class="link" style="color:var(--blue);cursor:pointer" onclick="openSale()">+ Add multiple items (full invoice)</span></div>
    </div>
    <div class="home-right">
      <h2>1Cr Vyaparis have created invoices ⚡</h2>
      <div class="invoice-paper">
        <div class="inv-tag">Live Preview</div>
        <div class="inv-top-row">
          <div class="hlogo-wrap">
            <div class="hlogo" id="h_logo" onclick="hLogoClick()">${store.business.logo?`<img src="${store.business.logo}">`:'＋<br>Add Logo'}</div>
            <input type="file" accept="image/*" id="h_logofile" onchange="hLogo(this)" hidden>
            <div class="logo-menu" id="h_logomenu">
              <div onclick="hChangeLogo()">🖼️ Change Logo</div>
              <div class="del" onclick="hDeleteLogo()">🗑️ Delete Logo</div>
            </div>
          </div>
          <div class="inv-head"><div class="ti">Invoice</div><div class="inv-tax">TAX INVOICE</div></div>
        </div>
        <div class="inv-meta"><div><b>Bill To</b><br><span class="muted" id="hp_cust">Enter Customer Name</span></div>
          <div class="r"><b style="color:#333">Invoice Details</b><br>Invoice No. #${String(store.counters.sale).padStart(2,'0')}<br>Date : ${dispDate()}</div></div>
        <table class="pinv"><thead><tr><th>#</th><th>Item name</th><th>Qty</th><th>Price/ Unit</th><th>Amt</th></tr></thead>
          <tbody id="hp_rows"></tbody></table>
        <div class="inv-bottom"><div class="inv-words"><b>Amount In Words -</b><br><span class="muted" id="hp_words">Zero Rupees only</span></div>
          <div class="inv-tot"><div class="tr"><span>Sub Total</span><span id="hp_sub">Rs 0</span></div>
            <div class="tr hl"><span>Total</span><span id="hp_total">Rs 0</span></div>
            <div class="tr"><span><b>Balance Due</b></span><span id="hp_bal">Rs 0</span></div></div></div>
      </div>
    </div>
  </div>`;
  hPreview();
}
function hCalc(){ const a=pf('h_amt'),r=pf('h_recv'); document.getElementById('h_bal').textContent='Rs '+(a-r).toFixed(2); hPreview(); }
function hLogoClick(){
  if(store.business.logo){ document.getElementById('h_logomenu').classList.toggle('show'); }
  else document.getElementById('h_logofile').click();
}
function hChangeLogo(){ document.getElementById('h_logomenu').classList.remove('show'); document.getElementById('h_logofile').value=''; document.getElementById('h_logofile').click(); }
function hDeleteLogo(){ store.business.logo=''; persist(); document.getElementById('h_logomenu').classList.remove('show');
  document.getElementById('h_logo').innerHTML='＋<br>Add Logo'; toast('Logo deleted'); }
function hLogo(inp){ const f=inp.files[0]; if(!f)return; const r=new FileReader();
  r.onload=e=>{ store.business.logo=e.target.result; persist(); document.getElementById('h_logo').innerHTML=`<img src="${e.target.result}">`; toast('Logo saved'); }; r.readAsDataURL(f); }
document.addEventListener('click',e=>{ const m=document.getElementById('h_logomenu'); if(m&&m.classList.contains('show')&&!e.target.closest('.hlogo-wrap')) m.classList.remove('show'); });
function hPreview(){
  const cust=document.getElementById('h_cust').value.trim(), amt=pf('h_amt'), recv=pf('h_recv');
  document.getElementById('hp_cust').textContent=cust||'Enter Customer Name';
  document.getElementById('hp_rows').innerHTML = amt>0
    ? `<tr><td>1</td><td>${cust||'Sale'} item</td><td>1</td><td>Rs ${amt}</td><td>Rs ${amt}</td></tr><tr><td></td><td><b>Total</b></td><td>1</td><td></td><td><b>Rs ${amt}</b></td></tr>`
    : `<tr><td colspan="5" style="text-align:center;color:#bbb">Enter invoice amount</td></tr>`;
  document.getElementById('hp_sub').textContent='Rs '+amt;
  document.getElementById('hp_total').textContent='Rs '+amt;
  document.getElementById('hp_bal').textContent='Rs '+(amt-recv);
  document.getElementById('hp_words').textContent=words(amt)+' Rupees only';
}
function quickSale(){
  const cust=document.getElementById('h_cust').value.trim(), amt=pf('h_amt'), recv=pf('h_recv');
  if(!cust) return toast('Enter Customer Name');
  if(amt<=0) return toast('Enter Invoice Amount');
  const no=String(store.counters.sale).padStart(2,'0');
  store.sales.push({id:id(),no,party:cust,phone:'',date:dispDate(),rows:[],total:amt,received:recv});
  store.counters.sale++;
  let p=store.parties.find(x=>x.name===cust);
  if(!p){ p={id:id(),name:cust,phone:'',type:'customer',balance:0}; store.parties.push(p); }
  p.balance += amt-recv;
  if(recv>0) store.payments.push({id:id(),dir:'in',party:cust,amount:recv,mode:'Cash',date:dispDate()});
  persist(); toast(recv>0?'Invoice + payment saved!':'Invoice created!'); nav('sale');
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
  const lg=document.getElementById('p_logo');
  lg.innerHTML = store.business.logo?`<img src="${store.business.logo}" style="width:100%;height:100%;object-fit:cover">`:'LOGO';
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
  ['pa_name','pa_phone','pa_email','pa_billing','pa_gst','pa_field1'].forEach(i=>{const e=document.getElementById(i);if(e)e.value='';});
  document.getElementById('pa_bal').value='0'; document.getElementById('pa_type').value='customer';
  document.getElementById('pa_date').value=new Date().toISOString().slice(0,10);
  partyTab('address');
  showModal('partyModal');
}
function partyTab(t){
  document.querySelectorAll('#partyModal .pm-tab').forEach(x=>x.classList.toggle('active',x.dataset.pt===t));
  ['address','credit','more'].forEach(k=>document.getElementById('pt_'+k).style.display=k===t?'block':'none');
}
function saveParty(again){
  const n=document.getElementById('pa_name').value.trim(); if(!n)return toast('Enter Party Name');
  store.parties.push({id:id(),name:n,phone:document.getElementById('pa_phone').value,email:document.getElementById('pa_email').value,
    billing:document.getElementById('pa_billing').value,gst:document.getElementById('pa_gst').value,
    type:document.getElementById('pa_type').value,balance:+document.getElementById('pa_bal').value||0});
  persist(); toast('Party saved');
  if(again){ ['pa_name','pa_phone','pa_email','pa_billing','pa_gst'].forEach(i=>document.getElementById(i).value=''); document.getElementById('pa_bal').value='0'; }
  else { closeModal('partyModal'); nav('parties'); }
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
   <div class="items-layout">
    <div class="cat-panel"><div class="cat-head">Categories <span class="addcat" onclick="addCategory()">+</span></div>
      ${store.categories.map((c,i)=>`<div class="cat-row"><span>${c}</span><span class="cat-ic">
        <i onclick="renameCategory(${i})">✏️</i>${c!=='General'?`<i onclick="delCategory(${i})">🗑️</i>`:''}</span></div>`).join('')}</div>
    <div class="panel" style="flex:1"><table class="data"><thead><tr><th>Item Code</th><th>Item</th><th>Category</th><th class="right">Sale Price</th><th class="right">Purchase</th><th class="right">Stock</th></tr></thead><tbody>
    ${store.items.map(i=>`<tr><td class="bold" style="color:var(--blue)">${i.code||'-'}</td><td class="bold">${i.name}</td><td class="muted">${i.cat||'General'}</td>
      <td class="right">${rs(i.price)}</td><td class="right muted">${rs(i.pprice)}</td><td class="right">${i.stock||0}</td></tr>`).join('')}
    </tbody></table></div>
   </div>`;
}
function openItem(){
  document.getElementById('i_name').value=''; document.getElementById('i_price').value='';
  document.getElementById('i_pprice').value=''; document.getElementById('i_code').value='';
  document.getElementById('i_cat').value=''; document.getElementById('i_catlabel').textContent='Category';
  document.getElementById('i_catlabel').classList.add('ph');
  document.getElementById('i_unit').value=''; document.getElementById('i_unitbtn').textContent='Select Unit';
  document.getElementById('i_catpanel').classList.remove('show');
  showModal('itemModal');
}
function toggleCatDD(){ const p=document.getElementById('i_catpanel'); p.classList.toggle('show'); if(p.classList.contains('show')){ document.getElementById('i_catsearch').value=''; renderCatDD(); } }
function renderCatDD(){
  const q=(document.getElementById('i_catsearch').value||'').toLowerCase();
  const list=store.categories.filter(c=>c.toLowerCase().includes(q));
  document.getElementById('i_catlist').innerHTML=list.length?list.map(c=>`<div class="cat-item" onclick="pickCat('${c.replace(/'/g,"\\'")}')">${c}</div>`).join(''):`<div class="cat-item muted">No match</div>`;
}
function pickCat(c){ document.getElementById('i_cat').value=c; const l=document.getElementById('i_catlabel'); l.textContent=c; l.classList.remove('ph'); document.getElementById('i_catpanel').classList.remove('show'); }
function addNewCatInline(){
  const q=document.getElementById('i_catsearch').value.trim();
  let c=q||prompt('New category name'); if(!c)return; c=c.charAt(0).toUpperCase()+c.slice(1);
  if(!store.categories.includes(c)) store.categories.push(c); persist(); pickCat(c); toast('Category added');
}
function assignCode(){ document.getElementById('i_code').value='ITM'+String(store.items.length+1).padStart(4,'0'); }
const UNITS=['None','BAGS (Bag)','BOTTLES (Btl)','BOX (Box)','BUNDLES (Bdl)','CANS (Can)','CARTONS (Ctn)','DOZENS (Dzn)','GRAMMES (Gm)','KILOGRAMS (Kg)','LITRE (Ltr)','METERS (Mtr)','MILLILITRE (Ml)','NUMBERS (Nos)','PACKS (Pac)','PAIRS (Prs)','PIECES (Pcs)','QUINTAL (Qtl)','ROLLS (Rol)','SQUARE FEET (Sqf)','SQUARE METERS (Sqm)'];
function openUnit(){
  const cur=document.getElementById('i_unit').value, base=cur.split('|')[0]||'None', sec=cur.split('|')[1]||'None';
  formModal('Select Unit',`<div style="display:flex;gap:20px">
    <div class="field" style="flex:1"><label style="color:var(--blue)">BASE UNIT</label>
      <select id="u_base">${UNITS.map(u=>`<option ${u===base?'selected':''}>${u}</option>`).join('')}</select></div>
    <div class="field" style="flex:1"><label style="color:var(--blue)">SECONDARY UNIT</label>
      <select id="u_sec">${UNITS.map(u=>`<option ${u===sec?'selected':''}>${u}</option>`).join('')}</select></div></div>`,
  ()=>{ const b=document.getElementById('u_base').value, s=document.getElementById('u_sec').value;
    document.getElementById('i_unit').value=b+'|'+s;
    document.getElementById('i_unitbtn').textContent = b==='None'?'Select Unit':b.replace(/ \(.*/,'');
    closeModal('formModal'); }, 'SAVE');
}
function saveItem(again){
  const n=document.getElementById('i_name').value.trim(); if(!n)return toast('Enter Item Name');
  let code=document.getElementById('i_code').value.trim()||('ITM'+String(store.items.length+1).padStart(4,'0'));
  store.items.push({id:id(),name:n,code,cat:document.getElementById('i_cat').value||'General',unit:document.getElementById('i_unit').value||'',
    price:+document.getElementById('i_price').value||0,pprice:+document.getElementById('i_pprice').value||0,stock:0});
  persist(); toast('Item saved');
  if(again){ ['i_name','i_price','i_pprice','i_code'].forEach(x=>document.getElementById(x).value=''); }
  else { closeModal('itemModal'); nav('items'); }
}
function addCategory(){ formModal('Add Category',`<div class="field"><label>Category Name</label><input id="f_cat"></div>`,
  ()=>{ let c=document.getElementById('f_cat').value.trim(); if(!c)return toast('Enter name');
    c=c.charAt(0).toUpperCase()+c.slice(1); if(!store.categories.includes(c))store.categories.push(c);
    persist(); closeModal('formModal'); toast('Category added'); vItems(); }); }
function renameCategory(i){ const old=store.categories[i];
  formModal('Rename Category',`<div class="field"><label>Category Name</label><input id="f_cat" value="${old}"></div>`,
  ()=>{ let c=document.getElementById('f_cat').value.trim(); if(!c)return; c=c.charAt(0).toUpperCase()+c.slice(1);
    store.categories[i]=c; store.items.forEach(it=>{if(it.cat===old)it.cat=c;}); persist(); closeModal('formModal'); vItems(); }); }
function delCategory(i){ if(store.categories[i]==='General')return toast('Cannot delete General');
  if(confirm('Delete category?')){ store.categories.splice(i,1); persist(); vItems(); } }

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
let repFrom='', repTo='', repSel='Sale';
const REPORTS={
  'Transaction report':['Sale','Purchase','Day book','All Transactions','Profit And Loss','Bill Wise Profit','Cash flow','Trial Balance Report','Balance Sheet'],
  'Party report':['Party Statement','Party wise Profit & Loss','All parties','Party Report By Item','Sale Purchase By Party'],
  'Item/Stock report':['Item Wise Profit And Loss','Low Stock Summary','Stock Detail','Item Detail','Item Wise Discount'],
  'Business Status':['Bank Statement','Discount Report'],
  'Taxes':['Tax Report','Tax Rate report'],
  'Expense report':['Expense','Expense Category Report']
};
function vReports(){
  content.innerHTML=`<div class="rep-layout">
    <div class="rep-menu">${Object.entries(REPORTS).map(([g,arr])=>`
      <div class="rep-grp">${g}</div>${arr.map(r=>`<div class="rep-item ${r===repSel?'active':''}" onclick="pickRep('${r}')">${r}</div>`).join('')}`).join('')}</div>
    <div class="rep-main">
      <div class="page-head"><h2 id="rep_title">${repSel}</h2>
        <div class="date-filter">From <input type="date" id="rep_from" value="${repFrom}" onchange="applyRep()">
        To <input type="date" id="rep_to" value="${repTo}" onchange="applyRep()">
        <button class="btn btn-outline" onclick="clearRep()">All</button></div></div>
      <div id="rep_body"></div></div></div>`;
  drawRep();
}
function pickRep(r){ repSel=r; vReports(); }
function inRange(dateStr){ if(!repFrom&&!repTo)return true; const d=toISO(dateStr);
  if(repFrom&&d<repFrom)return false; if(repTo&&d>repTo)return false; return true; }
function toISO(d){ if(d.includes('-')&&d.length===10&&d[2]==='-'){ const p=d.split('-'); return p[2]+'-'+p[1]+'-'+p[0]; } return d; }
function applyRep(){ repFrom=document.getElementById('rep_from').value; repTo=document.getElementById('rep_to').value; drawRep(); }
function clearRep(){ repFrom=''; repTo=''; vReports(); }
function drawRep(){
  const sales=store.sales.filter(s=>inRange(s.date)), purch=store.purchases.filter(p=>inRange(p.date)), exp=store.expenses.filter(e=>inRange(e.date));
  const ts=sales.reduce((a,b)=>a+b.total,0), tp=purch.reduce((a,b)=>a+b.total,0), te=exp.reduce((a,b)=>a+b.amount,0);
  const body=document.getElementById('rep_body'); if(!body)return;
  const tbl=(head,rows)=>rows.length?`<div class="panel"><table class="data"><thead><tr>${head.map((h,i)=>`<th class="${i>0?'right':''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`:emptyMini('📊','No data for selected dates');
  let html='';
  switch(repSel){
    case 'Sale':
      html=tbl(['No.','Party','Date','Amount','Balance'],[...sales].reverse().map(s=>`<tr><td class="bold">${s.no}</td><td>${s.party}</td><td>${s.date}</td><td class="right">${rs(s.total)}</td><td class="right">${rs(s.total-s.received)}</td></tr>`)); break;
    case 'Purchase':
      html=tbl(['No.','Party','Date','Amount'],[...purch].reverse().map(p=>`<tr><td class="bold">${p.no}</td><td>${p.party}</td><td>${p.date}</td><td class="right">${rs(p.total)}</td></tr>`)); break;
    case 'Expense': case 'Expense Category Report':
      html=tbl(['Category','Note','Date','Amount'],[...exp].reverse().map(e=>`<tr><td class="bold">${e.cat}</td><td class="muted">${e.note||'-'}</td><td>${e.date}</td><td class="right">${rs(e.amount)}</td></tr>`)); break;
    case 'All parties': case 'Party Statement': case 'Party wise Profit & Loss':
      html=tbl(['Party','Phone','Type','Balance'],store.parties.map(p=>`<tr><td class="bold">${p.name}</td><td class="muted">${p.phone||'-'}</td><td>${p.type}</td><td class="right">${rs(p.balance)}</td></tr>`)); break;
    case 'Stock Detail': case 'Item Detail': case 'Item Wise Profit And Loss':
      html=tbl(['Item','Code','Sale','Purchase','Stock','Value'],store.items.map(i=>`<tr><td class="bold">${i.name}</td><td class="muted">${i.code||'-'}</td><td class="right">${rs(i.price)}</td><td class="right">${rs(i.pprice)}</td><td class="right">${i.stock||0}</td><td class="right">${rs((i.stock||0)*i.price)}</td></tr>`)); break;
    case 'Low Stock Summary':
      html=tbl(['Item','Stock','Status'],store.items.filter(i=>(i.stock||0)<10).map(i=>`<tr><td class="bold">${i.name}</td><td class="right">${i.stock||0}</td><td class="right"><span class="pill due">Low</span></td></tr>`)); break;
    case 'Day book': case 'All Transactions':
      const all=[...sales.map(s=>({t:'Sale',n:s.party,d:s.date,a:s.total})),...purch.map(p=>({t:'Purchase',n:p.party,d:p.date,a:-p.total})),...exp.map(e=>({t:'Expense',n:e.cat,d:e.date,a:-e.amount}))];
      html=tbl(['Type','Name','Date','Amount'],all.map(x=>`<tr><td class="bold">${x.t}</td><td>${x.n}</td><td>${x.d}</td><td class="right" style="color:${x.a>=0?'#1aa260':'var(--red)'}">${rs(x.a)}</td></tr>`)); break;
    default:
      html=`<div class="cards"><div class="card"><div class="lbl">Sales</div><div class="val" style="color:#1aa260">${rs(ts)}</div></div>
        <div class="card"><div class="lbl">Purchase</div><div class="val">${rs(tp)}</div></div>
        <div class="card"><div class="lbl">Expenses</div><div class="val" style="color:var(--red)">${rs(te)}</div></div>
        <div class="card"><div class="lbl">Net Profit</div><div class="val" style="color:${ts-tp-te>=0?'#1aa260':'var(--red)'}">${rs(ts-tp-te)}</div></div></div>`;
  }
  body.innerHTML=html;
}

/* ============ GENERIC EMPTY ============ */
function vGeneric(view){ return ()=>{ content.innerHTML=`<div class="empty-page"><div class="empty-ill">📋</div>
  <h2>${view.charAt(0).toUpperCase()+view.slice(1)}</h2><p>This section works just like Vyapar. Add your first record to get started.</p></div>`; }; }

/* ============ EXTRA MODULES ============ */
function vPaymentIn(){ moneyList('payments','in','Payment-In','Money received from customers') }
function vPaymentOut(){ moneyList('payments','out','Payment-Out','Money paid to suppliers') }
function moneyList(key,dir,title,sub){
  const rows=store.payments.filter(p=>p.dir===dir).reverse();
  content.innerHTML=`<div class="page-head"><div><h2>${title}</h2><div class="muted">${sub}</div></div>
    <button class="btn btn-red" onclick="addPayment('${dir}')">+ Add Payment</button></div>
    <div class="panel">${rows.length?`<table class="data"><thead><tr><th>Party</th><th>Date</th><th>Type</th><th class="right">Amount</th></tr></thead><tbody>
    ${rows.map(p=>`<tr><td class="bold">${p.party}</td><td>${p.date}</td><td>${p.mode}</td><td class="right">${rs(p.amount)}</td></tr>`).join('')}
    </tbody></table>`:emptyMini('💰','No payments yet')}</div>`;
}
function addPayment(dir){
  formModal(dir==='in'?'Payment In':'Payment Out',`
    <div class="field"><label>Party Name *</label><input id="f_party" list="pl"><datalist id="pl">${store.parties.map(p=>`<option value="${p.name}">`).join('')}</datalist></div>
    <div class="field"><label>Amount</label><input id="f_amt" type="number" value="0"></div>
    <div class="field"><label>Mode</label><select id="f_mode"><option>Cash</option><option>Bank</option><option>UPI</option><option>Cheque</option></select></div>`,
  ()=>{ const p=document.getElementById('f_party').value.trim(); if(!p)return toast('Enter party');
    store.payments.push({id:id(),dir,party:p,amount:+document.getElementById('f_amt').value||0,mode:document.getElementById('f_mode').value,date:dispDate()});
    const pt=store.parties.find(x=>x.name===p); if(pt) pt.balance+= dir==='in'?-(+document.getElementById('f_amt').value||0):(+document.getElementById('f_amt').value||0);
    persist(); closeModal('formModal'); toast('Saved'); render(dir==='in'?'paymentin':'paymentout'); });
}
function vExpenses(){
  const rows=[...store.expenses].reverse();
  content.innerHTML=`<div class="page-head"><h2>Expenses</h2><button class="btn btn-red" onclick="addExpense()">+ Add Expense</button></div>
    <div class="panel">${rows.length?`<table class="data"><thead><tr><th>Category</th><th>Note</th><th>Date</th><th class="right">Amount</th></tr></thead><tbody>
    ${rows.map(e=>`<tr><td class="bold">${e.cat}</td><td class="muted">${e.note||'-'}</td><td>${e.date}</td><td class="right">${rs(e.amount)}</td></tr>`).join('')}
    </tbody></table>`:emptyMini('💸','No expenses. Add rent, salary, bills.')}</div>`;
}
function addExpense(){ formModal('Add Expense',`
  <div class="field"><label>Category</label><input id="f_cat" placeholder="Rent / Salary / Bills"></div>
  <div class="field"><label>Note</label><input id="f_note"></div>
  <div class="field"><label>Amount</label><input id="f_amt" type="number" value="0"></div>`,
  ()=>{ store.expenses.push({id:id(),cat:document.getElementById('f_cat').value||'Misc',note:document.getElementById('f_note').value,amount:+document.getElementById('f_amt').value||0,date:dispDate()});
    persist(); closeModal('formModal'); toast('Added'); vExpenses(); }); }

/* CASH & BANK */
function vBank(){
  content.innerHTML=`<div class="page-head"><h2>Bank Accounts</h2><button class="btn btn-red" onclick="addBank()">+ Add Bank</button></div>
    <div class="panel">${store.banks.length?`<table class="data"><thead><tr><th>Bank</th><th>A/C No.</th><th class="right">Balance</th></tr></thead><tbody>
    ${store.banks.map(b=>`<tr><td class="bold">${b.name}</td><td class="muted">${b.acc||'-'}</td><td class="right">${rs(b.bal)}</td></tr>`).join('')}
    </tbody></table>`:emptyMini('🏦','No bank account added')}</div>`;
}
function addBank(){ formModal('Add Bank Account',`
  <div class="field"><label>Bank Name *</label><input id="f_bn"></div>
  <div class="field"><label>Account No.</label><input id="f_acc"></div>
  <div class="field"><label>Opening Balance</label><input id="f_bal" type="number" value="0"></div>`,
  ()=>{ const n=document.getElementById('f_bn').value.trim(); if(!n)return toast('Enter name');
    store.banks.push({id:id(),name:n,acc:document.getElementById('f_acc').value,bal:+document.getElementById('f_bal').value||0});
    persist(); closeModal('formModal'); toast('Added'); vBank(); }); }
function vCash(){
  const cashIn=store.payments.filter(p=>p.dir==='in'&&p.mode==='Cash').reduce((a,b)=>a+b.amount,0);
  const cashOut=store.payments.filter(p=>p.dir==='out'&&p.mode==='Cash').reduce((a,b)=>a+b.amount,0);
  content.innerHTML=`<div class="page-head"><h2>Cash In Hand</h2></div>
    <div class="cards"><div class="card"><div class="lbl">Cash In</div><div class="val" style="color:#1aa260">${rs(cashIn)}</div></div>
    <div class="card"><div class="lbl">Cash Out</div><div class="val" style="color:var(--red)">${rs(cashOut)}</div></div>
    <div class="card"><div class="lbl">In Hand</div><div class="val">${rs(cashIn-cashOut)}</div></div></div>`;
}
function vCheques(){ content.innerHTML=`<div class="page-head"><h2>Cheques</h2></div><div class="panel">${emptyMini('🧾','No open cheques')}</div>`; }
function vLoan(){ content.innerHTML=`<div class="page-head"><h2>Loan Accounts</h2></div><div class="panel">${emptyMini('💳','No loan accounts')}</div>`; }

/* UTILITIES */
function vBarcode(){
  content.innerHTML=`<div class="page-head"><h2>Barcode / QR Generator</h2></div>
    <div class="panel" style="padding:24px">
      <div class="field"><label>Enter text / item code</label><input id="bc_in" oninput="genBarcode()" value="ITEM001"></div>
      <div id="bc_out" style="margin-top:18px;text-align:center"></div></div>`;
  genBarcode();
}
function genBarcode(){ const v=encodeURIComponent(document.getElementById('bc_in').value||'ITEM001');
  document.getElementById('bc_out').innerHTML=`<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${v}" style="border:1px solid #eee;padding:8px"><div class="muted" style="margin-top:8px">Scan to read code</div>`; }
function vRecycle(){ content.innerHTML=`<div class="page-head"><h2>Recycle Bin</h2></div><div class="panel">${emptyMini('🗑️','Recycle bin is empty')}</div>`; }
function vImport(){ content.innerHTML=`<div class="page-head"><h2>Import Items</h2></div><div class="panel" style="padding:30px;text-align:center">
  <div style="font-size:50px">📥</div><p class="muted">Upload an Excel/CSV file to bulk import items.</p>
  <input type="file" style="margin-top:14px"></div>`; }
function vEstimate(){ content.innerHTML=`<div class="page-head"><h2>Estimate / Quotation</h2><button class="btn btn-red" onclick="openSale()">+ New Estimate</button></div>
  <div class="panel">${emptyMini('📄','No estimates yet')}</div>`; }
function emptyMini(ic,t){ return `<div class="empty" style="padding:50px;text-align:center;color:#8a8f9a"><div style="font-size:44px">${ic}</div><div style="margin-top:8px">${t}</div></div>`; }

/* EDIT PROFILE (My Company) */
const BTYPES=['Retail','Wholesale','Distributor','Service','Manufacturing','Others'];
const BCATS=['Accounting & CA','Interior Designer','Automobiles/ Auto parts','Salon & Spa','Liquor Store','Book / Stationary store','Construction Materials & Equipment','Repairing/ Plumbing/ Electrician','Chemicals & Fertilizers','Computer Equipments & Softwares','Electrical & Electronics Equipments','Fashion Accessory/ Cosmetics','Hardware Store','Industrial Machinery & Equipment','Mobile & Accessories','Nursery/ Plants','Petroleum Bulk Stations & Terminals/ Pumps','Restaurant/ Hotel','Footwear','Paper & Paper Products','Sweet Shop/ Bakery','Gifts & Toys','Laundry/ Washing/ Dry clean','Coaching & Training','Others'];
function vProfile(){
  const b=store.business;
  content.innerHTML=`<div class="page-head"><h2>Edit Profile</h2></div>
  <div class="profile-card">
    <div class="logo-up">
      <div class="logo-circle" id="pf_logo">${b.logo?`<img src="${b.logo}">`:'Add<br>Logo'}</div>
      <label class="logo-edit">✏️<input type="file" accept="image/*" id="pf_logofile" onchange="pfLogo(this)" hidden></label>
    </div>
    <div class="profile-grid">
      <div class="pf-col">
        <h3 class="pf-h">Business Details</h3>
        <div class="pf-fld"><label>Business Name<b>*</b></label><input id="pf_name" value="${b.name||''}"></div>
        <div class="pf-fld"><label>Phone Number</label><input id="pf_phone" value="${b.phone||''}"></div>
        <div class="pf-fld"><label>Email ID</label><input id="pf_email" value="${b.email||''}" placeholder="Enter Email ID"></div>
      </div>
      <div class="pf-col">
        <h3 class="pf-h">More Details</h3>
        <div class="pf-fld"><label>Business Type</label>
          <select id="pf_btype"><option value="">Select Business Type</option>${BTYPES.map(t=>`<option ${b.btype===t?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="pf-fld"><label>Business Category</label>
          <select id="pf_cat"><option value="">Select Business Category</option>${BCATS.map(c=>`<option ${b.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="pf-fld"><label>Pincode</label><input id="pf_pin" value="${b.pincode||''}" placeholder="Enter Pincode"></div>
      </div>
      <div class="pf-col">
        <div class="pf-fld"><label>Business Address</label><textarea id="pf_addr" placeholder="Enter Business Address">${b.address||''}</textarea></div>
        <div class="pf-fld"><label>Add Signature</label>
          <label class="sign-up">☁️<br>Upload Signature${b.signature?' ✓':''}<input type="file" accept="image/*" id="pf_signfile" onchange="pfSign(this)" hidden></label></div>
      </div>
    </div>
    <div class="profile-foot"><button class="btn btn-outline" onclick="nav('home')">Cancel</button>
      <button class="btn btn-red" onclick="saveProfile()">Save Changes</button></div>
  </div>`;
}
function pfLogo(inp){ const f=inp.files[0]; if(!f)return; const r=new FileReader();
  r.onload=e=>{ store.business.logo=e.target.result; persist(); document.getElementById('pf_logo').innerHTML=`<img src="${e.target.result}">`; toast('Logo added'); }; r.readAsDataURL(f); }
function pfSign(inp){ const f=inp.files[0]; if(!f)return; const r=new FileReader(); r.onload=e=>{ store.business.signature=e.target.result; persist(); toast('Signature added'); }; r.readAsDataURL(f); }
function saveProfile(){ const b=store.business;
  b.name=document.getElementById('pf_name').value.trim(); b.phone=document.getElementById('pf_phone').value.trim();
  b.email=document.getElementById('pf_email').value.trim(); b.btype=document.getElementById('pf_btype').value;
  b.category=document.getElementById('pf_cat').value; b.pincode=document.getElementById('pf_pin').value.trim();
  b.address=document.getElementById('pf_addr').value.trim(); persist();
  if(b.name) document.getElementById('bizName').textContent=b.name; toast('Profile saved'); }

/* SETTINGS + LOGO */
function vSettings(){
  content.innerHTML=`<div class="page-head"><h2>Settings</h2></div>
    <div class="panel" style="padding:24px;max-width:520px">
      <div class="field"><label>Business Name</label><input id="set_name" value="${store.business.name||''}"></div>
      <div class="field"><label>Phone Number</label><input id="set_phone" value="${store.business.phone||''}"></div>
      <div class="field"><label>Business Logo</label>
        <div style="display:flex;align-items:center;gap:14px">
          <div id="set_logo_prev" style="width:70px;height:70px;border:1px solid var(--line);border-radius:8px;display:grid;place-items:center;color:#aaa;overflow:hidden">${store.business.logo?`<img src="${store.business.logo}" style="width:100%;height:100%;object-fit:cover">`:'LOGO'}</div>
          <input type="file" accept="image/*" id="set_logo" onchange="uploadLogo(this)"></div></div>
      <button class="btn btn-red" onclick="saveSettings()">Save Settings</button>
      <button class="btn btn-outline" onclick="resetAll()" style="margin-left:8px">Reset All Data</button>
    </div>`;
}
function uploadLogo(inp){ const f=inp.files[0]; if(!f)return; const r=new FileReader();
  r.onload=e=>{ store.business.logo=e.target.result; persist();
    document.getElementById('set_logo_prev').innerHTML=`<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`; toast('Logo saved'); };
  r.readAsDataURL(f); }
function saveSettings(){ store.business.name=document.getElementById('set_name').value.trim();
  store.business.phone=document.getElementById('set_phone').value.trim(); persist();
  if(store.business.name) document.getElementById('bizName').textContent=store.business.name;
  toast('Settings saved'); }
function resetAll(){ if(confirm('Delete ALL data and start fresh?')){ localStorage.removeItem(KEY); location.reload(); } }

/* ============ HELPERS ============ */
const content=document.getElementById('content');
function pf(id){ return parseFloat(document.getElementById(id).value)||0 }
function dispDate(){ const d=new Date(); return String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear(); }
function showModal(id){ document.getElementById(id).classList.add('show') }
function closeModal(id){ document.getElementById(id).classList.remove('show') }
function formModal(t,html,onSave,label){ document.getElementById('formTitle').textContent=t; document.getElementById('formBody').innerHTML=html; document.getElementById('formSave').onclick=onSave; document.getElementById('formSave').textContent=label||'Save'; showModal('formModal'); }
let tT; function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.add('show'); clearTimeout(tT); tT=setTimeout(()=>t.classList.remove('show'),2000); }

/* item modal Product/Service toggle + tabs */
document.querySelector('#itemModal .switch')?.addEventListener('click',function(){
  this.querySelector('i').style.left=this.querySelector('i').style.left==='22px'?'2px':'22px';
});
document.querySelectorAll('#itemModal .im-tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('#itemModal .im-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active');
});

/* ============ INIT ============ */
ensure(); persist();
buildMenu();
document.querySelector('.mycompany').onclick=()=>{ menuEl.querySelectorAll('.mi,.smi').forEach(x=>x.classList.remove('active')); nav('profile'); };
document.querySelectorAll('#partyModal .pm-tab').forEach(t=>t.onclick=()=>partyTab(t.dataset.pt));
if(store.business.name) document.getElementById('bizName').textContent=store.business.name;
nav('home');
