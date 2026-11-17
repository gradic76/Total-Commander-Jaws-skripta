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

; ---------------------------------------------------------------------------
; Message dialogs (TExtMsgForm): long name, delete confirmations and similar.
; The question is only painted above the buttons, so it is read from the
; off-screen model and spoken in place of the dialog title.
; ---------------------------------------------------------------------------

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

int function HandleCustomRealWindows (handle hwnd)
; Called by the default focus handling when focus enters a new real window.
; For the overwrite dialog, speak the file summary instead of the dialog title
; ("Total Commander"), which the progress window owning it has usually just spoken.
var string sSummary
if GetWindowClass (hwnd) == wcTcOverwrite then
	let sSummary = TcOverwriteSummary (hwnd)
	if sSummary then
		SayMessage (OT_DIALOG_TEXT, sSummary)
		return true
	endIf
endIf
if GetWindowClass (hwnd) == wcTcMsgForm then
	let sSummary = TcMessageText (hwnd)
	if sSummary then
		SayMessage (OT_DIALOG_TEXT, sSummary)
		return true
	endIf
endIf
return HandleCustomRealWindows (hwnd)
EndFunction

; ---------------------------------------------------------------------------
; Copy/move progress window (TDLG2FILEACTION*)
; Painted lines: "<operation>: <speed>, <time left>", From, To, file percent,
; total percent, speed, "<files done> / <files> <size done> / <size>".
; JAWS speaks every progress bar change; that is silenced here and
; Insert+Page Down speaks a summary on demand.
; ---------------------------------------------------------------------------

handle function TcGetProgressDialog (handle hwnd)
var handle h
let h = hwnd
while h
	if StringContains (GetWindowClass (h), wcTcProgressPrefix) == 1 then
		return h
	endIf
	let h = GetParent (h)
endWhile
return 0
EndFunction

int function TcParseProgress (handle hDlg, string ByRef sTotalPct, string ByRef sFilePct,
	string ByRef sCounts, string ByRef sTime, string ByRef sFileName)
; Reads the painted lines of the progress window and picks out its parts.
; Returns false when nothing could be read.
var
	string sLines,
	string sLine,
	string sTitle,
	string sHeader,
	int nCount,
	int i
let sTotalPct = cscNull
let sFilePct = cscNull
let sCounts = cscNull
let sTime = cscNull
let sFileName = cscNull
let sLines = TcReadWindowLines (hDlg, tcProgressMaxLines, hDlg)
if !sLines then
	return false
endIf
let sTitle = GetWindowName (hDlg)
let nCount = StringSegmentCount (sLines, tcLineDelim)
let i = 1
while i <= nCount
	let sLine = StringTrimTrailingBlanks (StringTrimLeadingBlanks (StringSegment (sLines, tcLineDelim, i)))
	if sLine && sLine != sTitle then
		if StringRight (sLine, 1) == "%" then
			; first percent line is the current file, second is the total
			if !sFilePct then
				let sFilePct = sLine
			elIf !sTotalPct then
				let sTotalPct = sLine
			endIf
		elIf StringContains (sLine, "\\") then
			; first path line is the source ("From"); its last segment is the file name
			if !sFileName then
				let sFileName = StringSegment (sLine, "\\", -1)
			endIf
		elIf !sHeader then
			let sHeader = sLine
		elIf !sCounts && StringContains (sLine, " / ") then
			let sCounts = sLine
		endIf
	endIf
	let i = i + 1
endWhile
; A single percent line means there is only the total bar.
if sFilePct && !sTotalPct then
	let sTotalPct = sFilePct
	let sFilePct = cscNull
endIf
if StringContains (sHeader, ",") then
	let sTime = StringTrimLeadingBlanks (StringSegment (sHeader, ",", -1))
endIf
return true
EndFunction

int function TcPercentValue (string sPct)
; "30 %" or "30%" -> 30
return StringToInt (StringTrimTrailingBlanks (StringReplaceSubstrings (sPct, "%", cscNull)))
EndFunction

string function TcProgressSummary (handle hDlg)
var
	string sTotalPct,
	string sFilePct,
	string sCounts,
	string sTime,
	string sFileName,
	string sOut
if !TcParseProgress (hDlg, sTotalPct, sFilePct, sCounts, sTime, sFileName) then
	return cscNull
endIf
if sTotalPct then
	let sOut = FormatString (msgTcProgressTotal, sTotalPct)
endIf
if sFilePct then
	let sOut = sOut + ", " + FormatString (msgTcProgressFile, sFilePct)
endIf
if sCounts then
	let sOut = sOut + ", " + sCounts
endIf
if sTime then
	let sOut = sOut + ", " + FormatString (msgTcProgressLeft, sTime)
endIf
return sOut
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

; ---------------------------------------------------------------------------
; Background transfer manager (queue, F5 then F2) and background job windows
; Standard dialogs whose texts (current file, speed, percent) change constantly.
; Automatic speech of those changes is silenced; Insert+Page Down speaks the
; title, which holds the total percent and the job name.
; ---------------------------------------------------------------------------

handle function TcGetBackgroundDialog (handle hwnd)
; Cached: the answer for the last matching and the last non-matching real window is remembered.
var handle h
let h = GetRealWindow (hwnd)
if !h then
	return 0
endIf
if h == ghTcBgYes then
	return h
endIf
if h == ghTcBgNo then
	return 0
endIf
if GetWindowClass (h) == wcDialog
&& FindWindow (h, wcProgressBar)
&& FindWindow (h, wcEdit) then
	let ghTcBgYes = h
	return h
endIf
let ghTcBgNo = h
return 0
EndFunction

int function NewTextEventShouldBeSilent (handle hFocus, handle hwnd, string buffer, int nAttributes,
	int nTextColor, int nBackgroundColor, int nEcho, string sFrameName)
if hwnd != hFocus
&& TcGetBackgroundDialog (hwnd) then
	return true
endIf
return NewTextEventShouldBeSilent (hFocus, hwnd, buffer, nAttributes, nTextColor, nBackgroundColor, nEcho, sFrameName)
EndFunction

int function HandleCustomWindows (handle hwnd)
var string sName
if GetWindowClass (hwnd) == wcButton then
	let sName = GetObjectName ()
	; TC check boxes are three-state buttons; JAWS calls them "3 state button".
	if GetWindowSubtypeCode (hwnd) == WT_3STATE then
		IndicateControlType (WT_CHECKBOX, sName)
		IndicateControlState (WT_CHECKBOX, GetControlAttributes ())
		return true
	endIf
	; The "-" button caption is punctuation, which JAWS does not speak.
	if GetWindowName (hwnd) == tcMinusCaption then
		IndicateControlType (WT_BUTTON, msgTcMinus)
		return true
	endIf
	; Pack dialog: the compression ratio button shows only the digit; its label is painted.
	if GetWindowClass (GetParent (hwnd)) == wcTcPackDlg
	&& StringLength (sName) == 1
	&& StringContains (tcDigits, sName) then
		IndicateControlType (WT_BUTTON, FormatString (msgTcCompressionRatio, sName))
		return true
	endIf
endIf
return HandleCustomWindows (hwnd)
EndFunction

void function TcAnnounceProgressStep (handle hDlg)
; Speaks the total percent and the current file name each time the total
; passes another tcProgressAnnounceStep percent.
var
	string sTotalPct,
	string sFilePct,
	string sCounts,
	string sTime,
	string sFileName,
	int nStep
if !TcParseProgress (hDlg, sTotalPct, sFilePct, sCounts, sTime, sFileName)
|| !sTotalPct then
	return
endIf
let nStep = TcPercentValue (sTotalPct) / tcProgressAnnounceStep
if hDlg != ghTcProgressDlg then
	; new progress window: remember the starting step without speaking
	let ghTcProgressDlg = hDlg
	let giTcProgressStep = nStep
	let giTcProgressSpokenTick = GetTickCount ()
	return
endIf
; On fast jobs several steps pass per second; keep a minimum gap between
; announcements so each one can be heard to the end.
if nStep > giTcProgressStep
&& GetTickCount () - giTcProgressSpokenTick >= tcProgressMinGapTicks then
	let giTcProgressStep = nStep
	let giTcProgressSpokenTick = GetTickCount ()
	; A newer announcement replaces an unfinished older one, so speech never lags behind.
	StopSpeech ()
	if sFileName then
		SayMessage (OT_STATUS, FormatString (msgTcProgressTotal, sTotalPct) + ", " + sFileName)
	else
		SayMessage (OT_STATUS, FormatString (msgTcProgressTotal, sTotalPct))
	endIf
endIf
EndFunction

void function TcProgressTimer ()
; Runs every tcProgressCheckTicks while focus stays in a progress window.
var handle hDlg
let hDlg = TcGetProgressDialog (GetFocus ())
if !hDlg then
	let giTcProgressTimer = 0
	return
endIf
TcAnnounceProgressStep (hDlg)
let giTcProgressTimer = ScheduleFunction ("TcProgressTimer", tcProgressCheckTicks / 100)
EndFunction

void function TcStartProgressTimer ()
if !giTcProgressTimer then
	let giTcProgressTimer = ScheduleFunction ("TcProgressTimer", tcProgressCheckTicks / 100)
endIf
EndFunction

void function ProgressBarChangedEvent (handle hProgress, string sName, string sValue)
var handle hDlg
let hDlg = TcGetProgressDialog (hProgress)
if hDlg then
	; Bar changes are not spoken; they only start the timer for periodic announcements.
	if TcGetProgressDialog (GetFocus ()) == hDlg then
		TcStartProgressTimer ()
	endIf
	return
endIf
if TcGetBackgroundDialog (hProgress) then
	return
endIf
ProgressBarChangedEvent (hProgress, sName, sValue)
EndFunction

Script SayBottomLineOfWindow ()
var
	handle hDlg,
	string sSummary
let hDlg = TcGetProgressDialog (GetFocus ())
if hDlg then
	let sSummary = TcProgressSummary (hDlg)
	if sSummary then
		SayMessage (OT_USER_REQUESTED_INFORMATION, sSummary)
	else
		SayMessage (OT_ERROR, msgTcProgressUnknown)
	endIf
	return
endIf
let hDlg = TcGetBackgroundDialog (GetFocus ())
if hDlg then
	SayMessage (OT_USER_REQUESTED_INFORMATION, GetWindowName (hDlg))
	return
endIf
PerformScript SayBottomLineOfWindow ()
EndScript

; ---------------------------------------------------------------------------
; File panels (LCLListBox)
; JAWS speaks the item through ActiveItemChangedEvent; the item name is the whole row.
; Arrows speak only the file name; Insert+Up Arrow speaks the whole row and position.
; ---------------------------------------------------------------------------

int function TcIsFileListFocused ()
return IsPCCursor ()
	&& GetWindowClass (GetFocus ()) == wcTcFileList
EndFunction

string function TcListRowName (string sRow)
; The name is the first tab separated column. Rows without columns
; (e.g. Brief view) are returned whole.
return StringSegment (sRow, tcColumnDelim, 1)
EndFunction

int function TcListRowIsDir (string sRow)
return StringLeft (StringSegment (sRow, tcColumnDelim, 2), 1) == tcDirMarkerStart
EndFunction

string function TcListRowForSpeech (string sRow)
; Whole row with columns separated by commas, for Insert+Up Arrow.
return StringReplaceSubstrings (sRow, tcColumnDelim, ", ")
EndFunction

void function TcSayListItemName ()
var string sRow
let sRow = GetObjectName ()
if GetControlAttributes () & CTRL_SELECTED then
	IndicateControlState (WT_LISTBOXITEM, CTRL_SELECTED)
endIf
if TcListRowIsDir (sRow) then
	Say (FormatString (msgTcFolder, TcListRowName (sRow)), OT_LINE)
else
	Say (TcListRowName (sRow), OT_LINE)
endIf
EndFunction

Void Function ActiveItemChangedEvent (handle curHwnd, int curObjectId, int curChildId,
	handle prevHwnd, int prevObjectId, int prevChildId)
if GetWindowClass (curHwnd) == wcTcFileList
&& curHwnd == GetFocus ()
&& IsPCCursor () then
	TcSayListItemName ()
	return
endIf
ActiveItemChangedEvent (curHwnd, curObjectId, curChildId, prevHwnd, prevObjectId, prevChildId)
EndFunction

Script SayLine ()
if TcIsFileListFocused () then
	if GetControlAttributes () & CTRL_SELECTED then
		IndicateControlState (WT_LISTBOXITEM, CTRL_SELECTED)
	endIf
	Say (TcListRowForSpeech (GetObjectName ()), OT_LINE)
	Say (PositionInGroup (), OT_POSITION)
	return
endIf
PerformScript SayLine ()
EndScript

Script ReadBoxInTabOrder ()
var handle hDlg
let hDlg = TcGetOverwriteDialog (GetFocus ())
if hDlg then
	TcSayOverwriteDetails (hDlg)
	return
endIf
let hDlg = TcGetProgressDialog (GetFocus ())
if hDlg then
	TcSayWindowLines (hDlg)
	return
endIf
let hDlg = GetRealWindow (GetFocus ())
if GetWindowClass (hDlg) == wcTcMsgForm then
	TcSayWindowLines (hDlg)
	return
endIf
PerformScript ReadBoxInTabOrder ()
EndScript
