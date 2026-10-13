// Preload: exposes a tiny, safe bridge to the web app so it can trigger
// Google sign-in in the external browser and receive the credential back.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('karobarDesktop', {
  isDesktop: true,
  // Ask the main process to open the Google login page in the system browser.
  openGoogleLogin: function () { return ipcRenderer.invoke('karobar-open-google'); },
  getPrinters: function () { return ipcRenderer.invoke('karobar-printers'); },
  getPrinterHints: function () { return ipcRenderer.invoke('karobar-printer-hints'); },
  printInvoice: function (job) { return ipcRenderer.invoke('karobar-print-invoice', job); },
  // Receive the Google credential (id/access token) captured from the browser.
  onGoogleCredential: function (cb) {
    ipcRenderer.on('google-credential', function (e, data) { cb(data); });
  }
});
