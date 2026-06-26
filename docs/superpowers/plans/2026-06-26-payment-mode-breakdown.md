# Payment Mode Breakdown Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user clicks the "How Customers Paying / See Profits" button, open a modal showing 4 cards (Cash, Bank Transfer, QR Code, Cheques) with total amounts received via each payment mode, extracted from `store.payments`.

**Architecture:** One new function `showPaymentBreakdown()` that reads `store.payments`, groups by `mode`, renders a modal with 4 colored cards. One new HTML modal div added to `index.html`. Styles added to `styles.css`. Button `onclick` updated from `toast('Coming soon')` to `showPaymentBreakdown()`.

**Tech Stack:** Vanilla JS, existing CSS patterns, no new libraries.

---

## Files

| Action | File | What |
|--------|------|------|
| Modify | `index.html:25` | Change button onclick from `toast('Coming soon')` to `showPaymentBreakdown()` |
| Modify | `index.html` (after loginModal) | Add new `#paymentModal` overlay div |
| Modify | `app.js` | Add `showPaymentBreakdown()` function + helper |
| Modify | `styles.css` | Add `.pm-*` styles for payment modal cards |

---

### Task 1: Add Payment Modal HTML

**Files:**
- Modify: `index.html` (before closing `</body>`, after passcodeModal around line 440)

- [ ] **Step 1: Add the modal HTML**

Insert this HTML block in `index.html` right before the `<script>` tags (before line 440):

```html
<!-- ============ PAYMENT MODE BREAKDOWN MODAL ============ -->
<div class="modal-overlay" id="paymentModal">
  <div class="pm-modal">
    <div class="pm-head">
      <h2>How Customers Are Paying</h2>
      <button class="pm-close" onclick="closeModal('paymentModal')">✕</button>
    </div>
    <div class="pm-filters">
      <label>From:</label>
      <input type="date" id="pmFrom" onchange="renderPaymentBreakdown()">
      <label>To:</label>
      <input type="date" id="pmTo" onchange="renderPaymentBreakdown()">
    </div>
    <div class="pm-cards" id="pmCards"></div>
    <div class="pm-total-row" id="pmTotalRow"></div>
  </div>
</div>
```

- [ ] **Step 2: Verify HTML renders correctly**

Open `index.html` in browser, inspect DOM to confirm `#paymentModal` div exists in the page.

---

### Task 2: Add Styles for Payment Modal

**Files:**
- Modify: `styles.css` (append at end of file)

- [ ] **Step 1: Add CSS rules**

Append these styles at the end of `styles.css`:

```css
/* ===== PAYMENT MODE BREAKDOWN MODAL ===== */
.pm-modal{background:#fff;border-radius:16px;width:680px;max-width:96vw;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden}
.pm-head{display:flex;align-items:center;justify-content:space-between;padding:22px 28px 14px}
.pm-head h2{margin:0;font-size:20px;font-weight:800;color:#222}
.pm-close{width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:#fff;display:grid;place-items:center;cursor:pointer;font-size:16px;color:#888;transition:.15s}
.pm-close:hover{background:#f5f5f5;color:#333}
.pm-filters{display:flex;align-items:center;gap:10px;padding:0 28px 18px;font-size:13px;color:#666}
.pm-filters label{font-weight:600}
.pm-filters input{border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-size:13px;outline:none}
.pm-filters input:focus{border-color:var(--blue)}
.pm-cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:0 28px 20px}
.pm-card{border-radius:14px;padding:22px 24px;display:flex;flex-direction:column;gap:6px;position:relative;overflow:hidden}
.pm-card-icon{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:22px;margin-bottom:8px}
.pm-card-label{font-size:13px;font-weight:600;opacity:.85}
.pm-card-value{font-size:26px;font-weight:800}
.pm-card-count{font-size:12px;opacity:.7;margin-top:2px}
.pm-card-cash{background:linear-gradient(135deg,#e8f5e9,#c8e6c9);color:#1b5e20}
.pm-card-cash .pm-card-icon{background:#a5d6a7;color:#1b5e20}
.pm-card-bank{background:linear-gradient(135deg,#e3f2fd,#bbdefb);color:#0d47a1}
.pm-card-bank .pm-card-icon{background:#90caf9;color:#0d47a1}
.pm-card-qr{background:linear-gradient(135deg,#f3e5f5,#e1bee7);color:#4a148c}
.pm-card-qr .pm-card-icon{background:#ce93d8;color:#4a148c}
.pm-card-cheque{background:linear-gradient(135deg,#fff3e0,#ffe0b2);color:#e65100}
.pm-card-cheque .pm-card-icon{background:#ffcc80;color:#e65100}
.pm-total-row{display:flex;justify-content:space-between;align-items:center;padding:16px 28px;border-top:1px solid var(--line);background:#fafbfc;font-size:15px}
.pm-total-row .pm-total-label{font-weight:700;color:#333}
.pm-total-row .pm-total-val{font-weight:800;font-size:20px;color:var(--blue)}
.pm-empty{text-align:center;color:#aaa;padding:40px 20px;font-size:14px}
@media(max-width:600px){.pm-cards{grid-template-columns:1fr}}
```

- [ ] **Step 2: Verify styles applied**

Open app in browser, confirm no CSS errors in console.

---

### Task 3: Add `showPaymentBreakdown()` JavaScript Function

**Files:**
- Modify: `app.js` (append after the last function, before end of file)

- [ ] **Step 1: Add the function**

Append this function at the end of `app.js` (before the closing of the file):

```javascript
/* ============ PAYMENT MODE BREAKDOWN ============ */
function showPaymentBreakdown(){
  const fromEl=document.getElementById('pmFrom');
  const toEl=document.getElementById('pmTo');
  if(!fromEl.value){
    const now=new Date();
    const y=now.getFullYear();
    const m=String(now.getMonth()+1).padStart(2,'0');
    const d=String(now.getDate()).padStart(2,'0');
    fromEl.value=y+'-'+m+'-'+d;
    toEl.value=y+'-'+m+'-'+d;
  }
  renderPaymentBreakdown();
  showModal('paymentModal');
}

function parseDate(dateStr){
  if(!dateStr)return null;
  const parts=dateStr.split(/[\s/-]/);
  if(parts.length<3)return null;
  const day=parseInt(parts[0]),month=parseInt(parts[1])-1,year=parseInt(parts[2]);
  if(isNaN(day)||isNaN(month)||isNaN(year))return null;
  return new Date(year,month,day);
}

function renderPaymentBreakdown(){
  const fromDate=document.getElementById('pmFrom').value;
  const toDate=document.getElementById('pmTo').value;

  const fromParts=fromDate.split('-');
  const toParts=toDate.split('-');
  const from=new Date(+fromParts[0],+fromParts[1]-1,+fromParts[2]);
  const to=new Date(+toParts[0],+toParts[1]-1,+toParts[2]);
  to.setHours(23,59,59,999);

  const payments=(store.payments||[]).filter(p=>{
    if(p.dir!=='in')return false;
    const pd=parseDate(p.date);
    if(!pd)return false;
    return pd>=from&&pd<=to;
  });

  const modes={};
  payments.forEach(p=>{
    const m=p.mode||'Cash';
    if(!modes[m])modes[m]={total:0,count:0};
    modes[m].total+=p.amount||0;
    modes[m].count++;
  });

  const cards=[
    {key:'Cash',label:'Cash',icon:'💵',cls:'pm-card-cash'},
    {key:'Bank Transfer',label:'Bank Transfer',icon:'🏦',cls:'pm-card-bank'},
    {key:'QR Code',label:'QR Code',icon:'📱',cls:'pm-card-qr'},
    {key:'Cheque',label:'Cheque',icon:'📄',cls:'pm-card-cheque'}
  ];

  const container=document.getElementById('pmCards');
  container.innerHTML=cards.map(c=>{
    const d=modes[c.key]||{total:0,count:0};
    return `<div class="pm-card ${c.cls}">
      <div class="pm-card-icon">${c.icon}</div>
      <div class="pm-card-label">${c.label}</div>
      <div class="pm-card-value">${rs(d.total)}</div>
      <div class="pm-card-count">${d.count} payment${d.count!==1?'s':''}</div>
    </div>`;
  }).join('');

  const grandTotal=Object.values(modes).reduce((a,m)=>a+m.total,0);
  const totalPayments=Object.values(modes).reduce((a,m)=>a+m.count,0);
  document.getElementById('pmTotalRow').innerHTML=`
    <span class="pm-total-label">Total Collection (${totalPayments} payments)</span>
    <span class="pm-total-val">${rs(grandTotal)}</span>`;
}
```

- [ ] **Step 2: Verify function works in browser console**

Open browser console, type `showPaymentBreakdown()` and press Enter. Modal should open.

---

### Task 4: Update Button onclick

**Files:**
- Modify: `index.html:25`

- [ ] **Step 1: Change the button onclick**

In `index.html` line 25, find:
```html
<span class="tb-menu tb-profit-btn" onclick="toast('Coming soon')">💰 How Customers Paying / See Profits</span>
```

Replace with:
```html
<span class="tb-menu tb-profit-btn" onclick="showPaymentBreakdown()">💰 How Customers Paying / See Profits</span>
```

- [ ] **Step 2: Verify button opens modal**

Click the "How Customers Paying / See Profits" button in the title bar. The payment breakdown modal should open with 4 cards.

---

### Task 5: End-to-End Test

- [ ] **Step 1: Create a test invoice with Cash payment**

1. Open POS (Create Invoice)
2. Add a customer name, add an item
3. Set Payment Mode = Cash, Amount Received = total
4. Save bill

- [ ] **Step 2: Create a test invoice with Bank Transfer**

1. Open POS again
2. Add a customer name, add an item
3. Set Payment Mode = Bank Transfer, Amount Received = total
4. Save bill

- [ ] **Step 3: Create a test invoice with QR Code**

1. Open POS again
2. Set Payment Mode = QR Code, save bill

- [ ] **Step 4: Click "How Customers Paying" button**

1. Click the blue button in title bar
2. Modal opens with 4 cards
3. Cash card shows 1 payment with correct amount
4. Bank Transfer card shows 1 payment with correct amount
5. QR Code card shows 1 payment with correct amount
6. Cheque card shows Rs 0, 0 payments
7. Total row shows sum of all 3 payments

- [ ] **Step 5: Test date filter**

1. Change "From" date to yesterday
2. Cards should all show Rs 0
3. Change back to today
4. Amounts reappear

- [ ] **Step 6: Run lint/format check**

No lint tool configured in this project, but verify no JS console errors.

---

## Summary of Changes

| File | Change |
|------|--------|
| `index.html:25` | Button onclick: `toast('Coming soon')` → `showPaymentBreakdown()` |
| `index.html` (line ~440) | New `#paymentModal` div added |
| `app.js` (end) | `showPaymentBreakdown()`, `parseDate()`, `renderPaymentBreakdown()` |
| `styles.css` (end) | `.pm-*` modal + card styles |
