/* ============================================================
   KAROBAR — Printing
   One place that decides HOW something is printed:
     • Thermal receipts (58 / 80 / 104 mm or custom) — graphical or
       text (ESC/POS) mode, 4 real layouts, logo, barcode, QR,
       bold, extra feed lines, auto cut and cash drawer.
     • Regular (A4 / A5 / Letter) invoices and reports.
     • Barcode labels on A4 sheets or on a label (roll) printer.
   In the desktop app every job goes silently to the printer chosen
   in Settings → Print and the printer's live status is shown with a
   green / red light. In a web browser the normal print dialog is used.
   Uses globals from app.js at call time: store, toast, words, nav,
   printCSS, buildInvoiceHTML.
   ============================================================ */

/* ---------- small helpers ---------- */
function kbDesk(){ const d=window.karobarDesktop; return d&&typeof d.printHTML==='function'?d:null; }
function kbEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function kbSet(){ return (window.store&&store.settings)||{}; }
function kbToast(m){ if(typeof toast==='function')toast(m); }
function kbClamp(v,a,b){ v=+v; if(!isFinite(v))v=a; return Math.min(b,Math.max(a,v)); }

/* ---------- which physical printer is used for what (per computer) ----------
   Printer names differ from PC to PC, so they are kept in this computer's
   localStorage — not in the cloud-synced settings. */
const KB_DEV_KEY='karobar_printer_devices';
function kbDevCfg(){ try{ return JSON.parse(localStorage.getItem(KB_DEV_KEY)||'{}')||{}; }catch(e){ return {}; } }
function kbDev(kind){ return kbDevCfg()[kind]||''; }
function kbSetDev(kind,name){
  const c=kbDevCfg(); c[kind]=name||'';
  try{ localStorage.setItem(KB_DEV_KEY,JSON.stringify(c)); }catch(e){}
  kbRenderPrinterStatus(); kbFillDeviceSelects();
  kbToast(name?('"'+name+'" set as '+kbKindLabel(kind)+' printer'):'Printer cleared');
}
function kbKindLabel(k){ return k==='thermal'?'thermal':k==='label'?'label':'regular'; }
// The printer that bills/receipts go to right now.
function kbBillKind(){ return kbSet().thermalDefault!==false?'thermal':'regular'; }

/* ---------- thermal paper ---------- */
const KB_PAPER={
  '2inch':{paper:58,print:48,chars:32},
  '3inch':{paper:80,print:72,chars:48},
  '4inch':{paper:104,print:96,chars:64}
};
function kbPaper(){
  const s=kbSet();
  if(s.pageSize==='custom'){
    const paper=kbClamp(s.customPaperMm||80,40,120);
    return {paper, print:Math.max(30,paper-8), chars:kbClamp(s.customChars||48,20,80)|0};
  }
  return KB_PAPER[s.pageSize]||KB_PAPER['3inch'];
}
const KB_REG_PAPER={A4:'A4',A5:'A5',Letter:'Letter',Legal:'Legal'};
function kbRegPaper(){ return KB_REG_PAPER[kbSet().regularPaper]||'A4'; }

/* ---------- amounts ---------- */
function kbNum(n){
  const s=kbSet(), dec=s.tAmountDec!==false?2:0, v=Number(n||0);
  return s.tGrouping!==false?v.toLocaleString('en-IN',{minimumFractionDigits:dec,maximumFractionDigits:dec}):v.toFixed(dec);
}
function kbMoney(n){ return (kbSet().currency||'Rs')+' '+kbNum(n); }
function kbUnitShort(u){
  if(!u||/^none$/i.test(u))return '';
  const m=String(u).match(/\(([^)]+)\)/); return m?m[1]:String(u);
}

/* ---------- normalised bill used by every receipt layout ---------- */
function kbReceiptModel(s){
  const b=store.business||{}, st=kbSet();
  const rows=(s.rows&&s.rows.length)?s.rows:[{item:'Sale',qty:1,price:+s.total||0}];
  const lines=rows.filter(r=>r&&(r.item||r.qty)).map(r=>{
    const it=(store.items||[]).find(x=>x.name===r.item)||null;
    const qty=+r.qty||0, price=+r.price||0, disc=+r.disc||0;
    const base=it?(+it.price||0):0, mrp=base>price?base:price;
    const gross=qty*price, discAmt=gross*disc/100;
    return {name:r.item||'Item', code:(it&&it.code)||'', unit:kbUnitShort(it&&it.unit), size:r.size||'', desc:(it&&it.desc)||'',
      qty, price, disc, discAmt, amt:gross-discAmt, mrp, saved:(mrp-price)*qty+discAmt};
  });
  const sub=lines.reduce((a,l)=>a+l.qty*l.price,0);
  const lineDisc=lines.reduce((a,l)=>a+l.discAmt,0);
  const tax=+s.tax||0, total=+s.total||0;
  const diff=total-(sub-lineDisc+tax);
  const billDisc=diff<-0.004?-diff:0, charges=diff>0.004?diff:0;
  const received=+s.received||0;
  const party=(store.parties||[]).find(p=>p.name===s.party);
  let date=s.date||'';
  if(s.time&&date.indexOf(':')<0)date+=' '+s.time;
  return {
    biz:{name:b.name||'My Company', address:b.address||'', phone:s.branchPhone||b.phone||'', email:b.email||'', logo:b.logo||''},
    title:st.receiptTitle||'Invoice', no:s.no||'', date, party:s.party||'', partyPhone:s.phone||'', mode:s.mode||s._posMode||'',
    lines, sub, discount:lineDisc+billDisc, tax, charges, total, received, balance:total-received,
    partyBal:party?(+party.balance||0):null, totalQty:lines.reduce((a,l)=>a+l.qty,0),
    saved:lines.reduce((a,l)=>a+l.saved,0)+billDisc, refunded:!!s.refunded
  };
}
function kbWordsLine(total){
  if((kbSet().tWords||'english')==='none'||typeof words!=='function')return '';
  return words(total)+' Rupees only';
}
function kbPhoneDigits(p){ return String(p||'').replace(/[^0-9+]/g,''); }

/* ---------- barcode / QR rendered locally (works offline) ---------- */
function kbBarcodeSVG(code,o){
  if(!window.JsBarcode||!code)return '';
  try{
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    JsBarcode(svg,String(code),Object.assign({format:'CODE128',width:1.5,height:40,displayValue:true,margin:0,fontSize:12,background:'#ffffff',lineColor:'#000000'},o||{}));
    return svg.outerHTML;
  }catch(e){ return ''; }
}
function kbQRDataURL(text,size){
  if(!window.QRCode||!text)return '';
  try{
    const d=document.createElement('div');
    new QRCode(d,{text:String(text),width:size||120,height:size||120,correctLevel:QRCode.CorrectLevel.M});
    const c=d.querySelector('canvas'); if(c)return c.toDataURL('image/png');
    const im=d.querySelector('img'); return im?im.src:'';
  }catch(e){ return ''; }
}

/* ============================================================
   THERMAL RECEIPT — graphical (HTML) mode, 4 layouts
   2 = Compact, 3 = Classic table, 4 = Bold header, 5 = Detailed
   ============================================================ */
const KB_THEMES={2:'Compact',3:'Classic Table',4:'Bold Header',5:'Detailed'};
function kbTheme(){ const t=+kbSet().printTheme; return KB_THEMES[t]?t:5; }

function kbThermalHTML(sale,opt){
  opt=opt||{};
  const st=kbSet(), P=kbPaper(), m=kbReceiptModel(sale), th=kbTheme();
  const bold=st.textBold!==false, B=bold?'800':'400', fs=P.print<=50?11:P.print>=90?13:12;
  const small=P.print<=50;
  const sno=st.tSno!==false, unit=st.tUom!==false, showMrp=st.tMrp!==false, showSize=!!st.tSize, showCode=!!st.tCode, showDesc=st.tDesc!==false;
  const e=kbEsc;
  let h='';
  // ---- header ----
  const nameHtml=st.showCoName!==false?`<div class="nm">${e(m.biz.name)}</div>`:'';
  if(st.showLogo!==false&&m.biz.logo)h+=`<div class="c"><img class="logo" src="${m.biz.logo}"></div>`;
  h+=th===4?`<div class="inv-bar">${nameHtml||'&nbsp;'}</div>`:`<div class="c">${nameHtml}</div>`;
  h+='<div class="c">';
  if(st.showAddress&&m.biz.address)h+=`<div>${e(m.biz.address)}</div>`;
  if(st.showCoPhone!==false&&m.biz.phone)h+=`<div>Ph: ${e(m.biz.phone)}</div>`;
  if(st.showEmail!==false&&m.biz.email)h+=`<div>${e(m.biz.email)}</div>`;
  h+='</div><div class="hr"></div>';
  h+=`<div class="c b ttl">${th===4?'*** ':''}${e(m.title)}${m.refunded?' (REFUNDED)':''}${th===4?' ***':''}</div>`;
  h+=`<div class="row"><span>No: <b class="b">${e(m.no)}</b></span><span>${e(m.date)}</span></div>`;
  if(m.party)h+=`<div>Customer: <span class="b">${e(m.party)}</span>${m.partyPhone?' &middot; '+e(m.partyPhone):''}</div>`;
  h+='<div class="hr"></div>';
  // ---- items ----
  const extra=l=>{
    const bits=[];
    if(showSize&&l.size)bits.push('Size: '+e(l.size));
    if(showCode&&l.code)bits.push('Code: '+e(l.code));
    if(showDesc&&l.desc)bits.push(e(l.desc));
    return bits.length?`<div class="sm">${bits.join(' &middot; ')}</div>`:'';
  };
  const qtyTxt=l=>kbNum0(l.qty)+(unit&&l.unit?' '+e(l.unit):'');
  if(th===2){
    m.lines.forEach((l,i)=>{
      h+=`<div class="it"><div class="row"><span class="b">${sno?(i+1)+'. ':''}${e(l.name)}</span><span class="b">${kbNum(l.amt)}</span></div>`;
      h+=`<div class="sm">${qtyTxt(l)} x ${kbNum(l.price)}${l.disc?` (-${l.disc}%)`:''}${showMrp&&l.mrp>l.price?` &middot; MRP ${kbNum(l.mrp)}`:''}</div>${extra(l)}</div>`;
    });
  }else{
    const mrpCol=th===5&&showMrp&&!small;
    h+=`<table class="items"><thead><tr>${sno?'<th class="sn">#</th>':''}<th>Item</th><th class="r">Qty</th>${mrpCol?'<th class="r">MRP</th>':''}<th class="r">Rate</th><th class="r">Amt</th></tr></thead><tbody>`;
    m.lines.forEach((l,i)=>{
      const sub=[];
      if(th===5&&l.disc)sub.push('Disc '+l.disc+'%');
      if(showMrp&&!mrpCol&&l.mrp>l.price)sub.push('MRP '+kbNum(l.mrp));
      h+=`<tr>${sno?`<td class="sn">${i+1}</td>`:''}<td><span class="b">${e(l.name)}</span>${sub.length?`<div class="sm">${sub.join(' &middot; ')}</div>`:''}${extra(l)}</td><td class="r">${qtyTxt(l)}</td>${mrpCol?`<td class="r">${kbNum(l.mrp)}</td>`:''}<td class="r">${kbNum(l.price)}</td><td class="r">${kbNum(l.amt)}</td></tr>`;
    });
    h+='</tbody></table>';
  }
  h+='<div class="hr"></div>';
  // ---- totals ----
  const tr=(a,b,cls)=>`<div class="row ${cls||''}"><span>${a}</span><span>${b}</span></div>`;
  if(st.tTotalQty!==false)h+=tr('Items: '+m.lines.length,'Qty: '+kbNum0(m.totalQty));
  h+=tr('Sub Total',kbNum(m.sub));
  if(m.discount>0.004)h+=tr('Discount','-'+kbNum(m.discount));
  if(m.tax>0.004&&st.tTaxDetails)h+=tr('Tax',kbNum(m.tax));
  const otherTax=m.charges+(st.tTaxDetails?0:m.tax);
  if(otherTax>0.004)h+=tr('Tax / Charges',kbNum(otherTax));
  h+=tr('TOTAL',kbMoney(m.total),th===4?'grand inv-bar':'grand');
  if(st.tReceived!==false)h+=tr('Received'+(m.mode?' ('+e(m.mode)+')':''),kbNum(m.received));
  if(st.tBalance!==false)h+=m.balance<-0.004?tr('Change Return',kbNum(-m.balance)):tr('Balance Due',kbNum(m.balance),'b');
  if(st.tPartyBal&&m.partyBal!==null)h+=tr('Party Balance',kbNum(m.partyBal));
  if(st.tYouSaved!==false&&m.saved>0.004)h+=`<div class="c b saved">You Saved ${kbMoney(m.saved)}</div>`;
  const w=kbWordsLine(m.total); if(w)h+=`<div class="sm" style="margin-top:3px">${e(w)}</div>`;
  // ---- codes + footer ----
  if(st.tBarcode!==false&&m.no){ const svg=kbBarcodeSVG(m.no,{width:small?1.2:1.5,height:small?32:40,fontSize:small?10:12}); if(svg)h+=`<div class="c code">${svg}</div>`; }
  if(st.tQR&&m.biz.phone){ const q=kbQRDataURL('tel:'+kbPhoneDigits(m.biz.phone),160); if(q)h+=`<div class="c code"><img class="qr" src="${q}"><div class="sm">Scan to call: ${e(m.biz.phone)}</div></div>`; }
  if(st.tTerms!==false&&(st.terms||'').trim())h+=`<div class="hr"></div><div class="c b">Terms &amp; Conditions</div><div class="c sm">${e(st.terms)}</div>`;
  const feed=kbClamp(st.extraLines||0,0,20)*4;
  const css=`
  @page{margin:0}
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  html,body{margin:0;padding:0;background:#fff}
  body{width:${P.print}mm;margin:0 auto;padding:1mm 0 ${2+feed}mm;color:#000;font-family:Arial,'Segoe UI',Tahoma,sans-serif;font-size:${fs}px;line-height:1.3;font-weight:${bold?'600':'400'}}
  .c{text-align:center}.r{text-align:right}.b,b{font-weight:${B}}
  .nm{font-size:${fs+(small?4:6)}px;font-weight:${bold?'900':'700'};line-height:1.15;margin:1px 0}
  .ttl{font-size:${fs+2}px;margin:1px 0}
  .hr{border-top:1px dashed #000;margin:4px 0}
  .row{display:flex;justify-content:space-between;gap:6px}
  .row span:last-child{text-align:right;white-space:nowrap}
  .sm{font-size:${fs-1}px}
  .it{margin:2px 0}
  table.items{width:100%;border-collapse:collapse}
  table.items th{font-weight:${B};text-align:left;border-bottom:1px dashed #000;padding:1px 1px;font-size:${fs-1}px}
  table.items td{padding:2px 1px;vertical-align:top}
  table.items .r{text-align:right;white-space:nowrap}
  table.items .sn{width:4mm}
  .grand{font-size:${fs+3}px;font-weight:${bold?'900':'700'};border-top:1px solid #000;border-bottom:1px solid #000;padding:2px 0;margin:2px 0}
  .inv-bar{background:#000;color:#fff;padding:2px 3px;text-align:center}
  .inv-bar .nm{color:#fff}
  .saved{margin:3px 0;border:1px dashed #000;padding:2px}
  .code{margin-top:4px}.code svg{max-width:100%;height:auto}
  img.logo{max-width:${Math.min(P.print-6,48)}mm;max-height:20mm;margin-bottom:2px}
  img.qr{width:${small?22:26}mm;height:${small?22:26}mm}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${kbEsc(m.title+' '+m.no)}</title><style>${css}</style></head><body>${h}</body></html>`;
}
function kbNum0(n){ n=+n||0; return Number.isInteger(n)?String(n):n.toFixed(2).replace(/0+$/,'').replace(/\.$/,''); }

/* ============================================================
   THERMAL RECEIPT — text (ESC/POS) mode
   Fastest and sharpest; supports logo, barcode, QR, bold, cut,
   drawer. Only plain English characters can be printed.
   ============================================================ */
function kbPad(s,w,a){ s=String(s); if(s.length>w)s=s.slice(0,w); const n=w-s.length; return a==='r'?' '.repeat(n)+s:a==='c'?' '.repeat(n>>1)+s+' '.repeat(n-(n>>1)):s+' '.repeat(n); }
function kbWrap(s,w){
  s=String(s||''); const out=[]; let cur='';
  s.split(/\s+/).forEach(word=>{
    while(word.length>w){ if(cur){out.push(cur);cur='';} out.push(word.slice(0,w)); word=word.slice(w); }
    if(!word)return;
    if(!cur)cur=word; else if(cur.length+1+word.length<=w)cur+=' '+word; else {out.push(cur);cur=word;}
  });
  if(cur)out.push(cur);
  return out.length?out:[''];
}
function kbLR(l,r,N){ l=String(l); r=String(r); if(l.length+r.length+1<=N)return [l+' '.repeat(N-l.length-r.length)+r]; return kbWrap(l,N).concat([kbPad(r,N,'r')]); }

function kbReceiptLines(sale){
  const st=kbSet(), P=kbPaper(), N=P.chars, m=kbReceiptModel(sale), th=kbTheme();
  const bold=st.textBold!==false;
  const L=[]; const add=(t,o)=>L.push(Object.assign({t:String(t)},o||{}));
  const sep=ch=>add((ch||'-').repeat(N));
  const sno=st.tSno!==false, unit=st.tUom!==false, showMrp=st.tMrp!==false;
  // header
  if(st.showLogo!==false&&m.biz.logo)L.push({logo:m.biz.logo});
  if(st.showCoName!==false){
    const dbl=m.biz.name.length<=Math.floor(N/2);
    kbWrap(m.biz.name,dbl?Math.floor(N/2):N).forEach(x=>add(x,{a:'c',b:bold,d:dbl}));
  }
  if(st.showAddress&&m.biz.address)kbWrap(m.biz.address,N).forEach(x=>add(x,{a:'c'}));
  if(st.showCoPhone!==false&&m.biz.phone)add('Ph: '+m.biz.phone,{a:'c'});
  if(st.showEmail!==false&&m.biz.email)add(m.biz.email,{a:'c'});
  sep(th===4?'=':'-');
  add((th===4?'*** ':'')+m.title.toUpperCase()+(m.refunded?' (REFUNDED)':'')+(th===4?' ***':''),{a:'c',b:bold});
  kbLR('No: '+m.no,m.date,N).forEach(x=>add(x));
  if(m.party)kbWrap('Customer: '+m.party+(m.partyPhone?' ('+m.partyPhone+')':''),N).forEach(x=>add(x));
  sep();
  const extras=l=>{
    const bits=[];
    if(st.tSize&&l.size)bits.push('Size: '+l.size);
    if(st.tCode&&l.code)bits.push('Code: '+l.code);
    if(st.tDesc!==false&&l.desc)bits.push(l.desc);
    return bits;
  };
  const q=l=>kbNum0(l.qty)+(unit&&l.unit?' '+l.unit:'');
  if(th===2||N<42){
    // name on its own line, numbers below
    m.lines.forEach((l,i)=>{
      kbLR((sno?(i+1)+'. ':'')+l.name,th===2?kbNum(l.amt):'',N).forEach((x,k)=>add(x,{b:bold&&k===0}));
      const det='  '+q(l)+' x '+kbNum(l.price)+(l.disc?' -'+l.disc+'%':'');
      if(th===2)add(det+(showMrp&&l.mrp>l.price?' MRP '+kbNum(l.mrp):''));
      else kbLR(det,kbNum(l.amt),N).forEach(x=>add(x));
      if(th!==2&&showMrp&&l.mrp>l.price)add('  MRP '+kbNum(l.mrp));
      extras(l).forEach(b=>kbWrap(b,N-2).forEach(x=>add('  '+x)));
    });
  }else{
    const mrpCol=th===5&&showMrp, sW=sno?3:0, qW=7, rW=9, aW=10, mW=mrpCol?9:0;
    const nW=N-sW-qW-rW-aW-mW;
    add(kbPad(sno?'#':'',sW)+kbPad('Item',nW)+kbPad('Qty',qW,'r')+(mrpCol?kbPad('MRP',mW,'r'):'')+kbPad('Rate',rW,'r')+kbPad('Amount',aW,'r'),{b:bold});
    sep();
    m.lines.forEach((l,i)=>{
      const nm=kbWrap(l.name,nW-1);
      add(kbPad(sno?String(i+1):'',sW)+kbPad(nm[0],nW)+kbPad(q(l),qW,'r')+(mrpCol?kbPad(kbNum(l.mrp),mW,'r'):'')+kbPad(kbNum(l.price),rW,'r')+kbPad(kbNum(l.amt),aW,'r'));
      nm.slice(1).forEach(x=>add(' '.repeat(sW)+x));
      const sub=[]; if(l.disc)sub.push('Disc '+l.disc+'%'); if(showMrp&&!mrpCol&&l.mrp>l.price)sub.push('MRP '+kbNum(l.mrp));
      sub.concat(extras(l)).forEach(b=>kbWrap(b,N-sW-2).forEach(x=>add(' '.repeat(sW)+'  '+x)));
    });
  }
  sep();
  const lr=(a,b,o)=>kbLR(a,b,N).forEach(x=>add(x,o));
  if(st.tTotalQty!==false)lr('Items: '+m.lines.length,'Qty: '+kbNum0(m.totalQty));
  lr('Sub Total',kbNum(m.sub));
  if(m.discount>0.004)lr('Discount','-'+kbNum(m.discount));
  if(m.tax>0.004&&st.tTaxDetails)lr('Tax',kbNum(m.tax));
  const otherTax=m.charges+(st.tTaxDetails?0:m.tax);
  if(otherTax>0.004)lr('Tax / Charges',kbNum(otherTax));
  sep(th===4?'=':'-');
  lr('TOTAL',kbMoney(m.total),{b:bold});
  sep(th===4?'=':'-');
  if(st.tReceived!==false)lr('Received'+(m.mode?' ('+m.mode+')':''),kbNum(m.received));
  if(st.tBalance!==false){ if(m.balance<-0.004)lr('Change Return',kbNum(-m.balance)); else lr('Balance Due',kbNum(m.balance),{b:bold}); }
  if(st.tPartyBal&&m.partyBal!==null)lr('Party Balance',kbNum(m.partyBal));
  if(st.tYouSaved!==false&&m.saved>0.004)add('You Saved '+kbMoney(m.saved),{a:'c',b:bold});
  const w=kbWordsLine(m.total); if(w)kbWrap(w,N).forEach(x=>add(x));
  if(st.tBarcode!==false&&m.no)L.push({barcode:m.no});
  if(st.tQR&&m.biz.phone){ L.push({qr:'tel:'+kbPhoneDigits(m.biz.phone)}); add('Scan to call: '+m.biz.phone,{a:'c'}); }
  if(st.tTerms!==false&&(st.terms||'').trim()){ sep(); add('Terms & Conditions',{a:'c',b:bold}); kbWrap(st.terms,N).forEach(x=>add(x,{a:'c'})); }
  return L;
}
// Plain-text preview of the text-mode receipt (what the printer will print).
function kbReceiptTextPreview(sale){
  const N=kbPaper().chars;
  return kbReceiptLines(sale).map(l=>{
    if(l.logo)return '<div style="text-align:center;opacity:.7">[ logo ]</div>';
    if(l.barcode)return '<div style="text-align:center">|||| '+kbEsc(l.barcode)+' ||||</div>';
    if(l.qr)return '<div style="text-align:center">[ QR code ]</div>';
    let t=l.t; if(l.a==='c')t=kbPad(t,l.d?Math.floor(N/2):N,'c'); else if(l.a==='r')t=kbPad(t,N,'r');
    return '<div style="white-space:pre;'+(l.b?'font-weight:800;':'')+(l.d?'font-size:1.6em;line-height:1.1;':'')+'">'+kbEsc(t||' ')+'</div>';
  }).join('');
}

/* ---- ESC/POS encoder ---- */
function kbAsciiBytes(s){ const o=[]; for(const ch of String(s)){ const c=ch.charCodeAt(0); o.push(c>=32&&c<127?c:(ch==='₨'?82:63)); } return o; }
function kbLoadImage(src){ return new Promise(res=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=src; }); }
async function kbRasterLogo(src,maxDots){
  const img=await kbLoadImage(src); if(!img||!img.width)return null;
  let w=Math.min(maxDots,img.width), h=Math.round(img.height*w/img.width);
  if(h>200){ h=200; w=Math.round(img.width*h/img.height); }
  w=Math.max(8,w);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,w,h); g.drawImage(img,0,0,w,h);
  const px=g.getImageData(0,0,w,h).data, bw=Math.ceil(w/8), out=[0x1D,0x76,0x30,0x00,bw&255,bw>>8,h&255,h>>8];
  for(let y=0;y<h;y++)for(let xb=0;xb<bw;xb++){
    let byte=0;
    for(let bit=0;bit<8;bit++){ const x=xb*8+bit; if(x>=w)continue; const i=(y*w+x)*4; const lum=0.299*px[i]+0.587*px[i+1]+0.114*px[i+2]; if(lum<128)byte|=(0x80>>bit); }
    out.push(byte);
  }
  return out;
}
function kbEscBarcode(code,dots){
  const data=kbAsciiBytes('{B'+code), modules=(String(code).length+3)*11+13;
  const w=modules*2<=dots?2:1;
  return [0x1D,0x68,60, 0x1D,0x77,w, 0x1D,0x48,2, 0x1D,0x66,0, 0x1D,0x6B,73,data.length].concat(data,[0x0A]);
}
function kbEscQR(text){
  const d=kbAsciiBytes(text), len=d.length+3;
  return [0x1D,0x28,0x6B,4,0,49,65,50,0, 0x1D,0x28,0x6B,3,0,49,67,6, 0x1D,0x28,0x6B,3,0,49,69,49,
    0x1D,0x28,0x6B,len&255,len>>8,49,80,48].concat(d,[0x1D,0x28,0x6B,3,0,49,81,48,0x0A]);
}
// Feed / drawer / cut — appended to every thermal job.
function kbEscTail(o){
  const out=[];
  if(o.feed>0)out.push(0x1B,0x64,Math.min(255,o.feed));
  if(o.drawer)out.push(0x1B,0x70,0x00,0x19,0xFA);
  if(o.cut)out.push(0x1D,0x56,0x42,0x00);
  return out;
}
async function kbThermalBytes(sale){
  const st=kbSet(), P=kbPaper(), dots=Math.round(P.print*8);
  const out=[0x1B,0x40,0x1B,0x74,0x00];
  for(const l of kbReceiptLines(sale)){
    if(l.logo){ const r=await kbRasterLogo(l.logo,Math.round(dots*0.6)); if(r)out.push(0x1B,0x61,1,...r,0x0A,0x1B,0x61,0); continue; }
    if(l.barcode){ out.push(0x1B,0x61,1,...kbEscBarcode(l.barcode,dots),0x1B,0x61,0); continue; }
    if(l.qr){ out.push(0x1B,0x61,1,...kbEscQR(l.qr),0x1B,0x61,0); continue; }
    out.push(0x1B,0x61,l.a==='c'?1:l.a==='r'?2:0, 0x1B,0x45,l.b?1:0, 0x1D,0x21,l.d?0x11:0x00, ...kbAsciiBytes(l.t),0x0A);
  }
  out.push(0x1B,0x61,0,0x1B,0x45,0,0x1D,0x21,0);
  out.push(...kbEscTail({feed:kbClamp(st.extraLines||0,0,20)+3,drawer:!!st.openDrawer,cut:st.autoCut!==false}));
  return new Uint8Array(out);
}

/* ============================================================
   REGULAR (A4) INVOICE DOCUMENT
   ============================================================ */
function kbRegularInvoiceDoc(sale){
  const holder=document.createElement('div');
  holder.innerHTML=buildInvoiceHTML(sale);
  holder.querySelectorAll('.inv-barcode-svg').forEach(svg=>{
    const s=kbBarcodeSVG(svg.getAttribute('data-code')||sale.no); const t=document.createElement('span'); t.innerHTML=s; svg.replaceWith(t.firstChild||t);
  });
  holder.querySelectorAll('.pi-edit-cell,.pi-row-pencil').forEach(n=>n.remove());
  holder.querySelectorAll('th').forEach(th=>{ if(!th.textContent.trim()&&!th.children.length)th.remove(); });
  if(sale.refunded)holder.insertAdjacentHTML('afterbegin','<div style="text-align:center;color:#c0392b;font-weight:800;font-size:22px;border:3px solid #c0392b;margin-bottom:10px">REFUNDED</div>');
  const paper=kbRegPaper();
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${kbEsc(sale.no||'')}</title><style>${printCSS()}
  @page{size:${paper};margin:10mm}
  body{padding:0}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pi-barcode svg{max-width:220px;height:auto}
  </style></head><body>${holder.innerHTML}</body></html>`;
}

/* ============================================================
   PRINT DISPATCH
   ============================================================ */
let kbPrinting=false;
// Prints a bill: thermal receipt or A4 invoice according to Settings → Print.
// opts.format = 'thermal' | 'regular' to force one.
function kbPrintInvoice(sale,opts){
  if(!sale)return;
  opts=opts||{};
  const fmt=opts.format||kbBillKind();
  return fmt==='thermal'?kbPrintThermal(sale):kbPrintRegular(sale);
}
function kbPrintRegular(sale){
  return kbPrintHtmlDoc(kbRegularInvoiceDoc(sale),{kind:'regular',pageSize:kbRegPaper(),title:'Invoice '+(sale.no||'')});
}
async function kbPrintThermal(sale){
  const st=kbSet(), P=kbPaper(), D=kbDesk(), dev=kbDev('thermal');
  if(st.printType==='text'){
    if(!D){ kbToast('Text printing needs the desktop app — printing in graphical mode'); }
    else if(!dev){ kbToast('Select your thermal printer first (Settings → Print)'); kbOpenPrinterSettings('thermal'); return {ok:false}; }
    else{
      if(kbPrinting)return {ok:false}; kbPrinting=true;
      try{
        kbWarnIfOffline('thermal');
        const r=await D.printRaw({deviceName:dev,data:await kbThermalBytes(sale)});
        kbToast(r&&r.ok?('Receipt printed on '+dev):('Print failed: '+((r&&r.error)||'unknown error')));
        return r;
      }finally{ kbPrinting=false; kbRefreshPrinterStatus(); }
    }
  }
  const html=kbThermalHTML(sale);
  if(D&&dev){
    if(kbPrinting)return {ok:false}; kbPrinting=true;
    try{
      kbWarnIfOffline('thermal');
      const r=await D.printHTML({html,deviceName:dev,silent:true,pageWidthMm:P.paper});
      if(!r||!r.ok){ kbToast('Print failed: '+((r&&r.error)||'unknown error')); return r; }
      if(st.autoCut!==false||st.openDrawer){
        const r2=await D.printRaw({deviceName:dev,data:new Uint8Array(kbEscTail({feed:0,drawer:!!st.openDrawer,cut:st.autoCut!==false}))});
        if(!r2||!r2.ok)kbToast('Printed, but cut/drawer command failed: '+((r2&&r2.error)||''));
        else kbToast('Receipt printed on '+dev);
      } else kbToast('Receipt printed on '+dev);
      return r;
    }finally{ kbPrinting=false; kbRefreshPrinterStatus(); }
  }
  kbDialogPrint(html,{pageWidthMm:P.paper});
  return {ok:true,dialog:true};
}
// Generic HTML document → printer of the given kind (silent in desktop app if one is chosen).
function kbPrintHtmlDoc(html,o){
  o=o||{};
  const D=kbDesk(), dev=o.kind?kbDev(o.kind):'';
  if(D&&dev){
    kbWarnIfOffline(o.kind);
    return D.printHTML({html,deviceName:dev,silent:true,pageWidthMm:o.pageWidthMm||0,pageHeightMm:o.pageHeightMm||0,pageSize:o.pageSize||'A4',landscape:!!o.landscape})
      .then(r=>{ kbToast(r&&r.ok?('Printed on '+dev):('Print failed: '+((r&&r.error)||'unknown error'))); kbRefreshPrinterStatus(); return r; });
  }
  kbDialogPrint(html,o);
  return Promise.resolve({ok:true,dialog:true});
}
// Opens the system print dialog (web browser, or no printer chosen yet).
function kbDialogPrint(html,o){
  o=o||{};
  const roll=o.pageWidthMm&&!o.pageHeightMm?`var h=Math.ceil(document.body.scrollHeight*25.4/96)+2;var s=document.createElement('style');s.textContent='@page{size:${o.pageWidthMm}mm '+Math.max(30,h)+'mm;margin:0}';document.head.appendChild(s);`
    :o.pageWidthMm?`var s=document.createElement('style');s.textContent='@page{size:${o.pageWidthMm}mm ${o.pageHeightMm}mm;margin:0}';document.head.appendChild(s);`:'';
  const script=`<script>(function(){function imgs(){return Promise.all([].slice.call(document.images).map(function(i){return i.complete?0:new Promise(function(r){i.onload=i.onerror=r;setTimeout(r,4000);});}));}
function go(){imgs().then(function(){${roll}window.onafterprint=function(){setTimeout(function(){window.close();},300);};setTimeout(function(){window.focus();window.print();},150);});}
if(document.readyState==='complete')go();else window.addEventListener('load',go);})();<\/script>`;
  const w=window.open('','_blank','width='+(o.pageWidthMm?Math.max(380,Math.round(o.pageWidthMm*96/25.4)+60):900)+',height=760');
  if(!w){ kbToast('Popup blocked — allow popups to print'); return false; }
  w.document.open(); w.document.write(html.replace(/<\/body>\s*<\/html>\s*$/i,script+'</body></html>')); w.document.close();
  return true;
}
// Download an invoice as PDF (desktop: real PDF file, browser: print dialog → Save as PDF)
function kbSaveInvoicePDF(sale){
  if(!sale)return;
  const html=kbRegularInvoiceDoc(sale), D=kbDesk();
  if(D&&D.savePDF){
    return D.savePDF({html,fileName:'Invoice '+(sale.no||''),pageSize:kbRegPaper()}).then(r=>{
      if(r&&r.ok)kbToast('PDF saved: '+r.path); else if(r&&!r.canceled)kbToast('PDF failed: '+(r.error||''));
    });
  }
  kbToast('Choose "Save as PDF" in the print dialog');
  kbDialogPrint(html,{});
}

/* ---------- print what is on screen (reports, lists, previews) ---------- */
function kbAppCSS(){
  let css='';
  for(const sh of Array.from(document.styleSheets)){ try{ for(const r of Array.from(sh.cssRules))css+=r.cssText+'\n'; }catch(e){} }
  return css;
}
function kbPrintView(el,title){
  const src=(el&&el.closest&&(el.closest('.kb-print-area')||el.closest('#rep_body')))||document.getElementById('content');
  if(!src)return;
  const clone=src.cloneNode(true);
  const sf=src.querySelectorAll('input,select,textarea'), cf=clone.querySelectorAll('input,select,textarea');
  cf.forEach((f,i)=>{
    const s=sf[i]; if(!s)return;
    let v='';
    if(s.tagName==='SELECT')v=s.options[s.selectedIndex]?s.options[s.selectedIndex].text:'';
    else if(s.type==='checkbox'||s.type==='radio'){ f.setAttribute('disabled',''); if(s.checked)f.setAttribute('checked',''); else f.removeAttribute('checked'); return; }
    else v=s.value;
    if(!v&&/search/i.test(s.placeholder||'')){ f.remove(); return; }
    const sp=document.createElement('span'); sp.className='kb-pv-field'; sp.textContent=v; f.replaceWith(sp);
  });
  clone.querySelectorAll('button,.no-print,.set-close,.hub-action-icon,[onclick*="print" i],[onclick*="export" i],[onclick*="excel" i]').forEach(n=>n.remove());
  const t=title||document.title||'Report';
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${kbEsc(t)}</title><style>${kbAppCSS()}
  @page{size:${kbRegPaper()};margin:10mm}
  html,body{background:#fff!important;height:auto!important;overflow:visible!important}
  body{padding:0;margin:0}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-shadow:none!important}
  .kb-pv-field{display:inline-block;padding:2px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px}
  .kb-pv-head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #333;padding-bottom:6px;margin-bottom:10px;font-family:Arial,sans-serif}
  .kb-pv-head b{font-size:18px}
  </style></head><body><div class="kb-pv-head"><div><b>${kbEsc((store.business&&store.business.name)||'')}</b></div><div style="font-size:12px">Printed: ${kbEsc(new Date().toLocaleString('en-GB'))}</div></div>${clone.outerHTML}</body></html>`;
  return kbPrintHtmlDoc(html,{kind:'regular',pageSize:kbRegPaper(),title:t});
}
// Simple report document (used by purchase / activity log prints)
function kbPrintSimpleDoc(title,css,bodyHtml){
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${kbEsc(title)}</title><style>@page{size:${kbRegPaper()};margin:10mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}${css||''}</style></head><body>${bodyHtml}</body></html>`;
  return kbPrintHtmlDoc(html,{kind:'regular',pageSize:kbRegPaper(),title});
}

/* ============================================================
   PRINTER LIST + LIVE STATUS LIGHT
   ============================================================ */
const KB_PRN={list:null,at:0,loading:null,timer:null};
function kbRefreshPrinterStatus(){
  const D=kbDesk();
  if(!D||!D.listPrinters){ kbRenderPrinterStatus(); return Promise.resolve([]); }
  if(KB_PRN.loading)return KB_PRN.loading;
  KB_PRN.loading=D.listPrinters().then(list=>{ KB_PRN.list=list||[]; KB_PRN.at=Date.now(); })
    .catch(()=>{ KB_PRN.list=KB_PRN.list||[]; })
    .then(()=>{ KB_PRN.loading=null; kbRenderPrinterStatus(); kbFillDeviceSelects(); return KB_PRN.list; });
  return KB_PRN.loading;
}
function kbPrinterInfo(kind){
  const dev=kbDev(kind);
  if(!kbDesk())return {state:'web',label:'Printer status: desktop app only',dev:''};
  if(!dev)return {state:'none',label:'No '+kbKindLabel(kind)+' printer selected',dev:''};
  if(!KB_PRN.list)return {state:'checking',label:dev+': checking…',dev};
  const p=KB_PRN.list.find(x=>x.name===dev);
  if(!p)return {state:'offline',label:dev+': not installed on this PC',dev};
  const txt={online:'Connected',warning:p.reason,offline:'Not connected',error:p.reason,virtual:'Virtual (file) printer'}[p.state]||p.reason;
  return {state:p.state,label:dev+': '+txt,dev,reason:p.reason};
}
function kbWarnIfOffline(kind){
  const i=kbPrinterInfo(kind);
  if(i.state==='offline'||i.state==='error')kbToast('⚠ '+i.label+' — job sent to the print queue');
}
const KB_DOT={online:'#22c55e',virtual:'#3b82f6',warning:'#f59e0b',offline:'#ef4444',error:'#ef4444',none:'#9ca3af',checking:'#9ca3af',web:'#9ca3af'};
function kbStatusDotHTML(info){
  const c=KB_DOT[info.state]||'#9ca3af', glow=info.state==='online'?'box-shadow:0 0 6px '+c+';':'';
  return `<i class="kb-prn-dot${info.state==='online'?' on':''}" style="background:${c};${glow}"></i>`;
}
function kbRenderPrinterStatus(){
  const kind=kbBillKind(), info=kbPrinterInfo(kind);
  document.querySelectorAll('.kb-prn-status').forEach(el=>{
    el.innerHTML=kbStatusDotHTML(info)+`<span class="kb-prn-txt">🖨 ${kbEsc(info.label)}</span>`;
    el.title=(info.reason?info.reason+' — ':'')+'Click to open printer settings';
  });
  document.querySelectorAll('.kb-prn-kind-status').forEach(el=>{
    const i=kbPrinterInfo(el.getAttribute('data-kind'));
    el.innerHTML=kbStatusDotHTML(i)+`<span>${kbEsc(i.label)}</span>`;
  });
}
function kbFillDeviceSelects(){
  document.querySelectorAll('select.kb-dev-select').forEach(sel=>{
    const kind=sel.getAttribute('data-kind'), cur=kbDev(kind), list=KB_PRN.list||[];
    const opts=['<option value="">— Ask every time (print dialog) —</option>'];
    let found=false;
    list.forEach(p=>{
      const st={online:'Connected',warning:p.reason,offline:'Not connected',error:p.reason,virtual:'Virtual'}[p.state]||'';
      if(p.name===cur)found=true;
      opts.push(`<option value="${kbEsc(p.name)}" ${p.name===cur?'selected':''}>${kbEsc(p.displayName||p.name)}${p.isDefault?' (Windows default)':''} — ${kbEsc(st)}</option>`);
    });
    if(cur&&!found)opts.push(`<option value="${kbEsc(cur)}" selected>${kbEsc(cur)} — not installed</option>`);
    sel.innerHTML=opts.join('');
  });
}
function kbStartPrinterWatch(){
  kbRenderPrinterStatus();
  if(!kbDesk())return;
  kbRefreshPrinterStatus();
  clearInterval(KB_PRN.timer);
  KB_PRN.timer=setInterval(()=>{ if(!document.hidden)kbRefreshPrinterStatus(); },15000);
  window.addEventListener('focus',()=>kbRefreshPrinterStatus());
}
function kbOpenPrinterSettings(kind){
  try{
    if(typeof closeModal==='function')['saleModal','invViewModal','nciSlipModal'].forEach(id=>{ try{closeModal(id);}catch(e){} });
    if(window.store&&store.settings&&kind)store.settings.printerTab=kind==='regular'?'regular':'thermal';
    window.setTab='print';
    if(typeof nav==='function')nav('settings');
  }catch(e){}
}

/* ---------- printer picker block used in Settings (thermal / regular / label) ---------- */
function kbPrinterPickerHTML(kind){
  const D=kbDesk();
  if(!D)return `<div class="kb-dev-box"><div class="kb-dev-note">Printer selection, live connection status, silent printing, paper cut and cash drawer work in the <b>KAROBAR desktop app</b>. In a web browser the normal print dialog opens and you pick the printer there.</div></div>`;
  return `<div class="kb-dev-box">
    <div class="kb-dev-row"><label>${kind==='thermal'?'Thermal (receipt) printer':kind==='label'?'Label printer':'Regular (A4) printer'}</label>
      <select class="kb-dev-select" data-kind="${kind}" onchange="kbSetDev('${kind}',this.value)"><option>Loading printers…</option></select>
      <button type="button" class="kb-dev-btn" onclick="kbRefreshPrinterStatus()" title="Refresh printer list">⟳</button>
      <button type="button" class="kb-dev-btn kb-dev-test" onclick="kbTestPrint('${kind}')">Test Print</button></div>
    <div class="kb-prn-kind-status" data-kind="${kind}"></div>
  </div>`;
}
function kbTestPrint(kind){
  const b=(window.store&&store.business)||{};
  if(kind==='thermal'){
    const it=(store.items||[])[0];
    return kbPrintThermal({no:'TEST-001',party:'Test Customer',date:new Date().toLocaleDateString('en-GB'),time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
      rows:[{item:it?it.name:'Sample Item',qty:2,price:it?(+it.price||100):100,disc:0},{item:'Second Item',qty:1,price:250,disc:10}],
      total:(it?(+it.price||100):100)*2+225,received:(it?(+it.price||100):100)*2+225,mode:'Cash'});
  }
  if(kind==='label'){
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:50mm 25mm;margin:0}body{margin:0;width:50mm;height:25mm;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial;font-size:9px}svg{max-width:46mm;height:12mm}</style></head><body><b>${kbEsc(b.name||'KAROBAR')}</b>${kbBarcodeSVG('TEST123',{height:30,width:1.2,displayValue:false,margin:0})}<div>TEST123 &middot; 50 x 25 mm</div></body></html>`;
    return kbPrintHtmlDoc(html,{kind:'label',pageWidthMm:50,pageHeightMm:25});
  }
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:${kbRegPaper()};margin:15mm}body{font-family:Arial;color:#000}h1{margin:0 0 6px}</style></head><body><h1>Test Page</h1><p>${kbEsc(b.name||'KAROBAR')} — printer test (${kbRegPaper()}).</p><p>${kbEsc(new Date().toLocaleString('en-GB'))}</p><p>If you can read this, your regular printer is set up correctly.</p></body></html>`;
  return kbPrintHtmlDoc(html,{kind:'regular',pageSize:kbRegPaper()});
}

/* ---------- live thermal preview inside Settings ---------- */
function kbSampleSale(){
  const last=(store.sales||[]).slice(-1)[0];
  if(last&&last.rows&&last.rows.length)return last;
  return {no:'INV-12345',party:'Sample Customer',phone:'03001234567',date:new Date().toLocaleDateString('en-GB'),
    rows:[{item:'Sample Item',qty:2,price:150,disc:0},{item:'Another Item',qty:1,price:300,disc:10}],total:570,received:600,mode:'Cash'};
}
function kbThermalPreviewHTML(){
  const P=kbPaper(), st=kbSet(), sale=kbSampleSale(), px=Math.round(P.paper*96/25.4);
  if(st.printType==='text'){
    return `<div class="kb-tp-paper" style="width:${px}px"><div class="kb-tp-text" style="font-size:${Math.max(8,Math.floor((px-16)/P.chars/0.6))}px">${kbReceiptTextPreview(sale)}</div></div>
      <div class="kb-tp-cap">Text printing · ${P.chars} characters per line · ${P.paper} mm paper</div>`;
  }
  return `<iframe class="kb-tp-frame" style="width:${px}px" srcdoc="${kbEsc(kbThermalHTML(sale))}" onload="try{this.style.height=(this.contentDocument.body.scrollHeight+12)+'px'}catch(e){}"></iframe>
    <div class="kb-tp-cap">${KB_THEMES[kbTheme()]} layout · ${P.paper} mm paper</div>`;
}
function kbRefreshThermalPreview(){
  const box=document.getElementById('kbThermPreview'); if(box)box.innerHTML=kbThermalPreviewHTML();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',kbStartPrinterWatch); else kbStartPrinterWatch();
