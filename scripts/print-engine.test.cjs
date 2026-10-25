const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../print-engine');
const sale={no:'INV-9',date:'25/10/2026',party:'Test',rows:[{item:'Suit',qty:3,price:16595}],total:32360.25,discount:17424.75,received:30000};
const ctx=(mode='thermal',profile={})=>({business:{name:'Blueberry',address:'Market',phone:'123',email:'shop@example.com'},settings:{printerTab:mode,printProfiles:{[mode]:profile}},items:[],parties:[]});
test('receipt keeps original subtotal, bill discount percentage and received/balance',()=>{
 const html=P.render(sale,ctx());for(const text of ['49,785.00','17,424.75','35%','32,360.25','30,000.00','2,360.25'])assert.ok(html.includes(text),text);
});
test('tax is not misrepresented as discount and old records reconcile',()=>{
 const a=P.amounts({rows:[{qty:2,price:100,disc:10}],tax:20,total:190,received:0});
 assert.equal(a.itemDiscount,20);assert.equal(a.billDiscount,10);assert.equal(a.adjustment,0);
});
test('independent profiles do not inherit another printer theme or controls',()=>{
 const settings={printerTab:'thermal',printProfiles:{thermal:{theme:3,width:58,showName:false},regular:{theme:1,paper:'a5'}}};
 assert.equal(P.options(settings).theme,3);assert.equal(P.options(settings,'regular').theme,1);assert.equal(P.options(settings,'regular').showName,true);
});
test('all eight layouts render distinct structural variants',()=>{
 for(const mode of ['regular','thermal']){const rendered=new Set();for(let theme=0;theme<4;theme++)rendered.add(P.render(sale,ctx(mode,{theme})).replace(/kp-theme-\d/g,''));assert.equal(rendered.size,4);}
});
test('visibility, decimal and grouping controls affect output',()=>{
 const html=P.render(sale,ctx('thermal',{showName:false,showPhone:false,showAddress:false,showEmail:false,received:false,balance:false,decimals:false,grouping:false,words:'none',savings:false,barcode:false}));
 assert.ok(!html.includes('Blueberry'));assert.ok(!html.includes('Phone:'));assert.ok(!html.includes('Received'));assert.ok(!html.includes('Balance'));assert.ok(!html.includes('inv-barcode-svg'));assert.ok(html.includes('49785'));assert.ok(!html.includes('49,785'));
});
test('hostile invoice and company input is escaped',()=>{
 const html=P.render({...sale,party:'<script>alert(1)</script>',no:'" onload="bad'}, {...ctx(),business:{name:'<img src=x onerror=bad>',logo:'javascript:bad()'}});
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('src="javascript:'));assert.ok(html.includes('&lt;script&gt;'));
});
test('custom width and copy limits are bounded',()=>{
 const o=P.options({printProfiles:{thermal:{width:900,copies:100,extraLines:-5}}});assert.equal(o.width,112);assert.equal(o.copies,10);assert.equal(o.extraLines,0);
});
test('amount in words preserves decimal carry and numbering system',()=>{
 assert.equal(P.numberWords(100000,'indian'),'One Lakh only');assert.equal(P.numberWords(100000,'international'),'One Hundred Thousand only');assert.equal(P.numberWords(1.999),'Two only');
});
test('item metadata, terms, bank details and footer toggles use actual data',()=>{
 const invoice={...sale,rows:[{item:'Suit',qty:1,price:100,batch:'BATCH-1',size:'XL',desc:'Cotton'}],total:100,discount:0};
 const context=ctx('thermal',{batch:false,description:false,bank:true});context.business.bankName='Sample Bank';context.business.bankAccount='123';
 const html=P.render(invoice,context);assert.ok(!html.includes('BATCH-1'));assert.ok(!html.includes('Cotton'));assert.ok(html.includes('XL'));assert.ok(html.includes('Sample Bank'));
});
