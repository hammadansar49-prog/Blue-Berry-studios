const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'web-dist');
fs.mkdirSync(out,{recursive:true});
const files=['index.html','google.html','app.js','styles.css','firebase-config.js','print-engine.js','print-settings.js','print-settings.css','invoice-print.css'];
for(const name of files)fs.copyFileSync(path.join(root,name),path.join(out,name));
for(const name of ['assets','vendor'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
for(const name of files){if(!fs.statSync(path.join(out,name)).size)throw Error('Empty web asset: '+name);}
console.log('Web build ready: '+out+' (production Firebase login and sync enabled)');
