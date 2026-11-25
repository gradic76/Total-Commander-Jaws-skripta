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
; (0 single press, 1 double press). Applied while Total Commander has the focus by writing
; JAWSInsertKey (which Insert keys are JAWS keys: 0 none, 1 numeric, 2 extended, 3 both)
; into the user's TOTALCMD64.jcf (TcApplyInsertKeys).

int function TcSelectKey ()
return StringToInt (IniReadString (tcSettingsSection, tcSelectKeySetting, "0", tcSettingsFile))
EndFunction

int function TcDoublePressSelects ()
; "Both" is always double press: otherwise there would be no JAWS key in TC (author, 2026-11-25).
if TcSelectKey () == tcSelectKeyBoth then
	return true
endIf
return StringToInt (IniReadString (tcSettingsSection, tcSelectUsageSetting, "0", tcSettingsFile)) == 1
	&& TcSelectKey () != tcSelectKeyNone
EndFunction

int function TcJawsKeyTwiceMarks (string sKey)
; Whether the Insert key sKey (as GetCurrentScriptKeyName names it) is a JAWS key that
; marks when pressed twice: numeric Insert with double press, and either Insert with "Both".
if TcSelectKey () == tcSelectKeyBoth then
	return true
endIf
return TcSelectKey () == tcSelectKeyNumeric
	&& TcDoublePressSelects ()
	&& sKey != tcExtInsertKey
EndFunction

int function TcInsertKeyMode ()
; Author's scheme (2026-11-25): the other Insert is the JAWS key. Extended Insert with
; double press is not the JAWS key (single press does nothing, TcInsertMark); numeric
; Insert with double press is the JAWS key too (single press is the modifier, double
; press marks in TcJawsKeyTwice). "Both": both are JAWS keys and mark pressed twice.
; "None": both Insert keys are JAWS keys.
var int nSelect = TcSelectKey ()
if nSelect == tcSelectKeyNone
|| nSelect == tcSelectKeyBoth
|| (nSelect == tcSelectKeyNumeric && TcDoublePressSelects ()) then
	return 3
elIf nSelect == tcSelectKeyNumeric then
	return 2
endIf
return 1
EndFunction

; Quick Settings, Usage: it has no meaning with Selection key "None" (nothing marks) or
; "Both" (always double press), and then shows "Inactive" (index tcUsageInactiveIndex).
; JAWS reads a script-read setting only when Quick Settings opens (measured 2026-11-25),
; so Usage is a plain file setting, and when Selection key changes (Usage is its
; dependent; JAWS saves Quick Settings changes at once, even on Cancel, author) the
; scripts write Usage into the file: "Inactive", keeping the real choice in
; TcSelectUsageLast, or the real choice back.

void function TcUsageDependeeChanged (string settingID, string sXmlWriteRequest)
var
	int nSelect,
	int nUsage = StringToInt (IniReadString (tcSettingsSection, tcSelectUsageSetting, "0", tcSettingsFile))
ParseXMLDependenceEvent (sXmlWriteRequest, nSelect)
if nSelect == tcSelectKeyNone
|| nSelect == tcSelectKeyBoth then
	if nUsage != tcUsageInactiveIndex then
		WriteSettingInteger (tcSettingsSection, tcSelectUsageLastSetting, nUsage, FT_CURRENT_JCF,
			wdUser, tcConfigName)
		WriteSettingInteger (tcSettingsSection, tcSelectUsageSetting, tcUsageInactiveIndex,
			FT_CURRENT_JCF, wdUser, tcConfigName)
	endIf
	return
endIf
if nUsage == tcUsageInactiveIndex then
	WriteSettingInteger (tcSettingsSection, tcSelectUsageSetting,
		StringToInt (IniReadString (tcSettingsSection, tcSelectUsageLastSetting, "0", tcSettingsFile)),
		FT_CURRENT_JCF, wdUser, tcConfigName)
endIf
EndFunction

int function TcInsertIsJawsKey (string sKey)
; sKey: ExtInsert or NumInsert, as GetCurrentScriptKeyName names it
var int nMode = TcInsertKeyMode ()
if sKey == tcExtInsertKey then
	return nMode == 2 || nMode == 3
endIf
return nMode == 1 || nMode == 3
EndFunction

void function TcApplyInsertKeys ()
var int nMode = TcInsertKeyMode ()
; JAWSInsertKey has no OPT_ constant (OPT_INSERT_KEY_MODE is InsertKeyMode, JAWS/sticky;
; measured 2026-11-25), so the value goes into the user's TOTALCMD64.jcf, which applies
; only to Total Commander, and the configuration is reloaded. Checked on every focus
; change (after Quick Settings closes); written only when it differs.
if ReadSettingInteger (tcOptionsSection, tcJawsInsertKeySetting, -1, FT_CURRENT_JCF,
	rsNoTransient, tcConfigName) == nMode then
	return
endIf
WriteSettingInteger (tcOptionsSection, tcJawsInsertKeySetting, nMode, FT_CURRENT_JCF,
	wdUser, tcConfigName)
ReloadAllConfigs ()
EndFunction
