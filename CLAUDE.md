# Total Commander Jaws skripta

JAWS skripte koje slijepim korisnicima JAWS for Windows omogućuju i olakšavaju rad u Total Commanderu.

## Osnovno

- Vrsta: skripta (JAWS application scripts) s instalacijskim programom
- Jezik rada i oslovljavanje: hrvatski, na ti; kod, komentari i commit poruke na engleskom
- Tehnologija: JAWS Scripting Language (.jss u dijelovima TOTALCMD64_*.jss uključenima u TOTALCMD64.jss, .jsh, .jsm, .jkm, .jcf, .qs/.qsm za Quick Settings, jezične datoteke TOTALCMD64.<jezik>.ini)
- Ciljna okolina: JAWS 2025 i noviji, Total Commander 64-bit (TOTALCMD64.EXE), bilo koji jezik sučelja TC-a
- Korisnici: autor i drugi korisnici JAWS-a, zato sve mora raditi univerzalno, bez pretpostavki o jednom računalu
- Pristupačnost: sve (skripte, instalacijski program, dokumentacija) mora biti potpuno upotrebljivo s JAWS-om
- NVDA: nije cilj ovog projekta; za NVDA već postoji dodatak
- Licenca: MIT
- Git: GitHub, javni repozitorij Total-Commander-Jaws-skripta, glavna grana main

## Pravila rada

- Ne pretpostavljaj nazive klasa prozora, ID-ove kontrola ni ponašanje TC-a: provjeri na stvarnom programu (ili pitaj korisnika da provjeri s JAWS-om) i zapiši nalaz.
- Prepoznavanje ide po strukturi i znakovima, nikad po riječima:
  - prozore i kontrole prepoznaj po klasi, roditelju, strukturi i položaju;
  - podatke unutar teksta prepoznaj po znakovima (tabulator, %, " / ", \, zarez, "<");
  - natpise koje treba izgovoriti uzmi iz samog TC-a, jer tako prate jezik TC-a;
  - vrste i stanja kontrola prepusti JAWS-u (IndicateControlType, IndicateControlState), jer tako prate jezik JAWS-a.
- Vlastitih riječi neka bude što manje. Idu samo u .jsm (engleski, ugrađen kao rezerva) i u jezične datoteke TOTALCMD64.<jezik>.ini (UTF-8 s BOM-om), nikad u kod. Jezik bira korisnik u Quick Settings (odluka 2026-11-24), jer JAWS bez lokalizacije (hrvatski) koristi mapu enu.
- U tekstovima koje korisnik čuje ili čita (pomoć, README) JAWS tipka se zove "Insert", a ne "JAWSKey". Nazive tipki skripta slaže sama (GetScriptKeyName, uz zamjenu JAWSKey u Insert), a ne preko %KeyFor (odluka 2026-11-18).
- Insert tipke (odluka 2026-11-25, umjesto profila A/B): u Quick Settings "Selection key" (Extended Insert, Numeric Insert, Both, None) i "Usage" (Single press, Double press). Skripta ih primjenjuje dok TC ima fokus (SetJCFOption OPT_INSERT_KEY_MODE). Zadano: Extended Insert, Single press. Numerička tipkovnica nije naša stvar.
- Skripta mora raditi s tvorničkim postavkama TC-a. Razvoj i testovi idu na kopiji s tvorničkim postavkama (D:\TotalCommanderPortable(OS)). Installer TC-ove postavke ne dira; preporučene postavke su samo neobavezna preporuka, ako uopće zatrebaju (odluka 2026-11-18).
- Ne mijenjaj korisnikov postojeći wincmd.ini bez izričitog pristanka.
- Sve što se doda mora biti dokumentirano u README i u pomoći skripte (Insert+F1).

## Radni postupak

- Instalacija za razvoj: `tools\deploy.ps1`. Kopira TOTALCMD64.*, dijelove TOTALCMD64_*.jss, jezične datoteke i .qs/.qsm u korisničku JAWS 2025 mapu (enu), upisuje samo naše retke u .jcf i prevodi. Dopušteno bez pitanja za TOTALCMD64*. Engleska jezična datoteka radi se iz .jsm: `tools\make-english-ini.ps1`.
- Izmijenjenu .jkm JAWS učitava tek nakon ponovnog pokretanja; .jsb već pri povratku u TC.
- Test izgovora: autor obriše povijest govora (Insert+Razmak, Shift+H), napravi test, kopira je (Insert+Razmak, Ctrl+H), a Claude čita međuspremnik. Izvor govora traži se probnom verzijom s oznakama (`deploy.ps1 -SourceDir` iz privremene mape).
- Mjerenje prozora izvana (PowerShell, Win32/UIA/MSAA, snimke). Paziti: prozor razgovora prekriva desni dio TC-a, pa ondje JAWS-ov off-screen model nema teksta.
- Stanje i odluke: docs\zadaci.md (popis), docs\stanje.md (mjerenja), docs\jaws-referenca.md (pouke o JAWS skriptiranju).

## Plan

### Ciljevi

1. Rad u Total Commanderu s JAWS-om bez gubljenja informacija: uvijek se zna gdje si, što je fokusirano i što je označeno.
2. Pouzdane osnovne radnje upravitelja datoteka: kretanje po mapama, označavanje, kopiranje, izrezivanje, lijepljenje, premještanje, brisanje.
3. Što manje ovisnosti o jeziku: TC-ovi natpisi prate jezik TC-a, a naše malobrojne poruke jezik JAWS-a (odluka 2026-11-17).
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
9. Poruke i pomoć na 21 jeziku (jezične datoteke; gotovi en, hr, sr), pomoć u obliku "tipka: što radi" (autor), cijeli priručnik kao HTML po jeziku (dvostruki Insert+F1).
10. Instalacijski program: pronalazi instalirane verzije JAWS-a 2025+, kopira i kompajlira skripte u korisničke postavke te verzije; nudi jezik (combo, unaprijed postavljen) i postavke Insert tipki; TC-ove postavke ne dira.
11. README (hrvatski i engleski) i pomoć skripte.

### Kasnije (nakon 0.1)

- Ostali prikazi popisa (Brief, Thumbnails, stablo).
- Pregled datoteka (F3/Lister), arhive, FTP, višestruko preimenovanje, usporedba i sinkronizacija mapa.
- TC 32-bit, ako bude potrebe.
- Dodatni jezici poruka.

### Otvorena pitanja

1. Točna verzija TC-a (11.x?) i od koje verzije podržavamo.
2. Riješeno 2026-11-17: TC .lng se ne čita. Natpisi se uzimaju s ekrana, a poruke prate jezik JAWS-a.
3. Riješeno 2026-11-24: jezik je postavka u Quick Settings, a bez prijevoda ključa vrijedi ugrađeni engleski.
4. Naziv mape jezika za hrvatski u JAWS-u (lokalizacija nije službena): provjeriti na tvojoj instalaciji.
5. Riješeno 2026-11-18: skripta radi s tvorničkim postavkama TC-a; installer ih ne dira. Preporučene postavke (npr. TitleExtraText) samo kao neobavezna preporuka u dokumentaciji.
6. Alat za instalacijski program: prijedlog Inno Setup (besplatan, čitljiv s JAWS-om, podržava hrvatski i engleski). Treba potvrditi da se kompajliranje skripti (scompile.exe) može pouzdano pozvati iz njega.
7. Tko testira na drugim računalima i verzijama JAWS-a prije objave.
