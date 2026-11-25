# Development deploy: copies the script set to the current user's JAWS settings and compiles it.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tools\deploy.ps1 [-JawsVersion 2025] [-Lang enu]
#
# The Insert keys are chosen in Quick Settings (decision 2026-11-25); the scripts write
# JAWSInsertKey into the user's TOTALCMD64.jcf themselves.
#
# The user's TOTALCMD64.jcf is not overwritten: only the script's own option lines are set,
# so settings changed in Settings Center are kept. The installer must do the same.
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

foreach ($ext in "jss", "jsh", "jsm", "jsd") {
    Copy-Item (Join-Path $src "TOTALCMD64.$ext") $dest -Force
}
# Parts of the scripts, included by TOTALCMD64.jss (compiled together with it)
Copy-Item (Join-Path $src "TOTALCMD64_*.jss") $dest -Force
# Language files and Quick Settings (Insert+V)
Copy-Item (Join-Path $src "TOTALCMD64.*.ini") $dest -Force
foreach ($ext in "qs", "qsm") { Copy-Item (Join-Path $src "TOTALCMD64.$ext") $dest -Force }

# Key map: the Insert marking key depends on the profile.
$jkmLines = [IO.File]::ReadAllLines((Join-Path $src "TOTALCMD64.jkm"))
[IO.File]::WriteAllLines((Join-Path $dest "TOTALCMD64.jkm"), $jkmLines)

# Configuration: set the script's option lines in the user's .jcf, keep everything else.
$options = [ordered]@{
    "IndicateSelected" = "0"
}
$jcf = Join-Path $dest "TOTALCMD64.jcf"
$lines = if (Test-Path $jcf) { [Collections.Generic.List[string]][IO.File]::ReadAllLines($jcf) } else { [Collections.Generic.List[string]]@("[Options]") }
if (-not ($lines | Where-Object { $_ -match '^\[Options\]\s*$' })) { $lines.Insert(0, "[Options]") }
foreach ($key in $options.Keys) {
    $line = "$key=$($options[$key])"
    $index = -1
    for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match "^$key=") { $index = $i; break } }
    if ($index -ge 0) {
        $lines[$index] = $line
    } else {
        $optionsAt = 0
        for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match '^\[Options\]\s*$') { $optionsAt = $i; break } }
        $lines.Insert($optionsAt + 1, $line)
    }
}
[IO.File]::WriteAllLines($jcf, $lines)

Push-Location $dest
try {
    & $compiler (Join-Path $dest "TOTALCMD64.jss")
    $code = $LASTEXITCODE
} finally {
    Pop-Location
}
if ($code -ne 0) { throw "Compilation failed, exit code $code" }
"Deployed"
Get-Item (Join-Path $dest "TOTALCMD64.jsb") | Select-Object Name, Length, LastWriteTime
