const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path'),os=require('os');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'karobar-profile-')));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1024,height:640,webPreferences:{contextIsolation:true}});
  const errors=[];
  try{
    await win.loadFile(path.join(__dirname,'../index.html'));
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const errors=[];const check=(name,value)=>{if(!value)errors.push(name);};
      document.getElementById('fbAuthModal').style.display='none';
      store.currentUser={name:'Logo Owner',role:'owner',id:'admin'};
      document.getElementById('fbAccountBox').style.display='flex';
      document.getElementById('fbAccountEmail').textContent='owner@example.com';
      document.getElementById('sideSyncStatus').textContent='Cloud saved';
      const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=1200;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#008080';ctx.fillRect(0,0,1800,1200);
      const file=new File([await new Promise(r=>canvas.toBlob(r,'image/png'))],'logo.png',{type:'image/png'});
      try{
        const image=await prepareBusinessImage(file);
        check('bounded image',image.length<200000);
        store.business.logo=image;persist();updateBadge();
        const img=document.querySelector('#userBadge .user-avatar img');await img.decode();
        check('badge logo decoded',img.naturalWidth>0&&img.naturalWidth<=320);
      }catch(e){errors.push('image preparation: '+e.message);}
      nav('profile');document.getElementById('pf_name').value='Unsaved business';
      await pfLogo({files:[file]});
      check('upload retains form fields',document.getElementById('pf_name').value==='Unsaved business');
      saveProfile();check('profile saved locally',JSON.parse(localStorage.getItem(KEY)).business.name==='Unsaved business');
      const menu=document.getElementById('menu');menu.querySelectorAll('.submenu').forEach(e=>e.classList.add('show'));
      const bottom=document.querySelector('.side-bottom'),badge=document.getElementById('userBadge');
      const count=menu.querySelectorAll('.mi,.smi').length;
      for(let i=0;i<12;i++){menu.scrollTop=i%2?0:menu.scrollHeight;await new Promise(requestAnimationFrame);}
      check('menu nodes stable',count===menu.querySelectorAll('.mi,.smi').length);
      check('menu clipped above footer',menu.getBoundingClientRect().bottom<=bottom.getBoundingClientRect().top+1);
      check('menu below badge',menu.getBoundingClientRect().top>=badge.getBoundingClientRect().bottom-1);
      menu.scrollTop=menu.scrollHeight;await new Promise(requestAnimationFrame);
      check('opaque scrolling surface',getComputedStyle(menu).backgroundColor!=='rgba(0, 0, 0, 0)');
      check('visible sync status',!!document.querySelector('.side-bottom #sideSyncStatus'));
      return errors;
    })()`);
    errors.push(...result);
    await win.capturePage().then(img=>fs.writeFileSync(path.join(os.tmpdir(),'karobar-profile-small.png'),img.toPNG()));
    win.setSize(1440,900);
    await win.webContents.executeJavaScript('new Promise(requestAnimationFrame)');
    await win.capturePage().then(img=>fs.writeFileSync(path.join(os.tmpdir(),'karobar-profile-large.png'),img.toPNG()));
  }catch(e){errors.push(String(e));}
  fs.writeFileSync(path.join(os.tmpdir(),'karobar-profile-result.json'),JSON.stringify({passed:!errors.length,errors}));
  app.exit(errors.length?1:0);
});
