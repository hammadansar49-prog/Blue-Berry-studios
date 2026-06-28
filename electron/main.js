// ============================================================
// Blue Berry Studios - Electron main process
// Wraps the existing web app (index.html + app.js) into a
// downloadable Windows desktop application.
//
// Supports Windows 7, 8, 8.1, 10 and 11 (Electron 22.x is the
// last line that still supports Windows 7/8).
// ============================================================
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// Older Windows (7/8) + some GPUs render Chromium poorly; disabling
// GPU acceleration makes the app boot reliably everywhere.
app.disableHardwareAcceleration();

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#ffffff',
    title: 'Blue Berry Studios',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  // During development you can run VS Code Live Server (port 5500)
  // and start Electron with `npm run dev` to load the live URL so
  // hot edits show up. In the packaged app this env var is unset and
  // the bundled local files are loaded instead.
  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  }

  mainWindow.once('ready-to-show', function () {
    mainWindow.maximize();
    mainWindow.show();
  });

  // External http(s) links (WhatsApp, support, etc.) open in the
  // user's real browser. Blank-target windows (the print/download
  // popups the app creates) are allowed so printing keeps working.
  mainWindow.webContents.setWindowOpenHandler(function (details) {
    const url = details.url || '';
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
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
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
