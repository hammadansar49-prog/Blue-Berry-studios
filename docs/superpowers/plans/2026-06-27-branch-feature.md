# Branch Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete branch management system allowing admins to create branches with unique codes, and branch staff to login with those codes to access the same store data.

**Architecture:** Similar to the existing staff system (staffMap collection + secondary Firebase app), branches will have their own collection (`branches`) with unique code generation, and a branch login flow that maps branch users to the owner's store data.

**Tech Stack:** Vanilla JS, Firebase Auth (compat SDK), Firestore, existing CSS patterns

---

## Files Overview

| File | Changes |
|------|---------|
| `index.html` | Add Branch modal, All Branches modal, Login with Branch Code button in company modal |
| `app.js` | Branch CRUD functions, code generation, login logic, UI views |
| `styles.css` | Branch cards, modals, All Branches list styling |
| `firestore.rules` | Add branch access rules |
| `firebase-config.js` | No changes needed (already initialized) |

---

## Firestore Data Model

### New Collection: `branches`

```
branches/{branchId}
  branchCode: "MLT-001"     // unique, auto-generated
  name: "Multan Branch"
  phone: "0321-1234567"
  address: "Multan, Punjab"
  ownerUid: "ownerFirebaseUid"
  createdAt: timestamp
  status: "active"
```

### New Collection: `branchMap`

```
branchMap/{branchFirebaseUid}
  ownerUid: "ownerFirebaseUid"
  branchCode: "MLT-001"
  branchName: "Multan Branch"
```

---

## Task 1: Add Branch Modal HTML

**Files:**
- Modify: `index.html` (after `#companyModal` div, before closing `</body>`)

- [ ] **Step 1: Add Add Branch Modal HTML**

Insert this HTML block in `index.html` right after the company modal (around line 420):

```html
<!-- ============ ADD BRANCH MODAL ============ -->
<div class="modal-overlay" id="addBranchModal">
  <div class="modal" style="max-width:480px">
    <div class="modal-head"><h3>Add Branch</h3><button class="x" onclick="closeModal('addBranchModal')">✕</button></div>
    <div class="modal-body">
      <div class="field" style="margin-bottom:14px">
        <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px">Branch Name *</label>
        <input id="brName" placeholder="e.g., Multan Branch" style="width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;font-size:14px;outline:none">
      </div>
      <div class="field" style="margin-bottom:14px">
        <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px">Phone Number *</label>
        <input id="brPhone" placeholder="e.g., 0321-1234567" style="width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;font-size:14px;outline:none">
      </div>
      <div class="field" style="margin-bottom:14px">
        <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px">Address</label>
        <textarea id="brAddress" placeholder="Branch address" rows="3" style="width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;font-size:14px;outline:none;resize:vertical"></textarea>
      </div>
      <div class="field" style="margin-bottom:14px">
        <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px">Branch Password *</label>
        <input id="brPass" type="password" placeholder="Password for branch login" style="width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;font-size:14px;outline:none">
      </div>
      <div id="brError" style="color:var(--red);font-size:12px;min-height:16px;margin-bottom:8px"></div>
    </div>
    <div class="modal-foot" style="padding:14px 20px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:10px">
      <button class="btn btn-outline" onclick="closeModal('addBranchModal')">Cancel</button>
      <button class="btn btn-red" onclick="saveBranch()">Save Branch</button>
    </div>
  </div>
</div>

<!-- ============ ALL BRANCHES MODAL ============ -->
<div class="modal-overlay" id="allBranchesModal">
  <div class="modal" style="max-width:600px">
    <div class="modal-head"><h3>All Branches</h3><button class="x" onclick="closeModal('allBranchesModal')">✕</button></div>
    <div class="modal-body" id="allBranchesList" style="max-height:400px;overflow-y:auto">
      <!-- rendered by renderAllBranches() -->
    </div>
    <div class="modal-foot" style="padding:14px 20px;border-top:1px solid var(--line);display:flex;justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeModal('allBranchesModal')">Close</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Verify HTML renders correctly**

Open `index.html` in browser, inspect DOM to confirm `#addBranchModal` and `#allBranchesModal` divs exist in the page.

---

## Task 2: Add "Login with Branch Code" Button to Company Modal

**Files:**
- Modify: `index.html:411` (inside `#companyModal` footer area)

- [ ] **Step 1: Add Login with Branch Code button**

In `index.html`, find the `#companyModal` section. Inside the `.cm-foot-btns` div (around line 411), add a new button after the existing "Login with User ID" button:

```html
<div class="cm-foot-btns">
  <button class="btn btn-blue" onclick="staffLoginPrompt()" style="width:100%">🔑 Login with User ID</button>
  <button class="btn btn-red" onclick="branchLoginPrompt()" style="width:100%;margin-top:8px">🏢 Login with Branch Code</button>
</div>
```

- [ ] **Step 2: Verify button appears in company modal**

Open company modal, confirm "Login with Branch Code" button appears below "Login with User ID".

---

## Task 3: Add "Add Branch" and "All Branches" Cards

**Files:**
- Modify: `app.js` (in the settings/dashboard section where cards are rendered)

- [ ] **Step 1: Find where admin cards are rendered**

Search for "Add User" or "All Users" card rendering in `app.js`. This is likely in a settings view or admin dashboard.

- [ ] **Step 2: Add Branch Cards**

Add these cards next to the existing user management cards:

```javascript
// Add Branch Card
`<div class="hub-card" onclick="showAddBranchModal()">
  <div class="hub-ic">🏢</div>
  <div class="hub-t">Add Branch</div>
  <div style="font-size:12px;color:#888;margin:6px 0">Create a new branch location.</div>
  <div class="hub-go">Open →</div>
</div>`

// All Branches Card
`<div class="hub-card" onclick="showAllBranchesModal()">
  <div class="hub-ic">🏬</div>
  <div class="hub-t">All Branches</div>
  <div style="font-size:12px;color:#888;margin:6px 0">View and manage all branches with codes.</div>
  <div class="hub-go">Open →</div>
</div>`
```

- [ ] **Step 3: Verify cards appear in admin dashboard**

Open the admin dashboard, confirm "Add Branch" and "All Branches" cards appear.

---

## Task 4: Add Branch Code Generation Functions

**Files:**
- Modify: `app.js` (append after payment breakdown functions, before Firebase section)

- [ ] **Step 1: Add Branch Code Generation Function**

```javascript
/* ============ BRANCH MANAGEMENT ============ */

// Generate unique branch code with city prefix
function generateBranchCode(branchName) {
  // Extract city prefix from branch name (first 3 chars, uppercase)
  const prefix = branchName.substring(0, 3).toUpperCase();
  const num = Math.floor(Math.random() * 900) + 100; // 100-999
  return prefix + '-' + num;
}

// Check if branch code exists in Firestore
async function checkBranchCodeExists(code) {
  try {
    const snapshot = await window.fbDB.collection('branches')
      .where('branchCode', '==', code)
      .get();
    return !snapshot.empty;
  } catch (e) {
    console.error('Error checking branch code:', e);
    return false;
  }
}

// Generate unique branch code (checks Firestore for duplicates)
async function generateUniqueBranchCode(branchName) {
  let code;
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 10) {
    code = generateBranchCode(branchName);
    exists = await checkBranchCodeExists(code);
    attempts++;
  }
  if (exists) {
    throw new Error('Could not generate unique branch code. Please try again.');
  }
  return code;
}
```

- [ ] **Step 2: Add Branch Save Function**

```javascript
// Save new branch
async function saveBranch() {
  const name = (document.getElementById('brName').value || '').trim();
  const phone = (document.getElementById('brPhone').value || '').trim();
  const address = (document.getElementById('brAddress').value || '').trim();
  const pass = document.getElementById('brPass').value || '';
  const errEl = document.getElementById('brError');

  // Validation
  if (!name) { errEl.textContent = 'Branch name is required'; return; }
  if (!phone) { errEl.textContent = 'Phone number is required'; return; }
  if (!pass || pass.length < 4) { errEl.textContent = 'Password must be at least 4 characters'; return; }

  errEl.textContent = 'Creating branch...';

  try {
    // Generate unique branch code
    const branchCode = await generateUniqueBranchCode(name);

    // Create Firebase auth account for branch
    const branchEmail = branchCode.toLowerCase().replace('-', '') + '@branch.karobar.app';
    const sec = secondaryAuth();
    const cred = await sec.createUserWithEmailAndPassword(branchEmail, pass);
    const branchUid = cred.user.uid;
    await sec.signOut();

    // Save branch data to Firestore
    await window.fbDB.collection('branches').doc(branchUid).set({
      branchCode: branchCode,
      name: name,
      phone: phone,
      address: address,
      ownerUid: window.fbAuth.currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });

    // Create branchMap entry
    await window.fbDB.collection('branchMap').doc(branchUid).set({
      ownerUid: window.fbAuth.currentUser.uid,
      branchCode: branchCode,
      branchName: name
    });

    // Add to owner's memberUids
    await window.fbDB.collection('users').doc(window.fbAuth.currentUser.uid).set({
      memberUids: firebase.firestore.FieldValue.arrayUnion(branchUid)
    }, { merge: true });

    errEl.textContent = '';
    closeModal('addBranchModal');
    toast('Branch created! Code: ' + branchCode);
    logActivity('branch', 'Created branch: ' + name + ' (' + branchCode + ')');

  } catch (e) {
    errEl.textContent = 'Error: ' + (e.message || e.code);
    console.error('saveBranch error', e);
  }
}
```

- [ ] **Step 3: Add Show Add Branch Modal Function**

```javascript
// Show Add Branch modal
function showAddBranchModal() {
  document.getElementById('brName').value = '';
  document.getElementById('brPhone').value = '';
  document.getElementById('brAddress').value = '';
  document.getElementById('brPass').value = '';
  document.getElementById('brError').textContent = '';
  showModal('addBranchModal');
}
```

- [ ] **Step 4: Verify functions work in browser console**

Open browser console, type `showAddBranchModal()` and press Enter. Modal should open.

---

## Task 5: Add All Branches View

**Files:**
- Modify: `app.js` (append after saveBranch function)

- [ ] **Step 1: Add Show All Branches Modal Function**

```javascript
// Show All Branches modal
async function showAllBranchesModal() {
  showModal('allBranchesModal');
  await renderAllBranches();
}

// Render all branches list
async function renderAllBranches() {
  const container = document.getElementById('allBranchesList');
  container.innerHTML = '<div style="text-align:center;color:#888;padding:20px">Loading branches...</div>';

  try {
    const ownerUid = window.fbAuth.currentUser.uid;
    const snapshot = await window.fbDB.collection('branches')
      .where('ownerUid', '==', ownerUid)
      .get();

    if (snapshot.empty) {
      container.innerHTML = '<div style="text-align:center;color:#888;padding:40px">No branches created yet</div>';
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const branch = doc.data();
      html += `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border:1px solid var(--line);border-radius:10px;margin-bottom:10px">
          <div style="flex:1">
            <div style="font-weight:700;font-size:15px;color:#222">${branch.name}</div>
            <div style="font-size:12px;color:#888;margin-top:4px">Phone: ${branch.phone || '-'}</div>
            <div style="font-size:12px;color:#888">Address: ${branch.address || '-'}</div>
          </div>
          <div style="text-align:right">
            <div style="background:var(--blue);color:#fff;padding:6px 14px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block">${branch.branchCode}</div>
            <div style="font-size:11px;color:#888;margin-top:6px">${branch.status === 'active' ? '✅ Active' : '❌ Inactive'}</div>
          </div>
        </div>`;
    });

    container.innerHTML = html;

  } catch (e) {
    container.innerHTML = '<div style="text-align:center;color:var(--red);padding:20px">Error loading branches</div>';
    console.error('renderAllBranches error', e);
  }
}
```

- [ ] **Step 2: Verify All Branches modal works**

Click "All Branches" card, confirm modal opens and shows branches (or empty state).

---

## Task 6: Add Branch Login Prompt

**Files:**
- Modify: `app.js` (append after staffLoginPrompt function)

- [ ] **Step 1: Add Branch Login Prompt Function**

```javascript
// Branch Login Prompt
function branchLoginPrompt() {
  try { closeModal('companyModal'); } catch(e) {}
  formModal('Login with Branch Code', `
    <p style="font-size:12px;color:#888;margin:0 0 12px">Enter your branch code and password to access the store data.</p>
    <div class="field">
      <label>Branch Code</label>
      <input id="bl_code" placeholder="e.g., MLT-001" style="text-transform:uppercase" autocomplete="off">
    </div>
    <div class="field" style="margin-top:10px">
      <label>Password</label>
      <input id="bl_pass" type="password" placeholder="Enter password">
    </div>
    <div id="bl_err" style="color:var(--red);font-size:12px;margin-top:8px;min-height:14px"></div>
  `, () => {
    const code = (document.getElementById('bl_code').value || '').trim().toUpperCase();
    const pass = document.getElementById('bl_pass').value || '';
    const err = document.getElementById('bl_err');

    if (!code || !pass) {
      if (err) err.textContent = 'Branch code and password both required';
      return;
    }

    if (err) err.textContent = 'Logging in...';
    window.fbBranchLogin(code, pass, function(m) {
      if (err) err.textContent = m;
    });

    setTimeout(() => {
      try { closeModal('companyModal'); closeModal('formModal'); } catch(e) {}
    }, 1600);
  }, 'Login');
}
```

- [ ] **Step 2: Verify branch login prompt opens**

Click "Login with Branch Code" button, confirm modal opens with code and password fields.

---

## Task 7: Add Firebase Branch Login Handler

**Files:**
- Modify: `app.js` (inside the Firebase IIFE, after `window.fbStaffLogin`)

- [ ] **Step 1: Add Branch Login Handler**

```javascript
// ---- Branch logs in with branch code + password ----
window.fbBranchLogin = function(branchCode, pass, onErr) {
  var code = (branchCode || '').toUpperCase().trim();
  if (!code || !pass) {
    if (onErr) onErr('Branch code and password both required');
    return;
  }

  // Find branch in Firestore by branchCode
  window.fbDB.collection('branches')
    .where('branchCode', '==', code)
    .where('status', '==', 'active')
    .get()
    .then(function(snapshot) {
      if (snapshot.empty) {
        if (onErr) onErr('Invalid branch code');
        return;
      }

      var branchDoc = snapshot.docs[0];
      var branchData = branchDoc.data();
      var branchUid = branchDoc.id;

      // Login with branch's Firebase auth
      var branchEmail = code.toLowerCase().replace('-', '') + '@branch.karobar.app';
      return window.fbAuth.signInWithEmailAndPassword(branchEmail, pass)
        .catch(function(e) {
          var msg = 'Invalid password';
          if (e.code === 'auth/user-not-found') msg = 'Branch not found';
          else if (e.code === 'auth/wrong-password') msg = 'Invalid password';
          else if (e.code === 'auth/network-request-failed') msg = 'Internet connection check karein';
          if (onErr) onErr(msg);
        });
    })
    .catch(function(e) {
      if (onErr) onErr('Error: ' + e.message);
    });
};
```

- [ ] **Step 2: Modify loadUserData to handle branch login**

In the existing `loadUserData` function, add branch detection similar to staff detection:

```javascript
// After line 7240 (isStaffSession check), add:
var isBranchSession = false;
var branchData = null;

// Check if this is a branch user
window.fbDB.collection('branchMap').doc(authUid).get().then(function(mapSnap) {
  if (mapSnap.exists && mapSnap.data() && mapSnap.data().ownerUid) {
    isBranchSession = true;
    branchData = mapSnap.data();
    ownerUid = mapSnap.data().ownerUid;
  }
  // ... continue with existing staff check
});
```

- [ ] **Step 3: Update store.currentUser for branch login**

In the section where `store.currentUser` is set (around line 7256), add branch handling:

```javascript
if (isBranchSession) {
  store.currentUser = {
    name: branchData.branchName || 'Branch',
    role: 'branch',
    id: 'branch',
    branchCode: branchData.branchCode
  };
} else if (isStaffSession) {
  // existing staff code
}
```

- [ ] **Step 4: Verify branch login works**

1. Create a branch via "Add Branch" modal
2. Note the branch code
3. Click "Login with Branch Code"
4. Enter branch code and password
5. Should login and show branch dashboard

---

## Task 8: Add Branch Dashboard View

**Files:**
- Modify: `app.js` (append after branch login functions)

- [ ] **Step 1: Add Branch Dashboard Function**

```javascript
// Show Branch Dashboard (after branch login)
function showBranchDashboard() {
  const branch = store.currentUser;
  if (!branch || branch.role !== 'branch') return;

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center">
      <div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,var(--blue),#5b8def);color:#fff;display:grid;place-items:center;font-size:48px;margin-bottom:24px">🏢</div>
      <h1 style="font-size:28px;font-weight:800;color:#222;margin-bottom:8px">${branch.name}</h1>
      <div style="background:var(--blue);color:#fff;padding:8px 20px;border-radius:20px;font-weight:700;font-size:16px;display:inline-block;margin-bottom:16px">Current Branch</div>
      <div style="font-size:14px;color:#888;margin-bottom:24px">Branch Code: <b>${branch.branchCode}</b></div>
      <button onclick="nav('home')" style="padding:14px 40px;background:var(--red);color:#fff;border:none;border-radius:26px;font-weight:700;font-size:16px;cursor:pointer">Open →</button>
    </div>`;
}
```

- [ ] **Step 2: Update nav function to handle branch role**

In the `nav` function, add branch role check:

```javascript
// After line 146 (currentView=view), add:
if (store.currentUser && store.currentUser.role === 'branch' && view === 'home') {
  showBranchDashboard();
  return;
}
```

- [ ] **Step 3: Verify branch dashboard shows after login**

Login as branch, confirm dashboard shows with branch name and "Current Branch" label.

---

## Task 9: Add Branch Styles

**Files:**
- Modify: `styles.css` (append at end of file)

- [ ] **Step 1: Add Branch Modal Styles**

```css
/* ===== BRANCH MODAL STYLES ===== */
#addBranchModal .field input,
#addBranchModal .field textarea {
  transition: border-color .2s;
}
#addBranchModal .field input:focus,
#addBranchModal .field textarea:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(47,109,246,.1);
}

/* All Branches List */
#allBranchesList .branch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  margin-bottom: 10px;
  transition: .15s;
}
#allBranchesList .branch-card:hover {
  border-color: var(--blue);
  background: #f8f9ff;
}

/* Branch Code Badge */
.branch-code-badge {
  background: var(--blue);
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  display: inline-block;
}

/* Branch Login Button */
.branch-login-btn {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  background: var(--red);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: .15s;
}
.branch-login-btn:hover {
  background: var(--red-dark);
}

/* Branch Dashboard */
.branch-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}
.branch-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--blue), #5b8def);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 48px;
  margin-bottom: 24px;
}
.branch-name {
  font-size: 28px;
  font-weight: 800;
  color: #222;
  margin-bottom: 8px;
}
.branch-tag {
  background: var(--blue);
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 16px;
  display: inline-block;
  margin-bottom: 16px;
}
.branch-code {
  font-size: 14px;
  color: #888;
  margin-bottom: 24px;
}
.branch-open-btn {
  padding: 14px 40px;
  background: var(--red);
  color: #fff;
  border: none;
  border-radius: 26px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: .15s;
}
.branch-open-btn:hover {
  background: var(--red-dark);
}
```

- [ ] **Step 2: Verify styles applied correctly**

Open app in browser, confirm branch modals and dashboard are styled properly.

---

## Task 10: Update Firestore Rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add Branch Rules**

Add these rules after the staffMap section (around line 35):

```javascript
// ---- branches/{branchId} = branch data ----
// Owner can read/write. Branch can read its own data.
match /branches/{branchId} {
  allow read: if request.auth != null && (
    // Owner can read their own branches
    (resource != null && resource.data.ownerUid == request.auth.uid) ||
    // Branch can read its own data
    request.auth.uid == branchId
  );
  allow create: if request.auth != null && request.resource.data.ownerUid == request.auth.uid;
  allow update, delete: if request.auth != null && (
    (resource != null && resource.data.ownerUid == request.auth.uid) ||
    request.auth.uid == branchId
  );
}

// ---- branchMap/{branchUid} = branch to owner mapping ----
// Only owner can create, branch can read its own mapping.
match /branchMap/{branchUid} {
  allow read: if request.auth != null && (
    request.auth.uid == branchUid ||
    (resource != null && resource.data.ownerUid == request.auth.uid)
  );
  allow create: if request.auth != null && request.resource.data.ownerUid == request.auth.uid;
  allow update, delete: if request.auth != null && (
    request.auth.uid == branchUid ||
    (resource != null && resource.data.ownerUid == request.auth.uid)
  );
}
```

- [ ] **Step 2: Verify Firestore rules are valid**

Go to Firebase Console > Firestore > Rules, paste updated rules, click "Publish". Confirm no syntax errors.

---

## Task 11: End-to-End Testing

- [ ] **Step 1: Test Add Branch Flow**

1. Login as owner (admin)
2. Click "Add Branch" card
3. Enter: Name = "Multan Branch", Phone = "0321-1234567", Address = "Multan", Password = "123456"
4. Click "Save Branch"
5. Confirm toast shows "Branch created! Code: XXX-XXX"
6. Confirm modal closes

- [ ] **Step 2: Test All Branches View**

1. Click "All Branches" card
2. Confirm "Multan Branch" appears with code
3. Confirm phone and address are shown

- [ ] **Step 3: Test Branch Login**

1. Logout from owner account
2. Click "Login with Branch Code"
3. Enter branch code and password
4. Click "Login"
5. Confirm branch dashboard shows with "Current Branch" label

- [ ] **Step 4: Test Branch Data Access**

1. Click "Open" on branch dashboard
2. Confirm home page loads
3. Confirm items, parties, sales are visible (same as owner's data)
4. Create a test invoice
5. Confirm invoice saves correctly

- [ ] **Step 5: Test Branch Code Uniqueness**

1. Create another branch with same name
2. Confirm different code is generated
3. Try to login with wrong code
4. Confirm error message appears

- [ ] **Step 6: Test Branch Logout**

1. Click logout
2. Confirm returns to cloud login gate
3. Confirm local data is cleared

- [ ] **Step 7: Verify No Console Errors**

1. Open browser console
2. Confirm no JavaScript errors
3. Confirm Firestore operations complete successfully

---

## Summary of Changes

| File | Change |
|------|--------|
| `index.html` | Add Branch modal, All Branches modal, Login with Branch Code button |
| `app.js` | Branch CRUD functions, code generation, login logic, dashboard view |
| `styles.css` | Branch modal, dashboard, and list styles |
| `firestore.rules` | Branch and branchMap access rules |

---

## Future Enhancements (Not in This Plan)

- Branch-specific settings/permissions
- Branch-level reporting
- Branch inventory management
- Branch-to-branch transfers
- Branch performance analytics
- Deactivate/delete branch functionality
- Branch code regeneration

---

## Notes

1. **Branch Code Format:** `{CITY_PREFIX}-{3 DIGIT NUMBER}` (e.g., MLT-001, LHR-025)
2. **Branch Email Format:** `{branchcode}@branch.karobar.app` (synthetic, for Firebase Auth)
3. **Data Access:** Branch sees same data as owner (items, parties, sales, etc.)
4. **Security:** Branch can only access owner's data, not other branches or other owners
5. **Password:** Required for branch login, minimum 4 characters
