// Generates assets/icon.ico (multi-size) and assets/icon.png
// Black background, white bold "KAROBAR" text.
// Run: node scripts/make-icon.js   (deps: @napi-rs/canvas, png-to-ico)
const { createCanvas } = require('@napi-rs/canvas');
const _pti = require('png-to-ico');
const pngToIco = _pti.default || _pti;
const fs = require('fs');
const os = require('os');
const path = require('path');

const TEXT = 'KAROBAR';

function render(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  // black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  // white bold text, auto-fit to ~86% of width
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxW = size * 0.86;
  let fontSize = size;
  do {
    fontSize -= 1;
    ctx.font = '700 ' + fontSize + 'px Arial, sans-serif';
  } while (ctx.measureText(TEXT).width > maxW && fontSize > 4);
  ctx.font = '700 ' + fontSize + 'px Arial, sans-serif';
  ctx.fillText(TEXT, size / 2, size / 2);
  return c.toBuffer('image/png');
}

const assets = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assets, { recursive: true });

// main PNG (used by docs / png icon needs)
fs.writeFileSync(path.join(assets, 'icon.png'), render(256));

// write each size to temp files, then combine into a single .ico
const sizes = [256, 128, 64, 48, 32, 16];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ico-'));
const files = sizes.map(function (s) {
  const f = path.join(tmp, s + '.png');
  fs.writeFileSync(f, render(s));
  return f;
});

pngToIco(files).then(function (buf) {
  fs.writeFileSync(path.join(assets, 'icon.ico'), buf);
  files.forEach(function (f) { try { fs.unlinkSync(f); } catch (e) {} });
  try { fs.rmdirSync(tmp); } catch (e) {}
  console.log('Created assets/icon.ico and assets/icon.png');
}).catch(function (e) {
  console.error('icon build failed:', e);
  process.exit(1);
});
