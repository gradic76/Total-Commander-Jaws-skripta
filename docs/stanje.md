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
