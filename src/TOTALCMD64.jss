; Total Commander JAWS scripts
; Copyright (c) 2026 author. MIT License.

include "HJConst.jsh"
include "HJGlobal.jsh"
include "common.jsm"
include "TOTALCMD64.jsh"
include "TOTALCMD64.jsm"

Script ScriptFileName ()
ScriptAndAppNames (msgTcAppName)
SayMessage (OT_USER_REQUESTED_INFORMATION, FormatString (msgTcVersion, tcScriptVersion))
EndScript

; ---------------------------------------------------------------------------
; Overwrite dialog (TOverWriteForm)
; The file details are only painted, not exposed as window text or MSAA,
; so they are read from the off-screen model line by line.
; Each file group box shows: caption, path, "size, date".
; ---------------------------------------------------------------------------

handle function TcGetOverwriteDialog (handle hwnd)
; Returns the overwrite dialog containing hwnd, or 0.
var handle hDlg
let hDlg = hwnd
while hDlg
	if GetWindowClass (hDlg) == wcTcOverwrite then
		return hDlg
	endIf
	let hDlg = GetParent (hDlg)
endWhile
return 0
EndFunction

handle function TcFindOverwriteGroup (handle hDlg, int bLower)
; Returns the upper (existing file) or lower (new file) group box.
; The group boxes are Button-class children that contain a child window (status icon).
var
	handle hwnd,
	handle hFound,
	int nFoundTop,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom
let hwnd = GetFirstChild (hDlg)
while hwnd
	if GetWindowClass (hwnd) == wcButton
	&& GetFirstChild (hwnd) then
		GetWindowRect (hwnd, nLeft, nRight, nTop, nBottom)
		if !hFound
		|| (bLower && nTop > nFoundTop)
		|| (!bLower && nTop < nFoundTop) then
			let hFound = hwnd
			let nFoundTop = nTop
		endIf
	endIf
	let hwnd = GetNextWindow (hwnd)
endWhile
return hFound
EndFunction

string function TcReadGroupLines (handle hGroup)
; Returns the first three screen lines of a group box, joined by tcLineDelim.
var
	string sLines,
	int i
SaveCursor ()
InvisibleCursor ()
if !MoveToWindow (hGroup) then
	RestoreCursor ()
	return cscNull
endIf
let sLines = GetLine ()
let i = 1
while i < 3
	NextLine ()
	let sLines = sLines + tcLineDelim + GetLine ()
	let i = i + 1
endWhile
RestoreCursor ()
return sLines
EndFunction

string function TcCleanCaption (string sCaption)
; "Overwrite: " -> "Overwrite"
var string s
let s = StringTrimTrailingBlanks (sCaption)
if StringRight (s, 1) == ":" then
	let s = StringChopRight (s, 1)
endIf
return s
EndFunction

string function TcOverwriteSummary (handle hDlg)
var
	handle hUpper,
	handle hLower,
	string sUpper,
	string sLower,
	string sName
let hUpper = TcFindOverwriteGroup (hDlg, false)
let hLower = TcFindOverwriteGroup (hDlg, true)
if !hUpper || !hLower || hUpper == hLower then
	return cscNull
endIf
let sUpper = TcReadGroupLines (hUpper)
let sLower = TcReadGroupLines (hLower)
if !sUpper || !sLower then
	return cscNull
endIf
let sName = StringSegment (StringSegment (sUpper, tcLineDelim, 2), "\\", -1)
return FormatString (msgTcOverwriteSummary,
	TcCleanCaption (StringSegment (sUpper, tcLineDelim, 1)),
	sName,
	StringSegment (sUpper, tcLineDelim, 3),
	StringSegment (sLower, tcLineDelim, 3))
EndFunction

void function TcSayOverwriteDetails (handle hDlg)
var
	handle hGroup,
	string sLines,
	int bLower
let bLower = false
while bLower <= true
	let hGroup = TcFindOverwriteGroup (hDlg, bLower)
	let sLines = TcReadGroupLines (hGroup)
	if sLines then
		SayMessage (OT_USER_REQUESTED_INFORMATION, FormatString (msgTcOverwriteGroup,
			TcCleanCaption (StringSegment (sLines, tcLineDelim, 1)),
			StringSegment (sLines, tcLineDelim, 2),
			StringSegment (sLines, tcLineDelim, 3)))
	endIf
	let bLower = bLower + 1
endWhile
EndFunction

void function FocusChangedEventEx (handle hwndFocus, int nObject, int nChild,
	handle hwndPrevFocus, int nPrevObject, int nPrevChild,
	int nChangeDepth)
var
	handle hDlg,
	string sSummary
let hDlg = TcGetOverwriteDialog (hwndFocus)
; Speak the summary only when focus enters the dialog, not when moving inside it.
if hDlg
&& TcGetOverwriteDialog (hwndPrevFocus) != hDlg then
	let sSummary = TcOverwriteSummary (hDlg)
	if sSummary then
		SayMessage (OT_DIALOG_TEXT, sSummary)
	endIf
endIf
FocusChangedEventEx (hwndFocus, nObject, nChild, hwndPrevFocus, nPrevObject, nPrevChild, nChangeDepth)
EndFunction

Script ReadBoxInTabOrder ()
var handle hDlg
let hDlg = TcGetOverwriteDialog (GetFocus ())
if hDlg then
	TcSayOverwriteDetails (hDlg)
	return
endIf
PerformScript ReadBoxInTabOrder ()
EndScript
