# Zadaci

Stanje 2026-11-16. Pojedinosti mjerenja su u stanje.md.

## Gotovo

- Prošireni Insert u TC-u označava, numerički ostaje JAWS tipka (TOTALCMD64.jcf).
- Dijalog prepisivanja: sažetak pri otvaranju, Insert+B s putanjama (TOTALCMD64.jss).
- Insert+Q kaže verziju skripte.
- Razvojna instalacija: tools\deploy.ps1.
- Prozor napretka (TDLG2FILEACTION*), provjereno uhom 2026-11-16:
  - automatski postoci su utišani;
  - Insert+Page Down kaže sažetak;
  - Insert+B čita samo retke tog prozora.

- Pakiranje (Alt+F5), provjereno uhom 2026-11-16:
  - dijalog čitljiv; "check box" umjesto "3 state button" (za cijeli TC);
  - "Compression ratio 6 button";
  - napredak je isti prozor TDLG2FILEACTIONMIN, pa Insert+Page Down i Insert+B rade bez izmjena.

## Uz napredak, poslije reda čekanja

- Periodično javljanje napretka provjereno 2026-11-17 na kopiranju od 80 s: svakih 10 % "Total N %, ime datoteke". Ime je ono iscrtano, pa ga TC zna skratiti.
- Dijalozi poruka (TExtMsgForm, npr. predugo ime): pitanje se čita pri otvaranju, Insert+B čita cijeli dijalog. Provjereno uhom 2026-11-17.
- Raspakiranje: dijalog i napredak čitljivi kao i drugdje (autor uhom, 2026-11-16; strukturu nisam mjerio).
- Zasebna cjelina "brbljanje viška": ulazak u popis (Tab, povratak iz dijaloga) čita cijeli redak i "List box <naslov>"; dijalozi ponavljaju naslove; između dijaloga se izgovara cijeli naslov glavnog prozora. Dijalog Pack files pri otvaranju dvaput izgovori polje ("Pack 1 file(s) to the archive Edit" i naziv). Provjeriti i druge dijaloge.
- Move (F6): prema autoru isti prozor napretka kao Copy i Delete, i Delete se dobro čitao. Uzgred potvrditi i Insert+Page Down.
- Red čekanja: Tab spor zbog TC-a (vidi stanje.md). U dokumentaciju upisati kao poznato ograničenje i savjetovati Foreground.

## Sljedeće, ovim redom

1. Pozadinsko kopiranje (Background) i red čekanja (F2 Queue): izmjeriti i riješiti.
2. Označavanje, gotovo 2026-11-17 i provjereno uhom: "selected ime" (JAWS sam umeće "selected"), "Not Selected ime" pri micanju; Insert kaže "selected ime" pa sljedeću stavku. Ostaje:
   - razmak na mapi: riješeno 2026-11-17. Izvor je bio FocusChangedEventEx za istu stavku (TC prepisuje redak); sada se kaže samo nova veličina. Provjereno na izračunatoj mapi; izgovor veličine na neizračunatoj mapi još treba čuti.
3. Popis datoteka:
   - gotovo 2026-11-17, provjereno uhom: strelice čitaju samo ime, mape bez oznake kao u Exploreru (odluka 2026-11-17), a "<DIR>" se čuje na Insert+strelica gore; Insert+strelica gore čita cijeli redak i položaj;
   - kraći ulazak u popis (Tab, Alt+Tab): još čita cijeli redak;
   - putanja bez "*.*".
4. Insert+Page Down čita samo statusnu traku aktivne ploče.
5. F5 dijalog:
   - ime polja je naslov dijaloga, a ne "Copy 1 file(s) to";
   - potvrdni okviri se javljaju kao "3 state button".
6. Vlastita pomoć na Insert+F1.
7. Hrvatski .jsm u mapi jezika JAWS-a (odluka 2026-11-17: poruke prate jezik JAWS-a). Provjeriti naziv mape za hrvatski.
8. Instalacijski program (Inno Setup):
   - po izboru postavlja naše preporučene TC postavke (ini). U njima je ekstenzija uz ime, jer skripta ime uzima iz prvog stupca. Zaseban stupac ekstenzije skripta zasad ne podržava;
   - u .jcf upisuje samo potrebne retke, ne prepisuje datoteku;
   - instalira u sve verzije JAWS-a od 2025 nadalje, u korisničku mapu.
9. README i dokumentacija.

## Kasnije

- Mogućnost: kratki zvuk za mape na strelicama (ako se pokaže potreba).
- Usporedba datoteka u dijalogu prepisivanja ("nova je veća i novija"). Za to treba čitati format datuma.
- Ostali prikazi, Lister (F3), arhive, FTP, višestruko preimenovanje, usporedba mapa.
