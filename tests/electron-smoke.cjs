// Run with node_modules/electron/dist/electron.exe tests/electron-smoke.cjs.
// No physical print jobs are submitted. Uses an isolated desktop profile.
const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path');
const out=path.resolve(__dirname,'../test-output');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',path.join(out,'electron-profile'));
app.disableHardwareAcceleration();
app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{
 const {renderJob,listPrinters}=require('../electron/printing');
 try{
  for(const [name,options] of [['thermal',{kind:'thermal',widthMm:80}],['regular',{kind:'regular',paper:'A4'}],['labels',{kind:'label',widthMm:50,heightMm:30}]]){
   const html=fs.readFileSync(path.join(out,name+'.html'),'utf8');
   const pdf=await renderJob({html,...options},'pdf');
   if(pdf.slice(0,4).toString()!=='%PDF')throw new Error('Invalid PDF');
   fs.writeFileSync(path.join(out,name+'.pdf'),pdf);
  }
  const w=new BrowserWindow({show:false,webPreferences:{sandbox:true}});
  const printers=await listPrinters(w.webContents);w.destroy();
  const result={electron:process.versions.electron,pdfs:['thermal.pdf','regular.pdf','labels.pdf'],installedPrinters:printers.map(p=>({name:p.name,state:p.state}))};
  fs.writeFileSync(path.join(out,'electron-smoke.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));app.exit(0);
 }catch(e){fs.writeFileSync(path.join(out,'electron-smoke-error.txt'),e.stack);console.error(e);app.exit(1);}
});
