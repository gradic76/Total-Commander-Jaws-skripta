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

; Shown when the progress window text could not be read
@msgTcProgressUnknown
Progress not available
@@
EndMessages
