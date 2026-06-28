# Blue Berry Studios — Desktop App (Windows)

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
dist/BlueBerryStudios-Setup-1.0.0.exe
```

Yeh ek **NSIS installer** hai:
- Double-click karke install hota hai (install location choose kar sakte ho).
- Desktop + Start Menu shortcut bana deta hai.
- 64-bit aur 32-bit dono Windows par chalta hai (purane Windows 7 ke liye 32-bit zaroori).

Is `.exe` ko aap kisi bhi Windows machine par bhej kar install kar sakte ho.

---

## 5. App ka icon (optional, behtar look ke liye)

Default Electron icon aata hai. Apna logo lagane ke liye:

1. Ek `icon.ico` banao (kam se kam 256×256, multi-size best).
2. `assets/icon.ico` mein rakho.
3. `package.json` ke `build.win` mein add karo: `"icon": "assets/icon.ico"`.
4. Phir se `npm run dist`.

---

## Troubleshooting

### `npm run dist` par error: "Cannot create symbolic link : A required privilege is not held"

Yeh Windows ka privilege issue hai (electron-builder ko symlink banane ki permission chahiye).
Do mein se koi ek kar lo, phir dobara `npm run dist`:

- **Sabse aasaan:** Windows **Developer Mode** on karo
  → Settings → Privacy & Security → For Developers → "Developer Mode" = On.
- **Ya:** Terminal (CMD/PowerShell) ko **"Run as administrator"** se kholo, phir command chalao.

> Agar phir bhi installer na bane to bhi ghabrane ki baat nahi — `dist\win-unpacked\` folder
> mein **`Blue Berry Studios.exe`** ready hota hai. Poora folder copy karke kisi bhi Windows par
> chala sakte ho (yeh portable version hai, install ki zaroorat nahi). Installer sirf ek single
> setup file banata hai jo zyada convenient hota hai.

---

## Zaroori baatein

- App internet use karti hai (Firebase cloud sync + barcode/QR libraries CDN se). Offline par
  local data chalta rahega, internet aate hi sync ho jayega.
- `node_modules/` aur `dist/` git mein push nahi hote (`.gitignore` mein hain) — yeh har machine
  par `npm install` / `npm run dist` se bante hain.
