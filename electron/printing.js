// ============================================================
// KAROBAR - Printing bridge (Electron main process)
//
// Gives the web app real printer control in the desktop build:
//   * list installed printers + live "connected / offline" status
//   * silent printing of a receipt/invoice/label to a chosen printer
//     (thermal roll size is measured from the content)
//   * RAW ESC/POS printing for thermal printers (text mode, paper
//     cut, cash drawer kick) through the Windows spooler
//   * saving an invoice as a PDF file
// Works on Windows 7 → 11 (PowerShell 2.0+); macOS/Linux use CUPS.
// ============================================================
const { BrowserWindow, ipcMain, dialog, app } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const isWin = process.platform === 'win32';

function tmpFile(ext) {
  return path.join(os.tmpdir(), 'karobar-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
}

function powershellPath() {
  const root = process.env.SystemRoot || 'C:\\Windows';
  const p = path.join(root, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  return fs.existsSync(p) ? p : 'powershell.exe';
}

// Runs a PowerShell script (written to a temp .ps1 so quoting is never an issue).
function runPowerShell(script, args, timeout) {
  return new Promise(function (resolve) {
    const file = tmpFile('.ps1');
    try { fs.writeFileSync(file, '\ufeff' + script, 'utf8'); } catch (e) { resolve({ err: e, stdout: '', stderr: '' }); return; }
    execFile(powershellPath(),
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', file].concat(args || []),
      { windowsHide: true, timeout: timeout || 20000, maxBuffer: 4 * 1024 * 1024 },
      function (err, stdout, stderr) {
        fs.unlink(file, function () {});
        resolve({ err: err, stdout: String(stdout || ''), stderr: String(stderr || '') });
      });
  });
}

// ---------- Printer status ----------
// Win32_Printer tells us whether Windows considers the printer offline
// (USB cable out / power off / network unreachable), out of paper, etc.
const WMI_SCRIPT = [
  'try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}',
  'Get-WmiObject -Class Win32_Printer | ForEach-Object {',
  '  [Console]::Out.WriteLine(($_.Name + "`t" + $_.WorkOffline + "`t" + $_.PrinterStatus + "`t" + $_.DetectedErrorState + "`t" + $_.PortName))',
  '}'
].join('\r\n');

let wmiCache = { at: 0, data: null, pending: null };

function readWmiStatus() {
  if (!isWin) return Promise.resolve(null);
  const now = Date.now();
  if (wmiCache.data && now - wmiCache.at < 3000) return Promise.resolve(wmiCache.data);
  if (wmiCache.pending) return wmiCache.pending;
  wmiCache.pending = runPowerShell(WMI_SCRIPT, [], 15000).then(function (r) {
    const map = {};
    r.stdout.split(/\r?\n/).forEach(function (line) {
      const p = line.split('\t');
      if (p.length < 5 || !p[0]) return;
      map[p[0].toLowerCase()] = {
        workOffline: /^true$/i.test(p[1]),
        printerStatus: parseInt(p[2], 10) || 0,
        errorState: parseInt(p[3], 10) || 0,
        port: p[4] || ''
      };
    });
    wmiCache = { at: Date.now(), data: r.err && !Object.keys(map).length ? null : map, pending: null };
    return wmiCache.data;
  }).catch(function () { wmiCache.pending = null; return null; });
  return wmiCache.pending;
}

// Windows PRINTER_STATUS_* flags (PRINTER_INFO_2.Status)
const PS = {
  PAUSED: 0x1, ERROR: 0x2, PAPER_JAM: 0x8, PAPER_OUT: 0x10, PAPER_PROBLEM: 0x40,
  OFFLINE: 0x80, NOT_AVAILABLE: 0x1000, USER_INTERVENTION: 0x100000, DOOR_OPEN: 0x400000
};

function classify(p, w) {
  const name = String(p.name || '');
  const port = String((w && w.port) || '').toUpperCase();
  const virtual = /pdf|xps|onenote|fax|send to/i.test(name) ||
    /^(PORTPROMPT:|NUL:|FILE:|XPSPORT:|SHRFAX:)/.test(port) || port.indexOf('ONENOTE') >= 0;
  let state = 'online';
  let reason = 'Ready';
  if (isWin) {
    const st = Number(p.status) || 0;
    if (st & PS.PAUSED) { state = 'error'; reason = 'Paused'; }
    if (st & (PS.ERROR | PS.USER_INTERVENTION)) { state = 'error'; reason = 'Error'; }
    if (st & PS.PAPER_JAM) { state = 'error'; reason = 'Paper jam'; }
    if (st & (PS.PAPER_OUT | PS.PAPER_PROBLEM)) { state = 'error'; reason = 'Paper out'; }
    if (st & PS.DOOR_OPEN) { state = 'error'; reason = 'Cover open'; }
    if (st & (PS.OFFLINE | PS.NOT_AVAILABLE)) { state = 'offline'; reason = 'Offline / not connected'; }
    if (w) {
      if (w.errorState === 4) { state = 'error'; reason = 'Paper out'; }
      if (w.errorState === 7) { state = 'error'; reason = 'Cover open'; }
      if (w.errorState === 8) { state = 'error'; reason = 'Paper jam'; }
      if (w.errorState === 3 && state === 'online') { state = 'warning'; reason = 'Paper low'; }
      if (w.workOffline || w.printerStatus === 7 || w.errorState === 9) { state = 'offline'; reason = 'Offline / not connected'; }
    }
  } else {
    const reasons = String((p.options && p.options['printer-state-reasons']) || '');
    if (Number(p.status) === 5) { state = 'offline'; reason = 'Stopped'; }
    if (/offline|disconnected|unreachable/i.test(reasons)) { state = 'offline'; reason = 'Offline / not connected'; }
    if (/media-empty|media-needed/i.test(reasons)) { state = 'error'; reason = 'Paper out'; }
  }
  if (virtual && state === 'online') { state = 'virtual'; reason = 'Virtual printer (file)'; }
  return { state: state, reason: reason, port: (w && w.port) || '' };
}

async function listPrinters(wc) {
  let printers = [];
  try {
    printers = typeof wc.getPrintersAsync === 'function' ? await wc.getPrintersAsync() : wc.getPrinters();
  } catch (e) { printers = []; }
  const wmi = await readWmiStatus();
  return (printers || []).map(function (p) {
    const c = classify(p, wmi && wmi[String(p.name || '').toLowerCase()]);
    return {
      name: p.name,
      displayName: p.displayName || p.name,
      isDefault: !!p.isDefault,
      state: c.state,
      reason: c.reason,
      port: c.port
    };
  });
}

// ---------- HTML printing (graphical receipts, A4 invoices, labels) ----------
function loadHtmlWindow(html, widthPx) {
  return new Promise(function (resolve, reject) {
    const file = tmpFile('.html');
    fs.writeFileSync(file, html, 'utf8');
    const win = new BrowserWindow({
      show: false,
      width: Math.max(200, widthPx || 900),
      height: 900,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, javascript: true }
    });
    const cleanup = function () {
      try { if (!win.isDestroyed()) win.destroy(); } catch (e) {}
      fs.unlink(file, function () {});
    };
    win.webContents.once('did-fail-load', function (e, code, desc) { cleanup(); reject(new Error('Load failed: ' + desc)); });
    win.webContents.once('did-finish-load', async function () {
      try {
        // wait for logo/QR images and fonts, then measure the content height
        const h = await win.webContents.executeJavaScript(
          '(async function(){' +
          'var im=[].slice.call(document.images);' +
          'await Promise.all(im.map(function(i){return i.complete?0:new Promise(function(r){i.onload=i.onerror=r;setTimeout(r,4000);});}));' +
          'try{if(document.fonts&&document.fonts.ready)await document.fonts.ready;}catch(e){}' +
          'var b=document.body;return Math.ceil(Math.max(b.scrollHeight,b.offsetHeight));})()', true);
        resolve({ win: win, height: Number(h) || 0, cleanup: cleanup });
      } catch (e) { cleanup(); reject(e); }
    });
    win.loadFile(file);
  });
}

async function printHtml(opts) {
  opts = opts || {};
  if (!opts.html) return { ok: false, error: 'Nothing to print' };
  const pxPerMm = 96 / 25.4;
  const widthPx = opts.pageWidthMm ? Math.round(opts.pageWidthMm * pxPerMm) : 900;
  let loaded;
  try { loaded = await loadHtmlWindow(opts.html, widthPx); } catch (e) { return { ok: false, error: String(e.message || e) }; }
  const win = loaded.win;
  const printOpts = { silent: !!(opts.silent && opts.deviceName), printBackground: true, copies: Math.max(1, opts.copies | 0 || 1) };
  if (opts.deviceName) printOpts.deviceName = opts.deviceName;
  if (opts.pageWidthMm) {
    // Thermal roll / label: page width fixed, height = content (or fixed label height)
    const hMm = opts.pageHeightMm ? opts.pageHeightMm : Math.max(30, loaded.height / pxPerMm + 2);
    printOpts.pageSize = { width: Math.round(opts.pageWidthMm * 1000), height: Math.round(hMm * 1000) };
    printOpts.margins = { marginType: 'none' };
    try {
      await win.webContents.executeJavaScript(
        '(function(){var s=document.createElement("style");s.textContent="@page{size:' + opts.pageWidthMm + 'mm ' + hMm.toFixed(1) + 'mm;margin:0}";document.head.appendChild(s);})()', true);
    } catch (e) {}
  } else {
    if (opts.pageSize) printOpts.pageSize = opts.pageSize;
    if (opts.landscape) printOpts.landscape = true;
  }
  return new Promise(function (resolve) {
    let finished = false;
    const done = function (r) { if (finished) return; finished = true; clearTimeout(timer); loaded.cleanup(); resolve(r); };
    const timer = setTimeout(function () { done({ ok: false, error: 'Printer did not respond (timeout)' }); }, 90000);
    try {
      win.webContents.print(printOpts, function (success, reason) {
        done(success ? { ok: true } : { ok: false, error: reason || 'Print failed' });
      });
    } catch (e) { done({ ok: false, error: String(e.message || e) }); }
  });
}

// ---------- RAW (ESC/POS) printing ----------
const RAW_SCRIPT = [
  'param([string]$Printer, [string]$DataPath)',
  '$ErrorActionPreference = "Stop"',
  '$src = @"',
  'using System;',
  'using System.Runtime.InteropServices;',
  'public class KbRawPrint {',
  '  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]',
  '  public class DOCINFO {',
  '    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;',
  '    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;',
  '    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;',
  '  }',
  '  [DllImport("winspool.drv", EntryPoint="OpenPrinterW", SetLastError=true, CharSet=CharSet.Unicode)]',
  '  public static extern bool OpenPrinter(string name, out IntPtr h, IntPtr pd);',
  '  [DllImport("winspool.drv", SetLastError=true)] public static extern bool ClosePrinter(IntPtr h);',
  '  [DllImport("winspool.drv", EntryPoint="StartDocPrinterW", SetLastError=true, CharSet=CharSet.Unicode)]',
  '  public static extern int StartDocPrinter(IntPtr h, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFO di);',
  '  [DllImport("winspool.drv", SetLastError=true)] public static extern bool EndDocPrinter(IntPtr h);',
  '  [DllImport("winspool.drv", SetLastError=true)] public static extern bool StartPagePrinter(IntPtr h);',
  '  [DllImport("winspool.drv", SetLastError=true)] public static extern bool EndPagePrinter(IntPtr h);',
  '  [DllImport("winspool.drv", SetLastError=true)] public static extern bool WritePrinter(IntPtr h, byte[] b, int n, out int w);',
  '  public static string Send(string printer, byte[] bytes) {',
  '    IntPtr h;',
  '    if (!OpenPrinter(printer, out h, IntPtr.Zero)) return "ERR OpenPrinter " + Marshal.GetLastWin32Error();',
  '    try {',
  '      DOCINFO di = new DOCINFO(); di.pDocName = "KAROBAR"; di.pDataType = "RAW";',
  '      if (StartDocPrinter(h, 1, di) == 0) return "ERR StartDocPrinter " + Marshal.GetLastWin32Error();',
  '      try {',
  '        if (!StartPagePrinter(h)) return "ERR StartPagePrinter " + Marshal.GetLastWin32Error();',
  '        int written = 0;',
  '        bool ok = WritePrinter(h, bytes, bytes.Length, out written);',
  '        EndPagePrinter(h);',
  '        if (!ok || written != bytes.Length) return "ERR WritePrinter " + Marshal.GetLastWin32Error();',
  '      } finally { EndDocPrinter(h); }',
  '    } finally { ClosePrinter(h); }',
  '    return "OK";',
  '  }',
  '}',
  '"@',
  'try {',
  '  Add-Type -TypeDefinition $src',
  '  $bytes = [System.IO.File]::ReadAllBytes($DataPath)',
  '  Write-Output ([KbRawPrint]::Send($Printer, $bytes))',
  '} catch { Write-Output ("ERR " + $_.Exception.Message) }'
].join('\r\n');

async function printRaw(opts) {
  opts = opts || {};
  if (!opts.deviceName) return { ok: false, error: 'No printer selected' };
  const buf = Buffer.from(opts.data || []);
  if (!buf.length) return { ok: false, error: 'Nothing to print' };
  const file = tmpFile('.bin');
  fs.writeFileSync(file, buf);
  try {
    if (isWin) {
      const r = await runPowerShell(RAW_SCRIPT, ['-Printer', opts.deviceName, '-DataPath', file], 30000);
      const out = r.stdout.trim();
      if (/(^|\n)OK$/.test(out)) return { ok: true };
      const msg = (out || r.stderr || (r.err && r.err.message) || 'Raw print failed').trim();
      return { ok: false, error: msg.replace(/^ERR\s*/, '').slice(0, 300) };
    }
    return await new Promise(function (resolve) {
      execFile('lp', ['-d', opts.deviceName, '-o', 'raw', file], { timeout: 20000 }, function (err, so, se) {
        resolve(err ? { ok: false, error: String(se || err.message).slice(0, 300) } : { ok: true });
      });
    });
  } finally {
    setTimeout(function () { fs.unlink(file, function () {}); }, 5000);
  }
}

// ---------- Save as PDF ----------
async function savePdf(parent, opts) {
  opts = opts || {};
  const res = await dialog.showSaveDialog(parent || undefined, {
    title: 'Save PDF',
    defaultPath: path.join(app.getPath('documents'), (opts.fileName || 'invoice').replace(/[\\/:*?"<>|]+/g, '-') + '.pdf'),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (res.canceled || !res.filePath) return { ok: false, canceled: true };
  let loaded;
  try { loaded = await loadHtmlWindow(opts.html || '', 900); } catch (e) { return { ok: false, error: String(e.message || e) }; }
  try {
    const data = await loaded.win.webContents.printToPDF({ pageSize: opts.pageSize || 'A4', printBackground: true, preferCSSPageSize: true });
    fs.writeFileSync(res.filePath, data);
    return { ok: true, path: res.filePath };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  } finally { loaded.cleanup(); }
}

function register(getMainWindow) {
  ipcMain.handle('kb-printers-list', async function (e) { return listPrinters(e.sender); });
  ipcMain.handle('kb-print-html', async function (e, opts) { return printHtml(opts); });
  ipcMain.handle('kb-print-raw', async function (e, opts) { return printRaw(opts); });
  ipcMain.handle('kb-save-pdf', async function (e, opts) { return savePdf(getMainWindow(), opts); });
}

module.exports = { register: register };
