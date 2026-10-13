# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-10-13 - Revisione contenuti JavaScript

### Fatto

- Dal 14 settembre al 13 ottobre lette e corrette tutte le 87 note JavaScript: tutte le 26 del Percorso Base, tutte le 23 del Percorso Intermedio, Web Workers, Service Workers e PWA, Web Components, Scheduling Browser, WebAssembly interop, Memory Lifecycle, Garbage Collection, Memory Leaks, WeakMap e WeakSet, Optimization, Buffer e Typed Arrays, Proxy e Reflect, Circular Dependencies, Decorators, Sicurezza, CORS, Content Security Policy, Sanitizzazione input, Supply chain security npm e Real-time con WebSocket; completato Node.js Runtime con Node.js Basics, File System fs, Path e Process, Events Node.js, Streams Node.js, Buffer Node.js, HTTP server, Child process e Worker threads; completato Tooling e Qualita con Testing, ESLint, Prettier, Vite, Bundling e tree shaking e Source maps e debugging. Completata Applicazioni Frontend e Backend anche con SPA e routing lato client, API REST e Server-side rendering. Fonti primarie e contratti espliciti degli esempi.
- Risolti controlli di input troppo permissivi, esempi con dipendenze implicite e spiegazioni incomplete su scope, asincronia e gestione degli errori.
- Corretti il fallback GET del form con password, i rifiuti asincroni non gestiti, le assunzioni sullo storage e gli esempi di rendering/delegazione/navigazione.
- Corretti this/arguments delle arrow, default e destructuring, copie superficiali e selezione dei campi pubblici; approfonditi moduli browser/Node, live binding e import su richiesta con attesa/errori.
- Corretti copie/riferimenti condivisi, chiavi proprie ed ereditate, array sparsi, Map/Set, parsing distinto da schema JSON, date/fusi/durate e regex; controllati gli esempi di calendario in piu timezone.
- Corretti scope globale/modulo, TDZ e import, cattura dei binding, receiver/this e prototype delle funzioni/istanze. Migliorati esempi di sessione e formattazione, rimozione dei listener e contatori con input controllati.
- Corretti campi di classe/setter, super e inizializzazione, privacy e riferimenti condivisi, static privati ereditati, default e vincoli dei descrittori. Esempi con invarianti controllate, errori intenzionali distinti e limiti di freeze/JSON espliciti.
- Corretti task/microtask e opportunita di rendering, callback sincrone/asincrone, canali di errore e return, stati e composizione delle Promise. Aggiunti esempi completi di lavoro a blocchi, lettura error-first, cleanup dei listener e Fetch con schema dichiarato.
- Corretti combinatori e input vuoti, timeout e abort con cleanup fino alla lettura del corpo, return await e top-level await. Riscritto il pool per evitare rifiuti non gestiti, fermare nuovi avvii dopo un errore e attendere i lavori gia attivi.
- Corretti wrapper Fetch e header, risposte vuote, FormData, consumo del corpo e schema dei dati. Approfonditi signal monouso, motivi di abort, any/timeout, cleanup dei listener e ricerca protetta da risultati obsoleti.
- Corretti XHR e ciclo della UI AJAX; completati parsing, invio limitato e backoff WebSocket. Allineata Real-time con WebSocket con start/stop, cleanup e retry limitati, senza ripartenza dopo stop volontario.
- Chiariti purezza, mutazione locale, currying e composizione; separati core e shell DOM. Corretti Observer, selezione delle strategie e wrapper che perdeva this; precisati scope dei moduli e limiti dei pattern.
- Corretti clonazione, transfer, tabelle freeze/seal e deepFreeze con cicli/accessor. Completati protocolli iterator, next/return/throw e paginazione lazy con schema, limite richieste e abort.
- Corretti protocollo, clone/transfer, errori e cancellazione dei worker. Riscritti lifecycle, scope, cache e fallback dei Service Worker; separati installabilita PWA, offline e API opzionali. Nessun worker installato in Quartz.
- Corretti lifecycle, upgrade, attributi/proprieta, eventi e testo non fidato nei Web Components; aggiunti toggle con tastiera/stato e cleanup esterno. Corretti timeout idle, polling, rAF e lavoro a blocchi con fallback, budget e abort.
- Completata WebAssembly interop con sorgente WAT compilabile, loader HTTP/streaming/fallback, ABI numerica, UTF-8, crescita e ownership della memoria, errori e limiti CSP/toolchain. WABT 1.0.39 isolato in una cartella temporanea esterna, senza modifiche alle dipendenze del sito.
- Corretti stack/heap intesi come collocazione obbligatoria, alias e root del GC. Aggiunti cleanup idempotenti per widget e timer, esempi completi di cicli/Map, WeakRef e FinalizationRegistry; distinti raccolta, riuso, RSS e metriche Node. I test non promettono rilascio fisico o tempi del collector.
- Corretti listener anonimi, abort tardivo, diagnosi dei leak e limiti delle cache; aggiunti vista cancellabile, LRU e richiesta protetta dopo lo smontaggio. Chiariti simboli, identita, ephemeron, valori undefined e API recenti di WeakMap, stato privato e visita iterativa senza duplicare nodi.
- Completati misurazione e limiti delle ottimizzazioni, debounce/throttle e filtro con cleanup, letture DOM e border-box. Corretti copie/viste/conversioni/transfer, ArrayBuffer ridimensionabili, DataView con offset, UTF-8 strict e Buffer Node; aggiunto parser didattico con limiti dichiarati e controlli sui dati.
- Corretti receiver, invarianti, defineProperty e limiti dei Proxy; completati validazione, revoca, chiamate e costruzione. Resi eseguibili e deterministici i casi ESM/CommonJS con entry point espliciti, export parziali/sostituiti, composizione e import lazy; aggiunto il caso di attesa reciproca con top-level await.
- Distinti decorator moderni e legacy, stato TC39 datato e supporto del compilatore. Corretti timing async, validazione dei campi e auto-accessor; completati composizione, addInitializer, binding e metadata. Esempi trasformati con esbuild 0.27.3, non presentati come prova di sintassi nativa.
- Distinti XSS, CSRF, autorizzazione, cookie e storage; aggiunti rendering testuale, URL con protocollo/origine verificati e invio con token CSRF dal contratto esplicito. Riscritta CORS con demo locale completa, credenziali, preflight, cache e header esposti; documentata la divergenza osservata fra Chrome e Fetch per Authorization con wildcard.
- Completate CSP e Sanitizzazione input: nonce per risposta, hash esatti, fallback, strict-dynamic e report-only; distinti validazione, encoding e HTML sanitizzato. Aggiunti moduli eseguibili e allowlist DOMPurify 3.4.16, installato solo in una directory temporanea esterna. Nessuna modifica alla CSP o alle dipendenze di Quartz.
- Aggiunti 1209 test Node.js e 274 test Chrome, tutti superati (1483 totali) con file eseguiti serialmente e senza build concorrente; superati anche i 9 test della trasformazione e i controlli strutturali (911 documenti, zero errori, 597 avvisi editoriali). Il totale include 11 gruppi di controllo sintattico dei promemoria, distinti dall'esecuzione dei frammenti. Fixture loopback e directory temporanee richiedono esecuzione autorizzata fuori dal sandbox che ne blocca l'accesso.
- Completata Supply chain security npm con limiti di lockfile/audit/firme, policy degli script, registry, CI e OIDC. Aggiunta demo npm 11.19.0 e 12 test CLI offline su fixture temporanee, senza aggiornamenti delle dipendenze del sito. Distinti i cambiamenti documentati di npm 12 dai comportamenti provati con npm 11.
- Creato il registro `_Meta/Revisione contenuti.md` con copertura, limiti e prossimo blocco.
- Completata Node.js Basics con formati ESM/CommonJS espliciti, working directory, argomenti, ambiente e gestione degli errori. Aggiunta CLI completa senza dipendenze e 38 test reali di Node/npm su fixture isolate; dichiarati limiti di memoria/Unicode e separazione fra runtime e package manager.
- Completate File System fs e Path e Process: scritture esclusive, JSON validato senza sovrascrivere il sorgente, stream con errori, handle e metadati; distinti cwd/modulo/URL, semantica Windows/POSIX e autorizzazione dei percorsi. Aggiunti parsing CLI e ambiente con precedenza dichiarata e 77 test su fixture temporanee, inclusa una junction/link interna alla fixture.
- Completate Events Node.js e Streams Node.js: dispatch sincrono, errori/rejection, cleanup e attese preventive, job con worker esplicito; chunk/framing/UTF-8, backpressure, fine/chiusura, scrittura e gzip esclusivi, JSON Lines e cancellazione senza rollback. Aggiunti 58 test su snippet reali, filesystem temporaneo e stream controllati.
- Completate Buffer Node.js e HTTP server: copie/viste/encoding, hex rigoroso, interi e lettura Base64 limitata; server locale con routing, body limitato, JSON/schema, HEAD, errori async, timeout e shutdown. Aggiunti 79 test Node su file temporanei e servizi loopback, con limiti delle prove espliciti.
- Completate Child process e Worker threads: programmi Node portabili, argv/ambiente/output, exit/close e limiti dei segnali; calcolo completo e protocollo one-shot con attesa della chiusura, errori tardivi, abort/timeout, clone e transfer. Aggiunti 90 test su processi e thread reali, senza rete esterna o modifiche alle dipendenze.
- Completate Testing ed ESLint: runner/assertion/ambiente, esempi Node completi e asincroni, contratti e limiti di mock/coverage; flat config ESLint 10 con globali distinti, regole reali, ignore, fix ed exit code. Aggiunti 74 test, incluse due alterazioni controllate nelle fixture e la correzione di print-config. Tool ESLint installati solo in una directory temporanea esterna.
- Completate Prettier e Vite: formatter distinto dai controlli logici, configurazione/ignore/CI e output esatto; progetto frontend completo con base, asset, env pubblici, dev/build/preview e limiti HMR/tipi. Aggiunti 32 test Node/browser con Prettier 3.9.10 e Vite 8.3.4 installati soltanto in una directory temporanea esterna.
- Completate Bundling e tree shaking e Source maps e debugging: distinti effetti al caricamento e nel corpo delle funzioni, namespace statici, sideEffects/PURE, splitting e DCE; mappe esatte di build, hidden non privato e diagnosi di un errore intenzionale. Aggiunti 24 test, inclusi quattro Chrome, senza nuove dipendenze del sito.
- Completate SPA e routing lato client e API REST: corrette intercettazione dei link, cronologia e fallback; distinti vincoli REST, semantica HTTP e contratto del client. Aggiunti router didattico completo, client validato e 44 test Node/Chrome, con demo offline e fixture HTTP locali.
- Completata Server-side rendering: distinti SSR, SSG, hydration e progressive enhancement; corretti escaping, cache privata e limiti dell'hosting. Aggiunto demo Node completo con ricerca server e ordinamento opzionale, verificato con 33 test, di cui otto Chrome. Nessuna nuova dipendenza; React hydration, RSC e streaming restano spiegazioni, non funzionalita provate dal demo.
- Completati anche tutti gli 11 promemoria JavaScript: corretti contesti degli snippet, export ESM, copie e campi pubblici, raggruppamenti, regex/date, cleanup Promise, timeout Fetch fino alla lettura del corpo, storage e DOM. Mantenuti sintetici con rinvii alla teoria; aggiunti 64 test Node/Chrome, senza nuove dipendenze.
- Verificata l'ultima build Quartz: 2.003 HTML e 135.332 riferimenti interni senza errori. Controllati tutti gli 11 promemoria con Chrome 155.0.8059.40 su desktop/mobile, inclusi codice e scorrimento delle cinque tabelle; ispezionati 11 screenshot rappresentativi delle schede. Nessun overflow del documento, errore JavaScript o caricamento HTTP fallito. Anteprima esistente mantenuta sulla porta 8082; nessun commit, push o deploy remoto.

### Decisioni

- La revisione tecnica procede per blocchi coerenti; i risultati non si estendono automaticamente alle altre note.
- Le note rimangono `non revisionato` fino al controllo dell'utente.
- I test degli esempi sono separati dai controlli di pubblicazione. Le risposte HTTP sono simulate o servite da una fixture temporanea su loopback; nessuna dipendenza da backend o servizi esterni.

### Prossimi passi

- Completata questa passata su tutte le 87 note JavaScript in Pagine e sugli 11 promemoria, 98 note complessive. Restano i contenuti degli altri argomenti, incluso il punto segnalato su SSR e SSG in React; Symbols e Iteration protocols rimandano a note gia controllate. Non confondere questa copertura con l'approvazione dell'utente.

## 2026-09-13 - Vault focalizzato e navigazione unificata

### Fatto

- Conservate solo le aree Programmazione, Stampante 3D e Programmi open source; rimosse le altre aree tematiche dalla versione corrente.
- Riorganizzati Home, indici principali e promemoria locali dei linguaggi; normalizzati PostgreSQL, nomi, YAML e wikilink completi.
- Corrette gerarchie dei titoli, comandi copiabili e schede software troppo sintetiche; riscritta l'introduzione ai componenti FDM.
- Adattata la pubblicazione Quartz: indici come pagine iniziali di cartella, reindirizzamenti per i percorsi spostati e controlli automatici prima del deploy.
- Aggiunti README, test della trasformazione e rapporto strutturale riproducibile.
- Verificati 911 documenti raggiungibili, 9 test automatici e 2003 HTML senza link o ancore mancanti; controllate navigazione, ricerca e resa desktop/mobile.

### Decisioni

- Markdown e fonte unica; gli indici non usano YAML e gli HTML restano generati.
- Nel sito gli indici curati non ripetono l'elenco automatico di cartella; i font hanno fallback locali e gli URL spostati dispongono di redirect.
- Le tre aree mantenute sono pubblicabili. Raw, template, metadati e infrastruttura restano esclusi dal sito.
- La guida Marlin resta fissata alla release 2.1.2.8. I promemoria rimandano alla teoria, senza duplicarla.
- Le note modificate restano non revisionate. La normalizzazione non equivale a certificare ogni esempio tecnico.

### Prossimi passi

- Integrare progressivamente le fonti mancanti indicate dal rapporto editoriale.
- Rivedere i contenuti modificati prima di commit e pubblicazione.

## 2026-09-05 - Correzioni contenuti Programmazione

### Fatto

- Corretti gli esempi dei promemoria JavaScript, Python, Rust e PostgreSQL segnalati dalla revisione.
- Allineate nota e promemoria su RLS, contesto per transazione e connessioni riutilizzate, e su sintassi e permessi dei team CODEOWNERS.
- Completati caricamento iniziale, retry, selezione e annullamento richieste nell'esempio di struttura frontend React.
- Approfondite varianza TypeScript, opzioni delle dataclass Python e integrazione delle traduzioni React.

### Decisioni

- I promemoria restano sintetici; spiegazioni e limiti appartengono alle note teoriche collegate.
- Le note modificate restano con `status: "non revisionato"` in attesa del controllo dell'utente.

### Prossimi passi

- Verificare gli esempi Rust con Cargo e quelli PostgreSQL su un database di prova.
- Proseguire la revisione tecnica delle note non ancora approfondite.

## 2026-07-30 - Promemoria di Programmazione

### Fatto

- Creata `Programmazione/Promemoria` come area di consultazione rapida separata dagli appunti teorici.
- Aggiunti l'indice generale, l'indice JavaScript e undici promemoria operativi.
- Aggiunti l'indice Python e tredici promemoria su linguaggio, collezioni, file, dati, HTTP, ambienti, asincronia ed errori.
- Aggiunti l'indice Rust e quindici promemoria su ownership, tipi, errori, astrazioni, I/O, Cargo, concorrenza e test.
- Aggiunti l'indice PostgreSQL e quindici promemoria su query, funzioni, schema, prestazioni, transazioni, privilegi, backup e manutenzione.
- Aggiunti l'indice GitHub e quindici promemoria su Git, collaborazione, Actions, release, regole e sicurezza.
- Collegata la nuova area da `Home.md`.

### Decisioni

- Le schede contengono soprattutto sintassi, tabelle e snippet copiabili.
- Le spiegazioni approfondite rimangono nelle note del linguaggio e vengono richiamate tramite wikilink.
- Le pagine sono organizzate per categoria operativa, non per singola funzione.

### Prossimi passi

- Estendere il promemoria agli altri linguaggi mantenendo la stessa impostazione.

## 2026-07-28 - Area Strutture di Progetto

### Fatto

- Creata `Programmazione/Strutture di Progetto` con un indice essenziale dedicato alle strutture gia documentate.
- Collegata la nuova area da `Home.md`.
- Creata la prima nota su una struttura PHP server-rendered senza framework, con front controller, routing, livelli, test e sicurezza.
- Collegata la pagina PHP nell'indice e resa pubblicabile con Quartz.
- Creata la nota sulla struttura di un backend API Python a livelli, con routing, service, repository, validazione, persistenza e strategia di test.
- Creata la nota sulla struttura di un frontend React con Vite, componenti, Context, API layer, tipi e strategia di test.

### Decisioni

- Gli indici restano senza frontmatter YAML.
- L'indice contiene soltanto le pagine gia create.
- I file `.http` sono documentati come richieste manuali e restano distinti dai test automatici.
- Per il frontend React va scelta una strategia coerente tra JavaScript con JSDoc e TypeScript con componenti `.tsx`.
- Le strutture propongono solo livelli con responsabilita concreta, evitando repository, service e interfacce puramente formali.

### Prossimi passi

- Aggiungere altre strutture solo quando verranno realmente documentate.

## 2026-07-27 - Pubblicazione area Stampante 3D

### Fatto

- Aggiunta `Stampante 3D` alle aree elaborate dal sito Quartz.
- Rese pubbliche le note generali e l'intera guida Marlin tramite `publish: true`.
- Mantenuti gli indici senza frontmatter: lo script di preparazione li pubblica automaticamente.
- Verificata la build locale: 34 note di contenuto e 2 indici inclusi, con 40 pagine HTML generate considerando gli alias.

### Decisioni

- La pubblicazione resta opt-in e limitata alle aree elencate in `site/publish.config.json`.
- Le note private delle altre aree non vengono copiate nel contenuto elaborato da Quartz.

### Prossimi passi

- Eseguire commit e push su `main` per avviare il workflow GitHub Pages.

## 2026-07-26 - Avanzamento guida Marlin

### Fatto

- Completata la nota del blocco `Sonda` su probe Z, offset XYZ, BLTouch, margini, clearances, affidabilita e test di ripetibilita.
- Aggiunta una procedura di collaudo progressiva con `M119`, `M401`, `M402`, `G28 Z`, `G30`, `M851` e `M48`.
- Collegata la nuova pagina nell'indice Marlin.
- Completato il blocco `Livellamento` con due note su metodi ABL/MBL/UBL, mesh, stato `M420`, Z Safe Homing, multi-Z, `G34`, `M422` e `G35`.
- Collegate entrambe le pagine di livellamento nell'indice Marlin.
- Completato il blocco `Interfaccia` con due note su display, controller, TFT, DWIN, host G-code, encoder, touch, lingua, menu e feedback acustico.
- Collegate entrambe le pagine dell'interfaccia nell'indice Marlin.
- Completato il blocco `Memoria e supporti` con due note su EEPROM, scheda SD, persistenza, migrazione, G-code di configurazione e diagnostica.
- Collegate entrambe le pagine di memoria e supporti nell'indice Marlin.
- Completato il blocco `Accessori` con due note su runout, motion sensor, Advanced Pause, power-loss recovery, PSU, rele, luci, LED, buzzer e servo.
- Collegate entrambe le pagine degli accessori nell'indice Marlin.
- Completato il blocco `Taratura` con una procedura progressiva di collaudo, calibrazione, salvataggio e stampa di accettazione.
- Collegata la procedura completa di taratura nell'indice Marlin.
- Completato il blocco `Diagnostica` con due note su build, upload, boot, EEPROM, movimento, termica, estrusione, probe e leveling.
- Collegate entrambe le pagine di diagnostica nell'indice Marlin.
- Completato il blocco `Consultazione` con il riferimento rapido delle direttive e la procedura di migrazione tra release.
- Collegate entrambe le pagine di consultazione nell'indice Marlin.

### Decisioni

- Cablaggio e livelli logici sono descritti in modo indipendente dai colori dei fili e da una specifica motherboard.
- Le opzioni avanzate del BLTouch restano disabilitate per impostazione prudente finche l'hardware non e stato verificato.
- Offset e ripetibilita sono trattati separatamente: una misura precisa puo comunque avere un offset assoluto errato.
- Tramming, allineamento Z, mesh e offset sono documentati come operazioni distinte.
- Per lo start G-code sono separati il flusso che misura con `G29` e quello che riusa una mesh con `M420 S1`.
- Display pilotati da Marlin, smart display e touchscreen host G-code sono documentati come architetture differenti.
- La selezione hardware usa una sola direttiva controller e, per i TFT, una sola combinazione di driver, interfaccia, risoluzione e UI.
- Default compilati, valori runtime e dati persistenti sono documentati come livelli distinti.
- Le modifiche G-code vengono provate in RAM prima di `M500`; slot SD, scrittura e comandi post-abort richiedono una verifica esplicita.
- Runout e power-loss recovery sono trattati come gestioni di eventi differenti, entrambe dipendenti dallo stato reale del job e della macchina.
- GPIO, segnali PWM e uscite di potenza sono distinti; carichi, rele, LED e servo richiedono uno stadio elettrico adeguato.
- La taratura segue dipendenze esplicite: sicurezza e sensori, meccanica, homing, steps, termica, livellamento, dinamica, estrusione e compensazioni.
- I valori vengono provati in RAM, confrontati con una base registrata e salvati soltanto dopo un criterio di accettazione.
- Gli errori vengono classificati per fase e corretti partendo dalla prima causa osservabile, senza aggirare `SanityCheck` o le protezioni.
- La diagnostica operativa distingue hardware, meccanica, firmware, EEPROM, G-code, slicer e materiale prima di modificare i parametri.
- Il riferimento rapido distingue direttive compile-time, default compilati, RAM, EEPROM e G-code del job.
- La migrazione usa file puliti della release destinazione e trasferisce decisioni per blocchi verificabili, mantenendo un rollback.

### Prossimi passi

- Eseguire un controllo finale di completezza, frontmatter, collegamenti e coerenza dell'intera sezione Marlin.

## 2026-07-25 - Riprogettazione sezione Marlin

### Fatto

- Rimossa dall'indice `Stampante 3D` l'intera sezione dedicata a Marlin.
- Eliminate le 14 note Marlin presenti in `Stampante 3D/Pagine`.
- Conservata la nota generale `Introduzione Stamapante 3D.md` con le modifiche locali gia presenti.
- Verificata l'assenza di collegamenti alle pagine rimosse nelle altre aree del vault.
- Creato `Stampante 3D/Marlin/Indice Marlin.md` con un nuovo percorso dedicato alla configurazione completa del firmware.
- Collegato il nuovo indice Marlin dall'indice principale `Stampante 3D`.
- Impostata la release stabile `Marlin 2.1.2.8` come riferimento tecnico della guida.
- Completate le tre note del blocco `Orientamento e configurazione`: introduzione e compatibilita, struttura dei file, metodo di configurazione e build.
- Completate le note del blocco `Elettronica`: scheda madre, porte seriali e pin; alimentazione e protezioni hardware.
- Completate le note del blocco `Meccanica`: tipo di stampante e cinematica; dimensioni del piatto, area di lavoro e limiti.
- Completate le note del blocco `Motori, driver e homing`: passi e direzioni, driver e corrente, endstop e Sensorless Homing.
- Completate le note di `Pianificazione del movimento`: limiti dinamici, Jerk e Junction Deviation; planner, segmentazione e curve.
- Completate le note di `Compensazioni`: Linear Advance, Input Shaping, Skew, Backlash, Babystepping e regolazioni runtime.
- Completate le note di `Estrusione`: architetture hotend e multi-materiale, gestione del filamento, limiti di sicurezza, retrazione e cambio utensile.
- Completate le note di `Temperature`: sensori e limiti, controlli PID/MPC, protezioni termiche, ventole e circuiti di raffreddamento.

### Decisioni

- La documentazione e organizzata per parte della stampante interessata, non secondo l'ordine delle direttive nei file sorgente.
- Ogni futura nota raccogliera le opzioni correlate di `Configuration.h` e `Configuration_adv.h`.
- La guida resta generale e non viene personalizzata per uno specifico modello di stampante.
- Le voci restano testo semplice fino alla creazione delle pagine, evitando wikilink non ancora risolvibili.
- Ogni nota Marlin indica esplicitamente la release di riferimento nel frontmatter e usa collegamenti a sorgenti fissate al tag.

### Prossimi passi

- Proseguire con `Sonda`, partendo da probe Z, offset e BLTouch.

## 2026-07-15 - Normalizzazione percorsi e integrazione Quartz

### Fatto

- Normalizzate in `Pagine/` le cartelle tracciate come `pagine/` nelle aree AI, RISC-V, Home assistant, Linux e Stampante 3D.
- Corretti cinque wikilink verso `Programmi open source/Indice Programmi Open Source` con capitalizzazione non coerente.
- Eseguito un controllo case-sensitive sui percorsi, in preparazione alla futura build Quartz su GitHub Actions.
- Importato Quartz 5 nella cartella `site/` tramite `git subtree --squash`, mantenendo il vault e il generatore statico nello stesso repository.
- Installate le dipendenze npm e i 46 plugin del template Quartz per Obsidian.
- Creata la configurazione locale in `site/quartz.config.yaml` e verificata una prima homepage di prova.
- Verificata la build statica e l'anteprima locale su desktop e mobile, senza errori nella console del browser.
- Aggiunti `site/publish.config.json` e gli script portabili per preparare e compilare solo le aree autorizzate.
- Marcate come pubblicabili tutte le 99 note dell'area Linux e abilitato il filtro `explicit-publish`.
- Verificata la build Linux completa con 100 input, includendo la homepage generata, senza wikilink rotti nell'output.
- Impostato il `baseUrl` definitivo `perni24.github.io/appunti` per la pubblicazione nel sottopercorso GitHub Pages.
- Creato `.github/workflows/deploy-pages.yml` per compilare Quartz e pubblicare `site/public` a ogni push su `main`.
- Corretto lo script di installazione dei plugin affinche usi il CLI Quartz con `quartz.lock.json`; aggiornate le action del workflow alle versioni basate su Node 24.
- Sostituita la homepage Linux generata con il contenuto di `Home.md`, copiato come `index.md` durante la build senza ampliare le aree pubblicabili oltre Linux.
- Abilitata la pubblicazione dell'area `Programmazione`: le note usano `publish: true`, mentre gli indici senza YAML ricevono il flag soltanto nella copia temporanea usata da Quartz.

### Decisioni

- `Pagine/` con `P` maiuscola e il casing canonico per le cartelle di contenuto del vault.
- I controlli dei wikilink devono confrontare anche maiuscole e minuscole, perche Windows puo nascondere errori che emergono su Linux.
- Quartz viene mantenuto come subtree aggiornabile dal branch upstream `v5`, non come dipendenza npm o repository Git annidato.
- La configurazione usa il template Obsidian, l'interfaccia italiana e il percorso GitHub Pages del repository come `baseUrl`.
- I contenuti pubblicabili vengono copiati in una directory temporanea esterna al repository, per evitare duplicati tracciati e conflitti con `.gitignore`.
- L'output statico `site/public` resta escluso da Git: GitHub Actions lo genera e lo carica come artifact di Pages durante ogni deploy.

### Prossimi passi

- Abilitare una sola volta `Settings > Pages > Source: GitHub Actions`, quindi eseguire commit e push per verificare il primo deploy online.

## 2026-07-13 - Ristrutturazione area Linux

### Fatto

- Rimossa la sottocartella `Linux/Pagine/ArchLinux` e spostata la guida in `Linux/Pagine/Installazione Arch Linux.md`.
- Riscritto `Linux/Indice Linux.md` con percorsi Base, Intermedio, Avanzato, Applicazioni, Distribuzioni e Conoscenza Operativa.
- Normalizzate e completate le quattro note esistenti su installazione Arch Linux, utenti e permessi, pacchetti universali e toolchain user-space.
- Separati i comandi Linux in blocchi individuali, ciascuno accompagnato dalla relativa spiegazione, per facilitarne copia e consultazione.
- Create e compilate le 6 note del blocco `Fondamenti del sistema` su architettura, distribuzioni, FHS, terminale, ambiente e documentazione locale.
- Completato il blocco `File, utenti e permessi` con quattro nuove note su file e link, permessi POSIX, `sudo` e ACL, integrate con la nota esistente sulla gestione utenti.
- Completato il blocco `Shell` con sette note su Bash, flussi I/O, espansioni, quoting, job control, strumenti testuali ed espressioni regolari.
- Completato il blocco `Processi e servizi` con sette nuove note su processi, monitoraggio, systemd, unit, timer, cron e journal, riutilizzando la nota condivisa sul job control.
- Completato il blocco `Gestione software` con quattro nuove note su repository, gestori nativi, librerie condivise e compilazione, integrate con le note esistenti sui pacchetti universali e sulle toolchain utente.
- Completato il blocco `Storage e filesystem` con nove note su partizioni, mount, `fstab`, filesystem, LVM, RAID, swap, quote e procedure di controllo e riparazione.
- Completato il blocco `Networking` con nove note su interfacce, routing, DNS, socket, SSH, trasferimento file, NetworkManager, nftables e troubleshooting di rete.
- Completato il blocco `Boot e kernel` con sette note su sequenza di avvio, firmware, bootloader, initramfs, moduli, sysctl e compilazione del kernel.
- Completato il blocco `Sicurezza` con otto note su minimo privilegio, hardening, MAC, LUKS, GPG, PAM, audit e aggiornamenti di sicurezza.
- Completato il blocco `Hardware e desktop` con dieci note su rilevamento, driver, udev, D-Bus, energia, PipeWire, sistemi grafici, ambienti desktop, font e portali XDG.
- Completato il blocco `Virtualizzazione e isolamento` con sei note su namespace, cgroup, container, Docker e Podman, KVM e QEMU e gestione delle VM con libvirt.
- Completato il blocco `Server` con sei nuove note su web server, reverse proxy, condivisioni NFS e Samba, database, backup e monitoraggio continuativo, ampliando la nota SSH esistente con l'amministrazione di `sshd`.
- Completato il blocco `Automazione` con cinque nuove note su scripting Bash, robustezza, gestione degli errori, configurazione e Ansible, riutilizzando e collegando le note esistenti su Bash, cron e timer systemd.
- Completato il blocco `Installazione` con due nuove guide operative per Debian e Fedora, collegate alla procedura Arch Linux esistente e basate sui flussi UEFI ufficiali.
- Completato il blocco `Differenze tra distribuzioni` con quattro note su ecosistemi dei package manager, modelli di rilascio, portabilita delle configurazioni e scelta basata sui requisiti.
- Convertite in wikilink le relative voci di `Linux/Indice Linux.md` dopo la creazione effettiva delle pagine.
- Rimosso da `Home.md` il collegamento alla vecchia macro area Arch Linux, mantenendo il collegamento all'indice Linux.

### Decisioni

- Le conoscenze generali restano indipendenti dalla distribuzione; Arch Linux è trattata come procedura specifica nella sezione Distribuzioni.
- Gli argomenti senza pagina restano testo semplice nell'indice e diventeranno wikilink solo dopo la creazione di contenuti reali.

### Prossimi passi

- Continuare con il blocco `Procedure` nella sezione Conoscenza Operativa.
