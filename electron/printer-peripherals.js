const fs=require('fs');
const os=require('os');
const path=require('path');
const {execFile}=require('child_process');
const {peripheralCommands}=require('./printer');
async function sendPeripheralCommands(printerName,options){
  const data=peripheralCommands(options);if(!data.length)return;
  if(process.platform!=='win32')throw new Error('Cut and drawer commands require Windows.');
  const dir=await fs.promises.mkdtemp(path.join(os.tmpdir(),'karobar-print-'));
  const jobPath=path.join(dir,'job.json');
  try{
    await fs.promises.writeFile(jobPath,JSON.stringify({printerName,data:data.toString('base64')}));
    await new Promise((resolve,reject)=>execFile('powershell.exe',['-NoProfile','-NonInteractive','-File',path.join(__dirname,'printer-peripherals.ps1'),'-JobPath',jobPath],{windowsHide:true,timeout:15000},(error,stdout,stderr)=>error?reject(new Error(stderr.trim()||error.message)):resolve()));
  }finally{await fs.promises.unlink(jobPath).catch(()=>{});await fs.promises.rmdir(dir).catch(()=>{});}
}
module.exports={sendPeripheralCommands};
