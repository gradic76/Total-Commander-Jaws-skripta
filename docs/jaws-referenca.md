# JAWS skriptiranje: izvori i provjerene činjenice

Prikupljeno 2026-11-16. Što nije provjereno, tako je i označeno.

## Lokalni izvori (JAWS 2025 na razvojnom računalu)

- Izvorne skripte JAWS-a: C:\ProgramData\Freedom Scientific\JAWS\2025\Scripts. Ima 298 .jss datoteka, uz njih .jsh, .jsm i .jsb.
  - Default.JSS je glavni izvor primjera, s događajima kao FocusChangedEventEx, ActiveItemChangedEvent, ValueChangedEvent, NewTextEvent i ProgressBarChangedEvent.
  - explorer.jss, .jsh i .jsm su obrazac za upravitelja datoteka.
  - HJConst.JSH, HJGlobal.JSH i HjHelp.jsh su zaglavlja koja se uključuju u vlastite skripte.
- Dokumentacija funkcija: Scripts\enu\builtin.jsd. Ima 1387 ugrađenih funkcija, sa sažetkom, opisom i parametrima. To je lokalni ekvivalent FSDN-a za ugrađene funkcije.
- Dokumentacija zadanih skripti: Scripts\enu\default.jsd.
- Postavke: Settings\enu\default.jcf je zadani .jcf s komentarima opcija, a keycodes.ini sadrži imena tipki, npr. Insert, ExtInsert i NumInsert.
- JAWS već ima zajedničke totalcmd.jcf i totalcmd64.jcf, obje s IndicateSelected=1.
- Pomoć: Locale\enu\Help\jscript.chm je kratki priručnik za Script Manager, a JFW.chm opća pomoć.
- Prevoditelj: C:\Program Files\Freedom Scientific\JAWS\2025\scompile.exe. Sintaksu naredbenog retka nisam provjerio: /? ne ispisuje ništa.

## Činjenice iz jscript.chm

- Korisničke skripte i postavke idu u %APPDATA%\Freedom Scientific\JAWS\<verzija>\Settings\<jezik>, a zajedničke u ProgramData.
- Korisnička datoteka ima prednost pred zajedničkom istog imena. Za .jcf se postavke spajaju, što je potvrđeno našom TOTALCMD64.jcf.
- Vrste datoteka:
  - .jss je izvorni kod,
  - .jsb je prevedeni kod,
  - .jsh su konstante i globalne varijable,
  - .jsm su poruke (lokalizacija),
  - .jsd je dokumentacija skripti.
- Ime skripte odgovara imenu izvršne datoteke. ConfigNames.ini može dati drugo ime.
- Datoteke mogu biti ANSI ili UTF-8, a .jsh i .jsm smiju biti u drugom kodiranju od .jss.
- Include datoteke moraju doći prije upotrebe, npr. Include "HJConst.jsh".

## Web izvori

Freedom Scientific (support.freedomscientific.com) automatskom čitanju vraća 403, pa ove izvore treba otvoriti ručno u pregledniku:
- FSDN (FSDN.chm): /support/jawsdocumentation/FSDN
- Novosti u skriptiranju po verzijama: /support/jawsdocumentation/ScriptingInfo
- Basics of Scripting, online: /Content/Documents/Other/ScriptManual/01-0_Introduction.htm (iz 2011.)
- Basics of Scripting, za preuzimanje: /Content/Documents/Other/Basics_of_Scripting.exe
- UIA Script API: /support/jawsdocumentation/UIAScriptAPI

Treće strane (pročitano):
- Doug Lee, https://www.dlee.org/code_common.htm, iskusni autor skripti. Njegov instalacijski program:
  - napravljen je u NSIS-u, radi bez administratorskih prava i instalira u sve pronađene verzije i jezične mape JAWS-a, uvijek u korisničku mapu;
  - ConfigNames.ini, .jcf i .jgf ne prepisuje, nego u njih upisuje samo potrebne retke, pa korisnikove ostale postavke ostaju;
  - zajedničku mapu nikad ne dira;
  - ima deinstalaciju i dopušta ručnu instalaciju;
  - verzija skripte se čita s Insert+Q.
- Prijevodi kod Doug Leeja: https://www.dlee.org/code_tran.htm (nepročitano).
- Ken Gould, "Everything you ever wanted to know about scripting" (Google Doc, nepročitano).
- JAWS-Scripting-From-Scratch (mrhunsaker.github.io): vodič rađen uz pomoć AI-ja, s greškama. Koristiti samo uz provjeru.

## Posljedice za projekt

- Instalacijski program mora upisati JAWSInsertKey=1 u korisnikovu TOTALCMD64.jcf kao jedan redak, a ne prepisati cijelu datoteku. Isto vrijedi za ostale .jcf postavke.
- Instalira se samo u korisničku mapu, za svaku pronađenu verziju od 2025 nadalje, i nikad u ProgramData.
- Verzija skripte na Insert+Q, prema Leejevoj praksi, kao dio pomoći.
