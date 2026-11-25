# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-11-25 - PostgreSQL: completate le note principali e i promemoria

### Fatto

- Revisionate le quattro note iniziali: sessioni e pool, ruoli dei processi e attese, memoria e piani di ordinamento, percorsi fisici e dimensioni. Fonti PostgreSQL 18 e PgBouncer nelle note.
- Verificati i dieci blocchi SQL su PostgreSQL 18.7 in un cluster temporaneo: sei prove superate. Build Quartz e controlli strutturali senza errori; i dettagli sono nel registro completo.
- Completate anche le cinque note di Setup e Amministrazione Base. Otto nuove prove su configurazione, ruoli, script e schemi: regressione cumulativa **14/14**.
- Revisionate le sei note rimanenti di SQL Fondamentale. Dieci nuove prove sui risultati e sugli errori SQL attesi; suite cumulativa **24/24**. Il rimando JSON e JSONB ora raggiunge il paragrafo della nota sui tipi.
- Completate le quattro note di Modellazione Dati. Eseguiti tutti i nove blocchi SQL: otto nuove prove, **32/32** complessive su PostgreSQL 18.7.
- Revisionate le sette note di SQL Avanzato: 15 blocchi SQL e 12 nuove prove, **44/44** complessive. Esempi con pareggi, cicli, scritture senza righe restituite, refresh e ricerca italiana.
- Completate le cinque note su integrità e logica di business: audit effettivo, regole di riscrittura, scorte positive, procedure e privilegi, estensioni per database. Dieci nuove prove, **54/54** complessive.
- Completate le quattro note su ACID, MVCC, isolamento e lock; nove nuove prove, **63/63** complessive. Le voci Deadlock e Advisory lock dell'indice portano ai rispettivi paragrafi.
- Revisionate le cinque note di Performance e Query Planning: indici, EXPLAIN, statistiche e manutenzione. Eseguiti i 16 blocchi SQL e dieci nuove prove, **73/73** complessive.
- Completato Storage, WAL e Manutenzione: revisionate WAL, Fillfactor e Tablespace, integrata la sezione TOAST nel layout dei file. Sei nuovi test, **79/79** complessivi; nessuna simulazione di crash o PITR.
- Revisionate le sette note di Scalabilità e alta affidabilità. Verificate replica fisica e logica tra istanze temporanee e selezione del writer con libpq: cinque nuove prove, **84/84** complessive su PostgreSQL 18.7.
- Completate le sei note di Sicurezza: ruoli, RLS, TLS, audit, segreti ed estensioni. Verificati accessi consentiti e negati, isolamento tra tenant, rotazione delle credenziali e identità TLS. Suite complessiva **90/90**.
- Revisionate le tre note rimanenti di Osservabilità e troubleshooting. L'indice ora porta alle sezioni per sessioni, statement aggregati e EXPLAIN in produzione. Sei nuove prove su log reali, lock e contatori.
- Completate le quattro note di Backup, migrazioni e operatività e integrata la prova PITR nella nota WAL. Ripristinati tre formati di dump e verificato un recupero a punto nominato su una copia fisica.
- Completate le quattro note di Estensioni e funzionalità e aggiunte le sezioni PostGIS e pgvector nella nota generale già conteggiata. Verificati i tre moduli esterni, gli UUID, i permessi FDW e il consumo degli eventi logici.
- Revisionate le ultime cinque note di Integrazione applicativa: esempi Psycopg e SQLAlchemy, transizione atomica con outbox, deduplica e recupero dei job con token di tentativo. Il rimando al pooling riutilizza la sezione sul dimensionamento.
- Completato il capitolo Query dei promemoria PostgreSQL: sei schede con dati di prova e risultati attesi; tutti i 41 blocchi SQL sono stati eseguiti su PostgreSQL 18.7 e confrontati con l'HTML di Quartz.
- Completati anche i quattro promemoria Tipi e funzioni. Verificati 28 blocchi SQL, inclusi i casi senza corrispondenze delle regex, il cambio d'ora di Roma e la distinzione fra chiave assente e null JSON.
- Completati i tre promemoria Struttura e prestazioni: 30 blocchi verificati su PostgreSQL 18.7 e nell'HTML di Quartz. Provati vincoli differiti, piani stimati ed effettivi, prenotazione e osservazione dei lock fra sessioni.
- Completate anche le due schede Gestione: policy RLS provate con ruoli non proprietari e dump custom/plain ripristinati in due database separati. I quattro capitoli dei promemoria passano insieme (16/16 test).

### Prossimi passi

- **72/72 note principali PostgreSQL e 15/15 promemoria** revisionati tecnicamente. Tutte le schede compaiono nel rispettivo indice; nessuna ulteriore scheda PostgreSQL in attesa di questo passaggio. L'approvazione personale dell'utente rimane separata.

## 2026-11-24 - Rust: completata la revisione dei promemoria

### Fatto

- Revisionati tutti i sette promemoria del capitolo Linguaggio. Gli esempi sono indipendenti; la teoria resta nelle note collegate.
- Eseguiti i 33 blocchi Rust e verificati tre casi che devono essere rifiutati dal compilatore. Dettagli nel registro di revisione e nel README dei test.
- Revisionati anche Iteratori, Generics e trait, Lifetime e Smart pointer: 22 esempi eseguiti e quattro casi negativi. La suite cumulativa copre 55 esempi eseguibili e sette diagnostici.
- Concluso Sistema e progetto: I/O e JSON, moduli e feature Cargo, thread e Tokio, test e qualità. Le due suite dei promemoria passano insieme offline (24/24).

### Prossimi passi

- Nessun promemoria Rust in attesa di questa revisione tecnica (15/15); lo stato di approvazione personale delle note rimane separato.

## 2026-11-23 - Rust: completate le note principali

### Fatto

- Revisionata [[Programmazione/Rust/Pagine/Public API design|Public API design]]: la stessa libreria mostra quali import, valori ed errori vede il chiamante. Cinque verifiche distinguono i cambiamenti interni dalle rotture dei percorsi pubblici o del comportamento.
- Revisionata [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]: il client usa il valore predefinito solo per una configurazione assente. Verificate la classificazione, la causa originale e la risposta del client a una regressione che il compilatore non rileva.
- Revisionata [[Programmazione/Rust/Pagine/Builder pattern|Builder pattern]]: un solo builder validato sostituisce l'esempio con helper divergente. Verificati i timeout espliciti ed ereditati, la validazione finale e la differenza tra consumo e prestito.
- Revisionata [[Programmazione/Rust/Pagine/Extension traits|Extension traits]]: corretta e provata la firma di `count_where`. Il client distingue prestito e consumo dell'iteratore, import mancanti e metodi omonimi; il wrapper su `Result` conserva la causa.
- Revisionata [[Programmazione/Rust/Pagine/Feature flags ben progettate|Feature flags ben progettate]]: quattro configurazioni di user-ids, controllo reale su target senza `std` e unificazione delle richieste di due chiamanti. La rimozione di `std` dal default rompe il consumer pur lasciando verde la libreria con tutte le feature.
- Revisionata [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]: un client invariato distingue la deprecazione, la rottura della compilazione e il cambiamento di un risultato promesso. Il setter dei retry è effettivo e verificato anche al limite.
- Revisionata [[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]: un solo README funge da guida iniziale e da esempio eseguibile; verificati errori, feature, navigazione e contenuto del pacchetto.
- Conclusi **API Design Idiomatico (8/8)** e la revisione tecnica delle **183/183 note principali uniche Rust**. Le 185 voci dell'indice puntano a 183 file distinti; i **15 promemoria** hanno un indice separato. Lo stato YAML resta riservato all'approvazione dell'utente.

### Prossimi passi

- Il prossimo blocco distinto è [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Promemoria Rust]], a partire da [[Programmazione/Rust/Promemoria/Pagine/Rust - Sintassi essenziale|Sintassi essenziale]].

## 2026-11-23 - Rust: completato Testing, Qualita e Sicurezza

### Fatto

- Revisionata [[Programmazione/Rust/Pagine/Unit test|Unit test]]: **1/14** nel capitolo, **163/183** note principali uniche Rust, **20 restanti**. Provati i limiti numerici e gli errori di parsing in due profili, la selezione esatta di un test e il confine fra modulo figlio e crate esterna.
- Revisionata [[Programmazione/Rust/Pagine/Integration test|Integration test]]: **2/14** nel capitolo, **164/183** note principali uniche Rust, **19 restanti**. Verificati due target Cargo, modulo comune, selezione di un caso e comportamento del processo CLI su input validi ed errati.
- Revisionata [[Programmazione/Rust/Pagine/Doc test|Doc test]]: **3/14** nel capitolo, **165/183** note principali uniche Rust, **18 restanti**. Gli esempi documentano il parser delle due note precedenti; provate la differenza fra test e generazione HTML e le condizioni di successo di `no_run` e `compile_fail`.
- Revisionata [[Programmazione/Rust/Pagine/Mocking|Mocking]]: **4/14** nel capitolo, **166/183** note principali uniche Rust, **17 restanti**. Verificati il confine della scadenza, il risultato e gli invii osservabili con uno stub di orologio e un mock manuale, senza un servizio email.
- Revisionata [[Programmazione/Rust/Pagine/Benchmarking con Criterion|Benchmarking con Criterion]]: **5/14** nel capitolo, **167/183** note principali uniche Rust, **16 restanti**. Verificati i quattro benchmark con Criterion 0.8.2 e il confronto con una baseline nominata, senza dedurre un vincitore da misure brevi.
- Revisionata [[Programmazione/Rust/Pagine/Property testing|Property testing]]: **6/14** nel capitolo, **168/183** note principali uniche Rust, **15 restanti**. Verificati il limite dell'idempotenza, la riduzione del controesempio e il replay del seed con proptest 1.12.0.
- Revisionata [[Programmazione/Rust/Pagine/Fuzzing|Fuzzing]]: **7/14** nel capitolo, **169/183** note principali uniche Rust, **14 restanti**. Verificati su stable il modello dell'istogramma e il target creato da cargo-fuzz 0.13.2. Non eseguita la campagna strumentata con nightly.
- Revisionata [[Programmazione/Rust/Pagine/Snapshot testing|Snapshot testing]]: **8/14** nel capitolo, **170/183** note principali uniche Rust, **13 restanti**. Provati output della CLI, JSON con un solo campo mascherato, approvazione o rifiuto delle proposte e confronto in CI senza aggiornamenti.
- Revisionata [[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]: **9/14** nel capitolo, **171/183** note principali uniche Rust, **12 restanti**. Verificati filtri su casi omonimi, doc test separati, percorso e contenuto del report JUnit, soglia di lentezza e terminazione.
- Revisionata [[Programmazione/Rust/Pagine/Clippy|Clippy]]: **10/14** nel capitolo, **172/183** note principali uniche Rust, **11 restanti**. Provati gli esiti distinti di lint e test sullo stesso parser, una deroga locale che diventa obsoleta e i limiti di target e feature in CI.
- Revisionata [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]: **11/14** nel capitolo, **173/183** note principali uniche Rust, **10 restanti**. Verificati il diff senza scritture, la formattazione ripetuta, i limiti del controllo, l'edizione di stile e l'ambito di pacchetti ed eccezioni.
- Revisionata [[Programmazione/Rust/Pagine/rustdoc|rustdoc]]: **12/14** nel capitolo, **174/183** note principali uniche Rust, **9 restanti**. Corretto l'overflow nell'esempio; verificati HTML pubblico e interno, link intra-doc, documentazione mancante ed esempi eseguibili.
- Revisionata [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]: **13/14** nel capitolo, **175/183** note principali uniche Rust, **8 restanti**. Verificati con dati sintetici il lockfile esplicito, una segnalazione transitiva, la correzione mirata e l'effetto della policy sugli avvisi.
- Revisionata [[Programmazione/Rust/Pagine/cargo deny|cargo deny]]: **14/14** nel capitolo, **176/183** note principali uniche Rust, **7 restanti**. Verificati licenze alternative e cumulative, divieto su feature opzionale, duplicati, sorgenti e fallimento del controllo completo senza database advisory.

### Prossimi passi

- Iniziare API Design Idiomatico da [[Programmazione/Rust/Pagine/Public API design|Public API design]]. Il capitolo elenca otto voci, ma [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]] è già conteggiata.

## 2026-11-22 - Rust: completato Embedded

### Fatto

- Riconfermata [[Programmazione/Rust/Pagine/no_std|no_std]] con test host e build ARM. È la stessa pagina già revisionata in Rust di Sistema, non una nuova nota nel conteggio.
- Revisionata [[Programmazione/Rust/Pagine/embedded-hal|embedded-hal]]: **2/7** voci del capitolo coperte, **157/183** note principali Rust, **26 restanti**. Verificati il comando SPI del LIS3DH in una sola transazione, gli errori del bus e del GPIO, e la compilazione della libreria per ARM.
- Revisionata [[Programmazione/Rust/Pagine/cortex-m|cortex-m]]: **3/7** nel capitolo, **158/183** note principali Rust, **25 restanti**. Verificato nel firmware che il vettore SysTick punti al gestore applicativo solo con l'attributo del runtime; nessun flash su scheda.
- Revisionata [[Programmazione/Rust/Pagine/probe-rs|probe-rs]]: **4/7** nel capitolo, **159/183** note principali Rust, **24 restanti**. Provati il catalogo della CLI 0.32.0 e il passaggio dell'ELF di `blink` al runner Cargo, senza accesso all'hardware.
- Revisionata [[Programmazione/Rust/Pagine/defmt|defmt]]: **5/7** nel capitolo, **160/183** note principali Rust, **23 restanti**. Collegato il firmware con il backend RTT; verificati filtri di compilazione e decodifica con l'ELF effettivo, senza una scheda.
- Revisionata [[Programmazione/Rust/Pagine/RTIC|RTIC]]: **6/7** nel capitolo, **161/183** note principali Rust, **22 restanti**. Verificati il firmware con handler EXTI0 e dispatcher USART2, la compatibilità del binario defmt nella copia del progetto e tre errori rilevati dalla macro RTIC.
- Revisionata [[Programmazione/Rust/Pagine/Embassy|Embassy]]: **7/7**, capitolo Embedded completato; **162/183** note principali Rust, **21 restanti**. Controllati il vettore TIM2 nel firmware e il comportamento del produttore sul PC con il tempo virtuale, senza programmare una scheda.

### Prossimi passi

- Iniziare il capitolo Testing, Qualita e Sicurezza da [[Programmazione/Rust/Pagine/Unit test|Unit test]].

## 2026-11-20 - Rust: completato WebAssembly

### Fatto

- Revisionata [[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]]: **1/5** del capitolo, **152/183** note principali Rust, **31 restanti**. Il progetto compilato e caricato in Chrome mostra la conversione delle stringhe, le eccezioni, il ciclo di vita di una classe esportata e la differenza tra caricare il wrapper e inizializzare il binario.
- Revisionata [[Programmazione/Rust/Pagine/wasm-pack|wasm-pack]]: **2/5**, **153/183** note principali Rust, **30 restanti**. Provati tre pacchetti dalla stessa crate: modulo web in Chrome, CommonJS in Node e bundle webpack in Chrome. Verificati i file inclusi nell'anteprima npm senza pubblicazione.
- Revisionata [[Programmazione/Rust/Pagine/Interop con JavaScript|Interop con JavaScript]]: **3/5**, **154/183** note principali Rust, **29 restanti**. Provati in Chrome il contratto dei dati Serde, l'overflow in dev e release, la copia dei byte e la propagazione di errori da callback e Promise.
- Revisionata [[Programmazione/Rust/Pagine/WASI|WASI]]: **4/5**, **155/183** note principali Rust, **28 restanti**. La stessa CLI gira come modulo P1 e componente P2 in Wasmtime. Verificati stdin, accesso al file solo tramite directory preaperta con il nome corretto e passaggio indipendente dell'ambiente.
- Revisionata [[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly|Limiti del runtime WebAssembly]]: capitolo completo (**5/5**), **156/183** note principali Rust, **27 restanti**. Confrontati il file letto dal programma nativo, il dato fornito dall'host web e l'errore di std::fs nel modulo minimale; distinte compilazione, istanziazione ed esecuzione.

### Prossimi passi

- Iniziare Embedded da [[Programmazione/Rust/Pagine/no_std|no_std]].

## 2026-11-19 - Rust: completato Backend, Networking e Database

### Fatto

- Revisionata [[Programmazione/Rust/Pagine/Networking con reqwest|Networking con reqwest]]: **1/9** del capitolo, **143/183** note principali Rust, **40 restanti**. Provati su loopback la CLI, il contratto di GET e POST, il limite sul corpo e il timeout prima e dopo gli header.
- Revisionata [[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]: **2/9**, **144/183** note principali Rust, **39 restanti**. Verificati su loopback il server con il client reqwest, le rejection degli extractor, gli errori di dominio e l'assegnazione degli ID durante POST concorrenti.
- Revisionata [[Programmazione/Rust/Pagine/Tower e middleware|Tower e middleware]]: **3/9**, **145/183** note principali Rust, **38 restanti**. Verificati ordine e ambito dei layer, risposta HTTP al timeout ed errore generico di Tower, con tempo Tokio sospeso.
- Revisionata [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]: **4/9**, **146/183** note principali Rust, **37 restanti**. Verificati il JSON pubblico, la compatibilità del nome in ingresso e la distinzione fra chiave assente, null e nuovo valore in una patch.
- Revisionata [[Programmazione/Rust/Pagine/SQLx|SQLx]]: **5/9**, **147/183** note principali Rust, **36 restanti**. Verificati i saldi dopo commit e rollback su SQLite, la differenza fra zero righe ed errore SQL e la compilazione delle macro con i metadati offline.
- Revisionata [[Programmazione/Rust/Pagine/Diesel|Diesel]]: **6/9**, **148/183** note principali Rust, **35 restanti**. Verificati mapping posizionale, rollback del lotto, schema reale disallineato e due errori di tipo respinti dal compilatore.
- Revisionata [[Programmazione/Rust/Pagine/SeaORM|SeaORM]]: **7/9**, **149/183** note principali Rust, **34 restanti**. Verificate su SQLite le differenze fra campo omesso, NULL e valore invariato, il join che conserva i padri senza figli e il rollback in caso di duplicato.
- Revisionata [[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]: **8/9**, **150/183** note principali Rust, **33 restanti**. Provati saturazione e rilascio, differenza tra timeout di acquisizione e durata SQL, sonde axum e chiusura del pool; variante PostgreSQL compilata.
- Revisionata [[Programmazione/Rust/Pagine/Background jobs|Background jobs]]: capitolo completo (**9/9**), **151/183** note principali Rust, **32 restanti**. Verificati la perdita di un job accettato solo in RAM, il completamento dei task avviati e il singolo aggiornamento del contatore quando lo stesso evento viene riconsegnato.

### Prossimi passi

- Iniziare WebAssembly da [[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]].

## 2026-11-19 - Rust: completato CLI e Tooling

### Fatto

- Revisionata [[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]: **1/6** del capitolo, **137/183** note principali Rust, **46 restanti**. Verificato il contratto del binario per parsing, errori di I/O, stdout, stderr e codici di uscita.
- Revisionata [[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]: **2/6**, **138/183** note principali Rust, **45 restanti**. Verificate le precedenze per campo e la distinzione tra valori di fonte malformati e vincoli sulla configurazione effettiva.
- Revisionata [[Programmazione/Rust/Pagine/Logging con log|Logging con log]]: **3/6**, **139/183** note principali Rust, **44 restanti**. Verificati filtri per target, priorità di `-v`, output con e senza backend e limite in compilazione release.
- Revisionata [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]: **4/6**, **140/183** note principali Rust, **43 restanti**. Confrontati i record dei task con span figlio, con il solo padre e senza propagazione. Verificata l'attribuzione errata di un evento con una guardia mantenuta durante un await.
- Revisionata [[Programmazione/Rust/Pagine/Error reporting|Error reporting]]: **5/6**, **141/183** note principali Rust, **42 restanti**. Verificati messaggio breve e dettagliato, causa tipizzata dopo il contesto, numero di riga e codici distinti per uso, I/O e dati.
- Revisionata [[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]: capitolo completo (**6/6**), **142/183** note principali Rust, **41 restanti**. Provati offline il pacchetto sorgente, lo ZIP Windows x64 MSVC, il binario estratto e il digest SHA-256.

### Prossimi passi

- Iniziare Backend, Networking e Database da [[Programmazione/Rust/Pagine/Networking con reqwest|Networking con reqwest]].

## 2026-11-19 - Rust: completato Rust di Sistema

### Fatto

- Revisionata [[Programmazione/Rust/Pagine/FFI|FFI]]: **1/13** del capitolo, **124/183** note principali Rust, **59 restanti**.
- Verificati entrambi i versi del confine: il wrapper Rust chiama la libreria C e un programma C usa l'header della nota per chiamare le funzioni di una DLL Rust. Risultati e limiti in [[_Meta/Revisione contenuti|Revisione dei contenuti]].
- Revisionata [[Programmazione/Rust/Pagine/bindgen e cbindgen|bindgen e cbindgen]]: **2/13** del capitolo, **125/183** note principali Rust, **58 restanti**. Verificati i due generatori con compilazione, collegamento e chiamanti reali su Windows x64.
- Revisionata [[Programmazione/Rust/Pagine/libc e nix|libc e nix]]: **3/13** del capitolo, **126/183** note principali Rust, **57 restanti**. Eseguito il PID portabile; esempi e feature di nix controllati per Linux, senza esecuzione Unix.
- Revisionata [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]: **4/13** del capitolo, **127/183** note principali Rust, **56 restanti**. Misurato lo stesso layout in C11 e Rust; testato separatamente il parsing del formato binario.
- Revisionata [[Programmazione/Rust/Pagine/Allocator|Allocator]]: **5/13** del capitolo, **128/183** note principali Rust, **55 restanti**. Verificati il rilascio del valore da parte di Box e il recupero della proprietà quando l'allocatore rifiuta la richiesta.
- Revisionata [[Programmazione/Rust/Pagine/no_std|no_std]]: **6/13** del capitolo, **129/183** note principali Rust, **54 restanti**. Verificate le tre modalità su host e le build core/alloc per un target bare-metal, senza esecuzione su scheda.
- Revisionata [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]: **7/13** del capitolo, **130/183** note principali Rust, **53 restanti**. Verificati su host gli errori GPIO e, nell'ELF per NUCLEO-F401RE, i vettori di avvio. Nessuna scheda programmata.
- Revisionata [[Programmazione/Rust/Pagine/File descriptor|File descriptor]]: **8/13** del capitolo, **131/183** note principali Rust, **52 restanti**. Verificati sul file i cursori e con Miri/Linux il trasferimento e la chiusura dei descriptor di una pipe.
- Revisionata [[Programmazione/Rust/Pagine/Memory mapping|Memory mapping]]: **9/13** del capitolo, **132/183** note principali Rust, **51 restanti**. Verificati su file privati la lettura dopo il drop del File e i diversi effetti delle scritture condivise e private.
- Revisionata [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]: **10/13** del capitolo, **133/183** note principali Rust, **50 restanti**. Stessa CLI eseguita su Windows e su WASI Preview 1; per Linux ARM64 verificato il solo controllo senza collegamento.
- Revisionata [[Programmazione/Rust/Pagine/Linking|Linking]]: **11/13** del capitolo, **134/183** note principali Rust, **49 restanti**. Su Windows x64 la stessa CLI usa un archivio statico o una DLL; verificata la differenza fra errori del linker e del loader.
- Revisionata [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]: **12/13** del capitolo, **135/183** note principali Rust, **48 restanti**. Confrontate due strategie di concatenazione separando correttezza, crescita del buffer e tempo per lotto, senza attribuire un vantaggio di velocità generale.
- Revisionata [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]: **13/13**, capitolo completo. **136/183** note principali Rust, **47 restanti**. Separati layout garantito, dispatch in prestito e codice generato per ciclo e iteratore con lo stesso contratto di overflow.

### Prossimi passi

- Iniziare **CLI e Tooling** da [[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]].

## 2026-11-18 - Rust: completato Unsafe Rust in Profondita

### Fatto

- Revisionate **9/9** note, da **Unsafe Rust** a **Unsafe abstractions sicure**: **123/183** note principali Rust, **60 restanti**. Nella prima nota, distinti contratto della firma, responsabilità del blocco e garanzie di un wrapper safe.
- Eseguiti i tre esempi di Unsafe Rust e le verifiche su diagnostiche, prestiti e comportamento in release. Raw pointers: quattro esempi con e senza ottimizzazioni; confronti su indici e buffer vuoti, letture non allineate. Dettagli in [[_Meta/Revisione contenuti|Revisione dei contenuti]].
- Unsafe functions: corretto il contratto del buffer esterno e confrontati prestito vincolato all'ingresso e copia posseduta. Regressione delle tre note: **10/10**.
- Unsafe traits: collegata la garanzia dell'implementazione all'accesso del consumatore. Verificati il trasferimento di una cella posseduta e i limiti di Send/Sync. Regressione delle quattro note: **14/14**.
- Invariants: verificati costruttori, mutazioni, stato su errore e panic; una slice lega la durata della vista ai dati. Regressione delle cinque note: **19/19**.
- Aliasing rules: distinti prestito derivato, copia del raw pointer, accesso a elementi disgiunti e durata della guardia RefCell. Regressione delle sei note: **23/23**.
- Undefined behavior: confrontati accesso controllato, panic e precondizione unsafe; parser di flag verificato su tutti i 256 byte. Regressione delle sette note: **26/26**.
- Miri: eseguiti i due unit test della nota sia con Cargo sia con l'interprete e verificato il filtro esatto. Nightly isolata rimossa dopo la prova, toolchain predefinita invariata.
- Unsafe abstractions sicure: verificati rappresentazione non vuota, contratto dello split e durata delle viste del buffer. Regressione dell'intero capitolo su stable: **32 passati, 1 prova Miri opzionale saltata**, già eseguita con nightly nel passo precedente.

### Prossimi passi

- Iniziare **Rust di Sistema** da **FFI**. I promemoria restano separati dal conteggio.
