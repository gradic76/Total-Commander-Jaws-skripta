# Writes src\TOTALCMD64.en.ini from src\TOTALCMD64.jsm: the English language file is the
# template for translations. Each message becomes one key in [Messages]; line breaks inside
# a message are written as \n. UTF-8 with a byte order mark (JAWS read UTF-16 not at all).
$src = Join-Path $PSScriptRoot "..\src"
$lines = [IO.File]::ReadAllLines((Join-Path $src "TOTALCMD64.jsm"), [Text.Encoding]::UTF8)
$out = New-Object System.Collections.Generic.List[string]
$out.Add("; Total Commander JAWS scripts: messages in English")
$out.Add("; Made from TOTALCMD64.jsm by tools\make-english-ini.ps1; translations copy this file")
$out.Add("; as TOTALCMD64.<language>.ini. %1, %2... are filled in by the scripts; \n is a line break.")
$out.Add("")
$out.Add("[Messages]")
$name = $null
$text = New-Object System.Collections.Generic.List[string]
foreach ($l in $lines) {
    if ($l -match '^@@') {
        if ($name) { $out.Add("$name=" + ($text -join '\n')) }
        $name = $null
        $text.Clear()
    } elseif ($l -match '^@(\w+)') {
        $name = $Matches[1]
    } elseif ($name) {
        $text.Add($l)
    }
}
[IO.File]::WriteAllLines((Join-Path $src "TOTALCMD64.en.ini"), $out, (New-Object Text.UTF8Encoding $true))
"messages: " + ($out.Count - 5)
