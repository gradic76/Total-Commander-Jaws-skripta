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

; Alt+Shift+S / Alt+Shift+D when the row has no such column (e.g. Brief view)
@msgTcNotAvailable
Not available
@@

; Insert+H: keys added by the scripts (shown in the virtual viewer).
; %1 to %8 are the actual keys, filled in by the scripts (the JAWS key named Insert).
@msgTcHotKeyHelp
Total Commander script keys:
%1: size of the item in focus.
%2: date and time of the item in focus.
%3: path of the active panel; pressed twice quickly, copies it to the clipboard.
%8: which panel is active.
%4: whole row of the item, with its position.
%5: status line of the active panel; in the progress window, a progress summary.
%6: in the overwrite, progress and message dialogs, reads the whole dialog.
%7: script version.
Insert marks the item and moves to the next one; the scripts then say how many items are marked and the item reached.
@@

; Insert+F1 in the file list; %1 = key for the whole row, %2 = key for the key list
@msgTcListHelp
File list. The arrow keys read the item name, and "selected" for marked items. ".." also says the folder it leads to. Space and Insert mark items. %1 reads the whole row, and %2 lists the script keys.
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
