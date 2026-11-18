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
	; Kinds of panel text lines
	tcPanelLinePath = 1,
	tcPanelLineStatus = 2,
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
	tcSpaceKey = "space",
	tcLeftKey = "leftarrow",
	tcRightKey = "rightarrow",
	tcHomeKey = "home",
	tcEndKey = "end",
	; MSAA OBJID_CLIENT
	tcObjIdClient = -4,
	; Tenths of a second after a key in the quick search box before it is read
	tcQuickSearchDelay = 1,
	tcBulkMarkKeys = "|control+a|control+numpadplus|control+numpadminus|control+shift+numpadplus|control+shift+numpadminus|shift+numpadstar|numpadstar|numpadslash|alt+numpadplus|alt+numpadminus|",
	; Column numbers in a Full view row
	tcColumnSize = 2,
	tcColumnDate = 3,
	; After a mark change is spoken, a repeat event for the same item within this time is ignored
	tcStateEchoTicks = 1500,
	; Pack files dialog (Alt+F5); its compression ratio button caption is a single digit
	wcTcPackDlg = "TDLGZIP",
	tcDigits = "0123456789",
	; Button captions JAWS does not speak at default punctuation level
	tcMinusCaption = "-",
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
	int giTcQuickSearchCaret,
	string gsTcQuickSearchKey,
	; Set while a help text of the scripts is shown in the virtual viewer
	int gbTcHelpShown
