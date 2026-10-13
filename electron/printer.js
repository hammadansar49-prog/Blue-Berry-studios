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
  if (![58, 80, 104].includes(widthMm)) throw new Error('Unsupported receipt paper width.');
  const heightMm = Math.max(80, Math.min(2000, Math.ceil(Number(heightPx || 0) * 25.4 / 96 + 10)));
  return { width: widthMm * 1000, height: heightMm * 1000 };
}

module.exports = { availablePrinters, checkPrinter, receiptPageSize };
