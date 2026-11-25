; Total Commander JAWS scripts: spoken messages (English)
; Copyright (c) 2026 author. MIT License.

Messages
; Insert+Q: application name
@msgTcAppName
Total Commander
@@

; Insert+Q: script set version, %1 = version
@msgTcVersion
Total Commander JAWS scripts, version %1
@@

; Overwrite dialog opened.
; %1 = dialog's own caption for the target file (e.g. "Overwrite"), %2 = file name,
; %3 = size and date of the existing file, %4 = size and date of the new file.
@msgTcOverwriteSummary
%1 %2. Existing: %3. New: %4.
@@

; Insert+B in the overwrite dialog, one group per message.
; %1 = group caption, %2 = full path as shown, %3 = size and date
@msgTcOverwriteGroup
%1 %2, %3.
@@
; Insert+Page Down in the progress window, parts joined by ", "
; %1 = total percent as shown, e.g. "6 %"
@msgTcProgressTotal
Total %1
@@

; %1 = current file percent as shown
@msgTcProgressFile
file %1
@@

; %1 = remaining time as shown, e.g. "43 m"
@msgTcProgressLeft
%1 left
@@

; Name spoken for the "-" button in the background transfer manager
@msgTcMinus
minus
@@

; Pack files dialog: name for the compression ratio button, %1 = current ratio
@msgTcCompressionRatio
Compression ratio %1
@@

; Alt+F8: name of the drop-down list with the command line history (TC has no word for it)
@msgTcCommandHistory
Command line history
@@

; Multi-Rename (Ctrl+M): the picture button next to upper/lowercase opens a menu: load names
; from a file, edit names, configure the editor; TC gives it no text
@msgTcMrtNamesButton
Load or edit names
@@

; Insert+F1 in the synchronize dirs window
@msgTcSyncHelp
Synchronize directories
Arrow keys in the results: the file name and its relation: equal, different, left to right, right to left, left only, right only, not compared yet, or skip.
%1: the whole row with sizes and dates.
Space: changes the copy direction of the row or switches it off (skip). JAWS reads Total Commander's own announcement of the changed row as it is.
Control+Shift+L: show left to right.
Control+Shift+E: show equal.
Control+Shift+N: show different.
Control+Shift+R: show right to left.
Control+Shift+D: show duplicates.
Control+Shift+S: show singles.
After each of these keys: Total Commander's status line with the shown and hidden counts.
Synchronize button: a dialog with the copy directions and their target folders.
@@

; Insert+F1 in the compare by content window; %1 = key for the files and the status
@msgTcCompareHelp
Compare by content
Opening the window, Compare: the left file, the right file and Total Commander's status line.
Editing: press it first; the panes then get a text cursor.
Next difference, Previous difference: in Editing mode, the line from both files, left first; "blank" for a side without that line.
Arrow keys: read the lines.
Outside Editing mode: only the status line, since the current difference cannot be known there.
Long lines: read as far as the pane shows them.
%1: which file is left and which right, and the status line.
@@

; Synchronize dirs (Commands menu): the relation of a result row, from TC's codes EQ, UNEQ,
; UNKNOWN, "L to R", "R to L" and the side mark L, R or 2 (both)
@msgTcSyncEqual
equal
@@

@msgTcSyncUnequal
different
@@

@msgTcSyncUnknown
not compared yet
@@

@msgTcSyncLeftNewer
left to right
@@

@msgTcSyncRightNewer
right to left
@@

@msgTcSyncLeftOnly
left only
@@

@msgTcSyncRightOnly
right only
@@

@msgTcSyncSkip
skip
@@

; Synchronize dirs: the Show buttons, switched with Ctrl+Shift+L, E, N, R, D, S (TC help)
@msgTcSyncShowLeft
show left to right
@@

@msgTcSyncShowEqual
show equal
@@

@msgTcSyncShowUnequal
show different
@@

@msgTcSyncShowRight
show right to left
@@

@msgTcSyncShowDuplicates
show duplicates
@@

@msgTcSyncShowSingles
show singles
@@

; Synchronize dirs: the picture button left of the left folder (menu: add the current folders
; and settings to the list) and the "1x" button (opens the file filter)
@msgTcSyncSaved
Saved comparisons
@@

@msgTcSyncFilter
File filter
@@

; Synchronize dirs, start dialog: the target folder field under each copy direction
@msgTcSyncTarget
Target folder
@@

; Synchronize dirs: the three fields at the top (TC gives them no label)
@msgTcSyncLeftFolder
Left folder
@@

@msgTcSyncMask
File mask
@@

@msgTcSyncRightFolder
Right folder
@@

; Compare by content: the path fields of the two files (TC gives them no label)
@msgTcCmpLeftFile
Left file
@@

@msgTcCmpRightFile
Right file
@@

; Compare by content: the two picture buttons open TC's search
@msgTcCmpSearch
Search
@@

; Shift+F6: name of the field TC puts into the file list to rename an item in place
@msgTcRename
Rename
@@

; Lister (F3) keys 1 to 8: said after the key, worded as in Lister's Options menu (TC 11.56);
; the menu is owner-drawn, so its text cannot be read from the screen
@msgTcListerText
Text only
@@

@msgTcListerBinary
Binary (fixed line length)
@@

@msgTcListerHex
Hex
@@

@msgTcListerMultimedia
Image/Multimedia
@@

@msgTcListerHtml
HTML text (strip tags)
@@

@msgTcListerUnicode
Unicode
@@

@msgTcListerUtf8
UTF-8
@@

@msgTcListerExplorer
Explorer Preview
@@

; Insert+F1 in Lister; %1 = key for the key list, %2 = key for the position in percent
@msgTcListerHelp
Lister
Opening Lister: the file name.
N, Alt+Right Arrow: the next file, with its name.
P, Alt+Left Arrow: the previous file, with its name.
1 to 8: the display mode.
F7, Control+F: search; then the whole line with the match.
F3, F5, Shift+F7: the next match, with its line.
Shift+F3, Shift+F5: the previous match, with its line.
F2: reloads the file, with a sound.
F6: text cursor on or off. The arrow keys read the text only while it is on, and Total Commander remembers it.
F11: maximized window on or off.
Alt+Enter: full screen mode on or off.
Plus, Minus: larger or smaller font, with a sound and the new size.
Control+0: back to the stored font size.
%2: position in the file in percent.
Audio and video: the sliders are silent while playing and speak when you move them.
Tab: moves between the position and volume sliders.
Shift or Control with the arrow keys on a slider: go to Lister, not to JAWS.
%1: the list of script keys.
@@

; Lister F11 and Alt+Enter, worded as in Lister's help; followed by JAWS's own "On" or "Off"
@msgTcListerMaximized
Maximized window
@@

@msgTcListerFullScreen
Full screen mode
@@

; Lister F6, worded as in Lister's Options menu; followed by JAWS's own "On" or "Off"
@msgTcListerCaret
Show text cursor
@@

; View and sort keys (Ctrl+F1 to Ctrl+F8): said after the key, worded as in TC's Show menu
@msgTcViewBrief
Brief view
@@

@msgTcViewFull
Full view
@@

@msgTcViewThumbnails
Thumbnail view
@@

@msgTcViewComments
Comments view
@@

@msgTcViewTree
Tree view
@@

@msgTcViewSeparateTree
Separate tree
@@

@msgTcSortName
Sorted by name
@@

@msgTcSortExtension
Sorted by extension
@@

@msgTcSortDate
Sorted by date
@@

@msgTcSortSize
Sorted by size
@@

@msgTcUnsorted
Unsorted
@@

; Ctrl+Q, Ctrl+T, Ctrl+F10, Ctrl+F11, worded as in TC's Show menu (2026-11-21)
@msgTcViewQuickView
Quick View Panel
@@

@msgTcViewNewTab
New Folder Tab
@@

@msgTcViewAllFiles
All Files
@@

@msgTcViewPrograms
Programs
@@

; Find Files: name of the ">>" button, which opens the Windows folder browser
@msgTcBrowse
Browse
@@

; Shift+F7: said before the new folder field, since the dialog looks the same as for F7
@msgTcInOtherPanel
In the other panel
@@

; Name of the command line edit field (JAWS said only "Edit")
@msgTcCommandLine
Command line
@@

; Said when the quick search box opens (Ctrl+Alt+letters); not "Search", which is the big search dialog
@msgTcQuickSearch
Quick search
@@

; Said when focus enters a button bar (Alt+Shift+F11, Alt+Shift+F12), as TC names them in its options
@msgTcButtonBar
Button bar
@@

@msgTcVerticalButtonBar
Vertical button bar
@@

; Alt+Shift+A: %1 = panel name as Total Commander gives it ("LEFT" or "RIGHT")
@msgTcActivePanel
%1 panel active
@@

; Alt+1 to Alt+9 when the row has no such column (e.g. Brief view), and other missing information
@msgTcNotAvailable
Not available
@@

; Insert+H: keys added by the scripts (shown in the virtual viewer).
; %1 to %9 are the actual keys, filled in by the scripts (the JAWS key named Insert).
@msgTcHotKeyHelp
Total Commander script keys
%1 to %2: the columns after the name of the item in focus, with the column caption from the header, in the order Total Commander shows them. They follow every view and your own custom columns. In Full view: 1 size, 2 date and time, 3 attributes. Pressed twice quickly, shows all columns of the item in the virtual viewer, one per line, with the cursor on the requested column.
%3: path of the active panel; pressed twice quickly, copies it to the clipboard.
%8: which panel is active.
%4: whole row of the item, with its position.
%5: status line of the active panel; in the progress window, a progress summary; in Lister, the position in the file in percent.
%9: status line and free space of the other panel, e.g. to check the target before copying.
%6: in Total Commander's dialogs, reads the whole dialog; in the compare by content window, the two files and the status line.
%7: script version.
@@

; Insert+H, the keyboard profile's Insert keys (A: extended Insert marks; B: extended Insert is the JAWS key)
@msgTcInsertHelpB
The extended Insert is the JAWS key.
Extended Insert pressed twice quickly: passes Insert to Total Commander, which marks the item and moves to the next one; the scripts then say how many items are marked and the item reached.
Numeric keypad: on, so Total Commander gets Num Plus, Num Minus, Num Star and Num Slash.
@@

; Insert+H, the keyboard profile's Insert keys (A: extended Insert marks; B: extended Insert is the JAWS key)
@msgTcInsertHelpA
The numeric Insert and the extended Insert have different functions. The extended Insert marks items in the panels; the numeric Insert is the JAWS key.
Extended Insert: marks the item and moves to the next one; the scripts then say how many items are marked and the item reached.
@@

; Insert+F1 in the file list; %1 = key for the whole row, %2 = key for the key list
@msgTcListHelp
File list
Arrow keys: the item name, and "selected" for marked items.
"..": also the folder it leads to.
Space: marks or unmarks the item.
F2, Control+R: reread the panel, with a sound.
Control+F8: folder tree; the arrow keys say the folder, whether it is open or closed, and its level.
Right Arrow in the tree: opens the folder.
Left Arrow in the tree: closes the folder.
%1: the whole row.
%2: the list of script keys.
@@

; Insert+F1 pressed twice: general help; %1 = version, %2 = key for the key list
@msgTcAppHelp
Total Commander JAWS scripts, version %1. The scripts shorten what is spoken in the file list and the folder tree, make Total Commander's dialogs, Lister, compare by content and synchronize directories usable, and add keys for columns, path and status lines. For the list of keys, press %2.
@@

; Shown when the progress window text could not be read
@msgTcProgressUnknown
Progress not available
@@
EndMessages
