# Billing audit — 13 October 2026

Scope: targeted financial/data-integrity review of invoice saving/editing, stock movements, returns/exchanges, purchase invoices, standalone payments, and invoice recycling. This is not a certification of every business workflow.

## Changes

- All invoice save paths validate quantities, money and combined stock demand, including duplicate rows and size-tracked inventory. Editing credits the original sold stock before availability checks.
- Excess cash tender is treated as change, not negative customer debt. Invoice edits update their linked payment record. Saved rows retain item metadata and historical purchase cost.
- POS tabs retain their own charges/discounts and clear completed drafts. New POS invoices retain tax configuration for later edits.
- Item returns preserve returned quantities, restore inventory once, reduce customer debt, and record actual cash refunds. Invoice-level discounts, taxes and charges are allocated proportionally to returned items. Exchanges deduct replacement inventory only when saved.
- Purchases now receive stock and record supplier payable with the correct sign. Cash/card/bank purchases record outgoing payments. Deletion reverses recorded effects; legacy purchases are treated separately because the old code did not receive stock.
- Recycling stores the actual record, reverses sale inventory/balance/payment effects, and reapplies them on restore. Legacy nested recycle records are unwrapped.
- Standalone payment saving checks permissions and finite positive amounts. Missing dates receive a valid current date.
- Purchase returns now deduct inventory, snapshot rows, validate stock/discounts, and prevent repeated saving of the same draft.

## Verification

Run `node --test tests/billing.test.js tests/app-print.test.js` and `node --check app.js`.

At completion, 23 tests pass (17 billing, 6 print integration). The tests execute actual app functions in isolated Node VM contexts. They cover aggregate overselling, edit stock credit, invalid amounts, sizes, payment synchronization, actual direct sale saving, tender/change, stale drafts, partial/full refund interaction, proportional discounts, purchase receipt/payable, recycle round-trip, saved tax configuration, invalid standalone payments, purchase-return stock and duplicate-save protection. Print tests verify the saved invoice reaches the shared pipeline.

These tests do not exercise physical printers, browser rendering, real cloud synchronization, or every form control.

## Legacy and operating limits

- Historical invoices without `costPrice` or `taxConfig` cannot recover their original catalog cost/tax settings. No speculative migration of existing balances or stock was performed.
- Historical purchase invoices may already have incorrect supplier balances and omitted inventory movements. The patch prevents new errors; existing financial records need reconciliation against source documents.
- Purchase-return notes represent supplier credit due (`received: 0`); actual money received is recorded separately through the payment flow. They validate available stock but do not prove quantities against an originating purchase invoice.
- Automated tests cover local function behavior. Multi-device concurrent edits, crash-atomic persistence and manual reconciliation of historical data are outside this focused pass.
