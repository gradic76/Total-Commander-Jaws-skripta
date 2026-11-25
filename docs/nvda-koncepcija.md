# NVDA dodatak za Total Commander: koncepcija

Nacrt 2026-11-25. Izvori: ovaj projekt (stanje.md, zadaci.md, jaws-referenca.md, kod u src), Skladište (protokoli, alat za mjerenje NVDA-a u Sandboxu) i pregled dodatka extendedTotalCMD 4.1 koji je instaliran u Gordanovoj kopiji NVDA-a (samo pregled značajki, kod se ne preuzima). Što nije provjereno, tako je i označeno.

## 1. Polazište i preporuka

- Za NVDA već postoji dodatak extendedTotalCMD (Eugene Poplavsky, GPL-2.0, verzija 4.1, testiran do NVDA 2026.1). Gordan ga koristi. Pokriva popis datoteka (stupci s naslovima, položaj, veličina, datum, putanja, aktivna ploča, ime kartice, označene stavke), izbornik pogona, kartice, okvire poruka, dijalog prepisivanja i FTP popis. Koristi TC-ovo interno sučelje WM_USER+50.
- Ne pokriva ono što smo za JAWS napravili poslije osnova: Lister (načini, traženje, mediji), usporedbu po sadržaju, usklađivanje mapa, višestruko preimenovanje, stablo mapa sa stanjem grana, prozor napretka, opća pravila za TC-ove dijaloge (natpisi po položaju, ">>", Insert+B), Konfiguraciju (natpisi, boje, format vremena), viškove izgovora, poruke na 21 jeziku i pomoć.
- NVDA za jedan program učitava jedan appModule. Dva dodatka za totalcmd64 ne mogu raditi zajedno, pa bi naš dodatak zamijenio extendedTotalCMD, a ne nadogradio ga.
- Preporuka: vlastiti dodatak kao novi projekt (npr. "Total Commander NVDA dodatak"), koji prenosi znanje o TC-u iz JAWS projekta, a ne JAWS kod. Ideje iz extendedTotalCMD smiju se uzeti, kod ne (ista odluka kao za JAWS). Alternativa je ponuditi doprinose autoru extendedTotalCMD-a; to je sporije i ovisi o njemu, pa je ne preporučujem kao glavni put.
- Napomena: CLAUDE.md ovog projekta kaže da NVDA nije cilj ovog projekta. Zato novi projekt, a ne grana ovog.

## 2. Što se prenosi bez izmjene: znanje o Total Commanderu

To je najvrjedniji dio, jer vrijedi za svaki čitač i skupo je stečeno mjerenjem.

Prozori i klase (TC 11.56, 64-bit):
- glavni prozor TTOTAL_CMD; ploče su LCLListBox (Lazarus), redak stavke je MSAA ime s tabulatorima između stupaca; zaglavlje stupaca je iscrtano;
- ".." je stavka popisa, pa TC-ov položaj treba umanjiti za jedan;
- stablo (Ctrl+F8, Alt+F10) je isti LCLListBox, stavke su pune putanje; TC ne daje stanje grane, pa ga treba voditi sam (pravila u zadaci.md);
- statusna traka ploče daje broj i veličinu označenih; kad je TC viši od ekrana, traka je ispod ruba i bez teksta;
- FTP: putanje s "/", redak pogona je URL;
- dijalozi: TInpComboDlg (F5, F6, F7), TCheckComboBox (Shift+F5), TOverWriteForm (prepisivanje), TDLG2FILEACTION* (napredak), TExtMsgForm i TCheckMsgBox (poruke), TFindFile, TMultiRename, TCmpForm i TSyncStartForm (usklađivanje), TFileCompForm (usporedba), TLister, TDLGZIP, TDLGUNZIPALL, TCONNECT (FTP), TDLGCONFIGALL (Konfiguracija);
- Lister nema podređenih prozora, tekst je iscrtan; mediji imaju dva msctls_trackbar32;
- usporedba: ploče su iscrtane, trenutna razlika je samo tanak okvir, čita se u načinu Uređivanje po kursoru;
- usklađivanje: redak rezultata ima TC-ove kodove (EQ, UNEQ, UNKNOWN, "L to R", "R to L", strana L, R, 2), gumbi "Pokaži" su iscrtani i prebacuju se s Ctrl+Shift+L, E, N, R, D, S;
- Konfiguracija: 26 stranica, većina kontrola ima MSAA ime; kontrola bez imena dobiva natpis po položaju (okvir lijevo ili iznad, tipka desno od okvira, skupina za popis, okvir iste širine iznad za format vremena); okviri boja daju samo broj, paleta 1 do 16 je izmjerena, 0 je "zadano", zadnja je prazna;
- TC i njegov pokretač mogu raditi s administratorskim pravima; tada im se izvana smije slati poruka samo iz povišenog procesa (izmjereno);
- naredbe TC-a: WM_USER+51 s brojem iz TOTALCMD.INC (npr. 490 Konfiguracija); WM_USER+50 vraća ručke i brojeve (extendedTotalCMD ga koristi; iz vanjskog procesa vratio je nule, vjerojatno zbog prava).

Pravila ponašanja (odluke autora, vrijede i za NVDA):
- strelice u ploči: samo ime; mape bez oznake; ".." kaže kamo vodi; položaj bez "..";
- označavanje: stanje i broj označenih iz statusne trake; broj označenih nakon povratka iz dijaloga;
- natpisi iz TC-a, vrste i stanja iz čitača, vlastitih riječi što manje;
- utišati ponovno iscrtavanje (redak popisa kad fokus ode, putanja ploče, sadržaj napretka), a važno ponuditi na tipku;
- jedna tipka, jedan podatak; pomoć u obliku "tipka: što radi";
- zvukovi tamo gdje nema što reći (početak i kraj popisa, ponovno čitanje ploče), izabrani uhom;
- hrvatski je izvorni jezik poruka, rječnik u Skladiste\protokoli\rjecnik.md;
- TC-ovi nazivi za prikaze, sortiranje i Listerove načine iz TC-ovih jezičnih datoteka (tools\tc-terms.ps1).

Tekstovi: 84 poruke na 21 jeziku (src\TOTALCMD64.*.ini) prenose se u NVDA-ov oblik (gettext .po), osim poruka koje su JAWS-specifične (Insert tipke, Quick Settings).

## 3. Što se ne prenosi ili se radi drukčije

- Insert tipke: i NVDA koristi Insert kao svoju tipku. NVDA ima postavke "numerički Insert kao NVDA tipka" i "prošireni Insert kao NVDA tipka" (config.conf, odjeljak keyboard). Dodatak ih može privremeno promijeniti dok je TC u fokusu i vratiti kad fokus ode (događaji appModulea). To je čišće nego kod JAWS-a, gdje smo pisali u .jcf i ponovno učitavali postavke. Dvostruki pritisak NVDA daje izravno (broj ponavljanja skripte). Nije isprobano.
- Postavke: umjesto Quick Settings, ploča u NVDA-ovim Postavkama. Ondje se stavka može isključiti ili sakriti dok je dijalog otvoren, pa nestaje JAWS-ov problem s "Inactive" koji se osvježava tek pri ponovnom otvaranju.
- Jezik poruka: NVDA dodaci po pravilu prate jezik NVDA-a. Predlažem to umjesto posebne postavke jezika (kod JAWS-a smo je uveli jer JAWS nema hrvatsku lokalizaciju; NVDA je ima).
- Iscrtani tekst: JAWS ima off-screen model (GetTextInRect, GetChunk). NVDA ima svoj model prikaza za GDI tekst (displayModel), a za ostalo OCR (Windowsov, ugrađen u NVDA). Radi li NVDA-ov model prikaza za Lazarusove iscrtane tekstove u 64-bitnom TC-u, nije izmjereno; to je prvo pitanje faze 0.
- Imena boja: NVDA ima svoj popis imena boja, na svom jeziku.
- Tipke: NVDA+slovo je zauzeto drukčije nego Insert+slovo kod JAWS-a. Obitelj Alt+Shift (stupci, putanja, aktivna ploča) vjerojatno može ostati; provjeriti sukobe s NVDA-om i extendedTotalCMD-om (koji korisnici već znaju).
- Ispitivanje: kod JAWS-a test je Gordanova povijest govora. Za NVDA postoji alat Skladiste\alati\sandbox\nvda.ps1: Gordanova kopija NVDA-a u Windows Sandboxu, tipke iz datoteke koraka i doslovan ispis govora. Tako mogu velik dio provjera napraviti sam, a Gordan presuđuje uhom na kraju. Za razvoj treba posebna kopija NVDA-a, jer se Gordanova kopija ne mijenja.

## 4. Arhitektura (prijedlog)

- appModule za totalcmd64 (ime modula prema imenu programa), u njemu odabir klasa po prozoru (chooseNVDAObjectOverlayClasses), po jedna cjelina za: ploču i stablo, dijaloge (opća pravila), napredak, prepisivanje, Lister, usporedbu, usklađivanje, višestruko preimenovanje, Konfiguraciju, FTP.
- Zajednički dio: čitanje statusne trake, natpisi po položaju, čitanje iscrtanog teksta, TC naredbe, zvukovi.
- Poruke kroz gettext (_()), prijevodi kao .po po jeziku; hrvatski izvorni.
- Pomoć: NVDA dodaci imaju dokumentaciju (readme.html po jeziku), što se poklapa s planiranim HTML priručnikom; isti izvor teksta može služiti oboma.
- Pakiranje: .nvda-addon (zip s manifest.ini), predložak NV Accessa za dodatke (scons). Python verzija ovisi o NVDA-u (2026.x); provjeriti prije početka.
- Licenca: NVDA je GPL-2.0; za dodatke u Add-on Storeu traži se licenca usklađena s GPL-om (provjeriti uvjete). MIT je s GPL-om usklađen; odluka je Gordanova.

## 5. Faze

0. Snimka zatečenog stanja: TC (kopija s tvorničkim postavkama) s NVDA-om bez dodatka i s extendedTotalCMD, u Sandboxu, prema popisu iz JAWS faze 0. Ishod: što NVDA sam radi dobro, što extendedTotalCMD rješava, gdje su rupe; i radi li NVDA-ov model prikaza za iscrtani tekst.
1. Ploča i stablo: ime, "..", položaj, označavanje, broj označenih, stupci, putanja, aktivna ploča, zvukovi.
2. Opća pravila za dijaloge, napredak, prepisivanje, poruke.
3. Lister, usporedba, usklađivanje, višestruko preimenovanje, FTP.
4. Konfiguracija.
5. Postavke (Insert tipke), pomoć, prijevodi, pakiranje, objava.

Svaka faza: mjerenje u Sandboxu (moj ispis), pa Gordanovo uho, pa commit.

## 6. Odluke (Gordan, 2026-11-25)

1. Vlastiti dodatak, kao novi projekt (NVDA projekt, zaseban od JAWS projekta). Duh je JAWS skripte: sveobuhvatno, a ne samo ploča i nekoliko prečaca, koliko po Gordanovu testiranju radi extendedTotalCMD.
2. Prečaci: što više istih kao u JAWS skripti, da korisnici lako prelaze s jednog čitača na drugi. Naše tipke (Alt+Shift obitelj, Alt+broj, Alt+Shift+P, Alt+Shift+A...) ostaju iste. JAWS-ove standardne naredbe koje skripta proširuje (Insert+B čitanje prozora, Insert+Page Down statusna traka, Insert+H, Insert+F1) dobivaju NVDA-ove ekvivalente gdje NVDA ima svoju naredbu za isto (npr. statusna traka NVDA+End), a raspored se dokumentira usporedno za oba čitača.
3. Objava na GitHubu; NVDA Add-on Store nije prioritet.
4. Kopija NVDA-a u D:\Claude\Alati\NVDA je Claudeova radna kopija: dodatak extendedTotalCMD smije se onemogućiti ili ukloniti. Prijedlog: onemogućiti, ne ukloniti, jer faza 0 mjeri i s njim i bez njega.
5. Jezik poruka prati NVDA (NVDA ima naše jezike). Licenca GPL-2.0, kao NVDA; distribucija je besplatna.
6. Projekt je otvoren 2026-11-25: D:\Claude\Total Commander NVDA dodatak, gdje se koncepcija dalje vodi (docs\koncepcija.md).
