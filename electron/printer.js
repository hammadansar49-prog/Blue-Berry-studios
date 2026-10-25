function availablePrinters(printers) {
  return (printers || []).filter(p => p && typeof p.name === 'string' && p.name.trim() &&
    !/^(Microsoft Print to PDF|Microsoft XPS Document Writer|OneNote|Fax|Adobe PDF)(\b|\s|$)/i.test(p.name)).map(p => ({
    name: p.name,
    displayName: p.displayName || p.name,
    isDefault: !!p.isDefault,
    // Electron's Windows status is a spooler bitmask; zero means no reported fault.
    status: Number.isInteger(p.status) ? p.status : null
  }));
}

function checkPrinter(printers, name) {
  const printer = availablePrinters(printers).find(p => p.name === name);
  if (!printer) return { ok: false, error: 'Selected printer is not installed or connected in Windows.' };
  // Windows PRINTER_STATUS_OFFLINE, ERROR, PAPER_JAM, PAPER_OUT, NOT_AVAILABLE.
  const faults = [[0x80, 'offline'], [0x2, 'error'], [0x8, 'paper jam'], [0x10, 'out of paper'], [0x1000, 'unavailable']];
  if (printer.status !== null) {
    const fault = faults.find(([bit]) => (printer.status & bit) !== 0);
    if (fault) return { ok: false, error: `Printer reports ${fault[1]}.` };
  }
  return { ok: true, printer };
}

function receiptPageSize(widthMm, heightPx) {
  if (!Number.isFinite(widthMm) || widthMm < 40 || widthMm > 112) throw new Error('Unsupported receipt paper width.');
  const heightMm = Math.max(80, Math.min(2000, Math.ceil(Number(heightPx || 0) * 25.4 / 96 + 10)));
  return { width: widthMm * 1000, height: heightMm * 1000 };
}

function printJobOptions(job) {
  const copies=job.copies == null ? 1 : job.copies;
  if(!Number.isInteger(copies)||copies<1||copies>10)throw new Error('Copies must be between 1 and 10.');
  if(job.printingType!=null&&!['text','image'].includes(job.printingType))throw new Error('Unsupported printing type.');
  if(job.paperWidthMm!=null)receiptPageSize(job.paperWidthMm,0);
  return {copies,printingType:job.printingType||'text',autoCut:job.autoCut===true,openDrawer:job.openDrawer===true};
}

function peripheralCommands(options) {
  const bytes=[];
  if(options.autoCut)bytes.push(0x1b,0x64,3,0x1d,0x56,0); // Feed three lines, full cut.
  if(options.openDrawer)bytes.push(0x1b,0x70,0,25,250); // Drawer pin 2 pulse.
  return Buffer.from(bytes);
}

module.exports = { availablePrinters, checkPrinter, receiptPageSize, printJobOptions, peripheralCommands };
