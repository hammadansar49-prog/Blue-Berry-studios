// Generates documentation only; never loads the application or a user session.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const out = path.resolve(__dirname, '../docs/guides');
app.setPath('userData', path.join(process.env.TEMP || out, 'karobar-guide-renderer'));
const note = text => `<aside>${text}</aside>`;
const steps = entries => `<ol>${entries.map(x => `<li>${x}</li>`).join('')}</ol>`;
const page = (title, body) => ({ title, body });
const guides = [
  { file: 'Karobar-3.0.0-Admin-Owner-Guide', title: 'Admin / Owner Guide', pages: [
    page('Apna business aur Owner account', `
      <p class="lead">Karobar mein business banana, company profile set karna aur employees ko apne store se jorna.</p>
      <h2>Owner aur employee Admin mein farq</h2>
      <p>Google ya email se business shuru karne wala asal account <b>Owner</b> hota hai. Employee ko <b>Admin</b> role dena usay asal Google/email Owner nahi banata. Cloud-linked employees banane ke liye asal Owner login istemal karein.</p>
      <h2>Pehli dafa login</h2>${steps([
        'Karobar kholein aur internet connect rakhein.',
        '<b>Continue with Google</b> dabayein aur business ki Gmail select karein. Desktop par browser khul sakta hai; login ke baad app par wapas aayein.',
        'Email/password use karna ho to <b>New here? Create an account</b> chunein. Valid email aur kam az kam 6 characters ka password dein; behtar hai lamba, unique password ho.',
        'Dobara aate waqt wahi original account aur login tareeqa istemal karein. Kisi doosri Gmail se naya, alag store khul sakta hai.'
      ])}
      ${note('Pehle se business maujood hai? Naya account na banayein. Usi purane Owner account se login karein. Firebase Console mein jana aam users ke liye zaroori nahi.')}
      <h2>Company profile</h2>
      <p><b>My Company</b> mein company name, phone, email, address aur doosri details bharein. Logo/signature chunein aur <b>Save Changes</b> dabayein. <b>Cloud saved</b> ka intezar karein; phir page dobara khol kar details aur sidebar logo check karein.</p>
    `),
    page('Employee ka account banayein', `
      <p class="lead">Yeh steps asal Owner ke Google/email session mein karein.</p>
      <p class="route">Sync, Share &amp; Backup &gt; User Activity &gt; Add User</p>
      ${steps([
        '<b>User Name</b> dein, misaal: <b>ali_cashier01</b>. Har shakhs ka alag naam rakhein; simple letters, numbers aur underscore behtar hain.',
        '<b>Role</b> select karein: Cashier, Manager, Viewer ya Admin. Neeche diya gaya version note zaroor parhein.',
        'Manager ke liye <b>Manager PIN</b> bilkul 4 digits ka dein. PIN sirf mutaliqa zimmedar shakhs ko dein.',
        '<b>Password</b> kam az kam 6 characters ka rakhein. <b>Random Pass</b> se password generate aur <b>Show Password</b> se check kar sakte hain.',
        '<b>ADD</b> dabayein. Error aaye to usay resolve karein; sirf form band hone ko successful cloud account na samjhein.',
        '<b>All Users</b> mein employee check karein aur <b>Cloud saved</b> ka intezar karein.',
        'Employee ko us ka User ID aur password private taur par dein. Owner Gmail/password share na karein.',
        'Doosre device par <b>Employee? Login with User ID</b> se test karein. Store ka naam, data aur zaroori actions verify karein.'
      ])}
      <h2>Role selection: v3.0.0 ki zaroori limitation</h2>
      ${note('Code inspection mein role-name mismatch mila hai: Add User ke Cashier/Manager/Viewer/Admin roles permissions ke lowercase checks se match nahi karte. Is liye naya employee viewer-jaisa access le sakta hai, aur create/edit buttons band reh sakte hain. Role select karne ko working permissions ki guarantee na samjhein. Production staff rollout se pehle permissions fix aur test karwana zaroori hai.')}
      <p>Yeh guide is limitation ko document karti hai; documentation banate waqt app ka behavior change nahi kiya gaya.</p>
    `),
    page('Users, branches aur account safety', `
      <h2>Users ki list aur credentials</h2>
      <p><b>User Activity &gt; All Users</b> mein users dekhein. Employee ki row khol kar username, role aur masked password dekha ja sakta hai; <b>Show</b> password zahir karta hai. Yeh screen ya screenshot public share na karein.</p>
      <p>User remove karne ke liye us user ka Delete action chunein aur confirmation dhyan se parhein. Cloud save hone ke baad removed account ka access dobara test karein. Isay foran har device ki Firebase login session revoke hone ki guarantee na samjhein.</p>
      <h2>Branch banana</h2>${steps([
        '<b>User Activity &gt; Add Branch</b> kholein.',
        'Branch name, phone, address aur kam az kam 6-character password dein; name aur phone required hain.',
        'Save/create complete hone par generated <b>6-digit branch code</b> aur password private taur par record karein. <b>All Branches</b> mein entry check karein.',
        'Branch device par <b>Branch? Add your branch code</b> se code/password daal kar login aur data verify karein.'
      ])}
      ${note('Branch creation/login ka live end-to-end test is guide ke liye nahi kiya gaya. Error aaye to branch ko ready na samjhein. Branch session ka Add User independent cloud staff login nahi banata; doosre devices par chalne wale employees asal Owner se create karwayein.')}
      <h2>Activity aur password</h2>
      <p><b>User Activity &gt; Activity Log</b> se available activity dekhein; user/date filters istemal karein. App ka local Admin password dialog Google account ka password change nahi karta. Email login ke liye <b>Forgot password?</b>, aur Google login ke liye Google account recovery istemal karein.</p>
      <p>Shared laptop par kaam ke baad Logout karein. Staff ko sirf us ke apne credentials dein. Backup files mein sensitive business/account information ho sakti hai; unhein private rakhein.</p>
    `),
    page('Cloud, backup aur final checklist', `
      <h2>Save status ko samjhein</h2>
      <table><tr><th>Status</th><th>Kya karna hai</th></tr><tr><td>Cloud saved</td><td>Cloud ne save acknowledge kar diya. Doosre device par same account se verify karein.</td></tr><tr><td>Saved on device - waiting for cloud</td><td>Local changes pending hain. Internet on rakhein aur cloud save ka intezar karein.</td></tr><tr><td>Saved on device - cloud save failed</td><td>Changes device par hain; cloud save successful nahi. Internet/account check karein aur support ko error dein.</td></tr></table>
      ${note('Pending ya failed sync par app data/cache clear, reset ya uninstall na karein. Cloud sync backup ka badal nahi; regular backup bhi rakhein.')}
      <h2>Backup file</h2>${steps([
        '<b>Sync, Share &amp; Backup &gt; Restore Backup</b> kholein. Page title <b>Backup &amp; Restore</b> hoga.',
        '<b>Create Backup File</b> dabayein aur .json file secure jagah rakhein. Date ke saath alag copies rakhna behtar hai.',
        'Restore sirf zaroorat par karein: pehle current data ka backup lein, phir <b>Choose Backup File</b> se sahi file select karein.',
        'Confirmation mein business name aur records check karein. Restore current business data ko replace karta hai; ghalat file confirm na karein.'
      ])}
      <h2>Team ko dene se pehle</h2>
      <ul><li>Owner account aur recovery email aap ke control mein hain.</li><li>Company details/logo save aur reload ke baad check hain.</li><li>Employee ka login doosre device par test hai.</li><li>Permissions ki known limitation resolve aur required actions test hain.</li><li>Latest backup private jagah par hai.</li></ul>
      <h2>Data nazar na aaye?</h2><p>Pehle account aur business name check karein. Naya store banane ya purana backup restore karne ki jaldi na karein. Error text, waqt aur app version support ko dein; password ya private backup public na bhejein.</p>
    `)
  ]},
  { file: 'Karobar-3.0.0-Employee-Branch-Guide', title: 'Employee / Branch Guide', pages: [
    page('Apne store mein login', `
      <p class="lead">Yeh guide Owner ke banaye hue employee aur branch accounts ke liye hai.</p>
      <h2>Employee login</h2>${steps([
        'Owner se apna <b>User ID</b> aur password lein. Misaal User ID: <b>ali_cashier01</b>. Yeh sirf misaal hai, ready account nahi.',
        'Karobar kholein, internet connect karein aur <b>Employee? Login with User ID</b> chunein.',
        'User ID aur password daal kar <b>Login</b> dabayein. Password ki capital/small letters aur extra spaces check karein.',
        'Login ke baad business name aur available store data check karein. Ghalat store ho to transactions enter na karein; Owner ko batayein.'
      ])}
      ${note('Employee banne ke liye Continue with Google ya Create an account use na karein. Owner ke store mein aane ke liye us ka diya hua employee login istemal karein; naya Owner account alag store bana sakta hai.')}
      <h2>Branch login</h2>${steps([
        'Owner se apni branch ka <b>6-digit branch code</b> aur password lein.',
        'Login screen par <b>Branch? Add your branch code</b> chunein.',
        'Code/password enter karein aur login ke baad store/branch details check karein.'
      ])}
      <p>Branch account aur employee User ID alag login tareeqe hain. Branch ke liye employee screen par code na daalein. Branch workflow ko Owner se pehle verify karwayein.</p>
      <h2>Dobara app kholne par</h2><p>Login maange to wahi employee ID ya branch code use karein. Apna password bhool jayein to Owner se rabta karein; naya Google account bana kar purana business data nahi milega.</p>
    `),
    page('Roz ka kaam aur permissions', `
      <h2>Shift shuru karte waqt</h2>
      <ul><li>Business name aur apni login identity check karein.</li><li>Internet/sync status dekhein.</li><li>Sirf apne account par kaam karein; kisi aur ki identity use na karein.</li><li>Chhoti window par menu button se sidebar kholein aur apna section select karein.</li></ul>
      <h2>Menu aur kaam</h2>
      <p>Owner ki di hui access ke mutabiq dashboard, items, parties aur sale invoices jaise sections available ho sakte hain. Invoice save karne se pehle customer, item, quantity, rate aur total check karein. Kisi action par access error aaye to usay bypass karne ki koshish na karein.</p>
      ${note('<b>v3.0.0 permission limitation:</b> Naye employee roles mein mismatch ki wajah se selected Cashier, Manager ya Admin role ke bawajood create/edit controls unavailable ho sakte hain. Yeh aap ki login ghalti zaroori nahi. Owner ko exact error batayein; permissions fix/test hone tak required staff workflows ready assume na karein.')}
      <h2>Manager PIN</h2><p>Kisi action ke liye Manager PIN maanga jaye to authorized manager se rabta karein. PIN 4 digits hota hai; employee password se alag hai. Doosre employee ka PIN ya Owner password mang kar permissions cross na karein.</p>
      <h2>Branch ke employees</h2><p>Branch session mein Add User se bana hua local record independent Firebase employee account nahi hota. Alag laptop/device par employee login chahiye to asal Owner se cloud-linked user create karwayein.</p>
      <h2>Shift khatam karte waqt</h2><p>Pending edits save karein, cloud status check karein, aur shared laptop par Logout karein. Save error ho to Owner ko inform karein; sirf window band karna cloud save ki tasdeeq nahi.</p>
    `),
    page('Maslay aur data ki hifazat', `
      <table><tr><th>Masla</th><th>Agla qadam</th></tr><tr><td>Login nahi hota</td><td>Sahi Employee/Branch screen, ID/code, password aur internet check karein. Phir Owner se account verify karwayein.</td></tr><tr><td>Data khaali ya ghalat hai</td><td>Business/account check karein. Naye records ya restore se pehle Owner ko batayein.</td></tr><tr><td>Button missing / No access</td><td>Owner ko role aur exact error batayein. v3.0.0 role limitation bhi mumkin hai.</td></tr><tr><td>Waiting for cloud</td><td>Data local pending hai. Internet rakhein aur Cloud saved ka intezar karein.</td></tr><tr><td>Cloud save failed</td><td>Owner ko error dein. App reset, cache clear ya uninstall na karein.</td></tr><tr><td>Logo/profile badalna hai</td><td>Owner se company profile update karwayein.</td></tr></table>
      <h2>Yeh kaam na karein</h2>
      <ul><li>Owner ki Gmail ya password doosron ke saath share na karein.</li><li>Password, PIN, customer details ya backup public screenshot mein na dikhayein.</li><li>Data missing ho to ghalat backup restore ya app data clear na karein.</li><li>Owner ki ijazat aur current backup ke baghair restore na karein: current data replace ho sakta hai.</li></ul>
      <h2>Owner ko report kaise dein?</h2>
      <p>Apna User ID/branch code, app version <b>3.0.0</b>, maslay ka waqt, screen ka naam aur exact error batayein. Screenshot bhejna ho to passwords aur private customer information chhupa dein.</p>
      ${note('Is guide ke steps current code ke mutabiq hain. Har employee/branch ki real-device login aur permission testing Owner ki onboarding checklist ka hissa honi chahiye.')}
    `)
  ]}
];
function html(g) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${g.title}</title><style>
  @page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font:14px/1.55 Arial,sans-serif;color:#252b30}section{height:297mm;padding:18mm 19mm 19mm;position:relative;break-after:page}section:last-child{break-after:auto}header{border-bottom:3px solid #ed493a;padding-bottom:12px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center}header b{font-size:22px}header span{color:#58616a;font-size:11px}h1{font-size:27px;line-height:1.2;margin:0 0 16px}h2{font-size:17px;margin:20px 0 7px;color:#16736a}p{margin:8px 0}.lead{font-size:16px;color:#535e66}li{margin:8px 0}ol,ul{padding-left:22px}aside{background:#fff3df;border-left:4px solid #d39024;padding:12px 14px;margin:16px 0;font-size:13px}.route{background:#edf4f5;padding:12px;font-weight:bold}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #dce2e4;text-align:left;padding:10px;vertical-align:top}th{background:#edf4f5}td:first-child{width:31%;font-weight:bold}footer{position:absolute;bottom:12mm;left:19mm;right:19mm;border-top:1px solid #ddd;padding-top:8px;display:flex;justify-content:space-between;font-size:10px;color:#65717a}
  body{font-size:13.5px;line-height:1.45}li{margin:6px 0}h2{margin-top:16px}th,td{padding:8px}section{height:296mm}
  </style></head><body>${g.pages.map((p,i)=>`<section><header><b>KAROBAR</b><span>${g.title} | 3.0.0</span></header><main><h1>${p.title}</h1>${p.body}</main><footer><span>Roman Urdu | 13 October 2026 | Documentation only</span><span>${i+1} / ${g.pages.length}</span></footer></section>`).join('')}</body></html>`;
}
app.whenReady().then(async () => {
  fs.mkdirSync(out, {recursive:true});
  const win = new BrowserWindow({show:false,width:794,height:1123,webPreferences:{sandbox:true}});
  for (const g of guides) {
    const source = html(g);
    fs.writeFileSync(path.join(out, g.file+'.html'), source);
    await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(source));
    await win.webContents.executeJavaScript('document.fonts.ready');
    const check = await win.webContents.executeJavaScript(`Array.from(document.querySelectorAll('section')).map(s=>({title:s.querySelector('h1').textContent,bodyBottom:s.querySelector('main').getBoundingClientRect().bottom,footerTop:s.querySelector('footer').getBoundingClientRect().top}))`);
    if(check.some(x=>x.bodyBottom>x.footerTop-10)) throw new Error('Page overflow: '+JSON.stringify(check));
    const pdf = await win.webContents.printToPDF({printBackground:true,preferCSSPageSize:true,pageSize:'A4',margins:{top:0,bottom:0,left:0,right:0}});
    const pageCount = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
    if(pageCount !== g.pages.length) throw new Error(`Unexpected PDF pages: ${pageCount}, expected ${g.pages.length}`);
    fs.writeFileSync(path.join(out,g.file+'.pdf'),pdf);
    if(process.env.GUIDE_PREVIEW_DIR) {
      const preview = await win.webContents.capturePage();
      fs.writeFileSync(path.join(process.env.GUIDE_PREVIEW_DIR,g.file+'.png'),preview.toPNG());
    }
    console.log(`${g.file}: ${g.pages.length} pages, ${pdf.length} bytes, layout PASS`);
  }
  win.destroy(); app.quit();
}).catch(err=>{console.error(err);app.exit(1);});
