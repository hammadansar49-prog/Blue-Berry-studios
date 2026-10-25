param([Parameter(Mandatory=$true)][string]$JobPath)
$ErrorActionPreference = 'Stop'
$job = Get-Content -LiteralPath $JobPath -Raw | ConvertFrom-Json
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
public class KarobarRawPrinter {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] public class DocInfo {
  [MarshalAs(UnmanagedType.LPWStr)] public string name="Karobar receipt controls";
  [MarshalAs(UnmanagedType.LPWStr)] public string output=null;
  [MarshalAs(UnmanagedType.LPWStr)] public string type="RAW";
 }
 [DllImport("winspool.drv",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool OpenPrinter(string name,out IntPtr handle,IntPtr defaults);
 [DllImport("winspool.drv",CharSet=CharSet.Unicode,SetLastError=true)] static extern int StartDocPrinter(IntPtr handle,int level,[In] DocInfo info);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool StartPagePrinter(IntPtr handle);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool WritePrinter(IntPtr handle,byte[] data,int length,out int written);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool EndPagePrinter(IntPtr handle);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool EndDocPrinter(IntPtr handle);
 [DllImport("winspool.drv",SetLastError=true)] static extern bool ClosePrinter(IntPtr handle);
 public static void Send(string name,byte[] data) {
  IntPtr handle; if(!OpenPrinter(name,out handle,IntPtr.Zero))throw new Win32Exception();
  bool doc=false,page=false;
  try {
   if(StartDocPrinter(handle,1,new DocInfo())==0)throw new Win32Exception();doc=true;
   if(!StartPagePrinter(handle))throw new Win32Exception();page=true;
   int written;if(!WritePrinter(handle,data,data.Length,out written)||written!=data.Length)throw new Win32Exception();
  } finally {if(page)EndPagePrinter(handle);if(doc)EndDocPrinter(handle);ClosePrinter(handle);}
 }
}
'@
[KarobarRawPrinter]::Send([string]$job.printerName,[Convert]::FromBase64String([string]$job.data))
