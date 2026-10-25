# Audit correction

See `client-requirements-audit.md`: concurrent sales preserve records but can lose stock/balance/counter updates. Phase 4 is not fully complete.

# Phase 4 and 5 verification

## Changes
- Branch creation publishes branch metadata, login mapping, lookup, code reservation and owner membership in one Firestore batch. Failed publication attempts remove the newly-created Auth account.
- Branch login requires an existing enabled branch record; deleted mappings cannot become new owner stores.
- Branch codes must contain six digits. Login feedback distinguishes network failures, throttling and disabled accounts.
- Firestore rules preserve mapping ownership and prevent branches changing their own ownership metadata.
- `npm run build:web` creates an allowlisted `web-dist/` with real Firebase login/sync. The local `npm run preview` remains an isolated demo, not a live cloud-sync test.
- Hosting publishes only `web-dist/`; HTML, JS and CSS revalidate after deployments.

## Verification completed
- `npm test`: 30 passing tests covering pending/offline writes, account isolation, branch-to-owner mapping, disabled branches, concurrent record additions, payment deletion, receipt amounts, printer options and stable desktop origin.
- Browser regression: 4 regular and 5 thermal themes, actual print windows, image printing, automatic PDF filename, custom paper width/cancel, full-mode access, direct Save/Save & New, stock deduction once, responsive layouts and PDF pagination.
- JavaScript syntax and whitespace checks passed.

## Still needs live verification
- Completed 2026-10-25: hosting and Firestore rules deployed to `karobar-3dad1`; live URL https://karobar-3dad1.web.app.
- Live disposable-account integration passed: atomic branch setup, branch password login, owner-store read/write, anonymous access denied. Temporary accounts and records were removed.
- Live HTTPS browser check passed: latest build, Firebase login visible, no JavaScript errors.
- Sign into one owner and one branch on separate devices; save from both, reconnect after an offline edit, and check shared records and balances.
- Verify physical paper width, margins, copies, cutter and cash drawer on the connected printer.
- Unit sync tests use a simulated backend. The separate live test also verified production Firestore access; physical two-device operation remains a user acceptance check.

## Commands
- Local demo: `npm run preview`
- Web build: `npm run build:web`
- Automated checks: `npm test`
- Deploy after project access is verified: `firebase deploy --project karobar-3dad1 --only hosting,firestore:rules`
