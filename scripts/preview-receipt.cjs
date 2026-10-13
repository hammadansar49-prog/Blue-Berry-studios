const {app,BrowserWindow}=require('electron');
const fs=require('fs');
const os=require('os');
const path=require('path');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'karobar-receipt-preview-'));
app.setPath('userData',profile);
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:1280,height:1050,show:false,webPreferences:{contextIsolation:true}});
  try{
    await win.loadFile(path.join(__dirname,'..','index.html'));
    const bounds=await win.webContents.executeJavaScript(`(()=>{
      store.business={...store.business,name:'Sample Business',logo:'assets/icon.png',address:'Main office address',phone:'03000000000'};
      store.currentUser={role:'branch',branchCode:'123456',name:'Sample Branch',branchAddress:'24 Sample Market Road, Lahore',branchPhone:'0421234567'};
      store.settings.printerTab='thermal';store.settings.pageSize='3inch';
      nciRows=[{name:'Black Suits',item:'Black Suits',qty:2,price:1000,size:''}];
      nciCustName='Sample Customer';nciReceived=1000;
      vCreateInvoice();nciShowSlip();
      document.getElementById('fbAuthModal').style.setProperty('display','none','important');
      const modal=document.querySelector('#nciSlipModal .nci-slip-modal');
      const rect=modal.getBoundingClientRect();
      return {x:Math.floor(rect.x),y:Math.floor(rect.y),width:Math.ceil(rect.width),height:Math.ceil(rect.height)};
    })()`);
    win.showInactive();
    await new Promise(resolve=>setTimeout(resolve,450));
    await win.webContents.executeJavaScript("document.getElementById('fbAuthModal').style.setProperty('display','none','important')");
    const img=await win.webContents.capturePage(bounds);
    const out=path.join(__dirname,'..','build','receipt-preview-80mm.png');
    fs.writeFileSync(out,img.toPNG());console.log(out);
    await win.webContents.executeJavaScript("const body=document.getElementById('nciSlipBody');body.scrollTop=body.scrollHeight");
    await new Promise(resolve=>setTimeout(resolve,180));
    const codes=await win.webContents.capturePage(bounds);
    const codesOut=path.join(__dirname,'..','build','receipt-codes-preview-80mm.png');
    fs.writeFileSync(codesOut,codes.toPNG());console.log(codesOut);
    const activityBounds=await win.webContents.executeJavaScript(`(()=>{
      closeModal('nciSlipModal');store.currentUser={role:'owner',name:'Owner',id:'admin'};
      store.users=[{name:'Manager',role:'manager',created:'2026-10-13',createdBy:'admin'}];
      store.activityLog=[{id:'demo',detail:'Sample activity'}];
      vUserActivity();
      const rect=document.querySelector('.ua-hub').getBoundingClientRect();
      return {x:Math.max(0,Math.floor(rect.x)),y:Math.max(0,Math.floor(rect.y)),width:Math.ceil(rect.width),height:Math.ceil(rect.height)};
    })()`);
    await new Promise(resolve=>setTimeout(resolve,150));
    const activity=await win.webContents.capturePage(activityBounds);
    const activityOut=path.join(__dirname,'..','build','user-activity-preview.png');
    fs.writeFileSync(activityOut,activity.toPNG());console.log(activityOut);
    app.exit(0);
  }catch(e){console.error(e);app.exit(1);}
});
