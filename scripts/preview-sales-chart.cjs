const {app, BrowserWindow} = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

const profile=fs.mkdtempSync(path.join(os.tmpdir(),'karobar-chart-preview-'));
app.setPath('userData',profile);
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:1440,height:1200,show:false,webPreferences:{contextIsolation:true}});
  try{
    await win.loadFile(path.join(__dirname,'..','index.html'));
    const bounds=await win.webContents.executeJavaScript(`(()=>{
      const today=new Date();
      const two=n=>String(n).padStart(2,'0');
      store.sales=[];
      document.getElementById('fbAuthModal').style.display='none';
      [[2,4200],[5,7800],[9,5100],[12,9200],[16,6300],[20,12400],[24,8500],[27,14900]].forEach(([day,total],i)=>{
        store.sales.push({id:'demo-'+i,no:'DEMO-'+(i+1),date:two(day)+'-'+two(today.getMonth()+1)+'-'+today.getFullYear(),party:'Sample customer',total,received:total,rows:[]});
      });
      vWelcome();
      const card=document.querySelector('.dash-sale-section');
      card.scrollIntoView({block:'start'});
      const rect=card.getBoundingClientRect();
      return {x:Math.max(0,Math.floor(rect.x)),y:Math.max(0,Math.floor(rect.y)),width:Math.ceil(rect.width),height:Math.ceil(rect.height)};
    })()`);
    await new Promise(resolve=>setTimeout(resolve,500));
    await win.webContents.executeJavaScript("document.getElementById('fbAuthModal').style.setProperty('display','none','important');document.getElementById('branchAuthModal').style.setProperty('display','none','important')");
    win.showInactive();
    await new Promise(resolve=>setTimeout(resolve,400));
    const image=await win.webContents.capturePage(bounds);
    const out=path.join(__dirname,'..','build','sales-chart-preview.png');
    fs.writeFileSync(out,image.toPNG());
    console.log(out);
    app.exit(0);
  }catch(e){console.error(e);app.exit(1);}
});
