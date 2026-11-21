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

## Naučeno u radu (2026-11-17)

- scompile.exe prevodi samo skripte u JAWS-ovoj mapi postavki. Na grešku vraća izlazni kod različit od 0, pa deploy.ps1 tada staje, a stara .jsb ostaje.
- Funkcija koja vraća tekst (string) mora biti definirana prije prve upotrebe. Inače prevoditelj pretpostavi int i javi grešku.
- Funkcija koja poziva samu sebe (rekurzija) se prevede, ali ne radi. Koristiti petlje.
- COM radi: CreateObject ("Shell.Application") i poziv metoda točkom (oShell.NameSpace (17).Title).
- JAWS sam umeće "selected" u izgovor o označenoj stavci na fokusu, čak i unutar našeg Say. Ne dodavati ga ručno.
- Kad aplikacija prepiše redak stavke na fokusu, JAWS javlja FocusChangedEventEx za istu stavku (nChild == nPrevChild) i izgovori cijeli redak.
- Ispitivanje izgovora: povijest govora. Insert+Razmak pa Shift+H je briše, Insert+Razmak pa Ctrl+H je kopira u međuspremnik, a Claude je pročita. Za traženje izvora govora koriste se privremene oznake ("A", "S", "F"...) u probnoj verziji (deploy.ps1 -SourceDir).
- Izmijenjenu .jkm JAWS učitava tek nakon ponovnog pokretanja; promijenjena .jsb učita se već pri ponovnom ulasku u program (izmjereno 2026-11-18).
- Presretanje tipke skriptom pa prosljeđivanje s TypeCurrentScriptKey nije ispravno proslijedilo numeričke tipke s modifikatorima (Ctrl+Num minus) TC-u. Bolje je tipku ne presretati, nego je pratiti u KeyPressedEvent (strKeyName, npr. "Control+NumPadMinus"; nIsScriptKey kaže je li je izvršio JAWS).
- Tipka JAWS sama (JAWSKey=...) može se vezati u .jkm; dvostruki pritisak hvata IsSameScript (kao JAWS-ov laptop raspored za Caps Lock).
- Naziv tipke skripte daje GetScriptKeyName; %KeyFor u porukama stvara poveznice i piše "JAWSKey".
- Iscrtani tekst koji JAWS-ov off-screen model vidi može se čitati po dijelovima (GetChunk, NextChunk s nevidljivim kursorom); svaki naslov stupca u TC-ovu zaglavlju je zaseban dio (2026-11-20).
- Dio prozora prekriven drugim prozorom Windows ne iscrtava, pa ga JAWS-ov off-screen model nema. Kod testiranja paziti da TC nije prekriven (npr. prozorom razgovora).
- Vršni prozor bez podređenih prozora (TC-ov Lister): JAWS ga pri otvaranju najavljuje samo kroz HandleCustomWindows; HandleCustomRealWindows i HandleCustomAppWindows se nisu pozvali (proba s oznakama, 2026-11-20). Ime prozora tada dolazi dvaput, kao prozor i kao fokusirani objekt.
- Kad strelice u prozoru s iscrtanim tekstom odjednom šute, prvo provjeri vidi li JAWS kursor (CaretVisible): bez kursora nema što pratiti. Kontrolna verzija skripte (zadnji commit) brzo odvaja kvar skripte od stanja programa.
- Shift+strelice i Ctrl+strelice su u JAWS-ovu rasporedu skripte (SelectNextLine, SelectPriorLine, SelectNextCharacter, SelectPriorCharacter; ControlUpArrow, ControlDownArrow i inačice ...PCCursor za tipke iz bloka strelica, u .jkm "Extended"). Na kontrolama koje te tipke same koriste (klizači) JAWS govori "selected" ili remeti kontrolu; nadjačati skriptu istog imena i propustiti tipku (TypeCurrentScriptKey) samo na toj kontroli (2026-11-20).
- Tipka dodana u .jkm gubi JAWS-ov echo jer je TypeCurrentScriptKey propušta bez izgovora. Kad tipku samo treba pratiti, bolje je KeyPressedEvent (2026-11-20).
- JAWS imenuje tipke po američkom rasporedu: hrvatski "+" je "=", hrvatski "-" je "/"; u .jkm Equals, Dash, Slash. Ctrl+0 u KeyPressedEvent dolazi bez imena.
- Promjena naslova vršnog prozora (TC-ov Lister) nije stigla kao NameChangedEvent.
- Rezultat usporedbe upisan izravno u varijablu (let b = (sKey == "rightarrow")) nije radio: varijabla je ostala netočna. Uvijek if ... let b = true (2026-11-21).
- Scripting.FileSystemObject radi preko CreateObject (FolderExists, GetFolder().SubFolders.Count).
- TC ima interno sučelje WM_USER+50 (ručke ploča, stabla, brojevi), koje NVDA dodatak koristi; iz vanjskog procesa vratilo je nule, nije dalje istraženo.
