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
Lister. The scripts say the file name when Lister opens and after N, P, Alt+Left Arrow or Alt+Right Arrow, the display mode after the keys 1 to 8, the whole line after a search (F7, F3, F5 and the other search keys), and whether the text cursor, the maximized window or full screen mode is on after F6, F11 or Alt+Enter. F2, which reloads the file, plays a sound. Plus and minus, on the main keyboard or the numeric keypad, change the font size with a sound and say the new size; Control+0 returns to the stored size. %2 says the position in the file in percent. The arrow keys read the text only while the text cursor is on; F6 turns it on and off, and Total Commander remembers it. When Lister plays audio or video, the position and volume sliders stay silent while playing and speak only when you move them; Tab moves between them, and Shift or Control with the arrow keys go to Lister, not to JAWS. %1 lists the script keys.
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
Total Commander script keys:
%1 to %2: the columns after the name of the item in focus, with the column caption from the header, in the order Total Commander shows them, so they follow any view and your own custom columns. In Full view: 1 size, 2 date and time, 3 attributes. Pressed twice quickly, shows all columns of the item in the virtual viewer, one per line, with the cursor on the requested column.
%3: path of the active panel; pressed twice quickly, copies it to the clipboard.
%8: which panel is active.
%4: whole row of the item, with its position.
%5: status line of the active panel; in the progress window, a progress summary; in Lister, the position in the file in percent.
%9: status line and free space of the other panel, e.g. to check the target before copying.
%6: in the overwrite, progress and message dialogs, reads the whole dialog.
%7: script version.
Insert marks the item and moves to the next one; the scripts then say how many items are marked and the item reached.
@@

; Insert+F1 in the file list; %1 = key for the whole row, %2 = key for the key list
@msgTcListHelp
File list. The arrow keys read the item name, and "selected" for marked items. ".." also says the folder it leads to. Space and Insert mark items. F2 and Control+R, which reread the panel, play a sound. In the folder tree (Control+F8) the arrow keys read the folder, whether it is open or closed, and its level; Right Arrow opens a folder and Left Arrow closes it. %1 reads the whole row, and %2 lists the script keys.
@@

; Insert+F1 pressed twice: general help; %1 = version, %2 = key for the key list
@msgTcAppHelp
Total Commander JAWS scripts, version %1. The scripts shorten what is spoken in the file list, read the overwrite, progress and message dialogs, and add keys for size, date and path. For the list of keys, press %2.
@@

; Shown when the progress window text could not be read
@msgTcProgressUnknown
Progress not available
@@
EndMessages
