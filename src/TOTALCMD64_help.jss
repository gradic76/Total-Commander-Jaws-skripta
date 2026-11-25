; Total Commander JAWS scripts: help (Insert+H, Insert+F1) and the version (Insert+Q)
; Copyright (c) 2026 author. MIT License.
; Included by TOTALCMD64.jss; not compiled on its own.


Script ScriptFileName ()
ScriptAndAppNames (TcMsg ("msgTcAppName", msgTcAppName))
SayMessage (OT_USER_REQUESTED_INFORMATION, FormatString (TcMsg ("msgTcVersion", msgTcVersion), tcScriptVersion))
EndScript

; ---------------------------------------------------------------------------
; Help, following the JAWS conventions:
; Insert+F1 help for the current place, pressed twice general help;
; Insert+H the keys added by the scripts.
; ---------------------------------------------------------------------------

string function TcKeyName (string sScript)
; Key assigned to a script, with the JAWS key named "Insert" (convention 2026-11-18).
; JAWS joins all keys of a script with " OR "; ReadToBottomOfColumn has six, with layered
; keys ("Insert+Space, T, ...") and Extended variants (2026-11-25). The shortest key without
; a layer (no comma) is said.
var
	string sKeys,
	string sKey,
	string sBest,
	int nCount,
	int i
let sKeys = StringReplaceSubstrings (GetScriptKeyName (sScript), tcKeyOrSep, tcLineBreak)
let nCount = StringSegmentCount (sKeys, tcLineBreak)
let i = 1
while i <= nCount
	let sKey = StringTrimTrailingBlanks (StringTrimLeadingBlanks (StringSegment (sKeys, tcLineBreak, i)))
	if sKey
	&& !StringContains (sKey, ",")
	&& (!sBest || StringLength (sKey) < StringLength (sBest)) then
		let sBest = sKey
	endIf
	let i = i + 1
endWhile
if !sBest then
	let sBest = StringSegment (sKeys, tcLineBreak, 1)
endIf
return StringReplaceSubstrings (sBest, tcJawsKeyName, tcInsertKeyName)
EndFunction

void function TcShowHelp (string sText)
; Shows text in the JAWS virtual viewer, with JAWS's own closing hint.
; Key names are already filled in, so the text has no %KeyFor links.
if UserBufferIsActive () then
	UserBufferDeactivate ()
endIf
SayFormattedMessage (OT_USER_BUFFER, sText)
UserBufferAddText (cScBufferNewLine)
UserBufferAddText (cMsgBuffExit)
let gbTcHelpShown = true
EndFunction

void function TcAfterHelpClosed ()
; JAWS speaks the whole focused row by itself after the viewer closes, outside the scripts;
; it is cut off and replaced by the short panel entry.
if TcIsFileListFocused () then
	StopSpeech ()
	HandleCustomWindows (GetFocus ())
endIf
EndFunction

string function TcInsertHelp ()
; One line (author, 2026-11-25): which Insert marks items and how many presses, as set
; in Quick Settings (Selection key, Usage; TOTALCMD64_settings.jss), read each time.
var
	int nSelect = TcSelectKey (),
	string sKey,
	string sPress
if nSelect == tcSelectKeyNone then
	return TcMsg ("msgTcInsertHelpNone", msgTcInsertHelpNone)
endIf
if nSelect == tcSelectKeyBoth then
	let sKey = TcMsg ("msgTcEitherInsert", msgTcEitherInsert)
elIf nSelect == tcSelectKeyNumeric then
	let sKey = TcMsg ("msgTcNumInsert", msgTcNumInsert)
else
	let sKey = TcMsg ("msgTcExtInsert", msgTcExtInsert)
endIf
if TcDoublePressSelects () then
	let sPress = TcMsg ("msgTcDoublePress", msgTcDoublePress)
else
	let sPress = TcMsg ("msgTcSinglePress", msgTcSinglePress)
endIf
return FormatString (TcMsg ("msgTcInsertHelpSelect", msgTcInsertHelpSelect), sKey, sPress)
EndFunction

Script HotKeyHelp ()
TcShowHelp (FormatString (TcMsg ("msgTcHotKeyHelp", msgTcHotKeyHelp),
	TcKeyName ("TcSayColumn1"),
	TcKeyName ("TcSayColumn9"),
	TcKeyName ("TcSayPath"),
	TcKeyName ("SayLine"),
	TcKeyName ("SayBottomLineOfWindow"),
	TcKeyName ("ReadBoxInTabOrder"),
	TcKeyName ("ScriptFileName"),
	TcKeyName ("TcSayActivePanel"),
	TcKeyName ("ReadToBottomOfColumn"))
	+ tcLineBreak + TcInsertHelp ())
EndScript

Script ScreenSensitiveHelp ()
if IsSameScript () then
	TcShowHelp (FormatString (TcMsg ("msgTcAppHelp", msgTcAppHelp), tcScriptVersion, TcKeyName ("HotKeyHelp")))
	return
endIf
if TcIsFileListFocused () then
	TcShowHelp (FormatString (TcMsg ("msgTcListHelp", msgTcListHelp), TcKeyName ("SayLine"), TcKeyName ("HotKeyHelp")))
	return
endIf
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcLister then
	TcShowHelp (FormatString (TcMsg ("msgTcListerHelp", msgTcListerHelp), TcKeyName ("HotKeyHelp"), TcKeyName ("SayBottomLineOfWindow")))
	return
endIf
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcCompare then
	TcShowHelp (FormatString (TcMsg ("msgTcCompareHelp", msgTcCompareHelp), TcKeyName ("ReadBoxInTabOrder")))
	return
endIf
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcSync then
	TcShowHelp (FormatString (TcMsg ("msgTcSyncHelp", msgTcSyncHelp), TcKeyName ("SayLine")))
	return
endIf
PerformScript ScreenSensitiveHelp ()
EndScript
