const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
function load(name,c){const start=source.indexOf('function '+name+'('),rest=source.slice(start);const end=rest.slice(1).search(/\n(?:async )?function /);vm.runInContext(rest.slice(0,end+1),c);}
test('scanning supports numeric stored barcodes and rejects ambiguous partial names',()=>{
 const c=vm.createContext({store:{items:[{name:'Green tea',barcode:12345},{name:'Black tea'}]}});load('findItemByScan',c);
 assert.equal(c.findItemByScan('12345').name,'Green tea');assert.equal(c.findItemByScan('tea'),null);assert.equal(c.findItemByScan('green').name,'Green tea');
});
test('payment date parser handles ISO and local dates and rejects invalid calendar dates',()=>{
 const c=vm.createContext({});load('parsePmDate',c);
 const iso=c.parsePmDate('2026-10-13');assert.equal(iso.getFullYear(),2026);assert.equal(iso.getMonth(),9);assert.equal(iso.getDate(),13);
 assert.equal(c.parsePmDate('13/10/2026 10:30').getDate(),13);assert.equal(c.parsePmDate('31/02/2026'),null);
});
test('profit uses historical unit cost and remaining quantity after partial return',()=>{
 const els={pmFrom:{value:'2026-10-01'},pmTo:{value:'2026-10-31'},pmProfitView:{},pmProfitCards:{},pmProfitSummary:{}};
 const c=vm.createContext({store:{sales:[{date:'13/10/2026',total:150,rows:[{item:'Tea',qty:2,returned:1,costPrice:40}]},{date:'13/10/2026',total:999,replaced:true,rows:[]}],items:[{name:'Tea',pprice:100}]},window:{pmBranchFilter:'all'},document:{getElementById:id=>els[id]},rs:value=>'Rs '+value});
 load('parsePmDate',c);load('computeProfitView',c);c.computeProfitView();
 assert.ok(els.pmProfitSummary.innerHTML.includes('Rs 110'));assert.ok(els.pmProfitSummary.innerHTML.includes('1 invoices'));assert.ok(els.pmProfitSummary.innerHTML.includes('Gross Profit'));
});
test('branch names use current directory instead of old sale snapshots',()=>{
 const c=vm.createContext({store:{sales:[{createdBy:'BR1',createdByName:'Old name'}]},window:{pmBranchesCache:[{branchCode:'BR1',name:'New name'}]}});load('pmBranchList',c);
 assert.equal(c.pmBranchList().find(b=>b.code==='BR1').name,'New name');
});
