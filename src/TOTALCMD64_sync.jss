; Total Commander JAWS scripts: Synchronize dirs: result rows, Show filter keys, status line
; Copyright (c) 2026 author. MIT License.
; Included by TOTALCMD64.jss; not compiled on its own.


string function TcSyncRowSpeech (string sRow)
; Synchronize dirs result row (measured 2026-11-23):
; "<side> <code> <left name> <size> <date> <time> | <date> <time> <size> <right name>",
; side L, R or 2 (both), code EQ, UNEQ, UNKNOWN, "L to R", "R to L" or OFF. Space changes
; the copy direction or switches the row off (OFF, the file is skipped); the list's own
; selection marks only the focused row. Said as "name, relation"; Insert+Up Arrow still
; reads the whole row.
var
	string sSide,
	string sRest,
	string sLeft,
	string sRight,
	string sName,
	string sRel
let sRow = StringReplaceSubstrings (sRow, tcColumnDelim, " ")
let sLeft = StringTrimTrailingBlanks (StringSegment (sRow, "|", 1))
let sRight = StringTrimLeadingBlanks (StringChopLeft (sRow, StringLength (StringSegment (sRow, "|", 1)) + 1))
let sSide = StringSegment (sLeft, " ", 1)
let sRest = TcDropTokens (sLeft, 1, false)
if StringLeft (sRest, 7) == "L to R " || StringLeft (sRest, 7) == "R to L " then
	let sRel = StringLeft (sRest, 6)
	let sRest = StringChopLeft (sRest, 7)
else
	let sRel = StringSegment (sRest, " ", 1)
	let sRest = TcDropTokens (sRest, 1, false)
endIf
if sSide == "R" then
	let sName = TcDropTokens (sRight, 3, false)
else
	let sName = TcDropTokens (sRest, 3, true)
endIf
if sRel == "OFF" then
	return sName + ", " + TcMsg ("msgTcSyncSkip", msgTcSyncSkip)
elIf sSide == "L" then
	return sName + ", " + TcMsg ("msgTcSyncLeftOnly", msgTcSyncLeftOnly)
elIf sSide == "R" then
	return sName + ", " + TcMsg ("msgTcSyncRightOnly", msgTcSyncRightOnly)
elIf sRel == "EQ" then
	return sName + ", " + TcMsg ("msgTcSyncEqual", msgTcSyncEqual)
elIf sRel == "UNEQ" then
	return sName + ", " + TcMsg ("msgTcSyncUnequal", msgTcSyncUnequal)
elIf sRel == "UNKNOWN" then
	return sName + ", " + TcMsg ("msgTcSyncUnknown", msgTcSyncUnknown)
elIf sRel == "L to R" then
	return sName + ", " + TcMsg ("msgTcSyncLeftNewer", msgTcSyncLeftNewer)
elIf sRel == "R to L" then
	return sName + ", " + TcMsg ("msgTcSyncRightNewer", msgTcSyncRightNewer)
endIf
return sRow
EndFunction

string function TcSyncShowMessage (string sKey)
; Synchronize dirs: the Show buttons are only painted; TC switches them with Ctrl+Shift plus
; L, E, N, R, D and S (TC help, 2026-11-23). JAWS names Ctrl+Shift keys "Shift+Control+...".
if sKey == "shift+control+l" then
	return TcMsg ("msgTcSyncShowLeft", msgTcSyncShowLeft)
elIf sKey == "shift+control+e" then
	return TcMsg ("msgTcSyncShowEqual", msgTcSyncShowEqual)
elIf sKey == "shift+control+n" then
	return TcMsg ("msgTcSyncShowUnequal", msgTcSyncShowUnequal)
elIf sKey == "shift+control+r" then
	return TcMsg ("msgTcSyncShowRight", msgTcSyncShowRight)
elIf sKey == "shift+control+d" then
	return TcMsg ("msgTcSyncShowDuplicates", msgTcSyncShowDuplicates)
elIf sKey == "shift+control+s" then
	return TcMsg ("msgTcSyncShowSingles", msgTcSyncShowSingles)
endIf
return cscNull
EndFunction

string function TcSyncStatus (handle hForm)
; The status line at the bottom: a painted child window without children, below the list;
; TC shows the number of rows and, when Show hides files, a filter mark and the hidden count.
var
	handle h,
	handle hFound,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	int nFoundTop
let h = GetFirstChild (hForm)
while h
	if GetWindowClass (h) == wcTcPlainWindow
	&& IsWindowVisible (h)
	&& !GetFirstChild (h) then
		GetWindowRect (h, nLeft, nRight, nTop, nBottom)
		if !hFound || nTop > nFoundTop then
			let hFound = h
			let nFoundTop = nTop
		endIf
	endIf
	let h = GetNextWindow (h)
endWhile
if !hFound then
	return cscNull
endIf
GetWindowRect (hFound, nLeft, nRight, nTop, nBottom)
return TcSingleSpaces (GetTextInRect (nLeft, nTop, nRight, nBottom, 0, IgnoreColor, IgnoreColor, false))
EndFunction

void function TcSaySyncShow ()
; After a Show key: its name, then the status line, from which the hidden count tells
; whether the files are now shown or hidden (the button state is painted only).
var handle hForm
let hForm = GetTopLevelWindow (GetFocus ())
if GetWindowClass (hForm) != wcTcSync then
	return
endIf
Say (gsTcSyncShow, OT_STATUS)
Say (TcSyncStatus (hForm), OT_STATUS)
EndFunction
