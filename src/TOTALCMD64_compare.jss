; Total Commander JAWS scripts: Compare by content: files, status, both lines of the current difference
; Copyright (c) 2026 author. MIT License.
; Included by TOTALCMD64.jss; not compiled on its own.


; ---------------------------------------------------------------------------
; Compare by content (TFileCompForm, 2026-11-22). The two file panes are painted windows
; without focus; the status line below them is a window whose name is TC's text ("1
; difference found"). After each key in the window the scripts look whether the status or
; the panes changed, so it works with any button or shortcut in any TC language.
; ---------------------------------------------------------------------------

handle function TcCmpPane (handle hForm, int bRight)
; The left or right file pane: the widest painted child windows, told apart by position.
var
	handle h,
	handle hFound,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	int nFoundLeft
let h = GetFirstChild (hForm)
while h
	if GetWindowClass (h) == wcTcPlainWindow
	&& IsWindowVisible (h) then
		GetWindowRect (h, nLeft, nRight, nTop, nBottom)
		if nRight - nLeft > tcCmpPaneMin
		&& nBottom - nTop > tcCmpPaneMin
		&& !GetFirstChild (h) then
			if !hFound
			|| (bRight && nLeft > nFoundLeft)
			|| (!bRight && nLeft < nFoundLeft) then
				let hFound = h
				let nFoundLeft = nLeft
			endIf
		endIf
	endIf
	let h = GetNextWindow (h)
endWhile
return hFound
EndFunction

string function TcCmpStatus (handle hForm)
; The status line: the child window that carries a text of its own.
var handle h
let h = GetFirstChild (hForm)
while h
	if GetWindowClass (h) == wcTcPlainWindow
	&& GetWindowName (h) then
		return GetWindowName (h)
	endIf
	let h = GetNextWindow (h)
endWhile
return cscNull
EndFunction

string function TcCmpPaneText (handle hPane)
var
	int nLeft,
	int nRight,
	int nTop,
	int nBottom
if !hPane then
	return cscNull
endIf
GetWindowRect (hPane, nLeft, nRight, nTop, nBottom)
return StringReplaceSubstrings (GetTextInRect (nLeft, nTop, nRight, nBottom, 0, IgnoreColor, IgnoreColor, true),
	tcCarriageReturn, cscNull)
EndFunction

string function TcCmpLineContent (string sLine)
; "25:Ovo je redak" -> "Ovo je redak": the text after the line number
var int nPos
let nPos = StringContains (sLine, ":")
if !nPos then
	return sLine
endIf
return StringTrimLeadingBlanks (StringChopLeft (sLine, nPos))
EndFunction

string function TcCmpLineForSpeech (string sLine)
; A line with nothing after its number gets JAWS's "blank".
let sLine = StringTrimTrailingBlanks (StringTrimLeadingBlanks (sLine))
if !TcCmpLineContent (sLine) then
	return sLine + " " + cmsgBlank1
endIf
return sLine
EndFunction

int function TcCmpIsPane (handle hwnd)
; A file pane of the compare window (it has the focus only in Editing mode).
var handle hForm
let hForm = GetTopLevelWindow (hwnd)
return hwnd
	&& (hwnd == TcCmpPane (hForm, false) || hwnd == TcCmpPane (hForm, true))
EndFunction

string function TcCmpRowText (handle hPane, int nY)
; The painted line of a pane at the height nY on the screen.
var
	int nLeft,
	int nRight,
	int nTop,
	int nBottom
if !hPane then
	return cscNull
endIf
GetWindowRect (hPane, nLeft, nRight, nTop, nBottom)
; a little wider on the left: with the window maximized the left pane starts at the screen
; edge and the first digit of the line number fell outside ("0:" for "10:", 2026-11-23)
return GetTextInRect (nLeft - tcCmpEdgePad, nY - tcCmpRowHalf, nRight, nY + tcCmpRowHalf, 0, IgnoreColor, IgnoreColor, false)
EndFunction

handle function TcCmpPathEdit (handle hForm, int bRight)
; The path field of the left or right file, at the top of the window (inside a panel),
; told apart by position.
var
	handle hPanel,
	handle h,
	handle hFound,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	int nFoundLeft
let hPanel = GetFirstChild (hForm)
while hPanel
	let h = GetFirstChild (hPanel)
	while h
		if GetWindowClass (h) == wcEdit
		&& IsWindowVisible (h) then
			GetWindowRect (h, nLeft, nRight, nTop, nBottom)
			if !hFound
			|| (bRight && nLeft > nFoundLeft)
			|| (!bRight && nLeft < nFoundLeft) then
				let hFound = h
				let nFoundLeft = nLeft
			endIf
		endIf
		let h = GetNextWindow (h)
	endWhile
	let hPanel = GetNextWindow (hPanel)
endWhile
return hFound
EndFunction

string function TcCmpFileName (handle hForm, int bRight)
; File name without the folder, from the path field (MSAA value).
var
	object oField,
	int nChild,
	string sPath
let oField = GetObjectFromEvent (TcCmpPathEdit (hForm, bRight), tcObjIdClient, 0, nChild)
if oField then
	let sPath = oField.accValue (nChild)
endIf
return StringSegment (sPath, tcPathSep, -1)
EndFunction

string function TcCmpFiles (handle hForm)
; "izmjena.txt, original.txt": the left file, then the right one (2026-11-23)
return TcCmpFileName (hForm, false) + ", " + TcCmpFileName (hForm, true)
EndFunction

void function TcCmpSnapshot (handle hForm)
let ghTcCmpForm = hForm
let gsTcCmpStatus = TcCmpStatus (hForm)
let gsTcCmpPanes = TcCmpPaneText (TcCmpPane (hForm, false)) + TcCmpPaneText (TcCmpPane (hForm, true))
EndFunction

void function TcCompareCheck ()
; Says the new status line, and the first block of differing lines when the panes moved:
; the left lines first, then the right ones.
var
	handle hForm,
	string sStatus,
	string sLeft,
	string sRight,
	string sLeftSay,
	string sRightSay,
	string sL,
	string sR,
	int nCount,
	int i,
	int nRows,
	int bInBlock
let hForm = GetTopLevelWindow (GetFocus ())
if GetWindowClass (hForm) != wcTcCompare then
	return
endIf
let sStatus = TcCmpStatus (hForm)
let sLeft = TcCmpPaneText (TcCmpPane (hForm, false))
let sRight = TcCmpPaneText (TcCmpPane (hForm, true))
; a new comparison: which file is left and which right, then TC's status line
if sStatus && sStatus != gsTcCmpStatus then
	Say (TcCmpFiles (hForm), OT_STATUS)
	Say (sStatus, OT_STATUS)
endIf
; The current difference is known only in Editing mode (Alt+E in TC's Croatian, by its
; button), where the panes get a text cursor that Next/Previous difference moves; outside it
; TC marks the current difference with a thin painted frame that JAWS does not see, and the
; first difference on screen was said wrongly (2026-11-23). After a button key in Editing
; mode, the line at the cursor is said from both panes, left first.
if gbTcCmpForce
&& TcCmpIsPane (GetFocus ()) then
	; the side with the cursor from JAWS's own line (the band lost the first digit of "40:"
	; there, 2026-11-23); the other side from the band at the same height
	if GetFocus () == TcCmpPane (hForm, false) then
		let sL = GetLine ()
		let sR = TcCmpRowText (TcCmpPane (hForm, true), GetCursorRow ())
	else
		let sL = TcCmpRowText (TcCmpPane (hForm, false), GetCursorRow ())
		let sR = GetLine ()
	endIf
	let sLeftSay = TcCmpLineForSpeech (sL)
	let sRightSay = TcCmpLineForSpeech (sR)
	; Alt+letter comes as two key events; the same text right after is not said again
	if !(sLeftSay + sRightSay == gsTcCmpSaid && GetTickCount () - giTcCmpSaidTick < tcCmpRepeatTicks) then
		Say (sLeftSay, OT_LINE)
		Say (sRightSay, OT_LINE)
		let gsTcCmpSaid = sLeftSay + sRightSay
		let giTcCmpSaidTick = GetTickCount ()
	endIf
endIf
let gbTcCmpForce = false
TcCmpSnapshot (hForm)
EndFunction
