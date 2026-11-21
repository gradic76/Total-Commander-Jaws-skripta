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
- Cjelina "brbljanje viška", snimke A (kretanje) i B (dijalozi) 2026-11-18. Odluka autora: naslov glavnog prozora skraćen na "Total Commander" pri ulasku u TC i pri povratku iz dijaloga (provjereno uhom); F7 (TCOMBOINPUT) bez "Combo box Total Commander" (provjereno). Dugi naslov u Windowsovom popisu za Alt+Tab nije naš; ulazak u ploču (Tab, Alt+Tab, povratak iz dijaloga i izbornika) sada kaže samo "LEFT"/"RIGHT", ime i položaj (odluka i provjera uhom 2026-11-18); ostaje kako JAWS govori: izbornik pogona "Combo box, e" pa "e Glazba". Snimka C (izbornici) je čista. Na F5/F7/Alt+F5 prije dijaloga "selected ime" (TC privremeno označi stavku): ostaje, jer potvrđuje na čemu radnja radi (odluka 2026-11-18). Dijalog Pack files pri otvaranju dvaput izgovori polje ("Pack 1 file(s) to the archive Edit" i naziv). Provjeriti i druge dijaloge.
- Move (F6): prema autoru isti prozor napretka kao Copy i Delete, i Delete se dobro čitao. Uzgred potvrditi i Insert+Page Down.
- Red čekanja: Tab spor zbog TC-a (vidi stanje.md). U dokumentaciju upisati kao poznato ograničenje i savjetovati Foreground.

## Sljedeće, ovim redom

1. Pozadinsko kopiranje (Background) i red čekanja (F2 Queue): riješeno 2026-11-20, vidi F5 obitelj.
2. Označavanje, gotovo 2026-11-17 i provjereno uhom: "selected ime" (JAWS sam umeće "selected"), "Not Selected ime" pri micanju; Insert kaže "selected ime" pa sljedeću stavku. Ostaje:
   - razmak na neizračunatoj mapi: JAWS i dalje izgovori cijeli redak s "?", pa s izračunatom veličinom. NIJE riješeno. Izmjereno: FocusChangedEventEx za istu stavku stiže (nChild == nPrevChild, isti prozor), ali redak ne izgovara on; nisu ni ValueChanged, NameChanged, Description, HighLighted ni skripta za razmak (nije vezana). Vjerojatno unutarnja obrada JAWS-a. Ide u cjelinu "brbljanje viška".
3. Popis datoteka:
   - gotovo 2026-11-17, provjereno uhom: strelice čitaju samo ime, mape bez oznake kao u Exploreru (odluka 2026-11-17), a "<DIR>" se čuje na Insert+strelica gore; Insert+strelica gore čita cijeli redak i položaj;
   - kraći ulazak u popis (Tab, Alt+Tab): još čita cijeli redak;
   - putanja bez "*.*".
4. Gotovo 2026-11-17, provjereno uhom: Insert+Page Down u popisu čita samo statusnu traku aktivne ploče (i s karticama). Alt+Shift+S kaže samo veličinu stavke na fokusu (odluka: svaka tipka jedno).
5. F5 dijalog (TInpComboDlg), gotovo 2026-11-17 i provjereno uhom: pri otvaranju samo polje s natpisom (bez "Combo box Total Commander"), Insert+B čita cijeli dijalog. Ostaje:
   - zbroj "7,75 M 4 1": riješeno 2026-11-20 (Insert+B, riječi iz statusne trake), vidi F5 obitelj;
   - TInpComboDlg vjerojatno koriste i drugi dijalozi s poljem (npr. F7): provjeriti da im ne nedostaje najava.
6. Pomoć, gotovo 2026-11-18 i provjereno uhom: Insert+H popis tipki, Insert+F1 pomoć za popis datoteka, dvaput Insert+F1 opća pomoć; tipke se zovu "Insert...". Nakon zatvaranja preglednog prozora JAWS interno pročita cijeli redak, a skripta ga nakon 0,2 s prekine kratkom najavom ploče. Pratiti u hodu.
7. Hrvatski .jsm u mapi jezika JAWS-a (odluka 2026-11-17: poruke prate jezik JAWS-a). Provjeriti naziv mape za hrvatski.
8. Instalacijski program (Inno Setup):
   - po izboru postavlja naše preporučene TC postavke (ini).
   - preporučene postavke uključuju TitleExtraText=-Total Commander ([Configuration]): ime programa na početku naslova, pa ga Windowsov popis za Alt+Tab čita prvo (odluka 2026-11-18; kod autora upisano, kopija TotalCommander.ini.bak-20261118); U njima je ekstenzija uz ime, jer skripta ime uzima iz prvog stupca. Zaseban stupac ekstenzije skripta zasad ne podržava;
   - u .jcf upisuje samo potrebne retke, ne prepisuje datoteku;
   - instalira u sve verzije JAWS-a od 2025 nadalje, u korisničku mapu.
9. README i dokumentacija.

## Kasnije

- Insert+slovo nije slobodno za naše tipke (JAWS: Insert+S screen echo, Insert+D rječnik; laptop raspored: Insert+A čitaj sve, Insert+P JAWS kursor), pa ostaje obitelj Alt+Shift (odluka 2026-11-18). Alt+Shift+A u rasporedu Classic Laptop zamjenjuje SaySelectedText.
- Profili tipkovnice A i B: vidi CLAUDE.md. Autor u radu koristi profil A.
- Insert označavanje, GOTOVO 2026-11-18 i provjereno uhom: nakon Inserta "N / M file(s), N / M dir(s)" iz statusne trake (bez veličine), pa stavka na koju si sletio. Profil A: ExtInsert=TcInsertMark; profil B: JAWSKey=TcJawsKeyTwice (u B nije isprobano).
- Skupno označavanje, GOTOVO 2026-11-18 i provjereno uhom (profil A): Ctrl+A, Ctrl+Num plus/minus, Shift+Num zvjezdica daju brojeve iz statusne trake. Tipke se NE presreću (TypeCurrentScriptKey numeričke tipke nije ispravno proslijedio TC-u), nego ih prati KeyPressedEvent. Ctrl+A je JAWS-ova skripta SelectAll, pa je iznimka. Dijalozi "Expand selection"/"Shrink selection" najavljuju naslov, a pri povratku brojeve. JAWS izmijenjenu .jkm učitava tek nakon ponovnog pokretanja (važno za installer). U profilu B Num zvjezdica, kosa crta i Alt+Num nisu isprobani.
- Dijalog "Expand selection" (Num plus): jednom se čuo dugi naslov glavnog prozora, nepoznatim putem.
- Tvorničke postavke provjerene 2026-11-18 (vidi stanje.md): gumbne trake s najavom, putanja s "*.*" utišana. Provjereno uhom.
- Ideje iz NVDA dodatka extendedTotalCmd (GPL-2.0, uzimamo samo ideje, ne kod):
  - Alt+Shift+P: GOTOVO 2026-11-17, provjereno uhom u obje ploče, u Dokumentima i na Ovaj PC ("\\Ovaj PC", ostaje TC-ov oblik). Potvrda kopiranja je JAWS-ova poruka "Copied" (cmsg52_S);
  - tipka za aktivnu ploču: GOTOVO 2026-11-18, Alt+Shift+A, "LEFT panel active" / "RIGHT panel active" (odluka; "panel active" je naša poruka u .jsm), provjereno uhom;
  - ime trenutne kartice mape;
  - zvuk na početku i kraju popisa: GOTOVO 2026-11-18, JAWS-ov zvuk TouchKeyboardChildPanelBoundary.wav, bez naknadne postavke (odluka: ide uz govor, ne sistemski beep), provjereno uhom;
  - javljanje kod Ctrl+A i micanja svih oznaka;
  - tonovi dok traje izračun veličine mape.
- Usporedba datoteka u dijalogu prepisivanja ("nova je veća i novija"). Za to treba čitati format datuma.
- Ostali prikazi, Lister (F3), arhive, FTP, višestruko preimenovanje, usporedba mapa.
- U TIJEKU 2026-11-20: dvostruki Alt+broj otvara pregledni prozor sa svim stupcima, kursor na traženom (TcShowRowDetails); instalirano, neisprobano.
- Stupci, GOTOVO 2026-11-19 i provjereno uhom: Alt+1 do Alt+9 čitaju 2. do 10. stupac (ime se čuje na strelicama), redom kako ih TC prikazuje; Alt+Shift+S/D uklonjeni. Prije čitanja MSAARefresh, jer JAWS nakon promjene prikaza drži stari redak. Poznato: nakon čitanja u Comments view pa prelaska na Full JAWS izgovori cijeli redak (JAWS vidi promjenu u odnosu na osvježeni redak); prihvaćeno. Naslov stupca iz zaglavlja (TC-ov tekst, iscrtan, čita se po dijelovima, GetChunk/NextChunk), npr. "Size: 96.082.613"; uparivanje s desna (Ext je u zaglavlju, a u retku uz ime); kad se ne slaže (Comments view zadržava zaglavlje Full prikaza), bez naslova. Provjereno uhom 2026-11-20. Gumb "+" u Configure custom columns JAWS ne čita (neistraženo).
- Comments view (Ctrl+Shift+F2), odluka 2026-11-19, potvrđena 2026-11-20: redak ima dva stupca (ime, komentar), pa strelice čitaju ime pa komentar; u ostalim prikazima samo ime.
- F2 i Ctrl+R (ponovno čitanje ploče), GOTOVO 2026-11-20: TC ne daje nikakvu vidljivu promjenu, pa u popisu datoteka svira JAWS-ov descend.wav (zvuk izabrao autor uhom); svira na pritisak, ne na kraj čitanja. Opisano u pomoći popisa (Insert+F1).
- Lister (F3), GOTOVO 2026-11-20 i provjereno uhom (odluke autora 2026-11-20):
  - pri otvaranju "Lister, ime datoteke" bez putanje (riječ "Lister" iz TC-ova naslova), jednom; JAWS za Lister koristi samo HandleCustomWindows (izmjereno probom);
  - N i P kažu ime nove datoteke (idu samo po datotekama predanima Listeru);
  - 1 do 8 kažu način prikaza riječima izbornika Options (u .jsm, izbornik je owner-drawn); naslov se pet sekundi nakon tih tipki ne ponavlja (Explorer Preview se javlja kasnije);
  - F2 (Reload file) svira descend.wav, kao u popisu;
  - F7 i Enter, F5, Shift+F7: cijeli redak s pronađenim nizom (SayLine), sam niz utišan na sekundu;
  - F6 kaže "Show text cursor" i JAWS-ov On/Off (CaretVisible). Bez kursora strelice šute; TC pamti stanje. Autor ga je slučajno isključio tijekom testova, a to je izgledalo kao kvar skripte;
  - pomoć Insert+F1 u Listeru;
  - traženje: redak čitaju sve tipke iz pomoći Listera (F7 i Ctrl+F; F3, F5 i Shift+F7 sljedeći; Shift+F3 i Shift+F5 prethodni);
  - Alt+strelica lijevo i desno kažu ime datoteke, kao P i N (JAWS ih zove "alt+leftarrow"/"alt+rightarrow"; usporedba po dijelovima imena zbunjivala je skriptu);
  - F11 "Maximized window" i Alt+Enter "Full screen mode" uz JAWS-ov On/Off (stilski bitovi prozora); Escape iz cijelog zaslona kaže Off;
  - Insert+Page Down: položaj u postocima iz okomitog klizača preko MSAA-a (GetObjectFromEvent, OBJID_VSCROLL), rezerva je traka izbornika; JAWS-ov GetScrollBarInfo vraća nule;
  - veličina slova: Lister prima samo Num plus i Num minus; obični plus i minus (JAWS ih zove "=" i "/" na hrvatskom rasporedu, "-" na engleskom) skripta ne preuzima, nego u KeyPressedEvent doda Num plus ili minus (ideja autora), pa tipke izvan Listera zadržavaju echo; zvukovi PianoUp1-C-D, PianoDown1-D-C, Ctrl+0 triput Piano1-C (autor); nakon toga veličina JAWS-ovim riječima ("12 points", GetCharacterPoints), koja se mijenja otprilike na svaki drugi pritisak jer su Listerovi koraci manji od pointa;
  - provjereno snimkama i uhom 2026-11-20.
  - Alt+F3 (bez vanjskog preglednika otvara Lister), Alt+Shift+F3 i Shift+F3 (samo stavka pod kursorom, a F3 sve označene) rade kao F3, bez dodataka skripti; provjereno uhom 2026-11-20. Vanjski preglednici nisu naša briga (autor).
  - Reprodukcija (mp3, način 4), GOTOVO 2026-11-20 i provjereno uhom: naslov prozora je "Pjesma - Izvođač"; dno ima dva msctls_trackbar32 (položaj, glasnoća), Tab između njih. Klizači šute kad se mijenjaju sami (ValueChangedEvent, govor samo 700 ms nakon tipke), bez "selected" (ObjStateChangedEvent). Shift+strelice (JAWS-ove Select... skripte) i Ctrl+strelice (ControlUpArrow, ControlDownArrow i ...PCCursor) na klizačima idu ravno Listeru: Shift i Ctrl gore/dolje mijenjaju glasnoću, Ctrl na položaju vraća na početak. JAWS-ove skripte na Ctrl+strelicama činile su glasnoću nekontroliranom (kao u autorovu NBR-u). F2 ondje ne učitava ponovo, pa nema zvuka. Space, M, C ostaju s echom, bez izgovora radnje (autor). F3 i F5 vode fokus na položaj, F10 zatvara. Sljedeća pjesma se ne najavljuje: JAWS ne dobiva događaj promjene naslova, a autoru nije potrebno.
  - Ostale vrste (autor, 2026-11-20): video (avi, mpg, wmv) isto kao mp3; jpg samo naslov, bez buke; pdf i docx u načinima 1-7 sirovi bajtovi (TC bez dodataka); Explorer Preview (8) za docx čita tekst (Wordov pregled), za pdf gotovo ništa (Windowsov preglednik, izvan našeg dosega). Utišano: roditeljski prozori fokusa u Listeru (IgnoreObjectAtLevel; JAWS je govorio dugi naslov i TC-ovo interno ime "tc_preview_host_window"), provjereno uhom; F6 izvan tekstnog prikaza (fokus nije sam Lister).
- F6 obitelj, GOTOVO 2026-11-21 i provjereno uhom:
  - F6: premještanje s napretkom i Insert+Page Down radi; Insert+B kao u F5. Sadržaj polja odredišta čita se preko MSAA-a (GetObjectFromEvent, OBJID_CLIENT, accValue): GetWindowName vraća natpis polja, a iscrtani tekst je u F6 dodavao tuđi "OK".
  - Shift+F6 (preimenovanje na mjestu): TC umeće Edit kojem je roditelj sam popis (LCLListBox), uz mali gumb. JAWS je kao natpis uzimao ime druge stavke; sad "Rename, Edit, ime" ("Rename" je naša riječ u .jsm, TC nema svoju; autor). Insert+B u polju kaže samo ime (inače bi JAWS pročitao cijeli glavni prozor). Nakon Entera čuje se novo ime i položaj.
  - Alt+F6 (raspakiranje): HINT poruka i dijalog "Unpack files" (TDLGUNZIPALL) čitljivi; Insert+B čita retke dijaloga (JAWS-ov je čitao glavni prozor). Poznata sitnica: "Files to unpack: *.* OK", višak "OK" iz iscrtanog retka, neistraženo.
  - Mjerenje fokusa dok je TC u prvom planu: %TEMP%\tcfocus.ps1 u pozadini (polje za preimenovanje nestane čim fokus ode iz TC-a).
- F5 obitelj, GOTOVO 2026-11-20 i provjereno uhom:
  - Insert+B u F5 i F6 dijalogu (TInpComboDlg): "Copy 3 file(s) to: odredište. 4,51 G, 88 file(s), 13 dir(s)". Natpis i zbroj su iscrtani; polja se nalaze po položaju (natpis iznad gornjeg, redak zbroja između), sadržaj polja preko GetWindowName (GetWindowText je u F6 dodao tuđi "OK"). Riječi "file(s)" i "dir(s)" iz statusne trake ploče koja ima oba dijela (ploča bez mapa izostavlja dio s mapama). Filtar se kaže samo kad je upisan. Time je riješen stari "7,75 M 4 1".
  - Shift+F5 (kopija u istoj mapi): dijalog TCheckComboBox, sad bez "Combo box Total Commander"; natpis "Copy "ime..." to" dolazi prvi.
  - Ctrl+Shift+F5 (prečaci), Alt+Shift+F5 (premještanje u arhivu, dijalog pakiranja) rade bez dodataka.
  - Background: prozor posla šuti dok se ne dira (TC stalno crta, NewText je utišan; promjena naslova ne stiže kao NameChangedEvent, proba 2026-11-20). Postotak se čuje u imenu prozora pri svakom pomaku fokusa u njemu, što je korisno. Insert+B u glavnom prozoru ostaje JAWS-ovo čitanje cijelog prozora (autor).
- F4, GOTOVO 2026-11-20 i provjereno uhom, bez dodataka skripti: otvara editor iz TC-ove postavke (Editor=, tvornički notepad.exe; Lister ima svoju, inače istu), ne Windowsovu povezanost. Povratak u TC ili u Lister je čist. S više označenih otvara samo stavku pod kursorom. Shift+F4: dijalog "Enter file name to edit" (TC-ov natpis, ime trenutne datoteke označeno bez nastavka), Tab na Tree, OK, Cancel; datoteka se stvara i otvara. Jednom je JAWS pročitao cijeli glavni prozor: bio je to Insert+B u glavnom prozoru (JAWS-ovo čitanje prozora).
- Shift+Insert+Page Down u popisu datoteka, GOTOVO 2026-11-20 i provjereno uhom: status i slobodni prostor druge ploče (redak pogona po "[" i "]"), npr. prije kopiranja (ideja autora). Izvan popisa ostaje JAWS-ov ReadToBottomOfColumn.
- Dvostruki Alt+broj, GOTOVO 2026-11-20 i provjereno uhom: JAWS-ov pregledni prozor sa svim stupcima stavke, jedan po retku s naslovom, kursor na traženom stupcu; Escape vraća u ploču. UserBufferAddText sam završava redak, pa se ne dodaje prijelom (inače prazni retci između). Stupac iza zadnjeg u prikazu: oba pritiska kažu "Not available" i ne otvaraju prozor. Postojeći a prazan stupac: jedan pritisak kaže JAWS-ov "blank" (cmsgBlank1, autor), dvostruki otvara prozor.
