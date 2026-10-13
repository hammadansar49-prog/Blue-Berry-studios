// ============================================================
// KAROBAR - Electron main process
// Wraps the existing web app (index.html + app.js) into a
// downloadable Windows desktop application.
//
// IMPORTANT: Firebase Auth does NOT work over the file:// protocol
// (you get auth/operation-not-supported-in-this-environment). So we
// start a tiny local HTTP server inside the app and load the UI from
// http://127.0.0.1:<port> — a proper web origin where login works.
//
// Supports Windows 7, 8, 8.1, 10 and 11 (Electron 22.x is the last
// line that still supports Windows 7/8).
// ============================================================
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const http = require('http');
const fs = require('fs');
const url = require('url');
const { execFile } = require('child_process');
const { availablePrinters, checkPrinter, receiptPageSize } = require('./printer');
const { listenPersistent } = require('./local-origin');
const primaryInstance = app.requestSingleInstanceLock();
if (!primaryInstance) app.quit();

// Windows 7/8 need software rendering; on Windows 10/11 the GPU compositor
// keeps scrolling surfaces from leaving stale text during rapid navigation.
if (process.platform === 'win32' && Number(os.release().split('.')[0]) < 10) {
  app.disableHardwareAcceleration();
}
if (process.platform === 'win32') app.setAppUserModelId('com.karobar.app');

let mainWindow = null;
let localServer = null;
let serverPort = 0;
app.on('second-instance', () => {
  if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
});

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

// Serve the bundled web files from a local HTTP origin.
function startLocalServer(rootDir) {
  return new Promise(function (resolve, reject) {
    const server = http.createServer(function (req, res) {
      try {
        const parsed = url.parse(req.url, true);
        // Google login helper (in the system browser) posts the captured
        // credential here; relay it to the app window to finish sign-in.
        if (parsed.pathname === '/__google_done') {
          const tokens = {
            idToken: parsed.query.idToken || '',
            accessToken: parsed.query.accessToken || ''
          };
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('google-credential', tokens);
            try { mainWindow.show(); mainWindow.focus(); } catch (e) {}
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<!doctype html><meta charset="utf-8"><body style="font-family:Segoe UI,Arial,sans-serif;display:grid;place-items:center;height:100vh;margin:0;background:#f5f6fa"><div style="text-align:center"><div style="font-size:40px">✅</div><h2 style="color:#16a34a">Signed in successfully!</h2><p style="color:#666">The KAROBAR app will continue automatically. You can close this tab.</p></div></body>');
          return;
        }
        let pathname = decodeURIComponent(parsed.pathname || '/');
        if (pathname === '/' || pathname === '') pathname = '/index.html';
        // strip leading slash and normalise to avoid path traversal
        const safe = path.normalize(pathname).replace(/^([/\\])+/, '');
        const filePath = path.join(rootDir, safe);
        if (filePath.indexOf(rootDir) !== 0) { res.writeHead(403); res.end('Forbidden'); return; }
        fs.readFile(filePath, function (err, data) {
          if (err) { res.writeHead(404); res.end('Not found'); return; }
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          res.end(data);
        });
      } catch (e) {
        res.writeHead(500); res.end('Server error');
      }
    });
    // Reuse the origin so Firebase Auth and unsynced local data survive restarts.
    listenPersistent(server, app.getPath('userData')).then(resolve, reject);
  });
}

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#ffffff',
    title: 'Karobar',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', function () {
    mainWindow.maximize();
    mainWindow.show();
  });

  // External http(s) links (WhatsApp, support, etc.) open in the
  // user's real browser. Blank-target windows (the print/download
  // popups the app creates) are allowed so printing keeps working.
  mainWindow.webContents.setWindowOpenHandler(function (details) {
    const u = details.url || '';
    if (/^https?:\/\//i.test(u) && u.indexOf('127.0.0.1') === -1 && u.indexOf('localhost') === -1) {
      shell.openExternal(u);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// The app asks us to open the Google login page in the user's real browser.
ipcMain.handle('karobar-open-google', function () {
  if (serverPort) shell.openExternal('http://localhost:' + serverPort + '/google.html');
  return true;
});

ipcMain.handle('karobar-printers', async function () {
  if (!mainWindow || mainWindow.isDestroyed()) throw new Error('App window is unavailable.');
  return availablePrinters(await mainWindow.webContents.getPrintersAsync());
});

ipcMain.handle('karobar-printer-hints', function () {
  if (process.platform !== 'win32') return [];
  const script = "Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -match '(printer|receipt|thermal|epson|bixolon|star micronics|zebra|xprinter|rongta|pos-)' } | Select-Object -First 8 FriendlyName,Status | ConvertTo-Json -Compress";
  return new Promise(resolve => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, timeout: 8000 }, (err, stdout) => {
      if (err || !stdout.trim()) return resolve([]);
      try {
        const devices = JSON.parse(stdout);
        resolve((Array.isArray(devices) ? devices : [devices]).filter(d => d && typeof d.FriendlyName === 'string').map(d => ({ name: d.FriendlyName, status: d.Status || '' })));
      } catch (e) { resolve([]); }
    });
  });
});

ipcMain.handle('karobar-print-invoice', async function (_event, job) {
  if (!mainWindow || mainWindow.isDestroyed()) return { ok: false, error: 'App window is unavailable.' };
  if (!job || typeof job.html !== 'string' || !job.html.trim() || job.html.length > 2000000 || typeof job.printerName !== 'string') {
    return { ok: false, error: 'Invalid print job.' };
  }
  if (job.paperWidthMm != null && ![58, 80, 104].includes(job.paperWidthMm)) {
    return { ok: false, error: 'Unsupported receipt paper width.' };
  }
  let printers;
  try { printers = await mainWindow.webContents.getPrintersAsync(); }
  catch (e) { return { ok: false, error: 'Could not query Windows printers: ' + e.message }; }
  const selected = checkPrinter(printers, job.printerName);
  if (!selected.ok) return selected;
  const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(job.html));
    const printOptions = { silent: true, printBackground: true, deviceName: job.printerName };
    if (job.paperWidthMm) {
      const pixels = await win.webContents.executeJavaScript('Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)');
      printOptions.pageSize = receiptPageSize(job.paperWidthMm, pixels);
    }
    const result = await new Promise(resolve => {
      win.webContents.print(printOptions, (success, reason) => {
        resolve(success ? { ok: true } : { ok: false, error: reason || 'Windows rejected the print job.' });
      });
    });
    return result;
  } catch (e) {
    return { ok: false, error: 'Print failed: ' + e.message };
  } finally {
    if (!win.isDestroyed()) win.close();
  }
});

app.whenReady().then(function () {
  if (!primaryInstance) return;
  Menu.setApplicationMenu(null); // hide the default Electron menu bar

  // During development you can run VS Code Live Server (port 5500)
  // and start Electron with `npm run dev` to load the live URL.
  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    createWindow(devUrl);
  } else {
    const rootDir = path.join(__dirname, '..');
    startLocalServer(rootDir).then(function (server) {
      localServer = server;
      serverPort = server.address().port;
      // Use localhost (an authorized Firebase domain) so Google sign-in works.
      createWindow('http://localhost:' + serverPort + '/index.html');
    }).catch(function (e) {
      dialog.showErrorBox('Karobar could not start', 'The saved local address is unavailable. Close any other Karobar instance and retry. Your saved data has not been removed.\n\n' + e.message);
      app.quit();
    });
  }

});

app.on('window-all-closed', function () {
  if (localServer) { try { localServer.close(); } catch (e) {} }
  if (process.platform !== 'darwin') app.quit();
});
