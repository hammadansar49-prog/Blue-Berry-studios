const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path'),os=require('os');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'karobar-sidebar-')));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:600,height:700,webPreferences:{contextIsolation:true}});
  const errors=[];
  try{
    await win.loadFile(path.join(__dirname,'../index.html'));
    for(const width of [600,390,1024]){
      win.setContentSize(width,700);
      const result=await win.webContents.executeJavaScript(`(async()=>{
        await new Promise(requestAnimationFrame);
        document.getElementById('fbAuthModal').style.display='none';
        store.currentUser={name:'Theottdeals4865',role:'owner',id:'admin'};updateBadge();
        document.getElementById('fbAccountBox').style.display='flex';
        document.getElementById('fbAccountEmail').textContent='owner@example.com';
        document.getElementById('sideSyncStatus').textContent='Cloud saved';
        const errors=[],small=innerWidth<=680,toggle=document.getElementById('sidebarToggle');
        if(toggle)toggleSidebar(false);
        if(small){
          if(!toggle)return ['mobile menu button missing'];
          toggle.click();await new Promise(requestAnimationFrame);
          if(toggle.getAttribute('aria-expanded')!=='true')errors.push('menu did not open');
        }
        const menu=document.getElementById('menu'),badge=document.getElementById('currentUserBadge');
        if(menu.clientHeight<180)errors.push('menu has insufficient height');
        if(badge.getBoundingClientRect().height>30)errors.push('username wraps vertically');
        if(menu.scrollWidth>menu.clientWidth+1)errors.push('navigation overflows');
        const group=menu.querySelector('.mi[data-grp]');if(!group.classList.contains('open'))group.click();
        const item=menu.querySelector('.submenu.show .smi[data-view="sale"]');
        if(!item||item.getBoundingClientRect().width<150)errors.push('category items are clipped');
        if(item)item.click();
        if(small&&toggle.getAttribute('aria-expanded')!=='false')errors.push('menu stays open after navigation');
        if(small){toggle.click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));if(toggle.getAttribute('aria-expanded')!=='false')errors.push('Escape does not close menu');toggle.click();}
        return errors;
      })()`);
      errors.push(...result.map(e=>width+': '+e));
      await new Promise(r=>setTimeout(r,150));
      fs.writeFileSync(path.join(os.tmpdir(),'karobar-sidebar-'+width+'.png'),(await win.capturePage()).toPNG());
    }
  }catch(e){errors.push(String(e));}
  fs.writeFileSync(path.join(os.tmpdir(),'karobar-sidebar-result.json'),JSON.stringify({passed:!errors.length,errors}));
  app.exit(errors.length?1:0);
});
