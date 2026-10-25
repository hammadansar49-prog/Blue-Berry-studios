/* Print settings UI. No sample records are written to the business store. */
let printSettingsPanel='layout';
function currentPrintOptions(){return KarobarPrint.options(store.settings);}
function savePrintOption(key,value,redraw=false){
  if(!hasPermission('edit','settings')){showNoAccess();return;}
  const mode=store.settings.printerTab||'thermal';
  const before=store.settings.printProfiles;
  const profiles={...(before||{})};
  profiles[mode]={...KarobarPrint.options(store.settings,mode),[key]:value};
  delete profiles[mode].mode;
  store.settings.printProfiles=profiles;
  try{persist();}catch(e){store.settings.printProfiles=before;const el=document.getElementById('psSaved');if(el){el.textContent='Could not save';el.classList.add('ps-error');}return;}
  if(redraw){renderPrintSettings();document.querySelector(`[data-option="${key}"]`)?.focus();}
  else updatePrintSettingsPreview();
}
function setPrintSettingsMode(mode){
  if(!['regular','thermal'].includes(mode))return;
  store.settings.printerTab=mode;
  if(hasPermission('edit','settings'))persist();
  printSettingsPanel='layout';
  renderPrintSettings();
}
function setDefaultPrintMode(checked){
  if(!hasPermission('edit','settings'))return showNoAccess();
  store.settings.defaultPrinterType=checked?(store.settings.printerTab||'thermal'):(store.settings.printerTab==='thermal'?'regular':'thermal');
  rememberPrintPreference();renderPrintSettings();
}
function printProfileChangeTheme(index){
  const previous=currentPrintOptions();
  savePrintOption('theme',index);
  if(store.settings.printerTab==='regular'){
    savePrintOption('orientation',index===1||index===2?'landscape':'portrait');
    if(['#41445f','#aaa4d7'].includes(previous.color))savePrintOption('color',index===3?'#aaa4d7':'#41445f');
  }
  renderPrintSettings();
}
function updatePrintCompany(field,value){
  if(!hasPermission('edit','settings'))return showNoAccess();
  store.business[field]=value;persist();updatePrintSettingsPreview();updateBadge();
}
function updatePrintTerms(value){
  if(!hasPermission('edit','settings'))return showNoAccess();
  store.settings.terms=value;persist();updatePrintSettingsPreview();
}
async function printSettingsLogo(input){
  if(await saveBusinessImage(input.files[0]))updatePrintSettingsPreview();input.value='';
}
function updatePrintSettingsPreview(){
  const host=document.getElementById('psPaper');if(!host)return;
  const o=currentPrintOptions();
  const sale=KarobarPrint.sample();
  const business={...store.business};
  host.className='ps-preview-paper'+(o.mode==='thermal'?' is-thermal':'');
  const sizes={a4:[210,297],a5:[148,210],letter:[216,279]};
  let [w,h]=sizes[o.paper];if(o.orientation==='landscape')[w,h]=[h,w];
  host.style.maxWidth=o.mode==='thermal'?'100%':w*3.78+'px';
  host.style.width=o.mode==='thermal'?o.width*4.775+'px':'100%';
  host.style.minHeight=o.mode==='thermal'?'530px':'0';
  host.style.aspectRatio=o.mode==='regular'?w+'/'+h:'auto';
  host.innerHTML=KarobarPrint.render(sale,{business,settings:store.settings,items:[],parties:[],sample:true,qrData:o.qr?localQrDataUrl(JSON.stringify({sample:true,invoice:sale.no,total:sale.total}),128):''});
  fillPrintBarcodes(host);
  const status=document.getElementById('psSaved');if(status){status.textContent='Changes saved';status.classList.remove('ps-error');}
}
function fillPrintBarcodes(root){
  root.querySelectorAll('.inv-barcode-svg').forEach(svg=>{
    try{JsBarcode(svg,svg.dataset.code||'INVOICE',{format:'CODE128',width:1.4,height:42,displayValue:false,margin:0});}
    catch(e){svg.replaceWith(document.createTextNode(svg.dataset.code||''));}
  });
}
function renderPrintSettings(){
  const o=currentPrintOptions(),thermal=o.mode==='thermal',e=KarobarPrint.escape;
  const hint=text=>`<span class="ps-info" title="${e(text)}" aria-label="${e(text)}">i</span>`;
  const check=(key,label,help='')=>`<div class="ps-check"><input data-option="${key}" id="ps_${key}" type="checkbox" ${o[key]?'checked':''} onchange="savePrintOption('${key}',this.checked)"><label for="ps_${key}">${label}${help?hint(help):''}</label></div>`;
  const select=(key,label,choices)=>`<div class="ps-row"><label for="ps_${key}">${label}</label><select data-option="${key}" id="ps_${key}" onchange="savePrintOption('${key}',this.value)">${choices.map(([v,l])=>`<option value="${e(v)}" ${o[key]===v?'selected':''}>${e(l)}</option>`).join('')}</select></div>`;
  const number=(key,label,min,max)=>`<div class="ps-row"><label for="ps_${key}">${label}</label><input data-option="${key}" id="ps_${key}" type="number" min="${min}" max="${max}" value="${o[key]}" onchange="this.value=Math.min(${max},Math.max(${min},Number(this.value)||${min}));savePrintOption('${key}',Number(this.value))"></div>`;
  const company=(key,field,label)=>`<div class="ps-check"><input type="checkbox" id="ps_${key}" aria-label="Print ${label}" ${o[key]?'checked':''} onchange="savePrintOption('${key}',this.checked)"><label class="ps-field ${field==='name'?'short':''}"><span>${label}</span><input aria-label="${label}" value="${e(store.business[field]||'')}" placeholder="${label}" oninput="updatePrintCompany('${field}',this.value)"></label>${hint('Show or hide '+label+' on the invoice')}</div>`;
  const section=label=>`<h2 class="ps-section">${label}</h2>`;
  const defaultMode=store.settings.defaultPrinterType||(store.settings.thermalDefault===false?'regular':'thermal');
  content.innerHTML=`<section class="ps-workspace" aria-label="Print settings"><header class="ps-header" role="tablist" aria-label="Printer type"><button class="ps-tab" role="tab" aria-selected="${!thermal}" onclick="setPrintSettingsMode('regular')">REGULAR PRINTER</button><button class="ps-tab" role="tab" aria-selected="${thermal}" onclick="setPrintSettingsMode('thermal')">THERMAL PRINTER</button><span class="ps-save-status" id="psSaved" role="status">Changes saved</span></header><button class="ps-close" aria-label="Close print settings" onclick="setTab='general';vSettings()">×</button>
    <div class="ps-layout"><div class="ps-controls"><div class="ps-subtabs"><button class="${printSettingsPanel==='layout'?'active':''}" onclick="printSettingsPanel='layout';renderPrintSettings()">CHANGE LAYOUT</button>${!thermal?`<button class="${printSettingsPanel==='colors'?'active':''}" onclick="printSettingsPanel='colors';renderPrintSettings()">CHANGE COLORS</button>`:''}</div>
    ${printSettingsPanel==='colors'&&!thermal?`<div class="ps-colors">${['#aaa4d7','#087ea4','#a3a3a3','#737373','#999966','#5085ed','#00b3e6','#008800','#87c52b','#66280e','#801080','#993366','#993310','#ad4816','#a440d0','#cc0088','#dfae66','#d69d4d','#e58bd2','#ff911b','#c60016','#f04416','#50200d','#ffffff','#000000'].map(c=>`<button class="ps-swatch" aria-pressed="${o.color===c}" style="--swatch:${c}" aria-label="Invoice color ${c}" onclick="savePrintOption('color','${c}');document.querySelectorAll('.ps-swatch').forEach(b=>b.setAttribute('aria-pressed',b===this))"></button>`).join('')}<input type="color" aria-label="Custom invoice color" value="${o.color}" oninput="savePrintOption('color',this.value)"></div>`:`<div class="ps-themes">${KarobarPrint.themes[o.mode].map((name,i)=>`<button class="ps-theme" aria-pressed="${o.theme===i}" onclick="printProfileChangeTheme(${i})"><span class="ps-thumb ${!thermal&&(i===1||i===2)?'ps-thumb-landscape':''}"><i></i><i></i><i></i></span>${name}</button>`).join('')}</div>`}
    ${!thermal?section('Print Company Info / Header'):''}
    <div class="ps-check"><input id="ps_default" type="checkbox" ${defaultMode===o.mode?'checked':''} onchange="setDefaultPrintMode(this.checked)"><label for="ps_default">Make ${thermal?'Thermal':'Regular'} Printer Default</label>${hint('Used when opening a new invoice')}</div>
    ${thermal?`<div class="ps-row"><label>Page Size</label><div class="ps-widths">${[[58,'2 Inch'],[80,'3 Inch'],[104,'4 Inch']].map(([width,label])=>`<button class="${o.width===width&&!o.customWidth?'selected':''}" onclick="savePrintOption('width',${width});savePrintOption('customWidth',false,true)">${label}<small>${width}mm</small></button>`).join('')}<button class="${o.customWidth?'selected':''}" onclick="savePrintOption('customWidth',true,true)">Custom<small>${o.customChars} Chars</small></button></div></div>${o.customWidth?number('width','Paper width (mm)',40,112)+number('customChars','Characters per line',24,80):''}<hr>${select('printingType','Printing Type',[['text','Text Printing'],['image','Image Printing']])}${check('bold','Use Text Styling (<b>Bold</b>)')}${check('autoCut','Auto Cut Paper After Printing','For ESC/POS-compatible thermal printers with a cutter')}${check('openDrawer','Open Cash Drawer After Printing','For an ESC/POS-compatible drawer connected to the printer')}${number('extraLines','Extra lines at the end',0,30)}${number('copies','Number of copies',1,10)}${section('Print Company Info / Header')}`:check('repeatHeader','Print repeat header in all pages')}
    ${company('showName','name','Company Name')}<div class="ps-check"><input type="checkbox" id="ps_showLogo" ${o.showLogo?'checked':''} onchange="savePrintOption('showLogo',this.checked)"><label for="ps_showLogo">Company Logo</label><button class="ps-link ps-logo-link" onclick="document.getElementById('ps_logoFile').click()">(Change)</button><input hidden id="ps_logoFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onchange="printSettingsLogo(this)"></div>${company('showAddress','address','Address')}${company('showEmail','email','Email')}${company('showPhone','phone','Phone Number')}
    ${!thermal?`${select('paper','Paper Size',[['a4','A4'],['a5','A5'],['letter','Letter']])}${select('orientation','Orientation',[['portrait','Portrait'],['landscape','Landscape']])}${select('companySize','Company Name Text Size',[['small','Small'],['medium','Medium'],['large','Large']])}${select('textSize','Invoice Text Size',[['small','Small'],['medium','Medium'],['large','Large']])}${check('originalDuplicate','Print Original/Duplicate')}${number('topSpace','Extra space on Top of PDF (mm)',0,50)}`:''}
    <details><summary>Change Transaction Names &gt;</summary><label class="ps-row">Invoice title <input aria-label="Invoice title" value="${e(o.invoiceTitle)}" oninput="savePrintOption('invoiceTitle',this.value)"></label></details>
    ${section('Item Table')}${!thermal?number('minRows','Min No. of Rows in Item Table',0,100)+'<details><summary>Item Table Customization &gt;</summary>':''}
    ${check('sno','S.No')}${check('uom','Units of Measurement')}${check('mrp','MRP')}${check('description','Description')}${!thermal?check('hsn','HSN/SAC')+check('itemDiscount','Item Discount')+check('itemTax','Item Tax'):''}<h3 class="ps-subtitle">Additional Item Details</h3>${check('batch','Batch No.')}${check('expiry','Exp. Date')}${check('manufacturing','Mfg. Date')}${check('size','Size')}${check('model','Model No.')}${check('serial','Serial No.')}${!thermal?'</details>':''}
    ${section('Totals &amp; Taxes')}${check('totalQty','Total Item Quantity')}${check('decimals','Amount with Decimal e.g. 0.00')}${check('received','Received Amount')}${check('balance','Balance Amount')}${check('partyBalance','Current Balance of Party')}${check('taxDetails','Tax Details')}${check('savings','You Saved')}${check('grouping','Print Amount with Grouping')}${select('words','Amount in Words',[['indian','Indian'],['international','International'],['none','Do not print']])}
    ${section('Footer')}${check('footerDescription','Print Description')}${check('terms','Print Terms and Conditions')}<details><summary>Terms and Conditions &gt;</summary><textarea aria-label="Terms and conditions" oninput="updatePrintTerms(this.value)">${e(store.settings.terms||'')}</textarea></details>${check('receivedBy','Print Received by details')}${check('deliveredBy','Print Delivered by details')}${check('signature','Print Signature Text')}<label class="ps-row">Signature text<input aria-label="Signature text" value="${e(o.signatureText)}" oninput="savePrintOption('signatureText',this.value)"></label><button class="ps-link" onclick="document.getElementById('ps_signatureFile').click()">Change Signature</button><input hidden id="ps_signatureFile" type="file" accept="image/png,image/jpeg,image/webp" onchange="printSettingsSignature(this)">${check('barcode','Invoice Barcode')}${check('qr','Receipt QR Code')}${check('bank','Bank Details')}<details><summary>Bank Details &gt;</summary>${['bankName','bankAccount','bankCode'].map((field,i)=>`<label class="ps-row">${['Bank name','Account number','Bank code'][i]}<input aria-label="${['Bank name','Account number','Bank code'][i]}" value="${e(store.business[field]||'')}" oninput="updatePrintCompany('${field}',this.value)"></label>`).join('')}</details>
    ${section('Printer Setup')}<p class="ps-help">${window.karobarDesktop?'Select an installed Windows printer.':'Browser printing uses your system print dialog. Copies can also be selected there.'}</p>
    ${thermal?`<label for="set_printerName">Thermal printer</label><select class="ps-printer" id="set_printerName" onchange="store.settings.thermalPrinterName=this.value;persist()"></select><div class="ps-actions"><button onclick="refreshThermalPrinters()">Refresh printers</button><button onclick="printSettingsTest()">Test print</button></div><div id="set_printerStatus" role="status" class="ps-help"></div><p class="ps-help">Paper roll widths are 58 / 80 / 104 mm; printable areas are smaller. Cut and drawer commands require an ESC/POS-compatible printer in the Windows app.</p>`:`<div class="ps-actions"><button onclick="printSettingsTest()">Test print / PDF</button></div>`}
    </div><div class="ps-preview"><div class="ps-preview-label">Sample preview · your saved business details · ${e(KarobarPrint.themes[o.mode][o.theme])}</div><div id="psPaper" class="ps-preview-paper"></div></div></div></section>`;
  updatePrintSettingsPreview();
  const selected=content.querySelector('.ps-theme[aria-pressed=true]');if(selected)selected.parentElement.scrollLeft=Math.max(0,selected.offsetLeft-selected.parentElement.offsetLeft-selected.parentElement.clientWidth+selected.offsetWidth);
  const workspace=content.querySelector('.ps-workspace');
  workspace.setAttribute('role','dialog');workspace.setAttribute('aria-modal','true');
  workspace.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setTab='general';vSettings();return;}
    if(event.key!=='Tab')return;
    const controls=Array.from(workspace.querySelectorAll('button,input,select,textarea,summary,[tabindex="0"]')).filter(el=>!el.disabled&&el.getClientRects().length);
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  if(thermal)refreshThermalPrinters();
  if(!hasPermission('edit','settings'))content.querySelectorAll('.ps-controls input,.ps-controls select,.ps-controls textarea,.ps-controls button').forEach(el=>el.disabled=true);
}
async function printSettingsTest(){await printSaleDocument(KarobarPrint.sample(),true);}
async function rasterizePrintWindow(win,widthMm){
  const invoice=win.document.querySelector('.kp-invoice');
  const rect=invoice.getBoundingClientRect(),width=Math.ceil(rect.width),height=Math.ceil(rect.height);
  if(height>7500)throw new Error('Receipt too long for image printing. Select Text Printing.');
  const clone=invoice.cloneNode(true);
  // Embed assets before SVG rasterization; no remote image references in the bitmap.
  const originals=Array.from(invoice.querySelectorAll('img'));
  for(const [i,img] of Array.from(clone.querySelectorAll('img')).entries()){
    const original=originals[i];await original.decode();
    const c=win.document.createElement('canvas');c.width=original.naturalWidth;c.height=original.naturalHeight;
    c.getContext('2d').drawImage(original,0,0);img.src=c.toDataURL('image/png');
  }
  const serialized=new XMLSerializer().serializeToString(clone);
  const css=Array.from(win.document.querySelectorAll('style'),s=>s.textContent).join('\n');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width*2}" height="${height*2}" viewBox="0 0 ${width} ${height}"><foreignObject width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml"><style>${css.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</style>${serialized}</div></foreignObject></svg>`;
  const bitmap=new Image();bitmap.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await bitmap.decode();
  const canvas=win.document.createElement('canvas');canvas.width=width*2;canvas.height=height*2;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0);
  const result=win.document.createElement('img');result.src=canvas.toDataURL('image/png');result.style.width=widthMm+'mm';result.style.display='block';
  win.document.body.replaceChildren(result);await result.decode();
}
async function printSaleDocument(sale,isTest=false,forceBrowser=false){
  const o=currentPrintOptions();
  const wrapper=document.createElement('div');wrapper.innerHTML=buildInvoiceHTML(sale);fillPrintBarcodes(wrapper);
  const style=printCSS();
  const page=o.mode==='thermal'?`size:${o.width}mm auto;margin:2mm`:`size:${o.paper} ${o.orientation};margin:10mm`;
  const contentHtml=wrapper.innerHTML;
  const documentHtml=body=>`<!doctype html><html><head><meta charset="utf-8"><title>${KarobarPrint.escape(invoiceFileName(sale).replace(/\.pdf$/i,''))}</title><style>${style}\n@page{${page}}body{margin:0;padding:0}</style></head><body>${body}</body></html>`;
  try{
    if(!forceBrowser&&o.mode==='thermal'&&window.karobarDesktop?.printInvoice){
      const printerName=store.settings.thermalPrinterName;
      if(!printerName)throw new Error('Select a thermal printer in Print Settings first.');
      const result=await window.karobarDesktop.printInvoice({printerName,html:documentHtml(contentHtml),paperWidthMm:o.width,copies:o.copies,printingType:o.printingType,autoCut:o.autoCut,openDrawer:o.openDrawer});
      if(!result.ok)throw new Error(result.error);
      const message=result.warning||'Print job accepted by Windows spooler. Check the receipt.';
      toast(message);const status=document.getElementById('set_printerStatus');if(status)status.textContent=message;
      logDiagnostic('print',(isTest?'Test':'Invoice '+sale.no)+': '+message);return;
    }
    if(o.autoCut||o.openDrawer)toast('Cut and drawer commands require the Windows app and an ESC/POS printer.');
    const win=window.open('','_blank','width=1000,height=900');if(!win)throw new Error('Print window blocked. Allow popups and try again.');
    // Each copy is a complete page/document; print dialog should remain at one copy.
    const copies=o.mode==='thermal'?o.copies:(o.originalDuplicate?2:1);
    win.document.write(documentHtml(Array.from({length:copies},(_,i)=>`<div class="${i?'kp-copy-page':''}">${contentHtml.replace('ORIGINAL / DUPLICATE',i?'DUPLICATE':'ORIGINAL')}</div>`).join('')));win.document.close();
    await Promise.all(Array.from(win.document.images,img=>img.decode().catch(()=>{})));
    await win.document.fonts.ready;
    if(o.mode==='thermal'&&o.printingType==='image'){
      await rasterizePrintWindow(win,o.width);
      const first=win.document.body.firstElementChild;
      for(let i=1;i<copies;i++){const copy=first.cloneNode(true);copy.className='kp-copy-page';win.document.body.appendChild(copy);}
    }
    win.focus();win.print();
  }catch(error){toast('Print failed: '+error.message);logDiagnostic('print',error.message);const status=document.getElementById('set_printerStatus');if(status)status.textContent=error.message;}
}

async function printSettingsSignature(input){
 if(await saveBusinessImage(input.files[0],'signature'))updatePrintSettingsPreview();input.value='';
}

function invoiceFileName(sale){
 const clean=value=>String(value||'').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').replace(/\s+/g,' ').replace(/[. ]+$/g,'').trim().slice(0,70);
 return ['Invoice',clean(sale.no)||'Receipt',clean(sale.party)].filter(Boolean).join('-')+'.pdf';
}
async function downloadSalePDF(sale){
 const o=currentPrintOptions(),filename=invoiceFileName(sale);
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;left:-20000px;top:0;width:1200px;height:1000px;border:0';document.body.appendChild(frame);
 try{
  if(typeof html2pdf!=='function')throw new Error('PDF library is unavailable. Refresh and try again.');
  const doc=frame.contentDocument;
  doc.open();doc.write('<!doctype html><html><head><style>'+printCSS()+'body{margin:0;background:white}</style></head><body></body></html>');doc.close();
  const host=doc.createElement('div');doc.body.appendChild(host);
  const thermal=o.mode==='thermal',margin=thermal?2:10;
  const sizes={a4:[210,297],a5:[148,210],letter:[215.9,279.4]};
  let [width,height]=sizes[o.paper];if(!thermal&&o.orientation==='landscape')[width,height]=[height,width];
  if(thermal)width=o.width;
  host.style.width=(width-2*margin)+'mm';host.innerHTML=buildInvoiceHTML(sale);fillPrintBarcodes(host);
  const invoice=host.querySelector('.kp-invoice');invoice.style.width='100%';if(thermal)invoice.style.padding='0';
  if(o.originalDuplicate&&!thermal){invoice.innerHTML=invoice.innerHTML.replace('ORIGINAL / DUPLICATE','ORIGINAL');const duplicate=invoice.cloneNode(true);duplicate.innerHTML=duplicate.innerHTML.replace('ORIGINAL','DUPLICATE');duplicate.style.breakBefore='page';host.appendChild(duplicate);}
  await Promise.all(Array.from(host.querySelectorAll('img'),img=>img.decode()));await doc.fonts.ready;
  if(thermal)height=Math.max(50,Math.ceil(host.getBoundingClientRect().height/3.779527559)+margin*2+2);
  await html2pdf().set({filename,margin,image:{type:'jpeg',quality:0.98},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:[width,height],orientation:width>height?'landscape':'portrait'},pagebreak:{mode:['css','legacy'],avoid:['.kp-items tr','.kp-total-row','.kp-footer section']}}).from(host).save();
 }catch(error){toast('PDF download failed: '+error.message);}finally{frame.remove();}
}
