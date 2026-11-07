# Total Commander Jaws skripta

JAWS skripte koje slijepim korisnicima JAWS for Windows omogućuju i olakšavaju rad u Total Commanderu.

## Osnovno

- Vrsta: skripta (JAWS application scripts) s instalacijskim programom
- Jezik rada i oslovljavanje: hrvatski, na ti; kod, komentari i commit poruke na engleskom
- Tehnologija: JAWS Scripting Language (.jss, .jsh, .jsm, .jkm, .jcf)
- Ciljna okolina: JAWS 2025 i noviji, Total Commander 64-bit (TOTALCMD64.EXE), bilo koji jezik sučelja TC-a
- Korisnici: autor i drugi korisnici JAWS-a, zato sve mora raditi univerzalno, bez pretpostavki o jednom računalu
- Pristupačnost: sve (skripte, instalacijski program, dokumentacija) mora biti potpuno upotrebljivo s JAWS-om
- NVDA: nije cilj ovog projekta; za NVDA već postoji dodatak
- Licenca: MIT
- Git: GitHub, javni repozitorij Total-Commander-Jaws-skripta, glavna grana main

## Pravila rada

- Ne pretpostavljaj nazive klasa prozora, ID-ove kontrola ni ponašanje TC-a: provjeri na stvarnom programu (ili pitaj korisnika da provjeri s JAWS-om) i zapiši nalaz.
- Poruke koje skripta izgovara nikad ne piši izravno u kod: idu u .jsm datoteke po jeziku, ili se čitaju iz TC lokalizacije.
- Ne mijenjaj korisnikov postojeći wincmd.ini bez izričitog pristanka.
- Sve što se doda mora biti dokumentirano u README i u pomoći skripte (Insert+F1).

## Plan

### Ciljevi

1. Rad u Total Commanderu s JAWS-om bez gubljenja informacija: uvijek se zna gdje si, što je fokusirano i što je označeno.
2. Pouzdane osnovne radnje upravitelja datoteka: kretanje po mapama, označavanje, kopiranje, izrezivanje, lijepljenje, premještanje, brisanje.
3. Poruke na jeziku sučelja TC-a, koliko god je moguće preuzete iz TC lokalizacije.
4. Jednostavna instalacija za druge korisnike, uz po izboru unaprijed podešeno pojednostavljeno sučelje TC-a.

### Faza 0: snimka zatečenog stanja (prije pisanja koda)

- Proći TC 64-bit s JAWS-om 2025 bez ikakvih skripti i zapisati što se čita dobro, loše ili nikako: popis datoteka u Full prikazu, prijelaz između ploča, putanja, statusna traka, F5/F6 dijalozi, napredak kopiranja, dijalog prepisivanja, brisanje, Ctrl+C/X/V, izbornici, gumbna traka, naredbeni redak.
- Zapisati klase prozora i strukturu (JAWS Utility mode, Insert+F1 / Ctrl+Insert+F1).
- Pogledati NVDA dodatak za TC radi popisa problema koje rješava (samo ideje, ne kopirati kod).
- Rezultat: datoteka docs/stanje.md i konačan popis za prvo izdanje.

### Prvo izdanje (0.1)

1. Prepoznavanje TC 64-bit glavnog prozora i lijeve/desne ploče.
2. Popis datoteka, Full prikaz: strelice čitaju ime (i stanje "označeno" ako je označeno); Insert+strelica gore čita cijeli redak s detaljima (ime, vrsta, veličina, datum, atributi).
3. Označavanje (Insert, razmak, Num +, Num -, Ctrl+A): izgovor stanja i broja označenih.
4. Prijelaz između ploča (Tab) i ulazak u mapu: izgovor aktivne ploče i trenutne mape.
5. Ctrl+C, Ctrl+X, Ctrl+V: potvrda što je stavljeno u međuspremnik ili zalijepljeno.
6. F5, F6, F8 i dijalozi koji iz njih proizlaze (potvrda, prepisivanje, napredak): čitljivi i upotrebljivi.
7. Statusna traka (broj i veličina označenih) dostupna na JAWS-ovu standardnu naredbu za statusnu traku.
8. Nove prečace dodajemo samo tamo gdje faza 0 pokaže potrebu.
9. Poruke na engleskom i hrvatskom (.jsm), uz izbor prema jeziku TC sučelja; tekstove iz TC .lng datoteke koristiti gdje je moguće.
10. Instalacijski program: pronalazi instalirane verzije JAWS-a 2025+, kopira i kompajlira skripte u korisničke postavke te verzije; po izboru postavlja pojednostavljene TC postavke.
11. README (hrvatski i engleski) i pomoć skripte.

### Kasnije (nakon 0.1)

- Ostali prikazi popisa (Brief, Thumbnails, stablo).
- Pregled datoteka (F3/Lister), arhive, FTP, višestruko preimenovanje, usporedba i sinkronizacija mapa.
- TC 32-bit, ako bude potrebe.
- Dodatni jezici poruka.

### Otvorena pitanja

1. Točna verzija TC-a (11.x?) i od koje verzije podržavamo.
2. Kako čitati TC lokalizaciju: format .lng datoteka, gdje TC zapisuje odabrani jezik (wincmd.ini, LanguageIni) i koliko se tekstova može koristiti u skripti. Treba provjeriti.
3. Što kad za jezik TC-a nema .jsm prijevoda: zadano engleski?
4. Naziv mape jezika za hrvatski u JAWS-u (lokalizacija nije službena): provjeriti na tvojoj instalaciji.
5. Pojednostavljene TC postavke: prijedlog je zaseban ini koji TC dobiva parametrom /i= preko vlastitog prečaca, tako da se korisnikov wincmd.ini ne dira. Koje postavke točno (jedan ili dva profila)?
6. Alat za instalacijski program: prijedlog Inno Setup (besplatan, čitljiv s JAWS-om, podržava hrvatski i engleski). Treba potvrditi da se kompajliranje skripti (scompile.exe) može pouzdano pozvati iz njega.
7. Tko testira na drugim računalima i verzijama JAWS-a prije objave.
