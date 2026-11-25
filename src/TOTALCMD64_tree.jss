; Total Commander JAWS scripts: folder tree (Ctrl+F8, Alt+F10): names, levels, remembered open branches
; Copyright (c) 2026 author. MIT License.
; Included by TOTALCMD64.jss; not compiled on its own.


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
