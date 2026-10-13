const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'karobar-smoke-'));
app.setPath('userData', profile);

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } });
  try {
    await win.loadFile(path.join(__dirname, '..', 'index.html'));
    const result = await win.webContents.executeJavaScript(`(() => {
      const errors = [];
      const check = (name, fn) => { try { if (!fn()) errors.push(name); } catch (e) { errors.push(name + ': ' + e.message); } };
      check('title and brand', () => document.title.startsWith('Karobar') && document.querySelector('.tb-logo')?.getAttribute('src') === 'assets/icon.png');
      check('party widgets', () => { vParties(); return document.querySelectorAll('.empty-quick-grid button').length === 3; });
      check('item widgets', () => { vItems(); return document.querySelectorAll('.empty-quick-grid button').length === 3; });
      check('stock action', () => { vAvailableStock(); return !!document.querySelector('.stock-add-btn'); });
      check('stock button opens item form', () => { document.querySelector('.stock-add-btn')?.click(); return document.getElementById('itemModal')?.classList.contains('show') || document.getElementById('formModal')?.classList.contains('show'); });
      check('POS F1 focuses search', () => { document.getElementById('saleModal')?.classList.add('show'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1', bubbles: true })); const focused = document.activeElement?.id === 'posSearchItem'; document.getElementById('saleModal')?.classList.remove('show'); return focused; });
      check('item code lookup', () => { store.items.push({ id: 'smoke-item', name: 'Test Shirt', code: 'TST-123', barcode: '987654321', price: 500, stock: 5 }); return findItemByScan('TST-123')?.id === 'smoke-item' && findItemByScan('987654321')?.id === 'smoke-item'; });
      check('search suggestions by name and barcode', () => { const input=document.getElementById('posSearchItem'); input.value='TST-123';posSearchItems();const option=document.querySelector('#posSearchDrop .pos-search-result');return option?.textContent.includes('Test Shirt'); });
      check('search keyboard selection', () => { const input=document.getElementById('posSearchItem'); input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));return posRows.some(r=>r.item==='Test Shirt'); });
      check('keyboard help', () => { showKeyboardHelp();const open=!!document.getElementById('keyboardHelp');document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return open&&!document.getElementById('keyboardHelp'); });
      check('scanner test opens', () => { openScannerTest();const open=document.getElementById('formModal')?.classList.contains('show');closeModal('formModal');return open; });
      check('invoice received balance', () => { nciRows = [{ name: 'Test Shirt', item: 'Test Shirt', qty: 1, price: 500 }]; nciReceived = 0; nciFully = false; const t = nciTotals(); return t.total === 500 && t.received === 0 && t.balance === 500; });
      check('invoice print opens preview without saving', () => { vCreateInvoice();const before=store.sales.length;document.querySelector('.nci-rnd[title="Preview invoice before printing"]')?.click();const open=document.getElementById('nciSlipModal')?.classList.contains('show');const warning=!!document.querySelector('.nci-preview-warning');const unsaved=store.sales.length===before;closeModal('nciSlipModal');return open&&warning&&unsaved; });
      check('clickable invoice controls use keyboard', () => { keyboardEnhance();const add=document.querySelector('.nci-addrow');const before=nciRows.length;add.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));return add.tabIndex===0&&nciRows.length===before+1; });
      check('zero amount clears on focus', () => { const field=document.getElementById('nciRecv');field.value='0.00';clearZero(field);return field.value===''; });
      check('receipt paper selector updates preview', () => { store.settings.printerTab='thermal';setReceiptPaperSize('2inch');vCreateInvoice();nciShowSlip();const ok=document.querySelector('#nciSlipBody .receipt-paper-58')&&document.getElementById('nciPaperSize')?.value==='2inch';closeModal('nciSlipModal');return !!ok; });
      check('business logo and branch address appear on receipts', () => { const oldUser=store.currentUser,oldLogo=store.business.logo;store.currentUser={role:'branch',branchCode:'123456',branchAddress:'Test Branch Road',branchPhone:'03001234567'};store.business.logo='data:image/png;base64,dGVzdA==';const sale={no:'INV-42',date:'13-10-2026',party:'Customer',phone:'',rows:[{item:'Test Shirt',qty:1,price:500}],total:500,received:500,createdBy:'123456'};const html=buildInvoiceHTML(sale);const ok=html.includes('Test Branch Road')&&html.includes('Business logo')&&!html.includes('>LOGO<')&&html.includes('inv-barcode-svg');store.currentUser=oldUser;store.business.logo=oldLogo;return ok; });
      check('receipt QR contains sale details', () => { const p=receiptQrPayload({no:'INV-42',date:'13-10-2026',party:'Customer',rows:[{item:'Test Shirt',qty:1,price:500}],total:500,received:500});return p.complete&&p.text.includes('Test Shirt')&&!!localQrDataUrl(p.text,256); });
      check('receipt QR scan resolves invoice number', () => invoiceNumberFromScan(JSON.stringify({v:1,invoice:'INV-42',total:500}))==='INV-42');
      check('sidebar does not rebuild for unchanged categories', () => { buildMenu();const first=document.querySelector('#menu .mi');buildMenu();return first===document.querySelector('#menu .mi'); });
      check('activity widgets show counts without emoji placeholders', () => { vUserActivity();return document.querySelectorAll('.ua-widget-value').length>=3&&!document.querySelector('.ua-card-ic'); });
      check('backup widgets and actions', () => { vRestoreBackup();return document.querySelectorAll('.backup-stat').length===4&&!!document.querySelector('.backup-card button[onclick="doBackup()"]')&&!!document.getElementById('restoreFile'); });
      check('backup creates file metadata', () => { doBackup();return !!localStorage.getItem('karobar_last_backup'); });
      check('invoice preview print type changes layout', () => { const sale={no:'INV-12',date:'13-10-2026',party:'Test',rows:[{item:'Test Shirt',qty:1,price:500}],total:500,received:500};showInvoiceView(sale);setInvoicePreviewPrintType('thermal');setInvoicePreviewPaperSize('2inch');const thermal=!!document.querySelector('#iv_body .receipt-paper-58')&&document.getElementById('ivPaperSize').value==='2inch';setInvoicePreviewPrintType('regular');setInvoicePreviewPaperSize('a5');const standard=!!document.querySelector('#iv_body .standard-paper-a5')&&document.getElementById('ivPaperSize').value==='a5'&&printCSS().includes('size:A5');closeModal('invViewModal');return thermal&&standard; });
      check('payment and saved invoice empty widgets', () => { vPaymentIn();const pay=!!document.querySelector('.payment-empty-widgets .empty-widget button');vSavedInvoices();return pay&&!!document.querySelector('.saved-empty-widgets .empty-widget-grid'); });
      check('challan and returns use widgets', () => { vGeneric('challan')();const first=!!document.querySelector('.empty-widget-grid')&&!document.querySelector('.empty-ill');vGeneric('salereturn')();return first&&!!document.querySelector('.empty-widget-grid')&&!document.querySelector('.empty-ill'); });
      check('about credit', () => { setTab = 'about'; vSettings(); return document.querySelector('.about-credit')?.textContent.includes('Muhammad Hammad Ansar'); });
      return { passed: errors.length === 0, errors };
    })()`);
    fs.writeFileSync(path.join(__dirname, '..', 'build', 'smoke-result.json'), JSON.stringify(result, null, 2));
    app.exit(result.passed ? 0 : 1);
  } catch (error) {
    fs.writeFileSync(path.join(__dirname, '..', 'build', 'smoke-result.json'), JSON.stringify({ passed: false, errors: [String(error)] }, null, 2));
    app.exit(1);
  }
});
