; Total Commander JAWS scripts: constants and globals
; Copyright (c) 2026 author. MIT License.

const
	; Script set version, spoken by Insert+Q
	tcScriptVersion = "0.1 dev",

	; Window classes, measured on Total Commander 11.56 x64
	wcTcMain = "TTOTAL_CMD",
	; Program name, a proper name (not translated); spoken instead of the long window title
	tcProductName = "Total Commander",
	wcTcOverwrite = "TOverWriteForm",
	; Generic message dialog (long name warning, confirmations); message text is painted
	wcTcMsgForm = "TExtMsgForm",
	; Simple question dialog, e.g. "Copy 1 file(s) to D:\\" when copying from a virtual folder
	wcTcCheckMsgBox = "TCheckMsgBox",
	; Copy/move dialog (F5/F6) from a normal folder
	wcTcCopyDlg = "TInpComboDlg",
	; Input dialog with a combo box, e.g. F7 new folder
	wcTcComboInputDlg = "TCOMBOINPUT",
	; Input dialog with a combo box and check boxes, e.g. Shift+F5 copy in the same folder
	; ("Copy "file" to" is painted; measured 2026-11-20)
	wcTcCheckComboDlg = "TCheckComboBox",
	; Unpack dialog (Alt+F6), "Unpack files"; JAWS's Insert+B read the main window (2026-11-21)
	wcTcUnpackDlg = "TDLGUNZIPALL",
	; Multi-Rename Tool (Ctrl+M); its preview list is an LCLListBox whose rows hold the old
	; name, the new name, size, date and location, tab separated (measured 2026-11-22)
	wcTcMultiRename = "TMultiRename",
	; Lister (F3): top-level window without child windows, text painted (measured 2026-11-20);
	; title "Lister - [full path]"
	wcTcLister = "TLister",
	; Lister's media player: position and volume sliders (standard trackbars, 2026-11-20),
	; and how long after a key their changes are spoken (milliseconds)
	wcTcTrackBar = "msctls_trackbar32",
	; Lister's Explorer Preview (8) host window; JAWS spoke this internal name (2026-11-20)
	wcTcPreviewHost = "tc_preview_host_window",
	tcMediaKeyTicks = 700,
	tcListerTitleSep = " - [",
	tcListerTitleEnd = "]",
	tcPathSep = "\\",
	; folder tree (Ctrl+F8): separator of the remembered open branches, the keys that open
	; and close a branch, and Windows' file system object for subfolders
	tcTreeSep = "|",
	tcRightArrowKey = "rightarrow",
	tcLeftArrowKey = "leftarrow",
	; the focus moving within this time (ms) after Right Arrow counts as its result
	tcTreeKeyTicks = 1000,
	tcFsoProgId = "Scripting.FileSystemObject",
	; Lister keys that load the next and previous file
	tcListerNextKey = "n",
	tcListerPrevKey = "p",
	; Lister title repeats within this time (milliseconds) stay silent
	tcListerTitleQuietTicks = 1500,
	; after mode keys 1 to 8: Explorer Preview announces the window again seconds later
	tcListerModeQuietTicks = 5000,
	; Lister search keys: Find (F7), Find next (F5), Find previous (Shift+F7), from the
	; Lister menu (TC 11.56), and how long the found text alone stays silent
	; (Lister help: F7 and Ctrl+F find; F3, F5 and Shift+F7 find next; Shift+F3 and Shift+F5
	; find previous)
	tcListerFindKey = "f7",
	tcListerFindKey2 = "control+f",
	tcListerFindNextKey = "f5",
	tcListerFindNextKey2 = "f3",
	tcListerFindNextKey3 = "shift+f7",
	tcListerFindPrevKey = "shift+f5",
	tcListerFindPrevKey2 = "shift+f3",
	tcListerFindQuietTicks = 1000,
	; Alt+Left and Alt+Right: previous and next file, as P and N (verified by ear 2026-11-20)
	tcListerPrevFileKey = "alt+leftarrow",
	tcListerNextFileKey = "alt+rightarrow",
	; F11 toggles the maximized window, Alt+Enter full screen mode (Lister help)
	tcListerMaximizeKey = "f11",
	tcListerFullScreenKey = "alt+enter",
	; Window style bits (winuser.h)
	tcWsMaximize = 0x01000000,
	tcWsCaption = 0x00C00000,
	; Height in pixels of the band at the top of Lister holding the title and the menu bar,
	; whose right end shows the position in percent ("12 %")
	tcListerMenuBand = 80,
	tcPercentSign = "%",
	; Lister font size: the keys Lister takes, as KeyPressedEvent and TypeKey name them, and
	; the sounds for larger, smaller and the stored size (first picks, to be judged by ear)
	tcNumPadPlusKey = "numpadplus",
	tcNumPadMinusKey = "numpadminus",
	tcNumPadPlusName = "NumPadPlus",
	tcNumPadMinusName = "NumPadMinus",
	; main keyboard "+" and "-": JAWS names keys by the US layout, so the Croatian "+" is "="
	; and the Croatian "-" is "/"; "-" is the US minus (measured 2026-11-20)
	tcMainPlusKey = "=",
	tcMainMinusKey = "/",
	tcMainMinusKey2 = "-",
	tcZoomInSound = "PianoUp1-C-D.wav",
	tcZoomOutSound = "PianoDown1-D-C.wav",
	tcZoomResetSound = "Piano1-C.wav",
	; the stored size sound is played three times, tenths of a second apart (author, 2026-11-20)
	tcZoomResetSoundCount = 3,
	tcZoomResetSoundGap = 2,
	; tenths of a second before the new font size is read from the screen
	tcZoomSizeDelay = 5,
	; MSAA object id of a window's vertical scroll bar (OBJID_VSCROLL)
	tcObjIdVScroll = -5,
	; F6 toggles the text cursor; without it the arrow keys scroll silently (2026-11-20)
	tcListerCaretKey = "f6",
	; Find Files dialog (Alt+F7)
	wcTcFindDlg = "TFindFile",
	; Quick search box (Ctrl+Alt+letters)
	wcTcQuickSearch = "TQUICKSEARCH",
	tcMsgMaxLines = 20,
	wcButton = "Button",
	; Copy/move progress window; matched as a prefix (seen: TDLG2FILEACTIONMIN)
	wcTcProgressPrefix = "TDLG2FILEACTION",
	; Background transfer manager (queue) and background job windows are
	; standard dialogs; recognized by containing a progress bar and an edit (speed limit).
	wcDialog = "#32770",
	wcProgressBar = "msctls_progress32",
	wcEdit = "Edit",
	; File panels. In Full view a row is tab separated:
	; "<name>\t<size or DIR>\t<date time>\t<attributes>" (measured 2026-11-17).
	wcTcFileList = "LCLListBox",
	; Parent folder item at the top of a file list
	tcUpDir = "..",
	; Filter shown in the path line when all files are listed
	tcAllFilesFilter = "*.*",
	; Button bars are plain windows directly under the main window
	wcTcPlainWindow = "Window",
	; Combo box class of TC (drive box, command line)
	wcTcDriveBoxClass = "LCLComboBox",
	; combo boxes in dialogs (same class), e.g. target and filter in the F5 dialog
	wcTcComboBox = "LCLComboBox",
	; Kinds of panel text lines
	tcPanelLinePath = 1,
	tcPanelLineStatus = 2,
	; drive line above the list: "[label]  44.808.184 k of 208.804.860 k free"
	tcPanelLineDrive = 3,
	; Drop-down list of the drive box (Alt+F1/Alt+F2); its items read "[-e-]"
	wcComboList = "ComboLBox",
	tcDriveItemStart = "[-",
	tcDriveLetters = "abcdefghijklmnopqrstuvwxyz",
	; TC's special drive menu items and the Windows shell folders they open
	tcDriveKeyComputer = "+",
	tcDriveKeyDocuments = "*",
	tcDriveKeyNetwork = "\\",
	ssfDrives = 17,
	ssfPersonal = 5,
	ssfNetwork = 18,
	tcColumnDelim = "\t",
	; Help texts name the JAWS key "Insert" (convention 2026-11-18); key names in .jkm use "JAWSKey"
	tcJawsKeyName = "JAWSKey",
	tcInsertKeyName = "Insert",
	; Tenths of a second after the help viewer closes before the short panel entry is spoken
	tcAfterHelpDelay = 2,
	; JAWS sound played at the first and last item of a file list (JAWS sound, not the
	; Windows default beep, so it comes with the speech; decision 2026-11-18)
	tcListEdgeSound = "TouchKeyboardChildPanelBoundary.wav",
	; Insert marking: tenths of a second before the result is spoken, and how long the
	; list events stay quiet after Insert (milliseconds)
	tcMarkResultDelay = 3,
	tcInsertQuietTicks = 800,
	; Keys that mark or unmark many items at once, lower case, as KeyPressedEvent names them
	tcSelectAllKey = "control+a",
	tcBackspaceKey = "backspace",
	tcEscapeKey = "escape",
	tcEnterKey = "enter",
	; Shift+F7: new folder in the other panel
	tcNewFolderOtherKey = "shift+f7",
	; Alt+F8: command line history; the list opening within this time (ms) gets the name
	tcHistoryKey = "alt+f8",
	tcHistoryKeyTicks = 1500,
	; F2 and Ctrl+R reread the panel without any visible change, so a JAWS sound confirms
	; the key (author, 2026-11-20); sound chosen by the author by ear
	tcRereadKey = "f2",
	tcRereadDirKey = "control+r",
	tcRereadSound = "descend.wav",
	tcSpaceKey = "space",
	tcLeftKey = "leftarrow",
	tcRightKey = "rightarrow",
	tcHomeKey = "home",
	tcEndKey = "end",
	; MSAA OBJID_CLIENT
	tcObjIdClient = -4,
	; Tenths of a second after a key in the quick search box before it is read
	tcQuickSearchDelay = 1,
	tcBulkMarkKeys = "|control+a|control+numpadplus|control+numpadminus|shift+control+numpadplus|shift+control+numpadminus|shift+numpadstar|numpadstar|numpadslash|alt+numpadplus|alt+numpadminus|",
	; Comments view rows have two columns: name and comment
	tcCommentsViewColumns = 2,
	; Column header: allowed gap in pixels between header and list, and most captions read
	tcHeaderGap = 3,
	tcMaxColumns = 15,
	; Header captions without a column in the row (TC shows "Ext" apart, the row joins it to the name)
	tcHeaderExtraColumns = 1,
	; After a mark change is spoken, a repeat event for the same item within this time is ignored
	tcStateEchoTicks = 1500,
	; after a view or sort key, how long the panel and item announcements stay silent (ms)
	tcViewQuietTicks = 1500,
	; Pack files dialog (Alt+F5); its compression ratio button caption is a single digit
	wcTcPackDlg = "TDLGZIP",
	tcDigits = "0123456789",
	; Button captions JAWS does not speak at default punctuation level
	tcMinusCaption = "-",
	; Find Files: the folder browse button caption
	tcBrowseCaption = ">>",
	; Progress window: automatic announcement every N percent of the total,
	; checked at most once per this many milliseconds
	tcProgressAnnounceStep = 10,
	tcProgressCheckTicks = 1000,
	; minimum time between two announcements (an announcement takes 3 to 4 s to speak)
	tcProgressMinGapTicks = 6000,
	; Max screen lines read from the progress window
	tcProgressMaxLines = 12,

	; Delimiter used internally between lines read from the off-screen model.
	; File paths cannot contain it.
	tcLineDelim = "|"

globals
	; Last real windows checked by TcGetBackgroundDialog, so that frequent
	; events (text changes many times per second) do not search child windows again.
	handle ghTcBgYes,
	handle ghTcBgNo,
	; Progress window announcement state
	handle ghTcProgressDlg,
	int giTcProgressStep,
	int giTcProgressTimer,
	int giTcProgressSpokenTick,
	; File list: time the last mark change was spoken
	int giTcStateSpokenTick,
	; File list: row text when the focused item was last spoken
	string gsTcLastRow,
	; Time of the last Insert marking (TcMarkAndMove)
	int giTcInsertTick,
	; Speak the marked count when focus returns to the file list (after a selection dialog)
	int gbTcCountOnReturn,
	; Quick search box: text typed so far, and whether "Quick search" was said
	string gsTcQuickSearchText,
	int gbTcQuickSearchSaid,
	; Set by Shift+F7 until the new folder dialog opens
	int gbTcOtherPanelFolder,
	; Message for the last view or sort key, spoken shortly after
	string gsTcViewMessage,
	; Lister title before N or P, to tell whether another file was loaded
	string gsTcListerTitle,
	int giTcListerTitleTick,
	int giTcListerModeTick,
	int giTcListerFindTick,
	int gbTcListerFind,
	int giTcZoomResetPlays,
	; time of the last key pressed in Lister
	int giTcListerKeyTick,
	; time of the last Alt+F8
	int giTcHistoryKeyTick,
	; folder tree: remembered open branches, the previous item and its list position, and
	; the item and direction of the last Right or Left Arrow
	string gsTcTreeOpen,
	string gsTcTreePrev,
	int giTcTreePrevIndex,
	string gsTcTreeKeyPath,
	int giTcTreeKeyIndex,
	int giTcTreeKeyTick,
	int gbTcTreeKeyOpen,
	; Time of the last view or sort key (the row rewrite it causes is not a folder size)
	int giTcViewKeyTick,
	int giTcQuickSearchCaret,
	string gsTcQuickSearchKey,
	; Set while a help text of the scripts is shown in the virtual viewer
	int gbTcHelpShown
