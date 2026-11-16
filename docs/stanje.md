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
4. Razmak na mapi: najprije "?" umjesto veličine (TC je još računa), zatim se "selected <stavka>" izgovori dvaput. Drugi razmak ne kaže da je oznaka maknuta, nego samo ponovi redak dvaput.
5. Insert označi i pomakne se na sljedeću stavku, ali ne kaže je li prethodna označena; čuje se samo sljedeća stavka.
6. Insert+Page Down čita statusne trake obiju ploča zaredom. Treba samo aktivnu, ili aktivnu pa drugu, jasno odvojeno.
7. Ctrl+C / Ctrl+X / Ctrl+V: JAWS kaže samo "Copied", "cut", "Pasted", bez broja i imena stavki. Nakon lijepljenja čulo se "Prekinute akcije: 1", porijeklo nepoznato.
8. F5 dijalog: fokus prvo javi "Combo box Total Commander", tj. ime polja je naslov dijaloga, a ne "Copy 1 file(s) to". Potvrdni okviri se javljaju kao "3 state button" umjesto "checkbox".
9. Dijalog prepisivanja: pri otvaranju se čuje samo "Total Commander, Overwrite Button". Ne kaže se koja datoteka ni usporedba veličina i datuma. Insert+B pročita prozor napretka u pozadini, a ne podatke dijaloga prepisivanja.
10. Napredak kopiranja: postoci s više traka izgovaraju se nasumično ("8%, 86%, 0%, 14%"), bez oznake koja je traka (trenutna datoteka ili ukupno). Naslov dijaloga je samo "Total Commander".
11. Insert+F1 daje JAWS-ovu općenitu pomoć za program bez podrške.

### Tehnički podaci iz JAWS-a

- Ctrl+Insert+F1 na popisu: klasa LCLListBox, Control ID i handle su promjenjivi (potvrđuje mjerenje iz Win32).
