# Role-Based Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete POS-style role-based permission system where Cashier, Manager, Admin, and Viewer each see only what they should and can do only what they're allowed to.

**Architecture:** A central `hasPermission(action)` function checks `store.currentUser.role` against a permission matrix. Every screen's CRUD buttons, menu items, and features are gated by this function. Activity logs filter out admin's own actions, showing only staff/branch activities.

**Tech Stack:** Vanilla JS, Firestore, existing `store` object

---

## Role Permission Matrix

| Feature | Owner/Admin | Manager | Cashier | Viewer | Branch |
|---------|:-----------:|:-------:|:-------:|:------:|:------:|
| **VIEW** | | | | | |
| Dashboard (Home) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Parties (list) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Items (list) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sale Invoices (list) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ❌ | ✅ | ✅ |
| Settings | ✅ | ❌ | ❌ | ✅ | ✅ |
| **CREATE** | | | | | |
| Create Invoice | ✅ | ✅ | ✅ | ❌ | ✅ |
| Add Item | ✅ | ✅ | ❌ | ❌ | ✅ |
| Add Party | ✅ | ✅ | ❌ | ❌ | ✅ |
| Purchase | ✅ | ✅ | ❌ | ❌ | ✅ |
| Expense | ✅ | ✅ | ❌ | ❌ | ✅ |
| Payment In/Out | ✅ | ✅ | ❌ | ❌ | ✅ |
| Sale Order | ✅ | ✅ | ❌ | ❌ | ✅ |
| **EDIT** | | | | | |
| Edit Item (price, name) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Edit Party | ✅ | ✅ | ❌ | ❌ | ✅ |
| Edit Invoice | ✅ | ✅ | ❌ | ❌ | ✅ |
| Edit Settings | ✅ | ❌ | ❌ | ❌ | ✅ |
| **DELETE** | | | | | |
| Delete Item | ✅ | ✅ | ❌ | ❌ | ✅ |
| Delete Party | ✅ | ✅ | ❌ | ❌ | ✅ |
| Delete Invoice | ✅ | ✅ | ❌ | ❌ | ✅ |
| Delete User | ✅ | ❌ | ❌ | ❌ | ✅ |
| **ADMIN** | | | | | |
| Add/Delete User | ✅ | ❌ | ❌ | ❌ | ✅ |
| Add Branch | ✅ | ❌ | ❌ | ❌ | ❌ |
| Restore Backup | ✅ | ❌ | ❌ | ❌ | ✅ |
| Import/Export | ✅ | ✅ | ❌ | ❌ | ✅ |
| Barcode Generator | ✅ | ✅ | ❌ | ❌ | ✅ |
| Recycle Bin | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## File Structure

- `app.js` (modify) — Add `hasPermission()`, update all 34 view functions, update nav/menu
- `index.html` (no change) — UI elements controlled via JS
- `styles.css` (minimal) — Add `.no-access` style

---

## Task 1: Create Permission System Core

**Files:**
- Modify: `D:\shop\app.js` (add after `defaults()` function, around line 80)

- [ ] **Step 1: Add permission matrix and hasPermission() function**

Add this code after the `defaults()` function (after line ~80):

```js
/* ============ ROLE PERMISSIONS ============ */
const PERMISSIONS = {
  owner: {
    view: ['*'],
    create: ['*'],
    edit: ['*'],
    delete: ['*'],
    admin: ['*']
  },
  admin: {
    view: ['*'],
    create: ['*'],
    edit: ['*'],
    delete: ['*'],
    admin: ['*']
  },
  manager: {
    view: ['dashboard', 'parties', 'items', 'invoices', 'reports', 'estimates', 'sale-orders', 'purchase-orders', 'bank', 'cash', 'cheques', 'loan', 'barcode', 'recycle', 'expenses', 'payment-in', 'payment-out', 'purchase', 'purchase-return'],
    create: ['invoice', 'item', 'party', 'purchase', 'expense', 'payment-in', 'payment-out', 'sale-order', 'purchase-order'],
    edit: ['item', 'party', 'invoice', 'estimate'],
    delete: ['item', 'party', 'invoice'],
    admin: ['import', 'export', 'barcode', 'recycle']
  },
  cashier: {
    view: ['dashboard', 'parties', 'items', 'invoices'],
    create: ['invoice'],
    edit: [],
    delete: [],
    admin: []
  },
  viewer: {
    view: ['*'],
    create: [],
    edit: [],
    delete: [],
    admin: []
  },
  branch: {
    view: ['*'],
    create: ['*'],
    edit: ['*'],
    delete: ['*'],
    admin: ['import', 'export', 'barcode', 'recycle']
  }
};

function hasPermission(action, feature) {
  var role = (store.currentUser && store.currentUser.role) || 'owner';
  var perms = PERMISSIONS[role] || PERMISSIONS.owner;
  
  // Owner and admin have full access
  if (role === 'owner' || role === 'admin') return true;
  
  // Branch has full access except admin functions
  if (role === 'branch') {
    if (action === 'admin') return (perms.admin || []).includes(feature);
    return true;
  }
  
  var allowed = perms[action] || [];
  if (allowed.includes('*')) return true;
  return allowed.includes(feature);
}

function showNoAccess() {
  toast('You do not have permission to access this feature');
}
```

- [ ] **Step 2: Verify code loads without errors**

Open the app in browser, open console, type `hasPermission('view', 'dashboard')` — should return `true`.

---

## Task 2: Gate Menu Items by Role

**Files:**
- Modify: `D:\shop\app.js` — `buildMenu()` function (line ~113)

- [ ] **Step 1: Add permission checks to menu rendering**

Find the `buildMenu()` function and update it to hide menu items based on role. The menu items are defined in a `MENU` array. Each item needs a `perm` property.

Find the MENU array definition and add `perm` field to each item. Then in `buildMenu()`, add a filter.

The MENU array is around line 95. Update each item to include a `perm` field:

```js
// In the MENU array, add perm field to each item:
const MENU = [
  { icon: '🏠', label: 'HOME', view: 'home', perm: 'dashboard' },
  { icon: '👤', label: 'PARTIES', view: 'parties', perm: 'parties' },
  { icon: '📦', label: 'ITEMS', view: 'items', perm: 'items' },
  { icon: '📄', label: 'SALE', view: 'sale', sub: [
    { icon: '📄', label: 'Create Invoice', view: 'createinvoice', perm: 'invoices' },
    { icon: '📋', label: 'Sale Invoices', view: 'sale', perm: 'invoices' },
    { icon: '💾', label: 'Saved Invoices', view: 'savedinv', perm: 'invoices' },
    { icon: '📝', label: 'Estimate', view: 'estimate', perm: 'estimates' },
    { icon: '💰', label: 'Payment-In', view: 'paymentin', perm: 'payment-in' },
    { icon: '📦', label: 'Sale Order', view: 'saleorder', perm: 'sale-orders' },
  ]},
  { icon: '🛒', label: 'PURCHASE & EXPENSE', view: 'purchase', sub: [
    { icon: '🛒', label: 'Purchase Bills', view: 'purchase', perm: 'purchase' },
    { icon: '💸', label: 'Payment-Out', view: 'paymentout', perm: 'payment-out' },
    { icon: '🧾', label: 'Expenses', view: 'expenses', perm: 'expenses' },
    { icon: '📋', label: 'Purchase Order', view: 'purchaseorder', perm: 'purchase-orders' },
    { icon: '↩️', label: 'Purchase Return', view: 'purchasereturn', perm: 'purchase-return' },
  ]},
  { icon: '📊', label: 'REPORTS', view: 'reports', perm: 'reports' },
  { icon: '☁️', label: 'SYNC, SHARE & BACKUP', sub: [
    { icon: '👥', label: 'User Activity', view: 'useractivity', perm: 'admin-users' },
    { icon: '🔄', label: 'Restore Backup', view: 'restorebackup', perm: 'restore-backup' },
  ]},
  { icon: '🔧', label: 'UTILITIES', sub: [
    { icon: '📥', label: 'Import Items', view: 'importitems', perm: 'import' },
    { icon: '🏷️', label: 'Barcode Generator', view: 'barcode', perm: 'barcode' },
    { icon: '📝', label: 'Bulk Update', view: 'bulkupdate', perm: 'import' },
    { icon: '👤', label: 'Import Parties', view: 'importparties', perm: 'import' },
    { icon: '📤', label: 'Export Items', view: 'exportitems', perm: 'export' },
    { icon: '🗑️', label: 'Recycle Bin', view: 'recyclebin', perm: 'recycle' },
  ]},
  { icon: '⚙️', label: 'SETTINGS', view: 'settings', perm: 'settings' },
];
```

Then in `buildMenu()`, filter out items the user can't view:

```js
function buildMenu(){
  // ... existing code ...
  MENU.forEach(m => {
    // Check if user can view this menu item
    if (m.perm && !hasPermission('view', m.perm)) return;
    
    if(m.sub){
      // Filter sub items too
      var visibleSubs = m.sub.filter(s => !s.perm || hasPermission('view', s.perm));
      if (visibleSubs.length === 0) return;
      // ... render sub menu with visibleSubs ...
    }
    // ... render menu item ...
  });
}
```

- [ ] **Step 2: Verify menu filtering works**

Login as Cashier → only HOME, PARTIES, ITEMS, SALE (limited) should show.
Login as Viewer → all view items should show, but no create/edit buttons inside.

---

## Task 3: Gate View Functions (Screens)

**Files:**
- Modify: `D:\shop\app.js` — All 34 `v*()` functions

- [ ] **Step 1: Add permission check at top of each view function**

For each view function, add a permission check at the top. Here's the mapping:

| Function | Permission Check |
|----------|-----------------|
| `vWelcome()` | `hasPermission('view', 'dashboard')` — always true for all roles |
| `vParties()` | `hasPermission('view', 'parties')` |
| `vItems()` | `hasPermission('view', 'items')` |
| `vSaleList()` | `hasPermission('view', 'invoices')` |
| `vCreateInvoice()` | `hasPermission('create', 'invoice')` |
| `vPurchase()` | `hasPermission('view', 'purchase')` |
| `vPurchaseForm()` | `hasPermission('create', 'purchase')` |
| `vPurchaseOrder()` | `hasPermission('view', 'purchase-orders')` |
| `vPurchaseReturn()` | `hasPermission('view', 'purchase-return')` |
| `vReports()` | `hasPermission('view', 'reports')` |
| `vPaymentIn()` | `hasPermission('view', 'payment-in')` |
| `vPaymentOut()` | `hasPermission('view', 'payment-out')` |
| `vExpenses()` | `hasPermission('view', 'expenses')` |
| `vSaleOrder()` | `hasPermission('view', 'sale-orders')` |
| `vSavedInvoices()` | `hasPermission('view', 'invoices')` |
| `vEstimate()` | `hasPermission('view', 'estimates')` |
| `vUserActivity()` | `hasPermission('admin', 'admin-users')` |
| `vSettings()` | `hasPermission('view', 'settings')` |
| `vProfile()` | `hasPermission('view', 'settings')` |
| `vBank()` | `hasPermission('view', 'bank')` |
| `vCash()` | `hasPermission('view', 'cash')` |
| `vCheques()` | `hasPermission('view', 'cheques')` |
| `vLoan()` | `hasPermission('view', 'loan')` |
| `vBarcode()` | `hasPermission('view', 'barcode')` |
| `vRecycle()` | `hasPermission('view', 'recycle')` |
| `vImport()` | `hasPermission('view', 'import')` |
| `vExportItems()` | `hasPermission('view', 'export')` |
| `vImportParties()` | `hasPermission('view', 'import')` |
| `vBulkUpdate()` | `hasPermission('view', 'import')` |
| `vRestoreBackup()` | `hasPermission('admin', 'restore-backup')` |
| `vGProfile()` | `hasPermission('view', 'settings')` |

For each function, add this pattern at the top:

```js
function vItems(){
  if (!hasPermission('view', 'items')) { showNoAccess(); return; }
  // ... rest of function
}
```

- [ ] **Step 2: Test each role's menu navigation**

Login as Cashier → try clicking restricted menus → should show "no permission" toast.

---

## Task 4: Gate CRUD Buttons Inside Screens

**Files:**
- Modify: `D:\shop\app.js` — Inside each view function's HTML template

- [ ] **Step 1: Hide create/edit/delete buttons based on permissions**

For each screen that has buttons, wrap them in permission checks.

**Items Screen (`vItems`):**
Find the "+ Add Item" button and wrap it:
```js
// Before:
`<button class="btn btn-red" onclick="openItem()">+ Add Item</button>`
// After:
hasPermission('create', 'item') ? `<button class="btn btn-red" onclick="openItem()">+ Add Item</button>` : ''
```

Find edit/delete buttons in item rows and wrap them similarly.

**Parties Screen (`vParties`):**
```js
hasPermission('create', 'party') ? `<button class="btn btn-red" onclick="openParty()">+ Add Party</button>` : ''
```

**Sale Invoices (`vSaleList`):**
```js
hasPermission('create', 'invoice') ? `<button class="btn btn-red" onclick="openSale()">+ New Sale</button>` : ''
```

**Expenses (`vExpenses`):**
```js
hasPermission('create', 'expense') ? `<button class="btn btn-red" onclick="addExpense()">+ Add Expense</button>` : ''
```

**Payment-In (`vPaymentIn`):**
```js
hasPermission('create', 'payment-in') ? `<button class="btn btn-red" onclick="addPaymentIn()">+ Add Payment</button>` : ''
```

**Payment-Out (`vPaymentOut`):**
```js
hasPermission('create', 'payment-out') ? `<button class="btn btn-red" onclick="addPaymentOut()">+ Add Payment</button>` : ''
```

**Purchases (`vPurchase`):**
```js
hasPermission('create', 'purchase') ? `<button class="btn btn-red" onclick="openPurchase()">+ Add Purchase</button>` : ''
```

**User Activity (`vUserActivity`):**
```js
hasPermission('admin', 'admin-users') ? `
  <div class="ua-card" onclick="addUser()">...Add User...</div>
  <div class="ua-card" onclick="showAddBranchModal()">...Add Branch...</div>
` : ''
```

**Settings (`vSettings`):**
For each settings section, check `hasPermission('admin', 'settings')` before showing edit controls.

- [ ] **Step 2: Test as Cashier**

Login as Cashier → Items screen should show list but NO "+ Add Item" button.
Parties screen → NO "+ Add Party" button.
Create Invoice → YES button (cashier can create invoices).
Reports → NOT visible in menu.

---

## Task 5: Gate Delete Operations

**Files:**
- Modify: `D:\shop\app.js` — `deleteItem()`, `deleteParty()`, `deleteInvoice()`, `deleteUser()`

- [ ] **Step 1: Add permission checks to delete functions**

Find each delete function and add a check at the top:

```js
// deleteItem function:
function deleteItem(id){
  if (!hasPermission('delete', 'item')) { showNoAccess(); return; }
  // ... rest of existing code
}

// deleteParty function:
function deleteParty(id){
  if (!hasPermission('delete', 'party')) { showNoAccess(); return; }
  // ... rest of existing code
}

// deleteUser function (already has branch check, add role check):
function deleteUser(uid){
  if (!hasPermission('admin', 'admin-users')) { showNoAccess(); return; }
  // ... existing branch check ...
}
```

- [ ] **Step 2: Hide delete buttons in UI**

For each delete button in the UI, wrap with permission check:
```js
hasPermission('delete', 'item') ? `<button onclick="deleteItem('${item.id}')">Delete</button>` : ''
```

---

## Task 6: Gate Edit Operations

**Files:**
- Modify: `D:\shop\app.js` — `openItem()` (edit mode), `openParty()` (edit mode), `editInvoice()`

- [ ] **Step 1: Add permission checks to edit functions**

Find edit functions and add checks:

```js
// When opening item for edit (check if editing existing item):
function openItem(id){
  if (id && !hasPermission('edit', 'item')) { showNoAccess(); return; }
  // ... rest of function
}

// When opening party for edit:
function openParty(id){
  if (id && !hasPermission('edit', 'party')) { showNoAccess(); return; }
  // ... rest of function
}
```

- [ ] **Step 2: Hide edit buttons in UI**

For each edit button in list screens:
```js
hasPermission('edit', 'item') ? `<button onclick="openItem('${item.id}')">Edit</button>` : ''
```

---

## Task 7: Cashier-Only Dashboard

**Files:**
- Modify: `D:\shop\app.js` — `vWelcome()` (line 195)

- [ ] **Step 1: Simplify dashboard for Cashier role**

In `vWelcome()`, after the role check, if role is `cashier`, show a simplified dashboard:

```js
function vWelcome(){
  // ... existing calculations ...
  
  if (userRole === 'cashier') {
    content.innerHTML = `
      <div style="padding:20px;text-align:center">
        <h2>Welcome, ${userName}</h2>
        <p style="color:#888;margin:8px 0 24px">Cashier Dashboard</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:400px;margin:0 auto">
          <div class="ua-card" onclick="nav('createinvoice')" style="padding:24px;text-align:center">
            <div style="font-size:32px;margin-bottom:8px">📄</div>
            <div style="font-weight:700">Create Invoice</div>
          </div>
          <div class="ua-card" onclick="nav('sale')" style="padding:24px;text-align:center">
            <div style="font-size:32px;margin-bottom:8px">📋</div>
            <div style="font-weight:700">View Invoices</div>
          </div>
          <div class="ua-card" onclick="nav('items')" style="padding:24px;text-align:center">
            <div style="font-size:32px;margin-bottom:8px">📦</div>
            <div style="font-weight:700">View Items</div>
          </div>
          <div class="ua-card" onclick="nav('parties')" style="padding:24px;text-align:center">
            <div style="font-size:32px;margin-bottom:8px">👤</div>
            <div style="font-weight:700">View Parties</div>
          </div>
        </div>
      </div>`;
    return;
  }
  
  // ... rest of existing dashboard code for other roles ...
}
```

---

## Task 8: Viewer Read-Only Mode

**Files:**
- Modify: `D:\shop\app.js` — All view functions that have create/edit/delete buttons

- [ ] **Step 1: Hide all action buttons for Viewer role**

The permission system from Task 4 already handles this since Viewer has empty `create`, `edit`, `delete` arrays. Verify that:

1. Items screen → NO "+ Add Item", NO "Edit", NO "Delete" buttons
2. Parties screen → NO "+ Add Party", NO "Edit", NO "Delete" buttons
3. Invoices → NO "+ New Sale" button
4. Reports → Viewable (Viewer has report access)

- [ ] **Step 2: Test Viewer mode**

Login as Viewer → all data visible, all action buttons hidden, all menu items visible.

---

## Task 9: Activity Log Filtering

**Files:**
- Modify: `D:\shop\app.js` — `vUserActivity()` (line 5354), `logActivity()` (line 51), `userActivityLog()` (line 5419)

- [ ] **Step 1: Filter activity logs - hide admin's own activities**

In `userActivityLog()` function (line 5419), filter out admin/owner activities:

```js
function userActivityLog(){
  var logs = store.activityLog || [];
  var isBranch = store.currentUser && store.currentUser.role === 'branch';
  
  // Filter: show only staff/branch activities, not admin/owner
  if (!isBranch) {
    logs = logs.filter(l => {
      var role = (l.userRole || 'owner').toLowerCase();
      return role !== 'owner' && role !== 'admin';
    });
  }
  
  // ... rest of existing rendering code ...
}
```

- [ ] **Step 2: Add user/role info to activity log entries**

In the activity log display, show who did what with their role badge:

The existing display already shows `l.userName` and `l.userRole`. Make sure these are properly set when staff/branch users perform actions.

- [ ] **Step 3: Test activity log filtering**

Login as Admin → User Activity → Activity Log should show only staff/branch activities (not admin's own).

---

## Task 10: Role Badge in Dashboard Header

**Files:**
- Modify: `D:\shop\app.js` — `vWelcome()` (line 195)

- [ ] **Step 1: Show role badge with user info**

In `vWelcome()`, show a role-specific badge:

```js
// Already exists at line 204:
const roleLabel = userRole === 'owner' ? 'Owner' : 
                  userRole === 'admin' ? 'Admin' : 
                  userRole === 'manager' ? 'Manager' :
                  userRole === 'cashier' ? 'Cashier' :
                  userRole === 'viewer' ? 'Viewer' :
                  userRole === 'branch' ? 'Branch (' + currentUser.branchCode + ')' : 
                  'Secondary Admin';
```

This is already handled. Just verify it shows correctly for each role.

---

## Task 11: Settings Page Permission Gating

**Files:**
- Modify: `D:\shop\app.js` — `vSettings()` (line 6384)

- [ ] **Step 1: Gate settings edit controls**

In `vSettings()`, wrap save/edit buttons with permission checks:

```js
// For each settings section that has edit capability:
hasPermission('admin', 'settings') ? `<button onclick="saveSettings()">Save</button>` : ''
```

- [ ] **Step 2: Make settings read-only for viewers**

Viewer can view settings page but cannot edit anything.

---

## Task 12: Branch-Specific Adjustments

**Files:**
- Modify: `D:\shop\app.js` — Various functions

- [ ] **Step 1: Branch sees same screens as admin but limited admin functions**

Branch should NOT see:
- User Activity (admin-users)
- Restore Backup

Branch SHOULD see:
- All CRUD screens (items, parties, invoices, etc.)
- Add Branch (but not view other branches' details)

Update permission checks for branch role if needed.

---

## Task 13: Final Testing Checklist

- [ ] **Test as Owner:** Full access to everything
- [ ] **Test as Admin:** Full access to everything (same as owner)
- [ ] **Test as Manager:** Can view all, create/edit/delete items/parties/invoices, but CANNOT manage users, settings, restore backup
- [ ] **Test as Cashier:** Simplified dashboard, can ONLY create invoices and view items/parties. No edit/delete anywhere. No reports in menu.
- [ ] **Test as Viewer:** Can view everything, NO create/edit/delete buttons anywhere. All menus visible.
- [ ] **Test as Branch:** Same as admin for CRUD, but cannot access User Activity or Restore Backup
- [ ] **Test Activity Log:** Admin sees only staff/branch activities, not own actions
- [ ] **Test Login Flow:** Each role logs in and sees correct dashboard and menu

---

## Execution Order

1. Task 1 (Permission Core) — Foundation
2. Task 2 (Menu Gating) — Immediate visual feedback
3. Task 3 (View Gating) — Screen-level protection
4. Task 4 (CRUD Button Gating) — Button-level protection
5. Task 5 (Delete Gating) — Operation protection
6. Task 6 (Edit Gating) — Operation protection
7. Task 7 (Cashier Dashboard) — UX improvement
8. Task 8 (Viewer Mode) — Verification
9. Task 9 (Activity Logs) — Admin filtering
10. Task 10-12 (Polish) — Fine-tuning
11. Task 13 (Testing) — Final verification
