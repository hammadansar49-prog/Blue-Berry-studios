/* ============ STORAGE ============ */
const KEY='mybiz_v2';
let store = load() || seed();
function load(){ try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null} }
function persist(){ localStorage.setItem(KEY, JSON.stringify(store)); if(window.cloudPush) window.cloudPush(); }
function updateBadge(){
  var cu=store.currentUser;
  if(!cu)return;
  var el=document.getElementById('currentUserBadge');
  if(!el)return;
  var rolePart=(cu.role==='owner'&&(store.users||[]).length===0)?'':' ('+cu.role.charAt(0).toUpperCase()+cu.role.slice(1)+')';
  el.textContent=cu.name+rolePart;
}
function refreshView(){ if(currentView){   const map={home:vWelcome,parties:vParties,items:vItems,sale:vSaleList,createinvoice:vCreateInvoice,purchase:vPurchase,purchaseform:vPurchaseForm,purchaseorder:vPurchaseOrder,reports:vReports,settings:vSettings,paymentin:vPaymentIn,paymentout:vPaymentOut,expenses:vExpenses,saleorder:vSaleOrder,savedinv:vSavedInvoices,bank:vBank,cash:vCash,cheques:vCardPayments,loan:vLoan,barcode:vBarcode,recyclebin:vRecycle,importitems:vImport,exportitems:vExportItems,estimate:vEstimate,profile:vProfile,gprofile:vGProfile,bulkupdate:vBulkUpdate,importparties:vImportParties}; if(map[currentView])map[currentView](); } }
function refreshAll(){ refreshView(); refreshOpenModals(); }
// Re-render live data inside any open modal (e.g. the payment-breakdown popup) so
// real-time cloud updates reflect immediately without closing/reopening.
function refreshOpenModals(){
  try{
    var pm=document.getElementById('paymentModal');
    if(pm&&pm.classList.contains('show')&&typeof renderPaymentBreakdown==='function') renderPaymentBreakdown();
  }catch(e){}
}
function seed(){ const d=defaults(); localStorage.setItem(KEY,JSON.stringify(d)); return d; }
function defaults(){ return {business:{name:'',phone:'',logo:'',email:'',btype:'',category:'',address:'',pincode:'',signature:''},parties:[],items:[],sales:[],purchases:[],
  expenses:[],payments:[],banks:[],refunds:[],trash:[],categories:['General'],counters:{sale:1,purchaseBase:1},activityLog:[],users:[],
  widgets:{purchases:false,expenses:false,stock:false,cash:false,bank:false,lowstock:false},
  account:{phone:'3341100761'},
  companies:[{id:'c1',name:'hmdx',sync:true,current:true}],
  sharedCompanies:[{id:'s1',name:'Blueberry Studio Bahawalpur',adminPhone:'3132020534'}],
  units:['None','BAGS (Bag)','BOTTLES (Btl)','BOX (Box)','BUNDLES (Bdl)','CANS (Can)','CARTONS (Ctn)','DOZENS (Dzn)','GRAMMES (Gm)','KILOGRAMS (Kg)','LITRE (Ltr)','METERS (Mtr)','MILLILITRE (Ml)','NUMBERS (Nos)','PACKS (Pac)','PAIRS (Prs)','PIECES (Pcs)','QUINTAL (Qtl)','ROLLS (Rol)','SQUARE FEET (Sqf)','SQUARE METERS (Sqm)'],
  settings:{currency:'Rs',decimals:0,theme:'#e0413e',invPrefix:'INV-',showTax:true,showDiscount:true,showLogo:true,showQR:true,showSign:true,showTerms:true,showCoName:true,showAddress:false,showCoPhone:true,showEmail:true,terms:'Thanks for doing business with us!',taxRate:0,enableShipping:false,negativeStock:true,saleOrder:false,zoom:100,txnMsg:'',
    passcode:false,tin:false,blockNewItem:false,blockNewParty:false,estimate:false,proforma:false,multiFirm:true,stockTransfer:false,txnHistory:true,
    posBillDisc:true,posBillTax:false,posFreeQty:false,posLoyalty:false,posRoundOff:false,posPrimary:'print',posPricing:'without',posCardPayment:true,posQr:true,posBank:true,
    invNo:true,addTime:false,cashSale:true,billingName:true,poDetails:false,quickEntry:false,noPreview:false,passcodeTxn:false,discPayment:true,linkPayments:true,dueDates:false,inclTax:true,showPurchase:false,last5Price:false,freeItemQty:false,countField:true,txnTax:false,txnDiscount:true,roundOff:false,billingType:'lite',
    printerTab:'thermal',printTheme:5,thermalDefault:true,pageSize:'3inch',textBold:true,autoCut:true,openDrawer:false,coName:true,coAddress:false,coEmail:true,coPhone:true,
    tSno:true,tUom:true,tMrp:true,tSize:false,tModel:false,tSerial:false,tTotalQty:true,tAmountDec:true,tReceived:true,tBalance:true,tPartyBal:false,tTaxDetails:false,tYouSaved:true,tGrouping:true,tDesc:true,
    smsParty:true,smsUpdate:false,smsSelf:false,smsBalance:false,smsLink:true,smsSales:true,smsPurchase:true,smsSalesRet:true,smsPurchRet:true,smsPayIn:true,smsPayOut:true,smsSaleOrd:true,smsPurchOrd:false,smsEstimate:false,smsProforma:false,smsChallan:false,smsCancelled:true,
    partyGroup:false,shipAddr:false,partyStatus:true,payReminder:false,loyalty:false,
    enableItem:true,barcodeScan:true,directBarcode:true,stockMaintain:true,manufacturing:false,lowStock:true,itemUnit:true,itemCategory:true,partyWiseRate:false,itemDesc:true,itemTax:false,itemDiscount:true,updatePrice:false,itemQtyDec:2,wholesale:true,sizeField:false}}; }
function ensure(){ const d=defaults(); for(const k in d){ if(store[k]===undefined) store[k]=d[k]; } if(!store.business) store.business=d.business; if(!store.counters)store.counters=d.counters; if(store.counters.purchaseBase===undefined)store.counters.purchaseBase=store.counters.purchase||1; syncOldSalesToPayments(); }

/* ============ ROLE PERMISSIONS ============ */
const PERMISSIONS = {
  owner: { view:['*'], create:['*'], edit:['*'], delete:['*'], admin:['*'] },
  admin: { view:['*'], create:['*'], edit:['*'], delete:['*'], admin:['*'] },
  manager: {
    view:['dashboard','parties','items','invoices','reports','estimates','sale-orders','purchase-orders','bank','cash','cheques','loan','expenses','payment-in','payment-out','purchase','purchase-return'],
    create:['invoice','item','party','purchase','expense','payment-in','payment-out','sale-order','purchase-order'],
    edit:['item','party','invoice','estimate'],
    delete:['item','party','invoice'],
    admin:[]
  },
  cashier: {
    view:['dashboard','parties','items','invoices','barcode','recycle'],
    create:['invoice'],
    edit:[],
    delete:[],
    admin:[]
  },
  viewer: {
    view:['*'],
    create:[],
    edit:[],
    delete:[],
    admin:[]
  },
  branch: {
    view:['*'],
    create:['*'],
    edit:['*'],
    delete:['*'],
    admin:['import','export','barcode','recycle','admin-users']
  }
};

function hasPermission(action, feature) {
  var role = (store.currentUser && store.currentUser.role) || 'owner';
  if (role === 'owner' || role === 'admin') return true;
  if (role === 'branch') {
    if (action === 'admin') return (PERMISSIONS.branch.admin || []).includes(feature);
    return true;
  }
  var perms = PERMISSIONS[role] || PERMISSIONS.viewer;
  var allowed = perms[action] || [];
  if (allowed.includes('*')) return true;
  return allowed.includes(feature);
}

function showNoAccess() { toast('You do not have permission for this'); }

function syncOldSalesToPayments(){
  if(!store.sales||!store.sales.length)return;
  if(!store.payments)store.payments=[];
  let changed=false;
  store.sales.forEach(s=>{
    if(s.refunded)return;
    const alreadyHas=store.payments.some(p=>p.saleId===s.id);
    if(alreadyHas)return;
    const mode=s.mode||'Cash';
    const party=s.party||'';
    const amount=s.received||0;
    const date=s.date||dispDate();
    store.payments.push({id:id(),saleId:s.id,dir:'in',party:party,amount:amount,mode:mode,date:date});
    changed=true;
  });
  if(changed)persist();
}
function logActivity(type,detail){
  if(!store.activityLog)store.activityLog=[];
  const now=new Date();
  const time=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const date=now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  const cu=store.currentUser||null;
  const userName=cu?cu.name:'Owner';
  const userRole=cu?cu.role:'owner';
  store.activityLog.unshift({id:id(),type,detail,time,date,ts:Date.now(),userName,userRole});
  if(store.activityLog.length>500)store.activityLog.length=500;
  persist();
}
function id(){ return Math.random().toString(36).slice(2,9) }
const rs = n => { const s=(store.settings||{}); return (s.currency||'Rs')+' '+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:s.decimals||0,maximumFractionDigits:s.decimals||0}); };

function chartTicks(maxVal){
  if(maxVal<=0)maxVal=1;
  const ceiling=maxVal*1.25;
  const rawStep=ceiling/5;
  const mag=Math.pow(10,Math.floor(Math.log10(rawStep)));
  const norm=rawStep/mag;
  let step;
  if(norm<=1.5)step=mag;
  else if(norm<=3.5)step=2*mag;
  else if(norm<=7.5)step=5*mag;
  else step=10*mag;
  const ticks=[];
  for(let v=0;v<=ceiling+step*0.1;v+=step)ticks.push(Math.round(v));
  return{ticks,step};
}
function chartFmt(v){
  if(v>=10000000)return(v/10000000)+'Cr';
  if(v>=100000)return(v/100000)+'L';
  if(v>=1000)return(v/1000)+'k';
  return v;
}

/* ============ MENU CONFIG ============ */
const MENU=[
  {k:'home', t:'Home', ic:'🏠', perm:'dashboard'},
  {k:'parties', t:'Parties', ic:'👥', plus:true, perm:'parties'},
  {k:'items', t:'Items', ic:'🛍️', plus:true, perm:'items'},
  {t:'Sale', ic:'🧾', perm:'invoices', sub:[
    {k:'createinvoice', t:'Create Invoice', plus:true, perm:'create-invoice'},
    {k:'sale', t:'Sale Invoices', plus:true, perm:'invoices'},
    {k:'savedinv', t:'Saved Invoices', perm:'invoices'},
    {k:'estimate', t:'Estimate/ Quotation', plus:true, perm:'estimates'},
    {k:'paymentin', t:'Payment-In', plus:true, perm:'payment-in'},
    {k:'saleorder', t:'Sale Order', plus:true, perm:'sale-orders'},
    {k:'challan', t:'Delivery Challan', plus:true, perm:'invoices'},
    {k:'salereturn', t:'Sale Return/ Cr. Note', plus:true, perm:'invoices'}]},
  {t:'Purchase & Expense', ic:'🛒', perm:'purchase', sub:[
    {k:'purchase', t:'Purchase Bills', plus:true, perm:'purchase'},
    {k:'paymentout', t:'Payment-Out', plus:true, perm:'payment-out'},
    {k:'expenses', t:'Expenses', plus:true, perm:'expenses'},
    {k:'purchaseorder', t:'Purchase Order', plus:true, perm:'purchase-orders'},
    {k:'purchasereturn', t:'Purchase Return/ Dr. Note', plus:true, perm:'purchase-return'}]},
  {k:'reports', t:'Reports', ic:'📊', perm:'reports'},
  {t:'Sync, Share & Backup', ic:'🔄', perm:'admin-users', sub:[
    {k:'useractivity', t:'User Activity', dot:true, perm:'admin-users'},
    {k:'restorebackup', t:'Restore Backup', perm:'restore-backup'}]},
  {t:'Utilities', ic:'🛠️', sub:[
    {k:'importitems', t:'Import Items', perm:'import'},
    {k:'barcode', t:'Barcode Generator', perm:'barcode'},
    {k:'bulkupdate', t:'Update Items In Bulk', perm:'import'},
    {k:'importparties', t:'Import Parties', perm:'import'},
    {k:'exportitems', t:'Export Items', perm:'export'},
    {k:'recyclebin', t:'Recycle Bin', perm:'recycle'}]},
  {k:'settings', t:'Settings', ic:'⚙️', perm:'settings'}
];

const menuEl=document.getElementById('menu');
function buildMenu(){
  const s=store.settings||{};
  const filteredMenu=MENU.map(m=>{
    if(!m.sub) return m;
    return {...m, sub: m.sub.filter(item=>{
      if(item.k==='estimate' && !s.estimate) return false;
      if(item.k==='saleorder' && !s.saleOrder) return false;
      if(item.perm && !hasPermission('view', item.perm)) return false;
      return true;
    })};
  }).filter(m=>{
    if(m.perm && !hasPermission('view', m.perm)) return false;
    if(!m.sub) return true;
    return m.sub.length>0;
  });
  menuEl.innerHTML = filteredMenu.map((m,i)=>{
    if(m.sub){
      return `<div class="mi" data-grp="${i}"><span class="ic">${m.ic}</span>${m.t}<span class="chev">▼</span></div>
        <div class="submenu" id="grp${i}">${m.sub.map(s=>`<div class="smi" data-view="${s.k}">${s.t}${s.dot?'<span class="green-dot"></span>':''}${s.plus?'<span class="plus">+</span>':''}</div>`).join('')}</div>`;
    }
    return `<div class="mi" data-view="${m.k}"><span class="ic">${m.ic}</span>${m.t}${m.plus?'<span class="plus">+</span>':''}</div>`;
  }).join('');
  menuEl.querySelectorAll('.mi[data-grp]').forEach(el=>el.onclick=()=>{
    const wasOpen=el.classList.contains('open');
    menuEl.querySelectorAll('.mi[data-grp]').forEach(x=>{x.classList.remove('open');});
    menuEl.querySelectorAll('.submenu').forEach(x=>x.classList.remove('show'));
    if(!wasOpen){el.classList.add('open');document.getElementById('grp'+el.dataset.grp).classList.add('show');}
  });
  menuEl.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>{
    nav(el.dataset.view,el);
    const grp=el.closest('.submenu');
    if(grp){const mi=grp.previousElementSibling;if(mi){mi.classList.add('open');grp.classList.add('show');}}
  });
}
function nav(view,el){
  currentView=view;
  menuEl.querySelectorAll('.mi,.smi').forEach(x=>x.classList.remove('active'));
  if(el) el.classList.add('active'); else menuEl.querySelector(`[data-view="${view}"]`)?.classList.add('active');
  const bizH=document.querySelector('.biz-header');
  if(bizH) bizH.style.display=(view==='home'||view==='purchase'||view==='purchaseform')?'none':'';
  const brandF=document.querySelector('.brand-footer');
  if(brandF) brandF.style.display=(view==='home'||view==='purchase'||view==='purchaseform')?'none':'';
  content.className=(view==='purchase'||view==='purchaseform')?'content pf-active':'content';
  
  render(view);
  const viewNames={home:'Home',parties:'Parties',items:'Items',sale:'Sale Invoices',createinvoice:'Create Invoice',purchase:'Purchase Form',purchaseform:'Purchase Form',reports:'Reports',settings:'Settings',paymentin:'Payment-In',paymentout:'Payment-Out',expenses:'Expenses',saleorder:'Sale Order',savedinv:'Saved Invoices',bank:'Bank Accounts',cash:'Cash In Hand',cheques:'Card Payments',barcode:'Barcode Generator',recyclebin:'Recycle Bin',importitems:'Import Items',estimate:'Estimate',profile:'My Company',gprofile:'Google Profile',useractivity:'User Activity',restorebackup:'Restore Backup',bulkupdate:'Bulk Update Items',importparties:'Import Parties'};
  logActivity('navigation','Opened '+viewNames[view]);
}
function render(view){
  const viewPerms={
    home:'dashboard',parties:'parties',items:'items',sale:'invoices',createinvoice:'invoices',
    purchase:'purchase',purchaseform:'purchase',purchaseorder:'purchase-orders',reports:'reports',
    settings:'settings',paymentin:'payment-in',paymentout:'payment-out',expenses:'expenses',
    purchasereturn:'purchase-return',saleorder:'sale-orders',savedinv:'invoices',
    bank:'bank',cash:'cash',cheques:'cheques',loan:'loan',
    barcode:'barcode',recyclebin:'recycle',importitems:'import',exportitems:'export',
    estimate:'estimates',profile:'settings',gprofile:'settings',
    useractivity:'admin-users',restorebackup:'restore-backup',bulkupdate:'import',importparties:'import'
  };
  if(viewPerms[view] && !hasPermission('view', viewPerms[view])){showNoAccess();return;}
  const map={home:vWelcome,parties:vParties,items:vItems,sale:vSaleList,createinvoice:vCreateInvoice,purchase:vPurchase,purchaseform:vPurchaseForm,purchaseorder:vPurchaseOrder,reports:vReports,
    settings:vSettings,paymentin:vPaymentIn,paymentout:vPaymentOut,expenses:vExpenses,purchasereturn:vPurchaseReturn,
    saleorder:vSaleOrder,savedinv:vSavedInvoices,
    bank:vBank,cash:vCash,cheques:vCardPayments,loan:vLoan,
    barcode:vBarcode,recyclebin:vRecycle,importitems:vImport,exportitems:vExportItems,estimate:vEstimate,profile:vProfile,gprofile:vGProfile,
    useractivity:vUserActivity,restorebackup:vRestoreBackup,bulkupdate:vBulkUpdate,importparties:vImportParties};
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

/* ============ BRANCH DASHBOARD ============ */
function showBranchDashboard() {
  const branch = store.currentUser;
  if (!branch || branch.role !== 'branch') return;

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center">
      <div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,var(--blue),#5b8def);color:#fff;display:grid;place-items:center;font-size:48px;margin-bottom:24px">🏢</div>
      <h1 style="font-size:28px;font-weight:800;color:#222;margin-bottom:8px">${branch.name}</h1>
      <div style="background:var(--blue);color:#fff;padding:8px 20px;border-radius:20px;font-weight:700;font-size:16px;display:inline-block;margin-bottom:16px">Current Branch</div>
      <div style="font-size:14px;color:#888;margin-bottom:8px">Branch Code: <b>${branch.branchCode}</b></div>
      ${branch.branchPhone?`<div style="font-size:14px;color:#888;margin-bottom:24px">Phone: <b>${branch.branchPhone}</b></div>`:'<div style="margin-bottom:24px"></div>'}
      <button onclick="nav('home')" style="padding:14px 40px;background:var(--red);color:#fff;border:none;border-radius:26px;font-weight:700;font-size:16px;cursor:pointer">Open →</button>
    </div>`;
}

/* ============ WELCOME / DASHBOARD ============ */
function vWelcome(){
  const currentUser=store.currentUser||{name:'Owner',role:'owner'};
  const userName=currentUser.name||'Owner';
  const userRole=currentUser.role||'owner';
  
  // Cashier simplified dashboard
  if(userRole==='cashier'){
    content.innerHTML=`
      <div style="padding:20px;text-align:center">
        <h2 style="margin:0 0 4px">Welcome, ${userName}</h2>
        <p style="color:#888;margin:0 0 20px;font-size:14px">Cashier Dashboard</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:360px;margin:0 auto">
          <div class="ua-card" onclick="nav('createinvoice')" style="padding:20px;cursor:pointer">
            <div style="font-size:28px;margin-bottom:6px">📄</div>
            <div style="font-weight:700;font-size:14px">Create Invoice</div>
          </div>
          <div class="ua-card" onclick="nav('sale')" style="padding:20px;cursor:pointer">
            <div style="font-size:28px;margin-bottom:6px">📋</div>
            <div style="font-weight:700;font-size:14px">View Invoices</div>
          </div>
          <div class="ua-card" onclick="nav('items')" style="padding:20px;cursor:pointer">
            <div style="font-size:28px;margin-bottom:6px">📦</div>
            <div style="font-weight:700;font-size:14px">View Items</div>
          </div>
          <div class="ua-card" onclick="nav('parties')" style="padding:20px;cursor:pointer">
            <div style="font-size:28px;margin-bottom:6px">👤</div>
            <div style="font-weight:700;font-size:14px">View Parties</div>
          </div>
        </div>
      </div>`;
    return;
  }
  
  const totalSales=(store.sales||[]).reduce((a,s)=>a+(s.refunded?0:s.total),0);
  const totalPurchases=(store.purchases||[]).reduce((a,p)=>a+p.total,0);
  const totalExpenses=(store.expenses||[]).reduce((a,e)=>a+e.amount,0);
  const totalReceivable=(store.parties||[]).reduce((a,p)=>a+((p.balance||0)>0?p.balance:0),0);
  const totalPayable=(store.parties||[]).reduce((a,p)=>a+((p.balance||0)<0?Math.abs(p.balance):0),0);
  const roleLabel=userRole==='owner'?'Owner':userRole==='admin'?'Admin':userRole==='manager'?'Manager':userRole==='cashier'?'Cashier':userRole==='viewer'?'Viewer':userRole==='branch'?'Branch ('+currentUser.branchCode+')':'User';
  const businessName=store.business&&store.business.name?store.business.name:'My Business';
  const now=new Date();
  const currentMonth=now.getMonth();
  const currentYear=now.getFullYear();
  const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const thisMonthSales=(store.sales||[]).filter(s=>{
    if(s.refunded)return false;
    const parts=s.date.split(/[\s/-]/);
    const d=new Date(parts[2]+'-'+parts[1]+'-'+parts[0]);
    return d.getMonth()===currentMonth&&d.getFullYear()===currentYear;
  });
  const thisMonthTotal=thisMonthSales.reduce((a,s)=>a+s.total,0);
  const dailySales={};
  thisMonthSales.forEach(s=>{
    const parts=s.date.split(/[\s/-]/);
    const day=parseInt(parts[0]);
    dailySales[day]=(dailySales[day]||0)+s.total;
  });
  let chartHTML='';
  const maxSale=Math.max(...Object.values(dailySales),1);
  const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
  const chartPoints=[];
  for(let d=1;d<=daysInMonth;d++){
    const val=dailySales[d]||0;
    chartPoints.push({day:d,label:monthNames[currentMonth]+' '+d,val});
  }
  const chartW=700,chartH=200,padL=50,padR=20,padT=10,padB=40;
  const plotW=chartW-padL-padR,plotH=chartH-padT-padB;
  if(chartPoints.some(p=>p.val>0)){
    const svgPts=chartPoints.map((p,i)=>{
      const x=padL+(i/(chartPoints.length-1||1))*plotW;
      const y=padT+plotH-(p.val/maxSale)*plotH;
      return {x,y,val:p.val,label:p.label};
    });
    const pathD=smoothPath(svgPts);
    const areaD=pathD+' L'+svgPts[svgPts.length-1].x.toFixed(1)+','+(padT+plotH)+' L'+svgPts[0].x.toFixed(1)+','+(padT+plotH)+' Z';
    const yT=chartTicks(maxSale);
    const yTicks=yT.ticks;
    const yLines=yTicks.map(v=>{
      const y=padT+plotH-(v/maxSale)*plotH;
      return `<line x1="${padL}" y1="${y}" x2="${chartW-padR}" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>
              <text x="${padL-8}" y="${y+4}" text-anchor="end" fill="#aaa" font-size="11" font-weight="500">${chartFmt(v)}</text>`;
    }).join('');
    const xLabels=chartPoints.filter((p,i)=>i%Math.max(1,Math.floor(chartPoints.length/8))===0||p.day===daysInMonth).map(p=>{
      const x=padL+((p.day-1)/(chartPoints.length-1||1))*plotW;
      return `<text x="${x}" y="${chartH-6}" text-anchor="middle" fill="#aaa" font-size="11" font-weight="500">${p.day}</text>`;
    }).join('');
    chartHTML=`<svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:200px">
      <defs><linearGradient id="areaGradInit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(47,109,246,0.18)"/>
        <stop offset="100%" stop-color="rgba(47,109,246,0.01)"/>
      </linearGradient></defs>
      ${yLines}
      <path d="${areaD}" fill="url(#areaGradInit)"/>
      <path d="${pathD}" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${svgPts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="var(--blue)" stroke="#fff" stroke-width="2" data-label="${p.label}" data-val="${p.val}"/>`).join('')}
      ${xLabels}
    </svg>`;
  } else {
    chartHTML=`<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#ccc;font-size:14px">
      <div style="text-align:center"><div style="font-size:40px;margin-bottom:8px">📊</div>No sales this month</div></div>`;
  }

  content.innerHTML=`
  <div class="dash-wrap">
    <div class="dash-welcome" style="font-size:22px;font-weight:800;color:#222;margin-bottom:14px">Welcome to <span style="color:#e74c3c">Karobar</span></div>
    <div class="dash-top-bar">
      <div class="dash-search"><span class="dash-search-ic">🔍</span><input placeholder="Search Transactions" oninput="dashSearch(this.value)"></div>
      <div style="display:flex;gap:10px;margin-left:auto">
        <button onclick="openSale()" style="padding:10px 22px;background:#e74c3c;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap">＋ Add Sale</button>
        <button onclick="nav('purchaseform')" style="padding:10px 22px;background:#2f6df6;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap">＋ Add Purchase</button>
      </div>
    </div>
    <div class="dash-admin-banner">
      <span class="dash-admin-icon">👤</span>
      <span>You are now logged in as <b>${roleLabel}</b></span>
    </div>
    <div class="dash-main-row">
      <div class="dash-col-left">
        <div class="dash-summary-row">
          <div class="dash-card dash-receivable" style="cursor:pointer" onclick="dashShowReceivables()">
            <div class="dash-card-body">
              <div class="dash-card-label">Total Receivable</div>
              <div class="dash-card-value">${rs(totalReceivable)}</div>
              <div class="dash-card-sub">${totalReceivable>0?'You have receivables pending':'You don\'t have any receivables as of now.'}</div>
            </div>
            <div class="dash-card-icon dash-icon-green">↓</div>
          </div>
          <div class="dash-card dash-payable" style="cursor:pointer" onclick="dashShowPayables()">
            <div class="dash-card-body">
              <div class="dash-card-label">Total Payable</div>
              <div class="dash-card-value">${rs(totalPayable)}</div>
              <div class="dash-card-sub">${totalPayable>0?'You have payables pending':'You don\'t have any payables as of now.'}</div>
            </div>
            <div class="dash-card-icon dash-icon-red">↑</div>
          </div>
        </div>
        <div class="dash-sale-section">
          <div class="dash-sale-head">
            <div>
              <div class="dash-sale-label">Total Sale</div>
              <div class="dash-sale-amount">${rs(thisMonthTotal)}</div>
            </div>
            <div class="dash-sale-filter" id="dashMonthFilter">
              <select onchange="dashChangeMonth(this.value)">
                <option value="today">Today</option>
                <option value="3days">Last 3 Days</option>
                <option value="week">This Week</option>
                <option value="this" selected>This Month</option>
                <option value="last">Last Month</option>
                <option value="3">Last 3 Months</option>
                <option value="6">Last 6 Months</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          <div class="dash-chart" id="dashChart">${chartHTML}</div>
        </div>
        <div class="dash-reports-section">
          <div class="dash-reports-head">
            <span class="dash-reports-title">Most Used Reports</span>
            <span class="dash-reports-viewall" onclick="nav('reports')">View All</span>
          </div>
          <div class="dash-reports-grid">
            <div class="dash-report-card" onclick="dashOpenReport('sale')">
              <span class="dash-report-name">Sale Report</span>
              <span class="dash-report-arrow">›</span>
            </div>
            <div class="dash-report-card" onclick="dashOpenReport('alltrans')">
              <span class="dash-report-name">All Transactions</span>
              <span class="dash-report-arrow">›</span>
            </div>
            <div class="dash-report-card" onclick="dashOpenReport('daybook')">
              <span class="dash-report-name">Daybook Report</span>
              <span class="dash-report-arrow">›</span>
            </div>
            <div class="dash-report-card" onclick="dashOpenReport('partystatement')">
              <span class="dash-report-name">Party Statement</span>
              <span class="dash-report-arrow">›</span>
            </div>
          </div>
        </div>
      </div>
      <div class="dash-col-right">
        <div class="dash-widget-area">
          ${renderWidgets()||`<div class="dash-widget-ill">
            <svg viewBox="0 0 200 180" style="width:140px;height:140px">
              <circle cx="100" cy="90" r="85" fill="#e8f4fd"/>
              <rect x="60" y="40" width="80" height="70" rx="6" fill="#fff" stroke="#b8d8f0" stroke-width="2"/>
              <rect x="70" y="50" width="24" height="18" rx="3" fill="#a8d4f0"/>
              <rect x="100" y="50" width="24" height="18" rx="3" fill="#a8d4f0"/>
              <rect x="70" y="74" width="54" height="6" rx="2" fill="#c8e4f8"/>
              <rect x="70" y="84" width="36" height="6" rx="2" fill="#c8e4f8"/>
              <rect x="70" y="98" width="54" height="4" rx="2" fill="#d8eef8"/>
              <rect x="85" y="110" width="30" height="10" rx="3" fill="#4db8ff" opacity="0.6"/>
              <circle cx="140" cy="50" r="4" fill="#ffd700" opacity="0.7"/>
              <circle cx="155" cy="70" r="3" fill="#4db8ff" opacity="0.5"/>
              <circle cx="48" cy="55" r="2.5" fill="#4db8ff" opacity="0.5"/>
            </svg>
          </div>
          <div class="dash-widget-title">It Looks So Empty in Here!</div>
          <div class="dash-widget-sub">Add one of our widgets to get started and view your business operations</div>`}
        </div>
        <div class="dash-add-widget" onclick="showWidgetModal()">
          <span>Add Widget of Your Choice</span>
          <span class="dash-add-widget-plus">+</span>
        </div>
      </div>
    </div>
  </div>`;
  dashInitChart();
}

function calcCashInHand(){
  const cashIn=(store.payments||[]).filter(p=>p.dir==='in'&&p.mode==='Cash').reduce((a,b)=>a+(b.amount||0),0);
  const cashOut=(store.payments||[]).filter(p=>p.dir==='out'&&p.mode==='Cash').reduce((a,b)=>a+(b.amount||0),0);
  return cashIn-cashOut;
}

function calcLowStockCount(){
  return (store.items||[]).filter(i=>{
    const min=i.lowstock||0;
    return min>0&&(i.stock||0)<=min;
  }).length;
}

function dashInitChart(){
  const period=window.dashPeriod||'this';
  const sel=document.querySelector('#dashMonthFilter select');
  if(sel)sel.value=period;
  // Recompute the chart for the remembered period from the LATEST sales data.
  if(typeof dashChangeMonth==='function')dashChangeMonth(period);
  else attachChartTooltips('dashChart');
}

function showWidgetModal(){
  if(!store.widgets) store.widgets={purchases:false,expenses:false,stock:false,avstock:false,cash:false,bank:false,lowstock:false};
  const widgets=[
    {key:'purchases',label:'Purchases',val:rs((store.purchases||[]).reduce((a,p)=>a+p.total,0))},
    {key:'expenses',label:'Expenses',val:rs((store.expenses||[]).reduce((a,e)=>a+e.amount,0))},
    {key:'stock',label:'Stock Value',val:rs((store.items||[]).reduce((a,i)=>a+(i.stock||0)*(i.price||0),0))},
    {key:'avstock',label:'Available Stock',val:(store.items||[]).reduce((a,i)=>a+(i.stock||0),0)+' units'},
    {key:'cash',label:'Cash In Hand',val:rs(calcCashInHand())},
    {key:'bank',label:'Total Bank Balance',val:rs((store.banks||[]).reduce((a,b)=>a+(b.bal||0),0))},
    {key:'lowstock',label:'Low Stock Items',val:calcLowStockCount()+' items'}
  ];
  const html=`<div id="widgetModal" class="modal-overlay modal-dynamic" onclick="closeModal('widgetModal')" style="position:fixed;inset:0;background:rgba(20,22,30,.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px">
    <div class="modal" onclick="event.stopPropagation()" style="max-width:420px;width:95%;border-radius:16px;overflow:hidden">
      <div class="modal-head"><span>Add Widget of Your Choice</span><span class="modal-close" onclick="closeModal('widgetModal')">✕</span></div>
      <div style="padding:16px">
        ${widgets.map(w=>{
          const active=store.widgets[w.key];
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid #f0f0f0">
            <div>
              <div style="font-size:14px;color:#666;margin-bottom:4px">${w.label}</div>
              <div style="font-size:18px;font-weight:700;color:#222">${w.val}</div>
            </div>
            <div onclick="toggleWidget('${w.key}')" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;font-weight:700;transition:.2s;${active?'background:#fff0f0;color:#e74c3c;border:2px solid #e74c3c':'background:#f0f7ff;color:#2f6df6;border:2px solid #2f6df6'}">
              ${active?'−':'+'}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

function toggleWidget(key){
  if(!store.widgets) store.widgets={};
  store.widgets[key]=!store.widgets[key];
  persist();
  closeModal('widgetModal');
  showWidgetModal();
  refreshView();
}

function renderWidgets(){
  if(!store.widgets) return '';
  const w=store.widgets;
  const items=[];
  if(w.purchases) items.push({label:'Purchases',val:rs((store.purchases||[]).reduce((a,p)=>a+p.total,0)),color:'#2f6df6'});
  if(w.expenses) items.push({label:'Expenses',val:rs((store.expenses||[]).reduce((a,e)=>a+e.amount,0)),color:'#e74c3c'});
  if(w.stock) items.push({label:'Stock Value',val:rs((store.items||[]).reduce((a,i)=>a+(i.stock||0)*(i.price||0),0)),color:'#8b5cf6'});
  if(w.avstock) items.push({label:'Available Stock',val:(store.items||[]).reduce((a,i)=>a+(i.stock||0),0)+' units',color:'#6366f1'});
  if(w.cash) items.push({label:'Cash In Hand',val:rs(calcCashInHand()),color:'#27ae60'});
  if(w.bank) items.push({label:'Total Bank Balance',val:rs((store.banks||[]).reduce((a,b)=>a+(b.bal||0),0)),color:'#0891b2'});
  if(w.lowstock) items.push({label:'Low Stock Items',val:calcLowStockCount()+' items',color:'#f59e0b'});
  if(!items.length) return '';
  return `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px">
    ${items.map(it=>`<div style="flex:1;min-width:140px;background:#fff;border:1px solid #f0f0f0;border-radius:12px;padding:16px">
      <div style="font-size:13px;color:#888;margin-bottom:6px">${it.label}</div>
      <div style="font-size:20px;font-weight:800;color:${it.color}">${it.val}</div>
    </div>`).join('')}
  </div>`;
}

function dashShowReceivables(){dashShowBalanceDetail('receivable')}
function dashShowPayables(){dashShowBalanceDetail('payable')}
function dashShowBalanceDetail(type){
  const isR=type==='receivable';
  const title=isR?'Total Receivable':'Total Payable';
  const color=isR?'#27ae60':'#e74c3c';
  const colorLight=isR?'#e8f5e9':'#fce4ec';
  const icon=isR?'↓':'↑';
  const subtitle=isR?'Money customers owe you':'Money you owe suppliers';
  const now=new Date();
  const curMonth=now.getMonth();
  const curYear=now.getFullYear();
  const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const daysInMonth=new Date(curYear,curMonth+1,0).getDate();

  const parties=(store.parties||[]).filter(p=>{
    const bal=p.balance||0;
    return isR?bal>0:bal<0;
  }).sort((a,b)=>isR?b.balance-a.balance:a.balance-b.balance);
  const total=parties.reduce((a,p)=>a+Math.abs(p.balance),0);

  const dailyData={};
  parties.forEach(p=>{
    const bal=Math.abs(p.balance);
    const salesForParty=(store.sales||[]).filter(s=>s.party===p.name);
    let currentMonthOutstanding=0;
    const daySales={};
    const dayPayments={};
    salesForParty.forEach(s=>{
      const parts=(s.date||'').split(/[\s/-]/);
      if(parts.length<3)return;
      const sm=parseInt(parts[1])-1;
      const sy=parseInt(parts[2]);
      if(sm!==curMonth||sy!==curYear)return;
      const outstanding=(s.total||0)-(s.received||0);
      if(isR&&outstanding<=0)return;
      if(!isR&&outstanding>=0)return;
      currentMonthOutstanding+=Math.abs(outstanding);
      const day=parseInt(parts[0]);
      daySales[day]=(daySales[day]||0)+Math.abs(outstanding);
    });
    let currentMonthPayments=0;
    const partyPayments=(store.payments||[]).filter(pay=>pay.party===p.name&&(isR?pay.dir==='in':pay.dir==='out'));
    partyPayments.forEach(pay=>{
      const parts=(pay.date||'').split(/[\s/-]/);
      if(parts.length<3)return;
      const pm=parseInt(parts[1])-1;
      const py=parseInt(parts[2]);
      if(pm!==curMonth||py!==curYear)return;
      currentMonthPayments+=(pay.amount||0);
      const day=parseInt(parts[0]);
      dayPayments[day]=(dayPayments[day]||0)+(pay.amount||0);
    });
    const openingBal=Math.max(bal-currentMonthOutstanding+currentMonthPayments,0);
    let running=openingBal;
    for(let d=1;d<=daysInMonth;d++){
      if(daySales[d]) running+=daySales[d];
      if(dayPayments[d]) running=Math.max(running-dayPayments[d],0);
      dailyData[d]=(dailyData[d]||0)+running;
    }
  });

  const chartPoints=[];
  for(let d=1;d<=daysInMonth;d++){chartPoints.push({day:d,label:monthNames[curMonth]+' '+d,val:dailyData[d]||0});}
  const hasData=chartPoints.some(p=>p.val>0);
  const maxVal=Math.max(...chartPoints.map(p=>p.val),1);

  let chartHTML='';
  const chartW=700,chartH=200,padL=50,padR=20,padT=10,padB=40;
  const plotW=chartW-padL-padR,plotH=chartH-padT-padB;

  const svgPts=chartPoints.map((p,i)=>{
    const x=padL+(i/(chartPoints.length-1||1))*plotW;
    const y=padT+plotH-(p.val/maxVal)*plotH;
    return {x,y,val:p.val,label:p.label};
  });
  const pathD=smoothPath(svgPts);
  const areaD=pathD+' L'+svgPts[svgPts.length-1].x.toFixed(1)+','+(padT+plotH)+' L'+svgPts[0].x.toFixed(1)+','+(padT+plotH)+' Z';
  const yT=chartTicks(maxVal);
  const yLines=yT.ticks.map(v=>{
    const y=padT+plotH-(v/maxVal)*plotH;
    return `<line x1="${padL}" y1="${y}" x2="${chartW-padR}" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>
            <text x="${padL-8}" y="${y+4}" text-anchor="end" fill="#aaa" font-size="11" font-weight="500">${chartFmt(v)}</text>`;
  }).join('');
  const xLabels=chartPoints.filter((p,i)=>i%Math.max(1,Math.floor(chartPoints.length/8))===0||p.day===daysInMonth).map(p=>{
    const x=padL+((p.day-1)/(chartPoints.length-1||1))*plotW;
    return `<text x="${x}" y="${chartH-6}" text-anchor="middle" fill="#aaa" font-size="11" font-weight="500">${p.day}</text>`;
  }).join('');
  const gradId='balGrad_'+type;
  chartHTML=`<svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:200px">
    <defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}30"/>
      <stop offset="100%" stop-color="${color}05"/>
    </linearGradient></defs>
    ${yLines}
    <path d="${areaD}" fill="url(#${gradId})"/>
    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${svgPts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${color}" stroke="#fff" stroke-width="2" data-label="${p.label}" data-val="${p.val}"/>`).join('')}
    ${xLabels}
  </svg>`;

  let partyListHtml='';
  if(parties.length){
    const maxBal=parties[0].balance||1;
    partyListHtml=parties.map(p=>{
      const bal=Math.abs(p.balance);
      const pct=Math.max((bal/maxBal)*100,4);
      return `<div class="dbar-row">
        <div class="dbar-name">${p.name}</div>
        <div class="dbar-track"><div class="dbar-fill" style="width:${pct}%;background:${color}"></div></div>
        <div class="dbar-val" style="color:${color}">${rs(bal)}</div>
      </div>`;
    }).join('');
  }

  const html=`<div class="dbar-page">
    <div class="dbar-page-head">
      <div class="dbar-page-head-left">
        <span class="dbar-back" onclick="nav('home')">← Back</span>
        <div class="dbar-page-icon" style="background:${colorLight};color:${color}">${icon}</div>
        <div><div class="dbar-page-title">${title}</div><div class="dbar-page-sub">${subtitle} · ${monthNames[curMonth]} ${curYear}</div></div>
      </div>
      <div class="dbar-page-total" style="color:${color}">${rs(total)}</div>
    </div>
    <div class="dbar-page-chart" id="balDetailChart" style="position:relative">${chartHTML}</div>
  </div>`;

  content.innerHTML=html;
  currentView='home';
  attachChartTooltips('balDetailChart');
}

function smoothPath(pts){
  if(pts.length<2) return '';
  let d='M'+pts[0].x.toFixed(1)+','+pts[0].y.toFixed(1);
  if(pts.length===2){
    d+='L'+pts[1].x.toFixed(1)+','+pts[1].y.toFixed(1);
    return d;
  }
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[Math.max(i-1,0)];
    const p1=pts[i];
    const p2=pts[i+1];
    const p3=pts[Math.min(i+2,pts.length-1)];
    const tension=0.3;
    const cp1x=p1.x+(p2.x-p0.x)*tension;
    const cp1y=p1.y+(p2.y-p0.y)*tension;
    const cp2x=p2.x-(p3.x-p1.x)*tension;
    const cp2y=p2.y-(p3.y-p1.y)*tension;
    d+=' C'+cp1x.toFixed(1)+','+cp1y.toFixed(1)+' '+cp2x.toFixed(1)+','+cp2y.toFixed(1)+' '+p2.x.toFixed(1)+','+p2.y.toFixed(1);
  }
  return d;
}

function chartTooltipHTML(label,val){
  return `<div class="tt-date">${label}</div><div class="tt-val">${rs(val)}</div>`;
}

function attachChartTooltips(containerId){
  const el=document.getElementById(containerId);
  if(!el) return;
  let tip=el.querySelector('.chart-tooltip');
  if(!tip){
    tip=document.createElement('div');
    tip.className='chart-tooltip';
    el.appendChild(tip);
  }
  const svg=el.querySelector('svg');
  if(!svg) return;
  const vb=svg.getAttribute('viewBox');
  const vbParts=vb?vb.split(/\s+/):[700,200];
  const vbW=parseFloat(vbParts[2])||700;
  const vbH=parseFloat(vbParts[3])||200;
  const circles=svg.querySelectorAll('circle');
  circles.forEach(c=>{
    c.addEventListener('mouseenter',function(e){
      const label=this.getAttribute('data-label')||'';
      const val=parseInt(this.getAttribute('data-val'))||0;
      tip.innerHTML=chartTooltipHTML(label,val);
      tip.classList.add('show');
      const rect=el.getBoundingClientRect();
      const cx=parseFloat(this.getAttribute('cx'));
      const cy=parseFloat(this.getAttribute('cy'));
      const svgRect=svg.getBoundingClientRect();
      const scalex=svgRect.width/vbW;
      const scaley=svgRect.height/vbH;
      let left=cx*scalex-tip.offsetWidth/2;
      let top=cy*scaley-tip.offsetHeight-14;
      if(left<0) left=4;
      if(left+tip.offsetWidth>rect.width) left=rect.width-tip.offsetWidth-4;
      if(top<0) top=cy*scaley+14;
      tip.style.left=left+'px';
      tip.style.top=top+'px';
    });
    c.addEventListener('mouseleave',function(){
      tip.classList.remove('show');
    });
  });
}

function dashChangeMonth(val){
  window.dashPeriod=val;   // remember the chosen period across re-renders / live updates
  const now=new Date();
  const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let filterLabel='This Month';
  let filteredSales=[];
  const allSales=(store.sales||[]).filter(s=>!s.refunded);

  function parseDate(s){
    const parts=s.date.split(/[\s/-]/);
    return new Date(parts[2]+'-'+parts[1]+'-'+parts[0]);
  }

  if(val==='today'){
    filterLabel='Today';
    filteredSales=allSales.filter(s=>{
      const d=parseDate(s);
      return d.toDateString()===now.toDateString();
    });
  } else if(val==='3days'){
    filterLabel='Last 3 Days';
    const cutoff=new Date(now);
    cutoff.setDate(now.getDate()-2);
    cutoff.setHours(0,0,0,0);
    filteredSales=allSales.filter(s=>{
      const d=parseDate(s);
      return d>=cutoff;
    });
  } else if(val==='week'){
    filterLabel='This Week';
    const dayOfWeek=now.getDay();
    const weekStart=new Date(now);
    weekStart.setDate(now.getDate()-dayOfWeek);
    weekStart.setHours(0,0,0,0);
    filteredSales=allSales.filter(s=>{
      const d=parseDate(s);
      return d>=weekStart;
    });
  } else if(val==='this'){
    filterLabel='This Month';
    filteredSales=allSales.filter(s=>{
      const d=parseDate(s);
      return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    });
  } else if(val==='last'){
    filterLabel='Last Month';
    const lm=new Date(now.getFullYear(),now.getMonth()-1,1);
    filteredSales=allSales.filter(s=>{
      const d=parseDate(s);
      return d.getMonth()===lm.getMonth()&&d.getFullYear()===lm.getFullYear();
    });
  } else if(val==='3'||val==='6'){
    const months=parseInt(val);
    filterLabel='Last '+months+' Months';
    const cutoff=new Date(now.getFullYear(),now.getMonth()-months,1);
    filteredSales=allSales.filter(s=>{
      const d=parseDate(s);
      return d>=cutoff;
    });
  } else {
    filterLabel='All Time';
    filteredSales=allSales;
  }

  const total=filteredSales.reduce((a,s)=>a+s.total,0);
  document.querySelector('.dash-sale-amount').textContent=rs(total);

  let chartHTML='';
  const chartW=700,chartH=200,padL=50,padR=20,padT=10,padB=40;
  const plotW=chartW-padL-padR,plotH=chartH-padT-padB;
  const gradId='dashGrad_'+Date.now();

  function makeChart(pts,xLabelsArr,maxSale){
    const svgPts=pts.map((p,i)=>{
      const x=padL+(i/(pts.length-1||1))*plotW;
      const y=padT+plotH-(p.val/maxSale)*plotH;
      return {x,y,val:p.val,label:p.label};
    });
    const pathD=smoothPath(svgPts);
    const areaD=pathD+' L'+svgPts[svgPts.length-1].x.toFixed(1)+','+(padT+plotH)+' L'+svgPts[0].x.toFixed(1)+','+(padT+plotH)+' Z';
    const yT=chartTicks(maxSale);
    const yLines=yT.ticks.map(v=>{
      const y=padT+plotH-(v/maxSale)*plotH;
      return `<line x1="${padL}" y1="${y}" x2="${chartW-padR}" y2="${y}" stroke="#f0f0f0" stroke-width="1"/>
              <text x="${padL-8}" y="${y+4}" text-anchor="end" fill="#aaa" font-size="11" font-weight="500">${chartFmt(v)}</text>`;
    }).join('');
    const xLab=xLabelsArr.map(p=>
      `<text x="${p.x}" y="${chartH-6}" text-anchor="middle" fill="#aaa" font-size="11" font-weight="500">${p.label}</text>`
    ).join('');
    return `<svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:200px">
      <defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(47,109,246,0.18)"/>
        <stop offset="100%" stop-color="rgba(47,109,246,0.01)"/>
      </linearGradient></defs>
      ${yLines}
      <path d="${areaD}" fill="url(#${gradId})"/>
      <path d="${pathD}" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${svgPts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="var(--blue)" stroke="#fff" stroke-width="2" data-label="${p.label}" data-val="${p.val}"/>`).join('')}
      ${xLab}
    </svg>`;
  }

  if(val==='today'){
    const hourlySales={};
    filteredSales.forEach(s=>{
      const timeParts=(s.time||'12:00').split(':');
      const h=parseInt(timeParts[0])||12;
      hourlySales[h]=(hourlySales[h]||0)+s.total;
    });
    const hours=[];
    for(let h=0;h<=23;h++){
      const ampm=h<12?'AM':'PM';
      const h12=h===0?12:h>12?h-12:h;
      hours.push({label:h12+' '+ampm,val:hourlySales[h]||0,hour:h});
    }
    const maxSale=Math.max(...hours.map(h=>h.val),1);
    if(hours.some(h=>h.val>0)){
      const xLabelsArr=hours.filter((_,i)=>i%4===0||i===hours.length-1).map(h=>{
        const x=padL+(h.hour/(hours.length-1||1))*plotW;
        return {x,label:h.label};
      });
      chartHTML=makeChart(hours,xLabelsArr,maxSale);
    } else {
      chartHTML=`<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#ccc;font-size:14px">
        <div style="text-align:center"><div style="font-size:40px;margin-bottom:8px">📊</div>No sales today</div></div>`;
    }
  } else if(val==='3days'||val==='week'){
    const days=val==='3days'?3:7;
    const dayLabels=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dailySales={};
    const dayDates=[];
    for(let i=days-1;i>=0;i--){
      const d=new Date(now);
      d.setDate(now.getDate()-i);
      const key=d.toDateString();
      dailySales[key]=0;
      dayDates.push({key,label:dayLabels[d.getDay()]+' '+d.getDate(),date:d});
    }
    filteredSales.forEach(s=>{
      const d=parseDate(s);
      const key=d.toDateString();
      if(dailySales[key]!==undefined) dailySales[key]+=s.total;
    });
    const points=dayDates.map(dd=>({label:dd.label,val:dailySales[dd.key]||0}));
    const maxSale=Math.max(...points.map(p=>p.val),1);
    if(points.some(p=>p.val>0)){
      const xLabelsArr=points.map((p,i)=>{
        const x=padL+(i/(points.length-1||1))*plotW;
        return {x,label:p.label};
      });
      chartHTML=makeChart(points,xLabelsArr,maxSale);
    } else {
      chartHTML=`<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#ccc;font-size:14px">
        <div style="text-align:center"><div style="font-size:40px;margin-bottom:8px">📊</div>No sales found</div></div>`;
    }
  } else {
    const dailySales={};
    filteredSales.forEach(s=>{
      const parts=s.date.split(/[\s/-]/);
      const day=parseInt(parts[0]);
      dailySales[day]=(dailySales[day]||0)+s.total;
    });
    const daysInMonth=30;
    const chartPoints=[];
    for(let d=1;d<=daysInMonth;d++){
      chartPoints.push({day:d,label:d+'',val:dailySales[d]||0});
    }
    const maxSale=Math.max(...chartPoints.map(p=>p.val),1);
    if(chartPoints.some(p=>p.val>0)){
      const xLabelsArr=chartPoints.filter((p,i)=>i%Math.max(1,Math.floor(chartPoints.length/8))===0||p.day===daysInMonth).map(p=>{
        const x=padL+((p.day-1)/(chartPoints.length-1||1))*plotW;
        return {x,label:p.day+''};
      });
      chartHTML=makeChart(chartPoints,xLabelsArr,maxSale);
    } else {
      chartHTML=`<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#ccc;font-size:14px">
        <div style="text-align:center"><div style="font-size:40px;margin-bottom:8px">📊</div>No sales found</div></div>`;
    }
  }
  document.getElementById('dashChart').innerHTML=chartHTML;
  attachChartTooltips('dashChart');
}

function dashOpenReport(type){
  if(type==='sale')repSel='Sale';
  else if(type==='alltrans')repSel='All Transactions';
  else if(type==='daybook')repSel='Day book';
  else if(type==='partystatement')repSel='Party Statement';
  else repSel='Sale';
  nav('reports');
}

function dashSearch(q){
  if(!q)return;
  const ql=q.toLowerCase();
  const matchedSales=(store.sales||[]).filter(s=>s.party.toLowerCase().includes(ql)||s.no.toLowerCase().includes(ql));
  if(matchedSales.length){
    showInvoiceView(matchedSales[matchedSales.length-1]);
  }
}

function dashMoreMenu(ev){
  ev.stopPropagation();
  const existing=document.getElementById('dashMoreDrop');
  if(existing){existing.remove();return;}
  const rect=ev.target.getBoundingClientRect();
  const drop=document.createElement('div');
  drop.id='dashMoreDrop';
  drop.style.cssText=`position:fixed;top:${rect.bottom+4}px;right:${window.innerWidth-rect.right}px;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.15);padding:6px 0;z-index:999;min-width:180px`;
  drop.innerHTML=`
    <div style="padding:10px 16px;cursor:pointer;font-size:13px;font-weight:600" onclick="nav('reports');this.closest('#dashMoreDrop').remove()">📊 Reports</div>
    <div style="padding:10px 16px;cursor:pointer;font-size:13px;font-weight:600" onclick="nav('settings');this.closest('#dashMoreDrop').remove()">⚙ Settings</div>
    <div style="padding:10px 16px;cursor:pointer;font-size:13px;font-weight:600" onclick="nav('items');this.closest('#dashMoreDrop').remove()">📦 Items</div>
    <div style="padding:10px 16px;cursor:pointer;font-size:13px;font-weight:600" onclick="nav('parties');this.closest('#dashMoreDrop').remove()">👥 Parties</div>
  `;
  document.body.appendChild(drop);
  document.addEventListener('click',function h(){drop.remove();document.removeEventListener('click',h);},{once:true});
}

/* ============ HOME (FIRST SALE) ============ */
let homeRows=[];
function vHome(){
  homeRows=[{item:'',qty:1,price:0}];
  content.innerHTML=`
  <div class="home-wrap">
    <div class="home-left">
      <div class="home-scroll">
        <h1>Enter details to make your first Sale 🚀</h1>
        <div class="lead">First sale is made in less than a minute</div>
        <div class="hl-divider"></div>
        <div class="sec-row">
          <div style="flex:1">
            <div class="sec-h"><span class="cir">📄</span> Invoice Details :</div>
            <div class="kv"><div class="k">Invoice Number : ${String(store.counters.sale).padStart(2,'0')}</div></div>
            <div class="kv"><div class="k">Invoice Date : ${dispDate()}</div></div>
          </div>
          <div style="flex:1">
            <div class="sec-h"><span class="cir">👤</span> Customer Name :</div>
            <div class="cust-field"><label>Customer Name<b>*</b></label><input id="h_cust" oninput="hPreview()"></div>
            <div class="cust-field" style="margin-top:12px"><label>Customer Phone Number</label>
              <div class="phone-in" style="max-width:260px"><span class="cc">+92</span><input id="h_phone" placeholder="Enter Number" oninput="hPreview()"></div></div>
          </div>
        </div>
        <div class="sec-h"><span class="cir">📦</span> Items :</div>
        <table class="home-items"><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Price</th><th class="right">Amount</th><th></th></tr></thead>
          <tbody id="h_rows"></tbody></table>
        <div class="add-sample" onclick="addHomeRow()" style="margin-top:10px">＋ Add Item Row</div>
        <div class="sec-h"><span class="cir">🛡️</span> Invoice Calculation :</div>
        <div class="calc-row"><div class="lab">Received from Customer</div>
          <div class="rs-input"><span class="rs">Rs</span><input id="h_recv" value="0" oninput="recalcHome()"></div></div>
        <div class="balance-bar" id="h_balbar"><span>Balance Due</span><span class="amt" id="h_bal">Rs 0</span></div>
      </div>
      <div class="home-bottom">
        <div class="home-total"><span>Total Amount (${(store.settings&&store.settings.currency)||'Rs'})</span><b id="h_total">0</b></div>
        <button class="create-btn" onclick="quickSale()" style="margin:10px 0 0">🧾 Save Invoice &amp; Payment</button>
      </div>
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
        <div class="inv-meta"><div><b>Customer Name</b><br><span class="muted" id="hp_cust">Enter Customer Name</span><br><span class="muted" id="hp_phone"></span></div>
          <div class="r"><b style="color:#333">Invoice Details</b><br>Invoice No. #${String(store.counters.sale).padStart(2,'0')}<br>Date : ${dispDate()}</div></div>
        <table class="pinv"><thead><tr><th>#</th><th>Item name</th><th>Qty</th><th>Price/ Unit</th><th>Amt</th></tr></thead>
          <tbody id="hp_rows"></tbody></table>
        <div class="inv-bottom"><div class="inv-words"><b>Amount In Words -</b><br><span class="muted" id="hp_words">Zero Rupees only</span></div>
          <div class="inv-tot"><div class="tr"><span>Sub Total</span><span id="hp_sub">Rs 0</span></div>
            <div class="tr hl"><span>Total</span><span id="hp_total">Rs 0</span></div>
            <div class="tr"><span>Received</span><span id="hp_recv">Rs 0</span></div>
            <div class="tr"><span><b>Balance Due</b></span><span id="hp_bal">Rs 0</span></div></div></div>
      </div>
    </div>
  </div>`;
  renderHomeRows(); recalcHome();
}
function renderHomeRows(){
  document.getElementById('h_rows').innerHTML=homeRows.map((r,i)=>`<tr>
    <td>${i+1}</td>
    <td class="item-cell"><input id="hItem${i}" value="${r.item}" placeholder="Item name" oninput="setHome(${i},'item',this.value);showHomeDrop(${i})" onfocus="showHomeDrop(${i})" autocomplete="off">
    <div class="item-dropdown" id="hDrop${i}">${renderHomeDropList()}</div></td>
    <td><input type="number" value="${r.qty}" style="width:64px" onfocus="clearZero(this)" oninput="setHome(${i},'qty',this.value)"></td>
    <td><input type="number" value="${r.price}" style="width:90px" onfocus="clearZero(this)" oninput="setHome(${i},'price',this.value)"></td>
    <td class="right hamt">${rs(r.qty*r.price)}</td>
    <td>${homeRows.length>1?`<span class="delx" onclick="delHomeRow(${i})">✕</span>`:''}</td></tr>`).join('');
}
function renderHomeDropList(){
  if(!store.items.length) return '<div class="item-drop-empty">No items saved</div>';
  return store.items.map(it=>`<div class="item-drop-row" onclick="pickHomeItem(this)" data-name="${it.name}" data-price="${it.price}">
    <div class="idr-left"><span class="idr-name">${it.name}</span><span class="idr-cat">${it.cat||'General'}</span></div>
    <div class="idr-right"><span class="idr-price">${rs(it.price)}</span><span class="idr-code">${it.code||''}</span></div></div>`).join('');
}
function showHomeDrop(i){
  const drop=document.getElementById('hDrop'+i); if(!drop)return;
  drop.innerHTML=renderHomeDropList(); drop.classList.add('show');
  const q=(document.getElementById('hItem'+i).value||'').toLowerCase();
  if(q){ drop.querySelectorAll('.item-drop-row').forEach(r=>{ r.style.display=r.textContent.toLowerCase().includes(q)?'':'none'; }); }
}
function pickHomeItem(el){
  const name=el.dataset.name, price=+el.dataset.price;
  const tr=el.closest('tr'), idx=[...document.querySelectorAll('#h_rows tr')].indexOf(tr);
  if(idx<0)return;
  homeRows[idx]={item:name,qty:homeRows[idx].qty||1,price};
  tr.querySelector('input[type=number][style*="64"]').value=homeRows[idx].qty;
  tr.querySelector('input[type=number][style*="90"]').value=price;
  document.getElementById('hItem'+idx).value=name;
  el.closest('.item-dropdown').classList.remove('show');
  recalcHome();
}
function addHomeRow(){ homeRows.push({item:'',qty:1,price:0}); renderHomeRows(); recalcHome(); }
function delHomeRow(i){ homeRows.splice(i,1); renderHomeRows(); recalcHome(); }
function setHome(i,f,v){
  homeRows[i][f]= f==='item'?v:(+v||0);
  if(f==='item'){ const it=store.items.find(x=>x.name===v); if(it){ homeRows[i].price=it.price; renderHomeRows(); } }
  recalcHome();
}
function homeTotal(){ return homeRows.reduce((s,r)=>s+r.qty*r.price,0); }
function recalcHome(){
  document.querySelectorAll('#h_rows tr').forEach((tr,i)=>{ const r=homeRows[i]; if(r){ const c=tr.querySelector('.hamt'); if(c)c.textContent=rs(r.qty*r.price); } });
  const total=homeTotal(), recv=pf('h_recv'), bal=total-recv;
  document.getElementById('h_total').textContent=Number(total).toLocaleString('en-IN');
  const balbar=document.getElementById('h_balbar'), balEl=document.getElementById('h_bal');
  if(bal<0){ balbar.style.background='#dfeee4'; balEl.innerHTML='<span style="color:#1aa260">Return Rs '+Math.abs(bal)+'</span>'; }
  else { balbar.style.background='#fdeaec'; balEl.textContent=rs(bal); }
  hPreview();
}
function hLogoClick(){
  if(!hasPermission('edit','settings')){showNoAccess();return;}
  if(store.business.logo){ document.getElementById('h_logomenu').classList.toggle('show'); }
  else document.getElementById('h_logofile').click();
}
function hChangeLogo(){ if(!hasPermission('edit','settings')){showNoAccess();return;} document.getElementById('h_logomenu').classList.remove('show'); document.getElementById('h_logofile').value=''; document.getElementById('h_logofile').click(); }
function hDeleteLogo(){ if(!hasPermission('edit','settings')){showNoAccess();return;} store.business.logo=''; persist(); refreshView(); document.getElementById('h_logomenu').classList.remove('show');
  document.getElementById('h_logo').innerHTML='＋<br>Add Logo'; toast('Logo deleted'); }
function hLogo(inp){ if(!hasPermission('edit','settings')){showNoAccess();return;} const f=inp.files[0]; if(!f)return; const r=new FileReader();
  r.onload=e=>{ store.business.logo=e.target.result; persist(); refreshView(); document.getElementById('h_logo').innerHTML=`<img src="${e.target.result}">`; toast('Logo saved'); }; r.readAsDataURL(f); }
document.addEventListener('click',e=>{ const m=document.getElementById('h_logomenu'); if(m&&m.classList.contains('show')&&!e.target.closest('.hlogo-wrap')) m.classList.remove('show'); });
document.addEventListener('click',e=>{ const dd=document.getElementById('sharedItemDrop'); if(dd&&dd.style.display==='block'&&!e.target.closest('#sharedItemDrop')&&!e.target.closest('[onfocus*="Filter"]')) dd.style.display='none'; });
function hPreview(){
  const cust=document.getElementById('h_cust').value.trim(), phone=document.getElementById('h_phone')?document.getElementById('h_phone').value.trim():'';
  const total=homeTotal(), recv=pf('h_recv');
  document.getElementById('hp_cust').textContent=cust||'Enter Customer Name';
  document.getElementById('hp_phone').textContent=phone?'+92 '+phone:'';
  const rws=homeRows.filter(r=>r.item||r.price);
  document.getElementById('hp_rows').innerHTML = rws.length
    ? rws.map((r,i)=>`<tr><td>${i+1}</td><td>${r.item||'Item'}</td><td>${r.qty}</td><td>${rs(r.price)}</td><td>${rs(r.qty*r.price)}</td></tr>`).join('')
      + `<tr><td></td><td><b>Total</b></td><td>${rws.reduce((s,r)=>s+r.qty,0)}</td><td></td><td><b>${rs(total)}</b></td></tr>`
    : `<tr><td colspan="5" style="text-align:center;color:#bbb">Add items</td></tr>`;
  document.getElementById('hp_sub').textContent=rs(total);
  document.getElementById('hp_total').textContent=rs(total);
  document.getElementById('hp_recv').textContent=rs(recv);
  document.getElementById('hp_bal').textContent = total-recv<0 ? 'Return '+rs(Math.abs(total-recv)) : rs(total-recv);
  document.getElementById('hp_words').textContent=words(total)+' Rupees only';
}
function quickSale(){
  if(!hasPermission('create','invoices')){showNoAccess();return;}
  const cust=document.getElementById('h_cust').value.trim(), phone=document.getElementById('h_phone').value.trim(), recv=pf('h_recv');
  if(!cust) return toast('Enter Customer Name');
  const rows=homeRows.filter(r=>r.item&&r.qty);
  const total=homeTotal();
  if(total<=0) return toast('Add at least one item with price');
  const saleId=id();
  const bPhone=store.currentUser&&store.currentUser.branchPhone?store.currentUser.branchPhone:'';
  const bCreator=store.currentUser&&store.currentUser.role==='branch'?store.currentUser.branchCode:'admin';
  const bCreatorName=store.currentUser?store.currentUser.name:'';
  store.sales.push({id:saleId,no:(store.settings.invPrefix||'')+String(store.counters.sale).padStart(2,'0'),party:cust,phone,date:dispDate(),rows,total,received:recv,mode:'Cash',branchPhone:bPhone,createdBy:bCreator,createdByName:bCreatorName});
  store.counters.sale++;
  rows.forEach(r=>{const it=store.items.find(x=>x.name===r.item); if(it)it.stock-=r.qty;});
  let p=store.parties.find(x=>x.name===cust);
  if(!p){ p={id:id(),name:cust,phone,type:'customer',balance:0}; store.parties.push(p); }
  p.balance += total-recv;
  store.payments.push({id:id(),saleId:saleId,dir:'in',party:cust,amount:recv,mode:'Cash',date:dispDate()});
  persist(); refreshView(); toast(recv>0?'Invoice + payment saved!':'Invoice created!');
  showInvoiceView(store.sales[store.sales.length-1]);
}
/* ===== INVOICE VIEW + PRINT ===== */
let viewInv=null;
function buildInvoiceHTML(s){
  const b=store.business, st=store.settings||{};
  const rows=(s.rows&&s.rows.length)?s.rows:[{item:'Sale',qty:1,price:s.total}];
  const lineAmt=r=>r.qty*r.price*(1-((r.disc||0)/100));
  const sub=rows.reduce((a,r)=>a+r.qty*r.price,0);
  const discTotal=sub-s.total;
  const invoicePhone=s.branchPhone||b.phone||'';
  const qrData=invoicePhone?('tel:'+invoicePhone.replace(/[^0-9+]/g,'')):encodeURIComponent(`Invoice ${s.no} | ${b.name||'My Company'} | Total ${rs(s.total)}`);
  const totalQty=rows.reduce((a,r)=>a+r.qty,0);
  return `<div class="print-invoice">
    <div class="pi-top">
      <div class="pi-logo">${b.logo?`<img src="${b.logo}">`:'LOGO'}</div>
      <div class="pi-co"><div class="pi-name">${b.name||'My Company'}</div>
        <div class="pi-sub">${b.address||''}</div><div class="pi-sub">Phone: ${invoicePhone||'-'}</div></div>
      <div class="pi-title">INVOICE</div>
    </div>
    <div class="pi-meta">
      <div><b>Customer Name</b><br>${s.party}<br>${s.phone?'+92 '+s.phone:''}</div>
      <div style="text-align:right"><b>Invoice No:</b> ${s.no}<br><b>Date:</b> ${s.date}</div>
    </div>
    <table class="pi-tbl"><thead><tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Discount</th><th class="r">Amount</th><th></th></tr></thead>
      <tbody>${rows.map((r,i)=>{
        const it=store.items.find(x=>x.name===r.item);
        const desc=it&&it.desc?`<div class="pi-item-desc">${it.desc}</div>`:'';
        const rDisc=r.qty*r.price*(r.disc||0)/100;
        return `<tr><td>${i+1}</td><td>${r.item}${desc}</td><td class="r">${r.qty}</td><td class="r">${rs(r.price)}</td><td class="r">${r.disc?r.disc+'% ('+rs(rDisc)+')':'-'}</td><td class="r">${rs(lineAmt(r))}</td><td class="pi-edit-cell"><span class="pi-row-pencil" onclick="editInvItem(${i})" title="Edit item">✏️</span></td></tr>`;
      }).join('')}</tbody></table>
    <div class="pi-bottom">
      <div class="pi-words"><b>Amount in words:</b><br>${words(s.total)} Rupees only
        ${st.showQR!==false?`<br><img class="pi-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${qrData}">`:''}</div>
      <div class="pi-tot">
        <div class="tr"><span>Sub Total</span><span>${rs(sub)}</span></div>
        ${discTotal>0?`<div class="tr" style="color:var(--red)"><span>Discount</span><span>-${rs(discTotal)}</span></div>`:''}
        <div class="tr g"><span>Total (${totalQty} items)</span><span>${rs(s.total)}</span></div>
        <div class="tr"><span>Amount Received</span><span>${rs(s.received)}</span></div>
        <div class="tr"><span><b>${s.total-s.received<0?'Return Amount':'Balance Due'}</b></span><span><b style="color:${s.total-s.received>0?'var(--red)':'#27ae60'}">${rs(Math.abs(s.total-s.received))}</b></span></div>
      </div>
    </div>
    ${st.showTerms!==false?`<div class="pi-terms"><b>Terms &amp; Conditions:</b> ${st.terms||'Thanks for doing business with us!'}</div>`:''}
    <div class="pi-barcode" style="text-align:center;margin-top:12px"><svg class="inv-barcode-svg" data-code="${s.no}"></svg>
      <div style="font-size:11px;color:#888;margin-top:4px">${invoicePhone?'Scan QR to call: '+invoicePhone:''}</div></div>
    ${st.showSign!==false?`<div class="pi-sign">For ${b.name||'My Company'}<br><br>Authorised Signatory</div>`:''}
  </div>`;
}
function editInvItem(idx){
  const s=viewInv; if(!s||!s.rows||!s.rows[idx])return;
  const r=s.rows[idx];
  const items=store.items.map(i=>`<option value="${i.id}" ${i.name===r.item?'selected':''}>${i.name} - ${rs(i.price)} (Stock: ${i.stock||0})</option>`).join('');
  formModal('Edit Item',`
    <div class="field"><label>Product</label><select id="ei_prod" onchange="editInvItemChange()">${items}</select></div>
    <div class="field"><label>Quantity</label><input id="ei_qty" type="number" value="${r.qty}" min="1" oninput="editInvItemChange()"></div>
    <div class="field"><label>Price</label><input id="ei_price" type="number" value="${r.price}" oninput="editInvItemChange()"></div>
    <div class="field"><label>Discount %</label><input id="ei_disc" type="number" value="${r.disc||0}" min="0" max="100" oninput="editInvItemChange()"></div>
    <div id="ei_preview" style="margin-top:10px;padding:12px;background:#f5f6f8;border-radius:8px;font-size:13px"></div>`,
  ()=>{
    const newId=document.getElementById('ei_prod').value;
    const it=store.items.find(x=>x.id===newId);
    const qty=+document.getElementById('ei_qty').value||1;
    const price=+document.getElementById('ei_price').value||(it?it.price:0);
    const disc=+document.getElementById('ei_disc').value||0;
    s.rows[idx]={item:it?it.name:r.item,qty,price,disc};
    s.total=s.rows.reduce((a,x)=>a+x.qty*x.price*(1-((x.disc||0)/100)),0);
    if(s.received>s.total)s.received=s.total;
    persist();refreshView();
    document.getElementById('iv_body').innerHTML=buildInvoiceHTML(s);
    toast('Item updated');
  });
  editInvItemChange();
}
function editInvItemChange(){
  const id=document.getElementById('ei_prod').value;
  const it=store.items.find(x=>x.id===id);
  if(it){document.getElementById('ei_price').value=it.price;}
  const qty=+document.getElementById('ei_qty').value||1;
  const price=+document.getElementById('ei_price').value||0;
  const disc=+document.getElementById('ei_disc').value||0;
  const subtotal=qty*price;
  const discAmt=subtotal*disc/100;
  const total=subtotal-discAmt;
  document.getElementById('ei_preview').innerHTML=`
    <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Subtotal:</span><b>${rs(subtotal)}</b></div>
    ${disc>0?`<div style="display:flex;justify-content:space-between;color:var(--red);margin-bottom:6px"><span>Discount (${disc}%):</span><b>-${rs(discAmt)}</b></div>`:''}
    <div style="border-top:1px solid #ddd;padding-top:6px;display:flex;justify-content:space-between;font-size:14px"><b>Total:</b><b style="color:var(--blue)">${rs(total)}</b></div>
    <div style="margin-top:8px;height:6px;background:#e0e0e0;border-radius:3px;overflow:hidden"><div style="height:100%;background:var(--blue);width:${Math.min((total/(viewInv?.total||1))*100,100)}%;border-radius:3px;transition:.3s"></div></div>`;
}
function showInvoiceView(s){ viewInv=s; document.getElementById('iv_body').innerHTML=buildInvoiceHTML(s);
  const rf=document.getElementById('iv_refund'); if(rf){ rf.style.display=s.refunded?'none':''; if(s.refunded){ document.getElementById('iv_body').insertAdjacentHTML('afterbegin','<div class="refunded-stamp">REFUNDED</div>'); } }
  const sv=document.getElementById('iv_save'); if(sv){ sv.style.display=(s.id&&s.id.indexOf('tmp_')!==0)?'none':''; }
  showModal('invViewModal');
  renderInvoiceBarcodes(); }
function renderInvoiceBarcodes(){
  document.querySelectorAll('.inv-barcode-svg').forEach(function(svg){
    var code=svg.getAttribute('data-code')||'000000';
    try{ JsBarcode(svg,code,{format:'CODE128',width:1.5,height:40,displayValue:true,margin:0,fontSize:12}); }catch(e){ svg.innerHTML=''; }
  });
}
function toggleItemAction(idx,ev){
  ev.stopPropagation();
  const el=document.getElementById('itemAct'+idx);
  document.querySelectorAll('.pi-item-actions.show').forEach(x=>{if(x!==el)x.classList.remove('show');});
  if(el.classList.contains('show')){el.classList.remove('show');return;}
  const rect=ev.target.getBoundingClientRect();
  el.style.top=(rect.bottom+4)+'px';
  el.style.left=(rect.left-120)+'px';
  el.classList.add('show');
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.pi-row-actions'))document.querySelectorAll('.pi-item-actions.show').forEach(x=>x.classList.remove('show'));
});
function refundItem(idx){
  if(!hasPermission('edit','invoices')){showNoAccess();return;}
  const s=viewInv; if(!s||!s.rows||!s.rows[idx])return;
  const r=s.rows[idx];
  if(!confirm(`Refund ${r.item} (x${r.qty}) for ${rs(r.qty*r.price)}?`))return;
  const it=store.items.find(x=>x.name===r.item); if(it)it.stock+=r.qty;
  s.rows.splice(idx,1);
  s.total=s.rows.reduce((a,x)=>a+x.qty*x.price,0);
  if(s.total<=0){s.received=0;s.refunded=true;}
  else if(s.received>s.total)s.received=s.total;
  persist(); refreshView();
  document.getElementById('iv_body').innerHTML=buildInvoiceHTML(s);
  toast('Item refunded');logActivity('return','Refunded item from invoice');
}
function replaceItem(idx){
  if(!hasPermission('edit','invoices')){showNoAccess();return;}
  const s=viewInv; if(!s||!s.rows||!s.rows[idx])return;
  const oldRow=s.rows[idx];
  const itemList=store.items.filter(x=>x.stock>0);
  if(!itemList.length)return toast('No items in stock');
  formModal('Replace: '+oldRow.item,`
    <div class="field"><label>Select Replacement Item</label>
      <select id="replaceItemSel" onchange="updateReplacePreview(${idx})">${itemList.map(it=>`<option value="${it.id}" ${it.name===oldRow.item?'selected':''}>${it.name} - ${rs(it.price)} (Stock: ${it.stock})</option>`).join('')}</select></div>
    <div class="field"><label>Quantity</label><input id="replaceQty" type="number" value="${oldRow.qty}" min="1" oninput="updateReplacePreview(${idx})"></div>
    <div id="replacePreview" style="margin-top:10px;padding:10px;background:#f5f6f8;border-radius:8px;font-size:13px"></div>`,
  ()=>{
    const newId=document.getElementById('replaceItemSel').value;
    const newQty=+document.getElementById('replaceQty').value||1;
    const newItem=store.items.find(x=>x.id===newId);
    if(!newItem)return toast('Select item');
    const oldTotal=oldRow.qty*oldRow.price;
    const newTotal=newQty*newItem.price;
    const oldIt=store.items.find(x=>x.name===oldRow.item); if(oldIt)oldIt.stock+=oldRow.qty;
    newItem.stock-=newQty;
    s.rows[idx]={item:newItem.name,qty:newQty,price:newItem.price};
    s.total=s.rows.reduce((a,x)=>a+x.qty*x.price,0);
    if(s.received>s.total)s.received=s.total;
    persist(); refreshView();
    document.getElementById('iv_body').innerHTML=buildInvoiceHTML(s);
    closeModal('formModal');
    toast(newTotal>oldTotal?`New bill: +${rs(newTotal-oldTotal)}`:newTotal<oldTotal?`Refund: ${rs(oldTotal-newTotal)}`:'Same price - swapped');
  },'REPLACE');
  updateReplacePreview(idx);
}
function updateReplacePreview(idx){
  const s=viewInv; if(!s||!s.rows||!s.rows[idx])return;
  const oldRow=s.rows[idx];
  const sel=document.getElementById('replaceItemSel');
  const qty=document.getElementById('replaceQty');
  const preview=document.getElementById('replacePreview');
  if(!sel||!qty||!preview)return;
  const newItem=store.items.find(x=>x.id===sel.value);
  if(!newItem)return;
  const oldTotal=oldRow.qty*oldRow.price;
  const newTotal=(+qty.value||1)*newItem.price;
  const diff=newTotal-oldTotal;
  preview.innerHTML=`<b>Old:</b> ${oldRow.item} x${oldRow.qty} = ${rs(oldTotal)}<br>
    <b>New:</b> ${newItem.name} x${qty.value} = ${rs(newTotal)}<br>
    <b style="color:${diff>0?'var(--red)':diff<0?'#1aa260':'#333'}">${diff>0?'Extra to pay: +'+rs(diff):diff<0?'Refund: '+rs(Math.abs(diff)):'Same price'}</b>`;
}
function refundInvoice(){
  if(!hasPermission('edit','invoice')){showNoAccess();return;}
  const s=viewInv; if(s.refunded) return toast('Already refunded');
  if(!confirm(`Refund invoice ${s.no} for ${rs(s.total)}? Stock will be restored and money recorded as refund.`)) return;
  s.refunded=true;
  (s.rows||[]).forEach(r=>{ const it=store.items.find(x=>x.name===r.item); if(it) it.stock+=r.qty; });
  const p=store.parties.find(x=>x.name===s.party); if(p) p.balance-=(s.total-s.received);
  store.refunds.push({id:id(),no:s.no,party:s.party,date:dispDate(),amount:s.total,orig:s.no});
  if(s.received>0) store.payments.push({id:id(),dir:'out',party:s.party,amount:s.received,mode:'Cash',date:dispDate(),note:'Refund '+s.no});
  persist(); refreshView(); toast('Refund done — sales recalculated'); closeModal('invViewModal'); nav('sale');
}
function replaceInvoice(){
  if(!hasPermission('edit','invoices')){showNoAccess();return;}
  const s=viewInv;
  if(!confirm(`Start replacement for ${s.no}? Original stays, and a NEW slip opens for new products.`)) return;
  s.replaced=true;
  (s.rows||[]).forEach(r=>{ const it=store.items.find(x=>x.name===r.item); if(it) it.stock+=r.qty; });
  persist(); refreshView(); closeModal('invViewModal');
  replaceFor=s.party;
  openSale(); document.getElementById('pos_cust').value=s.party; toast('Add new products for replacement');
}
let replaceFor=null;
function trashCurrentInvoice(){
  if(!hasPermission('delete','invoices')){showNoAccess();return;}
  const s=viewInv;if(!s)return;
  if(!confirm('Move invoice '+s.no+' to Recycle Bin?'))return;
  const idx=store.sales.findIndex(x=>x.id===s.id);
  if(idx>=0){
    const removed=store.sales.splice(idx,1)[0];
    trashItem('sale',{refNo:removed.no,partyName:removed.party,txnType:'Sale',paymentType:removed.received>=removed.total?'Cash':'Credit',amount:removed.total,date:removed.date,originalData:removed});
  }
  persist();refreshView();closeModal('invViewModal');
  toast('Invoice moved to recycle bin');
  logActivity('return','Moved '+s.no+' to recycle bin');
}
function trashItemById(iid){
  if(!hasPermission('delete','item')){showNoAccess();return;}
  const it=store.items.find(x=>x.id===iid);if(!it)return;
  if(!confirm('Move "'+it.name+'" to Recycle Bin?'))return;
  const idx=store.items.findIndex(x=>x.id===iid);
  if(idx>=0){
    const removed=store.items.splice(idx,1)[0];
    trashItem('item',{refNo:removed.code||'',partyName:removed.name,txnType:'Item',paymentType:'-',amount:removed.price,date:dispDate(),originalData:removed});
  }
  persist();refreshView();
  toast('Item moved to recycle bin');
  logActivity('return','Moved item "'+it.name+'" to recycle bin');
}
function trashPartyById(pid){
  if(!hasPermission('delete','party')){showNoAccess();return;}
  const p=store.parties.find(x=>x.id===pid);if(!p)return;
  if(!confirm('Move "'+p.name+'" to Recycle Bin?'))return;
  const idx=store.parties.findIndex(x=>x.id===pid);
  if(idx>=0){
    const removed=store.parties.splice(idx,1)[0];
    trashItem('party',{refNo:removed.phone||'',partyName:removed.name,txnType:'Party',paymentType:'-',amount:removed.balance||0,date:dispDate(),originalData:removed});
  }
  persist();refreshView();
  toast('Party moved to recycle bin');
  logActivity('return','Moved party "'+p.name+'" to recycle bin');
}
function printInvoice(){
  const w=window.open('','_blank','width=820,height=900');
  w.document.write(`<html><head><title>Invoice ${viewInv.no}</title><style>${printCSS()}</style><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script></head><body>${buildInvoiceHTML(viewInv)}</body></html>`);
  w.document.close(); w.focus();
  setTimeout(()=>{
    w.document.querySelectorAll('.inv-barcode-svg').forEach(function(svg){
      var code=svg.getAttribute('data-code')||'000000';
      try{ JsBarcode(svg,code,{format:'CODE128',width:1.5,height:40,displayValue:true,margin:0,fontSize:12 }); }catch(e){}
    });
    w.print();
  },600);
}
function saveInvoiceFromPreview(){
  if(!viewInv)return;
  if(viewInv.id&&viewInv.id.indexOf('tmp_')!==0){toast('Invoice already saved');return;}
  const s=store.settings||{};
  const mode=viewInv._posMode||'Cash';
  const invNo=viewInv.no||(s.invPrefix||'INV-')+String(store.counters.sale).padStart(2,'0');
  const saleDate=s.addTime?viewInv.date+' '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):viewInv.date;
  const newId=id();
  const branchPhone4=store.currentUser&&store.currentUser.branchPhone?store.currentUser.branchPhone:'';
  const createdBy4=store.currentUser&&store.currentUser.role==='branch'?store.currentUser.branchCode:'admin';
  const createdByName4=store.currentUser?store.currentUser.name:'';
  const savedInv={
    id:newId,no:invNo,party:viewInv.party,phone:viewInv.phone||'',date:saleDate,
    rows:(viewInv.rows||[]).map(r=>({item:r.item,qty:r.qty,price:r.price,disc:r.disc||0})),
    total:viewInv.total,received:viewInv.received||0,mode:mode,
    status:viewInv.received>=viewInv.total?'paid':'unpaid',
    branchPhone:branchPhone4,createdBy:createdBy4,createdByName:createdByName4
  };
  store.sales.push(savedInv);
  store.counters.sale++;
  if(s.stockMaintain!==false){
    (savedInv.rows||[]).forEach(r=>{const it=store.items.find(x=>x.name===r.item);if(it&&typeof it.stock==='number')it.stock-=r.qty;});
  }
  let p=store.parties.find(x=>x.name===savedInv.party);
  if(!p){p={id:id(),name:savedInv.party,phone:savedInv.phone,type:'customer',balance:0};store.parties.push(p);}
  else if(savedInv.phone)p.phone=savedInv.phone;
  p.balance+=savedInv.total-savedInv.received;
  store.payments.push({id:id(),saleId:newId,dir:'in',party:savedInv.party,amount:savedInv.received,mode:mode,date:savedInv.date});
  persist();
  viewInv.id=savedInv.id;
  viewInv.no=savedInv.no;
  toast('Invoice saved! '+invNo);
  logActivity('invoice','Created invoice: '+invNo+' | '+savedInv.party+' | '+rs(savedInv.total));
}
function printAndSaveInvoice(){
  saveInvoiceFromPreview();
  printInvoice();
}
function downloadInvoice(){
  const w=window.open('','_blank'); w.document.write(`<html><head><title>Invoice ${viewInv.no}</title><style>${printCSS()}</style><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script></head><body>${buildInvoiceHTML(viewInv)}<script>setTimeout(()=>{document.querySelectorAll('.inv-barcode-svg').forEach(svg=>{try{JsBarcode(svg,svg.getAttribute('data-code')||'000000',{format:'CODE128',width:1.5,height:40,displayValue:true,margin:0,fontSize:12});}catch(e){}});window.print();},600)<\/script></body></html>`); w.document.close();
}
function printCSS(){ return `body{font-family:Arial,sans-serif;color:#222;padding:24px;margin:0}
.print-invoice{max-width:760px;margin:auto}
.pi-top{display:flex;align-items:center;gap:16px;border-bottom:2px solid #333;padding-bottom:14px;margin-bottom:14px}
.pi-logo{width:80px;height:80px;background:#8a8f96;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;overflow:hidden}
.pi-logo img{width:100%;height:100%;object-fit:cover}
.pi-co{flex:1}.pi-name{font-size:24px;font-weight:800}.pi-sub{color:#666;font-size:13px}
.pi-title{font-size:26px;font-weight:800;color:#333}
.pi-meta{display:flex;justify-content:space-between;font-size:14px;margin-bottom:16px}
.pi-tbl{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px}
.pi-tbl th{background:#eef0f3;padding:9px;text-align:left;border:1px solid #dcdfe5}
.pi-tbl td{padding:9px;border:1px solid #eef0f3}
.pi-tbl .r{text-align:right}
.pi-edit-cell,.pi-row-pencil{display:none}
.pi-bottom{display:flex;justify-content:space-between;gap:20px;font-size:14px}
.pi-qr{margin-top:10px;border:1px solid #eee}
.pi-tot{min-width:260px}
.pi-tot .tr{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee}
.pi-tot .tr.g{background:#eef0f3;font-weight:700;padding:7px 6px}
.pi-terms{margin-top:18px;font-size:13px;color:#444;border-top:1px solid #eee;padding-top:12px}
.pi-sign{text-align:right;margin-top:24px;font-size:13px;font-weight:600}`; }

/* ============ CREATE INVOICE MODAL ============ */
let posRows=[], posSelectedIdx=-1, posEditingId=null;
let posTabs=[], posActiveTab=0;
function posInitTab(){
  return {rows:[{code:'',item:'',qty:1,unit:'Pcs',price:0,disc:0,size:''},{code:'',item:'',qty:1,unit:'Pcs',price:0,disc:0,size:''},{code:'',item:'',qty:1,unit:'Pcs',price:0,disc:0,size:''}],cust:'',phone:'',recv:0,disc:0,payMode:'Cash',editingId:null,invNo:''};
}
function posRenderTabs(){
  const el=document.getElementById('posInvTabs');
  if(!el)return;
  const s=store.settings||{};
  const prefix=s.invPrefix||'INV-';
  el.innerHTML=posTabs.map((tab,i)=>{
    const num=tab.invNo||(prefix+String((store.counters.sale||1)+i).padStart(2,'0'));
    return `<div class="pos-inv-tab ${i===posActiveTab?'active':''}" onclick="posSwitchTab(${i})">#${num} <span class="tab-close" onclick="event.stopPropagation();posCloseTab(${i})">✕</span></div>`;
  }).join('')+`<div class="pos-inv-tab add-tab" onclick="posAddTab()">+ New Bill [Ctrl+T]</div>`;
}
function posAddTab(){
  posSaveTabState();
  posTabs.push(posInitTab());
  posActiveTab=posTabs.length-1;
  posRestoreTabState();
  posRenderTabs();
}
function posSwitchTab(i){
  posSaveTabState();
  posActiveTab=i;
  posRestoreTabState();
  posRenderTabs();
}
function posCloseTab(i){
  if(posTabs.length<=1){closeModal('saleModal');return;}
  posTabs.splice(i,1);
  if(posActiveTab>=posTabs.length)posActiveTab=posTabs.length-1;
  posRestoreTabState();
  posRenderTabs();
}
function posSaveTabState(){
  if(!posTabs[posActiveTab])return;
  const t=posTabs[posActiveTab];
  t.rows=JSON.parse(JSON.stringify(posRows));
  t.cust=(document.getElementById('pos_cust')?.value)||'';
  t.phone=(document.getElementById('pos_phone')?.value)||'';
  t.recv=+(document.getElementById('pos_recv')?.value)||0;
  t.disc=+(document.getElementById('pos_disc')?.value)||0;
  t.payMode=(document.getElementById('pos_paymode')?.value)||'Cash';
}
function posRestoreTabState(){
  const t=posTabs[posActiveTab];
  if(!t)return;
  posRows=JSON.parse(JSON.stringify(t.rows));
  posEditingId=t.editingId;
  posSelectedIdx=-1;
  const custEl=document.getElementById('pos_cust');if(custEl)custEl.value=t.cust;
  const phoneEl=document.getElementById('pos_phone');if(phoneEl)phoneEl.value=t.phone;
  const recvEl=document.getElementById('pos_recv');if(recvEl)recvEl.value=t.recv;
  const discEl=document.getElementById('pos_disc');if(discEl)discEl.value=t.disc||0;
  const payEl=document.getElementById('pos_paymode');if(payEl)payEl.value=t.payMode;
  const dateEl=document.getElementById('pos_inv_date');if(dateEl)dateEl.textContent=dispDate();
  document.getElementById('posSearchItem').value='';
  posRenderRows();
  posCalcTotal();
}
function openSale(){
  if(!hasPermission('create','invoices')){showNoAccess();return;}
  const s=store.settings||{};
  if(!posTabs.length||posActiveTab>=posTabs.length){
    const newTab=posInitTab();
    const invNo=(s.invPrefix||'INV-')+String(store.counters.sale).padStart(2,'0');
    newTab.invNo=invNo;
    newTab.payMode=s.cashSale!==false?'Cash':'Credit';
    posTabs.push(newTab);
    posActiveTab=posTabs.length-1;
  }else{
    posSaveTabState();
    const newTab=posInitTab();
    const invNo=(s.invPrefix||'INV-')+String(store.counters.sale+posTabs.length).padStart(2,'0');
    newTab.invNo=invNo;
    newTab.payMode=s.cashSale!==false?'Cash':'Credit';
    posTabs.push(newTab);
    posActiveTab=posTabs.length-1;
  }
  posRestoreTabState();
  posRenderTabs();
  showModal('saleModal');
  applyPosSettings();
  logActivity('invoice','Opened new invoice creator');
}
function openSaleEdit(sid){
  if(!hasPermission('edit','invoices')){showNoAccess();return;}
  const s=store.settings||{};
  const sale=store.sales.find(x=>x.id===sid);if(!sale)return;
  const editTab=posInitTab();
  editTab.editingId=sid;
  editTab.rows=(sale.rows||[]).map(r=>({code:r.code||'',item:r.item,qty:r.qty,unit:r.unit||'Pcs',price:r.price,disc:r.disc||0,size:r.size||''}));
  if(!editTab.rows.length)editTab.rows=[{code:'',item:'',qty:1,unit:'Pcs',price:0,disc:0,size:''}];
  editTab.cust=sale.party||'';
  editTab.phone=sale.phone||'';
  editTab.recv=sale.received||0;
  editTab.payMode=sale.total===sale.received?'Cash':'Credit';
  editTab.invNo=sale.no;
  posTabs.push(editTab);
  posActiveTab=posTabs.length-1;
  posRestoreTabState();
  posRenderTabs();
  showModal('saleModal');
  applyPosSettings();
  logActivity('invoice','Opened invoice: '+sale.no+' for editing');
}
function posAddRow(){
  posRows.push({code:'',item:'',qty:1,unit:'Pcs',price:0,disc:0,size:''});
  posRenderRows();
}
function posRemoveRow(i){
  posRows.splice(i,1);
  posRenderRows();
  posCalcTotal();
}
function clearZero(el){if(el.value==='0')el.value='';}
function posRenderRows(){
  const tbody=document.getElementById('pos_rows');
  const s=store.settings||{};
  tbody.innerHTML='';
  posRows.forEach((r,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${i+1}</td>
      <td class="pos-td-code"><input id="posCode${i}" value="${r.code||''}" oninput="posSetRow(${i},'code',this.value)" autocomplete="off"></td>
      <td class="pos-td-name"><input id="posItem${i}" placeholder="Item name" value="${r.item||''}" oninput="posSetRow(${i},'item',this.value);posShowSearch(${i})" onfocus="posShowSearch(${i})" autocomplete="off">
        <div class="pos-item-desc" id="posDescRow${i}" style="font-size:11px;color:#888;margin-top:3px;line-height:1.3;${r.desc?'':'display:none'}">${r.desc||''}</div>
        <div class="pos-item-drop" id="posDrop${i}"></div></td>
      <td><input type="number" id="posQty${i}" value="${r.qty||1}" onfocus="clearZero(this)" oninput="posSetRow(${i},'qty',this.value)"></td>
      <td><select id="posUnit${i}" onchange="posSetRow(${i},'unit',this.value)"><option ${r.unit==='Pcs'?'selected':''}>Pcs</option><option ${r.unit==='Kg'?'selected':''}>Kg</option><option ${r.unit==='Mtr'?'selected':''}>Mtr</option><option ${r.unit==='Ltr'?'selected':''}>Ltr</option><option ${r.unit==='Box'?'selected':''}>Box</option><option ${r.unit==='Bag'?'selected':''}>Bag</option></select></td>
      <td><input type="number" id="posPrice${i}" value="${r.price||0}" onfocus="clearZero(this)" oninput="posSetRow(${i},'price',this.value)" ${store.currentUser&&store.currentUser.role==='cashier'?'readonly onclick="posPricePinGuard('+i+')" style="cursor:pointer;background:#f5f5f5"':''}></td>
      ${s.itemDiscount!==false?`<td><div class="pos-suffix-input"><input type="number" id="posDisc${i}" value="${r.disc||0}" onfocus="clearZero(this)" oninput="posSetRow(${i},'disc',this.value)"><span>%</span></div></td>`:`<input type="hidden" id="posDisc${i}" value="0">`}
      ${s.sizeField!==false?`<td><select id="posSize${i}" onchange="posSetRow(${i},'size',this.value)"><option value="" ${!r.size?'selected':''}>-</option><option ${r.size==='XS'?'selected':''}>XS</option><option ${r.size==='S'?'selected':''}>S</option><option ${r.size==='M'?'selected':''}>M</option><option ${r.size==='L'?'selected':''}>L</option><option ${r.size==='XL'?'selected':''}>XL</option><option ${r.size==='XXL'?'selected':''}>XXL</option><option ${r.size==='XXXL'?'selected':''}>XXXL</option></select></td>`:''}
      <td><span class="pos-del" onclick="posRemoveRow(${i})">✕</span></td>`;
    tbody.appendChild(tr);
  });
}
function posPricePinGuard(idx){
  posRequireManagerPin(function(){
    var inp=document.getElementById('posPrice'+idx);
    if(inp){inp.readOnly=false;inp.style.background='#fff';inp.focus();inp.select();}
  });
}
function posSetRow(i,f,v){
  if(!posRows[i])return;
  posRows[i][f]=['qty','price','disc'].includes(f)?(+v||0):v;
  if(f==='item')posShowSearch(i);
  if(f==='code'&&v&&v.length>=3){
    const it=store.items.find(x=>(x.code||'').toLowerCase()===v.toLowerCase());
    if(it){
      posPickItem(i,it.id);
      toast('Found: '+it.name);
    }
  }
  posCalcTotal();
}
function togglePosSettings(){
  const p=document.getElementById('posSettingsPanel');
  p.style.display=p.style.display==='none'?'block':'none';
  if(p.style.display==='block')posLoadSettings();
}
function posLoadSettings(){
  const s=store.settings||{};
  document.getElementById('posSetBillDisc').checked=s.posBillDisc!==false;
  document.getElementById('posSetBillTax').checked=!!s.posBillTax;
  document.getElementById('posSetFreeQty').checked=!!s.posFreeQty;
  document.getElementById('posSetLoyalty').checked=!!s.posLoyalty;
  document.getElementById('posSetRoundOff').checked=!!s.posRoundOff;
  document.querySelector('input[name="posPrimary"][value="'+(s.posPrimary||'print')+'"]').checked=true;
  document.querySelector('input[name="posPricing"][value="'+(s.posPricing||'without')+'"]').checked=true;
  document.getElementById('posSetCardPayment').checked=!!s.posCardPayment;
  document.getElementById('posSetQr').checked=!!s.posQr;
  document.getElementById('posSetBank').checked=!!s.posBank;
}
function posSaveSettings(){
  if(!store.settings)store.settings={};
  store.settings.posBillDisc=document.getElementById('posSetBillDisc').checked;
  store.settings.posBillTax=document.getElementById('posSetBillTax').checked;
  store.settings.posFreeQty=document.getElementById('posSetFreeQty').checked;
  store.settings.posLoyalty=document.getElementById('posSetLoyalty').checked;
  store.settings.posRoundOff=document.getElementById('posSetRoundOff').checked;
  store.settings.posPrimary=document.querySelector('input[name="posPrimary"]:checked').value;
  store.settings.posPricing=document.querySelector('input[name="posPricing"]:checked').value;
  store.settings.posCardPayment=document.getElementById('posSetCardPayment').checked;
  store.settings.posQr=document.getElementById('posSetQr').checked;
  store.settings.posBank=document.getElementById('posSetBank').checked;
  persist();
  applyPosSettings();
}
function applyPosSettings(){
  const s=store.settings||{};
  const bd=document.getElementById('posBtnBillDisc');
  if(bd)bd.style.display=s.posBillDisc===false?'none':'';
  const lo=document.getElementById('posBtnLoyalty');
  if(lo)lo.style.display=s.posLoyalty?'':'none';
  const pm=document.getElementById('pos_paymode');
  if(pm){
    let opts='<option>Cash</option>';
    if(s.posBank!==false)opts+='<option>Bank Transfer</option>';
    if(s.posQr!==false)opts+='<option>QR Code</option>';
    if(s.posCardPayment!==false)opts+='<option>Card Payment</option>';
    const cur=pm.value;
    pm.innerHTML=opts;
    if([...pm.options].some(o=>o.value===cur))pm.value=cur;
  }
  posCalcTotal();
}
function posCalcTotal(){
  const s=store.settings||{};
  let total=0,items=0,qty=0;
  posRows.forEach(r=>{if(r&&r.item){items++;qty+=r.qty;const discAmt=r.qty*r.price*(r.disc/100);total+=r.qty*r.price-discAmt;}});
  if(s.posBillTax!==false&&s.posPricing!=='with'){
    const taxRate=+(s.taxRate||0);
    const taxAmt=total*(taxRate/100);
    total+=taxAmt;
  }
  const flatDisc=+document.getElementById('pos_disc')?.value||0;
  total+=posAdditional-posBillDisc-posLoyalty-flatDisc;
  if(total<0)total=0;
  if(s.posRoundOff)total=Math.round(total);
  document.getElementById('pos_total').textContent=rs(total);
  document.getElementById('pos_qty').textContent=qty;
  document.getElementById('pos itemCount').textContent=items;
  const recv=+document.getElementById('pos_recv').value||0;
  const ret=recv>total?recv-total:0;
  document.getElementById('pos_return').textContent=rs(ret);
}
function posShowSearch(i){
  const drop=document.getElementById('posDrop'+i); if(!drop)return;
  const q=(document.getElementById('posItem'+i)?.value||'').toLowerCase();
  const items=q?store.items.filter(it=>it.name.toLowerCase().includes(q)||(it.code||'').toLowerCase().includes(q)):store.items;
  if(!items.length){drop.innerHTML='<div class="pos-drop-empty">No matching items found</div>';drop.classList.add('show');return;}
  drop.innerHTML=items.map(it=>{
    const stk=it.stock||0;
    const outOfStock=stk<=0;
    return `<div class="pos-drop-row ${outOfStock?'out-of-stock':''}" onclick="${outOfStock?'':'posPickItem('+i+',\''+it.id+'\')'}">
    <div class="pos-drop-left"><span class="pos-drop-name">${it.name}</span><span class="pos-drop-cat">${it.code||''} | ${it.cat||'General'}</span></div>
    <div class="pos-drop-right"><span class="pos-drop-stock ${outOfStock?'red':''}">${outOfStock?'Out of Stock':'Stock: '+stk}</span><span class="pos-drop-price">${rs(it.price)}</span></div></div>`;
  }).join('');
  drop.classList.add('show');
}
function posPickItem(i,iid){
  const it=store.items.find(x=>x.id===iid); if(!it)return;
  let unitShort='Pcs';
  if(it.unit){ const base=it.unit.split('|')[0]; const m=base.match(/\(([^)]+)\)/); unitShort=(m?m[1]:base.replace(/ \(.*/,''))||'Pcs'; }
  posRows[i]={code:it.code||'',item:it.name,qty:1,unit:unitShort,price:it.price,disc:0,size:it.size||'',desc:it.desc||''};
  document.getElementById('posCode'+i).value=it.code||'';
  document.getElementById('posItem'+i).value=it.name;
  document.getElementById('posQty'+i).value=1;
  const unitSel=document.getElementById('posUnit'+i);
  if(unitSel&&[...unitSel.options].some(o=>o.value===unitShort)){ unitSel.value=unitShort; }
  document.getElementById('posPrice'+i).value=it.price;
  document.getElementById('posDisc'+i).value=0;
  const sizeSel=document.getElementById('posSize'+i);
  if(sizeSel){ sizeSel.value=posRows[i].size||''; }
  const descEl=document.getElementById('posDescRow'+i);
  if(descEl){ descEl.textContent=it.desc||''; descEl.style.display=it.desc?'':'none'; }
  document.getElementById('posDrop'+i).classList.remove('show');
  posCalcTotal();
}
function posSearchCust(){
  const drop=document.getElementById('posCustDrop'); if(!drop)return;
  const q=(document.getElementById('pos_cust')?.value||'').toLowerCase();
  if(!q){drop.style.display='none';return;}
  const matches=store.parties.filter(p=>p.name.toLowerCase().includes(q)||(p.phone||'').includes(q));
  if(!matches.length){drop.style.display='none';return;}
  drop.innerHTML=matches.slice(0,10).map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f5f5f5" onmousedown="posPickCust('${p.id}')"><span style="font-weight:500;font-size:13px">${p.name}</span><span style="font-size:11px;color:#888">${p.phone||''} <span style="color:${p.balance>=0?'#27ae60':'#e74c3c'}">${rs(Math.abs(p.balance))}</span></span></div>`).join('');
  drop.style.display='block';
}
function posPickCust(pid){
  const p=store.parties.find(x=>x.id===pid); if(!p)return;
  document.getElementById('pos_cust').value=p.name;
  document.getElementById('pos_phone').value=p.phone||'';
  const drop=document.getElementById('posCustDrop'); if(drop)drop.style.display='none';
  const t=posTabs[posActiveTab]; if(t){t.cust=p.name;t.phone=p.phone||'';}
}
function posSearchItems(){
  const q=(document.getElementById('posSearchItem').value||'').toLowerCase();
  if(!q){document.querySelectorAll('.pos-item-drop').forEach(d=>d.classList.remove('show'));return;}
  const matches=store.items.filter(it=>it.name.toLowerCase().includes(q)||(it.code||'').toLowerCase().includes(q));
  document.querySelectorAll('.pos-item-drop').forEach(d=>d.classList.remove('show'));
  if(matches.length&&posRows.length){
    const lastIdx=posRows.length-1;
    if(posRows[lastIdx]&&posRows[lastIdx].item){posAddRow();}
    const drop=document.getElementById('posDrop'+(posRows.length-1));
    if(drop){
      drop.innerHTML=matches.map(it=>{
        const stk=it.stock||0;
        const outOfStock=stk<=0;
        return `<div class="pos-drop-row ${outOfStock?'out-of-stock':''}" onclick="${outOfStock?'':'posPickItem('+(posRows.length-1)+',\''+it.id+'\')'}">
        <div class="pos-drop-left"><span class="pos-drop-name">${it.name}</span><span class="pos-drop-cat">${it.code||''} | ${it.cat||'General'}</span></div>
        <div class="pos-drop-right"><span class="pos-drop-stock ${outOfStock?'red':''}">${outOfStock?'Out of Stock':'Stock: '+stk}</span><span class="pos-drop-price">${rs(it.price)}</span></div></div>`;
      }).join('');
      drop.classList.add('show');
    }
  }
}

// Barcode scanner detection
var _scannerKeys=[],_scannerTimer=null,_scannerDetected=false;
function setScannerUI(detected){
  var pairs=[['scannerDot','scannerLabel'],['nciScannerDot','nciScannerLabel']];
  pairs.forEach(function(p){
    var dot=document.getElementById(p[0]);
    var lbl=document.getElementById(p[1]);
    if(dot){dot.style.background=detected?'#27ae60':'#e74c3c';dot.style.boxShadow=detected?'0 0 8px rgba(39,174,96,0.6)':'0 0 6px rgba(231,76,60,0.5)';}
    if(lbl){lbl.textContent=detected?'Scanner: Connected':'Scanner: Not connected';lbl.style.color=detected?'#27ae60':'#888';}
  });
}
function scannerDetect(){
  var now=Date.now();
  _scannerKeys.push(now);
  _scannerKeys=_scannerKeys.filter(function(t){return now-t<1000;});
  if(_scannerKeys.length>=3){
    if(!_scannerDetected){_scannerDetected=true;setScannerUI(true);}
    _scannerKeys=[];
  }
  if(_scannerTimer)clearTimeout(_scannerTimer);
  _scannerTimer=setTimeout(function(){_scannerDetected=false;setScannerUI(false);},3000);
}
function posSearchKey(ev){
  if(ev.key!=='Enter')return;
  var q=(document.getElementById('posSearchItem').value||'').trim();
  if(!q)return;
  ev.preventDefault();
  document.getElementById('posSearchItem').value='';
  document.querySelectorAll('.pos-item-drop').forEach(function(d){d.classList.remove('show');});
  if(_scannerDetected){
    posBarcodeAutoAdd(q);
  }else{
    posBarcodeAutoAdd(q);
  }
}
function posBarcodeAutoAdd(code){
  if(!code)return;
  var it=store.items.find(function(x){return (x.code||'').toLowerCase()===code.toLowerCase();});
  if(!it)return;
  var targetIdx=-1;
  for(var i=0;i<posRows.length;i++){
    if(!posRows[i].item||posRows[i].item===''){targetIdx=i;break;}
  }
  if(targetIdx===-1){posAddRow();targetIdx=posRows.length-1;}
  posPickItem(targetIdx,it.id);
  posRows[targetIdx].qty=1;
  posRenderRows();
  posCalcTotal();
  toast('⚡ Added: '+it.name+' ('+it.code+')');
}
function nciBarcodeAutoAdd(code){
  if(!code)return;
  var it=store.items.find(function(x){return (x.code||'').toLowerCase()===code.toLowerCase();});
  if(!it)return;
  var targetIdx=-1;
  for(var i=0;i<nciRows.length;i++){
    if(!nciRows[i].item||nciRows[i].item===''){targetIdx=i;break;}
  }
  if(targetIdx===-1){nciAddRow();targetIdx=nciRows.length-1;}
  nciPickItem(targetIdx,it.id);
  nciRenderRows();nciCalc();
  toast('⚡ Added: '+it.name+' ('+it.code+')');
}

let posAdditional=0, posBillDisc=0, posLoyalty=0, posRemarksTxt='';

function posChangeQty(){
  if(posSelectedIdx<0||!posRows[posSelectedIdx])return toast('Select an item row first');
  formModal('Change Quantity',`<div class="field"><label>Quantity</label><input id="f_qty" type="number" value="${posRows[posSelectedIdx].qty}" min="1"></div>`,
  ()=>{ posRows[posSelectedIdx].qty=+document.getElementById('f_qty').value||1; posRenderRows(); posCalcTotal(); closeModal('formModal'); },'UPDATE');
}
function posItemDiscount(){
  if(posSelectedIdx<0||!posRows[posSelectedIdx])return toast('Select an item row first');
  formModal('Item Discount',`<div class="field"><label>Discount (Rs)</label><input id="f_disc" type="number" value="${posRows[posSelectedIdx].disc}" min="0"></div>`,
  ()=>{ posRows[posSelectedIdx].disc=+document.getElementById('f_disc').value||0; posRenderRows(); posCalcTotal(); closeModal('formModal'); },'UPDATE');
}
function posRemoveItem(){
  if(posSelectedIdx<0)return toast('Select an item row first');
  posRemoveRow(posSelectedIdx);
  posSelectedIdx=-1;
}
function posChangeUnit(){
  if(posSelectedIdx<0||!posRows[posSelectedIdx])return toast('Select an item row first');
  const units=['Pcs','Kg','Mtr','Ltr','Box','Bag','Set','Pair','Pack','Dozen'];
  formModal('Change Unit',`<div class="field"><label>Select Unit</label><select id="f_unit">${units.map(u=>`<option ${posRows[posSelectedIdx].unit===u?'selected':''}>${u}</option>`).join('')}</select></div>`,
  ()=>{ posRows[posSelectedIdx].unit=document.getElementById('f_unit').value; posRenderRows(); closeModal('formModal'); toast('Unit changed'); },'UPDATE');
}
function posAdditionalCharges(){
  formModal('Additional Charges',`<div class="field"><label>Charges (Rs)</label><input id="f_addchr" type="number" value="${posAdditional}" min="0"></div>`,
  ()=>{ posAdditional=+document.getElementById('f_addchr').value||0; posCalcTotal(); closeModal('formModal'); toast('Charges updated'); },'UPDATE');
}
function posBillDiscount(){
  formModal('Bill Discount',`<div class="field"><label>Discount (Rs)</label><input id="f_bdisc" type="number" value="${posBillDisc}" min="0"></div>`,
  ()=>{ posBillDisc=+document.getElementById('f_bdisc').value||0; posCalcTotal(); closeModal('formModal'); toast('Discount updated'); },'UPDATE');
}
function posLoyaltyPoints(){
  formModal('Loyalty Points',`<div class="field"><label>Points to use</label><input id="f_loyalty" type="number" value="${posLoyalty}" min="0"></div>
    <div style="font-size:12px;color:#888;margin-top:6px">1 Point = Re 1</div>`,
  ()=>{ posLoyalty=+document.getElementById('f_loyalty').value||0; posCalcTotal(); closeModal('formModal'); toast('Points updated'); },'UPDATE');
}
function posRemarks(){
  formModal('Remarks',`<div class="field"><label>Note</label><textarea id="f_remarks" rows="4" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;font-size:13px;resize:vertical">${posRemarksTxt}</textarea></div>`,
  ()=>{ posRemarksTxt=document.getElementById('f_remarks').value; closeModal('formModal'); toast('Remarks saved'); },'SAVE');
}
function posCreditPay(){
  formModal('Other / Credit Payment',`<div class="field"><label>Payment Mode</label><select id="f_cmode"><option>Cash</option><option>Bank Transfer</option><option>UPI</option><option>Card Payment</option><option>Credit</option></select></div>
    <div class="field"><label>Amount</label><input id="f_camt" type="number" value="0"></div>
    <div class="field"><label>Reference / Note</label><input id="f cref" placeholder="Transaction ID or note"></div>`,
  ()=>{ const mode=document.getElementById('f_cmode').value; const amt=+document.getElementById('f_camt').value||0;
    document.getElementById('pos_paymode').value=mode==='Credit'?'Credit':'Cash';
    document.getElementById('pos_recv').value=amt; posCalcTotal(); closeModal('formModal'); toast('Payment updated'); },'UPDATE');
}
function posReturnExchange(){
  const sales=[...store.sales].reverse();
  if(!sales.length)return toast('No invoices found');
  const list=sales.map(s=>`<div class="re-inv-item" onclick="reSelectInv('${s.id}')">
    <span class="re-inv-no">${s.no}</span>
    <span class="re-inv-party">${s.party}</span>
    <span class="re-inv-date">${s.date}</span>
    <span class="re-inv-total">${rs(s.total)}</span></div>`).join('');
  formModal('Return / Exchange',`
    <div class="re-header"><span>Invoice No</span><span>Party</span><span>Date</span><span>Total</span></div>
    <div class="re-list" id="reList">${list}</div>`,null,'');
}
let reSelectedInv=null;
function reSelectInv(sid){
  reSelectedInv=store.sales.find(s=>s.id===sid);if(!reSelectedInv)return;
  const rows=reSelectedInv.rows||[];
  const items=rows.map((r,i)=>{
    const returned=r.returned||0;
    const available=r.qty-returned;
    return `<div class="re-item-row">
      <span class="re-item-name">${r.item}</span>
      <span class="re-item-qty">Qty: ${r.qty}</span>
      <span class="re-item-price">${rs(r.price)}</span>
      <span class="re-item-avail">${available>0?available+' available':'Fully returned'}</span>
      ${available>0?`<div class="re-item-actions">
        <button class="re-btn return" onclick="reReturnType(${i},'return')">↩ Return</button>
        <button class="re-btn exchange" onclick="reReturnType(${i},'exchange')">🔄 Exchange</button>
      </div>`:''}</div>`;
  }).join('');
  document.getElementById('formBody').innerHTML=`
    <div class="re-inv-info"><b>${reSelectedInv.no}</b> - ${reSelectedInv.party} (${reSelectedInv.date})</div>
    <div class="re-items-list">${items||'<div class="ip-empty">No items in this invoice</div>'}</div>`;
}
function reReturnType(idx,type){
  const r=reSelectedInv.rows[idx];if(!r)return;
  const available=r.qty-(r.returned||0);
  if(available<=0)return toast('No items available');
  if(type==='return'){
    formModal('Return Item',`
      <div class="field"><label>Item: ${r.item}</label></div>
      <div class="field"><label>Available Qty: ${available}</label></div>
      <div class="field"><label>Return Qty</label><input id="re_retqty" type="number" value="1" min="1" max="${available}"></div>
      <div class="field"><label>Reason</label><select id="re_reason"><option>Defective</option><option>Wrong Item</option><option>Not Needed</option><option>Other</option></select></div>`,
    ()=>{
      const qty=+document.getElementById('re_retqty').value||0;
      if(qty<=0||qty>available)return toast('Invalid qty');
      r.returned=(r.returned||0)+qty;
      const it=store.items.find(x=>x.name===r.item);if(it)it.stock+=qty;
      reSelectedInv.total=reSelectedInv.rows.reduce((a,x)=>a+(x.qty-(x.returned||0))*x.price*(1-((x.disc||0)/100)),0);
      if(reSelectedInv.received>reSelectedInv.total)reSelectedInv.received=reSelectedInv.total;
      const refundAmt=qty*r.price*(1-((r.disc||0)/100));
      if(!store.refunds)store.refunds=[];
      store.refunds.push({id:id(),invNo:reSelectedInv.no,item:r.item,qty,type:'return',amount:refundAmt,date:dispDate(),reason:document.getElementById('re_reason').value});
      persist();refreshView();closeModal('formModal');
      reSelectInv(reSelectedInv.id);toast('Item returned - '+rs(refundAmt)+' credit');logActivity('return','Returned '+qty+'x '+r.item+' from '+reSelectedInv.no+' ('+rs(refundAmt)+')');
    },'RETURN');
  } else {
    const exchangeable=store.items.filter(x=>x.id!==reSelectedInv.rows[idx].item&&x.stock>0);
    if(!exchangeable.length)return toast('No exchangeable items');
    const opts=exchangeable.map(it=>`<option value="${it.id}">${it.name} - ${rs(it.price)} (Stock: ${it.stock})</option>`).join('');
    formModal('Exchange Item',`
      <div class="field"><label>Returning: ${r.item} (Qty: ${available})</label></div>
      <div class="field"><label>Exchange With</label><select id="re_exitem">${opts}</select></div>
      <div class="field"><label>Exchange Qty</label><input id="re_exqty" type="number" value="1" min="1"></div>`,
    ()=>{
      const newId=document.getElementById('re_exitem').value;
      const exQty=+document.getElementById('re_exqty').value||1;
      const newItem=store.items.find(x=>x.id===newId);
      if(!newItem)return toast('Select item');
      if(exQty>newItem.stock)return toast('Insufficient stock');
      r.returned=(r.returned||0)+exQty;
      const oldIt=store.items.find(x=>x.name===r.item);if(oldIt)oldIt.stock+=exQty;
      newItem.stock-=exQty;
      const oldAmt=exQty*r.price*(1-((r.disc||0)/100));
      const newAmt=exQty*newItem.price;
      posRows.push({code:newItem.code||'',item:newItem.name,qty:exQty,unit:newItem.unit?newItem.unit.split('|')[0]:'Pcs',price:newItem.price,disc:0,size:newItem.size||''});
      reSelectedInv.total=reSelectedInv.rows.reduce((a,x)=>a+(x.qty-(x.returned||0))*x.price*(1-((x.disc||0)/100)),0);
      if(!store.refunds)store.refunds=[];
      store.refunds.push({id:id(),invNo:reSelectedInv.no,item:r.item,qty:exQty,type:'exchange',exchangeItem:newItem.name,amount:newAmt-oldAmt,date:dispDate()});
      persist();refreshView();closeModal('formModal');posRenderRows();
      toast('Exchanged '+r.item+' → '+newItem.name);logActivity('exchange','Exchanged '+r.item+' → '+newItem.name+' from '+reSelectedInv.no);
    },'EXCHANGE');
  }
}
function posSaveBill(){
  const cust=document.getElementById('pos_cust').value.trim();
  if(!cust)return toast('Enter Customer Name');
  const phone=document.getElementById('pos_phone').value.trim();
  const rows=posRows.filter(r=>r&&r.item);
  if(!rows.length)return toast('Add at least one item');
  const s=store.settings||{};
  let total=0;
  if(s.posBillTax!==false&&s.posPricing!=='with'){const taxRate=+(s.taxRate||0);rows.forEach(r=>{const discAmt=r.qty*r.price*(r.disc/100);total+=r.qty*r.price-discAmt;});total+=total*(taxRate/100);}
  else{rows.forEach(r=>{const discAmt=r.qty*r.price*(r.disc/100);total+=r.qty*r.price-discAmt;});}
  total+=posAdditional-posBillDisc-posLoyalty-(+document.getElementById('pos_disc')?.value||0);
  if(total<0)total=0;
  if(s.posRoundOff)total=Math.round(total);
  let recv=+document.getElementById('pos_recv').value||0;
  const mode=document.getElementById('pos_paymode').value;
  if(mode!=='Credit'&&recv===0)recv=total;   // paid mode with no amount entered = full bill paid via that mode
  const isPaid=(mode==='Cash'&&recv>=total)||(recv>=total);
  const invNo=(s.invPrefix||'INV-')+String(store.counters.sale).padStart(2,'0');
  if(posEditingId){
    const old=store.sales.find(x=>x.id===posEditingId);
    if(old){
      if(s.stockMaintain!==false){
        (old.rows||[]).forEach(r=>{const it=store.items.find(x=>x.name===r.item);if(it&&typeof it.stock==='number')it.stock+=(r.qty-(r.returned||0));});
        rows.forEach(r=>{const it=store.items.find(x=>x.name===r.item);if(it&&typeof it.stock==='number')it.stock-=r.qty;});
      }
      let p=store.parties.find(x=>x.name===old.party);
      if(p)p.balance-=(old.total-old.received);
      p=store.parties.find(x=>x.name===cust);
      if(!p){p={id:id(),name:cust,phone:phone,type:'customer',balance:0};store.parties.push(p);}
      else if(phone)p.phone=phone;
      p.balance+=total-recv;
      Object.assign(old,{party:cust,phone,date:dispDate(),rows:rows.map(r=>({item:r.item,qty:r.qty,price:r.price,disc:r.disc||0})),total,received:recv,mode:mode,flatDisc:+document.getElementById('pos_disc')?.value||0,status:isPaid?'paid':'unpaid'});
      persist();refreshView();posCloseTab(posActiveTab);posEditingId=null;toast('Invoice updated');return;
    }
  }
  const saveDirect=(s.noPreview||s.posPrimary==='new');
  const branchPhone=store.currentUser&&store.currentUser.branchPhone?store.currentUser.branchPhone:'';
  const createdBy=store.currentUser&&store.currentUser.role==='branch'?store.currentUser.branchCode:'admin';
  const createdByName=store.currentUser?store.currentUser.name:'';
  if(saveDirect){
    const saleId=id();
    store.sales.push({id:saleId,no:invNo,party:cust,phone:phone,date:dispDate(),time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),rows:rows.map(r=>({item:r.item,qty:r.qty,price:r.price,disc:r.disc||0})),total,received:recv,mode:mode,flatDisc:+document.getElementById('pos_disc')?.value||0,status:isPaid?'paid':'unpaid',branchPhone:branchPhone,createdBy:createdBy,createdByName:createdByName});
    store.counters.sale++;
    if(s.stockMaintain!==false)rows.forEach(r=>{const it=store.items.find(x=>x.name===r.item);if(it&&typeof it.stock==='number')it.stock-=r.qty;});
    let p=store.parties.find(x=>x.name===cust);
    if(!p){p={id:id(),name:cust,phone:phone,type:'customer',balance:0};store.parties.push(p);}
    else if(phone)p.phone=phone;
    p.balance+=total-recv;
    store.payments.push({id:id(),saleId:saleId,dir:'in',party:cust,amount:recv,mode:mode,date:dispDate()});
    persist();
    if(s.posPrimary==='new'){
      toast('Invoice saved — new bill');
      logActivity('invoice','Created invoice: '+invNo+' | '+cust+' | '+rs(total));
      openSale();
    } else {
      refreshView();posCloseTab(posActiveTab);toast('Invoice saved');
    }
    return;
  }
  const tmpInv={id:'tmp_'+Date.now(),no:invNo,party:cust,phone:phone,date:dispDate(),rows:rows.map(r=>({item:r.item,qty:r.qty,price:r.price,disc:r.disc||0})),total,received:recv,status:isPaid?'paid':'unpaid',_posMode:mode};
  showInvoiceView(tmpInv);
  document.getElementById('iv_body').insertAdjacentHTML('beforeend',`<div style="padding:16px 24px;border-top:1px solid var(--line);display:flex;gap:10px;justify-content:flex-end">
    <button onclick="closeModal('invViewModal');posCloseTab(posActiveTab)" style="padding:10px 20px;border:1px solid var(--line);border-radius:8px;background:#fff;font-weight:600;cursor:pointer;font-size:13px">Cancel</button>
    <button onclick="confirmSaveAndPrint()" style="padding:10px 24px;border:0;border-radius:8px;background:#3bb54a;color:#fff;font-weight:700;cursor:pointer;font-size:13px">🖨 Print & Save</button>
  </div>`);
}
function confirmSaveAndPrint(){
  const s=store.settings||{};
  const cust=document.getElementById('pos_cust').value.trim();
  const phone=document.getElementById('pos_phone').value.trim();
  const rows=posRows.filter(r=>r&&r.item);
  if(!rows.length)return toast('Add at least one item');
  if(s.blockNewItem){
    const unknown=rows.find(r=>!store.items.find(it=>it.name===r.item));
    if(unknown)return toast('New items blocked in settings.');
  }
  if(s.blockNewParty&&!store.parties.find(p=>p.name===cust))return toast('New parties blocked in settings.');
  let total=0;
  if(s.posBillTax!==false&&s.posPricing!=='with'){const taxRate=+(s.taxRate||0);rows.forEach(r=>{const discAmt=r.qty*r.price*(r.disc/100);total+=r.qty*r.price-discAmt;});total+=total*(taxRate/100);}
  else{rows.forEach(r=>{const discAmt=r.qty*r.price*(r.disc/100);total+=r.qty*r.price-discAmt;});}
  total+=posAdditional-posBillDisc-posLoyalty-(+document.getElementById('pos_disc')?.value||0);
  if(total<0)total=0;
  if(s.posRoundOff)total=Math.round(total);
  if(s.negativeStock!==false){
    const negItem=rows.find(r=>{const it=store.items.find(x=>x.name===r.item);return it&&typeof it.stock==='number'&&(it.stock<=0||it.stock<r.qty);});
    if(negItem)return toast('"'+negItem.item+'" - Out of stock or insufficient quantity');
  }
  let recv=+document.getElementById('pos_recv').value||0;
  const mode=document.getElementById('pos_paymode').value;
  if(mode!=='Credit'&&recv===0)recv=total;   // paid mode with no amount entered = full bill paid via that mode
  const isPaid=(mode==='Cash'&&recv>=total)||(recv>=total);
  const invNo=(s.invPrefix||'INV-')+String(store.counters.sale).padStart(2,'0');
  const saleDate=s.addTime?dispDate()+' '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):dispDate();
  if(posEditingId){
    const old=store.sales.find(x=>x.id===posEditingId);
    if(old){
      if(s.stockMaintain!==false){
        (old.rows||[]).forEach(r=>{const it=store.items.find(x=>x.name===r.item);if(it&&typeof it.stock==='number')it.stock+=(r.qty-(r.returned||0));});
        rows.forEach(r=>{const it=store.items.find(x=>x.name===r.item);if(it&&typeof it.stock==='number')it.stock-=r.qty;});
      }
      let p=store.parties.find(x=>x.name===old.party);
      if(p)p.balance-=(old.total-old.received);
      p=store.parties.find(x=>x.name===cust);
      if(!p){p={id:id(),name:cust,phone:phone,type:'customer',balance:0};store.parties.push(p);}
      else if(phone)p.phone=phone;
      p.balance+=total-recv;
      Object.assign(old,{party:cust,phone,date:saleDate,rows:rows.map(r=>({item:r.item,qty:r.qty,price:r.price,disc:r.disc||0})),total,received:recv,flatDisc:+document.getElementById('pos_disc')?.value||0,status:isPaid?'paid':'unpaid'});
      persist(); refreshView();
      closeModal('invViewModal');
      const printContent=document.getElementById('iv_body').innerHTML;
      const pw=window.open('','','width=800,height=600');
      pw.document.write('<html><head><title>Print Invoice</title><link rel="stylesheet" href="styles.css"></head><body>'+printContent+'</body></html>');
      pw.document.close();
      pw.focus();
      setTimeout(()=>{pw.print();pw.close();},500);
      posCloseTab(posActiveTab);
      posEditingId=null;
      toast('Invoice updated & printed!');
      logActivity('invoice','Updated invoice: '+old.no+' | '+cust+' | '+rs(total));
      return;
    }
  }
  const saleId=id();
  const branchPhone2=store.currentUser&&store.currentUser.branchPhone?store.currentUser.branchPhone:'';
  const createdBy2=store.currentUser&&store.currentUser.role==='branch'?store.currentUser.branchCode:'admin';
  const createdByName2=store.currentUser?store.currentUser.name:'';
  store.sales.push({id:saleId,no:invNo,party:cust,phone:phone,date:saleDate,time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),rows:rows.map(r=>({item:r.item,qty:r.qty,price:r.price,disc:r.disc||0})),total,received:recv,mode:mode,status:isPaid?'paid':'unpaid',branchPhone:branchPhone2,createdBy:createdBy2,createdByName:createdByName2});
  store.counters.sale++;
  if(s.stockMaintain!==false)rows.forEach(r=>{const it=store.items.find(x=>x.name===r.item);if(it&&typeof it.stock==='number')it.stock-=r.qty;});
  let p=store.parties.find(x=>x.name===cust);
  if(!p){p={id:id(),name:cust,phone:phone,type:'customer',balance:0};store.parties.push(p);}
  else if(phone)p.phone=phone;
  p.balance+=total-recv;
  store.payments.push({id:id(),saleId:saleId,dir:'in',party:cust,amount:recv,mode:mode,date:dispDate()});
  persist(); refreshView();
  closeModal('invViewModal');
  const printContent=document.getElementById('iv_body').innerHTML;
  const pw=window.open('','','width=800,height=600');
  pw.document.write('<html><head><title>Print Invoice</title><link rel="stylesheet" href="styles.css"><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script></head><body>'+printContent+'</body></html>');
  pw.document.close();
  pw.focus();
  setTimeout(()=>{
    pw.document.querySelectorAll('.inv-barcode-svg').forEach(function(svg){
      var code=svg.getAttribute('data-code')||'000000';
      try{ JsBarcode(svg,code,{format:'CODE128',width:1.5,height:40,displayValue:true,margin:0,fontSize:12}); }catch(e){}
    });
    pw.print();pw.close();
  },800);
  posCloseTab(posActiveTab);
  posEditingId=null;
  toast('Invoice saved & printed!');
  logActivity('invoice','Created invoice: '+invNo+' | '+cust+' | '+rs(total));
}
function posCalcModify(){
  const price=+document.getElementById('mm_price').textContent.replace(/[^0-9.]/g,'')||0;
  const discp=+document.getElementById('mm_discp').value||0;
  const discr=+document.getElementById('mm_discr').value||0;
  const finalP=price-(price*discp/100)-discr;
  document.getElementById('mm_finalprice').value=Math.max(0,finalP);
}
function posSaveModify(){ closeModal('modifyItemModal'); toast('Item modified'); }
document.addEventListener('click',e=>{

  if(!e.target.closest('.pos-td-name'))document.querySelectorAll('.pos-item-drop').forEach(d=>d.classList.remove('show'));
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){document.querySelectorAll('.pos-item-drop').forEach(d=>d.classList.remove('show')); closeModal('anythingModal');}
  if((e.ctrlKey||e.metaKey)&&e.key==='f'){e.preventDefault();openAnything();}
  if(document.getElementById('anythingModal').classList.contains('show')){
    const list=document.querySelectorAll('.anything-item');
    const active=document.querySelector('.anything-item.active');
    let idx=[...list].indexOf(active);
    if(e.key==='ArrowDown'){e.preventDefault();if(idx<list.length-1)idx++;list.forEach(x=>x.classList.remove('active'));if(list[idx])list[idx].classList.add('active');}
    if(e.key==='ArrowUp'){e.preventDefault();if(idx>0)idx--;list.forEach(x=>x.classList.remove('active'));if(list[idx])list[idx].classList.add('active');}
    if(e.key==='Enter'&&active){active.click();}
  }
  if(document.getElementById('saleModal')?.classList.contains('show')){
    if((e.ctrlKey||e.metaKey)&&e.key==='t'){e.preventDefault();posAddTab();}
    if(e.key==='F2'){e.preventDefault();posChangeQty();}
    if(e.key==='F3'){e.preventDefault();posItemDiscount();}
    if(e.key==='F4'){e.preventDefault();posRemoveItem();}
    if(e.key==='F6'){e.preventDefault();posChangeUnit();}
    if(e.key==='F8'){e.preventDefault();posAdditionalCharges();}
    if(e.key==='F9'){e.preventDefault();posBillDiscount();}
    if(e.key==='F10'){e.preventDefault();posLoyaltyPoints();}
    if(e.key==='F12'){e.preventDefault();posRemarks();}
    if((e.ctrlKey||e.metaKey)&&e.key==='m'){e.preventDefault();posCreditPay();}
    if((e.ctrlKey||e.metaKey)&&e.key==='p'){e.preventDefault();posSaveBill();}
  }
});
let _anythingIdx=0;
function openAnything(){
  showModal('anythingModal');
  const inp=document.getElementById('anythingInput');
  inp.value=''; inp.focus();
  anythingSearch('');
}
function anythingSearch(q){
  const list=document.getElementById('anythingList');
  const items=[];
  const ql=q.toLowerCase().trim();
  const menus=[
    {n:'Home',s:'Welcome screen',icon:'🏠',nav:'home'},
    {n:'Dashboard',s:'Overview & stats',icon:'📊',nav:'dashboard'},
    {n:'Parties',s:'Customers & suppliers',icon:'👥',nav:'parties'},
    {n:'Items',s:'Products & services',icon:'📦',nav:'items'},
    {n:'Sale',s:'Create & manage invoices',icon:'📄',nav:'sale'},
    {n:'Purchase & Expense',s:'Purchases and expenses',icon:'🛒',nav:'purchase'},
    {n:'Saved Invoices',s:'View all saved bills',icon:'💾',nav:'savedinv'},
    {n:'Expenses',s:'Track expenses',icon:'💸',nav:'expenses'},
    {n:'Grow Your Business',s:'Marketing & growth',icon:'📈',nav:'reports'},
    {n:'Cash & Bank',s:'Cash, bank, cheques, loans',icon:'🏦',nav:'cash'},
    {n:'Reports',s:'Sales, purchase, stock reports',icon:'📊',nav:'reports'},
    {n:'Sync, Share & Backup',s:'Backup & restore data',icon:'🔄',nav:'settings'},
    {n:'Settings',s:'Business settings',icon:'⚙',nav:'settings'}];
  menus.forEach(m=>{
    if(!ql||m.n.toLowerCase().includes(ql)||m.s.toLowerCase().includes(ql)){
      items.push(m);
    }
  });
  if(!items.length){list.innerHTML='<div class="anything-empty">No results found</div>';return;}
  list.innerHTML=items.map((it,i)=>{
    const highlighted=ql?it.name.replace(new RegExp(`(${ql.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi'),'<mark>$1</mark>'):it.name;
    return `<div class="anything-item ${i===0?'active':''}" onclick="nav('${it.nav}');closeModal('anythingModal')">
      <div class="ai-icon">${it.icon}</div>
      <div class="ai-info"><div class="ai-name">${highlighted}</div><div class="ai-sub">${it.s}</div></div></div>`;
  }).join('');
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
  const co=store.business.name||'My Company';
  const branchPhone=store.currentUser&&store.currentUser.branchPhone?store.currentUser.branchPhone:'';
  const ph=branchPhone||store.business.phone||'';
  const qrData=ph?('tel:'+ph.replace(/[^0-9+]/g,'')):encodeURIComponent(`Invoice from ${co} | Total Rs ${t.total}`);
  document.getElementById('p_qr').src=`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${qrData}`;
  // apply Settings show/hide
  const s=store.settings||{}, q=sel=>document.querySelector(sel);
  if(document.getElementById('p_logo')) document.getElementById('p_logo').style.display=s.showLogo===false?'none':'';
  const qr=q('#saleModal .inv-qr'); if(qr) qr.style.display=s.showQR===false?'none':'';
  const sign=q('#saleModal .inv-sign'); if(sign) sign.style.display=s.showSign===false?'none':'';
  const terms=q('#saleModal .inv-terms'); if(terms){ terms.textContent=s.terms||'Thanks for doing business with us!'; }
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

/* ============ PARTIES ============ */
let selParty=null;
function vParties(){
  const s=store.settings||{};
  if(!store.parties.length){
    content.innerHTML=`<div class="empty-page">
      <h2>Party Details</h2>
      <p>Add your customers and suppliers to manage your business easily. Track payments and grow your business without any hassle!</p>
      <div class="empty-ill">👥🪪</div>
      <button class="btn-big red" onclick="addParty()">＋ Add Your First Party</button></div>`;
    return;
  }
  selParty=selParty||store.parties[0];
  const txns=selParty?getPartyTransactions(selParty.name):[];
  content.innerHTML=`<div class="parties-page">
    <div class="parties-left">
      <div class="pl-head">
        <div class="pl-title">Parties <span class="pl-arrow">▾</span></div>
        <div class="pl-actions">
          <button class="pl-add-btn" onclick="addParty()" ${hasPermission('create','party')?'':'style="display:none"'}>＋ Add Party</button>
          <span class="pl-icon">⚙</span>
          <span class="pl-icon">⋮</span>
        </div>
      </div>
      <div class="pl-search"><input id="plSearch" placeholder="🔍 Search Party Name" oninput="filterParties()"></div>
      <div class="pl-list-head"><span>Party Name</span><span class="pl-filter">▼</span><span>Amount</span><span class="pl-filter">▼</span></div>
      <div class="pl-list" id="plList">
        ${store.parties.map(p=>`<div class="pl-item ${selParty&&selParty.id===p.id?'selected':''}" onclick="selectParty('${p.id}')">
          <span class="pl-name">${p.name}</span>
          <span class="pl-amt ${(p.balance||0)>0?'due':(p.balance||0)<0?'paid':''}">${rs(Math.abs(p.balance||0))}</span></div>`).join('')}
      </div>
    </div>
    <div class="parties-right">
      ${selParty?`<div class="pr-detail">
        <div class="pr-head">
          <div class="pr-name">${selParty.name} <span class="pr-edit" onclick="editParty('${selParty.id}')">✏️</span> <span class="pr-edit" onclick="trashPartyById('${selParty.id}')" title="Move to Trash" style="color:var(--red);cursor:pointer">🗑</span></div>
          <div class="pr-icons">
            <span class="pr-icon whatsapp" title="WhatsApp">💬</span>
            <span class="pr-icon call" title="Call">📞</span>
          </div>
        </div>
        <div class="pr-info">
          <div class="pr-info-item"><div class="pr-info-label">Phone Number</div><div class="pr-info-val">${selParty.phone||'-'}</div></div>
          <div class="pr-info-item"><div class="pr-info-label">Email</div><div class="pr-info-val">${selParty.email||'-'}</div></div>
          <div class="pr-info-item"><div class="pr-info-label">Billing Address</div><div class="pr-info-val">${selParty.billing||'-'}</div></div>
          ${s.shipAddr?`<div class="pr-info-item"><div class="pr-info-label">Shipping Address</div><div class="pr-info-val">${selParty.shipping||selParty.billing||'-'}</div></div>`:''}
          ${s.partyStatus?`<div class="pr-info-item"><div class="pr-info-label">Party Status</div><div class="pr-info-val">${selParty.balance>0?'Receivable':selParty.balance<0?'Payable':'Settled'}</div></div>`:''}
        </div>
        <div class="pr-txn-section">
          <div class="pr-txn-head">Transactions</div>
          <div class="pr-txn-icons">
            <span class="pr-txn-icon">🔍</span>
            <span class="pr-txn-icon">🖨️</span>
            <span class="pr-txn-icon">📊</span>
          </div>
        </div>
        <table class="pr-txn-tbl"><thead><tr><th>Type</th><th>Number</th><th>Date</th><th>Total</th><th>Balance</th></tr></thead>
          <tbody>${txns.length?txns.map(t=>`<tr><td>${t.type}</td><td>${t.no}</td><td>${t.date}</td><td>${rs(t.total)}</td><td>${rs(t.balance)}</td></tr>`).join('')
            :'<tr><td colspan="5" class="pr-empty"><div class="pr-empty-icon">📋</div><div>No Transactions to show</div><div class="pr-empty-sub">You haven\'t added any transactions yet.</div></td></tr>'}</tbody></table>
      </div>`:'<div class="ip-empty">Select a party</div>'}
    </div>
  </div>`;
}
function selectParty(pid){ selParty=store.parties.find(p=>p.id===pid)||null; vParties(); }
function filterParties(){const q=(document.getElementById('plSearch').value||'').toLowerCase();document.querySelectorAll('#plList .pl-item').forEach(el=>{el.style.display=el.textContent.toLowerCase().includes(q)?'':'none';});}
function getPartyTransactions(name){
  const txns=[];
  (store.sales||[]).forEach(s=>{if(s.party===name)txns.push({type:'Sale',no:s.no,date:s.date,total:s.total,balance:s.balance||0});});
  (store.payments||[]).forEach(p=>{if(p.party===name)txns.push({type:p.type==='in'?'Payment In':'Payment Out',no:p.no||'-',date:p.date,total:p.amount,balance:0});});
  return txns;
}
function editParty(pid){
  if(!hasPermission('edit','parties')){showNoAccess();return;}
  const p=store.parties.find(x=>x.id===pid);if(!p)return;
  document.getElementById('pa_name').value=p.name||'';
  document.getElementById('pa_phone').value=p.phone||'';
  document.getElementById('pa_email').value=p.email||'';
  document.getElementById('pa_billing').value=p.billing||'';
  document.getElementById('pa_gst').value=p.gst||'';
  document.getElementById('pa_bal').value=p.balance||0;
  document.getElementById('pa_type').value=p.type||'customer';
  partyTab('address');
  showModal('partyModal');
  document.querySelector('.pm-foot .btn-blue').onclick=function(){saveEditParty(pid);};
}
function saveEditParty(pid){
  if(!hasPermission('edit','parties')){showNoAccess();return;}
  const p=store.parties.find(x=>x.id===pid);if(!p)return;
  p.name=document.getElementById('pa_name').value.trim()||p.name;
  p.phone=document.getElementById('pa_phone').value;
  p.email=document.getElementById('pa_email').value;
  p.billing=document.getElementById('pa_billing').value;
  p.gst=document.getElementById('pa_gst').value;
  p.balance=+document.getElementById('pa_bal').value||0;
  p.type=document.getElementById('pa_type').value;
  persist();refreshView();closeModal('partyModal');toast('Party updated');logActivity('party','Updated party: '+p.name);
  document.querySelector('.pm-foot .btn-blue').onclick=function(){saveParty(false);};
}
function addParty(){
  if(!hasPermission('create','party')){showNoAccess();return;}
  ['pa_name','pa_phone','pa_email','pa_billing','pa_gst','pa_field1'].forEach(i=>{const e=document.getElementById(i);if(e)e.value='';});
  document.getElementById('pa_bal').value='0'; document.getElementById('pa_type').value='customer';
  document.getElementById('pa_date').value=new Date().toISOString().slice(0,10);
  partyTab('address');
  showModal('partyModal');
  document.querySelector('.pm-foot .btn-blue').onclick=function(){saveParty(false);};
}
function partyTab(t){
  document.querySelectorAll('#partyModal .pm-tab').forEach(x=>x.classList.toggle('active',x.dataset.pt===t));
  ['address','credit','more'].forEach(k=>document.getElementById('pt_'+k).style.display=k===t?'block':'none');
}
function saveParty(again){
  if(!hasPermission('create','party')){showNoAccess();return;}
  const n=document.getElementById('pa_name').value.trim(); if(!n)return toast('Enter Party Name');
  store.parties.push({id:id(),name:n,phone:document.getElementById('pa_phone').value,email:document.getElementById('pa_email').value,
    billing:document.getElementById('pa_billing').value,gst:document.getElementById('pa_gst').value,
    type:document.getElementById('pa_type').value,balance:+document.getElementById('pa_bal').value||0});
  persist(); refreshView(); toast('Party saved'); logActivity('party','Added party: '+n);
  if(again){ ['pa_name','pa_phone','pa_email','pa_billing','pa_gst'].forEach(i=>document.getElementById(i).value=''); document.getElementById('pa_bal').value='0'; }
  else { closeModal('partyModal'); nav('parties'); }
}

/* ============ ITEMS ============ */
let itemTab='products', selItem=null, selCategory=null, selUnit=null;
function vItems(){
  if(!store.items.length && itemTab==='products'){
    content.innerHTML=`<div class="empty-page">
      <h2>Item / Service Details</h2>
      <p>Add products and services you sell. Track stock, set prices and create invoices in seconds.</p>
      <div class="empty-ill">🛍️📦</div>
      <button class="btn-big red" onclick="openItem()">＋ Add Your First Item</button></div>`;
    return;
  }
  selItem=selItem||store.items[0];
  const tabs=[['products','PRODUCTS'],['category','CATEGORY'],['units','UNITS']];
  let body='';
  if(itemTab==='products'){
    const items=store.items;
    body=`<div class="ip-body">
      <div class="ip-left">
        <div class="ip-left-head">
          <div class="ip-search-btn" onclick="document.getElementById('ipSearch').focus()">🔍</div>
          <button class="ip-add-btn" onclick="openItem()" ${hasPermission('create','item')?'':'style="display:none"'}>+ Add Item</button>
        </div>
        <div class="ip-search-wrap"><input id="ipSearch" placeholder="Search items..." oninput="filterItems()"></div>
        <div class="ip-list-head"><span>ITEM</span><span>QTY</span></div>
        <div class="ip-list" id="ipList">${renderItemList()}</div>
      </div>
      <div class="ip-right">
        ${selItem?renderItemDetail(selItem):'<div class="ip-empty">Select an item</div>'}
      </div>
    </div>`;
  } else if(itemTab==='category'){
    const cats=store.categories||['General'];
    if(!selCategory) selCategory=cats[0];
    const catItems=selCategory==='Items not in any Category'?store.items.filter(i=>!cats.includes(i.cat)||i.cat===''):store.items.filter(i=>i.cat===selCategory);
    const catCounts={};cats.forEach(c=>catCounts[c]=0);
    store.items.forEach(i=>{if(catCounts[i.cat]!==undefined)catCounts[i.cat]++;});
    const uncategorized=store.items.filter(i=>!cats.includes(i.cat)||i.cat==='').length;
    body=`<div class="ip-body">
      <div class="ip-left">
        <div class="ip-left-head">
          <div class="ip-search-btn" onclick="document.getElementById('ipSearch').focus()">🔍</div>
          <button class="ip-add-btn cat-add-btn" onclick="addCategory()">+ Add Category</button>
        </div>
        <div class="ip-search-wrap"><input id="ipSearch" placeholder="Search categories..." oninput="filterCategories()"></div>
        <div class="ip-list-head"><span>CATEGORY</span><span>ITEM</span></div>
        <div class="ip-list" id="ipList">
          <div class="ip-item ${selCategory==='Items not in any Category'?'selected':''}" onclick="selectCategory('Items not in any Category')">
            <span class="ip-item-name">Items not in any Category</span><span class="ip-item-qty">${uncategorized}</span></div>
          ${cats.filter(c=>c!=='General').map(c=>`<div class="ip-item ${selCategory===c?'selected':''}" onclick="selectCategory('${c}')">
            <span class="ip-item-name">${c}</span><span class="ip-item-qty">${catCounts[c]||0}</span>
            <span class="ip-item-menu" onclick="event.stopPropagation();showCatMenu('${c}',this)">⋮</span></div>`).join('')}
        </div>
      </div>
      <div class="ip-right">
        <div class="cat-right-head">
          <div class="cat-right-title">${selCategory==='Items not in any Category'?'ITEMS NOT IN ANY CATEGORY':selCategory.toUpperCase()}</div>
          ${selCategory!=='Items not in any Category'?`<button class="cat-move-btn" onclick="moveToCategory()">Move To This Category</button>`:''}
        </div>
        <div class="cat-items-search"><input id="catItemSearch" placeholder="🔍 Search items..." oninput="filterCatItems()"></div>
        <table class="cat-items-tbl"><thead><tr><th>NAME</th><th>QUANTITY</th><th>STOCK VALUE</th></tr></thead>
          <tbody id="catItemsBody">${catItems.length?catItems.map(i=>`<tr ondblclick="openEditItem('${i.id}')">
            <td>${i.name}</td><td>${i.stock||0}</td><td>${rs((i.stock||0)*i.price)}</td></tr>`).join('')
            :'<tr><td colspan="3" class="ip-empty">No Rows To Show</td></tr>'}</tbody></table>
      </div>
    </div>`;
  } else if(itemTab==='units'){
    const units=(store.units||[]).map(u=>{const parts=u.split(' ');return{full:parts[0]||u,short:parts[1]?parts[1].replace(/[()]/g,''):parts[0]||u};});
    if(!selUnit) selUnit=units[0];
    body=`<div class="ip-body">
      <div class="ip-left">
        <div class="ip-left-head">
          <div class="ip-search-btn" onclick="document.getElementById('ipSearch').focus()">🔍</div>
          <button class="ip-add-btn" onclick="addUnit()">+ Add Units</button>
        </div>
        <div class="ip-search-wrap"><input id="ipSearch" placeholder="Search units..." oninput="filterUnits()"></div>
        <div class="ip-list-head"><span>FULLNAME</span><span>SHORTNAME</span></div>
        <div class="ip-list" id="ipList">
          ${units.map((u,i)=>`<div class="ip-item ${selUnit&&selUnit.full===u.full?'selected':''}" onclick="selectUnit(${i})">
            <span class="ip-item-name">${u.full}</span><span class="ip-item-qty">${u.short}</span></div>`).join('')}
        </div>
      </div>
      <div class="ip-right">
        <div class="cat-right-head">
          <div class="cat-right-title">${selUnit?selUnit.full.toUpperCase():'SELECT A UNIT'}</div>
          <button class="cat-move-btn" onclick="addConversion()">Add Conversion</button>
        </div>
        <table class="cat-items-tbl"><thead><tr><th></th><th>CONVERSION</th></tr></thead>
          <tbody><tr><td colspan="2" class="ip-empty">No Rows To Show</td></tr></tbody></table>
      </div>
    </div>`;
  }
  content.innerHTML=`<div class="items-page">
    <div class="ip-tabs">${tabs.map(([k,l])=>`<div class="ip-tab ${itemTab===k?'active':''}" onclick="itemTab='${k}';selCategory=null;selUnit=null;vItems()">${l}</div>`).join('')}</div>
    ${body}
  </div>`;
}
function selectCategory(cat){ selCategory=cat; vItems(); }
function selectUnit(idx){ const units=(store.units||[]).map(u=>{const parts=u.split(' ');return{full:parts[0]||u,short:parts[1]?parts[1].replace(/[()]/g,''):parts[0]||u};}); selUnit=units[idx]; vItems(); }
function filterCategories(){const q=(document.getElementById('ipSearch').value||'').toLowerCase();document.querySelectorAll('#ipList .ip-item').forEach(el=>{el.style.display=el.textContent.toLowerCase().includes(q)?'':'none';});}
function filterUnits(){filterCategories();}
function filterCatItems(){const q=(document.getElementById('catItemSearch')?.value||'').toLowerCase();document.querySelectorAll('#catItemsBody tr').forEach(el=>{el.style.display=el.textContent.toLowerCase().includes(q)?'':'none';});}
function addCategory(){
  formModal('Add Category',`<div class="field"><label>Category Name</label><input id="f_newcat" placeholder="Enter category name"></div>`,
  ()=>{const c=document.getElementById('f_newcat').value.trim();if(!c)return toast('Enter category name');
    if(!store.categories)store.categories=['General'];
    if(store.categories.includes(c))return toast('Category already exists');
    store.categories.push(c);persist();refreshView();closeModal('formModal');selCategory=c;vItems();toast('Category added');},'ADD');
}
function showCatMenu(cat,el){
  const existing=document.querySelector('.cat-context-menu');if(existing)existing.remove();
  const menu=document.createElement('div');menu.className='cat-context-menu';
  menu.innerHTML=`<div onclick="renameCategory('${cat}')">✏️ Rename</div><div class="del" onclick="deleteCategory('${cat}')">🗑 Delete</div>`;
  const r=el.getBoundingClientRect();menu.style.cssText=`position:fixed;top:${r.bottom+4}px;left:${r.left-60}px;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);padding:4px 0;z-index:999;min-width:120px;font-size:13px`;
  document.body.appendChild(menu);
  document.addEventListener('click',function h(){menu.remove();document.removeEventListener('click',h);},{once:true});
}
function renameCategory(old){
  formModal('Rename Category',`<div class="field"><label>Category Name</label><input id="f_rencat" value="${old}"></div>`,
  ()=>{const c=document.getElementById('f_rencat').value.trim();if(!c)return;
    const idx=store.categories.indexOf(old);if(idx>=0)store.categories[idx]=c;
    store.items.forEach(i=>{if(i.cat===old)i.cat=c;});persist();refreshView();closeModal('formModal');selCategory=c;vItems();toast('Category renamed');},'RENAME');
}
function deleteCategory(cat){
  if(!hasPermission('delete','item')){showNoAccess();return;}
  if(!confirm(`Delete category "${cat}"? Items in this category will become uncategorized.`))return;
  store.categories=store.categories.filter(c=>c!==cat);persist();refreshView();selCategory='Items not in any Category';vItems();toast('Category deleted');logActivity('item','Deleted category: '+cat);
}
function moveToCategory(){
  if(!selCategory||selCategory==='Items not in any Category')return toast('Select a category first');
  const uncatItems=store.items.filter(i=>!store.categories.includes(i.cat)||i.cat==='');
  if(!uncatItems.length)return toast('No uncategorized items to move');
  const names=uncatItems.map(i=>`<label style="display:flex;gap:8px;align-items:center;padding:6px 0"><input type="checkbox" class="move-item-cb" value="${i.name}"> ${i.name}</label>`).join('');
  formModal('Move Items to '+selCategory,`<div style="max-height:300px;overflow-y:auto">${names}</div>`,
  ()=>{const checked=[...document.querySelectorAll('.move-item-cb:checked')].map(cb=>cb.value);
    checked.forEach(name=>{const it=store.items.find(i=>i.name===name);if(it)it.cat=selCategory;});
    persist();refreshView();closeModal('formModal');vItems();toast(checked.length+' items moved');},'MOVE');
}
function addUnit(){
  formModal('New Unit',`<div class="field"><label>Unit Name</label><input id="f_unitname" placeholder="UNITNAME"></div>
    <div class="field"><label>Short Name</label><input id="f_unitshort" placeholder="SHORTNAME"></div>`,
  ()=>{const full=document.getElementById('f_unitname').value.trim().toUpperCase();
    const short=document.getElementById('f_unitshort').value.trim();
    if(!full)return toast('Enter unit name');
    const val=short?`${full} (${short})`:full;
    if(!store.units)store.units=[];
    if(!store.units.includes(val)){store.units.push(val);}
    persist();refreshView();closeModal('formModal');vItems();toast('Unit added');},'SAVE');
}
function addConversion(){
  toast('Conversion feature coming soon');
}
function renderItemList(q){
  const items=q?store.items.filter(i=>i.name.toLowerCase().includes(q)):store.items;
  return items.map(i=>`<div class="ip-item ${selItem&&selItem.id===i.id?'selected':''}" onclick="selectItem('${i.id}')" ondblclick="openEditItem('${i.id}')">
    <span class="ip-item-name">${i.name}</span>
    <span class="ip-item-qty ${(i.stock||0)<=0?'red':''}">${i.stock||0}</span></div>`).join('');
}
function filterItems(){ const q=(document.getElementById('ipSearch').value||'').toLowerCase(); document.getElementById('ipList').innerHTML=renderItemList(q); }
function selectItem(iid){ selItem=store.items.find(x=>x.id===iid)||null; vItems(); }
function renderItemDetail(it){
  const s=store.settings||{};
  const txns=getItemTransactions(it.name);
  return `<div class="ip-detail">
    <div class="ip-detail-head">
      <div><span class="ip-det-name">${it.name.toUpperCase()}</span> <span class="ip-det-edit" onclick="openEditItem('${it.id}')">✏️</span> <span class="ip-det-edit" onclick="trashItemById('${it.id}')" title="Move to Trash" style="color:var(--red)">🗑</span></div>
    </div>
    <div class="ip-detail-grid">
      <div class="ip-det-row"><span class="ip-det-label">SALE PRICE:</span> <span class="ip-det-val blue">${rs(it.price)}</span></div>
      <div class="ip-det-row"><span class="ip-det-label">STOCK QUANTITY:</span> <span class="ip-det-val ${(it.stock||0)<=0?'red':''}">${it.stock||0}</span></div>
      ${s.showPurchase!==false?`<div class="ip-det-row"><span class="ip-det-label">PURCHASE PRICE:</span> <span class="ip-det-val blue">${rs(it.pprice)}</span></div>`:''}
      <div class="ip-det-row"><span class="ip-det-label">STOCK VALUE:</span> <span class="ip-det-val blue">${rs((it.stock||0)*it.price)}</span></div>
    </div>
  </div>
  <div class="ip-transactions">
    <div class="ip-txn-head" onclick="toggleTxnSection()" style="cursor:pointer">
      <span class="ip-txn-arrow" id="txnArrow">▶</span>
      <span class="ip-txn-title">TRANSACTIONS</span>
      <span class="ip-txn-count">(${txns.length})</span>
    </div>
    <div class="ip-txn-body" id="txnBody" style="display:none">
      <div class="ip-txn-toolbar">
        <input class="ip-txn-search" placeholder="Search by invoice number..." oninput="filterItemTxns(this.value)">
      </div>
      <table class="ip-txn-tbl"><thead><tr>
        <th>TYPE <span class="fltr">▼</span></th><th>INVOICE# <span class="fltr">▼</span></th><th>NAME <span class="fltr">▼</span></th>
        <th>DATE <span class="fltr">▼</span></th><th>QUANTITY <span class="fltr">▼</span></th><th>PRICE/ <span class="fltr">▼</span></th><th>STATUS <span class="fltr">▼</span></th></tr></thead>
        <tbody id="ipTxnBody">${txns.length?txns.map(t=>`<tr>
          <td>${t.type}</td><td>${t.invNo}</td><td>${t.name}</td><td>${t.date}</td>
          <td>${t.qty}</td><td>${rs(t.price)}</td><td><span class="pill ${t.status==='Paid'?'paid':'due'}">${t.status}</span></td></tr>`).join('')
        :'<tr><td colspan="7" class="ip-txn-empty">No transactions to show</td></tr>'}</tbody></table>
    </div>
  </div>`;
}
function toggleTxnSection(){
  const body=document.getElementById('txnBody');
  const arrow=document.getElementById('txnArrow');
  if(body.style.display==='none'){body.style.display='block';arrow.textContent='▼';}
  else{body.style.display='none';arrow.textContent='▶';}
}
function getItemTransactions(name){
  const txns=[];
  (store.sales||[]).forEach(s=>{(s.rows||[]).forEach(r=>{if(r.item===name)txns.push({type:'Sale',invNo:s.no,name:r.name||r.item,date:s.date,qty:r.qty,price:r.price,status:s.status==='paid'?'Paid':s.status==='refunded'?'Refunded':s.status==='replacement'?'Replacement':'Unpaid'});});});
  (store.purchases||[]).forEach(p=>{(p.rows||[]).forEach(r=>{if(r.item===name)txns.push({type:'Purchase',invNo:p.no,name:r.name||r.item,date:p.date,qty:r.qty,price:r.price,status:p.total-p.received<=0?'Paid':'Unpaid'});});});
  return txns;
}
function filterItemTxns(q){
  const ql=q.toLowerCase().trim();
  const rows=document.querySelectorAll('#ipTxnBody tr');
  rows.forEach(r=>{
    const text=r.textContent.toLowerCase();
    r.style.display=(!ql||text.includes(ql))?'':'none';
  });
}
function openEditItem(iid){
  if(!hasPermission('edit','item')){showNoAccess();return;}
  const it=store.items.find(x=>x.id===iid); if(!it)return;
  editingItemId=iid;
  openItem();
  document.getElementById('i_name').value=it.name; document.getElementById('i_price').value=it.basePrice||it.price;
  document.getElementById('i_pprice').value=it.basePpPrice||it.pprice; document.getElementById('i_code').value=it.code||'';
  document.getElementById('i_wprice').value=it.wprice||'';
  document.getElementById('i_desc').value=it.desc||'';
  document.getElementById('i_cat').value=it.cat||'General';
  document.getElementById('i_catlabel').textContent=it.cat||'General'; document.getElementById('i_catlabel').classList.remove('ph');
  document.getElementById('i_unit').value=it.unit||'';
  document.getElementById('i_unitbtn').textContent=it.unit?(it.unit.split('|')[0].replace(/ \(.*/,'')||'Select Unit'):'Select Unit';
  document.getElementById('i_size').value=it.size||'';
  document.getElementById('i_sizebtn').textContent=it.size||'Select Size';
  document.querySelector('#itemModal .im-title').textContent='Edit Item';
  if(it.discp){ document.getElementById('i_discRow').style.display='flex'; document.getElementById('i_discp').value=it.discp; calcItemDiscount(); }
  if(it.ppdiscp){ document.getElementById('i_ppDiscRow').style.display='flex'; document.getElementById('i_ppdiscp').value=it.ppdiscp; calcItemPpDiscount(); }
  document.getElementById('i_stock').value=it.stock||0;
  document.getElementById('i_lowstock').value=it.lowstock||0;
}
function adjustStock(iid){
  const it=store.items.find(x=>x.id===iid); if(!it)return;
  formModal('Adjust Stock - '+it.name,`
    <div class="field"><label>Current Stock: ${it.stock||0}</label></div>
    <div class="field"><label>New Stock</label><input id="f_adjstock" type="number" value="${it.stock||0}"></div>`,
  ()=>{ it.stock=+document.getElementById('f_adjstock').value||0; persist(); refreshView(); closeModal('formModal'); toast('Stock updated'); logActivity('item','Adjusted stock for: '+it.name); vItems(); },'UPDATE');
}
function openItem(){
  if(!hasPermission('create','item')){showNoAccess();return;}
  const s=store.settings||{};
  if(!editingItemId){
    document.querySelector('#itemModal .im-title').textContent='Add Item';
    document.getElementById('i_name').value=''; document.getElementById('i_price').value='';
    document.getElementById('i_wprice').value='';
    document.getElementById('i_pprice').value=''; document.getElementById('i_code').value=''; document.getElementById('i_desc').value='';
    document.getElementById('i_cat').value=''; document.getElementById('i_catlabel').textContent='Category';
    document.getElementById('i_catlabel').classList.add('ph');
    document.getElementById('i_unit').value=''; document.getElementById('i_unitbtn').textContent='Select Unit';
    document.getElementById('i_size').value=''; document.getElementById('i_sizebtn').textContent='Select Size';
    document.getElementById('i_catpanel').classList.remove('show');
    document.getElementById('i_discRow').style.display='none'; document.getElementById('i_discp').value='';
    document.getElementById('i_finalPrice').textContent='0';
    document.getElementById('i_ppDiscRow').style.display='none'; document.getElementById('i_ppdiscp').value='';
    document.getElementById('i_ppFinalPrice').textContent='0';
  }
  const wpriceRow=document.getElementById('i_wprice')?.closest('.im-row');
  if(wpriceRow) wpriceRow.style.display=s.wholesale!==false?'':'none';
  const sizeBtn=document.getElementById('i_sizebtn');
  if(sizeBtn) sizeBtn.style.display=s.sizeField!==false?'':'none';
  showModal('itemModal');
}
function toggleDiscountField(){ const r=document.getElementById('i_discRow'); r.style.display=r.style.display==='none'?'flex':'none'; calcItemDiscount(); }
function calcItemDiscount(){
  const price=parseFloat(document.getElementById('i_price').value)||0;
  const disc=parseFloat(document.getElementById('i_discp').value)||0;
  const finalP=price-(price*disc/100);
  document.getElementById('i_finalPrice').textContent=disc>0?rs(finalP):'-';
}
function togglePpDiscountField(){ const r=document.getElementById('i_ppDiscRow'); r.style.display=r.style.display==='none'?'flex':'none'; calcItemPpDiscount(); }
function calcItemPpDiscount(){
  const price=parseFloat(document.getElementById('i_pprice').value)||0;
  const disc=parseFloat(document.getElementById('i_ppdiscp').value)||0;
  const finalP=price-(price*disc/100);
  document.getElementById('i_ppFinalPrice').textContent=disc>0?rs(finalP):'-';
}
function toggleCatDD(){ const p=document.getElementById('i_catpanel'); p.classList.toggle('show'); if(p.classList.contains('show')){ document.getElementById('i_catsearch').value=''; renderCatDD(); } }
function closeCatDD(){ document.getElementById('i_catpanel').classList.remove('show'); }
document.addEventListener('click',e=>{ const p=document.getElementById('i_catpanel'); if(p&&p.classList.contains('show')&&!e.target.closest('.cat-dd')){ p.classList.remove('show'); } });
function renderCatDD(){
  const q=(document.getElementById('i_catsearch').value||'').toLowerCase();
  const list=store.categories.filter(c=>c.toLowerCase().includes(q));
  document.getElementById('i_catlist').innerHTML=list.length?list.map(c=>`<div class="cat-item" onclick="pickCat('${c.replace(/'/g,"\\'")}')">${c}</div>`).join(''):`<div class="cat-item muted">No match</div>`;
}
function pickCat(c){ document.getElementById('i_cat').value=c; const l=document.getElementById('i_catlabel'); l.textContent=c; l.classList.remove('ph'); document.getElementById('i_catpanel').classList.remove('show'); }
function addNewCatInline(){
  const q=document.getElementById('i_catsearch').value.trim();
  formModal('Add New Category',`<div class="field"><label>Category Name</label><input id="nc_name" value="${q}" autofocus></div>`,
  ()=>{ let c=document.getElementById('nc_name').value.trim(); if(!c)return toast('Enter category name');
    c=c.charAt(0).toUpperCase()+c.slice(1);
    if(!store.categories.includes(c)) store.categories.push(c); persist(); refreshView();
    closeModal('formModal'); pickCat(c); renderCatDD(); toast('Category added'); });
}
function assignCode(){ const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let code=''; for(let i=0;i<8;i++) code+=chars[Math.floor(Math.random()*chars.length)]; document.getElementById('i_code').value=code; }
function openUnit(){
  const cur=document.getElementById('i_unit').value, base=cur.split('|')[0]||'None', sec=cur.split('|')[1]||'None';
  const units=store.units||[];
  formModal('Select Unit',`<div style="display:flex;gap:20px">
    <div class="field" style="flex:1"><label style="color:var(--blue)">BASE UNIT</label>
      <select id="u_base">${units.map(u=>`<option ${u===base?'selected':''}>${u}</option>`).join('')}</select></div>
    <div class="field" style="flex:1"><label style="color:var(--blue)">SECONDARY UNIT</label>
      <select id="u_sec">${units.map(u=>`<option ${u===sec?'selected':''}>${u}</option>`).join('')}</select></div></div>`,
  ()=>{ const b=document.getElementById('u_base').value, s=document.getElementById('u_sec').value;
    document.getElementById('i_unit').value=b+'|'+s;
    document.getElementById('i_unitbtn').textContent = b==='None'?'Select Unit':b.replace(/ \(.*/,'');
    closeModal('formModal'); }, 'SAVE');
}
const SIZES=['XS','S','M','L','XL','XXL','XXXL'];
function openSize(){
  const cur=document.getElementById('i_size').value||'';
  formModal('Select Size',`<div style="display:flex;flex-wrap:wrap;gap:10px">${SIZES.map(s=>`<div class="size-opt ${s===cur?'active':''}" onclick="document.querySelectorAll('.size-opt').forEach(x=>x.classList.remove('active'));this.classList.add('active');document.getElementById('i_size').value='${s}'">${s}</div>`).join('')}</div>`,
  ()=>{ const s=document.getElementById('i_size').value;
    document.getElementById('i_sizebtn').textContent=s||'Select Size';
    closeModal('formModal'); }, 'SAVE');
}
let editingItemId=null;
function saveItem(again){
  if(!hasPermission(editingItemId?'edit':'create','item')){showNoAccess();return;}
  const n=document.getElementById('i_name').value.trim(); if(!n)return toast('Enter Item Name');
  let code=document.getElementById('i_code').value.trim()||('ITM'+String(store.items.length+1).padStart(4,'0'));
  const price=+document.getElementById('i_price').value||0;
  const discp=+document.getElementById('i_discp').value||0;
  const finalPrice=discp>0?Math.round(price-(price*discp/100)):price;
  const pprice=+document.getElementById('i_pprice').value||0;
  const ppdiscp=+document.getElementById('i_ppdiscp').value||0;
  const finalPpPrice=ppdiscp>0?Math.round(pprice-(pprice*ppdiscp/100)):pprice;
  const itemData={name:n,code,cat:document.getElementById('i_cat').value||'General',unit:document.getElementById('i_unit').value||'',size:document.getElementById('i_size').value||'',
    desc:document.getElementById('i_desc').value.trim()||'',
    price:finalPrice,pprice:finalPpPrice,wprice:+document.getElementById('i_wprice').value||0,discp:discp,basePrice:price,ppdiscp:ppdiscp,basePpPrice:pprice};
  if(editingItemId){
    const it=store.items.find(x=>x.id===editingItemId);
    if(it){Object.assign(it,itemData);it.stock=+document.getElementById('i_stock').value||it.stock||0;it.lowstock=+document.getElementById('i_lowstock').value||0;}
    editingItemId=null;
    toast('Item updated');
    logActivity('item','Updated item: '+itemData.name);
  } else {
    itemData.stock=+document.getElementById('i_stock').value||0;
    itemData.lowstock=+document.getElementById('i_lowstock').value||0;
    itemData.id=id();
    store.items.push(itemData);
    toast('Item saved');
    logActivity('item','Added item: '+itemData.name);
  }
  persist(); refreshView();
  if(again){ ['i_name','i_price','i_wprice','i_pprice','i_code','i_desc'].forEach(x=>document.getElementById(x).value=''); }
  else { closeModal('itemModal');   nav('items'); }
}

/* ============ BULK UPDATE ITEMS ============ */
let bulkTab='pricing', bulkSelected=new Set(), bulkEdits={};
function vBulkUpdate(){
  bulkSelected=new Set(); bulkEdits={};
  const items=store.items||[];
  content.innerHTML=`<div class="bulk-page">
    <div class="bulk-head">
      <div class="bulk-head-left">
        <div class="bulk-title">Bulk Update Items</div>
        <div class="bulk-search"><span class="bulk-search-ic">🔍</span><input id="bulkSearchInput" placeholder="Search by item name" oninput="bulkFilterItems()"></div>
      </div>
      <div class="bulk-tabs">
        <label class="bulk-tab ${bulkTab==='pricing'?'active':''}"><input type="radio" name="bulkTab" value="pricing" onchange="bulkTab='pricing';bulkRefresh()" ${bulkTab==='pricing'?'checked':''}><span>Pricing</span></label>
        <label class="bulk-tab ${bulkTab==='stock'?'active':''}"><input type="radio" name="bulkTab" value="stock" onchange="bulkTab='stock';bulkRefresh()" ${bulkTab==='stock'?'checked':''}><span>Stock</span></label>
        <label class="bulk-tab ${bulkTab==='info'?'active':''}"><input type="radio" name="bulkTab" value="info" onchange="bulkTab='info';bulkRefresh()" ${bulkTab==='info'?'checked':''}><span>Item Information</span></label>
      </div>
    </div>
    <div class="bulk-select-bar">
      <span class="bulk-selected-count"><span id="bulkSelCount">0</span> items selected</span>
      <div class="bulk-tax-slab">
        <select id="bulkTaxSlab">
          <option value="">Update Tax Slab ▾</option>
          <option value="0">No Tax (0%)</option>
          <option value="5">GST 5%</option>
          <option value="12">GST 12%</option>
          <option value="18">GST 18%</option>
          <option value="28">GST 28%</option>
        </select>
      </div>
    </div>
    <div class="bulk-table-wrap">
      <table class="bulk-table" id="bulkTable">
        <thead><tr>
          <th class="bulk-th-check"><input type="checkbox" id="bulkCheckAll" onchange="bulkToggleAll(this.checked)"></th>
          <th class="bulk-th-num">#</th>
          <th class="bulk-th-name">ITEM NAME* <span class="bulk-filter-ic" title="Filter">⊞</span></th>
          <th class="bulk-th-cat">CATEGORY <span class="bulk-filter-ic" title="Filter">⊞</span></th>
          ${bulkTab==='pricing'?`<th class="bulk-th-price">PURCHASE PRICE <span class="bulk-filter-ic" title="Filter">⊞</span></th>
          <th class="bulk-th-price">SALE PRICE <span class="bulk-filter-ic" title="Filter">⊞</span></th>
          <th class="bulk-th-disc">DISCOUNT ON SALE <span class="bulk-filter-ic" title="Filter">⊞</span></th>
          <th class="bulk-th-disctype">DISCOUNT TYPE <span class="bulk-filter-ic" title="Filter">⊞</span></th>`:''}
          ${bulkTab==='stock'?`<th class="bulk-th-stock">CURRENT STOCK</th>
          <th class="bulk-th-stock">NEW STOCK</th>`:''}
          ${bulkTab==='info'?`<th class="bulk-th-info">ITEM CODE</th>
          <th class="bulk-th-info">UNIT</th>
          <th class="bulk-th-info">SIZE</th>
          <th class="bulk-th-info">DESCRIPTION</th>`:''}
        </tr></thead>
        <tbody id="bulkTableBody"></tbody>
      </table>
    </div>
    <div class="bulk-youtube-row">
      <span class="bulk-yt-ic">▶</span>
      <span class="bulk-yt-text">Watch Youtube tutorial to learn more</span>
      <button class="bulk-yt-btn" onclick="toast('Video tutorial coming soon')">▷ Watch Video</button>
    </div>
    <div class="bulk-footer">
      <div class="bulk-footer-stats">
        <span><b>Pricing</b> - <span id="bulkPricingCount">0</span> Updates,</span>
        <span><b>Stock</b> - <span id="bulkStockCount">0</span> Updates,</span>
        <span><b>Item Information</b> - <span id="bulkInfoCount">0</span> Updates</span>
      </div>
      <button class="bulk-update-btn" id="bulkUpdateBtn" onclick="bulkSaveChanges()">Update</button>
    </div>
  </div>`;
  bulkRenderRows(items);
  bulkUpdateCounts();
}

function bulkRenderRows(items){
  const q=(document.getElementById('bulkSearchInput')?.value||'').toLowerCase();
  const filtered=q?items.filter(i=>i.name.toLowerCase().includes(q)):items;
  const tbody=document.getElementById('bulkTableBody');
  if(!tbody)return;
  if(!filtered.length){
    tbody.innerHTML=`<tr><td colspan="${bulkTab==='pricing'?9:bulkTab==='stock'?5:7}" class="bulk-empty">No items found. Add items first from the Items page.</td></tr>`;
    return;
  }
  tbody.innerHTML=filtered.map((it,idx)=>{
    const key=it.id;
    const ed=bulkEdits[key]||{};
    const checked=bulkSelected.has(key)?'checked':'';
    const catOpts=(store.categories||['General']).map(c=>`<option ${ed.cat!==undefined?(ed.cat===it.cat?'selected':''):''}>${c}</option>`).join('');
    const discType=ed.discType!==undefined?ed.discType:(it.discType||'Percentage');
    if(bulkTab==='pricing'){
      const pp=ed.pp!==undefined?ed.pp:(it.pprice||0);
      const sp=ed.sp!==undefined?ed.sp:(it.price||0);
      const disc=ed.disc!==undefined?ed.disc:(it.discp||0);
      return `<tr class="bulk-row ${bulkSelected.has(key)?'selected':''}">
        <td class="bulk-td-check"><input type="checkbox" ${checked} onchange="bulkToggleItem('${key}',this.checked)"></td>
        <td class="bulk-td-num">${idx+1}</td>
        <td class="bulk-td-name"><div class="bulk-item-info"><span class="bulk-item-name">${it.name}</span><span class="bulk-item-code">${it.code||''}</span></div></td>
        <td class="bulk-td-cat"><select class="bulk-cat-sel" onchange="bulkEditField('${key}','cat',this.value)">${catOpts}</select></td>
        <td class="bulk-td-price"><div class="bulk-price-cell"><span class="bulk-rs">Rs</span><input type="number" class="bulk-price-input" value="${pp}" onfocus="clearZero(this)" oninput="bulkEditField('${key}','pp',this.value)"></div></td>
        <td class="bulk-td-price"><div class="bulk-price-cell"><span class="bulk-rs">Rs</span><input type="number" class="bulk-price-input" value="${sp}" onfocus="clearZero(this)" oninput="bulkEditField('${key}','sp',this.value)"></div></td>
        <td class="bulk-td-disc"><div class="bulk-disc-cell"><span>---</span></div></td>
        <td class="bulk-td-disctype"><select class="bulk-disctype-sel" onchange="bulkEditField('${key}','discType',this.value)"><option ${discType==='Percentage'?'selected':''}>Percentage</option><option ${discType==='Flat'?'selected':''}>Flat</option></select></td>
      </tr>`;
    } else if(bulkTab==='stock'){
      const curStock=it.stock||0;
      const newStock=ed.newStock!==undefined?ed.newStock:curStock;
      return `<tr class="bulk-row ${bulkSelected.has(key)?'selected':''}">
        <td class="bulk-td-check"><input type="checkbox" ${checked} onchange="bulkToggleItem('${key}',this.checked)"></td>
        <td class="bulk-td-num">${idx+1}</td>
        <td class="bulk-td-name"><div class="bulk-item-info"><span class="bulk-item-name">${it.name}</span><span class="bulk-item-code">${it.code||''}</span></div></td>
        <td class="bulk-td-cat"><select class="bulk-cat-sel" onchange="bulkEditField('${key}','cat',this.value)">${catOpts}</select></td>
        <td class="bulk-td-stock"><span class="bulk-stock-current">${curStock}</span></td>
        <td class="bulk-td-stock"><div class="bulk-stock-input-wrap"><input type="number" class="bulk-stock-input" value="${newStock}" onfocus="clearZero(this)" oninput="bulkEditField('${key}','newStock',this.value)"></div></td>
      </tr>`;
    } else {
      const code=ed.code!==undefined?ed.code:(it.code||'');
      const unit=ed.unit!==undefined?ed.unit:(it.unit||'Pcs');
      const size=ed.size!==undefined?ed.size:(it.size||'');
      const desc=ed.desc!==undefined?ed.desc:(it.desc||'');
      return `<tr class="bulk-row ${bulkSelected.has(key)?'selected':''}">
        <td class="bulk-td-check"><input type="checkbox" ${checked} onchange="bulkToggleItem('${key}',this.checked)"></td>
        <td class="bulk-td-num">${idx+1}</td>
        <td class="bulk-td-name"><div class="bulk-item-info"><span class="bulk-item-name">${it.name}</span><span class="bulk-item-code">${it.code||''}</span></div></td>
        <td class="bulk-td-cat"><select class="bulk-cat-sel" onchange="bulkEditField('${key}','cat',this.value)">${catOpts}</select></td>
        <td class="bulk-td-info"><input type="text" class="bulk-info-input" value="${code}" oninput="bulkEditField('${key}','code',this.value)"></td>
        <td class="bulk-td-info"><select class="bulk-cat-sel" onchange="bulkEditField('${key}','unit',this.value)">${(store.units||['None','PIECES (Pcs)','KILOGRAMS (Kg)','METERS (Mtr)','LITRE (Ltr)','BOX (Box)']).map(u=>`<option ${u===unit?'selected':''}>${u}</option>`).join('')}</select></td>
        <td class="bulk-td-info"><select class="bulk-cat-sel" onchange="bulkEditField('${key}','size',this.value)"><option value="" ${!size?'selected':''}>-</option><option ${size==='XS'?'selected':''}>XS</option><option ${size==='S'?'selected':''}>S</option><option ${size==='M'?'selected':''}>M</option><option ${size==='L'?'selected':''}>L</option><option ${size==='XL'?'selected':''}>XL</option><option ${size==='XXL'?'selected':''}>XXL</option><option ${size==='XXXL'?'selected':''}>XXXL</option></select></td>
        <td class="bulk-td-info"><input type="text" class="bulk-info-input" value="${desc}" oninput="bulkEditField('${key}','desc',this.value)"></td>
      </tr>`;
    }
  }).join('');
}

function bulkFilterItems(){ bulkRenderRows(store.items||[]); }

function bulkRefresh(){
  document.querySelectorAll('input[name="bulkTab"]').forEach(r=>{
    r.closest('.bulk-tab').classList.toggle('active',r.value===bulkTab);
  });
  bulkRenderRows(store.items||[]);
  bulkUpdateCounts();
}

function bulkToggleItem(key,checked){
  if(checked) bulkSelected.add(key); else bulkSelected.delete(key);
  document.getElementById('bulkSelCount').textContent=bulkSelected.size;
  bulkUpdateCounts();
}

function bulkToggleAll(checked){
  const items=store.items||[];
  const q=(document.getElementById('bulkSearchInput')?.value||'').toLowerCase();
  const filtered=q?items.filter(i=>i.name.toLowerCase().includes(q)):items;
  filtered.forEach(it=>{if(checked)bulkSelected.add(it.id);else bulkSelected.delete(it.id);});
  document.getElementById('bulkCheckAll').checked=checked;
  document.getElementById('bulkSelCount').textContent=bulkSelected.size;
  bulkRenderRows(items);
  bulkUpdateCounts();
}

function bulkEditField(key,field,val){
  if(!bulkEdits[key])bulkEdits[key]={};
  bulkEdits[key][field]=val;
  bulkUpdateCounts();
}

function bulkUpdateCounts(){
  let pricing=0,stock=0,info=0;
  for(const key in bulkEdits){
    const ed=bulkEdits[key];
    if(ed.pp!==undefined||ed.sp!==undefined||ed.disc!==undefined||ed.discType!==undefined)pricing++;
    if(ed.newStock!==undefined)stock++;
    if(ed.code!==undefined||ed.unit!==undefined||ed.size!==undefined||ed.desc!==undefined)info++;
  }
  const pe=document.getElementById('bulkPricingCount');if(pe)pe.textContent=pricing;
  const se=document.getElementById('bulkStockCount');if(se)se.textContent=stock;
  const ie=document.getElementById('bulkInfoCount');if(ie)ie.textContent=info;
  const total=pricing+stock+info;
  const btn=document.getElementById('bulkUpdateBtn');
  if(btn){btn.disabled=total===0;btn.style.opacity=total===0?'0.5':'1';}
}

function bulkSaveChanges(){
  const items=store.items||[];
  let updated=0;
  for(const key in bulkEdits){
    const it=items.find(x=>x.id===key);
    if(!it)continue;
    const ed=bulkEdits[key];
    if(ed.pp!==undefined){it.pprice=+ed.pp||0;}
    if(ed.sp!==undefined){it.price=+ed.sp||0;}
    if(ed.disc!==undefined){it.discp=+ed.disc||0;}
    if(ed.discType!==undefined){it.discType=ed.discType;}
    if(ed.cat!==undefined){it.cat=ed.cat;}
    if(ed.newStock!==undefined){it.stock=+ed.newStock||0;}
    if(ed.code!==undefined){it.code=ed.code;}
    if(ed.unit!==undefined){it.unit=ed.unit;}
    if(ed.size!==undefined){it.size=ed.size;}
    if(ed.desc!==undefined){it.desc=ed.desc;}
    updated++;
  }
  if(!updated){toast('No changes to update');return;}
  persist();
  bulkEdits={};
  bulkSelected=new Set();
  document.getElementById('bulkSelCount').textContent='0';
  bulkRenderRows(items);
  bulkUpdateCounts();
  toast(updated+' item(s) updated successfully!');
  logActivity('item','Bulk updated '+updated+' items');
}



/* ============ SALE / PURCHASE LISTS ============ */
function openSlip(sid){ const s=store.sales.find(x=>x.id===sid); if(s) showInvoiceView(s); }
function findSlip(no){ no=(no||'').trim(); if(!no)return; const s=store.sales.find(x=>x.no.toLowerCase()===no.toLowerCase());
  if(s){ showInvoiceView(s); } else toast('No slip found for '+no); }
function filterSaleList(){
  const from=document.getElementById('sale_from')?.value;
  const to=document.getElementById('sale_to')?.value;
  let rows=[...store.sales].reverse();
  if(from) rows=rows.filter(s=>s.date>=from);
  if(to) rows=rows.filter(s=>s.date<=to);
  renderSaleTable(rows);
}
function filterSaleAll(btn){
  document.querySelectorAll('.sale-all-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('sale_from').value='';
  document.getElementById('sale_to').value='';
  renderSaleTable([...store.sales].reverse());
}
function renderSaleTable(rows){
  const tbody=document.getElementById('saleTblBody');
  if(!tbody)return;
  tbody.innerHTML=rows.map(s=>{const st=s.status||(s.refunded?'refunded':s.total-s.received<=0?'paid':'unpaid');
    return `<tr onclick="openSaleEdit('${s.id}')" ondblclick="event.stopPropagation()">
      <td class="s-bold" style="color:var(--blue)">${s.no}</td>
      <td>${s.party}</td>
      <td>${s.date}</td>
      <td class="right">${rs(s.total)}</td>
      <td class="right s-bold">${rs(s.total-s.received)}</td>
      <td onclick="event.stopPropagation()" class="status-cell"><span class="inv-status-pill st-${st}" onclick="event.stopPropagation();toggleStatusDrop('${s.id}',event)">${st==='paid'?'Paid':st==='refunded'?'Refunded':st==='replacement'?'Replacement':'Not Paid'}</span></td>
    </tr>`;}).join('');
}
function toggleStatusDrop(sid,ev){
  ev.stopPropagation();
  const existing=document.getElementById('statusFloatingDrop');
  if(existing&&existing.dataset.sid===sid){existing.remove();return;}
  if(existing)existing.remove();
  const rect=ev.target.getBoundingClientRect();
  const drop=document.createElement('div');
  drop.id='statusFloatingDrop';
  drop.dataset.sid=sid;
  drop.className='floating-status-drop';
  drop.style.cssText=`position:fixed;top:${rect.bottom+4}px;left:${rect.left}px;z-index:9999`;
  drop.innerHTML=`<div class="sd-opt sd-paid" onclick="setInvStatus('${sid}','paid')">✓ Paid</div>
    <div class="sd-opt sd-unpaid" onclick="setInvStatus('${sid}','unpaid')">✗ Not Paid</div>
    <div class="sd-opt sd-refunded" onclick="setInvStatus('${sid}','refunded')">↩ Refunded</div>
    <div class="sd-opt sd-replacement" onclick="setInvStatus('${sid}','replacement')">🔄 Replacement</div>`;
  document.body.appendChild(drop);
}
function setInvStatus(sid,status){
  const s=store.sales.find(x=>x.id===sid); if(!s)return;
  s.status=status;
  if(status==='paid')s.received=s.total;
  if(status==='refunded')s.refunded=true;
  persist(); refreshView();
  const drop=document.getElementById('statusFloatingDrop'); if(drop)drop.remove();
  toast('Status: '+status.charAt(0).toUpperCase()+status.slice(1));logActivity('invoice','Changed status of '+s.no+' to '+status);
}
document.addEventListener('click',e=>{
  const drop=document.getElementById('statusFloatingDrop');
  if(drop&&!e.target.closest('.floating-status-drop')&&!e.target.closest('.inv-status-pill'))drop.remove();
});
function vPurchase(){
  const s=store.settings||{};
  const purchases=[...(store.purchases||[])].reverse();
  const now=new Date();
  const curMonth=now.getMonth(), curYear=now.getFullYear();
  const firstDay='01/'+String(curMonth+1).padStart(2,'0')+'/'+curYear;
  const lastDay=new Date(curYear,curMonth+1,0).getDate()+'/'+String(curMonth+1).padStart(2,'0')+'/'+curYear;
  let filterFrom=firstDay, filterTo=lastDay, filterFirm='ALL FIRMS', filterUser='ALL USERS';
  function applyFilters(){
    let list=[...(store.purchases||[])].reverse();
    if(filterFrom&&filterTo){
      list=list.filter(p=>{
        if(!p.date)return true;
        const parts=p.date.split(/[\s/-]/);
        const d=new Date(parts[2]+'-'+parts[1]+'-'+parts[0]);
        const f=filterFrom.split(/[\s/-]/); const t=filterTo.split(/[\s/-]/);
        const from=new Date(f[2]+'-'+f[1]+'-'+f[0]);
        const to=new Date(t[2]+'-'+t[1]+'-'+t[0]);
        return d>=from&&d<=to;
      });
    }
    if(filterFirm!=='ALL FIRMS') list=list.filter(p=>(p.firm||s.business?.name||'My Business')===filterFirm);
    if(filterUser!=='ALL USERS') list=list.filter(p=>(p.user||'Admin')===filterUser);
    return list;
  }
  const filteredPurchases=applyFilters();
  let paidTotal=0, unpaidTotal=0;
  filteredPurchases.forEach(p=>{
    const bal=p.total-p.received;
    if(bal<=0) paidTotal+=p.total; else unpaidTotal+=bal;
  });
  const grandTotal=paidTotal+unpaidTotal;
  const firms=[(store.business?.name||'My Business'),...(store.companies||[]).map(c=>c.name)].filter((v,i,a)=>a.indexOf(v)===i);
  const users=[...new Set((store.purchases||[]).map(p=>p.user||'Admin'))];
  content.innerHTML=`
  <div class="hub-header">
    <h2>Purchase Bills</h2>
    <button class="hub-btn hub-btn-red" onclick="nav('purchaseform')" ${hasPermission('create','purchase')?'':'style="display:none"'}>＋ Add Purchase</button>
  </div>
  <div class="hub-card">
    <div class="hub-filters">
      <select id="pfMonth" onchange="vPurchase()" style="padding:8px 12px;border:1px solid var(--line);border-radius:8px;font-size:13px;font-weight:600">
        <option value="this">This Month</option><option value="last">Last Month</option><option value="3">Last 3 Months</option><option value="all">All Time</option>
      </select>
      <div class="hub-filter-chip red">Between</div>
      <div class="hub-filter-date"><input type="date" id="pfFrom" value="${filterFrom.split('/').reverse().join('-')}" onchange="vPurchase()"></div>
      <span style="font-size:12px;color:var(--muted)">To</span>
      <div class="hub-filter-date"><input type="date" id="pfTo" value="${filterTo.split('/').reverse().join('-')}" onchange="vPurchase()"></div>
      <div class="hub-select"><select id="pfFirm" onchange="vPurchase()"><option>ALL FIRMS</option>${firms.map(f=>`<option>${f}</option>`).join('')}</select></div>
      <div class="hub-select"><select id="pfUser" onchange="vPurchase()"><option>ALL USERS</option>${users.map(u=>`<option>${u}</option>`).join('')}</select></div>
      <div style="flex:1"></div>
      <div class="hub-action-icon" onclick="exportPurchaseExcel()" style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px;cursor:pointer">
        <span style="font-size:20px">📊</span><span style="font-size:10px;color:var(--muted)">Excel Report</span>
      </div>
      <div class="hub-action-icon" onclick="printPurchaseList()" style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px;cursor:pointer">
        <span style="font-size:20px">🖨️</span><span style="font-size:10px;color:var(--muted)">Print</span>
      </div>
    </div>
    <div class="hub-stats">
      <div class="hub-stat hub-stat-green"><div class="hub-stat-label">Paid</div><div class="hub-stat-val">${rs(paidTotal)}</div></div>
      <span style="font-size:18px;color:var(--muted)">+</span>
      <div class="hub-stat hub-stat-blue"><div class="hub-stat-label">Unpaid</div><div class="hub-stat-val">${rs(unpaidTotal)}</div></div>
      <span style="font-size:18px;color:var(--muted)">=</span>
      <div class="hub-stat hub-stat-yellow"><div class="hub-stat-label">Total</div><div class="hub-stat-val">${rs(grandTotal)}</div></div>
    </div>
  </div>
  <div class="hub-card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
      <span style="font-size:14px;font-weight:700;color:var(--ink)">TRANSACTIONS</span>
      <input class="hub-search" type="text" placeholder="🔍 Search transactions..." oninput="filterPurchaseRows(this.value)">
    </div>
    <div style="overflow-x:auto">
      <table class="hub-table" id="purchaseTable">
        <thead><tr>
          <th>DATE <span style="font-size:9px">⊞</span></th>
          <th>INVOICE NO. <span style="font-size:9px">⊞</span></th>
          <th>PARTY NAME <span style="font-size:9px">⊞</span></th>
          <th>PAYMENT TYPE <span style="font-size:9px">⊞</span></th>
          <th class="right">AMOUNT <span style="font-size:9px">⊞</span></th>
          <th class="right">BALANCE DUE <span style="font-size:9px">⊞</span></th>
          <th>STATUS <span style="font-size:9px">⊞</span></th>
          <th style="width:120px"></th>
        </tr></thead>
        <tbody id="purchaseBody">
          ${filteredPurchases.length?filteredPurchases.map((p,idx)=>{
            const bal=p.total-p.received;
            const isPaid=bal<=0;
            return `<tr class="purchase-row" data-idx="${idx}">
              <td>${p.date||'-'}</td>
              <td>${p.no||'-'}</td>
              <td style="font-weight:500">${p.party||'-'}</td>
              <td>${isPaid?'Cash':'Credit'}</td>
              <td class="right">${rs(p.total)}</td>
              <td class="right" style="font-weight:600;color:${isPaid?'var(--green)':'var(--red)'}">${rs(bal)}</td>
              <td><span class="hub-pill ${isPaid?'hub-pill-paid':'hub-pill-unpaid'}">${isPaid?'Paid':'Unpaid'}</span></td>
              <td><div class="hub-actions">
                <span class="hub-action-icon" onclick="viewPurchase(${purchases.indexOf(p)})" title="View">👁️</span>
                <span class="hub-action-icon" onclick="printPurchase(${purchases.indexOf(p)})" title="Print">🖨️</span>
                <span class="hub-action-icon" onclick="sharePurchase(${purchases.indexOf(p)})" title="Share">↗️</span>
                <span class="hub-action-icon" onclick="deletePurchase(${purchases.indexOf(p)})" title="Delete">🗑️</span>
              </div></td>
            </tr>`;
          }).join(''):`<tr><td colspan="8" class="hub-empty">
            <div style="font-size:48px;margin-bottom:10px">🛒</div>
            <div class="hub-empty-title">No purchase bills found</div>
            <div class="hub-empty-sub">Add your first purchase to see it here</div>
          </td></tr>`}
        </tbody>
      </table>
    </div>
  </div>`;
  document.getElementById('pfMonth').value='this';
}

function viewPurchase(idx){
  const p=(store.purchases||[])[idx];
  if(!p)return;
  const bal=p.total-p.received;
  const rows=(p.rows||[]).map(r=>`<tr><td>${r.item||'-'}</td><td class="right">${r.qty||0}</td><td class="right">${rs(r.price||0)}</td><td class="right">${rs((r.qty||0)*(r.price||0))}</td></tr>`).join('');
  const html=`<div class="modal-overlay modal-dynamic" id="purchViewModal" onclick="closeModal('purchViewModal')">
    <div class="modal" onclick="event.stopPropagation()" style="max-width:600px;width:95%">
      <div class="modal-head"><span>Purchase ${p.no||''}</span><span class="modal-close" onclick="closeModal('purchViewModal')">✕</span></div>
      <div style="padding:20px">
        <div style="display:flex;gap:20px;margin-bottom:16px;flex-wrap:wrap">
          <div><div style="font-size:12px;color:#888">Party</div><div style="font-weight:600">${p.party||'-'}</div></div>
          <div><div style="font-size:12px;color:#888">Date</div><div style="font-weight:600">${p.date||'-'}</div></div>
          <div><div style="font-size:12px;color:#888">Status</div><div style="font-weight:600;color:${bal<=0?'#27ae60':'#e74c3c'}">${bal<=0?'Paid':'Unpaid'}</div></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="border-bottom:2px solid #eee"><th style="text-align:left;padding:8px 0">Item</th><th style="text-align:right;padding:8px 0">Qty</th><th style="text-align:right;padding:8px 0">Price</th><th style="text-align:right;padding:8px 0">Total</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr style="border-top:2px solid #eee;font-weight:700"><td style="padding:8px 0">Total</td><td></td><td></td><td style="text-align:right">${rs(p.total)}</td></tr>
          <tr><td style="padding:4px 0">Received</td><td></td><td></td><td style="text-align:right;color:#27ae60">${rs(p.received||0)}</td></tr>
          <tr style="font-weight:700"><td style="padding:4px 0">Balance Due</td><td></td><td></td><td style="text-align:right;color:${bal>0?'#e74c3c':'#27ae60'}">${rs(bal)}</td></tr></tfoot>
        </table>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

function printPurchase(idx){
  const p=(store.purchases||[])[idx];
  if(!p)return;
  const rows=(p.rows||[]).map(r=>`<tr><td>${r.item||''}</td><td style="text-align:right">${r.qty||0}</td><td style="text-align:right">${rs(r.price||0)}</td><td style="text-align:right">${rs((r.qty||0)*(r.price||0))}</td></tr>`).join('');
  const w=window.open('','','width=800,height=600');
  w.document.write(`<html><head><title>Purchase ${p.no||''}</title><style>body{font-family:Arial;padding:30px}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;border-bottom:1px solid #eee;text-align:left}th{background:#f5f5f5}.r{text-align:right}.total{font-weight:700;border-top:2px solid #333}</style></head><body>
    <h2>Purchase Invoice</h2>
    <p><b>Party:</b> ${p.party||'-'} | <b>Date:</b> ${p.date||'-'} | <b>Invoice:</b> ${p.no||'-'}</p>
    <table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr class="total"><td>Total</td><td></td><td></td><td class="r">${rs(p.total)}</td></tr>
    <tr><td>Received</td><td></td><td></td><td class="r" style="color:green">${rs(p.received||0)}</td></tr>
    <tr class="total"><td>Balance Due</td><td></td><td></td><td class="r" style="color:red">${rs(p.total-p.received)}</td></tr></tfoot></table>
    </body></html>`);
  w.document.close(); w.print();
}

function sharePurchase(idx){
  const p=(store.purchases||[])[idx];
  if(!p)return;
  const txt=`Purchase Invoice: ${p.no}\nParty: ${p.party}\nDate: ${p.date}\nTotal: ${rs(p.total)}\nReceived: ${rs(p.received||0)}\nBalance: ${rs(p.total-p.received)}`;
  if(navigator.share){navigator.share({title:'Purchase',text:txt}).catch(()=>{})}
  else{navigator.clipboard.writeText(txt);toast('Copied to clipboard!')}
}

function deletePurchase(idx){
  if(!hasPermission('delete','item')){showNoAccess();return;}
  const p=(store.purchases||[])[idx];
  if(!p)return;
  if(!confirm(`Delete purchase ${p.no}? This cannot be undone.`))return;
  (p.rows||[]).forEach(r=>{const it=store.items.find(x=>x.name===r.item);if(it)it.stock+=r.qty});
  store.purchases.splice(idx,1);
  persist();toast('Purchase deleted');vPurchase();
}

function exportPurchaseExcel(){
  const rows=[['Date','Invoice No','Party','Payment Type','Amount','Balance Due','Status']];
  (store.purchases||[]).forEach(p=>{
    const bal=p.total-p.received;
    rows.push([p.date||'',p.no||'',p.party||'',bal<=0?'Cash':'Credit',p.total,bal,bal<=0?'Paid':'Unpaid']);
  });
  const csv=rows.map(r=>r.join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='purchase_bills.csv';a.click();
  toast('Excel exported!');
}

function printPurchaseList(){
  const rows=(store.purchases||[]).map(p=>`<tr><td>${p.date||''}</td><td>${p.no||''}</td><td>${p.party||''}</td><td style="text-align:right">${rs(p.total)}</td><td style="text-align:right">${rs(p.total-p.received)}</td><td>${p.total-p.received<=0?'Paid':'Unpaid'}</td></tr>`).join('');
  const w=window.open('','','width=900,height=600');
  w.document.write(`<html><head><title>Purchase Bills</title><style>body{font-family:Arial;padding:30px}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;border-bottom:1px solid #eee;text-align:left}th{background:#f5f5f5}.r{text-align:right}</style></head><body><h2>Purchase Bills Report</h2><table><thead><tr><th>Date</th><th>Invoice</th><th>Party</th><th class="r">Amount</th><th class="r">Balance</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
  w.document.close(); w.print();
}
function filterPurchaseRows(q){
  q=(q||'').toLowerCase();
  document.querySelectorAll('.purchase-row').forEach(r=>{
    r.style.display=r.textContent.toLowerCase().includes(q)?'':'none';
  });
}

let poData={party:'',phone:'',rows:[{item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0}],payMode:'Cash',discP:0,discA:0};

function vPurchaseOrder(){
  const orders=(store.purchaseOrders||[]);
  if(!orders.length){
    content.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
      <div style="text-align:center;max-width:400px">
        <div style="width:120px;height:120px;margin:0 auto 20px;background:#f0f4f8;border-radius:50%;display:flex;align-items:center;justify-content:center">
          <svg viewBox="0 0 64 64" width="64" height="64"><rect x="14" y="8" width="36" height="48" rx="4" fill="#fff" stroke="#555" stroke-width="2.5"/><line x1="22" y1="20" x2="42" y2="20" stroke="#bbb" stroke-width="2"/><line x1="22" y1="28" x2="42" y2="28" stroke="#bbb" stroke-width="2"/><line x1="22" y1="36" x2="36" y2="36" stroke="#bbb" stroke-width="2"/><path d="M42 8V4a4 4 0 0 1 4 4h-4z" fill="#e8e8e8"/></svg>
        </div>
        <h2 style="font-size:22px;font-weight:800;color:#222;margin-bottom:8px">Purchase Order</h2>
        <p style="font-size:14px;color:#888;margin-bottom:20px">Create purchase orders for your suppliers.</p>
        <button onclick="openPurchaseOrderForm()" style="padding:12px 28px;background:#e74c3c;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">+ Add Purchase Order</button>
      </div>
    </div>`;
  } else {
    renderPurchaseOrderList();
  }
}

function renderPurchaseOrderList(){
  const orders=(store.purchaseOrders||[]).reverse();
  content.innerHTML=`
  <div class="hub-header"><h2>Purchase Orders</h2><button class="hub-btn hub-btn-red" onclick="openPurchaseOrderForm()" ${hasPermission('create','purchase-order')?'':'style="display:none"'}>＋ Add Purchase Order</button></div>
  <div class="hub-card"><div style="overflow-x:auto">
    <table class="hub-table"><thead><tr>
      <th>DATE</th><th>ORDER NO</th><th>PARTY</th><th class="right">TOTAL</th><th>STATUS</th><th style="width:100px"></th>
    </tr></thead><tbody>${orders.map((o,i)=>{
      const total=(o.rows||[]).reduce((a,r)=>a+((r.qty||0)*(r.price||0)-(r.discA||0)),0);
      return `<tr>
        <td>${o.date||'-'}</td><td>${o.orderNo||'-'}</td><td style="font-weight:500">${o.party||'-'}</td>
        <td class="right">${rs(total)}</td>
        <td><span class="hub-pill hub-pill-paid">${o.status||'Pending'}</span></td>
        <td><div class="hub-actions">
          <span class="hub-action-icon" onclick="viewPurchaseOrder(${i})" title="View">👁️</span>
          <span class="hub-action-icon" onclick="printPurchaseOrder(${i})" title="Print">🖨️</span>
          <span class="hub-action-icon" onclick="deletePurchaseOrder(${i})" title="Delete">🗑️</span>
        </div></td>
      </tr>`;
    }).join('')||`<tr><td colspan="6" class="hub-empty"><div style="font-size:48px;margin-bottom:10px">📋</div><div class="hub-empty-title">No Purchase Orders</div></td></tr>`}</tbody></table>
  </div></div>`;
}

function openPurchaseOrderForm(){
  if(!hasPermission('create','purchase-orders')){showNoAccess();return;}
  const nextNo=(store.purchaseOrders||[]).length+1;
  poData={party:'',phone:'',rows:[{item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0}],payMode:'Cash',discP:0,discA:0,orderNo:nextNo,date:new Date().toISOString().split('T')[0],dueDate:new Date().toISOString().split('T')[0]};
  renderPOForm();
}

function renderPOForm(){
  const units=['NONE','PCS','BOX','SET','DOZ','KG','M','LTR','BAG','ROLL'];
  const itemList=(store.items||[]).map(it=>`<div class="po-item-opt" data-name="${it.name}" data-code="${it.code||''}" onclick="poSelectItem(${JSON.stringify(it).replace(/"/g,'&quot;')})" style="display:flex;align-items:center;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f5f5f5;gap:12px">
    <div style="flex:1"><div style="font-weight:600;font-size:13px">${it.name}</div><div style="font-size:11px;color:#999">${it.code||''}</div></div>
    <div style="text-align:right;min-width:70px"><div style="font-size:11px;color:#888">SALE</div><div style="font-weight:600;font-size:13px">${rs(it.price)}</div></div>
    <div style="text-align:right;min-width:70px"><div style="font-size:11px;color:#888">PURCHASE</div><div style="font-weight:600;font-size:13px">${rs(it.pprice||0)}</div></div>
    <div style="text-align:right;min-width:50px"><div style="font-size:11px;color:#888">STOCK</div><div style="font-weight:700;font-size:13px;color:${(it.stock||0)>0?'#27ae60':'#e74c3c'}">${it.stock||0}</div></div>
  </div>`).join('');

  const rowsHtml=poData.rows.map((r,idx)=>{
    const amt=(r.qty||0)*(r.price||0)-(r.discA||0);
    return `<tr>
      <td style="width:30px;text-align:center;color:#999;font-size:12px">${idx+1}</td>
      <td><input value="${r.item}" onfocus="poFilterItems(this,'')" onblur="setTimeout(hideSharedItemDropdown,300)" oninput="poUpdateItem(${idx},this.value);poFilterItems(this,this.value)" placeholder="Search item..." style="width:100%;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><input value="${r.desc}" oninput="poData.rows[${idx}].desc=this.value" style="width:100%;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><input value="${r.count}" oninput="poData.rows[${idx}].count=this.value" style="width:70px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><input value="${r.size}" oninput="poData.rows[${idx}].size=this.value" style="width:60px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><input type="number" value="${r.qty}" oninput="poUpdateRow(${idx},'qty',this.value)" style="width:60px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><select onchange="poData.rows[${idx}].unit=this.value" style="padding:6px;border:1px solid #eee;border-radius:4px;font-size:12px">${units.map(u=>`<option ${r.unit===u?'selected':''}>${u}</option>`).join('')}</select></td>
      <td><input type="number" value="${r.price}" oninput="poUpdateRow(${idx},'price',this.value)" style="width:80px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><input type="number" value="${r.discP||0}" oninput="poUpdateRow(${idx},'discP',this.value)" style="width:50px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:12px" placeholder="%"></td>
      <td><input type="number" value="${r.discA||0}" oninput="poUpdateRow(${idx},'discA',this.value)" style="width:60px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:12px"></td>
      <td style="font-weight:600;text-align:right">${rs(amt)}</td>
      <td><span style="cursor:pointer;color:#e74c3c;font-size:16px" onclick="poRemoveRow(${idx})">✕</span></td>
    </tr>`;
  }).join('');

  const totals=poCalcTotals();

  content.innerHTML=`
  <div style="background:#fff;min-height:100vh;padding-bottom:20px">
    <div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid #eee;background:#f8f9fa">
      <span style="font-size:18px;font-weight:700">Purchase Order #${poData.orderNo}</span>
      <span style="flex:1"></span>
      <span style="cursor:pointer;font-size:20px" onclick="vPurchaseOrder()">✕</span>
    </div>
    <div style="padding:20px 24px">
      <div style="display:flex;gap:30px;margin-bottom:20px;flex-wrap:wrap">
        <div style="flex:1;min-width:250px">
          <label style="display:block;font-size:13px;color:#2f6df6;font-weight:600;margin-bottom:6px">Search by Name/Phone *</label>
          <select id="po_party" onchange="poData.party=this.value;poData.phone=this.options[this.selectedIndex].dataset.phone||''" style="width:100%;padding:10px 12px;border:1px solid #2f6df6;border-radius:8px;font-size:14px">
            <option value="">Select party...</option>
            ${store.parties.map(p=>`<option value="${p.name}" data-phone="${p.phone||''}">${p.name} ${p.phone?'('+p.phone+')':''}</option>`).join('')}
          </select>
        </div>
        <div style="min-width:200px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label style="font-size:13px;color:#666;min-width:80px">Order No.</label><input value="${poData.orderNo}" onchange="poData.orderNo=this.value" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;width:100px"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label style="font-size:13px;color:#666;min-width:80px">Order Date</label><input type="date" value="${poData.date}" onchange="poData.date=this.value" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px"></div>
          <div style="display:flex;align-items:center;gap:10px"><label style="font-size:13px;color:#666;min-width:80px">Due Date</label><input type="date" value="${poData.dueDate}" onchange="poData.dueDate=this.value" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px"></div>
        </div>
      </div>
      <div style="overflow-x:auto;border:1px solid #eee;border-radius:8px;margin-bottom:16px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f8f9fa;border-bottom:2px solid #eee">
            <th style="padding:10px 8px;width:30px">#</th>
            <th style="padding:10px 8px;min-width:180px">ITEM</th>
            <th style="padding:10px 8px;min-width:120px">DESCRIPTION</th>
            <th style="padding:10px 8px;min-width:70px">COUNT</th>
            <th style="padding:10px 8px;min-width:60px">SIZE</th>
            <th style="padding:10px 8px;min-width:60px">QTY</th>
            <th style="padding:10px 8px">UNIT</th>
            <th style="padding:10px 8px;min-width:80px">PRICE/UNIT</th>
            <th style="padding:10px 8px;min-width:50px">DISC %</th>
            <th style="padding:10px 8px;min-width:60px">DISC Amt</th>
            <th style="padding:10px 8px;min-width:80px;text-align:right">AMOUNT</th>
            <th style="padding:10px 8px;width:30px"></th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <button onclick="poAddRow()" style="padding:6px 16px;border:2px solid #2f6df6;color:#2f6df6;background:#fff;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:20px">+ ADD ROW</button>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:20px;border-top:2px solid #eee;padding-top:16px">
        <div>
          <div style="margin-bottom:12px"><label style="font-size:13px;color:#666;margin-right:8px">Payment Type</label>
            <select id="po_payMode" onchange="poData.payMode=this.value" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px">
              <option>Cash</option><option>Bank Transfer</option><option>QR Code</option><option>Card Payment</option>
            </select></div>
          <span style="color:#2f6df6;font-size:13px;cursor:pointer;font-weight:600">+ Add Payment type</span>
        </div>
        <div style="text-align:right">
          <div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;justify-content:flex-end"><span style="font-size:13px;color:#666">Discount</span><input type="number" value="${poData.discP}" oninput="poData.discP=+this.value;poRecalcDisc()" style="width:60px;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;text-align:right"><span style="font-size:12px;color:#999">(%)</span><span style="color:#999">-</span><input type="number" value="${poData.discA}" oninput="poData.discA=+this.value;poRecalc()" style="width:80px;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;text-align:right"><span style="font-size:12px;color:#999">(Rs)</span></div>
          <div style="font-size:13px;color:#666;margin-bottom:4px">Subtotal: <b>${rs(totals.subtotal)}</b></div>
          <div style="font-size:13px;color:#666;margin-bottom:4px">Discount: <b style="color:#e74c3c">-${rs(totals.disc)}</b></div>
          <div style="font-size:20px;font-weight:800;color:#2f6df6;border-top:2px solid #eee;padding-top:8px;margin-top:4px">Total: ${rs(totals.total)}</div>
        </div>
      </div>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:12px;background:#f8f9fa">
      <button onclick="sharePurchaseOrder()" style="padding:10px 24px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;font-weight:600">Share ▾</button>
      <button onclick="savePurchaseOrder()" style="padding:10px 32px;border:none;border-radius:8px;background:#2f6df6;color:#fff;cursor:pointer;font-size:14px;font-weight:700">Save</button>
    </div>
  </div>`;
}

function poSelectItem(it){
  const lastRow=poData.rows[poData.rows.length-1];
  if(lastRow.item&&lastRow.qty>0) poData.rows.push({item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0});
  const idx=poData.rows.length-1;
  poData.rows[idx].item=it.name;
  poData.rows[idx].price=it.pprice||it.price||0;
  poData.rows[idx].desc=it.code||'';
  renderPOForm();
}

function poUpdateItem(idx,val){poData.rows[idx].item=val;}
function showSharedItemDropdown(input,itemsHtml,filterVal,onSelectFn){
  let dd=document.getElementById('sharedItemDrop');
  if(!dd){dd=document.createElement('div');dd.id='sharedItemDrop';dd.style.cssText='display:none;position:fixed;background:#fff;border:1px solid #ddd;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.15);z-index:9999;max-height:250px;overflow-y:auto;min-width:200px';document.body.appendChild(dd);}
  dd.innerHTML=itemsHtml;
  const r=input.getBoundingClientRect();
  dd.style.left=r.left+'px';
  dd.style.top=r.bottom+'px';
  dd.style.width=Math.max(r.width,200)+'px';
  dd.style.display='block';
  const q=(filterVal||'').toLowerCase();
  Array.from(dd.children).forEach(opt=>{
    const name=(opt.getAttribute('data-name')||'').toLowerCase();
    const code=(opt.getAttribute('data-code')||'').toLowerCase();
    opt.style.display=(!q||name.includes(q)||code.includes(q))?'flex':'none';
  });
  dd._onSelect=onSelectFn;
}
function hideSharedItemDropdown(){const dd=document.getElementById('sharedItemDrop');if(dd)dd.style.display='none';}
function sharedItemPick(id){
  const dd=document.getElementById('sharedItemDrop');if(!dd||!dd._onSelect)return;
  const item=store.items.find(x=>x.id===id);
  if(item) dd._onSelect(item);
  dd.style.display='none';
}
function poFilterItems(input,val){
  const itemList=(store.items||[]).map(it=>`<div class="po-item-opt" data-name="${it.name}" data-code="${it.code||''}" onmousedown=\"event.preventDefault();sharedItemPick('${it.id}')" style="display:flex;align-items:center;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f5f5f5;gap:12px">
    <div style="flex:1"><div style="font-weight:600;font-size:13px">${it.name}</div><div style="font-size:11px;color:#999">${it.code||''}</div></div>
    <div style="text-align:right;min-width:70px"><div style="font-size:11px;color:#888">SALE</div><div style="font-weight:600;font-size:13px">${rs(it.price)}</div></div>
    <div style="text-align:right;min-width:70px"><div style="font-size:11px;color:#888">PURCHASE</div><div style="font-weight:600;font-size:13px">${rs(it.pprice||0)}</div></div>
    <div style="text-align:right;min-width:50px"><div style="font-size:11px;color:#888">STOCK</div><div style="font-weight:700;font-size:13px;color:${(it.stock||0)>0?'#27ae60':'#e74c3c'}">${it.stock||0}</div></div>
  </div>`).join('');
  showSharedItemDropdown(input,itemList,val,(it)=>{
    const lastRow=poData.rows[poData.rows.length-1];
    if(lastRow.item&&lastRow.qty>0) poData.rows.push({item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0});
    const idx=poData.rows.length-1;
    poData.rows[idx].item=it.name;
    poData.rows[idx].price=it.pprice||it.price||0;
    poData.rows[idx].desc=it.code||'';
    renderPOForm();
  });
}
function poUpdateRow(idx,field,val){
  poData.rows[idx][field]=field==='item'||field==='desc'||field==='count'||field==='size'?val:+val||0;
  if(field==='discP'&&poData.rows[idx].price){
    poData.rows[idx].discA=Math.round(poData.rows[idx].qty*poData.rows[idx].price*poData.rows[idx].discP/100);
  }
  poRecalc();
}

function poAddRow(){poData.rows.push({item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0});renderPOForm();}
function poRemoveRow(idx){if(poData.rows.length>1){poData.rows.splice(idx,1);renderPOForm();}}
function poRecalcDisc(){
  poData.rows.forEach(r=>{
    if(r.discP&&r.price) r.discA=Math.round(r.qty*r.price*r.discP/100);
  });
  poRecalc();
}
function poRecalc(){renderPOForm();}

function poCalcTotals(){
  let subtotal=0,disc=0;
  poData.rows.forEach(r=>{
    const lineTotal=(r.qty||0)*(r.price||0);
    subtotal+=lineTotal;
    disc+=(r.discA||0);
  });
  disc+=poData.discA||0;
  if(poData.discP) disc+=Math.round((subtotal-disc)*poData.discP/100);
  return{subtotal,disc,total:Math.max(subtotal-disc,0)};
}

function savePurchaseOrder(){
  if(!poData.party) return toast('Select a party');
  const t=poCalcTotals();
  const dt=poData.date.split('-');
  const order={id:id(),orderNo:poData.orderNo,party:poData.party,phone:poData.phone,date:dt[2]+'/'+dt[1]+'/'+dt[0],dueDate:poData.dueDate,rows:[...poData.rows],payMode:poData.payMode,discP:poData.discP,discA:poData.discA,total:t.total,status:'Pending'};
  if(!store.purchaseOrders) store.purchaseOrders=[];
  store.purchaseOrders.push(order);
  persist();
  toast('Purchase Order saved!');
  showPOPreview(order);
}

function showPOPreview(order){
  const rows=(order.rows||[]).map((r,i)=>{
    const amt=(r.qty||0)*(r.price||0)-(r.discA||0);
    return `<tr><td>${i+1}</td><td>${r.item||''}<br><small style="color:#888">${r.desc||''}</small></td><td style="text-align:right">${r.qty} ${r.unit||''}</td><td style="text-align:right">${rs(r.price)}</td><td style="text-align:right">${rs(amt)}</td></tr>`;
  }).join('');
  const biz=store.business||{};
  content.innerHTML=`
  <div style="display:flex;min-height:100vh;background:#f0f2f5">
    <div style="width:200px;background:#fff;border-right:1px solid #eee;padding:16px">
      <h3 style="font-size:14px;margin-bottom:12px">Select Theme</h3>
      <div style="padding:10px;border-radius:6px;cursor:pointer;background:#e8f4fd;font-weight:600;font-size:13px;margin-bottom:6px">Classic Theme</div>
      <div style="padding:10px;border-radius:6px;cursor:pointer;font-size:13px;margin-bottom:6px">Modern Theme</div>
      <div style="padding:10px;border-radius:6px;cursor:pointer;font-size:13px;margin-bottom:6px">Minimal Theme</div>
    </div>
    <div style="flex:1;padding:30px;display:flex;justify-content:center">
      <div style="width:600px;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:30px">
        <div style="text-align:center;margin-bottom:16px">
          ${biz.logo?`<img src="${biz.logo}" style="max-height:60px;margin-bottom:8px">`:''}
          <h2 style="font-size:20px;margin:0">${biz.name||'My Business'}</h2>
          ${biz.phone?`<p style="margin:4px 0;font-size:13px;color:#666">Ph.No.: ${biz.phone}</p>`:''}
          ${biz.email?`<p style="margin:4px 0;font-size:13px;color:#666">Email: ${biz.email}</p>`:''}
        </div>
        <hr style="border:none;border-top:2px dashed #333;margin:12px 0">
        <h3 style="text-align:center;margin:0 0 8px">Purchase Order</h3>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
          <span>Order No.: ${order.orderNo}</span><span>Date: ${order.date}</span>
        </div>
        <div style="font-size:13px;margin-bottom:12px">Party: <b>${order.party}</b></div>
        <hr style="border:none;border-top:1px dashed #999;margin:8px 0">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="border-bottom:2px dashed #333"><th style="text-align:left;padding:6px 0">#</th><th style="text-align:left">Item Name</th><th style="text-align:right">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr style="border-top:2px dashed #333;font-weight:700"><td colspan="4" style="padding:8px 0">Total</td><td style="text-align:right">${rs(order.total)}</td></tr></tfoot>
        </table>
        <hr style="border:none;border-top:2px dashed #333;margin:12px 0">
        <div style="font-size:13px;text-align:center;color:#666">Balance: ${rs(order.total)}</div>
      </div>
    </div>
    <div style="width:200px;background:#fff;border-left:1px solid #eee;padding:16px">
      <h3 style="font-size:14px;margin-bottom:12px">Share Invoice</h3>
      <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
        <div onclick="toast('WhatsApp sharing')" style="text-align:center;cursor:pointer;padding:10px;border:1px solid #eee;border-radius:8px;flex:1;min-width:60px"><div style="font-size:24px">💬</div><div style="font-size:11px">WhatsApp</div></div>
        <div onclick="toast('Gmail sharing')" style="text-align:center;cursor:pointer;padding:10px;border:1px solid #eee;border-radius:8px;flex:1;min-width:60px"><div style="font-size:24px">📧</div><div style="font-size:11px">Gmail</div></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div onclick="toast('PDF downloading')" style="text-align:center;cursor:pointer;padding:10px;border:1px solid #eee;border-radius:8px;flex:1;min-width:60px"><div style="font-size:24px">📥</div><div style="font-size:11px">PDF</div></div>
        <div onclick="window.print()" style="text-align:center;cursor:pointer;padding:10px;border:1px solid #eee;border-radius:8px;flex:1;min-width:60px"><div style="font-size:24px">🖨️</div><div style="font-size:11px">Print</div></div>
      </div>
    </div>
  </div>
  <div style="padding:16px 24px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:12px;background:#f8f9fa">
    <button onclick="vPurchaseOrder()" style="padding:10px 24px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;font-weight:600">Close</button>
  </div>`;
}

function printPurchaseOrder(idx){
  const o=(store.purchaseOrders||[])[idx];
  if(!o)return;
  const rows=(o.rows||[]).map((r,i)=>`<tr><td>${i+1}</td><td>${r.item}</td><td style="text-align:right">${r.qty} ${r.unit||''}</td><td style="text-align:right">${rs(r.price)}</td><td style="text-align:right">${rs((r.qty||0)*(r.price||0)-(r.discA||0))}</td></tr>`).join('');
  const w=window.open('','','width=800,height=600');
  w.document.write(`<html><head><title>PO ${o.orderNo}</title><style>body{font-family:Arial;padding:30px}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;border-bottom:1px solid #eee;text-align:left}.r{text-align:right}</style></head><body><h2>Purchase Order #${o.orderNo}</h2><p><b>Party:</b> ${o.party} | <b>Date:</b> ${o.date} | <b>Due:</b> ${o.dueDate}</p><table><thead><tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody><tfoot><tr style="font-weight:700;border-top:2px solid #333"><td colspan="4">Total</td><td class="r">${rs(o.total)}</td></tr></tfoot></table></body></html>`);
  w.document.close();w.print();
}

function deletePurchaseOrder(idx){
  if(!hasPermission('delete','item')){showNoAccess();return;}
  if(!confirm('Delete this Purchase Order?'))return;
  store.purchaseOrders.splice(idx,1);
  persist();toast('Deleted');vPurchaseOrder();
}

function viewPurchaseOrder(idx){
  const o=(store.purchaseOrders||[])[idx];
  if(!o)return;
  showPOPreview(o);
}

function sharePurchaseOrder(){
  const txt=`Purchase Order #${poData.orderNo}\nParty: ${poData.party}\nDate: ${poData.date}\nTotal: ${rs(poCalcTotals().total)}`;
  if(navigator.share){navigator.share({title:'Purchase Order',text:txt}).catch(()=>{})}
  else{navigator.clipboard.writeText(txt);toast('Copied!')}
}
let pfTabs=[];
let pfActiveTab=0;
function pfInitTab(){
  return {rows:[{item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0}],party:'',phone:'',poNo:'',poDate:'',billDate:new Date().toISOString().split('T')[0],payMode:'Cash',discP:'',discA:''};
}
function vPurchaseForm(){
  if(!pfTabs.length){pfTabs.push(pfInitTab());pfActiveTab=0;}
  if(!pfTabs[pfActiveTab]){pfActiveTab=pfTabs.length-1;}
  const cur=pfTabs[pfActiveTab];
  const purchaseNum=(store.counters.purchaseBase||1)+pfActiveTab;
  const units=['NONE','Pcs','Kg','Mtr','Ltr','Box','Bag','Set','Pair','Roll','Pack'];
  function calcRowTotal(r){return (r.qty||1)*(r.price||0)-(r.discA||0);}
  const grandTotal=cur.rows.reduce((a,r)=>a+calcRowTotal(r),0);
  const totalQty=cur.rows.reduce((a,r)=>a+(+r.qty||0),0);
  content.className='content pf-active';
  content.innerHTML=`
  <div class="pf-page">
    <div class="pf-tabs">
      ${pfTabs.map((tab,i)=>{
        const num=(store.counters.purchaseBase||1)+i;
        return `<div class="pf-tab ${i===pfActiveTab?'active':''}" onclick="pfSwitchTab(${i})">
          <span>Purchase #${num}</span>
          <span class="pf-tab-close" onclick="event.stopPropagation();pfCloseTab(${i})">✕</span>
        </div>`;
      }).join('')}
      <div class="pf-tab-add" onclick="pfAddTab()" title="New Purchase Tab">+</div>
      <div style="flex:1"></div>
      <div class="pf-topbar-icons">
        <div class="pf-topbar-icon" title="Calculator">🧮</div>
        <div class="pf-topbar-icon" title="Settings" onclick="setTab='transaction';nav('settings')">⚙️</div>
        <div class="pf-topbar-icon" onclick="nav('home')" title="Close">✕</div>
      </div>
    </div>
    <div class="pf-scroll">
      <div class="pf-title">Purchase</div>
      <div class="pf-row">
        <div class="pf-field pf-field-party">
          <label class="pf-label">Search by Name/Phone <span style="color:var(--red)">*</span></label>
          <select id="pfParty" onchange="pfTabs[${pfActiveTab}].party=this.value"><option value="">Select Party</option>${(store.parties||[]).map(p=>`<option value="${p.id}" ${cur.party===p.id?'selected':''}>${p.name}${p.phone?' ('+p.phone+')':''}</option>`).join('')}</select>
        </div>
        <div class="pf-field">
          <label class="pf-label">Phone No.</label>
          <input type="text" id="pfPhone" placeholder="Phone No." value="${cur.phone}" oninput="pfTabs[${pfActiveTab}].phone=this.value">
        </div>
        <div class="pf-field">
          <label class="pf-label">PO No.</label>
          <input type="text" id="pfPONo" placeholder="PO No." value="${cur.poNo}" oninput="pfTabs[${pfActiveTab}].poNo=this.value">
        </div>
        <div class="pf-field pf-field-billno">
          <label class="pf-label">Bill Number</label>
          <div class="pf-bill-val">Purchase #${purchaseNum}</div>
        </div>
      </div>
      <div class="pf-row">
        <div class="pf-field">
          <label class="pf-label">PO Date.</label>
          <input type="date" id="pfPODate" value="${cur.poDate}" oninput="pfTabs[${pfActiveTab}].poDate=this.value">
        </div>
        <div class="pf-field pf-field-billdate">
          <label class="pf-label">Bill Date</label>
          <input type="date" id="pfDate" value="${cur.billDate}" oninput="pfTabs[${pfActiveTab}].billDate=this.value">
        </div>
      </div>
      <div class="pf-table-wrap">
        <table class="pf-table">
          <thead><tr>
            <th class="pf-th-scan" title="Scan Barcode">📱</th>
            <th class="pf-th-item">ITEM</th>
            <th class="pf-th-desc">DESCRIPTION</th>
            <th class="pf-th-count">COUNT</th>
            <th class="pf-th-size">SIZE</th>
            <th class="pf-th-qty">QTY</th>
            <th class="pf-th-unit">UNIT</th>
            <th class="pf-th-price">PRICE/UNIT</th>
            <th class="pf-th-disc">DISCOUNT<br><span style="font-weight:400;font-size:8px">% &nbsp;&nbsp; AMOUNT</span></th>
            <th class="pf-th-amt">AMOUNT</th>
            <th class="pf-th-add"><span class="pf-add-col-icon" onclick="pfAddRow()" title="Add Row">⊕</span></th>
          </tr></thead>
          <tbody id="pfItemsBody">
            ${cur.rows.map((r,i)=>{
              const amt=calcRowTotal(r);
              const pfItemList=(store.items||[]).map(it=>`<div class="pf-item-opt" data-name="${it.name}" data-code="${it.code||''}" onclick="pfSelectItem(${i},${JSON.stringify(it).replace(/"/g,'&quot;')})" style="display:flex;align-items:center;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f5f5f5;gap:10px">
                <div style="flex:1"><div style="font-weight:600;font-size:12px">${it.name}</div><div style="font-size:10px;color:#999">${it.code||''}</div></div>
                <div style="text-align:right;min-width:60px"><div style="font-size:10px;color:#888">SALE</div><div style="font-weight:600;font-size:12px">${rs(it.price)}</div></div>
                <div style="text-align:right;min-width:60px"><div style="font-size:10px;color:#888">PURCHASE</div><div style="font-weight:600;font-size:12px">${rs(it.pprice||0)}</div></div>
                <div style="text-align:right;min-width:40px"><div style="font-size:10px;color:#888">STOCK</div><div style="font-weight:700;font-size:12px;color:${(it.stock||0)>0?'#27ae60':'#e74c3c'}">${it.stock||0}</div></div>
              </div>`).join('');
              return `<tr>
                <td class="pf-td-num">${i+1}</td>
                <td><input placeholder="Search item..." value="${r.item}" onfocus="pfFilterItems(this,'',${i})" onblur="setTimeout(hideSharedItemDropdown,300)" oninput="pfTabs[${pfActiveTab}].rows[${i}].item=this.value;pfFilterItems(this,this.value,${i})" autocomplete="off" style="width:100%;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
                <td><input placeholder="Description" value="${r.desc}" oninput="pfTabs[${pfActiveTab}].rows[${i}].desc=this.value"></td>
                <td><input type="number" value="${r.count}" oninput="pfTabs[${pfActiveTab}].rows[${i}].count=this.value"></td>
                <td><input placeholder="Size" value="${r.size}" oninput="pfTabs[${pfActiveTab}].rows[${i}].size=this.value"></td>
                <td><input type="number" value="${r.qty}" min="1" oninput="pfTabs[${pfActiveTab}].rows[${i}].qty=+this.value||1;pfRefresh()"></td>
                <td><select onchange="pfTabs[${pfActiveTab}].rows[${i}].unit=this.value">${units.map(u=>`<option ${r.unit===u?'selected':''}>${u}</option>`).join('')}</select></td>
                <td><input type="number" value="${r.price}" oninput="pfTabs[${pfActiveTab}].rows[${i}].price=+this.value||0;pfRefresh()"></td>
                <td class="pf-td-disc"><input type="number" value="${r.discP}" placeholder="%" oninput="pfTabs[${pfActiveTab}].rows[${i}].discP=+this.value||0;pfTabs[${pfActiveTab}].rows[${i}].discA=Math.round(pfTabs[${pfActiveTab}].rows[${i}].price*pfTabs[${pfActiveTab}].rows[${i}].qty*(+this.value||0)/100);pfRefresh()"><input type="number" value="${r.discA}" oninput="pfTabs[${pfActiveTab}].rows[${i}].discA=+this.value||0;pfRefresh()"></td>
                <td class="pf-td-amt">${rs(amt)}</td>
                <td class="pf-td-x"><span onclick="pfRemoveRow(${i})" class="pf-row-x" title="Remove">✕</span></td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot><tr>
            <td></td>
            <td colspan="2"><span class="pf-add-row-btn" onclick="pfAddRow()">+ ADD ROW</span></td>
            <td class="pf-td-label" colspan="3">TOTAL</td>
            <td class="pf-td-total-qty">${totalQty}</td>
            <td></td>
            <td class="pf-td-total-disc">${rs(cur.rows.reduce((a,r)=>a+(r.discA||0),0))}</td>
            <td class="pf-td-total-amt">${rs(grandTotal)}</td>
            <td></td>
          </tr></tfoot>
        </table>
      </div>
      <div class="pf-bottom">
        <div class="pf-bottom-left">
          <div class="pf-label">Payment Type</div>
          <select class="pf-pay-select" id="pfPayMode" onchange="pfTabs[${pfActiveTab}].payMode=this.value">
            <option ${cur.payMode==='Cash'?'selected':''}>Cash</option><option ${cur.payMode==='Credit'?'selected':''}>Credit</option><option ${cur.payMode==='Card Payment'?'selected':''}>Card Payment</option><option ${cur.payMode==='UPI'?'selected':''}>UPI</option><option ${cur.payMode==='Bank Transfer'?'selected':''}>Bank Transfer</option>
          </select>
          <div class="pf-add-payment" onclick="toast('Multiple payment types coming soon')">+ Add Payment type</div>
        </div>
        <div class="pf-bottom-right">
          <div class="pf-disc-row">
            <span class="pf-label">Discount</span>
            <input type="number" id="pfDiscP" placeholder="(%)" oninput="pfTabs[${pfActiveTab}].discP=this.value;pfRefresh()" class="pf-disc-input" value="${cur.discP}">
            <span class="pf-disc-sep">-</span>
            <input type="number" id="pfDiscA" placeholder="(Rs)" oninput="pfTabs[${pfActiveTab}].discA=this.value;pfRefresh()" class="pf-disc-input" value="${cur.discA}">
          </div>
        </div>
      </div>
    </div>
    <div class="pf-footer">
      <button class="pf-share-btn" onclick="toast('Share coming soon')">Share <span class="pf-share-arrow">▾</span></button>
      <button class="pf-save-btn" onclick="pfSave()">Save</button>
    </div>
  </div>`;
}
function pfAddTab(){
  pfTabs.push(pfInitTab());
  pfActiveTab=pfTabs.length-1;
  vPurchaseForm();
}
function pfSwitchTab(i){
  pfActiveTab=i;
  vPurchaseForm();
}
function pfCloseTab(i){
  if(pfTabs.length<=1){pfTabs=[pfInitTab()];pfActiveTab=0;vPurchaseForm();return;}
  pfTabs.splice(i,1);
  if(pfActiveTab>=pfTabs.length)pfActiveTab=pfTabs.length-1;
  vPurchaseForm();
}
function pfSelectItem(idx,it){
  const lastRow=pfTabs[pfActiveTab].rows[pfTabs[pfActiveTab].rows.length-1];
  if(lastRow.item&&lastRow.qty>0) pfTabs[pfActiveTab].rows.push({item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0});
  const ri=pfTabs[pfActiveTab].rows.length-1;
  const target=Math.min(idx,ri);
  pfTabs[pfActiveTab].rows[target].item=it.name;
  pfTabs[pfActiveTab].rows[target].price=it.pprice||it.price||0;
  pfTabs[pfActiveTab].rows[target].desc=it.code||'';
  vPurchaseForm();
}
function pfFilterItems(input,val,idx){
  const itemList=(store.items||[]).map(it=>`<div class="pf-item-opt" data-name="${it.name}" data-code="${it.code||''}" onmousedown=\"event.preventDefault();sharedItemPick('${it.id}')" style="display:flex;align-items:center;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f5f5f5;gap:12px">
    <div style="flex:1"><div style="font-weight:600;font-size:13px">${it.name}</div><div style="font-size:11px;color:#999">${it.code||''}</div></div>
    <div style="text-align:right;min-width:70px"><div style="font-size:11px;color:#888">SALE</div><div style="font-weight:600;font-size:13px">${rs(it.price)}</div></div>
    <div style="text-align:right;min-width:70px"><div style="font-size:11px;color:#888">PURCHASE</div><div style="font-weight:600;font-size:13px">${rs(it.pprice||0)}</div></div>
    <div style="text-align:right;min-width:50px"><div style="font-size:11px;color:#888">STOCK</div><div style="font-weight:700;font-size:13px;color:${(it.stock||0)>0?'#27ae60':'#e74c3c'}">${it.stock||0}</div></div>
  </div>`).join('');
  showSharedItemDropdown(input,itemList,val,(it)=>{
    const lastRow=pfTabs[pfActiveTab].rows[pfTabs[pfActiveTab].rows.length-1];
    if(lastRow.item&&lastRow.qty>0) pfTabs[pfActiveTab].rows.push({item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0});
    const ri=pfTabs[pfActiveTab].rows.length-1;
    const target=Math.min(idx,ri);
    pfTabs[pfActiveTab].rows[target].item=it.name;
    pfTabs[pfActiveTab].rows[target].price=it.pprice||it.price||0;
    pfTabs[pfActiveTab].rows[target].desc=it.code||'';
    vPurchaseForm();
  });
}
function pfAddRow(){
  pfTabs[pfActiveTab].rows.push({item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0});
  vPurchaseForm();
}
function pfRemoveRow(i){
  const rows=pfTabs[pfActiveTab].rows;
  if(rows.length<=1)return toast('At least one row required');
  rows.splice(i,1);
  vPurchaseForm();
}
function pfRefresh(){
  const cur=pfTabs[pfActiveTab];
  if(!cur)return;
  function calcRowTotal(r){return (r.qty||1)*(r.price||0)-(r.discA||0);}
  const grandTotal=cur.rows.reduce((a,r)=>a+calcRowTotal(r),0);
  const totalQty=cur.rows.reduce((a,r)=>a+(+r.qty||0),0);
  const totalDisc=cur.rows.reduce((a,r)=>a+(r.discA||0),0);
  const tbody=document.getElementById('pfItemsBody');
  if(!tbody)return;
  const trs=tbody.querySelectorAll('tr');
  trs.forEach((tr,i)=>{
    if(!cur.rows[i])return;
    const amt=calcRowTotal(cur.rows[i]);
    const amtCell=tr.querySelector('.pf-td-amt');
    if(amtCell)amtCell.textContent=rs(amt);
  });
  const tfoot=document.querySelector('.pf-table tfoot');
  if(!tfoot)return;
  const tds=tfoot.querySelectorAll('td');
  tds.forEach(td=>{
    if(td.classList.contains('pf-td-total-qty'))td.textContent=totalQty;
    if(td.classList.contains('pf-td-total-disc'))td.textContent=rs(totalDisc);
    if(td.classList.contains('pf-td-total-amt'))td.textContent=rs(grandTotal);
  });
}
function calcRowTotal(r){return (r.qty||1)*(r.price||0)-(r.discA||0);}
function pfSave(){
  const cur=pfTabs[pfActiveTab];
  if(!cur)return;
  const partyEl=document.getElementById('pfParty');
  const party=partyEl?partyEl.options[partyEl.selectedIndex]?.text:'';
  if(!party||party==='Select Party')return toast('Select a supplier/party');
  const phone=(document.getElementById('pfPhone')?.value||'').trim();
  const date=document.getElementById('pfDate')?.value||new Date().toLocaleDateString('en-GB');
  const mode=document.getElementById('pfPayMode')?.value||'Cash';
  const discP=+document.getElementById('pfDiscP')?.value||0;
  const discA=+document.getElementById('pfDiscA')?.value||0;
  const rows=cur.rows.filter(r=>r.item);
  if(!rows.length)return toast('Add at least one item');
  const total=rows.reduce((a,r)=>a+calcRowTotal(r),0)-discA;
  const invNo='PUR-'+String((store.counters.purchaseBase||1)+pfActiveTab).padStart(2,'0');
  if(!store.purchases)store.purchases=[];
  store.purchases.push({id:id(),no:invNo,party:party.replace(/ \(.*\)/,''),phone,date:dispDate(),rows:rows.map(r=>({item:r.item,qty:r.qty,price:r.price,disc:r.discA||0})),total,received:mode==='Cash'?total:0,discount:discA,status:mode==='Cash'?'paid':'unpaid'});
  store.counters.purchaseBase=(store.counters.purchaseBase||1)+1;
  let p=store.parties.find(x=>x.name===party.replace(/ \(.*\)/,''));
  if(!p){p={id:id(),name:party.replace(/ \(.*\)/,''),phone,type:'supplier',balance:0};store.parties.push(p);}
  p.balance+=total-(mode==='Cash'?total:0);
  persist();
  toast('Purchase saved! '+invNo);
  pfCloseTab(pfActiveTab);
}
function vPurchaseReturn(){
  const s=store.settings||{};
  const now=new Date();
  const curMonth=now.getMonth(), curYear=now.getFullYear();
  const firstDay='01/'+String(curMonth+1).padStart(2,'0')+'/'+curYear;
  const lastDay=new Date(curYear,curMonth+1,0).getDate()+'/'+String(curMonth+1).padStart(2,'0')+'/'+curYear;
  const firms=[(store.business.name||'My Business'),...(store.companies||[]).map(c=>c.name)].filter((v,i,a)=>a.indexOf(v)===i);
  const returns=[...(store.purchaseReturns||[]),...(store.debitNotes||[])].sort((a,b)=>b.date?.localeCompare(a.date)||0).reverse();
  const totalAmt=returns.reduce((a,r)=>a+(r.total||0),0);
  const balanceAmt=returns.reduce((a,r)=>a+((r.total||0)-(r.received||0)),0);
  content.innerHTML=`
  <div class="hub-header">
    <h2>Purchase Return</h2>
    <button class="hub-btn hub-btn-blue" onclick="openDebitNoteForm()">＋ Add Debit Note</button>
  </div>
  <div class="hub-card">
    <div class="hub-filters" style="margin-bottom:12px">
      <div class="hub-filter-chip">This Month <span>▾</span></div>
      <div class="hub-filter-chip red">Between</div>
      <div class="hub-filter-date"><input type="text" value="${firstDay}"></div>
      <span style="font-size:12px;color:var(--muted)">To</span>
      <div class="hub-filter-date"><input type="text" value="${lastDay}"></div>
      <div class="hub-select"><select><option>ALL FIRMS</option>${firms.map(f=>`<option>${f}</option>`).join('')}</select></div>
      <div class="hub-select"><select><option>ALL USERS</option></select></div>
      <div style="flex:1"></div>
      <div class="hub-action-icon" onclick="toast('Excel coming soon')" style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px">
        <span style="font-size:20px">📊</span><span style="font-size:10px;color:var(--muted)">Excel</span>
      </div>
      <div class="hub-action-icon" onclick="window.print()" style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px">
        <span style="font-size:20px">🖨️</span><span style="font-size:10px;color:var(--muted)">Print</span>
      </div>
    </div>
    <div class="hub-filters">
      <div class="hub-select"><select style="min-width:140px"><option>Debit Note</option><option>Credit Note</option></select></div>
      <div class="hub-select"><select style="min-width:140px"><option>All Payment</option><option>Cash</option><option>Credit</option></select></div>
    </div>
  </div>
  <div class="hub-card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
      <input class="hub-search" type="text" placeholder="🔍 Search..." oninput="filterPurchaseReturnRows(this.value)">
      <button class="hub-btn hub-btn-blue" onclick="openDebitNoteForm()">＋ Add Debit Note</button>
    </div>
    <div style="overflow-x:auto">
      <table class="hub-table" id="purchaseReturnTable">
        <thead><tr>
          <th>#</th>
          <th>DATE <span style="font-size:9px">⊞</span></th>
          <th>REF NO. <span style="font-size:9px">⊞</span></th>
          <th>CUSTOMER NAME <span style="font-size:9px">⊞</span></th>
          <th>CATEGORY <span style="font-size:9px">⊞</span></th>
          <th>TYPE <span style="font-size:9px">⊞</span></th>
          <th class="right">TOTAL <span style="font-size:9px">⊞</span></th>
          <th class="right">RECEIVED <span style="font-size:9px">⊞</span></th>
          <th class="right">BALANCE <span style="font-size:9px">⊞</span></th>
          <th>STATUS <span style="font-size:9px">⊞</span></th>
          <th style="width:80px">PRINT/...</th>
        </tr></thead>
        <tbody id="purchaseReturnBody">
          ${returns.length?returns.map((r,i)=>{
            const bal=(r.total||0)-(r.received||0);
            const isPaid=bal<=0;
            return `<tr class="purchaseReturn-row">
              <td style="color:var(--muted)">${i+1}</td>
              <td>${r.date||'-'}</td>
              <td>${r.refNo||r.no||'-'}</td>
              <td style="font-weight:500">${r.party||'-'}</td>
              <td>${r.category||'General'}</td>
              <td>${r.type||'Debit Note'}</td>
              <td class="right">${rs(r.total||0)}</td>
              <td class="right">${rs(r.received||0)}</td>
              <td class="right" style="font-weight:600;color:${isPaid?'var(--green)':'var(--red)'}">${rs(bal)}</td>
              <td><span class="hub-pill ${isPaid?'hub-pill-paid':'hub-pill-unpaid'}">${isPaid?'Paid':'Unpaid'}</span></td>
              <td><div class="hub-actions">
                <span class="hub-action-icon" onclick="toast('Print coming soon')" title="Print">🖨️</span>
                <span class="hub-action-icon" onclick="toast('More')" title="More">⋮</span>
              </div></td>
            </tr>`;
          }).join(''):``}
        </tbody>
      </table>
      ${!returns.length?`
      <div class="hub-empty">
        <div class="hub-empty-icon">
          <svg viewBox="0 0 100 100" width="100" height="100">
            <rect x="15" y="10" width="50" height="65" rx="4" fill="none" stroke="#ccc" stroke-width="2"/>
            <rect x="25" y="20" width="30" height="4" rx="1" fill="#ddd"/>
            <rect x="25" y="28" width="30" height="4" rx="1" fill="#ddd"/>
            <rect x="25" y="36" width="30" height="4" rx="1" fill="#ddd"/>
            <rect x="25" y="44" width="22" height="4" rx="1" fill="#ddd"/>
            <rect x="25" y="52" width="30" height="4" rx="1" fill="#4db8ff" opacity=".4"/>
            <rect x="30" y="14" width="45" height="60" rx="3" fill="none" stroke="#ddd" stroke-width="1.5" stroke-dasharray="4,3"/>
          </svg>
        </div>
        <div class="hub-empty-title">No data is available for Debit Note.</div>
        <div class="hub-empty-sub">Please try again after making relevant changes.</div>
      </div>`:''}
    </div>
    <div class="hub-footer">
      <span>Total Amount: <b style="color:var(--red)">${rs(totalAmt)}</b></span>
      <span>Balance: <b>${rs(balanceAmt)}</b></span>
    </div>
  </div>`;
}
function filterPurchaseReturnRows(q){
  q=(q||'').toLowerCase();
  document.querySelectorAll('.purchaseReturn-row').forEach(r=>{
    r.style.display=r.textContent.toLowerCase().includes(q)?'':'none';
  });
}

let dnData={};
function openDebitNoteForm(){
  const nextNo=(store.debitNotes||[]).length+1;
  dnData={party:'',phone:'',rows:[{item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0}],payMode:'Cash',discP:0,discA:0,returnNo:'DN-'+String(nextNo).padStart(4,'0'),billNo:'',billDate:new Date().toISOString().split('T')[0],date:new Date().toISOString().split('T')[0]};
  renderDebitNoteForm();
}
function renderDebitNoteForm(){
  const units=['NONE','PCS','BOX','SET','DOZ','KG','M','LTR','BAG','ROLL'];
  const itemList=(store.items||[]).map(it=>`<div class="dn-item-opt" data-name="${it.name}" data-code="${it.code||''}" onclick="dnSelectItem(${JSON.stringify(it).replace(/"/g,'&quot;')})" style="display:flex;align-items:center;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f5f5f5;gap:12px">
    <div style="flex:1"><div style="font-weight:600;font-size:13px">${it.name}</div><div style="font-size:11px;color:#999">${it.code||''}</div></div>
    <div style="text-align:right;min-width:70px"><div style="font-size:11px;color:#888">SALE</div><div style="font-weight:600;font-size:13px">${rs(it.price)}</div></div>
    <div style="text-align:right;min-width:70px"><div style="font-size:11px;color:#888">PURCHASE</div><div style="font-weight:600;font-size:13px">${rs(it.pprice||0)}</div></div>
    <div style="text-align:right;min-width:50px"><div style="font-size:11px;color:#888">STOCK</div><div style="font-weight:700;font-size:13px;color:${(it.stock||0)>0?'#27ae60':'#e74c3c'}">${it.stock||0}</div></div>
  </div>`).join('');
  const rowsHtml=dnData.rows.map((r,idx)=>{
    const amt=(r.qty||0)*(r.price||0)-(r.discA||0);
    return `<tr>
      <td style="width:30px;text-align:center;color:#999;font-size:12px">${idx+1}</td>
      <td><input value="${r.item}" onfocus="dnFilterItems(this,'')" onblur="setTimeout(hideSharedItemDropdown,300)" oninput="dnUpdateItem(${idx},this.value);dnFilterItems(this,this.value)" placeholder="Search item..." style="width:100%;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><input value="${r.desc}" oninput="dnData.rows[${idx}].desc=this.value" style="width:100%;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><input value="${r.count}" oninput="dnData.rows[${idx}].count=this.value" style="width:70px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><input value="${r.size}" oninput="dnData.rows[${idx}].size=this.value" style="width:60px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><input type="number" value="${r.qty}" oninput="dnUpdateRow(${idx},'qty',this.value)" style="width:60px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><select onchange="dnData.rows[${idx}].unit=this.value" style="padding:6px;border:1px solid #eee;border-radius:4px;font-size:12px">${units.map(u=>`<option ${r.unit===u?'selected':''}>${u}</option>`).join('')}</select></td>
      <td><input type="number" value="${r.price}" oninput="dnUpdateRow(${idx},'price',this.value)" style="width:80px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:13px"></td>
      <td><input type="number" value="${r.discP||0}" oninput="dnUpdateRow(${idx},'discP',this.value)" style="width:50px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:12px" placeholder="%"></td>
      <td><input type="number" value="${r.discA||0}" oninput="dnUpdateRow(${idx},'discA',this.value)" style="width:60px;padding:6px 8px;border:1px solid #eee;border-radius:4px;font-size:12px"></td>
      <td style="font-weight:600;text-align:right">${rs(amt)}</td>
      <td><span style="cursor:pointer;color:#e74c3c;font-size:16px" onclick="dnRemoveRow(${idx})">✕</span></td>
    </tr>`;
  }).join('');
  const totals=dnCalcTotals();
  content.innerHTML=`
  <div style="background:#fff;min-height:100vh;padding-bottom:20px">
    <div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid #eee;background:#f8f9fa">
      <span style="font-size:18px;font-weight:700">Debit Note #${dnData.returnNo}</span>
      <span style="flex:1"></span>
      <span style="cursor:pointer;font-size:20px" onclick="vPurchaseReturn()">✕</span>
    </div>
    <div style="padding:20px 24px">
      <div style="display:flex;gap:30px;margin-bottom:20px;flex-wrap:wrap">
        <div style="flex:1;min-width:250px">
          <label style="display:block;font-size:13px;color:#2f6df6;font-weight:600;margin-bottom:6px">Party *</label>
          <select id="dn_party" onchange="dnData.party=this.value;dnData.phone=this.options[this.selectedIndex].dataset.phone||''" style="width:100%;padding:10px 12px;border:1px solid #2f6df6;border-radius:8px;font-size:14px">
            <option value="">Select party...</option>
            ${store.parties.map(p=>`<option value="${p.name}" data-phone="${p.phone||''}">${p.name} ${p.phone?'('+p.phone+')':''}</option>`).join('')}
          </select>
          <span onclick="openAddPartyModal()" style="display:inline-block;margin-top:6px;color:#2f6df6;font-size:12px;cursor:pointer;font-weight:600">+ Add Party</span>
        </div>
        <div style="min-width:200px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label style="font-size:13px;color:#666;min-width:90px">Phone No.</label><input value="${dnData.phone}" onchange="dnData.phone=this.value" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;width:140px"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label style="font-size:13px;color:#666;min-width:90px">Return No.</label><input value="${dnData.returnNo}" onchange="dnData.returnNo=this.value" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;width:140px"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label style="font-size:13px;color:#666;min-width:90px">Bill Number</label><input value="${dnData.billNo}" onchange="dnData.billNo=this.value" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;width:140px"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label style="font-size:13px;color:#666;min-width:90px">Bill Date</label><input type="date" value="${dnData.billDate}" onchange="dnData.billDate=this.value" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px"></div>
          <div style="display:flex;align-items:center;gap:10px"><label style="font-size:13px;color:#666;min-width:90px">Date</label><input type="date" value="${dnData.date}" onchange="dnData.date=this.value" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px"></div>
        </div>
      </div>
      <div style="overflow-x:auto;border:1px solid #eee;border-radius:8px;margin-bottom:16px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f8f9fa;border-bottom:2px solid #eee">
            <th style="padding:10px 8px;width:30px">#</th>
            <th style="padding:10px 8px;min-width:180px">ITEM</th>
            <th style="padding:10px 8px;min-width:120px">DESCRIPTION</th>
            <th style="padding:10px 8px;min-width:70px">COUNT</th>
            <th style="padding:10px 8px;min-width:60px">SIZE</th>
            <th style="padding:10px 8px;min-width:60px">QTY</th>
            <th style="padding:10px 8px">UNIT</th>
            <th style="padding:10px 8px;min-width:80px">PRICE/UNIT</th>
            <th style="padding:10px 8px;min-width:50px">DISC %</th>
            <th style="padding:10px 8px;min-width:60px">DISC Amt</th>
            <th style="padding:10px 8px;min-width:80px;text-align:right">AMOUNT</th>
            <th style="padding:10px 8px;width:30px"></th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <button onclick="dnAddRow()" style="padding:6px 16px;border:2px solid #2f6df6;color:#2f6df6;background:#fff;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:20px">+ ADD ROW</button>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:20px;border-top:2px solid #eee;padding-top:16px">
        <div>
          <div style="margin-bottom:12px"><label style="font-size:13px;color:#666;margin-right:8px">Payment Type</label>
            <select id="dn_payMode" onchange="dnData.payMode=this.value" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px">
              <option>Cash</option><option>Bank Transfer</option><option>QR Code</option><option>Card Payment</option>
            </select></div>
          <span style="color:#2f6df6;font-size:13px;cursor:pointer;font-weight:600">+ Add Payment type</span>
        </div>
        <div style="text-align:right">
          <div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;justify-content:flex-end"><span style="font-size:13px;color:#666">Discount</span><input type="number" value="${dnData.discP}" oninput="dnData.discP=+this.value;dnRecalcDisc()" style="width:60px;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;text-align:right"><span style="font-size:12px;color:#999">(%)</span><span style="color:#999">-</span><input type="number" value="${dnData.discA}" oninput="dnData.discA=+this.value;dnRecalc()" style="width:80px;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;text-align:right"><span style="font-size:12px;color:#999">(Rs)</span></div>
          <div style="font-size:13px;color:#666;margin-bottom:4px">Subtotal: <b>${rs(totals.subtotal)}</b></div>
          <div style="font-size:13px;color:#666;margin-bottom:4px">Discount: <b style="color:#e74c3c">-${rs(totals.disc)}</b></div>
          <div style="font-size:20px;font-weight:800;color:#2f6df6;border-top:2px solid #eee;padding-top:8px;margin-top:4px">Total: ${rs(totals.total)}</div>
        </div>
      </div>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:12px;background:#f8f9fa">
      <button onclick="shareDebitNote()" style="padding:10px 24px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;font-weight:600">Share ▾</button>
      <button onclick="saveDebitNote()" style="padding:10px 32px;border:none;border-radius:8px;background:#2f6df6;color:#fff;cursor:pointer;font-size:14px;font-weight:700">Save</button>
    </div>
  </div>`;
}
function dnSelectItem(it){
  const lastRow=dnData.rows[dnData.rows.length-1];
  if(lastRow.item&&lastRow.qty>0) dnData.rows.push({item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0});
  const idx=dnData.rows.length-1;
  dnData.rows[idx].item=it.name;
  dnData.rows[idx].price=it.pprice||it.price||0;
  dnData.rows[idx].desc=it.code||'';
  renderDebitNoteForm();
}
function dnUpdateItem(idx,val){dnData.rows[idx].item=val;}
function dnFilterItems(input,val){
  const itemList=(store.items||[]).map(it=>`<div class="dn-item-opt" data-name="${it.name}" data-code="${it.code||''}" onmousedown=\"event.preventDefault();sharedItemPick('${it.id}')" style="display:flex;align-items:center;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f5f5f5;gap:12px">
    <div style="flex:1"><div style="font-weight:600;font-size:13px">${it.name}</div><div style="font-size:11px;color:#999">${it.code||''}</div></div>
    <div style="text-align:right;min-width:70px"><div style="font-size:11px;color:#888">SALE</div><div style="font-weight:600;font-size:13px">${rs(it.price)}</div></div>
    <div style="text-align:right;min-width:70px"><div style="font-size:11px;color:#888">PURCHASE</div><div style="font-weight:600;font-size:13px">${rs(it.pprice||0)}</div></div>
    <div style="text-align:right;min-width:50px"><div style="font-size:11px;color:#888">STOCK</div><div style="font-weight:700;font-size:13px;color:${(it.stock||0)>0?'#27ae60':'#e74c3c'}">${it.stock||0}</div></div>
  </div>`).join('');
  showSharedItemDropdown(input,itemList,val,(it)=>{
    const lastRow=dnData.rows[dnData.rows.length-1];
    if(lastRow.item&&lastRow.qty>0) dnData.rows.push({item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0});
    const idx=dnData.rows.length-1;
    dnData.rows[idx].item=it.name;
    dnData.rows[idx].price=it.pprice||it.price||0;
    dnData.rows[idx].desc=it.code||'';
    renderDebitNoteForm();
  });
}
function dnUpdateRow(idx,field,val){
  dnData.rows[idx][field]=field==='item'||field==='desc'||field==='count'||field==='size'?val:+val||0;
  if(field==='discP'&&dnData.rows[idx].price){
    dnData.rows[idx].discA=Math.round(dnData.rows[idx].qty*dnData.rows[idx].price*dnData.rows[idx].discP/100);
  }
  dnRecalc();
}
function dnAddRow(){dnData.rows.push({item:'',desc:'',count:'',size:'',qty:1,unit:'NONE',price:0,discP:0,discA:0});renderDebitNoteForm();}
function dnRemoveRow(idx){if(dnData.rows.length>1){dnData.rows.splice(idx,1);renderDebitNoteForm();}}
function dnRecalcDisc(){
  dnData.rows.forEach(r=>{
    if(r.discP&&r.price) r.discA=Math.round(r.qty*r.price*r.discP/100);
  });
  dnRecalc();
}
function dnRecalc(){renderDebitNoteForm();}
function dnCalcTotals(){
  let subtotal=0,disc=0;
  dnData.rows.forEach(r=>{
    const lineTotal=(r.qty||0)*(r.price||0);
    subtotal+=lineTotal;
    disc+=(r.discA||0);
  });
  disc+=dnData.discA||0;
  if(dnData.discP) disc+=Math.round((subtotal-disc)*dnData.discP/100);
  return{subtotal,disc,total:Math.max(subtotal-disc,0)};
}
function saveDebitNote(){
  if(!dnData.party) return toast('Select a party');
  if(!dnData.rows.length||!dnData.rows[0].item) return toast('Add at least one item');
  const t=dnCalcTotals();
  const dt=dnData.date.split('-');
  const note={id:id(),returnNo:dnData.returnNo,party:dnData.party,phone:dnData.phone,billNo:dnData.billNo,billDate:dnData.billDate,date:dt[2]+'/'+dt[1]+'/'+dt[0],rows:[...dnData.rows],payMode:dnData.payMode,discP:dnData.discP,discA:dnData.discA,total:t.total,received:0,status:'Unpaid'};
  if(!store.debitNotes) store.debitNotes=[];
  store.debitNotes.push(note);
  const p=store.parties.find(x=>x.name===dnData.party);
  if(p) p.balance+=t.total;
  persist();
  toast('Debit Note saved!');
  showDebitNotePreview(note);
}
function shareDebitNote(){
  const t=dnCalcTotals();
  let txt='Debit Note #'+dnData.returnNo+'\nParty: '+dnData.party+'\nDate: '+dnData.date+'\n\n';
  dnData.rows.forEach((r,i)=>{txt+=(i+1)+'. '+r.item+' x'+r.qty+' = '+rs((r.qty||0)*(r.price||0)-(r.discA||0))+'\n';});
  txt+='\nTotal: '+rs(t.total);
  if(navigator.share){navigator.share({title:'Debit Note',text:txt}).catch(()=>{});}
  else{navigator.clipboard.writeText(txt);toast('Copied!');}
}
function showDebitNotePreview(note){
  const dt=(note.date||'').split('/');
  const displayDate=dt.length===3?dt[0]+'/'+dt[1]+'/'+dt[2]:note.date;
  content.innerHTML=`
  <div style="background:#f0f2f5;min-height:100vh;padding:20px">
    <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);overflow:hidden">
      <div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid #eee;background:#f8f9fa">
        <span style="font-size:18px;font-weight:700">Debit Note Preview</span>
        <span style="flex:1"></span>
        <button onclick="navigator.clipboard.writeText(buildDebitNoteText('${note.id}'));toast('Copied!')" style="padding:6px 14px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:12px">📋 Copy</button>
        <button onclick="window.print()" style="padding:6px 14px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:12px">🖨️ Print</button>
        <span style="cursor:pointer;font-size:20px" onclick="vPurchaseReturn()">✕</span>
      </div>
      <div style="padding:24px">
        <div style="display:flex;justify-content:space-between;margin-bottom:16px">
          <div><div style="font-size:22px;font-weight:800;color:#2f6df6">DEBIT NOTE</div><div style="font-size:13px;color:#888;margin-top:4px">Return #${note.returnNo||'-'}</div></div>
          <div style="text-align:right"><div style="font-size:13px;color:#666">Date: <b>${displayDate||'-'}</b></div>${note.billNo?`<div style="font-size:13px;color:#666">Bill: <b>${note.billNo}</b></div>`:''}</div>
        </div>
        <div style="background:#f8f9fa;padding:12px 16px;border-radius:8px;margin-bottom:16px">
          <div style="font-size:13px;color:#666">Party: <b style="color:#333">${note.party||'-'}</b></div>
          ${note.phone?`<div style="font-size:13px;color:#666">Phone: ${note.phone}</div>`:''}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">
          <thead><tr style="border-bottom:2px solid #eee"><th style="padding:8px;text-align:left">#</th><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Price</th><th style="padding:8px;text-align:right">Amount</th></tr></thead>
          <tbody>${(note.rows||[]).map((r,i)=>`<tr style="border-bottom:1px solid #f5f5f5"><td style="padding:8px;color:#888">${i+1}</td><td style="padding:8px;font-weight:500">${r.item||'-'}</td><td style="padding:8px;text-align:center">${r.qty||0} ${r.unit||''}</td><td style="padding:8px;text-align:right">${rs(r.price||0)}</td><td style="padding:8px;text-align:right;font-weight:600">${rs((r.qty||0)*(r.price||0)-(r.discA||0))}</td></tr>`).join('')}</tbody>
        </table>
        <div style="text-align:right;border-top:2px solid #eee;padding-top:12px"><div style="font-size:20px;font-weight:800;color:#2f6df6">Total: ${rs(note.total||0)}</div></div>
      </div>
    </div>
  </div>`;
}
function buildDebitNoteText(nid){
  const notes=store.debitNotes||[];
  const note=notes.find(n=>n.id===nid);if(!note) return '';
  let txt='Debit Note #'+note.returnNo+'\nParty: '+note.party+'\nDate: '+note.date+'\n\n';
  (note.rows||[]).forEach((r,i)=>{txt+=(i+1)+'. '+r.item+' x'+r.qty+' = '+rs((r.qty||0)*(r.price||0)-(r.discA||0))+'\n';});
  txt+='\nTotal: '+rs(note.total||0);
  return txt;
}
function openAddPartyModal(){
  const html=`<div class="modal-overlay modal-dynamic show" id="addPartyModal" onclick="closeModal('addPartyModal')">
    <div class="modal" onclick="event.stopPropagation()" style="max-width:400px;width:95%">
      <div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-bottom:1px solid #eee">
        <span style="font-size:18px;font-weight:700">Add New Party</span>
        <span style="cursor:pointer;font-size:20px" onclick="closeModal('addPartyModal')">✕</span>
      </div>
      <div style="padding:24px">
        <div style="margin-bottom:16px"><label style="display:block;font-size:13px;color:#666;font-weight:500;margin-bottom:6px">Name *</label><input id="ap_name" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px" placeholder="Party name"></div>
        <div style="margin-bottom:16px"><label style="display:block;font-size:13px;color:#666;font-weight:500;margin-bottom:6px">Phone</label><input id="ap_phone" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px" placeholder="Phone number"></div>
        <div style="margin-bottom:16px"><label style="display:block;font-size:13px;color:#666;font-weight:500;margin-bottom:6px">Type</label><select id="ap_type" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px"><option>customer</option><option>supplier</option></select></div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:12px">
        <button onclick="closeModal('addPartyModal')" style="padding:10px 24px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:14px">Cancel</button>
        <button onclick="saveNewParty()" style="padding:10px 32px;border:none;border-radius:8px;background:#2f6df6;color:#fff;cursor:pointer;font-size:14px;font-weight:700">Save</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}
function saveNewParty(){
  const name=(document.getElementById('ap_name').value||'').trim();
  if(!name) return toast('Enter party name');
  const phone=(document.getElementById('ap_phone').value||'').trim();
  const type=document.getElementById('ap_type').value;
  store.parties.push({id:id(),name,phone,type,balance:0});
  persist();
  closeModal('addPartyModal');
  toast('Party added!');
  renderDebitNoteForm();
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
  'Item/Stock report':['Hot Selling Products','Item Wise Profit And Loss','Low Stock Summary','Stock Detail','Item Detail','Item Wise Discount'],
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
  const sales=store.sales.filter(s=>inRange(s.date)&&!s.refunded), purch=store.purchases.filter(p=>inRange(p.date)), exp=store.expenses.filter(e=>inRange(e.date));
  const pays=(store.payments||[]).filter(p=>inRange(p.date));
  const refs=(store.refunds||[]).filter(r=>inRange(r.date));
  const ts=sales.reduce((a,b)=>a+b.total,0), tp=purch.reduce((a,b)=>a+b.total,0), te=exp.reduce((a,b)=>a+b.amount,0), tr=refs.reduce((a,b)=>a+b.amount,0);
  const body=document.getElementById('rep_body'); if(!body)return;
  const firms=[(store.business?.name||'My Business'),...(store.companies||[]).map(c=>c.name)].filter((v,i,a)=>a.indexOf(v)===i);
  const users=[...new Set([...(store.sales||[]).map(s=>s.user||'Admin'),...(store.purchases||[]).map(p=>p.user||'Admin')])];
  const now=new Date();
  const curMonth=now.getMonth(), curYear=now.getFullYear();
  const firstDay='01/'+String(curMonth+1).padStart(2,'0')+'/'+curYear;
  const lastDay=new Date(curYear,curMonth+1,0).getDate()+'/'+String(curMonth+1).padStart(2,'0')+'/'+curYear;
  const monthOpts=['This Month','Last Month','Last 3 Months','Last 6 Months','All Time'];
  const monthVal=repFrom===firstDay&&repTo===lastDay?'This Month':repFrom||repTo||'All Time';
  let html='';

  if(repSel==='Sale'){
    const trPts=ts, trRecv=sales.reduce((a,b)=>a+(b.received||0),0), trBal=trPts-trRecv;
    html=`
    <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <select id="repSaleMonth" onchange="repSaleMonthChange(this.value)" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;font-size:13px;font-weight:600">
          ${monthOpts.map(m=>`<option ${m===monthVal?'selected':''}>${m}</option>`).join('')}
        </select>
        <span style="background:#e8f5e9;color:#1a7a3a;padding:6px 14px;border-radius:8px;font-size:13px;font-weight:600">Between</span>
        <input type="date" id="repSaleFrom" value="${repFrom.split('/').reverse().join('-')}" onchange="repSaleApply()" style="padding:7px 12px;border:1px solid var(--line);border-radius:8px;font-size:13px">
        <span style="font-size:12px;color:#888">To</span>
        <input type="date" id="repSaleTo" value="${repTo.split('/').reverse().join('-')}" onchange="repSaleApply()" style="padding:7px 12px;border:1px solid var(--line);border-radius:8px;font-size:13px">
        <select onchange="toast('Firm filter applied')" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;font-size:13px"><option>ALL FIRMS</option>${firms.map(f=>`<option>${f}</option>`).join('')}</select>
        <select onchange="toast('User filter applied')" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;font-size:13px"><option>ALL USERS</option>${users.map(u=>`<option>${u}</option>`).join('')}</select>
        <span style="flex:1"></span>
        <button onclick="exportSaleReport()" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer;font-size:12px;font-weight:600">📊 Excel Report</button>
      </div>
    </div>
    <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="font-size:13px;color:#888;margin-bottom:4px">Total Sales Amount</div>
      <div style="font-size:28px;font-weight:800;color:#1a7a3a">${rs(trPts)}</div>
      <div style="display:flex;gap:24px;margin-top:8px;font-size:13px">
        <span style="color:#1a7a3a">Received: <b>${rs(trRecv)}</b></span>
        <span style="color:#e74c3c">Balance: <b>${rs(trBal)}</b></span>
      </div>
    </div>
    <div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:15px;font-weight:700">Transactions</span>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="repSaleSearch" placeholder="🔍 Search..." oninput="filterRepSale()" style="padding:7px 12px;border:1px solid var(--line);border-radius:6px;font-size:13px;width:200px">
          <span onclick="window.print()" style="cursor:pointer;font-size:18px" title="Print">🖨️</span>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="hub-table" id="repSaleTable">
          <thead><tr>
            <th style="width:40px">#</th>
            <th>DATE <span style="font-size:9px">⊞</span></th>
            <th>INVOICE # <span style="font-size:9px">⊞</span></th>
            <th>PARTY NAME <span style="font-size:9px">⊞</span></th>
            <th>TYPE <span style="font-size:9px">⊞</span></th>
            <th>PAYMENT <span style="font-size:9px">⊞</span></th>
            <th class="right">AMOUNT <span style="font-size:9px">⊞</span></th>
            <th class="right">RECEIVED <span style="font-size:9px">⊞</span></th>
            <th class="right">BALANCE <span style="font-size:9px">⊞</span></th>
            <th>STATUS <span style="font-size:9px">⊞</span></th>
            <th style="width:100px">ACTIONS</th>
          </tr></thead>
          <tbody>
            ${sales.length?[...sales].reverse().map((s,i)=>{
              const bal=(s.total||0)-(s.received||0);
              const isPaid=bal<=0;
              return `<tr class="rep-sale-row">
                <td style="color:#888">${i+1}</td>
                <td>${s.date||'-'}</td>
                <td style="font-weight:500">${s.no||'-'}</td>
                <td style="font-weight:500">${s.party||'-'}</td>
                <td>${s.payMode==='Credit'?'Credit':'PoS Sale'}</td>
                <td>${s.payMode||'Cash'}</td>
                <td class="right" style="font-weight:600">${rs(s.total||0)}</td>
                <td class="right">${rs(s.received||0)}</td>
                <td class="right" style="font-weight:600;color:${isPaid?'var(--green)':'var(--red)'}">${rs(bal)}</td>
                <td><span class="hub-pill ${isPaid?'hub-pill-paid':'hub-pill-unpaid'}">${isPaid?'Paid':'Unpaid'}</span></td>
                <td style="white-space:nowrap">
                  <span class="hub-action-icon" onclick="printRepSale('${s.id}')" title="Print">🖨️</span>
                  <span class="hub-action-icon" onclick="shareRepSale('${s.id}')" title="Share">↗️</span>
                  <span class="hub-action-icon" onclick="showInvoiceView(store.sales.find(x=>x.id==='${s.id}'))" title="View">👁️</span>
                </td>
              </tr>`;
            }).join(''):``}
          </tbody>
        </table>
        ${!sales.length?`<div style="padding:40px;text-align:center;color:#ccc"><div style="font-size:48px;margin-bottom:8px">📊</div><div style="font-size:14px">No sales found for selected dates</div></div>`:''}
      </div>
    </div>`;
  }

  else if(repSel==='All Transactions'){
    const allTxns=[];
    sales.forEach(s=>allTxns.push({type:'Sale',ref:s.no,party:s.party,date:s.date,total:s.total,received:s.received||0,balance:s.total-(s.received||0),payMode:s.payMode||'Cash',status:(s.total-(s.received||0))<=0?'Paid':'Unpaid',id:s.id,src:'sales'}));
    purch.forEach(p=>allTxns.push({type:'Purchase',ref:p.no,party:p.party,date:p.date,total:p.total,received:p.received||0,balance:p.total-(p.received||0),payMode:p.payMode||'Cash',status:(p.total-(p.received||0))<=0?'Paid':'Unpaid',id:p.id,src:'purchases'}));
    exp.forEach(e=>allTxns.push({type:'Expense',ref:'-',party:e.cat,date:e.date,total:e.amount,received:e.amount,balance:0,payMode:'Cash',status:'Paid',id:e.id,src:'expenses'}));
    pays.forEach(p=>{if(p.saleId)return;allTxns.push({type:p.dir==='in'?'Payment In':'Payment Out',ref:p.receipt||'-',party:p.party,date:p.date,total:p.amount,received:p.amount,balance:0,payMode:p.mode||'Cash',status:'Paid',id:p.id,src:'payments'});});
    allTxns.sort((a,b)=>{
      const da=a.date||'', db=b.date||'';
      return db.localeCompare(da);
    });
    const totAmt=allTxns.reduce((a,t)=>a+(t.type==='Expense'||t.type==='Payment Out'?-t.total:t.total),0);
    const totRecv=allTxns.reduce((a,t)=>a+t.received,0);
    html=`
    <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <select id="repAllMonth" onchange="repAllMonthChange(this.value)" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;font-size:13px;font-weight:600">
          ${monthOpts.map(m=>`<option ${m===monthVal?'selected':''}>${m}</option>`).join('')}
        </select>
        <span style="background:#e8f5e9;color:#1a7a3a;padding:6px 14px;border-radius:8px;font-size:13px;font-weight:600">Between</span>
        <input type="date" id="repAllFrom" value="${repFrom.split('/').reverse().join('-')}" onchange="repAllApply()" style="padding:7px 12px;border:1px solid var(--line);border-radius:8px;font-size:13px">
        <span style="font-size:12px;color:#888">To</span>
        <input type="date" id="repAllTo" value="${repTo.split('/').reverse().join('-')}" onchange="repAllApply()" style="padding:7px 12px;border:1px solid var(--line);border-radius:8px;font-size:13px">
        <select style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;font-size:13px"><option>ALL FIRMS</option>${firms.map(f=>`<option>${f}</option>`).join('')}</select>
        <select style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;font-size:13px"><option>ALL USERS</option>${users.map(u=>`<option>${u}</option>`).join('')}</select>
        <span style="flex:1"></span>
        <button onclick="exportAllTxnReport()" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer;font-size:12px;font-weight:600">📊 Excel Report</button>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <select id="repAllType" onchange="filterRepAllTxn()" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;font-size:13px;min-width:150px">
          <option value="">All Transaction</option><option>Sale</option><option>Purchase</option><option>Expense</option><option>Payment In</option><option>Payment Out</option>
        </select>
        <select id="repAllPay" onchange="filterRepAllTxn()" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;font-size:13px;min-width:150px">
          <option value="">All Payment</option><option>Cash</option><option>Bank Transfer</option><option>QR Code</option><option>Card Payment</option><option>Credit</option>
        </select>
      </div>
    </div>
    <div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:15px;font-weight:700">Transactions (${allTxns.length})</span>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="repAllSearch" placeholder="🔍 Search..." oninput="filterRepAllTxn()" style="padding:7px 12px;border:1px solid var(--line);border-radius:6px;font-size:13px;width:200px">
          <span onclick="window.print()" style="cursor:pointer;font-size:18px" title="Print">🖨️</span>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="hub-table" id="repAllTable">
          <thead><tr>
            <th style="width:40px">#</th>
            <th>DATE</th>
            <th>REF #</th>
            <th>PARTY NAME</th>
            <th>CATEGORY</th>
            <th>TYPE</th>
            <th class="right">TOTAL</th>
            <th class="right">RECEIVED</th>
            <th class="right">BALANCE</th>
            <th>STATUS</th>
            <th style="width:80px">ACTIONS</th>
          </tr></thead>
          <tbody>
            ${allTxns.map((t,i)=>{
              const typeClr=t.type==='Sale'?'#2f6df6':t.type==='Purchase'?'#e67e22':t.type==='Expense'?'#e74c3c':t.type==='Payment In'?'#27ae60':'#e74c3c';
              return `<tr class="rep-all-row" data-type="${t.type}" data-pay="${t.payMode}" data-search="${(t.party+' '+t.ref+' '+t.type).toLowerCase()}">
                <td style="color:#888">${i+1}</td>
                <td>${t.date||'-'}</td>
                <td style="font-weight:500">${t.ref||'-'}</td>
                <td style="font-weight:500">${t.party||'-'}</td>
                <td>-</td>
                <td><span style="color:${typeClr};font-weight:500">${t.type}</span></td>
                <td class="right" style="font-weight:600">${rs(t.total||0)}</td>
                <td class="right">${rs(t.received||0)}</td>
                <td class="right" style="font-weight:600;color:${t.balance>0?'var(--red)':'var(--green)'}">${rs(t.balance||0)}</td>
                <td><span class="hub-pill ${t.status==='Paid'?'hub-pill-paid':'hub-pill-unpaid'}">${t.status}</span></td>
                <td style="white-space:nowrap">
                  <span class="hub-action-icon" onclick="repPrintTxn('${t.src}','${t.id}')" title="Print">🖨️</span>
                  <span class="hub-action-icon" onclick="repShareTxn('${t.src}','${t.id}')" title="Share">↗️</span>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${!allTxns.length?`<div style="padding:40px;text-align:center;color:#ccc"><div style="font-size:48px;margin-bottom:8px">📊</div><div style="font-size:14px">No transactions found for selected dates</div></div>`:''}
      </div>
    </div>`;
  }

  else if(repSel==='Day book'){
    const dbDate=repFrom||new Date().toISOString().split('T')[0].split('-').reverse().join('/');
    const dbDateISO=dbDate.split('/').reverse().join('-');
    const dbSales=sales.filter(s=>s.date===dbDate);
    const dbPurch=purch.filter(p=>p.date===dbDate);
    const dbExp=exp.filter(e=>e.date===dbDate);
    const dbPays=pays.filter(p=>p.date===dbDate);
    const allTxns=[];
    dbSales.forEach(s=>allTxns.push({name:s.party,ref:s.no||'-',type:'Sale',total:s.total||0,moneyIn:s.received||0,moneyOut:0,src:'sales',id:s.id}));
    dbPurch.forEach(p=>allTxns.push({name:p.party,ref:p.no||'-',type:'Purchase',total:p.total||0,moneyIn:0,moneyOut:p.received||0,src:'purchases',id:p.id}));
    dbExp.forEach(e=>allTxns.push({name:e.cat,ref:'-',type:'Expense',total:e.amount||0,moneyIn:0,moneyOut:e.amount||0,src:'expenses',id:e.id}));
    dbPays.forEach(p=>{if(p.saleId)return;allTxns.push({name:p.party||'-',ref:p.receipt||'-',type:p.dir==='in'?'Payment In':'Payment Out',total:p.amount||0,moneyIn:p.dir==='in'?(p.amount||0):0,moneyOut:p.dir==='out'?(p.amount||0):0,src:'payments',id:p.id});});
    (store.purchaseOrders||[]).filter(p=>p.date===dbDate).forEach(po=>allTxns.push({name:po.party||'-',ref:po.orderNo||'-',type:'Purchase Order',total:po.total||0,moneyIn:0,moneyOut:0,src:'purchaseOrders',id:po.id}));
    const totMoneyIn=allTxns.reduce((a,t)=>a+t.moneyIn,0);
    const totMoneyOut=allTxns.reduce((a,t)=>a+t.moneyOut,0);
    html=`
    <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="background:#e8f5e9;color:#1a7a3a;padding:6px 14px;border-radius:8px;font-size:13px;font-weight:600">Date</span>
        <input type="date" id="dbDate" value="${dbDateISO}" onchange="repDaybookApply()" style="padding:7px 12px;border:1px solid var(--line);border-radius:8px;font-size:13px">
        <select style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;font-size:13px"><option>ALL FIRMS</option>${firms.map(f=>`<option>${f}</option>`).join('')}</select>
        <span style="flex:1"></span>
        <button onclick="exportDaybookReport()" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer;font-size:12px;font-weight:600">📊 Excel Report</button>
        <span onclick="window.print()" style="cursor:pointer;font-size:18px" title="Print">🖨️</span>
      </div>
    </div>
    <div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:15px;font-weight:700">Day Book — ${dbDate}</span>
        <input id="dbSearch" placeholder="🔍 Search..." oninput="filterDaybook()" style="padding:7px 12px;border:1px solid var(--line);border-radius:6px;font-size:13px;width:200px">
      </div>
      <div style="overflow-x:auto">
        <table class="hub-table" id="dbTable">
          <thead><tr>
            <th>NAME</th>
            <th>REF NO.</th>
            <th>TYPE</th>
            <th class="right">TOTAL</th>
            <th class="right">MONEY IN</th>
            <th class="right">MONEY OUT</th>
            <th style="width:100px">PRINT/SHARE</th>
          </tr></thead>
          <tbody>
            ${allTxns.map((t,i)=>{
              const typeClr=t.type==='Sale'?'#2f6df6':t.type==='Purchase'?'#e67e22':t.type==='Expense'?'#e74c3c':t.type==='Payment In'?'#27ae60':t.type==='Payment Out'?'#e74c3c':'#8b5cf6';
              return `<tr class="db-row" data-search="${(t.name+' '+t.ref+' '+t.type).toLowerCase()}">
                <td style="font-weight:500">${t.name||'-'}</td>
                <td>${t.ref}</td>
                <td><span style="color:${typeClr};font-weight:500">${t.type}</span></td>
                <td class="right" style="font-weight:600">${rs(t.total)}</td>
                <td class="right" style="font-weight:600;color:${t.moneyIn>0?'#27ae60':'#888'}">${t.moneyIn>0?rs(t.moneyIn):'-'}</td>
                <td class="right" style="font-weight:600;color:${t.moneyOut>0?'#e74c3c':'#888'}">${t.moneyOut>0?rs(t.moneyOut):'-'}</td>
                <td style="white-space:nowrap">
                  <span class="hub-action-icon" onclick="repPrintTxn('${t.src}','${t.id}')" title="Print">🖨️</span>
                  <span class="hub-action-icon" onclick="repShareTxn('${t.src}','${t.id}')" title="Share">↗️</span>
                  <span class="hub-action-icon" title="More">⋮</span>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${!allTxns.length?`<div style="padding:40px;text-align:center;color:#ccc"><div style="font-size:48px;margin-bottom:8px">📊</div><div style="font-size:14px">No transactions for ${dbDate}</div></div>`:''}
      </div>
      <div style="display:flex;justify-content:space-between;padding:16px 20px;border-top:2px solid #f0f0f0;font-size:14px;font-weight:700;flex-wrap:wrap;gap:8px">
        <span style="color:#27ae60">Total Money-In: ${rs(totMoneyIn)}</span>
        <span style="color:#e74c3c">Total Money-Out: ${rs(totMoneyOut)}</span>
        <span style="color:${(totMoneyIn-totMoneyOut)>=0?'#27ae60':'#e74c3c'}">Total Money In - Total Money Out: ${rs(totMoneyIn-totMoneyOut)}</span>
      </div>
    </div>`;
  }

  else if(repSel==='Purchase'){
    html=`<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;font-size:15px;font-weight:700">Purchase Report</div>
      <div style="overflow-x:auto"><table class="hub-table"><thead><tr><th>#</th><th>DATE</th><th>INVOICE #</th><th>PARTY</th><th>TYPE</th><th class="right">AMOUNT</th><th class="right">BALANCE</th><th>STATUS</th></tr></thead>
      <tbody>${purch.length?[...purch].reverse().map((p,i)=>{const b=(p.total||0)-(p.received||0);return`<tr><td style="color:#888">${i+1}</td><td>${p.date||'-'}</td><td style="font-weight:500">${p.no||'-'}</td><td>${p.party||'-'}</td><td>${p.payMode||'Credit'}</td><td class="right" style="font-weight:600">${rs(p.total)}</td><td class="right" style="color:${b>0?'var(--red)':'var(--green)'}">${rs(b)}</td><td><span class="hub-pill ${b<=0?'hub-pill-paid':'hub-pill-unpaid'}">${b<=0?'Paid':'Unpaid'}</span></td></tr>`}).join(''):''}</tbody></table></div>
      ${!purch.length?`<div style="padding:40px;text-align:center;color:#ccc"><div style="font-size:48px;margin-bottom:8px">📊</div><div style="font-size:14px">No purchases found</div></div>`:''}
    </div>`;
  }

  else if(repSel==='Expense'||repSel==='Expense Category Report'){
    html=`<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;font-size:15px;font-weight:700">Expense Report</div>
      <div style="overflow-x:auto"><table class="hub-table"><thead><tr><th>#</th><th>CATEGORY</th><th>NOTE</th><th>DATE</th><th class="right">AMOUNT</th></tr></thead>
      <tbody>${exp.length?[...exp].reverse().map((e,i)=>`<tr><td style="color:#888">${i+1}</td><td style="font-weight:500">${e.cat||'-'}</td><td>${e.note||'-'}</td><td>${e.date||'-'}</td><td class="right" style="font-weight:600;color:var(--red)">${rs(e.amount)}</td></tr>`).join(''):''}</tbody></table></div>
      ${!exp.length?`<div style="padding:40px;text-align:center;color:#ccc"><div style="font-size:48px;margin-bottom:8px">📊</div><div style="font-size:14px">No expenses found</div></div>`:''}
    </div>`;
  }

  else if(repSel==='All parties'||repSel==='Party Statement'||repSel==='Party wise Profit & Loss'){
    html=`<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;font-size:15px;font-weight:700">All Parties</div>
      <div style="overflow-x:auto"><table class="hub-table"><thead><tr><th>#</th><th>PARTY</th><th>PHONE</th><th>TYPE</th><th class="right">BALANCE</th></tr></thead>
      <tbody>${store.parties.length?store.parties.map((p,i)=>`<tr><td style="color:#888">${i+1}</td><td style="font-weight:500">${p.name||'-'}</td><td>${p.phone||'-'}</td><td>${p.type||'-'}</td><td class="right" style="font-weight:600;color:${(p.balance||0)>0?'var(--red)':'var(--green)'}">${rs(Math.abs(p.balance||0))}</td></tr>`).join(''):''}</tbody></table></div>
      ${!store.parties.length?`<div style="padding:40px;text-align:center;color:#ccc"><div style="font-size:48px;margin-bottom:8px">👥</div><div style="font-size:14px">No parties found</div></div>`:''}
    </div>`;
  }

  else if(repSel==='Stock Detail'||repSel==='Item Detail'||repSel==='Item Wise Profit And Loss'){
    html=`<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;font-size:15px;font-weight:700">Stock / Item Detail</div>
      <div style="overflow-x:auto"><table class="hub-table"><thead><tr><th>#</th><th>ITEM</th><th>CODE</th><th class="right">SALE PRICE</th><th class="right">PURCHASE PRICE</th><th class="right">STOCK</th><th class="right">VALUE</th></tr></thead>
      <tbody>${store.items.length?store.items.map((i,idx)=>`<tr><td style="color:#888">${idx+1}</td><td style="font-weight:500">${i.name||'-'}</td><td>${i.code||'-'}</td><td class="right">${rs(i.price)}</td><td class="right">${rs(i.pprice||0)}</td><td class="right" style="font-weight:600;color:${(i.stock||0)>0?'var(--green)':'var(--red)'}">${i.stock||0}</td><td class="right" style="font-weight:600">${rs((i.stock||0)*(i.price||0))}</td></tr>`).join(''):''}</tbody></table></div>
      ${!store.items.length?`<div style="padding:40px;text-align:center;color:#ccc"><div style="font-size:48px;margin-bottom:8px">📦</div><div style="font-size:14px">No items found</div></div>`:''}
    </div>`;
  }

  else if(repSel==='Low Stock Summary'){
    const lowItems=store.items.filter(i=>(i.lowstock||0)>0&&(i.stock||0)<=i.lowstock);
    html=`<div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;font-size:15px;font-weight:700">Low Stock Items (${lowItems.length})</div>
      <div style="overflow-x:auto"><table class="hub-table"><thead><tr><th>#</th><th>ITEM</th><th class="right">STOCK</th><th class="right">MIN STOCK</th><th>STATUS</th></tr></thead>
      <tbody>${lowItems.length?lowItems.map((i,idx)=>`<tr><td style="color:#888">${idx+1}</td><td style="font-weight:500">${i.name||'-'}</td><td class="right" style="color:var(--red);font-weight:600">${i.stock||0}</td><td class="right">${i.lowstock||0}</td><td><span class="hub-pill hub-pill-unpaid">Low</span></td></tr>`).join(''):''}</tbody></table></div>
      ${!lowItems.length?`<div style="padding:40px;text-align:center;color:#ccc"><div style="font-size:48px;margin-bottom:8px">✅</div><div style="font-size:14px">All items are well stocked</div></div>`:''}
    </div>`;
  }

  else if(repSel==='Hot Selling Products'){
    const now=new Date(), cm=now.getMonth(), cy=now.getFullYear();
    const monthNames=['This Month','Last Month','Last 3 Months','Last 6 Months','All Time'];
    const curFirst='01/'+String(cm+1).padStart(2,'0')+'/'+cy;
    const curLast=new Date(cy,cm+1,0).getDate()+'/'+String(cm+1).padStart(2,'0')+'/'+cy;
    const monthVal=repFrom===curFirst&&repTo===curLast?'This Month':(!repFrom&&!repTo)?'All Time':'Custom';
    const itemSales={};
    (store.sales||[]).filter(s=>!s.refunded&&inRange(s.date)).forEach(s=>{
      (s.rows||[]).forEach(r=>{
        const name=r.item||r.name||'';
        if(!name)return;
        if(!itemSales[name])itemSales[name]={name,qty:0,revenue:0,transactions:0,firstSale:s.date,lastSale:s.date};
        itemSales[name].qty+=(r.qty||0);
        itemSales[name].revenue+=((r.qty||0)*(r.price||0));
        itemSales[name].transactions++;
        if(s.date<itemSales[name].firstSale)itemSales[name].firstSale=s.date;
        if(s.date>itemSales[name].lastSale)itemSales[name].lastSale=s.date;
      });
    });
    const ranked=Object.values(itemSales).sort((a,b)=>b.revenue-a.revenue);
    const maxRev=ranked.length?ranked[0].revenue:1;
    const maxQty=ranked.length?Math.max(...ranked.map(r=>r.qty)):1;
    const medals=['🏆','🥈','🥉'];
    const rankColors=['#ffd700','#c0c0c0','#cd7f32'];
    const bgColors=['#fffbeb','#f8fafc','#fef6f0'];
    const totalRev=ranked.reduce((a,r)=>a+r.revenue,0);
    const totalQty=ranked.reduce((a,r)=>a+r.qty,0);
    const totalTxn=ranked.reduce((a,r)=>a+r.transactions,0);
    html=`
    <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <select onchange="repHotPeriodChange(this.value)" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;font-size:13px;font-weight:600">
          ${monthNames.map(m=>`<option ${m===monthVal?'selected':''}>${m}</option>`).join('')}
        </select>
        <span style="background:#e8f5e9;color:#1a7a3a;padding:6px 14px;border-radius:8px;font-size:13px;font-weight:600">Between</span>
        <input type="date" id="hotFrom" value="${repFrom.split('/').reverse().join('-')}" onchange="repHotApply()" style="padding:7px 12px;border:1px solid var(--line);border-radius:8px;font-size:13px">
        <span style="font-size:12px;color:#888">To</span>
        <input type="date" id="hotTo" value="${repTo.split('/').reverse().join('-')}" onchange="repHotApply()" style="padding:7px 12px;border:1px solid var(--line);border-radius:8px;font-size:13px">
        <span style="flex:1"></span>
        <button onclick="exportHotSelling()" style="padding:8px 14px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer;font-size:12px;font-weight:600">📊 Excel Report</button>
        <span onclick="window.print()" style="cursor:pointer;font-size:18px" title="Print">🖨️</span>
      </div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
      <div style="flex:1;min-width:140px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:18px;color:#fff">
        <div style="font-size:12px;opacity:.8;margin-bottom:4px">Products Sold</div>
        <div style="font-size:24px;font-weight:800">${ranked.length}</div>
      </div>
      <div style="flex:1;min-width:140px;background:linear-gradient(135deg,#11998e,#38ef7d);border-radius:12px;padding:18px;color:#fff">
        <div style="font-size:12px;opacity:.8;margin-bottom:4px">Total Revenue</div>
        <div style="font-size:24px;font-weight:800">${rs(totalRev)}</div>
      </div>
      <div style="flex:1;min-width:140px;background:linear-gradient(135deg,#ee0979,#ff6a00);border-radius:12px;padding:18px;color:#fff">
        <div style="font-size:12px;opacity:.8;margin-bottom:4px">Total Qty Sold</div>
        <div style="font-size:24px;font-weight:800">${totalQty}</div>
      </div>
      <div style="flex:1;min-width:140px;background:linear-gradient(135deg,#2196f3,#00bcd4);border-radius:12px;padding:18px;color:#fff">
        <div style="font-size:12px;opacity:.8;margin-bottom:4px">Total Orders</div>
        <div style="font-size:24px;font-weight:800">${totalTxn}</div>
      </div>
    </div>
    <div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;font-size:15px;font-weight:700">🏆 Hot Selling Products — Ranking</div>
      ${ranked.length?ranked.map((p,i)=>{
        const pctRev=Math.round((p.revenue/maxRev)*100);
        const pctQty=Math.round((p.qty/maxQty)*100);
        const isTop3=i<3;
        const medalEmoji=i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
        return `<div style="display:flex;align-items:center;gap:16px;padding:${isTop3?'20px':'14px 20px'};border-bottom:1px solid #f5f5f5;${isTop3?`background:${bgColors[i]};border-left:4px solid ${rankColors[i]}`:''}">
          <div style="min-width:60px;text-align:center">
            ${isTop3?`<div style="font-size:${i===0?'40px':'32px'};line-height:1">${medalEmoji}</div><div style="font-size:11px;font-weight:800;color:${rankColors[i]};margin-top:2px">RANK #${i+1}</div>`:`<span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#f1f5f9;font-size:15px;font-weight:700;color:#64748b">#${i+1}</span>`}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:${isTop3?'800':'600'};font-size:${isTop3?'17px':'14px'};color:#1a2332;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
            <div style="display:flex;gap:14px;font-size:12px;color:#888;flex-wrap:wrap">
              <span>📦 Qty: <b style="color:#333">${p.qty}</b></span>
              <span>🧾 Orders: <b style="color:#333">${p.transactions}</b></span>
              <span>💰 Avg: <b style="color:#333">${rs(p.transactions>0?Math.round(p.revenue/p.transactions):0)}</b>/order</span>
            </div>
          </div>
          <div style="min-width:220px">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:3px"><span>Revenue</span><span style="font-weight:700;color:#1a2332">${rs(p.revenue)}</span></div>
            <div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;margin-bottom:6px">
              <div style="height:100%;width:${pctRev}%;background:linear-gradient(90deg,${i===0?'#ffd700,#f59e0b':i===1?'#94a3b8,#64748b':i===2?'#d97706,#b45309':'#2f6df6,#60a5fa'});border-radius:4px;transition:width .5s"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:3px"><span>Quantity</span><span style="font-weight:700;color:#1a2332">${p.qty} units</span></div>
            <div style="height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pctQty}%;background:linear-gradient(90deg,#27ae60,#2ecc71);border-radius:3px;transition:width .5s"></div>
            </div>
          </div>
        </div>`;
      }).join(''):''}
      ${!ranked.length?`<div style="padding:40px;text-align:center;color:#ccc"><div style="font-size:48px;margin-bottom:8px">🏆</div><div style="font-size:14px">No sales data for selected period</div></div>`:''}
    </div>`;
  }

  else{
    html=`<div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">
        <div style="flex:1;min-width:160px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px"><div style="font-size:12px;color:#16a34a;margin-bottom:4px">Net Sales</div><div style="font-size:20px;font-weight:800;color:#16a34a">${rs(ts)}</div></div>
        <div style="flex:1;min-width:160px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px"><div style="font-size:12px;color:#64748b;margin-bottom:4px">Purchase</div><div style="font-size:20px;font-weight:800">${rs(tp)}</div></div>
        <div style="flex:1;min-width:160px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px"><div style="font-size:12px;color:#dc2626;margin-bottom:4px">Refunds</div><div style="font-size:20px;font-weight:800;color:#dc2626">${rs(tr)}</div></div>
        <div style="flex:1;min-width:160px;background:${ts-tp-te>=0?'#f0fdf4':'#fef2f2'};border:1px solid ${ts-tp-te>=0?'#bbf7d0':'#fecaca'};border-radius:10px;padding:16px"><div style="font-size:12px;color:${ts-tp-te>=0?'#16a34a':'#dc2626'};margin-bottom:4px">Net Profit</div><div style="font-size:20px;font-weight:800;color:${ts-tp-te>=0?'#16a34a':'#dc2626'}">${rs(ts-tp-te)}</div></div>
      </div>
    </div>`;
  }
  body.innerHTML=html;
}

function repSaleMonthChange(v){
  const now=new Date(), m=now.getMonth(), y=now.getFullYear();
  if(v==='This Month'){repFrom='01/'+String(m+1).padStart(2,'0')+'/'+y;repTo=new Date(y,m+1,0).getDate()+'/'+String(m+1).padStart(2,'0')+'/'+y;}
  else if(v==='Last Month'){repFrom='01/'+String(m).padStart(2,'0')+'/'+y;repTo=new Date(y,m,0).getDate()+'/'+String(m).padStart(2,'0')+'/'+y;}
  else if(v==='Last 3 Months'){const sm=new Date(y,m-2,1);repFrom='01/'+String(sm.getMonth()+1).padStart(2,'0')+'/'+sm.getFullYear();repTo=new Date(y,m+1,0).getDate()+'/'+String(m+1).padStart(2,'0')+'/'+y;}
  else if(v==='Last 6 Months'){const sm=new Date(y,m-5,1);repFrom='01/'+String(sm.getMonth()+1).padStart(2,'0')+'/'+sm.getFullYear();repTo=new Date(y,m+1,0).getDate()+'/'+String(m+1).padStart(2,'0')+'/'+y;}
  else{repFrom='';repTo='';}
  drawRep();
}
function repSaleApply(){
  const f=document.getElementById('repSaleFrom')?.value;
  const t=document.getElementById('repSaleTo')?.value;
  if(f)repFrom=f.split('-').reverse().join('/');
  if(t)repTo=t.split('-').reverse().join('/');
  drawRep();
}
function filterRepSale(){
  const q=(document.getElementById('repSaleSearch')?.value||'').toLowerCase();
  document.querySelectorAll('.rep-sale-row').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q)?'':'none';});
}
function printRepSale(sid){
  const s=store.sales.find(x=>x.id===sid);
  if(s){viewInv=s;printInvoice();}
}
function shareRepSale(sid){
  const s=store.sales.find(x=>x.id===sid);
  if(!s)return;
  let txt='Invoice #'+s.no+'\nParty: '+s.party+'\nDate: '+s.date+'\nTotal: '+rs(s.total)+'\nReceived: '+rs(s.received)+'\nBalance: '+rs(s.total-s.received);
  if(navigator.share){navigator.share({title:'Invoice',text:txt}).catch(()=>{});}
  else{navigator.clipboard.writeText(txt);toast('Copied!');}
}
function repAllMonthChange(v){
  repSaleMonthChange(v);
}
function repAllApply(){
  const f=document.getElementById('repAllFrom')?.value;
  const t=document.getElementById('repAllTo')?.value;
  if(f)repFrom=f.split('-').reverse().join('/');
  if(t)repTo=t.split('-').reverse().join('/');
  drawRep();
}
function filterRepAllTxn(){
  const q=(document.getElementById('repAllSearch')?.value||'').toLowerCase();
  const typeF=document.getElementById('repAllType')?.value||'';
  const payF=document.getElementById('repAllPay')?.value||'';
  document.querySelectorAll('.rep-all-row').forEach(r=>{
    const search=(r.getAttribute('data-search')||'').includes(q);
    const type=!typeF||r.getAttribute('data-type')===typeF;
    const pay=!payF||r.getAttribute('data-pay')===payF;
    r.style.display=(search&&type&&pay)?'':'none';
  });
}
function repPrintTxn(src,id){
  if(src==='sales'){const s=store.sales.find(x=>x.id===id);if(s){viewInv=s;printInvoice();}}
  else if(src==='purchases'){printPurchase(store.purchases.findIndex(x=>x.id===id));}
  else toast('Print coming soon');
}
function repShareTxn(src,id){
  if(src==='sales'){shareRepSale(id);return;}
  toast('Share coming soon');
}
function exportSaleReport(){
  let csv='Date,Invoice,Party,Type,Payment,Amount,Received,Balance\n';
  store.sales.filter(s=>inRange(s.date)&&!s.refunded).forEach(s=>{
    csv+=`${s.date||''},${s.no||''},${s.party||''},Sale,${s.payMode||'Cash'},${s.total||0},${s.received||0},${(s.total||0)-(s.received||0)}\n`;
  });
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sale-report.csv';a.click();
  toast('Excel downloaded!');
}
function exportAllTxnReport(){
  let csv='Date,Ref,Party,Type,Total,Received,Balance,Status\n';
  store.sales.filter(s=>inRange(s.date)).forEach(s=>{csv+=`${s.date||''},${s.no||''},${s.party||''},Sale,${s.total||0},${s.received||0},${(s.total||0)-(s.received||0)},${(s.total||0)-(s.received||0)<=0?'Paid':'Unpaid'}\n`;});
  store.purchases.filter(p=>inRange(p.date)).forEach(p=>{csv+=`${p.date||''},${p.no||''},${p.party||''},Purchase,${p.total||0},${p.received||0},${(p.total||0)-(p.received||0)},${(p.total||0)-(p.received||0)<=0?'Paid':'Unpaid'}\n`;});
  store.expenses.filter(e=>inRange(e.date)).forEach(e=>{csv+=`${e.date||''},-,${e.cat||''},Expense,${e.amount||0},${e.amount||0},0,Paid\n`;});
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='all-transactions.csv';a.click();
  toast('Excel downloaded!');
}
function repDaybookApply(){
  const v=document.getElementById('dbDate')?.value;
  if(v)repFrom=v.split('-').reverse().join('/');
  drawRep();
}
function filterDaybook(){
  const q=(document.getElementById('dbSearch')?.value||'').toLowerCase();
  document.querySelectorAll('.db-row').forEach(r=>{r.style.display=(r.getAttribute('data-search')||'').includes(q)?'':'none';});
}
function exportDaybookReport(){
  const dbDate=repFrom||new Date().toISOString().split('T')[0].split('-').reverse().join('/');
  let csv='Name,Ref No,Type,Total,Money In,Money Out\n';
  store.sales.filter(s=>s.date===dbDate).forEach(s=>{csv+=`${s.party||''},${s.no||''},Sale,${s.total||0},${s.received||0},0\n`;});
  store.purchases.filter(p=>p.date===dbDate).forEach(p=>{csv+=`${p.party||''},${p.no||''},Purchase,${p.total||0},0,${p.received||0}\n`;});
  store.expenses.filter(e=>e.date===dbDate).forEach(e=>{csv+=`${e.cat||''},-,Expense,${e.amount||0},0,${e.amount||0}\n`;});
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='daybook-'+dbDate.replace(/\//g,'-')+'.csv';a.click();
  toast('Excel downloaded!');
}
function repHotPeriodChange(v){
  const now=new Date(), m=now.getMonth(), y=now.getFullYear();
  if(v==='This Month'){repFrom='01/'+String(m+1).padStart(2,'0')+'/'+y;repTo=new Date(y,m+1,0).getDate()+'/'+String(m+1).padStart(2,'0')+'/'+y;}
  else if(v==='Last Month'){repFrom='01/'+String(m).padStart(2,'0')+'/'+y;repTo=new Date(y,m,0).getDate()+'/'+String(m).padStart(2,'0')+'/'+y;}
  else if(v==='Last 3 Months'){const sm=new Date(y,m-2,1);repFrom='01/'+String(sm.getMonth()+1).padStart(2,'0')+'/'+sm.getFullYear();repTo=new Date(y,m+1,0).getDate()+'/'+String(m+1).padStart(2,'0')+'/'+y;}
  else if(v==='Last 6 Months'){const sm=new Date(y,m-5,1);repFrom='01/'+String(sm.getMonth()+1).padStart(2,'0')+'/'+sm.getFullYear();repTo=new Date(y,m+1,0).getDate()+'/'+String(m+1).padStart(2,'0')+'/'+y;}
  else{repFrom='';repTo='';}
  drawRep();
}
function repHotApply(){
  const f=document.getElementById('hotFrom')?.value;
  const t=document.getElementById('hotTo')?.value;
  if(f)repFrom=f.split('-').reverse().join('/');
  if(t)repTo=t.split('-').reverse().join('/');
  drawRep();
}
function exportHotSelling(){
  let csv='Rank,Product,Quantity Sold,Revenue,Transactions\n';
  const itemSales={};
  (store.sales||[]).filter(s=>!s.refunded&&(repFrom?inRange(s.date):true)).forEach(s=>{
    (s.rows||[]).forEach(r=>{
      const name=r.item||r.name||'';if(!name)return;
      if(!itemSales[name])itemSales[name]={name,qty:0,revenue:0,transactions:0};
      itemSales[name].qty+=(r.qty||0);itemSales[name].revenue+=((r.qty||0)*(r.price||0));itemSales[name].transactions++;
    });
  });
  Object.values(itemSales).sort((a,b)=>b.revenue-a.revenue).forEach((p,i)=>{
    csv+=`${i+1},${p.name},${p.qty},${p.revenue},${p.transactions}\n`;
  });
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hot-selling-products.csv';a.click();
  toast('Excel downloaded!');
}

/* ============ GENERIC SECTIONS ============ */
const META={
  estimate:{ic:'📄',t:'Estimate / Quotation',d:'Create estimates & quotations and convert them to invoices.',btn:'＋ Add Estimate',act:'openSale'},
  saleorder:{ic:'📝',t:'Sale Order',d:'Take advance orders from customers and track them.',btn:'＋ Add Sale Order',act:'openSale'},
  challan:{ic:'🚚',t:'Delivery Challan',d:'Send goods with a delivery challan before billing.',btn:'＋ Add Delivery Challan',act:'openSale'},
  salereturn:{ic:'↩️',t:'Sale Return / Cr. Note',d:'Record returned goods and credit notes.',btn:'＋ Add Sale Return',act:'openSale'},
  purchaseorder:{ic:'🧾',t:'Purchase Order',d:'Create purchase orders for your suppliers.',btn:'＋ Add Purchase Order',act:'function(){nav("purchaseform")}'},
  purchasereturn:{ic:'↩️',t:'Purchase Return / Dr. Note',d:'Record goods returned to suppliers.',btn:'＋ Add Purchase Return',act:'openSale'},
  marketing:{ic:'📣',t:'Marketing Tools',d:'Send greetings, offers and reminders to customers via WhatsApp.',btn:'Explore Tools'},
  onlinestore:{ic:'🛒',t:'Online Store',d:'Create your own online store and sell your items online.',btn:'Set Up Store'},
  backup:{ic:'💾',t:'Backup to Computer',d:'Save a backup of all your data to your computer.',btn:'Create Backup',act:'doBackup'},
  autobackup:{ic:'🔁',t:'Auto Backup',d:'Automatically back up your data every day.',btn:'Enable Auto Backup'},
  share:{ic:'📤',t:'Share Data',d:'Share your business data with your accountant or partner.',btn:'Share Now'},
  importparties:{ic:'👥',t:'Import Parties',d:'Bulk import customers & suppliers from Excel/CSV.',btn:'Choose File'},
  exportitems:{ic:'📦',t:'Export Items',d:'Export your item list to Excel.',btn:'Export Items'},
  verifydata:{ic:'✅',t:'Verify My Data',d:'Check your data for any inconsistencies.',btn:'Verify Now'},
  marketingtools:{ic:'📣',t:'Marketing Tools',d:'Grow your business with marketing tools.',btn:'Explore'}
};
function vGeneric(view){ return ()=>{
  const m=META[view]||{ic:'📋',t:view.charAt(0).toUpperCase()+view.slice(1),d:'This section works just like Vyapar.',btn:''};
  content.innerHTML=`<div class="empty-page"><div class="empty-ill">${m.ic}</div>
    <h2>${m.t}</h2><p>${m.d}</p>
    ${m.btn?`<button class="btn-big red" onclick="${m.act?m.act+'()':"toast('"+m.t+" (demo)')"}">${m.btn}</button>`:''}</div>`;
}; }
function doBackup(){
  const data=JSON.stringify(store,null,2); const blob=new Blob([data],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='bluberry-backup-'+new Date().toISOString().slice(0,10)+'.json'; a.click(); toast('Backup downloaded');logActivity('settings','Downloaded backup');
}

/* ============ EXPORT ITEMS ============ */
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function escCsv(s){return '"'+String(s||'').replace(/"/g,'""')+'"';}
function vExportItems(){
  const items=store.items||[];
  content.innerHTML=`<div class="export-items-page">
    <div class="export-head">
      <div class="export-head-left">
        <h2>Excel Sheet Download</h2>
        <span class="export-count">${items.length} item${items.length!==1?'s':''} found</span>
      </div>
      <div class="export-head-right">
        ${items.length?`<button class="export-btn" onclick="exportItemsExcel()">⬇ EXPORT</button>`:''}
      </div>
    </div>
    <div class="export-table-wrap">
      ${items.length?`<table class="export-tbl">
        <thead><tr>
          <th>Item Name</th><th>Item Code</th><th>Description</th><th>Category</th><th>HSN</th>
          <th>Sale Price</th><th>Purchase Price</th><th>Online Store Price</th><th>Discount Type</th>
          <th>Sale Discount</th><th>Current Stock</th><th>Min Stock</th><th>Item Location</th>
          <th>Tax Rate</th><th>Tax Type</th><th>Base Unit</th><th>Secondary Unit</th><th>Conversion Rate</th>
        </tr></thead>
        <tbody>${items.map(it=>{
          const unitParts=(it.unit||'').split('|');
          const baseUnit=unitParts[0]||'';
          const secUnit=unitParts[1]||'';
          return `<tr>
            <td class="export-td-name" title="${escHtml(it.name)}">${escHtml(it.name)}</td>
            <td>${escHtml(it.code)}</td>
            <td class="export-td-desc" title="${escHtml(it.desc)}">${escHtml(it.desc)}</td>
            <td>${escHtml(it.cat||'General')}</td>
            <td></td>
            <td class="export-td-num">${Number(it.price||0)}</td>
            <td class="export-td-num">${Number(it.pprice||0)}</td>
            <td class="export-td-num">${Number(it.wprice||it.price||0)}</td>
            <td>Discount %</td>
            <td class="export-td-num">${Number(it.discp||0)}</td>
            <td class="export-td-num">${Number(it.stock||0)}</td>
            <td class="export-td-num">0</td>
            <td></td>
            <td>none</td>
            <td>exclusive</td>
            <td>${escHtml(baseUnit.replace(/ \(.*/,'')||'PIECES')}</td>
            <td>${escHtml(secUnit.replace(/[()]/g,''))}</td>
            <td></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`
      :`<div class="export-empty">
        <div style="font-size:60px;margin-bottom:16px">📦</div>
        <h3>No Items Found</h3>
        <p>Add items first, then come back to export them.</p>
        <button class="btn btn-red" onclick="nav('items')">+ Add Items</button>
      </div>`}
    </div>
  </div>`;
}
function exportItemsExcel(){
  const items=store.items||[];
  if(!items.length){toast('No items to export');return;}
  const headers=['Item Name','Item Code','Description','Category','HSN','Sale Price','Purchase Price','Online Store Price','Discount Type','Sale Discount','Current Stock','Min Stock','Item Location','Tax Rate','Tax Type','Base Unit','Secondary Unit','Conversion Rate'];
  const rows=items.map(it=>{
    const unitParts=(it.unit||'').split('|');
    const baseUnit=(unitParts[0]||'').replace(/ \(.*/,'')||'PIECES';
    const secUnit=(unitParts[1]||'').replace(/[()]/g,'')||'';
    return [
      it.name||'',it.code||'',it.desc||'',it.cat||'General','',
      it.price||0,it.pprice||0,it.wprice||it.price||0,'Discount %',it.discp||0,
      it.stock||0,0,'','none','exclusive',baseUnit,secUnit,''
    ];
  });
  let csv=headers.map(escCsv).join(',')+'\n';
  rows.forEach(r=>{csv+=r.map(escCsv).join(',')+'\n';});
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='items-export-'+new Date().toISOString().slice(0,10)+'.csv';a.click();
  toast(items.length+' items exported successfully!');
  logActivity('item','Exported '+items.length+' items to Excel');
}

/* ============ IMPORT PARTIES ============ */
function vImportParties(){
  content.innerHTML=`<div class="import-parties-page">
    <div class="imp-p-head">
      <h2>Import Parties</h2>
      <button class="imp-p-close" onclick="nav('parties')">✕</button>
    </div>
    <div class="imp-p-body">
      <div class="imp-p-left">
        <div class="imp-p-text">Download .xls/.xlsx (excel sheet)<br>template file to enter Data</div>
        <div class="imp-p-excel-icon">
          <svg viewBox="0 0 80 100" width="70" height="90">
            <rect x="5" y="5" width="70" height="90" rx="4" fill="#fff" stroke="#d0d5dd" stroke-width="1.5"/>
            <rect x="10" y="10" width="60" height="80" rx="2" fill="#f0f4ff"/>
            <rect x="10" y="10" width="60" height="22" rx="2" fill="#217346"/>
            <text x="40" y="26" text-anchor="middle" fill="#fff" font-size="13" font-weight="700" font-family="Arial">xls</text>
            <rect x="18" y="40" width="44" height="3" rx="1.5" fill="#c8d8e8"/>
            <rect x="18" y="48" width="36" height="3" rx="1.5" fill="#c8d8e8"/>
            <rect x="18" y="56" width="40" height="3" rx="1.5" fill="#c8d8e8"/>
            <rect x="18" y="64" width="30" height="3" rx="1.5" fill="#c8d8e8"/>
          </svg>
        </div>
        <button class="imp-p-download-btn" onclick="downloadPartySample()">Download</button>
      </div>
      <div class="imp-p-divider"></div>
      <div class="imp-p-right">
        <div class="imp-p-text">Upload your .xls/ .xlsx (excel sheet)</div>
        <div class="imp-p-dropzone" id="partyDropzone" ondrop="handlePartyDrop(event)" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')">
          <div class="imp-p-upload-icon">
            <svg viewBox="0 0 80 100" width="60" height="80">
              <rect x="5" y="5" width="70" height="90" rx="4" fill="#fff" stroke="#d0d5dd" stroke-width="1.5"/>
              <rect x="10" y="10" width="60" height="80" rx="2" fill="#e8f0fe"/>
              <rect x="10" y="10" width="60" height="22" rx="2" fill="#217346"/>
              <text x="40" y="26" text-anchor="middle" fill="#fff" font-size="13" font-weight="700" font-family="Arial">xls</text>
              <path d="M40 38 L40 60" stroke="#217346" stroke-width="3" stroke-linecap="round"/>
              <path d="M32 46 L40 38 L48 46" stroke="#217346" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <rect x="20" y="66" width="40" height="2" rx="1" fill="#b8d0e0"/>
              <rect x="25" y="72" width="30" height="2" rx="1" fill="#b8d0e0"/>
            </svg>
          </div>
          <div class="imp-p-drop-text">Drag and drop or <span class="imp-p-browse" onclick="document.getElementById('partyFileInput').click()">Click here to Browse</span></div>
          <div class="imp-p-drop-sub">formatted excel file to continue</div>
        </div>
        <input type="file" id="partyFileInput" accept=".xlsx,.xls,.csv" style="display:none" onchange="handlePartyFile(this)">
      </div>
    </div>
    <div id="partyPreview" style="display:none"></div>
  </div>`;
}

function downloadPartySample(){
  const headers=['Party Name*','Phone Number','Email','Billing Address','Type (customer/supplier)','Opening Balance'];
  const rows=[
    ['Ahmed Khan','03211234567','ahmed@email.com','123 Main Street Lahore','customer','5000'],
    ['Bilal Traders','03331234567','bilal@traders.com','45 Market Road Karachi','supplier','12000'],
    ['Sara Enterprises','03001234567','sara@enterp.com','78 Mall Road Islamabad','customer','0'],
    ['Ali Wholesale','03111234567','ali@wholesale.com','90 Industrial Area Faisalabad','supplier','8500'],
    ['Fatima Boutique','03451234567','fatima@boutique.com','56 Fashion Street Multan','customer','3200']
  ];
  let csv=headers.join(',')+'\n'+rows.map(r=>'"'+r.join('","')+'"').join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='party-import-sample.csv';a.click();
  toast('Sample downloaded — fill it and upload back');
}

function handlePartyDrop(e){e.preventDefault();e.target.closest('.imp-p-dropzone').classList.remove('dragover');const f=e.dataTransfer.files[0];if(f)processPartyFile(f);}
function handlePartyFile(input){const f=input.files[0];if(f)processPartyFile(f);}

function processPartyFile(file){
  const ext=file.name.split('.').pop().toLowerCase();
  if(ext==='csv'){
    const reader=new FileReader();
    reader.onload=function(e){parsePartyCSV(e.target.result,file.name);};
    reader.readAsText(file);
  } else if(ext==='xlsx'||ext==='xls'){
    if(typeof XLSX==='undefined'){toast('Excel library loading... please try again in 2 seconds');return;}
    const reader=new FileReader();
    reader.onload=function(e){
      try{
        const wb=XLSX.read(e.target.result,{type:'array'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const csv=XLSX.utils.sheet_to_csv(ws);
        parsePartyCSV(csv,file.name);
      }catch(err){toast('Error reading Excel file: '+err.message);}
    };
    reader.readAsArrayBuffer(file);
  } else {
    toast('Unsupported file type. Please use .csv, .xlsx, or .xls');
  }
}

function parsePartyCSV(text,filename){
  const lines=text.split('\n').filter(l=>l.trim());
  if(lines.length<2){toast('File is empty or has no data rows');return;}
  const headers=lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/[*]/g,''));
  const nameIdx=headers.findIndex(h=>h==='party name'||h==='name'||h==='party_name'||h==='partyname');
  const phoneIdx=headers.findIndex(h=>h==='phone'||h==='phone number'||h==='phone_number'||h==='phoneno');
  const emailIdx=headers.findIndex(h=>h==='email'||h==='email id'||h==='emailid');
  const addrIdx=headers.findIndex(h=>h==='billing address'||h==='billing_address'||h==='address'||h==='billingaddress');
  const typeIdx=headers.findIndex(h=>h==='type'||h==='party type'||h==='party_type');
  const balIdx=headers.findIndex(h=>h==='opening balance'||h==='opening_balance'||h==='balance'||h==='openingbalance');
  if(nameIdx===-1){toast('Column "Party Name" not found in file. Check your headers.');return;}
  const parsed=[];
  for(let i=1;i<lines.length;i++){
    const cols=parseCSVLine(lines[i]);
    const name=(cols[nameIdx]||'').trim();
    if(!name)continue;
    const phone=(cols[phoneIdx]||'').trim().replace(/[^0-9+\-\s]/g,'');
    const email=(cols[emailIdx]||'').trim();
    const billing=(cols[addrIdx]||'').trim();
    let type=(cols[typeIdx]||'customer').trim().toLowerCase();
    if(type!=='customer'&&type!=='supplier')type='customer';
    let balance=parseFloat((cols[balIdx]||'0').trim().replace(/[^0-9.\-]/g,''))||0;
    parsed.push({name,phone,email,billing,type,balance});
  }
  if(!parsed.length){toast('No valid parties found in file');return;}
  window._partyImportData=parsed;
  const preview=document.getElementById('partyPreview');
  preview.style.display='block';
  preview.innerHTML=`<div class="panel" style="margin:20px 0;padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div><h3 style="margin:0">Preview: ${filename}</h3><p style="margin:4px 0 0;color:#888;font-size:13px">${parsed.length} parties found</p></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" onclick="document.getElementById('partyPreview').style.display='none';window._partyImportData=null">Cancel</button>
        <button class="btn btn-red" onclick="doImportParties()">Import ${parsed.length} Parties</button>
      </div>
    </div>
    <div style="overflow-x:auto;max-height:400px;overflow-y:auto">
      <table class="data"><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Type</th><th>Balance</th></tr></thead><tbody>
      ${parsed.map(r=>`<tr><td style="font-weight:700">${r.name}</td><td>${r.phone}</td><td>${r.email}</td><td>${r.billing}</td><td>${r.type}</td><td>${rs(r.balance)}</td></tr>`).join('')}
      </tbody></table>
    </div>
  </div>`;
}

function parseCSVLine(line){
  const result=[];
  let current='';
  let inQuotes=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(inQuotes){
      if(ch==='"'){
        if(i+1<line.length&&line[i+1]==='"'){current+='"';i++;}
        else inQuotes=false;
      } else current+=ch;
    } else {
      if(ch==='"')inQuotes=true;
      else if(ch===','){result.push(current);current='';}
      else current+=ch;
    }
  }
  result.push(current);
  return result;
}

function doImportParties(){
  const data=window._partyImportData;
  if(!data||!data.length){toast('No data to import');return;}
  let added=0,skipped=0,errors=0;
  data.forEach(r=>{
    if(!r.name||r.name.trim()===''){errors++;return;}
    const exists=store.parties.find(p=>p.name.toLowerCase().trim()===r.name.toLowerCase().trim());
    if(!exists){
      store.parties.push({
        id:id(),
        name:r.name.trim(),
        phone:(r.phone||'').trim(),
        email:(r.email||'').trim(),
        billing:(r.billing||'').trim(),
        type:r.type==='supplier'?'supplier':'customer',
        balance:r.balance||0
      });
      added++;
    } else {skipped++;}
  });
  persist();window._partyImportData=null;
  document.getElementById('partyPreview').style.display='none';
  let msg=added+' parties imported';
  if(skipped>0) msg+=', '+skipped+' skipped (duplicates)';
  if(errors>0) msg+=', '+errors+' errors';
  toast(msg);
  logActivity('party','Imported '+added+' parties from Excel'+(skipped?' ('+skipped+' duplicates skipped)':''));
  if(added>0) nav('parties');
}


function vPaymentIn(){
  const rows=store.payments.filter(p=>p.dir==='in').reverse();
  const totalAmt=rows.reduce((a,b)=>a+b.amount,0);
  content.innerHTML=`<div class="pos-page">
    <div class="pos-topbar">
      <div class="pos-search">🔍 Search Transactions</div>
      <div class="pos-top-actions">
        <button class="pos-action-btn red-outline" onclick="openSale()">+ Add Sale</button>
        <button class="pos-action-btn green-outline" onclick="nav('purchaseform')">+ Add Purchase</button>
        <button class="pos-action-btn icon-btn">⊕</button>
        <button class="pos-action-btn icon-btn">🖨️</button>
        <button class="pos-action-btn icon-btn">⋮</button>
      </div>
    </div>
    <div class="pos-header">
      <div class="pos-title">Payment-In <span class="dropdown-arrow">▾</span></div>
    </div>
    <div class="pos-filters">
      <span class="filter-label">Filter by :</span>
      <div class="filter-chip active">This Month <span class="chip-arrow">▾</span></div>
      <div class="filter-dates">📅 01/06/2026 To 30/06/2026</div>
      <div class="filter-chip">All Firms <span class="chip-arrow">▾</span></div>
      <div class="filter-chip">All Users <span class="chip-arrow">▾</span></div>
    </div>
    <div class="pos-summary-row">
      <div class="pos-summary-card">
        <div class="psc-label">Total Amount</div>
        <div class="psc-amount">${rs(totalAmt)}</div>
        <div class="psc-sub">Received: ${rs(rows.reduce((a,b)=>a+b.amount,0))}</div>
        <div class="psc-change">0% ↗<br><span>vs last month</span></div>
      </div>
    </div>
    <div class="pos-body">
      ${rows.length?`<table class="data"><thead><tr><th>Party</th><th>Date</th><th>Type</th><th class="right">Amount</th></tr></thead><tbody>
        ${rows.map(p=>`<tr><td class="bold">${p.party}</td><td>${p.date}</td><td>${p.mode}</td><td class="right">${rs(p.amount)}</td></tr>`).join('')}
      </tbody></table>`
      :`<div class="pos-empty">
        <div class="pos-empty-ill">💰</div>
        <div class="pos-empty-title">No Transactions to show</div>
        <div class="pos-empty-sub">You haven't added any transactions yet.</div>
        <button class="btn-big red" onclick="addPayment('in')" ${hasPermission('create','payment-in')?'':'style="display:none"'}>+ Add Payment-In</button>
      </div>`}
    </div>
    <div class="pos-bottom-actions">
      <button class="pos-act-btn">⊞ Sale</button>
      <button class="pos-act-btn">⊞ Purchase</button>
      <button class="pos-act-btn">⊞ Expense</button>
      <button class="pos-act-btn">💰 Payment-In</button>
      <button class="pos-act-btn active">💰 Payment-Out</button>
    </div>
  </div>`;
}
function vPaymentOut(){
  const s=store.settings||{};
  const rows=(store.payments||[]).filter(p=>p.dir==='out').reverse();
  const now=new Date();
  const curMonth=now.getMonth(), curYear=now.getFullYear();
  const firstDay='01/'+String(curMonth+1).padStart(2,'0')+'/'+curYear;
  const lastDay=new Date(curYear,curMonth+1,0).getDate()+'/'+String(curMonth+1).padStart(2,'0')+'/'+curYear;
  const filtered=rows.filter(p=>{
    if(!p.date)return true;
    const parts=p.date.split(/[\s/-]/);
    const d=new Date(parts[2]+'-'+parts[1]+'-'+parts[0]);
    return d.getMonth()===curMonth&&d.getFullYear()===curYear;
  });
  const totalAmt=filtered.reduce((a,b)=>a+b.amount,0);
  const firms=[(store.business.name||'My Business'),...(store.companies||[]).map(c=>c.name)].filter((v,i,a)=>a.indexOf(v)===i);
  content.innerHTML=`
  <div class="hub-header">
    <div style="display:flex;align-items:center;gap:8px">
      <h2>Payment-Out</h2><span style="font-size:12px;color:var(--muted);cursor:pointer">▾</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <button class="hub-btn hub-btn-red" onclick="addPayment('out')" ${hasPermission('create','payment-out')?'':'style="display:none"'}>＋ Add Payment-Out</button>
        <span class="hub-action-icon" onclick="setTab='transaction';nav('settings')" title="Settings">⚙️</span>
    </div>
  </div>
  <div class="hub-card">
    <div class="hub-filters">
      <span style="font-size:12px;color:var(--muted);font-weight:500">Filter by :</span>
      <div class="hub-filter-chip active">This Month <span>▾</span></div>
      <div class="hub-filter-date"><span>📅</span><input type="text" value="${firstDay}"></div>
      <span style="font-size:12px;color:var(--muted)">To</span>
      <div class="hub-filter-date"><input type="text" value="${lastDay}"></div>
      <div class="hub-select"><select><option>All Firms</option>${firms.map(f=>`<option>${f}</option>`).join('')}</select></div>
      <div class="hub-select"><select><option>All Users</option></select></div>
    </div>
  </div>
  <div class="hub-card hub-summary">
    <div class="hub-summary-bg"></div>
    <div class="hub-summary-bg2"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div class="hub-stat-label">Total Amount</div>
        <div class="hub-stat-val" style="color:var(--ink)">${rs(totalAmt)}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px">Paid: ${rs(totalAmt)}</div>
      </div>
      <div style="text-align:right">
        <span class="hub-pill hub-pill-paid" style="padding:4px 10px">0% ↗</span>
        <div style="font-size:10px;color:var(--muted);margin-top:4px">vs last month</div>
      </div>
    </div>
  </div>
  <div class="hub-card">
    ${filtered.length?`<div style="overflow-x:auto">
      <table class="hub-table">
        <thead><tr>
          <th>DATE</th><th>CUSTOMER</th><th>MODE</th><th class="right">AMOUNT</th><th style="width:50px"></th>
        </tr></thead>
        <tbody>${filtered.map(p=>`<tr>
          <td>${p.date||'-'}</td>
          <td style="font-weight:500">${p.party||'-'}</td>
          <td>${p.mode||'Cash'}</td>
          <td class="right" style="font-weight:600">${rs(p.amount)}</td>
          <td><span class="hub-action-icon" onclick="toast('More')">⋮</span></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`:`
    <div class="hub-empty">
      <div class="hub-empty-icon">
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle cx="50" cy="50" r="45" fill="#e8f4fd"/>
          <rect x="25" y="30" width="50" height="35" rx="4" fill="#fff" stroke="#4db8ff" stroke-width="2"/>
          <rect x="32" y="38" width="14" height="8" rx="2" fill="#4db8ff" opacity=".5"/>
          <rect x="50" y="38" width="14" height="8" rx="2" fill="#4db8ff" opacity=".5"/>
          <rect x="32" y="50" width="32" height="4" rx="1" fill="#b8d8f0"/>
          <rect x="32" y="57" width="20" height="4" rx="1" fill="#d0e8f8"/>
        </svg>
      </div>
      <div class="hub-empty-title">No Transactions to show</div>
      <div class="hub-empty-sub">You haven't added any transactions yet.</div>
      <button class="hub-btn hub-btn-red" style="margin-top:16px" onclick="addPayment('out')">＋ Add Payment-Out</button>
    </div>`}
  </div>`;
}
function vSaleOrder(){
  content.innerHTML=`<div class="pos-page">
    <div class="pos-topbar">
      <div class="pos-search">🔍 Search Transactions</div>
      <div class="pos-top-actions">
        <button class="pos-action-btn red-outline" onclick="openSale()">+ Add Sale</button>
        <button class="pos-action-btn green-outline" onclick="nav('purchaseform')">+ Add Purchase</button>
      </div>
    </div>
    <div class="pos-tabs">
      <div class="pos-tab active">SALE ORDERS</div>
      <div class="pos-tab">ONLINE ORDERS</div>
    </div>
    <div class="pos-body">
      <div class="pos-empty">
        <div class="pos-empty-ill">📋</div>
        <div class="pos-empty-sub">Make & share sale orders & convert them to sale invoice instantly.</div>
        <button class="btn-big red" onclick="openSale()" ${hasPermission('create','sale-order')?'':'style="display:none"'}>Add Your First Sale Order</button>
        </div>
      </div>
    </div>
    <div style="text-align:right;margin-top:20px"><button onclick="saveSettings()" style="background:#e0413e;color:#fff;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:14px">Save</button></div>`;
  }
function vSavedInvoices(){
  const rows=[...store.sales].reverse();
  content.innerHTML=`<div class="pos-page">
    <div class="pos-topbar">
      <div class="pos-search">🔍 <input id="savedInvSearch" placeholder="Search by invoice number, party name..." oninput="filterSavedInv()" style="border:0;outline:none;width:280px;background:transparent"></div>
      <div class="pos-top-actions">
        <button class="pos-action-btn red-outline" onclick="openSale()" ${hasPermission('create','invoice')?'':'style="display:none"'}>+ New Invoice</button>
        <button class="pos-action-btn" onclick="openBarcodeScanner()">📷 Scan Barcode</button>
      </div>
    </div>
    <div class="pos-header"><div class="pos-title">Saved Invoices</div></div>
    <div class="pos-body" style="padding:16px">
      ${rows.length?`<div class="saved-inv-grid" id="savedInvGrid">${rows.map(s=>{
        return `<div class="saved-inv-card" onclick="openSlip('${s.id}')">
          <div class="siv-top">
            <span class="siv-no">${s.no}</span>
            <span class="siv-status ${s.status==='paid'?'paid':s.status==='refunded'?'refunded':s.status==='replacement'?'replacement':'due'}">${s.status==='paid'?'Paid':s.status==='refunded'?'Refunded':s.status==='replacement'?'Replacement':'Not Paid'}</span>
          </div>
          <div class="siv-cust">${s.party}</div>
          <div class="siv-amount">${rs(s.total)}</div>
          <div class="siv-date">📅 ${s.date}</div>
          <div class="siv-barcode"><svg class="siv-barcode-svg" data-code="${s.no}"></svg></div>
          <div class="siv-actions" onclick="event.stopPropagation()">
            <button class="siv-btn" onclick="openSlip('${s.id}')">👁 View</button>
            <button class="siv-btn" onclick="printSavedInv('${s.id}')">🖨️ Print</button>
            <button class="siv-btn" onclick="downloadSavedInv('${s.id}')">⬇️ Download</button>
          </div>
        </div>`;}).join('')}</div>`
      :`<div class="pos-empty">
        <div class="pos-empty-ill">🧾</div>
        <div class="pos-empty-title">No Saved Invoices</div>
        <div class="pos-empty-sub">All your printed and saved invoices will appear here.</div>
        <button class="btn-big red" onclick="openSale()">+ Create First Invoice</button>
      </div>`}
    </div>
  </div>`;
  window._barcodeScannerActive=false;
  setTimeout(function(){
    document.querySelectorAll('.siv-barcode-svg').forEach(function(svg){
      var code=svg.getAttribute('data-code')||'000000';
      try{ JsBarcode(svg,code,{format:'CODE128',width:1.2,height:30,displayValue:true,margin:0,fontSize:10}); }catch(e){}
    });
  },100);
}
function filterSavedInv(){
  const q=(document.getElementById('savedInvSearch').value||'').toLowerCase();
  document.querySelectorAll('.saved-inv-card').forEach(c=>{
    c.style.display=c.textContent.toLowerCase().includes(q)?'':'none';
  });
}
function openBarcodeScanner(){
  var scanHtml=`
    <div style="text-align:center;margin-bottom:16px">
      <div id="scannerStatus" style="font-size:13px;color:#888;margin-bottom:12px">Point camera at invoice barcode</div>
      <div style="position:relative;width:100%;max-width:400px;margin:0 auto;border-radius:12px;overflow:hidden;background:#000">
        <video id="scannerVideo" autoplay playsinline style="width:100%;display:block;min-height:250px;object-fit:cover"></video>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:70%;height:60%;border:2px solid rgba(255,255,255,0.6);border-radius:12px;pointer-events:none"></div>
      </div>
      <div style="margin-top:12px;font-size:12px;color:#aaa">Or enter invoice number manually:</div>
      <input id="bc_scan_input" placeholder="e.g. INV-01" style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;font-size:14px;margin-top:8px;box-sizing:border-box">
    </div>`;
  
  formModal('Scan Invoice Barcode', scanHtml,
    function(){
      var no=document.getElementById('bc_scan_input').value.trim();
      if(!no) return toast('Enter or scan invoice number');
      var s=store.sales.find(function(x){return x.no.toLowerCase()===no.toLowerCase();});
      closeModal('formModal');
      stopScanner();
      if(s){ showInvoiceView(s); } else toast('No invoice found for '+no);
    }, 'FIND INVOICE');
  
  document.getElementById('bc_scan_input').addEventListener('keydown', function(e){
    if(e.key==='Enter'){
      var no=this.value.trim();
      if(!no) return;
      var s=store.sales.find(function(x){return x.no.toLowerCase()===no.toLowerCase();});
      closeModal('formModal');
      stopScanner();
      if(s){ showInvoiceView(s); } else toast('No invoice found for '+no);
    }
  });
  
  startScanner();
}

var _scannerStream=null, _scannerRAF=null, _scannerInterval=null;
function startScanner(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    var st=document.getElementById('scannerStatus');
    if(st) st.textContent='Camera not supported - use manual input below';
    return;
  }
  var video=document.getElementById('scannerVideo');
  if(!video) return;
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}}})
  .then(function(stream){
    _scannerStream=stream;
    video.srcObject=stream;
    video.play();
    var st=document.getElementById('scannerStatus');
    if(st) st.textContent='Scanning... point camera at barcode';
    
    if('BarcodeDetector' in window){
      var detector=new BarcodeDetector({formats:['code_128','code_39','ean_13','ean_8','qr_code','upc_a','upc_e']});
      _scannerInterval=setInterval(function(){
        if(video.readyState>=2){
          detector.detect(video).then(function(barcodes){
            if(barcodes&&barcodes.length>0){
              var code=barcodes[0].rawValue;
              var input=document.getElementById('bc_scan_input');
              if(input) input.value=code;
              var s=store.sales.find(function(x){return x.no.toLowerCase()===code.toLowerCase();});
              closeModal('formModal');
              stopScanner();
              if(s){ showInvoiceView(s); } else toast('Scanned: '+code+' - no invoice found');
            }
          }).catch(function(){});
        }
      },500);
    }else{
      var st2=document.getElementById('scannerStatus');
      if(st2) st2.textContent='Camera active - enter number manually (auto-detect not supported in this browser)';
    }
  }).catch(function(err){
    var st=document.getElementById('scannerStatus');
    if(st) st.textContent='Camera unavailable - enter invoice number manually';
  });
}

function stopScanner(){
  if(_scannerStream){_scannerStream.getTracks().forEach(function(t){t.stop();});_scannerStream=null;}
  if(_scannerInterval){clearInterval(_scannerInterval);_scannerInterval=null;}
  if(_scannerRAF){cancelAnimationFrame(_scannerRAF);_scannerRAF=null;}
}
function printSavedInv(sid){
  const s=store.sales.find(x=>x.id===sid);
  if(s){viewInv=s;printInvoice();}
}
function downloadSavedInv(sid){
  const s=store.sales.find(x=>x.id===sid);
  if(s){viewInv=s;downloadInvoice();}
}
/* ============ CREATE INVOICE (Compact Sale) ============ */
let nciRows=[{name:'',item:'',qty:1,price:0}], nciDiscP=0, nciDiscAmt=0, nciTaxRate=0, nciReceived=0, nciFully=false, nciCustName='', nciCustPhone='', nciPayMode='Cash';
function nciFmt(n){ return Number(n||0).toLocaleString('en-IN'); }
function nci2(n){ return Number(n||0).toFixed(2); }
function nciTotals(){
  const sub=nciRows.reduce((a,r)=>a+(+r.qty||0)*(+r.price||0),0);
  let discAmt=nciDiscP>0?sub*nciDiscP/100:(+nciDiscAmt||0);
  if(discAmt>sub)discAmt=sub; if(discAmt<0)discAmt=0;
  const afterDisc=sub-discAmt;
  const taxAmt=afterDisc*(nciTaxRate/100);
  const total=afterDisc+taxAmt;
  const received=nciFully?total:(+nciReceived||0);
  const balance=total-received;
  return {sub,discAmt,taxAmt,total,received,balance};
}
function vCreateInvoice(){
  if(!nciRows.length)nciRows=[{name:'',item:'',qty:1,price:0}];
  const t=nciTotals();
  content.innerHTML=`<div class="nci-wrap">
    <div class="nci-head">
      <div class="nci-head-left"><b>Sale</b>
        <span class="nci-mode">Switch to Full Mode <label class="nci-switch"><input type="checkbox" onchange="nciSwitchFull()"><i></i></label></span>
      </div>
      <span class="nci-x" onclick="nav('sale')">✕</span>
    </div>
    <div class="nci-body">
      <div class="nci-left">
        <div class="nci-cust-row">
          <div class="nci-fld"><label>Customer Name<b>*</b></label><input id="nciCust" value="${nciCustName}" placeholder="Enter Name" oninput="nciCustName=this.value;nciSearchCust();nciPreview()" onfocus="nciSearchCust()" autocomplete="off"><div class="nci-drop" id="nciCustDrop"></div></div>
          <div class="nci-fld"><label>Customer Phone Number</label><div class="nci-phone"><span class="cc">+92</span><input id="nciPhone" value="${nciCustPhone}" placeholder="Enter Number" oninput="nciCustPhone=this.value;nciPreview()"></div></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;background:#f8f9fa;border-radius:10px;margin-bottom:12px;border:1px solid #e0e0e0">
          <div id="nciScannerDot" title="Scanner status" style="width:10px;height:10px;border-radius:50%;background:#e74c3c;box-shadow:0 0 6px rgba(231,76,60,0.5);transition:all 0.3s"></div>
          <span style="font-size:11px;color:#888" id="nciScannerLabel">Scanner: Not connected</span>
        </div>
        <table class="nci-tbl"><thead><tr><th>#</th><th>ITEM</th><th>QTY</th><th>PRICE</th><th class="right">TOTAL <span class="nci-add-ic" onclick="nciAddRow()">⊕</span></th><th></th></tr></thead>
          <tbody id="nciRows"></tbody></table>
        <div class="nci-addrow" onclick="nciAddRow()">＋ Add Row</div>
        <div class="nci-subtotal"><span>Sub Total</span><span id="nciSub">${nciFmt(t.sub)}</span></div>
        <div class="nci-sumline" style="flex-direction:column;align-items:stretch;gap:8px"><span class="lbl">Discount</span>
          <div style="display:flex;gap:10px;align-items:center">
            <div class="nci-pct"><input id="nciDiscP" type="number" value="${nciDiscP||0}" onfocus="clearZero(this)" oninput="nciDiscByPct(this.value)"><span>%</span></div>
            <input id="nciDiscAmt" type="number" value="${Math.round(t.discAmt)||0}" onfocus="clearZero(this)" oninput="nciDiscByAmt(this.value)" style="flex:1;border:1px solid var(--line);border-radius:8px;padding:10px 12px;outline:none;text-align:right;font-size:14px;font-weight:600">
          </div>
        </div>
        <div class="nci-sumline"><span class="lbl">Tax</span>
          <div class="nci-money">
            <select class="nci-tax-sel" onchange="nciSetTax(this.value)">
              <option value="0" ${nciTaxRate===0?'selected':''}>NONE</option>
              <option value="5" ${nciTaxRate===5?'selected':''}>GST @5%</option>
              <option value="12" ${nciTaxRate===12?'selected':''}>GST @12%</option>
              <option value="17" ${nciTaxRate===17?'selected':''}>GST @17%</option>
              <option value="18" ${nciTaxRate===18?'selected':''}>GST @18%</option>
            </select>
            <input id="nciTaxAmt" type="number" value="${Math.round(t.taxAmt)}" readonly>
          </div>
        </div>
        <div class="nci-sumline"><span class="lbl">Payment Mode</span>
          <div class="nci-money">
            <select class="nci-tax-sel" onchange="nciPayMode=this.value" style="min-width:150px">
              <option ${nciPayMode==='Cash'?'selected':''}>Cash</option>
              <option ${nciPayMode==='Bank Transfer'?'selected':''}>Bank Transfer</option>
              <option ${nciPayMode==='QR Code'?'selected':''}>QR Code</option>
              <option ${nciPayMode==='Card Payment'?'selected':''}>Card Payment</option>
            </select>
          </div>
        </div>
        <div class="nci-sumline"><span class="lbl">Received</span>
          <div class="nci-money">
            <label class="nci-fully"><input type="checkbox" ${nciFully?'checked':''} onchange="nciSetFully(this.checked)"> Fully Received</label>
            <input id="nciRecv" type="number" value="${nci2(nciFully?t.total:nciReceived)}" ${nciFully?'disabled':''} onfocus="clearZero(this)" oninput="nciSetRecv(this.value)">
          </div>
        </div>
        <div class="nci-bal">Balance: <span id="nciBal">${nci2(t.balance)}</span></div>
        <div class="nci-total-box"><span class="t">Total Amount (${(store.settings&&store.settings.currency)||'Rs'})</span><span class="v" id="nciTotal">${nci2(t.total)}</span></div>
      </div>
      <div class="nci-right">
        <div class="nci-preview" id="nciPreview"></div>
        <div class="nci-actions">
          <button class="nci-save" onclick="nciSave()">Save &amp; New</button>
          <span class="nci-rnd wa" onclick="nciSave('whatsapp')" title="Save &amp; WhatsApp">🟢</span>
          <span class="nci-rnd" onclick="nciSave('print')" title="Save &amp; Print">🖨️</span>
          <span class="nci-rnd" onclick="nciSave('download')" title="Save &amp; Download">⬇️</span>
        </div>
      </div>
    </div>
  </div>`;
  nciRenderRows(); nciCalc();
}
function nciRenderRows(){
  const tb=document.getElementById('nciRows'); if(!tb)return;
  tb.innerHTML=nciRows.map((r,i)=>`<tr>
    <td>${i+1}</td>
    <td class="nci-item-cell"><input id="nciItem${i}" value="${(r.name||r.item||'').replace(/"/g,'&quot;')}" placeholder="Enter Item" oninput="nciSetItem(${i},this.value)" onfocus="nciShowDrop(${i})" autocomplete="off"><div class="nci-drop" id="nciDrop${i}"></div></td>
    <td><input type="number" id="nciQty${i}" value="${r.qty}" onfocus="clearZero(this)" oninput="nciSet(${i},'qty',this.value)"></td>
    <td><input type="number" id="nciPrice${i}" value="${r.price}" onfocus="clearZero(this)" oninput="nciSet(${i},'price',this.value)"></td>
    <td class="nci-rowtot-cell"><span class="nci-rowtot">${nciFmt((+r.qty||0)*(+r.price||0))}</span></td>
    <td>${nciRows.length>1?`<span class="nci-del" onclick="nciDelRow(${i})">✕</span>`:''}</td>
  </tr>`).join('');
}
function nciShowDrop(i){
  const drop=document.getElementById('nciDrop'+i); if(!drop)return;
  const q=(document.getElementById('nciItem'+i)?.value||'').toLowerCase();
  const items=q?store.items.filter(it=>it.name.toLowerCase().includes(q)||(it.code||'').toLowerCase().includes(q)):store.items;
  if(!items.length){drop.classList.remove('show');return;}
  drop.innerHTML=items.map(it=>`<div class="nci-drop-row" onclick="nciPickItem(${i},'${it.id}')">
    <span class="nci-drop-name">${it.name}${it.size?` <small>(${it.size})</small>`:''}</span><span class="nci-drop-price">${rs(it.price)}</span></div>`).join('');
  drop.classList.add('show');
}
function nciSetItem(i,val){ if(!nciRows[i])return; nciRows[i].name=val; nciRows[i].item=val; nciShowDrop(i); nciCalc(); }
function nciPickItem(i,iid){
  const it=store.items.find(x=>x.id===iid); if(!it||!nciRows[i])return;
  nciRows[i].name=it.name; nciRows[i].item=it.name; nciRows[i].price=it.price; if(!nciRows[i].qty)nciRows[i].qty=1;
  document.getElementById('nciDrop'+i).classList.remove('show');
  nciRenderRows(); nciCalc();
}
function nciSet(i,f,v){ if(!nciRows[i])return; nciRows[i][f]=+v||0; nciCalc(); }
function nciAddRow(){ nciRows.push({name:'',item:'',qty:1,price:0}); nciRenderRows(); nciCalc(); }
function nciDelRow(i){ nciRows.splice(i,1); if(!nciRows.length)nciRows=[{name:'',item:'',qty:1,price:0}]; nciRenderRows(); nciCalc(); }
function nciDiscByPct(v){ nciDiscP=+v||0; const a=document.getElementById('nciDiscAmt'); if(a)a.value=Math.round(nciTotals().discAmt)||0; nciCalc(); }
function nciDiscByAmt(v){ nciDiscAmt=+v||0; nciDiscP=0; const p=document.getElementById('nciDiscP'); if(p)p.value=0; nciCalc(); }
function nciSetTax(v){ nciTaxRate=+v||0; nciCalc(); }
function nciSetRecv(v){ nciReceived=+v||0; nciCalc(); }
function nciSetFully(ch){ nciFully=ch; const r=document.getElementById('nciRecv'); if(r)r.disabled=ch; nciCalc(); }
function nciSearchCust(){
  const drop=document.getElementById('nciCustDrop'); if(!drop)return;
  const q=(document.getElementById('nciCust')?.value||'').toLowerCase();
  if(!q){drop.classList.remove('show');return;}
  const matches=store.parties.filter(p=>p.name.toLowerCase().includes(q));
  if(!matches.length){drop.classList.remove('show');return;}
  drop.innerHTML=matches.map(p=>`<div class="nci-drop-row" onclick="nciPickCust('${p.id}')"><span class="nci-drop-name">${p.name}</span><span class="nci-drop-price">${p.phone||''}</span></div>`).join('');
  drop.classList.add('show');
}
function nciPickCust(pid){
  const p=store.parties.find(x=>x.id===pid); if(!p)return;
  nciCustName=p.name; nciCustPhone=p.phone||'';
  document.getElementById('nciCust').value=p.name; document.getElementById('nciPhone').value=p.phone||'';
  document.getElementById('nciCustDrop').classList.remove('show');
  nciPreview();
}
function nciCalc(){
  const t=nciTotals();
  document.querySelectorAll('#nciRows tr').forEach((tr,i)=>{ const r=nciRows[i]; if(r){ const c=tr.querySelector('.nci-rowtot'); if(c)c.textContent=nciFmt((+r.qty||0)*(+r.price||0)); } });
  const sub=document.getElementById('nciSub'); if(sub)sub.textContent=nciFmt(t.sub);
  const taxA=document.getElementById('nciTaxAmt'); if(taxA)taxA.value=Math.round(t.taxAmt);
  if(nciFully){ const r=document.getElementById('nciRecv'); if(r)r.value=nci2(t.total); }
  const bal=document.getElementById('nciBal'); if(bal)bal.textContent=nci2(t.balance);
  const tot=document.getElementById('nciTotal'); if(tot)tot.textContent=nci2(t.total);
  nciPreview();
}
function nciPreview(){
  const pv=document.getElementById('nciPreview'); if(!pv)return;
  const b=store.business, st=store.settings||{}, t=nciTotals();
  const invNo=(st.invPrefix||'INV-')+String(store.counters.sale);
  const cust=(document.getElementById('nciCust')?.value||'').trim();
  const phone=(document.getElementById('nciPhone')?.value||'').trim();
  const rows=nciRows.filter(r=>(r.name||r.item)||r.price);
  const previewPhone=store.currentUser&&store.currentUser.branchPhone?store.currentUser.branchPhone:b.phone;
  pv.innerHTML=`<div class="nci-inv">
    <div class="nci-inv-logo">${b.logo?`<img src="${b.logo}">`:`<div class="nci-inv-logotext">${b.name||'My Business'}</div>`}</div>
    <div class="nci-inv-contact">${previewPhone?`Ph.No.: ${previewPhone}`:''}${b.email?`<br>Email: ${b.email}`:''}</div>
    <div class="nci-dash"></div>
    <div class="nci-inv-title">Invoice</div>
    <div class="nci-inv-meta"><span>Invoice No.: ${invNo}</span><span>Date: ${dispDate()}</span></div>
    <div class="nci-dash"></div>
    ${cust?`<div class="nci-inv-billto"><b>Customer Name:</b> ${cust}${phone?' (+92 '+phone+')':''}</div>`:''}
    ${rows.length?`<table class="nci-inv-tbl"><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Price</th><th>Amt</th></tr></thead><tbody>
      ${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.name||r.item||'-'}</td><td>${r.qty}</td><td>${nciFmt(r.price)}</td><td>${nciFmt((+r.qty||0)*(+r.price||0))}</td></tr>`).join('')}</tbody></table>
      <div class="nci-dash"></div>`:''}
    <div class="nci-inv-tot">
      <div class="nci-inv-tot-row"><span>Total</span><span>:</span><span>${nciFmt(t.total)}</span></div>
      <div class="nci-inv-tot-row"><span>Received</span><span>:</span><span>${nciFmt(t.received)}</span></div>
      <div class="nci-inv-tot-row"><span>Balance</span><span>:</span><span>${nciFmt(t.balance)}</span></div>
    </div>
    <div class="nci-dash"></div>
    ${st.showTerms!==false?`<div class="nci-inv-terms"><b>Terms &amp; Conditions</b><div>${st.terms||'Thanks for doing business with us!'}</div></div>`:''}
  </div>`;
}
function nciSwitchFull(){ openSale(); }
function nciReset(){ nciRows=[{name:'',item:'',qty:1,price:0}]; nciDiscP=0; nciDiscAmt=0; nciTaxRate=0; nciReceived=0; nciFully=false; nciCustName=''; nciCustPhone=''; nciPayMode='Cash'; }
function nciWhatsApp(s){
  let digits=(s.phone||'').replace(/\D/g,'').replace(/^0+/,''); digits=digits.replace(/^92/,'');
  const to=digits?('92'+digits):'';
  const msg=encodeURIComponent(`*${store.business.name||'Invoice'}*\nInvoice: ${s.no}\nTotal: ${rs(s.total)}\nReceived: ${rs(s.received)}\nBalance: ${rs(s.total-s.received)}\n\nThank you!`);
  window.open('https://wa.me/'+to+'?text='+msg,'_blank');
}
function nciSave(action){
  if(!hasPermission('create','invoices') && action!=='preview'){showNoAccess();return;}
  const s=store.settings||{};
  const cust=(document.getElementById('nciCust')?.value||'').trim();
  if(!cust)return toast('Enter Customer Name');
  const phone=(document.getElementById('nciPhone')?.value||'').trim();
  const rows=nciRows.filter(r=>(r.name||r.item)&&(+r.qty>0));
  if(!rows.length)return toast('Add at least one item');
  if(s.blockNewItem){
    const unknown=rows.find(r=>!store.items.find(it=>it.name===r.name||it.name===r.item));
    if(unknown)return toast('New items blocked in settings. Add items from Items page first.');
  }
  if(s.blockNewParty&&!store.parties.find(p=>p.name===cust))return toast('New parties blocked in settings. Add party from Parties page first.');
  const t=nciTotals();
  if(t.total<=0)return toast('Enter item price');
  if(s.negativeStock!==false){
    const negItem=rows.find(r=>{const it=store.items.find(x=>x.name===r.item);return it&&typeof it.stock==='number'&&(it.stock<=0||it.stock<r.qty);});
    if(negItem)return toast('"'+negItem.item+'" - Out of stock or insufficient quantity');
  }
  const invNo=(s.invPrefix||'INV-')+String(store.counters.sale).padStart(2,'0');
  const saleDate=s.addTime?dispDate()+' '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):dispDate();
  const saleRows=rows.map(r=>({item:r.name||r.item,qty:+r.qty||0,price:+r.price||0,disc:0}));
  const saleId=id();
  // A paid mode (Cash/Bank/QR/Card Payment) with no "Received" entered = bill fully paid via that mode.
  const effRecv=(nciPayMode!=='Credit' && (+t.received||0)===0) ? t.total : t.received;
  const branchPhone3=store.currentUser&&store.currentUser.branchPhone?store.currentUser.branchPhone:'';
  const createdBy3=store.currentUser&&store.currentUser.role==='branch'?store.currentUser.branchCode:'admin';
  const createdByName3=store.currentUser?store.currentUser.name:'';
  const sale={id:saleId,no:invNo,party:cust,phone:phone,date:saleDate,time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),rows:saleRows,total:t.total,received:effRecv,discount:t.discAmt,tax:t.taxAmt,mode:nciPayMode,status:effRecv>=t.total?'paid':'unpaid',branchPhone:branchPhone3,createdBy:createdBy3,createdByName:createdByName3};
  store.sales.push(sale);
  store.counters.sale++;
  if(s.stockMaintain!==false)saleRows.forEach(r=>{ const it=store.items.find(x=>x.name===r.item); if(it&&typeof it.stock==='number')it.stock-=r.qty; });
  let p=store.parties.find(x=>x.name===cust);
  if(!p){ p={id:id(),name:cust,phone:phone,type:'customer',balance:0}; store.parties.push(p); }
  else if(phone)p.phone=phone;
  p.balance+=t.total-effRecv;
  store.payments.push({id:id(),saleId:saleId,dir:'in',party:cust,amount:effRecv,mode:nciPayMode,date:dispDate()});
  persist();
  viewInv=sale;
  toast('Invoice saved! '+invNo);
  if(action==='print')printInvoice();
  else if(action==='download')downloadInvoice();
  else if(action==='whatsapp')nciWhatsApp(sale);
  nciReset(); vCreateInvoice();
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.nci-item-cell'))document.querySelectorAll('.nci-item-cell .nci-drop').forEach(d=>d.classList.remove('show'));
  if(!e.target.closest('#nciCust')&&!e.target.closest('#nciCustDrop'))document.getElementById('nciCustDrop')?.classList.remove('show');
});

function vSaleList(){
  const rows=[...store.sales].reverse();
  const totalAmt=rows.reduce((a,s)=>a+s.total,0);
  const totalBal=rows.reduce((a,s)=>a+(s.total-s.received),0);
  content.innerHTML=`<div class="sale-page">
    <div class="sale-head">
      <div class="sale-head-left">
        <div class="sale-title">Sale</div>
        <div class="sale-filters">
          <span class="sf-label">From</span><input type="date" id="sale_from" class="sale-date" onchange="filterSaleList()">
          <span class="sf-label">To</span><input type="date" id="sale_to" class="sale-date" onchange="filterSaleList()">
          <button class="sale-all-btn active" onclick="filterSaleAll(this)">All</button>
        </div>
      </div>
      <div class="sale-head-right">
        <button class="sale-add-btn" onclick="openSale()" ${hasPermission('create','invoice')?'':'style="display:none"'}>+ New Sale</button>
      </div>
    </div>
    <div class="sale-summary">
      <div class="ss-item"><span class="ss-label">Total Sales</span><span class="ss-val">${rows.length}</span></div>
      <div class="ss-item"><span class="ss-label">Total Amount</span><span class="ss-val">${rs(totalAmt)}</span></div>
      <div class="ss-item"><span class="ss-label">Balance</span><span class="ss-val ${totalBal>0?'text-red':''}">${rs(totalBal)}</span></div>
    </div>
    <div class="sale-table-wrap">
      ${rows.length?`<table class="sale-tbl"><thead><tr>
        <th>NO.</th><th>CUSTOMER</th><th>DATE</th><th class="right">AMOUNT</th><th class="right">BALANCE</th><th>STATUS</th>
      </tr></thead><tbody id="saleTblBody">
        ${rows.map(s=>{const st=s.status||(s.refunded?'refunded':s.total-s.received<=0?'paid':'unpaid');
          return `<tr onclick="openSaleEdit('${s.id}')">
            <td class="s-bold" style="color:var(--blue)">${s.no}</td>
            <td>${s.party}</td>
            <td>${s.date}</td>
            <td class="right">${rs(s.total)}</td>
            <td class="right s-bold">${rs(s.total-s.received)}</td>
            <td onclick="event.stopPropagation()" class="status-cell"><span class="inv-status-pill st-${st}" onclick="event.stopPropagation();toggleStatusDrop('${s.id}',event)">${st==='paid'?'Paid':st==='refunded'?'Refunded':st==='replacement'?'Replacement':'Not Paid'}</span></td>
          </tr>`;}).join('')}
      </tbody></table>`
      :`<div class="sale-empty">
        <div class="sale-empty-icon">📄</div>
        <div class="sale-empty-title">No Sale Invoices</div>
        <div class="sale-empty-sub">Create your first sale invoice to get started.</div>
        <button class="sale-add-btn" onclick="openSale()">+ Create Invoice</button>
      </div>`}
    </div>
  </div>`;
}
function vExpenses(){
  const rows=[...store.expenses].reverse();
  content.innerHTML=`<div class="pos-page">
    <div class="pos-topbar">
      <div class="pos-search">🔍 Search Expenses</div>
      <div class="pos-top-actions">
        <button class="pos-action-btn red-outline" onclick="addExpense()" ${hasPermission('create','expense')?'':'style="display:none"'}>+ Add Expense</button>
      </div>
    </div>
    <div class="pos-header"><div class="pos-title">Expenses</div></div>
    <div class="pos-body">
      ${rows.length?`<table class="data"><thead><tr><th>Category</th><th>Note</th><th>Date</th><th class="right">Amount</th></tr></thead><tbody>
        ${rows.map(e=>`<tr><td class="bold">${e.cat}</td><td class="muted">${e.note||'-'}</td><td>${e.date}</td><td class="right">${rs(e.amount)}</td></tr>`).join('')}
      </tbody></table>`
      :`<div class="pos-empty">
        <div class="pos-empty-ill">💸</div>
        <div class="pos-empty-title">No Expenses</div>
        <div class="pos-empty-sub">Add rent, salary, bills and other expenses.</div>
        <button class="btn-big red" onclick="addExpense()" ${hasPermission('create','expense')?'':'style="display:none"'}>+ Add Expense</button>
      </div>`}
    </div>
  </div>`;
}
function addPayment(dir){
  if(!hasPermission('create',dir==='in'?'payment-in':'payment-out')){showNoAccess();return;}
  const isOut=dir==='out';
  const title=isOut?'Payment-Out':'Payment-In';
  const nextNo=(store.payments||[]).filter(p=>p.dir===dir).length+1;
  const receiptNo=(isOut?'PO-':'PI-')+String(nextNo).padStart(4,'0');
  const html=`<div class="modal-overlay modal-dynamic show" id="payOutModal" onclick="closeModal('payOutModal')">
    <div class="modal" onclick="event.stopPropagation()" style="max-width:800px;width:95%;max-height:90vh;overflow-y:auto">
      <div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-bottom:1px solid #eee">
        <span style="font-size:18px;font-weight:700">${title}</span>
        <div style="display:flex;gap:12px;align-items:center">
          <span style="cursor:pointer;font-size:20px" title="Calculator" onclick="toast('Calculator')">🧮</span>
          <span style="cursor:pointer;font-size:20px" title="Settings" onclick="setTab='transaction';nav('settings')">⚙️</span>
          <span style="cursor:pointer;font-size:20px;color:#e74c3c" title="Close" onclick="closeModal('payOutModal')">✕</span>
        </div>
      </div>
      <div style="padding:24px;display:flex;gap:30px;flex-wrap:wrap">
        <div style="flex:1;min-width:280px">
          <div style="margin-bottom:20px">
            <label style="display:block;font-size:13px;color:#2f6df6;font-weight:600;margin-bottom:6px">Party *</label>
            <select id="po_party" style="width:100%;padding:10px 12px;border:1px solid #2f6df6;border-radius:8px;font-size:14px">
              <option value="">Select party...</option>
              ${store.parties.map(p=>`<option value="${p.name}">${p.name} (${rs(Math.abs(p.balance))})</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom:20px">
            <label style="display:block;font-size:13px;color:#666;font-weight:500;margin-bottom:6px">Payment Type</label>
            <select id="po_mode" style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px">
              <option>Cash</option><option>Bank Transfer</option><option>QR Code</option><option>Card Payment</option>
            </select>
          </div>
          <div style="margin-bottom:16px">
            <span style="color:#2f6df6;font-size:13px;cursor:pointer;font-weight:600">+ Add Payment type</span>
          </div>
          <div style="margin-bottom:16px">
            <button onclick="document.getElementById('po_desc_field').style.display=document.getElementById('po_desc_field').style.display==='none'?'block':'none'" style="padding:8px 16px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:13px;color:#666">📝 ADD DESCRIPTION</button>
            <textarea id="po_desc_field" style="display:none;width:100%;margin-top:8px;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:13px;min-height:60px;resize:vertical" placeholder="Add description..."></textarea>
          </div>
          <div style="margin-bottom:10px">
            <span style="cursor:pointer;font-size:24px;color:#ccc" title="Attach photo">📷</span>
          </div>
        </div>
        <div style="flex:1;min-width:250px">
          <div style="margin-bottom:16px;display:flex;align-items:center;gap:10px">
            <label style="font-size:13px;color:#666;font-weight:500;min-width:80px">Receipt No</label>
            <input id="po_receipt" value="${receiptNo}" style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px">
          </div>
          <div style="margin-bottom:20px;display:flex;align-items:center;gap:10px">
            <label style="font-size:13px;color:#666;font-weight:500;min-width:80px">Date</label>
            <input id="po_date" type="date" value="${new Date().toISOString().split('T')[0]}" style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px">
          </div>
          <div style="border-top:1px solid #eee;padding-top:20px">
            <div style="margin-bottom:14px;display:flex;align-items:center;gap:10px">
              <label style="font-size:14px;color:#666;font-weight:500;min-width:80px">Paid</label>
              <input id="po_paid" type="number" value="0" oninput="poUpdateTotal()" style="flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:16px;font-weight:600">
            </div>
            <div style="margin-bottom:14px;display:flex;align-items:center;gap:10px">
              <label style="font-size:14px;color:#666;font-weight:500;min-width:80px">Discount</label>
              <input id="po_disc" type="number" value="0" oninput="poUpdateTotal()" style="flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px">
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid #eee">
              <span style="font-size:16px;font-weight:700">Total</span>
              <span id="po_total" style="font-size:20px;font-weight:800;color:#2f6df6">0</span>
            </div>
          </div>
        </div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:12px">
        <button onclick="sharePaymentOut()" style="padding:10px 24px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;font-weight:600">Share ▾</button>
        <button onclick="savePaymentOut('${dir}')" style="padding:10px 32px;border:none;border-radius:8px;background:#2f6df6;color:#fff;cursor:pointer;font-size:14px;font-weight:700">Save</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

function poUpdateTotal(){
  const paid=+(document.getElementById('po_paid')?.value)||0;
  const disc=+(document.getElementById('po_disc')?.value)||0;
  const total=paid-disc;
  const el=document.getElementById('po_total');
  if(el) el.textContent=rs(total<0?0:total);
}

function savePaymentOut(dir){
  const party=(document.getElementById('po_party')?.value||'').trim();
  if(!party) return toast('Select a party');
  const amount=+(document.getElementById('po_paid')?.value)||0;
  const disc=+(document.getElementById('po_disc')?.value)||0;
  const mode=document.getElementById('po_mode')?.value||'Cash';
  const receipt=document.getElementById('po_receipt')?.value||'';
  const dateStr=document.getElementById('po_date')?.value||'';
  const desc=(document.getElementById('po_desc_field')?.value||'').trim();
  const dateParts=dateStr.split('-');
  const formattedDate=dateParts[2]+'/'+dateParts[1]+'/'+dateParts[0];
  const finalAmount=amount-disc;
  if(finalAmount<=0) return toast('Enter a valid amount');
  store.payments.push({id:id(),dir,party,amount:finalAmount,mode,date:formattedDate||dispDate(),receipt,desc,disc});
  const pt=store.parties.find(x=>x.name===party);
  if(pt) pt.balance+=dir==='in'?-finalAmount:finalAmount;
  persist();
  closeModal('payOutModal');
  toast('Payment saved!');
  if(dir==='out') vPaymentOut(); else vPaymentIn();
}

function sharePaymentOut(){
  const party=(document.getElementById('po_party')?.value||'N/A');
  const amount=(document.getElementById('po_paid')?.value||'0');
  const mode=(document.getElementById('po_mode')?.value||'Cash');
  const date=(document.getElementById('po_date')?.value||'');
  const txt=`Payment Out\\nParty: ${party}\\nAmount: Rs ${amount}\\nMode: ${mode}\\nDate: ${date}`;
  if(navigator.share){navigator.share({title:'Payment Out',text:txt}).catch(()=>{})}
  else{navigator.clipboard.writeText(txt);toast('Copied to clipboard!')}
}


function addExpense(){ 
  if(!hasPermission('create','expense')){showNoAccess();return;}
  formModal('Add Expense',`
  <div class="field"><label>Category</label><input id="f_cat" placeholder="Rent / Salary / Bills"></div>
  <div class="field"><label>Note</label><input id="f_note"></div>
  <div class="field"><label>Amount</label><input id="f_amt" type="number" value="0"></div>`,
  ()=>{ store.expenses.push({id:id(),cat:document.getElementById('f_cat').value||'Misc',note:document.getElementById('f_note').value,amount:+document.getElementById('f_amt').value||0,date:dispDate()});
    persist(); refreshView(); closeModal('formModal'); toast('Added'); vExpenses(); }); }

/* CASH & BANK */
function vUserActivity(){
  var isBranch = store.currentUser && store.currentUser.role === 'branch';
  var branchCode = isBranch ? store.currentUser.branchCode : '';
  var allUsers = store.users || [];
  var filteredUsers = isBranch ? allUsers.filter(u => u.createdBy === branchCode) : allUsers;
  
  content.innerHTML=`<div class="page-head"><h2>${isBranch ? 'Branch Users' : 'User Activity'}</h2></div>
    <div class="ua-hub">
      ${hasPermission('admin','admin-users') ? `
      <div class="ua-card" onclick="addUser()">
        <div class="ua-card-ic">👤</div>
        <div class="ua-card-title">Add User</div>
        <div class="ua-card-desc">Add new team members to manage your business.</div>
        <div class="ua-card-link">Open →</div>
      </div>` : ''}
      <div class="ua-card" onclick="viewUsers()">
        <div class="ua-card-ic">👥</div>
        <div class="ua-card-title">${isBranch ? 'My Users' : 'All Users'}</div>
        <div class="ua-card-desc">${isBranch ? 'View your branch users.' : 'View and manage all registered users.'}</div>
        <div class="ua-card-link">Open →</div>
      </div>
      <div class="ua-card" onclick="userActivityLog()">
        <div class="ua-card-ic">📋</div>
        <div class="ua-card-title">Activity Log</div>
        <div class="ua-card-desc">Track user actions and changes in the system.</div>
        <div class="ua-card-link">Open →</div>
      </div>
      ${!isBranch ? `
      <div class="ua-card" onclick="showAddBranchModal()">
        <div class="ua-card-ic">🏢</div>
        <div class="ua-card-title">Add Branch</div>
        <div class="ua-card-desc">Create a new branch location.</div>
        <div class="ua-card-link">Open →</div>
      </div>
      <div class="ua-card" onclick="showAllBranchesModal()">
        <div class="ua-card-ic">🏬</div>
        <div class="ua-card-title">All Branches</div>
        <div class="ua-card-desc">View and manage all branches with codes.</div>
        <div class="ua-card-link">Open →</div>
      </div>` : ''}
    </div>
    <div class="ua-table-section">
      <h3>${isBranch ? 'My Users' : 'All Users'}</h3>
      <table class="data"><thead><tr><th>Name</th><th>Role</th><th>Created</th>${!isBranch ? '<th>Branch</th>' : ''}<th>Status</th></tr></thead><tbody>
      ${!isBranch ? '<tr><td class="bold">Admin</td><td>Owner</td><td>-</td><td>Admin</td><td><span class="pill paid">Active</span></td></tr>' : ''}
      ${filteredUsers.map(u=>`<tr><td class="bold">${u.name}</td><td>${u.role}</td><td>${u.created||'-'}</td>${!isBranch ? '<td>'+(u.createdBy==='admin'?'<span style="color:#888">Admin</span>':'<span style="color:var(--blue);font-weight:600">'+(u.branchName||u.createdBy)+'</span>')+'</td>' : ''}<td><span class="pill paid">Active</span></td></tr>`).join('')}
      ${filteredUsers.length===0 ? '<tr><td colspan="'+(isBranch?5:6)+'" style="text-align:center;color:#888;padding:20px">No users yet</td></tr>' : ''}
      </tbody></table>
    </div>`;
}
function viewUsers(){
  var isBranch = store.currentUser && store.currentUser.role === 'branch';
  var branchCode = isBranch ? store.currentUser.branchCode : '';
  var allUsers = store.users || [];
  
  // Filter: branch sees only its users, admin sees all
  var filteredUsers = isBranch ? allUsers.filter(u => u.createdBy === branchCode) : allUsers;
  
  var adminRow = isBranch ? '' : `<tr style="cursor:pointer" onclick="viewUserCredentials('admin')"><td class="bold">Admin</td><td>Owner</td><td>••••••</td><td>-</td><td><span class="pill paid">Active</span></td><td><span class="pill" style="background:#e8f4ff;color:var(--blue);cursor:pointer">👁 View</span></td></tr>`;
  
  content.innerHTML=`<div class="page-head"><h2>${isBranch ? 'Branch Users' : 'All Users'}</h2><button class="btn btn-red" onclick="addUser()" ${hasPermission('admin','admin-users')?'':'style="display:none"'}>+ Add User</button></div>
    <div class="panel"><table class="data"><thead><tr><th>Name</th><th>Role</th><th>Password</th><th>Created</th>${!isBranch ? '<th>Branch</th>' : ''}<th>Status</th><th>Actions</th></tr></thead><tbody>
    ${adminRow}
    ${filteredUsers.map(u=>`<tr style="cursor:pointer" onclick="viewUserCredentials('${u.id}')"><td class="bold">${u.name}</td><td>${u.role}</td><td>••••••</td><td>${u.created||'-'}</td>${!isBranch ? '<td>'+(u.createdBy==='admin'?'<span style="color:#888">Admin</span>':'<span style="color:var(--blue);font-weight:600">'+(u.branchName||u.createdBy)+'</span>')+'</td>' : ''}
      <td><span class="pill paid">Active</span></td>
      <td style="display:flex;gap:6px"><span class="pill" style="background:#e8f4ff;color:var(--blue);cursor:pointer" onclick="event.stopPropagation();viewUserCredentials('${u.id}')">👁 View</span><span class="pill due" style="cursor:pointer" onclick="event.stopPropagation();deleteUser('${u.id}')">Delete</span></td></tr>`).join('')}
    ${filteredUsers.length===0 && !adminRow ? '<tr><td colspan="'+(isBranch?6:7)+'" style="text-align:center;color:#888;padding:30px">No users yet. Click "+ Add User" to create one.</td></tr>' : ''}
    </tbody></table></div>`;
}
function deleteUser(uid){
  if(!hasPermission('admin','admin-users')){showNoAccess();return;}
  const u=(store.users||[]).find(x=>x.id===uid);if(!u)return;
  var isBranch = store.currentUser && store.currentUser.role === 'branch';
  if(isBranch && u.createdBy !== store.currentUser.branchCode){toast('Cannot delete this user');return;}
  if(!confirm('Delete user "'+u.name+'"? This action cannot be undone.'))return;
  store.users=(store.users||[]).filter(x=>x.id!==uid);
  persist();
  updateBadge();
  toast('User "'+u.name+'" deleted');
  logActivity('user','Deleted user: '+u.name+' ('+u.role+')');
  viewUsers();
}
function userActivityLog(){
  var logs=store.activityLog||[];
  var isBranch=store.currentUser&&store.currentUser.role==='branch';
  var isStaff=store.currentUser&&store.currentUser.role!=='owner'&&store.currentUser.role!=='admin';
  var currentUserName=store.currentUser?store.currentUser.name:'';
  var branchCode=isBranch?store.currentUser.branchCode:'';
  // Filter: branch sees own + its users' activities, admin/owner sees ALL
  if(isBranch){
    var branchUserNames=[currentUserName];
    (store.users||[]).forEach(function(u){ if(u.createdBy===branchCode) branchUserNames.push(u.name); });
    logs=logs.filter(function(l){ return branchUserNames.indexOf(l.userName)!==-1; });
  }else if(isStaff){
    logs=logs.filter(function(l){ return l.userName===currentUserName; });
  }
  // admin/owner: no filter — see everything
  // Sort by newest first
  logs=logs.slice().sort((a,b)=>(b.ts||0)-(a.ts||0));
  
  // Get unique users for filter
  var userSet={};
  logs.forEach(l=>{if(l.userName)userSet[l.userName]=1;});
  var users=['All Users'].concat(Object.keys(userSet));
  
  window._activityLogs=logs;
  
  content.innerHTML=`<div class="page-head"><h2>Users Activity Table</h2></div>
    <div id="actFilterBar"></div>
    <div class="panel" style="overflow-x:auto">
      <table class="data"><thead><tr>
        <th>FULL NAME</th><th>DATE & TIME</th><th>ROLE</th><th>ACTIONS</th><th>DETAILS</th>
      </tr></thead><tbody id="actTableBody"></tbody></table>
    </div>`;
  
  // Render filter bar
  document.getElementById('actFilterBar').innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;padding:12px 16px;background:#f8f9fa;border-radius:10px">
      <span style="font-size:13px;color:#666;font-weight:600">Filter by:</span>
      <select id="actUserFilter" onchange="filterActivityTable()" style="padding:8px 12px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;background:#fff">
        ${users.map(u=>`<option value="${u}">${u}</option>`).join('')}
      </select>
      <select id="actPeriodFilter" onchange="filterActivityTable()" style="padding:8px 12px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;background:#fff">
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
      </select>
      <div style="display:flex;align-items:center;gap:6px">
        <input type="date" id="actDateFrom" onchange="filterActivityTable()" style="padding:7px 10px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px">
        <span style="color:#888">To</span>
        <input type="date" id="actDateTo" onchange="filterActivityTable()" style="padding:7px 10px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px">
      </div>
    </div>`;
  
  renderActivityTable(logs);
}

function renderActivityTable(logs){
  var container=document.getElementById('actTableBody');
  var countEl=document.getElementById('actCount');
  if(!container)return;
  
  if(countEl)countEl.textContent=logs.length+' activities';
  
  if(!logs.length){
    container.innerHTML='<tr><td colspan="5" style="text-align:center;color:#888;padding:40px">No activities found</td></tr>';
    return;
  }
  
  const typeColors={item:'#1a73e8',party:'#27ae60',invoice:'#ff6b35',user:'#9b59b6',settings:'#e67e22',return:'#e74c3c',exchange:'#3498db',navigation:'#607d8b',purchase:'#00897b',expense:'#e67e22',payment:'#4caf50'};
  
  container.innerHTML=logs.map(l=>{
    var actionType=l.type||'activity';
    var actionLabel=actionType.toUpperCase();
    var detail=l.detail||'-';
    var bgColor=typeColors[actionType]||'#607d8b';
    
    var roleLabel=(l.userRole||'owner');
    if(roleLabel==='owner')roleLabel='Admin (Owner)';
    else if(roleLabel==='branch')roleLabel='Branch';
    else roleLabel=roleLabel.charAt(0).toUpperCase()+roleLabel.slice(1);
    return `<tr>
      <td style="font-weight:600;color:#222">${l.userName||'Owner'}</td>
      <td style="color:#666">${l.date||''} ${l.time||''}</td>
      <td><span style="color:#666">${roleLabel}</span></td>
      <td><span style="background:${bgColor};color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap">${actionLabel}</span></td>
      <td style="color:#1a73e8;font-weight:500">${detail}</td>
    </tr>`;
  }).join('');
}

function filterActivityTable(){
  var logs=window._activityLogs||[];
  var userFilter=document.getElementById('actUserFilter')?document.getElementById('actUserFilter').value:'All Users';
  var periodFilter=document.getElementById('actPeriodFilter')?document.getElementById('actPeriodFilter').value:'all';
  var dateFrom=document.getElementById('actDateFrom')?document.getElementById('actDateFrom').value:'';
  var dateTo=document.getElementById('actDateTo')?document.getElementById('actDateTo').value:'';
  
  var filtered=logs.filter(l=>{
    // User filter
    if(userFilter!=='All Users'&&l.userName!==userFilter)return false;
    
    // Period filter
    if(periodFilter!=='all'&&l.date){
      var parts=l.date.split(/[\s/-]/);
      var logDate=new Date(parts[2]+'-'+parts[1]+'-'+parts[0]);
      var now=new Date();
      var start;
      if(periodFilter==='today'){
        start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
      }else if(periodFilter==='week'){
        start=new Date(now);start.setDate(now.getDate()-7);
      }else if(periodFilter==='month'){
        start=new Date(now.getFullYear(),now.getMonth(),1);
      }else if(periodFilter==='year'){
        start=new Date(now.getFullYear(),0,1);
      }
      if(start&&logDate<start)return false;
    }
    
    // Custom date range
    if(dateFrom||dateTo){
      var parts=l.date.split(/[\s/-]/);
      var logDate=new Date(parts[2]+'-'+parts[1]+'-'+parts[0]);
      if(dateFrom&&logDate<new Date(dateFrom))return false;
      if(dateTo&&logDate>new Date(dateTo))return false;
    }
    
    return true;
  });
  
  renderActivityTable(filtered);
}
function filterActivity(){
  filterActivityTable();
}
function printActivityLog(){
  const logs=store.activityLog||[];
  const typeColors={item:'#1a73e8',party:'#27ae60',invoice:'#ff6b35',user:'#9b59b6',settings:'#e67e22',return:'#e74c3c',exchange:'#3498db',navigation:'#607d8b'};
  const typeIcons={item:'📦',party:'👤',invoice:'📄',user:'👥',settings:'⚙️',return:'↩️',exchange:'🔄',navigation:'🧭'};
  const win=window.open('','','width=900,height=700');
  win.document.write(`<html><head><title>Activity Log</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:30px;color:#333}
      h1{font-size:22px;margin-bottom:5px}
      .subtitle{color:#666;font-size:13px;margin-bottom:20px;border-bottom:2px solid #e0413e;padding-bottom:10px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#f5f5f5;text-align:left;padding:8px 10px;border-bottom:2px solid #ddd;font-weight:700}
      td{padding:7px 10px;border-bottom:1px solid #eee}
      .type-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;color:#fff}
      .user-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;color:#fff}
      .print-date{float:right;font-size:12px;color:#666}
    </style></head><body>
    <h1>📋 Activity Log</h1>
    <div class="subtitle">Blue Berry Studios — Full Audit Trail<span class="print-date">Printed: ${new Date().toLocaleString('en-GB')}</span></div>
    <table><thead><tr><th>#</th><th>Date & Time</th><th>User</th><th>Role</th><th>Type</th><th>Action</th></tr></thead><tbody>
    ${logs.map((l,i)=>{
      const roleColors={owner:'#e74c3c',admin:'#9b59b6',manager:'#1a73e8',cashier:'#27ae60',viewer:'#607d8b'};
      const rc=roleColors[l.userRole]||'#607d8b';
      const tc=typeColors[l.type]||'#888';
      return `<tr><td>${i+1}</td><td>${l.date} ${l.time}</td><td><span class="user-badge" style="background:${rc}">${l.userName||'Owner'}</span></td><td><span class="user-badge" style="background:${rc}">${(l.userRole||'owner').charAt(0).toUpperCase()+(l.userRole||'owner').slice(1)}</span></td><td><span class="type-badge" style="background:${tc}">${(l.type||'').toUpperCase()}</span></td><td>${l.detail}</td></tr>`;
    }).join('')}
    </tbody></table></body></html>`);
  win.document.close();win.print();
}
function userRoles(){
  content.innerHTML=`<div class="page-head"><h2>Roles & Permissions</h2></div>
    <div class="panel"><table class="data"><thead><tr><th>Role</th><th>Access</th><th>Users</th></tr></thead><tbody>
    <tr><td class="bold">Owner</td><td>Full access to all features</td><td>1</td></tr>
    <tr><td class="bold">Admin</td><td>Manage items, parties, invoices, reports</td><td>0</td></tr>
    <tr><td class="bold">Manager</td><td>Manage items, create invoices, view reports</td><td>0</td></tr>
    <tr><td class="bold">Cashier</td><td>Create invoices only</td><td>0</td></tr>
    <tr><td class="bold">Viewer</td><td>View only access</td><td>0</td></tr>
    </tbody></table></div>`;
}
function addUser(){
  var isBranch=store.currentUser&&store.currentUser.role==='branch';
  formModal('Add User',`<div class="field"><label>User Name</label><input id="f_username" placeholder="Enter username" oninput="checkUsernameExists()"></div>
    <div id="f_userError" style="color:var(--red);font-size:12px;margin-top:-8px;margin-bottom:10px;display:none">⚠ Username already exists!</div>
    <div class="field"><label>Role</label><select id="f_userrole" onchange="toggleManagerPinField()"><option>Cashier</option><option>Manager</option><option>Viewer</option>${isBranch?'':'<option>Admin</option>'}</select></div>
    <div id="f_managerPinWrap" style="display:none"><div class="field"><label>Manager PIN (4 digits)</label><input id="f_managerPin" type="password" maxlength="4" placeholder="e.g. 1234" inputmode="numeric" pattern="[0-9]*" style="letter-spacing:6px;text-align:center;font-size:18px"></div></div>
    <div class="field"><label>Password</label><div style="display:flex;gap:8px"><input id="f_userpass" type="password" placeholder="Set password" style="flex:1"><button type="button" class="btn btn-outline" onclick="generateRandomPass()" style="white-space:nowrap;font-size:12px">Random Pass</button></div>
    <div style="margin-top:4px"><label style="font-size:12px;cursor:pointer"><input type="checkbox" id="f_showpass" onchange="togglePassVisibility()"> Show Password</label></div></div>`,
  ()=>{
    const n=document.getElementById('f_username').value.trim();if(!n)return toast('Enter username');
    const exists=(store.users||[]).some(u=>u.name.toLowerCase()===n.toLowerCase());
    if(exists){toast('Username already exists!');return;}
    const role=document.getElementById('f_userrole').value;
    const pass=document.getElementById('f_userpass').value;
    if(!pass)return toast('Set a password');
    if(pass.length<6)return toast('Password must be at least 6 characters');
    var pin='';
    if(role==='Manager'){
      pin=(document.getElementById('f_managerPin').value||'').trim();
      if(!pin||pin.length!==4||!/^\d{4}$/.test(pin))return toast('Manager PIN must be exactly 4 digits');
    }
    if(!store.users)store.users=[];
    var createdBy=isBranch?store.currentUser.branchCode:'admin';
    var branchName=isBranch?store.currentUser.name:'';
    var userData={id:id(),name:n,role,pass,created:dispDate(),createdBy:createdBy,branchName:branchName};
    if(pin)userData.pin=pin;
    if(isBranch){
      store.users.push(userData);
      persist();refreshView();updateBadge();closeModal('formModal');toast('User "'+n+'" added');logActivity('user','Added user: '+n+' ('+role+')');
    }else{
      toast('Creating user…');
      window.createStaffAccount(n,pass).then(function(staffUid){
        userData.staffUid=staffUid;
        store.users.push(userData);
        persist();refreshView();updateBadge();closeModal('formModal');toast('User "'+n+'" added');logActivity('user','Added user: '+n+' ('+role+')');
      }).catch(function(e){
        var box=document.getElementById('f_userError');
        var show=function(m){ if(box){ box.textContent='⚠ '+m; box.style.display='block'; } toast(m); };
      if(e.code==='auth/email-already-in-use')show('Username "'+n+'" already exists. Please choose a different username.');
      else if(e.code==='auth/weak-password')show('Password must be at least 6 characters long.');
      else if(e.code==='not-owner')show('Only the store owner can create new users.');
      else if(e.code==='auth/network-request-failed')show('Please check your internet connection and try again.');
      else show('Error creating user: '+(e.code||e.message));
      });
    }
  },'ADD');
}
function toggleManagerPinField(){
  var role=document.getElementById('f_userrole').value;
  var wrap=document.getElementById('f_managerPinWrap');
  if(wrap) wrap.style.display=role==='Manager'?'block':'none';
}
function posRequireManagerPin(callback){
  var isCashier=store.currentUser&&store.currentUser.role==='cashier';
  if(!isCashier){callback();return;}
  var managers=(store.users||[]).filter(function(u){return u.role==='Manager'&&u.pin;});
  if(!managers.length){toast('No manager with PIN found. Contact admin.');return;}
  formModal('Manager Approval Required',`<div style="text-align:center;margin-bottom:16px"><div style="font-size:36px;margin-bottom:8px">🔐</div><p style="color:#666;font-size:13px;margin:0">Ask a manager to enter their 4-digit PIN to allow price edit.</p></div>
    <div class="field"><label>Manager PIN</label><input id="f_pinVerify" type="password" maxlength="4" placeholder="••••" inputmode="numeric" pattern="[0-9]*" style="letter-spacing:8px;text-align:center;font-size:22px;padding:14px" onkeydown="if(event.key==='Enter')verifyPricePin()"></div>
    <div id="f_pinError" style="color:var(--red);font-size:12px;text-align:center;min-height:16px;margin-top:4px"></div>`,
  ()=>{verifyPricePin(callback);},'VERIFY');
}
function verifyPricePin(callback){
  var pin=(document.getElementById('f_pinVerify').value||'').trim();
  var err=document.getElementById('f_pinError');
  if(!pin){if(err)err.textContent='Enter PIN';return;}
  var managers=(store.users||[]).filter(function(u){return u.role==='Manager'&&u.pin;});
  var match=managers.some(function(u){return u.pin===pin;});
  if(match){
    closeModal('formModal');
    if(callback)callback();
  }else{
    if(err)err.textContent='Invalid PIN. Try again.';
    document.getElementById('f_pinVerify').value='';
    document.getElementById('f_pinVerify').focus();
  }
}
function checkUsernameExists(){
  const n=(document.getElementById('f_username').value||'').trim().toLowerCase();
  const err=document.getElementById('f_userError');
  const exists=n&&(store.users||[]).some(u=>u.name.toLowerCase()===n)||n==='admin';
  err.style.display=exists?'block':'none';
}
function generateRandomPass(){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let pass='';for(let i=0;i<12;i++)pass+=chars[Math.floor(Math.random()*chars.length)];
  document.getElementById('f_userpass').value=pass;
  document.getElementById('f_userpass').type='text';
  document.getElementById('f_showpass').checked=true;
}
function togglePassVisibility(){
  const show=document.getElementById('f_showpass').checked;
  document.getElementById('f_userpass').type=show?'text':'password';
}
function viewUserCredentials(uid){
  if(uid==='admin'){
    formModal('Admin Credentials',`
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:48px;margin-bottom:12px">👑</div>
        <h3 style="margin-bottom:20px">Admin (Owner)</h3>
      </div>
      <div class="field"><label>Username</label><div style="padding:10px 14px;background:#f5f7fa;border-radius:8px;font-size:14px;font-weight:600">Admin</div></div>
      <div class="field"><label>Current Password</label><div style="display:flex;gap:8px"><div id="viewPass" style="padding:10px 14px;background:#f5f7fa;border-radius:8px;font-size:14px;font-weight:600;flex:1">••••••••</div><button type="button" class="btn btn-outline" onclick="revealUserPass('hmdx')" style="font-size:12px">👁 Show</button></div></div>
      <div class="field"><label>New Password (optional)</label><input id="newAdminPass" type="password" placeholder="Enter new password" style="width:100%;padding:10px 14px;border:1px solid var(--line);border-radius:8px;font-size:14px"></div>
      <div class="field"><label>Confirm New Password</label><input id="confirmAdminPass" type="password" placeholder="Confirm new password" style="width:100%;padding:10px 14px;border:1px solid var(--line);border-radius:8px;font-size:14px"></div>`,()=>{
        const np=document.getElementById('newAdminPass').value.trim();
        const cp=document.getElementById('confirmAdminPass').value.trim();
        if(!np){closeModal('formModal');toast('No changes made');return;}
        if(np!==cp){toast('Passwords do not match');return;}
        if(np.length<4){toast('Password must be at least 4 characters');return;}
        window._adminPass=np;
        persist();closeModal('formModal');toast('Admin password updated');
        logActivity('user','Admin changed password');
      },'Update Password');
    return;
  }
  const u=(store.users||[]).find(x=>x.id===uid);if(!u)return;
  formModal('User Credentials',`
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:48px;margin-bottom:12px">👤</div>
      <h3 style="margin-bottom:20px">${u.name}</h3>
    </div>
    <div class="field"><label>Username</label><div style="padding:10px 14px;background:#f5f7fa;border-radius:8px;font-size:14px;font-weight:600">${u.name}</div></div>
    <div class="field"><label>Password</label><div style="display:flex;gap:8px"><div id="viewPass" style="padding:10px 14px;background:#f5f7fa;border-radius:8px;font-size:14px;font-weight:600;flex:1">••••••••</div><button type="button" class="btn btn-outline" onclick="revealUserPass('${u.pass}')" style="font-size:12px">👁 Show</button></div></div>
    <div class="field"><label>Role</label><div style="padding:10px 14px;background:#f5f7fa;border-radius:8px;font-size:14px;font-weight:600">${u.role}</div></div>
    ${u.role==='Manager'&&u.pin?`<div class="field"><label>Manager PIN</label><div style="padding:10px 14px;background:#f5f7fa;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:4px">${u.pin}</div></div>`:''}
    <div class="field"><label>Created</label><div style="padding:10px 14px;background:#f5f7fa;border-radius:8px;font-size:14px">${u.created||'-'}</div></div>`,null,'CLOSE');
}
function revealUserPass(pass){
  document.getElementById('viewPass').textContent=pass;
}
function vRestoreBackup(){
  content.innerHTML=`<div class="page-head"><h2>Restore Backup</h2></div>
    <div class="panel" style="padding:40px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">💾</div>
      <h3>Restore from Backup File</h3>
      <p style="color:#888;margin:12px 0 24px">Select a .json backup file to restore your data</p>
      <button class="btn btn-red" onclick="document.getElementById('restoreFile').click()">Choose Backup File</button>
      <input type="file" id="restoreFile" accept=".json" style="display:none" onchange="doRestore(this)">
    </div>`;
}
function doRestore(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=function(e){
    try{const data=JSON.parse(e.target.result);
      if(data.items&&data.sales){Object.assign(store,data);persist();refreshView();toast('Backup restored successfully!');nav('home');}
      else toast('Invalid backup file');
    }catch(err){toast('Error reading file');}
  };
  reader.readAsText(file);
}
function vBank(){
  if(!store.banks.length){
    content.innerHTML=`<div class="page-head"><h2>Banks</h2></div>
      <div class="empty-page">
        <h2>Manage Multiple Bank Accounts</h2>
        <p>You can organize multiple bank accounts and track all your business transactions in one place.</p>
        <div class="empty-ill">🏦</div>
        <div class="feat-row">
          <div class="feat"><div class="feat-ic">🖨️</div><b>Print Bank Details on Invoices</b><span>Share your bank account information on invoices so customers can pay you easily.</span></div>
          <div class="feat"><div class="feat-ic">💳</div><b>Unlimited Payment Types</b><span>Record payments received through banks, transfers, cards, or any method you prefer.</span></div>
          <div class="feat"><div class="feat-ic">📒</div><b>Maintain Accurate Records</b><span>Keep your financial entries organised for better clarity and reporting.</span></div>
        </div>
        <button class="btn-big red" onclick="addBank()">＋ Add Bank Account</button></div>`;
    return;
  }
  content.innerHTML=`<div class="page-head"><h2>Bank Accounts</h2><button class="btn btn-red" onclick="addBank()">+ Add Bank</button></div>
    <div class="panel"><table class="data"><thead><tr><th>Bank</th><th>A/C No.</th><th class="right">Balance</th></tr></thead><tbody>
    ${store.banks.map(b=>`<tr><td class="bold">${b.name}</td><td class="muted">${b.acc||'-'}</td><td class="right">${rs(b.bal)}</td></tr>`).join('')}
    </tbody></table></div>`;
}
function addBank(){ 
  if(!hasPermission('create','bank')){showNoAccess();return;}
  formModal('Add Bank Account',`
  <div class="field"><label>Bank Name *</label><input id="f_bn"></div>
  <div class="field"><label>Account No.</label><input id="f_acc"></div>
  <div class="field"><label>Opening Balance</label><input id="f_bal" type="number" value="0"></div>`,
  ()=>{ const n=document.getElementById('f_bn').value.trim(); if(!n)return toast('Enter name');
    store.banks.push({id:id(),name:n,acc:document.getElementById('f_acc').value,bal:+document.getElementById('f_bal').value||0});
    persist(); refreshView(); closeModal('formModal'); toast('Added'); vBank(); }); }
function vCash(){
  const cashIn=store.payments.filter(p=>p.dir==='in'&&p.mode==='Cash').reduce((a,b)=>a+b.amount,0);
  const cashOut=store.payments.filter(p=>p.dir==='out'&&p.mode==='Cash').reduce((a,b)=>a+b.amount,0);
  content.innerHTML=`<div class="page-head"><h2>Cash In Hand</h2></div>
    <div class="cards"><div class="card"><div class="lbl">Cash In</div><div class="val" style="color:#1aa260">${rs(cashIn)}</div></div>
    <div class="card"><div class="lbl">Cash Out</div><div class="val" style="color:var(--red)">${rs(cashOut)}</div></div>
    <div class="card"><div class="lbl">In Hand</div><div class="val">${rs(cashIn-cashOut)}</div></div></div>`;
}
function vCardPayments(){ content.innerHTML=`<div class="page-head"><h2>Card Payments</h2></div><div class="panel">${emptyMini('🧾','No open cheques')}</div>`; }
function vLoan(){ content.innerHTML=`<div class="page-head"><h2>Loan Accounts</h2></div><div class="panel">${emptyMini('💳','No loan accounts')}</div>`; }

/* UTILITIES */
let barcodeItems=[];
let bcSelected=new Set();
const BC_SIZES={
  '65':{w:38,h:21,cols:4,label:'65 Labels (38 × 21mm)'},
  '48':{w:48,h:24,cols:3,label:'48 Labels (48 × 24mm)'},
  '24':{w:64,h:34,cols:2,label:'24 Labels (64 × 34mm)'},
  '12':{w:100,h:44,cols:1,label:'12 Labels (100 × 44mm)'}
};
function bcGetSize(){return BC_SIZES[document.getElementById('bc_size')?.value||'65']||BC_SIZES['65'];}
function bcResolveTpl(text,item){
  if(!text)return'';
  const biz=store.business.name||'Your Business';
  let t=text;
  t=t.replace(/<Company Name>/gi,biz);
  t=t.replace(/<Item Name>/gi,item?item.name:'');
  t=t.replace(/<Item Code>/gi,item?(item.code||''):'');
  t=t.replace(/<Sale Price>/gi,item?String(item.price||item.salePrice||0):'');
  t=t.replace(/<Size>/gi,item?(item.size||'N/A'):'');
  t=t.replace(/<Description>/gi,item?(item.desc||''):'');
  return t;
}
function vBarcode(){
  const items=store.items||[];
  const biz=store.business.name||'Your Business';
  const totalLabels=barcodeItems.reduce((s,b)=>s+b.qty,0);
  const pageCount=Math.ceil(totalLabels/barcodeLabelCount());
  content.innerHTML=`<div class="page-head"><h2>Barcode Generator <span style="font-size:13px;color:#aaa;font-weight:400;cursor:pointer" title="Select items and generate barcode labels for printing">ⓘ</span></h2></div>
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:8px"><label style="font-size:13px;font-weight:600">Printer:</label><select id="bc_printer" class="bc-select"><option>Regular Printer</option><option>Label Printer</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-size:13px;font-weight:600">Size:</label><select id="bc_size" class="bc-select" onchange="bcUpdatePageCount()"><option value="65">65 Labels (38 × 21mm)</option><option value="48">48 Labels (48 × 24mm)</option><option value="24">24 Labels (64 × 34mm)</option><option value="12">12 Labels (100 × 44mm)</option></select></div>
    </div>
    <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
      <div style="flex:1;min-width:500px">
        <div class="panel bc-form">
          <div class="bc-field"><label class="bc-label bc-required">Item Name*</label><input id="bc_itemName" class="bc-input" placeholder="Enter Item N" oninput="bcAutoFill()" onfocus="bcShowSuggestions()" onblur="setTimeout(bcHideSuggestions,200)"><div id="bcSuggestions" class="bc-suggestions"></div></div>
          <div class="bc-field"><label class="bc-label bc-required">Item Code*</label><div style="display:flex;border:1px solid var(--line);border-radius:8px;overflow:hidden"><input id="bc_itemCode" class="bc-input" style="border:0;border-radius:0" placeholder="Assign Code" readonly><button class="bc-assign-btn" onclick="bcAssignCode()">Assign Code</button></div></div>
          <div class="bc-field bc-field-sm"><label class="bc-label bc-required">No of Labels*</label><input id="bc_qty" type="number" value="1" min="1" class="bc-input"></div>
          <div class="bc-field"><label class="bc-label">Header</label><input id="bc_header" class="bc-input" placeholder="Enter Heade" onfocus="bcShowDD(this)" onblur="bcHideDD()"></div>
          <div class="bc-field"><label class="bc-label">Line 1</label><input id="bc_line1" class="bc-input" placeholder="Enter Line 1" onfocus="bcShowDD(this)" onblur="bcHideDD()"></div>
          <div class="bc-field"><label class="bc-label">Line 2</label><input id="bc_line2" class="bc-input" placeholder="Enter Line 2" onfocus="bcShowDD(this)" onblur="bcHideDD()"></div>
          <div id="bcDD" class="bc-dropdown"></div>
        </div>
        <div style="margin-top:16px">
          <div class="panel" style="padding:0;overflow:hidden">
            <table class="data bc-table"><thead><tr><th style="width:40px"><input type="checkbox" id="bcSelectAll" onchange="bcToggleAll(this)"></th><th>Item Name</th><th>No of Labels</th><th>Header</th><th>Line 1</th><th>Line 2</th><th style="width:50px"></th></tr></thead><tbody id="bcTable">
            ${barcodeItems.length?barcodeItems.map((b,i)=>`<tr class="${bcSelected.has(i)?'bc-row-sel':''}" onclick="bcToggleRow(${i},event)"><td><input type="checkbox" class="bc-check" data-idx="${i}" ${bcSelected.has(i)?'checked':''} onclick="event.stopPropagation();bcToggleRow(${i},event)"></td><td class="bold">${b.name}</td><td style="position:relative"><span class="bc-qty-edit" onclick="event.stopPropagation();bcEditQty(${i})" title="Edit quantity">✎ </span><span class="bc-qty-val" id="bcQtyVal${i}">${b.qty}</span></td><td>${b.header}</td><td>${b.line1}</td><td>${b.line2}</td><td style="text-align:center"><span class="bc-del-btn" onclick="event.stopPropagation();bcRemove(${i})" title="Delete">🗑</span></td></tr>`).join(''):'<tr><td colspan="7" style="text-align:center;padding:40px;color:#aaa"><div style="font-size:36px;margin-bottom:8px">📊</div>Added items for Barcode generation will appear here.</td></tr>'}</tbody></table>
          </div>
        </div>
      </div>
      <div style="width:220px">
        <div class="panel bc-preview" id="bcPreview">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px" id="bcPrevHeader">Sale Price: 0</div>
          <svg id="bcPrevBarcode"></svg>
          <div style="font-size:12px;color:#555;margin-bottom:2px;font-style:italic" id="bcPrevCode">Itemcode</div>
          <div style="font-size:12px;color:#555;margin-bottom:2px" id="bcPrevLine1">Line1</div>
          <div style="font-size:12px;color:#555" id="bcPrevLine2">Blueberry Studio Bahawalpur</div>
        </div>
        <button class="bc-add-btn" onclick="bcAddItem()">⊕ Add for Barcode</button>
      </div>
    </div>
    <div class="bc-bottom">
      <div style="display:flex;gap:12px;align-items:center">
        <span class="bc-page-info">You will need ${pageCount} page(s) for printing.</span>
        <span class="bc-paper-size">Paper Size: A4</span>
        <span id="bcSelInfo" style="font-size:12px;color:#888">Select items to preview/generate</span>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-outline" onclick="bcPrintPreview()">👁 Preview</button>
        <button class="btn btn-red" style="padding:12px 32px;font-size:15px" onclick="bcGenerate()">Generate</button>
      </div>
    </div>`;
}
function barcodeLabelCount(){return bcGetSize().cols*16;}
function bcUpdatePageCount(){
  const total=barcodeItems.reduce((s,b)=>s+b.qty,0);
  const perPage=barcodeLabelCount();
  const pages=Math.ceil(total/perPage);
  const el=document.querySelector('.bc-page-info');
  if(el)el.textContent='You will need '+pages+' page(s) for printing. ('+perPage+' labels/page)';
}
function bcAssignCode(){
  const itemName=(document.getElementById('bc_itemName').value||'').trim();
  const it=(store.items||[]).find(x=>x.name.toLowerCase()===itemName.toLowerCase());
  if(it&&it.code){
    document.getElementById('bc_itemCode').value=it.code;
  }else{
    const code='BC'+String(Date.now()).slice(-6);
    document.getElementById('bc_itemCode').value=code;
  }
}
function bcAutoFill(){
  const v=document.getElementById('bc_itemName').value.toLowerCase();
  const it=(store.items||[]).find(x=>x.name.toLowerCase().includes(v));
  if(it){
    document.getElementById('bc_itemCode').value=it.code||'';
    document.getElementById('bc_header').value='<Company Name>';
    document.getElementById('bc_line1').value='<Item Name>';
    document.getElementById('bc_line2').value='<Sale Price>';
    bcUpdatePreview();
  } else {
    document.getElementById('bc_itemCode').value='';
  }
  bcUpdatePreview();
}
function bcShowSuggestions(){
  const items=store.items||[];
  const el=document.getElementById('bcSuggestions');
  if(!items.length){el.style.display='none';return;}
  el.innerHTML=items.map(it=>`<div class="bc-sug-item" onmousedown="bcPickItem('${it.id}')"><span>${it.name}</span> <span>(${it.code||'no code'})</span></div>`).join('');
  const input=document.getElementById('bc_itemName');
  const r=input.getBoundingClientRect();
  el.style.left=r.left+'px';
  el.style.top=(r.bottom+4)+'px';
  el.style.width=r.width+'px';
  el.style.display='block';
}
function bcPickItem(iid){
  const it=store.items.find(x=>x.id===iid);if(!it)return;
  document.getElementById('bc_itemName').value=it.name;
  document.getElementById('bc_itemCode').value=it.code||'';
  document.getElementById('bc_header').value='<Company Name>';
  document.getElementById('bc_line1').value='<Item Name>';
  document.getElementById('bc_line2').value='<Sale Price>';
  document.getElementById('bcSuggestions').style.display='none';
  bcUpdatePreview();
}
function bcShowDD(input){
  const opts=['<Company Name>','<Item Name>','<Sale Price>'];
  const el=document.getElementById('bcDD');
  el.innerHTML=opts.map(o=>`<div class="bc-dd-opt" onmousedown="bcPickDD('${input.id}','${o}')">${o}</div>`).join('');
  const r=input.getBoundingClientRect();
  const formEl=input.closest('.bc-form');
  const formR=formEl?formEl.getBoundingClientRect():{left:0,top:0};
  el.style.left=(r.left-formR.left)+'px';
  el.style.top=(r.bottom-formR.top+2)+'px';
  el.style.display='block';
}
function bcHideDD(){setTimeout(()=>{const d=document.getElementById('bcDD');if(d)d.style.display='none';},150);}
function bcHideSuggestions(){const el=document.getElementById('bcSuggestions');if(el)el.style.display='none';}
function bcPickDD(inputId,val){
  document.getElementById(inputId).value=val;
  bcHideDD();
  bcUpdatePreview();
}
function bcUpdatePreview(){
  const selItem=(store.items||[]).find(x=>x.name===document.getElementById('bc_itemName')?.value);
  const header=bcResolveTpl(document.getElementById('bc_header')?.value||'',selItem);
  const line1=bcResolveTpl(document.getElementById('bc_line1')?.value||'',selItem);
  const line2=bcResolveTpl(document.getElementById('bc_line2')?.value||'',selItem);
  const code=document.getElementById('bc_itemCode')?.value||'000000';
  document.getElementById('bcPrevHeader').textContent=header||'Sale Price: 0';
  document.getElementById('bcPrevCode').textContent=code||'Itemcode';
  document.getElementById('bcPrevLine1').textContent=line1||'Line1';
  document.getElementById('bcPrevLine2').textContent=line2||'Blueberry Studio Bahawalpur';
  const sz=bcGetSize();
  const prevBox=document.getElementById('bcPreview');
  if(prevBox){prevBox.style.width=(sz.w+10)+'mm';prevBox.style.minHeight=(sz.h+10)+'mm';}
  bcRenderBarcode();
}
function bcRenderBarcode(){
  const code=document.getElementById('bc_itemCode')?.value||'000000';
  const svg=document.getElementById('bcPrevBarcode');
  if(!svg)return;
  try{
    JsBarcode(svg,code||'000000',{format:'CODE128',width:1.5,height:40,displayValue:false,margin:0});
  }catch(e){
    svg.innerHTML='';
  }
}
function bcAddItem(){
  const name=document.getElementById('bc_itemName').value.trim();
  const code=document.getElementById('bc_itemCode').value.trim();
  const qty=parseInt(document.getElementById('bc_qty').value)||1;
  const header=document.getElementById('bc_header').value.trim();
  const line1=document.getElementById('bc_line1').value.trim();
  const line2=document.getElementById('bc_line2').value.trim();
  if(!name){toast('Enter item name');return;}
  barcodeItems.push({name,code,qty,header,line1,line2});
  toast('Added: '+name);
  bcRefreshTable();
  bcUpdatePageCount();
  document.getElementById('bc_itemName').value='';document.getElementById('bc_itemCode').value='';document.getElementById('bc_qty').value='1';
  document.getElementById('bc_header').value='';document.getElementById('bc_line1').value='';document.getElementById('bc_line2').value='';
  bcUpdatePreview();
}
function bcEditQty(i){
  const b=barcodeItems[i];if(!b)return;
  const newQty=prompt('Enter quantity for '+b.name,b.qty);
  if(newQty===null)return;
  const q=parseInt(newQty);if(q<=0)return;
  b.qty=q;
  bcRefreshTable();
  bcUpdatePageCount();
}
function bcEdit(i){
  const b=barcodeItems[i];if(!b)return;
  document.getElementById('bc_itemName').value=b.name;document.getElementById('bc_itemCode').value=b.code;
  document.getElementById('bc_qty').value=b.qty;document.getElementById('bc_header').value=b.header;
  document.getElementById('bc_line1').value=b.line1;document.getElementById('bc_line2').value=b.line2;
  barcodeItems.splice(i,1);
  bcSelected=new Set([...bcSelected].filter(x=>x!==i).map(x=>x>i?x-1:x));
  bcRefreshTable();bcUpdatePageCount();bcUpdatePreview();
}
function bcRemove(i){
  barcodeItems.splice(i,1);
  bcSelected=new Set([...bcSelected].filter(x=>x!==i).map(x=>x>i?x-1:x));
  bcRefreshTable();bcUpdatePageCount();bcUpdatePreview();
}
function bcRefreshTable(){
  const tbody=document.getElementById('bcTable');
  if(!tbody)return;
  tbody.innerHTML=barcodeItems.length?barcodeItems.map((b,i)=>`<tr class="${bcSelected.has(i)?'bc-row-sel':''}" onclick="bcToggleRow(${i},event)"><td><input type="checkbox" class="bc-check" data-idx="${i}" ${bcSelected.has(i)?'checked':''} onclick="event.stopPropagation();bcToggleRow(${i},event)"></td><td class="bold">${b.name}</td><td style="position:relative"><span class="bc-qty-edit" onclick="event.stopPropagation();bcEditQty(${i})" title="Edit quantity">✎ </span><span class="bc-qty-val" id="bcQtyVal${i}">${b.qty}</span></td><td>${b.header}</td><td>${b.line1}</td><td>${b.line2}</td><td style="text-align:center"><span class="bc-del-btn" onclick="event.stopPropagation();bcRemove(${i})" title="Delete">🗑</span></td></tr>`).join(''):'<tr><td colspan="7" style="text-align:center;padding:40px;color:#aaa"><div style="font-size:36px;margin-bottom:8px">📊</div>Added items for Barcode generation will appear here.</td></tr>';
  const all=document.getElementById('bcSelectAll');
  if(all)all.checked=barcodeItems.length>0&&bcSelected.size===barcodeItems.length;
  bcUpdateSelCount();
}
function bcToggleRow(i,e){
  if(bcSelected.has(i))bcSelected.delete(i);else bcSelected.add(i);
  bcRefreshTable();
}
function bcToggleAll(el){
  if(el.checked){barcodeItems.forEach((_,i)=>bcSelected.add(i));}
  else{bcSelected.clear();}
  bcRefreshTable();
}
function bcUpdateSelCount(){
  const el=document.getElementById('bcSelInfo');
  if(!el)return;
  const total=barcodeItems.length;
  const sel=bcSelected.size;
  el.textContent=sel>0?sel+' of '+total+' selected':'Select items to preview/generate';
  el.style.color=sel>0?'var(--blue)':'#888';
}
function bcGetSelected(){
  if(bcSelected.size===0)return barcodeItems;
  return barcodeItems.filter((_,i)=>bcSelected.has(i));
}
function bcPrintPreview(){
  const selected=bcGetSelected();
  if(!selected.length){toast('Select items first');return;}
  const sz=bcGetSize();
  const totalLabels=selected.reduce((s,b)=>s+b.qty,0);
  let labelsHtml='';
  selected.forEach(b=>{
    const item=(store.items||[]).find(x=>x.name===b.name)||{};
    for(let j=0;j<b.qty;j++){
      const hdr=bcResolveTpl(b.header,item);
      const l1=bcResolveTpl(b.line1,item);
      const l2=bcResolveTpl(b.line2,item);
      labelsHtml+=`<div class="bc-prev-label" style="width:${sz.w}mm;height:${sz.h}mm" data-code="${b.code||'000000'}"><div style="font-weight:700;font-size:10px;text-align:center">${hdr}</div><svg class="bc-prev-svg"></svg><div style="font-size:9px;text-align:center">${b.code}</div><div style="font-size:9px;text-align:center">${l1}</div><div style="font-size:9px;text-align:center">${l2}</div></div>`;
    }
  });
  const overlay=document.createElement('div');
  overlay.id='bcPreviewModal';
  overlay.className='modal-overlay show';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(20,22,30,.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px';
  overlay.innerHTML=`<div style="background:#fff;border-radius:14px;width:95%;max-width:1100px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid var(--line);flex-shrink:0">
      <div><h3 style="margin:0;font-size:18px">Barcode Preview</h3><span style="font-size:13px;color:#888">${selected.length} items, ${totalLabels} labels</span></div>
      <div style="display:flex;gap:10px;align-items:center">
        <button onclick="bcPreviewPrint()" style="padding:8px 20px;background:var(--blue);color:#fff;border:0;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px">🖨️ Print</button>
        <button onclick="document.getElementById('bcPreviewModal').remove()" style="padding:8px 16px;background:#f5f5f5;border:1px solid var(--line);border-radius:8px;cursor:pointer;font-size:14px">✕ Close</button>
      </div>
    </div>
    <div id="bcPreviewBody" style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start;background:#f0f0f0">${labelsHtml}</div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  setTimeout(()=>{
    document.querySelectorAll('#bcPreviewModal .bc-prev-svg').forEach(svg=>{
      const code=svg.closest('.bc-prev-label')?.getAttribute('data-code')||'000000';
      try{JsBarcode(svg,code,{format:'CODE128',width:1.2,height:30,displayValue:false,margin:2});}catch(e){svg.innerHTML='';}
    });
  },100);
}
function bcGenerate(){
  const selected=bcGetSelected();
  if(!selected.length){toast('Select items first');return;}
  const sz=bcGetSize();
  let labelsHtml='';
  selected.forEach(b=>{
    const item=(store.items||[]).find(x=>x.name===b.name)||{};
    for(let j=0;j<b.qty;j++){
      const hdr=bcResolveTpl(b.header,item);
      const l1=bcResolveTpl(b.line1,item);
      const l2=bcResolveTpl(b.line2,item);
      labelsHtml+=`<div class="bc-p-lbl" data-code="${b.code||'000000'}" data-w="${sz.w}" data-h="${sz.h}"><div style="font-weight:700;font-size:10px">${hdr}</div><svg></svg><div style="font-size:9px">${b.code}</div><div style="font-size:9px">${l1}</div><div style="font-size:9px">${l2}</div></div>`;
    }
  });
  bcUniversalPrint(labelsHtml,selected.reduce((s,b)=>s+b.qty,0));
  logActivity('item','Generated '+selected.reduce((s,b)=>s+b.qty,0)+' barcode labels for '+selected.length+' items');
}
function bcPreviewPrint(){
  const labels=document.querySelectorAll('#bcPreviewModal .bc-prev-label');
  if(!labels.length)return;
  const sz=bcGetSize();
  labels.forEach(l=>{l.style.width=sz.w+'mm';l.style.height=sz.h+'mm';});
  let html='';
  labels.forEach(l=>{html+=l.outerHTML;});
  bcUniversalPrint(html,labels.length);
}
function bcUniversalPrint(labelsHtml,totalLabels){
  const sz=bcGetSize();
  const printerType=document.getElementById('bc_printer')?.value||'Regular Printer';
  const fullHTML=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Barcode Labels - Print</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <style>
  *{-webkit-print-color-adjust:exact!important;color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box}
  html,body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,Arial,Helvetica,sans-serif;font-size:12px;color:#000;background:#fff}
  @page{size:A4 portrait;margin:5mm}
  body{padding:5mm}
  .bc-p-title{font-size:11px;font-weight:700;text-align:left;margin:0 0 4px;padding-bottom:4px;border-bottom:1px solid #ccc}
  .bc-p-grid{display:flex;flex-wrap:wrap;gap:0;align-content:flex-start}
  .bc-p-lbl{width:${sz.w}mm;height:${sz.h}mm;border:1px solid #000;padding:2mm;display:inline-flex;flex-direction:column;justify-content:center;align-items:center;page-break-inside:avoid;break-inside:avoid;overflow:hidden;flex-shrink:0}
  .bc-p-lbl svg{max-width:100%;height:auto}
  .bc-p-lbl div{text-align:center;line-height:1.2}
  @media print{
    body{padding:5mm!important;background:#fff!important}
    .bc-p-grid{gap:0!important}
    .bc-p-lbl{border:1px solid #000!important;-webkit-print-color-adjust:exact!important;width:${sz.w}mm!important;height:${sz.h}mm!important}
    @page{size:A4 portrait;margin:5mm}
  }
  @media screen{
    body{padding:20px;background:#e8e8e8}
    .bc-p-grid{gap:4px;padding:16px;background:#fff;border:1px solid #ccc;min-height:400px;border-radius:4px}
    .bc-p-title{margin-bottom:10px;padding-bottom:8px;font-size:13px}
  }
  </style></head><body>
  <div class="bc-p-title">Barcode Labels &mdash; ${totalLabels} labels (${sz.w}mm x ${sz.h}mm)</div>
  <div class="bc-p-grid">${labelsHtml}</div>
  <script>
  function renderAll(){
    document.querySelectorAll('.bc-p-lbl svg').forEach(function(svg){
      var lbl=svg.closest('.bc-p-lbl');
      var code=lbl?lbl.getAttribute('data-code'):'000000';
      try{JsBarcode(svg,code||'000000',{format:'CODE128',width:1.2,height:30,displayValue:false,margin:1});}catch(e){svg.innerHTML='';}
    });
  }
  function goPrint(){renderAll();setTimeout(function(){try{window.print();}catch(e){alert('Print failed. Use Ctrl+P to print manually.');}},500);}
  if(document.readyState==='complete')goPrint();else window.onload=goPrint;
  <\/script></body></html>`;
  var win=window.open('','_blank','width=1024,height=768');
  if(!win){toast('Popup blocked! Allow popups and try again.');return;}
  try{win.document.write(fullHTML);win.document.close();}catch(e){toast('Could not open print window.');}
}
document.addEventListener('click',function(e){
  if(!e.target.closest('#bc_itemName')&&!e.target.closest('#bcSuggestions'))bcHideSuggestions();
});
/* ============ RECYCLE BIN ============ */
let trashSelected=new Set(),trashFilterFrom='',trashFilterTo='',trashFilterFirm='all',trashSearchQ='';
function trashItem(type,data){
  if(!store.trash)store.trash=[];
  const now=new Date();
  const time=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
  const date=now.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});
  store.trash.push({id:id(),type,refNo:data.refNo||data.no||'',partyName:data.partyName||data.party||'',txnType:data.txnType||type,paymentType:data.paymentType||'Cash',amount:data.amount||data.total||0,date:data.date||date,deletedOn:date+' '+time,firm:data.firm||store.business.name||'My Business',originalData:data});
  persist();
}
function trashToComparable(dateStr){
  if(!dateStr)return'';
  const p=dateStr.split(/[\s/]/);
  if(p.length>=3)return p[2]+'-'+p[1]+'-'+p[0];
  return dateStr;
}
function getFilteredTrash(){
  let rows=(store.trash||[]).slice().reverse();
  if(trashSearchQ){const q=trashSearchQ.toLowerCase();rows=rows.filter(r=>(r.partyName||'').toLowerCase().includes(q)||(r.refNo||'').toLowerCase().includes(q)||(r.txnType||'').toLowerCase().includes(q));}
  if(trashFilterFrom){const from=trashFilterFrom;rows=rows.filter(r=>trashToComparable(r.deletedOn)>=from);}
  if(trashFilterTo){const to=trashFilterTo;rows=rows.filter(r=>trashToComparable(r.deletedOn)<=to);}
  if(trashFilterFirm!=='all'){rows=rows.filter(r=>(r.firm||'My Business')===trashFilterFirm);}
  return rows;
}
function vRecycle(){
  trashSelected=new Set();
  const items=getFilteredTrash();
  const firms=[(store.business.name||'My Business'),...(store.companies||[]).map(c=>c.name),...(store.sharedCompanies||[]).map(c=>c.name)].filter((v,i,a)=>a.indexOf(v)===i);
  content.innerHTML=`<div class="rb-page">
    <div class="rb-topbar">
      <div class="rb-search"><span class="rb-search-ic">🔍</span><input placeholder="Search Transactions" oninput="trashSearchQ=this.value;vRecycle()" value="${escHtml(trashSearchQ)}"></div>
      <div class="rb-top-actions">
        <button class="rb-action-btn red-outline" onclick="nav('createinvoice')">+ Add Sale</button>
        <button class="rb-action-btn blue-outline" onclick="nav('purchaseform')">+ Add Purchase</button>
        <button class="rb-action-btn icon-btn">⊕</button>
        <button class="rb-action-btn icon-btn">⋮</button>
      </div>
    </div>
    <div class="rb-title-row">
      <h2 class="rb-title">Recycle Bin</h2>
      <button class="rb-empty-btn" onclick="emptyTrash()">🗑 Empty Trash</button>
    </div>
    <div class="rb-filters">
      <div class="rb-filter-group">
        <select class="rb-date-sel" id="rbDateFilter" onchange="trashDateFilterChange(this.value)">
          <option value="custom">Custom</option>
          <option value="today">Today</option>
          <option value="thisweek">This Week</option>
          <option value="thismonth">This Month</option>
          <option value="lastmonth">Last Month</option>
          <option value="all">All Time</option>
        </select>
        <div class="rb-date-range">
          <span class="rb-between">Between</span>
          <input type="date" class="rb-date-input" id="rbFrom" value="${trashFilterFrom}" onchange="trashFilterFrom=this.value;vRecycle()">
          <span class="rb-to">To</span>
          <input type="date" class="rb-date-input" id="rbTo" value="${trashFilterTo}" onchange="trashFilterTo=this.value;vRecycle()">
        </div>
      </div>
      <div class="rb-filter-firm">
        <select class="rb-firm-sel" onchange="trashFilterFirm=this.value;vRecycle()">
          <option value="all">ALL FIRM</option>
          ${firms.map(f=>`<option value="${f}">${f}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="rb-search-row">
      <div class="rb-local-search"><span class="rb-search-ic">🔍</span><input placeholder="Search..." oninput="rbLocalSearch(this.value)" id="rbLocalSearchInput"></div>
    </div>
    <div class="rb-table-wrap">
      ${items.length?`<table class="rb-tbl">
        <thead><tr>
          <th class="rb-th-check"><input type="checkbox" id="rbCheckAll" onchange="rbToggleAll(this.checked)"></th>
          <th>TRANSACTION D... <span class="rb-filter-ic">⊞</span></th>
          <th>REF. NO. <span class="rb-filter-ic">⊞</span></th>
          <th>CUSTOMER NAME <span class="rb-filter-ic">⊞</span></th>
          <th>FIRM <span class="rb-filter-ic">⊞</span></th>
          <th>TXN TYPE <span class="rb-filter-ic">⊞</span></th>
          <th>PAYMENT TYPE <span class="rb-filter-ic">⊞</span></th>
          <th>AMOUNT <span class="rb-filter-ic">⊞</span></th>
          <th>DELETED ON <span class="rb-filter-ic">⊞</span></th>
        </tr></thead>
        <tbody id="rbTableBody">${items.map(r=>`<tr class="${trashSelected.has(r.id)?'rb-row-sel':''}" onclick="rbToggleRow('${r.id}',event)">
          <td class="rb-td-check"><input type="checkbox" class="rb-check" ${trashSelected.has(r.id)?'checked':''} onclick="event.stopPropagation();rbToggleRow('${r.id}',event)"></td>
          <td>${r.date}</td>
          <td class="rb-bold">${r.refNo}</td>
          <td>${r.partyName}</td>
          <td>${r.firm||'My Business'}</td>
          <td><span class="rb-type-pill rb-type-${r.txnType.toLowerCase().replace(/[^a-z]/g,'')}">${r.txnType}</span></td>
          <td>${r.paymentType}</td>
          <td class="rb-amount">${r.amount?'Rs '+Number(r.amount).toLocaleString('en-IN'):'---'}</td>
          <td class="rb-deleted">${r.deletedOn}</td>
        </tr>`).join('')}</tbody>
      </table>`
      :`<div class="rb-empty-state">
        <div class="rb-empty-icon">🗑</div>
        <div class="rb-empty-title">Recycle bin is empty</div>
        <div class="rb-empty-sub">Deleted transactions will appear here.</div>
      </div>`}
    </div>
    <div class="rb-footer">
      <button class="rb-footer-btn rb-delete-perm" onclick="rbDeletePermanently()" ${trashSelected.size===0?'disabled':''}>Delete Permanently</button>
      <button class="rb-footer-btn rb-restore" onclick="rbRestore()" ${trashSelected.size===0?'disabled':''}>Restore</button>
    </div>
  </div>`;
}
function trashDateFilterChange(val){
  const now=new Date();
  const toInput=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  if(val==='all'){trashFilterFrom='';trashFilterTo='';}
  else if(val==='today'){trashFilterFrom=toInput(now);trashFilterTo=toInput(now);}
  else if(val==='thisweek'){const s=new Date(now);s.setDate(now.getDate()-now.getDay());trashFilterFrom=toInput(s);trashFilterTo=toInput(now);}
  else if(val==='thismonth'){trashFilterFrom=toInput(new Date(now.getFullYear(),now.getMonth(),1));trashFilterTo=toInput(now);}
  else if(val==='lastmonth'){const lm=new Date(now.getFullYear(),now.getMonth()-1,1);const le=new Date(now.getFullYear(),now.getMonth(),0);trashFilterFrom=toInput(lm);trashFilterTo=toInput(le);}
  vRecycle();
}
function rbLocalSearch(q){
  trashSearchQ=q;vRecycle();
  const inp=document.getElementById('rbLocalSearchInput');if(inp){inp.value=q;inp.focus();}
}
function rbToggleRow(sid,e){
  e.stopPropagation();
  if(trashSelected.has(sid))trashSelected.delete(sid);else trashSelected.add(sid);
  vRecycle();
}
function rbToggleAll(checked){
  const items=getFilteredTrash();
  if(checked){items.forEach(r=>trashSelected.add(r.id));}else{trashSelected.clear();}
  vRecycle();
}
function rbRestore(){
  if(!trashSelected.size)return toast('Select items to restore');
  const toRestore=(store.trash||[]).filter(r=>trashSelected.has(r.id));
  let restored=0;
  toRestore.forEach(r=>{
    if(r.type==='sale'&&r.originalData){store.sales.push(r.originalData);restored++;}
    else if(r.type==='item'&&r.originalData){store.items.push(r.originalData);restored++;}
    else if(r.type==='party'&&r.originalData){store.parties.push(r.originalData);restored++;}
    else if(r.type==='purchase'&&r.originalData){store.purchases.push(r.originalData);restored++;}
    else if(r.type==='expense'&&r.originalData){store.expenses.push(r.originalData);restored++;}
  });
  store.trash=(store.trash||[]).filter(r=>!trashSelected.has(r.id));
  trashSelected=new Set();
  persist();vRecycle();
  toast(restored+' item(s) restored');
  logActivity('return','Restored '+restored+' item(s) from recycle bin');
}
function rbDeletePermanently(){
  if(!trashSelected.size)return toast('Select items to delete');
  if(!confirm('Permanently delete '+trashSelected.size+' item(s)? This cannot be undone.'))return;
  store.trash=(store.trash||[]).filter(r=>!trashSelected.has(r.id));
  trashSelected=new Set();
  persist();vRecycle();
  toast('Items permanently deleted');
  logActivity('settings','Permanently deleted items from recycle bin');
}
function emptyTrash(){
  if(!store.trash||!store.trash.length)return toast('Recycle bin is already empty');
  if(!confirm('Empty entire recycle bin? All '+store.trash.length+' items will be permanently deleted.'))return;
  const count=store.trash.length;
  store.trash=[];
  trashSelected=new Set();
  persist();vRecycle();
  toast(count+' items permanently deleted');
  logActivity('settings','Emptied recycle bin ('+count+' items)');
}

function vImport(){
  content.innerHTML=`<div class="import-page">
    <div class="import-left">
      <h2>Import Items From Excel File</h2>
      <div class="import-steps">
        <h3>Steps to Import</h3>
        <div class="import-step">
          <div class="step-num">STEP 1</div>
          <p>Create an Excel file with the following format.</p>
          <button class="btn btn-outline" onclick="downloadSample()">Download Sample</button>
          <table class="sample-tbl">
            <thead><tr><th>Item Code</th><th>Item Name*</th><th>Sale Price</th><th>Purchase Price</th><th>Opening Stock</th><th>Category</th><th>Unit</th></tr></thead>
            <tbody>
              <tr><td>a101</td><td>Shirt Cotton</td><td>1200</td><td>800</td><td>50</td><td>Clothing</td><td>Pcs</td></tr>
              <tr><td>a102</td><td>Jeans Classic</td><td>2500</td><td>1500</td><td>30</td><td>Clothing</td><td>Pcs</td></tr>
              <tr><td>a103</td><td>Socks Pack</td><td>200</td><td>120</td><td>200</td><td>Accessories</td><td>Pack</td></tr>
              <tr><td>a104</td><td>Cap Basic</td><td>350</td><td>200</td><td>100</td><td>Accessories</td><td>Nos</td></tr>
              <tr><td>a105</td><td>Jacket Winter</td><td>4500</td><td>3000</td><td>15</td><td>Clothing</td><td>Pcs</td></tr>
            </tbody>
          </table>
        </div>
        <div class="import-step">
          <div class="step-num">STEP 2</div>
          <p>Upload the file (<b>xlsx</b> or <b>xls</b>) by clicking on the Upload File button below.</p>
        </div>
        <div class="import-step">
          <div class="step-num">STEP 3</div>
          <p>Verify the items from the file & complete the import.</p>
        </div>
      </div>
    </div>
    <div class="import-right">
      <div class="import-upload-label">Upload your .xls/ .xlsx (excel sheet)</div>
      <div class="import-dropzone" id="importDropzone" ondrop="handleImportDrop(event)" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')">
        <div class="import-drop-icon">☁️</div>
        <div class="import-drop-text">Drag & Drop files here</div>
        <div class="import-drop-or">or</div>
        <button class="btn btn-red import-upload-btn" onclick="document.getElementById('importFile').click()">⬆ Upload File</button>
        <input type="file" id="importFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleImportFile(this)">
      </div>
      <div id="importPreview" style="display:none;margin-top:20px"></div>
    </div>
  </div>`;
}
function downloadSample(){
  const headers=['Item Code','Item Name*','Sale Price','Purchase Price','Opening Stock Quantity','Category','Unit'];
  const rows=[['a101','Shirt Cotton',1200,80,50,'Clothing','Pcs'],['a102','Jeans Classic',2500,1500,30,'Clothing','Pcs'],['a103','Socks Pack',200,120,200,'Accessories','Pack'],['a104','Cap Basic',350,200,100,'Accessories','Nos'],['a105','Jacket Winter',4500,3000,15,'Clothing','Pcs'],['a106','T-Shirt Polo',800,500,75,'Clothing','Pcs'],['a107','Trouser Formal',3000,2000,25,'Clothing','Pcs']];
  let csv=headers.join(',')+'\n'+rows.map(r=>'"'+r.join('","')+'"').join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='item-import-sample.csv';a.click();
  toast('Sample downloaded — fill it and upload back');
}
function handleImportDrop(e){e.preventDefault();e.target.closest('.import-dropzone').classList.remove('dragover');const f=e.dataTransfer.files[0];if(f)processImportFile(f);}
function handleImportFile(input){const f=input.files[0];if(f)processImportFile(f);}
function processImportFile(file){
  const ext=file.name.split('.').pop().toLowerCase();
  if(ext==='csv'){
    const reader=new FileReader();
    reader.onload=function(e){parseItemCSV(e.target.result,file.name);};
    reader.readAsText(file);
  } else if(ext==='xlsx'||ext==='xls'){
    if(typeof XLSX==='undefined'){toast('Excel library loading... please try again in 2 seconds');return;}
    const reader=new FileReader();
    reader.onload=function(e){
      try{
        const wb=XLSX.read(e.target.result,{type:'array'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const csv=XLSX.utils.sheet_to_csv(ws);
        parseItemCSV(csv,file.name);
      }catch(err){toast('Error reading Excel file: '+err.message);}
    };
    reader.readAsArrayBuffer(file);
  } else {
    toast('Unsupported file type. Please use .csv, .xlsx, or .xls');
  }
}
function parseItemCSV(text,filename){
  const lines=text.split('\n').filter(l=>l.trim());
  if(lines.length<2){toast('File is empty or has no data rows');return;}
  const headers=lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/[*]/g,''));
  const nameIdx=headers.findIndex(h=>h==='item name'||h==='name'||h==='item_name'||h==='itemname');
  const codeIdx=headers.findIndex(h=>h==='item code'||h==='code'||h==='item_code'||h==='itemcode');
  const saleIdx=headers.findIndex(h=>h==='sale price'||h==='sale_price'||h==='saleprice'||h==='price');
  const purchaseIdx=headers.findIndex(h=>h==='purchase price'||h==='purchase_price'||h==='purchaseprice');
  const stockIdx=headers.findIndex(h=>h==='opening stock'||h==='opening_stock'||h==='stock'||h==='quantity');
  const catIdx=headers.findIndex(h=>h==='category');
  const unitIdx=headers.findIndex(h=>h==='unit');
  if(nameIdx===-1){toast('Column "Item Name" not found. Check your headers.');return;}
  const parsed=[];
  for(let i=1;i<lines.length;i++){
    const cols=parseCSVLine(lines[i]);
    const name=(cols[nameIdx]||'').trim();
    if(!name)continue;
    parsed.push({
      code:(cols[codeIdx]||'').trim()||('IMP'+String(i).padStart(3,'0')),
      name:name,
      salePrice:parseFloat((cols[saleIdx]||'0').replace(/[^0-9.\-]/g,''))||0,
      purchasePrice:parseFloat((cols[purchaseIdx]||'0').replace(/[^0-9.\-]/g,''))||0,
      stock:parseFloat((cols[stockIdx]||'0').replace(/[^0-9.\-]/g,''))||0,
      category:(cols[catIdx]||'General').trim(),
      unit:(cols[unitIdx]||'Pcs').trim()
    });
  }
  if(!parsed.length){toast('No valid items found in file');return;}
  window._importData=parsed;
  const preview=document.getElementById('importPreview');
  preview.style.display='block';
  preview.innerHTML=`<div class="panel" style="padding:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div><h3 style="margin:0">Preview: ${filename}</h3><p style="margin:4px 0 0;color:#888;font-size:13px">${parsed.length} items found</p></div>
      <div style="display:flex;gap:8px"><button class="btn btn-outline" onclick="document.getElementById('importPreview').style.display='none'">Cancel</button><button class="btn btn-red" onclick="doImportItems()">Import ${parsed.length} Items</button></div>
    </div>
    <div style="overflow-x:auto;max-height:400px;overflow-y:auto">
      <table class="data"><thead><tr><th>Code</th><th>Item Name</th><th>Sale Price</th><th>Purchase Price</th><th>Stock</th><th>Category</th><th>Unit</th></tr></thead><tbody>
      ${parsed.map(r=>`<tr><td>${r.code}</td><td style="font-weight:700">${r.name}</td><td>${rs(r.salePrice)}</td><td>${rs(r.purchasePrice)}</td><td>${r.stock}</td><td>${r.category}</td><td>${r.unit}</td></tr>`).join('')}
      </tbody></table>
    </div>
  </div>`;
}
function doImportItems(){
  const data=window._importData;if(!data||!data.length){toast('No data to import');return;}
  let added=0,skipped=0;
  data.forEach(r=>{
    const exists=store.items.find(x=>x.name.toLowerCase()===r.name.toLowerCase());
    if(!exists){store.items.push({id:id(),code:r.code,name:r.name,type:'product',salePrice:r.salePrice,purchasePrice:r.purchasePrice,stock:r.stock,unit:r.unit,category:r.category,desc:'',size:''});added++;}
    else{skipped++;}
  });
  persist();window._importData=null;
  document.getElementById('importPreview').style.display='none';
  toast(added+' items imported'+(skipped?', '+skipped+' skipped (duplicate)':''));
  logActivity('item','Imported '+added+' items from Excel'+(skipped?' ('+skipped+' duplicates skipped)':''));
  nav('items');
}
function vEstimate(){ content.innerHTML=`<div class="page-head"><h2>Estimate / Quotation</h2><button class="btn btn-red" onclick="openSale()">+ New Estimate</button></div>
  <div class="panel">${emptyMini('📄','No estimates yet')}</div>`; }
function emptyMini(ic,t){ return `<div class="empty" style="padding:50px;text-align:center;color:#8a8f9a"><div style="font-size:44px">${ic}</div><div style="margin-top:8px">${t}</div></div>`; }

/* GOOGLE PROFILE MANAGER */
function vGProfile(){
  content.innerHTML=`<div class="page-head"><h2>Google Profile Manager</h2></div>
  <div class="gp-wrap">
    <div class="gp-left">
      <div class="gp-phone">
        <div class="gp-glogo">Google</div>
        <div class="gp-search">${store.business.name||'Your Business'}</div>
        <div class="gp-card">
          <div class="gp-name">${store.business.name||'Your Business'} <span>📍⭐</span></div>
          <div class="gp-cat">${store.business.category||'Your Category'}</div>
          <div class="gp-line">📍 ${store.business.address||'Your business address'}</div>
          <div class="gp-line">🕒 10:00 AM - 10:00 PM</div>
          <div class="gp-line">📞 ${store.business.phone||'+00 123 456 7890'}</div>
        </div>
      </div>
    </div>
    <div class="gp-right">
      <h2>Make your Business Visible on <span class="g">Google</span></h2>
      <p>Create your Google Business Profile in 2 minutes. Help customers find and contact you easily.</p>
      <div class="gp-check">✅ Make your business visible in Google Search</div>
      <div class="gp-check">✅ Help nearby customers find you on Maps</div>
      <div class="gp-check">✅ Show your hours, phone, and location clearly</div>
      <button class="gp-btn" onclick="toast('Google sign-in (demo)')">G  Sign in with Google</button>
    </div>
  </div>`;
}

/* EDIT PROFILE (My Company) */
const BTYPES=['Retail','Wholesale','Distributor','Service','Manufacturing','Others'];
const BCATS=['Accounting & CA','Interior Designer','Automobiles/ Auto parts','Salon & Spa','Liquor Store','Book / Stationary store','Construction Materials & Equipment','Repairing/ Plumbing/ Electrician','Chemicals & Fertilizers','Computer Equipments & Softwares','Electrical & Electronics Equipments','Fashion Accessory/ Cosmetics','Hardware Store','Industrial Machinery & Equipment','Mobile & Accessories','Nursery/ Plants','Petroleum Bulk Stations & Terminals/ Pumps','Restaurant/ Hotel','Footwear','Paper & Paper Products','Sweet Shop/ Bakery','Gifts & Toys','Laundry/ Washing/ Dry clean','Coaching & Training','Others'];
function vProfile(){
  const b=store.business;
  const isBranch=store.currentUser&&store.currentUser.role==='branch';
  const isViewer=store.currentUser&&store.currentUser.role==='viewer';
  const readOnly=isBranch||isViewer;
  const title=isBranch?'Business Profile':'Edit Profile';
  content.innerHTML=`<div class="page-head"><h2>${title}</h2></div>
  <div class="profile-card">
    <div class="logo-up">
      <div class="logo-circle" id="pf_logo">${b.logo?`<img src="${b.logo}">`:'Add<br>Logo'}</div>
      ${readOnly?'':`<span class="logo-edit" onclick="togglePfLogoMenu(event)">✏️</span>
      <div class="pf-logo-menu" id="pfLogoMenu">
        ${b.logo?`<div onclick="pfReplaceLogo()">✏️ Replace Logo</div><div class="del" onclick="pfDeleteLogo()">🗑 Delete Logo</div>`
        :`<div onclick="pfAddLogo()">＋ Add Logo</div>`}
      </div>
      <input type="file" accept="image/*" id="pf_logofile" onchange="pfLogo(this)" hidden>`}
    </div>
    ${isBranch?`<div style="text-align:center;margin-bottom:12px;padding:8px 16px;background:#f0f7ff;border-radius:8px;font-size:12px;color:#1a73e8">Only admin can edit these details. Contact admin to make changes.</div>`:''}
    <div class="profile-grid">
      <div class="pf-col">
        <h3 class="pf-h">Business Details</h3>
        <div class="pf-fld"><label>Business Name<b>*</b></label><input id="pf_name" value="${b.name||''}" ${readOnly?'readonly disabled':''} ${readOnly?'style="background:#f5f5f5;cursor:not-allowed"':''}></div>
        <div class="pf-fld"><label>Phone Number</label><input id="pf_phone" value="${b.phone||''}" ${readOnly?'readonly disabled':''} ${readOnly?'style="background:#f5f5f5;cursor:not-allowed"':''}></div>
        <div class="pf-fld"><label>Email ID</label><input id="pf_email" value="${b.email||''}" placeholder="Enter Email ID" ${readOnly?'readonly disabled':''} ${readOnly?'style="background:#f5f5f5;cursor:not-allowed"':''}></div>
      </div>
      <div class="pf-col">
        <h3 class="pf-h">More Details</h3>
        <div class="pf-fld"><label>Business Type</label>
          <select id="pf_btype" ${readOnly?'disabled':''} ${readOnly?'style="background:#f5f5f5;cursor:not-allowed"':''}><option value="">Select Business Type</option>${BTYPES.map(t=>`<option ${b.btype===t?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="pf-fld"><label>Business Category</label>
          <select id="pf_cat" ${readOnly?'disabled':''} ${readOnly?'style="background:#f5f5f5;cursor:not-allowed"':''}><option value="">Select Business Category</option>${BCATS.map(c=>`<option ${b.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="pf-fld"><label>Pincode</label><input id="pf_pin" value="${b.pincode||''}" placeholder="Enter Pincode" ${readOnly?'readonly disabled':''} ${readOnly?'style="background:#f5f5f5;cursor:not-allowed"':''}></div>
      </div>
      <div class="pf-col">
        <div class="pf-fld"><label>Business Address</label><textarea id="pf_addr" placeholder="Enter Business Address" ${readOnly?'readonly disabled':''} ${readOnly?'style="background:#f5f5f5;cursor:not-allowed"':''}>${b.address||''}</textarea></div>
        <div class="pf-fld"><label>Add Signature</label>
          ${readOnly?`<div style="padding:20px;background:#f5f5f5;border-radius:8px;text-align:center;color:#999;font-size:13px">${b.signature?'Signature set ✓':'No signature'}</div>`
          :`<label class="sign-up">☁️<br>Upload Signature${b.signature?' ✓':''}<input type="file" accept="image/*" id="pf_signfile" onchange="pfSign(this)" hidden></label>`}</div>
      </div>
    </div>
    <div class="profile-foot">
      ${readOnly?`<button class="btn btn-outline" onclick="nav('home')">← Back</button>`
      :`<button class="btn btn-outline" onclick="nav('home')">Cancel</button>
      <button class="btn btn-red" onclick="saveProfile()">Save Changes</button>`}</div>
  </div>`;
}
function togglePfLogoMenu(e){
  e.stopPropagation();
  document.getElementById('pfLogoMenu').classList.toggle('show');
}
document.addEventListener('click',e=>{
  const m=document.getElementById('pfLogoMenu');
  if(m&&m.classList.contains('show')&&!e.target.closest('.logo-up'))m.classList.remove('show');
});
function pfAddLogo(){ if(!hasPermission('edit','settings')){showNoAccess();return;} document.getElementById('pf_logofile').click(); }
function pfReplaceLogo(){ if(!hasPermission('edit','settings')){showNoAccess();return;} document.getElementById('pfLogoMenu').classList.remove('show'); document.getElementById('pf_logofile').click(); }
function pfDeleteLogo(){
  if(!hasPermission('edit','settings')){showNoAccess();return;}
  store.business.logo=''; persist(); refreshView();
  document.getElementById('pfLogoMenu').classList.remove('show');
  document.getElementById('pf_logo').innerHTML='Add<br>Logo';
  toast('Logo deleted');
}
function pfLogo(inp){ if(!hasPermission('edit','settings')){showNoAccess();return;} const f=inp.files[0]; if(!f)return; const r=new FileReader();
  r.onload=e=>{ store.business.logo=e.target.result; persist(); refreshView(); document.getElementById('pf_logo').innerHTML=`<img src="${e.target.result}">`; document.getElementById('pfLogoMenu').innerHTML=`<div onclick="pfReplaceLogo()">✏️ Replace Logo</div><div class="del" onclick="pfDeleteLogo()">🗑 Delete Logo</div>`; toast('Logo saved'); }; r.readAsDataURL(f); }
function pfSign(inp){ const f=inp.files[0]; if(!f)return; const r=new FileReader(); r.onload=e=>{ store.business.signature=e.target.result; persist(); refreshView(); toast('Signature added'); }; r.readAsDataURL(f); }
function saveProfile(){ 
  if(!hasPermission('edit','settings')){showNoAccess();return;}
  const b=store.business;
  b.name=document.getElementById('pf_name').value.trim(); b.phone=document.getElementById('pf_phone').value.trim();
  b.email=document.getElementById('pf_email').value.trim(); b.btype=document.getElementById('pf_btype').value;
  b.category=document.getElementById('pf_cat').value; b.pincode=document.getElementById('pf_pin').value.trim();
  b.address=document.getElementById('pf_addr').value.trim(); persist(); refreshView();
  if(b.name) document.getElementById('bizName').textContent=b.name; toast('Profile saved'); }

/* SETTINGS + LOGO */
let setTab='general';
function vSettings(){
  const s=store.settings;
  const tabs=[['general','GENERAL'],['transaction','TRANSACTION'],['print','PRINT'],['taxes','TAXES'],['txnmsg','TRANSACTION MESSAGE'],['party','PARTY'],['item','ITEM'],['reminders','SERVICE REMINDERS']];
  const ig=`<span class="info-icon" title="More info">i</span>`;
  let body='';
  if(setTab==='general'){
    const firms=[(store.business.name||'My Business'),...(store.companies||[]).map(c=>c.name)].filter((v,i,a)=>a.indexOf(v)===i);
    const curFirm=(store.companies||[]).find(c=>c.current);
    body=`<div class="sg-wrap">
      <div>
        <div class="sg-section">
          <div class="sg-section-title">Application</div>
          <div class="sg-check-row"><input type="checkbox" id="set_passcode"><label for="set_passcode">Enable Passcode</label>${ig}</div>
          <div class="sg-currency-row"><label>Business Currency</label>${ig}<select id="set_cur"><option ${s.currency==='Rs'?'selected':''}>Rs</option><option ${s.currency==='PKR'?'selected':''}>PKR</option><option ${s.currency==='$'?'selected':''}>$</option><option ${s.currency==='AED'?'selected':''}>AED</option></select></div>
          <div class="sg-amount-row"><div><label>Amount</label><div class="sg-sub">(upto Decimal Places)</div>${ig}</div><div class="sg-amount-input"><input type="number" id="set_dec" value="${s.decimals||0}" min="0" max="4"><div class="sg-spin"><button onclick="var i=document.getElementById('set_dec');i.value=Math.min(4,Number(i.value)+1)">▲</button><button onclick="var i=document.getElementById('set_dec');i.value=Math.max(0,Number(i.value)-1)">▼</button></div></div><span class="sg-example">e.g. 0</span></div>
          <div class="sg-check-row"><input type="checkbox" id="set_tin"><label for="set_tin">TIN Number</label>${ig}</div>
          <div class="sg-check-row"><input type="checkbox" id="set_negativeStock" ${s.negativeStock?'checked':''}><label for="set_negativeStock">Stop Sale on Negative Stock</label>${ig}</div>
          <div class="sg-check-row"><input type="checkbox" id="set_blockNewItem"><label for="set_blockNewItem">Block New Items from Txn Form</label>${ig}</div>
          <div class="sg-check-row"><input type="checkbox" id="set_blockNewParty"><label for="set_blockNewParty">Block New Parties from Txn Form</label>${ig}</div>
        </div>
        <div class="sg-section">
          <div class="sg-section-title">More Transactions</div>
          <div class="sg-check-row"><input type="checkbox" id="set_estimate"><label for="set_estimate">Estimate/Quotation</label>${ig}</div>
          <div class="sg-check-row"><input type="checkbox" id="set_proforma"><label for="set_proforma">Proforma Invoice</label>${ig}</div>
          <div class="sg-check-row"><input type="checkbox" id="set_saleOrder" ${s.saleOrder?'checked':''}><label for="set_saleOrder">Sale/Purchase Order</label>${ig}</div>
        </div>
      </div>
      <div>
        <div class="sg-section">
          <div class="sg-check-row" style="padding:0;border:0"><input type="checkbox" id="set_multiFirm" checked><label for="set_multiFirm" style="font-size:15px;font-weight:700;color:var(--ink)">Multi Firm</label></div>
          <div class="sg-firm-card">
            <div class="sg-firm-radio"></div>
            <div class="sg-firm-name">${escHtml(curFirm?curFirm.name:(store.business.name||'Blueberry Studio Bahawalpur'))}</div>
            <span class="sg-firm-default">DEFAULT</span>
            <span class="sg-firm-edit" title="Edit firm">✎</span>
          </div>
        </div>
        <div class="sg-section" style="margin-top:30px">
          <div class="sg-section-title">Stock Transfer Between Stores</div>
          <div class="sg-desc">Manage all your stores/godowns and transfer stock seamlessly between them. Using this feature, you can transfer stock between stores/godowns and manage your inventory more efficiently.</div>
          <div class="sg-check-row"><input type="checkbox" id="set_stockTransfer"><label for="set_stockTransfer">Store management & Stock transfer</label>${ig}<span class="sg-video-icon" title="Watch tutorial">▶</span></div>
        </div>
      </div>
      <div>
        <div class="sg-section">
          <div class="sg-section-title">Backup & History</div>
          <div class="sg-check-row"><input type="checkbox" id="set_txnHistory" checked><label for="set_txnHistory">Transaction History</label>${ig}</div>
        </div>
        <div class="sg-section" style="margin-top:30px">
          <div class="sg-section-title">Customize Your View</div>
          <div class="sg-zoom-label">Choose Your Screen Zoom/Scale</div>
          <div class="sg-zoom-desc">You can use this setting to resize the Vyapar screen, making it larger or smaller to fit your preferences.</div>
          <div class="sg-slider-row"><input type="range" class="sg-slider" id="set_zoom" min="70" max="130" value="${s.zoom||100}" step="5" oninput="document.getElementById('zoomVal').textContent=this.value+'%'"><span id="zoomVal" style="font-size:12px;min-width:36px">${s.zoom||100}%</span><button class="sg-apply-btn" onclick="applyZoom()">Apply</button></div>
        </div>
        <div style="text-align:right;margin-top:20px"><button onclick="saveSettings()" style="background:#e0413e;color:#fff;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:14px">Save</button></div>
      </div>
    </div>`;
  }
  if(setTab==='transaction'){
    const tg=(id,on,lbl)=>`<div class="sg-check-row"><input type="checkbox" id="${id}" ${on?'checked':''}><label for="${id}">${lbl}</label>${ig}</div>`;
    const tgl=(id,on,lbl,extra='')=>`<div class="sg-check-row"><input type="checkbox" id="${id}" ${on?'checked':''}><label for="${id}">${lbl}</label>${extra}${ig}</div>`;
    const firms=[(store.business.name||'My Business'),...(store.companies||[]).map(c=>c.name)].filter((v,i,a)=>a.indexOf(v)===i);
    const curFirm=store.business.name||'Blueberry Studio Bahawalpur';
    body=`<div class="sg-wrap">
      <div>
        <div class="sg-section"><div class="sg-section-title">Transaction Header</div>
          ${tg('set_invNo',s.invNo!==false,'Invoice/Bill No.')}
          ${tg('set_addTime',s.addTime,'Add Time on Transactions')}
          ${tg('set_cashSale',s.cashSale!==false,'Cash Sale by default')}
          ${tg('set_billingName',s.billingName!==false,'Billing Name of Parties')}
          ${tg('set_poDetails',s.poDetails,'Customers P.O. Details on Transactions')}
        </div>
        <div class="sg-section"><div class="sg-section-title">More Transaction Features</div>
          ${tg('set_quickEntry',s.quickEntry,'Quick Entry')}
          ${tg('set_noPreview',s.noPreview,'Do not Show Invoice Preview')}
          ${tg('set_passcodeTxn',s.passcodeTxn,'Enable Passcode for transaction edit/delete')}
          ${tg('set_discPayment',s.discPayment!==false,'Discount During Payments')}
          ${tg('set_linkPayments',s.linkPayments!==false,'Link Payments to Invoices')}
          ${tg('set_dueDates',s.dueDates,'Due Dates and Payment Terms')}
        </div>
      </div>
      <div>
        <div class="sg-section"><div class="sg-section-title">Items Table</div>
          ${tg('set_inclTax',s.inclTax!==false,'Inclusive/Exclusive Tax on Rate(Price/Unit)')}
          ${tg('set_showPurchase',s.showPurchase,'Display Purchase Price of Items')}
          ${tg('set_last5Price',s.last5Price,'Show last 5 Sale Price of Items')}
          ${tg('set_freeItemQty',s.freeItemQty,'Free Item Quantity')}
          ${tgl('set_countField',s.countField!==false,'Count','<span style="color:var(--blue);font-size:12px;margin-left:6px;cursor:pointer">Change Text</span>')}
        </div>
        <div class="sg-section"><div class="sg-section-title">Transaction Prefixes</div>
          <div class="sg-prefix-box">
            <fieldset style="border:1px solid var(--line);border-radius:8px;padding:12px;margin:0"><legend style="font-size:11px;color:var(--muted);padding:0 6px">Firm</legend>
              <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:10px">${escHtml(curFirm)}</div>
              <fieldset style="border:1px solid var(--line);border-radius:8px;padding:12px;margin:0"><legend style="font-size:11px;color:var(--muted);padding:0 6px">Prefixes</legend>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  <div><label style="font-size:11px;color:var(--muted)">Sale</label><select id="set_prefixSale" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px"><option selected>${s.invPrefix||'INV-'}</option><option>None</option></select></div>
                  <div><label style="font-size:11px;color:var(--muted)">Credit Note</label><select style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px"><option selected>None</option></select></div>
                  <div><label style="font-size:11px;color:var(--muted)">Sale Order</label><select style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px"><option selected>None</option></select></div>
                  <div><label style="font-size:11px;color:var(--muted)">Purchase Order</label><select style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px"><option selected>None</option></select></div>
                  <div><label style="font-size:11px;color:var(--muted)">Payment In</label><select style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px"><option selected>None</option></select></div>
                </div>
              </fieldset>
            </fieldset>
          </div>
        </div>
      </div>
      <div>
        <div class="sg-section"><div class="sg-section-title">Taxes, Discount & Totals</div>
          ${tg('set_txnTax',s.txnTax,'Transaction wise Tax')}
          ${tg('set_txnDiscount',s.txnDiscount!==false,'Transaction wise Discount')}
          ${tg('set_roundOff',s.roundOff,'Round Off Total')}
        </div>
        <div class="sg-section"><div class="sg-section-title">Billing Type</div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:#3b4150"><input type="radio" name="billingType" value="lite" ${s.billingType!=='full'?'checked':''} style="accent-color:var(--blue)"> Lite Sale</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:#3b4150"><input type="radio" name="billingType" value="full" ${s.billingType==='full'?'checked':''} style="accent-color:var(--blue)"> Full Sale</label>
          </div>
        </div>
      </div>
      <div style="text-align:right;margin-top:20px"><button onclick="saveSettings()" style="background:#e0413e;color:#fff;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:14px">Save</button></div>
    </div>`;
  }
  if(setTab==='print'){
    const tg=(id,on,lbl)=>`<div class="sg-check-row"><input type="checkbox" id="${id}" ${on?'checked':''}><label for="${id}">${lbl}</label>${ig}</div>`;
    const printTab=store.settings.printerTab||'thermal';
    const pSize=store.settings.pageSize||'3inch';
    body=`<div>
      <div style="display:flex;gap:0;margin-bottom:18px;border-bottom:2px solid var(--line)">
        <div onclick="store.settings.printerTab='regular';vSettings()" style="padding:10px 20px;cursor:pointer;font-weight:700;font-size:13px;color:${printTab==='regular'?'var(--blue)':'var(--muted)'};border-bottom:2px solid ${printTab==='regular'?'var(--blue)':'transparent'};margin-bottom:-2px">REGULAR PRINTER</div>
        <div onclick="store.settings.printerTab='thermal';vSettings()" style="padding:10px 20px;cursor:pointer;font-weight:700;font-size:13px;color:${printTab==='thermal'?'var(--blue)':'var(--muted)'};border-bottom:2px solid ${printTab==='thermal'?'var(--blue)':'transparent'};margin-bottom:-2px">THERMAL PRINTER</div>
      </div>`;
    if(printTab==='thermal'){
      const lastInv=(store.sales||[]).slice(-1)[0]||{};
      const invItems=lastInv.rows||[];
      const invTotal=lastInv.total||0;
      const invReceived=lastInv.received||0;
      const invParty=lastInv.party||'Sample Party Name';
      body+=`<div class="sp-layout">
      <div class="sp-settings">
      <div class="sg-wrap">
        <div>
          <div class="sg-section"><div class="sg-section-title">CHANGE LAYOUT</div>
            <div style="display:flex;gap:10px;margin:10px 0;flex-wrap:wrap">
              ${[2,3,4,5].map(n=>`<div onclick="store.settings.printTheme=${n};vSettings()" style="cursor:pointer;text-align:center;border:2px solid ${s.printTheme===n?'var(--blue)':'transparent'};border-radius:8px;padding:6px;transition:.15s">
                <div style="width:70px;height:80px;background:#f5f7fa;border:1px solid var(--line);border-radius:6px;display:flex;align-items:center;justify-content:center">
                  <div style="width:44px;height:52px;background:#e0e3ea;border-radius:3px"></div>
                </div>
                <div style="font-size:10px;margin-top:4px;color:${s.printTheme===n?'var(--blue)':'#555'}">Theme ${n}</div>
              </div>`).join('')}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin:8px 0"><input type="checkbox" id="set_thermalDefault" ${s.thermalDefault?'checked':''} style="width:16px;height:16px;accent-color:var(--blue)"><label for="set_thermalDefault" style="font-size:12px;color:#3b4150">Make Thermal Printer Default</label><span style="color:var(--blue);font-size:11px;cursor:pointer;margin-left:auto">Set default thermal printer</span>${ig}</div>
          <div class="sg-section" style="margin-top:12px"><div class="sg-section-title">Page Size</div>
            <div style="display:flex;gap:0;border:1px solid var(--line);border-radius:8px;overflow:hidden;margin:8px 0">
              ${[{k:'2inch',l:'2 Inch',s:'58mm'},{k:'3inch',l:'3 Inch',s:'68mm'},{k:'4inch',l:'4 Inch',s:'88mm'},{k:'custom',l:'Custom',s:'48 (Chars)'}].map(p=>`<div onclick="store.settings.pageSize='${p.k}';vSettings()" style="flex:1;text-align:center;padding:8px 4px;cursor:pointer;background:${pSize===p.k?'var(--blue)':'#fff'};color:${pSize===p.k?'#fff':'#333'};font-size:11px;border-right:1px solid var(--line);transition:.15s"><div style="font-weight:600">${p.l}</div><div style="font-size:9px;opacity:.7">${p.s}</div></div>`).join('')}
            </div>
          </div>
          <div class="sg-currency-row" style="margin-top:8px"><label style="font-size:12px">Printing Type</label>${ig}<select style="padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px"><option selected>Text Printing</option><option>Graphical Printing</option></select></div>
          ${tg('set_textBold',s.textBold!==false,'Use Text Styling(Bold)')}
          ${tg('set_autoCut',s.autoCut!==false,'Auto Cut Paper After Printing')}
          ${tg('set_openDrawer',s.openDrawer,'Open Cash Drawer After Printing')}
          <div class="sg-currency-row" style="margin-top:4px"><label style="font-size:12px">Extra lines at the end</label>${ig}<input type="number" value="0" min="0" style="width:44px;padding:4px 6px;border:1px solid var(--line);border-radius:6px;font-size:12px;text-align:center"></div>
        </div>
        <div>
          <div class="sg-section">
            ${tg('set_coName',s.showCoName,'Company Name')}<div style="font-size:12px;color:#555;margin:2px 0 8px 24px">${escHtml(store.business.name||'Blueberry Studio Bahawal')}</div>
            ${tg('set_coLogo',s.showLogo,'Company Logo')}<span style="color:var(--blue);font-size:11px;margin-left:24px;cursor:pointer">(Change)</span>
            ${tg('set_coAddress',s.showAddress,'Address')}<div style="font-size:12px;color:#555;margin:2px 0 8px 24px">${escHtml(store.business.address||'Flux Mall Civil Hospital Road Bahawalpur')}</div>
            ${tg('set_coEmail',s.showEmail,'Email')}<div style="font-size:12px;color:#555;margin:2px 0 8px 24px">${escHtml(store.business.email||'blueberryfatraders@gmail.com')}</div>
            ${tg('set_coPhone',s.showCoPhone,'Phone Number')}<div style="font-size:12px;color:#555;margin:2px 0 8px 24px">${escHtml(store.business.phone||'03132020534')}</div>
            <div style="margin:8px 0"><span style="color:var(--blue);font-size:12px;cursor:pointer">Change Transaction Names &gt;</span></div>
          </div>
          <div class="sg-section"><div class="sg-section-title">Item table</div>
            ${tg('set_tSno',s.tSno!==false,'S.No')}
            ${tg('set_tUom',s.tUom!==false,'Units of Measurement')}
            ${tg('set_tMrp',s.tMrp!==false,'MRP')}
            ${tg('set_tSize',s.tSize,'Size')}
            ${tg('set_tModel',s.tModel,'Model No.')}
            ${tg('set_tSerial',s.tSerial,'Serial No.')}
          </div>
        </div>
        <div>
          <div class="sg-section"><div class="sg-section-title">Totals & Taxes</div>
            ${tg('set_tTotalQty',s.tTotalQty!==false,'Total Item Quantity')}
            <div style="display:flex;align-items:center;gap:6px">${tg('set_tAmountDec',s.tAmountDec!==false,'Amount with Decimal')}<span style="font-size:11px;color:var(--muted)">e.g. 0.00</span></div>
            ${tg('set_tReceived',s.tReceived!==false,'Received Amount')}
            ${tg('set_tBalance',s.tBalance!==false,'Balance Amount')}
            ${tg('set_tPartyBal',s.tPartyBal,'Current Balance of Party')}
            ${tg('set_tTaxDetails',s.tTaxDetails,'Tax Details')}
            ${tg('set_tYouSaved',s.tYouSaved!==false,'You Saved')}
            ${tg('set_tGrouping',s.tGrouping!==false,'Print Amount with Grouping')}
            <div class="sg-currency-row" style="margin-top:4px"><label style="font-size:12px">Amount in Words</label>${ig}<select style="padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px"><option selected>English</option><option>Hindi</option><option>Urdu</option></select></div>
          </div>
          <div class="sg-section"><div class="sg-section-title">Footer</div>
            ${tg('set_tDesc',s.tDesc!==false,'Print Description')}
            <div style="margin:6px 0"><span style="color:var(--blue);font-size:12px;cursor:pointer">Terms and Conditions &gt;</span></div>
          </div>
          <div class="sg-section"><div class="sg-section-title">Vyapar Printer Setup</div>
            <div style="display:flex;flex-direction:column;gap:5px;margin-top:6px">
              ${['2 Inch (VYPRTP2001)','3 Inch (VYPRTP3001)','2 Inch (VYPRTP2002)'].map(p=>`<div style="border:1px solid var(--red);border-radius:8px;padding:7px 12px;color:var(--red);font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:space-between">${p} - Quick Setup <span>⬇</span></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
      </div>
      <div class="sp-preview"><div class="sp-invoice">
        <div style="text-align:center;margin-bottom:12px">
          ${s.showLogo&&store.business.logo?`<div style="text-align:center;margin-bottom:8px"><img src="${store.business.logo}" style="max-width:160px;max-height:60px;object-fit:contain"></div>`:`<div style="text-align:center;margin-bottom:8px"><span style="font-size:18px;font-weight:700;color:var(--blue);font-family:cursive">${escHtml(store.business.name||'Blueberry Studio')}</span></div>`}
          ${s.showCoPhone!==false?`<div>Ph.No.: ${escHtml(store.business.phone||'03132020534')}</div>`:''}
          ${s.showEmail!==false?`<div>Email: ${escHtml(store.business.email||'blueberryfatraders@gmail.com')}</div>`:''}
        </div>
        <div style="border-top:1px dashed #999;margin:8px 0"></div>
        <div style="text-align:center;font-weight:700;margin:6px 0">Invoice</div>
        <div style="display:flex;justify-content:space-between;margin:4px 0"><span>Invoice No.: ${escHtml(lastInv.no||'Inv12345')}</span><span>Date: ${escHtml(lastInv.date||new Date().toLocaleDateString('en-GB'))}</span></div>
        <div style="border-top:1px dashed #999;margin:8px 0"></div>
        <div style="text-align:center;font-weight:600;margin:4px 0">${escHtml(store.business.name||'Vyapar tech solutions')} (${escHtml(invParty)})</div>
        <div style="text-align:center;margin-bottom:6px">Ph. No.: ${escHtml(store.business.phone||'+91 9333 911 911')}</div>
        <div style="margin:4px 0"><b>Customer Name:</b></div>
        <div style="margin-bottom:8px">${escHtml(invParty)}</div>
        <div style="border-top:1px dashed #999;margin:6px 0"></div>
        <table style="width:100%;border-collapse:collapse;font-size:10px">
          <thead><tr style="border-bottom:1px dashed #999">
            <th style="text-align:left;padding:4px 0">#</th>
            <th style="text-align:left;padding:4px 2px">Item Name<br><span style="font-weight:400">Qty Discount(%)</span></th>
            <th style="text-align:right;padding:4px 2px">MRP</th>
            <th style="text-align:right;padding:4px 2px">Price</th>
            <th style="text-align:right;padding:4px 0">Amount<br><span style="font-weight:400">Final Amt</span></th>
          </tr></thead>
          <tbody>${invItems.length?invItems.map((r,i)=>`<tr style="border-bottom:1px dashed #ddd"><td style="padding:4px 0">${i+1}</td><td style="padding:4px 2px">${escHtml(r.item||'Item')}<br><span style="color:#666">${r.qty||1} units</span></td><td style="text-align:right;padding:4px 2px">${rs(r.price||0)}</td><td style="text-align:right;padding:4px 2px">${rs(r.price||0)}</td><td style="text-align:right;padding:4px 0">${rs((r.qty||1)*(r.price||0))}</td></tr>`).join(''):`<tr><td colspan="5" style="text-align:center;padding:16px;color:#999">No items yet</td></tr>`}</tbody>
        </table>
        <div style="border-top:1px dashed #999;margin:6px 0"></div>
        <div style="display:flex;justify-content:space-between;font-weight:600;margin:4px 0"><span>Qty: ${invItems.reduce((a,r)=>a+(r.qty||0),0)}</span><span>Items: ${invItems.length}</span><span>${rs(invTotal)}</span></div>
        <div style="border-top:1px dashed #999;margin:6px 0"></div>
        <div style="font-size:10px">
          <div style="display:flex;justify-content:flex-end;gap:4px"><span style="min-width:80px;text-align:right">Total</span><span>:</span><span style="min-width:60px;text-align:right;font-weight:700">${rs(invTotal)}</span></div>
          <div style="display:flex;justify-content:flex-end;gap:4px"><span style="min-width:80px;text-align:right">Received</span><span>:</span><span style="min-width:60px;text-align:right">${rs(invReceived)}</span></div>
          <div style="display:flex;justify-content:flex-end;gap:4px"><span style="min-width:80px;text-align:right">Balance</span><span>:</span><span style="min-width:60px;text-align:right">${rs(invTotal-invReceived)}</span></div>
        </div>
        <div style="border-top:1px dashed #999;margin:8px 0"></div>
        <div style="text-align:center;font-size:10px;color:#666;margin:6px 0">Balance to be paid in 3 days</div>
        <div style="text-align:center;font-weight:700;margin:8px 0">Terms & Conditions</div>
        <div style="text-align:center;font-size:10px;color:#666">${escHtml(s.terms||'Product Purchase are non Refundable')}</div>
      </div></div>
      </div>`;
    } else {
      body+=`<div class="sg-section"><div class="sg-section-title">Regular Printer Settings</div>
        ${tg('set_showLogo',s.showLogo,'Show Company Logo on Invoice')}
        ${tg('set_showQR',s.showQR,'Show QR Code on Invoice')}
        ${tg('set_showSign',s.showSign,'Show Signature on Invoice')}
        ${tg('set_showTerms',s.showTerms,'Show Terms & Conditions')}
        <div style="margin-top:10px;max-width:500px"><label style="font-size:12px;font-weight:600;color:#3b4150">Default Terms & Conditions</label><textarea id="set_terms" rows="3" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;margin-top:6px;font-size:12px">${s.terms}</textarea></div>
      </div>`;
    }
    body+=`<div style="text-align:right;margin-top:20px"><button onclick="saveSettings()" style="background:#e0413e;color:#fff;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:14px">Save</button></div>`;
  }
  if(setTab==='taxes'){
    body=`<div class="sg-section"><div class="sg-section-title">Tax Settings</div>
      <div class="sg-currency-row"><label>Default Tax Rate (%)</label><input id="set_taxrate" type="number" value="${s.taxRate}" style="padding:8px 12px;border:1px solid var(--line);border-radius:6px;font-size:13px;width:100px"></div>
      <div class="sg-desc">This rate is pre-selected as GST/Tax on new invoices.</div>
    </div>
    <div style="text-align:right;margin-top:20px"><button onclick="saveSettings()" style="background:#e0413e;color:#fff;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:14px">Save</button></div>`;
  }
  if(setTab==='party'){
    const tg=(id,on,lbl)=>`<div class="sg-check-row"><input type="checkbox" id="${id}" ${on?'checked':''}><label for="${id}">${lbl}</label>${ig}</div>`;
    body=`<div class="sg-wrap">
      <div>
        <div class="sg-section"><div class="sg-section-title">Party Settings</div>
          ${tg('set_partyGroup',s.partyGroup,'Party Grouping')}
          ${tg('set_shipAddr',s.shipAddr,'Shipping Address')}
          ${tg('set_partyStatus',s.partyStatus!==false,'Manage Party Status')}
          ${tg('set_payReminder',s.payReminder,'Enable Payment Reminder')}
        </div>
      </div>
      <div>
        <div class="sg-section"><div class="sg-section-title">Additional fields ${ig}</div>
          ${[1,2,3,4].map(n=>`<div style="margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="set_addField${n}" style="width:16px;height:16px;accent-color:var(--blue)"><input placeholder="Additional Field ${n}" style="flex:1;padding:7px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px"></div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px;margin-left:24px"><label class="sw" style="width:36px;height:20px"><input type="checkbox" id="set_addFieldPrint${n}"><i style="background:#cfd4dc;border-radius:20px"><span style="position:absolute;width:16px;height:16px;background:#fff;border-radius:50%;top:2px;left:2px;transition:.2s"></span></i></label><span style="font-size:11px;color:var(--muted)">Show In Print</span></div>
          </div>`).join('')}
        </div>
      </div>
      <div>
        <div class="sg-section"><div class="sg-section-title">Enable Loyalty Point</div>
          ${tg('set_loyalty',s.loyalty,'Enable Loyalty Point')}
        </div>
      </div>
    </div>`;
  }
  if(setTab==='txnmsg'){
    const tg=(id,on,lbl)=>`<div class="sg-check-row"><input type="checkbox" id="${id}" ${on?'checked':''}><label for="${id}">${lbl}</label>${ig}</div>`;
    const msgTemplate=s.txnMsgTemplate||`Greetings from [Firm_Name]\nWe are pleased to have you as a valuable customer. Please find the details of your transaction.\n\n[Transaction_Type] :\nInvoice Amount: [Invoice_Amount]\nBalance: [Transaction_Balance]\n\nThanks for doing business with us.\nRegards,\n[Firm_Name]`;
    const firmName=escHtml(store.business.name||'Blueberry Studio Bahawalpur');
    const previewMsg=msgTemplate.replace(/\[Firm_Name\]/g,firmName).replace(/\[Transaction_Type\]/g,'Sale Invoice').replace(/\[Invoice_Amount\]/g,'792').replace(/\[Transaction_Balance\]/g,'0');
    body=`<div class="sp-layout">
      <div class="sp-settings">
        <div class="sg-section">
          <div class="sg-section-title" style="font-size:15px;font-weight:700;margin-bottom:12px">Transaction Message</div>

          <div style="margin-bottom:16px"><label style="font-size:12px;color:var(--muted);font-weight:500">Select Message Type:</label>
            <div style="display:flex;align-items:center;gap:10px;margin-top:8px;padding:10px 14px;border:2px solid var(--blue);border-radius:10px;background:rgba(47,109,246,.03);max-width:340px">
              <span style="font-size:20px">💬</span>
              <span style="font-size:13px;font-weight:600;color:var(--ink)">Send via Personal WhatsApp</span>
              <span style="margin-left:auto;padding:4px 14px;border:1px solid var(--line);border-radius:6px;font-size:11px;color:var(--muted);cursor:pointer">Login</span>
              <span style="position:absolute;margin-left:310px;margin-top:-18px;width:18px;height:18px;background:var(--blue);border-radius:50%;display:grid;place-items:center"><span style="color:#fff;font-size:11px">✓</span></span>
            </div>
          </div>

          <div style="margin-bottom:16px"><label style="font-size:12px;color:var(--muted);font-weight:500">Message Recipient Settings:</label>
            <div style="display:flex;flex-wrap:wrap;gap:6px 24px;margin-top:8px;padding:10px 0;border-bottom:1px solid var(--line)">
              ${tg('set_smsParty',s.smsParty!==false,'Send SMS to Party')}
              <div style="display:flex;align-items:center;gap:4px">${tg('set_smsUpdate',s.smsUpdate,'Send Transaction Update SMS')}<span style="width:8px;height:8px;background:var(--red);border-radius:50%;flex-shrink:0"></span></div>
              ${tg('set_smsSelf',s.smsSelf,'Send SMS Copy to Self')}
            </div>
          </div>

          <div style="margin-bottom:16px"><label style="font-size:12px;color:var(--muted);font-weight:500">Message Content:</label>
            <div style="display:flex;flex-wrap:wrap;gap:6px 24px;margin-top:8px;padding:10px 0">
              ${tg('set_smsBalance',s.smsBalance,'Party Current Balance in SMS')}
              ${tg('set_smsLink',s.smsLink!==false,'Web invoice link in SMS')}
            </div>
          </div>

          <div><label style="font-size:12px;color:var(--muted);font-weight:500">Send Automatic SMS for:</label>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px 16px;margin-top:8px;padding:10px 0">
              ${tg('set_smsSales',s.smsSales!==false,'Sales')}
              ${tg('set_smsPurchase',s.smsPurchase!==false,'Purchase')}
              ${tg('set_smsSalesRet',s.smsSalesRet!==false,'Sales Return')}
              ${tg('set_smsPurchRet',s.smsPurchRet!==false,'Purchase Return')}
              ${tg('set_smsPayIn',s.smsPayIn!==false,'Payment In')}
              ${tg('set_smsPayOut',s.smsPayOut!==false,'Payment Out')}
              ${tg('set_smsSaleOrd',s.smsSaleOrd!==false,'Sale Order')}
              ${tg('set_smsPurchOrd',s.smsPurchOrd,'Purchase Order')}
              ${tg('set_smsEstimate',s.smsEstimate,'Estimate')}
              ${tg('set_smsProforma',s.smsProforma,'Proforma Invoice')}
              ${tg('set_smsChallan',s.smsChallan,'Delivery Challan')}
              ${tg('set_smsCancelled',s.smsCancelled!==false,'Cancelled Invoice')}
            </div>
          </div>
        </div>
      </div>
      <div class="sp-preview" style="width:380px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px"><label style="font-size:12px;color:var(--muted)">Transaction Type :</label><select style="padding:5px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px;font-weight:600"><option>Sales Transaction</option><option>Purchase Transaction</option><option>Payment In</option><option>Payment Out</option></select></div>
        </div>
        <div style="text-align:center;font-weight:700;font-size:15px;margin-bottom:14px;color:var(--ink)">Edit Message</div>
        <div style="border:2px dashed var(--blue);border-radius:12px;padding:18px 16px;margin-bottom:8px;background:#f8faff;min-height:200px">
          <div contenteditable="true" id="set_txnmsg" style="outline:none;font-size:13px;line-height:1.7;color:var(--ink);min-height:170px;white-space:pre-wrap">${msgTemplate.replace(/</g,'&lt;').replace(/\[Firm_Name\]/g,'<span style="color:var(--blue);font-weight:600">[Firm_Name]</span>').replace(/\[Transaction_Type\]/g,'<span style="color:var(--blue);font-weight:600">[Transaction_Type]</span>').replace(/\[Invoice_Amount\]/g,'<span style="color:var(--blue);font-weight:600">[Invoice_Amount]</span>').replace(/\[Transaction_Balance\]/g,'<span style="color:var(--blue);font-weight:600">[Transaction_Balance]</span>')}</div>
        </div>
        <div style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:18px">Insert "<b style="color:var(--blue)">[</b>" symbol anywhere to include a variable.</div>

        <div style="text-align:center;font-weight:700;font-size:14px;margin-bottom:10px;color:var(--ink)">Message Preview</div>
        <div style="background:#e8f5e9;border-radius:12px;padding:14px;font-size:12px;line-height:1.6;color:#333">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;color:var(--blue);font-weight:600"><span>📎</span> Transaction Image Attached</div>
          <div style="white-space:pre-wrap">${escHtml(previewMsg)}</div>
        </div>
      </div>
      <div style="text-align:right;margin-top:20px"><button onclick="saveSettings()" style="background:#e0413e;color:#fff;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:14px">Save</button></div>
    </div>`;
  }
  if(setTab==='item'){
    const tg=(id,on,lbl)=>`<div class="sg-check-row"><input type="checkbox" id="${id}" ${on?'checked':''}><label for="${id}">${lbl}</label>${ig}</div>`;
    body=`<div class="sg-wrap">
      <div>
        <div class="sg-section"><div class="sg-section-title">Item Settings</div>
          ${tg('set_enableItem',s.enableItem!==false,'Enable Item')}
          <div class="sg-currency-row" style="margin:4px 0"><label style="font-size:12px">What do you sell?</label>${ig}<select style="padding:5px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px"><option selected>Product</option><option>Service</option><option>Both</option></select></div>
          ${tg('set_barcodeScan',s.barcodeScan!==false,'Barcode Scan')}
          ${tg('set_directBarcode',s.directBarcode!==false,'Direct Barcode Scan')}
          ${tg('set_stockMaintain',s.stockMaintain!==false,'Stock Maintenance')}
          ${tg('set_manufacturing',s.manufacturing,'Manufacturing')}
          ${tg('set_lowStock',s.lowStock!==false,'Show Low Stock Dialog')}
          ${tg('set_itemUnit',s.itemUnit!==false,'Items Unit')}
          <div style="display:flex;align-items:center;gap:8px;margin:4px 0 4px 24px"><span style="font-size:12px;color:#3b4150">Default Unit</span><span style="color:var(--blue);font-size:11px;cursor:pointer;margin-left:8px">Change Default Unit</span>${ig}</div>
          ${tg('set_itemCategory',s.itemCategory!==false,'Item Category')}
          ${tg('set_partyWiseRate',s.partyWiseRate,'Party Wise Item Rate')}
          ${tg('set_itemDesc',s.itemDesc!==false,'Description')}<span style="color:var(--blue);font-size:11px;margin-left:24px;cursor:pointer">Change Text</span>
          ${tg('set_itemTax',s.itemTax,'Item wise Tax')}
          ${tg('set_itemDiscount',s.itemDiscount!==false,'Item wise Discount')}
          ${tg('set_updatePrice',s.updatePrice,'Update Sale Price from Transaction')}
          <div class="sg-amount-row" style="margin:6px 0"><div><label style="font-size:12px">Quantity</label><div class="sg-sub">(upto Decimal Places)</div>${ig}</div><div class="sg-amount-input"><input type="number" id="set_itemQtyDec" value="${s.itemQtyDec||2}" min="0" max="4" style="width:48px;padding:5px;border:1px solid var(--line);border-radius:6px 0 0 6px;font-size:12px;text-align:center"><div class="sg-spin"><button onclick="var i=document.getElementById('set_itemQtyDec');i.value=Math.min(4,Number(i.value)+1)">▲</button><button onclick="var i=document.getElementById('set_itemQtyDec');i.value=Math.max(0,Number(i.value)-1)">▼</button></div></div><span class="sg-example">e.g. 0.00</span></div>
          ${tg('set_wholesale',s.wholesale!==false,'Wholesale Price')}
        </div>
      </div>
      <div>
        <div class="sg-section"><div class="sg-section-title">Additional Item Fields</div>
          <div style="margin-bottom:14px"><div class="sg-section-title" style="font-size:12px;border:0;margin:0;padding:0">MRP/Price</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px"><input type="checkbox" style="width:16px;height:16px;accent-color:var(--blue)"><input placeholder="MRP" style="flex:1;padding:7px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px"></div>
          </div>
          <div style="margin-bottom:14px"><div class="sg-section-title" style="font-size:12px;border:0;margin:0;padding:0">Serial No. Tracking ${ig}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px"><input type="checkbox" style="width:16px;height:16px;accent-color:var(--blue)"><input placeholder="Serial No./ IMEI No. etc" style="flex:1;padding:7px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px"></div>
          </div>
          <div style="margin-bottom:14px"><div class="sg-section-title" style="font-size:12px;border:0;margin:0;padding:0">Batch Tracking ${ig}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px"><input type="checkbox" style="width:16px;height:16px;accent-color:var(--blue)"><input placeholder="Batch No." style="flex:1;padding:7px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px"></div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px;margin-left:24px"><input type="checkbox" style="width:16px;height:16px;accent-color:var(--blue)"><select style="padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:11px"><option>mm/yy</option><option>dd/mm/yy</option></select><input placeholder="Exp. Date" style="flex:1;padding:7px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px"></div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px;margin-left:24px"><input type="checkbox" style="width:16px;height:16px;accent-color:var(--blue)"><span style="font-size:12px;color:#3b4150;min-width:55px">Mfg Date</span><select style="padding:5px 8px;border:1px solid var(--line);border-radius:6px;font-size:11px"><option>dd/mm/yy</option></select><input placeholder="Mfg. Date" style="flex:1;padding:7px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px"></div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px;margin-left:24px"><input type="checkbox" style="width:16px;height:16px;accent-color:var(--blue)"><input placeholder="Model No." style="flex:1;padding:7px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px"></div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px;margin-left:24px"><input type="checkbox" id="set_sizeField" ${s.sizeField?'checked':''} style="width:16px;height:16px;accent-color:var(--blue)"><input placeholder="Size" style="flex:1;padding:7px 10px;border:1px solid var(--line);border-radius:6px;font-size:12px"></div>
          </div>
        </div>
      </div>
      <div>
        <div class="sg-section"><div class="sg-section-title">Item Custom Fields ${ig}</div>
          <div style="margin-top:8px"><span style="color:var(--blue);font-size:12px;cursor:pointer;font-weight:500">Add Custom Fields &gt;</span></div>
        </div>
      </div>
    </div>
    <div style="text-align:right;margin-top:20px"><button onclick="saveSettings()" style="background:#e0413e;color:#fff;border:none;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:14px">Save</button></div>`;
  }
  if(setTab==='reminders'){
    body=`<div style="text-align:center">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><span style="font-size:16px;font-weight:700;color:var(--ink)">Service Reminders</span><span style="font-size:11px;color:var(--muted);cursor:pointer">✕</span></div>

      <div style="background:linear-gradient(135deg,#1a73e8,#4285f4);border-radius:12px;padding:24px 30px;display:flex;align-items:center;gap:20px;margin-bottom:24px;color:#fff">
        <div style="flex:1;text-align:left">
          <div style="font-size:16px;font-weight:700;margin-bottom:4px">How does Service Reminders feature work in Vyapar?</div>
          <div style="font-size:12px;opacity:.85">Watch the video and see how you can grow your business using Service Reminders.</div>
        </div>
        <div style="width:120px;height:70px;background:rgba(255,255,255,.15);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">
          <span style="font-size:28px">▶</span>
        </div>
        <div style="padding:8px 18px;background:#e8453c;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0">▶ Play Video</div>
      </div>

      <div style="position:relative;width:100%;max-width:500px;margin:0 auto 20px">
        <div style="width:100%;height:200px;background:linear-gradient(180deg,#fce4b0 0%,#f5d68a 100%);border-radius:50% 50% 0 0/100% 100% 0 0;position:relative;overflow:hidden">
          <div style="position:absolute;bottom:0;left:0;right:0;height:30px;background:linear-gradient(180deg,#d4883a,#b8722e)"></div>
          <div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);width:60px;height:60px;background:#fff;border-radius:50%;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.1)"><span style="font-size:24px">🔔</span></div>
          <div style="position:absolute;bottom:40px;left:25%;width:50px;height:50px;background:#fff;border-radius:50%;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.1)"><span style="font-size:20px">🔧</span></div>
          <div style="position:absolute;bottom:50px;left:50%;transform:translateX(-50%);width:100px;height:70px;background:#fff;border-radius:8px;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.1);border:3px solid #e8453c"><span style="font-size:28px;color:#e8453c">▼</span></div>
          <div style="position:absolute;bottom:35px;right:20%;width:50px;height:50px;background:#fff;border-radius:50%;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.1)"><span style="font-size:18px">💬</span></div>
          <div style="position:absolute;top:30px;left:15%;font-size:14px">⭐</div>
          <div style="position:absolute;top:50px;right:15%;font-size:12px">✨</div>
          <div style="position:absolute;top:80px;left:10%;font-size:10px">✨</div>
          <div style="position:absolute;top:25px;right:25%;font-size:16px">⭐</div>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <span style="font-size:18px;font-weight:700;color:var(--ink)">Service Reminders</span>
        <span style="display:inline-block;padding:2px 8px;background:#e8453c;color:#fff;border-radius:4px;font-size:10px;font-weight:600;margin-left:6px;vertical-align:middle">New</span>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:18px">
        ⏰ Remind your parties | 🤝 Don't lose customers | ✅ Grow your Business
      </div>
      <button style="padding:12px 30px;background:#e8453c;color:#fff;border:none;border-radius:24px;font-size:14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px">🔄 Enable Service Reminders</button>
    </div>`;
  }
  content.innerHTML=`<div class="set-wrap">
      <div class="set-tabs">${tabs.map(([k,l])=>`<div class="set-tab ${setTab===k?'active':''}" onclick="setTab='${k}';vSettings()">${l}</div>`).join('')}</div>
      <div class="set-body"><button class="set-close" onclick="nav('home')" title="Close">✕</button>${body}</div>
    </div>`;
}
function applyLiveSettings(){
  const s=store.settings, g=id=>document.getElementById(id);
  const chk=k=>{const e=g('set_'+k);if(e)s[k]=e.checked;};
  const val=k=>{const e=g('set_'+k);if(e&&e.value!==undefined)s[k]=e.value;};
  const num=k=>{const e=g('set_'+k);if(e)s[k]=+e.value;};
  // General
  val('cur');num('dec');chk('passcode');chk('tin');chk('negativeStock');chk('blockNewItem');chk('blockNewParty');chk('estimate');chk('proforma');chk('multiFirm');chk('saleOrder');chk('stockTransfer');chk('txnHistory');
  // Transaction
  chk('invNo');chk('addTime');chk('cashSale');chk('billingName');chk('poDetails');chk('quickEntry');chk('noPreview');chk('passcodeTxn');chk('discPayment');chk('linkPayments');chk('dueDates');chk('inclTax');chk('showPurchase');chk('last5Price');chk('freeItemQty');chk('countField');chk('txnTax');chk('txnDiscount');chk('roundOff');
  val('prefixSale');
  const bt=document.querySelector('input[name="billingType"]:checked');if(bt)s.billingType=bt.value;
  // Print - thermal printer checkboxes
  chk('thermalDefault');num('itemQtyDec');
  chk('textBold');chk('autoCut');chk('openDrawer');
  // Company fields - map to keys used by invoice preview (thermal uses set_coLogo, regular uses set_showLogo)
  s.showLogo=!!(g('set_coLogo')&&g('set_coLogo').checked||g('set_showLogo')&&g('set_showLogo').checked);
  s.showCoName=!!(g('set_coName')&&g('set_coName').checked);
  s.showAddress=!!(g('set_coAddress')&&g('set_coAddress').checked);
  s.showEmail=!!(g('set_coEmail')&&g('set_coEmail').checked);
  s.showCoPhone=!!(g('set_coPhone')&&g('set_coPhone').checked);
  // Regular printer fields
  s.showQR=!!g('set_showQR')&&g('set_showQR').checked;
  s.showSign=!!g('set_showSign')&&g('set_showSign').checked;
  s.showTerms=!!g('set_showTerms')&&g('set_showTerms').checked;
  // Item table
  chk('tSno');chk('tUom');chk('tMrp');chk('tSize');chk('tModel');chk('tSerial');
  chk('tTotalQty');chk('tAmountDec');chk('tReceived');chk('tBalance');chk('tPartyBal');chk('tTaxDetails');chk('tYouSaved');chk('tGrouping');chk('tDesc');
  if(g('set_terms'))s.terms=g('set_terms').value;
  // Taxes
  num('taxrate');
  // Transaction Message
  chk('smsParty');chk('smsUpdate');chk('smsSelf');chk('smsBalance');chk('smsLink');chk('smsSales');chk('smsPurchase');chk('smsSalesRet');chk('smsPurchRet');chk('smsPayIn');chk('smsPayOut');chk('smsSaleOrd');chk('smsPurchOrd');chk('smsEstimate');chk('smsProforma');chk('smsChallan');chk('smsCancelled');
  const txnMsgEl=g('set_txnmsg');if(txnMsgEl)s.txnMsg=(txnMsgEl.textContent||'').trim();
  // Party
  chk('partyGroup');chk('shipAddr');chk('partyStatus');chk('payReminder');chk('loyalty');
  // Item
  chk('enableItem');chk('barcodeScan');chk('directBarcode');chk('stockMaintain');chk('manufacturing');chk('lowStock');chk('itemUnit');chk('itemCategory');chk('partyWiseRate');chk('itemDesc');chk('itemTax');chk('itemDiscount');chk('updatePrice');chk('wholesale');chk('sizeField');
  // Zoom
  if(g('set_zoom')){s.zoom=+g('set_zoom').value;applyZoom();}
  persist();
}
function applyZoom(){const s=store.settings,z=s.zoom||100;document.documentElement.style.fontSize=(z/100*14)+'px';}
function uploadLogo(inp){if(!hasPermission('edit','settings')){showNoAccess();return;}const f=inp.files[0];if(!f)return;const r=new FileReader();
  r.onload=e=>{store.business.logo=e.target.result;persist();refreshView();toast('Logo saved');};r.readAsDataURL(f);}
function saveSettings(){
  applyLiveSettings();
  buildMenu();
  persist();toast('Settings saved');logActivity('settings','Updated settings');
}
function restoreBackup(inp){ const f=inp.files[0]; if(!f)return; const r=new FileReader();
  r.onload=e=>{ try{ const d=JSON.parse(e.target.result); localStorage.setItem(KEY,JSON.stringify(d)); toast('Backup restored'); location.reload(); }catch(err){ toast('Invalid backup file'); } }; r.readAsText(f); }
function resetAll(){ if(confirm('Delete ALL data and start fresh?')){ localStorage.removeItem(KEY); location.reload(); } }

/* ============ COMPANY LIST ============ */
let companyTabSel='my';
function toggleCompanyMenu(e){ e.stopPropagation(); document.getElementById('tbCompanyMenu').classList.toggle('show'); }
document.addEventListener('click',()=>document.getElementById('tbCompanyMenu')?.classList.remove('show'));
function openCompanyList(){ document.getElementById('tbCompanyMenu').classList.remove('show'); companyTabSel='my';
  const cur=(store.companies||[]).find(c=>c.current); if(cur&&store.business.name) cur.name=store.business.name;
  document.getElementById('cmPhone').textContent=(store.account&&store.account.phone)||'—'; companyTab('my'); showModal('companyModal'); }
function companyTab(t){ companyTabSel=t; document.querySelectorAll('#companyModal .cm-tab').forEach(x=>x.classList.toggle('active',x.dataset.ct===t)); renderCompanies(); }
function renderCompanies(){
  const q=(document.getElementById('cmSearch').value||'').toLowerCase();
  const sub=document.getElementById('cmSub'), list=document.getElementById('cmList'), note=document.getElementById('cmNote');
  if(companyTabSel==='my'){
    sub.textContent='Below are the company that are created by you';
    note.textContent='';
    const rows=(store.companies||[]).filter(c=>(c.name||'').toLowerCase().includes(q));
    list.innerHTML=rows.length?rows.map(c=>`<div class="cm-card">
      <div class="cm-card-name">${c.name||'Untitled'} ${c.current?'<span class="cm-cur">● Current Company</span>':''}</div>
      <div class="cm-card-right">
        <div class="cm-sync"><span class="cm-sync-ic">🖥️</span> SYNC ${c.sync?'ON':'OFF'}</div>
        <span class="cm-vsep"></span>
        <button class="cm-open" onclick="openCompany('${c.id}')">Open</button>
        <span class="cm-dots" onclick="toast('Company options (demo)')">⋮</span>
      </div></div>`).join(''):`<div class="cm-empty">No companies found</div>`;
  } else {
    sub.textContent='Below are the company that are shared with you';
    note.textContent='Note: These companies are not owned by you and are only available for working when internet connection is available.';
    const rows=(store.sharedCompanies||[]).filter(c=>(c.name||'').toLowerCase().includes(q));
    list.innerHTML=rows.length?rows.map(c=>`<div class="cm-card">
      <div><div class="cm-card-name">${c.name}</div><div class="cm-card-sub">Admin Phone: ${c.adminPhone||'—'}</div></div>
      <div class="cm-card-right">
        <button class="cm-open" onclick="openCompany('${c.id}')">Open</button>
        <span class="cm-dots" onclick="toast('Company options (demo)')">⋮</span>
      </div></div>`).join(''):`<div class="cm-empty">No companies shared with you</div>`;
  }
}
function openCompany(cid){
  if(companyTabSel==='my'){ (store.companies||[]).forEach(c=>c.current=(c.id===cid)); const c=store.companies.find(x=>x.id===cid);
    if(c){ store.business.name=c.name; document.getElementById('bizName').textContent=c.name||'Enter Business Name'; } persist(); }
  closeModal('companyModal'); toast('Company opened'); nav('home');
}
function newCompany(){
  formModal('Create New Company',`<div class="field"><label>Company / Business Name *</label><input id="nc_name"></div>
    <div class="field" style="margin-top:12px"><label>Phone Number</label><input id="nc_phone"></div>`,()=>{
    const n=document.getElementById('nc_name').value.trim(); if(!n){ toast('Enter company name'); return; }
    (store.companies||[]).forEach(c=>c.current=false);
    store.companies.push({id:id(),name:n,sync:true,current:true});
    store.business.name=n; document.getElementById('bizName').textContent=n;
    persist(); closeModal('formModal'); renderCompanies(); toast('Company created');
  },'Create');
}
function restoreCompanyBackup(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json,.vyp';
  inp.onchange=()=>restoreBackup(inp); inp.click();
}
function staffLoginPrompt(){
  try{ closeModal('companyModal'); }catch(e){}
  formModal('Login with User ID',`<p style="font-size:12px;color:#888;margin:0 0 12px">Enter your User ID and password to access the same store data.</p>
    <div class="field"><label>User ID</label><input id="sl_uid" placeholder="Enter user id" autocomplete="off"></div>
    <div class="field" style="margin-top:10px"><label>Password</label><input id="sl_pass" type="password" placeholder="Enter password"></div>
    <div id="sl_err" style="color:var(--red);font-size:12px;margin-top:8px;min-height:14px"></div>`,()=>{
    const uid=(document.getElementById('sl_uid').value||'').trim();
    const pass=document.getElementById('sl_pass').value||'';
    const err=document.getElementById('sl_err');
    if(!uid||!pass){ if(err)err.textContent='Please enter both User ID and password.'; return; }
    if(err)err.textContent='Logging in…';
    window.fbStaffLogin(uid,pass,function(m){ if(err)err.textContent=m; });
    // on success, auth state change reloads the store and closes the app gate
    setTimeout(()=>{ try{ closeModal('companyModal'); closeModal('formModal'); }catch(e){} }, 1600);
  },'Login');
}
function companyLogout(){
  document.getElementById('logoutMsg').textContent='Logging out will stop syncing data.';
  document.getElementById('logoutConfirmBtn').onclick=function(){closeModal('logoutModal');closeModal('companyModal');if(window.fbLogout)window.fbLogout();};
  showModal('logoutModal');
}

/* ============ HELPERS ============ */
const content=document.getElementById('content');
function pf(id){ return parseFloat(document.getElementById(id).value)||0 }
function dispDate(){ const d=new Date(); return String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear(); }
function showModal(id){ document.getElementById(id).classList.add('show') }
function closeModal(id){
  const el=document.getElementById(id);
  if(el){
    if(el.classList.contains('modal-dynamic')){
      el.remove();
    } else {
      el.classList.remove('show');
    }
  }
}
function formModal(t,html,onSave,label){ document.getElementById('formTitle').textContent=t; document.getElementById('formBody').innerHTML=html; document.getElementById('formSave').onclick=onSave||function(){closeModal('formModal')}; document.getElementById('formSave').textContent=label||'Save'; showModal('formModal'); }
let tT; function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.add('show'); clearTimeout(tT); tT=setTimeout(()=>t.classList.remove('show'),2000); }

/* item modal Product/Service toggle + tabs */
document.querySelector('#itemModal .switch')?.addEventListener('click',function(){
  this.querySelector('i').style.left=this.querySelector('i').style.left==='22px'?'2px':'22px';
});
function switchImTab(idx){
  document.querySelectorAll('#itemModal .im-tab').forEach((x,i)=>{x.classList.toggle('active',i===idx);});
  const pricing=document.querySelector('.im-pricing-section');
  const stock=document.querySelector('.im-stock-section');
  if(pricing)pricing.style.display=idx===0?'':'none';
  if(stock)stock.style.display=idx===1?'':'none';
}
document.querySelectorAll('#itemModal .im-tab').forEach((t,i)=>t.onclick=()=>switchImTab(i));

/* ============ INIT ============ */
ensure(); persist();
let currentView='home';
if(store.settings&&store.settings.theme){ document.documentElement.style.setProperty('--red',store.settings.theme); document.documentElement.style.setProperty('--red-dark',store.settings.theme); }
buildMenu();
document.querySelector('.mycompany').onclick=()=>{ menuEl.querySelectorAll('.mi,.smi').forEach(x=>x.classList.remove('active')); nav('profile'); };
document.querySelectorAll('#partyModal .pm-tab').forEach(t=>t.onclick=()=>partyTab(t.dataset.pt));
if(store.business.name) document.getElementById('bizName').textContent=store.business.name;
document.querySelector('.side-search').onclick=openAnything;
if(!store.currentUser){
  // Local "select your account" screen removed — the cloud login gate handles identity.
}else{
  const cu=store.currentUser;
  updateBadge();
  if(store.settings&&store.settings.passcode){
    showModal('passcodeModal');
  }else{
    nav('home');
  }
}
function verifyPasscode(){
  const input=document.getElementById('passcodeInput')?.value||'';
  if(input===String(store.settings?.passcodeVal||'1234')){
    closeModal('passcodeModal');
    nav('home');
  }else{
    toast('Wrong passcode!');
  }
}
function showLoginModal(){
  // Disabled: cloud login gate handles identity now. Never show the local account picker.
  try{ closeModal('loginModal'); }catch(e){}
  return;
  const users=store.users||[];
  const allOpts=[{name:'Owner (Admin)',role:'owner',pass:window._adminPass||'hmdx'}].concat(users.map(u=>({name:u.name,role:u.role,pass:u.pass,id:u.id})));
  showModal('loginModal');
  document.getElementById('loginUserList').innerHTML=allOpts.map((u,i)=>`
    <div class="login-user-card" onclick="selectLoginUser(${i})" data-idx="${i}">
      <div class="login-user-avatar">${u.role==='owner'?'👑':u.role==='admin'?'⚡':u.role==='manager'?'📋':u.role==='cashier'?'💰':'👁'}</div>
      <div class="login-user-name">${u.name}</div>
      <div class="login-user-role">${u.role.charAt(0).toUpperCase()+u.role.slice(1)}</div>
    </div>`).join('');
  document.getElementById('loginPass').value='';
  document.getElementById('loginError').textContent='';
  window._loginUsers=allOpts;
  window._selectedLoginIdx=-1;
}
function selectLoginUser(idx){
  window._selectedLoginIdx=idx;
  document.querySelectorAll('.login-user-card').forEach((c,i)=>c.classList.toggle('selected',i===idx));
  document.getElementById('loginPass').focus();
}
function doLogin(){
  const idx=window._selectedLoginIdx;
  if(idx<0){document.getElementById('loginError').textContent='Select a user first';return;}
  const pass=document.getElementById('loginPass').value;
  const u=window._loginUsers[idx];
  if(u.role==='owner'&&pass!==(window._adminPass||'hmdx')){document.getElementById('loginError').textContent='Wrong password';return;}
  if(u.role!=='owner'&&pass!==u.pass){document.getElementById('loginError').textContent='Wrong password';return;}
  store.currentUser={name:u.name,role:u.role,id:u.id||'admin'};
  persist();
  closeModal('loginModal');
  updateBadge();
  logActivity('user',u.name+' ('+u.role.charAt(0).toUpperCase()+u.role.slice(1)+') logged in');
  toast('Welcome, '+u.name+'!');
  nav('home');
}
function logoutUser(){
  var userName=store.currentUser?store.currentUser.name:'User';
  document.getElementById('logoutMsg').textContent='Are you sure you want to logout '+userName+'?';
  document.getElementById('logoutConfirmBtn').onclick=function(){
    closeModal('logoutModal');
    var isBranch=store.currentUser&&store.currentUser.role==='branch';
    if(isBranch){
      store.currentUser=null;store=defaults();localStorage.removeItem(KEY);
      document.getElementById('fbAuthModal').style.display='block';
      var b=document.getElementById('branchAuthModal');if(b)b.style.display='none';
    }else if(window.fbLogout){
      window.fbLogout();
    }else{
      store.currentUser=null;persist();
    }
  };
  showModal('logoutModal');
}
function confirmLogout(){}

/* ============ PAYMENT MODE BREAKDOWN ============ */
function showPaymentBreakdown(){
  const fromEl=document.getElementById('pmFrom');
  const toEl=document.getElementById('pmTo');
  if(!fromEl.value){
    fromEl.value='2020-01-01';
    toEl.value='2099-12-31';
  }
  renderPaymentBreakdown();
  showModal('paymentModal');
}
function renderPaymentBreakdown(){
  const fromDate=document.getElementById('pmFrom').value;
  const toDate=document.getElementById('pmTo').value;
  const fromParts=fromDate.split('-');
  const toParts=toDate.split('-');
  const from=new Date(+fromParts[0],+fromParts[1]-1,+fromParts[2]);
  const to=new Date(+toParts[0],+toParts[1]-1,+toParts[2]);
  to.setHours(23,59,59,999);
  const payments=(store.payments||[]).filter(p=>{
    if(p.dir!=='in')return false;
    const pd=parsePmDate(p.date);
    if(!pd)return false;
    return pd>=from&&pd<=to;
  });
  const modes={};
  payments.forEach(p=>{
    const m=p.mode||'Cash';
    if(!modes[m])modes[m]={total:0,count:0};
    modes[m].total+=p.amount||0;
    modes[m].count++;
  });
  const cards=[
    {key:'Cash',label:'Cash',icon:'\uD83D\uDCB5',cls:'paym-card-cash'},
    {key:'Bank Transfer',label:'Bank Transfer',icon:'\uD83C\uDFE6',cls:'paym-card-bank'},
    {key:'QR Code',label:'QR Code',icon:'\uD83D\uDCF1',cls:'paym-card-qr'},
    {key:'Card Payment',label:'Card Payment',icon:'\uD83D\uDCC4',cls:'paym-card-cheque'}
  ];
  const container=document.getElementById('pmCards');
  container.innerHTML=cards.map(c=>{
    const d=modes[c.key]||{total:0,count:0};
    return '<div class="paym-card '+c.cls+'">'+
      '<div class="paym-card-icon">'+c.icon+'</div>'+
      '<div class="paym-card-label">'+c.label+'</div>'+
      '<div class="paym-card-value">'+rs(d.total)+'</div>'+
      '<div class="paym-card-count">'+d.count+' payment'+(d.count!==1?'s':'')+'</div>'+
    '</div>';
  }).join('');
  const grandTotal=Object.values(modes).reduce((a,m)=>a+m.total,0);
  const totalPayments=Object.values(modes).reduce((a,m)=>a+m.count,0);
  document.getElementById('pmTotalRow').innerHTML=
    '<span class="paym-total-label">Total Collection ('+totalPayments+' payments)</span>'+
    '<span class="paym-total-val">'+rs(grandTotal)+'</span>';
}
function parsePmDate(dateStr){
  if(!dateStr)return null;
  const parts=dateStr.split(/[\s/-]/);
  if(parts.length<3)return null;
  const day=parseInt(parts[0]),month=parseInt(parts[1])-1,year=parseInt(parts[2]);
  if(isNaN(day)||isNaN(month)||isNaN(year))return null;
  return new Date(year,month,day);
}
function showProfitView(){
  const profitDiv=document.getElementById('pmProfitView');
  const cardsDiv=document.getElementById('pmCards');
  const totalRow=document.getElementById('pmTotalRow');
  const btn=document.querySelector('.paym-profit-btn');
  const isProfitView=profitDiv.style.display!=='none';
  if(isProfitView){
    profitDiv.style.display='none';
    cardsDiv.style.display='';
    totalRow.style.display='';
    btn.textContent='💰 See Profits';
    btn.classList.remove('active');
    return;
  }
  const fromDate=document.getElementById('pmFrom').value;
  const toDate=document.getElementById('pmTo').value;
  const fromParts=fromDate.split('-');
  const toParts=toDate.split('-');
  const from=new Date(+fromParts[0],+fromParts[1]-1,+fromParts[2]);
  const to=new Date(+toParts[0],+toParts[1]-1,+toParts[2]);
  to.setHours(23,59,59,999);
  const sales=(store.sales||[]).filter(s=>{
    if(s.refunded)return false;
    const pd=parsePmDate(s.date);
    if(!pd)return false;
    return pd>=from&&pd<=to;
  });
  let totalRevenue=0;
  let totalCost=0;
  sales.forEach(s=>{
    totalRevenue+=s.total||0;
    (s.rows||[]).forEach(r=>{
      const item=store.items.find(x=>x.name===r.item);
      const purchasePrice=item?(item.pprice||0):0;
      totalCost+=purchasePrice*(r.qty||0);
    });
  });
  const profit=totalRevenue-totalCost;
  const margin=totalRevenue>0?((profit/totalRevenue)*100).toFixed(1):0;
  document.getElementById('pmProfitCards').innerHTML=
    '<div class="paym-pcard paym-pcard-revenue">'+
      '<div class="paym-pcard-icon">\uD83D\uDCB0</div>'+
      '<div class="paym-pcard-label">Total Revenue</div>'+
      '<div class="paym-pcard-val">'+rs(totalRevenue)+'</div>'+
    '</div>'+
    '<div class="paym-pcard paym-pcard-cost">'+
      '<div class="paym-pcard-icon">\uD83D\uDED2</div>'+
      '<div class="paym-pcard-label">Total Cost</div>'+
      '<div class="paym-pcard-val">'+rs(totalCost)+'</div>'+
    '</div>'+
    '<div class="paym-pcard paym-pcard-profit">'+
      '<div class="paym-pcard-icon">\uD83D\uDCB5</div>'+
      '<div class="paym-pcard-label">Net Profit</div>'+
      '<div class="paym-pcard-val">'+rs(profit)+'</div>'+
    '</div>';
  const barColor=profit>=0?'#27ae60':'#e74c3c';
  const barWidth=Math.min(Math.abs(margin),100);
  document.getElementById('pmProfitSummary').innerHTML=
    '<div class="paym-profit-row"><span>Total Sales</span><span>'+sales.length+' invoices</span></div>'+
    '<div class="paym-profit-row"><span>Revenue</span><span>'+rs(totalRevenue)+'</span></div>'+
    '<div class="paym-profit-row"><span>Cost of Goods</span><span>'+rs(totalCost)+'</span></div>'+
    '<div class="paym-profit-row total"><span>Net Profit</span><span style="color:'+barColor+'">'+rs(profit)+'</span></div>'+
    '<div class="paym-profit-margin">'+
      '<span style="font-size:12px;color:#888">Profit Margin</span>'+
      '<div class="paym-profit-bar"><div class="paym-profit-bar-fill" style="width:'+barWidth+'%;background:'+barColor+'"></div></div>'+
      '<span class="paym-profit-pct" style="color:'+barColor+'">'+margin+'%</span>'+
    '</div>';
  profitDiv.style.display='';
  cardsDiv.style.display='none';
  totalRow.style.display='none';
  btn.textContent='📊 See Payments';
  btn.classList.add('active');
}

/* ============ BRANCH MANAGEMENT ============ */

// Generate random 6-digit branch code
function generateBranchCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Check if branch code exists - check branchLookup and owner's branches
async function checkBranchCodeExists(code) {
  try {
    // Check branchLookup first (fast document read)
    const lookupDoc = await window.fbDB.collection('branchLookup').doc(code).get();
    if (lookupDoc.exists) return true;
    
    // Also check owner's own branches
    const ownerUid = window.fbAuth.currentUser.uid;
    const branchId = 'branch_' + code;
    const branchDoc = await window.fbDB.collection('branches').doc(branchId).get();
    if (branchDoc.exists && branchDoc.data().ownerUid === ownerUid) return true;
    
    return false;
  } catch (e) {
    console.error('Error checking branch code:', e.message);
    // On error, assume not exists (safe to try this code)
    return false;
  }
}

// Generate unique branch code (global uniqueness across ALL accounts)
async function generateUniqueBranchCode() {
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    const code = generateBranchCode();
    const exists = await checkBranchCodeExists(code);
    
    if (!exists) {
      return code;
    }
    
    attempts++;
    await new Promise(r => setTimeout(r, 100));
  }
  
  throw new Error('Could not generate unique code after ' + maxAttempts + ' attempts. Try again.');
}

// Save new branch (no password - code only login)
async function saveBranch() {
  const name = (document.getElementById('brName').value || '').trim();
  const phone = (document.getElementById('brPhone').value || '').trim();
  const address = (document.getElementById('brAddress').value || '').trim();
  const errEl = document.getElementById('brError');

  // Validation
  if (!name) { errEl.textContent = 'Branch name is required'; return; }
  if (!phone) { errEl.textContent = 'Phone number is required'; return; }

  // Disable save button
  const saveBtn = document.querySelector('#addBranchModal .btn-red');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Creating...'; }

  errEl.textContent = 'Generating unique branch code...';

  try {
    // Generate unique 6-digit code
    const branchCode = await generateUniqueBranchCode();
    const ownerUid = window.fbAuth.currentUser.uid;
    const branchId = 'branch_' + branchCode;

    // Save branch data to Firestore
    await window.fbDB.collection('branches').doc(branchId).set({
      branchCode: branchCode,
      name: name,
      phone: phone,
      address: address,
      ownerUid: ownerUid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });

    // Save to branchLookup for login (public read)
    await window.fbDB.collection('branchLookup').doc(branchCode).set({
      branchId: branchId,
      ownerUid: ownerUid,
      branchName: name,
      phone: phone,
      address: address,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Try to save to globalBranchCodes (optional - for global uniqueness)
    try {
      await window.fbDB.collection('globalBranchCodes').doc(branchCode).set({
        branchId: branchId,
        ownerUid: ownerUid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (globalErr) {
      console.warn('Could not save to globalBranchCodes:', globalErr.message);
      // Continue - this is optional
    }

    // Add to owner's memberUids so branch can read owner's data
    await window.fbDB.collection('users').doc(ownerUid).update({
      memberUids: firebase.firestore.FieldValue.arrayUnion(branchId)
    });

    errEl.textContent = '';
    closeModal('addBranchModal');
    
    // Show proper success screen
    showBranchSuccess(name, branchCode, phone, address);
    updateBadge();
    
    logActivity('branch', 'Created branch: ' + name + ' (' + branchCode + ')');

  } catch (e) {
    errEl.textContent = 'Error: ' + (e.message || e.code);
    console.error('saveBranch error', e);
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Branch'; }
  }
}

// Show Add Branch modal
function showAddBranchModal() {
  document.getElementById('brName').value = '';
  document.getElementById('brPhone').value = '';
  document.getElementById('brAddress').value = '';
  document.getElementById('brError').textContent = '';
  showModal('addBranchModal');
}

// Show All Branches full screen
async function showAllBranchesModal() {
  showModal('allBranchesModal');
  await renderAllBranches();
}

// Show Branch Created success screen
function showBranchSuccess(name, code, phone, address) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const container = document.getElementById('branchSuccessContent');
  container.innerHTML = `
    <div style="text-align:center;padding:16px 0 12px">
      <h2 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#222">✅ Branch Created!</h2>
      <p style="margin:0;color:#888;font-size:13px">Share the code with your branch</p>
    </div>
    
    <div style="background:#f8f9fa;border-radius:12px;padding:14px;margin:0 0 12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-weight:700;font-size:15px;color:#222">${name}</div>
        <span style="background:#e8f5e9;color:#2e7d32;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">Active</span>
      </div>
      ${phone ? `<div style="font-size:13px;color:#555;margin-bottom:4px">📞 ${phone}</div>` : ''}
      ${address ? `<div style="font-size:13px;color:#555;margin-bottom:4px">📍 ${address}</div>` : ''}
      <div style="font-size:12px;color:#888">${dateStr} · ${timeStr}</div>
    </div>
    
    <div style="background:linear-gradient(135deg,#1a73e8,#4285f4);border-radius:12px;padding:16px;text-align:center;margin:0 0 12px">
      <div style="font-size:10px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Login Code</div>
      <div style="font-size:34px;font-weight:800;color:#fff;letter-spacing:5px;font-family:monospace">${code}</div>
    </div>
    
    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:10px 12px;display:flex;gap:8px;align-items:center;margin:0 0 14px">
      <span style="font-size:16px">⚠️</span>
      <div style="font-size:12px;color:#856404"><b>Save this code!</b> You won't see it again.</div>
    </div>
    
    <button onclick="copyBranchCode('${code}')" style="width:100%;padding:12px;background:#f8f9fa;border:1px solid var(--line);border-radius:10px;font-size:14px;font-weight:600;color:#333;cursor:pointer;margin-bottom:8px">
      📋 Copy Code
    </button>
    
    <button onclick="closeModal('branchSuccessModal')" style="width:100%;padding:12px;background:#1a73e8;border:none;border-radius:10px;font-size:14px;font-weight:600;color:#fff;cursor:pointer">
      Done
    </button>
  `;
  showModal('branchSuccessModal');
}

// Copy branch code to clipboard
function copyBranchCode(code) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      toast('Code copied: ' + code);
    });
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast('Code copied: ' + code);
  }
}

// Render all branches list (desktop table view)
async function renderAllBranches() {
  const tbody = document.getElementById('allBranchesList');
  const emptyState = document.getElementById('branchesEmpty');
  const table = document.getElementById('allBranchesTable');
  const countEl = document.getElementById('branchCount');
  
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;padding:40px">Loading branches...</td></tr>';
  table.style.display = 'none';
  emptyState.style.display = 'none';

  try {
    const ownerUid = window.fbAuth.currentUser.uid;
    const snapshot = await window.fbDB.collection('branches')
      .where('ownerUid', '==', ownerUid)
      .get();

    if (snapshot.empty) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
      if (countEl) countEl.textContent = '0 branches';
      return;
    }

    if (countEl) countEl.textContent = snapshot.size + ' branch' + (snapshot.size > 1 ? 'es' : '');
    
    let html = '';
    let index = 1;
    
    snapshot.forEach(doc => {
      const branch = doc.data();
      
      // Format date/time
      let createdStr = '-';
      let timeStr = '';
      if (branch.createdAt) {
        const date = branch.createdAt.toDate ? branch.createdAt.toDate() : new Date(branch.createdAt);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        createdStr = date.toLocaleDateString('en-US', options);
        timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      
      html += `
        <tr>
          <td style="color:#999;font-weight:500">${index}</td>
          <td>
            <div style="font-weight:600;color:#222;font-size:14px">${branch.name}</div>
          </td>
          <td>
            <span class="branch-code-badge">${branch.branchCode}</span>
          </td>
          <td style="color:#555">${branch.phone || '-'}</td>
          <td style="color:#555;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${branch.address || '-'}</td>
          <td>
            <div class="branch-date">
              ${createdStr}
              <small>${timeStr}</small>
            </div>
          </td>
          <td>
            <span class="branch-status ${branch.status === 'active' ? 'active' : 'inactive'}">
              ${branch.status === 'active' ? '● Active' : '● Inactive'}
            </span>
          </td>
          <td style="display:flex;gap:6px">
            <button onclick="copyBranchCode('${branch.branchCode}')" class="branch-action-btn">
              📋 Copy
            </button>
            <button onclick="deleteBranch('${branch.branchCode}','${branch.name}')" class="branch-action-btn" style="background:#fff0f0;color:#e74c3c;border:1px solid #fdd">
              🗑 Delete
            </button>
          </td>
        </tr>`;
      index++;
    });

    tbody.innerHTML = html;
    table.style.display = 'table';
    emptyState.style.display = 'none';

  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--red);padding:40px">Error loading branches</td></tr>';
    table.style.display = 'table';
    console.error('renderAllBranches error', e);
  }
}

// Delete a branch
function deleteBranch(branchCode, branchName) {
  document.getElementById('deleteBranchMsg').textContent = 'Are you sure you want to delete "' + branchName + '"?';
  document.getElementById('deleteBranchCode').textContent = 'Branch code: ' + branchCode + ' — This action cannot be undone.';
  document.getElementById('deleteBranchConfirmBtn').onclick = function() {
    closeModal('deleteBranchModal');
    doDeleteBranch(branchCode, branchName);
  };
  showModal('deleteBranchModal');
}
async function doDeleteBranch(branchCode, branchName) {
  const ownerUid = window.fbAuth.currentUser.uid;
  const branchId = 'branch_' + branchCode;

  try {
    // 1) Delete from branches collection
    await window.fbDB.collection('branches').doc(branchId).delete();

    // 2) Delete from branchLookup
    await window.fbDB.collection('branchLookup').doc(branchCode).delete();

    // 3) Try to delete from globalBranchCodes
    try { await window.fbDB.collection('globalBranchCodes').doc(branchCode).delete(); } catch(e){}

    // 4) Remove branchId from owner's memberUids
    await window.fbDB.collection('users').doc(ownerUid).update({
      memberUids: firebase.firestore.FieldValue.arrayRemove(branchId)
    });

    toast('Branch deleted successfully');
    logActivity('branch', 'Deleted branch: ' + branchName + ' (' + branchCode + ')');
    await renderAllBranches();
  } catch (e) {
    toast('Delete failed: ' + (e.message || e.code));
    console.error('deleteBranch error', e);
  }
}

// Branch Login - Show dedicated screen
function branchLoginPrompt() {
  document.getElementById('fbAuthModal').style.display='none';
  document.getElementById('branchAuthModal').style.display='block';
  document.getElementById('branchCodeInput').value='';
  document.getElementById('branchAuthError').textContent='';
  setTimeout(()=>{document.getElementById('branchCodeInput').focus();},100);
}
function showMainLogin() {
  document.getElementById('branchAuthModal').style.display='none';
  document.getElementById('fbAuthModal').style.display='block';
}
function fbBranchDoLogin() {
  var code=(document.getElementById('branchCodeInput').value||'').trim();
  var errEl=document.getElementById('branchAuthError');
  if(!code){errEl.textContent='Enter branch code';return;}
  if(code.length!==6){errEl.textContent='Code must be 6 digits';return;}
  errEl.textContent='Logging in...';
  errEl.style.color='#888';
  window.fbBranchLogin(code,function(m){
    errEl.textContent=m;
    errEl.style.color='#e74c3c';
  });
}

/* ============ FIREBASE CLOUD SYNC ============ */
(function(){
  var fbUser = null;          // current firebase user
  var unsub = null;           // onSnapshot unsubscribe
  var applyingRemote = false; // guard: don't push while applying remote data
  var pushTimer = null;       // debounce timer
  var lastPushedJSON = '';    // last payload we wrote (echo guard)
  var fbMode = 'login';       // 'login' | 'signup'
  var loginKind = 'owner';    // 'owner' (email/Google) | 'staff' (user-id)
  var cloudReady = false;     // true only AFTER this user's own cloud data is loaded
  var dataUid = null;         // the store doc we read/write (owner uid; = authUid for owners, ownerUid for staff)
  var isStaffSession = false; // true when the logged-in user is a staff member of someone else's store
  var STAFF_DOMAIN = '@staff.karobar.app'; // synthetic email domain for staff user-id logins

  function $(id){ return document.getElementById(id); }
  // Cloud payload = the whole store EXCEPT per-device fields (currentUser is local only).
  function cloudJSON(){ var c = {}; for(var k in store){ if(k!=='currentUser') c[k]=store[k]; } return JSON.stringify(c); }
  // A genuinely empty store for a brand-new owner: no demo company/shared/phone/users/items.
  function freshOwnerStore(){
    var d = defaults();
    d.companies = [{ id: 'c1', name: '', sync: true, current: true }];
    d.sharedCompanies = [];
    if(d.account) d.account.phone = '';
    d.users = [];
    return d;
  }
  function setStatus(t){ var e=$('fbSyncStatus'); if(e) e.textContent=t; }
  function setErr(t){ var e=$('fbAuthError'); if(e) e.textContent=t||''; }

  function showAuthModal(){ var m=$('fbAuthModal'); if(m) m.style.display='block'; }
  function hideAuthModal(){ var m=$('fbAuthModal'); if(m) m.style.display='none'; var b=document.getElementById('branchAuthModal'); if(b) b.style.display='none'; }

  // ---- Real-time push to Firestore (debounced) ----
  window.cloudPush = function(){
    if(!fbUser || applyingRemote || !cloudReady) return; // never push before this user's data is loaded
    var uidAtSchedule = fbUser.uid;                      // lock the auth account NOW
    var docAtSchedule = dataUid;                         // lock the store doc NOW
    if(pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(function(){
      // Abort if the account/store changed (logout / switch) between schedule and fire
      if(!fbUser || fbUser.uid !== uidAtSchedule || dataUid !== docAtSchedule || !cloudReady) return;
      var json = cloudJSON();
      lastPushedJSON = json;
      setStatus('Saving…');
      // merge:true so we never clobber the memberUids field on the store doc
      window.fbDB.collection('users').doc(docAtSchedule).set({
        data: json,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).then(function(){
        setStatus('☁️ Saved · ' + new Date().toLocaleTimeString());
      }).catch(function(e){
        setStatus('⚠️ Save failed: ' + e.code);
        console.error('cloudPush error', e);
      });
    }, 700);
  };

  // ---- Apply remote data into local store ----
  function applyRemote(json){
    try{
      applyingRemote = true;
      var keepUser = store.currentUser;          // currentUser is per-device, keep it
      store = JSON.parse(json);
      store.currentUser = keepUser;
      if(typeof ensure==='function') ensure();
      localStorage.setItem(KEY, JSON.stringify(store)); // local cache, no cloud echo
      updateBadge();
      if(typeof refreshAll==='function') refreshAll();
    }catch(e){ console.error('applyRemote error', e); }
    finally{ applyingRemote = false; }
  }

  // ---- Load THIS user's data from cloud, then start live sync ----
  // Strict isolation: data comes ONLY from this user's own cloud doc.
  // A brand-new user starts with a fresh empty store (never the previous user's data).
  function loadUserData(authUid){
    cloudReady = false;            // block all pushes until we have the right store's data
    if(pushTimer){ clearTimeout(pushTimer); pushTimer = null; }  // drop any previous pending write
    if(unsub){ unsub(); unsub = null; }
    setStatus('Loading your data…');
    
    // 0) Am I a branch? Check branchMap first.
    window.fbDB.collection('branchMap').doc(authUid).get().then(function(branchSnap){
      var isBranchSession = false;
      var branchData = null;
      var ownerUid = authUid;
      
      if (branchSnap.exists && branchSnap.data() && branchSnap.data().ownerUid) {
        isBranchSession = true;
        branchData = branchSnap.data();
        ownerUid = branchSnap.data().ownerUid;
      }
      
      // 1) Am I a staff member of someone else's store? Check the mapping.
      return window.fbDB.collection('staffMap').doc(authUid).get().then(function(mapSnap){
        if (!isBranchSession) {
          ownerUid = (mapSnap.exists && mapSnap.data() && mapSnap.data().ownerUid) ? mapSnap.data().ownerUid : authUid;
          isStaffSession = (ownerUid !== authUid);
        } else {
          isStaffSession = false;
        }
        dataUid = ownerUid;                           // <-- read/write the OWNER's store doc
        // 2) Load that store's data.
        return window.fbDB.collection('users').doc(dataUid).get().then(function(snap){
          var hasData = snap.exists && snap.data() && snap.data().data;
          applyingRemote = true;
          if(hasData){
            store = JSON.parse(snap.data().data);     // owner's store (shared by all members)
          }else if(isStaffSession || isBranchSession){
            throw { code: 'owner-store-missing' };     // staff/branch but owner has no data -> abort safely
          }else{
            store = freshOwnerStore();                 // brand-new owner -> truly empty
          }
          if(typeof ensure==='function') ensure();
          // Cloud login IS the identity now -> set currentUser locally and skip the old
          // "select your account" password screen entirely.
          if(isBranchSession){
            store.currentUser = {
              name: branchData.branchName || 'Branch',
              role: 'branch',
              id: 'branch',
              branchCode: branchData.branchCode
            };
          }else if(isStaffSession){
            var me = (store.users||[]).filter(function(u){return u.staffUid===authUid;})[0];
            if(!me){
              // Staff user was deleted from store.users - sign them out
              window.fbAuth.signOut();
              throw { code: 'user-deleted', message: 'Your account has been removed. Contact admin.' };
            }
            store.currentUser = {name:me.name, role:me.role, id:me.id};
          }else{
            var oname = (fbUser && (fbUser.displayName || fbUser.email)) || 'Owner';
            store.currentUser = {name: oname, role:'owner', id:'admin'};
          }
        localStorage.setItem(KEY, JSON.stringify(store));
        lastPushedJSON = cloudJSON();
        applyingRemote = false;
        cloudReady = true;                           // pushes allowed now
        try{ closeModal('loginModal'); closeModal('passcodeModal'); }catch(e){}
        var badge=document.getElementById('currentUserBadge');
        if(badge) badge.textContent = store.currentUser.name + ' (' + (store.currentUser.role.charAt(0).toUpperCase()+store.currentUser.role.slice(1)) + ')';
        if(typeof refreshAll==='function') refreshAll();
        if(typeof nav==='function'){ try{ nav('home'); }catch(e){} }
        if(!hasData && !isStaffSession){
          // create the owner's store doc with an empty members list
          window.fbDB.collection('users').doc(dataUid).set({
            data: lastPushedJSON,
            memberUids: [],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true }).catch(function(e){ console.error('create store doc error', e); });
        }
        startSnapshot(dataUid);
        hideAuthModal();                             // data ready -> reveal the app
        setStatus((isBranchSession ? '☁️ Branch connected · ' : isStaffSession ? '☁️ Joined store · ' : '☁️ Ready · ') + new Date().toLocaleTimeString());
      });
    });
    }).catch(function(e){
      // No data loaded -> never fall back to in-memory data (could be another store's!)
      cloudReady = false; dataUid = null; isStaffSession = false;
      console.error('loadUserData error', e);
      var errMsg = 'Please check your internet connection and try again.';
      if(e.code === 'user-deleted') errMsg = 'Your account has been removed. Contact admin.';
      else if(e.code === 'owner-store-missing') errMsg = 'Store data not found. Contact admin.';
      else errMsg = 'Data failed to load (' + (e.code||e.message) + '). ' + errMsg;
      setErr(errMsg);
      window.fbAuth.signOut();
    });
  }

  // ---- Live listener for remote changes (other devices, same account) ----
  function startSnapshot(uid){
    if(unsub){ unsub(); unsub = null; }
    var ref = window.fbDB.collection('users').doc(uid);
    unsub = ref.onSnapshot(function(snap){
      if(!cloudReady) return;
      if(snap.metadata.hasPendingWrites) return;     // our own pending write
      if(!snap.exists) return;
      var d = snap.data();
      var json = d && d.data;
      if(!json) return;
      if(json === lastPushedJSON) return;            // echo of our own write
      if(json === cloudJSON()) return;               // already in sync
      applyRemote(json);
      setStatus('☁️ Synced · ' + new Date().toLocaleTimeString());
    }, function(err){
      setStatus('⚠️ Sync error: ' + err.code);
      console.error('onSnapshot error', err);
    });
  }

  // ---- Manual / periodic one-shot refresh from the cloud ----
  window.cloudRefresh = function(manual){
    if(!cloudReady || !dataUid || !window.fbDB){ if(manual) toast('Please login first.'); return; }
    var btn = document.getElementById('tbRefresh');
    if(manual && btn){ btn.style.transition='transform .6s ease'; btn.style.transform='rotate(360deg)'; setTimeout(function(){ btn.style.transition=''; btn.style.transform=''; }, 600); }
    window.fbDB.collection('users').doc(dataUid).get().then(function(snap){
      if(!cloudReady) return;
      var json = snap.exists && snap.data() && snap.data().data;
      if(!json) return;
      if(json === lastPushedJSON || json === cloudJSON()){ if(manual) toast('Already up to date'); return; }
      applyRemote(json);
      setStatus('☁️ Refreshed · ' + new Date().toLocaleTimeString());
      if(manual) toast('Data refreshed');
    }).catch(function(e){ if(manual) toast('Refresh failed: ' + (e.code||e.message)); });
  };

  // ---- Auth UI handlers (global) ----
  window.fbToggleMode = function(){
    fbMode = (fbMode==='login') ? 'signup' : 'login';
    $('fbLoginBtn').textContent = (fbMode==='login') ? 'Login' : 'Create Account';
    $('fbToggleBtn').textContent = (fbMode==='login') ? 'New here? Create an account' : 'Already have an account? Login';
    $('fbAuthSub').textContent = (fbMode==='login') ? 'Login to sync your data across devices' : 'Create an account to back up your data';
    setErr('');
  };

  window.loginKindIsStaff = function(){ return loginKind === 'staff'; };
  // Toggle the gate between store-owner login and staff (user-id) login
  window.fbSwitchKind = function(kind){
    loginKind = kind;
    var staff = (kind==='staff');
    var lblEmail = document.querySelector('#fbAuthModal label[for-field="email"]');
    if($('fbEmail')) $('fbEmail').placeholder = staff ? 'User ID' : 'you@example.com';
    if($('fbEmail')) $('fbEmail').type = staff ? 'text' : 'email';
    var emLbl = $('fbEmailLabel'); if(emLbl) emLbl.textContent = staff ? 'User ID' : 'Email';
    $('fbAuthSub') && ($('fbAuthSub').textContent = staff ? 'Employee login — enter your User ID' : 'Login to sync your data across devices');
    // hide owner-only options in staff mode
    ['fbToggleBtn','fbGoogleBtn','fbForgotWrap','fbOrWrap'].forEach(function(idd){ var e=$(idd); if(e) e.style.display = staff ? 'none' : ''; });
    var sw=$('fbKindToggle'); if(sw) sw.textContent = staff ? '← Store owner login (Email/Google)' : 'Employee? Login with User ID';
    setErr('');
  };

  window.fbDoLogin = function(){
    if(loginKind==='staff'){
      var uid = ($('fbEmail').value||'').trim();
      var p2 = $('fbPass').value||'';
      setErr(''); $('fbLoginBtn').disabled = true;
      window.fbStaffLogin(uid, p2, function(m){ setErr(m); });
      setTimeout(function(){ if($('fbLoginBtn')) $('fbLoginBtn').disabled = false; }, 1500);
      return;
    }
    var email = ($('fbEmail').value||'').trim();
    var pass = $('fbPass').value||'';
    if(!email || !pass){ setErr('Please enter both email and password.'); return; }
    setErr(''); $('fbLoginBtn').disabled = true;
    var p = (fbMode==='signup')
      ? window.fbAuth.createUserWithEmailAndPassword(email, pass)
      : window.fbAuth.signInWithEmailAndPassword(email, pass);
    p.catch(function(e){
      var msg = e.code;
      if(e.code==='auth/invalid-credential'||e.code==='auth/wrong-password') msg='Invalid email or password.';
      else if(e.code==='auth/email-already-in-use') msg='This email is already registered. Please login instead.';
      else if(e.code==='auth/weak-password') msg='Password must be at least 6 characters long.';
      else if(e.code==='auth/invalid-email') msg='Please enter a valid email address.';
      else if(e.code==='auth/network-request-failed') msg='Please check your internet connection and try again.';
      setErr(msg);
    }).finally(function(){ $('fbLoginBtn').disabled = false; });
  };

  window.fbGoogleLogin = function(){
    setErr('Opening Google login...');
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    window.fbAuth.signInWithPopup(provider).then(function(){
      setErr('');
    }).catch(function(e){
      // Popup blocked / failed -> fall back to full-page redirect (always works)
      if(e.code==='auth/popup-blocked' || e.code==='auth/popup-closed-by-user' || e.code==='auth/cancelled-popup-request' || e.code==='auth/operation-not-supported-in-this-environment'){
        setErr('Redirecting to Google...');
        window.fbAuth.signInWithRedirect(provider).catch(function(e2){ setErr(gErr(e2)); });
        return;
      }
      setErr(gErr(e));
    });
  };
  function gErr(e){
    if(e.code==='auth/network-request-failed') return 'Please check your internet connection and try again.';
    if(e.code==='auth/unauthorized-domain') return 'Please add this domain in Firebase Console > Authentication > Settings > Authorized domains.';
    if(e.code==='auth/account-exists-with-different-credential') return 'This email is already registered via a different sign-in method.';
    return e.code || e.message;
  }

  // ---- Secondary Firebase app (creates staff accounts WITHOUT logging the owner out) ----
  function secondaryAuth(){
    var s;
    try { s = firebase.app('staffWorker'); }
    catch(e){ s = firebase.initializeApp(firebaseConfig, 'staffWorker'); }
    return s.auth();
  }

  // ---- Owner creates a linked staff account, mapped to this store ----
  // Returns Promise<staffUid>. Must be called while an OWNER is logged in.
  window.createStaffAccount = function(username, pass){
    if(!fbUser || isStaffSession || dataUid !== fbUser.uid){
      return Promise.reject({ code: 'not-owner', message: 'Only the store owner can create new users.' });
    }
    var ownerUid = fbUser.uid;
    var uname = (username||'').toLowerCase().trim();
    var email = uname + STAFF_DOMAIN;
    var sec = secondaryAuth();
    return sec.createUserWithEmailAndPassword(email, pass).then(function(cred){
      var staffUid = cred.user.uid;
      // Owner (primary auth) writes the mapping + adds staff to the members list.
      return window.fbDB.collection('staffMap').doc(staffUid).set({ ownerUid: ownerUid, username: uname })
        .then(function(){
          return window.fbDB.collection('users').doc(ownerUid).set({
            memberUids: firebase.firestore.FieldValue.arrayUnion(staffUid)
          }, { merge: true });
        })
        .then(function(){ return sec.signOut().catch(function(){}); })
        .then(function(){ return staffUid; });
    });
  };

  // ---- Staff logs in with their user-id + password (resolves to the owner's store) ----
  window.fbStaffLogin = function(username, pass, onErr){
    var uname = (username||'').toLowerCase().trim();
    if(!uname || !pass){ if(onErr) onErr('Please enter both User ID and password.'); return; }
    var email = uname + STAFF_DOMAIN;
    window.fbAuth.signInWithEmailAndPassword(email, pass).catch(function(e){
      var msg = e.code;
      if(e.code==='auth/invalid-credential'||e.code==='auth/wrong-password'||e.code==='auth/user-not-found') msg='Invalid User ID or password.';
      else if(e.code==='auth/network-request-failed') msg='Please check your internet connection and try again.';
      if(onErr) onErr(msg); else setErr(msg);
    });
  };

  // ---- Branch logs in with code only (no password) ----
  window.fbBranchLogin = function(branchCode, onErr) {
    var code = (branchCode || '').trim();
    
    if (!code) {
      if (onErr) onErr('Branch code required');
      return;
    }

    // Find branch using branchLookup collection (public read, no auth needed)
    window.fbDB.collection('branchLookup').doc(code).get()
      .then(function(doc) {
        if (!doc.exists) {
          if (onErr) onErr('Invalid branch code');
          return;
        }

        var lookupData = doc.data();
        var ownerUid = lookupData.ownerUid;
        var branchName = lookupData.branchName;
        var branchPhone = lookupData.phone || '';
        var branchAddress = lookupData.address || '';

        if (!ownerUid) {
          if (onErr) onErr('Branch configuration error');
          return;
        }

        // Load owner's data
        window.fbDB.collection('users').doc(ownerUid).get().then(function(ownerSnap) {
          if (!ownerSnap.exists || !ownerSnap.data().data) {
            if (onErr) onErr('Owner data not found');
            return;
          }

          // Apply owner's data to local store
          var jsonData = ownerSnap.data().data;
          applyingRemote = true;
          store = JSON.parse(jsonData);
          store.currentUser = {
            name: branchName,
            role: 'branch',
            id: 'branch',
            branchCode: code,
            branchPhone: branchPhone,
            branchAddress: branchAddress,
            ownerUid: ownerUid
          };
          if (typeof ensure === 'function') ensure();
          localStorage.setItem(KEY, JSON.stringify(store));
          lastPushedJSON = cloudJSON();
          applyingRemote = false;
          cloudReady = true;
          dataUid = ownerUid;
          
          // Update memberUids if not already there
          var memberUids = ownerSnap.data().memberUids || [];
          var branchId = 'branch_' + code;
          if (!memberUids.includes(branchId)) {
            window.fbDB.collection('users').doc(ownerUid).update({
              memberUids: firebase.firestore.FieldValue.arrayUnion(branchId)
            });
          }

          // Close modals and navigate
          try { closeModal('formModal'); closeModal('companyModal'); document.getElementById('branchAuthModal').style.display='none'; document.getElementById('fbAuthModal').style.display='none'; } catch(e) {}
          var badge = document.getElementById('currentUserBadge');
          if (badge) badge.textContent = branchName + ' (Branch)';
          if (typeof refreshAll === 'function') refreshAll();
          if (typeof nav === 'function') { try { nav('home'); } catch(e) {} }
          hideAuthModal();
          setStatus('☁️ Branch connected · ' + new Date().toLocaleTimeString());
          
          // Start live sync for owner's data
          startSnapshot(ownerUid);
          
        }).catch(function(e) {
          if (onErr) onErr('Error loading data: ' + e.message);
        });
      })
      .catch(function(e) {
        if (onErr) onErr('Error: ' + e.message);
      });
  };

  window.fbResetPass = function(){
    var email = ($('fbEmail').value||'').trim();
    if(!email){ setErr('Please enter your email first, then click Forgot password.'); return; }
    window.fbAuth.sendPasswordResetEmail(email).then(function(){
      setErr(''); alert('Password reset link has been sent to your email: '+email);
    }).catch(function(e){ setErr(e.code); });
  };

  window.fbLogout = function(){
    if(window.fbAuth) window.fbAuth.signOut();
  };

  // ---- React to auth state ----
  function init(){
    if(!window.fbAuth){ console.warn('Firebase not loaded'); return; }
    showAuthModal();
    // Surface any error that happened during a Google redirect sign-in
    window.fbAuth.getRedirectResult().catch(function(e){ if(e&&e.code) setErr(gErr(e)); });
    // Auto-refresh from the cloud every 5s (belt-and-suspenders on top of the live listener)
    if(!window.__cloudPoll){ window.__cloudPoll = setInterval(function(){ if(cloudReady) window.cloudRefresh(false); }, 5000); }
    window.fbAuth.onAuthStateChanged(function(user){
      if(user){
        fbUser = user;
        // keep the cover screen up; only hide AFTER this user's data has loaded
        $('fbAuthSub') && ( $('fbAuthSub').textContent = 'Loading your data…' );
        var box=$('fbAccountBox'); if(box){ box.style.display='flex'; $('fbAccountEmail').textContent = user.email || 'Cloud account'; }
        loadUserData(user.uid);   // load ONLY this user's data, then hides cover
      }else{
        // Signed out -> stop sync AND wipe local data so the next user can't see it
        fbUser = null;
        cloudReady = false;
        dataUid = null;
        isStaffSession = false;
        if(unsub){ unsub(); unsub = null; }
        if(pushTimer){ clearTimeout(pushTimer); pushTimer = null; }
        lastPushedJSON = '';
        applyingRemote = true;
        store = defaults();
        localStorage.removeItem(KEY);
        applyingRemote = false;
        var box2=$('fbAccountBox'); if(box2) box2.style.display='none';
        showAuthModal();
      }
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
