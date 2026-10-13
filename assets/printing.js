/* Shared print pipeline. This file runs after app.js; no Node access here. */
let desktopPrinterConfig = null;
const printerConfigReady = window.karobarDesktop?.printerConfig ? window.karobarDesktop.printerConfig().then(r=>{if(r.ok)desktopPrinterConfig=r.config;else throw new Error(r.error);}) : Promise.resolve();
printerConfigReady.catch(e=>console.warn('Printer settings unavailable:',e.message));
function printerConfig() {
  // Device names belong to this computer, not the cloud-synced company record.
  if (desktopPrinterConfig) return desktopPrinterConfig;
  try { return JSON.parse(localStorage.getItem('karobar.printers.v1') || '{}'); } catch (_) { return {}; }
}
async function savePrinterConfig(key, value) {
  const c = printerConfig(); c[key] = value;
  if(window.karobarDesktop?.printerConfig){
    const result=await window.karobarDesktop.printerConfig(c);
    if(!result.ok){toast(result.error);return;}
    desktopPrinterConfig=result.config;
  }else localStorage.setItem('karobar.printers.v1', JSON.stringify(c));
  refreshPrinterStatus();
}
function receiptWidth(s) {
  return s.pageSize === 'custom' ? Math.min(112,Math.max(48,Number(s.customWidth)||80)) : ({'2inch':58,'3inch':80,'4inch':112}[s.pageSize] || 80);
}
function printEscape(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function companyPrintLogo(height='18mm') {
  const logo=store.business.logo||'';
  return /^data:image\/(png|jpeg|webp);base64,/i.test(logo)?`<img alt="Company logo" src="${printEscape(logo)}" style="display:block;max-width:70%;max-height:${height};object-fit:contain;margin:0 auto 3mm">`:'';
}
async function rawLogo(logo,widthMm) {
  if(!logo)return undefined;
  if(!/^data:image\/(png|jpeg|webp);base64,/i.test(logo))throw new Error('Upload a PNG, JPEG or WebP company logo');
  const img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Company logo could not be loaded'));img.src=logo;});
  const maxWidth=widthMm<=58?384:widthMm<=80?576:832;
  const scale=Math.min(maxWidth/img.width,512/img.height,1);
  const widthBytes=Math.ceil(img.width*scale/8),height=Math.max(1,Math.round(img.height*scale));
  const canvas=document.createElement('canvas');canvas.width=widthBytes*8;canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,height);ctx.drawImage(img,0,0,Math.round(img.width*scale),height);
  const pixels=ctx.getImageData(0,0,canvas.width,height).data,bytes=new Uint8Array(widthBytes*height);
  for(let y=0;y<height;y++)for(let x=0;x<canvas.width;x++){
    const i=(y*canvas.width+x)*4;
    if(0.299*pixels[i]+0.587*pixels[i+1]+0.114*pixels[i+2]<160)bytes[y*widthBytes+(x>>3)]|=128>>(x%8);
  }
  let binary='';bytes.forEach(v=>binary+=String.fromCharCode(v));
  return {widthBytes,height,data:btoa(binary)};
}

function thermalReceipt(inv, s, business, items, parties) {
  const e = printEscape, width = receiptWidth(s);
  const money = v => Number(v || 0).toLocaleString('en-PK',{useGrouping:s.tGrouping!==false,minimumFractionDigits:s.tAmountDec===false?0:2,maximumFractionDigits:s.tAmountDec===false?0:2});
  const qty = v => String(Number(Number(v||0).toFixed(Math.min(6,Math.max(0,Number(s.itemQtyDec)||0)))));
  const blocks=[], text=[];
  const line=(value,cls='')=>{blocks.push(`<div class="${cls}">${e(value)}</div>`);text.push(String(value));};
  const pair=(label,value,cls='')=>{blocks.push(`<div class="pair ${cls}"><span>${e(label)}</span><span>${e(value)}</span></div>`);text.push(label+': '+value);};
  if(s.showLogo!==false && /^data:image\/(png|jpeg|webp);base64,/i.test(business.logo||'')) blocks.push(`<img class="logo" src="${e(business.logo)}">`);
  if(s.showCoName!==false) line(business.name||'My Company','heading');
  if(s.showAddress) line(business.address||'');
  if(s.showCoPhone!==false) line(inv.branchPhone||business.phone||'');
  if(s.showEmail!==false) line(business.email||'');
  line(inv.title||'INVOICE','heading');
  line('Invoice: '+(inv.no||'')); line('Date: '+(inv.date||''));
  line('Customer: '+(inv.party||'Cash')); if(inv.phone)line('Phone: '+inv.phone);
  let totalQty=0, subtotal=0, itemDiscount=0;
  (inv.rows||[]).filter(r=>Number(r.qty)>Number(r.returned||0)).forEach((r,i)=>{
    const item=items.find(x=>x.name===r.item)||{};
    const n=Math.max(0,Number(r.qty)-Number(r.returned||0)), price=Number(r.price)||0;
    totalQty+=n; subtotal+=n*price;
    const discount=n*price*(Number(r.disc)||0)/100;itemDiscount+=discount;
    line((s.tSno!==false?(i+1)+'. ':'')+(r.item||''),'item');
    const detail=[];
    for(const [flag,key,label] of [['tUom','unit','Unit'],['tMrp','mrp','MRP'],['tSize','size','Size'],['tModel','model','Model'],['tSerial','serial','Serial']]) {
      const value=r[key] == null ? item[key] : r[key];
      if(s[flag]!==false && (['tUom','tMrp'].includes(flag)||s[flag]) && value)detail.push(label+': '+value);
    }
    if(detail.length)line(detail.join(' | '),'detail');
    if(s.tDesc!==false && (r.desc||item.desc))line(r.desc||item.desc,'detail');
    pair(qty(n)+' x '+money(price), money(n*price*(1-(Number(r.disc)||0)/100)));
    if(r.disc)pair('Discount '+r.disc+'%', '-'+money(discount),'detail');
  });
  if(s.tTotalQty!==false)pair('Total quantity',qty(totalQty));
  pair('Subtotal',money(subtotal));
  if(itemDiscount>0)pair('Item discount','-'+money(itemDiscount));
  const adjustment=Number(inv.total||0)-(subtotal-itemDiscount);
  if(Math.abs(adjustment)>0.005)pair(adjustment<0?'Bill discount':'Tax / charges adjustment',(adjustment<0?'-':'+')+money(Math.abs(adjustment)));
  pair((itemDiscount>0||adjustment<0?'TOTAL AFTER DISCOUNT ':'TOTAL ')+(s.currency||'Rs'),money(inv.total),'total');
  if(s.tReceived!==false)pair('Received',money(inv.received));
  const balance=Number(inv.total||0)-Number(inv.received||0);
  if(s.tBalance!==false)pair(balance<0?'Change':'Balance due',money(Math.abs(balance)));
  if(s.tPartyBal){const p=parties.find(p=>p.name===inv.party);if(p)pair('Current party balance',money(p.balance));}
  if(s.tYouSaved!==false && subtotal>Number(inv.total))pair('You saved',money(subtotal-Number(inv.total)));
  if(s.tTaxDetails)pair('Recorded tax',inv.taxAmount == null ? 'Not recorded' : money(inv.taxAmount));
  if(s.showTerms!==false && s.terms)line(s.terms,'footer');
  blocks.push(`<svg class="inv-barcode-svg" data-code="${e(inv.no||'000000')}"></svg>`);
  const feed=Math.min(20,Math.max(0,Math.floor(Number(s.feedLines)||0)));
  const theme=[2,3,4,5].includes(Number(s.printTheme))?Number(s.printTheme):5;
  const css=`@page{margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;color:#000;background:#fff}
    .receipt{width:${width}mm;padding:3mm;font:12px/1.4 monospace;font-weight:${s.textBold===false?400:700};overflow-wrap:anywhere}
    .heading{text-align:center;font-size:15px;margin:5px 0}.pair{display:flex;justify-content:space-between;gap:3mm}.pair>span:last-child{text-align:right;flex-shrink:0}
    .item{border-top:1px dashed #555;margin-top:6px;padding-top:5px}.detail{font-size:10px;font-weight:400}.total{border-top:2px solid #000;font-size:15px;margin-top:8px;padding-top:5px}
    .footer{white-space:pre-wrap;margin-top:8px}.logo{display:block;max-width:70%;max-height:20mm;margin:0 auto}.receipt svg{display:block;max-width:100%;height:auto;margin:8px auto 0}
    .theme-2{font-family:Arial,sans-serif}.theme-2 .heading{text-align:left}.theme-3 .item{border-top:1px solid}.theme-3 .total{border-bottom:2px solid;padding-bottom:5px}.theme-4{font-size:11px;line-height:1.2}.theme-4 .item{margin-top:3px;padding-top:3px}
    .feed{height:${feed*4}mm}`;
  // Keep raw text inside a conservative character width; never truncate totals.
  const cols=Math.max(20,Math.floor((width-6)/1.7));
  const wrapped=text.flatMap(l=>String(l).split('\n').flatMap(part=>part.match(new RegExp('.{1,'+cols+'}','g'))||[''])).join('\n');
  return {html:`<article class="receipt theme-${theme}">${blocks.join('')}<div class="feed"></div></article>`,css,text:wrapped,widthMm:width};
}

function preparePrintHTML(html, css='', title='KAROBAR') {
  const doc=new DOMParser().parseFromString(html,'text/html');
  doc.querySelectorAll('script,iframe,object,embed,link,base,meta[http-equiv],button,.pi-edit-cell,.pi-row-pencil,.pi-row-actions,.no-print').forEach(el=>el.remove());
  doc.querySelectorAll('*').forEach(el=>Array.from(el.attributes).forEach(a=>{if(/^on/i.test(a.name)||['srcdoc','formaction'].includes(a.name))el.removeAttribute(a.name);}));
  doc.querySelectorAll('.inv-barcode-svg,.bc-p-lbl svg').forEach(svg=>{
    const code=svg.getAttribute('data-code')||svg.closest('[data-code]')?.getAttribute('data-code')||'000000';
    try{JsBarcode(svg,code,{format:'CODE128',width:1.2,height:36,displayValue:!svg.closest('.bc-p-lbl'),margin:0,fontSize:10});}
    catch(e){
      if(svg.closest('.bc-p-lbl'))throw new Error('Invalid CODE128 label: '+code);
      const notice=doc.createElement('div');notice.textContent='Barcode unavailable for this invoice number';svg.replaceWith(notice);
    }
  });
  // Generate QR locally, including when internet is disconnected.
  doc.querySelectorAll('img.pi-qr').forEach(img=>{
    const holder=document.createElement('div');
    const url=new URL(img.getAttribute('src'),location.href);
    new QRCode(holder,{text:url.searchParams.get('data')||'KAROBAR',width:90,height:90});
    const canvas=holder.querySelector('canvas');
    if(canvas)img.src=canvas.toDataURL('image/png');
    else throw new Error('Could not render QR code');
  });
  doc.querySelectorAll('img').forEach(img=>{if(!/^data:image\/(png|jpeg|webp);base64,/i.test(img.getAttribute('src')||''))img.remove();});
  return `<!doctype html><html><head><meta charset="utf-8"><title>${printEscape(title)}</title>${Array.from(doc.querySelectorAll('style')).map(x=>x.outerHTML).join('')}<style>${css}</style></head><body>${doc.body.innerHTML}</body></html>`;
}

async function sendPrintJob(html, options={}, pdf=false) {
  await printerConfigReady;
  const desktop=window.karobarDesktop;
  const c=printerConfig(), kind=options.kind||'regular';
  const job={html,kind,paper:store.settings.regularPaper||'A4',deviceName:c[kind]||'',silent:!!c.silent && !!c[kind],...options};
  if(desktop?.printHTML) {
    const result=await (pdf?desktop.savePDF(job):desktop.printHTML(job));
    if(!result.ok && !result.canceled)throw new Error(result.error||'Printing failed');
    if(result.ok)toast(result.message);
    return result;
  }
  const win=window.open('','_blank','width=850,height=900');
  if(!win)throw new Error('Popup blocked. Allow popups to print.');
  win.document.write(html);win.document.close();
  await win.document.fonts.ready;
  await Promise.all(Array.from(win.document.images).map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r;})));
  if(kind==='thermal'){
    const h=Math.ceil(win.document.body.getBoundingClientRect().height*25.4/96+2);
    const style=win.document.createElement('style');style.textContent=`@page{size:${job.widthMm}mm ${h}mm;margin:0}`;win.document.head.appendChild(style);
  }
  if(pdf)toast('Choose Save as PDF in the print dialog');
  win.focus();win.print(); // Keep the window available for cancellation/retry.
}

let receiptPrintPending=false;
async function karobarPrintInvoice(invoice,pdf=false) {
  if(!invoice||receiptPrintPending)return;
  receiptPrintPending=true;
  try {
    await printerConfigReady;
    const s={...store.settings},c=printerConfig();
    const thermal=s.thermalDefault!==false;
    const receipt=thermalReceipt(invoice,s,store.business,store.items||[],store.parties||[]);
    if(thermal && s.printMode==='raw' && !pdf){
      if(!window.karobarDesktop?.printRaw)throw new Error('ESC/POS requires the desktop app. Select graphical printing in a browser.');
      if(!c.thermal)throw new Error('Select a thermal printer in Settings');
      const logo=s.showLogo===false?undefined:await rawLogo(store.business.logo,receipt.widthMm);
      const result=await window.karobarDesktop.printRaw({deviceName:c.thermal,text:receipt.text,logo,bold:s.textBold!==false,feedLines:Math.min(20,Math.max(0,Math.floor(Number(s.feedLines)||0))),cut:!!s.autoCut,drawer:!!s.openDrawer,escposConfirmed:c.escpos===true});
      if(!result.ok)throw new Error(result.error);
      toast(result.message);return;
    }
    let html=thermal?receipt.html:buildInvoiceHTML(invoice);
    const css=thermal?receipt.css:printCSS()+`@page{size:${['A4','A5','Letter','Legal'].includes(s.regularPaper)?s.regularPaper:'A4'};margin:10mm}body{padding:0}.print-invoice{max-width:100%}.pi-tbl{table-layout:auto}.pi-tbl td{overflow-wrap:anywhere}.pi-logo{display:${s.showLogo===false?'none':'flex'};background:#fff}.pi-logo img{object-fit:contain}.pi-name{display:${s.showCoName===false?'none':'block'}}`;
    html=preparePrintHTML(html,css,'Invoice '+invoice.no);
    await sendPrintJob(html,thermal?{kind:'thermal',widthMm:receipt.widthMm}:{kind:'regular'},pdf);
  }catch(e){toast('Print: '+e.message);}
  finally{receiptPrintPending=false;}
}

async function karobarPrintReport() {
  try {
    const source=document.querySelector('.modal-overlay.show .modal-body')||document.querySelector('.modal-overlay.show')||document.getElementById('content');
    const copy=source.cloneNode(true);
    copy.querySelectorAll('button,input,select,textarea,[onclick],.no-print').forEach(el=>{
      if(el.matches('button,input,select,textarea')||!el.querySelector('table'))el.removeAttribute('onclick');
      if(el.matches('button,input,select,textarea')||el.getAttribute('title')==='Print')el.remove();
    });
    const css=`@page{size:${store.settings.regularPaper||'A4'};margin:10mm}body{font:11px Arial;color:#000}table{width:100%;border-collapse:collapse}th,td{padding:5px;border-bottom:1px solid #aaa;text-align:left}*{max-height:none!important;overflow:visible!important}.modal-overlay,.modal{position:static!important;display:block!important;background:white!important;max-width:none!important;height:auto!important}.modal-head button,.modal-foot{display:none!important}tr{break-inside:avoid}svg{max-width:100%}`;
    await sendPrintJob(preparePrintHTML(companyPrintLogo()+copy.outerHTML,css,'Report'));
  }catch(e){toast('Print: '+e.message);}
}
async function karobarPrintPopup(win) {
  if(!win)return toast('Popup blocked. Allow popups to print.');
  try {
    const html=preparePrintHTML(win.document.documentElement.outerHTML.replace(/<body[^>]*>/i,m=>m+companyPrintLogo()),`@page{size:${store.settings.regularPaper||'A4'};margin:10mm}`);
    if(window.karobarDesktop?.printHTML)win.close();
    else {win.document.open();win.document.write(html);win.document.close();win.focus();win.print();return;}
    await sendPrintJob(html);
  }catch(e){toast('Print: '+e.message);}
}
async function karobarPrintLabels(labelsHtml,sz,labelPrinter) {
  try {
    const labelDoc=new DOMParser().parseFromString(labelsHtml,'text/html');
    labelDoc.querySelectorAll('.bc-p-lbl').forEach(el=>el.insertAdjacentHTML('afterbegin',companyPrintLogo(Math.max(3,Math.min(8,sz.h*0.15))+'mm')));
    labelsHtml=labelDoc.body.innerHTML;
    const css=`@page{size:${labelPrinter?sz.w+'mm '+sz.h+'mm':'A4'};margin:${labelPrinter?'0':'5mm'}}*{box-sizing:border-box}body{margin:0;padding:0;font:11px Arial}.bc-p-grid{display:flex;flex-wrap:wrap;gap:0}.bc-p-lbl{width:${sz.w}mm;height:${sz.h}mm;padding:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;break-inside:avoid;${labelPrinter?'break-after:page;':''}}.bc-p-lbl svg{max-width:100%;height:auto}.bc-p-lbl div{text-align:center}${labelPrinter?'.bc-p-grid{display:block}.bc-p-lbl:last-child{break-after:auto}':''}`;
    await sendPrintJob(preparePrintHTML('<div class="bc-p-grid">'+labelsHtml+'</div>',css,'Barcode labels'),labelPrinter?{kind:'label',widthMm:sz.w,heightMm:sz.h}:{kind:'regular',paper:'A4'});
  }catch(e){toast('Print: '+e.message);}
}

function printerPanelHTML() {
  const c=printerConfig(),s=store.settings;
  return `<div class="sg-section" id="printerDevices"><div class="sg-section-title">Printers on this computer</div>
    ${['regular','thermal','label'].map(k=>`<div style="margin:8px 0"><label>${k[0].toUpperCase()+k.slice(1)} printer <select data-printer="${k}" onchange="savePrinterConfig('${k}',this.value)"><option value="">System print dialog</option>${c[k]?`<option selected value="${printEscape(c[k])}">${printEscape(c[k])}</option>`:''}</select></label> <span data-status="${k}" role="status">● Not checked</span></div>`).join('')}
    <button type="button" onclick="refreshPrinterStatus()">Refresh status</button>
    <label><input data-device-setting="silent" type="checkbox" ${c.silent?'checked':''} onchange="savePrinterConfig('silent',this.checked)">Silent print to selected printers</label>
    <div><label><input data-device-setting="escpos" type="checkbox" ${c.escpos?'checked':''} onchange="savePrinterConfig('escpos',this.checked)">My thermal printer supports ESC/POS (required for RAW text, cutter and drawer)</label></div>
    <div><label><input id="set_thermalDefault" type="checkbox" ${s.thermalDefault!==false?'checked':''}>Use thermal layout for invoices (uncheck for regular paper)</label></div>
    <p style="font-size:12px">Status is reported by the printer driver, not proof of a USB/network connection. Graphical printing uses the driver’s cutter/drawer preferences. RAW supports a monochrome logo and ASCII text; use graphical mode for Urdu and barcodes.</p>
    <label>Regular paper <select id="set_regularPaper">${['A4','A5','Letter','Legal'].map(v=>`<option ${s.regularPaper===v?'selected':''}>${v}</option>`).join('')}</select></label>
    <button type="button" onclick="printerTestPage()">Print test receipt</button></div>`;
}
let printerStatusPending=false;
async function refreshPrinterStatus() {
  const panel=document.getElementById('printerDevices');
  if(!panel||printerStatusPending)return;
  if(!window.karobarDesktop?.listPrinters){panel.querySelectorAll('[data-status]').forEach(el=>{el.textContent='● Browser: use print dialog';el.style.color='#996800';});return;}
  printerStatusPending=true;
  try {
    if(window.karobarDesktop.printerConfig){
      const configResult=await window.karobarDesktop.printerConfig();
      if(!configResult.ok)throw new Error(configResult.error);
      desktopPrinterConfig=configResult.config;
    }
    const result=await window.karobarDesktop.listPrinters();
    if(!result.ok)throw new Error(result.error);
    const c=printerConfig();
    panel.querySelectorAll('[data-device-setting]').forEach(el=>{el.checked=!!c[el.dataset.deviceSetting];});
    panel.querySelectorAll('[data-printer]').forEach(select=>{
      const kind=select.dataset.printer, name=c[kind]||'';
      select.innerHTML='<option value="">System print dialog</option>';
      result.printers.forEach(p=>select.add(new Option(p.displayName+(p.isDefault?' (OS default)':''),p.name)));
      if(name&&!result.printers.some(p=>p.name===name))select.add(new Option(name+' (not installed)',name));
      select.value=name;
      const printer=result.printers.find(p=>p.name===name),status=panel.querySelector('[data-status="'+kind+'"]');
      status.textContent='● '+(printer?printer.detail:name?'Not installed':'No printer selected');
      status.style.color=printer?.state==='ready'?'#15803d':name&&(!printer||['offline','error'].includes(printer.state))?'#b91c1c':'#996800';
    });
  }catch(e){panel.querySelectorAll('[data-status]').forEach(el=>{el.textContent='● Status unavailable: '+e.message;el.style.color='#996800';});}
  finally{printerStatusPending=false;}
}
function printerTestPage() {
  applyLiveSettings();
  karobarPrintInvoice({no:'TEST-001',date:new Date().toLocaleString(),party:'TEST ONLY',rows:[{item:'Printer test',qty:1,price:10}],total:10,received:10});
}
setInterval(()=>{if(!document.hidden)refreshPrinterStatus();},15000);
