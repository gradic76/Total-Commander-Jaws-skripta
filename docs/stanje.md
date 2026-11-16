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

## Kako JAWS čita (popunjava autor)

Za svaku točku zapiši doslovno što JAWS kaže.

1. Popis datoteka, strelice gore i dolje:
2. Insert+strelica gore na stavci:
3. Ulazak u mapu (Enter) i povratak (Backspace):
4. Tab na drugu ploču:
5. Označavanje (Insert, razmak), pa Insert+strelica gore:
6. Statusna traka (Insert+Page Down):
7. Naslov prozora (Insert+T):
8. Ctrl+C, Ctrl+X, Ctrl+V:
9. F5 na datoteci: dijalog kopiranja, Tab kroz sve kontrole:
10. Kopiranje na mjesto gdje datoteka već postoji: dijalog prepisivanja:
11. Kopiranje veće mape: prozor napretka:
12. F8 i Delete: potvrda brisanja:
13. F10 i izbornici:
14. Ctrl+Insert+F1 / Insert+F1 na popisu datoteka:
