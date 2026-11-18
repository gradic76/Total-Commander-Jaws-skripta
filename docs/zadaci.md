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

- Izbornici: "selected" uklonjen (IndicateSelected=0), provjereno uhom 2026-11-17. Točkice izbora se ne čuju jer ih TC samo iscrtava (vidi stanje.md). Mogućnosti: JAWS kursor (proba u tijeku), zamoliti autora TC-a da postavi MFS_CHECKED.

## Uz napredak, poslije reda čekanja

- Periodično javljanje napretka provjereno 2026-11-17 na kopiranju od 80 s: svakih 10 % "Total N %, ime datoteke". Ime je ono iscrtano, pa ga TC zna skratiti.
- Izbornik pogona (Alt+F1/F2): "e Glazba", "f BD-ROM pogon", "Ovaj PC", "Dokumenti", "Mreža", s imenima iz Windows ljuske. Provjereno uhom 2026-11-17.
- "..": kaže i kamo vodi, npr. ".. Sređivanje", ".. Ovaj PC" (pogoni i virtualne mape). Provjereno uhom u obje ploče, s karticama i bez.
- Alt+Shift+S (veličina) i Alt+Shift+D (datum) u popisu, provjereno uhom 2026-11-17. Obitelj Alt+Shift+slovo, podložno promjeni.
- Dijalozi poruka (TExtMsgForm, npr. predugo ime; TCheckMsgBox, npr. kopiranje iz virtualne mape kao "\\Preuzimanja"): pitanje se čita pri otvaranju, Insert+B čita cijeli dijalog. Provjereno uhom 2026-11-17.
- Raspakiranje: dijalog i napredak čitljivi kao i drugdje (autor uhom, 2026-11-16; strukturu nisam mjerio).
- Cjelina "brbljanje viška", snimke A (kretanje) i B (dijalozi) 2026-11-18. Odluka autora: naslov glavnog prozora skraćen na "Total Commander" pri ulasku u TC i pri povratku iz dijaloga (provjereno uhom); F7 (TCOMBOINPUT) bez "Combo box Total Commander" (provjereno). Dugi naslov u Windowsovom popisu za Alt+Tab nije naš; ulazak u ploču (Tab, Alt+Tab, povratak iz dijaloga i izbornika) sada kaže samo "LEFT"/"RIGHT", ime i položaj (odluka i provjera uhom 2026-11-18); ostaje kako JAWS govori: izbornik pogona "Combo box, e" pa "e Glazba". Snimka C (izbornici) je čista. Otvoreno: na F5/F7/Alt+F5 prije dijaloga "selected ime" (TC privremeno označi stavku) - autor odlučuje. Dijalog Pack files pri otvaranju dvaput izgovori polje ("Pack 1 file(s) to the archive Edit" i naziv). Provjeriti i druge dijaloge.
- Move (F6): prema autoru isti prozor napretka kao Copy i Delete, i Delete se dobro čitao. Uzgred potvrditi i Insert+Page Down.
- Red čekanja: Tab spor zbog TC-a (vidi stanje.md). U dokumentaciju upisati kao poznato ograničenje i savjetovati Foreground.

## Sljedeće, ovim redom

1. Pozadinsko kopiranje (Background) i red čekanja (F2 Queue): izmjeriti i riješiti.
2. Označavanje, gotovo 2026-11-17 i provjereno uhom: "selected ime" (JAWS sam umeće "selected"), "Not Selected ime" pri micanju; Insert kaže "selected ime" pa sljedeću stavku. Ostaje:
   - razmak na neizračunatoj mapi: JAWS i dalje izgovori cijeli redak s "?", pa s izračunatom veličinom. NIJE riješeno. Izmjereno: FocusChangedEventEx za istu stavku stiže (nChild == nPrevChild, isti prozor), ali redak ne izgovara on; nisu ni ValueChanged, NameChanged, Description, HighLighted ni skripta za razmak (nije vezana). Vjerojatno unutarnja obrada JAWS-a. Ide u cjelinu "brbljanje viška".
3. Popis datoteka:
   - gotovo 2026-11-17, provjereno uhom: strelice čitaju samo ime, mape bez oznake kao u Exploreru (odluka 2026-11-17), a "<DIR>" se čuje na Insert+strelica gore; Insert+strelica gore čita cijeli redak i položaj;
   - kraći ulazak u popis (Tab, Alt+Tab): još čita cijeli redak;
   - putanja bez "*.*".
4. Gotovo 2026-11-17, provjereno uhom: Insert+Page Down u popisu čita samo statusnu traku aktivne ploče (i s karticama). Alt+Shift+S kaže samo veličinu stavke na fokusu (odluka: svaka tipka jedno).
5. F5 dijalog (TInpComboDlg), gotovo 2026-11-17 i provjereno uhom: pri otvaranju samo polje s natpisom (bez "Combo box Total Commander"), Insert+B čita cijeli dijalog. Ostaje:
   - zbroj "7,75 M 4 1": brojevi datoteka i mapa nemaju oznaku (na ekranu su ikone). Treba dvije riječi u .jsm ili oznake grafika;
   - TInpComboDlg vjerojatno koriste i drugi dijalozi s poljem (npr. F7): provjeriti da im ne nedostaje najava.
6. Vlastita pomoć na Insert+F1.
7. Hrvatski .jsm u mapi jezika JAWS-a (odluka 2026-11-17: poruke prate jezik JAWS-a). Provjeriti naziv mape za hrvatski.
8. Instalacijski program (Inno Setup):
   - po izboru postavlja naše preporučene TC postavke (ini). U njima je ekstenzija uz ime, jer skripta ime uzima iz prvog stupca. Zaseban stupac ekstenzije skripta zasad ne podržava;
   - u .jcf upisuje samo potrebne retke, ne prepisuje datoteku;
   - instalira u sve verzije JAWS-a od 2025 nadalje, u korisničku mapu.
9. README i dokumentacija.

## Kasnije

- Mogućnost: kratki zvuk za mape na strelicama (ako se pokaže potreba).
- Ideje iz NVDA dodatka extendedTotalCmd (GPL-2.0, uzimamo samo ideje, ne kod):
  - Alt+Shift+P: GOTOVO 2026-11-17, provjereno uhom u obje ploče, u Dokumentima i na Ovaj PC ("\\Ovaj PC", ostaje TC-ov oblik). Potvrda kopiranja je JAWS-ova poruka "Copied" (cmsg52_S);
  - tipka za aktivnu ploču;
  - ime trenutne kartice mape;
  - zvuk na početku i kraju popisa;
  - javljanje kod Ctrl+A i micanja svih oznaka;
  - tonovi dok traje izračun veličine mape.
- Usporedba datoteka u dijalogu prepisivanja ("nova je veća i novija"). Za to treba čitati format datuma.
- Ostali prikazi, Lister (F3), arhive, FTP, višestruko preimenovanje, usporedba mapa.
