; Total Commander JAWS scripts: file panels: rows, marking and counts, path and status lines, columns, views, quick search
; Copyright (c) 2026 author. MIT License.
; Included by TOTALCMD64.jss; not compiled on its own.


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

void function TcSayHistoryName (handle hwnd)
; Alt+F8 opens the command line's drop-down list with its history; JAWS said only
; "List box". Its name is said once, before JAWS's own announcement, from whichever
; event comes first for the list (2026-11-21).
if GetTickCount () - giTcHistoryKeyTick < tcHistoryKeyTicks
&& (GetWindowClass (hwnd) == wcComboList || GetWindowClass (GetFocus ()) == wcComboList) then
	let giTcHistoryKeyTick = 0
	Say (TcMsg ("msgTcCommandHistory", msgTcCommandHistory), OT_CONTROL_NAME)
endIf
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
	Say (TcMsg ("msgTcVerticalButtonBar", msgTcVerticalButtonBar), OT_CONTROL_TYPE)
else
	Say (TcMsg ("msgTcButtonBar", msgTcButtonBar), OT_CONTROL_TYPE)
endIf
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

string function TcPathSepOf (string sLine)
; "\" for local paths, "/" for FTP paths such as "0:/pub/*.*" (measured 2026-11-24); a URL
; ("ftp://demo@host", the FTP drive line) is not a path.
if StringContains (sLine, "\\") then
	return "\\"
endIf
if StringContains (sLine, "/")
&& !StringContains (sLine, "://") then
	return "/"
endIf
return cscNull
EndFunction

int function TcIsPanelLine (string sText, int nKind)
if nKind == tcPanelLinePath then
	if TcPathSepOf (sText) then
		return StringContains (StringSegment (sText, TcPathSepOf (sText), -1), "*")
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
		; TC sometimes only paints a panel line and leaves the window text empty (the left
		; status line, 2026-11-25); the text painted in its place on the screen is used then
		if !sText
		&& !GetFirstChild (hChild) then
			let sText = TcTextInWindowRect (hChild)
		endIf
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
	string sSep,
	int nCount,
	int i
let sPath = TcPanelPath (hList)
; FTP paths ("0:/pub/*.*") use "/"; their top has no This PC above it (2026-11-24)
let sSep = TcPathSepOf (sPath)
if !sSep then
	return cscNull
endIf
let nCount = StringSegmentCount (sPath, sSep)
; the last segment is the file filter; empty segments come from the leading "\\"
let i = 1
while i < nCount
	let sPart = StringSegment (sPath, sSep, i)
	if sPart then
		let sPrev = sLast
		let sLast = sPart
	endIf
	let i = i + 1
endWhile
if sPrev then
	return sPrev
endIf
if !sLast
|| sSep == "/" then
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
; Multi-Rename Tool (Ctrl+M): its preview list is the same list class; the row holds the old
; and the new name in full, which the screen shortens. Both names are said (2026-11-22).
if GetWindowClass (GetParent (GetFocus ())) == wcTcSync then
	Say (TcSyncRowSpeech (gsTcLastRow), OT_LINE)
	return
endIf
if GetWindowClass (GetParent (GetFocus ())) == wcTcMultiRename then
	Say (StringSegment (gsTcLastRow, tcColumnDelim, 1), OT_LINE)
	Say (StringSegment (gsTcLastRow, tcColumnDelim, 2), OT_LINE)
	return
endIf
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
	SayMessage (OT_ERROR, TcMsg ("msgTcNotAvailable", msgTcNotAvailable))
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

string function TcPathFilter (string sLine)
; The file filter at the end of a path line: "e:\Music\*.mp3" -> "*.mp3" (FTP: "/").
return StringSegment (sLine, TcPathSepOf (sLine), -1)
EndFunction

string function TcPathWithoutFilter (string sLine)
; "e:\Music\Rock\*.*" -> "e:\Music\Rock"; a drive root keeps its backslash ("e:\").
var string sPath
let sPath = StringChopRight (sLine, StringLength (TcPathFilter (sLine)) + 1)
if !StringContains (sPath, TcPathSepOf (sLine)) then
	let sPath = sPath + TcPathSepOf (sLine)
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
	SayMessage (OT_ERROR, TcMsg ("msgTcNotAvailable", msgTcNotAvailable))
	return
endIf
if TcPathSepOf (sLine) then
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
if TcPathSepOf (sLine)
&& TcPathFilter (sLine) != tcAllFilesFilter then
	let sPath = sPath + " " + TcPathFilter (sLine)
endIf
SayMessage (OT_USER_REQUESTED_INFORMATION, sPath)
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

Script TcSayActivePanel ()
; Alt+Shift+A: only the active panel as TC names it ("LEFT"/"RIGHT"); the path has
; its own key, Alt+Shift+P (decision 2026-11-18).
if !TcIsFileListFocused () then
	TypeCurrentScriptKey ()
	return
endIf
SayMessage (OT_USER_REQUESTED_INFORMATION, FormatString (TcMsg ("msgTcActivePanel", msgTcActivePanel), GetObjectName (false, 1)))
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

int function TcFocusListHasMarks ()
; Whether the focused panel's status line shows marked items: "1.237 k / 483.772 k in 1 / 8
; file(s), 0 / 22 dir(s)"; the marked counts are the numbers before " / " in each part.
var
	string sCounts,
	int nCount,
	int i
let sCounts = TcStatusCounts (TcPanelStatus (GetFocus ()))
let nCount = StringSegmentCount (sCounts, ",")
let i = 1
while i <= nCount
	if StringToInt (StringSegment (StringTrimLeadingBlanks (StringSegment (sCounts, ",", i)), " ", 1)) > 0 then
		return true
	endIf
	let i = i + 1
endWhile
return false
EndFunction

void function TcSayMarksOnReturn ()
; Back in a panel from a dialog: "selected 2 / 13 file(s), 0 / 22 dir(s)", only if anything
; is marked; JAWS's own word "selected" gives the numbers their meaning (author, 2026-11-22).
if TcFocusListHasMarks () then
	Say (cmsg215_L + " " + TcStatusCounts (TcPanelStatus (GetFocus ())), OT_ITEM_STATE)
endIf
EndFunction

string function TcFirstItemName (handle hList)
; The name of the first item of a list, through MSAA (child 1 of the list's client object);
; it works also when the panel's status line is off the screen (2026-11-25).
var
	object oList,
	int nChild
let oList = GetObjectFromEvent (hList, tcObjIdClient, 0, nChild)
if !oList then
	return cscNull
endIf
return oList.accName (1)
EndFunction

string function TcPanelPosition ()
; "5 of 20" for a panel item. TC counts ".." as an item, so JAWS said 21 of 21 for 20 items
; (author, 2026-11-25). When the first item is "..", its own position is not said, and the
; others count without it. JAWS's own wording ("%1 of %2") is used. (The status line was
; tried first, but it can lie off the screen and then has no text.)
var
	int nIndex,
	int nCount
let nIndex = TcListIndex ()
let nCount = TcListCount ()
if nCount > 0
&& TcListRowName (TcFirstItemName (GetFocus ())) == tcUpDir then
	if nIndex <= 1 then
		return cscNull
	endIf
	return FormatString (cmsgPosInGroup1, IntToString (nIndex - 1), IntToString (nCount - 1))
endIf
return PositionInGroup ()
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
	return TcMsg ("msgTcViewBrief", msgTcViewBrief)
elIf sKey == "control+f2" then
	return TcMsg ("msgTcViewFull", msgTcViewFull)
elIf sKey == "shift+control+f1" then
	return TcMsg ("msgTcViewThumbnails", msgTcViewThumbnails)
elIf sKey == "shift+control+f2" then
	return TcMsg ("msgTcViewComments", msgTcViewComments)
elIf sKey == "control+f8" then
	return TcMsg ("msgTcViewTree", msgTcViewTree)
elIf sKey == "shift+control+f8" then
	return TcMsg ("msgTcViewSeparateTree", msgTcViewSeparateTree)
elIf sKey == "control+f3" then
	return TcMsg ("msgTcSortName", msgTcSortName)
elIf sKey == "control+f4" then
	return TcMsg ("msgTcSortExtension", msgTcSortExtension)
elIf sKey == "control+f5" then
	return TcMsg ("msgTcSortDate", msgTcSortDate)
elIf sKey == "control+f6" then
	return TcMsg ("msgTcSortSize", msgTcSortSize)
elIf sKey == "control+f7" then
	return TcMsg ("msgTcUnsorted", msgTcUnsorted)
elIf sKey == "control+q" then
	return TcMsg ("msgTcViewQuickView", msgTcViewQuickView)
elIf sKey == "control+t" then
	return TcMsg ("msgTcViewNewTab", msgTcViewNewTab)
elIf sKey == "control+f10" then
	return TcMsg ("msgTcViewAllFiles", msgTcViewAllFiles)
elIf sKey == "control+f11" then
	return TcMsg ("msgTcViewPrograms", msgTcViewPrograms)
endIf
return cscNull
EndFunction

void function TcSayViewMessage ()
if gsTcViewMessage then
	Say (gsTcViewMessage, OT_STATUS)
	let gsTcViewMessage = cscNull
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
	Say (TcMsg ("msgTcQuickSearch", msgTcQuickSearch), OT_DIALOG_NAME)
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
		Say (TcMsg ("msgTcQuickSearch", msgTcQuickSearch), OT_DIALOG_NAME)
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
