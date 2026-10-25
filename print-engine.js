/* Shared, data-only invoice renderer. Used by settings, sale preview and printing. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KarobarPrint = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';
  const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, num(v)));
  const themes = {regular:['Tally Theme','Landscape Theme 1','Landscape Theme 2','Tax Theme 1'],thermal:['Theme 1','Theme 2','Theme 3','Theme 4','Theme 5']};
  const defaults = {
    theme:0, color:'#41445f', paper:'a4', orientation:'portrait', width:80, customChars:48,
    companySize:'large', textSize:'medium', repeatHeader:true, originalDuplicate:false, topSpace:0, minRows:0,
    printingType:'text', bold:true, autoCut:false, openDrawer:false, extraLines:0, copies:1,
    showName:true, showLogo:true, showAddress:true, showEmail:true, showPhone:true,
    sno:true, uom:true, mrp:true, description:true, batch:true, expiry:true, manufacturing:true, size:true, model:true, serial:true,
    hsn:true, itemDiscount:true, itemTax:true, totalQty:true, decimals:true, received:true, balance:true, partyBalance:false,
    taxDetails:true, savings:true, grouping:true, words:'indian', footerDescription:true, receivedBy:true,
    deliveredBy:true, signatureText:'Authorized Signatory', terms:true, signature:true, bank:true, qr:true, barcode:true, invoiceTitle:''
  };
  function options(settings = {}, mode = settings.printerTab || 'thermal') {
    const legacy = {showName:settings.showCoName!==false,showLogo:settings.showLogo!==false,showAddress:settings.showAddress!==false,
      showEmail:settings.showEmail!==false,showPhone:settings.showCoPhone!==false,qr:settings.showQR!==false,
      signature:settings.showSign!==false,terms:settings.showTerms!==false,bold:settings.textBold!==false,
      paper:settings.standardPageSize||'a4',width:({'2inch':58,'3inch':80,'4inch':104})[settings.pageSize]||80};
    const o = {...defaults,...legacy,mrp:mode==='thermal',barcode:mode==='regular',bank:mode==='regular',receivedBy:mode==='regular',deliveredBy:mode==='regular',footerDescription:mode==='regular',signature:mode==='regular'&&legacy.signature,words:mode==='regular'?'indian':'none',...(settings.printProfiles?.[mode]||{}),mode};
    if(o.theme===3&&mode==='regular'&&!settings.printProfiles?.[mode]?.color)o.color='#aaa4d7';
    o.theme = clamp(Math.floor(o.theme),0,mode==='thermal'?4:3);
    o.color = /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : defaults.color;
    o.width = clamp(o.width,40,112); o.copies=clamp(Math.floor(o.copies),1,10);
    o.extraLines=clamp(Math.floor(o.extraLines),0,30);o.minRows=clamp(Math.floor(o.minRows),0,100);
    o.topSpace=clamp(o.topSpace,0,50);o.customChars=clamp(Math.floor(o.customChars),24,80);
    if(!['a4','a5','letter'].includes(o.paper))o.paper='a4';
    if(!['portrait','landscape'].includes(o.orientation))o.orientation='portrait';
    return o;
  }
  function amounts(sale) {
    const rows=sale.rows||[];
    const subtotal=rows.reduce((sum,r)=>sum+num(r.qty)*num(r.price),0);
    const itemDiscount=rows.reduce((sum,r)=>sum+num(r.qty)*num(r.price)*clamp(r.disc,0,100)/100,0);
    const tax=num(sale.tax),charges=num(sale.charges ?? sale.additional),rounding=num(sale.rounding);
    // Old invoices did not retain bill discounts. Reconcile against their saved total, never invent tax.
    const billDiscount=sale.discount!=null ? num(sale.discount) : Math.max(0,subtotal-itemDiscount+tax+charges+rounding-num(sale.total));
    const adjustment=num(sale.total)-(subtotal-itemDiscount-billDiscount+tax+charges+rounding);
    return {subtotal,itemDiscount,billDiscount,tax,charges,rounding,adjustment,total:num(sale.total),received:num(sale.received),balance:num(sale.total)-num(sale.received),qty:rows.reduce((sum,r)=>sum+num(r.qty),0)};
  }
  function numberWords(value, system='indian') {
    const ones=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const whole=n=>{if(n<20)return ones[n];if(n<100)return tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'');if(n<1000)return whole(Math.floor(n/100))+' Hundred'+(n%100?' '+whole(n%100):'');
      const scales=system==='indian'?[[1e7,'Crore'],[1e5,'Lakh'],[1000,'Thousand']]:[[1e9,'Billion'],[1e6,'Million'],[1000,'Thousand']];
      for(const [size,label] of scales)if(n>=size)return whole(Math.floor(n/size))+' '+label+(n%size?' '+whole(n%size):'');};
    const cents=Math.round(Math.abs(num(value))*100),fraction=cents%100;
    return (num(value)<0?'Minus ':'')+whole(Math.floor(cents/100))+(fraction?' and '+whole(fraction)+' Paisa':'')+' only';
  }
  function render(sale, context) {
    const {business={},settings={},items=[],parties=[],qrData='',branchAddress=''}=context;
    const o=options(settings),a=amounts(sale),thermal=o.mode==='thermal';
    const money=v=>num(v).toLocaleString(o.words==='international'?'en-US':'en-IN',{useGrouping:o.grouping,minimumFractionDigits:o.decimals?2:0,maximumFractionDigits:o.decimals?2:0});
    const e=escape, b=business, rows=sale.rows||[], currency=e(settings.currency||'Rs');
    const image=(src,alt,cls)=>/^(data:image\/(png|jpeg|webp|gif);base64,|assets\/|https?:\/\/)/i.test(src||'')?`<img class="${cls}" src="${e(src)}" alt="${alt}">`:'';
    const header=`<div class="kp-company">${o.showLogo?(image(b.logo,'Business logo','kp-logo')||(context.sample&&!thermal?'<span class="kp-image-placeholder">Image</span>':'')):''}<div>${o.showName?`<h1>${e(b.name||'My Company')}</h1>`:''}${o.showAddress?`<div>${e(sale.branchAddress||branchAddress||b.address)}</div>`:''}${o.showPhone?`<div>Phone: ${e(sale.branchPhone||b.phone||'—')}</div>`:''}${o.showEmail&&b.email?`<div>${e(b.email)}</div>`:''}</div></div>`;
    const title=`<h2 class="kp-title">${e(o.invoiceTitle || (thermal?'Invoice':o.theme===3?'Sale':'Tax Invoice'))}</h2>`;
    const detail=`<div class="kp-details"><b>Invoice Details:</b><div>Invoice No.: ${e(sale.no)}</div><div>Date: ${e(sale.date)}</div>${sale.time?`<div>Time: ${e(sale.time)}</div>`:''}${sale.dueDate?`<div>Due Date: ${e(sale.dueDate)}</div>`:''}</div>`;
    const party=parties.find(p=>p.id===sale.partyId||p.name===sale.party)||{};
    const customer=`<div class="kp-customer"><b>Bill To:</b><div>${e(sale.party||'Cash Customer')}</div>${sale.phone?`<div>Contact No.: ${e(sale.phone)}</div>`:''}<div>${e(sale.partyAddress||party.address||'')}</div></div>`;
    const meta=thermal&&o.theme>=3?`${detail}${customer}`:`<div class="kp-meta">${customer}${detail}</div>`;
    const rowData=r=>({...items.find(it=>it.id===r.itemId||it.name===(r.item||r.name)),...r});
    const extras=r=>{
      const d=rowData(r),fields=[['batch','Batch No.',d.batch||d.batchNo],['expiry','Exp. Date',d.expiry||d.expDate],['manufacturing','Mfg. Date',d.manufacturing||d.mfgDate],['size','Size',d.size],['model','Model No.',d.model||d.modelNo],['serial','Serial No.',d.serial||d.serialNo]];
      return `${o.description&&d.desc?`<em>${e(d.desc)}</em>`:''}${fields.filter(([key,,value])=>o[key]&&value).map(([,label,value])=>`<span>${label}: ${e(value)}</span>`).join(' · ')}`;
    };
    const columns=[...(o.sno?[['#',(r,i)=>i+1]]:[]),['Item name',r=>e(r.item||r.name)],...(!thermal&&o.hsn?[['HSN/SAC',r=>e(rowData(r).hsn||'')]]:[]),['Quantity',r=>e(r.qty)+(o.uom?' '+e(rowData(r).unit||''):'')],...(o.mrp?[['MRP',r=>rowData(r).mrp?money(rowData(r).mrp):'—']]:[]),['Price/unit',r=>money(r.price)],...(!thermal&&o.itemDiscount?[['Discount',r=>`${money(num(r.qty)*num(r.price)*num(r.disc)/100)} (${num(r.disc)}%)`]]:[]),...(!thermal&&o.itemTax?[['Tax',r=>r.tax!=null?money(r.tax):'—']]:[]),['Amount',r=>money(num(r.qty)*num(r.price)*(1-clamp(r.disc,0,100)/100))]];
    let itemTable;
    if(thermal&&o.theme>=2){
      itemTable=`<div class="kp-stacked-head">${o.sno?'# &nbsp; ':''}Item Name<div>Qty${o.uom?' / Unit':''}<span>${o.mrp?'MRP · ':''}Price · Amount</span></div>${o.description?'<div>Description</div>':''}</div><div class="kp-stacked-items">${rows.map((r,i)=>`<section class="kp-stacked-item"><div>${o.sno?`${i+1} &nbsp; `:''}${e(r.item||r.name)}</div><div class="kp-item-numbers"><span>${e(r.qty)} ${o.uom?e(rowData(r).unit||''):''}</span>${o.mrp?`<span>${rowData(r).mrp?money(rowData(r).mrp):'—'}</span>`:''}<span>${money(r.price)}</span><span>${money(num(r.qty)*num(r.price)*(1-num(r.disc)/100))}</span></div><div class="kp-extra">${extras(r)}</div><div class="kp-final">Final amount <span>${money(num(r.qty)*num(r.price)*(1-num(r.disc)/100))}</span></div></section>`).join('')}</div>`;
    } else {
      itemTable=`<table class="kp-items"><thead><tr>${columns.map(([name])=>`<th>${name}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr>${columns.map(([,value])=>`<td>${value(r,i)}</td>`).join('')}</tr>${extras(r)?`<tr class="kp-extra-row"><td colspan="${columns.length}">${extras(r)}</td></tr>`:''}${thermal&&o.theme===0?`<tr><td colspan="${columns.length}" class="kp-final">Final amount <span>${money(num(r.qty)*num(r.price)*(1-num(r.disc)/100))}</span></td></tr>`:''}`).join('')}${!thermal?Array.from({length:Math.max(0,o.minRows-rows.length)},()=>`<tr class="kp-blank">${columns.map(()=>'<td>&nbsp;</td>').join('')}</tr>`).join(''):''}</tbody></table>`;
    }
    const line=(label,value,bold=false)=>`<div class="kp-total-row${bold?' kp-grand':''}"><span>${e(label)}</span><span>${money(value)}</span></div>`;
    const pct=a.billDiscount&&a.subtotal-a.itemDiscount>0?Math.round(a.billDiscount/(a.subtotal-a.itemDiscount)*10000)/100:0;
    const totals=`<div class="kp-totals">${line('Sub Total ('+(settings.currency||'Rs')+')',a.subtotal)}${a.itemDiscount?line('Item Discount',-a.itemDiscount):''}${a.billDiscount?line('Discount ('+pct+'%)',-a.billDiscount):''}${o.taxDetails&&a.tax?line('Tax'+(sale.taxRate?' ('+sale.taxRate+'%)':''),a.tax):''}${a.charges?line('Additional Charges',a.charges):''}${a.rounding?line('Round Off',a.rounding):''}${Math.abs(a.adjustment)>.005?line('Adjustment',a.adjustment):''}${line('Total',a.total,true)}${o.received?line('Received',a.received):''}${o.balance?line(a.balance<0?'Change / Return':'Balance',Math.abs(a.balance)):''}${o.partyBalance?line('Current Balance of Party',party.balance):''}${o.savings&&a.itemDiscount+a.billDiscount>0?line('You Saved',a.itemDiscount+a.billDiscount):''}</div>`;
    const taxGroups=Array.isArray(sale.taxBreakdown)&&sale.taxBreakdown.length?sale.taxBreakdown:[{hsn:'',taxable:a.subtotal-a.itemDiscount-a.billDiscount,tax:a.tax}];
    const taxSummary=!thermal&&o.taxDetails?`<div class="kp-tax-summary"><b>Tax Summary</b><table><thead><tr><th rowspan="2">HSN / SAC</th><th rowspan="2">Taxable amount (${currency})</th><th colspan="2">CGST</th><th colspan="2">SGST</th><th rowspan="2">Total Tax Amount</th></tr><tr><th>Rate (%)</th><th>Amount</th><th>Rate (%)</th><th>Amount</th></tr></thead><tbody>${taxGroups.map(g=>'<tr><td>'+e(g.hsn)+'</td><td>'+money(g.taxable)+'</td><td>'+(g.cgstRate!=null?e(g.cgstRate)+'%':'—')+'</td><td>'+(g.cgst!=null?money(g.cgst):'—')+'</td><td>'+(g.sgstRate!=null?e(g.sgstRate)+'%':'—')+'</td><td>'+(g.sgst!=null?money(g.sgst):'—')+'</td><td>'+money(g.tax??num(g.cgst)+num(g.sgst))+'</td></tr>').join('')}<tr><td>Total</td><td>${money(a.subtotal-a.itemDiscount-a.billDiscount)}</td><td colspan="4"></td><td>${money(a.tax)}</td></tr></tbody></table></div>`:'';

    const codes=`${o.barcode?`<div class="kp-barcode"><svg class="inv-barcode-svg" data-code="${e(sale.no)}"></svg><small>${e(sale.no)}</small></div>`:''}${o.qr&&qrData?`<div class="kp-qr">${image(qrData,'Receipt data QR','')}<small>Scan for receipt details</small></div>`:''}`;
    const bank=o.bank&&(b.bankName||b.bankAccount)?`<section class="kp-bank"><b>Bank Details:</b><div>${e(b.bankName)}</div><div>Account: ${e(b.bankAccount)}</div>${b.bankCode?`<div>Bank code: ${e(b.bankCode)}</div>`:''}</section>`:'';
    const footer=`<div class="kp-footer">${o.footerDescription&&sale.description?`<section><b>Description:</b><div>${e(sale.description)}</div></section>`:''}${o.terms?`<section class="kp-terms"><b>Terms &amp; Conditions</b><div>${e(settings.terms||'Thanks for doing business with us!')}</div></section>`:''}${!thermal&&o.theme===1?'':bank}${o.signature?`<section class="kp-sign"><b>For: ${e(b.name||'My Company')}</b>${image(b.signature,'Authorized signature','kp-signature')}<div>${e(o.signatureText)}</div></section>`:''}${o.receivedBy&&sale.createdByName?`<section class="kp-received-by">Received by: ${e(sale.createdByName)}</section>`:''}</div>`;
    const delivery=o.deliveredBy&&sale.deliveredByName?'<div class="kp-delivered-by">Delivered by: '+e(sale.deliveredByName)+'</div>':'';
    const ship=sale.shippingAddress?'<div class="kp-ship"><b>Ship To:</b><div>'+e(sale.shippingAddress)+'</div></div>':'';
    const amountWords=o.words!=='none'?'<div class="kp-words">Amount in Words: '+e(numberWords(a.total,o.words))+'</div>':'';
    let head=header+(thermal?title:'')+meta+ship;
    let bottom='<div class="kp-summary">'+taxSummary+totals+'</div>'+amountWords+footer+'<div class="kp-codes">'+codes+'</div>';
    let topTitle=!thermal?title:'';
    if(!thermal&&(o.theme===1||o.theme===2)){
      head='<div class="kp-land-header">'+header+detail+'</div><div class="kp-land-address">'+customer+ship+'</div>';
      if(o.theme===1)bottom='<div class="kp-horizontal-totals">'+totals+'</div>'+amountWords+'<div class="kp-land-tax">'+taxSummary+'<div>'+bank+'<div class="kp-codes">'+codes+'</div></div></div>'+footer;
    }
    if(!thermal&&o.theme===3){
      head=header+title+'<div class="kp-tax-meta">'+customer+ship+detail+'</div>';topTitle='';
      const notes='<div class="kp-tax-notes">'+(o.footerDescription&&sale.description?'<b>Description</b><p>'+e(sale.description)+'</p>':'')+amountWords+(sale.dueDate?'<p>Due Date: '+e(sale.dueDate)+'</p>':'')+(o.terms?'<b>TERMS AND CONDITIONS</b><p>'+e(settings.terms||'Thanks for doing business with us!')+'</p>':'')+'</div>';
      bottom='<div class="kp-tax-body">'+notes+totals+'</div><div class="kp-tax-foot"><div><div class="kp-codes">'+codes+'</div>'+bank+'</div>'+(o.signature?'<div class="kp-sign">For: '+e(b.name||'My Company')+image(b.signature,'Authorized signature','kp-signature')+'<div>'+e(o.signatureText)+'</div></div>':'')+'</div>'+(o.receivedBy&&sale.createdByName?'<div class="kp-received-by">Received by: '+e(sale.createdByName)+'</div>':'');
    }
    return `<article class="kp-invoice print-invoice ${thermal?'kp-thermal receipt-paper-'+o.width:'kp-regular standard-paper-'+o.paper} kp-theme-${o.theme} kp-${o.orientation} kp-text-${o.textSize} kp-name-${o.companySize}${o.bold?' kp-bold':''}${o.repeatHeader?' kp-repeat':''}" style="--kp-accent:${o.color};--kp-width:${o.width}mm;--kp-top:${o.topSpace}mm;--kp-chars:${o.customChars}${thermal&&o.customWidth?';font-size:'+Math.max(7,Math.min(15,(o.width-8)*3.78/o.customChars/0.6))+'px':''}">${o.originalDuplicate?'<div class="kp-copy-label">ORIGINAL / DUPLICATE</div>':''}${topTitle}<table class="kp-page"><thead><tr><td>${head}</td></tr></thead><tbody><tr><td>${itemTable}${o.totalQty?'<div class="kp-quantity">Total Quantity: '+e(a.qty)+(thermal&&o.theme===4?'<span class="kp-item-count">Items: '+rows.length+'</span>':'')+'</div>':''}${bottom}${delivery}${thermal&&sale.dueDate?'<div class="kp-due">Payment due: '+e(sale.dueDate)+'</div>':''}${thermal&&o.extraLines?'<div style="height:'+o.extraLines*4+'mm" aria-hidden="true"></div>':''}</td></tr></tbody></table></article>`;

  }
  function sample() {
    return {no:'INV-101',date:new Date().toLocaleDateString('en-GB'),time:'12:30 PM',party:'Classic Enterprises',phone:'0300 1234567',partyAddress:'Plot No. 1, Shop No. 8, Main Market',shippingAddress:'Main Market, Bahawalpur',dueDate:'30/10/2026',createdByName:'Owner',deliveredByName:'Delivery staff',description:'Sale description',rows:[
      {item:'Britannia Chocolate Cake',qty:100,price:100,mrp:100,unit:'Box',desc:'Britannia chocolate cake description',batch:'N1234',model:'A12345',expiry:'20/10/2027',manufacturing:'25/10/2026',size:'Med/32',serial:'SN101',hsn:'1234'},
      {item:'Cadbury Chocolate',qty:50,price:150,mrp:150,unit:'Pack',desc:'Cadbury cake description',hsn:'6325'}],discount:500,tax:850,total:17850,received:18000,taxBreakdown:[{hsn:'1234 / 6325',taxable:17000,cgstRate:2.5,cgst:425,sgstRate:2.5,sgst:425,tax:850}]};
  }
  return {escape,options,amounts,numberWords,render,sample,themes,defaults};
});
