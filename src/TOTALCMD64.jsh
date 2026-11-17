; Total Commander JAWS scripts: constants and globals
; Copyright (c) 2026 author. MIT License.

const
	; Script set version, spoken by Insert+Q
	tcScriptVersion = "0.1 dev",

	; Window classes, measured on Total Commander 11.56 x64
	wcTcMain = "TTOTAL_CMD",
	wcTcOverwrite = "TOverWriteForm",
	; Generic message dialog (long name warning, confirmations); message text is painted
	wcTcMsgForm = "TExtMsgForm",
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
	string gsTcLastRow
