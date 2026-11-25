; Total Commander JAWS scripts: copy/move progress window, background jobs and the queue
; Copyright (c) 2026 author. MIT License.
; Included by TOTALCMD64.jss; not compiled on its own.


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
	let sOut = FormatString (TcMsg ("msgTcProgressTotal", msgTcProgressTotal), sTotalPct)
endIf
if sFilePct then
	let sOut = sOut + ", " + FormatString (TcMsg ("msgTcProgressFile", msgTcProgressFile), sFilePct)
endIf
if sCounts then
	let sOut = sOut + ", " + sCounts
endIf
if sTime then
	let sOut = sOut + ", " + FormatString (TcMsg ("msgTcProgressLeft", msgTcProgressLeft), sTime)
endIf
return sOut
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
		SayMessage (OT_STATUS, FormatString (TcMsg ("msgTcProgressTotal", msgTcProgressTotal), sTotalPct) + ", " + sFileName)
	else
		SayMessage (OT_STATUS, FormatString (TcMsg ("msgTcProgressTotal", msgTcProgressTotal), sTotalPct))
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
