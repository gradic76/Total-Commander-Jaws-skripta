# Development deploy: copies the script set to the current user's JAWS settings and compiles it.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tools\deploy.ps1 [-JawsVersion 2025] [-Lang enu]
# The .jcf is copied only when the user has none, so settings changed in Settings Center are kept.
param(
    [string]$JawsVersion = "2025",
    [string]$Lang = "enu",
    # Alternative source folder, e.g. a temporary variant for a control test
    [string]$SourceDir = ""
)
$ErrorActionPreference = "Stop"

$src = if ($SourceDir) { $SourceDir } else { Join-Path $PSScriptRoot "..\src" }
$dest = Join-Path $env:APPDATA "Freedom Scientific\JAWS\$JawsVersion\Settings\$Lang"
$compiler = "C:\Program Files\Freedom Scientific\JAWS\$JawsVersion\scompile.exe"

if (-not (Test-Path $dest)) { throw "JAWS user settings folder not found: $dest" }
if (-not (Test-Path $compiler)) { throw "Script compiler not found: $compiler" }

foreach ($ext in "jss", "jsh", "jsm") {
    Copy-Item (Join-Path $src "TOTALCMD64.$ext") $dest -Force
}
$jcf = Join-Path $dest "TOTALCMD64.jcf"
if (-not (Test-Path $jcf)) { Copy-Item (Join-Path $src "TOTALCMD64.jcf") $dest }

Push-Location $dest
try {
    & $compiler (Join-Path $dest "TOTALCMD64.jss")
    $code = $LASTEXITCODE
} finally {
    Pop-Location
}
if ($code -ne 0) { throw "Compilation failed, exit code $code" }
Get-Item (Join-Path $dest "TOTALCMD64.jsb") | Select-Object Name, Length, LastWriteTime
