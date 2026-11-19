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

handle function TcQuickSearchBox ()
; The quick search box (Ctrl+Alt+letters) if it is open. JAWS does not move its focus
; there, so the box is found as a visible top-level window (measured 2026-11-18).
var handle h
let h = FindTopLevelWindow (wcTcQuickSearch, cscNull)
if h && IsWindowVisible (h) then
	return h
endIf
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

int function HandleCustomAppWindows (handle hwnd)
; When focus enters Total Commander (e.g. Alt+Tab), JAWS announced the main window as
; "List box <user>^ - Total Commander (x64) 11.56 - <licensee>". Only the program name
; is spoken; Insert+T still reads the whole title (decision 2026-11-18).
if GetWindowClass (hwnd) == wcTcMain
&& StringContains (GetWindowName (hwnd), tcProductName) then
	Say (tcProductName, OT_WINDOW_NAME)
	return true
endIf
return HandleCustomAppWindows (hwnd)
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
if TcIsMessageDialog (hwnd) then
	let sSummary = TcMessageText (hwnd)
	if sSummary then
		SayMessage (OT_DIALOG_TEXT, sSummary)
		return true
	endIf
endIf
; Quick search box (Ctrl+Alt+letters): a TQUICKSEARCH window titled "QUICKSEARCH";
; "Quick search" is said instead (decision 2026-11-18).
if GetWindowClass (hwnd) == wcTcQuickSearch then
	Say (msgTcQuickSearch, OT_DIALOG_NAME)
	return true
endIf
; Back in the main window after a dialog: the same long title, as in HandleCustomAppWindows.
if GetWindowClass (hwnd) == wcTcMain
&& StringContains (GetWindowName (hwnd), tcProductName) then
	Say (tcProductName, OT_WINDOW_NAME)
	return true
endIf
; Copy/move dialog (F5/F6) and input dialogs such as F7: JAWS announced them as
; "Combo box Total Commander"; the focused field's own label ("Copy 1 file(s) to")
; already says what it is. A title other than the program name is TC's own and says
; what the dialog does ("Expand selection", "Shrink selection"), so it is spoken;
; such dialogs change the marks, so the marked count is spoken when focus returns.
if GetWindowClass (hwnd) == wcTcCopyDlg
|| GetWindowClass (hwnd) == wcTcComboInputDlg then
	if GetWindowName (hwnd)
	&& GetWindowName (hwnd) != tcProductName then
		Say (GetWindowName (hwnd), OT_DIALOG_NAME)
		let gbTcCountOnReturn = true
	endIf
	; Shift+F7 makes the new folder in the other panel; the dialog looks the same as F7
	; (decision 2026-11-19).
	if gbTcOtherPanelFolder then
		let gbTcOtherPanelFolder = false
		Say (msgTcInOtherPanel, OT_DIALOG_NAME)
	endIf
	return true
endIf
; Find Files (Alt+F7): JAWS announced "Combo box Find Files"; only TC's title is said.
if GetWindowClass (hwnd) == wcTcFindDlg then
	Say (GetWindowName (hwnd), OT_DIALOG_NAME)
	return true
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
; The panel path line ("c:\Folder\*.*") is repainted after Tab and on entering a folder;
; with the default layout JAWS spoke it each time (measured 2026-11-18). The path has its
; own key, Alt+Shift+P, and ".." says where it leads.
if hwnd != hFocus
&& TcIsPanelLine (StringTrimTrailingBlanks (StringTrimLeadingBlanks (buffer)), tcPanelLinePath) then
	return true
endIf
return NewTextEventShouldBeSilent (hFocus, hwnd, buffer, nAttributes, nTextColor, nBackgroundColor, nEcho, sFrameName)
EndFunction

void function TcSayButtonBarKind (handle hwnd)
; Button bars (Alt+Shift+F11, Alt+Shift+F12): the focus is on a plain "Window" directly
; under the main window; JAWS gives it the current button's hint as name, not the bar
; file name (measured 2026-11-18). The kind is said, told apart by shape.
var
	int nLeft,
	int nRight,
	int nTop,
	int nBottom
if GetWindowClass (hwnd) != wcTcPlainWindow
|| GetWindowClass (GetParent (hwnd)) != wcTcMain then
	return
endIf
GetWindowRect (hwnd, nLeft, nRight, nTop, nBottom)
if nBottom - nTop > nRight - nLeft then
	Say (msgTcVerticalButtonBar, OT_CONTROL_TYPE)
else
	Say (msgTcButtonBar, OT_CONTROL_TYPE)
endIf
EndFunction

int function HandleCustomWindows (handle hwnd)
var string sName
; Command line: an Edit in a combo box in a plain Window directly in the main window
; (in dialogs such as F7 the combo box sits in the dialog, whose GetParent is also the
; main window, so the plain Window matters; 2026-11-19). JAWS said only "Edit"; it is named
; "Command line", without the painted path prompt (decision 2026-11-18).
if GetWindowClass (hwnd) == wcEdit
&& GetWindowClass (GetParent (hwnd)) == wcTcDriveBoxClass
&& GetWindowClass (GetParent (GetParent (hwnd))) == wcTcPlainWindow
&& GetWindowClass (GetParent (GetParent (GetParent (hwnd)))) == wcTcMain then
	IndicateControlType (WT_EDIT, msgTcCommandLine, GetObjectValue ())
	return true
endIf
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
	; Find Files: ">>" after "Search in" opens the Windows folder browser (checked by the
	; author 2026-11-19); JAWS did not speak the caption.
	if GetWindowName (hwnd) == tcBrowseCaption
	&& GetWindowClass (TcFindDialogOf (hwnd)) == wcTcFindDlg then
		IndicateControlType (WT_BUTTON, msgTcBrowse)
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
; Focus entering a file panel (Tab, Alt+Tab, back from a dialog or menu): JAWS said
; "LEFT MultiSelect ListBox", the whole row and the position. Only the panel name
; given by TC ("LEFT"/"RIGHT", the list's own name), the item name (as on the arrows)
; and the position are spoken (decision 2026-11-18).
var string sPanel
if GetWindowClass (hwnd) == wcTcFileList
&& IsPCCursor () then
	; Quick search box open: JAWS keeps the focus in the list and announces the panel
	; again when the box appears (measured 2026-11-18). "Quick search" and the item found.
	if TcQuickSearchBox () then
		TcQuickSearchOpened ()
		TcSayListItemName ()
		return true
	endIf
	if gbTcCountOnReturn then
		let gbTcCountOnReturn = false
		TcSayMarkCounts ()
	endIf
	let sPanel = GetObjectName (false, 1)
	if sPanel then
		Say (sPanel, OT_CONTROL_NAME)
	endIf
	TcSayListItemName ()
	Say (PositionInGroup (), OT_POSITION)
	return true
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

string function TcListRowForSpeech (string sRow)
; Whole row with columns separated by commas, for Insert+Up Arrow.
return StringReplaceSubstrings (sRow, tcColumnDelim, ", ")
EndFunction

string function TcDriveMenuName (string sKey)
; Name of a drive menu item, asked from the Windows shell (as Explorer shows it):
; a drive letter gives e.g. "Glazba" or "BD-ROM pogon" (the " (E:)" suffix is removed);
; TC's special items "+", "*" and "\" give This PC, Documents and Network.
; The menu's own labels are painted in a way JAWS cannot read (measured 2026-11-17).
var
	object oShell,
	object oFolder,
	object oItem,
	string sName,
	string sSuffix
let oShell = CreateObject ("Shell.Application")
if !oShell then
	return cscNull
endIf
if sKey == tcDriveKeyComputer then
	return oShell.NameSpace (ssfDrives).Title
elIf sKey == tcDriveKeyDocuments then
	return oShell.NameSpace (ssfPersonal).Title
elIf sKey == tcDriveKeyNetwork then
	return oShell.NameSpace (ssfNetwork).Title
endIf
if StringLength (sKey) != 1
|| !StringContains (tcDriveLetters, StringLower (sKey)) then
	return cscNull
endIf
let oFolder = oShell.NameSpace (ssfDrives)
if !oFolder then
	return cscNull
endIf
let oItem = oFolder.ParseName (sKey + ":\\")
if !oItem then
	return cscNull
endIf
let sName = oItem.Name
let sSuffix = " (" + StringUpper (sKey) + ":)"
if StringRight (sName, StringLength (sSuffix)) == sSuffix then
	let sName = StringChopRight (sName, StringLength (sSuffix))
endIf
return sKey + " " + sName
EndFunction

; ---------------------------------------------------------------------------
; Panel text lines (measured 2026-11-17)
; Each panel is a child window of the main window that horizontally contains its
; file list. Its lines are recognized by signs, not words:
; - path line: the last path segment is the file filter, e.g. "e:\Music\*.*"
;   (this excludes the command line prompt "e:\Music>", whose container spans both panels);
; - status line: contains " / " and no backslash,
;   e.g. "0 b / 79 k in 0 / 7 file(s), 0 / 7 dir(s)".
; With folder tabs shown the lines sit one level deeper (inside SysTabControl32).
; ---------------------------------------------------------------------------

int function TcIsPanelLine (string sText, int nKind)
if nKind == tcPanelLinePath then
	if StringContains (sText, "\\") then
		return StringContains (StringSegment (sText, "\\", -1), "*")
	endIf
	; A panel that is not a folder (search results fed to the panel) shows its name
	; ending with a colon instead, e.g. "Search result:" (measured 2026-11-19).
	; The drive line starts with "[" and the status line contains " / ".
	return StringRight (sText, 1) == ":"
		&& StringLeft (sText, 1) != "["
		&& !StringContains (sText, " / ")
endIf
if nKind == tcPanelLineStatus then
	return StringContains (sText, " / ")
		&& !StringContains (sText, "\\")
endIf
return false
EndFunction

string function TcPanelLineAmong (handle hParent, int nKind)
; The visible direct child of hParent whose text is a panel line of the given kind.
var
	handle hChild,
	string sText
let hChild = GetFirstChild (hParent)
while hChild
	if IsWindowVisible (hChild) then
		let sText = GetWindowName (hChild)
		if TcIsPanelLine (sText, nKind) then
			return sText
		endIf
	endIf
	let hChild = GetNextWindow (hChild)
endWhile
return cscNull
EndFunction

string function TcFindPanelLine (handle hPanel, int nKind)
; Searches the panel's children and grandchildren. JAWS script functions cannot call
; themselves (recursion compiled but did not work), so the two levels are searched in loops.
var
	handle hChild,
	string sText
let sText = TcPanelLineAmong (hPanel, nKind)
if sText then
	return sText
endIf
let hChild = GetFirstChild (hPanel)
while hChild
	if IsWindowVisible (hChild) then
		let sText = TcPanelLineAmong (hChild, nKind)
		if sText then
			return sText
		endIf
	endIf
	let hChild = GetNextWindow (hChild)
endWhile
return cscNull
EndFunction

string function TcPanelLine (handle hList, int nKind)
; A text line of the panel that holds the file list hList.
var
	handle hPanel,
	string sText,
	int nListLeft,
	int nListRight,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom
GetWindowRect (hList, nListLeft, nListRight, nTop, nBottom)
let hPanel = GetFirstChild (GetParent (hList))
while hPanel
	if hPanel != hList
	&& IsWindowVisible (hPanel) then
		GetWindowRect (hPanel, nLeft, nRight, nTop, nBottom)
		if nLeft <= nListLeft && nRight >= nListRight then
			let sText = TcFindPanelLine (hPanel, nKind)
			if sText then
				return sText
			endIf
		endIf
	endIf
	let hPanel = GetNextWindow (hPanel)
endWhile
return cscNull
EndFunction

string function TcPanelPath (handle hList)
return TcPanelLine (hList, tcPanelLinePath)
EndFunction

string function TcPanelStatus (handle hList)
return TcPanelLine (hList, tcPanelLineStatus)
EndFunction

string function TcParentFolderName (handle hList)
; Name of the folder ".." leads to, for any path TC shows (measured 2026-11-17):
; "e:\Music\Rock\*.*" -> "Music"; "e:\Music\*.*" -> "e:";
; a top folder ("e:\*.*", "\\Dokumenti\*.*") -> This PC, where TC goes from there
; ("\\Ovaj PC\*.*"); This PC itself -> nothing.
var
	string sPath,
	string sPart,
	string sLast,
	string sPrev,
	string sThisPc,
	int nCount,
	int i
let sPath = TcPanelPath (hList)
let nCount = StringSegmentCount (sPath, "\\")
; the last segment is the file filter; empty segments come from the leading "\\"
let i = 1
while i < nCount
	let sPart = StringSegment (sPath, "\\", i)
	if sPart then
		let sPrev = sLast
		let sLast = sPart
	endIf
	let i = i + 1
endWhile
if sPrev then
	return sPrev
endIf
if !sLast then
	return cscNull
endIf
let sThisPc = TcDriveMenuName (tcDriveKeyComputer)
if sLast == sThisPc then
	return cscNull
endIf
return sThisPc
EndFunction

int function TcInsertMarkPending ()
; True shortly after Insert marked an item and moved on (TcMarkAndMove).
return giTcInsertTick
	&& GetTickCount () - giTcInsertTick < tcInsertQuietTicks
EndFunction

void function TcSayMarkedState ()
; "selected" for a marked file. JAWS's own TC setting IndicateSelected=1 made JAWS say it
; by itself, but also in menus ("selected Files"); TOTALCMD64.jcf sets 0, so the file
; list says it here (decision 2026-11-17).
; Only in the file panels, which sit directly in the main window: in lists inside dialogs,
; such as the Find Files results, the item in focus is always selected (measured 2026-11-19).
if GetWindowClass (GetParent (GetFocus ())) != wcTcMain then
	return
endIf
if GetControlAttributes () & CTRL_SELECTED then
	IndicateControlState (WT_LISTBOXITEM, CTRL_SELECTED)
endIf
EndFunction

void function TcSayListItemName ()
; Folders are not marked, as in Explorer (decision 2026-11-17): folders are listed
; first, and Insert+Up Arrow speaks the whole row including TC's <DIR> marker.
; ".." gets the name of the folder it leads to, which some voices need anyway
; since they do not speak "..".
var string sName
let gsTcLastRow = GetObjectName ()
let sName = TcListRowName (gsTcLastRow)
if sName == tcUpDir then
	let sName = sName + " " + TcParentFolderName (GetFocus ())
endIf
TcSayMarkedState ()
Say (sName, OT_LINE)
EndFunction

void function FocusChangedEventEx (handle hwndFocus, int nObject, int nChild,
	handle hwndPrevFocus, int nPrevObject, int nPrevChild,
	int nChangeDepth)
; When TC rewrites the focused row (folder size computed after Space), JAWS reports
; a focus change to the same item and would speak the whole row. Only the new size
; is spoken, and only if the row really changed since it was last spoken.
var
	string sRow,
	string sSize
if hwndFocus == hwndPrevFocus
&& nChild == nPrevChild
&& GetWindowClass (hwndFocus) == wcTcFileList
&& IsPCCursor () then
	let sRow = GetObjectName ()
	if sRow != gsTcLastRow then
		let gsTcLastRow = sRow
		let sSize = StringSegment (sRow, tcColumnDelim, 2)
		if StringContainsChars (sSize, tcDigits) then
			Say (sSize, OT_LINE)
		endIf
	endIf
	return
endIf
; Focus entering a button bar: say which bar before the button (HandleCustomWindows
; is not called for the bar window; measured 2026-11-18).
if hwndFocus != hwndPrevFocus then
	TcSayButtonBarKind (hwndFocus)
endIf
FocusChangedEventEx (hwndFocus, nObject, nChild, hwndPrevFocus, nPrevObject, nPrevChild, nChangeDepth)
EndFunction

Void Function ActiveItemChangedEvent (handle curHwnd, int curObjectId, int curChildId,
	handle prevHwnd, int prevObjectId, int prevChildId)
var
	string sItem,
	string sName
; Drive menu (Alt+F1/Alt+F2): the event comes from the open drop-down list (ComboLBox);
; items are named "[-e-]", "[-+-]" and so on.
let sItem = GetObjectName ()
if GetWindowClass (curHwnd) == wcComboList
&& StringContains (sItem, tcDriveItemStart) then
	let sName = TcDriveMenuName (StringSegment (sItem, "-", 2))
	if sName then
		Say (sName, OT_LINE)
		Say (PositionInGroup (), OT_POSITION)
		return
	endIf
endIf
if GetWindowClass (curHwnd) == wcTcFileList
&& curHwnd == GetFocus ()
&& IsPCCursor () then
	; The same item fires again when TC rewrites its row (e.g. folder size after Space);
	; skip it if the mark change was just spoken.
	if curChildId == prevChildId
	&& GetTickCount () - giTcStateSpokenTick < tcStateEchoTicks then
		return
	endIf
	; After Insert the marking result is spoken by TcSayMarkResult.
	if TcInsertMarkPending () then
		return
	endIf
	TcSayListItemName ()
	return
endIf
ActiveItemChangedEvent (curHwnd, curObjectId, curChildId, prevHwnd, prevObjectId, prevChildId)
EndFunction

void function ObjStateChangedEvent (handle hObj, optional int iObjType, int nChangedState, int nState, int nOldState)
; Marking a file (Space, Insert): speak the new state and the name,
; including when the mark is removed, which JAWS does not announce.
if hObj == GetFocus ()
&& GetWindowClass (hObj) == wcTcFileList
&& IsPCCursor () then
	; After Insert the marking result is spoken by TcSayMarkResult.
	if TcInsertMarkPending () then
		return
	endIf
	; "selected" comes from TcSayListItemName; only removal needs to be said here.
	if !(nState & CTRL_SELECTED) then
		Say (cscNotSelected, OT_ITEM_STATE)
	endIf
	TcSayListItemName ()
	let giTcStateSpokenTick = GetTickCount ()
	return
endIf
ObjStateChangedEvent (hObj, iObjType, nChangedState, nState, nOldState)
EndFunction



void function TcSayListColumn (int nColumn)
; Speaks one tab separated column of the focused file list row,
; or passes the key on to Total Commander outside the file list.
var string sValue
if !TcIsFileListFocused () then
	TypeCurrentScriptKey ()
	return
endIf
let sValue = StringTrimTrailingBlanks (StringSegment (GetObjectName (), tcColumnDelim, nColumn))
if sValue then
	SayMessage (OT_USER_REQUESTED_INFORMATION, sValue)
else
	SayMessage (OT_ERROR, msgTcNotAvailable)
endIf
EndFunction

Script TcSaySize ()
; Size of the item in focus only. The marked items' count and size are in the
; status line (Insert+Page Down) (decision 2026-11-17).
TcSayListColumn (tcColumnSize)
EndScript

Script TcSayDate ()
TcSayListColumn (tcColumnDate)
EndScript

Script SayLine ()
if TcIsFileListFocused () then
	TcSayMarkedState ()
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
if TcIsMessageDialog (hDlg)
|| GetWindowClass (hDlg) == wcTcCopyDlg then
	TcSayWindowLines (hDlg)
	return
endIf
PerformScript ReadBoxInTabOrder ()
EndScript

Script SayBottomLineOfWindow ()
; Insert+Page Down: progress summary, background job title, or in the file list
; the status line of the active panel only (JAWS would read both panels).
var
	handle hDlg,
	string sText
let hDlg = TcGetProgressDialog (GetFocus ())
if hDlg then
	let sText = TcProgressSummary (hDlg)
	if sText then
		SayMessage (OT_USER_REQUESTED_INFORMATION, sText)
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
if TcIsFileListFocused () then
	let sText = TcPanelStatus (GetFocus ())
	if sText then
		SayMessage (OT_USER_REQUESTED_INFORMATION, sText)
	else
		; e.g. search results fed to the panel have no status line; JAWS would read the
		; function key bar at the bottom of the window instead (measured 2026-11-19)
		SayMessage (OT_ERROR, msgTcNotAvailable)
	endIf
	return
endIf
PerformScript SayBottomLineOfWindow ()
EndScript

string function TcPathFilter (string sLine)
; The file filter at the end of a path line: "e:\Music\*.mp3" -> "*.mp3".
return StringSegment (sLine, "\\", -1)
EndFunction

string function TcPathWithoutFilter (string sLine)
; "e:\Music\Rock\*.*" -> "e:\Music\Rock"; a drive root keeps its backslash ("e:\").
var string sPath
let sPath = StringChopRight (sLine, StringLength (TcPathFilter (sLine)) + 1)
if !StringContains (sPath, "\\") then
	let sPath = sPath + "\\"
endIf
return sPath
EndFunction

Script TcSayPath ()
; Alt+Shift+P: path of the active panel; pressed twice, copies it to the clipboard.
var
	string sLine,
	string sPath
if !TcIsFileListFocused () then
	TypeCurrentScriptKey ()
	return
endIf
let sLine = TcPanelPath (GetFocus ())
if !sLine then
	SayMessage (OT_ERROR, msgTcNotAvailable)
	return
endIf
if StringContains (sLine, "\\") then
	let sPath = TcPathWithoutFilter (sLine)
else
	; not a folder, e.g. "Search result:": said as TC shows it
	let sPath = sLine
endIf
if IsSameScript () then
	CopyToClipboard (sPath)
	SayMessage (OT_JAWS_MESSAGE, cmsg52_S)
	return
endIf
; a filter other than "*.*" is worth hearing ("e:\Music *.mp3")
if StringContains (sLine, "\\")
&& TcPathFilter (sLine) != tcAllFilesFilter then
	let sPath = sPath + " " + TcPathFilter (sLine)
endIf
SayMessage (OT_USER_REQUESTED_INFORMATION, sPath)
EndScript

; ---------------------------------------------------------------------------
; Help, following the JAWS conventions:
; Insert+F1 help for the current place, pressed twice general help;
; Insert+H the keys added by the scripts.
; ---------------------------------------------------------------------------

string function TcKeyName (string sScript)
; Key assigned to a script, with the JAWS key named "Insert" (convention 2026-11-18).
return StringReplaceSubstrings (GetScriptKeyName (sScript), tcJawsKeyName, tcInsertKeyName)
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

void function UserBufferDeactivatedEvent ()
UserBufferDeactivatedEvent ()
if gbTcHelpShown then
	let gbTcHelpShown = false
	ScheduleFunction ("TcAfterHelpClosed", tcAfterHelpDelay)
endIf
EndFunction

Script HotKeyHelp ()
TcShowHelp (FormatString (msgTcHotKeyHelp,
	TcKeyName ("TcSaySize"),
	TcKeyName ("TcSayDate"),
	TcKeyName ("TcSayPath"),
	TcKeyName ("SayLine"),
	TcKeyName ("SayBottomLineOfWindow"),
	TcKeyName ("ReadBoxInTabOrder"),
	TcKeyName ("ScriptFileName"),
	TcKeyName ("TcSayActivePanel")))
EndScript

Script ScreenSensitiveHelp ()
if IsSameScript () then
	TcShowHelp (FormatString (msgTcAppHelp, tcScriptVersion, TcKeyName ("HotKeyHelp")))
	return
endIf
if TcIsFileListFocused () then
	TcShowHelp (FormatString (msgTcListHelp, TcKeyName ("SayLine"), TcKeyName ("HotKeyHelp")))
	return
endIf
PerformScript ScreenSensitiveHelp ()
EndScript

; ---------------------------------------------------------------------------
; List edges: a short sound when Up Arrow is pressed on the first item or
; Down Arrow on the last one (the list does not move and was silent before).
; The position comes from "1 of 18" (first and last number, no words).
; ---------------------------------------------------------------------------

int function TcListIndex ()
return StringToInt (StringSegment (PositionInGroup (), " ", 1))
EndFunction

int function TcListCount ()
return StringToInt (StringSegment (PositionInGroup (), " ", -1))
EndFunction

Script SayPriorLine ()
if TcIsFileListFocused ()
&& TcListIndex () == 1 then
	PlaySound (FindJAWSSoundFile (tcListEdgeSound))
endIf
PerformScript SayPriorLine ()
EndScript

Script SayNextLine ()
var int nCount
if TcIsFileListFocused () then
	let nCount = TcListCount ()
	if nCount > 0
	&& TcListIndex () == nCount then
		PlaySound (FindJAWSSoundFile (tcListEdgeSound))
	endIf
endIf
PerformScript SayNextLine ()
EndScript

Script TcSayActivePanel ()
; Alt+Shift+A: only the active panel as TC names it ("LEFT"/"RIGHT"); the path has
; its own key, Alt+Shift+P (decision 2026-11-18).
if !TcIsFileListFocused () then
	TypeCurrentScriptKey ()
	return
endIf
SayMessage (OT_USER_REQUESTED_INFORMATION, FormatString (msgTcActivePanel, GetObjectName (false, 1)))
EndScript

; ---------------------------------------------------------------------------
; Insert marking (decision 2026-11-18): TC marks the item and moves to the next one.
; Instead of "selected <previous item>" the scripts say how many items are now marked,
; taken from the status line, and the item landed on.
; Status line: "<size> / <total> in <files> / <all> file(s), <dirs> / <all> dir(s)";
; the part from the selected file count on is spoken, without the size and without words
; of our own: "2 / 9 file(s), 0 / 7 dir(s)".
; ---------------------------------------------------------------------------

string function TcStatusCounts (string sStatus)
var
	string sBefore,
	string sFiles
if StringSegmentCount (sStatus, "/") < 3 then
	return sStatus
endIf
let sBefore = StringTrimTrailingBlanks (StringSegment (sStatus, "/", 2))
let sFiles = StringSegment (sBefore, " ", -1)
; drop "<size> / <total> in " and keep "<files> / ..."
return sFiles + " " + StringChopLeft (sStatus, StringContains (sStatus, "/") + StringLength (StringSegment (sStatus, "/", 2)))
EndFunction

void function TcSayMarkCounts ()
; The marked count of the active panel, e.g. "12 / 12 file(s), 3 / 3 dir(s)".
var string sStatus
if !TcIsFileListFocused () then
	return
endIf
let sStatus = TcPanelStatus (GetFocus ())
if sStatus then
	Say (TcStatusCounts (sStatus), OT_ITEM_STATE)
endIf
EndFunction

void function TcSayMarkResult ()
var string sStatus
if !TcIsFileListFocused () then
	return
endIf
let sStatus = TcPanelStatus (GetFocus ())
if sStatus then
	Say (TcStatusCounts (sStatus), OT_ITEM_STATE)
endIf
TcSayListItemName ()
EndFunction

void function TcMarkAndMove ()
; Passes the key to TC, then speaks the result once TC has updated the list and status line.
TypeCurrentScriptKey ()
if !TcIsFileListFocused () then
	return
endIf
let giTcInsertTick = GetTickCount ()
ScheduleFunction ("TcSayMarkResult", tcMarkResultDelay)
EndFunction

Script TcInsertMark ()
; Profile A: Extended Insert.
TcMarkAndMove ()
EndScript

Script TcJawsKeyTwice ()
; Profile B: the JAWS key pressed twice passes Insert to TC, as JAWS's own JAWSKey script does.
if IsSameScript () then
	TcMarkAndMove ()
endIf
EndScript

Void Function KeyPressedEvent (int nKey, string strKeyName, int nIsBrailleKey, int nIsScriptKey)
; Keys that change the marks of many items without moving the focus (Ctrl+A,
; Ctrl+Num Plus/Minus, Shift+Num Star and, in profile B, the keypad keys): the keys
; are not intercepted, since passing numpad keys on from a script did not reach TC
; correctly (2026-11-18). When such a key went to TC, the marked count is spoken.
; Ctrl+A runs JAWS's own SelectAll script, which passes the key on to TC, so it counts
; even though it is a script key (measured 2026-11-18).
var string sKey
KeyPressedEvent (nKey, strKeyName, nIsBrailleKey, nIsScriptKey)
let sKey = StringLower (strKeyName)
; Quick search box: JAWS did not say what Backspace removed; the remaining text is said.
; Quick search box. TC opens it with Ctrl+Alt+letters (default) or with letters alone,
; depending on its options; the box is recognized whenever it appears.
; JAWS keeps its focus in the list; the box's text is read as the MSAA value of its edit
; field (its MSAA name is the painted label "Search:"), and the caret position is tracked
; by the scripts (measured 2026-11-18).
if TcQuickSearchBox () then
	if !gbTcQuickSearchSaid then
		; opened by the previous key, or by something the scripts did not see
		TcQuickSearchOpened ()
	endIf
	if sKey == tcEscapeKey then
		let gbTcQuickSearchSaid = false
		ScheduleFunction ("TcAfterQuickSearchClosed", tcMarkResultDelay)
		return
	endIf
	if sKey == tcEnterKey then
		let gbTcQuickSearchSaid = false
		return
	endIf
	let gsTcQuickSearchKey = sKey
	ScheduleFunction ("TcQuickSearchAfterKey", tcQuickSearchDelay)
	return
endIf
; No box: any key typed in the file list may open it, so it is checked shortly after.
let gbTcQuickSearchSaid = false
if TcIsFileListFocused () then
	ScheduleFunction ("TcQuickSearchOpened", tcMarkResultDelay)
	; Shift+F7: remembered for the new folder dialog that follows
	let gbTcOtherPanelFolder = (sKey == tcNewFolderOtherKey)
endIf
if !TcIsFileListFocused () then
	return
endIf
if nIsScriptKey
&& sKey != tcSelectAllKey then
	return
endIf
if StringContains (tcBulkMarkKeys, "|" + sKey + "|") then
	let giTcInsertTick = GetTickCount ()
	ScheduleFunction ("TcSayMarkCounts", tcMarkResultDelay)
endIf
EndFunction


void function TcAfterQuickSearchClosed ()
; JAWS never moved its focus away from the list, so closing the box was silent;
; the usual panel entry is spoken instead.
if TcIsFileListFocused ()
&& !TcQuickSearchBox () then
	HandleCustomWindows (GetFocus ())
endIf
EndFunction



string function TcQuickSearchValue ()
; Text in the quick search box: the MSAA value of its edit field.
var
	handle hEdit,
	object oEdit,
	int nChild
let hEdit = FindWindow (TcQuickSearchBox (), wcEdit)
if !hEdit then
	return cscNull
endIf
let oEdit = GetObjectFromEvent (hEdit, tcObjIdClient, 0, nChild)
if !oEdit then
	return cscNull
endIf
return oEdit.accValue (nChild)
EndFunction

void function TcQuickSearchOpened ()
; The quick search box has opened: its text and caret are taken as the starting point,
; and "Quick search" is said once per box.
if !TcQuickSearchBox () then
	return
endIf
let gsTcQuickSearchText = TcQuickSearchValue ()
let giTcQuickSearchCaret = StringLength (gsTcQuickSearchText)
if !gbTcQuickSearchSaid then
	let gbTcQuickSearchSaid = true
	Say (msgTcQuickSearch, OT_DIALOG_NAME)
endIf
EndFunction

void function TcSayQuickSearchChar (int nPos)
; The character to the right of the caret (1-based position), as in an edit field.
if nPos >= 1
&& nPos <= StringLength (gsTcQuickSearchText) then
	Say (SubString (gsTcQuickSearchText, nPos, 1), OT_CHAR)
endIf
EndFunction

void function TcQuickSearchAfterKey ()
; Runs after a key in the quick search box, once TC has updated the box.
var
	string sOld,
	string sNew,
	int nLen,
	int i
if !TcQuickSearchBox () then
	return
endIf
let sOld = gsTcQuickSearchText
let sNew = TcQuickSearchValue ()
let gsTcQuickSearchText = sNew
let nLen = StringLength (sNew)
if gsTcQuickSearchKey == tcBackspaceKey then
	; say the removed character: the first position where old and new differ
	let i = 1
	while i <= StringLength (sNew)
	&& SubString (sOld, i, 1) == SubString (sNew, i, 1)
		let i = i + 1
	endWhile
	if StringLength (sOld) > nLen then
		Say (SubString (sOld, i, 1), OT_CHAR)
		let giTcQuickSearchCaret = i - 1
	endIf
	if !nLen then
		Say (msgTcQuickSearch, OT_DIALOG_NAME)
	endIf
	return
endIf
if gsTcQuickSearchKey == tcLeftKey then
	if giTcQuickSearchCaret > 0 then
		let giTcQuickSearchCaret = giTcQuickSearchCaret - 1
	endIf
	TcSayQuickSearchChar (giTcQuickSearchCaret + 1)
	return
endIf
if gsTcQuickSearchKey == tcRightKey then
	if giTcQuickSearchCaret < nLen then
		let giTcQuickSearchCaret = giTcQuickSearchCaret + 1
	endIf
	TcSayQuickSearchChar (giTcQuickSearchCaret + 1)
	return
endIf
if gsTcQuickSearchKey == tcHomeKey then
	let giTcQuickSearchCaret = 0
	TcSayQuickSearchChar (1)
	return
endIf
if gsTcQuickSearchKey == tcEndKey then
	let giTcQuickSearchCaret = nLen
	return
endIf
; typed characters: the caret moves by the number of characters added
if nLen > StringLength (sOld) then
	let giTcQuickSearchCaret = giTcQuickSearchCaret + nLen - StringLength (sOld)
endIf
if giTcQuickSearchCaret > nLen then
	let giTcQuickSearchCaret = nLen
endIf
EndFunction
