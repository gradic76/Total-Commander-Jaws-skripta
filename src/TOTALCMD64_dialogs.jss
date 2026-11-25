; Total Commander JAWS scripts: dialogs: overwrite, messages, copy/move totals
; Copyright (c) 2026 author. MIT License.
; Included by TOTALCMD64.jss; not compiled on its own.


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
return FormatString (TcMsg ("msgTcOverwriteSummary", msgTcOverwriteSummary),
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
		SayMessage (OT_USER_REQUESTED_INFORMATION, FormatString (TcMsg ("msgTcOverwriteGroup", msgTcOverwriteGroup),
			TcCleanCaption (StringSegment (sLines, tcLineDelim, 1)),
			StringSegment (sLines, tcLineDelim, 2),
			StringSegment (sLines, tcLineDelim, 3)))
	endIf
	let bLower = bLower + 1
endWhile
EndFunction

; ---------------------------------------------------------------------------
; Message dialogs (TExtMsgForm: long name, delete confirmations and similar;
; TCheckMsgBox: simple Yes/No questions such as copying from a virtual folder).
; The question is only painted above the buttons, so it is read from the
; off-screen model and spoken in place of the dialog title.
; ---------------------------------------------------------------------------

int function TcIsMessageDialog (handle hwnd)
var string sClass
let sClass = GetWindowClass (hwnd)
return sClass == wcTcMsgForm
	|| sClass == wcTcCheckMsgBox
EndFunction

int function TcButtonsTop (handle hDlg)
; Top screen row of the highest visible button in the dialog, or 0.
var
	handle hwnd,
	int nBest,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom
let hwnd = GetFirstChild (hDlg)
while hwnd
	if GetWindowClass (hwnd) == wcButton
	&& IsWindowVisible (hwnd) then
		GetWindowRect (hwnd, nLeft, nRight, nTop, nBottom)
		if !nBest || nTop < nBest then
			let nBest = nTop
		endIf
	endIf
	let hwnd = GetNextWindow (hwnd)
endWhile
return nBest
EndFunction

string function TcMessageText (handle hDlg)
; The painted message of a TExtMsgForm: every line above the buttons, joined by spaces.
var
	string sLines,
	string sLine,
	string sTitle,
	string sText,
	int nStop,
	int nCount,
	int i
let nStop = TcButtonsTop (hDlg)
if !nStop then
	return cscNull
endIf
let sLines = TcReadWindowLines (hDlg, tcMsgMaxLines, hDlg, nStop)
let sTitle = GetWindowName (hDlg)
let nCount = StringSegmentCount (sLines, tcLineDelim)
let i = 1
while i <= nCount
	let sLine = StringTrimTrailingBlanks (StringTrimLeadingBlanks (StringSegment (sLines, tcLineDelim, i)))
	if sLine && sLine != sTitle then
		if sText then
			let sText = sText + " " + sLine
		else
			let sText = sLine
		endIf
	endIf
	let i = i + 1
endWhile
return sText
EndFunction

string function TcCopyTotals (string sNumbers)
; "4,51 G 88 13" -> "4,51 G, 88 file(s), 13 dir(s)": the size is the number followed by a
; unit (a token not starting with a digit); the other numbers are the file and folder counts.
var
	int nCount,
	int i,
	int nCounts,
	string sToken,
	string sNext,
	string sSize,
	string sFiles,
	string sDirs
let sNumbers = TcSingleSpaces (sNumbers)
let nCount = StringSegmentCount (sNumbers, " ")
let i = 1
while i <= nCount
	let sToken = StringSegment (sNumbers, " ", i)
	let sNext = StringSegment (sNumbers, " ", i + 1)
	if i < nCount
	&& !StringToInt (StringLeft (sNext, 1)) && StringLeft (sNext, 1) != "0" then
		let sSize = sToken + " " + sNext
		let i = i + 1
	else
		let nCounts = nCounts + 1
		if nCounts == 1 then
			let sFiles = sToken
		else
			let sDirs = sToken
		endIf
	endIf
	let i = i + 1
endWhile
if !sFiles then
	return sNumbers
endIf
let sToken = sSize
if sToken then
	let sToken = sToken + ", "
endIf
let sToken = sToken + sFiles + " " + TcStatusWord (1)
if sDirs then
	let sToken = sToken + ", " + sDirs + " " + TcStatusWord (2)
endIf
return sToken
EndFunction

string function TcCopyDialogText (handle hDlg)
; Insert+B in the copy and move dialog (F5, F6): the painted label and the target, the filter
; line, and the painted total "4,51 G 88 13" with TC's words for files and folders. The two
; combo boxes are found by position; the label is painted above the upper one and the
; filter line between them (measured 2026-11-20).
var
	handle hChild,
	handle hUpper,
	handle hLower,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	int nUpperTop,
	int nUpperBottom,
	int nLowerTop,
	int nDlgLeft,
	int nDlgRight,
	int nCount,
	string sLabel,
	string sLine,
	string sNumbers,
	string sText
let hChild = GetFirstChild (hDlg)
while hChild
	if GetWindowClass (hChild) == wcTcComboBox
	&& IsWindowVisible (hChild) then
		GetWindowRect (hChild, nLeft, nRight, nTop, nBottom)
		if !hUpper || nTop < nUpperTop then
			if hUpper then
				let hLower = hUpper
				let nLowerTop = nUpperTop
			endIf
			let hUpper = hChild
			let nUpperTop = nTop
			let nUpperBottom = nBottom
		else
			let hLower = hChild
			let nLowerTop = nTop
		endIf
	endIf
	let hChild = GetNextWindow (hChild)
endWhile
if !hUpper || !hLower then
	return cscNull
endIf
GetWindowRect (hDlg, nDlgLeft, nDlgRight, nTop, nBottom)
let sLabel = StringTrimTrailingBlanks (GetTextInRect (nDlgLeft, nUpperTop - (nLowerTop - nUpperTop),
	nDlgRight, nUpperTop, 0, IgnoreColor, IgnoreColor, false))
let sText = sLabel + ": " + TcFieldText (GetFirstChild (hUpper)) + ". "
let sLine = StringTrimTrailingBlanks (GetTextInRect (nDlgLeft, nUpperBottom, nDlgRight, nLowerTop,
	0, IgnoreColor, IgnoreColor, false))
if StringContains (sLine, ":") then
	; the filter is said only when one is set (decision 2026-11-20)
	if TcFieldText (GetFirstChild (hLower)) then
		let sText = sText + StringSegment (sLine, ":", 1) + ": " + TcFieldText (GetFirstChild (hLower)) + ". "
	endIf
	let sText = sText + TcCopyTotals (StringChopLeft (sLine, StringContains (sLine, ":")))
endIf
return sText
EndFunction
