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
