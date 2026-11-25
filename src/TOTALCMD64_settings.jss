; Total Commander JAWS scripts: settings and the language of the scripts' own messages
; Copyright (c) 2026 author. MIT License.
; Included by TOTALCMD64.jss; not compiled on its own.

; The scripts' own messages come from a language file in the JAWS user settings folder,
; TOTALCMD64.<language>.ini, UTF-8 with a byte order mark, section [Messages], one message
; per key with the name used in TOTALCMD64.jsm (decision 2026-11-24). A JAWS without a
; localization of its own (Croatian) uses the folder enu, so all languages lie side by side
; there and the user picks one in Quick Settings (Insert+V, "Language / Jezik"). The English
; text compiled from TOTALCMD64.jsm is the fallback for a message missing from the file.
; Line breaks in a message are written as \n in the file.

string function TcLanguage ()
; The language code of the chosen language. Quick Settings stores the position in the list
; (0, 1...), not a name (measured 2026-11-24), so it is mapped by the same order.
var string sCode
let sCode = StringSegment (tcLanguages, tcLanguageSep,
	StringToInt (IniReadString (tcSettingsSection, tcLanguageSetting, "0", tcSettingsFile)) + 1)
if !sCode then
	return tcDefaultLanguage
endIf
return sCode
EndFunction

string function TcMsg (string sKey, string sDefault)
; A message in the chosen language, or the compiled English text.
var string sText
let sText = IniReadString (tcMessagesSection, sKey, cscNull,
	tcLanguageFilePrefix + TcLanguage () + tcLanguageFileSuffix)
if !sText then
	return sDefault
endIf
return StringReplaceSubstrings (sText, tcLineBreakMark, tcLineBreak)
EndFunction

; Insert keys (decision 2026-11-25, replacing the keyboard profiles): Quick Settings stores
; Selection key (0 extended Insert, 1 numeric Insert, 2 both, 3 none: Space marks) and Usage
; (0 single press, 1 double press). Applied while Total Commander has the focus through JAWS's
; Insert key mode (OPT_INSERT_KEY_MODE, the JAWSInsertKey values: 0 none, 1 numeric,
; 2 extended, 3 both Insert keys are JAWS keys).

int function TcSelectKey ()
return StringToInt (IniReadString (tcSettingsSection, tcSelectKeySetting, "0", tcSettingsFile))
EndFunction

int function TcDoublePressSelects ()
return StringToInt (IniReadString (tcSettingsSection, tcSelectUsageSetting, "0", tcSettingsFile)) == 1
	&& TcSelectKey () != tcSelectKeyNone
EndFunction

void function TcApplyInsertKeys ()
; Double press needs both Insert keys as JAWS keys, and so does "none".
var int nMode
if TcSelectKey () == tcSelectKeyNone
|| TcDoublePressSelects () then
	let nMode = 3
elIf TcSelectKey () == tcSelectKeyNumeric then
	let nMode = 2
elIf TcSelectKey () == tcSelectKeyBoth then
	let nMode = 0
else
	let nMode = 1
endIf
; set on every focus change: JAWS restores its own value when another program gets the focus
SetJCFOption (OPT_INSERT_KEY_MODE, nMode)
EndFunction
