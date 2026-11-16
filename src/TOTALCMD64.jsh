; Total Commander JAWS scripts: constants and globals
; Copyright (c) 2026 author. MIT License.

const
	; Script set version, spoken by Insert+Q
	tcScriptVersion = "0.1 dev",

	; Window classes, measured on Total Commander 11.56 x64
	wcTcMain = "TTOTAL_CMD",
	wcTcOverwrite = "TOverWriteForm",
	wcButton = "Button",

	; Delimiter used internally between lines read from the off-screen model.
	; File paths cannot contain it.
	tcLineDelim = "|"
