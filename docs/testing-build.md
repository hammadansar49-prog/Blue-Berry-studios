# Two-day testing build

Run `npm run dist:trial`. Outputs are placed in `final software/`.

The testing installer sets packaged metadata `trialHours: 48`. The normal `npm run dist` build does not have that flag and is not time limited.

The trial starts on first launch (the installer launches the app after installation by default), expires after 48 elapsed hours, and checks every 15 seconds while open. State is stored outside business storage in the Windows user AppData/KarobarTrial directory. Restarting or reinstalling without removing that state does not restart the timer. Clock rollback greater than five minutes or corrupt state locks the trial. This is a local trial gate, not tamper-proof online licensing; another Windows user/profile or deleting the state can bypass it.

Expiry asks the client to report whether the software works correctly and preserves saved data. The live website is not restricted by the desktop gate. Physical printer verification remains pending. Version 3.0.1 fixes concurrent accounting; all devices must update. This build is for controlled testing, not final production acceptance.
