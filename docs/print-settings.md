# Print settings and invoice themes

Settings → Print opens the full-width print workspace. Changes save immediately.
Regular and thermal printers retain separate profiles in `settings.printProfiles`.

## Layouts

- Regular: Tally, Landscape 1 (horizontal totals), Landscape 2 (tax summary beside totals), Tax 1 (three-column address block and shaded totals).
- Thermal: Theme 1 (table with per-item final amount), Theme 2 (compact table), Theme 3 (stacked item details), Theme 4 (centered customer/footer and invoice details above customer).

Company fields, logo, columns, additional item details, totals, words, bank information,
terms, signatures, barcode and QR are rendered by `print-engine.js`. Settings preview,
compact Sale, saved invoices and full POS printing share this renderer and `invoice-print.css`.
Sample preview records do not enter the sales store. The sample logo placeholder only
appears in settings; real invoices use the business logo when uploaded.

Regular profiles include paper/orientation, colors, typography, minimum item rows,
repeated headers, PDF top spacing, and original/duplicate copies. Thermal profiles
include roll width, custom width/character count, copies, extra lines, text/image
printing and optional cutter/drawer commands. The roll presets retain the app's physical
58/80/104 mm sizes. Custom widths support 40–112 mm, including 68 and 88 mm.

## Printing

Browser printing opens a print document; choose the destination printer or Save as PDF.
Image mode rasterizes the same receipt at double resolution. Copy count creates complete
copies, so leave the browser print dialog at one copy. Original/Duplicate produces two
labeled regular documents. Desktop thermal printing uses the selected Windows queue.

Cutter and drawer commands are sent through Windows RAW spooling after the receipt job
is accepted. They require an ESC/POS-compatible printer/cutter/drawer. They are off by
default. Windows acceptance does not confirm physical paper output. If peripheral
commands fail after receipt submission, the app reports that separately to avoid
suggesting the receipt itself needs to be printed again. Image-mode receipts longer
than 7500 CSS pixels request Text Printing instead of silently truncating.

Actual device printing and peripheral commands still require hardware verification.
No physical print jobs are sent by the automated tests.

## Data compatibility

Existing flat print preferences remain a migration fallback. New profile controls do not
overwrite unrelated settings. New POS invoices retain bill discounts, tax, extra charges,
rounding and item metadata. Historical totals remain authoritative; missing old breakdowns
are reconciled without fabricating tax. CGST/SGST details render only from explicit
`taxBreakdown` data; unsplit existing tax is displayed as total tax with split fields blank.

## Verification

```powershell
node --test scripts/print-engine.test.cjs electron/printer.test.js electron/local-origin.test.js scripts/sync.test.cjs
$env:PLAYWRIGHT_PATH = 'absolute/path/to/playwright'
node scripts/print-ui.cjs
```

The browser tests use an isolated local fixture with Firebase removed, generate all eight
theme screenshots, exercise visibility/width/copies/reload, run text and image print
actions, save and print a discounted compact-sale invoice, export PDFs and check four
viewport widths. Artifacts are written to the OS temporary `karobar-print-review` folder.
`node scripts/print-ui.cjs --serve` opens a sample-only preview server on an available
localhost port; it does not connect to a real account.

Native API references: [Electron webContents](https://www.electronjs.org/docs/latest/api/web-contents),
[Windows raw printing](https://learn.microsoft.com/en-us/windows/win32/printdocs/sending-data-directly-to-a-printer).
