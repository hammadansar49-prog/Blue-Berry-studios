# Printer setup and verified scope

## Setup

1. Install the manufacturer's printer driver and print its operating-system test page. USB, network and Bluetooth devices must appear as installed print queues.
2. In Settings → Print, choose separate Regular, Thermal and Label queues. Device choices stay on this desktop; they are not synced to other computers.
3. Select thermal invoice layout or regular paper. Thermal widths are 58, 80, 112mm, or custom 48–112mm. Choose the actual media width, not its approximate inch marketing name. Select A4, A5, Letter or Legal for regular documents.
4. Upload the company logo under business settings. PNG/JPEG/WebP logos print on regular/thermal invoices, reports and labels. Keep Show Company Logo enabled for invoices. RAW mode sends a monochrome raster logo; graphical mode preserves graphics and Unicode.
5. Use Graphical mode for Urdu, barcodes and the broadest driver support. Set cutter/drawer options in the driver for this mode. For a documented ESC/POS device, confirm compatibility, select RAW mode, and enable cut/drawer as needed. RAW text is ASCII-only; unsupported characters produce an actionable error instead of corrupt output. ESC/POS raster/cutter/pulse variants still require a device test.
6. Click Print test receipt. Only enable silent printing after confirming the correct queue and paper size. Labels use the barcode screen's measured width and height; regular label sheets use A4.

## Actual behavior

- Invoice, POS and saved-invoice printing share the same pipeline and print saved records rather than stale preview markup.
- Thermal roll height is measured from rendered receipt content after images/fonts are ready. Receipts over 2m are rejected rather than silently truncated. Drivers may impose smaller limits.
- All application scripts, barcode and QR generators ship locally. No CDN is required to render printed barcode/QR graphics.
- Desktop Download saves a PDF through a save dialog. Browser printing uses its native dialog; choose Save as PDF there. Browsers cannot enumerate queues or send RAW commands.
- Windows status is explicitly **driver-reported**: green ready, red offline/error, amber unknown/unverified. Queue presence is never treated as proof of a cable connection. Some drivers report stale status or no useful status.
- A successful callback means the operating system accepted a job, not that paper physically emerged. Failures and cancellations are reported; automatic duplicate retries are avoided.
- Reports print report/modal content, not the navigation sidebar. Purchase/report popup paths use the regular queue. Label mode prints one measured label per page.

## Verification on 13 October 2026

- Node regression checks cover printer IPC trust, dimensions, failure cleanup, persisted choices, RAW commands/logo validation, receipt settings, POS routing and financial workflows.
- An isolated real Edge browser with external networking blocked rendered 58/80/112/72mm receipts without horizontal overflow, generated barcode/QR locally, and rendered printer settings without page errors.
- Electron 22.3.27 generated real thermal and A4 PDF files with a sample logo. Installed Windows queues were enumerated. The machine has virtual print queues only.
- **Not physically tested:** any thermal/label/laser/inkjet device, cutter, cash drawer, barcode scanner, Windows 7/8, macOS or Linux. macOS/Linux RAW uses CUPS `lp -o raw` and requires a compatible installed queue; those paths are not certified here.

## Client acceptance checks

Use a short receipt, a long receipt, an Urdu product, a logo, a barcode scan, a regular invoice and multiple labels. Confirm totals, margins, paper width, logo contrast and scan readability. Then disconnect/reconnect the printer and check driver status/error behavior. Test cut/drawer only on hardware that supports those commands.

## References

- [Electron 22 print and PDF API](https://github.com/electron/electron/blob/v22.3.27/docs/api/web-contents.md)
- [Microsoft Win32_Printer driver status](https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-printer)
- [Microsoft WritePrinter / RAW data](https://learn.microsoft.com/en-us/windows/win32/printdocs/writeprinter)
- [CUPS printing options](https://openprinting.github.io/cups/doc/options.html)
- [Electron Windows 7/8 legacy support](https://www.electronjs.org/blog/windows-7-to-8-1-deprecation-notice)
