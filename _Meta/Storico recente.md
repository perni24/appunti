# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-10-27 - Python: note principali e promemoria completati

### Fatto

- Revisione Python completata in questa passata: **75 note principali su 75 e 13 promemoria su 13**, conteggiati dalle destinazioni uniche degli indici. I promemoria contengono **144 blocchi Python**. Lo stato delle note resta non revisionato fino all'approvazione dell'utente.
- Promemoria Sintassi essenziale e Funzioni: snippet autonomi, None/falsy, tipi e alias, cicli, firme/default, mutazioni e consumo degli iteratori. Bounds con contratto di sequenza esplicito; sostituito il connect vuoto con costruzione di opzioni senza I/O.
- Nuova suite `python-promemoria-linguaggio.test.mjs`: **24 snippet e 53/53 test mirati** superati. Solo standard library, nessuna nuova installazione. Prosa breve e rimandi alla teoria; nessuna nuova nota o duplicazione delle spiegazioni estese.
- Revisionati anche Liste, tuple e set e Dizionari: accesso, mutazioni, copie e alias, ordine/hashability, assenza e None, merge, viste, raggruppamenti e default mutabili. Nuova suite `python-promemoria-collezioni.test.mjs`: **24 snippet e 55/55 test mirati** superati; dettagli nel registro.
- Revisionati Stringhe e regex e Numeri e date: Unicode/ASCII, ricerca e sostituzione, parsing, precisione/arrotondamento, random/secrets, date aware, DST, timestamp e durate. Suite `python-promemoria-testo-date.test.mjs`: **27 snippet e 74/74 test mirati**, circa 15 secondi. Riutilizzata tzdata 2026.5 nell'ambiente temporaneo Packaging, senza nuove installazioni.
- Revisionati File e percorsi e JSON e CSV: cwd/script, encoding, modi di apertura, operazioni distruttive e cleanup, parsing distinto da validazione, schema minimo e righe CSV incomplete. Suite `python-promemoria-file-dati.test.mjs`: **23 snippet e 75/75 test mirati**, circa 16 secondi; filesystem temporaneo, nessun file dell'utente modificato dalle prove.
- Revisionati Richieste HTTP e Moduli, ambienti e dipendenze: contratti/status, risorse sync/async, token, download limitato con parziali dichiarati; package multifile, -m, venv, interprete, pip e snapshot. Suite `python-promemoria-http-ambienti.test.mjs`: **13 blocchi Python e 56/56 test mirati**, circa 44 secondi, con comandi PowerShell e installazione offline in fixture. Dettagli e limiti nel registro.
- Ultimo lotto: Comprehension/iteratori/generatori, Asyncio/concorrenza ed Eccezioni/log/debug. Consumo lazy e cleanup, task/errori/cancellazione, logging e debug interattivo. Suite `python-promemoria-iterazione-async-debug.test.mjs`: **33 blocchi e 91/91 test mirati**, circa 22 secondi; provati anche pdb e interprete con -O reali.
- Note convertite alla struttura operativa del rispettivo type: prerequisiti, procedure, comandi separati, debug, checklist e fonti ufficiali.
- isort: classificazione, esclusioni, check rispetto a modifica, Black/Ruff e ordine intenzionale. pre-commit: file tracciati/staged, correzioni, hook locali/manuali e CI.
- tox/nox: riusato il package gia documentato, installazione reale, ambienti separati, posargs, errori, interpreti mancanti e riuso. TOML nativo per tox, senza dichiarare non funzionanti le vecchie configurazioni INI.
- Nuova suite tecnica in `_Meta/tests/python-tooling.test.mjs`; dettagli e limiti nel [[_Meta/Revisione contenuti|registro di revisione]] e nel README dei test.
- Regressione del blocco Tooling: **125/125 test superati**, zero skip/fallimenti, circa 277 secondi. Include **37/37 nuovi test** e **7/7 test dell'anteprima**; dettagli nel registro, distinta dalla nuova regressione dei promemoria.
- Regressioni dei precedenti blocchi dei promemoria: **191/191**, **175/175**, **167/167**, **183/183** e **147/147 test**, dettagli nel registro. Ultimo blocco: **605/605 test** (tutti i 13 promemoria piu Funzionale/Iterazione, Concorrenza e Qualita) in circa 217 secondi, poi **7/7 test anteprima** a build conclusa; **612 complessivi** in due esecuzioni. Inclusi **404 test dei promemoria**; non rieseguite tutte le altre suite delle note principali o degli altri linguaggi.
- content:check: **911 documenti raggiungibili, zero errori e 391 avvisi editoriali**; nessuno specifico sui tre ultimi promemoria. **9/9 test della trasformazione** superati.
- Ultima build Quartz: **3.719 file, 2.003 HTML, 168 redirect, 139.416 riferimenti e zero errori**. Avvisi noti invariati.
- QA Chrome **156.0.8078.48**, ultimi tre promemoria su desktop/mobile: HTTP 200, nessun errore console/JavaScript o overflow del documento. Venticinque elementi di codice scorrevoli su mobile, nessuno su desktop, sei screenshot ispezionati; browser QA chiuso. QA dei blocchi precedenti nel registro.

### Decisioni

- CPython 3.12.10 e Node 24.14.0 su Windows. Toolchain temporanea del blocco Tooling: isort 9.0.2, pre-commit 4.7.0, tox 4.67.1, nox 2026.10.20, Black 26.10.1, pytest 9.1.1 e Ruff 0.17.3. Per HTTP riusati Requests 2.34.2 e HTTPX 0.28.1; prove pip solo in fixture con artefatti locali. Nessuna nuova dipendenza del progetto o modifica al Python globale.
- Nessun hook installato nel vault, nessun commit/push. YAML confrontato con Git e invariato; status non revisionato finche l'utente approva. Nessun cambio a indici, percorsi, redirect o dipendenze Quartz.
- Conservate le modifiche precedenti; storico limitato a dieci voci, con dettagli delle precedenti nel registro. Anteprima esistente su http://localhost:8082/appunti/.

### Prossimi passi

- Python concluso in questa passata: **75 note principali e 13 promemoria**, non una certificazione di assenza di errori. Proseguire con **Rust: Fondamenti del Linguaggio**, a partire da Sintassi di base, Tipi di dato primitivi e Variabili, mutabilita e shadowing.

## 2026-10-26 - Python: database, dati, automazione e LLM

### Fatto

- Revisionate SQLAlchemy, Alembic, Pydantic e HTTPX e requests, completando Web, API e Database; completato anche Data, Automazione e LLM con pandas, NumPy, Jupyter, scraping, automazione, llama-cpp-python e OpenAI API. Avanzamento **72 note Python su 75**, con **13 promemoria** separati.
- Database/HTTP: sessioni e transazioni, migrazioni, contratti e client sync/async. Suite dedicata **68/68**; toolchain isolata SQLAlchemy 2.0.55, Alembic 1.20.1, Pydantic 2.14.1, email-validator 2.3.0, aiosqlite 0.22.1, HTTPX 0.28.1, Requests 2.34.2.
- Dati/notebook: report e mancanti, Copy-on-Write, shape/viste/broadcasting, kernel e stato riproducibile. Suite **49/49**; toolchain isolata pandas 3.1.0, NumPy 2.5.4, JupyterLab 4.6.4, Notebook 7.6.3, ipykernel 7.4.0, nbconvert 7.17.2, nbformat 5.11.1. Nessun kernelspec globale modificato.
- Ultima regressione completa, eseguita nel blocco Dati: **777 casi, 775 superati e 2 saltati** per MSVC assente. Non e il conteggio della nuova regressione mirata.
- Scraping: parser separato dal download, campi mancanti e URL, charset, status e dimensioni; distinti crawler, robots e sicurezza SSRF.
- Automazione: CLI con piano e dry-run predefinito, collisioni/idempotenza, log, errori parziali e limiti di concorrenza. Nessun file dell'utente rinominato dai test.
- Nuova suite **48/48**, quattro blocchi estratti. HTTP solo locale e filesystem temporaneo. Junction reale; symlink file e timeout tramite mock. Riutilizzata la toolchain Data con beautifulsoup4 4.15.0, SoupSieve 3.0.4 e Requests 2.34.2, senza installazioni.
- Regressione del blocco Scraping: **208/208 test superati**, inclusi **7/7 test dell'anteprima**. Dettagli nel registro; non e il conteggio della nuova regressione LLM.
- LLM: esempi locali senza caricamento globale, budget e close; OpenAI con client iniettato, stato/refusal, classificazione Pydantic e streaming. **42/42 nuovi test**, cinque blocchi estratti, nessuna inferenza reale o chiamata a pagamento.
- Toolchain LLM isolata: llama-cpp-python 0.3.36 wheel CPU, openai 3.38.0, HTTPX2 2.16.0 e Pydantic 2.14.1. Import/firme reali, modello simulato e trasporto HTTP in memoria; nessun peso scaricato.
- content:check: **911 documenti raggiungibili, zero errori e 405 avvisi editoriali**. **9/9 test della trasformazione** superati.
- Regressione mirata LLM/HTTP/database e anteprima: **117/117 test superati**, zero skip/fallimenti, circa 112 secondi, inclusi **7/7 test dell'anteprima**. Non rieseguita tutta la suite Python o degli altri linguaggi.
- Build riuscita: **3.719 file, 2.003 HTML, 168 redirect, 138.969 riferimenti e zero errori**; avvisi noti invariati.
- QA delle due note LLM con Chrome 155.0.8059.85 su desktop/mobile: HTTP 200, nessun errore console/JavaScript o overflow della pagina. Nove elementi scorrevoli su mobile e uno su desktop; quattro screenshot ispezionati e browser QA chiuso.

### Decisioni

- Baseline CPython 3.12.10, Windows, Node 24.14.0. Metadati confrontati con Git e invariati; status non revisionato finche l'utente non approva. Nessun cambio a percorsi, indici o redirect.
- Nessuna modifica a Python globale, dipendenze del sito o lockfile. Nessun benchmark, audit completo o matrice OS/versioni; dettagli e limiti nel [[_Meta/Revisione contenuti|registro]] e nel README dei test.
- Nessun commit o push. Conservate le modifiche precedenti; storico a dieci voci. Anteprima esistente su http://localhost:8082/appunti/.

### Prossimi passi

- Completare **isort**, **pre-commit**, **tox e nox**. Restano **3 note principali e 13 promemoria**.

## 2026-10-24 - Python: dalla standard library ai framework web

### Fatto

- Revisionate cinque note di Standard Library Pratica, sei di Internals, quattro di Concorrenza, cinque di Performance e quattro sui framework web: **61 note Python su 75**, con 13 promemoria separati. Rimandi alla stessa nota conteggiati una sola volta.
- Standard Library: Subprocess, CLI con argparse, SQLite con sqlite3, Networking base e Configurazione e Variabili d Ambiente. Risorse, transazioni, framing, timeout e parsing rigoroso; 17 blocchi e 57 test dedicati, dettagli nel [[_Meta/Revisione contenuti|registro di revisione]].
- Internals: Memory Management, Global Interpreter Lock, Introspezione, Data model, Descriptor protocol e Metaclassi. Raggiungibilita/RSS/risorse, GIL/lock, lookup e protocolli impliciti; 26 blocchi e 73 test dedicati.
- Concorrenza: Threading, Multiprocessing, Asyncio e Concurrent.futures. Arresto cooperativo, esiti/errori espliciti, spawn e import protetto, Queue/Value, TaskGroup/gather, cancellazione/timeout e finestra di submit. Limiti dei demo e differenze rispetto ai supervisori di produzione dichiarati.
- Performance: Profiling, Caching, C extensions, Cython e PyInstaller. Carico misurabile, cache e invalidazione, confine nativo con tipi/ownership espliciti, memoryview e progetto di distribuzione completo. Corretto py-spy su Windows con --subprocesses per seguire il launcher del virtualenv.
- Nuova suite Performance: **45 casi, 43 superati e due test nativi saltati per MSVC assente**. Cython tradotto realmente in C; build PyInstaller onedir/onefile, copie fuori dai sorgenti e spec eseguiti. La compilazione e il runtime C/Cython restano da verificare.
- Framework: Flask, Starlette, FastAPI e Django. Progetti realmente eseguibili, input/HTTP/errori, lifespan, WS, modelli/override e migrazioni. Chiariti validazione rispetto a vincoli DB, CSRF nei test e limiti di autenticazione/CORS; nessun demo presentato come backend completo.
- Nuova suite Web: **53/53 test**, con 14 blocchi Python e un template HTML estratti dalle note. Eseguiti anche i sette test Django originali, HTTP su loopback e check/migrazioni nel solo database temporaneo.
- Regressione seriale delle dodici suite: **660 casi, 658 superati, zero fallimenti e 2 saltati**, circa 328 secondi. CPython 3.12.10 con GIL e Node 24.14.0 su Windows; dettagli nel registro e nel README dei test.
- Toolchain Performance installata in un nuovo virtualenv temporaneo: Cython 3.3.0, PyInstaller 6.22.3, py-spy 0.4.2 e cachetools 7.2.4. Nessuna modifica al Python globale o alle dipendenze site. Fonti ufficiali e limiti di piattaforma dichiarati; nessun benchmark.
- Toolchain Web separata: Flask 3.1.3, Starlette 1.10.0, FastAPI 0.162.0, Pydantic 2.14.1 e Django 5.2.18; versioni di client e server registrate nel README dei test. Nessuna modifica alle dipendenze globali o del sito.
- content:check: **911 documenti raggiungibili, zero errori e 413 avvisi editoriali**. **9/9 test della trasformazione** e **7/7 test dell'anteprima** superati.
- Ultima build riuscita: **3.719 file, 2.003 HTML, 168 redirect, 138.693 riferimenti e zero errori**. QA delle quattro pagine Web desktop/mobile senza errori o overflow; 21 blocchi/tabelle scorrevoli su mobile, due su desktop e sei screenshot ispezionati.
- Anteprima lasciata attiva su http://localhost:8082/appunti/. Browser QA e server di prova chiusi; browser personale non modificato.

### Decisioni

- Conservati date, percorsi, type, publish e status non revisionato; l'approvazione dell'utente e separata. Nessuna nuova nota, nessun indice o redirect modificato.
- Test limitati alla baseline Windows. Nessun audit completo, carico, matrice di versioni/OS/database, multiworker, TLS/proxy o deployment pubblico. Limiti specifici di ogni blocco nel registro e nel README; le build native C/Cython restano non verificate senza MSVC.
- Nessun commit o push. Storico mantenuto a dieci voci; le revisioni precedenti restano nel registro dettagliato.

### Prossimi passi

- Completare **Python: Web, API e Database** con SQLAlchemy, Alembic, Pydantic e HTTPX e requests. Restano **14 note principali e 13 promemoria**.

## 2026-10-23 - Python: percorso base e qualita

### Fatto

- Avviata la revisione Python dopo il push TypeScript su origin/main, commit `9adc990`. Controllate otto note di Fondamenti, cinque di Strutture Dati, sei di File, Moduli e Ambiente, otto di Oggetti, sei di Funzioni/Iterazione e quattro di Type Hints e Qualita: **37 su 75**, con 13 promemoria separati. Rimandi multipli alla stessa nota contati una sola volta.
- Fondamenti: toolchain, binding, operatori, match, iteratori, default e gestione errori. Strutture Dati: slicing/ordinamento, copie, hashability, merge e comprehensions. Dettagli e prove nel [[_Meta/Revisione contenuti|registro di revisione]].
- File e ambiente: completati I/O e formati strutturati, fusi orari e code, pip/venv e packaging. Unico package dimostrativo completo; chiariti editable rispetto a wheel, lockfile e sincronizzazioni. Corretto il layout uv esplicitando --no-package.
- Oggetti: validazione prima delle mutazioni, dataclass e hash, enum, protocolli speciali, MRO/super, incapsulamento, proprieta/cache e factory con cls/Self.
- Funzioni e iterazione: closure, callback eager/lazy, ordine dei decoratori, wrapper async, generatori e validazione differita, break/close, iteratori riutilizzabili e gestione delle risorse sync/async. Nuova suite con 33 esempi autonomi e 73 test; mantenuto il template teorico per Higher-order Functions.
- Qualita: completati generici/Protocol/TypedDict/Literal/NewType e checker strict; distinti formatter/linter/test. Progetto con parser di porte completo, 26 casi pytest e coverage; logging con propagazione, configurazione, JSON e rotazione. Controprove su cast, Protocol, mutazione del parser e 100% di coverage senza asserzioni.
- Sette suite Python: **369 test superati**, 58 Fondamenti + 60 Strutture Dati + 28 File/Standard Library + 16 Packaging + 69 Oggetti + 73 Funzionale/Iterazione + 65 Qualita; nessun fallimento o test saltato, circa 182 secondi. Baseline CPython 3.12.10 e Node 24.14.0 su Windows.
- Tool di packaging e tzdata installati solo in un virtualenv temporaneo separato. Provati build sdist/wheel, installazioni pulite, CLI, uv/pipx/Poetry e casi di errore; nessuna modifica al Python globale o alle dipendenze site.
- Toolchain Qualita separata: mypy 2.4.0, Pyright 1.1.414, Ruff 0.17.2, Black 26.10.1, pytest 9.1.1 e Coverage.py 7.17.0. Esempi estratti dai Markdown, CLI reali e fixture temporanee; nessuna modifica a site o lockfile.
- content:check: **911 documenti raggiungibili, zero errori e 434 avvisi editoriali**. Nove test della trasformazione superati.
- Ultima build riuscita: **3.719 file, 2.003 HTML, 168 redirect, 138.234 riferimenti e zero errori**. QA delle quattro pagine Qualita desktop/mobile senza errori o overflow; 30 blocchi/tabelle scorrevoli su mobile e sei screenshot ispezionati.
- Nel blocco Oggetti corretto un HTTP 500 dell'anteprima locale sugli URL accentati, causato da Content-Disposition: header inline senza filename, dipendenze e nomi invariati. Quattro casi Unicode falliti prima della correzione, **7/7 test HTTP superati** dopo e di nuovo nell'ultima regressione. Anteprima lasciata attiva su http://localhost:8082/appunti/, browser e server di prova chiusi.

### Decisioni

- Conservati date, percorsi, type, publish e status non revisionato; approvazione dell'utente separata dalla revisione tecnica. Nessuna nuova pagina di conoscenza, nessun indice o redirect modificato.
- Test limitati a Windows/CPython 3.12; nessuna matrice di sistemi, audit, benchmark, pubblicazione di package o configurazione persistente del PATH. Gli altri linguaggi non sono stati rieseguiti.
- Nessun commit o push Python in questa sessione. Storico mantenuto a dieci voci operative.

### Prossimi passi

- Proseguire con **Python: Standard Library Pratica**: Subprocess, CLI con argparse, SQLite con sqlite3, Networking base, Configurazione e Variabili d Ambiente. Restano 38 note principali e 13 promemoria; i rimandi alla nota Standard Library sono gia coperti.

## 2026-10-22 - TypeScript: revisione dei capitoli avanzati

### Fatto

- Completata la revisione tecnica delle **83 note TypeScript uniche su 83**: ultimo blocco Pattern e Architettura, cinque pagine. Declaration Merging e contato una sola volta.
- Capitoli precedenti: utility, type system, interoperabilita, validazione, framework e qualita. Esempi, fonti e risultati dettagliati conservati in [[_Meta/Revisione contenuti|Revisione dei contenuti]].
- Repository: corretto find-then-insert come falsa garanzia di unicita; conflitti, copie, I/O e limiti della memoria espliciti. DTO: parser e proiezione runtime distinti dai tipi statici.
- Dominio: quantita e transizioni verificabili al posto di una debole validazione email. DI: clock, mailer, composition root, errori e durata delle risorse. Clean architecture: progetto ESM completo e controllo della direzione degli import, inclusi type-only.
- Nuova suite da **38 gruppi**, tutti superati al primo giro. Regressione mirata: **108 test superati**, 38 Architettura + 31 Moduli + 39 Qualita, circa 149 secondi; nessun fallimento o test saltato.
- Baseline TypeScript 5.9.3 e Node 24.14.0. Nessuna nuova dipendenza in questo blocco; helper condivisi invariati. Fixture temporanee ripulite dopo verifica dei percorsi.
- content:check: **911 documenti raggiungibili, zero errori e 469 avvisi editoriali**, nessuno nel percorso TypeScript. Nove test della trasformazione superati.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 137.555 riferimenti verificati, zero errori**. Solo avvisi preesistenti del generatore.
- QA delle cinque pagine desktop/mobile riuscita dopo la correzione del selettore di un titolo tipografico: 20 blocchi scorrevoli su mobile, sei screenshot ispezionati, nessun errore o overflow del documento. Browser QA chiusi; anteprima esistente lasciata attiva.

### Decisioni

- Conservati date, percorsi, type, publish e status non revisionato; riparato un prerequisito YAML. Nessuna nota aggiunta o spostata, nessun indice o redirect modificato.
- Il completamento riguarda le pagine esistenti, non tutti gli argomenti/versioni TypeScript. Revisione del modello e approvazione dell'utente restano distinte.
- Test in memoria e progetto dimostrativo, non collaudo di database, SMTP, pagamenti o transazioni distribuite. Non rieseguite le altre suite TypeScript o quelle complete React/JavaScript.
- Nessun commit o push. Voce odierna consolidata mantenendo dieci voci operative.

### Prossimi passi

- Proseguire con **Python: Fondamenti del Linguaggio**, partendo da Comandi base e toolchain. Nessuna modifica alle note Python in questa sessione.

## 2026-10-21 - TypeScript: tipi avanzati, moduli e configurazione

### Fatto

- Revisionate le nove note di Tipi Avanzati e le sette di Moduli e Configurazione: **41 note TypeScript su 83** in questa passata. Integrati esempi osservabili, limiti e fonti ufficiali; i 34 blocchi del primo capitolo e i progetti del secondo sono verificati sulla baseline 5.9.3.
- Chiariti distribuzione, never/any/unknown, unwrap singolo rispetto ad Awaited, readonly/optional nei mapped types, chiavi statiche rispetto a Object.keys e accessi a elementi potenzialmente assenti.
- Approfonditi infer con overload e tuple readonly, ricorsione e limiti del modello JSON, concat e partial application. Il wrapper non registra piu gli argomenti; riparato un prerequisito YAML spezzato.
- Moduli: configurazioni complete Node/bundler, ESM/CommonJS separati, estensioni runtime, alias non riscritti, export map e package imports. References domain/api coerenti, cache e output vecchi espliciti; chiariti flag strict e source map con stack verificato. Riparato un prerequisito YAML.
- Suite da 66 test per Tipi Avanzati e da 31 per Moduli entrambe riuscite al primo tentativo. Ultima regressione seriale delle sei suite: **332 test TypeScript superati**, zero fallimenti o test saltati, circa 460 secondi. Baseline TypeScript 5.9.3, Node 24.14.0, esbuild 0.27.3.
- content:check: **911 documenti raggiungibili, zero errori e 507 avvisi editoriali**; nessuno sulle sette note piu recenti. Nove test della trasformazione superati, metadati e dieci voci dello storico verificati.
- Build finale del blocco Moduli riuscita: **3.719 file, 2.003 HTML, 168 redirect, 137.013 riferimenti verificati e zero errori**. QA ripetuta delle sette pagine desktop/mobile senza overflow o errori pagina/console/HTTP; 19 blocchi di codice e una tabella scorrevoli su mobile.
- Sette screenshot ispezionati; convertita la tabella strict in elenco per leggibilita mobile, senza modificare gli esempi. Rigenerazione e QA finale riuscite; risultati precedenti di Tipi Avanzati conservati nel registro dettagliato.
- Anteprima locale su http://localhost:8082/appunti/ riutilizzata e lasciata attiva; browser QA chiusi, scheda personale dell'utente non modificata.

### Decisioni

- Percorsi, date, pubblicabilita e status non revisionato conservati. Nessuna nota aggiunta o spostata, nessun indice o redirect da modificare.
- Nessun aggiornamento delle dipendenze e nessun commit o push. Test limitati al percorso TypeScript, senza rieseguire le suite React/JavaScript.

### Prossimi passi

- Proseguire con **Utility e Pattern di Tipo**. Restano 42 note TypeScript; la revisione tecnica non sostituisce l'approvazione dell'utente.

## 2026-10-20 - TypeScript: percorso base e narrowing

### Fatto

- Avviata la revisione TypeScript dopo il push della revisione React: **25 note su 83**, percorso base e capitolo Narrowing e Controllo dei Tipi. Fonti ufficiali aggiunte, esempi e limiti chiariti.
- Distinti controllo statico, emissione ed esecuzione; corrette ambiguita su strict, primitive, inferenza, optional, any/unknown/never, union/intersection e contratti strutturali.
- Sostituito l'esempio di creazione utente simulata con un calcolo locale verificabile; aggiunti parser con proiezione e controesempi sui campi non rimossi da un'interfaccia.
- Corretti il type guard che verificava solo la presenza dei campi e il lookup che poteva restituire proprieta ereditate. Approfonditi void, optional/default, readonly/tuple, enum, asserzioni, overload e index signatures; anteprima email distinta dall'invio.
- Approfonditi classi, this, ordine dei campi, private/#private, readonly, abstract, implements e generics. Factory Password sostituita con titoli locali; falso SMTP sostituito con test double; repository in memoria e controesempi dei limiti del checker.
- Approfonditi narrowing, guardie, union, esaustivita, predicate nei due rami e assertion. Corretti quattro collegamenti YAML; assertNever non serializza piu payload arbitrari; espliciti limiti di truthiness, alias, filtri, catch e async.
- **235 test TypeScript superati**, 173 precedenti e 62 nuovi, in circa 149 secondi: checker reale, errori attesi, runtime, CLI e DOM nel browser. Supporto comune riusato; baseline 5.9.3, Node 24.14.0; nessuna dipendenza nuova.
- content:check: **911 documenti raggiungibili, zero errori e 522 avvisi editoriali**. Nessun avviso sulle sei note appena revisionate; nove test della trasformazione superati.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.859 riferimenti verificati, zero errori**. Invariati gli avvisi preesistenti del generatore.
- QA delle sei pagine su desktop e mobile riuscita: quattro screenshot ispezionati, 25 blocchi di codice scorrevoli su mobile, nessun errore pagina/console/HTTP o overflow del documento. Anteprima esistente lasciata attiva; risultati delle passate precedenti conservati nel registro.

### Decisioni

- Conservati percorsi, date, pubblicabilita e status non revisionato. Nessun indice o redirect da aggiornare, perche non sono state aggiunte o spostate note.
- Test mirati al blocco, non riesecuzione delle suite React/JavaScript. Nessun commit o push TypeScript.

### Prossimi passi

- Proseguire con **Tipi Avanzati**. Restano 58 note TypeScript in questa passata; approvazione dell'utente separata dalla revisione tecnica.

## 2026-10-19 - React: revisione delle 59 note conclusa

### Fatto

- Revisionate Storybook, Visual regression testing, Design system, Feature-based architecture, State colocato e API layer: **59 note React su 59** esaminate. Conclusa la revisione tecnica delle pagine attuali, non una certificazione universale di React. Esempi, fonti e collegamenti aggiornati.
- Nuova suite con **9 test mirati superati**: cinque storie in Vitest Browser Mode, build Storybook, sei confronti Playwright, baseline assente e due controlli negativi per callback/CSS. Le baseline non vengono riscritte nel confronto ordinario.
- Altri **35 test mirati superati** per design system e architettura: TextField condiviso, due form locali, temi, focus, quattro scansioni axe e controlli del grafo con import volutamente errati nella sola fixture. Distinti contratto UI e policy del prodotto.
- Altri **60 test** per stato colocato e API layer, superati nella regressione: proprietario/durata, hidden/unmount/key, client HTTP con schema e mapping, 204, errori e abort reale prima degli header/durante il corpo. ProfilePanel riusato, non duplicato; backend di produzione non incluso.
- Regressione seriale completa aggiornata: **754 test React superati**, nessun fallimento o test saltato, in circa 376 secondi. Node 24.14.0 e Chrome 155.0.8059.80; processi e fixture temporanee chiusi/rimossi.
- content:check: **911 documenti raggiungibili, zero errori e 546 avvisi editoriali**, nessuno nell'area React; nove test della trasformazione superati. Registro e README aggiornati.
- Ultima build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.554 riferimenti verificati, zero errori**. Sei screenshot delle ultime due note ispezionati su desktop/mobile; sei blocchi di codice e due tabelle larghe scorrono internamente, senza errori browser o overflow del documento. Anteprima esistente su http://localhost:8082/appunti/ lasciata attiva.

### Decisioni

- Toolchain temporanea isolata per Storybook: Storybook 10.6.2, Vitest 5.0.5 e Playwright 1.62.1; audit senza advisory. Il blocco design/architettura riusa toolchain esistenti senza nuove installazioni o audit. Dipendenze Quartz invariate.
- Distinti build, interazioni, screenshot, accessibilita e approvazione umana delle immagini. Test limitati a Windows/Chrome e viewport desktop/mobile, non CI remota o dispositivi reali.
- Convenzione app -> features -> shared esplicita, non obbligo React o adozione completa di FSD. Il controllo del grafo e limitato al demo, non un linter generale; form in memoria senza backend o persistenza.
- Stato scelto anche per durata, non solo numero di consumatori. Client JSON deliberatamente limitato: trasporto distinto da dominio/cache/UI, credenziali omesse e nessun retry implicito. Le scritture nei test usano solo fixture senza dati reali.
- Date e percorsi conservati; status non revisionato fino all'approvazione dell'utente. Nessun commit, push o deploy remoto.

### Prossimi passi

- Proseguire la revisione degli altri percorsi di Programmazione. Le 59 note React restano non revisionate dall'utente finche non approvate; nuove API o versioni richiedono verifiche separate.

## 2026-10-18 - React: concorrenza, sicurezza e testing

### Fatto

- Revisionate useTransition e useDeferredValue, Gestione della memoria e AbortController, Protezione XSS, Gestione Autenticazione, CSRF, Content Security Policy, Testing Jest, Testing Cypress e Playwright, Test di accessibilita e Linting e Formattazione: **53 note React su 59**. Distinti scheduling, cancellazione, leak, sicurezza, test e controlli statici.
- Ricerca con filtro nel figlio memoizzato; profilo completo con cancel, timeout, retry, guardie e controllo HTTP/JSON/schema. Esempio distinto per listener e timer, con cleanup verificabile.
- Sanitizer DOMPurify con policy minima e URL controllate; client sessione completo con stati distinti, logout confermato solo dal server, retry e rimozione della bozza al cambio identita. Non sono implementati login reale, OIDC o sicurezza backend completa.
- CSRF: contratto server esplicito, form con endpoint fisso e token, errori senza retry automatico. CSP: baseline statica e demo React CSR con nonce per risposta, CSS esterno e server Node limitato; distinti report-only, enforcement e integrazioni framework.
- Testing: configurazioni eseguibili, form condiviso, adapter HTTP e casi di validazione/successo/errore. Eseguiti sette test Jest, tre Playwright e tre Cypress; prova negativa mirata verifica che Jest rilevi la validazione rimossa. API browser simulate, non backend completo.
- Accessibilita: riusati disclosure, form e dialog esistenti, quattro test Playwright e cinque report axe. Linting: configurazione ESLint 10/Hooks/Prettier completa, globali scoped, ignore e controesempi. Tastiera e scansioni automatiche restano distinte dai controlli manuali non eseguiti.
- Cinque nuove suite con **140 test superati** (24 concorrenza, 36 XSS/autenticazione, 31 CSRF/CSP, 23 runner e 26 accessibilita/lint), inclusi bundle, HTTP locale, cleanup, CSP e controlli statici. Regressione completa: **650 test React superati**; i casi interni dei runner non sono contati due volte. Diciassette scansioni axe positive introdotte su stati selezionati, non un audit completo.
- content:check: **911 documenti raggiungibili, zero errori, 552 avvisi editoriali**; nove test della trasformazione superati. Registro e README aggiornati; storico mantenuto a dieci voci operative.
- Ultima build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.390 riferimenti verificati, zero errori**. Ultime due note controllate su desktop/mobile e altri sei screenshot ispezionati: 14 blocchi di codice e una tabella larghi scorrono su mobile, senza overflow del documento o errori browser/HTTP.
- Anteprima riavviata nel primo blocco dopo la rigenerazione di index.html, poi riutilizzata su http://localhost:8082/appunti/ (PID 30336). Browser e server dei test chiusi; anteprima lasciata disponibile. HTML generati non modificati manualmente.

### Decisioni

- Fonti ufficiali e moduli eseguibili; DOMPurify 3.4.17 nella toolchain temporanea React, con il low Babel preesistente. Nuova toolchain isolata per i runner: 19 segnalazioni moderate transitive sprintf-js, nessuna high/critical; nessun downgrade automatico. Dipendenze Quartz e toolchain JavaScript invariate. Test distinti da benchmark e audit completi.
- Toolchain qualita separata con audit npm senza advisory. ESLint 10 con plugin Hooks compatibile; nessun force/legacy-peer-deps o downgrade a ESLint 9 fuori manutenzione per aggiungere plugin JSX non compatibili. La baseline non equivale a tutti i controlli React/TypeScript.
- Data, percorsi e pubblicabilita conservati; note non revisionate fino al controllo dell'utente. Nessun commit, push o deploy remoto.

### Prossimi passi

- Rimangono **6 note React**: proseguire con Storybook e Visual regression testing, poi le quattro note di Architettura Frontend.

## 2026-10-16 - React: Actions, risorse e framework

### Fatto

- Revisionate Actions e form actions, useActionState, useOptimistic, useFormStatus, use hook e Framework Next.js e Remix: React arriva a **43 note su 59**. Esempi completi di trasformazione locale, alias con bozza controllata e contatore in coda; distinti dati, pending, reset, errore e conferma.
- Corretti firme e contesto Action, differenze client/server e limiti di permalink. Il reset automatico non interpreta un errore applicativo restituito; la bozza va conservata intenzionalmente.
- Aggiunti commenti ottimistici con rebase e conferma nel parent, correlazione requestId e rifiuto tipizzato; due form con scope e dati indipendenti. Precisati ripristino della base diverso dal rollback server e metadati del form diversi da una misura della rete.
- use: Promise stabile, Context condizionale, retry/boundary e variante browser(). Framework: distinti Remix v2, nuovo Remix e React Router, con catalogo SSR completo e form GET funzionante senza JavaScript; rimandi agli esempi Next gia verificati.
- **510 test React superati**, inclusi 100 nuovi nei tre blocchi della giornata (34, 39 e 27). Quindici scansioni axe introdotte su stati selezionati, senza pretesa di audit completo. Ultima suite: build SSR reale, status HTTP, navigazione idratata e proiezione pubblica dei dati.
- content:check: **911 documenti raggiungibili, zero errori, 561 avvisi editoriali**; superati i nove test della trasformazione. Rapporto, registro e README dei test aggiornati.
- Nessuna nuova dipendenza del sito. Aggiunti dev/serve React Router nella toolchain esterna; isbot dichiarato nel demo. Audit esterno con un low preesistente su Babel, senza aggiornamenti forzati. Fixture/junction e processi di test ripuliti; suite JavaScript non rieseguita.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.087 riferimenti verificati, zero errori**. Ultime due note controllate su desktop/mobile e sei screenshot finali ispezionati; dieci blocchi di codice mobile scorribili e due tabelle entro il viewport, nessun overflow del documento.
- Anteprima esistente riutilizzata su http://localhost:8082/appunti/. Browser QA chiusi; HTML generati non modificati manualmente. Storico mantenuto a dieci voci operative.

### Decisioni

- Demo client con servizi locali espliciti, non finte registrazioni riuscite; catalogo Framework Mode con server SSR reale di sola lettura. Server Functions, persistenza e sicurezza backend non sono collaudati da questi test.
- Date e pubblicabilita conservate; note ancora non revisionate fino al controllo dell'utente. Nessun commit, push o deploy remoto.

### Prossimi passi

- Rimangono **16 note React**: proseguire con useTransition e useDeferredValue e Gestione della memoria e AbortController.
