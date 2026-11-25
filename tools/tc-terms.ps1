# Finds Total Commander's own words for the script messages in every TC language.
# For each message of the Croatian language file, the Croatian TC files (WCMD_HR.LNG, .MNU)
# are searched for the same text; the IDs found are then looked up in each target
# language. Output: one block per message with the TC text in every language.
# Usage: powershell -File tools\tc-terms.ps1 [-TcDir <TC folder>] [-Keys msgA,msgB]
param(
    [string]$TcDir = "D:\TotalCommanderPortable(OS)\App\TotalCommander",
    [string[]]$Keys = @()
)
$ErrorActionPreference = "Stop"
$langDir = Join-Path $TcDir "LANGUAGE"
$langs = [ordered]@{ hr="HR"; cs="CZ"; da="DAN"; de="DEU"; es="ESP"; fr="FRA"; it="ITA"; hu="HUN";
    nl="DUT"; nb="NOR"; pl="POL"; ro="ROM"; sk="SK"; sl="SVN"; sv="SWE"; ru="RUS"; uk="UKR";
    ko="KOR"; zh="CHN"; sr="SRL" }

function Read-TcFile ([string]$path, [int]$codepage) {
    $bytes = [IO.File]::ReadAllBytes($path)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        return [Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3) -split "`r?`n"
    }
    return [Text.Encoding]::GetEncoding($codepage).GetString($bytes) -split "`r?`n"
}

function Clean ([string]$s) {
    $s = ($s -split '\\t')[0]
    $s = $s.Replace("&&", "\u0001").Replace("&", "").Replace("\u0001", "&")
    return $s.Trim().TrimEnd('.').Trim()
}

function Load-Lang ([string]$code) {
    $lng = Join-Path $langDir "WCMD_$code.LNG"
    $mnu = Join-Path $langDir "WCMD_$code.MNU"
    $cp = 1252
    $head = [IO.File]::ReadAllLines($lng, [Text.Encoding]::ASCII) | Select-Object -First 10
    foreach ($h in $head) { if ($h -match '^codepage=(\d+)') { $cp = [int]$matches[1] } }
    $d = @{}
    foreach ($l in (Read-TcFile $lng $cp)) {
        if ($l -match '^(\d+)="(.*)"\s*$') { $d["L" + $matches[1]] = Clean $matches[2] }
    }
    foreach ($l in (Read-TcFile $mnu $cp)) {
        if ($l -match 'MENUITEM\s+"(.*)"\s*,\s*(\S+)') { $d["M" + $matches[2]] = Clean $matches[1] }
        elseif ($l -match 'POPUP\s+"(.*)"') { }
    }
    return $d
}

$data = @{}
foreach ($k in $langs.Keys) { $data[$k] = Load-Lang $langs[$k] }

$hrIni = Join-Path $PSScriptRoot "..\src\TOTALCMD64.hr.ini"
foreach ($line in [IO.File]::ReadAllLines($hrIni, [Text.Encoding]::UTF8)) {
    if ($line -notmatch '^(msg\w+)=(.*)$') { continue }
    $key = $matches[1]; $val = $matches[2]
    if ($Keys.Count -and $Keys -notcontains $key) { continue }
    if ($val.Contains('\n') -or $val.Length -gt 60) { continue }
    $target = (Clean $val).ToLowerInvariant()
    $ids = @($data["hr"].Keys | Where-Object { $data["hr"][$_].ToLowerInvariant() -eq $target })
    if (-not $ids.Count) { continue }
    "== $key = $val   [" + ($ids -join ",") + "]"
    $id = $ids[0]
    foreach ($k in $langs.Keys) {
        if ($k -eq "hr") { continue }
        "  {0}: {1}" -f $k, $data[$k][$id]
    }
}
