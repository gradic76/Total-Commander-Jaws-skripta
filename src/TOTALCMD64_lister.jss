; Total Commander JAWS scripts: Lister (F3): title, display modes, search, text cursor, font size, percent, media player
; Copyright (c) 2026 author. MIT License.
; Included by TOTALCMD64.jss; not compiled on its own.


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

int function TcIsPreviewHost (handle hwnd)
; TC's host window for Explorer Preview, recognized by its class or, failing that, its name
return GetWindowClass (hwnd) == wcTcPreviewHost
	|| GetWindowName (hwnd) == wcTcPreviewHost
EndFunction

int function TcSayListerTitle (handle hwnd)
; Lister has no child windows, so JAWS said its long title twice on opening (as window and as
; focused object) and again after mode keys (2026-11-20). The short title is said once; the
; focus handlers all route here, and repeats shortly after are silent.
if GetWindowClass (hwnd) != wcTcLister then
	return false
endIf
let gbTcCountOnReturn = true
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
	Say (TcMsg ("msgTcListerCaret", msgTcListerCaret) + " " + cmsg_on, OT_STATUS)
else
	Say (TcMsg ("msgTcListerCaret", msgTcListerCaret) + " " + cmsg_off, OT_STATUS)
endIf
EndFunction

void function TcSayListerMaximized ()
; After F11 in Lister: whether the window is now maximized (style bits, 2026-11-20).
Say (TcMsg ("msgTcListerMaximized", msgTcListerMaximized) + " " + TcOnOff (GetWindowStyleBits (GetTopLevelWindow (GetFocus ())) & tcWsMaximize),
	OT_STATUS)
EndFunction

void function TcSayListerFullScreen ()
; After Alt+Enter in Lister: full screen mode hides the title bar (style bits, 2026-11-20).
var int nStyle
let nStyle = GetWindowStyleBits (GetTopLevelWindow (GetFocus ()))
Say (TcMsg ("msgTcListerFullScreen", msgTcListerFullScreen) + " " + TcOnOff ((nStyle & tcWsCaption) != tcWsCaption), OT_STATUS)
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
	return TcMsg ("msgTcListerText", msgTcListerText)
elIf sKey == "2" then
	return TcMsg ("msgTcListerBinary", msgTcListerBinary)
elIf sKey == "3" then
	return TcMsg ("msgTcListerHex", msgTcListerHex)
elIf sKey == "4" then
	return TcMsg ("msgTcListerMultimedia", msgTcListerMultimedia)
elIf sKey == "5" then
	return TcMsg ("msgTcListerHtml", msgTcListerHtml)
elIf sKey == "6" then
	return TcMsg ("msgTcListerUnicode", msgTcListerUnicode)
elIf sKey == "7" then
	return TcMsg ("msgTcListerUtf8", msgTcListerUtf8)
elIf sKey == "8" then
	return TcMsg ("msgTcListerExplorer", msgTcListerExplorer)
endIf
return cscNull
EndFunction

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
