# Accounting fix update — version 3.0.1

The concurrent accounting defect recorded below is fixed with unique, replay-safe accounting operations. Regression tests now cover stock, size stock, party balances, counters, receipt status, offline restart, shared tabs and lost acknowledgements. All devices must update to 3.0.1; older clients still contain the overwrite bug. Existing incorrect balances are not rewritten automatically because there is no safe way to infer historical opening balances.

The remainder of the original audit is preserved below; its other gaps remain pending.

# Client requirements audit â€” 2026-10-25

This audit supersedes the earlier broad claim that Phase 4 was complete. Existing 30 tests pass, but an additional two-device accounting probe reproduced a critical gap not covered by those tests.

## Verified implementation
- Regular and thermal themes use a shared invoice renderer for preview/printing; custom widths and named PDF download exist.
- Direct Save and Save & New persist invoices without requiring the print preview.
- Original subtotal, discount percentage/amount, total, received and balance/change are rendered. Client example: 49,785 less 35% = 32,360.25 (discount 17,424.75).
- Payment-In search, date presets/range, firm/user selectors, filtered totals, and confirmed deletion exist. Deletion adjusts linked receipts and party balance.
- Public HTTPS app is deployed. Isolated real Firebase owner/branch account read/write and access-denial tests passed; temporary data was removed.

## Confirmed gaps
1. CRITICAL: simultaneous device sales retain both sale records but lose concurrent numeric changes. Reproduction: stock 10, balance 0, counter 1; two disconnected snapshots each save a one-unit, 100-credit sale. Result after sync: 2 sales, stock 9, balance 100, counter 2. Required: stock 8, balance 200, counter 3. Current recoverChanges chooses a local scalar on conflict. Requires transaction/operation-aware accounting, including replay protection; simply adding arbitrary numeric fields is unsafe.
2. Full Mode opens a new POS tab; the current compact customer/items/discount/received draft is not transferred.
3. Original audio mentions Google Drive. Current implementation uses Firebase Firestore cloud sync and local backup files, not Google Drive integration.
4. Historical payments without stored attribution cannot identify their original user/firm reliably: user may be Unspecified and firm falls back to current business. New manual payments retain firm/user metadata.

## Not fully verified
- Exact visual match to every reference screenshot: themes exist, but pixel-equivalence has not been established.
- Repeated header in long *direct-download* PDFs: browser printing was tested, but html2pdf rasterized downloads do not yet have a dedicated multi-page header regression check.
- Physical printing, roll/margin calibration, cut/drawer, and real two-device offline acceptance. User has deferred hardware testing.

## Current status
Phase 1: implemented; visual and hardware acceptance pending.
Phase 2: core save/calculation verified; compact-to-full draft transfer gap.
Phase 3: implemented and tested; legacy attribution limitation.
Phase 4: browser access/login verified; concurrent accounting NOT complete; no Drive integration.
Phase 5: automated checks passed within their coverage; final acceptance NOT complete.
