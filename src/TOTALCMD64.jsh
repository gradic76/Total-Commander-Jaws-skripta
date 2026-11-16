; Total Commander JAWS scripts: constants and globals
; Copyright (c) 2026 author. MIT License.

const
	; Script set version, spoken by Insert+Q
	tcScriptVersion = "0.1 dev",

	; Window classes, measured on Total Commander 11.56 x64
	wcTcMain = "TTOTAL_CMD",
	wcTcOverwrite = "TOverWriteForm",
	wcButton = "Button",
	; Copy/move progress window; matched as a prefix (seen: TDLG2FILEACTIONMIN)
	wcTcProgressPrefix = "TDLG2FILEACTION",
	; Background transfer manager (queue) and background job windows are
	; standard dialogs; recognized by containing a progress bar and an edit (speed limit).
	wcDialog = "#32770",
	wcProgressBar = "msctls_progress32",
	wcEdit = "Edit",
	; Button captions JAWS does not speak at default punctuation level
	tcMinusCaption = "-",
	; Max screen lines read from the progress window
	tcProgressMaxLines = 12,

	; Delimiter used internally between lines read from the off-screen model.
	; File paths cannot contain it.
	tcLineDelim = "|"

globals
	; Last real windows checked by TcGetBackgroundDialog, so that frequent
	; events (text changes many times per second) do not search child windows again.
	handle ghTcBgYes,
	handle ghTcBgNo
