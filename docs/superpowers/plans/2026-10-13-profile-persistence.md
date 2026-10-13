# Profile Persistence and Sidebar Fix

Approved scope: preserve company profile/logo across refresh and sign-in, show
the logo beside the user name, and prevent sidebar scroll overlap.

Keep the existing Firestore store format. Bound uploaded images before embedding
them. Record pending changes under the authenticated account and store IDs before
scheduling writes. Only acknowledge successful writes; block stale reads while
changes are pending. Restore pending changes on the same account, merging them
against the remote baseline. Guard asynchronous callbacks against account changes.
Keep sidebar header/footer outside an opaque, clipped scroll region.

- Add regression tests against the actual cloud-sync closure for failed writes,
  delayed reads, logout/restart recovery, and account isolation.
- Fix persistence and upload paths; retain the existing badge logo behavior.
- Stabilize sidebar boundaries and run Electron UI tests at small/large sizes.
- Run regression and existing smoke/print checks and inspect the final diff.

Live Firebase credentials are not used by automated tests; network integration
must be distinguished from the deterministic simulated Firestore checks.

Implementation and local validation complete: transaction-based cloud writes,
account-keyed pending recovery, shared-tab pending merge, bounded logo/signature
uploads, stable desktop origin and clipped opaque sidebar scrolling.
Node regressions, existing Electron smoke checks and small/large window profile
checks pass. Local preview runs at http://localhost:5500 for the user's real
account test. Installation is deferred until that test, per the user's request.
Rebuild the desktop package from the final source before installing.
