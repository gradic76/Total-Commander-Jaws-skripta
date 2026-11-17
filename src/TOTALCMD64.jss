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
	return StringContains (sText, "\\")
		&& StringContains (StringSegment (sText, "\\", -1), "*")
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

void function TcSayMarkedState ()
; "selected" for a marked file. JAWS's own TC setting IndicateSelected=1 made JAWS say it
; by itself, but also in menus ("selected Files"); TOTALCMD64.jcf sets the default 2,
; so the file list says it here (decision 2026-11-17).
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
	; "selected" is prefixed by JAWS itself; only removal needs to be said.
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
if TcIsMessageDialog (hDlg) then
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
		return
	endIf
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
let sPath = TcPathWithoutFilter (sLine)
if IsSameScript () then
	CopyToClipboard (sPath)
	SayMessage (OT_JAWS_MESSAGE, cmsg52_S)
	return
endIf
; a filter other than "*.*" is worth hearing ("e:\Music *.mp3")
if TcPathFilter (sLine) != tcAllFilesFilter then
	let sPath = sPath + " " + TcPathFilter (sLine)
endIf
SayMessage (OT_USER_REQUESTED_INFORMATION, sPath)
EndScript
