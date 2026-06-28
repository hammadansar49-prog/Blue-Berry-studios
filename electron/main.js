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
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

// Older Windows (7/8) + some GPUs render Chromium poorly; disabling
// GPU acceleration makes the app boot reliably everywhere.
app.disableHardwareAcceleration();

let mainWindow = null;
let localServer = null;

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
        let pathname = decodeURIComponent(url.parse(req.url).pathname || '/');
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
    server.on('error', reject);
    // port 0 => OS picks a free port; bind to loopback only
    server.listen(0, '127.0.0.1', function () {
      resolve(server);
    });
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
    title: 'KAROBAR',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
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

app.whenReady().then(function () {
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
      const port = server.address().port;
      createWindow('http://127.0.0.1:' + port + '/index.html');
    }).catch(function (e) {
      // Fallback to file:// if the server somehow can't start.
      createWindow('file://' + path.join(rootDir, 'index.html'));
    });
  }

});

app.on('window-all-closed', function () {
  if (localServer) { try { localServer.close(); } catch (e) {} }
  if (process.platform !== 'darwin') app.quit();
});
