# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-11-27 - GitHub: completati note principali e promemoria

### Fatto

- Revisionate le sette note di Fondamenti di GitHub. Verificati con Git in repository temporanei identità per clone, pubblicazione di un branch, aggiornamento del fork e file già tracciati. Nessuna operazione sull’account GitHub.
- Revisionate le sette note di Flusso di lavoro base. Verificati il diff a tre punti, staging e amend, la parentela dopo merge, squash e rebase; distinti feedback di review, blocco del merge e chiusura dell’issue.
- Revisionate le sei note di Interfaccia e strumenti. Corretti i filtri per le richieste di review e gli esempi di ricerca codice; provati in locale il commit selettivo, la ricerca su commit e file su disco, la lettura di un file a SHA fissato e la sintassi GFM.
- Revisionate le sette note di Collaborazione e project management. Chiariti gli effetti di Projects sulle issue, il passaggio da Discussion a issue, i template, gli owner dei file e la scelta dei controlli per i monorepo. Verificati localmente il modulo YAML e gli esempi Git.
- Revisionate le sette note di Protezione del repository. Distinti precedenza delle regole classiche e cumulo dei ruleset, check pre-merge e deploy Quartz, tag annotati e protezioni remote, accessi al repository e ownership per cartella.
- Revisionate le sette note di Sicurezza e supply chain. Verificati con i file del vault il percorso npm per Dependabot e una dipendenza transitiva di Quartz; distinti inventario e provenienza, alert e revoca, token personale e token del job.
- Revisionate le sette note di Fondamenti GitHub Actions. Il workflow Quartz mostra la differenza tra build e pubblicazione; gli esempi locali verificano la directory di npm, il passaggio di output tra job e l’assenza di un secret.
- Revisionate le sette note di CI con GitHub Actions. Corretti quattro riferimenti YAML spezzati; verificati gli script, il report JUnit dei test falliti, la matrix e la distinzione tra cache, artifact e pubblicazione.
- Revisionate le sette note di CD, release e deploy. Confrontati gli esempi Pages con il workflow del vault; verificati in locale l’archivio di release e i file del package npm senza pubblicare nulla.
- Revisionate le sette note di Actions avanzato. Distinti workflow e composite, run attivo e in attesa, cron locale e UTC, durata percepita e minuti complessivi dei runner. Eseguiti in locale gli esempi PowerShell della composite action e del debug.
- Revisionate le sette note di API e automazione: paginazione REST e GraphQL, verifica e riconsegna dei webhook, identità e permessi per il triage di issue e PR. Controlli su dati locali, senza operazioni sui repository remoti.
- Revisionate le sette note di Governance e manutenzione. Verificati in repository locali il ripristino da bundle, il piano di un mirror e il commit di un tag annotato; distinti trasferimento, archiviazione, release e deploy.
- Revisionate le sei procedure pratiche: primo push, apertura di una PR, protezione della base, CI, pubblicazione Quartz e gestione dei secret. Provati il confronto di una PR con base avanzata e il controllo locale di una credenziale fittizia.
- Revisionate le cinque checklist. Ogni decisione di condivisione, merge, accettazione del rischio, deploy o rilascio indica l'evidenza attesa. Ricontrollati in locale lo storico di un file rimosso e il commit dei tag leggeri e annotati.
- Revisionate le cinque note di troubleshooting: diagnosi di PR e conflitti, run e tentativi Actions, autorizzazioni e disponibilità dei secret. Riprodotti un diff vuoto con commit aggiuntivi e un conflitto con marcatori aggiunti all'indice per errore.
- Revisionati i sei promemoria finali: remote, workflow base, trigger, matrix e artifact, secret e OIDC, sicurezza repository. Verificati i riferimenti ai file del vault e la produzione del report TAP; aggiornati gli esempi dei permessi e di Dependabot.
- Percorso GitHub concluso: **99/99** note principali e **15/15** promemoria, con corrispondenza tra indici e file. Regressione GitHub: **85/85** test. La revisione tecnica non cambia lo stato di approvazione personale.

### Prossimi passi

- Nessuna scheda GitHub residua in questa passata. Ricontrollare gli esempi collegati quando cambiano il workflow Pages, il lockfile del sito o le versioni delle action.

## 2026-11-27 - Programmi open source: chiusi gli ultimi avvisi editoriali

### Fatto

- Completate le fonti e rivisti gli esempi di Aider, Bruno, MusicBrainz Picard e OpenSCAD. Verificato il foro passante della rondella con due esportazioni STL reali; le indicazioni sugli altri tre strumenti sono state controllate sui rispettivi manuali.
- Rapporto del vault: 911/911 documenti raggiungibili, nessun errore e nessun avviso editoriale. Il controllo non equivale all’approvazione personale delle note.

## 2026-11-26 - GitHub e Rust: completate le fonti dei promemoria segnalati

### Fatto

- Aggiunte fonti ufficiali e corretti gli esempi Git e GitHub CLI nelle nove schede segnalate. La scheda su issue e progetti mostra ora come aggiungere un’issue esistente a un Project.
- Provati in un repository locale temporaneo staging e ripristino, confronto tra branch divergenti, revert di un intervallo e tag annotato. I comandi GitHub sono stati verificati sulla documentazione, senza scritture remote.
- Aggiunti 19 riferimenti ufficiali ai sette promemoria Rust sul linguaggio; ricompilati ed eseguiti tutti i 33 esempi senza modificarli.

### Prossimi passi

- Le quattro schede open source ancora segnalate in questo passaggio sono state completate il 27 novembre.

## 2026-11-26 - Clean Code: revisione tecnica completata

### Fatto

- Revisionate le 12 note del capitolo. Gli esempi distinguono una rinomina da un cambiamento di contratto, una regola unica dalle sue copie e un tentativo registrato da una lettura riuscita. Nove prove sugli esempi superate.
- Completate le sette note di Strutture Dati e Modellazione. Verificati gli esempi di confronto per valore, DTO, invarianti, union e mutabilità; **15/15** prove complessive per le prime **19/109** note.
- Revisionate le otto note su file, moduli e ambiente: ingresso pubblico Node verificato da un consumatore, comandi del README eseguiti sul vault e script Prettier provati in isolamento. **20/20** prove sugli esempi per le prime **27/109** note.
- Completate le nove note di Programmazione ad Oggetti e Design: sostituibilità, DIP e ISP verificati sia nei tipi sia nel comportamento. **27/27** prove per le prime **36/109** note.
- Revisionate le sette note di Concetti Funzionali e Composizione: verificati anche l'ordine dei passaggi, la stabilità di una ricevuta e l'equivalenza delle guardie con valori mancanti. **34/34** prove per le prime **43/109** note.
- Completate le 15 note di Contratti, Tipi e Qualità: esempi e test collegati fra pagine, unità e valute esplicite, prova di integrazione su SQLite in memoria. **44/44** prove per le prime **58/109** note.
- Completate le sette note di Standard Library Pratica. Verificate assenza e guasto, scelta dei campi pubblici, doppia ora locale a Roma e creazione esclusiva di file su disco. **51/51** prove per le prime **65/109** note.
- Revisionate le nove note di Internals e Gestione Risorse. Verificati rollback SQLite, chiusura del writer, doppio errore di cleanup, letture in corso durante l'invalidazione e contratto dell'export legacy. **60/60** prove per le prime **74/109** note.
- Revisionate le sette note di Concorrenza e Parallelismo. Verificati gli ordini di completamento, i lock nativi Node, la contesa fra connessioni SQLite e la riconsegna simulata dopo un ack perso. **67/67** prove per le prime **81/109** note.
- Concluse le sei note rimanenti di Performance e Distribuzione: conteggio reale delle query SQLite, profilo CPU Node, allocazioni intermedie e transizioni delle sonde. Configurazione applicativa già revisionata. **73/73** prove per le prime **87/109** note.
- Revisionate le sette note di Web, API e Database. Verificati il percorso di emissione fattura dal controller a SQLite, il rollback dell'outbox, la paginazione a pari data e la migrazione con vecchi scrittori. **80/80** prove per le prime **94/109** note.
- Revisionate le sette note di Data, Automazione e LLM. Verificati listino CSV e scarti, celle ripetibili, rilancio della CLI e distinzione fra output valido, citazione presente e proposta da approvare. **87/87** prove per le prime **101/109** note.
- Completate le otto note di Tooling e Qualità del Codice, incluse le prove di soglia per il mutation testing e dello staging parziale per l'hook Git. Totale: **109/109** note e **95** prove verificate. Le otto pagine Quartz conservano tutti gli esempi e le fonti dei Markdown.

### Prossimi passi

- La revisione tecnica di Clean Code è conclusa; l'approvazione personale resta all'utente.

## 2026-11-26 - Strutture di progetto: PHP, Python e React

### Fatto

- Revisionate tutte e tre le schede e chiarita la scelta nell'indice: PHP server-rendered oppure frontend React e backend Python accoppiati tramite il contratto HTTP.
- Verificati template PHP con PHPUnit, transazioni SQLite, build JSX, type checking dell'API client e scambio di dati con le route FastAPI. Le quattro prove estraggono il codice direttamente dalle note.

### Prossimi passi

- Nessuna scheda di Strutture di progetto da revisionare in questo passaggio. Prossimo percorso proposto: [[Programmazione/Clean Code/Indice Clean Code|Clean Code]].

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
