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

string function TcListerShortTitle (string sTitle)
; "Lister - [c:\folder\file.txt]" becomes "Lister, file.txt" (decision 2026-11-20): the folder
; is known from the panel. The word "Lister" is TC's own, so it follows TC's language.
var
	int nPos,
	string sPath
let nPos = StringContains (sTitle, tcListerTitleSep)
if !nPos then
	return sTitle
endIf
let sPath = StringChopLeft (sTitle, nPos - 1 + StringLength (tcListerTitleSep))
if StringRight (sPath, 1) == tcListerTitleEnd then
	let sPath = StringChopRight (sPath, 1)
endIf
return StringLeft (sTitle, nPos - 1) + ", " + StringSegment (sPath, tcPathSep, -1)
EndFunction

void function TcSayHistoryName (handle hwnd)
; Alt+F8 opens the command line's drop-down list with its history; JAWS said only
; "List box". Its name is said once, before JAWS's own announcement, from whichever
; event comes first for the list (2026-11-21).
if GetTickCount () - giTcHistoryKeyTick < tcHistoryKeyTicks
&& (GetWindowClass (hwnd) == wcComboList || GetWindowClass (GetFocus ()) == wcComboList) then
	let giTcHistoryKeyTick = 0
	Say (msgTcCommandHistory, OT_CONTROL_NAME)
endIf
EndFunction

int function TcIsPreviewHost (handle hwnd)
; TC's host window for Explorer Preview, recognized by its class or, failing that, its name
return GetWindowClass (hwnd) == wcTcPreviewHost
	|| GetWindowName (hwnd) == wcTcPreviewHost
EndFunction

int function IgnoreObjectAtLevel (int level)
; Focus inside Lister (Explorer Preview, media sliders): JAWS spoke the ancestors, Lister's
; long title and TC's internal "tc_preview_host_window" (2026-11-20). In Lister the
; ancestors are skipped; the short title is said by TcSayListerTitle.
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcLister then
	return true
endIf
return IgnoreObjectAtLevel (level)
EndFunction

int function TcSayListerTitle (handle hwnd)
; Lister has no child windows, so JAWS said its long title twice on opening (as window and as
; focused object) and again after mode keys (2026-11-20). The short title is said once; the
; focus handlers all route here, and repeats shortly after are silent.
if GetWindowClass (hwnd) != wcTcLister then
	return false
endIf
if gbTcListerFind then
	; back from the Find dialog (F7): the line with the match instead of the title
	let gbTcListerFind = false
	let giTcListerFindTick = GetTickCount ()
	ScheduleFunction ("TcSayListerLine", tcMarkResultDelay)
elIf GetTickCount () - giTcListerModeTick < tcListerModeQuietTicks then
	; mode keys: Explorer Preview (8) announces the window again a few seconds later
elIf GetTickCount () - giTcListerTitleTick > tcListerTitleQuietTicks then
	Say (TcListerShortTitle (GetWindowName (hwnd)), OT_WINDOW_NAME)
endIf
let giTcListerTitleTick = GetTickCount ()
return true
EndFunction

void function TcSayListerLine ()
; After a search in Lister (F7, F5, Shift+F7): JAWS said only the found text; the whole line
; with the match is said (decision 2026-11-20).
SayLine ()
EndFunction

void function TcSayListerCaret ()
; After F6 in Lister: whether the text cursor is now shown. Without it JAWS cannot follow
; the arrow keys, and TC remembers the setting (Caret= in [Lister]; found 2026-11-20).
if CaretVisible () then
	Say (msgTcListerCaret + " " + cmsg_on, OT_STATUS)
else
	Say (msgTcListerCaret + " " + cmsg_off, OT_STATUS)
endIf
EndFunction

string function TcOnOff (int bOn)
if bOn then
	return cmsg_on
endIf
return cmsg_off
EndFunction

void function TcSayListerMaximized ()
; After F11 in Lister: whether the window is now maximized (style bits, 2026-11-20).
Say (msgTcListerMaximized + " " + TcOnOff (GetWindowStyleBits (GetTopLevelWindow (GetFocus ())) & tcWsMaximize),
	OT_STATUS)
EndFunction

void function TcSayListerFullScreen ()
; After Alt+Enter in Lister: full screen mode hides the title bar (style bits, 2026-11-20).
var int nStyle
let nStyle = GetWindowStyleBits (GetTopLevelWindow (GetFocus ()))
Say (msgTcListerFullScreen + " " + TcOnOff ((nStyle & tcWsCaption) != tcWsCaption), OT_STATUS)
EndFunction

string function TcListerPercent (handle hLister)
; Position in the file as Lister shows it at the right end of its menu bar ("12 %"); the
; menu is owner-drawn, so the text is taken from the screen band at the top of the window,
; recognized by the percent sign (2026-11-20).
var
	int nLeft,
	int nRight,
	int nTop,
	int nBottom,
	string sText,
	int nCount,
	object oScroll,
	int nChild
; First the vertical scroll bar of the window through MSAA, whose value is the position in
; percent ("5"); it works also when the menu bar is covered by another window (2026-11-20).
let oScroll = GetObjectFromEvent (hLister, tcObjIdVScroll, 0, nChild)
if oScroll then
	let sText = oScroll.accValue (nChild)
	if sText then
		return sText + " " + tcPercentSign
	endIf
endIf
GetWindowRect (hLister, nLeft, nRight, nTop, nBottom)
let sText = GetTextInRect (nLeft, nTop, nRight, nTop + tcListerMenuBand, 0, IgnoreColor, IgnoreColor, false)
let nCount = StringSegmentCount (sText, tcPercentSign)
if nCount < 2 then
	return cscNull
endIf
; the number just before the last percent sign
let sText = StringTrimTrailingBlanks (StringSegment (sText, tcPercentSign, nCount - 1))
return StringSegment (sText, " ", -1) + " " + tcPercentSign
EndFunction

void function TcListerFileCheck ()
; After N or P in Lister: the file name, if another file was loaded.
var string sTitle
let sTitle = GetWindowName (GetTopLevelWindow (GetFocus ()))
if sTitle == gsTcListerTitle then
	return
endIf
if StringContains (sTitle, tcListerTitleSep) then
	Say (StringSegment (StringChopRight (sTitle, 1), tcPathSep, -1), OT_WINDOW_NAME)
else
	; media files: TC puts the track and artist in the title (Lister help)
	Say (sTitle, OT_WINDOW_NAME)
endIf
EndFunction

int function TcIsListerSlider (handle hwnd)
; The position and volume sliders of Lister's media player (measured 2026-11-20).
return GetWindowClass (hwnd) == wcTcTrackBar
	&& GetWindowClass (GetTopLevelWindow (hwnd)) == wcTcLister
EndFunction

Void Function ValueChangedEvent (handle hwnd, int objId, int childId, int nObjType, string sObjName, string sObjValue, optional int bIsFocusObject)
; Lister's media player: JAWS spoke every percent of the position while playing. Only
; changes shortly after a key are spoken (decision 2026-11-20).
if TcIsListerSlider (hwnd)
&& GetTickCount () - giTcListerKeyTick > tcMediaKeyTicks then
	return
endIf
ValueChangedEvent (hwnd, objId, childId, nObjType, sObjName, sObjValue, bIsFocusObject)
EndFunction

; The next track that the media player starts by itself is not announced: JAWS got no event
; for the title change, and the author does not need it (2026-11-20).

int function TcPassSliderKey ()
; Shift+arrows on Lister's media sliders: JAWS's text selection scripts said "selected";
; the key goes to the slider, whose new value ValueChangedEvent speaks (2026-11-20).
if TcIsListerSlider (GetFocus ()) then
	let giTcListerKeyTick = GetTickCount ()
	TypeCurrentScriptKey ()
	return true
endIf
return false
EndFunction

Script SelectNextLine ()
if !TcPassSliderKey () then
	PerformScript SelectNextLine ()
endIf
EndScript

Script SelectPriorLine ()
if !TcPassSliderKey () then
	PerformScript SelectPriorLine ()
endIf
EndScript

Script SelectNextCharacter ()
if !TcPassSliderKey () then
	PerformScript SelectNextCharacter ()
endIf
EndScript

Script SelectPriorCharacter ()
if !TcPassSliderKey () then
	PerformScript SelectPriorCharacter ()
endIf
EndScript

; Ctrl+Up and Ctrl+Down: Lister changes the volume by 10 % (Lister help) or goes to the start
; on the position slider; JAWS's own scripts on these keys made the volume jump (author,
; 2026-11-20), so on the sliders the key goes to Lister.
Script ControlUpArrow ()
if !TcPassSliderKey () then
	PerformScript ControlUpArrow ()
endIf
EndScript

Script ControlDownArrow ()
if !TcPassSliderKey () then
	PerformScript ControlDownArrow ()
endIf
EndScript

Script ControlUpArrowPCCursor ()
if !TcPassSliderKey () then
	PerformScript ControlUpArrowPCCursor ()
endIf
EndScript

Script ControlDownArrowPCCursor ()
if !TcPassSliderKey () then
	PerformScript ControlDownArrowPCCursor ()
endIf
EndScript

string function TcListerModeMessage (string sKey)
; Lister keys 1 to 8 switch the display mode (Options menu); empty for other keys.
if sKey == "1" then
	return msgTcListerText
elIf sKey == "2" then
	return msgTcListerBinary
elIf sKey == "3" then
	return msgTcListerHex
elIf sKey == "4" then
	return msgTcListerMultimedia
elIf sKey == "5" then
	return msgTcListerHtml
elIf sKey == "6" then
	return msgTcListerUnicode
elIf sKey == "7" then
	return msgTcListerUtf8
elIf sKey == "8" then
	return msgTcListerExplorer
endIf
return cscNull
EndFunction

int function HandleCustomAppWindows (handle hwnd)
; Lister (F3): JAWS said the whole title with the full path; the short title is said.
if TcSayListerTitle (hwnd) then
	return true
endIf
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
if TcSayListerTitle (hwnd) then
	return true
endIf
if TcIsPreviewHost (hwnd) then
	return true
endIf
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
|| GetWindowClass (hwnd) == wcTcComboInputDlg
|| GetWindowClass (hwnd) == wcTcCheckComboDlg then
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
; Lister search: the found text alone stays silent, the whole line follows (TcSayListerLine).
if GetWindowClass (GetTopLevelWindow (hFocus)) == wcTcLister
&& GetTickCount () - giTcListerFindTick < tcListerFindQuietTicks then
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
if TcSayListerTitle (hwnd) then
	return true
endIf
TcSayHistoryName (hwnd)
; Explorer Preview in Lister (8): JAWS said TC's internal window name
; "tc_preview_host_window" on entering and leaving it (author: silence it, 2026-11-20).
if TcIsPreviewHost (hwnd) then
	return true
endIf
; Rename in place (Shift+F6): TC puts an edit field into the file list; JAWS took another
; item's name as its label. The field is named "Rename" (author; TC has no word of its own for
; it), followed by the type and the name being edited (2026-11-21).
if GetWindowClass (hwnd) == wcEdit
&& GetWindowClass (GetParent (hwnd)) == wcTcFileList then
	IndicateControlType (WT_EDIT, msgTcRename, GetObjectValue ())
	return true
endIf
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
	; after a view key the view name was said; the panel is not announced again
	if GetTickCount () - giTcViewKeyTick < tcViewQuietTicks then
		return true
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
if nKind == tcPanelLineDrive then
	return StringLeft (sText, 1) == "["
		&& StringContains (sText, "]")
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

handle function TcOtherFileList (handle hList)
; The file list of the other panel: both lists are children of the main window
; (measured 2026-11-20).
var handle hChild
let hChild = GetFirstChild (GetParent (hList))
while hChild
	if hChild != hList
	&& IsWindowVisible (hChild)
	&& GetWindowClass (hChild) == wcTcFileList then
		return hChild
	endIf
	let hChild = GetNextWindow (hChild)
endWhile
return 0
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

int function TcIsTreeRow (string sRow)
; The folder tree (Ctrl+F8) is drawn in the same list as the files; its items are full
; paths ("C:", "C:\Program Files", "\\Desktop"), without columns. File names cannot hold
; "\" or ":", so these characters tell a tree item (measured 2026-11-21).
return !StringContains (sRow, tcColumnDelim)
	&& (StringContains (sRow, tcPathSep) || StringRight (sRow, 1) == ":")
EndFunction

int function TcTreeLevel (string sPath)
; Level from the path: "C:" 1, "C:\Program Files" 2; empty segments (the leading "\\" of
; virtual folders, a trailing "\") are not counted.
var
	int nCount,
	int i,
	int nLevel
let nCount = StringSegmentCount (sPath, tcPathSep)
let i = 1
while i <= nCount
	if StringSegment (sPath, tcPathSep, i) then
		let nLevel = nLevel + 1
	endIf
	let i = i + 1
endWhile
return nLevel
EndFunction

; Open branches of the folder tree. TC exposes no branch state, and the screen model did not
; show the indentation of the next line (2026-11-21), so the scripts remember open branches
; from what is seen and pressed: the parents of a visible item are open; an item followed
; directly by its subfolder is open; moving down to an item that is not its subfolder means
; it is closed; Right Arrow on a branch opens it, Left Arrow on an open branch closes it.
; Paths are kept in one string between separators.

string function TcTreeParent (string sPath)
var int nCount
let nCount = StringSegmentCount (sPath, tcPathSep)
if nCount < 2 then
	return cscNull
endIf
return StringChopRight (sPath, StringLength (StringSegment (sPath, tcPathSep, nCount)) + 1)
EndFunction

int function TcTreeIsOpen (string sPath)
return sPath && StringContains (gsTcTreeOpen, tcTreeSep + sPath + tcTreeSep)
EndFunction

void function TcTreeSetOpen (string sPath, int bOpen)
if !sPath then
	return
endIf
if !gsTcTreeOpen then
	let gsTcTreeOpen = tcTreeSep
endIf
let gsTcTreeOpen = StringReplaceSubstrings (gsTcTreeOpen, tcTreeSep + sPath + tcTreeSep, tcTreeSep)
if bOpen then
	let gsTcTreeOpen = gsTcTreeOpen + sPath + tcTreeSep
endIf
EndFunction

void function TcTreeLearn (string sPath, int nIndex)
; Updates the open branches from the move to sPath (list position nIndex).
var string sParent
let sParent = TcTreeParent (sPath)
while sParent
	TcTreeSetOpen (sParent, true)
	let sParent = TcTreeParent (sParent)
endWhile
if gsTcTreePrev && gsTcTreePrev != sPath then
	if TcTreeParent (sPath) == gsTcTreePrev then
		TcTreeSetOpen (gsTcTreePrev, true)
	elIf nIndex == giTcTreePrevIndex + 1 then
		; the next line is not its subfolder: the previous item is closed (or a leaf)
		TcTreeSetOpen (gsTcTreePrev, false)
	endIf
endIf
let gsTcTreePrev = sPath
let giTcTreePrevIndex = nIndex
EndFunction

int function TcHasSubfolders (string sPath)
; Through Windows (FileSystemObject); virtual folders ("\\...") are not checked.
var object oFso
if StringLeft (sPath, 2) == tcPathSep + tcPathSep then
	return false
endIf
if StringRight (sPath, 1) == ":" then
	let sPath = sPath + tcPathSep
endIf
let oFso = CreateObject (tcFsoProgId)
if !oFso then
	return false
endIf
if !oFso.FolderExists (sPath) then
	return false
endIf
return oFso.GetFolder (sPath).SubFolders.Count > 0
EndFunction

string function TcTreeItemName (string sPath)
var string sName
let sName = StringSegment (StringTrimTrailingBlanks (sPath), tcPathSep, -1)
if !sName then
	return sPath
endIf
return sName
EndFunction

void function TcTreeAfterKey ()
; After Right or Left Arrow in the tree: if the focus stayed on the item, TC opened or
; closed it, which is said; a move to another item is spoken by the focus handling.
; The list position tells whether the focus stayed: the name did not, for Right Arrow
; (2026-11-21).
var string sPath
if TcListIndex () != giTcTreeKeyIndex then
	return
endIf
let sPath = gsTcTreeKeyPath
if gbTcTreeKeyOpen then
	if TcHasSubfolders (sPath) || StringLeft (sPath, 2) == tcPathSep + tcPathSep then
		TcTreeSetOpen (sPath, true)
		Say (TcTreeItemName (sPath) + " " + cmsgControlStateOpened, OT_ITEM_STATE)
	endIf
elIf TcTreeIsOpen (sPath) then
	TcTreeSetOpen (sPath, false)
	Say (TcTreeItemName (sPath) + " " + cmsgControlStateClosed + ", "
		+ FormatString (cmsg233_L, IntToString (TcTreeLevel (sPath))), OT_ITEM_STATE)
endIf
EndFunction

string function TcTreeItemSpeech (string sPath)
; "Braille, Closed, level 3": the folder name, the branch state in JAWS's words and the
; level (decision 2026-11-21): open as remembered (TcTreeLearn), closed if the folder has
; subfolders, nothing for a leaf.
; Right Arrow on a closed branch opens it and moves to its first subfolder at once
; (measured 2026-11-21): the opening is said first, "C: opened, $Recycle.Bin, ...".
var
	string sText,
	string sOpened
if gbTcTreeKeyOpen
&& GetTickCount () - giTcTreeKeyTick < tcTreeKeyTicks
&& TcTreeParent (sPath) == gsTcTreeKeyPath
&& !TcTreeIsOpen (gsTcTreeKeyPath) then
	let sOpened = TcTreeItemName (gsTcTreeKeyPath) + " " + cmsgControlStateOpened + ", "
endIf
TcTreeLearn (sPath, TcListIndex ())
let sText = sOpened + TcTreeItemName (sPath)
if TcTreeIsOpen (sPath) then
	let sText = sText + ", " + cMsgOpen
elIf TcHasSubfolders (sPath) then
	let sText = sText + ", " + cMsgClosed
endIf
return sText + ", " + FormatString (cmsg233_L, IntToString (TcTreeLevel (sPath)))
EndFunction

void function TcSayListItemName ()
; Folders are not marked, as in Explorer (decision 2026-11-17): folders are listed
; first, and Insert+Up Arrow speaks the whole row including TC's <DIR> marker.
; ".." gets the name of the folder it leads to, which some voices need anyway
; since they do not speak "..".
var string sName
let gsTcLastRow = GetObjectName ()
if TcIsTreeRow (gsTcLastRow) then
	Say (TcTreeItemSpeech (gsTcLastRow), OT_LINE)
	return
endIf
let sName = TcListRowName (gsTcLastRow)
if sName == tcUpDir then
	let sName = sName + " " + TcParentFolderName (GetFocus ())
endIf
TcSayMarkedState ()
Say (sName, OT_LINE)
; Comments view (Ctrl+Shift+F2): the row has two columns, name and comment
; (Full view has four, Brief one; measured 2026-11-19). The comment follows the name.
if StringSegmentCount (gsTcLastRow, tcColumnDelim) == tcCommentsViewColumns then
	let sName = StringTrimTrailingBlanks (StringTrimLeadingBlanks (StringSegment (gsTcLastRow, tcColumnDelim, 2)))
	if sName then
		Say (sName, OT_LINE)
	endIf
endIf
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
TcSayHistoryName (hwndFocus)
if hwndFocus == hwndPrevFocus
&& nChild == nPrevChild
&& GetWindowClass (hwndFocus) == wcTcFileList
&& IsPCCursor () then
	let sRow = GetObjectName ()
	if sRow != gsTcLastRow then
		let gsTcLastRow = sRow
		; a view change rewrites the row too; the size is meant only for folder sizes
		if GetTickCount () - giTcViewKeyTick < tcStateEchoTicks then
			return
		endIf
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
TcSayHistoryName (curHwnd)
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
&& IsPCCursor ()
&& GetTickCount () - giTcViewKeyTick < tcViewQuietTicks then
	; the item after a view change is not said (the view name was, 2026-11-21)
	return
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
; Lister's position slider marks the played part as a selection range; JAWS said
; "selected" over and over while playing (2026-11-20).
if TcIsListerSlider (hObj) then
	return
endIf
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



handle function TcPanelHeader (handle hList)
; The column header of a file list: a plain window without text in the list's panel whose
; bottom edge touches the top of the list (the header is painted only; measured 2026-11-20).
var
	handle hPanel,
	handle hChild,
	handle hGrand,
	int nListLeft,
	int nListRight,
	int nListTop,
	int nListBottom,
	int nLeft,
	int nRight,
	int nTop,
	int nBottom
GetWindowRect (hList, nListLeft, nListRight, nListTop, nListBottom)
let hPanel = GetFirstChild (GetParent (hList))
while hPanel
	GetWindowRect (hPanel, nLeft, nRight, nTop, nBottom)
	if hPanel != hList
	&& IsWindowVisible (hPanel)
	&& nLeft <= nListLeft && nRight >= nListRight then
		let hChild = GetFirstChild (hPanel)
		while hChild
			if TcIsHeaderOf (hChild, nListTop) then
				return hChild
			endIf
			let hGrand = GetFirstChild (hChild)
			while hGrand
				if TcIsHeaderOf (hGrand, nListTop) then
					return hGrand
				endIf
				let hGrand = GetNextWindow (hGrand)
			endWhile
			let hChild = GetNextWindow (hChild)
		endWhile
	endIf
	let hPanel = GetNextWindow (hPanel)
endWhile
return 0
EndFunction

int function TcIsHeaderOf (handle hwnd, int nListTop)
var
	int nLeft,
	int nRight,
	int nTop,
	int nBottom
if !IsWindowVisible (hwnd)
|| GetWindowClass (hwnd) != wcTcPlainWindow then
	return false
endIf
GetWindowRect (hwnd, nLeft, nRight, nTop, nBottom)
return nBottom <= nListTop + tcHeaderGap
	&& nBottom >= nListTop - tcHeaderGap
EndFunction

string function TcHeaderChunks (handle hHeader)
; The painted column captions, read chunk by chunk with the Invisible cursor and joined
; by tcLineDelim.
var
	string sChunks,
	int nCol,
	int i
if !hHeader then
	return cscNull
endIf
SaveCursor ()
InvisibleCursor ()
if !MoveToWindow (hHeader) then
	RestoreCursor ()
	return cscNull
endIf
let sChunks = GetChunk ()
let i = 1
while i < tcMaxColumns
	let nCol = GetCursorCol ()
	NextChunk ()
	if GetCursorCol () <= nCol
	|| GetCurrentWindow () != hHeader then
		let i = tcMaxColumns
	else
		let sChunks = sChunks + tcLineDelim + GetChunk ()
		let i = i + 1
	endIf
endWhile
RestoreCursor ()
return sChunks
EndFunction

string function TcColumnCaption (string sHeaders, int nRowColumns, int nColumn)
; Caption of row column nColumn from the header captions (joined by tcLineDelim).
; Captions are matched from the right: the row joins name and extension in its first
; column, while the header shows them as "Name" and "Ext" (measured 2026-11-20).
; In Comments view TC keeps the Full view header above name and comment (seen on screen
; 2026-11-20), so captions are used only when header and row match (allowing "Ext").
var int nOffset
let nOffset = StringSegmentCount (sHeaders, tcLineDelim) - nRowColumns
if !sHeaders
|| nOffset < 0
|| nOffset > tcHeaderExtraColumns then
	return cscNull
endIf
if nColumn == 1 then
	return StringTrimTrailingBlanks (StringSegment (sHeaders, tcLineDelim, 1))
endIf
return StringTrimTrailingBlanks (StringSegment (sHeaders, tcLineDelim, nColumn + nOffset))
EndFunction

string function TcCaptioned (string sCaption, string sValue)
if sCaption then
	return sCaption + ": " + sValue
endIf
return sValue
EndFunction

void function TcShowRowDetails (string sRow, string sHeaders, int nColumn)
; Pressed twice: all columns of the item in the JAWS virtual viewer, one per line with its
; caption, the cursor on the line of the requested column (decision 2026-11-20).
; The viewer allows arrowing, selecting and copying; Escape returns to the panel.
var
	int nCount,
	int i
let nCount = StringSegmentCount (sRow, tcColumnDelim)
if UserBufferIsActive () then
	UserBufferDeactivate ()
endIf
UserBufferClear ()
let i = 1
while i <= nCount
	UserBufferAddText (TcCaptioned (TcColumnCaption (sHeaders, nCount, i),
		StringTrimTrailingBlanks (StringSegment (sRow, tcColumnDelim, i))))
	let i = i + 1
endWhile
; UserBufferAddText ends each call with a new line itself (2026-11-20); one blank line before the hint.
UserBufferAddText (cScBufferNewLine)
UserBufferAddText (cMsgBuffExit)
UserBufferActivate ()
let gbTcHelpShown = true
JAWSTopOfFile ()
let i = 1
while i < nColumn
	NextLine ()
	let i = i + 1
endWhile
SayLine ()
EndFunction

void function TcSayListColumn (int nColumn)
; Speaks one tab separated column of the focused file list row with its caption from the
; column header ("Size: 96.082.613"), or passes the key on outside the file list.
; The header is painted only and read from the off-screen model (decision 2026-11-20).
; Pressed twice, shows all columns in the virtual viewer (TcShowRowDetails).
var
	string sRow,
	string sValue,
	string sHeaders,
	handle hHeader
if !TcIsFileListFocused () then
	TypeCurrentScriptKey ()
	return
endIf
; JAWS is told to reload the row first (MSAARefresh): after a view change (Ctrl+Shift+F2) JAWS
; kept the old row until the focus moved (2026-11-19).
MSAARefresh (true)
let sRow = GetObjectName ()
let hHeader = TcPanelHeader (GetFocus ())
if hHeader then
	RefreshWindow (hHeader)
	let sHeaders = TcHeaderChunks (hHeader)
endIf
let sValue = StringTrimTrailingBlanks (StringSegment (sRow, tcColumnDelim, nColumn))
; A column beyond the last one of the view is not available on either press (2026-11-20).
if nColumn > StringSegmentCount (sRow, tcColumnDelim) then
	SayMessage (OT_ERROR, msgTcNotAvailable)
	return
endIf
if IsSameScript () then
	TcShowRowDetails (sRow, sHeaders, nColumn)
	return
endIf
if !sValue then
	; An existing but empty column says JAWS's own "blank" (author, 2026-11-20).
	SayMessage (OT_USER_REQUESTED_INFORMATION, cmsgBlank1)
	return
endIf
SayMessage (OT_USER_REQUESTED_INFORMATION,
	TcCaptioned (TcColumnCaption (sHeaders, StringSegmentCount (sRow, tcColumnDelim), nColumn), sValue))
EndFunction

; Alt+1 to Alt+9: column 2 to 10 of the item in focus (column 1, the name, is said on the
; arrows; decision 2026-11-19), in the order TC shows them, so they
; follow any view and any custom columns (decision 2026-11-19; replaces Alt+Shift+S/D).
; In Full view: Alt+1 size, Alt+2 date and time, Alt+3 attributes.
Script TcSayColumn1 ()
TcSayListColumn (2)
EndScript

Script TcSayColumn2 ()
TcSayListColumn (3)
EndScript

Script TcSayColumn3 ()
TcSayListColumn (4)
EndScript

Script TcSayColumn4 ()
TcSayListColumn (5)
EndScript

Script TcSayColumn5 ()
TcSayListColumn (6)
EndScript

Script TcSayColumn6 ()
TcSayListColumn (7)
EndScript

Script TcSayColumn7 ()
TcSayListColumn (8)
EndScript

Script TcSayColumn8 ()
TcSayListColumn (9)
EndScript

Script TcSayColumn9 ()
TcSayListColumn (10)
EndScript

Script SayLine ()
if TcIsFileListFocused () then
	TcSayMarkedState ()
	MSAARefresh (true)
	Say (TcListRowForSpeech (GetObjectName ()), OT_LINE)
	Say (PositionInGroup (), OT_POSITION)
	return
endIf
PerformScript SayLine ()
EndScript

string function TcStatusWord (int nPart)
; The word TC puts after the file count (nPart 1, "file(s)") or the folder count (nPart 2,
; "dir(s)") in a panel status line "0 k / 13.441 k in 0 / 21 file(s), 0 / 12 dir(s)";
; taken from TC so that it follows TC's language (2026-11-20).
; A panel without folders leaves out the folder part, so a status line with both parts is used.
var
	handle hChild,
	string sStatus
let hChild = GetFirstChild (GetAppMainWindow (GetFocus ()))
while hChild
	if GetWindowClass (hChild) == wcTcFileList
	&& IsWindowVisible (hChild) then
		let sStatus = TcPanelStatus (hChild)
		if StringSegmentCount (sStatus, ",") >= 2 then
			return StringSegment (StringTrimTrailingBlanks (StringSegment (sStatus, ",", nPart)), " ", -1)
		endIf
	endIf
	let hChild = GetNextWindow (hChild)
endWhile
return cscNull
EndFunction

string function TcSingleSpaces (string sText)
; Painted text keeps the gaps between its parts as runs of spaces.
while StringContains (sText, "  ")
	let sText = StringReplaceSubstrings (sText, "  ", " ")
endWhile
return StringTrimTrailingBlanks (StringTrimLeadingBlanks (sText))
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
; Rename in place (Shift+F6): the field is part of the main window, so JAWS read the whole
; window; the name being edited is said instead (2026-11-21).
if GetWindowClass (GetFocus ()) == wcEdit
&& GetWindowClass (GetParent (GetFocus ())) == wcTcFileList then
	SayMessage (OT_USER_REQUESTED_INFORMATION, GetObjectValue ())
	return
endIf
let hDlg = GetRealWindow (GetFocus ())
if GetWindowClass (hDlg) == wcTcCopyDlg
&& TcCopyDialogText (hDlg) then
	SayMessage (OT_USER_REQUESTED_INFORMATION, TcCopyDialogText (hDlg))
	return
endIf
if TcIsMessageDialog (hDlg)
|| GetWindowClass (hDlg) == wcTcCopyDlg
|| GetWindowClass (hDlg) == wcTcUnpackDlg then
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
; Lister: the position in percent from its menu bar (decision 2026-11-20)
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcLister then
	let sText = TcListerPercent (GetTopLevelWindow (GetFocus ()))
	if sText then
		SayMessage (OT_USER_REQUESTED_INFORMATION, sText)
	else
		SayMessage (OT_ERROR, msgTcNotAvailable)
	endIf
	return
endIf
PerformScript SayBottomLineOfWindow ()
EndScript

int function TcInLister ()
return GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcLister
EndFunction

void function TcSayListerFontSize ()
; After a font size key in Lister: the size of the text at the cursor in JAWS's own words
; ("12 points"); TC shows the size nowhere (decision 2026-11-20).
var int nPoints
let nPoints = GetCharacterPoints ()
if nPoints then
	Say (FormatString (cmsgFontPoints, IntToString (nPoints)), OT_STATUS)
endIf
EndFunction

void function TcZoomResetSoundAgain ()
; The stored size sound is played three times, for a sense of "level" (author, 2026-11-20).
PlaySound (FindJAWSSoundFile (tcZoomResetSound))
let giTcZoomResetPlays = giTcZoomResetPlays - 1
if giTcZoomResetPlays > 0 then
	ScheduleFunction ("TcZoomResetSoundAgain", tcZoomResetSoundGap)
endIf
EndFunction

Script TcListerZoomReset ()
; Ctrl+0 in Lister: back to the stored font size; JAWS gave the key no name in
; KeyPressedEvent (2026-11-20), so it has its own script.
TypeCurrentScriptKey ()
if TcInLister () then
	let giTcZoomResetPlays = tcZoomResetSoundCount
	TcZoomResetSoundAgain ()
	ScheduleFunction ("TcSayListerFontSize", tcZoomSizeDelay)
endIf
EndScript

Script ReadToBottomOfColumn ()
; Shift+Insert+Page Down in the file list: status line and free space of the other panel,
; e.g. to check the target before copying (decision 2026-11-20). JAWS's own command reads a
; table column, which the file list does not have.
var
	handle hOther,
	string sText
if !TcIsFileListFocused () then
	PerformScript ReadToBottomOfColumn ()
	return
endIf
let hOther = TcOtherFileList (GetFocus ())
if hOther then
	let sText = TcPanelStatus (hOther)
	if TcPanelLine (hOther, tcPanelLineDrive) then
		let sText = sText + ", " + TcPanelLine (hOther, tcPanelLineDrive)
	endIf
endIf
if sText then
	SayMessage (OT_USER_REQUESTED_INFORMATION, sText)
else
	SayMessage (OT_ERROR, msgTcNotAvailable)
endIf
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
	TcKeyName ("TcSayColumn1"),
	TcKeyName ("TcSayColumn9"),
	TcKeyName ("TcSayPath"),
	TcKeyName ("SayLine"),
	TcKeyName ("SayBottomLineOfWindow"),
	TcKeyName ("ReadBoxInTabOrder"),
	TcKeyName ("ScriptFileName"),
	TcKeyName ("TcSayActivePanel"),
	TcKeyName ("ReadToBottomOfColumn")))
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
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcLister then
	TcShowHelp (FormatString (msgTcListerHelp, TcKeyName ("HotKeyHelp"), TcKeyName ("SayBottomLineOfWindow")))
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

string function TcViewKeyMessage (string sKey)
; Message for TC's view and sort keys (KEYBOARD.TXT), or empty for other keys.
; JAWS names Ctrl+Shift combinations "Shift+Control+..." (measured 2026-11-19).
if sKey == "control+f1" then
	return msgTcViewBrief
elIf sKey == "control+f2" then
	return msgTcViewFull
elIf sKey == "shift+control+f1" then
	return msgTcViewThumbnails
elIf sKey == "shift+control+f2" then
	return msgTcViewComments
elIf sKey == "control+f8" then
	return msgTcViewTree
elIf sKey == "shift+control+f8" then
	return msgTcViewSeparateTree
elIf sKey == "control+f3" then
	return msgTcSortName
elIf sKey == "control+f4" then
	return msgTcSortExtension
elIf sKey == "control+f5" then
	return msgTcSortDate
elIf sKey == "control+f6" then
	return msgTcSortSize
elIf sKey == "control+f7" then
	return msgTcUnsorted
elIf sKey == "control+q" then
	return msgTcViewQuickView
elIf sKey == "control+t" then
	return msgTcViewNewTab
elIf sKey == "control+f10" then
	return msgTcViewAllFiles
elIf sKey == "control+f11" then
	return msgTcViewPrograms
endIf
return cscNull
EndFunction

void function TcSayViewMessage ()
if gsTcViewMessage then
	Say (gsTcViewMessage, OT_STATUS)
	let gsTcViewMessage = cscNull
endIf
EndFunction

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
if sKey == tcHistoryKey then
	let giTcHistoryKeyTick = GetTickCount ()
endIf
; Lister (F3): keys 1 to 8 change the display mode without any spoken change, so the mode
; is said; N and P load the next or previous file (decision 2026-11-20).
; In Explorer Preview (8) the focus is in a child window, so the top-level window is checked.
; F2 reloads the file without any change, so it gets the reread sound of the file list;
; after F7, F5 and Shift+F7 the line with the match is said.
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcLister then
	let giTcListerKeyTick = GetTickCount ()
	let gsTcViewMessage = TcListerModeMessage (sKey)
	if gsTcViewMessage then
		; the mode change makes JAWS announce the window again; that title stays silent
		let giTcListerModeTick = GetTickCount ()
		ScheduleFunction ("TcSayViewMessage", tcMarkResultDelay)
	elIf sKey == tcListerNextKey
	|| sKey == tcListerPrevKey
	|| sKey == tcListerNextFileKey
	|| sKey == tcListerPrevFileKey then
		let gsTcListerTitle = GetWindowName (GetTopLevelWindow (GetFocus ()))
		ScheduleFunction ("TcListerFileCheck", tcMarkResultDelay)
	elIf sKey == tcRereadKey then
		; the media player does not reload on F2 (author, 2026-11-20), so no sound there
		if !TcIsListerSlider (GetFocus ()) then
			PlaySound (FindJAWSSoundFile (tcRereadSound))
		endIf
	elIf sKey == tcNumPadPlusKey then
		PlaySound (FindJAWSSoundFile (tcZoomInSound))
		ScheduleFunction ("TcSayListerFontSize", tcZoomSizeDelay)
	elIf sKey == tcNumPadMinusKey then
		PlaySound (FindJAWSSoundFile (tcZoomOutSound))
		ScheduleFunction ("TcSayListerFontSize", tcZoomSizeDelay)
	elIf sKey == tcMainPlusKey then
		; Lister ignores the main keyboard "+" and "-" (measured 2026-11-20); the key went on
		; unchanged, and Num Plus or Num Minus is sent after it (idea of the author)
		TypeKey (tcNumPadPlusName)
		PlaySound (FindJAWSSoundFile (tcZoomInSound))
		ScheduleFunction ("TcSayListerFontSize", tcZoomSizeDelay)
	elIf sKey == tcMainMinusKey
	|| sKey == tcMainMinusKey2 then
		TypeKey (tcNumPadMinusName)
		PlaySound (FindJAWSSoundFile (tcZoomOutSound))
		ScheduleFunction ("TcSayListerFontSize", tcZoomSizeDelay)
	elIf sKey == tcListerCaretKey then
		; only in the text views, where the focus is Lister itself; in the media player and
		; Explorer Preview the text cursor does not apply (2026-11-20)
		if GetWindowClass (GetFocus ()) == wcTcLister then
			ScheduleFunction ("TcSayListerCaret", tcMarkResultDelay)
		endIf
	elIf sKey == tcListerMaximizeKey then
		ScheduleFunction ("TcSayListerMaximized", tcMarkResultDelay)
	elIf sKey == tcListerFullScreenKey then
		ScheduleFunction ("TcSayListerFullScreen", tcMarkResultDelay)
	elIf sKey == tcEscapeKey
	&& (GetWindowStyleBits (GetTopLevelWindow (GetFocus ())) & tcWsCaption) != tcWsCaption then
		; Escape in full screen mode leaves it instead of closing Lister (author, 2026-11-20)
		ScheduleFunction ("TcSayListerFullScreen", tcMarkResultDelay)
	elIf sKey == tcListerFindKey
	|| sKey == tcListerFindKey2 then
		let gbTcListerFind = true
	elIf sKey == tcListerFindNextKey
	|| sKey == tcListerFindNextKey2
	|| sKey == tcListerFindNextKey3
	|| sKey == tcListerFindPrevKey
	|| sKey == tcListerFindPrevKey2 then
		let giTcListerFindTick = GetTickCount ()
		ScheduleFunction ("TcSayListerLine", tcMarkResultDelay)
	endIf
	return
endIf
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
	; Folder tree: Right and Left Arrow open and close branches (TcTreeAfterKey)
	if (sKey == tcRightArrowKey || sKey == tcLeftArrowKey)
	&& TcIsTreeRow (GetObjectName ()) then
		let gsTcTreeKeyPath = GetObjectName ()
		let giTcTreeKeyIndex = TcListIndex ()
		let giTcTreeKeyTick = GetTickCount ()
		let gbTcTreeKeyOpen = false
		if sKey == tcRightArrowKey then
			let gbTcTreeKeyOpen = true
		endIf
		ScheduleFunction ("TcTreeAfterKey", tcMarkResultDelay)
	endIf
	; View and sort keys: what they do is said at once, and the panel, item and position that
	; JAWS would say after the view change stay silent for a moment (author, 2026-11-21;
	; before, the message came after them, decision 2026-11-19). Ctrl+F8 is not a switch:
	; pressed again the tree stays; another view leaves it (2026-11-21).
	let gsTcViewMessage = TcViewKeyMessage (sKey)
	if gsTcViewMessage then
		let giTcViewKeyTick = GetTickCount ()
		Say (gsTcViewMessage, OT_STATUS)
		let gsTcViewMessage = cscNull
	endIf
	if sKey == tcRereadKey
	|| sKey == tcRereadDirKey then
		PlaySound (FindJAWSSoundFile (tcRereadSound))
	endIf
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
