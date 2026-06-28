; Custom NSIS include for KAROBAR
; Force a per-user install so the "all users / only me" selection page
; is skipped entirely. The installer then goes straight from the
; About/README page to the Choose Install Location page.
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend
