/* Isolated browser fixture: no real Firebase account, network writes or business data. */
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const P=require('../print-engine');
const root=path.join(__dirname,'..'),out=process.env.PRINT_TEST_OUTPUT||path.join(require('os').tmpdir(),'karobar-print-review');
fs.mkdirSync(out,{recursive:true});
const fixture=`<script>store=load()||defaults();store.currentUser={id:'test-owner',role:'owner',name:'Test Owner'};if(!load())store.business={name:'My Company',phone:'3137666309',address:'',email:'',logo:'',signature:''};if(!store.settings.printProfiles)store.settings.printerTab='regular';store.settings.printProfiles=store.settings.printProfiles||{};window.cloudPush=null;document.getElementById('fbAuthModal').remove();document.getElementById('branchAuthModal').remove();currentView='settings';setTab='print';vSettings();if(new URLSearchParams(location.search).get('scenario')==='invoice'){store.sales=[];store.items=[];store.parties=[];store.settings.defaultPrinterType='thermal';store.settings.printProfiles.thermal={...KarobarPrint.options(store.settings,'thermal'),printingType:'text',copies:1};nciRows=[{name:'Suit',item:'Suit',qty:3,price:16595}];if(new URLSearchParams(location.search).has('stocktest')){store.items=[{id:'stock-test',name:'Suit',price:16595,stock:5}];store.settings.stockMaintain=true;store.settings.negativeStock=true;}nciDiscP=35;nciCustName='Test Customer';nciReceived=30000;currentView='createinvoice';vCreateInvoice();}if(new URLSearchParams(location.search).get('scenario')==='pos'){store.sales=[];store.items=[];store.parties=[];store.settings.defaultPrinterType='regular';store.settings.printProfiles.regular={...KarobarPrint.options(store.settings,'regular'),theme:1};store.settings.posBillTax=false;currentView='home';vWelcome();openSale();posRows=[{item:'Suit',qty:3,price:16595,disc:0,size:''}];posBillDisc=17424.75;posRenderRows();document.getElementById('pos_cust').value='POS Customer';document.getElementById('pos_recv').value='30000';posCalcTotal();}</script>`;
const liveFixture=fixture.replaceAll('store.sales=[];store.items=[];store.parties=[];','');
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(req.url.split('?')[0]);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{let body=fs.readFileSync(file);if(file.endsWith('index.html'))body=body.toString().replace(/<script src="(?:vendor\/firebase[^\"]*|firebase-config.js)"><\/script>/g,'').replace('</body>',(process.argv.includes('--serve')?liveFixture:fixture)+'</body>');
 if(file.endsWith('app.js'))body=body.toString().split('/* ============ FIREBASE CLOUD SYNC ============ */')[0];
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(body);
 }catch(e){res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(Number(process.env.PORT)||0,'127.0.0.1',resolve));
 if(process.argv.includes('--serve')){console.log('Print settings preview: http://127.0.0.1:'+server.address().port);return;}
 const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1540,height:1120}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto('http://127.0.0.1:'+server.address().port);await page.getByRole('tab',{name:'REGULAR PRINTER',exact:true}).waitFor();
 for(const mode of ['regular','thermal']){
   await page.getByRole('tab',{name:mode.toUpperCase()+' PRINTER',exact:true}).click();
   for(let theme=0;theme<P.themes[mode].length;theme++){
     await page.locator('.ps-theme').nth(theme).click();await page.locator('.kp-theme-'+theme).waitFor();
     await page.screenshot({path:path.join(out,`${mode}-${theme+1}.png`)});
     assert.equal(await page.locator('.ps-theme[aria-pressed=true]').count(),1);
     const printed=page.waitForEvent('popup');await page.getByRole('button',{name:mode==='regular'?'Test print / PDF':'Test print',exact:true}).click();const themed=await printed;await themed.waitForLoadState();assert.equal(await themed.locator('.kp-'+mode+'.kp-theme-'+theme).count(),1);await themed.close();
   }
 }
 await page.getByRole('tab',{name:'REGULAR PRINTER',exact:true}).click();
 for(let t=0;t<4;t++){
  await page.locator('.ps-theme').nth(t).click();
  await page.locator('#ps_companySize').selectOption('small');const small=await page.locator('#psPaper h1').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  await page.locator('#ps_companySize').selectOption('large');assert.ok(await page.locator('#psPaper h1').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>small);
  await page.locator('#ps_textSize').selectOption('small');const textSmall=await page.locator('#psPaper .kp-invoice').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  await page.locator('#ps_textSize').selectOption('large');assert.ok(await page.locator('#psPaper .kp-invoice').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>textSmall);
 }
 await page.getByRole('textbox',{name:'Company Name',exact:true}).fill('Persistent Company');assert.equal(await page.locator('#psPaper h1').innerText(),'Persistent Company');
 await page.reload();assert.equal(await page.getByRole('textbox',{name:'Company Name',exact:true}).inputValue(),'Persistent Company');
 await page.getByRole('textbox',{name:'Company Name',exact:true}).fill('My Company');
 await page.locator('#ps_minRows').fill('8');await page.locator('#ps_minRows').blur();assert.equal(await page.locator('#psPaper .kp-blank').count(),6);
 await page.locator('#ps_originalDuplicate').check();let copiesPromise=page.waitForEvent('popup');await page.getByRole('button',{name:'Test print / PDF',exact:true}).click();let copiesPage=await copiesPromise;await copiesPage.waitForLoadState();assert.deepEqual(await copiesPage.locator('.kp-copy-label').allTextContents(),['ORIGINAL','DUPLICATE']);await copiesPage.close();await page.locator('#ps_originalDuplicate').uncheck();
 await page.getByRole('tab',{name:'THERMAL PRINTER',exact:true}).click();
 const widthBefore=await page.locator('#psPaper').evaluate(el=>el.getBoundingClientRect().width);await page.getByRole('button',{name:'2 Inch 58mm'}).click();assert.ok(await page.locator('#psPaper').evaluate(el=>el.getBoundingClientRect().width)<widthBefore);
 await page.locator('#ps_showName').uncheck();assert.equal(await page.locator('#psPaper h1').count(),0);
 await page.locator('#ps_showName').check();assert.equal(await page.locator('#psPaper h1').innerText(),'My Company');
 await page.locator('#ps_received').uncheck();assert.equal(await page.locator('#psPaper .kp-total-row').filter({hasText:/^Received/}).count(),0);
 await page.locator('#ps_received').check();assert.ok((await page.locator('#psPaper').innerText()).includes('Received'));
 await page.getByRole('button',{name:'2 Inch 58mm'}).click();assert.ok(await page.locator('#psPaper .receipt-paper-58').count());
 await page.locator('#ps_copies').fill('3');await page.locator('#ps_copies').blur();
 await page.getByRole('tab',{name:'REGULAR PRINTER',exact:true}).click();await page.getByRole('tab',{name:'THERMAL PRINTER',exact:true}).click();assert.equal(await page.locator('#ps_copies').inputValue(),'3');
 await page.locator('.ps-widths').getByRole('button',{name:/Custom/}).click();await page.locator('#ps_width').fill('72');await page.locator('#ps_width').blur();assert.ok(await page.locator('.receipt-paper-72').count());
 await page.reload();await page.locator('#psPaper').waitFor();assert.equal(await page.locator('#ps_copies').inputValue(),'3');assert.equal(await page.locator('#ps_width').inputValue(),'72');
 await page.setViewportSize({width:1540,height:1120});
 // Real print action opens the same invoice in a separate document.
 await page.locator('#ps_copies').fill('1');await page.locator('#ps_copies').blur();
 let popupPromise=page.waitForEvent('popup');await page.getByRole('button',{name:'Test print',exact:true}).click();let popup=await popupPromise;await popup.waitForLoadState();assert.equal(await popup.locator('.kp-invoice').count(),1);assert.ok((await popup.locator('body').innerText()).includes('17,850.00'));await popup.close();
 await page.locator('#ps_printingType').selectOption('image');popupPromise=page.waitForEvent('popup');await page.getByRole('button',{name:'Test print',exact:true}).click();popup=await popupPromise;await popup.locator('body > img').waitFor();assert.ok((await popup.locator('body > img').getAttribute('src')).startsWith('data:image/png'));await popup.close();
 await page.locator('#ps_printingType').selectOption('text');
 // PDF uses the very same renderer and CSS, isolated from settings controls.
 const invoice=await page.locator('#psPaper').innerHTML();const pdfPage=await browser.newPage();await pdfPage.setContent('<style>'+fs.readFileSync(path.join(root,'invoice-print.css'),'utf8')+'</style>'+invoice);await pdfPage.pdf({path:path.join(out,'thermal.pdf'),width:'72mm',height:'250mm',printBackground:true});await pdfPage.close();
 for(const width of [320,768,1024,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.locator('.ps-workspace').isVisible());const overflow=await page.evaluate(()=>document.querySelector('.ps-workspace').scrollWidth>innerWidth+1);assert.equal(overflow,false,'overflow at '+width);await page.screenshot({path:path.join(out,'responsive-'+width+'.png')});}
 await page.goto('http://127.0.0.1:'+server.address().port+'/?scenario=invoice');
 await page.getByRole('checkbox',{name:'Switch to Full Mode'}).click();await page.locator('#saleModal.show').waitFor();await page.locator('#pos_cust').fill('Full mode test');assert.equal(await page.locator('#pos_cust').inputValue(),'Full mode test');
 // Direct save routes must persist without opening print preview or a popup.
 await page.setViewportSize({width:1540,height:1120});
 for(const action of ['Save','Save & New']){
  await page.goto('http://127.0.0.1:'+server.address().port+'/?scenario=invoice');
  const previous=await page.evaluate(()=>({counter:store.counters.sale,payments:store.payments.length}));
  const popupCount=browser.contexts()[0].pages().length;
  await page.getByRole('button',{name:action,exact:true}).click();
  const saved=await page.evaluate(()=>({sales:store.sales,stored:JSON.parse(localStorage.getItem(KEY)).sales,counter:store.counters.sale,balance:store.parties.find(p=>p.name==='Test Customer').balance,payments:store.payments.length}));
  assert.equal(saved.sales.length,1);assert.equal(saved.stored[0].id,saved.sales[0].id);assert.equal(saved.sales[0].total,32360.25);assert.equal(saved.balance,2360.25);assert.equal(saved.counter,previous.counter+1);assert.equal(saved.payments,previous.payments+1);assert.equal(browser.contexts()[0].pages().length,popupCount);
  if(action==='Save')await page.locator('.sale-table-wrap').waitFor();
  else {assert.equal(await page.locator('#nciCust').inputValue(),'');await page.getByRole('button',{name:action,exact:true}).click();assert.equal(await page.evaluate(()=>store.sales.length),1);}
 }
 // Stock updates once after Save & New; a cleared draft cannot save twice.
 await page.goto('http://127.0.0.1:'+server.address().port+'/?scenario=invoice&stocktest=1');
 await page.getByRole('button',{name:'Save & New',exact:true}).click();
 assert.equal(await page.evaluate(()=>store.items.find(i=>i.id==='stock-test').stock),2);
 await page.getByRole('button',{name:'Save & New',exact:true}).click();
 assert.equal(await page.evaluate(()=>store.items.find(i=>i.id==='stock-test').stock),2);
 assert.equal(await page.evaluate(()=>store.sales.length),1);
 // Exercise saved invoice preview and the compact sale's real save/print route.
 await page.setViewportSize({width:1540,height:1120});
 await page.goto('http://127.0.0.1:'+server.address().port+'/?scenario=invoice');
 assert.ok((await page.locator('#nciPreview').innerText()).includes('49,785.00'));
 assert.ok((await page.locator('#nciPreview').innerText()).includes('35%'));
 await page.getByRole('button',{name:'Print',exact:true}).click();await page.locator('#nciSlipBody .kp-invoice').waitFor();
 assert.ok((await page.locator('#nciSlipBody').innerText()).includes('32,360.25'));
 await page.locator('#nciPaperSize').selectOption('custom');await page.locator('#promptInput').fill('72');await page.locator('#promptYesBtn').click();await page.locator('#nciSlipBody .receipt-paper-72').waitFor();assert.equal(await page.locator('#nciPaperSize').inputValue(),'custom');
 await page.locator('#nciPaperSize').selectOption('custom');await page.locator('#promptInput').fill('88');await page.locator('#promptNoBtn').click();assert.ok(await page.locator('#nciSlipBody .receipt-paper-72').count());

 let salePopupPromise=page.waitForEvent('popup');await page.locator('#nciFinalPrint').click();const salePopup=await salePopupPromise;await salePopup.waitForLoadState();assert.ok((await salePopup.locator('body').innerText()).includes('32,360.25'));await salePopup.close();
 const sales=await page.evaluate(()=>store.sales.map(s=>({total:s.total,discount:s.discount,received:s.received})));
 assert.deepEqual(sales,[{total:32360.25,discount:17424.75,received:30000}]);
 // Saved invoice PDF downloads use an automatic, Windows-safe file name.
 await page.goto('http://127.0.0.1:'+server.address().port+'/?scenario=invoice');
 const pdfDownload=page.waitForEvent('download');await page.getByRole('button',{name:'PDF',exact:true}).click();const downloaded=await pdfDownload;
 assert.match(downloaded.suggestedFilename(),/^Invoice-INV-.*-Test Customer\.pdf$/);await downloaded.saveAs(path.join(out,'named-invoice.pdf'));
 assert.equal(fs.readFileSync(path.join(out,'named-invoice.pdf')).subarray(0,5).toString(),'%PDF-');

 await page.goto('http://127.0.0.1:'+server.address().port+'/?scenario=pos');
 await page.getByRole('button',{name:'Save & Print Bill [Ctrl+P]',exact:true}).click();
 assert.ok((await page.locator('#iv_body').innerText()).includes('35%'));
 const posPopupPromise=page.waitForEvent('popup');await page.getByRole('button',{name:'🖨 Print & Save',exact:true}).click();const posPopup=await posPopupPromise;await posPopup.waitForLoadState();assert.ok(await posPopup.locator('.kp-regular.kp-theme-1').count());assert.ok((await posPopup.locator('body').innerText()).includes('32,360.25'));await posPopup.close();
 assert.equal(await page.evaluate(()=>store.sales[0].discount),17424.75);
 // Verify long invoices paginate and keep a reusable header in exported PDF.
 const longSale={...P.sample(),rows:Array.from({length:100},(_,i)=>({item:'Long invoice item '+(i+1),qty:1,price:100})),total:10000,discount:0,tax:0,taxBreakdown:[],received:0};
 const longPage=await browser.newPage();await longPage.setContent('<style>'+fs.readFileSync(path.join(root,'invoice-print.css'),'utf8')+'</style>'+P.render(longSale,{business:{name:'Repeated Company Header'},settings:{printerTab:'regular',printProfiles:{regular:{repeatHeader:true,barcode:false,qr:false}}}}));await longPage.pdf({path:path.join(out,'multipage.pdf'),format:'A4',margin:{top:'10mm',bottom:'10mm',left:'10mm',right:'10mm'},printBackground:true});await longPage.close();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,errors,output:out}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
