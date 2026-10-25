# KAROBAR — Desktop App (Windows)

Yeh app ab ek **Windows desktop application** ke taur par bhi chalti hai (Electron se).
Windows **7, 8, 8.1, 10, 11** sab par chalti hai.

> Electron **22.x** isliye use kiya hai kyunke yehi aakhri version hai jo Windows 7/8 ko
> support karta hai. Naye Electron sirf Windows 10/11 chalte hain.

---

## 1. Ek dafa setup (sirf pehli baar)

[Node.js](https://nodejs.org) install hona chahiye (LTS version). Phir project folder mein:

```bash
npm install
```

Yeh `electron` aur `electron-builder` download kar lega (`node_modules/` ban jayega).

---

## 2. App ko chala kar dekhna (test)

```bash
npm start
```

Desktop window khul jayegi jisme aapki poori app chalegi.

---

## 3. Development ke liye Live Server ke saath (VS Code)

Aap apna normal workflow rakh sakte ho:

1. VS Code mein **Live Server** start karo (`index.html` → "Go Live", port **5500**).
2. Phir alag terminal mein:

   ```bash
   npm run dev
   ```

   Electron window us live URL (`http://localhost:5500`) ko load karegi — to jo bhi
   code change karoge woh turant window mein nazar aayega (sirf reload: `Ctrl+R`).

> Note: `npm run dev` Windows ke `set` command par bana hai (aap Windows par ho to theek hai).

---

## 4. Installer (.exe) banana — jo download/install ho

```bash
npm run dist
```

Build complete hone par installer yahan milega:

```
dist/KAROBAR-Setup-1.0.0.exe
```

Yeh ek **NSIS installer** hai:
- Double-click karke install hota hai (install location choose kar sakte ho).
- Desktop + Start Menu shortcut bana deta hai.
- 64-bit aur 32-bit dono Windows par chalta hai (purane Windows 7 ke liye 32-bit zaroori).

Is `.exe` ko aap kisi bhi Windows machine par bhej kar install kar sakte ho.

---

## 5. App ka icon

App ka icon already set hai: **black background + white "KAROBAR"** (`assets/icon.ico`).
Yeh installer, taskbar, desktop shortcut sab par lag jata hai.

Icon dobara banana / badalna ho to:

```bash
npm run icon
```

Yeh `scripts/make-icon.js` chala kar `assets/icon.ico` + `assets/icon.png` naye se bana deta hai
(text ya color change karna ho to `scripts/make-icon.js` edit kar lo).

---

## Troubleshooting

### `npm run dist` par error: "Cannot create symbolic link : A required privilege is not held"

Yeh Windows ka privilege issue hai (electron-builder ko symlink banane ki permission chahiye).
Do mein se koi ek kar lo, phir dobara `npm run dist`:

- **Sabse aasaan:** Windows **Developer Mode** on karo
  → Settings → Privacy & Security → For Developers → "Developer Mode" = On.
- **Ya:** Terminal (CMD/PowerShell) ko **"Run as administrator"** se kholo, phir command chalao.

**Developer Mode on nahi karna chahte?** To ek dafa ye command chala lo (symlink wali macOS
files ko skip karke cache t* taiyar kar deta hai), phir `npm run dist`:

```bash
node_modules\7zip-bin\win\x64\7za.exe x "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\*.7z" -o"%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0" -x!darwin -y
```

> Agar phir bhi installer na bane to bhi ghabrane ki baat nahi — `dist\win-unpacked\` folder
> mein **`KAROBAR.exe`** ready hota hai. Poora folder copy karke kisi bhi Windows par
> chala sakte ho (yeh portable version hai, install ki zaroorat nahi). Installer sirf ek single
> setup file banata hai jo zyada convenient hota hai.

### Login error: `auth/operation-not-supported-in-this-environment`

Yeh tab aata tha jab app `file://` se chalti thi (Firebase login file:// par kaam nahi karta).
**Fix ho chuka hai** — ab Electron app ke andar ek chhota local server chalta hai aur UI
`http://127.0.0.1` se load hoti hai, jahan login theek chalta hai. (Code: `electron/main.js`.)

---

## Zaroori baatein

### Thermal invoice printing (Windows desktop)

Open Settings > Print > Thermal Printer, click Refresh printers, select the installed Windows printer, then Save. Test print sends a sample receipt. Invoice Print sends the job directly to that printer and reports whether the Windows spooler accepted it or returned an error. If Windows lists no printer, the app shows an official setup/driver support link and the detected device name when available. A working installed printer needs no extra download. Offline, jammed, and out-of-paper states reported by Windows block the job with a message. The browser version uses the browser print dialog.

Paper width can be selected as 58 mm or 80 mm, with 104 mm for compatible models, in both Print Settings and the receipt preview. The chosen width is saved and sent to Electron's print job. An uploaded business logo prints at the top of the receipt; branch invoices show the branch address saved with the invoice. The centered Code 128 barcode identifies the saved invoice for lookup. The QR includes receipt details when they fit; large invoices use a smaller invoice reference payload, while the full transaction remains in Karobar.

Spooler acceptance does not prove paper was physically printed. Windows drivers may not report all hardware faults. Auto cut and cash drawer options send ESC/POS commands through Windows RAW spooling after the receipt job is accepted. Enable these only for a compatible printer and connected drawer. Verify them on the actual device. See [Print settings](docs/print-settings.md) for themes, profile controls and verification.

### Branch login migration and Firestore rules

Branch login now requires its six-digit code plus a password. Before publishing the new `firestore.rules`, sign in as the owner, open **All Branches**, and use **Set Password** on every older branch. New branches receive a password when created. Then publish the rules for Firebase project `karobar-3dad1`. The new rules remove public reads of store data. Existing code-only branch sessions cannot continue until their owner sets a password.

After migration, run `firebase.cmd deploy --only firestore:rules --project karobar-3dad1` on Windows, or publish the contents of `firestore.rules` in Firebase Console. Do not publish before existing branches have passwords.

- Installer mein Firebase, barcode, QR, aur Excel JavaScript libraries bundled hain. Firebase
  login/cloud sync aur WhatsApp jaisi online services ke liye internet chahiye. Printer driver
  sirf tab install karna hoga jab Windows mein compatible printer pehle se available na ho.
- `node_modules/` aur `dist/` git mein push nahi hote (`.gitignore` mein hain) — yeh har machine
  par `npm install` / `npm run dist` se bante hain.
# Backup and restore

Open **Sync, Share & Backup → Restore Backup** to create and download a dated Karobar JSON backup, or choose a backup file to restore. The screen shows current item, sale, and party counts and the last local backup time. A restore previews the selected file's business name and counts, then asks for confirmation before replacing the current account's data.
