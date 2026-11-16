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

## Uz napredak, poslije reda čekanja

- Alt+F5 (pakiranje) i Alt+F6 (raspakiranje): vjerojatno drugi prozori, izmjeriti.
- Move (F6): prema autoru isti prozor napretka kao Copy i Delete, i Delete se dobro čitao. Uzgred potvrditi i Insert+Page Down.
- Red čekanja: Tab spor zbog TC-a (vidi stanje.md). U dokumentaciju upisati kao poznato ograničenje i savjetovati Foreground.

## Sljedeće, ovim redom

1. Pozadinsko kopiranje (Background) i red čekanja (F2 Queue): izmjeriti i riješiti.
2. Označavanje:
   - razmak dvaput kaže "selected" i ne javlja micanje oznake;
   - Insert ne kaže ništa o upravo označenoj stavci (što reći, još je otvoreno);
   - na mapi se čuje "?" dok TC računa veličinu.
3. Popis datoteka:
   - strelice čitaju samo ime, uz "mapa" za mape;
   - Insert+strelica gore čita cijeli redak;
   - kraći ulazak u popis;
   - putanja bez "*.*".
4. Insert+Page Down čita samo statusnu traku aktivne ploče.
5. F5 dijalog:
   - ime polja je naslov dijaloga, a ne "Copy 1 file(s) to";
   - potvrdni okviri se javljaju kao "3 state button".
6. Vlastita pomoć na Insert+F1.
7. Odabir jezika poruka prema jeziku TC-a (.jsm en i hr).
8. Instalacijski program (Inno Setup):
   - u .jcf upisuje samo potrebne retke, ne prepisuje datoteku;
   - instalira u sve verzije JAWS-a od 2025 nadalje, u korisničku mapu.
9. README i dokumentacija.

## Kasnije

- Usporedba datoteka u dijalogu prepisivanja ("nova je veća i novija"). Za to treba čitati format datuma.
- Ostali prikazi, Lister (F3), arhive, FTP, višestruko preimenovanje, usporedba mapa.
