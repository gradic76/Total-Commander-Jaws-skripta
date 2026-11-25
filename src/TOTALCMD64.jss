; Total Commander JAWS scripts
; Copyright (c) 2026 author. MIT License.

include "HJConst.jsh"
include "HJGlobal.jsh"
include "common.jsm"
include "TOTALCMD64.jsh"
include "TOTALCMD64.jsm"
; Parts of the scripts, in an order where every function is defined before it is used
include "TOTALCMD64_common.jss"
include "TOTALCMD64_settings.jss"
include "TOTALCMD64_progress.jss"
include "TOTALCMD64_tree.jss"
include "TOTALCMD64_sync.jss"
include "TOTALCMD64_compare.jss"
include "TOTALCMD64_lister.jss"
include "TOTALCMD64_panels.jss"
include "TOTALCMD64_dialogs.jss"
include "TOTALCMD64_help.jss"


int function IgnoreObjectAtLevel (int level)
; Focus inside Lister (Explorer Preview, media sliders): JAWS spoke the ancestors, Lister's
; long title and TC's internal "tc_preview_host_window" (2026-11-20). In Lister the
; ancestors are skipped; the short title is said by TcSayListerTitle.
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcLister then
	return true
endIf
return IgnoreObjectAtLevel (level)
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

int function HandleCustomAppWindows (handle hwnd)
; Lister (F3): JAWS said the whole title with the full path; the short title is said.
if TcSayListerTitle (hwnd) then
	return true
endIf
; Other TC windows of their own (Multi-Rename): the marked count is checked on the way back
if GetWindowClass (hwnd) != wcTcMain then
	let gbTcCountOnReturn = true
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
; any TC window other than the main one: the marked count is checked on the way back
; (not the quick search box, which belongs to moving in the list)
if GetWindowClass (hwnd) != wcTcMain
&& GetWindowClass (hwnd) != wcTcQuickSearch then
	let gbTcCountOnReturn = true
endIf
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
	Say (TcMsg ("msgTcQuickSearch", msgTcQuickSearch), OT_DIALOG_NAME)
	return true
endIf
; Back in the main window after a dialog: the same long title, as in HandleCustomAppWindows.
if GetWindowClass (hwnd) == wcTcMain
&& StringContains (GetWindowName (hwnd), tcProductName) then
	Say (tcProductName, OT_WINDOW_NAME)
	return true
endIf
; TC's own dialogs (general rule, decision 2026-11-24): JAWS announced them with the type of
; the focused control in front of the title ("Combo box Total Commander", "List box Spoji se
; na FTP poslužitelj", "Combo box ftp"; F5, F7, Shift+F5, Multi-Rename, FTP...). Only the
; title is said, then JAWS says the focused control with its own label. A title other than
; the program name is TC's own and says what the dialog does, so it is spoken. Left to JAWS:
; standard Windows dialogs (#32770), the progress window, and the windows handled above.
if GetWindowClass (hwnd) != wcDialog
&& GetWindowClass (hwnd) != wcTcMain
&& GetWindowClass (hwnd) != wcTcLister
&& !TcGetProgressDialog (hwnd) then
	if GetWindowName (hwnd)
	&& GetWindowName (hwnd) != tcProductName then
		Say (GetWindowName (hwnd), OT_DIALOG_NAME)
		let gbTcCountOnReturn = true
	endIf
	; Shift+F7 makes the new folder in the other panel; the dialog looks the same as F7
	; (decision 2026-11-19).
	if gbTcOtherPanelFolder then
		let gbTcOtherPanelFolder = false
		Say (TcMsg ("msgTcInOtherPanel", msgTcInOtherPanel), OT_DIALOG_NAME)
	endIf
	return true
endIf
return HandleCustomRealWindows (hwnd)
EndFunction

int function NewTextEventShouldBeSilent (handle hFocus, handle hwnd, string buffer, int nAttributes,
	int nTextColor, int nBackgroundColor, int nEcho, string sFrameName)
if hwnd != hFocus
&& TcGetBackgroundDialog (hwnd) then
	return true
endIf
; Compare by content: after a button key TC repaints the pane lines in pieces, which JAWS
; read without the red differing words; the whole lines are said by TcCompareCheck
; (2026-11-23).
if GetWindowClass (GetTopLevelWindow (hwnd)) == wcTcCompare
&& TcCmpIsPane (hwnd)
&& (GetTickCount () - giTcCmpKeyTick < tcCmpQuietTicks || TcCmpIsPane (hFocus)) then
	; also while the focus is in a pane (Editing): each typed key repainted the line in
	; pieces; typing echo and the arrow keys are JAWS's own (2026-11-23)
	return true
endIf
; Multi-Rename: leaving the preview list (Tab to Rename) repaints its row, which JAWS read
; out in full; the list is read on the arrow keys (2026-11-22).
if hwnd != hFocus
&& GetWindowClass (hwnd) == wcTcFileList
&& GetWindowClass (GetParent (hwnd)) == wcTcMultiRename then
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

int function HandleCustomWindows (handle hwnd)
var string sName
if TcSayListerTitle (hwnd) then
	return true
endIf
; Compare by content: on entering the window, which file is left and which right; the
; path fields are named "Left file" and "Right file" (JAWS gave the left none and the right
; the ">>" of the button beside it; 2026-11-23).
if GetWindowClass (GetTopLevelWindow (hwnd)) == wcTcCompare then
	if ghTcCmpForm != GetTopLevelWindow (hwnd) then
		TcCmpSnapshot (GetTopLevelWindow (hwnd))
		Say (TcCmpFiles (GetTopLevelWindow (hwnd)), OT_DIALOG_TEXT)
	endIf
	; the two picture buttons open TC's search ("Potraži"; author, 2026-11-23)
	if GetWindowClass (hwnd) == wcButton
	&& !GetWindowName (hwnd)
	&& !GetObjectName () then
		IndicateControlType (WT_BUTTON, TcMsg ("msgTcCmpSearch", msgTcCmpSearch))
		return true
	endIf
	if hwnd == TcCmpPathEdit (GetTopLevelWindow (hwnd), false) then
		IndicateControlType (WT_EDIT, TcMsg ("msgTcCmpLeftFile", msgTcCmpLeftFile), GetObjectValue ())
		return true
	elIf hwnd == TcCmpPathEdit (GetTopLevelWindow (hwnd), true) then
		IndicateControlType (WT_EDIT, TcMsg ("msgTcCmpRightFile", msgTcCmpRightFile), GetObjectValue ())
		return true
	endIf
endIf
; Focus in any TC window other than the main one: the marked count is checked on the way
; back. Multi-Rename came through neither the app nor the real window handling (probe
; 2026-11-22), so the focused control is where it is noticed.
if GetRealWindow (hwnd)
&& GetWindowClass (GetRealWindow (hwnd)) != wcTcMain
&& GetWindowClass (GetRealWindow (hwnd)) != wcTcQuickSearch then
	let gbTcCountOnReturn = true
endIf
TcSayHistoryName (hwnd)
; Explorer Preview in Lister (8): JAWS said TC's internal window name
; "tc_preview_host_window" on entering and leaving it (author: silence it, 2026-11-20).
if TcIsPreviewHost (hwnd) then
	return true
endIf
; Multi-Rename (Ctrl+M): the mask field had no name once the window announcement was taken
; over (2026-11-22); its label is the caption of the group box around it ("Maska za
; preimenovanje: Ime"). Fields JAWS names itself are left alone.
if GetWindowClass (hwnd) == wcEdit
&& GetWindowClass (GetRealWindow (hwnd)) == wcTcMultiRename
&& !GetObjectName ()
&& TcGroupOf (hwnd, GetRealWindow (hwnd)) then
	IndicateControlType (WT_EDIT,
		StringReplaceSubstrings (GetWindowName (TcGroupOf (hwnd, GetRealWindow (hwnd))), "&", cscNull),
		GetObjectValue ())
	return true
endIf
; Synchronize dirs, start dialog ("Uskladi"): a target folder field under each copy
; direction check box, without a label (2026-11-23).
if GetWindowClass (hwnd) == wcEdit
&& GetWindowClass (GetRealWindow (hwnd)) == wcTcSyncStart then
	IndicateControlType (WT_EDIT, TcMsg ("msgTcSyncTarget", msgTcSyncTarget), GetObjectValue ())
	return true
endIf
; Synchronize dirs: the picture button opens the saved comparisons menu, "1x" the file filter
; (author checked, 2026-11-23); the "1x" button is the one beside the file mask combo box.
if GetWindowClass (hwnd) == wcButton
&& GetWindowClass (GetTopLevelWindow (hwnd)) == wcTcSync then
	if !GetWindowName (hwnd) && !GetObjectName () then
		IndicateControlType (WT_BUTTON, TcMsg ("msgTcSyncSaved", msgTcSyncSaved))
		return true
	elIf GetWindowName (hwnd) == tcSyncFilterCaption then
		IndicateControlType (WT_BUTTON, TcMsg ("msgTcSyncFilter", msgTcSyncFilter))
		return true
	endIf
endIf
; Synchronize dirs: JAWS named the right folder field "1x" and the file mask ">>" after the
; buttons beside them, and the left folder field not at all (2026-11-23). The mask is the
; field inside the combo box; the folder fields are told apart by position.
if GetWindowClass (hwnd) == wcEdit
&& GetWindowClass (GetTopLevelWindow (hwnd)) == wcTcSync then
	if GetWindowClass (GetParent (hwnd)) == wcTcComboBox then
		IndicateControlType (WT_EDIT, TcMsg ("msgTcSyncMask", msgTcSyncMask), GetObjectValue ())
	elIf TcIsLeftOfSiblingEdit (hwnd) then
		IndicateControlType (WT_EDIT, TcMsg ("msgTcSyncLeftFolder", msgTcSyncLeftFolder), GetObjectValue ())
	else
		IndicateControlType (WT_EDIT, TcMsg ("msgTcSyncRightFolder", msgTcSyncRightFolder), GetObjectValue ())
	endIf
	return true
endIf
; Multi-Rename: the only button without text is the picture button with the names menu
; (load from file, edit, configure editor; author checked, 2026-11-22).
if GetWindowClass (hwnd) == wcButton
&& GetWindowClass (GetRealWindow (hwnd)) == wcTcMultiRename
&& !GetWindowName (hwnd)
&& !GetObjectName () then
	IndicateControlType (WT_BUTTON, TcMsg ("msgTcMrtNamesButton", msgTcMrtNamesButton))
	return true
endIf
; A field inside a combo box in a TC dialog without a name of its own (general rule,
; 2026-11-24): Shift+F5's "Kopiraj "ime" u" is painted just above the combo box, and JAWS
; found it with the English TC but not with the Croatian one. The painted line right above
; the combo box is used as the label.
if GetWindowClass (hwnd) == wcEdit
&& GetWindowClass (GetParent (hwnd)) == wcTcComboBox
&& GetWindowClass (GetRealWindow (hwnd)) != wcTcMain
&& !GetObjectName ()
&& TcLabelAbove (GetParent (hwnd)) then
	IndicateControlType (WT_EDIT, TcLabelAbove (GetParent (hwnd)), GetObjectValue ())
	return true
endIf
; Rename in place (Shift+F6): TC puts an edit field into the file list; JAWS took another
; item's name as its label. The field is named "Rename" (author; TC has no word of its own for
; it), followed by the type and the name being edited (2026-11-21).
if GetWindowClass (hwnd) == wcEdit
&& GetWindowClass (GetParent (hwnd)) == wcTcFileList then
	IndicateControlType (WT_EDIT, TcMsg ("msgTcRename", msgTcRename), GetObjectValue ())
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
	IndicateControlType (WT_EDIT, TcMsg ("msgTcCommandLine", msgTcCommandLine), GetObjectValue ())
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
		IndicateControlType (WT_BUTTON, TcMsg ("msgTcMinus", msgTcMinus))
		return true
	endIf
	; ">>" next to a path field opens a folder or file browser in every TC dialog met so far
	; (Find Files, compare by content, synchronize dirs, FTP connection; 2026-11-19 to
	; 2026-11-24); JAWS did not speak the caption. General rule (decision 2026-11-24).
	if GetWindowName (hwnd) == tcBrowseCaption then
		IndicateControlType (WT_BUTTON, TcMsg ("msgTcBrowse", msgTcBrowse))
		return true
	endIf
	; Pack dialog: the compression ratio button shows only the digit; its label is painted.
	if GetWindowClass (GetParent (hwnd)) == wcTcPackDlg
	&& StringLength (sName) == 1
	&& StringContains (tcDigits, sName) then
		IndicateControlType (WT_BUTTON, FormatString (TcMsg ("msgTcCompressionRatio", msgTcCompressionRatio), sName))
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
	; after a view key the view name was said; the panel is not announced again
	if GetTickCount () - giTcViewKeyTick < tcViewQuietTicks then
		return true
	endIf
	let sPanel = GetObjectName (false, 1)
	if sPanel then
		Say (sPanel, OT_CONTROL_NAME)
	endIf
	TcSayListItemName ()
	Say (TcPanelPosition (), OT_POSITION)
	; Back from any TC dialog or window: if items are still marked, their count follows, so
	; that marks left over are not missed (author, 2026-11-22).
	; Only the panels of the main window: lists in other TC windows (Multi-Rename preview)
	; are the same class and used up the flag (2026-11-22).
	if gbTcCountOnReturn
	&& GetWindowClass (GetParent (hwnd)) == wcTcMain then
		let gbTcCountOnReturn = false
		TcSayMarksOnReturn ()
	endIf
	return true
endIf
return HandleCustomWindows (hwnd)
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

Script SayLine ()
if TcIsFileListFocused () then
	TcSayMarkedState ()
	MSAARefresh (true)
	Say (TcListRowForSpeech (GetObjectName ()), OT_LINE)
	Say (TcPanelPosition (), OT_POSITION)
	return
endIf
PerformScript SayLine ()
EndScript

Script ReadBoxInTabOrder ()
var handle hDlg
; Compare by content: the two files, left and right, and TC's status line (2026-11-23)
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcCompare then
	SayMessage (OT_USER_REQUESTED_INFORMATION, TcCmpFiles (GetTopLevelWindow (GetFocus ())))
	SayMessage (OT_USER_REQUESTED_INFORMATION, TcCmpStatus (GetTopLevelWindow (GetFocus ())))
	return
endIf
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
; Any other TC dialog of its own (not a standard Windows dialog): JAWS's Insert+B read the
; main window instead, e.g. Change attributes and Unpack (2026-11-22). The dialog's lines are
; read; standard dialogs (#32770, e.g. background jobs) are left to JAWS.
if hDlg
&& GetWindowClass (hDlg) != wcDialog
&& GetWindowClass (hDlg) != wcTcMain
&& GetWindowClass (hDlg) != wcTcLister then
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
		SayMessage (OT_ERROR, TcMsg ("msgTcProgressUnknown", msgTcProgressUnknown))
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
		SayMessage (OT_ERROR, TcMsg ("msgTcNotAvailable", msgTcNotAvailable))
	endIf
	return
endIf
; Lister: the position in percent from its menu bar (decision 2026-11-20)
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcLister then
	let sText = TcListerPercent (GetTopLevelWindow (GetFocus ()))
	if sText then
		SayMessage (OT_USER_REQUESTED_INFORMATION, sText)
	else
		SayMessage (OT_ERROR, TcMsg ("msgTcNotAvailable", msgTcNotAvailable))
	endIf
	return
endIf
PerformScript SayBottomLineOfWindow ()
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
	SayMessage (OT_ERROR, TcMsg ("msgTcNotAvailable", msgTcNotAvailable))
endIf
EndScript

void function UserBufferDeactivatedEvent ()
UserBufferDeactivatedEvent ()
if gbTcHelpShown then
	let gbTcHelpShown = false
	ScheduleFunction ("TcAfterHelpClosed", tcAfterHelpDelay)
endIf
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
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcSync
&& TcSyncShowMessage (sKey) then
	let gsTcSyncShow = TcSyncShowMessage (sKey)
	ScheduleFunction ("TcSaySyncShow", tcCompareDelay)
endIf
; Compare by content: what a key changed is checked shortly after (TcCompareCheck)
if GetWindowClass (GetTopLevelWindow (GetFocus ())) == wcTcCompare then
	if ghTcCmpForm != GetTopLevelWindow (GetFocus ()) then
		TcCmpSnapshot (GetTopLevelWindow (GetFocus ()))
	endIf
	; Alt+letter, Enter and Space press a button; other keys only move the focus. Alt+S came
	; as two key events, so only TcCompareCheck clears the flag (2026-11-23).
	; Space and Enter press a button only when a button has the focus; in a pane they type
	if StringLeft (sKey, 4) == "alt+"
	|| ((sKey == tcEnterKey || sKey == tcSpaceKey) && !TcCmpIsPane (GetFocus ())) then
		let gbTcCmpForce = true
		let giTcCmpKeyTick = GetTickCount ()
	endIf
	ScheduleFunction ("TcCompareCheck", tcCompareDelay)
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
