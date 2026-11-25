# Faza 0: zatečeno stanje

## Okruženje (provjereno 2026-11-16)

- Total Commander 11.56, 64-bit, PortableApps paket u D:\Total Commander Portable.
- Pokreće se preko TotalCommanderPortable.exe, ali stvarni proces je TOTALCMD64.EXE. JAWS skripte se zato zovu TOTALCMD64.
- Postavke: Data\TotalCommander\TotalCommander.ini (ne wincmd.ini). Skripta i installer ne smiju pretpostavljati ime ni mjesto ini datoteke.
- Jezik sučelja: LanguageIni=WCMD_ENG.LNG, odnosno ugrađeni engleski.
- Paket nema hrvatske .lng datoteke (ima CHN, CZ, DAN, DEU, DUT, ESP, FRA, HUN, ITA, KOR, NOR, POL, ROM, RUS, SK, SVN, SWE, UKR).
- Naslov prozora: "<korisnik>^ - Total Commander (x64) 11.56 - <vlasnik licence>". Skripta ne smije ovisiti o dijelovima naslova.
- Prikaz: Full (ViewMode=10001) u obje ploče. Gumbna traka, traka diskova i naredbeni redak su isključeni. Kartice mapa su uključene.

## Format .lng datoteke

- Prvi redak je ime jezika, a drugi codepage=NNNN (npr. 1252).
- Zatim slijede retci broj="tekst", oko 2200 njih. U tekstu su \n, %s, %i, a & označava tipku prečaca.
- Nema zaglavlja odjeljka, pa JAWS-ova IniReadString vjerojatno ne radi izravno. Moguće je čitanje preko COM-a (Scripting.FileSystemObject). Nije isprobano.
- Tekstovi su ANSI u zadanom codepageu, a ne UTF-8.

## Struktura prozora (Win32, izmjereno na pokrenutom TC-u)

- Glavni prozor: klasa TTOTAL_CMD.
- Popisi datoteka: klasa LCLListBox, jedan po ploči, izravno pod glavnim prozorom. Lijevi i desni razlikuju se samo po položaju.
- Svaka ploča ima roditelja klase Window, s ovom djecom:
  - LCLComboBox za izbor diska.
  - Window s tekstom oznake i slobodnog prostora diska, npr. "[podaci]  517.655.828 k of 790.368.252 k free".
  - Window s putanjom i filtrom, npr. "d:\*.*".
  - Window bez teksta za zaglavlje stupaca. Vjerojatno je iscrtan, nije provjereno.
  - Window sa statusnom trakom, npr. "0 k / 878 k in 0 / 3 file(s), 0 / 11 dir(s)".
- Putanja, slobodni prostor i statusna traka dostupni su kao tekst prozora, pa ih skripta može čitati izravno.
- ID-ovi kontrola izgledaju kao adrese i mijenjaju se. Ne koristiti ih; kontrole tražiti po klasi, roditelju i redoslijedu.
- LCLListBox je Lazarus kontrola. Treba izmjeriti daje li JAWS-u tekst stavke (MSAA) ili samo iscrtani sadržaj.

## Kako JAWS čita bez skripti (izmjerio autor 2026-11-16, JAWS 2025)

Zaključak: TC 11.56 sam daje JAWS-u dosta podataka (MSAA). Popis, izbornici, dijalog kopiranja i potvrda brisanja već su upotrebljivi. Skripta treba dotjerivati i popunjavati rupe, a ne graditi pristup od nule.

### Radi dobro

- Stavka popisa daje cijeli redak, npr. "Claude <DIR> 13.11.2026 18:41 ----" i "1 of 14". Ime ploče dolazi kao "LEFT" / "RIGHT".
- Enter na mapi i Backspace: izgovori se stavka i nova putanja ("d:\Temeraire\*.*").
- Tab između ploča: "RIGHT MultiSelect ListBox <stavka>, 1 of 14, d:\*.*".
- Insert+T čita naslov.
- F5 dijalog: polja i gumbi se čitaju, prečaci se izgovaraju.
- Potvrda brisanja (F8, Delete): pitanje i gumbi se čitaju.
- Izbornici (F10, Alt): ispravno, s prečacima.

### Problemi

1. Strelice čitaju cijeli redak. Željeno: samo ime; detalji na Insert+strelica gore. Insert+strelica gore sad čita isto što i strelice.
2. Ulaz u popis je opširan: "List box <naslov prozora>", pa "LEFT MultiSelect ListBox <stavka>".
3. Putanja se izgovara s filtrom "*.*" i nakon stavke, a ne prije nje.
4. Razmak: pri označavanju kaže "selected <stavka>" (na mapi prvo "?" dok TC računa veličinu, a redak se čuje dvaput). Pri micanju oznake kaže samo redak, bez riječi da oznake više nema.
5. Insert označi i pomakne se na sljedeću stavku, ali ne kaže je li prethodna označena; čuje se samo sljedeća stavka. Što bi tu trebalo reći, još je otvoreno.
5a. Oba Inserta su JAWS tipka (default.jcf: JAWSInsertKey=3, 1 = numerički, 2 = prošireni, 3 = oba), pa TC-ova naredba Insert radi samo kroz Pass key through. Riješeno 2026-11-16 datotekom src\TOTALCMD64.jcf (JAWSInsertKey=1): u TC-u prošireni Insert označava, numerički ostaje JAWS tipka, u drugim programima oba su JAWS tipka. Provjerio autor uhom. JAWS ima i vlastitu totalcmd64.jcf (IndicateSelected=1), koju naša zadržava.
6. Insert+Page Down čita statusne trake obiju ploča zaredom. Treba samo aktivnu, ili aktivnu pa drugu, jasno odvojeno.
7. Ctrl+C / Ctrl+X / Ctrl+V: JAWS kaže samo "Copied", "cut", "Pasted". Ctrl+V pokreće Explorerovo kopiranje, a ne TC-ovo, pa je "Prekinute akcije: 1" iz Explorera. U TC-u se kopira i premješta s F5 i F6, pa ovo nije prioritet.
8. F5 dijalog: fokus prvo javi "Combo box Total Commander", tj. ime polja je naslov dijaloga, a ne "Copy 1 file(s) to". Potvrdni okviri se javljaju kao "3 state button" umjesto "checkbox".
9. Dijalog prepisivanja: pri otvaranju se čuje samo "Total Commander, Overwrite Button". Ne kaže se koja datoteka ni usporedba veličina i datuma. Insert+B pročita prozor napretka u pozadini, a ne podatke dijaloga prepisivanja.
10. Napredak kopiranja: postoci s više traka izgovaraju se nasumično ("8%, 86%, 0%, 14%"), bez oznake koja je traka (trenutna datoteka ili ukupno). Naslov dijaloga je samo "Total Commander".
11. Insert+F1 daje JAWS-ovu općenitu pomoć za program bez podrške.

### Dijalog prepisivanja (izmjereno 2026-11-16)

- Klasa TOverWriteForm, naslov "Total Commander". Vlasnik je prozor napretka TDLG2FILEACTIONMIN, a njegov vlasnik glavni prozor.
- Na ekranu (snimka):
  - "Overwrite:": ciljna datoteka (putanja skraćena s ...), "14.637.686 bytes, 05.12.2012 08:55:26" i ikona crvenog X;
  - narančasta strelica između okvira, vjerojatno pokazuje noviju datoteku, nije provjereno;
  - "With file:": izvorna datoteka, veličina, datum i ikona zelene kvačice;
  - potvrdni okviri Thumbnails i Custom fields, gumb "+";
  - gumbi Overwrite, Overwrite all, Skip, Cancel, Overwrite all older, Skip all, Rename, Append i More Options >>.
- Okviri "Overwrite:" i "With file:" su prozori klase Button (vjerojatno group box) s djetetom klase Window (ikona). Putanja, veličina i datum nisu ni u tekstu prozora ni u MSAA/UIA, nego se samo iscrtavaju.
- JAWS kursor vidi iscrtani tekst u retcima: natpis okvira, putanja, "veličina, datum".
- Riješeno 2026-11-16 (TOTALCMD64.jss, provjerio autor uhom):
  - pri otvaranju se čuje "Total Commander", zatim "Overwrite 01.mp3. Existing: ... New: ...", zatim fokusirani gumb;
  - Insert+B čita oba okvira s putanjama;
  - Tab ne ponavlja sažetak;
  - Insert+Q kaže verziju.
- Sažetak se izgovara iz HandleCustomRealWindows, umjesto naslova dijaloga, pa nema dvostrukog "Total Commander".

### Red čekanja i pozadinski poslovi (izmjereno 2026-11-16)

- Red čekanja ("Background transfer manager", F5 pa F2) i mali prozori poslova (nakon Background) su standardni dijalozi #32770 s običnim kontrolama (Static, Button, Edit).
- Naslov sadrži ukupni postotak i posao, npr. "2% Drumless Version Library (Copy)".
- Popis reda (ListBox) prikazuje poslove, ali LB_GETCOUNT vraća 0: TC ih sam iscrtava. JAWS ih ipak čita.
- Background posao nije u redu čekanja i teče istovremeno s poslovima u redu. To je ponašanje TC-a.
- Gumb "-" JAWS ne izgovara (interpunkcija), pa ga skripta zove "minus". Značenje gumba nije provjereno; "+" ručno dodaje stavku u red (HISTORY.TXT).
- Automatski izgovor postotaka dolazi od traka napretka (ProgressBarChangedEvent) i utišan je.
- Tab je spor (1 do 2 s po kontroli) i bez naše skripte, što je potvrđeno nultom probom. Uzrok: prozor reda radi u niti koja i kopira, pa na poruke odgovara prosječno za 180 ms (najviše 288 ms), dok glavni prozor odgovara za 0 ms. JAWS pri svakoj promjeni fokusa šalje prozoru mnogo upita, pa se kašnjenja zbrajaju. To je ograničenje TC-a i skripta ga ne može ukloniti.
- Događaji pristupačnosti nisu poplava: u 5 s bilo je 28 promjena imena i 14 promjena vrijednosti.

### Tehnički podaci iz JAWS-a

- Ctrl+Insert+F1 na popisu: klasa LCLListBox, Control ID i handle su promjenjivi (potvrđuje mjerenje iz Win32).

### Izbornici (izmjereno 2026-11-17)

- U 64-bitnom TC-u glavni izbornik je uvijek iscrtan od TC-a (owner-draw, HISTORY.TXT 10.09.17), kao i izbornik pogona (19.11.08).
- Točkice izbora (npr. Show > Full, All Files, Name) samo su iscrtane: GetMenuState ni dok je izbornik otvoren ne vraća "checked" (MFS_CHECKED). Zato ih JAWS ne može izgovoriti.
- "selected" ispred stavki izbornika dolazio je od JAWS-ove postavke IndicateSelected=1 iz njegove totalcmd64.jcf. Vrijednost 2 dodaje "Not Selected" svakoj neoznačenoj stavci popisa. Vrijednost 0 ne dodaje ništa, pa naša TOTALCMD64.jcf koristi 0, a skripta sama kaže "selected" na označenim datotekama. Provjereno uhom.

### Tvorničke postavke (izmjereno 2026-11-18, kopija "Total Commander Portable (OS)")

- Zadani izgled ima i gornju gumbnu traku (DEFAULT.BAR, preko cijele širine), okomitu gumbnu traku između ploča (VERTICAL.BAR) i vidljiv naredbeni redak. Gumbi funkcijskih tipki nisu uključeni.
- Ploče su iznutra iste. Skripta radi jednako i s tvorničkim i s autorovim postavkama (provjereno uhom).
- Gumbne trake (Alt+Shift+F11, Alt+Shift+F12) su čitljive: svaki gumb ima opis, kretanje je strelicama lijevo i desno. JAWS kao ime prozora trake daje opis trenutnog gumba, a ne ime datoteke trake. Skripta pri ulasku kaže "Button bar" ili "Vertical button bar".
- S tvorničkim izgledom JAWS je nakon Taba i ulaska u mapu izgovarao redak s putanjom ("c:\*.*"). Skripta ga utišava (NewTextEventShouldBeSilent).

### Lister, F3 (izmjereno 2026-11-20)

- Prozor klase TLister, vršni (bez roditelja), bez ijednog podređenog prozora: tekst je iscrtan, a JAWS ga čita iz off-screen modela. Naslov: "Lister - [puna putanja]".
- Tekstna datoteka s postojećim skriptama (autor, uhom): pri otvaranju JAWS kaže naslov, pa prvi redak. Strelice gore i dolje, lijevo i desno (znak), Ctrl+strelice (riječ), Ctrl+Home i Ctrl+End i čitanje svega rade dobro.
- Tekstni kursor Listera (F6, "Show text cursor"): JAWS strelicama čita samo kad je kursor uključen; bez njega strelice tiho pomiču tekst. TC stanje pamti ([Lister] Caret= u svojim postavkama). Tvornički je uključen (autorova kopija, 2026-11-20). U kopiji (OS) isključio se tijekom testova (slučajni F6 ili tipka 8, neutvrđeno); kontrolna verzija skripte bila je jednako tiha, pa skripta nije uzrok.
- N i P idu samo po datotekama predanima Listeru (više označenih pa F3), ne po cijeloj mapi.
- Prečaci iz izbornika Listera (TC 11.56): F2 Reload file, F7 Find, F5 Find next, F6 Show text cursor, 1 do 8 načini prikaza. Izbornik je owner-drawn, pa mu se tekst ne može pročitati izvana.

### Jezik TC-a u kopiji (OS) (2026-11-22)

- PortableApps pokretač (TotalCommanderPortable.ini, UserDefaultLang=true) pri svakom pokretanju vraćao je TC na jezik sustava/platforme (engleski). Postavljeno UserDefaultLang=false, a u TC-ovim postavkama LanguageIni=WCMD_HR.LNG i Mainmenu=WCMD_HR.MNU (autorov pristanak; kopije .bak-lang uz obje datoteke).
- Imena ploča ("LIJEVO", "DESNO") TC daje iz datoteke jezika (1331, 1332). Nakon promjene jezika u radu desna je ploča zadržala staro ime "RIGHT" dok se TC nije ponovo pokrenuo.

### Konfiguracija (Opća podešavanja), izmjereno izvana 2026-11-25

Način: TC i njegov pokretač rade s administratorskim pravima, pa mjerenje ide iz povišene PowerShell sesije (bez UAC upita, "never notify"), svjesne skaliranja (SetProcessDpiAwarenessContext, ekran je 150 %). Dijalog otvara naredba cm_Config (490) porukom WM_USER+51; stranice se mijenjaju porukama tipki Home i strelica dolje popisu stranica (sam LB_SETCURSEL i LBN_SELCHANGE ne mijenjaju stranicu). Imena i vrste iz MSAA-a (UIA iz te sesije daje samo "Pane"). Iscrtani natpisi pročitani su OCR-om (Windows, hr-HR) sa slike prozora (PrintWindow). Zatvoreno s Poništi, ništa nije spremljeno.

- Prozor TDLGCONFIGALL, naslov "Opća podešavanja". Lijevo popis stranica (LCLListBox, 26 stavki, MSAA popis bez imena), gore naslov stranice (Window s tekstom), dolje Potvrdi, Poništi, Pomoć, Primijeni.
- Kontrole su Win32: potvrdni okviri (Button, tri stanja), izborni gumbi, grupe, Edit, LCLComboBox, LCLListBox, ScrollBar (klizači uz polja; većina nije tab stop).
- Velika većina kontrola ima ispravno MSAA ime (TC povezuje natpis s kontrolom). Bez imena ili s imenom od jednog znaka ostaje oko 40 kontrola za unos i oko 30 gumba ">>" i "+".
- Gumbi ">>": u većini stranica otvaraju odabir datoteke ili mape (skripta ih već zove "Browse"/"Pregledaj"), ali na stranici Boje šest ">>" gumba uz boje (Tekst, Pozadina, Odabrano, Kursor...) i na Korisničkom prikazu nisu pregledavanje, pa bi "Pregledaj" ondje bio pogrešan. Na stranici Jezik gumb ima tekst "&>>".
- Kontrole bez imena, s natpisom koji je iscrtan (OCR), po stranicama:
  - Prikaz: polje "Ograniči širinu kratkog pregleda stupaca na: ... piksela" (200); gumb "+" uz "Korisnički:".
  - Ikone: kombinirani okviri "Prikaz ikona za opcije u glavnom izborniku" (16x16) i "Veličina ikona" (32x32).
  - Fontovi: kombinirani okvir "Postavi broj točaka po inču (DPI) na:" (144, isključen).
  - Boje: kombinirani okvir uz "Preglednik (Lister):" (4, isključen); potvrdni okvir bez imena uz "Odredi boju prema vrsti datoteke"; šest ">>" uz boje.
  - Stupci: kombinirani okvir formata vremena (hh:mm) uz "Koristi 12-satni AM/PM format"; klizači širina stupaca (nisu tab stop).
  - Kartice mapa: polje "Ograniči širinu zaglavlja kartice na: ... znakova" (32).
  - Korisnički prikaz: popis korisničkih prikaza bez imena (natpis "Korisnički prikazi" iznad); klizač (tab stop) bez imena; gumbi ">>" i "+".
  - Automatsko prebacivanje: popis pravila bez imena (natpis "Pravila"); klizač (tab stop) bez imena.
  - Upravljanje: polje (4) i kombinirani okvir "Ručno: Alt+Shift+Enter"; natpisi iz OCR-a nesigurni.
  - Stranica 16 (u popisu "Oblici podataka", sadrži FTP postavke): polje vanjskih adresa za PORT način; polja raspona portova (10000, 11000; MSAA ime drugog je "-"); polje sekundi (30, ime "s"); polje datoteke zapisa (%TEMP%\tcftp.log).
  - Sličice: pet polja s maskama datoteka (natpis je potvrdni okvir lijevo, npr. "Interne sličice iz slika:"); polje veličine (96, prvo od dva); polje vlastitih polja ispod sličica.
  - Datoteka zapisnika: polja "Čuvaj najviše ... kopija zapisnika" (30) i "Kada zapisnik postane veći od ... KB" (1000); polje putanje zapisnika.
  - Popis ignoriranja: veliko polje bez imena (natpis iznad "Ignoriraj (ne prikazuj) sljedeće datoteke i mape:").
  - Zip-program: polje druge privremene mape; polje stupnja sažimanja (0).
  - 7-Zip program: polje stupnja sažimanja (6).
  - Razno: polje sekundi (10); tri gumba bez teksta i dva kombinirana okvira bez imena u dijelu za tipkovne prečace (Tipka, Win +, Alijas).
- Provjera uhom (autor, ispis govora), stranicu po stranicu:
  - Izgled: samo potvrdni okviri s imenima, nije trebalo provjeravati.
  - Prikaz: dobro. Potvrdni okviri s imenom, stanjem i prečacem; kombinirani okvir s imenom skupine ("Prikaz datoteka Metoda sortiranja"); polje bez MSAA imena JAWS ipak čita s natpisom ("Prikaz datoteka Ograniči širinu kratkog pregleda stupaca na: Edit 200"). Gumb "+" uz "Korisnički:" ostao je isključen, nije čut.
  - Ikone: dobro. Kombinirani okviri bez MSAA imena čitaju se s natpisom ("Ikone u glavnom izborniku Combo box 16x16"); kombinirani okviri s poljem za upis čitaju se kao "Edit" ("Veličina ikona Edit 32x32", "Dodatni razmak: Vodoravno Edit 2", "Okomito Edit 1").
  - Fontovi: dobro. Okvir za DPI je isključen (Tab ga preskače). Gumbi "Promijeni font" čitaju se s imenom skupine ("Font za prikaz datoteka Promijeni font").
  - Boje: kombinirani okviri boja imaju ime, ali vrijednost je "0" (boja se ne čita, okvir je iscrtan). Gumbi ">>" uz boje čitaju se "Pregledaj", što autor prihvaća ("pregledaj boje"). PROBLEM: potvrdni okvir bez imena ("check box checked") ispred tipke "Odredi boju prema vrsti datoteke..."; prema položaju uključuje bojanje po vrsti datoteke, a natpis mu je ta tipka desno.
  - Stupci: dobro, osim jednog. Polja tabulatora s imenom skupine ("Tabulatori Veličina Edit 224"); Datum, Vrijeme, Tisućice, Decimale kao "Edit"; Prikaz veličine, U zaglavlju/podnožju, Format datuma s imenom. PROBLEM: kombinirani okvir bez imena ("Combo box hh:mm"), zadnji prije tipke Zadano; stoji desno od "Koristi 12-satni AM/PM format", vjerojatno format vremena; autor: ide u paru s "Format datuma" (oblik datuma i vremena), pa je to format vremena.
  - Kartice mapa: dobro. Polje bez MSAA imena čita se s natpisom ("Zaglavlja kartica mapa Ograniči širinu zaglavlja kartice na: Edit 32"). NEJASNO: odmah nakon "Prikaži ikone na karticama check box checked" ista se kontrola čula još jednom kao "Prikaži ikone na karticama 3 state button checked" (naša zamjena vrste nije djelovala na drugom izgovoru; MSAA ima samo jednu takvu kontrolu), pa ">>" kao "Pregledaj".
  - Vlastiti stupci: dobro. Kombinirani okvir s imenom; popis se čuje samo imenom ("Postavke vlastitih stupaca (poredajte pomoću povuci i ispusti)"), bez vrste i stavke, vjerojatno jer je prazan (tvorničke postavke); tipke Novi, Uredi, Izbriši, Kopiraj.
  - Korisnički prikaz: uglavnom dobro (ime skupine "Korisnički prikazi" ispred kontrola). Popis prikaza bez imena i vrste: čuje se samo stavka i položaj ("<zadano> 1 of 1"). Nakon tipke "Dodaj..." još jednom "<zadano>" (višak). Gumb "+" uz "Dodatni redoslijedi sortiranja" čita se "+ Button"; ">>" kao "Pregledaj". Klizač gore-dolje bez imena: "Korisnički prikazi up down Scroll bar 0 percent".
  - Automatsko prebacivanje: dobro dok je isključeno. Tab ide: potvrdni okvir, "Pravila Dodaj...", "Pravila up down Scroll bar 0 percent" (klizač bez imena); popis pravila Tab nije dotaknuo (vjerojatno prazan ili isključen).
  - Jezik (Language): dobro. Popis jezika s imenom, stavkom i položajem ("7 of 22"); nakon polja "Datoteka glavnog izbornika" još jednom "Hrvatski (Croatian) (WCMD_HR.LNG)" (višak); "&>>" kao "Pregledaj" s prečacem "alt+>".
  - Upravljanje: uglavnom dobro (kombinirani okvir "Izračunaj prostor kojeg zauzimaju podmape" čita se s imenom skupine). PROBLEM: polje broja redaka (4) čita se "Glavni program Edit 4" (ime skupine), a pripada potvrdnom okviru "Dodatni redci ispod kursora:" ispred njega. PROBLEM: u skupini "Spremi pri izlasku iz programa" kontrola "Povijest mapa" čita se kao "Button" (s prečacem alt+m), a ostale u skupini kao "check box". Riješeno (autor): to je stvarno tipka, otvara stranicu Povijest; nije problem.
  - Povijest (provjerena usput, preko tipke "Povijest mapa"): dobro. Polja i tipke s imenom skupine ("Povijest (zadnje posjećene mape) Maksimalni broj stavki za snimanje Edit 200", "Često korištene mape Snimi sada Button").
  - Uređivanje/Pregled: dobro. Sve s imenom skupine ("Preglednik (F3) Vanjski preglednik Edit none", "Uređivač (F4) Uređivač Edit notepad.exe"); ">>" kao "Pregledaj". Kombinirani okvir tipke za vanjski preglednik nosi isto ime "Vanjski preglednik" (vrijednost "Shift+F3"), razumljivo.
  - Kopiranje/Brisanje: dobro. Samo potvrdni okviri s imenom; polja veličine bloka i pogona su isključena (Tab ih preskače).
  - Osvježavanje: dobro. Polja pogona s imenom skupine i natpisom ("Automatsko osvježavanje prilikom pokretanja programa Bez osvježavanja za sljedeće pogone Edit").
  - Brzo traženje: dobro. Izborni gumbi s imenom skupine i položajem, potvrdni okviri s imenom.
  - Oblici podataka (FTP): uglavnom dobro (polja i kombinirani okviri s imenom skupine "FTP"). PROBLEM: polje sekundi čita se "FTP s Edit 30"; MSAA ime je "s" (jedinica desno), a pripada potvrdnom okviru ispred njega "Automatski nastavi prijenos ukoliko nema primljenih podataka za:". Polja PORT načina i datoteke zapisa bila su isključena (Tab ih preskače); "PORT način: koristi samo portove iz ograničenog opsega:" nema prečac.
  - Dodaci/Plugins: dobro. Tipke "Podesi" s imenom skupine ("Dodaci sadržaja (.WDX) Podesi Button"), "Preuzmi".
  - Sličice/Thumbnails: uglavnom dobro. PROBLEMI: (1) polje vlastitih polja čita se "Sličice: općenito Edit" bez natpisa, a pripada potvrdnom okviru ispred njega "Prikazi vlastitih polja ispod sličica (npr. veličina):"; (2) drugo polje veličine čita se "Sličice: općenito x Edit 96" (ime "x", znak između širine i visine); (3) prva dva polja maski čitaju se samo "Učitavanje sličica: Edit ..." bez natpisa; pripadaju potvrdnim okvirima ispred njih "Interne sličice iz slika:" i "Pomoću Preglednikovih dodataka za:". Ostala tri polja maski JAWS čita s natpisom okvira ("Učitavanje sličica: Koristi Eksplorerov način (OLE2) za: Edit").
  - Datoteka zapisnika: dobro dok je zapis isključen (polja isključena, Tab ih preskače).
  - Popis ignoriranja: PROBLEM: veliko polje s popisom čita se samo "edit", bez natpisa, i kad je okvir uključen i kad nije; pripada potvrdnom okviru iznad "Ignoriraj (ne prikazuj) sljedeće datoteke i mape:". "Spremi u Edit" i "Pregledaj" dobro.
  - Sažimanje: dobro. Polja programa s imenom skupine ("ARJ ARJ program Edit arj32.exe"), ">>" kao "Pregledaj"; "Po mogućnosti, upotrijebi unutarnji un-RAR" nema prečac.
  - Zip-program: dobro. Polja stupnja sažimanja i privremene mape čitaju se s imenom skupine ("Stupanj unutarnjeg sažimanja (0-9) Edit 0", "Mapa za privremene datoteke (unutarnji ZIP) Edit"), iako po položaju pripadaju izbornim gumbima "drugo:" i "druga:" ispred njih; razumljivo. "7Z" je potvrdni okvir s imenom.
  - 7-Zip program: dobro ("7-Zip sažimanje Edit 6", kombinirani okviri "Postavke sažimanja ..." s imenom).
  - Razno: PROBLEMI u dijelu "Promijeni tipkovne prečace (remapiranje tipkovnice):": tipka bez imena odmah nakon izbornog gumba "Tipka:" (čuje se samo ime skupine i "Button") i kombinirani okvir bez imena nakon "Win +" (samo ime skupine i "Combo box", prazan). Druge dvije tipke bez teksta bile su isključene. Ostalo dobro.
- Provjera uhom gotova za svih 26 stranica (2026-11-25). Sažetak problema: polje bez natpisa koje pripada potvrdnom okviru ili izbornom gumbu ispred njega (Upravljanje "Dodatni redci ispod kursora:", FTP "Automatski nastavi prijenos...", Sličice vlastita polja i prve dvije maske, Popis ignoriranja); pogrešna imena od jednog znaka ("s", "x"); kontrole bez imena (Boje potvrdni okvir uz "Odredi boju prema vrsti datoteke...", Stupci format vremena, Razno tipka i kombinirani okvir prečaca, Korisnički prikaz popis i klizači gore-dolje); vrijednost boja "0"; višak izgovora ("<zadano>", "Hrvatski (Croatian)"); dvostruki izgovor na Karticama mapa.
- Riješeno 2026-11-25, provjereno uhom: polje bez imena (ili s imenom od jednog znaka) dobiva natpis potvrdnog okvira ili izbornog gumba neposredno lijevo u istom retku, a ako ga nema, onog točno iznad koji se proteže preko polja (TcCheckLabelFor, opće pravilo za TC dijaloge). Upravljanje, FTP, Sličice (vlastita polja, obje maske) i Popis ignoriranja sad se čitaju s natpisom. Polja "x" (Sličice) i "-" (raspon portova) uz sebe imaju polje, a ne okvir, pa ostaju kakva jesu.
- Riješeno 2026-11-25, provjereno uhom: isto pravilo za kombinirani okvir ("Win + Combo box" za tipku prečaca) i za polje u kombiniranom okviru ("Alijas: Edit"); ono ima prednost pred iscrtanim tekstom iznad (koji je ondje bio "Alt + Shift + Win +"); Shift+F5 i dalje kaže "Kopiraj "ime" u". Potvrdni okvir bez natpisa dobiva natpis tipke desno od sebe (Boje: "Odredi boju prema vrsti datoteke..."). Popis bez imena dobiva natpis svoje skupine (Korisnički prikaz: "Korisnički prikazi", pa stavka). Kombinirani okvir bez imena ispod okvira iste širine, s dvotočkom u vrijednosti, zove se "Format vremena" (naša riječ, msgTcTimeFormat).
- Ostaje: vrijednost boja "0"; mala tipka sa slikom iza "Tipka:" na Raznom (u zadanom načinu ne radi ništa vidljivo, svrha nepoznata, bez imena); viškovi izgovora ("<zadano>", "Hrvatski (Croatian)"), dvostruki izgovor na Karticama mapa. JAWS za polje bez MSAA imena često sam uzme natpis s ekrana, pa popis je samo popis sumnjivih mjesta za provjeru uhom.
