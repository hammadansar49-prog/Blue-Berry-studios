'use strict';
const { BrowserWindow, ipcMain, dialog, app } = require('electron');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { windowsStatus, validateJob, escpos } = require('./print-core');
const isWin = process.platform === 'win32';

function command(file, args) {
  return new Promise((resolve, reject) => execFile(file, args,
    { windowsHide:true, timeout:30000, maxBuffer:4*1024*1024, encoding:'utf8' },
    (err, stdout, stderr) => err ? reject(new Error((stderr || err.message).trim())) : resolve(stdout)));
}
async function powershell(script, args = []) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'karobar-print-'));
  try {
    const file = path.join(dir, 'run.ps1');
    await fs.writeFile(file, '\ufeff' + script, 'utf8');
    return await command(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe'),
      ['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',file,...args]);
  } finally { await fs.rm(dir, { recursive:true, force:true }); }
}

// XML serialization works on PowerShell 2; ConvertTo-Json does not.
const statusScript = `$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
Get-WmiObject Win32_Printer | ForEach-Object {
  $name=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($_.Name))
  [Console]::WriteLine($name+"|"+$_.WorkOffline+"|"+$_.PrinterStatus+"|"+$_.DetectedErrorState)
}`;

async function listPrinters(wc) {
  const installed = await wc.getPrintersAsync();
  let states = new Map();
  if (isWin) {
    try {
      const output = await powershell(statusScript);
      output.trim().split(/\r?\n/).forEach(line => {
        const [name,offline,status,error] = line.split('|');
        if (name) states.set(Buffer.from(name,'base64').toString('utf8'), windowsStatus({WorkOffline:offline==='True',PrinterStatus:status,DetectedErrorState:error}));
      });
    } catch (_) { /* Missing WMI must not masquerade as ready. */ }
  }
  return installed.map(p => ({name:p.name, displayName:p.displayName || p.name, isDefault:p.isDefault,
    ...(states.get(p.name) || {state:'unknown',detail:'Installed; physical connection unverified'})}));
}

// Printer name and bytes are passed as arguments, never interpolated into code.
const rawScript = `param([string]$Printer,[string]$Data)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
public class KarobarRaw {
 [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] public class DOC { public string name="KAROBAR receipt"; public string output=null; public string type="RAW"; }
 [DllImport("winspool.drv",EntryPoint="OpenPrinterW",SetLastError=true,CharSet=CharSet.Unicode)] static extern bool OpenPrinter(string n,out IntPtr h,IntPtr d);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool ClosePrinter(IntPtr h);
 [DllImport("winspool.drv",EntryPoint="StartDocPrinterW",SetLastError=true,CharSet=CharSet.Unicode)] static extern int StartDocPrinter(IntPtr h,int level,[In] DOC d);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool EndDocPrinter(IntPtr h);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool StartPagePrinter(IntPtr h);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool EndPagePrinter(IntPtr h);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool WritePrinter(IntPtr h,IntPtr data,int count,out int written);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool AbortPrinter(IntPtr h);
 static void Check(bool ok) { if(!ok) throw new Win32Exception(Marshal.GetLastWin32Error()); }
 public static void Send(string name,byte[] data) {
  IntPtr h; Check(OpenPrinter(name,out h,IntPtr.Zero));
  IntPtr mem=IntPtr.Zero; bool started=false;
  try {
   Check(StartDocPrinter(h,1,new DOC())>0); started=true; Check(StartPagePrinter(h));
   mem=Marshal.AllocHGlobal(data.Length); Marshal.Copy(data,0,mem,data.Length);
   int offset=0;
   while(offset<data.Length) { int written; Check(WritePrinter(h,new IntPtr(mem.ToInt64()+offset),data.Length-offset,out written)); if(written<=0) throw new Exception("Printer accepted no data"); offset+=written; }
   Check(EndPagePrinter(h)); Check(EndDocPrinter(h)); started=false;
  } finally { if(started) AbortPrinter(h); if(mem!=IntPtr.Zero) Marshal.FreeHGlobal(mem); ClosePrinter(h); }
 }
}
'@
[KarobarRaw]::Send($Printer,[IO.File]::ReadAllBytes($Data))`;

async function rawPrint(deviceName, bytes) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'karobar-raw-'));
  try {
    const file = path.join(dir,'receipt.bin');
    await fs.writeFile(file,bytes);
    if (isWin) await powershell(rawScript,[deviceName,file]);
    else await command('lp',['-d',deviceName,'-o','raw',file]);
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
}

async function renderJob(j, action) {
  const width = j.kind === 'regular' ? 800 : Math.ceil(j.widthMm * 96 / 25.4);
  const win = new BrowserWindow({show:false,width,height:800,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
  const wc = win.webContents;
  wc.setWindowOpenHandler(() => ({action:'deny'}));
  wc.on('will-navigate', e => e.preventDefault());
  let timer;
  try {
    return await Promise.race([(async () => {
      // The renderer sends already rendered SVGs. Print documents cannot run scripts,
      // contact the network or load arbitrary local files.
      const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; script-src 'none'">`;
      // Prepend the policy so even malformed submitted HTML cannot precede it.
      await wc.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<!doctype html>' + csp + j.html.replace(/<!doctype[^>]*>/ig,'')));
      await wc.executeJavaScript(`Promise.all([document.fonts.ready,...Array.from(document.images).map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r}))])`);
      let pageSize = j.paper;
      if (j.kind !== 'regular') {
        const heightMm = j.kind === 'label' ? j.heightMm : await wc.executeJavaScript('Math.ceil((document.querySelector(".receipt") || document.body).getBoundingClientRect().height * 25.4 / 96 + 2)');
        if (heightMm > 2000) throw new Error('Receipt exceeds 2 metres; use regular paper for this document');
        pageSize = {width:Math.round(j.widthMm*1000),height:Math.round(Math.max(10,heightMm)*1000)};
        await wc.insertCSS(`@page { size: ${j.widthMm}mm ${Math.max(10,heightMm)}mm; margin:0; }`);
      }
      if (action === 'pdf') {
        const page = typeof pageSize === 'string' ? pageSize : {width:pageSize.width/25400,height:pageSize.height/25400};
        return await wc.printToPDF({printBackground:true,pageSize:page,preferCSSPageSize:true});
      }
      await new Promise((resolve,reject) => wc.print({silent:j.silent,deviceName:j.deviceName || '',printBackground:true,
        pageSize,margins:{marginType:j.kind==='regular'?'default':'none'}}, (ok,reason) => ok ? resolve() : reject(new Error(reason || 'Print cancelled or failed'))));
      return {ok:true,message:'Print job submitted to the operating system'};
    })(), new Promise((_,reject) => { timer=setTimeout(()=>reject(new Error('Print timed out; check the queue before retrying')),120000); })]);
  } finally { clearTimeout(timer); if(!win.isDestroyed()) win.destroy(); }
}

function registerPrinting(getMainWindow) {
  let busy = false;
  const trusted = (event, main) => main && event.sender === main.webContents && event.senderFrame === main.webContents.mainFrame &&
    event.senderFrame.url.split('#')[0] === main.karobarAppURL.split('#')[0];
  let configWrites=Promise.resolve();
  ipcMain.handle('karobar-printer-config', async (event, config) => {
    const main=getMainWindow();
    if(!trusted(event,main))return {ok:false,error:'Untrusted printer settings request'};
    const file=path.join(app.getPath('userData'),'printers.json');
    try {
      if(config!==undefined){
        const clean={};
        for(const key of ['thermal','regular','label']){
          const value=config[key]||'';
          if(typeof value!=='string'||value.length>512||/[\x00-\x1f]/.test(value))throw new Error('Invalid printer name');
          clean[key]=value;
        }
        clean.silent=config.silent===true;clean.escpos=config.escpos===true;
        configWrites=configWrites.catch(()=>{}).then(async()=>{await fs.writeFile(file+'.tmp',JSON.stringify(clean));await fs.rename(file+'.tmp',file);});
        await configWrites;
        return {ok:true,config:clean};
      }
      await configWrites;
      try{return {ok:true,config:JSON.parse(await fs.readFile(file,'utf8'))};}
      catch(e){if(e.code==='ENOENT')return {ok:true,config:{}};throw e;}
    }catch(e){return {ok:false,error:e.message};}
  });
  for (const action of ['list','html','raw','pdf']) ipcMain.handle('karobar-print-'+action, async (event,input) => {
    const main = getMainWindow();
    if (!trusted(event,main))
      return {ok:false,error:'Untrusted print request'};
    if (action !== 'list' && busy) return {ok:false,error:'Another print job is in progress'};
    try {
      if (action === 'list') return {ok:true,printers:await listPrinters(main.webContents)};
      busy = true;
      if (action === 'raw') {
        const bytes = escpos(input || {});
        const printers = await listPrinters(main.webContents);
        const printer = printers.find(p=>p.name===input.deviceName);
        if (!printer) throw new Error('Selected printer is not installed');
        if (['offline','error'].includes(printer.state)) throw new Error(printer.detail);
        await rawPrint(printer.name,bytes);
        return {ok:true,message:'RAW job submitted to the operating system'};
      }
      const j = validateJob(input);
      if (action === 'html' && j.deviceName) {
        const printer = (await listPrinters(main.webContents)).find(p=>p.name===j.deviceName);
        if (!printer) throw new Error('Selected printer is not installed; choose it again in Settings');
        if (['offline','error'].includes(printer.state)) throw new Error(printer.detail);
      }
      if (action === 'pdf') {
        const result = await dialog.showSaveDialog(main,{title:'Save invoice PDF',defaultPath:'Invoice.pdf',filters:[{name:'PDF',extensions:['pdf']}]});
        if (result.canceled || !result.filePath) return {ok:false,canceled:true};
        const data = await renderJob(j,'pdf');
        await fs.writeFile(result.filePath,data);
        return {ok:true,message:'PDF saved'};
      }
      return await renderJob(j,'html');
    } catch (e) { return {ok:false,error:e.message}; }
    finally { if (action !== 'list') busy = false; }
  });
}
module.exports = { registerPrinting, listPrinters, renderJob };
