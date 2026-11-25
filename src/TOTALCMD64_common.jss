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

string function TcCheckLabelFor (handle hEdit)
; The caption of the check box or radio button that labels a field or combo box without a
; name of its own: a sibling right before it on the same row, or right above it (Configuration,
; measured 2026-11-25: "Dodatni redci ispod kursora: [4]", "Ignoriraj ... mape:" above the
; list, "Win +" before the key of a shortcut). Found by position only, so it follows any TC
; language.
var
	handle h,
	int nType,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	int nEditLeft,
	int nEditRight,
	int nEditTop,
	int nEditBottom
var int nPass
GetWindowRect (hEdit, nEditLeft, nEditRight, nEditTop, nEditBottom)
; pass 1: left of the field on the same row; pass 2: right above it and across its width
; (a check box on the row above may touch the field's corner: Thumbnails, 2026-11-25)
let nPass = 1
while nPass <= 2
	let h = GetFirstChild (GetParent (hEdit))
	while h
		if h != hEdit
		&& GetWindowClass (h) == wcButton
		&& IsWindowVisible (h) then
			let nType = GetWindowSubtypeCode (h)
			if nType == WT_CHECKBOX || nType == WT_3STATE || nType == WT_RADIOBUTTON then
				GetWindowRect (h, nLeft, nRight, nTop, nBottom)
				if nPass == 1
				&& nTop < nEditBottom && nBottom > nEditTop
				&& nEditLeft - nRight >= -tcLabelGap && nEditLeft - nRight <= tcLabelGap then
					return StringReplaceSubstrings (GetWindowName (h), "&", cscNull)
				endIf
				if nPass == 2
				&& nEditTop - nBottom >= -tcLabelGap && nEditTop - nBottom <= tcLabelGap
				&& nLeft <= nEditLeft + tcLabelGap && nRight >= nEditRight - tcLabelGap then
					return StringReplaceSubstrings (GetWindowName (h), "&", cscNull)
				endIf
			endIf
		endIf
		let h = GetNextWindow (h)
	endWhile
	let nPass = nPass + 1
endWhile
return cscNull
EndFunction

string function TcColorListItem (handle hList, string sItem)
; The open drop-down list of a colour combo box: its items are numbers too, painted as
; colour samples or as the default word (2026-11-25). The row is found at the PC cursor.
var
	string sPainted,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	int nRow,
	int nCompare
if !TcIsNumber (sItem) then
	return cscNull
endIf
GetWindowRect (hList, nLeft, nRight, nTop, nBottom)
let nRow = GetCursorRow ()
if nRow < nTop || nRow > nBottom then
	return cscNull
endIf
let sPainted = StringTrimTrailingBlanks (StringTrimLeadingBlanks (GetTextInRect (nLeft, nRow - tcRowHalf,
	nRight, nRow + tcRowHalf, 0, IgnoreColor, IgnoreColor, false)))
if sPainted == sItem then
	return cscNull
endIf
if sPainted then
	return sPainted
endIf
if TcPaletteColor (sItem) then
	return TcPaletteColor (sItem)
endIf
return TcColorAt (nLeft, nLeft + (nRight - nLeft) / 3, nRow)
EndFunction

int function TcIsUnderSameCombo (handle hCombo)
; Whether a combo box of the same width sits right above hCombo (Configuration, Columns: the
; time format under the date format, sharing its label; measured 2026-11-25).
var
	handle h,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	int nMyLeft,
	int nMyRight,
	int nMyTop,
	int nMyBottom
GetWindowRect (hCombo, nMyLeft, nMyRight, nMyTop, nMyBottom)
let h = GetFirstChild (GetParent (hCombo))
while h
	if h != hCombo
	&& GetWindowClass (h) == wcTcComboBox then
		GetWindowRect (h, nLeft, nRight, nTop, nBottom)
		if nMyTop - nBottom >= 0 && nMyTop - nBottom <= tcLabelGap * 2
		&& nLeft - nMyLeft >= -tcLabelGap && nLeft - nMyLeft <= tcLabelGap
		&& nRight - nMyRight >= -tcLabelGap && nRight - nMyRight <= tcLabelGap then
			return true
		endIf
	endIf
	let h = GetNextWindow (h)
endWhile
return false
EndFunction

string function TcButtonLabelFor (handle hCheck)
; The caption of the push button right after a check box without a caption of its own, on
; the same row (Configuration, Colors: the box before "Odredi boju prema vrsti datoteke...",
; measured 2026-11-25).
var
	handle h,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	int nBoxLeft,
	int nBoxRight,
	int nBoxTop,
	int nBoxBottom
GetWindowRect (hCheck, nBoxLeft, nBoxRight, nBoxTop, nBoxBottom)
let h = GetFirstChild (GetParent (hCheck))
while h
	if h != hCheck
	&& GetWindowClass (h) == wcButton
	&& GetWindowSubtypeCode (h) == WT_BUTTON
	&& IsWindowVisible (h) then
		GetWindowRect (h, nLeft, nRight, nTop, nBottom)
		if nTop < nBoxBottom && nBottom > nBoxTop
		&& nLeft - nBoxRight >= -tcLabelGap && nLeft - nBoxRight <= tcLabelGap then
			return StringReplaceSubstrings (GetWindowName (h), "&", cscNull)
		endIf
	endIf
	let h = GetNextWindow (h)
endWhile
return cscNull
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

int function TcIsNumber (string s)
; Whether s is made of digits only (and not empty).
var int i
if !s then
	return false
endIf
let i = 1
while i <= StringLength (s)
	if !StringContains (tcDigits, SubString (s, i, 1)) then
		return false
	endIf
	let i = i + 1
endWhile
return true
EndFunction

string function TcColorAt (int nEdge, int nX, int nY)
; The name of the colour at nX, nY, or JAWS's "blank" when it is the background, which is
; taken just inside the left edge nEdge.
var int nCompare
if GetColorAtPoint (nX, nY) == GetColorAtPoint (nEdge + tcEdgeInset, nY) then
	return cmsgBlank1
endIf
return GetColorName (GetColorApproximation (GetColorAtPoint (nX, nY), nCompare))
EndFunction

string function TcPaletteColor (string sNumber)
; The name of a standard TC colour by its item number in a colour combo box: items 1 to 16
; are the 16 standard colours (measured 2026-11-25, tcColorPalette); JAWS names them from
; its colour table, in its own language. Empty for other numbers.
var int n = StringToInt (sNumber)
if n < 1 || n > StringSegmentCount (tcColorPalette, tcLanguageSep) then
	return cscNull
endIf
return GetColorName (RGBStringToColor (StringSegment (tcColorPalette, tcLanguageSep, n)))
EndFunction

string function TcColorComboValue (handle hCombo, string sValue)
; A TC colour combo box (Configuration, Colors and Custom view) gives JAWS only the item
; number ("0"); on the screen it shows a painted word for the default ("zadano", in TC's
; language) or a sample of the colour (measured 2026-11-25). Returns what to say instead, or
; nothing for an ordinary combo box whose painted text is its number ("144").
var
	string sPainted,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	int nCompare
if !TcIsNumber (sValue) then
	return cscNull
endIf
let sPainted = TcTextInWindowRect (hCombo)
if sPainted == sValue then
	return cscNull
endIf
if sPainted then
	return sPainted
endIf
; the 16 standard colours by their item number; others (a custom colour) from the screen
if TcPaletteColor (sValue) then
	return TcPaletteColor (sValue)
endIf
; the colour sample fills the left part of the box; an item that paints nothing (the last
; one, a place for a custom colour) shows the background there too (measured 2026-11-25)
GetWindowRect (hCombo, nLeft, nRight, nTop, nBottom)
return TcColorAt (nLeft, nLeft + (nRight - nLeft) / 3, (nTop + nBottom) / 2)
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
