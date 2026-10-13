// Run with Playwright installed or NODE_PATH pointing to its package directory.
// Uses an isolated browser profile, synthetic data, and blocks external requests.
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{const p=path.join(root,new URL(req.url,'http://localhost').pathname);fs.readFile(p,(e,b)=>{if(e){res.statusCode=404;res.end();return;}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')||r.request().url().startsWith('data:')?r.continue():r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  const result=await page.evaluate(async()=>{
   if(window.fbAuth)await new Promise(resolve=>{const stop=window.fbAuth.onAuthStateChanged(()=>{stop();resolve();});});
   const sample={no:'TEST-100',date:'13/10/2026',party:'Test customer',rows:[{item:'Cotton Fabric / کپڑا',qty:100,price:125,disc:10}],total:11250,received:12000};
   const logoCanvas=document.createElement('canvas');logoCanvas.width=120;logoCanvas.height=40;const logoCtx=logoCanvas.getContext('2d');logoCtx.fillStyle='black';logoCtx.font='bold 20px Arial';logoCtx.fillText('LOGO',10,28);
   store.business={name:'KAROBAR TEST',phone:'03001234567',email:'test@example.invalid',logo:logoCanvas.toDataURL()};store.items=[];store.parties=[];store.sales=[sample];store.settings={...defaults().settings,itemQtyDec:0};
   const raster=await rawLogo(store.business.logo,58);
   const checks=[];
   for(const width of ['2inch','3inch','4inch','custom']){
    const r=thermalReceipt(sample,{...store.settings,pageSize:width,customWidth:72},store.business,[],[]);
    const f=document.createElement('iframe');f.style.width='900px';document.body.appendChild(f);
    const loaded=new Promise(resolve=>f.onload=resolve);f.srcdoc=preparePrintHTML(r.html,r.css);await loaded;
    const d=f.contentDocument,receipt=d.querySelector('.receipt');
    checks.push({width:r.widthMm,actual:receipt.getBoundingClientRect().width,overflow:receipt.scrollWidth>receipt.clientWidth+1,barcode:d.querySelectorAll('svg rect').length,text:d.body.textContent});f.remove();
   }
   let printedJob;window.karobarDesktop={printHTML:async j=>{printedJob=j;return {ok:true,message:'TEST captured'};}};
   await karobarPrintInvoice(sample);const thermalJob=printedJob;
   store.settings.thermalDefault=false;await karobarPrintInvoice(sample);const regularJob=printedJob;
   const label='<div class="bc-p-lbl" data-code="123456"><div>Sample item</div><svg></svg></div>';
   await karobarPrintLabels(label+label,{w:50,h:30},true);const labelJob=printedJob;
   setTab='print';vSettings();
   document.getElementById('fbAuthModal').style.display='none';
   return {checks,thermalJob,regularJob,labelJob,raster,settingsPanel:!!document.getElementById('printerDevices'),barcodeLocal:typeof JsBarcode==='function',qrLocal:typeof QRCode==='function'};
  });
  assert.equal(result.barcodeLocal,true);assert.equal(result.qrLocal,true);assert.equal(result.settingsPanel,true);
  for(const c of result.checks){assert.equal(c.overflow,false);assert.ok(Math.abs(c.actual-c.width*96/25.4)<1);assert.ok(c.barcode>0);assert.match(c.text,/100 x/);}
  assert.equal(result.thermalJob.kind,'thermal');assert.equal(result.regularJob.kind,'regular');assert.match(result.regularJob.html,/data:image\/png;base64/);
  assert.match(result.thermalJob.html,/class="logo"/);assert.equal(Buffer.from(result.raster.data,'base64').length,result.raster.widthBytes*result.raster.height);
  assert.equal(result.labelJob.kind,'label');assert.equal(result.labelJob.widthMm,50);assert.match(result.labelJob.html,/Company logo/);
  fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
  await page.screenshot({path:path.join(root,'test-output/printer-settings.png'),fullPage:true});
  fs.writeFileSync(path.join(root,'test-output/thermal.html'),result.thermalJob.html);fs.writeFileSync(path.join(root,'test-output/regular.html'),result.regularJob.html);
  fs.writeFileSync(path.join(root,'test-output/labels.html'),result.labelJob.html);
  const receiptPage=await browser.newPage();await receiptPage.setContent(result.thermalJob.html);await receiptPage.screenshot({path:path.join(root,'test-output/receipt.png'),fullPage:true});
  console.log(JSON.stringify({widths:result.checks.map(({width,overflow,barcode})=>({width,overflow,barcode})),offlineBarcode:result.barcodeLocal,offlineQR:result.qrLocal,settingsPanel:result.settingsPanel,pageErrors:errors},null,2));
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
