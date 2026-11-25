; Total Commander JAWS scripts: shared helpers: reading painted lines and labels, groups and fields, word handling
; Copyright (c) 2026 author. MIT License.
; Included by TOTALCMD64.jss; not compiled on its own.


handle function TcFindDialogOf (handle hwnd)
; The Find Files dialog containing hwnd (its controls sit on tab pages), or 0.
var handle h
let h = hwnd
while h
	if GetWindowClass (h) == wcTcFindDlg then
		return h
	endIf
	let h = GetParent (h)
endWhile
return 0
EndFunction

int function TcIsWindowInside (handle hwnd, handle hContainer)
var handle h
let h = hwnd
while h
	if h == hContainer then
		return true
	endIf
	let h = GetParent (h)
endWhile
return false
EndFunction

string function TcReadWindowLines (handle hwnd, int nMax, handle hContainer, optional int nStopRow)
; Reads up to nMax screen lines from the off-screen model, starting at hwnd,
; using the Invisible cursor. Lines are joined by tcLineDelim.
; If hContainer is given, reading stops when the cursor leaves that window.
; If nStopRow is given, reading stops at the first line at or below that screen row.
; Reading also stops when NextLine no longer moves the cursor (last line).
var
	string sLines,
	int nRow,
	int i
SaveCursor ()
InvisibleCursor ()
if !MoveToWindow (hwnd) then
	RestoreCursor ()
	return cscNull
endIf
let sLines = GetLine ()
let i = 1
while i < nMax
	let nRow = GetCursorRow ()
	NextLine ()
	if GetCursorRow () == nRow
	|| (nStopRow && GetCursorRow () >= nStopRow)
	|| (hContainer && !TcIsWindowInside (GetCurrentWindow (), hContainer)) then
		let i = nMax
	else
		let sLines = sLines + tcLineDelim + GetLine ()
		let i = i + 1
	endIf
endWhile
RestoreCursor ()
return sLines
EndFunction

string function TcReadGroupLines (handle hGroup)
; Returns the three screen lines of a file group box: caption, path, size and date.
return TcReadWindowLines (hGroup, 3, 0)
EndFunction

string function TcLabelAbove (handle hControl)
; The painted text in a band just above a control, across its width.
var
	int nLeft,
	int nRight,
	int nTop,
	int nBottom
GetWindowRect (hControl, nLeft, nRight, nTop, nBottom)
return StringTrimTrailingBlanks (StringTrimLeadingBlanks (GetTextInRect (nLeft, nTop - tcLabelBand, nRight, nTop,
	0, IgnoreColor, IgnoreColor, false)))
EndFunction

handle function TcGroupOf (handle hwnd, handle hDlg)
; The nearest group box (class Button) that contains hwnd, below the dialog hDlg.
var handle h
let h = GetParent (hwnd)
while h && h != hDlg
	if GetWindowClass (h) == wcButton then
		return h
	endIf
	let h = GetParent (h)
endWhile
return 0
EndFunction

string function TcTextInWindowRect (handle hwnd)
; The text painted within a window's rectangle, whichever window painted it.
var
	int nLeft,
	int nRight,
	int nTop,
	int nBottom
GetWindowRect (hwnd, nLeft, nRight, nTop, nBottom)
return StringTrimTrailingBlanks (StringTrimLeadingBlanks (GetTextInRect (nLeft, nTop, nRight, nBottom,
	0, IgnoreColor, IgnoreColor, false)))
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

string function TcOnOff (int bOn)
if bOn then
	return cmsg_on
endIf
return cmsg_off
EndFunction

void function TcSayWindowLines (handle hDlg)
; Speaks every painted line of a dialog, without leaving it.
; Used where the default Insert+B reads the owner window instead of the dialog.
var
	string sLines,
	string sLine,
	string sTitle,
	int nCount,
	int i
let sLines = TcReadWindowLines (hDlg, tcMsgMaxLines, hDlg)
let sTitle = GetWindowName (hDlg)
let nCount = StringSegmentCount (sLines, tcLineDelim)
let i = 1
while i <= nCount
	let sLine = StringTrimTrailingBlanks (StringSegment (sLines, tcLineDelim, i))
	if sLine && sLine != sTitle then
		SayMessage (OT_USER_REQUESTED_INFORMATION, sLine)
	endIf
	let i = i + 1
endWhile
EndFunction

int function TcIsLeftOfSiblingEdit (handle hwnd)
; Whether hwnd lies left of another edit field with the same parent.
var
	handle h,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	int nMyLeft
GetWindowRect (hwnd, nMyLeft, nRight, nTop, nBottom)
let h = GetFirstChild (GetParent (hwnd))
while h
	if h != hwnd
	&& GetWindowClass (h) == wcEdit then
		GetWindowRect (h, nLeft, nRight, nTop, nBottom)
		return nMyLeft < nLeft
	endIf
	let h = GetNextWindow (h)
endWhile
return true
EndFunction

string function TcDropTokens (string sText, int nCount, int bFromEnd)
; Removes nCount space separated words from the start or the end.
var int i
let i = 0
while i < nCount
	if bFromEnd then
		let sText = StringChopRight (sText, StringLength (StringSegment (sText, " ", -1)) + 1)
	else
		let sText = StringChopLeft (sText, StringLength (StringSegment (sText, " ", 1)) + 1)
	endIf
	let i = i + 1
endWhile
return sText
EndFunction

string function TcSingleSpaces (string sText)
; Painted text keeps the gaps between its parts as runs of spaces.
while StringContains (sText, "  ")
	let sText = StringReplaceSubstrings (sText, "  ", " ")
endWhile
return StringTrimTrailingBlanks (StringTrimLeadingBlanks (sText))
EndFunction

string function TcFieldText (handle hEdit)
; The content of an edit field, through MSAA: GetWindowName gave the field's label, and the
; painted text in its rectangle carried an extra "OK" along in the F6 dialog (2026-11-21).
var
	object oField,
	int nChild,
	string sValue
let oField = GetObjectFromEvent (hEdit, tcObjIdClient, 0, nChild)
if oField then
	let sValue = oField.accValue (nChild)
	if sValue then
		return sValue
	endIf
endIf
return GetWindowText (hEdit, false)
EndFunction
