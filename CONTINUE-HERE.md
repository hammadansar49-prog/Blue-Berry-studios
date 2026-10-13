# KAROBAR handover — 13 October 2026

## Open this first on the next computer

Repository: https://github.com/hammadansar49-prog/Blue-Berry-studios

Working branch: `fix/printer-support`. Checkout this branch after cloning; these changes are not yet merged into `main`.

```sh
git fetch origin
git checkout fix/printer-support
npm ci
npm test
npm start
```

Version is 1.0.1. The source is ready for continued verification, **not certified for unrestricted client production use**. Read the blockers below before delivery. No production Firebase rules were deployed. No installer has been built for this final source yet.

## Completed

- Shared desktop/browser invoice printing, real regular/thermal/label queue selection, persistent desktop printer choices, silent driver printing, PDF save, driver-reported status with unknown state rather than fake connected status.
- Thermal 58/80/112mm and custom widths; measured roll length; separate label page sizes. Graphical Unicode, local barcode/QR libraries. ESC/POS ASCII receipt plus raster logo, feed, cut and drawer commands for confirmed compatible devices.
- Uploaded logos on thermal/regular invoices, reports and labels. Wide regular logos use contain rather than crop.
- Explicit receipt subtotal, percentage/amount item discount, bill adjustment and total-after-discount. The visible `<script>bad</script>` was intentionally escaped security-test data, never executable code; it has been removed from the visual demo. Escaping remains regression-tested separately.
- POS prints saved invoice data, not stale previews. Hidden printer settings no longer reset. Reports omit navigation.
- Aggregate stock validation, sale payment synchronization, capped tender/change, historical row cost/metadata, POS tab cleanup, proportional partial/full returns, exchange stock fixes, purchase receipt/accounting, purchase-return duplicate protection and recycle round-trip corrections.
- Numeric scanner matching, strict date parsing, historical-cost gross-profit reporting, current branch names.
- Stable desktop origin, restricted local server, Google callback state, all SDK/scripts bundled locally, authenticated account-scoped offline cache, pending-edit recovery, cloud transaction conflict detection.
- Repository Firestore rules restrict public access. Rules require deployment/testing by the proper Firebase project account.

## Verification already performed

- Automated Node regression suite covers printing, billing, sync, offline account isolation, startup, scanner/report logic and real XLSX import/export. Run `npm test` for the current result.
- Real Edge browser, isolated profile, external requests blocked: 58/80/112/72mm receipts had no horizontal overflow; barcode, QR, sample logo and printer settings rendered. No page errors.
- Real Electron 22.3.27 generated thermal, A4 and 50×30mm label PDFs. Installed virtual Windows queues were enumerated. No physical printer job was submitted.
- Latest explicit-discount wording was unit-tested; re-run browser/PDF checks after this wording change before release.
- Final cross-reviews found no new proven P1 in print IPC/RAW submission or owner sync conflict handling. This is targeted verification, not proof that every feature works on every device.

## Pending — do in this order

1. **Cloud release blocker:** secure rules intentionally allow only owner writes to the entire serialized store. Staff/branch writes cannot safely be enabled by granting permission to replace that whole document. Implement scoped protected backend mutations or protected entity documents, then test owner/staff/branch permissions and concurrent sales. Code-only unauthenticated branch access is no longer supported; branch selection needs an authorized account. Do not advertise full multi-branch cloud billing until resolved.
2. **Firebase permissions/deployment:** `firebase deploy --only firestore:rules --project karobar-3dad1 --dry-run --non-interactive` returned HTTP 403 because the CLI account lacks `serviceusage.services.use`. Authenticate with an authorized project account. Run Rules emulator/integration tests (Java was unavailable here), validate, then deploy only the intended rules. Live Google/email login, membership and reconnect/concurrency tests still needed. Existing publicly exposed cloud credentials need owner cleanup after rules are secured.
3. **Printer acceptance:** test the client's actual model/driver, 58/80mm roll, long bill, Urdu, logo, regular invoice, label scan, unplug/replug status, cutter and drawer. Graphical mode uses driver cut/drawer preferences; RAW requires ESC/POS. No “every printer works” guarantee. Low-paper/low-toner warning handling is currently conservative and can block submission; refine/test if required.
4. **Small labels:** specifically test 38×21mm with logo and every enabled text field. Current label content has fixed height/hidden overflow; large content can clip. Improve fit or reject too-dense labels before client use. 50×30mm path was probed, not physically scanned.
5. **Old installation migration:** export a verified backup from the old running app before upgrading. Old random-port localStorage is not automatically merged into the new fixed localhost:17843 origin. Historical records without cost/tax metadata and old purchase balances require reconciliation, not guessed migration.
6. **Final build:** after pending fixes/tests, commit and push source FIRST (user requirement), then `npm run dist`. Expected installer `dist/KAROBAR-Setup-1.0.1.exe`. Test clean install, launch, close/reopen, saved data, and offline reopen. Electron 22 is legacy; Windows 7/8 and physical devices were not tested. No installer was produced for the final state in this session.
7. **Sidebar icons:** user requested replacing emoji sidebar icons with consistent professional icons, then explicitly asked to defer them until the original software work was finished. Still pending; do not confuse these with the client's uploaded invoice logo.

## Optional reproduction tools

- `tests/browser-smoke.cjs` needs Playwright and Edge. It creates isolated synthetic data and outputs to ignored `test-output/`.
- Run `node_modules/electron/dist/electron.exe tests/electron-smoke.cjs` after the browser smoke. It writes sample PDFs and printer enumeration; no physical printing.
- This Windows machine's npm/Electron zip extractor left an incomplete runtime despite returning success. The downloaded archive was SHA-256 verified against Electron's bundled checksums and extracted with PowerShell to repair the local development install. This workaround was not committed into application code.

Further details: `docs/PRINTING.md`, `docs/BILLING-AUDIT.md`, `docs/RELEASE-AUDIT.md`, `docs/BUNDLED-LIBRARIES.md`.
