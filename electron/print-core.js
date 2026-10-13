'use strict';

function windowsStatus(p) {
  if (!p) return { state: 'unknown', detail: 'Driver status unavailable' };
  if (p.WorkOffline === true || Number(p.PrinterStatus) === 7)
    return { state: 'offline', detail: 'Windows reports offline' };
  const error = Number(p.DetectedErrorState);
  if (error > 2) return { state: 'error', detail: ({3:'Low paper',4:'No paper',5:'Low toner',6:'No toner',7:'Cover open',8:'Paper jam',9:'Offline',10:'Service required',11:'Output bin full'})[error] || 'Printer error' };
  if ([3,4,5].includes(Number(p.PrinterStatus)) && error === 2)
    return { state: 'ready', detail: 'Ready (reported by driver)' };
  return { state: 'unknown', detail: 'Installed; physical connection unverified' };
}

function numberIn(value, min, max, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error('Invalid ' + name);
  return value;
}

function validateJob(input) {
  if (!input || typeof input !== 'object') throw new Error('Missing print job');
  const j = { ...input };
  if (typeof j.html !== 'string' || !j.html || Buffer.byteLength(j.html) > 8 * 1024 * 1024)
    throw new Error('Invalid or oversized print document');
  if (j.deviceName !== undefined && (typeof j.deviceName !== 'string' || j.deviceName.length > 512 || /[\x00-\x1f]/.test(j.deviceName)))
    throw new Error('Invalid printer name');
  j.kind = j.kind || 'regular';
  if (!['regular','thermal','label'].includes(j.kind)) throw new Error('Invalid paper type');
  if (j.kind !== 'regular') numberIn(j.widthMm, 10, 300, 'paper width');
  if (j.kind === 'label') numberIn(j.heightMm, 10, 1000, 'label height');
  j.paper = ['A4','A5','Letter','Legal'].includes(j.paper) ? j.paper : 'A4';
  j.silent = j.silent === true;
  if (j.silent && !j.deviceName) throw new Error('Select a printer before silent printing');
  return j;
}

function escpos(j) {
  if (j.escposConfirmed !== true) throw new Error('Confirm ESC/POS support in Printer Settings first');
  if (typeof j.text !== 'string' || j.text.length > 1024 * 1024) throw new Error('Invalid receipt text');
  if (/[^\x00-\x7f]/.test(j.text)) throw new Error('Use graphical printing for Urdu or other non-ASCII text');
  if (/[\x00-\x09\x0b-\x1f\x7f]/.test(j.text)) throw new Error('Receipt contains unsupported control characters');
  const feed = numberIn(j.feedLines === undefined ? 3 : j.feedLines, 0, 20, 'feed lines');
  if (!Number.isInteger(feed)) throw new Error('Invalid feed lines');
  let logo=Buffer.alloc(0);
  if(j.logo){
    const width=numberIn(j.logo.widthBytes,1,128,'logo width');
    const height=numberIn(j.logo.height,1,1024,'logo height');
    if(!Number.isInteger(width)||!Number.isInteger(height)||typeof j.logo.data!=='string'||j.logo.data.length>180000)throw new Error('Invalid logo raster');
    const raster=Buffer.from(j.logo.data,'base64');
    if(raster.length!==width*height)throw new Error('Invalid logo raster length');
    // GS v 0: monochrome raster, compatible ESC/POS printers only.
    logo=Buffer.concat([Buffer.from([27,97,1,29,118,48,0,width&255,width>>8,height&255,height>>8]),raster,Buffer.from([10,27,97,0])]);
  }
  return Buffer.concat([
    Buffer.from([27,64]),logo,Buffer.from([27,69,j.bold ? 1 : 0]), Buffer.from(j.text,'ascii'),
    Buffer.from('\n'.repeat(feed + 1),'ascii'), Buffer.from([27,69,0]),
    j.drawer ? Buffer.from([27,112,0,25,250]) : Buffer.alloc(0),
    j.cut ? Buffer.from([29,86,0]) : Buffer.alloc(0)
  ]);
}

module.exports = { windowsStatus, validateJob, escpos };
