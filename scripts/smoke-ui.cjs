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
