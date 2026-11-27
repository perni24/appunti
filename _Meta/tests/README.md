# Test degli esempi delle note

Questi test sono infrastruttura editoriale, esclusa dal sito. Estraggono frammenti dai Markdown originali tramite il parser in `site/scripts/vault.mjs`. Non eseguono indiscriminatamente tutte le note.

## Prerequisiti

- Dipendenze del progetto `site` gia installate, per il parser Markdown/YAML.
- Node.js compatibile con il progetto; esecuzione verificata con `24.14.0`.
- Solo per i test browser: pacchetto Playwright e Google Chrome installato. Nella sessione di revisione e stato usato il runtime Playwright gia fornito dall'ambiente Codex, senza aggiungere dipendenze al sito.

## GitHub: fondamenti

Dalla radice del vault, con Git disponibile nel PATH:

```sh
node --test _Meta/tests/github-fondamenti.test.mjs
```

Le quattro prove confrontano i comandi con i blocchi Markdown ed eseguono Git in directory temporanee. I remoti sono repository su disco: non occorrono account o credenziali. Su Windows, Git for Windows deve poter avviare la propria shell anche per i trasferimenti locali. Non vengono create pull request o risorse su GitHub.

## GitHub: flusso di lavoro base

```sh
node --test _Meta/tests/github-flusso-base.test.mjs
```

Cinque prove locali confrontano i comandi delle note con il comportamento di Git: diff della PR, staging e amend, merge con due genitori, squash e rebase seguito da fast-forward. I repository sono temporanei e non richiedono credenziali. La suite non simula gli esiti di review, l'autochiusura di una issue o le autorizzazioni di GitHub.

## GitHub: interfaccia e strumenti

```sh
node --test _Meta/tests/github-interfaccia.test.mjs
```

Richiede Git e le dipendenze Quartz del sito. In repository temporanei confronta il contenuto del commit, i file su disco e una revisione fissata. Controlla la regex dei percorsi e interpreta i due esempi Markdown con il plugin GFM del sito. Non verifica l’indice di ricerca di GitHub, la CLI autenticata o l’interfaccia Desktop.

## GitHub: collaborazione e project management

```sh
node --test _Meta/tests/github-collaborazione.test.mjs
```

Legge gli esempi dalle note: verifica struttura e tipi dei campi YAML, messaggio di commit completo, creazione di un branch da un bundle Git locale e diff di una PR simulata in un monorepo. Non simula validazioni web, automazioni di Projects né autorizzazioni dei code owner.

## GitHub: protezione del repository

```sh
node --test _Meta/tests/github-protezione.test.mjs
```

Estrae il workflow didattico dalla nota sui required checks e prova il comando Git su commit diversi. Confronta tag annotati e lightweight e controlla che il deploy Quartz descritto dalle note corrisponda al workflow versionato. Non contatta GitHub, non pubblica tag e non verifica le policy attive sul servizio.

## GitHub: sicurezza e supply chain

```sh
node --test _Meta/tests/github-supply-chain.test.mjs
```

Controlla i tre esempi YAML nelle note, il rapporto tra dipendenza diretta e transitiva del sito e le regole Git per un file fittizio prima e dopo il tracciamento. Nessuna scansione, credenziale o attestazione reale: i controlli locali non simulano i servizi GitHub.

## GitHub: fondamenti di Actions

```sh
node --test _Meta/tests/github-actions-fondamenti.test.mjs
```

Richiede PowerShell 7 (`pwsh` nel PATH). Le prove leggono il workflow Quartz e gli esempi YAML delle note. Eseguono gli script PowerShell per il passaggio di un output, la verifica della home e la presenza o assenza di una credenziale fittizia. Non avviano runner remoti e non pubblicano artifact.

## GitHub: CI con Actions

```sh
node --test _Meta/tests/github-actions-ci.test.mjs
```

Dalla radice del vault, con Node, Git e le dipendenze di `site`. Legge gli esempi YAML delle sette note, confronta script e lockfile, calcola le combinazioni della matrix e controlla la configurazione client/server di PostgreSQL. Esegue il reporter JUnit su un test verde e uno rosso e prova il check Git con un file tracciato e non tracciato. Non avvia container, runner o upload remoti.

## GitHub: CD, release e deploy

```sh
node --test _Meta/tests/github-actions-cd.test.mjs
```

Richiede Node, npm, Git, PowerShell 7 e le dipendenze di `site`. Le prove estraggono gli esempi dalle sette note; verificano la home, la variabile di staging, lo ZIP Git e il contenuto di un package con `npm pack --dry-run` offline. Confrontano gli estratti Pages con il workflow reale e i valori delle condizioni OIDC con identità fittizie. Non avviano deployment, approvazioni, pubblicazioni o scambi di token.

## GitHub: Actions avanzato

```sh
node --test _Meta/tests/github-actions-avanzato.test.mjs
```

Dalla radice del vault, con Node, PowerShell 7 e le dipendenze di `site`. Le prove estraggono i frammenti YAML dalle sette note, eseguono gli step della composite action e del debug, verificano l’orario di Roma in due stagioni e confrontano la concorrenza con il workflow Quartz. Non avviano lo scheduler, la toolchain embedded o runner remoti e non stimano la fattura del repository.

## GitHub: API e automazione

```sh
node --test _Meta/tests/github-api-automazione.test.mjs
```

Richiede Node e le dipendenze di `site`. Estrae esempi dai sette Markdown: esegue il filtro REST su pagine locali, la verifica della firma sul vettore pubblico GitHub e la classificazione di file rinominati. Controlla staticamente query, parametri CLI, permessi e trigger YAML: non interroga lo schema remoto, non invia webhook e non apre o modifica issue.

## GitHub: governance e manutenzione

```sh
node --test _Meta/tests/github-governance.test.mjs
```

Dalla radice del vault, con Node, Git e le dipendenze di `site`. Le prove usano repository temporanei per squash, ignore, ripristino da bundle, simulazione mirror e tag annotati. Controllano staticamente i comandi GitHub CLI, i trigger Pages e il modulo YAML; non invocano servizi GitHub.

## GitHub: procedure pratiche

```sh
node --test _Meta/tests/github-procedure-pratiche.test.mjs
```

Richiede Git, Node, PowerShell 7 e le dipendenze di `site`. Prova il primo push su un remoto locale, il diff di una PR con base avanzata e lo step PowerShell con valori fittizi. Confronta configurazione CI, nome del check e pubblicazione Pages con gli esempi e il workflow del vault; non usa un account GitHub.

## GitHub: checklist

```sh
node --test _Meta/tests/github-checklist.test.mjs
```

Richiede Git, Node e le dipendenze di `site`. Confronta indice e cronologia per un file di prova e interroga tag assenti, leggeri e annotati in repository temporanei. Verifica staticamente i comandi CLI e il frammento di concorrenza del workflow Pages. Non richiede credenziali né contatta GitHub.

## GitHub: troubleshooting

```sh
node --test _Meta/tests/github-troubleshooting.test.mjs
```

Richiede Git, Node, PowerShell 7 e le dipendenze di `site`. Riproduce in repository locali un diff vuoto con commit aggiuntivi e un conflitto di merge, compreso un file aggiunto con i marcatori ancora presenti. Esegue lo step PowerShell con valori fittizi e verifica staticamente comandi CLI, permessi e workflow Pages. Non effettua operazioni su GitHub.

## GitHub: promemoria operativi

```sh
node --test _Meta/tests/github-promemoria.test.mjs
```

Verifica gli esempi dei sei promemoria finali con Git, Node, PowerShell 7 e le dipendenze di `site`. Esegue i cambi dei remote in un repository temporaneo, produce il report TAP della matrix e prova la presenza di un valore fittizio. Gli eventi, i permessi, la cache e lo scambio di artifact sono verificati come configurazione, non eseguiti su GitHub.

## Clean Code: fondamenti

Dalla radice del vault, con Node e le dipendenze di `site`:

```sh
node --test _Meta/tests/clean-code-fondamenti.test.mjs
```

La suite esegue gli esempi JavaScript delle note: regole alle soglie, valutazione dei getter, esiti delle Promise, ordine degli effetti e dimensione dei lotti. I servizi sono sostituti locali: non vengono inviati messaggi o pagamenti. La scheda sul debito tecnico è un caso ragionato, non un programma.

## Clean Code: strutture dati e modellazione

```sh
node --test _Meta/tests/clean-code-modellazione.test.mjs
```

La suite riusa il compilatore TypeScript di `site` per i cinque esempi tipizzati ed esegue anche i due esempi JavaScript di copia delle righe. Per la union distingue i casi leciti, gli errori statici con `exactOptionalPropertyTypes` e un nuovo caso non gestito. La scheda sulle responsabilità è un esercizio di design; le prove non simulano un servizio di prenotazione o la concorrenza tra scritture su database.

## Clean Code: file, moduli e ambiente

```sh
node --test _Meta/tests/clean-code-file-moduli.test.mjs
```

Le cinque prove estraggono gli esempi dalle note: tariffe, collaboratori della fatturazione, ingresso pubblico di un pacchetto Node, compatibilità del vecchio prezzo e script npm di formattazione. Il pacchetto e il file da formattare vivono in directory temporanee; la suite usa le dipendenze già disponibili in `site` e non installa pacchetti. I tre comandi della nota README sono i controlli reali del vault e si eseguono separatamente.

## Clean Code: programmazione ad oggetti e design

```sh
node --test _Meta/tests/clean-code-oggetti-design.test.mjs
```

Le sette prove leggono i blocchi JS e TS dalle note. I due file del DIP vengono compilati insieme come moduli ESM temporanei: si controllano import, accettazione e rifiuto del trasporto simulato. Il test ISP distingue il rifiuto del compilatore dagli errori asincroni del lettore; il gestore di conferma usa la classe della nota sull'incapsulamento. Nessuna chiamata a provider di pagamento, posta o database.

## Clean Code: concetti funzionali e composizione

```sh
node --test _Meta/tests/clean-code-funzionale.test.mjs
```

Sette prove eseguono i blocchi JavaScript delle note: configurazione mutabile, ordine delle funzioni, alias e snapshot, ordine delle letture, import con scarti, guardie e fallimenti parziali. Gli archivi e l'invio sono sostituti locali: si verifica la sequenza osservabile, non la consegna di email o una transazione distribuita.

## Clean Code: contratti, tipi e qualità

```sh
node --test _Meta/tests/clean-code-contratti-qualita.test.mjs
```

Richiede Node 24 con `node:sqlite` e TypeScript da `site`. Le dieci prove leggono gli esempi dai Markdown; una avvia a sua volta i sette test nativi delle note contro i moduli estratti, con un vero database SQLite in memoria e senza servizi remoti. I punteggi di complessità sono illustrati nelle note con un conteggio manuale: la suite verifica comportamento e casi di confine, non esegue ESLint o Sonar.

## Clean Code: Standard Library Pratica

```sh
node --test _Meta/tests/clean-code-standard-library.test.mjs
```

Sette prove eseguono i blocchi JavaScript estratti dalle note con Node e i dati di fuso orario di Intl. Per la creazione esclusiva viene usata una directory temporanea locale. Tracer, logger, pagamento e archivio utenti sono sostituti: non servono un collector, un database o credenziali.

## Clean Code: Internals e Gestione Risorse

```sh
node --test _Meta/tests/clean-code-internals.test.mjs
```

Nove prove estraggono gli esempi dai Markdown. Baseline: Node 24.14 con `node:sqlite`; gli errori immediati e differiti della transazione usano un database reale in memoria. Le letture della cache sono sbloccate dal test, senza ritardi casuali. Lock, writer e pagamenti sono esempi locali: non occorrono servizi esterni.

## Clean Code: Concorrenza e Parallelismo

```sh
node --test _Meta/tests/clean-code-concorrenza.test.mjs
```

Sette prove estraggono il codice dalle sette schede. Usano Node 24.14 con i lock nativi e SQLite: due connessioni allo stesso file temporaneo esercitano la contesa, un'altra prova riapre il registro delle ricevute. Il worker usa un adattatore di coda simulato; gli ordini di completamento sono imposti con promesse controllate, non con ritardi casuali.

## Clean Code: Performance e Distribuzione

```sh
node --test _Meta/tests/clean-code-performance.test.mjs
```

Sei prove eseguono gli esempi delle sei nuove schede revisionate. Baseline: Node 24.14 con SQLite in memoria. Il comando CPU genera un vero profilo V8 in una directory temporanea; il confronto SQL conta le esecuzioni, non la durata. I test sulle sonde verificano la decisione locale, non distribuiscono un servizio. Nessuna soglia di velocità, memoria o campionamento dipende dalla macchina.

## Clean Code: Web, API e Database

```sh
node --test _Meta/tests/clean-code-web-api-database.test.mjs
```

Sette prove su Node 24.14 leggono il JavaScript e l'SQL dalle sette schede. Il controller usa Request e Response in memoria e attraversa parser, dominio, service e repository fino a SQLite. La suite prova rollback se l'outbox fallisce, paginazione con date uguali, vecchio scrittore tardivo e contrazione dello schema. Non avvia un server HTTP, non consegna eventi a un broker e non migra un database esterno.

## Clean Code: Data, Automazione e LLM

```sh
node --test _Meta/tests/clean-code-data-automazione.test.mjs
```

Sette prove leggono gli esempi dalle sette schede. Usano Node 24 e Python 3.12 con la standard library (`PYTHON_TEST_EXECUTABLE` può indicare l'interprete). CSV, moduli e CLI girano in una directory temporanea; le celle sono eseguite anche in due processi Python puliti, senza frontend o kernel Jupyter. Il percorso prompt → parser → verifica usa un adattatore locale: non chiama modelli e non valuta la loro accuratezza.

## Clean Code: Tooling e Qualità del Codice

```sh
node --test _Meta/tests/clean-code-tooling.test.mjs
```

Otto prove su Node 24, Python 3.12 e Git. Usano Prettier e TypeScript da `site/node_modules`; per ESLint 10 imposta `ESLINT_TOOLS_DIR` come nella sezione «Tooling: Testing ed ESLint» (default: `appunti-eslint-tools` nella directory temporanea). Nessuna installazione automatica. Coverage reale di Node, mutazione manuale isolata e commit di prova solo in un repository temporaneo. Il test del gate legge lo YAML ed esegue i comandi locali, senza avviare Actions o cambiare protezioni di branch.

## Strutture di progetto: PHP, Python e React

La suite `strutture-di-progetto.test.mjs` materializza i blocchi pertinenti del Markdown in progetti temporanei. Servono PHP 8.3+ con le estensioni per PHPUnit 12, Composer, Node con le dipendenze di `site` e Python 3.12+. Predisporre **fuori dal vault** una cartella di strumenti con `vendor/` (PHPUnit 12.5), `node_modules/` (React e React DOM 19, Vite 7, plugin React 5) e un ambiente Python con FastAPI, Pydantic 2 e HTTPX.

Impostare `STRUCTURE_TOOLS` al percorso assoluto di quella cartella, `STRUCTURE_PYTHON` all'interprete dell'ambiente e `COMPOSER_PHAR` al file di Composer. La suite non installa pacchetti; crea e rimuove solo la propria sottocartella. Eseguire dalla radice del vault:

```sh
node --test _Meta/tests/strutture-di-progetto.test.mjs
```

Le quattro prove coprono il test PHPUnit del template e la lettura delle variabili di processo, rollback e chiusura SQLite, type checking dei moduli API e build Vite della Home, e l'API client contro le vere route FastAPI tramite trasporto ASGI in-process. Verificati anche JSON malformato nella struttura e risposta 204 inattesa. Non simulano il router PHP illustrativo, un browser interattivo, CORS o un reverse proxy di produzione.

## Rust: Sintassi, Tipi e Binding

Primo blocco della revisione Rust: Sintassi di base, Tipi di dato primitivi e Variabili, mutabilita e shadowing. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Nessuna crate esterna.

Con `rustc` 1.99.1 nel PATH, dalla radice del vault:

```powershell
node --test _Meta/tests/rust-fondamenti.test.mjs
```

Per usare un compilatore gia installato con rustup senza cambiare il default globale:

```powershell
$env:RUSTC_TEST_EXECUTABLE = (rustup which --toolchain 1.99.1 rustc)
```

In alternativa `RUSTC_TEST_EXECUTABLE` accetta il percorso completo di `rustc.exe` nella toolchain temporanea. L'assenza del compilatore e un errore, non uno skip silenzioso; la suite controlla la versione dichiarata.

**51/51 test superati**, circa 29 secondi. Estratti tutti i **21 blocchi Rust** dalle tre note: **17 programmi validi** compilati ed eseguiti con asserzioni/output verificati, **4 controesempi** rifiutati con il codice diagnostico previsto. Ulteriori varianti controllano la correzione del `;`, condizioni non booleane, scope, parsing fallito, inizializzazione e mutabilita. Le sostituzioni testuali sono singole ed esplicite; non riscrivono gli algoritmi per farli passare.

Le sonde aggiuntive, separate dagli snippet delle note, verificano inferenza, unit, tuple, slice senza copia, ordine di distruzione con shadowing, drop esplicito, Cell e inizializzazione const non valida. Con `opt-level=3` e `overflow-checks=yes/no` sono verificati overflow, divisione per zero, MIN/-1 e bounds runtime. Sono prove di flag rustc, non un'esecuzione dei profili Cargo o un benchmark.

Ogni compilazione usa una propria sottocartella temporanea e processi con timeout. Il cleanup verifica percorso risolto, parent e prefisso prima della rimozione. Nella sessione e stata installata una toolchain ufficiale isolata in `%TEMP%`, con checksum dell'installer verificato e `--no-modify-path`; nessuna modifica al PATH globale o alle dipendenze del sito.

Limiti: un compilatore e un target Windows, senza MSVC, cross-compilazione, Miri, matrice di versioni o verifica di ogni frammento inline. Non sono ancora revisionate le altre note Rust. Le suite degli altri linguaggi non sono state rieseguite; controlli editoriali e Quartz sono separati dai test tecnici.

## Rust: Funzioni, Documentazione e Flusso

Secondo blocco: **Funzioni**, **Commenti e documentazione** e **Controllo di flusso**. Riusa la toolchain temporanea **Rust/rustdoc/Cargo 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Nessuna nuova installazione o dipendenza del sito.

```powershell
node --test _Meta/tests/rust-funzioni-documentazione-flusso.test.mjs
```

`RUSTC_TEST_EXECUTABLE` funziona come nel primo blocco. Se contiene un percorso assoluto, la suite cerca `cargo` e `rustdoc` nella stessa directory; si possono specificare separatamente `CARGO_TEST_EXECUTABLE` e `RUSTDOC_TEST_EXECUTABLE`.

**49/49 test mirati**, circa 46 secondi. Estratti **17 blocchi Rust**: 14 programmi validi, due controesempi rifiutati con diagnostica prevista e una libreria con **tre doctest reali**. I tre doctest sono verifiche interne al gruppo Cargo, non altri tre test da sommare ai 49.

Verificati risultati e output, input vuoti ed estremi, copia/prestito/move, callback, cattura, arita, range, avanzamento, label, esaustivita e prestiti del vettore. I guasti sono variazioni esplicite dei frammenti o sonde separate della prosa.

Il demo Cargo viene creato con il comando originale `cargo new ... --vcs none`, in una fixture esterna al vault. La suite esegue davvero `cargo doc --no-deps`, `cargo test --doc` e la variante per item privati. Controlla l'HTML, i link intra-doc e le righe nascoste; prova asserzioni errate, crate/import mancanti, compile_fail che diventa valido e compile_fail che passa per un errore diverso, no_run, ignore/text e should_panic. I test ignorati nella fixture servono a verificare l'attributo ignore, non sono skip della suite Node.

`CARGO_HOME` e l'output sono isolati, rete Cargo disabilitata, nessun package esterno. La directory di lavoro del processo realizza il passaggio `cd note-rust`; `--open` non viene eseguito per non aprire il browser personale. Non sono collaudati publishing, docs.rs, rete o CI. Cleanup limitato alla radice temporanea dopo controllo del percorso risolto, parent e prefisso.

Regressione delle sei note: **100/100 test**, zero fallimenti/skip, circa **77 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-fondamenti.test.mjs _Meta/tests/rust-funzioni-documentazione-flusso.test.mjs
```

I limiti del primo blocco restano validi: un compilatore e un target Windows, nessuna certificazione generale delle altre note o di ogni frammento inline. I codici di errore controllati dalla suite tramite rustc non implicano che rustdoc stable offra la stessa garanzia per compile_fail.

## Rust: Pattern, Moduli e Workspace

Terzo blocco: **Pattern base**, **Moduli, crate e package**, **Workspace** e **Visibilita: pub, use e mod**. Completa le dieci note di Fondamenti del Linguaggio. Baseline **Rust/rustdoc/Cargo 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**. Stesse variabili di toolchain del secondo blocco.

```powershell
node --test _Meta/tests/rust-pattern-moduli-workspace.test.mjs
```

**48 test**, tutti superati nella regressione completa. Estratti **23 blocchi Rust/TOML**: sette programmi sui pattern (sei validi e un controesempio E0005) e tre progetti completi di sette, cinque e quattro file. Sono **18 blocchi Rust e cinque TOML**, non 23 programmi indipendenti. I test Cargo interni ai progetti non si sommano ai 48 gruppi Node.

Compilati ed eseguiti i programmi originali. Varianti e sonde separate verificano refutabilita, range, guardie e shadowing, move/prestito, wildcard e binding con underscore, let-else e restrizioni edition 2024. Per i progetti: moduli mancanti o duplicati, layout alternativi, crate root della libreria rispetto al binario, integration test e API pubblica, privacy di campi/metodi/moduli, re-export, alias, scope di pub(in), import e glob.

Cargo esegue realmente check, test, run e metadata in fixture offline, senza crate esterne. Il workspace verifica metadata ereditati, dipendenze esplicite, path relativi, lockfile e target condivisi, selezione dalla root o da un membro. Un test volutamente errato nella libreria dimostra che il cargo test predefinito limitato al CLI puo riuscire, mentre test --workspace fallisce. La prova con resolver 2 ne verifica la validita, non la risoluzione MSRV di dipendenze esterne.

I sorgenti sono estratti dalle note; gli input di errore sono variazioni esplicite o sonde della prosa. Alla prima esecuzione corretti due controlli diagnostici della suite per i messaggi/codici effettivi di Rust 1.99.1, senza cambiare i programmi per aggirare gli errori. Processi con timeout, CARGO_HOME temporaneo, rete Cargo disabilitata; cleanup solo della directory verificata per percorso, parent e prefisso.

Regressione seriale di tutti i fondamenti: **148/148 test**, zero fallimenti/skip, circa **141 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-fondamenti.test.mjs _Meta/tests/rust-funzioni-documentazione-flusso.test.mjs _Meta/tests/rust-pattern-moduli-workspace.test.mjs
```

Limiti: una versione e un target, nessun benchmark, Miri, pubblicazione di crate, rete o verifica di ogni frammento inline. Non rieseguite le suite degli altri linguaggi. Controlli editoriali, build Quartz e approvazione dell'utente restano verifiche distinte.

## Rust: Ownership, Move, Copy e Clone

Quarto blocco: **Ownership**, **Move semantics** e **Copy e Clone**, prime tre note di Ownership e Memory Safety. Riusa **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Nessuna nuova installazione o crate esterna.

```powershell
node --test _Meta/tests/rust-ownership-move-copy.test.mjs
```

`RUSTC_TEST_EXECUTABLE` accetta il percorso del compilatore come nei blocchi precedenti. **56/56 test mirati**, zero fallimenti/skip, circa **34 secondi**. Estratti tutti i **22 blocchi Rust**: 19 programmi validi compilati ed eseguiti e tre controesempi rifiutati con i codici E0515, E0382 ed E0204.

Verificati lettura UTF-8 in byte, input vuoti, prestito mutabile, consumo e restituzione di valori, prefissi ripetuti; Drop a fine scope, anticipato, su riferimento, per riassegnamento e ritorno anticipato. La sonda forget usa solo la risorsa dimostrativa con stampa: non lascia aperti file o lock reali.

Move: buffer della String non clonato, struct senza Copy, reinizializzazione, job posseduti e ordine LIFO di push/pop, move parziale e relativi limiti con Drop/prestiti, replace/take, catture di closure e lifetime. Copy/Clone: requisiti dei trait, array grande, riferimenti e reborrow, copie di stringhe indipendenti, Rc con contenuto non Clone, stato condiviso dopo derive(Clone), clone_from e to_owned.

Le sonde aggiuntive della prosa sono distinte dagli esempi estratti; le sostituzioni sugli esempi devono corrispondere una sola volta. Processi con timeout, fixture temporanee e cleanup limitato al percorso risolto con parent/prefisso verificati. Non viene eseguito codice unsafe.

Regressione seriale dei quattro lotti Rust: **204/204 test**, zero fallimenti/skip, circa **174 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-fondamenti.test.mjs _Meta/tests/rust-funzioni-documentazione-flusso.test.mjs _Meta/tests/rust-pattern-moduli-workspace.test.mjs _Meta/tests/rust-ownership-move-copy.test.mjs
```

Limiti: una versione/target, nessun benchmark, conteggio delle allocazioni, Miri o simulazione di arresto forzato. Il test su un array grande verifica la disponibilita di Copy, non ne misura il costo; quello su String verifica l'identita del buffer, non l'assenza di copie macchina. Non sono testate tutte le possibili implementazioni di Clone o ogni frammento inline. Altre suite linguistiche non rieseguite.

## Rust: Borrowing, Borrow Checker e Slices

Quinto blocco: **References e Borrowing**, **Borrow checker** e **Slices**. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Riusa `RUSTC_TEST_EXECUTABLE` e la toolchain isolata dei lotti precedenti; nessuna crate o installazione aggiuntiva.

```powershell
node --test _Meta/tests/rust-borrowing-slices.test.mjs
```

**58/58 test mirati**, zero fallimenti/skip, circa **35 secondi**. Estratti tutti i **21 blocchi Rust**: 19 programmi validi compilati ed eseguiti e due controesempi verificati con E0502 tramite diagnostica JSON.

Prestiti: lettura/modifica, mutabilita del binding rispetto al dato, NLL, reborrow, riferimento restituito e dati locali, campi disgiunti e prestiti in conflitto. La preparazione del nome viene provata con vuoto, spazi Unicode/interni, lowercase che espande un carattere e testo decomposto; non viene presentata come normalizzazione NFC o sicurezza degli identificativi.

Borrow checker: ricerca/inserimento con confronto esatto e duplicati preesistenti, reserve che non corregge il conflitto, snapshot clonato, ultimo uso anticipato, RefCell con try_borrow_mut e rilascio esplicito della guardia. Le sonde di panic verificano separatamente che il codice compili, poi termini con codice 101 e la diagnostica runtime attesa.

Slice: viste sugli stessi elementi, range validi/vuoti/inversi/fuori limite, get/get_mut, mutazioni, UTF-8 e valori scalari rispetto a grafemi, byte invalidi, split_at_mut e indicizzazioni mutabili separate. Provati anche limiti della media (NaN, infinito, overflow), to_vec, Box<[T]> e modifica ASCII di &mut str.

Processi con timeout; fixture temporanee rimosse solo dopo verifica di percorso risolto, parent e prefisso. Esempi estratti distinti dalle sonde della prosa e dalle variazioni intenzionali. Nessun unsafe o accesso alla rete nei nuovi test; i programmi dimostrativi non aprono file dell'utente o lock del sistema.

Regressione seriale dei cinque lotti Rust: **262/262 test**, zero fallimenti/skip, circa **185 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-fondamenti.test.mjs _Meta/tests/rust-funzioni-documentazione-flusso.test.mjs _Meta/tests/rust-pattern-moduli-workspace.test.mjs _Meta/tests/rust-ownership-move-copy.test.mjs _Meta/tests/rust-borrowing-slices.test.mjs
```

Limiti: un compilatore/target, nessun benchmark, Miri, controllo completo della segmentazione Unicode o algoritmo numerico robusto. Le prove della media documentano i suoi limiti, non la certificano per tutti i dati. Non rieseguite suite di altri linguaggi o tutti i frammenti inline. Approvazione dell'utente, controlli editoriali e build restano separati dai test tecnici.

## Rust: Stringhe, Memoria, Mutabilita e Lifetime Impliciti

Sesto blocco: **Stringhe String e &str**, **Stack e Heap**, **Mutabilita** e **Lifetime impliciti**. Completa Ownership e Memory Safety: venti note principali Rust riviste in totale. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Riusa la toolchain isolata e `RUSTC_TEST_EXECUTABLE`; nessuna nuova installazione o crate esterna.

```powershell
node --test _Meta/tests/rust-stringhe-memoria-lifetime.test.mjs
```

**67/67 test mirati**, zero fallimenti/skip, circa **36 secondi**. Estratti **26 blocchi Rust**: 24 programmi validi compilati ed eseguiti, due controesempi rifiutati con E0106 ed E0515. Prima esecuzione: 66/67 per un ancoraggio testuale duplicato nel test aggiuntivo sulla concatenazione; corretto il test senza cambiare il programma della nota.

Stringhe: creazione, prestito, concatenazione consumante, formattazione, UTF-8 e grafemi, conversioni fallibili/lossy, limiti dello slug, clone, Cow e Box<str>. Provati testo vuoto, spazi Unicode, espansione lowercase, testo decomposto, slicing invalido e uso dopo move.

Memoria: dimensioni del valore rispetto al contenuto indiretto, contenitori vuoti e zero-sized, capacita distinta da lunghezza, clear e distruttori, trasferimento di Box e messaggi annidati. La prova try_reserve usa un overflow di capacita rifiutato prima dell'allocazione: non tenta di esaurire la memoria.

Mutabilita: binding rispetto a destinatario, parametri Copy o consumanti, metodi, sostituzione della String, mutazioni condivise controllate e bound Sync. Lifetime: elision senza analisi del corpo, receiver con secondo input, contratti troppo restrittivi, uscita del proprietario, uso successivo al push, fallback vuoto e bound static. Due sonde riproducono il panic del vecchio slicing ..1 con vuoto e Unicode multibyte.

Errori di compilazione controllati tramite diagnostica JSON; il caso del receiver usa il messaggio lifetime senza codice numerico. Panic verificati separatamente dopo compilazione riuscita. Fixture temporanee, processi con timeout e cleanup dopo verifica del percorso risolto, parent e prefisso; nessun unsafe o accesso alla rete nei nuovi esempi.

Regressione seriale delle sei suite sulle venti note: **329/329 test**, zero fallimenti/skip, circa **216 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-fondamenti.test.mjs _Meta/tests/rust-funzioni-documentazione-flusso.test.mjs _Meta/tests/rust-pattern-moduli-workspace.test.mjs _Meta/tests/rust-ownership-move-copy.test.mjs _Meta/tests/rust-borrowing-slices.test.mjs _Meta/tests/rust-stringhe-memoria-lifetime.test.mjs
```

Limiti: una versione/target, nessun benchmark o conteggio delle allocazioni, nessuna simulazione OOM, stack overflow o Miri. Identita dei puntatori e size_of non dimostrano una posizione fisica o un costo. Non eseguita ogni espressione inline o la matrice degli altri linguaggi. Controlli editoriali, Quartz e approvazione dell'utente restano distinti.

## Rust: Structs, Tuple Structs ed Enums

Settimo blocco: **Structs**, **Tuple structs** ed **Enums**, prime **3/8 note di Tipi di Dato Personalizzati**, totale **23/183 note principali Rust**. Riusa **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0** e `RUSTC_TEST_EXECUTABLE`. Nessuna nuova installazione o dipendenza di terze parti.

```powershell
node --test _Meta/tests/rust-structs-enums.test.mjs
```

**69/69 test mirati**, zero fallimenti/skip, circa **32 secondi**. Estratti **19 programmi Rust**: 16 validi compilati ed eseguiti, tre controesempi rifiutati con E0063, E0308 ed E0004. Nessuna correzione dei programmi necessaria dopo la prima esecuzione.

Struct: shorthand, campi mutabili, receiver, update con move o soli campi Copy, Drop, privacy anche dei campi omessi, validazione limitata di Config, proprieta del testo, clone, Debug e lifetime delle viste. La privacy e provata dal main esterno al modulo che definisce i campi, non soltanto nel modulo stesso.

Tuple struct: alias rispetto a nuovo tipo, costruttore e campi privati, Hash/Eq, get consumante senza Copy, destructuring, mancato inoltro dei metodi. Temperature comuni, negative, non finite e overflow; Eq non derivabile su f64, Display senza validazione/escaping e dimensione/allineamento del wrapper transparent.

Enum: tutte le varianti, prestiti/modifiche/consumo, payload non validati dal solo tipo, match da aggiornare per varianti nuove, Option/Result con input assente o malformato, ricorsione con e senza indirezione, Copy e discriminanti. Per non_exhaustive una fixture compila una vera rlib e un consumer separato tramite `--extern`: senza wildcard il consumer fallisce, con wildcard compila ed esegue; dentro la crate il match ordinario resta ammesso.

Sorgenti estratti dai Markdown originali, sonde della prosa e variazioni esplicite distinte. Diagnostica rustc JSON, processi con timeout, fixture temporanee e cleanup dopo verifica di percorso risolto, parent e prefisso. I test verificano anche il prerequisito di Enums corretto da Pattern Matching a Pattern base, rimuovendo il ciclo fra le due note.

Regressione seriale delle sette suite sulle 23 note: **398/398 test**, zero fallimenti/skip, circa **264 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-fondamenti.test.mjs _Meta/tests/rust-funzioni-documentazione-flusso.test.mjs _Meta/tests/rust-pattern-moduli-workspace.test.mjs _Meta/tests/rust-ownership-move-copy.test.mjs _Meta/tests/rust-borrowing-slices.test.mjs _Meta/tests/rust-stringhe-memoria-lifetime.test.mjs _Meta/tests/rust-structs-enums.test.mjs
```

Limiti: un compilatore/target, nessun benchmark, Miri, FFI reale, serializzazione o rete. La prova transparent non e un collaudo dell'ABI con altri linguaggi; l'identita del buffer non misura le copie macchina. Nessuna catena ricorsiva enorme o simulazione stack overflow; il demo Config non valida DNS/IP, risoluzione o connessioni. Non rieseguite suite degli altri linguaggi o ogni frammento inline. Controlli editoriali, Quartz e approvazione dell'utente restano separati.

## Rust: Pattern Matching, if let e Destructuring

Ottavo blocco: **Pattern Matching**, **if let e while let** e **Destructuring**. Avanzamento **26/183 note principali Rust**, **6/8 di Tipi di Dato Personalizzati**. Riutilizzati Rust **1.99.1**, target **x86_64-pc-windows-gnu**, Node **24.14.0** e `RUSTC_TEST_EXECUTABLE`; esempi in edition **2024**, con sonde comparative specifiche in edition **2021** sullo stesso compilatore.

```powershell
node --test _Meta/tests/rust-pattern-control-destructuring.test.mjs
```

**75/75 test mirati**, zero fallimenti/skip, circa **47 secondi**. Estratti **24 programmi Rust** dai Markdown: **20 validi** compilati ed eseguiti e **quattro controesempi** rifiutati con E0004, E0308 ed E0005. Prima esecuzione 74/75: corretto soltanto il tipo numerico ambiguo nella sonda aggiuntiva delle let chain, non negli esempi delle note.

Verificati ordine di match e guardie, scrutinee valutato una volta, shadowing, scope, prestiti e move, alternative coerenti, nuove varianti e coercizioni. Per if/while let: LIFO/FIFO, stato residuo dopo Exit o pattern fallito, errori non filtrati, let else, Unicode e let chain con short-circuit. Confrontato l'ordine reale di Drop nei fallback di if let e match in edition 2021/2024, senza lock o rischi di deadlock; let chain rifiutata in edition 2021.

Destructuring: move parziale, Drop, privacy, riferimenti e match ergonomics 2024, limiti numerici della distanza Manhattan, body assente/vuoto e byte UTF-8, slice e durata delle viste, wildcard e binding nominato. Due prove riproducono il panic della vecchia formula con overflow checks attivi; la nuova formula copre 25 combinazioni di valori limite.

Sorgenti estratti e variazioni esplicite distinti, diagnostica rustc JSON, processi con timeout e cleanup di fixture temporanee dopo controllo di percorso risolto, parent e prefisso. Nessun unsafe, rete, database, modifica ai file dell'utente o nuova dipendenza del progetto.

Regressione seriale delle otto suite sulle 26 note: **473/473 test Rust**, zero fallimenti/skip, circa **303 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-fondamenti.test.mjs _Meta/tests/rust-funzioni-documentazione-flusso.test.mjs _Meta/tests/rust-pattern-moduli-workspace.test.mjs _Meta/tests/rust-ownership-move-copy.test.mjs _Meta/tests/rust-borrowing-slices.test.mjs _Meta/tests/rust-stringhe-memoria-lifetime.test.mjs _Meta/tests/rust-structs-enums.test.mjs _Meta/tests/rust-pattern-control-destructuring.test.mjs
```

Limiti: un compilatore e un target; le prove fra edition non sono una matrice di versioni e non certificano una MSRV. La disponibilita da Rust 1.88 delle let chain e verificata nelle fonti ufficiali, non eseguendo Rust 1.88. Nessun benchmark, Miri, GUI o server HTTP dei demo; non rieseguite suite degli altri linguaggi o ogni frammento inline. Controlli editoriali e approvazione dell'utente restano distinti dai test tecnici.

## Rust: Control Flow e Pattern Matching Avanzati

Nono blocco: **Control flow avanzato** e **Pattern matching avanzato**. Completato **Tipi di Dato Personalizzati, 8/8 note**; avanzamento **28/183 note principali Rust**. Riutilizzati Rust **1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0** e `RUSTC_TEST_EXECUTABLE`.

```powershell
node --test _Meta/tests/rust-advanced-control-patterns.test.mjs
```

**62/62 test mirati**, zero fallimenti/skip, circa **31 secondi**, superati alla prima esecuzione. **18 programmi Rust** estratti: **14 validi** compilati ed eseguiti e **quattro controesempi** rifiutati con E0571, E0277, E0408 ed E0382.

Controllo di flusso: risultato dei loop, label e destinazioni di break/continue, blocchi etichettati, let else, coercizioni/risultato unit, errori di parsing distinti, conversione From, propagazione da funzione o closure, Drop rispetto a rollback, ControlFlow rispetto a for_each. Provata la ricerca su input vuoto, duplicati, righe irregolari e valori estremi.

Lettura file: fixture reali UTF-8, vuote, mancanti e non UTF-8; CLI con percorso contenente spazi. I file vengono creati soltanto nella directory temporanea del singolo test, mai nei percorsi dell'utente. Non provato l'accesso negato, che dipende da ACL e privilegi; nessun parsing TOML, file enorme o test del comando Cargo tramite shell. Il binario e compilato direttamente con rustc e invocato con argomenti separati.

Pattern: ASCII/Unicode, tutti i 256 valori u8 del range con @, parentesi e binding coerenti, guardie su alternative e rivalutazione, move nella guardia, ref/ref mut e reference pattern, regole 2024, slice corte e viste, lifetime, classificatore volutamente incompleto, nuove varianti, @ sull'intero e sui campi, prestiti sovrapposti vietati e doppio rest.

Regressione seriale delle nove suite sulle 28 note: **535/535 test Rust**, zero fallimenti/skip, circa **326 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-fondamenti.test.mjs _Meta/tests/rust-funzioni-documentazione-flusso.test.mjs _Meta/tests/rust-pattern-moduli-workspace.test.mjs _Meta/tests/rust-ownership-move-copy.test.mjs _Meta/tests/rust-borrowing-slices.test.mjs _Meta/tests/rust-stringhe-memoria-lifetime.test.mjs _Meta/tests/rust-structs-enums.test.mjs _Meta/tests/rust-pattern-control-destructuring.test.mjs _Meta/tests/rust-advanced-control-patterns.test.mjs
```

Sorgenti estratti distinti dalle sonde della prosa e dalle variazioni intenzionali. Diagnostica rustc JSON, timeout dei processi, cleanup dopo verifica di percorso risolto, parent e prefisso. Nessun unsafe, rete, database, nuova dipendenza o modifica del PATH globale. Un compilatore/target, non una matrice di versioni o una certificazione MSRV; nessun benchmark o Miri. Suite degli altri linguaggi e frammenti inline non rieseguiti integralmente; controlli editoriali e approvazione dell'utente restano separati.

## Rust: Option, Result e Operatore ?

Decimo blocco: **Option**, **Result** e **Operatore ?**; avviato **Errori e Collezioni, 3/11 note**. Avanzamento **31/183 note principali Rust**. Rust **1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**; toolchain temporanea precedente riutilizzata tramite `RUSTC_TEST_EXECUTABLE`.

```powershell
node --test _Meta/tests/rust-option-result-question.test.mjs
```

Prima esecuzione: **85/85 test mirati**, zero fallimenti/skip, circa **50 secondi**. Estratti **25 programmi Rust**: **20 validi** compilati ed eseguiti e **cinque controesempi** rifiutati con E0382, E0277 o lint unused_must_use reso errore. Dopo questo giro aggiunto il confronto byte per byte per verificare che le fixture CLI non siano alterate; verifica inclusa nella regressione.

- Option: presenza distinta da vuoto/falso/zero, inferenza di None, prestiti e lifetime, Copy/Clone, map/and_then/filter, fallback immediati e differiti, take/replace/get_or_insert_with, flatten/transpose. Moltiplicazione verificata per tutti i 256 u8; ricerca su slice vuota e duplicati, limiti deliberati dell'estrazione del dominio email, identita della vista e copia indipendente.
- Result: divisione su 81 combinazioni di estremi/segni, riproduzione dell'overflow originale con overflow checks disabilitati; tutti gli u8 della trasformazione e tutte le porte positive u16. Conservazione di ParseIntError, grammatica numerica, combinatori e ownership di entrambi i parametri, Result unit, collect al primo errore e mutazioni residue, perdita di dati con ok/err e conversioni transpose.
- ?: equivalenza con match, From necessario e map_err alternativo, ritorno Ok finale, conversione esplicita Option/Result, closure/blocco/ciclo, Drop rispetto a rollback, validazione prima della modifica, for_each/try_for_each e ControlFlow. Future realmente pollato con API sicure e risultato immediato, non un executor di produzione; uso di Try respinto sulla toolchain stable.
- CLI: percorso con spazi, whitespace, massimo u16, file assente/vuoto/non UTF-8, zero e overflow. Esito non riuscito di main Result distinto dal panic; Box mantiene il tipo concreto. File creati solo nelle fixture, nessun file dell'utente letto o modificato.

Regressione seriale delle dieci suite sulle 31 note: **620/620 test Rust**, zero fallimenti/skip, circa **374 secondi**. Include la nuova verifica che i file CLI restino invariati. Per rieseguirle in serie da PowerShell:

```powershell
$tests = Get-ChildItem -LiteralPath '_Meta/tests' -Filter 'rust-*.test.mjs' | Sort-Object Name | ForEach-Object { $_.FullName }
```

```powershell
node --test --test-concurrency=1 $tests
```

Sorgenti estratti, sonde della prosa e controesempi aggiuntivi sono distinti. Diagnostica JSON, timeout, cleanup dopo verifica di percorso risolto, parent e prefisso. Nessuna nuova dipendenza, crate remota, modifica al PATH globale o unsafe. Limiti: una versione/target; niente rete, DNS, database, accesso negato via ACL, file enormi, benchmark o Miri. CLI compilata con rustc e invocata direttamente, non eseguito il comando Cargo della nota. Non rieseguiti tutti i frammenti inline o le suite degli altri linguaggi.

## Rust: panic, Error Handling e Crate

Undicesimo blocco: **panic!**, **Error handling idiomatico**, **thiserror e anyhow**. Avanzamento **34/183 note principali Rust**, **6/11 di Errori e Collezioni**. Baseline Rust **1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**.

Suite: `_Meta/tests/rust-panic-error-crates.test.mjs`. Estratti **13 programmi Rust**, piu un manifest Cargo completo e un frammento di profilo release. Un programma produce volutamente panic; altri due intercettano/osservano il panic con unwind e terminano con successo lasciando la diagnostica del hook. La CLI senza argomento termina volutamente con errore. Due unit test del tipo Percentage sono eseguiti anche con il vero harness.

La suite usa `RUSTC_TEST_EXECUTABLE` per individuare rustc e i tool affiancati. Le dipendenze non vanno in site o nella configurazione Cargo personale: `RUST_ERROR_TEST_CARGO_HOME` indica una cache dedicata. In questa sessione:

```powershell
$env:RUST_ERROR_TEST_CARGO_HOME = Join-Path $env:TEMP 'appunti-rust-error-crates-cache-bdba0268db5448c9a2651b8d0ad6ccd2'
```

Per popolare una cache nuova e necessario consentire esplicitamente il fetch:

```powershell
$env:RUST_ERROR_TEST_FETCH = '1'
```

```powershell
node --test _Meta/tests/rust-panic-error-crates.test.mjs
```

Per le esecuzioni successive, inclusa la regressione:

```powershell
$env:RUST_ERROR_TEST_FETCH = '0'
```

```powershell
node --test _Meta/tests/rust-panic-error-crates.test.mjs
```

Senza `RUST_ERROR_TEST_CARGO_HOME` la cache nasce nella fixture e viene rimossa: con fetch disabilitato e cache vuota la verifica delle crate fallisce, non viene saltata. Il lockfile viene generato nella fixture iniziale e riusato da tutti i programmi Cargo con `--locked --offline`; i transitori non sono bloccati da un lockfile permanente nel repository.

Dipendenze risolte in questa passata: **thiserror 2.0.21**, **thiserror-impl 2.0.21**, **anyhow 1.0.104**, **proc-macro2 1.0.107**, **quote 1.0.47**, **syn 3.0.9**, **unicode-ident 1.0.27**. I due vincoli diretti provengono dal manifest della nota. Nessun audit di sicurezza delle dipendenze eseguito.

Copertura:

- Panic: messaggi e status, expect su literal, accesso fuori indice, unwrap, tutti i 256 valori di Percentage, due unit test e mutazioni negative del should_panic. Assert in release, debug_assert con flag yes/no e type checking, hook prima di Drop, effetti parziali, UnwindSafe, payload testuale e backtrace del solo processo di prova.
- Strategia: compilazione del demo catch con panic=abort senza eseguire l'abort; binario innocuo con cfg!(panic="abort"). Progetto Cargo reale verifica release abort e test harness release unwind. Non provocati abort, doppio panic in Drop o attraversamenti FFI.
- Errori manuali: assenza/vuoto/PermissionDenied, I/O reale su fixture vuote/UTF-8/non UTF-8, tutti i valori positivi u16, cause e percorso conservati, From necessario, testo sensibile non incluso. Nomi in byte rispetto a scalari/grafemi, trim e vista restituita; non un validatore universale.
- Crate: derive reali, From/source, campi aggiuntivi incompatibili, source implicito e wrapper transparent; CLI con argomenti reali e file invariati, cause uniche, diagnostica senza contenuto grezzo. Anyhow context immediato/differito, Option, downcast e catene, perdita di tipo con stringhe, vincoli Send/Sync, ensure e bail.

Prima esecuzione **69/70**: una sonda aggiuntiva usava un punto e virgola al posto della virgola in un braccio match. Corretto soltanto il test; i 13 programmi delle note erano gia compilati correttamente. Riesecuzione completa offline: **70/70 test**, zero fallimenti/skip, circa **66 secondi**. Regressione seriale finale delle undici suite sulle 34 note: **690/690 test Rust**, zero fallimenti/skip, circa **432 secondi**.

Fixture controllate prima del cleanup, timeout, diagnostica JSON. Il hook globale e cambiato soltanto dentro un processo figlio dedicato e ripristinato prima della fine; nessuna modifica al processo dell'utente. Cache separata conservata per i test successivi. Limiti: una baseline e un target; niente ACL reali, file enormi, server, rete applicativa, no_std, Miri, benchmark, backtrace thiserror nightly o tutti i frammenti inline. Suite degli altri linguaggi non rieseguite.

## Rust: Collezioni

Dodicesimo blocco: **Vec**, **HashMap e HashSet**, **VecDeque BTreeMap e BTreeSet**. Avanzamento **37/183 note principali Rust**, **9/11 di Errori e Collezioni**.

Suite: `_Meta/tests/rust-collections.test.mjs`. Estrae **16 programmi** dalle note: **15 validi** e un controesempio di borrowing rifiutato con E0502. Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**. Nessuna crate esterna richiesta dal nuovo blocco.

Dalla root del vault, con rustc gia nel PATH:

```powershell
node --test _Meta/tests/rust-collections.test.mjs
```

In alternativa indica una toolchain esistente prima del comando:

```powershell
$env:RUSTC_TEST_EXECUTABLE = 'C:/percorso/toolchain/bin/rustc.exe'
```

Copertura:

- Vec: len/capacity, tipi zero-sized, accesso controllato e panic, ownership e prestiti, remove/swap_remove, retain/dedup, resize/truncate/clear, reserve fallibile e Clone di Rc. Filtro su tutti i **65.536 valori i16**, estremi i32, duplicati e input invariato.
- Mappe hash: chiavi possedute o borrowed, insert/entry/get/remove, default immediato o differito, aggiornamento valori, collisioni deliberate gestite con Eq, chiavi equivalenti e rappresentante conservato. Unicode, punteggiatura e ordine riproducibile del report.
- Insiemi: appartenenza e operazioni su tutte le **256 coppie di sottoinsiemi** di quattro elementi; distinzione insert/replace/take.
- Deque: FIFO con **1.000 inserimenti intercalati a pop**, capacita non bounded, buffer contiguo su **528 combinazioni** di lunghezza/rotazione, compreso vuoto.
- B-tree: ordine lessicografico, limiti inclusivi/esclusivi, assenti e invertiti, range vuoto, pop agli estremi, split_off, mancanza di Ord su f64, consumo della coda e riepilogo borrowed.

Prima esecuzione **53/56**: tre controlli dei metadati fallivano per un errore nel test dei segnaposto, che cercava il backtick anziche il segnaposto. Tutti gli esempi e le controprove Rust erano gia corretti. Corretto il test: seconda esecuzione **56/56**, zero fallimenti/skip, **36,5 secondi**.

Regressione seriale finale delle dodici suite sulle 37 note: **746/746 test Rust**, zero fallimenti/skip, **471,3 secondi**. Per la suite delle crate mantieni configurata la cache Cargo isolata descritta sopra, con fetch disattivato se le dipendenze sono gia disponibili.

Limiti: una baseline e un target; nessun benchmark, allocator custom, esaurimento reale di memoria, concorrenza, Miri o verifica di tutte le API delle collezioni. L'overflow di capacita e deterministico, non richiede grandi allocazioni. Non si assume ordine hash, separazione fisica specifica della deque o capacita esatta dopo shrink. I test non accedono a file dell'utente: sorgenti e binari temporanei sono rimossi dopo controllo del percorso. Suite di altri linguaggi non rieseguite.

## Rust: Iteratori e Closure

Tredicesimo blocco: **Iteratori** e **Closure**. Avanzamento **39/183 note principali Rust**; completate **11/11 note di Errori e Collezioni** e **39/39 del Percorso Base**. I promemoria restano separati.

Suite `_Meta/tests/rust-iterators-closures.test.mjs`: **66 test**, estratti **18 programmi Rust** (16 validi e due controesempi E0382). Prima esecuzione **66/66**, zero fallimenti/skip, **31,2 secondi**.

Baseline **Rust 1.99.1**, **x86_64-pc-windows-gnu**, Node **24.14.0**. Esempi edition **2024**; una controprova usa edition **2018** con lo stesso compilatore per l'eccezione del metodo array.into_iter(). Nessuna crate esterna, installazione o modifica del PATH.

Dalla root del vault, con rustc nel PATH o `RUSTC_TEST_EXECUTABLE` impostata a una toolchain esistente:

```powershell
node --test _Meta/tests/rust-iterators-closures.test.mjs
```

Copertura:

- Iterator/IntoIterator, progressione con next, borrowed/owned, iter_mut, copied/cloned, firma &Item dei predicati, collect e by_ref.
- Laziness degli adattatori distinta da valutazione immediata degli argomenti, catture e Drop; arresti parziali con find, any/all e take_while; zip, enumerate, limiti al lavoro, for_each e return locale.
- Tag: whitespace Unicode, minuscolo con espansione, testo combinato, punteggiatura, NUL, duplicati e risultato posseduto. Parser su tutti i **65.536 u16** e input invalidi; Result collect distinto da errori scartati, effetti precedenti non annullati.
- Sorgente non fused che riprende dopo None, fuse e arresto del ciclo. Nessun iteratore infinito lasciato in esecuzione: il test del limite alla scansione usa una sorgente limitata a venti elementi.
- Closure: inferenza fissata dall'uso, catture condivise/mutabili/owned, fine prestiti, Fn/FnMut/FnOnce e bound cumulativi, callback scartata senza invocazione.
- move distinto dal consumo della cattura; Copy, factory impl Fn, riferimenti non static, Rc non Send, tipi anonimi distinti e coercizione a fn. Fn con Cell non e puro; confronto della soglia su tutti gli i16 e sugli estremi i32.

Regressione mirata seriale delle cinque suite: **312/312 test**, zero fallimenti/skip, **196,0 secondi**. Comprende nuovo blocco, collections, funzioni/documentazione/flusso, ownership/move/copy e option/result/question. Le altre otto suite Rust non sono state rieseguite in questo lotto; il risultato precedente **746/746** riguarda la regressione completa prima di queste due note, non quella corrente.

Limiti: non benchmark, MSRV, matrice di toolchain/piattaforme, Miri, async closure, thread reali, ogni dettaglio della cattura precisa o tutte le API degli iteratori. Send/static sono verificati come vincoli di compilazione; non e un test del sistema di scheduling. Sorgenti e binari di prova sono creati solo nelle fixture temporanee e rimossi dopo controllo del percorso. Nessun accesso a file personali o rete applicativa. Suite degli altri linguaggi non rieseguite.

## Rust: Generics, Traits e Trait bounds

Quattordicesimo blocco, 2026-11-02: **42/183 note principali Rust**, **3/10 di Astrazione e Generici**. Restano 141 note principali e i promemoria separati; approvazione dell'utente distinta dalla revisione tecnica.

Suite `_Meta/tests/rust-generics-traits.test.mjs`: **66/66 test al primo giro**, zero fallimenti/skip, **31,4 secondi**. Estrae **21 programmi** dai Markdown: 18 compilati ed eseguiti, tre controesempi rifiutati con E0369, E0117 ed E0277. Altre sonde esercitano varianti positive e negative senza alterare i sorgenti delle note.

Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**. Toolchain esistente, nessuna crate esterna, installazione o modifica al PATH.

Con rustc disponibile nel PATH o `RUSTC_TEST_EXECUTABLE` configurata:

```powershell
node --test _Meta/tests/rust-generics-traits.test.mjs
```

Copertura:

- Inferenza, turbofish senza conversione, tipi condivisi/indipendenti, None ambiguo, metodi su tipo concreto e generici di metodo. CacheEntry con dati non Clone, Drop e prestito ancora vivo; lifetime della vista e lunghezze const differenti.
- Bound del confronto e NaN; tutte le **65.536 coppie u8**. Il test riguarda il comportamento del demo, non tutti i contratti di PartialOrd.
- Trait nominali, import, membri richiesti e membri estranei; default e forwarding di entrambi i metodi per Box, compreso dyn Named. Receiver consumante, supertrait non implementato automaticamente, orphan rules e impl sovrapposte.
- Validazione nomi: lunghezze 0..82 con ASCII, Unicode multibyte e carattere supplementare; valori scalari distinti dai grafemi, controlli ASCII/C1, ordine degli errori, whitespace e assenza di normalizzazione/escaping. Un implementatore che restituisce sempre Ok dimostra i limiti del contratto statico.
- Bound multipli effettivi, metodo condizionale, Sized e ?Sized, tipo associato, impl Trait nei parametri e nel risultato. Join su lunghezze 0..64 con sei separatori, senza Clone, output non escapato; static distinto da conservazione del valore.

Regressione seriale mirata: **257/257 test**, zero fallimenti/skip, **144,1 secondi**, sulle quattro suite seguenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-generics-traits.test.mjs _Meta/tests/rust-iterators-closures.test.mjs _Meta/tests/rust-structs-enums.test.mjs _Meta/tests/rust-ownership-move-copy.test.mjs
```

Le altre dieci suite Rust e gli altri linguaggi non sono rieseguiti in questo lotto. I risultati delle regressioni precedenti restano storici, non verifiche correnti di tutto il vault.

Limiti: una toolchain e un target, nessun benchmark, MSRV, Miri, matrice di dipendenze, test esaustivo di coherence/dyn compatibility o validatore email. Nessun salvataggio applicativo, rete o accesso a dati personali. Solo fixture temporanee, rimosse dopo verifica del percorso; build Quartz e controlli HTTP/browser sono separati dai test Rust.

## Rust: Derive traits e Associated types

Quindicesimo blocco, 2026-11-02: **44/183 note principali Rust**, **5/10 di Astrazione e Generici**. Restano 139 note principali, oltre ai promemoria. GAT e Derive macros sono letti come contesto, non conteggiati come revisionati.

Suite `_Meta/tests/rust-derive-associated.test.mjs`: **60/60 test al primo giro**, zero fallimenti/skip, **31,7 secondi**. Estrae **17 programmi** dai Markdown: 13 compilati ed eseguiti e quattro controesempi rifiutati con diagnostica attesa (E0277, E0046, E0658).

Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**. Toolchain esistente, nessuna crate esterna, installazione o modifica al PATH. Con rustc nel PATH o `RUSTC_TEST_EXECUTABLE` configurata:

```powershell
node --test _Meta/tests/rust-derive-associated.test.mjs
```

Copertura:

- Impl condizionali sui generici, bound conservativi di derive Clone rispetto a Rc, campo non compatibile, prerequisiti di Ord, Copy/String/Drop e conflitto fra derive e impl manuale.
- Ordine lessicografico su 81 punti ed estremi i32; tutte le 65.536 coppie u8 nei payload degli enum. Discriminanti espliciti, variante Default senza richiedere Default ai payload delle altre varianti, Default distinto da new.
- HashSet su 65.536 ID, ri-inserimento e limiti u64; Eq/Hash senza valori di hash precalcolati o ordine di iterazione assunto. Debug include un campo privato dimostrativo, senza usare dati sensibili reali.
- Clone condiviso e Drop del payload; NaN non riflessivo con PartialEq. Il test della vista confronta il riferimento con il buffer originale: non misura l'allocator o le performance.
- Counter su tutte le 676 coppie start/end 0..25, intervalli vuoti, esaurimento ripetuto e ultimi tre u32 senza overflow. Producer non riceve automaticamente Iterator; seconde impl in conflitto.
- Bound su Item, uguaglianza a String, cloned esplicito, output diverso per parametro del trait, proiezioni qualificate. Repository reale in memoria: ID diverso, assenza, ID zero, massimo u64, nome vuoto, copia indipendente, errore alternativo preservato e mancata implementazione automatica di std::error::Error.
- Associated type unsized, lifetime del risultato, Item fissato nei trait object e rifiuto stable di associated type defaults e alias negli impl inerenti. Nessun esperimento nightly.

Regressione seriale mirata: **238/238 test**, zero fallimenti/skip, **139,9 secondi**, sulle quattro suite:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-derive-associated.test.mjs _Meta/tests/rust-generics-traits.test.mjs _Meta/tests/rust-collections.test.mjs _Meta/tests/rust-ownership-move-copy.test.mjs
```

Il solo titolo del test sulla vista e stato reso piu preciso, lasciando invariata la logica; il caso e stato ripetuto separatamente con successo. Una prima invocazione di questa verifica aggiuntiva mancava di `RUSTC_TEST_EXECUTABLE` e ha prodotto ENOENT; ripetuta con la toolchain esplicita, **1/1 superato**. Nessuna correzione necessaria agli esempi Rust.

Le altre undici suite Rust e gli altri linguaggi non sono rieseguiti in questo lotto. Limiti: una baseline/target, nessun benchmark, MSRV, misura delle allocazioni, Miri, derive esterno, database o test completo delle regole avanzate dei trait. Fixture temporanee rimosse dopo verifica del percorso; controlli Quartz e HTTP separati.

## Rust: Generic Associated Types (GAT)

Sedicesimo blocco, 2026-11-02: **45/183 note principali Rust**, **6/10 di Astrazione e Generici**. Restano 138 note principali, oltre ai promemoria.

Suite `_Meta/tests/rust-gat.test.mjs`: **34/34 test al primo giro**, zero fallimenti/skip, **15,7 secondi**. Sei programmi estratti dal Markdown: quattro compilati ed eseguiti, due controesempi verificati tramite diagnostica (bound mancante senza codice dedicato ed E0499).

Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**. Toolchain esistente, nessuna dipendenza o modifica al PATH. Con rustc nel PATH oppure `RUSTC_TEST_EXECUTABLE` impostata all'eseguibile della toolchain:

```powershell
node --test _Meta/tests/rust-gat.test.mjs
```

Copertura:

- Viste condivise, proiezioni, ultimo uso dei prestiti e impossibilita di spostare/distruggere la sorgente prima del risultato. Il bound Self: 'a non consente riferimenti a variabili locali.
- RowSource borrowed/owned: byte UTF-8, assenza distinta da vuoto, identita del buffer e snapshot indipendente. Il demo non e un parser CSV.
- WindowsMut su tutte le **195 coppie lunghezza 0..12 / larghezza 0..14**, esaurimento ripetuto, viste originali e dati non Copy/Clone. Matrice di 45 casi di mutazione su finestre sovrapposte e confronto con un conteggio indipendente.
- Larghezza usize::MAX e ramo checked_add in overflow, quest'ultimo con stato interno intenzionalmente non raggiungibile dall'API ordinaria. Rifiuto di viste simultanee, riuso dopo ultimo uso e snapshot esplicitamente copiati.
- Assenza di IntoIterator e dyn compatibility nei trait dimostrati; scegliere Item<'static> non risolve il problema.
- Sonda HRTB con sorgente locale: riproduce E0597 e menzione di 'static sulla baseline. Controprova con Debug sul GAT, che funziona ma restringe il contratto a tutte le implementazioni. Non una promessa di equivalenza generale.
- GAT di tipo/const con array vuoti, valori non Clone/Copy, trasferimento di ownership e riferimenti locali.

Regressione seriale mirata del 2026-11-02: **218/218 test**, zero fallimenti/skip, **105,3 secondi**. Include la verifica aggiuntiva della diagnosi 'static:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-gat.test.mjs _Meta/tests/rust-derive-associated.test.mjs _Meta/tests/rust-borrowing-slices.test.mjs _Meta/tests/rust-iterators-closures.test.mjs
```

Altre dodici suite Rust e altri linguaggi non rieseguiti. Limiti: una toolchain/target, non MSRV, benchmark, Miri, misura dell'allocator o implementazione completa di adattatori lending. Le prove di identita dei puntatori non sono misure generali delle allocazioni. Fixture temporanee isolate e rimosse dopo verifica dei percorsi; controlli Quartz separati.

## Rust: Trait objects e dyn Trait

Diciassettesimo blocco, 2026-11-03: **46/183 note principali Rust**, **7/10 di Astrazione e Generici**. Restano 137 note principali, oltre ai promemoria.

Suite `_Meta/tests/rust-trait-objects.test.mjs`: **45/45 test al primo giro**, zero fallimenti/skip, **21,9 secondi**. Sette programmi estratti: sei compilati ed eseguiti e un controesempio rifiutato con E0038.

Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**. Toolchain esistente, nessuna installazione o nuova dipendenza. Impostare `RUSTC_TEST_EXECUTABLE` al compilatore se rustc non e nel PATH:

```powershell
node --test _Meta/tests/rust-trait-objects.test.mjs
```

Copertura:

- Riferimenti a tipi diversi, identita del buffer e size_of_val del valore concreto senza ipotesi sul layout della vtable; metodi/campi non esposti, borrow e move, Sized/?Sized.
- Factory e collezione owned, ordine delle implementazioni, Drop una sola volta, forwarding non automatico di Box e limite del ritorno impl Trait.
- Lifetime del wrapper e dei dati: default 'static nella firma, risultato borrowed/owned, assenza/vuoto e Unicode, mutazione e uscita dal blocco della sorgente.
- Logger con output stdout reale e catturato, memoria e doppioni, receiver mutabile, errori simulati alla prima e seconda chiamata con effetti precedenti conservati. Nessun guasto indotto allo stdout del sistema.
- Iterator con Item fissato, consumo parziale e fine ripetuta; controprove su Item omesso/errato.
- Arc con thread reale e join, condivisione della stessa istanza, Drop all'ultimo proprietario; rifiuto senza Send o Sync e con Rc nel valore concreto.
- Metodo escluso tramite Self: Sized e non invocabile sul trait object; due trait ordinari rifiutati e alternativa con supertrait compatibili.

Regressione seriale mirata del 2026-11-03: **205/205 test**, zero fallimenti/skip, **98,5 secondi**:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-trait-objects.test.mjs _Meta/tests/rust-gat.test.mjs _Meta/tests/rust-derive-associated.test.mjs _Meta/tests/rust-generics-traits.test.mjs
```

Altre tredici suite Rust e altri linguaggi non rieseguiti. Limiti: una baseline/target, non MSRV, Miri, benchmark, misura dell'allocator, ABI stabile, logger di produzione o verifica generale della concorrenza. Fixture temporanee isolate e rimosse dopo verifica dei percorsi; thread attesi con join, nessuna rete o file applicativo personale. I controlli Quartz sono separati.

## Rust: Static dispatch vs dynamic dispatch

`rust-dispatch.test.mjs` estrae sette programmi dalla nota: sei validi e un controesempio E0308. **46 test**, inclusa l'esecuzione dei sei programmi validi sia con `rustc -C opt-level=0` sia con `rustc -C opt-level=3`. Non sono benchmark e non riproducono automaticamente tutti i parametri dei profili Cargo debug/release.

Baseline: **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Riusa la toolchain esterna indicata nella prima sezione Rust. Impostare `RUSTC_TEST_EXECUTABLE` in ogni nuova shell se rustc non e nel PATH; nessuna dipendenza aggiunta a site.

```powershell
node --test _Meta/tests/rust-dispatch.test.mjs
```

Copertura:

- Interfacce generic e dyn con lo stesso contratto di prestito, output stdout reale, input non Copy riutilizzabile, Unicode e vuoto.
- Parametri anonimi/nominati, turbofish, tipi indipendenti rispetto a T condiviso, Sized implicito e wrapper concreto che inoltra a dyn.
- Ritorno opaco: tutti i limiti u8, fine dell'iteratore, ownership di Once, bound non esposto, lifetime e impossibilita di scegliere il tipo nascosto dal chiamante.
- Handler statico/dinamico sullo stesso algoritmo: byte e valori scalari, testo combinato, CRLF e NUL. Batch vuoto, ordine, duplicati, chiamate osservabili e rifiuto del trait object senza ?Sized.
- Conservazione del proprietario e del buffer dell'input: non una misura dell'allocator o una prova dell'assenza di copie temporanee.
- Enum: varianti nello stesso tipo opaco, scelta runtime ed esaustivita del match. Puntatori a funzione: stesso tipo con destinazioni diverse, function item distinti, coercizioni e closure con/senza catture.
- Rami di impl Trait incompatibili e due correzioni: tipo concreto comune o Box di trait object, con entrambe le sequenze verificate.

Primo giro del 2026-11-03: **45/46**, circa **25,8 secondi**. Lo snippet aggiuntivo CRLF era interpretato prima dal template JavaScript e normalizzato nel sorgente Rust: corretto con String.raw, senza cambiare l'aspettativa o l'algoritmo della nota. I sette programmi originali avevano gia dato i risultati attesi.

Regressione seriale successiva: **223/223 test**, zero fallimenti/skip, **101,3 secondi**; comprende tutti i 46 della nuova suite:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-dispatch.test.mjs _Meta/tests/rust-trait-objects.test.mjs _Meta/tests/rust-generics-traits.test.mjs _Meta/tests/rust-iterators-closures.test.mjs
```

Altre quattordici suite Rust e altri linguaggi non rieseguiti. Una baseline/target: nessuna verifica di MSRV, Miri, layout della vtable, assembly, inlining, devirtualizzazione, dimensione binaria o superiorita prestazionale. Fixture temporanee isolate e rimosse dopo controllo del percorso; nessun servizio remoto o dato personale. Build e QA Quartz restano controlli separati.

## Rust: Object safety

`rust-object-safety.test.mjs` contiene **55 test**. Estrae sette programmi dalla nota: cinque validi e due controesempi E0038. Le prove aggiuntive verificano le regole riportate nella tabella, non solo i risultati degli esempi.

Baseline: **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Riusa la toolchain esterna documentata nella prima sezione Rust; impostare `RUSTC_TEST_EXECUTABLE` in ogni nuova shell se rustc non e nel PATH. Nessuna dipendenza aggiunta a site.

```powershell
node --test _Meta/tests/rust-object-safety.test.mjs
```

Copertura:

- Self concreto in argomento/risultato, metodo escluso e Sized sull'intero trait. Costruttori/helper generici disponibili sul concreto, non automaticamente sul contenuto di Box dyn.
- Parser su tutti i 128 caratteri ASCII, Unicode non ASCII, vuoto, spazi, segni, decimali e 10.000 cifre: il demo e un riconoscitore lessicale, non una conversione numerica.
- Tipo associato fissato, omesso o errato; prestito mutabile, ordine, duplicati e fine ripetuta. Parametro del trait distinto dal parametro del metodo; lifetime del risultato legata all'input, non al servizio.
- Command: testo preservato, consumo del box e del concreto, Drop una sola volta, rifiuto del prestito locale con helper static. Nessun comando di sistema eseguito.
- Async nativo su concreto e rifiutato via dyn; Future erased con risultato borrowed, assenza distinta da vuoto, chiave esatta, lifetime di servizio/chiave, Send non promesso e buffer originale.
- Matrice di 13 incompatibilita: Self, type/const generics, impl Trait in input/ritorno, costante, funzione associata, supertrait, GAT disponibile e receiver annidato. Controprove con GAT escluso, async escluso, costante sostituita da metodo e receiver Rc/Arc/Pin.
- Receiver Self per valore: trait object costruibile, chiamata che sposta il valore unsized rifiutata. Pin: costruzione prima della coercizione e vincolo Unpin preservato esplicitamente.

Primo giro del 2026-11-03: **53/54**, **19,1 secondi**. La prova aggiuntiva Pin cancellava Unpin prima di chiamare Pin::new: corretta costruendo prima il Pin concreto, aggiunta controprova con errore E0277 e variante dyn + Unpin. I sette programmi della nota avevano gia dato i risultati attesi.

Regressione seriale successiva: **180/180 test**, zero fallimenti/skip, **79,7 secondi**, inclusi tutti i 55 della nuova suite:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-object-safety.test.mjs _Meta/tests/rust-trait-objects.test.mjs _Meta/tests/rust-dispatch.test.mjs _Meta/tests/rust-gat.test.mjs
```

Altre quindici suite Rust e altri linguaggi non rieseguiti. Limiti: una baseline/target, non MSRV, Miri, ABI, benchmark, verifica completa di pinning o runtime async. Il future del demo e immediatamente Ready e viene interrogato una sola volta: non e un executor e non collauda I/O, wakeup o scheduling. Le verifiche del puntatore non misurano l'allocator. Fixture temporanee rimosse dopo controllo del percorso, nessun dato personale o servizio remoto. Build e QA Quartz sono separati.

## Rust: Blanket implementations

`rust-blanket.test.mjs` contiene **47 test**, con sette programmi estratti dalla nota: cinque validi e due controesempi E0119/E0210. Comprende anche una fixture a due crate per la compatibilita di un'API pubblica.

Baseline: **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Riusa la toolchain esterna della prima sezione Rust; impostare `RUSTC_TEST_EXECUTABLE` in ogni nuova shell se rustc non e nel PATH. Nessuna dipendenza aggiunta a site.

```powershell
node --test _Meta/tests/rust-blanket.test.mjs
```

Copertura:

- Summary e Loggable: stdout reale, Unicode, direzione dei bound, Sized/?Sized e trait object. Default e supertrait senza implementazione automatica; autoderef distinto dall'impl sul riferimento.
- StringExt: tutti i 128 ASCII, whitespace Unicode e invisibili non whitespace, import del trait, chiamata qualificata, AsRef distinto da Deref e buffer conservato.
- Save: validazione prima di Record/Write, UTF-8 e append, scritture brevi, WriteZero e retry Interrupted. Guasto simulato dopo un prefisso scritto: errore I/O originale preservato, nessun rollback o flush implicito. Writer dyn, input borrowed, str unsized e bound mancanti.
- From/Into: payload non Clone, ordine, buffer trasferito, move e conversione inversa non automatica. Into manuale duplicato in conflitto con la blanket standard.
- Newtype fuori dal bound rispetto a wrapper ancora coperto; impl in moduli diversi, bound differenti sovrapposti e possibile evoluzione upstream. Alias/Vec non locali rispetto a Box locale; E0207 e specializzazione non stable.
- Due crate compilate con rustc: il consumer con impl esplicita e valido contro la prima libreria e fallisce con E0119 quando la seconda versione introduce la blanket impl. Non e una simulazione mediante moduli nello stesso crate.

Primo giro del 2026-11-03: **45/46**, **22,6 secondi**. Il test negativo del move usava let \_ senza leggere il campo: corretto con accesso alla lunghezza dopo il consumo, mantenendo E0382 atteso. Aggiunto il caso Save su str unsized. Tutti i programmi della nota avevano gia dato il risultato atteso.

Regressione di chiusura di **Astrazione e Generici**: **353/353 test**, zero fallimenti/skip, **169,6 secondi**. Eseguite tutte le sette suite delle dieci note del capitolo, inclusi i 47 nuovi test:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-generics-traits.test.mjs _Meta/tests/rust-derive-associated.test.mjs _Meta/tests/rust-gat.test.mjs _Meta/tests/rust-trait-objects.test.mjs _Meta/tests/rust-dispatch.test.mjs _Meta/tests/rust-object-safety.test.mjs _Meta/tests/rust-blanket.test.mjs
```

Altre tredici suite Rust e altri linguaggi non rieseguiti. Limiti: una baseline/target, non MSRV, Miri, benchmark, audit generale di coherence o misura dell'allocator. Le scritture e i guasti sono in memoria: non sono test di durabilita, transazioni, filesystem o logger di produzione. La conservazione dei puntatori non misura tutte le allocazioni. Librerie rlib e programmi vivono in fixture temporanee rimosse dopo verifica dei percorsi; nessuna rete, pubblicazione o dato personale. Build e QA Quartz sono controlli separati.

## Rust: Lifetime annotations

Suite `rust-lifetime-annotations.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target Windows GNU e Node **24.14.0**.

```powershell
$env:RUSTC_TEST_EXECUTABLE = "C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-rust-tools-ae6b471bd6a24ac9bd8d7ba43a48b5f6/rustup/toolchains/1.99.1-x86_64-pc-windows-gnu/bin/rustc.exe"
```

```powershell
node --test _Meta/tests/rust-lifetime-annotations.test.mjs
```

**40/40 test** al primo giro, **16,9 secondi**: otto programmi estratti dal Markdown, sei validi e due controesempi E0597/E0515. Frontmatter confrontato con HEAD senza cambiare date, pubblicabilita o status.

- Lifetime comune rispetto a durata dei proprietari, input indipendenti e contratto non specializzato sul ramo eseguito.
- Byte UTF-8, vuoto, parita, identita delle viste, ultimo uso, move e mutazioni incompatibili.
- Struct View con lifetime dei dati distinto dal receiver; controprova con output eliso e proprietario scaduto.
- Outlives nel verso corretto, implied bound T: 'a, Debug non implicito e str con ?Sized.
- Fallback con whitespace Unicode, copia prima della fine del prestito, static reference rispetto a static bound e contenitori con riferimenti locali.
- Diagnostica negativa verificata, con varianti corrette dove utile; nessun esempio disabilitato o ignorato.

Regressione mirata corrente: **199/199 test**, zero fallimenti/skip, **98,0 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-borrowing-slices.test.mjs _Meta/tests/rust-stringhe-memoria-lifetime.test.mjs _Meta/tests/rust-gat.test.mjs _Meta/tests/rust-lifetime-annotations.test.mjs
```

Le altre diciassette suite Rust e gli altri linguaggi non sono stati rieseguiti. Test su una sola baseline/target, non verifica di MSRV, Miri o misura delle allocazioni. Le prove sui puntatori verificano l'identita delle viste, non tutti i costi del programma. Fixture temporanee rimosse dopo verifica del percorso; build e QA Quartz sono controlli separati.

## Rust: Lifetime elision

Suite `rust-lifetime-elision.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target Windows GNU e Node **24.14.0**.

```powershell
$env:RUSTC_TEST_EXECUTABLE = "C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-rust-tools-ae6b471bd6a24ac9bd8d7ba43a48b5f6/rustup/toolchains/1.99.1-x86_64-pc-windows-gnu/bin/rustc.exe"
```

```powershell
node --test _Meta/tests/rust-lifetime-elision.test.mjs
```

**51 test**: nove programmi estratti dal Markdown (sei validi e tre controesempi), firme espanse, input annidati, receiver, placeholder, trait object e callable.

- Primo giro **46/47**, **21,5 secondi**: la bozza considerava sufficiente un unico nome lifetime ripetuto su due input per elidere il risultato. Il compilatore ha restituito E0106. Corretta la spiegazione, aggiunta la forma con output esplicito e la controprova con un solo input nominato.
- First word con whitespace Unicode e identita della slice, prestiti e mutazioni, Buffer che copia dati temporanei e View senza ownership.
- Path::extension con directory contenenti punti, dotfile, suffissi multipli/vuoti; regressione sulla vecchia rsplit_once. Nome non Unicode su Windows e distinzione tra assenza e conversione fallita.
- Split email volutamente non validante, risultati legati a PathBuf/User, copia OsString indipendente.
- Box con default static nella firma rispetto a bound inferito nelle espressioni; function pointer HRTB, Fn e closure isolata rispetto al contesto fn.
- Metadata invariati rispetto a HEAD e struttura della nota verificata.

Regressione seriale corrente: **203/203 test**, inclusi i 51 nuovi, zero fallimenti/skip, **94,2 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-stringhe-memoria-lifetime.test.mjs _Meta/tests/rust-trait-objects.test.mjs _Meta/tests/rust-lifetime-annotations.test.mjs _Meta/tests/rust-lifetime-elision.test.mjs
```

Le altre diciotto suite Rust e gli altri linguaggi non sono stati rieseguiti. La variante Unix del test OsStr e condizionata con cfg e non eseguita su Windows. Non sono test del filesystem, di validita email, DNS, MSRV, Miri o allocazioni; i percorsi sono elaborati soltanto come valori. Fixture temporanee rimosse dopo verifica dei percorsi. Build e QA Quartz sono controlli separati.

## Rust: Lifetimes nelle struct

Suite `rust-struct-lifetimes.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target Windows GNU e Node **24.14.0**.

```powershell
$env:RUSTC_TEST_EXECUTABLE = "C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-rust-tools-ae6b471bd6a24ac9bd8d7ba43a48b5f6/rustup/toolchains/1.99.1-x86_64-pc-windows-gnu/bin/rustc.exe"
```

```powershell
node --test _Meta/tests/rust-struct-lifetimes.test.mjs
```

**45 test**: otto programmi estratti dal Markdown, sei validi e due controesempi. Primo giro **45/45**, **18,7 secondi**, nessun fallimento o test saltato.

- Excerpt: ultimo uso, byte UTF-8, identita del riferimento, risultato del metodo esplicito/eliso, Clone/Copy e Drop con/senza lettura del campo.
- PairView/MixedView: durata comune rispetto a indipendente, proprietari con scope diversi, risultato conservabile rispetto all'intera vista, ritorno legato al campo sbagliato.
- BytesMut: reborrow successivi, consumo tramite into_inner, accessi incompatibili, receiver troppo lungo e Copy non derivabile.
- Token: slice sul buffer, whitespace Unicode, testo vuoto e punteggiatura, conversione posseduta indipendente; kind static non estende il testo preso in prestito.
- Cow: rami borrowed/owned, riuso della String esistente, maiuscolo solo ASCII, conversione esplicita del lifetime e distruzione normale del valore static.
- Document: viste sui dati posseduti, move/mutazione vietati finche il risultato serve. Riferimento locale e costruttore autoreferenziale rifiutati; alternative con sorgente esterna.
- Frontmatter invariato rispetto a HEAD, struttura e fonti controllate.

Regressione seriale del 2026-11-03: **205/205 test**, zero fallimenti/skip, **92,1 secondi**. Include Structs/Enums e le tre note revisionate di Lifetimes.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-structs-enums.test.mjs _Meta/tests/rust-lifetime-annotations.test.mjs _Meta/tests/rust-lifetime-elision.test.mjs _Meta/tests/rust-struct-lifetimes.test.mjs
```

Le altre diciannove suite Rust e gli altri linguaggi non sono stati rieseguiti. Una sola baseline/target, non MSRV, Miri o misure dell'allocator. I confronti di puntatori verificano identita e trasferimento dei buffer negli esempi, non tutti i costi del programma. Il parser didattico non e un lexer; non sono implementate o collaudate strutture autoreferenziali con unsafe/Pin. Fixture rimosse dopo verifica dei percorsi. Build e QA Quartz restano controlli separati.

## Rust: Lifetimes nei trait

Suite `rust-trait-lifetimes.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target Windows GNU e Node **24.14.0**.

```powershell
$env:RUSTC_TEST_EXECUTABLE = "C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-rust-tools-ae6b471bd6a24ac9bd8d7ba43a48b5f6/rustup/toolchains/1.99.1-x86_64-pc-windows-gnu/bin/rustc.exe"
```

```powershell
node --test _Meta/tests/rust-trait-lifetimes.test.mjs
```

**51 test**, con otto programmi estratti dal Markdown: sei validi e due controesempi. Primo giro **50/51**, **21,5 secondi**: il test sul bound GAT omesso non includeva i backtick intorno a Item nel messaggio diagnostico atteso. Corretto soltanto il confronto; tutti gli esempi della nota avevano gia dato l'esito previsto.

- View/Named: lifetime esplicito/eliso, vista sul buffer e receiver, implementatore borrowed senza parametro sul trait, dispatch dyn e contratto generico non rafforzato da un literal.
- Parser: trim Unicode, associated type borrowed/owned, tipo Output nel trait object e ?Sized; il parametro del trait non implica Self: 'input, dimostrato con configurazione locale.
- FieldReader: campo vuoto rispetto ad assente, indice fuori intervallo, usize::MAX, virgole letterali, spazi, virgolette e newline non interpretate come CSV. Identita della slice, lettore breve e proprietario ancora necessario.
- Source: vuoto, ordine, esaurimento ripetuto, conflitti tra prestiti, bound GAT obbligatorio, assenza di dyn compatibility e di Iterator automatico; alternativa con ritorno fisso senza GAT.
- HRTB: sorgente interna, copia prima della distruzione, static-only non sufficiente, output borrowed/owned non intercambiabili. Cattura locale consentita in una closure con relazione input/output universale.
- Trait object: bound esplicito nella factory rispetto al default di una firma e all'inferenza locale, lifetime del prestito distinto dal bound dell'oggetto, Box non proprietario del testo borrowed.
- Frontmatter invariato rispetto a HEAD; struttura e fonti verificate.

Regressione seriale del 2026-11-03: **185/185 test**, zero fallimenti/skip, **76,3 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-struct-lifetimes.test.mjs _Meta/tests/rust-gat.test.mjs _Meta/tests/rust-object-safety.test.mjs _Meta/tests/rust-trait-lifetimes.test.mjs
```

Le altre venti suite Rust e gli altri linguaggi non sono stati rieseguiti. Una sola baseline/target, non MSRV, Miri, misura delle allocazioni o conformita CSV. I test dei puntatori verificano le viste dei demo, non tutte le possibili implementazioni dei trait. Fixture temporanee rimosse dopo verifica dei percorsi; nessuna nuova dipendenza. Build e QA Quartz restano verifiche separate.

## Rust: Lifetimes avanzati

Suite `rust-advanced-lifetimes.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target Windows GNU e Node **24.14.0**.

```powershell
$env:RUSTC_TEST_EXECUTABLE = "C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-rust-tools-ae6b471bd6a24ac9bd8d7ba43a48b5f6/rustup/toolchains/1.99.1-x86_64-pc-windows-gnu/bin/rustc.exe"
```

```powershell
node --test _Meta/tests/rust-advanced-lifetimes.test.mjs
```

**62/62 test** al primo giro, **29,9 secondi**. Dieci programmi estratti dal Markdown, otto validi e due controesempi; nessun blocco unsafe.

- Outlives e implied bounds: tipo sized/unsized, riferimenti contenuti, verso corretto/omesso/invertito, Display non implicito e ritorno locale rifiutato.
- Static: riferimento rispetto al tipo, String/Vec<String> posseduti e distruttore osservabile, &str e Vec<&str> locali rifiutati.
- Reborrow: chiamate ripetute, forma implicita/esplicita, move con let non annotato e conflitti con il prestito ancora usato.
- Placeholder/Split: vuoto, Unicode, campi vuoti e delimitatori letterali, firma espansa, identita delle slice e collect che non elimina i prestiti.
- BorrowedDisplay: str/dyn, Unicode, copia indipendente, Display custom borrowed, nessun escaping e panic osservabile su implementazione Display scorretta.
- Varianza: Vec/Box covarianti, prestito mutabile esterno accorciabile e contenuto invariante; input/output di function pointer, RefCell e campi con varianza combinata.
- Trait object: bound esplicito rispetto al default static della firma, proprietario ancora necessario e alternativa owned.
- PhantomData: ricerca e offset in byte UTF-8, marker di dimensione zero, dipendenza dal proprietario, usize estratto indipendente, covarianza e influenza della forma reference su Send.
- Controprove corrette: assegnazione static, contenuto String posseduto, regione comune senza static, Cell consumato e ricostruito da into_inner.
- Frontmatter invariato rispetto a HEAD, struttura e fonti verificate.

Regressione seriale delle cinque note revisionate del capitolo Lifetimes: **249/249 test**, zero fallimenti/skip, **111,9 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-lifetime-annotations.test.mjs _Meta/tests/rust-lifetime-elision.test.mjs _Meta/tests/rust-struct-lifetimes.test.mjs _Meta/tests/rust-trait-lifetimes.test.mjs _Meta/tests/rust-advanced-lifetimes.test.mjs
```

Le altre venti suite Rust e gli altri linguaggi non sono stati rieseguiti. Una sola baseline/target, non MSRV, Miri, benchmark o conteggio delle allocazioni. I puntatori verificano identita e trasferimento dei buffer dei demo, non ogni costo del programma. Nessuna implementazione unsafe o validazione CSV; il test Send controlla il tipo, non esegue thread. Fixture temporanee rimosse dopo verifica dei percorsi. Build e QA Quartz restano verifiche separate.

## Rust: Higher-Ranked Trait Bounds (HRTB)

Suite `rust-hrtb.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target Windows GNU e Node **24.14.0**.

```powershell
$env:RUSTC_TEST_EXECUTABLE = "C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-rust-tools-ae6b471bd6a24ac9bd8d7ba43a48b5f6/rustup/toolchains/1.99.1-x86_64-pc-windows-gnu/bin/rustc.exe"
```

```powershell
node --test _Meta/tests/rust-hrtb.test.mjs
```

**58 test** su dieci programmi estratti dal Markdown: sette validi e tre intenzionalmente non compilabili. Primo giro **57/58**, **27,2 secondi**: il callback con due input unificati e correttamente rifiutato, ma il test attendeva E0308 anziche il messaggio di implementazione non abbastanza generale. Corretta soltanto l'asserzione del diagnostico; tutti gli esempi della nota avevano gia prodotto gli esiti attesi.

- HRTB esplicito/eliso, posizione del binder e insufficienza del lifetime esterno per un dato creato nella funzione.
- Fn rispetto a FnMut/FnOnce, interior mutability, catture locali/Rc, move che non implica consumo e function pointer senza catture.
- Visitatori di collezioni: ordine, vuoto, Unicode, copie indipendenti e viste trattenute tramite lifetime nominato. Accumulo di prestiti con bound universale, mutazione e distruzione del proprietario rifiutati.
- Trait Visit con configurazione locale e input indipendenti; implementazione static-only e bound static superfluo rifiutati.
- with_temp: risultato posseduto, riferimento esterno/statico e tupla mista; cattura consumata, chiamata unica, FnMut accettato. Fuga del prestito temporaneo e uso del risultato dopo il proprietario esterno rifiutati.
- transform: relazione input/output, elision equivalente, trim Unicode con identita della vista, literal statico, funzione nominata e contesto fn. Cattura locale restituita per ogni input, input static-only e coercizione di closure con catture rifiutati.
- Due lifetime indipendenti: risultato legato al primo input; firma con lifetime comune, ritorno del secondo e proprietario del primo scaduto rifiutati.
- Trait object: prestiti di input locali, lifetime della configurazione, default static se omesso, alternativa con String posseduta e mutazione consentita dopo drop del checker.
- Frontmatter invariato rispetto a HEAD, struttura, fonti e assenza di codice unsafe verificate.

Regressione seriale dell'intero capitolo Lifetimes e dei GAT: **341/341 test**, zero fallimenti/skip, **159,0 secondi**. Comprende **307 test delle sei note Lifetimes** e **34 GAT**; la nuova suite passa in tutti i suoi 58 casi.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-lifetime-annotations.test.mjs _Meta/tests/rust-lifetime-elision.test.mjs _Meta/tests/rust-struct-lifetimes.test.mjs _Meta/tests/rust-trait-lifetimes.test.mjs _Meta/tests/rust-advanced-lifetimes.test.mjs _Meta/tests/rust-hrtb.test.mjs _Meta/tests/rust-gat.test.mjs
```

Le altre diciannove suite Rust e gli altri linguaggi non sono stati rieseguiti. Una sola baseline/target, non MSRV, Miri, benchmark, conteggio delle allocazioni o collaudo di callback asincroni. I confronti di puntatori verificano le viste dei demo. Fixture temporanee rimosse dopo verifica dei percorsi, nessuna nuova dipendenza. Build e QA Quartz restano verifiche separate.

## Rust: Box<T>

Suite `rust-box.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target Windows GNU e Node **24.14.0**.

```powershell
$env:RUSTC_TEST_EXECUTABLE = "C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-rust-tools-ae6b471bd6a24ac9bd8d7ba43a48b5f6/rustup/toolchains/1.99.1-x86_64-pc-windows-gnu/bin/rustc.exe"
```

```powershell
node --test _Meta/tests/rust-box.test.mjs
```

**63/63 test** al primo giro, **32,9 secondi**. Dieci programmi estratti dal Markdown: otto validi e due intenzionalmente non compilabili; nessun blocco unsafe o placeholder nella nota.

- Ownership: deref coercion, as_ref/as_mut, Copy del contenuto, move del box, estrazione di String, mutazione e prestito ancora attivo. Rappresentazione sized, array grande e ZST senza conteggio delle allocazioni.
- Clone: String indipendenti, contenuto non Clone rifiutato, Box<Rc<_>> con dato condiviso e Box<&str> ancora borrowed.
- Drop: trasferimento, uscita dallo scope, distruzione anticipata, valore estratto e restituito, ZST con distruttore e trait object. Passare solo un riferimento a drop non distrugge il proprietario.
- Sequenze: vuote, valori non Clone, capacita in eccesso, conversioni Box/Vec, coercizione array-slice con indirizzo conservato, Unicode e maiuscolo ASCII. Assenza di push/push_str e differenza Box<str>/Box<&str> verificate.
- Factory dyn: due implementazioni reali, zero/massimo, output String indipendente senza escaping, bound borrowed esplicito/default static e impossibilita di unificare due concreti con un semplice impl Trait.
- Send/Sync: Box<String>, Box<Rc<_>>, Box<Cell<_>> e trait object con/senza Send verificati a compile time, senza simulare sincronizzazione.
- List: vuoto, ordine, prepend, letture ripetute e lunghezze limitate; assenza dell'indirezione rifiutata per tipo ricorsivo infinito.
- Expr: risultato e riuso del prestito, estremi i64, overflow/underflow e propagazione degli overflow intermedi. Ripetuto il programma con opt-level 3 e overflow-checks off.
- Pin: Box ordinario di Entry non Unpin ancora estraibile/sostituibile; estrazione e into_inner vietati dopo pinning, wrapper trasferibile con indirizzo del contenuto conservato. Caso String: Unpin valido.
- Lifetime: proprietario scaduto e clone del riferimento rifiutati, alternative Box<String>/Box<str> compilate; leak non rende statici prestiti locali.
- API: Box::into_inner e Box::try_new ancora feature-gated sulla baseline; chiamata from_raw senza unsafe rifiutata. Nessun raw pointer viene dereferenziato o ricostruito a runtime.
- YAML confrontato con HEAD: unica modifica consentita e Deref Trait spostato da prerequisites a related; altri campi invariati. Gerarchia e fonti verificate.

Regressione seriale mirata: **293/293 test**, zero fallimenti/skip, **157,1 secondi**. Comprende Box (63), ownership/move/copy (56), stringhe/memoria/lifetime (67), trait object (45) e lifetimes avanzati (62).

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-box.test.mjs _Meta/tests/rust-ownership-move-copy.test.mjs _Meta/tests/rust-stringhe-memoria-lifetime.test.mjs _Meta/tests/rust-trait-objects.test.mjs _Meta/tests/rust-advanced-lifetimes.test.mjs
```

Le altre ventidue suite Rust e gli altri linguaggi non sono stati rieseguiti. Una baseline/target, non MSRV, Miri, benchmark, esaurimento intenzionale della memoria o prova di stack overflow. Nessun allocator custom o conteggio delle allocazioni; i confronti di puntatori riguardano i demo. I test Send/Sync della nuova suite non avviano thread; la regressione trait object include il suo esempio Arc con thread reale. Fixture temporanee rimosse dopo verifica dei percorsi, nessuna nuova dipendenza. Build e QA Quartz restano verifiche separate.

## Rust: Deref Trait

Seconda nota di Smart Pointers e Interior Mutability. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Stessa toolchain delle suite precedenti, nessuna crate esterna.

```powershell
node --test _Meta/tests/rust-deref.test.mjs
```

Per selezionare esplicitamente una toolchain gia installata:

```powershell
$env:RUSTC_TEST_EXECUTABLE = (rustup which --toolchain 1.99.1 rustc)
```

In alternativa, la variabile accetta il percorso completo di rustc.exe nella toolchain temporanea. Il controllo della versione e obbligatorio: compilatore assente o diverso non produce uno skip silenzioso.

**66/66 test** al primo giro, **34,0 secondi**. La suite estrae dieci programmi dalla nota: sette compilabili, incluso un wrapper volutamente errato che viola la propria invariante, e tre rifiutati con diagnostica prevista. Controlla anche struttura, frontmatter invariato e fonti ufficiali.

Copertura: prestito rispetto a Copy/move, wrapper inline senza allocazione propria, catene di coercizione e punti con tipo atteso, durata delle viste, mutabilita e reborrow, DerefMut con il suo supertrait, API slice rispetto a Vec. Verificati i limiti della validazione di NonEmptyString, privacy esterna, sostituzione fallita senza cambiamenti, Unicode/whitespace e trasferimento del buffer. Una controprova distingue &mut str, che non cambia lunghezza tramite API safe, da &mut String, che puo svuotare il contenuto.

Altre sonde controllano AsRef esplicito e consumo dell'argomento, trait bound non ereditati, operatori non inoltrati, collisioni dei metodi e ordine dei receiver, clone del target rispetto al wrapper, chiamata consuming rifiutata e possibili panic di Deref. I tre controesempi della nota sono verificati anche nelle rispettive correzioni; una vista esplicita, un tipo generico esplicito e un'implementazione Display sono alternative distinte.

Regressione seriale di Deref, Box, borrowing/slices e trait object: **232/232 test**, zero fallimenti/skip, **118,8 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-deref.test.mjs _Meta/tests/rust-box.test.mjs _Meta/tests/rust-borrowing-slices.test.mjs _Meta/tests/rust-trait-objects.test.mjs
```

Altre ventiquattro suite Rust e altri linguaggi non rieseguiti. Una baseline/target, non MSRV, Miri, benchmark o conteggio delle allocazioni. Nessun codice unsafe; i confronti di puntatori verificano le viste e i buffer dei demo, non una proprieta universale di Deref. Fixture temporanee rimosse dopo verifica dei percorsi. Controlli editoriali, build e QA Quartz restano verifiche separate.

## Rust: Drop Trait

Terza nota di Smart Pointers e Interior Mutability. **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. La nuova suite non richiede crate esterne.

```powershell
node --test _Meta/tests/rust-drop.test.mjs
```

`RUSTC_TEST_EXECUTABLE` seleziona il compilatore come nelle suite precedenti. **72 test** su undici programmi originali (otto compilabili, uno con panic intercettato fra questi, e tre controesempi), struttura e sonde aggiuntive. Primo giro **67/70**, **39,6 secondi**: corretto il demo che tentava drop su ManuallyDrop, corrette due aspettative della suite su UTF-8 e temporanei; aggiunte due controprove del lint.

Copertura: ordine di distruzione, cleanup dei campi senza impl diretto, ownership, riassegnamento, wildcard, Copy, prestiti e guardie. Mutex reale verificato con try_lock, senza bloccare il processo. AppendTransaction controllata su rollback/commit, errori, ?, unwinding, privacy, prestito esclusivo, forget e capacita; mutazioni errate dei metodi rilevate dalle asserzioni.

I sink Write verificano errori di flush, scritture parziali, WriteZero, retry del Drop e output da scritture brevi. Estrazione con take/replace/Option, ManuallyDrop e lint, distruttori durante unwind, static, exit e drop check. Le regole di if let e tail expression sono confrontate nelle edition 2021 e 2024 usando lo stesso compilatore.

Per riprodurre la regressione di cinque suite serve anche la cache Cargo delle note panic/thiserror/anyhow. Percorso della cache gia popolata in questa sessione:

```powershell
$env:RUST_ERROR_TEST_CARGO_HOME = Join-Path $env:TEMP 'appunti-rust-error-crates-cache-bdba0268db5448c9a2651b8d0ad6ccd2'
```

```powershell
$env:RUST_ERROR_TEST_FETCH = '0'
```

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-drop.test.mjs _Meta/tests/rust-box.test.mjs _Meta/tests/rust-deref.test.mjs _Meta/tests/rust-ownership-move-copy.test.mjs _Meta/tests/rust-panic-error-crates.test.mjs
```

Risultati: **257/257** per Drop, Box, Deref e ownership nel primo giro della regressione; **72/72** della nuova suite inclusi. La suite panic/errori aveva 26 fallimenti ambientali per cache Cargo non selezionata (giro complessivo **301/327**, **176,0 secondi**). Impostato il percorso gia documentato, e stata rieseguita integralmente offline: **70/70**, **65,3 secondi**, zero fallimenti/skip. Sono quindi verificati tutti i **327 casi delle cinque suite**, senza presentare le due esecuzioni come un unico giro pulito.

Le altre ventiquattro suite Rust e gli altri linguaggi non sono stati rieseguiti. Nessun unsafe eseguito, nessuna perdita intenzionale di handle, abort, crash o test di durabilita su disco. Exit riguarda soltanto un processo fixture. Fixture rimosse dopo verifica dei percorsi; la cache Cargo preesistente resta separata. Non MSRV, Miri, benchmark o matrice di piattaforme. Build e QA Quartz sono controlli distinti.

## Rust: Rc<T> e Arc<T>

Quarta nota di Smart Pointers e Interior Mutability. **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Solo standard library, nessuna crate o cache Cargo richiesta.

```powershell
node --test _Meta/tests/rust-rc-arc.test.mjs
```

RUSTC_TEST_EXECUTABLE seleziona il compilatore come nelle suite precedenti. **70/70 test** superati al primo giro in **40,5 secondi**: tredici programmi estratti dalla nota tramite AST (dieci compilabili e tre controesempi), frontmatter confrontato con HEAD, struttura, fonti e sonde aggiuntive.

Copertura: clone degli handle senza Clone del contenuto, move e prestiti, identita rispetto all'uguaglianza, contatori e rilascio osservabile. Weak vuoto, clonato, promosso e scaduto; Rc e Arc distinti, senza dereferenziare il debole.

get_mut con proprietari forti/deboli, contenuto non Clone e prestiti attivi. make_mut provato con Rc e Arc nei tre casi unico/condiviso/con Weak; contatore Clone effettivo, campi ancora condivisi e deboli che restano legati al vecchio valore. RefCell in conflitto, Cell, bound Send/Sync e riferimenti interni non static.

Thread reali con join, dati vuoti/negativi, Mutex con zero/uno/otto worker e contatori osservati tramite protocollo a canali. Ciclo forte creato, recuperato e interrotto prima della fine della fixture. Nessuna pausa usata come sincronizzazione.

Estrazione senza Clone e con Weak, Drop rinviato fino al rilascio del contenuto estratto, into_inner con uno/due/otto proprietari e barriera. Il caso di due try_unwrap falliti trattiene i due Result fino alla barriera per dimostrare deterministicamente che scartare entrambi gli Err puo non recuperare alcun valore. new_cyclic, unwrap_or_clone, tipi unsized, trait object e correzioni dei controesempi.

Regressione delle quattro note del capitolo revisionate finora:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-box.test.mjs _Meta/tests/rust-deref.test.mjs _Meta/tests/rust-drop.test.mjs _Meta/tests/rust-rc-arc.test.mjs
```

Regressione: **271/271** superati in **141,8 secondi**, zero fallimenti/skip, inclusi i **70/70** della nuova suite. Altre ventisei suite Rust e altri linguaggi non rieseguiti.

Limiti: una toolchain e una piattaforma; non MSRV, Miri, Loom, benchmark, verifica di tutti gli interleaving o target embedded. Le fixture sono processi separati, senza unsafe, senza risorse intenzionalmente perse e con timeout. Le directory temporanee vengono eliminate soltanto dopo verifica del percorso. Build e QA Quartz sono controlli distinti.

## Rust: RefCell<T>

Quinta nota di Smart Pointers e Interior Mutability. **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Solo standard library, nessuna crate o cache Cargo richiesta.

```powershell
node --test _Meta/tests/rust-refcell.test.mjs
```

`RUSTC_TEST_EXECUTABLE` seleziona il compilatore come nelle suite precedenti. **78 test**: dodici programmi estratti dalla nota tramite AST (otto validi, due panic intenzionali e due errori di compilazione), confronto del frontmatter con HEAD, struttura/fonti e sonde aggiuntive.

Primo giro **76/78**, **44,9 secondi**. Tutti i programmi della nota hanno dato l'esito previsto. Corretti due difetti nelle sonde: diagnostico E0594 al posto di E0596 per assegnazione attraverso Ref, e iterazione esplicita tramite iter per raggiungere il conflitto runtime nel logger modificato.

Copertura: durata delle guardie, Ref::clone rispetto al clone del contenuto, Deref/DerefMut, lifetime e wildcard. Conflitti fallibili senza modifiche, messaggi vuoti/UTF-8/multilinea, Error, get_mut/into_inner senza Clone o Default, replace/take/swap/replace_with e guardie dimenticate senza risorse allocate perse.

Logger: snapshot indipendente, ordine e duplicati, visita finita nonostante le aggiunte, rientranza errata rilevata e modifiche parziali dopo panic. Proiezioni map/filter_map, Err che conserva la guardia originale, RefMut, map_split ai confini e rifiuto di riferimenti mutabili sovrapposti.

Send/Sync, trasferimento per move, prestito esclusivo scoped e casi non trasferibili. Temporanei if let confrontati in edition 2021/2024, incluso il ramo else, e match. Correzioni con guardia proiettata o valore posseduto, assenza di rollback/poisoning, UnwindSafe e confine unsafe della dereferenziazione raw.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-refcell.test.mjs _Meta/tests/rust-rc-arc.test.mjs _Meta/tests/rust-drop.test.mjs _Meta/tests/rust-borrowing-slices.test.mjs
```

Regressione: **278/278** superati in **157,6 secondi**, zero fallimenti/skip, inclusi i **78/78** della nuova suite. Altre ventisette suite Rust e altri linguaggi non rieseguiti.

Limiti: una toolchain e una piattaforma, non MSRV, Miri, benchmark o verifica di ogni scheduling. Panic intercettati soltanto nelle fixture con invarianti esplicite, non come suggerimento di recupero universale. Nessun unsafe eseguito; mem::forget riguarda solo una guardia su un intero e la cella viene infine consumata. Fixture isolate con timeout, rimosse dopo verifica del percorso. Build e QA Quartz sono controlli distinti.

## Rust: Cell<T>

Sesta nota di Smart Pointers e Interior Mutability. **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Solo standard library, nessuna crate o cache Cargo richiesta.

```powershell
node --test _Meta/tests/rust-cell.test.mjs
```

`RUSTC_TEST_EXECUTABLE` seleziona il compilatore come nelle suite precedenti. **76/76 test** superati al primo giro in **39,6 secondi**: undici programmi estratti dal Markdown tramite AST (otto validi e tre controesempi), frontmatter confrontato con HEAD, struttura/fonti e sonde aggiuntive.

Copertura: snapshot Copy, move e clone del contenitore, clone di Rc, valori non Copy/non Clone/non Default, take con default esplicito e stringhe vuote/UTF-8/multilinea. Il numero di Drop distingue set, replace e into_inner; prestiti di get_mut e consumo della cella controllati dal compilatore.

Metrics verificato da zero fino a u64::MAX, anche con ottimizzazioni e overflow checks disabilitati. Due varianti intenzionalmente errate (wrapping e scrittura rimossa) sono rilevate dalle asserzioni. Slot opzionale, estrazione ripetuta, move, errori/panic dopo take e aggiornamenti rientranti sovrascritti.

Viste su slice vuote, positive, negative e valori estremi; identita del buffer verificata senza dereferenziare puntatori raw, array di String non Copy, lunghezza nel tipo e lifetime. Send/Sync, ownership del worker, prestito esclusivo scoped, Arc e Mutex distinti.

update: risultato unit, callback FnOnce chiamata una volta, bound Copy, chiamate annidate, panic con/senza effetti precedenti. Swap con se stessa, Default e Drop fallibili, get_cloned ancora feature-gated sulla baseline e obbligo di unsafe per dereferenziare as_ptr. Correzioni dei controesempi, incluso un atomico con ordering esplicito e join implicito dello scope.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-cell.test.mjs _Meta/tests/rust-refcell.test.mjs _Meta/tests/rust-rc-arc.test.mjs _Meta/tests/rust-drop.test.mjs
```

Regressione: **296/296** superati in **168,4 secondi**, zero fallimenti/skip, inclusi i **76/76** della nuova suite. Altre ventotto suite Rust e altri linguaggi non rieseguiti.

Limiti: una toolchain e una piattaforma; non MSRV, Miri, benchmark o tutti gli scheduling. Le versioni di stabilizzazione delle API provengono dalla documentazione, non da test su compilatori storici. Nessun unsafe eseguito, nessuna sovrapposizione parziale di celle costruita artificialmente o doppio panic; le fixture di unwinding hanno stato e distruttori controllati. Directory temporanee rimosse dopo verifica dei percorsi. Build e QA Quartz sono controlli distinti.

## Rust: Mutex<T> e RwLock<T>

Suite `_Meta/tests/rust-locks.test.mjs`: esempi estratti tramite AST dalla nota, compilati con Rust **1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**.

```powershell
$env:RUSTC_TEST_EXECUTABLE = 'C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-rust-tools-ae6b471bd6a24ac9bd8d7ba43a48b5f6/rustup/toolchains/1.99.1-x86_64-pc-windows-gnu/bin/rustc.exe'
node --test _Meta/tests/rust-locks.test.mjs
```

Primo giro: **52/52** superati in **29,6 secondi**, zero fallimenti/skip. Sette programmi eseguibili, incluso un panic di worker atteso, e due controesempi di compilazione.

- Guardia ancora viva dopo l'ultimo uso, lettori concorrenti e scrittore esclusivo; tentativi non bloccanti da un altro thread.
- Contatore con zero/uno/piu worker, zero iterazioni, overflow anche ottimizzato; la variante con aggiornamento omesso viene rilevata.
- SharedLog vuoto, stringhe vuote/UTF-8/multilinea, snapshot indipendente, clone condiviso e tutti gli inserimenti concorrenti senza assumere ordine.
- I tre metodi rifiutano il poisoning e rilasciano anche la guardia nell'errore. PoisonError mantiene invece occupato il lock finche viene conservato.
- Riparazione distinta da clear_poison e da into_inner; get_mut/into_inner preservano il segnale in Mutex e RwLock.
- Panic con read/write guard distinto da un normale Err con modifica parziale. Nessuna promessa di rollback.
- Ricontrollo dopo una modifica interposta deterministicamente; variante errata di assegnazione incondizionata rilevata. Inizializzazione concorrente con un vincitore, senza promettere costruzione unica del candidato.
- Dodici prove di bound Send/Sync per contenitori e guardie, Cell e Rc, piu un Mutex<Cell<_>> prestato a thread scoped.
- Correzioni dei controesempi con copia posseduta, ritorno della guardia e write guard.
- Future Send con/senza guardia attraverso await: verifica di compilazione, non esecuzione di un runtime async.
- get_cloned e MutexGuard::map rifiutati dalla toolchain stable. Frontmatter confrontato con HEAD.

Regressione mirata:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-locks.test.mjs _Meta/tests/rust-cell.test.mjs _Meta/tests/rust-rc-arc.test.mjs _Meta/tests/rust-drop.test.mjs
```

Regressione: **270/270** superati in **154,5 secondi**, zero fallimenti/skip, inclusi **52/52** nuovi casi. Altre ventinove suite Rust e altri linguaggi non rieseguiti.

Limiti: una toolchain e una piattaforma; non MSRV, Miri, Loom, benchmark, fairness/starvation o tutti gli scheduling. Nessuna esecuzione di Tokio, codice unsafe, deadlock intenzionale o panic=abort. I panic attesi riguardano fixture controllate con unwinding. Il caso di modifica interposta e deliberatamente deterministico, distinto dalla prova con worker reali. Directory temporanee eliminate dopo verifica dei percorsi; timeout per compilazione/esecuzione. Build e QA Quartz sono controlli distinti.

## Rust: OnceLock e LazyLock

Suite `_Meta/tests/rust-once-lazy.test.mjs`: esempi estratti tramite AST dalla nota e verificati con Rust **1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**.

```powershell
$env:RUSTC_TEST_EXECUTABLE = 'C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-rust-tools-ae6b471bd6a24ac9bd8d7ba43a48b5f6/rustup/toolchains/1.99.1-x86_64-pc-windows-gnu/bin/rustc.exe'
node --test _Meta/tests/rust-once-lazy.test.mjs
```

Primo giro: **62/62** superati in **36,2 secondi**, zero fallimenti/skip. Otto programmi eseguibili (uno con panic intercettati) e due controesempi di compilazione.

- Valore rifiutato da set, tipi non Clone, costruzione eager e closure FnOnce. Cattura inutilizzata distrutta anche se la closure non viene chiamata.
- OnceLock con zero/uno/piu consumer, contesa con set e un vincitore senza assumerne l'identita. LazyLock concorrente con una sola esecuzione.
- Canali controllano l'inizializzazione in corso: get restituisce None senza attendere; il produttore viene rilasciato prima di wait/join. Nessuna pausa temporale per sincronizzare.
- Configurazione inizialmente assente, input vuoto/negativo/fuori range/zero, estremi validi e installazione ripetuta rifiutata senza sovrascrittura.
- Err conservato come valore, anche in LazyLock, distinto dal panic. OnceLock consente retry e non annulla effetti precedenti; LazyLock avvelenato non richiama la closure. Panic del consumer dopo l'inizializzazione non avvelena il lazy.
- Accesso esclusivo, take, into_inner, clone indipendente e prestiti incompatibili rifiutati dal compilatore.
- Dieci prove di bound Send/Sync, cattura Rc rifiutata e cattura Send non Sync accettata in un LazyLock condivisibile.
- Controesempi corretti con risultato posseduto, cella del chiamante e contenuto protetto da mutex.
- Quattro API nightly rifiutate dalla toolchain stable; API nuove usate nei programmi originali compilate sulla baseline.
- Const lazy ricreato e static lazy condiviso; Drop di celle locali, cattura mai forzata e valore forzato. Processo fixture conferma che uno static non esegue Drop al termine.
- Frontmatter confrontato con HEAD, struttura e collegamenti alle fonti ufficiali.

Regressione mirata:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-once-lazy.test.mjs _Meta/tests/rust-locks.test.mjs _Meta/tests/rust-cell.test.mjs
```

Regressione: **190/190** superati in **110,9 secondi**, zero fallimenti/skip, inclusi **62/62** nuovi casi. Altre trentuno suite Rust e altri linguaggi non rieseguiti.

Limiti: una toolchain e una piattaforma; non MSRV, Miri, Loom, benchmark, tutti gli scheduling o un runtime async. Le versioni di stabilizzazione sono documentali, non prove su compilatori storici. Nessun unsafe, deadlock intenzionale, panic=abort o lettura di configurazioni reali. I canali provano stati intermedi e risultato finale, non tempi minimi di blocco; i panic attesi usano fixture controllate con unwinding. Directory temporanee rimosse dopo verifica dei percorsi; timeout per compilazione ed esecuzione. Build e QA Quartz restano distinti.

## Rust: Interior mutability

`rust-interior-mutability.test.mjs` estrae gli **otto programmi** della nota: sei validi e due errori di compilazione. **45 test** su modello d'accesso, guardie, cache e trasferimento/condivisione fra thread.

Baseline: **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Impostare `RUSTC_TEST_EXECUTABLE` al compilatore della toolchain gia disponibile; nessun Cargo o package aggiunto.

```powershell
node --test _Meta/tests/rust-interior-mutability.test.mjs
```

Copertura:

- Frontmatter confrontato con HEAD, struttura, fonti e inventario AST dei blocchi.
- Cell non Copy/non Clone, guardie RefCell ancora vive dopo l'ultima lettura e conflitti tramite Result.
- Contatore a zero, alias, istanze indipendenti e overflow ripetuto, anche con ottimizzazione e controlli impliciti disabilitati.
- Cache vuota, whitespace Unicode, punteggiatura, accessi ripetuti, sostituzione prima/dopo il calcolo e invalidazione. Una variante errata senza take e rilevata dalle asserzioni.
- Reset esclusivo e lifetime; clone Rc distinto da copia della cella, move reale a thread e rifiuto della condivisione non sincronizzata.
- Mutex esterno con RefCell, conflitto interno residuo e semplificazione al solo Mutex.
- Correzioni dei controesempi con valore posseduto/Option, guardia proiettata e Arc<Mutex<_>>.
- Dodici prove Send/Sync, incluse Cell, RefCell, Mutex, RwLock, Arc, OnceCell, OnceLock e UnsafeCell.

Primo giro del **2026-11-05**: **45/45** superati in **22,5 secondi**, zero fallimenti/skip.

Regressione seriale Interior mutability, RefCell e OnceLock/LazyLock: **185/185** superati in **98,5 secondi**, inclusi i **45/45** nuovi casi, zero fallimenti/skip. Altre trentadue suite Rust e altri linguaggi non rieseguiti.

Regressione mirata con la stessa variabile del compilatore:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-interior-mutability.test.mjs _Meta/tests/rust-refcell.test.mjs _Meta/tests/rust-once-lazy.test.mjs
```

Limiti: una toolchain e una piattaforma, non MSRV, Miri, Loom o benchmark. Nessun unsafe eseguito, deadlock intenzionale, runtime async o verifica esaustiva degli scheduling. La cache e una dimostrazione di invalidazione, non un tokenizer linguistico o un test di prestazioni. Timeout per le fixture e pulizia solo dopo verifica dei percorsi. Build e QA Quartz restano controlli separati.

## Rust: Pin e Unpin

`rust-pin-unpin.test.mjs` estrae gli **otto programmi** della nota: sei validi e due errori di compilazione. **53 test** su puntatore/contenuto, marker, lifetime, distruzione e future.

Baseline: **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Impostare `RUSTC_TEST_EXECUTABLE` al compilatore della toolchain gia disponibile; nessuna nuova dipendenza o invocazione Cargo.

```powershell
node --test _Meta/tests/rust-pin-unpin.test.mjs
```

Copertura:

- Metadati confrontati con HEAD, struttura/fonti e inventario AST degli esempi.
- Unpin distinto da pinning effettivo; Box ordinario, conversione in Pin, proprietari spostati/scambiati e reborrow.
- Dodici prove Unpin/Send/Sync, incluso il bound di Vec<T> sulla baseline e la distinzione fra wrapper e dato puntato.
- new/get_mut/into_inner non consentiti per contenuti non Unpin; alternative safe con pin! e Box::pin.
- Lifetime locale, restituzione di ownership, Pin::set ripetuto e Drop allo stesso indirizzo. Nessuna dereferenziazione unsafe dei raw pointer usati nei confronti.
- Collezione di Pin<Box<T>> con crescita/riordino e pop del proprietario, non estrazione di T.
- Future con una sospensione reale, richiesta di wake osservabile, proprietario mosso tra due poll e output non Copy/borrowed.
- Wrapper Unpin con F non Unpin; errore con F conservato direttamente, trait object e Send separato per catture Rc/Arc.
- Drop prima/dopo il polling; locali distrutti e nessun rollback degli effetti. Varianti senza wake o con Ready anticipato rilevate.
- Tre programmi rieseguiti con opt-level 3.

Primo controllo ristretto: **9/10**; corretta l'ipotesi errata su Vec<T> sempre Unpin, sostituendo l'esempio con proprietari pinnati separati. Primo giro ampliato: **51/52** per il diagnostico atteso nel caso future non Send, che non ha codice E0277; corretto il controllo sul messaggio e aggiunta la controprova Arc.

Regressione del **2026-11-05**: **243/243** superati in **120,9 secondi**, inclusi i **53/53** nuovi casi, zero fallimenti/skip. Altre trentadue suite Rust e altri linguaggi non rieseguiti.

Il QA ha poi rilevato tipi generici interpretati come HTML nella tabella: corretti con inline code e aggiunto un controllo all'asserzione strutturale, mantenendo 53 casi. Il primo controllo extra assumeva nodi GFM non prodotti da parseNote (52/53); adeguato al paragrafo CommonMark del parser esistente. Riesecuzione finale della suite dedicata: **53/53** in **27,2 secondi**, zero fallimenti/skip. Nessun esempio Rust cambiato dopo la regressione a quattro suite.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-pin-unpin.test.mjs _Meta/tests/rust-box.test.mjs _Meta/tests/rust-drop.test.mjs _Meta/tests/rust-object-safety.test.mjs
```

Limiti: singola toolchain/piattaforma; non MSRV, Miri, benchmark, verifica esaustiva delle invarianti unsafe o runtime async. Il polling e guidato dal test e il waker conta notifiche, non implementa un executor. pin-project 1.1.13 e verificato soltanto documentalmente: nessuna macro installata o eseguita. Nessuna promessa che reserve cambi l'indirizzo del buffer; i test verificano gli indirizzi dei destinatari. Fixture temporanee con timeout e pulizia dopo verifica dei percorsi. Build e QA Quartz restano controlli separati.

## Rust: Iterator API

Suite `rust-iterator-api.test.mjs`: **35 test** sulla nota di approfondimento, distinti dalle basi in Iteratori e Closure. Estrae dal Markdown sette programmi validi e un controesempio di compilazione, verificando frontmatter originale, gerarchia, fonti e sintassi inline.

Copertura: consumo parziale, nth e position, lettura dalle due estremita, size_hint/len, peek e next_if, differenze fra filter_map/map_while/scan, flatten su Result, raccolte e destinazioni. API generica con bound sul tipo IntoIter e ritorno opaco; controprove per capacita non esposte o perse dopo gli adattatori. Countdown verificato per tutti i 256 stati u8 e fine permanente.

Somma: vuoto, grammatica u16, overflow, errore iniziale/finale e ripresa con accumulatore nuovo. Policy delle parole: duplicati, punteggiatura, segni combinanti, lowercase e assenza di normalizzazione/case folding. Due mutazioni intenzionali (rimozione sort e overflow wrapping) sono rilevate dagli assert degli esempi. Somma e Countdown eseguiti anche con opt-level 3.

Baseline: **Rust 1.99.1**, edition **2024**, Windows GNU, Node **24.14.0**. Nessuna nuova dipendenza; fixture temporanee con timeout e pulizia limitata al percorso verificato. Non e una certificazione MSRV, un benchmark, una verifica di ogni adattatore o una validazione linguistica completa. Nessun input infinito non terminante eseguito, nessun unsafe, I/O esterno o parallelismo Rayon.

Con rustc disponibile nel PATH, oppure `RUSTC_TEST_EXECUTABLE` impostata al compilatore:

```powershell
node --test _Meta/tests/rust-iterator-api.test.mjs
```

Regressione mirata con le basi:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-iterator-api.test.mjs _Meta/tests/rust-iterators-closures.test.mjs
```

Primo giro dedicato **35/35** in **20,3 secondi**; regressione **101/101** in **58,8 secondi**, zero fallimenti/skip. Le altre trentacinque suite Rust e gli altri linguaggi non sono stati rieseguiti in questo blocco.

## Rust: From, Into, TryFrom e TryInto

Suite `rust-conversions.test.mjs`: **39 test**, sei programmi validi e due controesempi estratti dalla nota tramite AST. Verifica frontmatter originale, gerarchia, fonti e generici inline.

Copertura: From/Into e TryFrom/TryInto, direzione inversa non implicita, Infallible, impl sovrapposte e catene esplicite. Input posseduti/prestati, copie da str, inferenza del costruttore generico e turbofish corretto. Conversione generica con TryInto manuale ed errore diverso; cast e rifiuto dei float.

Tutti i valori u16 sono controllati per la conversione a u8; tutte le porte da 1 a 65535 sono confrontate nei percorsi numerico, FromStr e TryInto. Verificati zero, grammatica ASCII, whitespace, overflow, errore tipizzato, source e Display senza duplicazione della causa. Rimuovere From blocca il punto interrogativo; map_err lo sostituisce esplicitamente. Una mutazione che accetta zero viene rilevata.

Vista borrowed con trim Unicode e lifetime, FromStr su un tipo parametrizzato da lifetime non collegato all'input, recupero del Vec nell'errore e array con elementi non Clone. Controesempi corretti realmente compilati. Due programmi anche con opt-level 3; prova negativa in edition 2018 seguita dalla correzione con import espliciti.

Baseline: **Rust 1.99.1**, edition **2024** salvo i due controlli 2018, Windows GNU e Node **24.14.0**. Nessuna dipendenza aggiunta; fixture temporanee con timeout e pulizia limitata ai percorsi verificati. Non e una certificazione MSRV, un benchmark, una verifica di tutte le conversioni numeriche o un collaudo di rete. Nessun socket o blocco unsafe nella nuova suite.

Con rustc disponibile nel PATH oppure `RUSTC_TEST_EXECUTABLE` configurata:

```powershell
node --test _Meta/tests/rust-conversions.test.mjs
```

Regressione mirata:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-conversions.test.mjs _Meta/tests/rust-blanket.test.mjs _Meta/tests/rust-option-result-question.test.mjs
```

Primo giro **38/38** in **17,6 secondi**; prima regressione **170/170** in **99,7 secondi**, zero fallimenti/skip. Aggiunta una prova dell'API pubblica: Port pubblico con PortError privato produce E0446; esporre anche l'errore corregge il programma. Regressione finale **171/171** in **101,1 secondi**, inclusi tutti i **39/39** nuovi casi, zero fallimenti/skip. Le altre trentacinque suite Rust e gli altri linguaggi non sono stati rieseguiti. La regressione include le fixture filesystem temporanee della suite su Option/Result e operatore ?; la nuova suite conversioni non esegue I/O applicativo. Gli esempi nella nota restano invariati dopo la precisazione sulla visibilita.

## Rust: AsRef, AsMut e Borrow

Terza nota di Standard Library: **68/183 note principali Rust**, **3/10 del capitolo**. Suite `_Meta/tests/rust-asref-borrow.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Nessuna crate o dipendenza aggiunta.

Con la toolchain gia nel PATH:

```powershell
node --test _Meta/tests/rust-asref-borrow.test.mjs
```

In alternativa imposta il percorso di un compilatore esistente prima del comando:

```powershell
$env:RUSTC_TEST_EXECUTABLE = 'C:/percorso/toolchain/bin/rustc.exe'
```

La suite estrae **otto programmi** dalla nota: sei eseguibili e due controesempi rifiutati con E0277/E0515. Controlla anche YAML invariato rispetto a HEAD, sezioni, gerarchia, fonti e generici inline.

Copertura:

- AsRef: consumo del proprietario rispetto al prestito, byte UTF-8, viste sullo stesso buffer, str/dyn con ?Sized, lifetime e inferenza del target.
- AsMut: Vec, array, slice parziali e vuote, lunghezza/capacita conservate, riferimento condiviso rifiutato, move e reborrow; nessun requisito AsRef implicito.
- Borrow: lookup HashMap/BTreeMap, Unicode, assenti e sostituzione; coerenza di Eq/Ord/Hash su un insieme finito di chiavi.
- Proiezione Account: AsRef non basta per cercare con str. Sia inferenza predefinita (E0308) sia query esplicita (E0277) verificate.
- Riflessivita distinta da inoltro, implementazioni locali esplicite, BorrowMut con supertrait e differenza fra String e &String nei bound.
- Percorsi: dotfile, ultimo punto, case, estensione vuota; OsString Windows con surrogate isolato, senza conversione Unicode obbligatoria.
- Lettura: CLI reale su fixture UTF-8, percorso con spazi, contenuto binario, file assente e propagazione dell'errore. Nessun file personale letto o modificato.

Primo giro **34/35** in **20,6 secondi**: corretto il diagnostico atteso della query inferita e aggiunta la controprova con query esplicita. I programmi della nota erano gia tutti conformi all'esito previsto.

Regressione collegata:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-asref-borrow.test.mjs _Meta/tests/rust-deref.test.mjs _Meta/tests/rust-collections.test.mjs
```

Regressione finale: **157/157 test** in **93,3 secondi**, inclusi tutti i **35/35** nuovi casi, zero fallimenti/skip. Le altre trentasei suite Rust e gli altri linguaggi non sono stati rieseguiti.

Fixture temporanee con timeout, percorsi verificati prima della pulizia e compilatore selezionabile. La sonda non Unicode e specifica di Windows; non e una matrice di sistemi operativi, MSRV, benchmark, prova di cancellazione sicura o dimostrazione generale delle leggi di Hash. Nessun codice unsafe o traffico di rete negli esempi.

## Rust: Default

Quarta nota di Standard Library: **69/183 note principali Rust**, **4/10 del capitolo**. Suite `_Meta/tests/rust-default.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Nessuna dipendenza aggiunta.

Con il compilatore gia nel PATH:

```powershell
node --test _Meta/tests/rust-default.test.mjs
```

In alternativa seleziona una toolchain esistente prima del comando:

```powershell
$env:RUSTC_TEST_EXECUTABLE = 'C:/percorso/toolchain/bin/rustc.exe'
```

La suite estrae **otto programmi**: sei validi eseguiti e due controesempi rifiutati con diagnostica prevista. Controlla YAML invariato rispetto a HEAD, sezioni, gerarchia, fonti e sintassi inline.

Copertura:

- Derive rispetto a implementazione manuale e new, inferenza, bound generico, literal incompleto e conflitto fra implementazioni.
- Enum: variante unitaria obbligatoria, default duplicati, campi non ammessi, non_exhaustive sulla variante rispetto all'enum e correzione manuale con payload.
- Queue generica con elementi senza Default/Clone; Vec vuoto e Option None rispetto al bound piu restrittivo del derive.
- Struct update: move parziale o soli campi Copy, privacy fra moduli, costo della base anche per campi sostituiti; contatori di costruzione e Drop.
- Configurazione dimostrativa: valori iniziali, personalizzazione, assenza di validazione implicita e mutazione del default rilevata dagli assert.
- Option/Entry: fallback lazy rispetto a eager, valore gia presente conservato, Unicode e trasferimento del buffer; chiamate a Default contate realmente.
- Result: fallback che elimina Err e assenza di implementazione Default del contenitore.
- mem::take: ownership e allocazione trasferite, default nella destinazione, differenza da clear, Drop degli elementi e nessun requisito Clone.
- mem::replace e Option::take con contenuto senza Default; Default non dyn compatible e panic dimostrativo.

Primo giro **37/39** in **18,4 secondi**: corretti due controlli della suite, sul token inline completo e sul testo del diagnostico non_exhaustive. Gli otto programmi della nota avevano gia tutti l'esito previsto.

Regressione collegata:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-default.test.mjs _Meta/tests/rust-derive-associated.test.mjs _Meta/tests/rust-structs-enums.test.mjs
```

Regressione finale: **168/168 test** in **89,6 secondi**, inclusi **39/39** nuovi casi, zero fallimenti/skip. Le altre trentasette suite Rust e gli altri linguaggi non sono stati rieseguiti.

Fixture temporanee con timeout e verifica dei percorsi prima della pulizia. Nessun socket aperto, worker applicativo avviato, I/O applicativo o codice unsafe negli esempi. Non MSRV, benchmark, misura generale delle allocazioni, validazione di configurazioni reali o matrice di piattaforme. La regressione sulle struct include la prova di visibilita non_exhaustive fra due crate.

## Rust: Display e Debug

Quinta nota di Standard Library: **70/183 note principali Rust**, **5/10 del capitolo**. Suite `_Meta/tests/rust-display-debug.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Nessuna dipendenza aggiunta.

Con rustc nel PATH:

```powershell
node --test _Meta/tests/rust-display-debug.test.mjs
```

In alternativa seleziona una toolchain esistente prima del comando:

```powershell
$env:RUSTC_TEST_EXECUTABLE = 'C:/percorso/toolchain/bin/rustc.exe'
```

La suite estrae **otto programmi**: sei validi eseguiti e due controesempi rifiutati con diagnostica prevista. Controlla YAML originale, struttura, fonti e sintassi inline. **40/40 test al primo giro**, **22,1 secondi**, zero fallimenti/skip.

Copertura:

- Display rispetto a Debug, ToString automatico, helper borrowed con str/dyn e helper per valore che consuma.
- Wrapper Port: confronto con u16 su tutti i 65.536 valori, zero-padding, segno, fill, allineamento e larghezza minima; mutazione che perde i flag rilevata.
- Trait LowerHex mancante e implementazione corretta, collection senza Display e formato runtime non ammesso.
- Debug derivato con campi privati; formatter che oscura un token fittizio, forme compatta/estesa e contenitore annidato. Mutazione che espone il campo rilevata.
- String e Vec<u8>, UTF-8, import dei trait Write, append e newline.
- Destinazione fmt limitata a ogni confine dei messaggi di prova: errori propagati, prefissi parziali validi UTF-8 e assenza di rollback.
- Errori propagati da Display e debug_struct; destinazione io fallibile in memoria che conserva ErrorKind e messaggio.
- fmt Error inventato da Display: panic atteso di to_string, non un errore applicativo da restituire.
- Error con supertrait Debug/Display e causa ParseIntError tipizzata; confini u32, zero, segno e whitespace.
- Adapter borrowed con estremi i32 e durata del proprietario; conflitto fra due impl Display e requisito Debug di assert_eq.
- dbg: stderr, trasferimento/riuso e presenza anche con opt-level 3. Lifetime degli argomenti format_args.

Regressione collegata:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-display-debug.test.mjs _Meta/tests/rust-derive-associated.test.mjs _Meta/tests/rust-option-result-question.test.mjs
```

Regressione finale: **185/185 test** in **112,0 secondi**, inclusi **40/40** nuovi casi, zero fallimenti/skip. Le altre trentotto suite Rust e gli altri linguaggi non sono stati rieseguiti. La regressione include anche le fixture filesystem isolate della suite su Option/Result e operatore ?.

Il controllo visivo ha rilevato tre segnaposto isolati interpretati come annotazioni di linguaggio dal renderer del sito. La nota usa ora invocazioni complete di format per mostrarli senza ambiguita. Suite dedicata rieseguita dopo la correzione e l'estensione del controllo inline: **40/40** in **20,7 secondi**, zero fallimenti/skip; programmi Rust invariati.

Fixture con timeout e pulizia dopo verifica dei percorsi. Nessuna nuova installazione, socket, dato segreto reale o I/O applicativo nei nuovi esempi; scritture fallibili provate su destinazioni in memoria. Non audit completo di logging/riservatezza, benchmark, MSRV o matrice di piattaforme. Non eseguita ricorsione infinita del formatter; la verifica opt-level 3 riguarda dbg, non tutti i programmi.

## Rust: Path e PathBuf

Sesta nota di Standard Library: **71/183 note principali Rust**, **6/10 del capitolo**. Suite `_Meta/tests/rust-path.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Nessuna dipendenza aggiunta.

Con rustc nel PATH, oppure con `RUSTC_TEST_EXECUTABLE` impostato come nei blocchi precedenti:

```powershell
node --test _Meta/tests/rust-path.test.mjs
```

**36/36 test** nella prima esecuzione completa, **21,5 secondi**, zero fallimenti/skip. Prima dell'esecuzione erano state corrette due parentesi di chiusura del file JavaScript. La suite estrae sei programmi validi e due controesempi: compilati/eseguiti i primi, verificati E0515 ed E0502 e le rispettive correzioni per i secondi.

Copertura:

- YAML originale, template, gerarchia, fonti e tipi generici inline.
- Path borrowed, copia posseduta e durata; AsRef per valore che consuma il PathBuf.
- Join/push, radici, drive-relative, UNC e verbatim su Windows senza accessi di rete; pop lessicale.
- Backup per sostituzione rispetto ad aggiunta del suffisso: estensioni multiple, dotfile, Unicode, nome assente, root e collisione col nome originale.
- Componenti, prefissi interi, dot iniziale e parent non risolto; mutazione che usa starts_with della stringa rilevata.
- Percorsi non Unicode, backup senza perdita, nomi Windows distinti con lo stesso output lossy, panic atteso di to_str().unwrap().
- PathBuf senza Display, adapter display senza espansione o escaping shell; tilde e variabili restano testo.
- CLI senza argomenti e su file temporanei: nome con spazi, contenuto Unicode, vuoto, file assente, directory e byte non UTF-8. Input conservato.
- absolute su destinazione assente e input vuoto; canonicalize/try_exists su percorso assente o contenente NUL, exists che nasconde l'errore.
- Directory corrente cambiata solo nel processo figlio: il PathBuf relativo non cattura la base.
- Junction Windows fra due directory nella stessa fixture: prefisso lessicale rispettato ma destinazione canonica fuori dalla base logica. Nessun collegamento verso file personali.

Regressione collegata:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-path.test.mjs _Meta/tests/rust-asref-borrow.test.mjs _Meta/tests/rust-display-debug.test.mjs
```

**111/111 test** in **71,5 secondi**, inclusi **36/36** nuovi casi, zero fallimenti/skip. Le altre trentanove suite Rust e gli altri linguaggi non sono stati rieseguiti.

Processi con timeout e fixture temporanee; prima della pulizia si verificano percorso risolto, parent e prefisso. I nomi non Unicode sono costruiti solo in memoria. Le sonde specifiche Windows lo richiedono esplicitamente: non simulano Unix forzando cfg. I rami Unix della nota sono controllati documentalmente, non compilati/eseguiti su Unix. Non sono provati tutti i filesystem, ACL, race TOCTOU o strategie di confinamento; nessuna garanzia di sicurezza deriva dal solo test del collegamento. Nessun benchmark, MSRV, rete o unsafe.

## Rust: OsStr e OsString

Settima nota di Standard Library: **72/183 note principali Rust**, **7/10 del capitolo**. Suite `_Meta/tests/rust-os-string.test.mjs`, baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Nessuna dipendenza aggiunta.

Con rustc nel PATH, oppure con `RUSTC_TEST_EXECUTABLE` impostato come nei blocchi precedenti:

```powershell
node --test _Meta/tests/rust-os-string.test.mjs
```

**39/39 test al primo giro**, **29,4 secondi**, zero fallimenti/skip. Estratti sei programmi validi e due controesempi; verificati E0515/E0382 e compilate le correzioni. Nessun esempio modificato per far passare i test.

Copertura:

- YAML originale, template, gerarchia, fonti e tipi generici inline.
- Vista senza copia, copia indipendente, move di String/OsString e prestito attivo durante push.
- Conversioni di stringhe vuote, NUL e Unicode, Cow borrowed/owned e recupero dell'OsString nel ramo Err.
- Tutte le 65.536 code unit u16 Windows: roundtrip from_wide/encode_wide e conversione Unicode; coppia surrogate valida verificata separatamente.
- Distinti nomi non Unicode con la stessa resa lossy; panic atteso di unwrap, assenza di Display diretto, adapter senza escaping HTML/shell.
- Estensione con nome non Unicode, confronto ASCII rispetto a Unicode, assenza di normalizzazione implicita.
- Scelta input con priorita argomento/ambiente/default, rifiuto del valore vuoto e conservazione dei dati OS; mutazione che tratta vuoto come assenza rilevata.
- CLI reale con spazi, Unicode, valore vuoto e fallback; processi figli dello stesso eseguibile di prova con argomento/ambiente non Unicode, VarError::NotUnicode e panic di args.
- Le sole variabili di prova sono escluse dall'ambiente ereditato del test; i valori aggiunti ai figli non cambiano l'ambiente del padre. Nessuna chiamata a set_var/remove_var viene eseguita.
- Liste PATH con spazi, Unicode e nomi non Unicode; quoting del punto e virgola ed errore sulle virgolette verificati su Windows.
- Buffer wide con terminatore, rifiuto di NUL interni, CString non UTF-8 e mutazione che omette il terminatore rilevata.
- set_var/remove_var rifiutati dal compilatore in edition 2024 senza unsafe, con E0133.

Regressione collegata:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-os-string.test.mjs _Meta/tests/rust-path.test.mjs _Meta/tests/rust-display-debug.test.mjs
```

**115/115 test** in **93,4 secondi**, inclusi **39/39** nuovi casi, zero fallimenti/skip. Le altre quaranta suite Rust e gli altri linguaggi non sono stati rieseguiti. La suite Path comprende letture e junction nella propria fixture isolata.

Compilazioni/esecuzioni con timeout e directory temporanee; pulizia dopo verifica di percorso risolto, parent e prefisso. La nuova suite non apre file personali, non usa rete o shell e non invoca FFI/unsafe. I processi aggiuntivi eseguono soltanto il binario temporaneo del test.

Limiti: un target Windows, rami Unix verificati documentalmente ma non compilati/eseguiti; non una prova di tutte le sequenze UTF-16, ABI native, serializzazione, matrice di versioni, benchmark o audit generale dei log. La prova di capacita non misura tutte le allocazioni; le due sonde su set_var/remove_var sono solo controlli del compilatore, non esecuzioni.

## Rust: File I/O

Ottava nota di Standard Library. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Riusa la toolchain temporanea tramite `RUSTC_TEST_EXECUTABLE`; nessuna nuova dipendenza.

```powershell
node --test _Meta/tests/rust-file-io.test.mjs
```

**31/31 test** alla prima esecuzione, zero fallimenti/skip, circa **21,3 secondi**. Estratti e compilati tutti i **sei programmi** della nota, poi eseguiti su fixture temporanee. Nessuna correzione agli esempi necessaria. YAML confrontato con HEAD, template, gerarchia, fonti e tipi Markdown verificati.

Configurazione facoltativa: assenza, vuoto, Unicode, UTF-8 invalido e directory. Report: LF, flush prima di sync_all, esclusione di file esistenti e parent mancanti. Righe: CRLF, LF, CR isolato, spazi, ultima riga senza terminatore, riga lunga e propagazione degli errori.

Copie: sostituzione esplicita del testo, conservazione dei terminatori, lettura fallita senza modificare il bersaglio; byte arbitrari e NUL su file da 1 MiB, origine invariata, file vuoto e mancante. La copia con create_new rifiuta destinazione esistente, stesso percorso e hard link allo stesso file senza troncarli. Directory: ordine, Unicode, vuoto, errori iniziali e assenza di ricorsione.

Sonde separate verificano troncatura all'apertura, create senza truncate, errore di scrittura su File aperto in lettura, append dopo rewind, letture parziali, read_exact e EOF, posizione condivisa da try_clone. Writer simulati controllano Interrupted, scritture brevi, WriteZero e prefisso conservato dopo errore; reader simulato lascia un file parziale durante io::copy.

Verificati il buffer Rust ancora pieno dopo sync_all senza flush, errore da flush e Drop senza propagazione, perdita dei byte anticipati con BufReader::into_inner e rewind sul reader. Una variante senza import Write e rifiutata con E0599; una mutazione da create_new a create e rilevata da un'asserzione, non adottata nella nota.

Regressione File I/O, Path/PathBuf e OsStr/OsString: **106/106**, zero fallimenti/skip, circa **74,8 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-file-io.test.mjs _Meta/tests/rust-path.test.mjs _Meta/tests/rust-os-string.test.mjs
```

Sono **44 suite Rust** in totale; le altre quarantuno e gli altri linguaggi non sono stati rieseguiti. Processi con timeout, directory temporanee con percorso risolto/parent/prefisso verificati prima della pulizia; nessun file personale o di rete coinvolto. Gli hard link della nuova suite restano nella stessa fixture.

Limiti: Windows GNU e un filesystem locale; nessuna esecuzione Unix, matrice ACL/filesystem, prova di crash/durabilita, fault reale di disco pieno o errore indotto durante un read_dir gia iniziato. sync_all eseguito non dimostra la resistenza a interruzioni di alimentazione. I guasti simulati dei trait non certificano ogni comportamento del kernel. Verifiche Quartz e approvazione dell'utente restano separate.

## Rust: Process e Command

Nona nota di Standard Library. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0** e Git **2.55.0.windows.5**. Riusa la toolchain tramite `RUSTC_TEST_EXECUTABLE`; il suo percorso viene passato come `RUSTC` soltanto ai processi di prova.

```powershell
node --test _Meta/tests/rust-process.test.mjs
```

Prima esecuzione **29/30** in **27,4 secondi**: una sonda assumeva NotFound per current_dir assente, mentre Windows restituisce NotADirectory. Corretto il test per controllare che l'errore originale sia ancora un io::Error tramite downcast, senza vincolare la classificazione OS. Gli esempi della nota non sono stati modificati per far passare il controllo.

Suite finale **30/30** nella regressione. Sei programmi estratti dal Markdown, compilati ed eseguiti: git --version, rustc --version, argomenti/ambiente, lettura del commit Git, pipe stdin/stdout/stderr e terminazione con raccolta del solo figlio controllato. YAML confrontato con HEAD, template, gerarchia, fonti e tipi generici verificati.

Git reale in repository temporanei SHA-1/SHA-256, con commit vuoti locali: hash verificato, percorso con spazi e Unicode, override GIT_DIR/GIT_WORK_TREE, repository senza commit, directory non repository e assente. Configurazione globale/sistema esclusa, template e hook vuoti, firma disabilitata solo nei comandi di fixture; nessuna configurazione Git personale modificata, nessun remoto o commit nel vault.

Output simulati tramite il proprio eseguibile controllano exit status, stderr, UTF-8 invalido, identificatore inatteso e rimozione dei soli CRLF finali. Altre sonde verificano byte arbitrari e NUL, argomenti vuoti/quotati/backslash/Unicode, builder riusato, current_dir e ambiente modificati soltanto nel figlio.

Verificati EOF con output, chiusura stdin in wait ma non in try_wait, handle estratto con take e chiusura esplicita, esiti ripetibili di wait/try_wait, cattura di 1 MiB per ciascuna pipe, redirezione su file nuovo e stdout estratto non catturato da wait_with_output. Variante con riuso di Child consumato rifiutata con E0382; virgolette aggiunte all'argomento fanno fallire il demo come previsto.

Regressione Process e Command, File I/O e OsStr/OsString: **100/100**, zero fallimenti/skip, circa **87,5 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-process.test.mjs _Meta/tests/rust-file-io.test.mjs _Meta/tests/rust-os-string.test.mjs
```

Totale **45 suite Rust**; le altre quarantadue e gli altri linguaggi non rieseguiti. Processi con timeout, directory temporanee con percorso risolto/parent/prefisso verificati prima della pulizia. I programmi figli del demo sono locali e controllati; nessuna shell, rete o selezione di processi personali tramite PID.

Limiti: un target Windows, nessuna esecuzione Unix o verifica reale di segnali/zombie, Job Objects, alberi di processi, race di terminazione o timeout rigorosi. La prova da 1 MiB non certifica flussi illimitati; non vengono provocati deadlock intenzionali. Output di errore simulati non equivalgono a una matrice di tutti i comandi esterni. Build Quartz e approvazione dell'utente restano verifiche separate.

## Rust: Time, Duration e Instant

Decima e ultima nota di Standard Library. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Riusa la toolchain tramite `RUSTC_TEST_EXECUTABLE`; nessuna nuova dipendenza.

```powershell
node --test _Meta/tests/rust-time.test.mjs
```

Prima esecuzione **28/28** in **19,3 secondi**, zero fallimenti/skip. Sei programmi estratti direttamente dalla nota e compilati/eseguiti: conversioni, aritmetica, misura sincrona, scadenze, timestamp e sleep. YAML confrontato con HEAD, template, gerarchia, fonti e generici verificati.

Sonde aggiuntive controllano normalizzazione e round trip ai limiti di Duration, totale rispetto a frazione, perdita delle unita inferiori, TryFrom rispetto al cast e assenza di Display. Overflow, underflow, divisione nulla e zero valido restano distinti; il panic dell'addizione e verificato anche con opt-level 3 e overflow-checks=no.

Float negativi, non finiti, troppo grandi, -0.0 e positivi arrotondati a zero. Raddoppio saturante con cap nullo, ordinario o inferiore all'input; non un algoritmo di retry completo. measure invoca una volta, consente un prestito nel risultato, consuma una cattura, conserva Err e lascia propagare il panic.

Istanti costruiti per i casi prima/uguale/dopo, checked rispetto a saturating, sottrazione e elapsed attuali. SystemTime ai due lati dell'epoch, componenti del timestamp ed errore con distanza positiva. Operazioni checked con durate estreme controllate senza imporre un range numerico identico a tutte le piattaforme.

Lo sleep reale dura nominalmente 10 ms: si verifica l'output, senza imporre uguaglianza o soglia massima al tempo misurato. Le prove non modificano l'orologio di sistema e non attendono scadenze lunghe. Gli esempi pubblicati non contengono i panic o gli errori di compilazione indotti dalle sonde.

Processi con timeout e fixture rimosse soltanto dopo verifica del percorso risolto, parent e prefisso. Una sola piattaforma/toolchain: non un benchmark, misura di precisione, prova di sospensione del sistema, cambio dell'orologio, comportamento real-time, runtime async o librerie calendario. Controlli Quartz e approvazione dell'utente restano separati.

Regressione Time/Process/File I/O: **89/89**, zero fallimenti/skip, in **74,9 secondi**, inclusi i 28 casi nuovi.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-time.test.mjs _Meta/tests/rust-process.test.mjs _Meta/tests/rust-file-io.test.mjs
```

Totale **46 suite Rust**; le altre quarantatre e gli altri linguaggi non rieseguiti.

## Rust: Cargo

Prima nota di Cargo, Editions e Compatibilita. Baseline **Rust/Cargo 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Aggiunti **rustfmt 1.10.0-stable** e **Clippy 0.1.99** alla toolchain temporanea gia esistente tramite rustup; nessuna modifica al PATH globale o alle dipendenze del sito.

```powershell
node --test _Meta/tests/rust-cargo.test.mjs
```

Imposta `RUSTC_TEST_EXECUTABLE` come nei blocchi precedenti. La suite cerca Cargo, rustdoc, rustfmt e clippy-driver nella stessa directory; `CARGO_TEST_EXECUTABLE`, `RUSTDOC_TEST_EXECUTABLE` e `RUSTFMT_TEST_EXECUTABLE` consentono percorsi espliciti.

**28 casi** su un progetto estratto dalla nota: manifest, libreria, binario e integration test. Inventario di **31 blocchi di comandi**, uno per blocco, e quattro file completi; non sono 31 comandi tutti eseguiti automaticamente. Il passaggio cd e realizzato dalla directory di lavoro del processo; l'installazione rustup e stata eseguita separatamente sulla toolchain di prova. I due cargo add verso registry sono verificati documentalmente, non eseguiti.

Il flusso reale comprende creazione di binario/libreria senza VCS, check ordinario e all-targets, build dev/release, run con argomenti, fmt/check, Clippy e warning bloccanti. Il progetto supera un unit test, un integration test e un doctest; questi tre risultati interni non si sommano ai 28 gruppi Node.

Sonde negative: codice cfg(test) ignorato da check ordinario, asserzioni false che superano compilazione e no-run, doctest errato che non blocca cargo doc, test esclusi dalla selezione. Verificati nomi crate/binario, argomenti vuoti/con spazi/Unicode/simili a opzioni, manifest-path rispetto al cwd del programma e file HTML rustdoc.

Prima esecuzione **27/28** in **66,0 secondi**: il test passava --config prima del sottocomando esterno clippy, che non riceveva l'opzione. Spostata l'opzione dopo clippy; la stessa aspettativa di fallimento ora passa, anche con warning gia in cache. Aggiunta controprova tramite .cargo/config.toml: **1/1** nella riesecuzione mirata. Nessun esempio Rust modificato per aggirare il problema.

Lockfile assente o da aggiornare con locked/frozen, generazione offline, conservazione tramite fetch --locked e dipendenza locale con cargo add --path. Dipendenza registry mancante fallisce offline. Workspace con default-members: test normale riuscito, --workspace fallito per il secondo membro intenzionalmente errato.

Un build script locale controllato scrive solo in OUT_DIR e dimostra che check esegue codice anche offline. cargo clean e eseguito soltanto dopo verifica del target_directory risolto, del parent e della sua appartenenza alla fixture: elimina gli output e conserva i sorgenti.

CARGO_HOME temporaneo, rete Cargo disabilitata, variabili di compilazione ereditate ripulite e controllo dell'assenza di configurazioni Cargo nei parent delle fixture. Processi con timeout; pulizia della radice solo dopo verifica del percorso risolto, parent e prefisso.

Limiti: una toolchain e un target Windows, nessuna pubblicazione, installazione di binari applicativi, benchmark, registry reale, prova di rete da build script o matrice MSRV/cross-compilazione. La preparazione di rustfmt/Clippy richiede rete rustup ed e separata dalle prove Cargo offline. Nessun browser personale aperto da cargo doc; approvazione dell'utente e controlli Quartz restano separati.

Regressione seriale Cargo, Pattern/Moduli/Workspace e Funzioni/Documentazione/Flusso: **125/125** in **175,4 secondi**, zero fallimenti/skip; inclusi i **28/28** casi Cargo finali.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-cargo.test.mjs _Meta/tests/rust-pattern-moduli-workspace.test.mjs _Meta/tests/rust-funzioni-documentazione-flusso.test.mjs
```

Totale **47 suite Rust**; le altre quarantaquattro e gli altri linguaggi non rieseguiti.

## Rust: Cargo.toml

Revisione del manifest: **Rust/Cargo 1.99.1**, edition **2024**, Windows GNU e Node **24.14.0**. Riusa la toolchain temporanea e le variabili del blocco Cargo; nessuna installazione aggiuntiva.

```powershell
node --test _Meta/tests/rust-manifest.test.mjs
```

**28/28 casi** nella verifica finale. Estrae **12 blocchi**: sette comandi, quattro file del progetto eseguibile e un manifest alternativo con dipendenze registry. I quattro file vengono compilati ed eseguiti senza modificarne il codice; il manifest registry e controllato soltanto tramite metadata, senza risolvere/scaricare o compilare le librerie esterne.

Verifica nomi di package/libreria/binario, output normale e con feature, un integration test nelle due configurazioni, autodiscovery/autobins, default-run, metadata JSON, default di version/edition e rust-version incompatibile. Controprove su TOML errato, chiavi ignorate, import/path sbagliati, feature senza implementazione, all-targets rispetto ad all-features e assert false compatibili con check riuscito.

Sonde aggiuntive con una piccola crate locale sintetica: dipendenze normal/dev/build, dev-dependency non compilata dal consumer, path relativo e rinomina, requisiti caret/exact, dipendenze condizionate alla piattaforma reale e adesione a workspace.dependencies. Non imitano API delle librerie citate. Provato il limite del lint unsafe_code: vale per il package, non e una policy globale su tutte le dipendenze. Dichiarazioni unsafe soltanto compilate, mai invocate.

Prima esecuzione **27/28**: il controllo sul testo della diagnostica MSRV attendeva parole diverse. Corretto il matcher sulla diagnostica effettiva mantenendo errore e versione attesi; nessuna modifica degli esempi per far passare i test.

Regressione Cargo.toml, Cargo e Pattern/Moduli/Workspace: **104/104**, zero fallimenti/skip, **179,6 secondi**. Totale **48 suite Rust**; le altre quarantacinque e gli altri linguaggi non rieseguiti.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-manifest.test.mjs _Meta/tests/rust-cargo.test.mjs _Meta/tests/rust-pattern-moduli-workspace.test.mjs
```

Fixture in una radice temporanea verificata prima del cleanup, CARGO_HOME isolato, rete Cargo disabilitata, variabili ereditate ripulite e configurazioni dei parent controllate. Limiti: una toolchain/piattaforma, nessuna matrice MSRV, cross-compilazione, pubblicazione, build di cc/C o verifica reale delle API registry. I risultati interni dei test Rust non si sommano ai 28 gruppi Node.

## Rust: Cargo.lock

Revisione del lockfile: **Rust/Cargo 1.99.1**, edition **2024**, Windows GNU e Node **24.14.0**. Stessa toolchain temporanea del blocco Cargo. Serve anche `tar` nel PATH per gli archivi sintetici: verificato con **bsdtar 3.8.9** gia presente in Windows. Nessuna installazione aggiuntiva.

```powershell
node --test _Meta/tests/rust-lockfile.test.mjs
```

La suite estrae **22 blocchi**: 16 comandi, cinque file del progetto locale e il lockfile mostrato come output. Confronta l'intero lockfile generato con quello della nota; esegue programma e integration test, poi verifica gli errori previsti con lockfile assente, incoerente, corrotto o di formato non supportato.

Altre prove: offline puo generare e aggiornare, frozen combina i vincoli, fetch non compila, update non esegue test, tree e albero inverso, codice path modificato senza modificare il lock, feature diverse con stesso lockfile, build script eseguito anche frozen e lockfile unico del workspace. Il test Rust interno non si somma ai gruppi Node.

Per verificare gli aggiornamenti senza rete usa un catalogo sintetico in directory source. Non sono copie di Serde/Tokio o un modello per configurare un registry privato. Il resolver Cargo reale controlla conservazione delle versioni, dry-run, update generale/mirato/ricorsivo, transitive obbligate, rigenerazione e risoluzione indipendente del consumer.

`--precise` viene provato con un **local registry** dotato di indice JSON, archivi `.crate` reali e checksum SHA-256: la sola directory source non riproduceva quella selezione. I pacchetti sono creati nella fixture, non scaricati. Verificati versione specifica, downgrade compatibile e rifiuto di versione incompatibile. Prova separata sull'integrita dei file vendorizzati modificati senza aggiornare i checksum.

Prima esecuzione **28/30** in **66,5 secondi**: limiti della fixture su precise e controllo troppo restrittivo sull'assenza della directory cache registry. Corretta la sorgente di prova e ammessi i metadati/cache locali; controllo mirato **2/2** in **4,0 secondi**. Nessun esempio della nota modificato per far passare i test.

Regressione Cargo, Cargo.toml e Cargo.lock: **86/86**, inclusi **30/30** nuovi casi, zero fallimenti/skip, **187,4 secondi**. Suite dedicata ripetuta dopo le precisazioni editoriali finali: **30/30** in **75,0 secondi**. Totale **49 suite Rust**; le altre quarantasei e gli altri linguaggi non rieseguiti.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-lockfile.test.mjs _Meta/tests/rust-manifest.test.mjs _Meta/tests/rust-cargo.test.mjs
```

Limiti: una toolchain/piattaforma, nessuna matrice MSRV, cross-compilazione, benchmark, publishing, registry remoto o prova di rete da un build script. Le istruzioni con Serde/Tokio e git diff sono verificate come procedure e sintassi, non eseguite su repository dell'utente. Le opzioni update e tree sono esercitate sui package sintetici; non sono collaudate API di quelle librerie o yank su un registry remoto.

CARGO_HOME e output nella radice temporanea, rete Cargo disabilitata, variabili/configurazioni esterne controllate, timeout e cleanup dopo verifica di percorso risolto, parent e prefisso. Cargo puo creare metadati di cache anche offline; eventuali archivi nella cache devono appartenere soltanto ai package sintetici. Nessun checkout Git, commit o modifica alle configurazioni personali.

## Rust: Crates.io

Revisione di packaging e pubblicazione: **Rust/Cargo 1.99.1**, edition **2024**, Windows GNU, Node **24.14.0** e **bsdtar 3.8.9**. Riusa la toolchain temporanea, inclusi rustfmt e Clippy, senza installare dipendenze.

```powershell
node --test _Meta/tests/rust-crates-io.test.mjs
```

La suite estrae **20 blocchi**: quindici comandi, quattro file del progetto e un frammento exclude. I comandi remoti vengono riconosciuti ma non eseguiti. Il progetto originale supera fmt, Clippy, due integration test e un doctest; vengono verificati anche gli HTML generati da rustdoc.

**26/26 casi dedicati superati** nella regressione Cargo, Cargo.toml e Crates.io: **82/82**, zero fallimenti/skip, **170,3 secondi**. Totale **50 suite Rust**; le altre quarantasette e gli altri linguaggi non rieseguiti.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-cargo.test.mjs _Meta/tests/rust-manifest.test.mjs _Meta/tests/rust-crates-io.test.mjs
```

Package list e archivio reale confrontati con i file previsti, manifest originale preservato, manifest normalizzato letto tramite Cargo metadata, test rieseguiti sulla copia estratta. Controllati include/exclude, falsi file privati esclusi, file necessario mancante e relativa correzione.

Controprove: codice invalido con no-verify, integration test e doctest falliti non rilevati dal packaging, feature difettosa, dipendenza path senza versione e dev-dependency senza versione rimossa dal manifest distribuito. Un build script sintetico genera un file solo in OUT_DIR; la sua compilazione dimostra che package puo eseguire codice di build. Input aggiuntivi verificano CRLF e whitespace Unicode nella funzione dimostrativa.

Publish viene invocato **soltanto con --dry-run**: verificati il blocco publish=false, il registry non autorizzato e il fallimento offline con metadati registry mancanti anche senza dipendenze. Non e stato completato un dry-run positivo contro crates.io. Login, yank, owner, ricerca, download e upload sono vietati dall'helper della suite.

Prima esecuzione **19/26** in **33,8 secondi**: cinque attese usavano separatori Unix anziche Windows, una presumeva disponibile la configurazione registry offline, una cercava l'output di build nella directory sbagliata. Corrette le attese sulla base del comportamento osservato, senza cambiare gli esempi per aggirare errori.

CARGO_HOME e output isolati, variabili/configurazioni esterne controllate, rete Cargo disabilitata, nessuna credenziale o crate pubblica scaricata. Cleanup limitato alla directory temporanea dopo verifica del percorso risolto, parent e prefisso. I tre test Rust interni non si sommano ai 26 gruppi Node.

Limiti: una piattaforma/toolchain; nessuna matrice MSRV, cross-compilazione, verifica account/nomi disponibili, accettazione del server, yank/cancellazione, OIDC, build remota docs.rs o commit Git della fixture. Policy e procedure remote sono verificate sulle fonti ufficiali, non tramite operazioni reali. Lo status della nota resta non revisionato in attesa dell'utente.

## Rust: Semantic Versioning

Revisione di SemVer, requirement Cargo e compatibilita del consumer: **Rust/Cargo 1.99.1**, edition **2024**, Windows GNU, Node **24.14.0** e rustfmt. Toolchain gia disponibile; nessuna installazione o dipendenza aggiunta.

```powershell
node --test _Meta/tests/rust-semver.test.mjs
```

**35/35 casi dedicati**, zero fallimenti/skip, **90,1 secondi**. Estratti **17 blocchi**: sette comandi, cinque file del workspace, tre sorgenti alternativi, un manifest illustrativo e una sequenza testuale di versioni. Estratte anche le tredici righe della tabella tramite i nodi inline del parser del vault.

Regressione Cargo.toml, Cargo.lock e Semantic Versioning: **93/93**, inclusi **35/35** nuovi casi, zero fallimenti/skip, **238,9 secondi**. Totale **51 suite Rust**; le altre quarantotto e gli altri linguaggi non rieseguiti.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-manifest.test.mjs _Meta/tests/rust-lockfile.test.mjs _Meta/tests/rust-semver.test.mjs
```

Il primo avvio si e fermato prima dei test perche il parser rappresenta le tabelle come paragrafi, non come nodi table. Corretto soltanto l'estrattore, senza introdurre un nuovo parser o cambiare le regole SemVer per far passare le prove.

Eseguiti fmt, check, programma e integration test della versione 1.2.3; consumer e test originali passano anche con la 1.3.0. Verificate la nuova funzione strict, la migrazione completa alla 2.0.0 e la necessita di aggiornare anche i test. E0061 per firma cambiata e E0425 per API non ancora disponibile nella versione minima dichiarata.

Controprova comportamentale: rimuovere trim mantiene la firma e fa passare check, ma run e test falliscono. Un numero minor scelto erroneamente non impedisce al resolver di accettare una modifica incompatibile.

Le tredici righe della tabella sono confrontate con Cargo reale, usando versioni locali ai limiti inclusi/esclusi e verificando anche gli intervalli equivalenti. Nessun parser SemVer implementato a mano. Provati caret implicito/esplicito, tilde, wildcard, exact, AND, intervalli impossibili e OR non valido, 0.x/0.0.x, prerelease con opt-in della stessa base e build metadata ignorati nei requisiti.

Catalogo sintetico in directory source con manifest, sorgenti e checksum: ordinamento numerico delle prerelease, passaggio alla release stabile, lockfile conservato, update dry-run non mutante e update reale della minor. Una dipendenza diretta exact conserva la propria versione ma non blocca gli aggiornamenti della transitiva. Il catalogo non e una copia di crate pubbliche o una ricetta per registry privati.

Il manifest con Serde/Tokio e segnaposto e controllato solo tramite metadata --no-deps. I comandi remoti con Serde non sono eseguiti; update viene provato sui package sintetici con Cargo offline. Il progetto usa il parser numerico della standard library e ulteriori input controllano u32::MAX, overflow, whitespace Unicode e testo non numerico.

CARGO_HOME e output isolati, configurazioni/variabili esterne controllate, timeout per processo e cleanup dopo verifica del percorso risolto, parent e prefisso. Nessuna credenziale, pubblicazione o crate scaricata. I test Rust interni non si sommano ai gruppi Node.

Limiti: una toolchain/piattaforma, nessuna matrice MSRV, cross-compilazione, accettazione del registry, prova di tutti i casi di evoluzione API o certificazione automatica della compatibilita. La matrice dei requisiti verifica i casi scelti, non ogni versione possibile. Lo status della nota resta non revisionato in attesa dell'utente.

## Rust: MSRV, toolchain e resolver

`rust-msrv.test.mjs` estrae la nota **MSRV: Minimum Supported Rust Version** e ricostruisce il progetto di tre file. Richiede **Rust/Cargo/rustdoc 1.85.0 e 1.99.1**, target **x86_64-pc-windows-gnu**, rustfmt sulla toolchain 1.99.1, rustup con proxy e Node **24.14.0**.

Le due toolchain devono essere gia installate nel deposito rustup indicato. Configura i percorsi assoluti di `RUSTC_TEST_EXECUTABLE` (1.99.1), `RUSTC_MSRV_TEST_EXECUTABLE` (1.85.0), `RUSTUP_TEST_EXECUTABLE` (rustup.exe) e `RUSTUP_TEST_HOME` (deposito delle toolchain). I due compilatori e i proxy devono puntare alle stesse installazioni; il default host di rustup deve essere Windows GNU per le selezioni abbreviate usate nella nota.

```powershell
node --test _Meta/tests/rust-msrv.test.mjs
```

Regressione mirata con le suite di manifest e lockfile:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-manifest.test.mjs _Meta/tests/rust-lockfile.test.mjs _Meta/tests/rust-msrv.test.mjs
```

Copertura: **27 gruppi**, **18 blocchi estratti**, dei quali dodici comandi, tre file del progetto, due configurazioni opzionali e un frammento README.

Prima esecuzione **26/27** in **65,3 secondi**: unica differenza nella formattazione richiesta da rustfmt, corretta nella nota. Regressione finale **85/85** in **198,0 secondi**, inclusi **27/27** MSRV, zero fallimenti/skip. Totale **52 suite Rust**; le altre quarantanove e gli altri linguaggi non rieseguiti.

- Toolchain reali e comandi `+versione` tramite proxy rustup; selezione del file rust-toolchain distinta dal minimo dichiarato.
- YAML invariato, template tecnico, comandi separati e manifest con MSRV/edition/feature/publish.
- Configurazioni predefinita, senza default e all-features sul minimo; confronto con la toolchain recente e lockfile preservato.
- Due integration test e un doctest con labels, un integration test e un doctest senza default; check e fmt controllati separatamente.
- API is_multiple_of accettata dalla toolchain recente e rifiutata da 1.85.0. Ignorare rust-version non risolve il problema.
- Incompatibilita nascoste in feature, test o doctest; asserzioni fallite non rilevate da check.
- Minimi invalidi, futuri o incompatibili con edition 2024; manifest edition 2021/MSRV 1.74 verificato soltanto con toolchain recente.
- Resolver 3 e fallback preferiscono il minimo dichiarato anche con compilatore recente; allow, requisito senza candidato compatibile, priorita del lockfile e dichiarazione inesatta di una dipendenza.
- Ereditarieta esplicita nel workspace; lockfile prodotto da Cargo recente leggibile dal minimo e formato futuro sintetico rifiutato.

Le dipendenze di prova sono package sintetici in directory source locale con checksum. Nessuna crate pubblica viene scaricata. I comandi di installazione e il canale stable restano documentali e vengono rifiutati dall'helper: la suite non installa toolchain, non aggiorna stable e non modifica la selezione personale. `RUSTUP_AUTO_INSTALL=0` impedisce anche installazioni implicite.

Cargo, rustc e rustdoc restano abbinati alla versione selezionata. Nei comandi con proxy non si forzano RUSTC/RUSTDOC. CARGO_HOME temporaneo, rete Cargo disabilitata, variabili/configurazioni esterne controllate e timeout; cleanup dopo verifica del percorso risolto, parent e prefisso.

Limiti: due versioni su una sola piattaforma, non tutte le release intermedie o gli altri target. Nessuna esecuzione reale di GitHub Actions, cross-compilazione, registry remoto o libreria nativa. La lettura di un manifest con minimo 1.74 non e una prova di compilazione su Rust 1.74. I risultati dei test Rust interni non si sommano ai gruppi Node; l'approvazione dell'utente resta separata dalla revisione tecnica.

## Rust: edition 2018, 2021 e 2024

`rust-editions.test.mjs` estrae la nota **Rust 2018, 2021 e 2024**. Ricostruisce un workspace di tre package e tre programmi autonomi, usando gli stessi sorgenti pubblicati.

Prerequisiti: **Rust/Cargo/rustdoc 1.85.0 e 1.99.1**, target **x86_64-pc-windows-gnu**, rustfmt sulla toolchain 1.99.1, Git e Node **24.14.0**. Configura i percorsi assoluti `RUSTC_TEST_EXECUTABLE` (1.99.1) e `RUSTC_MSRV_TEST_EXECUTABLE` (1.85.0). Cargo e rustdoc sono risolti accanto al relativo rustc; nessuna toolchain viene installata dalla suite.

```powershell
node --test _Meta/tests/rust-editions.test.mjs
```

Per la regressione con MSRV configura anche i percorsi rustup descritti nella sezione precedente:

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-editions.test.mjs _Meta/tests/rust-manifest.test.mjs _Meta/tests/rust-msrv.test.mjs
```

**35 gruppi**, **22 blocchi estratti**: dodici comandi, sette file del workspace e tre programmi autonomi. Prima esecuzione **33/35** in **106,8 secondi**; corretti due presupposti della suite, non i sorgenti della nota: risoluzione del nome di dipendenza in edition 2015 e testo del diagnostico sui pattern.

Regressione finale **90/90** in **242,4 secondi**, inclusi **35/35** nuovi casi, zero fallimenti/skip. Totale **53 suite Rust**; le altre cinquanta e gli altri linguaggi non rieseguiti. Dopo la precisazione testuale sui prerequisiti Git, controllo mirato YAML/struttura **1/1**; esempi tecnici invariati.

Copertura:

- Metadata delle tre edition e MSRV distinte; check, run, due unit test e due doctest su entrambe le toolchain.
- Cargo fmt corrente verificato in modalita check e con scrittura sulla sola fixture; consumer con testo Unicode, vuoto e spazi interni.
- Default 2015 quando edition e omessa; resolver del workspace virtuale non ereditato dai membri, edition inesistente e opzione Cargo errata rifiutate.
- Async rifiutato in edition 2015, TryInto e prelude 2021, Future/IntoFuture nel prelude 2024, cattura disgiunta delle closure.
- Array: warning e prestito in 2018, errore di tipo in 2021/2024, iter esplicito, consumo qualificato e use-after-move rifiutato.
- Un eseguibile precedente resta presente dopo una compilazione fallita: verificato il checksum, senza eseguire il binario obsoleto.
- Identificatore gen rispetto a r#gen; Drop nel ramo fallito di if let, nel ramo riuscito e in match esplicito.
- RPIT con cattura implicita rispetto a use<>, pattern con ref ridondante, macro expr rispetto a expr_2021 e macro esportata fra edition.
- Extern/attributi unsafe e warning unsafe_op_in_unsafe_fn: **sola compilazione metadata**. Nessuna operazione unsafe o chiamata FFI eseguita.
- Migrazione reale 2018 -> 2021 -> 2024: fix dei sorgenti, manifest invariato dal comando, cambio manuale della dichiarazione e test ripetuti.
- Protezione senza VCS o con modifiche non committate; doctest non corretto da fix, rilevato dal test successivo e corretto esplicitamente.
- Dipendenze circolari rifiutate anche fra edition differenti.

I test creano repository Git soltanto nelle directory temporanee, con snapshot necessari per le prove di cargo fix. Identita fittizia, hook disattivati, firma disabilitata e configurazioni globale/sistema escluse. **Nessun commit nel vault, nessun remote o push.**

CARGO_HOME isolato, Cargo offline, processi con timeout, variabili/configurazioni esterne controllate. Cleanup dopo verifica del percorso risolto, parent e prefisso. Nessuna dipendenza scaricata o configurazione personale modificata.

Limiti: due versioni su una piattaforma, non tutte le versioni storiche della tabella. Le sonde aggiuntive verificano casi scelti, non ogni regola delle edition o ogni migrazione. Nessun executor async, lock reale, libreria FFI, soundness proof, cross-compilazione o esecuzione della CI remota. I risultati dei test Rust interni non si sommano ai gruppi Node.

## Rust: Edition Migration

Ottava nota di **Cargo, Editions e Compatibilita**: procedura completa da edition 2021 a 2024. Riusa **Rust/Cargo/rustdoc 1.85.0 e 1.99.1**, target **x86_64-pc-windows-gnu**, Git e Node **24.14.0**. Rustfmt e Clippy solo sulla toolchain 1.99.1.

Impostare `RUSTC_TEST_EXECUTABLE` sul percorso assoluto di rustc 1.99.1 e `RUSTC_MSRV_TEST_EXECUTABLE` su quello di rustc 1.85.0, come nelle suite precedenti. Cargo e rustdoc vengono cercati accanto a ciascun compilatore; l'assenza di una toolchain e un errore, non uno skip.

```powershell
node --test _Meta/tests/rust-edition-migration.test.mjs
```

Prima esecuzione: **26/26 test**, zero fallimenti/skip, **85,1 secondi**. Estratti tutti i **25 blocchi**: cinque file completi e venti comandi singoli. Il progetto non usa dipendenze esterne.

Verificata la procedura con Git reale su entrambe le versioni: inizializzazione, snapshot locale, branch dedicata, stato pulito, fix nella vecchia edition, diff dei sorgenti e manifest/lockfile invariati. Dopo il cambio manifest, check passa ma i due doctest falliscono per gen; la correzione manuale delle sole chiamate nei commenti li rende validi. Configurazione completa: due integration test e due doctest; senza default: uno e uno. Versione del package, MSRV e lockfile restano invariati.

Rustfmt controllato sia in scrittura sia in modalita check, Clippy con warning come errori e test ripetuti. Consumer edition 2021 chiama ancora gen dopo la migrazione del provider: r#gen non e una rinomina logica dell'API.

Sonde aggiuntive: limiti numerici senza overflow, cambio manifest prematuro, fix senza feature opzionale o limitato alla libreria, check che non esegue asserzioni errate, all-targets che esclude i doctest, all-features che non prova ogni combinazione e codice di un altro sistema operativo non visitato. Lockfile mancante con locked rifiutato; Clippy e git diff --check mostrano limiti distinti.

Verificate le protezioni Git e le deroghe allow-no-vcs, allow-staged e allow-dirty. Repository e commit soltanto nelle fixture: identita fittizia, configurazioni personali, hook e firma esclusi; nessun commit o push del vault. CARGO_HOME isolato, Cargo offline, toolchain abbinate, processi con timeout e cleanup dopo verifica del percorso risolto, parent e prefisso.

Limiti: una piattaforma, nessuna cross-compilazione o verifica di tutte le combinazioni. Broken-code, edition-idioms e la variante workspace sono descritti sulla base delle fonti, non esercitati dalla nuova suite; macro e codice generato non verificati qui. Non una prova di soundness, di ogni migrazione o di correttezza generale delle API. I test Rust interni non si sommano ai 26 gruppi Node.

Regressione dopo la formattazione della suite: **88/88** fra migrazione, edition e MSRV, zero fallimenti/skip, **277,0 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-edition-migration.test.mjs _Meta/tests/rust-editions.test.mjs _Meta/tests/rust-msrv.test.mjs
```

La suite MSRV richiede anche `RUSTUP_TEST_EXECUTABLE` e `RUSTUP_TEST_HOME` descritti nella sua sezione. Totale **54 suite Rust**: le altre cinquantuno e gli altri linguaggi non rieseguiti. Controlli editoriali, build Quartz e approvazione dell'utente restano separati.

## Rust: Cargo Features

Nona nota di **Cargo, Editions e Compatibilita**. Baseline **Rust/Cargo/rustdoc 1.85.0 e 1.99.1**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Rustfmt e Clippy sulla toolchain 1.99.1. Nessuna crate scaricata: il laboratorio contiene due package locali.

`RUSTC_TEST_EXECUTABLE` deve indicare il percorso assoluto di rustc 1.99.1 e `RUSTC_MSRV_TEST_EXECUTABLE` quello di rustc 1.85.0. Cargo e rustdoc vengono cercati accanto ai rispettivi compilatori. Una toolchain mancante e un errore, non uno skip.

```powershell
node --test _Meta/tests/rust-features.test.mjs
```

La suite contiene **31 casi**. Estrae tutti i **20 blocchi** dalla nota: cinque file, quattordici comandi singoli e un controesempio cfg!. Sei configurazioni sono eseguite su entrambe le versioni, confrontando test, doctest e feature effettive dagli artefatti JSON di Cargo. I test Rust interni non si sommano ai gruppi Node.

Risultati attesi del package principale: 4 test con default, 2 senza default, 2 con solo hex, 4 con solo checksum, 6 con checksum e hex senza default, 8 con tutte le feature. Workspace completo: 10 test. Verificati tree normale/inverso, metadata, format check e Clippy.

Le sonde aggiuntive controllano dep: e feature implicite, forwarding debole/forte, alias locali, scope delle feature, cfg! rispetto a cfg, attributo no_std, default riattivati da altri consumer, unificazione di feature su due percorsi normali, lockfile rispetto alla compilazione, compatibilita dell'API predefinita e combinazioni artificialmente esclusive.

Verificate separatamente selezione dei membri, doctest, asserzioni non eseguite da check e tutti i 256 risultati della somma modulo 256. Resolver 2/3 confrontati con 1 per le dev-dependencies; resolver 3 con 1 per build-dependencies e dipendenze di un altro sistema operativo. Non e cross-compilazione: la sonda verifica che il ramo per l'altra piattaforma non venga attivato.

Cargo offline, CARGO_HOME temporaneo, toolchain abbinate, variabili/configurazioni esterne controllate e processi con timeout. Cleanup dopo verifica di percorso risolto, parent e prefisso; sorgenti originali confrontati tramite hash. Nessun comando di pubblicazione, nuova installazione o modifica al Git del vault.

Limiti: due toolchain su un solo host, non ogni combinazione o versione intermedia. Serde/Tokio sono riferimenti documentali, non compilati nella nuova suite. Nessuna prova su embedded, allocatore personalizzato, proc-macro o compatibilita no_std dell'intero ecosistema. I test su host usano la standard library anche quando la libreria sotto test e no_std.

Primo avvio interrotto dalla regex del comando Clippy (-D maiuscola); primo giro completo **29/30** in **95,5 secondi**, con un errore nell'helper che leggeva anche il messaggio JSON finale di Cargo come compiler-artifact. Corretto il filtro e aggiunto il caso alias: verifica mirata **2/2** in **7,7 secondi**. Esempi pubblicati invariati.

Regressione finale: **85/85**, inclusi **31/31** nuovi casi, zero fallimenti/skip, **253,2 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-features.test.mjs _Meta/tests/rust-manifest.test.mjs _Meta/tests/rust-edition-migration.test.mjs
```

Totale **55 suite Rust**; le altre cinquantadue e gli altri linguaggi non rieseguiti. La regressione di migrazione usa Git solo nelle fixture. Controlli editoriali, build Quartz e approvazione dell'utente restano separati.

## Rust: Build Scripts

Decima nota di **Cargo, Editions e Compatibilita**. Baseline **Rust/Cargo/rustdoc 1.85.0 e 1.99.1**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Rustfmt e Clippy sulla toolchain 1.99.1. Nessuna crate esterna.

`RUSTC_TEST_EXECUTABLE` deve indicare rustc 1.99.1 e `RUSTC_MSRV_TEST_EXECUTABLE` rustc 1.85.0, entrambi con percorsi assoluti. Cargo e rustdoc vengono cercati accanto ai rispettivi compilatori. La verifica dei passaggi d'ambiente richiede Windows PowerShell: non viene saltata silenziosamente su un altro sistema.

```powershell
node --test _Meta/tests/rust-build-scripts.test.mjs
```

La suite contiene **32 casi** ed estrae i **16 blocchi** della nota: sei file, sette comandi Cargo e tre comandi PowerShell. Il progetto genera una costante da un file, incorpora un identificativo validato e gestisce un custom cfg. Eseguiti run/check/build/test sulle due versioni: tre integration test e un doctest, non altri quattro gruppi da sommare ai casi Node.

Le sonde verificano build aggiornata, modifica/ripristino degli input, rimozione del cfg, cambiamento del solo sorgente Rust e input non dichiarati che lasciano risultati obsoleti. Per contare le esecuzioni reali viene aggiunto un contatore soltanto nelle fixture: l'evento JSON build-script-executed puo comparire anche quando Cargo riusa l'output. Non viene dedotta una nuova esecuzione dalla sola presenza del file generato.

PowerShell viene eseguito realmente in processi figli con ambiente isolato: valore precedente presente o assente, assegnazione temporanea, comando Cargo e ripristino. Avvio diretto del binario con ambiente diverso dimostra che env! resta incorporato. Nessuna modifica all'ambiente globale o alla shell personale.

Controllati valori numerici limite, spazi/CRLF, overflow del parser, input vuoti o non validi, file mancante/non UTF-8, identificativi ASCII, lunghezza massima e newline che tentano di introdurre direttive. Un cargo run fallito non avvia il vecchio eseguibile: verificato che il suo hash possa rimanere invariato senza eseguirlo dopo il fallimento.

Verificati OUT_DIR persistente, script automatico/disabilitato/rinominato, manifest-path da un'altra directory, variabili disponibili durante lo script, env! OUT_DIR nello script stesso rifiutato, custom cfg dichiarato rispetto ad attivo, lint unexpected_cfgs e direttive legacy cargo:. Le versioni storiche 1.77/1.80 sono documentali, non installate o eseguite.

Cargo offline, CARGO_HOME temporaneo, toolchain abbinate, variabili esterne controllate e processi con timeout. Le prove su mtime aspettano 1,1 secondi prima di modificare file gia osservati; non assegnano timestamp futuri. Cleanup limitato al percorso risolto con parent/prefisso verificati. Sorgenti originali confrontati con i blocchi estratti e nota controllata tramite hash.

Limiti: due toolchain sullo stesso host, senza compilazione C/C++, linking nativo aggiuntivo, proc-macro, cross-compilazione o CI remota. Il fatto che HOST e TARGET coincidano nelle prove native non verifica una build per un'altra piattaforma. Nessun accesso a registry, segreti, servizi o dati personali.

Primo giro: **31/32** in **159,1 secondi**, con un'unica aspettativa errata sul testo localizzato dell'errore di file mancante. Il test ora controlla NotFound; prova mirata file mancante/non UTF-8 **1/1** in **3,3 secondi**. Esempi pubblicati invariati.

Regressione finale: **60/60**, inclusi **32/32** nuovi casi, zero fallimenti/skip, **211,4 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-build-scripts.test.mjs _Meta/tests/rust-manifest.test.mjs
```

Totale **56 suite Rust**; le altre cinquantaquattro e gli altri linguaggi non rieseguiti. La regressione del manifest verifica anche la separazione fra dipendenze normali, build-dependencies e dev-dependencies. Controlli editoriali, build Quartz e approvazione dell'utente restano separati.

## Rust: Build Profiles

Undicesima nota di **Cargo, Editions e Compatibilita**. Suite `_Meta/tests/rust-build-profiles.test.mjs`: **20 casi**, laboratorio estratto dal Markdown con tre file, dodici comandi Cargo e due frammenti TOML opzionali. Nessuna dipendenza esterna.

Richiede `RUSTC_TEST_EXECUTABLE` per Rust 1.99.1 e `RUSTC_MSRV_TEST_EXECUTABLE` per Rust 1.85.0, con percorsi assoluti. Cargo e rustdoc devono trovarsi accanto al rispettivo rustc; rustfmt e Clippy sono richiesti nella toolchain 1.99.1.

```powershell
node --test _Meta/tests/rust-build-profiles.test.mjs
```

Su entrambe le toolchain vengono provati cinque profili, dodici comandi esclusi i due lint sulla MSRV, tre unit test e un doctest, default dev/release/test/bench, ereditarieta e indipendenza di debug info/assertions. I test interni del progetto sono parte dei casi Node, non ulteriori suite da sommare.

Sonde aggiuntive: CLI e input errati come Result anche con panic abort; overflow ordinario a runtime; effetti di debug_assert disabilitati; assert attivo in release; override tramite config, ambiente e CLI; wildcard esclusa dai membri; profilo del membro ignorato; build-override e precedenza del package nominativo; profili invalidi; LTO off/thin/fat; debug info testuali; artefatti riutilizzati senza incremental compilation.

Il binario small viene eseguito senza provocare abort e osservato con cfg(panic); il test harness viene verificato separatamente con should_panic e cfg(panic = "unwind"). Non e una prova di crash, cleanup dei distruttori, FFI o recupero del processo distribuito.

Fixture temporanee offline, CARGO_HOME isolato, variabili di compilazione ereditate rimosse, timeout per processo e cleanup con parent/prefisso verificati. Hash della nota e confronto dei tre file del laboratorio prima/dopo i comandi. Nessuna modifica globale, installazione, pubblicazione o rete Cargo.

Limiti: Windows GNU, due versioni Rust; nessun benchmark di prestazioni o dimensioni, debugger/profiler reale, cross-compilazione, matrice di piattaforme o CI remota. Il report timings viene generato ma non usato per affermare un guadagno prestazionale.

Verifica del 2026-11-09, Node **24.14.0**, target **x86_64-pc-windows-gnu**. Primo tentativo nel sandbox: due casi passati e diciotto bloccati da accesso negato alle directory target temporanee. Fuori dal sandbox: **19/20** in **116,6 secondi**, con il solo controllo di un warning nascosto da --quiet fallito. Rimossa l'opzione dalla prova diagnostica del workspace; esempi pubblicati invariati.

Regressione finale **52/52**, zero fallimenti/skip, **281,8 secondi**: **20** casi Build profiles e **32** Build scripts.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-build-profiles.test.mjs _Meta/tests/rust-build-scripts.test.mjs
```

Totale **57 suite Rust**; le altre cinquantacinque e gli altri linguaggi non rieseguiti. Verifica tecnica degli esempi, controlli editoriali, build del sito e approvazione dell'utente restano distinti.

## Rust: Workspace Dependencies

Ultima nota di **Cargo, Editions e Compatibilita**. Suite `_Meta/tests/rust-workspace-dependencies.test.mjs`: **27 casi**, workspace di tre package estratto dai **24 blocchi** pubblicati, sette file e diciassette comandi Cargo. Dipendenze solo locali.

Richiede `RUSTC_TEST_EXECUTABLE` per Rust 1.99.1 e `RUSTC_MSRV_TEST_EXECUTABLE` per Rust 1.85.0, con percorsi assoluti. Cargo e rustdoc vengono cercati accanto ai rispettivi compilatori. Rustfmt e Clippy sono richiesti su 1.99.1.

```powershell
node --test _Meta/tests/rust-workspace-dependencies.test.mjs
```

Su entrambe le toolchain: comandi pubblicati eccetto lint sulla MSRV, output dei tre programmi/configurazioni, metadati ereditati, dipendenza opzionale inattiva, unificazione congiunta, selezione di tutti i membri e nuova compilazione isolata. I test del laboratorio vanno da un unit test e un doctest a tre unit test e un doctest; sono verifiche interne ai casi Node, non conteggi aggiuntivi.

Matrice default-features: radice con default attivi e membro che li disattiva, edition 2024 su Rust 1.85.0 rispetto a 1.99.1; edition 2021 con opzione ignorata e avviso su entrambe. Riabilitazione locale dei default e limite di --no-default-features rispetto alle dipendenze. Quattro prove mirate sulla matrice sono passate in **4,4 secondi**, prima della regressione completa.

Altre sonde: dichiarazione centrale inutilizzata, adesione o chiave mancante, optional vietato nella radice, feature vuote additive, path relativo alla radice, metadati e lint opt-in, feature implicita soppressa da dep:, namespace dei cfg, rinomina, build/dev-dependencies e target inattivo, lockfile protetto e requisito di versione di una dipendenza path.

Fixture temporanee offline, CARGO_HOME isolato, variabili di compilazione ereditate rimosse, processi con timeout e cleanup limitato al parent/prefisso verificati. Hash della nota e confronto dei sette sorgenti del laboratorio; nessuna installazione, dipendenza npm aggiunta, modifica globale o pubblicazione.

Limiti: Windows GNU, Rust 1.85.0 e 1.99.1. Le soglie storiche 1.64/1.74 e le versioni intermedie 1.86-1.98 sono documentali, non installate. Nessun registry remoto, aggiornamento di dipendenze reali, pubblicazione, cross-compilazione o CI remota. La condizione target_os = "none" viene verificata come inattiva sull'host, non compilando quel target.

Verifica del **2026-11-10**, Node **24.14.0**, target **x86_64-pc-windows-gnu**. Primo giro complessivo **104/106** in **208,2 secondi**: **79/79** delle suite precedenti e **25/27** della nuova. Due difetti del solo harness: attesa del vecchio messaggio di errore per lockfile assente e sostituzione della versione che intercettava anche rust-version. Aggiornati pattern diagnostico e confini della riga da modificare; esempi pubblicati invariati.

Prova mirata **2/2** in **5,5 secondi**; riesecuzione integrale della nuova suite **27/27**, zero fallimenti/skip, **73,2 secondi**. Insieme ai **79/79** precedenti, sono **106 casi verificati in esecuzioni distinte**, non un secondo giro unico di tutte le suite.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-workspace-dependencies.test.mjs _Meta/tests/rust-features.test.mjs _Meta/tests/rust-pattern-moduli-workspace.test.mjs
```

Totale **58 suite Rust**; le altre cinquantacinque e gli altri linguaggi non rieseguiti. Gli esempi registry/Git e le API di serde, tokio, clap, anyhow e thiserror citati come varianti non sono installati o eseguiti da questa suite. Revisione tecnica e approvazione dell'utente restano distinte.

## Rust: Threads

Prima nota di **Concorrenza e Asincronia**. Suite `_Meta/tests/rust-threads.test.mjs`, con **30 casi**: estrae gli otto blocchi Rust dalla nota originale, compila ed esegue i sei programmi validi e controlla E0597/E0277 per i due controesempi.

```powershell
node --test _Meta/tests/rust-threads.test.mjs
```

Baseline **Rust 1.99.1**, edition **2024**, Windows GNU, Node **24.14.0**. Usa `RUSTC_TEST_EXECUTABLE` come le altre suite; nessuna nuova installazione, dipendenza o modifica al compilatore predefinito.

Verificati move e valore restituito, Result annidato, panic e hook, Builder, prestiti scoped disgiunti, somma con limite di quattro worker e overflow controllato. Varianti verificano input vuoti/limite/segni, overflow locale/finale anche con ottimizzazione e overflow-checks disabilitati, errore del worker, ownership dopo join e consumo dell'handle. Sonde separate controllano Send del risultato, correzioni con ownership/scope/Arc, prestiti mutabili in conflitto, panic scoped automatico/manuale, detach senza cancellazione, termine del processo con un worker attivo, is_finished e stima del parallelismo. I protocolli dei test non dipendono da sleep o da un ordine dello scheduler.

Prima esecuzione **30/30**, circa **22 secondi**. Regressione completa delle tre suite **152/152**, zero fallimenti/skip, circa **109 secondi**: 30 nuovi casi e 122 preesistenti di lock e Rc/Arc.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-threads.test.mjs _Meta/tests/rust-locks.test.mjs _Meta/tests/rust-rc-arc.test.mjs
```

Totale **59 suite Rust**: le altre 56 e gli altri linguaggi non rieseguiti. Fixture temporanee, timeout dei processi, nessuna crate esterna, sorgente della nota invariato durante i test; cleanup controllato per parent e prefisso.

Limiti: un solo target e compilatore, non un benchmark o una prova di ogni interleaving. Non vengono provocati fallimenti OS per esaurimento di risorse, stack overflow o deadlock. Dimensione effettiva dello stack e distruttori thread-local non misurati; la distinzione documentata in Rust 1.99.1 fra attesa scoped automatica ed esplicita non e certificata da una sonda dedicata. Nessun test panic=abort, FFI, pool, Rayon, executor async o CI remota. Il controllo di nome nullo dimostra un panic del Builder, non un errore OS di creazione.

## Rust: Message Passing

Seconda nota di **Concorrenza e Asincronia**. Suite `_Meta/tests/rust-message-passing.test.mjs`: **37 casi**, con tutti i nove blocchi Rust estratti dal Markdown. Sette programmi validi eseguiti e due controesempi rifiutati con E0382/E0599.

```powershell
node --test _Meta/tests/rust-message-passing.test.mjs
```

Baseline **Rust 1.99.1**, edition **2024**, Windows GNU, Node **24.14.0**. Riutilizza `RUSTC_TEST_EXECUTABLE` e la toolchain gia installata, senza nuove dipendenze o modifiche globali.

Verificati trasferimento e join, Empty/Timeout/Disconnected, svuotamento dopo chiusura, Full con recupero del messaggio, rendezvous, produttori multipli, worker Work/Stop e richiesta/risposta. Sonde aggiuntive verificano SendError sui due tipi di canale, cloni che mantengono aperta la ricezione, try_iter, messaggi mai letti e distrutti, backpressure, ricevitore abbandonato, conferma distinta dalla ricezione, timeout senza cancellazione, comandi dopo Stop, risposta Unicode, reply abbandonata e bound Send/Sync. Nessun test dipende da sleep o dall'ordine fra produttori concorrenti.

Prima esecuzione **36/37**, circa **26,9 secondi**: solo il test editoriale assumeva che il parser comune riconoscesse le tabelle GFM come nodi dedicati. Corretta l'assunzione del test; nessun esempio Rust modificato per far passare le prove. La tabella viene controllata nell'HTML durante la QA Quartz.

Regressione con Threads: **67/67**, zero fallimenti/skip, circa **52,5 secondi**, inclusi **37/37 nuovi casi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-message-passing.test.mjs _Meta/tests/rust-threads.test.mjs
```

Totale **60 suite Rust**; le altre 58 e gli altri linguaggi non rieseguiti. Fixture temporanee con timeout, sorgente della nota confrontato byte per byte, cleanup limitato a parent/prefisso verificati. Nessuna rete o crate esterna per i test Rust.

Limiti: un solo compilatore/target, nessun benchmark, esaurimento di memoria o deadlock provocato. Non sono testati pool, runtime async, code persistenti, crash recovery o ogni interleaving possibile. I timeout lunghi proteggono i protocolli delle sonde, non certificano una latenza; il caso Timeout usa durata zero e un produttore trattenuto da un canale di controllo. La sonda di disconnessione su buffer pieno verifica l'esito dell'invio senza pretendere di osservare l'istante in cui il thread entra nell'attesa OS.

## Rust: Shared State

Terza nota di **Concorrenza e Asincronia**. Suite `_Meta/tests/rust-shared-state.test.mjs`: **31 casi**, sette programmi estratti integralmente dal Markdown. Sei esempi validi e un controesempio compilabile che mostra un errore logico deterministico, non un errore di memoria.

```powershell
node --test _Meta/tests/rust-shared-state.test.mjs
```

Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**. Il contatore viene verificato anche in edition 2021 con lo stesso compilatore. Riutilizza `RUSTC_TEST_EXECUTABLE`, senza installazioni o nuove dipendenze.

Controllati prestiti scoped senza Arc, update su Mutex non condiviso, Unicode, snapshot indipendenti, rilascio della guard, rifiuto del poisoning, contatore vuoto/limite/concorrente e propagazione di panic. Overflow del contatore provato anche con ottimizzazione e overflow-checks disabilitati.

L'inventario viene provato con prenotazione esatta, insufficienza, quantita zero, limite u32, concorrenza su una singola unita e stato poisoned. La sonda di overflow difensivo usa uno stato sintetico non costruibile attraverso i soli new/reserve: non suggerisce che il percorso normale possa superare la disponibilita iniziale. Un errore ordinario e verificato separatamente da rollback e poisoning.

Verificati snapshot RwLock, read guard che impedisce try_write, wrapping di fetch_add e aggiornamento perso con load/store separati. Il controesempio check-then-act viene ripetuto venti volte e confrontato con la correzione; una barriera forza l'interleaving, senza sleep.

Prima esecuzione **31/31**, circa **23,7 secondi**. Regressione con Mutex/RwLock e Threads: **113/113**, zero fallimenti/skip, circa **76,6 secondi**; include i 31 nuovi casi, senza contarli due volte.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-shared-state.test.mjs _Meta/tests/rust-locks.test.mjs _Meta/tests/rust-threads.test.mjs
```

Totale **61 suite Rust**; le altre 58 e gli altri linguaggi non rieseguiti in questo blocco. Fixture temporanee con timeout, controllo dei byte originali della nota e cleanup limitato a parent/prefisso verificati. Nessuna rete o crate esterna nei test Rust.

Limiti: un solo compilatore/target, non un benchmark o una prova di tutti gli interleaving. Non vengono provocati deadlock, esaurimento delle risorse OS o panic=abort. Le garanzie di progresso degli atomici, le prestazioni di RwLock e le API Tokio non sono certificate dai test. La regressione preesistente verifica i bound Send dei future con/senza guard, ma non esegue un runtime async. Nessuna persistenza, transazione con database o CI remota.

## Rust: Send e Sync Traits

Quarta nota di **Concorrenza e Asincronia**. Suite `_Meta/tests/rust-send-sync.test.mjs`: **64 casi**, dieci blocchi Rust estratti dal Markdown, sette programmi validi e tre controesempi rifiutati. Alcuni programmi verificano soltanto i tipi; non vengono presentati come executor async.

```powershell
node --test _Meta/tests/rust-send-sync.test.mjs
```

Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**. Riutilizza `RUSTC_TEST_EXECUTABLE` e la toolchain esistente; nessuna installazione o dipendenza aggiunta.

La matrice di 32 sonde controlla separatamente Send e Sync per Cell, RefCell, Rc, Arc, Mutex, RwLock, raw pointer, guard, riferimenti condivisi/mutabili, Vec e Box. Altre sonde controllano propagazione dei campi del wrapper, risultato Send del thread, prestito non static, esecuzione effettiva sul worker, perdita del bound nei trait object e cattura Rc rifiutata.

Verificato che `let _ = data` non forza la cattura di una variabile Rc in una closure move, mentre il controesempio della nota usa realmente `drop(data)`. RefCell trasferita non puo essere riutilizzata dal mittente; un prestito mutabile scoped di Cell viene accettato.

Per i future: helper che non esegue il corpo, Rc conservato attraverso await, Rc catturato prima del primo poll, parametro Rc, output non Send distinto dal future e RefCell posseduta. Una sonda con flag e polling esplicito dimostra l'assenza di esecuzione alla sola costruzione e verifica il risultato 5. Il poll usa soltanto std su future immediatamente pronti: non e un runtime general-purpose e non misura migrazione dei task.

Controllati entrambi gli auto trait del marker LocalToken, dimensione/allineamento di PhantomData, negative impl rifiutata su stable con E0658 e assenza del derive standard Send. Gli altri controesempi verificano E0277/E0597/E0382 o la diagnostica specifica del future non Send.

Prima esecuzione **64/64**, circa **26,1 secondi**. Regressione con Mutex/RwLock e Threads: **146/146**, zero fallimenti/skip, circa **84,0 secondi**; include i 64 nuovi casi, senza contarli due volte.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-send-sync.test.mjs _Meta/tests/rust-locks.test.mjs _Meta/tests/rust-threads.test.mjs
```

Totale **62 suite Rust**; le altre 59 e gli altri linguaggi non rieseguiti in questo blocco. Fixture temporanee con timeout, controllo dei byte della nota e cleanup limitato a parent/prefisso verificati. Nessuna rete o crate esterna nei test Rust.

Limiti: un solo compilatore/target, nessuna esecuzione Tokio, LocalSet, FFI o wrapper unsafe. La compilazione non dimostra la soundness di un unsafe impl; nessuna implementazione manuale viene certificata. Nessuna prova di prestazioni, esaurimento risorse, deadlock, ogni interleaving o CI remota. Gli esempi async della nota restano distinti dalle sonde di polling della suite.

## Rust: Mutex, RwLock e Atomics

Quinta nota di **Concorrenza e Asincronia**. Suite `_Meta/tests/rust-atomics.test.mjs`: **45 casi**, otto blocchi Rust estratti dal Markdown. Sei esempi corretti, un controesempio logico compilabile e un controesempio rifiutato dal lint invalid_atomic_ordering.

```powershell
node --test _Meta/tests/rust-atomics.test.mjs
```

Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**. Riutilizza `RUSTC_TEST_EXECUTABLE`; nessuna installazione o crate esterna.

Verificati lock con join, load/store, swap/fetch_add e le quindici combinazioni ammesse degli ordering CAS. Gli ordering non validi sono controllati sia tramite diagnostica a compile time sia come panic a runtime, usando black_box per evitare un valore costante nel chiamante. Testati wrapping anche con overflow-checks attivi e confronto CAS dopo una sequenza A-B-A.

StopFlag provato nello stato iniziale, dopo richieste ripetute, con richiesta precedente allo spawn e senza richiesta. La pubblicazione Release/Acquire viene letta prima del join, con payload zero/uno/usize::MAX e trenta esecuzioni su istanze nuove in un binario ottimizzato. La deadline dimostrativa non e una garanzia di latenza.

Quota CAS e try_update provate con zero, massimo usize, consumi sequenziali e contesa fra otto worker. Una modifica interposta nella closure forza un retry di try_update senza sleep; non simula un fallimento spurio dell'hardware. Verificati Some/None, panic della closure, deprecazione fetch_update nella baseline e compatibilita quando la deprecazione e ammessa.

Il controesempio load/store SeqCst viene ripetuto venti volte con barriera e confrontato con la correzione fetch_add. Non si tenta di far fallire statisticamente una pubblicazione Relaxed per dimostrare il modello di memoria.

Prima esecuzione **45/45**, circa **29,7 secondi**. Regressione con Mutex/RwLock e Shared state: **128/128**, zero fallimenti/skip, circa **95,6 secondi**; include i 45 nuovi casi senza contarli due volte.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-atomics.test.mjs _Meta/tests/rust-locks.test.mjs _Meta/tests/rust-shared-state.test.mjs
```

Totale **63 suite Rust**; le altre 60 e gli altri linguaggi non rieseguiti in questo blocco. Fixture temporanee con timeout, confronto dei byte della nota e cleanup vincolato a parent/prefisso verificati. Nessuna rete nei test Rust.

Limiti: un solo compilatore/target, nessuna prova di tutti gli interleaving o delle garanzie lock-free/wait-free. Nessun benchmark, model checker, cross-compilazione, emulazione di architetture weakly ordered, FFI, runtime async o CI remota. Non vengono provocati deadlock o data race. La disponibilita di try_update da 1.95 deriva dalle fonti ufficiali: quella toolchain non e stata installata. I test confermano comportamento e deprecazione su 1.99.1, non tutte le soglie storiche.

## Rust: Rayon e parallel iterators

Revisionata la sesta delle **13 note di Concorrenza e Asincronia**: **93/183 note principali Rust**, **90 restanti**; promemoria separati.

Baseline: **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**, **Rayon 1.12.0**. La suite estrae il manifest e tutti gli otto programmi: sei esempi validi e due compile-fail (E0596 ed E0599).

Impostare `RUSTC_TEST_EXECUTABLE` sul compilatore esistente. Cargo e rustdoc vengono risolti accanto a rustc. La cache non e quella personale e non modifica le dipendenze del sito:

```powershell
$env:RUST_RAYON_TEST_CARGO_HOME = 'C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-rayon-cache-20261110'
$env:RUST_RAYON_TEST_FETCH = '0'
node --test --test-concurrency=1 _Meta/tests/rust-rayon.test.mjs _Meta/tests/rust-iterator-api.test.mjs _Meta/tests/rust-send-sync.test.mjs
```

Su una cache vuota abilitare esplicitamente `RUST_RAYON_TEST_FETCH=1` per il solo fetch iniziale, poi tornare a `0`. Senza cache o rete autorizzata il test fallisce, non viene saltato. Il lockfile viene generato nella fixture; compilazione delle dipendenze con `--locked --offline`, poi programmi compilati con rustc contro le stesse librerie. Le transitive non sono fissate da un lockfile permanente nel repository.

Dipendenze effettivamente risolte: `rayon@1.12.0`, `rayon-core@1.13.0`, `crossbeam-deque@0.8.8`, `crossbeam-epoch@0.9.21`, `crossbeam-utils@0.8.23` e `either@1.19.0`.

**37/37 test mirati**, zero fallimenti/skip, **39,9 secondi**. Regressione con Iterator API (35) e Send/Sync (64): **136/136**, **91,3 secondi**.

- Programmi originali con RAYON_NUM_THREADS=1 e 4; il programma con pool esplicito mantiene due worker. Una sonda separata verifica pool locali da 1, 2 e 4 worker.
- Ownership, prestiti, Cell mutabile disgiunta e rifiuto di Cell condivisa/Rc; pipeline lazy e completamento.
- Normalizzazione con vuoti, Unicode, duplicati, ordine e input invariato; confronto col sequenziale su 5000 stringhe.
- Fold/reduce, identita sul vuoto, conteggi con valori limite e build ottimizzata; non associativita floating point dimostrata senza pretendere una particolare parentesizzazione di Rayon.
- Parsing, errori multipli senza assumere quale vinca, report completo e assenza di rollback in try_for_each.
- Enumerate prima del filtro, rinumerazione dopo collect, find_first/find_any, pool corrente, join con un worker e propagazione del panic.
- Pool globale inizializzabile una volta per processo; chunk disgiunti e dimensione zero, bridge senza ordine imposto, sort stabile/unstable.

Prima del successo, il fetch in sandbox e fallito per DNS; il tentativo offline e fallito per permessi sulla directory target. Download iniziale e test ripetuti fuori sandbox con autorizzazione; esecuzione e regressione offline. Nessuna modifica agli esempi per aggirare questi errori ambientali.

Fixture temporanee con timeout, ambiente Cargo isolato, controllo delle configurazioni nei parent e cleanup limitato al percorso verificato. Byte della nota confrontati prima/dopo. Nessun benchmark, prova di speedup, matrice MSRV, target senza thread, integrazione async reale o verifica di tutti gli interleaving.

Totale **64 suite Rust**; altre 61 e altri linguaggi non rieseguiti in questo blocco.

## Rust: Async/Await

Revisionata la settima delle **13 note di Concorrenza e Asincronia**: **94/183 note principali Rust**, **89 restanti**; promemoria separati.

Baseline: **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**, **Tokio 1.54.1**. Estratti il manifest e tutti gli otto programmi: sei validi e due compile-fail (E0728 ed E0597).

Impostare `RUSTC_TEST_EXECUTABLE` sul compilatore esistente; Cargo e rustdoc vengono risolti nella stessa directory. Cache Tokio separata da quella personale e dalle dipendenze del sito:

```powershell
$env:RUST_ASYNC_TEST_CARGO_HOME = 'C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-tokio-cache-20261110'
$env:RUST_ASYNC_TEST_FETCH = '0'
node --test --test-concurrency=1 _Meta/tests/rust-async-await.test.mjs _Meta/tests/rust-send-sync.test.mjs _Meta/tests/rust-pin-unpin.test.mjs
```

Per una cache vuota, abilitare esplicitamente `RUST_ASYNC_TEST_FETCH=1` nel fetch iniziale; poi tornare a `0`. Cache mancante o compilatore assente causano un errore, non uno skip. Lockfile generato nella fixture, build dipendenze con `--locked --offline` e compilazione dei programmi con rustc contro le stesse librerie. Le transitive non sono fissate da un lockfile permanente nel repository.

Dipendenze risolte: `tokio@1.54.1`, `tokio-macros@2.7.2`, `pin-project-lite@0.2.17`, `proc-macro2@1.0.107`, `quote@1.0.47`, `syn@3.0.10`, `unicode-ident@1.0.27`. Download iniziale autorizzato fuori sandbox; test e regressione successivi offline, fuori sandbox per i limiti Cargo gia osservati.

**36/36 test mirati**, zero fallimenti/skip, **43,8 secondi**. Regressione con Send/Sync (64) e Pin/Unpin (53): **153/153**, **96,3 secondi**.

- Corpo async differito, argomenti valutati subito e distruzione degli argomenti di una future mai avviata.
- Ready che non cede il controllo sul current-thread, anche con cento await in build ottimizzata; Pending e wake realmente gestiti da Tokio.
- Prestiti e move prima del polling, consumo con await, propagazione di ? limitata al blocco async.
- Oneshot con successo, vuoti/Unicode, errore applicativo, chiusura del sender/receiver e panic del produttore; distinzione dei due Result del JoinHandle.
- Join con prestiti/Rc nella stessa task, completamento di tutti i rami anche dopo Err, bound Send/static di spawn verificati sul current-thread.
- Esecuzione reale su LocalSet, task distaccata dopo drop dell'handle, abort con distruzione dello stato e assenza di rollback.
- Thread blocking distinto, abort inefficace su job gia avviato e future restituita ma non eseguita passando una closure async a spawn_blocking.
- Timer configurato, timeout su pending e panic di spawn senza runtime.

Nessun sleep usato per imporre l'interleaving: sincronizzazione tramite canali e attese degli handle. Sleep/timeout brevi sono soltanto sonde delle API timer, senza soglie prestazionali; il job blocking ha recv_timeout come protezione.

Fixture temporanee con timeout, controllo delle configurazioni Cargo nei parent, ambiente isolato e cleanup limitato al percorso verificato. Byte della nota confrontati prima/dopo. Runtime async current-thread e LocalSet reali, nessuna implementazione di un executor in questi esempi.

Limiti: un solo compilatore/target; nessun runtime multi-thread Tokio, networking o database, benchmark, matrice MSRV o verifica di tutti gli interleaving. La regressione Pin/Unpin conserva le sue sonde standard di polling manuale.

Totale **65 suite Rust**; altre 62 e altri linguaggi non rieseguiti in questo blocco.

## Rust: Future Trait

Revisionata l'ottava delle **13 note di Concorrenza e Asincronia**: **95/183 note principali Rust**, **88 restanti**; promemoria separati.

Baseline: **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**, **Tokio 1.54.1**. Estratti il manifest e tutti i sette programmi: cinque validi e due compile-fail. La baseline non dichiara l'ultima versione o una MSRV.

Impostare `RUSTC_TEST_EXECUTABLE` sul compilatore esistente; Cargo e rustdoc vengono risolti nella stessa directory. Si riusa la cache Tokio isolata del blocco precedente:

```powershell
$env:RUST_ASYNC_TEST_CARGO_HOME = 'C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-tokio-cache-20261110'
$env:RUST_ASYNC_TEST_FETCH = '0'
node --test --test-concurrency=1 _Meta/tests/rust-future.test.mjs _Meta/tests/rust-async-await.test.mjs _Meta/tests/rust-pin-unpin.test.mjs
```

Per una cache vuota usare esplicitamente `RUST_ASYNC_TEST_FETCH=1` nel primo fetch; tornare poi a `0`. Compilatore o dipendenze mancanti producono un errore, non uno skip. In questa sessione nessun download: fetch dalla cache e build `--locked --offline`, autorizzati fuori sandbox per i limiti Cargo gia osservati.

Dipendenze effettive: `tokio@1.54.1`, `tokio-macros@2.7.2`, `pin-project-lite@0.2.17`, `proc-macro2@1.0.107`, `quote@1.0.47`, `syn@3.0.10`, `unicode-ident@1.0.27`. Il manifest della nota abilita rt, macros e sync. Lockfile nella fixture temporanea, non permanente nel repository; nessun cambio alla configurazione Cargo personale o alle dipendenze del sito.

**34/34** casi nel primo giro completo, **33,8 secondi**. Regressione Future (34), Async/Await (36) e Pin/Unpin (53): **123/123**, zero fallimenti/skip, **96,3 secondi**. Sulla versione editoriale finale, nuova esecuzione Future **34/34**, **29,1 secondi**. Prima di questi giri e stato corretto un errore di parentesi nell'harness JavaScript, che impediva l'avvio dei test.

Copertura:

- Tutti i programmi originali, YAML invariato, template e gerarchia dei titoli.
- Helper lazy, drop delle catture, FnOnce, Output Result e sospensione su oneshot.
- Wrapper manuale: successo, errore applicativo, produttore perso, receiver eliminato e bound Send/Unpin.
- Polling controllato con due Waker distinti: l'invio notifica quello piu recente; anche il drop del produttore risveglia il receiver Pending. I contatori non sono un executor: il completamento viene atteso con Tokio.
- Poll::map non esegue la closure su Pending.
- Future boxed: Unicode/vuoti, move del proprietario pinnato, prestiti, lifetime non static e scelta di tipi eterogenei.
- Future e Output hanno bound Send distinti; Rc locale realmente eseguito anche tramite LocalSet.
- poll_fn mantiene lo stato e propaga il contesto; risveglio effettivamente guidato da Tokio.
- Due tipi async incompatibili in impl Future, scelta corretta dentro un unico blocco e Box ordinario valido con Future Unpin.
- Diagnostiche negative E0277, E0505, E0597, E0308 e messaggio sulla future non Send.

Fixture temporanee con timeout, ambiente Cargo isolato, controllo delle configurazioni nei parent, confronto dei byte della nota e cleanup limitato al percorso verificato. Nessuna attesa basata su sleep per imporre interleaving e nessun ciclo executor scritto a mano.

Limiti: un solo compilatore/target; nessun networking/database, runtime multi-thread, benchmark, matrice MSRV o prova esaustiva delle race. I test Waker verificano il wrapper e il canale nella sequenza controllata, non dimostrano correttezza di primitive concorrenti arbitrarie.

Totale **66 suite Rust**; altre 63 e altri linguaggi non rieseguiti in questo blocco.

## Rust: Runtime async Tokio e async-std

Nona nota di Concorrenza e Asincronia, totale **96/183 note principali Rust**. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**, Tokio **1.54.1**, async-std **1.13.2**. La verifica del codice legacy non e una raccomandazione per nuovi progetti: async-std e dismesso.

```powershell
node --test _Meta/tests/rust-runtime.test.mjs
```

`RUSTC_TEST_EXECUTABLE` seleziona il compilatore; cargo e rustdoc sono cercati nella stessa directory. `RUST_RUNTIME_TEST_CARGO_HOME` seleziona una cache dedicata, senza configurazioni Cargo personali. Il default e offline; per il solo fetch iniziale:

```powershell
$env:RUST_RUNTIME_TEST_FETCH = "1"
```

Dopo aver popolato la cache:

```powershell
$env:RUST_RUNTIME_TEST_FETCH = "0"
```

Su Windows GNU devono essere disponibili anche `dlltool.exe` e `as.exe` con le rispettive dipendenze. La toolchain temporanea usata nei lotti precedenti non comprendeva l'assembler. `RUST_RUNTIME_TEST_TOOLS_BIN` puo indicare una directory completa degli strumenti: viene anteposta al PATH dei soli processi della suite, non al PATH di sistema. Non usare il percorso abbreviato 8.3 per rustc: nel tentativo locale il linker perdeva i file CRT self-contained.

Per questa verifica gli strumenti sono stati estratti sotto `%TEMP%/appunti-runtime-binutils-9239afa6a6ba401bad0bfa60d5a122b0`, con directory eseguibili `binutils-2.47-4/mingw64/bin`. Download dal mirror ufficiale MSYS2, checksum verificati contro il catalogo ufficiale e percorsi dell'archivio controllati prima dell'estrazione; licenze conservate. Nessuna installazione globale.

| Pacchetto MSYS2 | SHA256 dell'archivio verificato |
| --- | --- |
| binutils 2.47-4 | `e36c52a7fe1d104c2efd97dc74162386eabf8323f6aeb9b83aeb574b291a7da0` |
| gettext-runtime 1.0-1 | `be68d7f260633284b910c588c6d82ee304a81c8817a686d2cd9df83f872c27af` |
| libwinpthread 14.0.0.r598.ge3d18511f-1 | `942a62a3ecafbb4f5a80016685a0e3002a8de903012eed49c213e4f5b693668a` |
| zlib 1.4-2 | `2a065fb3311d6c08bd2c7431a092b912ade08a83954474e06ea4eb0479d908cd` |
| zstd 1.5.7-2 | `1add6705b344664f6aca108c85f79ab5bdd9e1162662bb06a4cf40a34f6e0907` |
| libiconv 1.19.1-1 | `50e915aa36fdbe6c84acc8954e939275609ba051cdb4eeeff3884453c28efde0` |
| libgcc 16.2.0-7 | `6d1311b397ba33be542fd46bae3de60338bfd967e95e221847f01269e98983b8` |

Fonti: [catalogo binutils](https://packages.msys2.org/packages/mingw-w64-x86_64-binutils), [mirror mingw64](https://mirror.msys2.org/mingw/mingw64/). L'harness non scarica questi strumenti automaticamente.

**30/30 test**, zero fallimenti/skip, **47,8 secondi**, dopo aver risolto il prerequisito di sistema. I primi due tentativi erano **24/30** per dlltool assente e poi assembler assente; il tentativo con rustc in formato 8.3 era **1/30** per la ricerca dei CRT. Sono problemi dell'ambiente, non risultati nascosti degli esempi.

Estratti **due manifest e sette programmi Rust**: quattro validi eseguiti e tre programmi che compilano ma devono andare in panic. Progetti e target separati per Tokio, async-std e Tokio senza feature time. Tutti i compilabili usano le librerie costruite con Cargo --locked --offline; per gli errori di tipo si controlla la diagnostica JSON di rustc, per i panic si richiedono compilazione riuscita e messaggio runtime specifico.

Verificati: due worker reali, avanzamento multi-thread senza block_on, sospensione current-thread, enter senza polling, future radice con Rc/prestiti, requisiti Send/static, LocalSet e run_until, thread blocking distinto, Handle non proprietario e drop delle catture allo shutdown. Distinti Result applicativo e JoinError Tokio, rispetto all'output diretto dell'handle async-std. Tre correzioni dei panic e una compilazione senza time dimostrano la separazione fra feature Cargo e driver.

Cache riusata: `C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-tokio-cache-20261110`, estesa inizialmente alle crate legacy con fetch autorizzato. I lockfile restano nelle fixture temporanee: sono registrate le versioni effettive, ma non si promette la stessa risoluzione futura con una cache nuova.

Tokio: pin-project-lite 0.2.17, proc-macro2 1.0.107, quote 1.0.47, syn 3.0.10, tokio-macros 2.7.2, tokio 1.54.1, unicode-ident 1.0.27.

Risoluzione legacy riportata da cargo metadata (include package per altri target e non equivale alla lista delle crate effettivamente compilate su Windows):

```text
async-attributes@1.1.2, async-channel@1.9.0, async-channel@2.5.0,
async-executor@1.14.1, async-global-executor@2.4.1, async-io@2.6.0,
async-lock@3.5.0, async-std@1.13.2, async-task@4.7.1, atomic-waker@1.1.2,
autocfg@1.5.1, bitflags@2.13.2, blocking@1.7.0, bumpalo@3.20.4,
cfg-if@1.0.5, concurrent-queue@2.5.0, crossbeam-utils@0.8.23, errno@0.3.15,
event-listener-strategy@0.5.4, event-listener@2.5.3, event-listener@5.4.2,
fastrand@2.5.0, futures-channel@0.3.34, futures-core@0.3.34, futures-io@0.3.34,
futures-lite@2.6.1, futures-task@0.3.34, futures-util@0.3.34, gloo-timers@0.3.0,
hermit-abi@0.5.3, js-sys@0.3.107, kv-log-macro@1.0.7, libc@0.2.191,
linux-raw-sys@0.12.1, log@0.4.35, memchr@2.8.3, once_cell@1.21.4,
parking@2.2.1, pin-project-lite@0.2.17, pin-utils@0.1.1, piper@0.2.5,
polling@3.11.0, proc-macro2@1.0.107, quote@1.0.47, rustix@1.1.6,
rustversion@1.0.23, slab@0.4.12, syn@1.0.109, syn@3.0.10, tokio@1.54.1,
unicode-ident@1.0.27, value-bag@1.14.1, wasm-bindgen-futures@0.4.80,
wasm-bindgen-macro-support@0.2.130, wasm-bindgen-macro@0.2.130,
wasm-bindgen-shared@0.2.130, wasm-bindgen@0.2.130,
windows-link@0.2.1, windows-sys@0.61.2
```

Regressione seriale con Future (34) e Async/Await (36): **100/100**, zero fallimenti/skip, **107,6 secondi**. Le due suite precedenti usano `RUST_ASYNC_TEST_CARGO_HOME` e `RUST_ASYNC_TEST_FETCH`; selezionare la stessa cache e impostare fetch a 0.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-runtime.test.mjs _Meta/tests/rust-future.test.mjs _Meta/tests/rust-async-await.test.mjs
```

I processi hanno timeout; le fixture sono esterne al vault e rimosse solo dopo verifica di realpath, parent e prefisso. La suite verifica che i byte della nota non cambino. Un ritocco successivo di sola prosa precisa che il timer puo essere gia scaduto al polling; i programmi restano identici.

Suite rieseguita sulla nota finale: **30/30**, zero fallimenti/skip, **54,7 secondi**. Formattazione Prettier e git diff --check superati.

Totale **67 suite Rust**: altre 64 e altri linguaggi non rieseguiti. Limiti: un compilatore/target, nessun networking/database reale, benchmark, matrice MSRV, stress test di shutdown o prova esaustiva degli interleaving. Il multi-thread e davvero eseguito, ma non dimostra prestazioni; non e stata implementata una migrazione a smol. Controlli editoriali, build Quartz e approvazione dell'utente restano separati.

## Rust: select, join e cancellation

Decima nota di Concorrenza e Asincronia: **97/183 note principali Rust** revisionate. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**, Tokio **1.54.1**. Riusa `RUSTC_TEST_EXECUTABLE`, `RUST_ASYNC_TEST_CARGO_HOME` e `RUST_ASYNC_TEST_FETCH` delle suite Future/Async; in questa sessione fetch a 0 e cache dedicata gia popolata.

```powershell
node --test _Meta/tests/rust-select-cancellation.test.mjs
```

**36/36 test** al primo giro, zero fallimenti/skip, **35,0 secondi**. Estratti tutti i **nove blocchi**: manifest e otto programmi, sette eseguibili validi e uno che compila ma va intenzionalmente in panic. Nel controesempio sulla coppia di messaggi il successo del programma verifica la perdita logica prevista, non certifica l'algoritmo come sicuro.

Sonde aggiuntive: else rispetto a Pending, costruzione di rami disabilitati, pattern Err scartato, ordine dei risultati di join, try_join con errori e distruttori, effetti non annullati, Result annidati degli handle. Verificati task distaccate, risultato conservato con prestito, recv cancellation-safe rispetto alla composizione di due recv, correzione con pinning, send che elimina il valore e reserve che lo conserva all'esterno.

Test temporali senza soglie prestazionali: scadenze reali, durata zero con future pronta, breve sleep sincrono per mostrare che timeout non interrompe un poll. Gli interleaving critici usano canali e biased, non sleep usati come sincronizzazione. Verificati handler che non monitorano piu shutdown, abort dopo completamento e tipo Sleep non Unpin.

Diagnostica JSON per E0308, E0499 ed E0277; i panic richiedono compilazione riuscita, uscita non zero e messaggio specifico. Prima della regressione il caso Unpin e stato ristretto dichiarando il binding mutabile: non si affida anche a un errore di mutabilita. Nessun cambio alla nota dopo il primo giro.

Cargo costruisce le dipendenze --locked --offline in una fixture; rustc compila i programmi originali contro le stesse librerie. Risoluzione effettiva: tokio 1.54.1, tokio-macros 2.7.2, pin-project-lite 0.2.17, proc-macro2 1.0.107, quote 1.0.47, syn 3.0.10, unicode-ident 1.0.27. Lockfile temporaneo, non permanente: nessuna promessa di identica risoluzione futura con una cache nuova.

Regressione seriale con Future (34) e Runtime (30): **100/100**, zero fallimenti/skip, **132,8 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-select-cancellation.test.mjs _Meta/tests/rust-runtime.test.mjs _Meta/tests/rust-future.test.mjs
```

La regressione Runtime richiede anche le sue variabili `RUST_RUNTIME_TEST_CARGO_HOME`, `RUST_RUNTIME_TEST_FETCH` e, con la toolchain GNU incompleta, `RUST_RUNTIME_TEST_TOOLS_BIN`: riusati cache e binutils MSYS2 temporanei documentati nel blocco precedente. Nessun download, installazione o cambio alle dipendenze del sito.

Applicata la formattazione Prettier al ritocco del test Unpin; controllo finale Prettier e git diff --check superati. Nessun cambiamento semantico dopo la regressione.

Fixture esterna al vault con timeout dei processi, ambiente Cargo isolato, confronto dei byte della nota e cleanup dopo verifica di realpath, parent e prefisso. **68 suite Rust** totali: altre 65 e altri linguaggi non rieseguiti.

Limiti: una piattaforma/toolchain; nessun test di rete/database, segnali OS, CancellationToken, I/O parziale reale, fairness statistica, benchmark o verifica esaustiva degli interleaving. Le API descritte come varianti non sono tutte eseguite. I nuovi esempi sono current-thread; la regressione Runtime include anche i suoi casi multi-thread/legacy. Controlli editoriali, Quartz e approvazione dell'utente restano distinti.


## Rust: Async streams

Undicesima nota di Concorrenza e Asincronia, totale **98/183 note principali Rust**. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**, Tokio **1.54.1**, futures-util **0.3.34**, tokio-stream **0.1.19**.

```powershell
node --test _Meta/tests/rust-streams.test.mjs
```

Riusa `RUSTC_TEST_EXECUTABLE` per selezionare il compilatore e i relativi cargo/rustdoc. `RUST_STREAM_TEST_CARGO_HOME` indica una cache dedicata senza configurazioni Cargo personali; quella verificata e `C:/Users/SE-Luca Bellini/AppData/Local/Temp/appunti-tokio-cache-20261110`. Il default dell'harness e offline. Per popolare inizialmente la cache:

```powershell
$env:RUST_STREAM_TEST_FETCH = "1"
```

Per i giri successivi:

```powershell
$env:RUST_STREAM_TEST_FETCH = "0"
```

Estratti tutti i **dieci blocchi**: un manifest e nove programmi Rust, sette validi eseguiti e due rifiutati con E0277/E0034. **39 casi** totali. Primo giro **38/39** in **33,4 secondi**: una sonda aggiuntiva con poll_fn che va sempre in panic non aveva un Item inferibile univocamente. Aggiunto `Poll<Option<u32>>` alla fixture di take(0), senza cambiare i programmi della nota.

Regressione con Future (34) e select/cancellazione (36): **109/109**, zero fallimenti/skip, **101,8 secondi**. Le altre due suite usano `RUST_ASYNC_TEST_CARGO_HOME` e `RUST_ASYNC_TEST_FETCH`: impostare la stessa cache e fetch a 0.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-streams.test.mjs _Meta/tests/rust-select-cancellation.test.mjs _Meta/tests/rust-future.test.mjs
```

Dopo il ritocco editoriale delle tabelle, programmi invariati, nuova esecuzione della suite Stream **39/39**, zero fallimenti/skip, **34,9 secondi**.

Verificati helper con stream non Unpin, Rc e prestiti; map async che produce future ancora non eseguite; then sequenziale e buffer_unordered con limite 2. Per l'ordine, oneshot controllati distinguono buffered, che trattiene il secondo risultato pronto, da buffer_unordered, che lo emette subito.

ReceiverStream: polling Pending/Some/None, risveglio osservato con Waker contatore, send bloccato dalla capacita, close/drain con permit, clone del sender e drop del consumer. La sonda manuale di poll verifica il contratto senza costruire un executor; gli esempi completi sono guidati da Tokio.

Errori e lifecycle: try_next dopo Err sulla sorgente dimostrativa, try_collect che non visita gli elementi successivi, fuse che non ripolla l'interno, take(0), conservazione del receiver dopo select, distruzione delle future possedute dal buffer senza rollback. Boxing: input vuoto/Unicode, ordine, prestiti ancora validi, Rc consentito soltanto senza Send. Controlli diagnostici anche su E0597, E0308 ed E0599.

Dipendenze effettivamente risolte: futures-core 0.3.34, futures-task 0.3.34, futures-util 0.3.34, pin-project-lite 0.2.17, proc-macro2 1.0.107, quote 1.0.47, slab 0.4.12, syn 3.0.10, tokio-macros 2.7.2, tokio-stream 0.1.19, tokio 1.54.1, unicode-ident 1.0.27. Build --locked --offline e rustc contro le librerie prodotte; lockfile nella fixture temporanea, non permanente nel repository.

Controllati anche gli alias BoxStream/LocalBoxStream nel sorgente futures-core 0.3.34 della cache, per non dipendere soltanto dalla pagina web latest indicizzata ancora come 0.3.33. Nessuna dipendenza del sito, PATH o configurazione Cargo globale modificata.

Fixture esterna al vault, timeout dei processi, ambiente Cargo isolato, confronto dei byte della nota e cleanup dopo verifica di realpath, parent e prefisso. **69 suite Rust** totali, altre 66 e altri linguaggi non rieseguiti.

Limiti: un compilatore/target e runtime current-thread; nessun networking/database, misurazione delle allocazioni, stress test, benchmark, MSRV o prova esaustiva di scheduling. I limiti dei buffer sono verifiche funzionali, non misure di throughput. Controlli editoriali, Quartz e approvazione dell'utente restano distinti.


## Rust: Channel async

Dodicesima nota di Concorrenza e Asincronia, totale **99/183 note principali Rust**. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**, Tokio **1.54.1**.

Impostare RUSTC_TEST_EXECUTABLE sul rustc della toolchain verificata; cargo e rustdoc vengono cercati nella stessa directory. RUST_CHANNEL_TEST_CARGO_HOME seleziona una cache dedicata senza configurazioni Cargo personali. In questa revisione riusata offline la cache appunti-tokio-cache-20261110 gia presente.

```powershell
$env:RUST_CHANNEL_TEST_CARGO_HOME = "$env:LOCALAPPDATA/Temp/appunti-tokio-cache-20261110"
```

```powershell
$env:RUST_CHANNEL_TEST_FETCH = "0"
```

```powershell
node --test _Meta/tests/rust-channels.test.mjs
```

L'eventuale valore 1 di RUST_CHANNEL_TEST_FETCH permette il fetch iniziale; questa revisione non ha richiesto download. Il build resta --locked --offline. Il lockfile e temporaneo, non un pin permanente di tutte le dipendenze.

**41 casi**: tutti i dieci blocchi della nota, un manifest e nove programmi, sette validi e due compile-fail espliciti E0599/E0382. Primo giro **36/41** in **34,4 secondi**: cinque sonde watch confrontavano Result<bool, RecvError> con assert_eq!, ma RecvError non implementa PartialEq. Corrette undici asserzioni usando unwrap sul risultato atteso Ok; nessuna modifica agli esempi della nota.

Regressione con Async streams (39) e select/cancellazione (36): **116/116**, zero fallimenti/skip, **111,4 secondi**. Impostare anche RUST_STREAM_TEST_CARGO_HOME e RUST_ASYNC_TEST_CARGO_HOME sulla stessa cache, i rispettivi FETCH a 0.

Dopo il ritocco alle sole intestazioni della tabella, nuova esecuzione sulla nota finale **41/41**, zero fallimenti/skip, **38,2 secondi**; programmi invariati.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-channels.test.mjs _Meta/tests/rust-streams.test.mjs _Meta/tests/rust-select-cancellation.test.mjs
```

Verificati backpressure e send Pending, Empty/Disconnected, Full/Closed e payload recuperato, sender clonati, close/drain con permit, drop dei messaggi, unbounded e ponte sincrono con thread dedicato. Panic attesi per channel(0) e blocking_send da una task async.

Richiesta/risposta: abbandono del sender oneshot, errore applicativo distinto, invio senza runtime, drenaggio dopo comando Shutdown, risposta abbandonata senza annullare il job, caratteri Unicode invece di byte.

Broadcast: lag deterministico con capacita 2, due cursori, ripresa dopo perdita, subscribe senza storico, zero receiver e nuova sottoscrizione, bound Clone. Watch: stato iniziale visto, borrow contro borrow_and_update, ultima versione dopo chiusura, send fallito contro send_replace, invio uguale e send_if_modified, aggiornamento fra notifica e lettura, guard non Send attraverso await.

Cancellazione: helper reserve con stop pronto, sender stop eliminato e canale chiuso; priorita biased, valore restituito, drop di send pendente e recv perdente senza consumo. Rc locale accettato, spawn rifiutato. Sonde senza sleep per presumere un ordine di scheduling; polling manuale e messaggi ordinano i casi critici.

Dipendenze risolte: pin-project-lite 0.2.17, proc-macro2 1.0.107, quote 1.0.47, syn 3.0.10, tokio-macros 2.7.2, tokio 1.54.1, unicode-ident 1.0.27. Le regressioni usano le dipendenze delle rispettive sezioni.

Timeout dei processi, ambiente Cargo isolato, confronto dei byte della nota e cleanup dopo controllo di realpath, parent e prefisso. **70 suite Rust** totali; altre 67 e altri linguaggi non rieseguiti. Nessun cambio alle dipendenze del sito o alla configurazione globale.

Limiti: un compilatore/target, runtime current-thread e un ponte con thread OS; niente rete/database, stress, fairness statistica, durabilita, misure di memoria/prestazioni o matrice MSRV. Controlli editoriali, Quartz e approvazione dell'utente sono separati.

## Rust: Graceful shutdown

Tredicesima e ultima nota di Concorrenza e Asincronia: **100/183 note principali Rust**, **83 restanti**. Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**, Tokio **1.54.1**, tokio-util **0.7.20**.

RUSTC_TEST_EXECUTABLE indica il compilatore e seleziona cargo/rustdoc accanto a esso. RUST_SHUTDOWN_TEST_CARGO_HOME indica la cache dedicata; riusata appunti-tokio-cache-20261110. RUST_SHUTDOWN_TEST_FETCH=1 abilita soltanto il fetch iniziale; dopo il popolamento usare 0. Il build e --locked --offline.

Su Windows GNU, signal/windows-sys richiede anche dlltool e assembler. RUST_SHUTDOWN_TEST_TOOLS_BIN antepone la directory completa al PATH dei soli processi della suite. Riusati i binutils MSYS2 gia verificati nel blocco Runtime, senza installazioni o cambi di PATH globali.

```powershell
$env:RUST_SHUTDOWN_TEST_CARGO_HOME = "$env:LOCALAPPDATA/Temp/appunti-tokio-cache-20261110"
```

```powershell
$env:RUST_SHUTDOWN_TEST_FETCH = "0"
```

```powershell
$env:RUST_SHUTDOWN_TEST_TOOLS_BIN = "$env:LOCALAPPDATA/Temp/appunti-runtime-binutils-9239afa6a6ba401bad0bfa60d5a122b0/binutils-2.47-4/mingw64/bin"
```

```powershell
node --test _Meta/tests/rust-shutdown.test.mjs
```

**41 casi**, tutti gli otto blocchi estratti: un manifest, sei programmi validi e un compile-fail E0382. Primo tentativo **1/41**: solo struttura passata, quaranta fallimenti derivati dalla preparazione delle dipendenze per dlltool non nel PATH. Dopo aver configurato gli strumenti esistenti, **41/41**, zero fallimenti/skip, **48,8 secondi**. Gli esempi non sono stati modificati per aggirare il problema ambientale.

Copertura: watch true iniziale/non visto/nuovo subscriber, sender chiuso, true poi false e Err ripetutamente pronto. Worker con coda vuota, normale, cancellata, permit gia acquisito e stop durante process con drenaggio del job corrente e del buffer.

Token: clone, figlio, propagazione, cancellazione anticipata/ripetuta, drop che non cancella e waiter perso in select. TaskTracker: vuoto aperto, close/reopen condivisi, spawn dopo close, wait con task pendente e drop senza abort.

JoinSet/report: set vuoto, successi, errore applicativo, panic catturato, cancellazione gia richiesta, deadline scaduta con risultato pronto e task pendente, abort_all seguito da join, shutdown non equivalente a cleanup. Drop sincrono osservato dopo abort, handle preso in prestito nel timeout, handle distaccato e drop del set.

Trigger generico verificato con future iniettate riuscite/fallite e ramo esterno che non deve essere pollato. Il programma ctrl_c compila ed e eseguito **senza --listen**: non installa un listener nel percorso provato. Nessun Ctrl+C/SIGTERM reale inviato, nessun test degli handler Unix. Prova di spawn_blocking gia iniziato tramite canale di readiness e gate sincrono, liberato prima di attendere il risultato; nessun thread lasciato attivo.

Regressione mirata con Channel async (41) e select/cancellazione (36): **118/118**, zero fallimenti/skip, **120,0 secondi**. Per le altre due suite impostare RUST_CHANNEL_TEST_CARGO_HOME e RUST_ASYNC_TEST_CARGO_HOME sulla stessa cache, i rispettivi FETCH a 0.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-shutdown.test.mjs _Meta/tests/rust-channels.test.mjs _Meta/tests/rust-select-cancellation.test.mjs
```

Dipendenze risolte dal manifest: bytes 1.12.1, errno 0.3.15, futures-core 0.3.34, futures-macro 0.3.34, futures-sink 0.3.34, futures-task 0.3.34, futures-util 0.3.34, libc 0.2.191, mio 1.2.5, pin-project-lite 0.2.17, proc-macro2 1.0.107, quote 1.0.47, signal-hook-registry 1.4.8, slab 0.4.12, syn 3.0.10, tokio-macros 2.7.2, tokio-util 0.7.20, tokio 1.54.1, unicode-ident 1.0.27, wasi 0.11.1+wasi-snapshot-preview1, windows-link 0.2.1 e windows-sys 0.61.2. L'elenco comprende package di target non eseguiti; il lockfile rimane nella fixture temporanea, non e un pin permanente nel vault.

Timeout dei processi, ambiente Cargo isolato, confronto dei byte della nota e cleanup dopo controllo di realpath, parent e prefisso. **71 suite Rust** totali; altre 68 e altri linguaggi non rieseguiti. Nessuna dipendenza aggiunta al sito.

Limiti: un compilatore/target e runtime current-thread, piu un job blocking controllato. Timer reali senza misure prestazionali; nessun sleep usato per presumere l'avvio di altre task. Niente server reale, rete/database, persistenza, flush reale, MSRV, stress o prova esaustiva delle race. Non si tenta di fermare una task che monopolizza indefinitamente un thread. Verifiche editoriali, Quartz e approvazione dell'utente sono separate.

## Rust: const e static

Prima nota di Compile-Time e Type-Level Programming: **101/183 note principali Rust**, **82 restanti**. Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**; solo standard library, nessuna dipendenza aggiunta.

Impostare RUSTC_TEST_EXECUTABLE sul percorso completo del compilatore, oppure avere rustc nel PATH.

```powershell
node --test _Meta/tests/rust-const-static.test.mjs
```

**25/25 test**, zero fallimenti/skip, **11,9 secondi** al primo giro. Estratti dal Markdown tutti gli undici programmi: sette validi e quattro compile-fail, con diagnostiche JSON E0015, E0277, E0507 ed E0515.

Copertura: costanti associate/default/array, identita dello static, valori non Copy e Drop, LazyLock, mutex con thread, costante Cell indipendente e static unico in funzione generica. Sonde aggiuntive verificano inizializzatori const/static, correzioni con const fn o let, clone, ritorno per valore, promozione scalare, assenza di Drop dello static a uscita normale, allocazioni distinte di dimensione non nulla, durata oltre una chiamata, lint static_mut_refs e bound T: 'static.

Regressione con OnceLock/LazyLock (62 casi): **87/87**, zero fallimenti/skip, **42,5 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-const-static.test.mjs _Meta/tests/rust-once-lazy.test.mjs
```

Fixture temporanee, timeout dei processi, ambiente dei figli ripulito, frontmatter confrontato con HEAD e byte della nota preservati. Cleanup limitato a realpath, parent e prefisso verificati. La sonda static mut e solo compile-fail: nessuna esecuzione di accessi unsafe.

Limiti: un compilatore/target, nessuna matrice MSRV/edition, Miri, FFI, embedded, assembly o misura delle copie fisiche. Non si assume che due riferimenti a una const abbiano indirizzi diversi. Nessun benchmark, stress o prova esaustiva degli interleaving. **72 suite Rust** totali; altre 70 e altri linguaggi non rieseguiti. Controlli del sito e approvazione dell'utente restano separati.

## Rust: const fn

Seconda nota di Compile-Time e Type-Level Programming: **102/183 note principali Rust**, **81 restanti**. Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**; sola standard library.

Impostare RUSTC_TEST_EXECUTABLE sul percorso completo del compilatore, oppure avere rustc nel PATH.

```powershell
node --test _Meta/tests/rust-const-fn.test.mjs
```

La suite estrae tutti i dieci programmi del Markdown: sei validi e quattro compile-fail con E0015, E0435 ed E0080. Il primo giro era **38/39**, **18,2 secondi**: errata l'aspettativa di una sonda sull'overflow, non il comportamento degli esempi della nota.

Verifica mirata **7/7**, **3,4 secondi**: dentro una const fn chiamata da una costante, la moltiplicazione u8 con overflow viene rifiutata con overflow-checks=yes ma fa wrap con overflow-checks=no sulla baseline. L'operazione diretta nell'inizializzatore resta rifiutata anche con controlli disabilitati; checked_mul restituisce None in entrambi i casi. L'osservazione e documentata come risultato della toolchain, non come contratto da sfruttare.

Prima regressione **68/68**, **29,7 secondi**. Dopo aver allineato la tabella alla funzione double e aggiunto il relativo test, suite finale **44/44**, inclusa nella regressione con const/static (25 casi): **69/69**, zero fallimenti/skip, **33,8 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-const-fn.test.mjs _Meta/tests/rust-const-static.test.mjs
```

Copertura: const/static/array e argomenti CLI reali; parsing valido/rifiutato, costruttori con Option e assert, limiti numerici, campi privati, Default, rimozione di const, cicli locali, blocchi generici, mutazione tramite riferimento e Drop non ammesso. Provati panic runtime in processi figli, distinti dalle diagnostiche del compilatore; assert verificato anche con opt-level=3 e debug-assertions=no.

Fixture temporanee, timeout, ambiente dei figli ripulito, YAML confrontato con HEAD e byte della nota preservati. Cleanup limitato al realpath con parent/prefisso verificati; nessuna installazione o modifica alle dipendenze del sito.

Limiti: un compilatore/target, nessuna matrice MSRV/edition, cross-compilazione, Miri, assembly o benchmark. I flag rustc provati non costituiscono un nuovo collaudo completo dei profili Cargo. **73 suite Rust** totali; le altre 71 e gli altri linguaggi non rieseguiti. Controlli del sito e approvazione dell'utente separati.

## Rust: Const generics

Terza nota di Compile-Time e Type-Level Programming: **103/183 note principali Rust**, **80 restanti**. Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**; sola standard library.

Impostare RUSTC_TEST_EXECUTABLE sul percorso completo del compilatore, oppure avere rustc nel PATH.

```powershell
node --test _Meta/tests/rust-const-generics.test.mjs
```

La suite estrae gli undici programmi del Markdown: sette validi e quattro compile-fail. Per i rifiuti verifica E0308, E0435 oppure il messaggio dell'errore, dove non viene emesso un codice specifico.

Primo giro con const fn **91/91**, **20,6 secondi**. Precisata poi la regola Copy per le ripetizioni di lunghezza concreta 0 e 1 e aggiunte due sonde: valutazione unica dell'espressione ordinaria anche a lunghezza zero, mancata valutazione del blocco const nel caso vuoto. Suite finale **49/49**, inclusa nella regressione con const fn (44 casi): **93/93**, zero fallimenti/skip, **22,3 secondi**.

```powershell
node --test _Meta/tests/rust-const-generics.test.mjs _Meta/tests/rust-const-fn.test.mjs
```

Copertura: buffer e default, inferenza e argomenti equivalenti, tipi di lunghezza diversa, matrici vuote e non Copy, from_fn e ordine delle chiamate, ripetizione ordinaria/inline const, UTF-8 valido e invalido, campi privati, prestito slice-array e lifetime. Provati i quattordici tipi const ammessi, bool, float/str rifiutati, N + 1 e tentativi con graffe/blocco const/const fn, item annidati e Default per array di 32 rispetto a 33 elementi.

Fixture temporanee, timeout, ambiente dei figli ripulito, YAML confrontato con HEAD e byte della nota preservati. Cleanup limitato al realpath con parent/prefisso verificati; nessuna installazione o modifica alle dipendenze del sito.

Limiti: un compilatore/target, nessuna matrice MSRV/edition, feature nightly, Miri, cross-compilazione, assembly o benchmark. Le date di stabilizzazione sono documentate dalle fonti, non verificate eseguendo toolchain storiche. **74 suite Rust** totali; altre 72 e altri linguaggi non rieseguiti. Controlli del sito e approvazione dell'utente separati.

## Rust: PhantomData

Quarta nota di Compile-Time e Type-Level Programming: **104/183 note principali Rust**, **79 restanti**. Baseline **Rust 1.99.1**, edition **2024**, **x86_64-pc-windows-gnu**, Node **24.14.0**; sola standard library.

Impostare RUSTC_TEST_EXECUTABLE sul percorso completo del compilatore, oppure avere rustc nel PATH.

```powershell
node --test _Meta/tests/rust-phantom-data.test.mjs
```

La suite estrae undici programmi dal Markdown: cinque validi e sei compile-fail con E0392, E0308, E0515, E0277 ed E0505.

Primo giro **41/51**, **19,5 secondi**: gli undici programmi originali passavano; nove fallimenti dipendevano dal controllo della tabella, che il parser CommonMark tratta come paragrafo, e uno da un'aspettativa errata su Unpin. Corretti il controllo AST e la prosa: nella baseline PhantomData<PhantomPinned> non e Unpin, mentre la forma con function pointer lo e.

Suite finale **51/51**, inclusa nella regressione con Lifetimes avanzati (62 casi): **113/113**, zero fallimenti/skip, **38,6 secondi**. Dopo aver ridotto la tabella a due colonne per la lettura mobile, ricontrollo strutturale **1/1**; programmi Rust invariati.

```powershell
node --test _Meta/tests/rust-phantom-data.test.mjs _Meta/tests/rust-advanced-lifetimes.test.mjs
```

Gli otto gruppi Send/Sync verificano 48 combinazioni delle forme della tabella con String, Rc e Cell. Gli otto gruppi di varianza compilano 16 firme nei due versi. Queste compilazioni interne non si sommano ai 51 test Node.

Ulteriori prove: dimensione/allineamento, Copy/Clone/Default, assenza di costruzione/distruzione del tipo etichetta, ID ai limiti numerici, campi privati, slice vuote/non Copy/ZST, prestiti e mutazioni, raw pointer non Send/Sync, puntatore estratto senza dereferenziazione, PhantomPinned, correzioni dei controesempi e drop check con/senza Drop. Nessun blocco unsafe, thread o risorsa esterna eseguito.

Fixture temporanee, timeout, ambiente dei figli ripulito, YAML confrontato con HEAD e byte della nota preservati. Cleanup limitato al realpath con parent/prefisso verificati; nessuna installazione o modifica alle dipendenze del sito.

Limiti: un compilatore/target, nessuna matrice MSRV/edition, nightly, may_dangle, FFI, Miri, assembly o benchmark; non una dimostrazione di sicurezza di wrapper unsafe. **75 suite Rust** totali; altre 73 e altri linguaggi non rieseguiti. Controlli del sito e approvazione dell'utente separati.

## Rust: Marker types

Quinta nota di **Compile-Time e Type-Level Programming**. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**; sola standard library, nessuna nuova dipendenza.

Con la stessa variabile RUSTC_TEST_EXECUTABLE dei blocchi precedenti:

```powershell
node --test _Meta/tests/rust-marker-types.test.mjs
```

**42/42 test al primo giro**, zero fallimenti/skip, **17,5 secondi**. Sette programmi estratti dal Markdown: quattro validi e tre compile-fail con E0308, E0599 ed E0277.

Verificati marker abitabili/non abitabili, alias, quantita finite non negative, zero negativo, subnormali, valori massimi, NaN/infinita, somma e conversione con overflow controllato. Le prove dei tipi usano anche l'API completa, non soltanto i controesempi ridotti.

Per la validazione: estremi 3/32 byte, lunghezze rifiutate, tutti i 128 byte ASCII, Unicode/spazi, precedenza degli errori, contenuto e buffer della String preservati, recupero dell'input e perdita del contratto con into_inner. Provati costruttori e campi privati, metodi limitati allo stato corretto, assenza di mutazione attraverso as_str e consumo di Raw.

Buffer: testo vuoto/Unicode, append, freeze senza clonare il buffer, consumo del vecchio stato, divieto di append in ReadOnly, supertrait sealed e privacy del modulo. Scelta runtime fra tipi diversi rifiutata; alternativa con enum eseguita. Verificate anche le correzioni esplicite dei tre controesempi.

Regressione seriale con PhantomData (51 casi): **93/93**, zero fallimenti/skip, **62,4 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-marker-types.test.mjs _Meta/tests/rust-phantom-data.test.mjs
```

Harness con diagnostiche JSON, timeout, ambiente dei figli ripulito, confronto YAML con HEAD e controllo dei byte della nota; cleanup solo della directory temporanea con realpath/parent/prefisso verificati. La tabella GFM e controllata come paragrafo CommonMark e separatamente nel browser.

Limiti: un compilatore/target, nessuna matrice MSRV/edition, nightly, Miri, assembly, benchmark, autenticazione, rete o permessi OS. Il sealed e provato da un modulo esterno nella stessa crate, non con una seconda crate downstream; il caso libreria e supportato dalla fonte ufficiale. Nessun conteggio globale delle allocazioni. Totale 76 suite Rust; altre 74 e altri linguaggi non rieseguiti.

## Rust: Newtype pattern

Sesta nota di **Compile-Time e Type-Level Programming**. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**; sola standard library, nessuna nuova dipendenza. Usa la stessa variabile RUSTC_TEST_EXECUTABLE dei blocchi precedenti.

```powershell
node --test _Meta/tests/rust-newtype-pattern.test.mjs
```

**47/47 test al primo giro**, zero fallimenti/skip, **19,8 secondi**. Tutti gli otto programmi sono estratti dal Markdown: cinque validi e tre compile-fail con E0308, E0117 ed E0603.

Identificatori: limiti, Copy/Clone/Eq/Hash/Debug, domini incompatibili, alias e assenza di conversioni implicite. NonEmptyString: vuoto/spazi/NUL/Unicode, byte rispetto a caratteri, buffer preservato, aggiornamento atomico rispetto alla validazione, Clone indipendente, TryInto, AsRef e consumo con into_inner.

Sonde negative e controprove dimostrano come un derive Default o un getter mutabile possano violare la policy, e come From possa entrare in conflitto con TryFrom. Verificati privacy, assenza di clear e di coercione automatica, vista non mutabile e uso dopo move.

Temperature: risultati esatti, errori frazionari/range, valori negativi ed estremi; **20.053 input per esecuzione** confrontati con un calcolo separato in i128, anche vicino alle frontiere del risultato. Prova ripetuta con opt-level=3 e overflow-checks=no. La vecchia formula mostra troncamento e panic con overflow-checks=yes; non si tratta di una matrice di profili Cargo.

DisplayList: vuoto, Unicode senza escaping, propagazione degli errori del writer, lifetime della vista e assenza di Display sul Vec originale. Orphan rule verificata anche con alias e con trait locale su tipo esterno. Transparent: dimensione/allineamento, marker ZST, due campi numerici rifiutati, nessuna conversione implicita.

Regressione seriale con Marker types (42 casi): **89/89**, zero fallimenti/skip, **40,5 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-newtype-pattern.test.mjs _Meta/tests/rust-marker-types.test.mjs
```

Harness con timeout, diagnostiche JSON, ambiente dei figli ripulito, confronto YAML con HEAD, byte delle note preservati e cleanup con realpath/parent/prefisso verificati. Le sonde aggiuntive sono distinte dagli esempi originali; le verifiche interne non si sommano ai 47 gruppi Node.

Limiti: un compilatore/target, nessuna matrice MSRV/edition, nightly, Miri, benchmark, assembly o chiamata FFI. Nessuna crate downstream separata o deserializzazione reale; nessuna prova esaustiva del dominio i32 o conteggio globale delle allocazioni. Totale 77 suite Rust; altre 75 e altri linguaggi non rieseguiti.

## Rust: Typestate pattern

Settima nota di **Compile-Time e Type-Level Programming**. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**; sola standard library. Stessa variabile RUSTC_TEST_EXECUTABLE dei blocchi precedenti, nessuna nuova installazione.

```powershell
node --test _Meta/tests/rust-typestate-pattern.test.mjs
```

**46/46 test al primo giro**, zero fallimenti/skip, **18,5 secondi**. Cinque programmi estratti dal Markdown: due validi in memoria e tre compile-fail con E0599, E0382 ed E0308.

Post: ordine degli errori, stringhe vuote/whitespace ASCII e Unicode, U+200B/NUL, contenuto non normalizzato, buffer preservati, recupero dopo errore, ritiro/modifica/ripubblicazione. Verificati Debug che espone anche le bozze, privacy, costruttori e metodi disponibili, Clone assente, uso dopo move e prestiti ancora attivi.

Collezione mista con enum e match, differenza tra assegnazione e shadowing. Builder: tutti i valori u8 prima/dopo il nome, default, recupero della configurazione in Err, dati contenuti nello stato Named, campi privati, build assente nello stato Missing e consumo nelle transizioni.

Sonde separate per Drop generico che impedisce il move dei campi, Drop specializzato rifiutato, risorsa RAII interna, abbandono del flusso e forget di una sonda ZST senza risorse. Un writer in memoria dimostra errore dopo scrittura parziale e duplicazione del prefisso con retry completo; nessuna connessione o file reale.

Dopo il primo giro aggiunto un controllo AST contro generici interpretati come HTML, proteggendo anche i tipi nel testo della nota. Programmi Rust invariati. Regressione seriale con Newtype pattern (47 casi): **93/93**, zero fallimenti/skip, **45,4 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-typestate-pattern.test.mjs _Meta/tests/rust-newtype-pattern.test.mjs
```

Harness con timeout, diagnostiche JSON, ambiente dei figli ripulito, confronto YAML con HEAD e byte della nota preservati; cleanup limitato a directory temporanee con realpath/parent/prefisso verificati. Sonde e correzioni sono distinte dai blocchi originali; le verifiche interne non si sommano ai 46 gruppi Node.

Limiti: un compilatore/target, nessuna matrice MSRV/edition, nightly, Miri, benchmark, assembly o FFI. Nessuna rete, transazione database, cancellazione async o autorizzazione reale; writer simulato e sonde Drop non certificano protocolli esterni. Totale 78 suite Rust; altre 76 e altri linguaggi non rieseguiti.

## Rust: Zero-sized types

Ultima nota di **Compile-Time e Type-Level Programming (8/8)**. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**; sola standard library. Stessa variabile RUSTC_TEST_EXECUTABLE dei blocchi precedenti, nessuna installazione.

```powershell
node --test _Meta/tests/rust-zero-sized-types.test.mjs
```

**37/37 test al primo giro**, zero fallimenti/skip, **17,9 secondi**. Sei programmi estratti dal Markdown: quattro validi e due compile-fail con E0382 ed E0308.

Layout: dimensione/allineamento degli array ZST e vuoti, padding di Envelope, offset del marker allineato, PhantomData distinto dal campo reale, riferimenti non nulli e allineati. Nessuna assunzione di indirizzi unici per istanze separate.

Formato: composizione JSON/TOML dei nomi, nomi vuoti/separatori/Unicode non validati, risultati indipendenti, buffer trasferito e distinzione fra tipi generici; trait necessario e nessun valore F costruito o distrutto dal marker.

Collezioni: capacita massima senza elementi, clear e riuso, truncate/remove, iteratore consumato parzialmente, conteggio delle visite e distruttori. Box allineato con contenuto ZST; move non anticipa Drop, forget lo evita, Copy con Drop e rifiutato.

Abitabilita: Void non costruibile, contenitori vuoti e PhantomData costruibili, match infallibile su tutti i valori u16; enum con una/piu varianti, closure e function item distinti dal function pointer. Correzioni dei compile-fail con Copy, borrowing ed enum runtime.

Regressione seriale con Typestate pattern (46 casi): **83/83**, zero fallimenti/skip, **40,2 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-zero-sized-types.test.mjs _Meta/tests/rust-typestate-pattern.test.mjs
```

Harness con timeout, diagnostiche JSON, ambiente dei figli ripulito, confronto YAML con HEAD, controllo AST contro HTML involontario e byte della nota preservati; cleanup limitato a directory temporanee con realpath/parent/prefisso verificati. Sonde aggiuntive e correzioni restano distinte dai programmi originali.

Limiti: un compilatore/target, nessuna matrice MSRV/edition, nightly, Miri, assembly, benchmark o FFI. Nessun allocator strumentato: assenza di allocazione per buffer ZST/Box deriva dal contratto documentato, non da misure globali. Nessun file JSON/TOML, serializzazione o rete reale; contatore thread-local senza worker aggiuntivi, nessuna prova di abort o uscita del processo. Totale **79 suite Rust**; altre 77 e altri linguaggi non rieseguiti. Build Quartz e QA browser sono controlli separati.


## Rust: Macro dichiarative

Prima nota di **Macros (1/6)**. Baseline **Rust 1.99.1**, target **x86_64-pc-windows-gnu**, Node **24.14.0**; edition 2024 per i programmi, sonde selezionate anche 2018/2021. Sola standard library, stessa variabile RUSTC_TEST_EXECUTABLE dei blocchi precedenti, nessuna installazione.

```powershell
node --test _Meta/tests/rust-declarative-macros.test.mjs
```

Otto programmi estratti dal Markdown: cinque validi e tre compile-fail su ambiguita, follow-set e forwarding opaco. Primo giro **51/53**, **23,7 secondi**: i due fallimenti erano regex delle diagnostiche (for invece di after), non divergenze del compilatore dal comportamento descritto. Corretti i controlli e aggiunta una sonda async; suite finale di **54 casi**.

Log: Debug, move di String, conservazione del buffer e hygiene locale. Vec: zero/uno/molti elementi, virgola finale/isolata, tipo omogeneo, inferenza, ordine e valutazione singola senza Clone, collisione del nome Vec e vecchio matcher permissivo.

Ensure: tutti i valori u16, condizione singola e messaggio lazy, conversione Into, ritorno da closure/blocco ordinario/async e assenza di rollback. Il blocco async non contiene await: un singolo poll con Waker::noop, senza executor o rete.

Macro esportata estratta e compilata come rlib, con chiamante distinto e nome rinominato: radice della crate, use, dollar-crate, visibilita di modulo/helper e doc(hidden) non equivalente a privato. Sonde incrociate sulle edition di definizione/chiamata; expr, expr_2021, underscore, const block, pat e pat_param.

Altri casi: ordine dei bracci senza fallback sui tipi, scope testuale, cardinalita delle ripetizioni, generazione di item, compile_error e correzioni dei tre compile-fail. I test AST evitano HTML involontario; confronto YAML con HEAD ammette solo il trasferimento di Hygiene da prerequisites a related.

Regressione seriale con Zero-sized types (37 casi): **91/91**, zero fallimenti/skip, **49,4 secondi**; include tutti i **54/54** casi della suite finale.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-declarative-macros.test.mjs _Meta/tests/rust-zero-sized-types.test.mjs
```

Harness con timeout, diagnostiche JSON, ambiente dei figli ripulito e byte della nota preservati; cleanup limitato a directory temporanee con realpath/parent/prefisso verificati. Sonde aggiuntive e correzioni restano distinte dai programmi originali.

Limiti: un compilatore/target; confronti mirati di edition, non matrice completa o certificazione MSRV. Nessun nightly, Miri, benchmark, macro expansion snapshot o lint generale per macro. Nessuna dipendenza esterna, proc macro, rete o validazione reale della disponibilita delle porte. Totale **80 suite Rust**; altre 78 e altri linguaggi non rieseguiti. Build e browser QA separati.


## Rust: Procedural macros

Seconda nota di **Macros (2/6)**. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Workspace reale con crate proc-macro e chiamante: syn **3.0.10**, quote **1.0.47**, proc-macro2 **1.0.107**, unicode-ident **1.0.27**.

Imposta RUSTC_TEST_EXECUTABLE come nei blocchi precedenti. RUST_PROC_TEST_CARGO_HOME deve indicare una cache Cargo gia popolata con queste versioni e i relativi metadati di registry; il test non scarica dipendenze. In questa sessione e stata riusata la cache delle prove Tokio, senza installazioni o modifiche al package-lock del sito. Per predisporre una nuova cache, usa il workspace descritto nella nota e un registry affidabile prima di eseguire la suite.

Su Windows GNU, se dlltool e as non sono risolvibili, RUST_PROC_TEST_TOOLS_BIN puo indicare la cartella dei binutils gia installati. Viene aggiunta soltanto al PATH dei processi della suite.

```powershell
node --test _Meta/tests/rust-procedural-macros.test.mjs
```

**29/29 gruppi**, zero fallimenti/skip, **27,3 secondi**. Inclusi build/run del demo, due test Rust dell'helper e cargo check del workspace. I due test Rust non sono conteggiati come ulteriori gruppi Node.

Copertura: tre errori intenzionali con diagnostiche JSON e span del chiamante, struct unit/tuple/generiche, enum vuote/generiche, default di tipo/const, lifetime, tipi unsized e where con tipi associati. Nessun bound Clone/Debug aggiunto, campi conservati, nomi non globalmente unici, collisioni e stringify locale.

Identity: move, effetti singoli, posizioni item/tipo/pattern ed errori di tipo. Keep_item: argomenti rifiutati, visibilita/generics/attributi conservati, combinazione con derive. Dipendenza rinominata verificata nel manifest Cargo; normale export pubblico e uso della macro nella crate di definizione rifiutati.

La sonda che ripristina il vecchio impl senza generics deve fallire; i sorgenti temporanei vengono ripristinati anche dopo gli errori e la baseline viene compilata/eseguita di nuovo alla fine. I file delle note non sono modificati dai test.

Regressione seriale con Macro dichiarative (54 casi): **83/83**, zero fallimenti/skip, **49,2 secondi**.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-declarative-macros.test.mjs _Meta/tests/rust-procedural-macros.test.mjs
```

Cargo opera offline con lockfile temporaneo, creato dalla cache prima della build; verifica le versioni risolte. Ambiente dei figli ripulito, configurazioni Cargo ereditate rifiutate, timeout e cleanup con realpath/parent/prefisso verificati. I tre manifest e i sei blocchi Rust sono estratti dalla nota, non mantenuti come implementazioni parallele.

Limiti: un compilatore/target e una risoluzione dipendenze, non una matrice MSRV/versioni o un audit di supply chain. Nessun cross-target, nightly, Miri, benchmark o certificazione di hygiene universale. Il test del nome di dipendenza riguarda questo demo senza crate runtime separata. Totale **81 suite Rust**, altre 79 e altri linguaggi non rieseguiti. Build Quartz e QA browser separate.

## Rust: Derive macros

Terza nota di **Macros (3/6)**. Baseline **Rust 1.99.1**, edition **2024**, target **x86_64-pc-windows-gnu**, Node **24.14.0**. Workspace con tre crate: trait e re-export, macro, chiamante con dipendenza rinominata.

La suite usa RUSTC_TEST_EXECUTABLE come i blocchi precedenti. Servono due cache gia popolate:

- RUST_DERIVE_TEST_CARGO_HOME: syn **3.0.10**, quote **1.0.47**, proc-macro2 **1.0.107**, unicode-ident **1.0.27**, come per Procedural macros.
- RUST_DERIVE_TEST_ERROR_CARGO_HOME: cache del manifest error-guide della nota thiserror e anyhow; thiserror/thiserror-impl **2.0.21**, anyhow **1.0.104**, syn **3.0.9**, quote **1.0.47**, proc-macro2 **1.0.107**, unicode-ident **1.0.27**.

Nessun download automatico. Per nuove cache prepara prima i progetti documentati usando sorgenti affidabili. Nella sessione sono state riusate le cache Tokio ed Errori gia presenti, senza installazioni o cambi al lockfile del sito. RUST_DERIVE_TEST_TOOLS_BIN opzionale aggiunge dlltool/as soltanto al PATH dei processi figli Windows GNU.

```powershell
node --test _Meta/tests/rust-derive-macros.test.mjs
```

**40 gruppi**: quattro manifest e dieci blocchi Rust estratti dal Markdown. Workspace custom compilato/eseguito, due test Rust dell'helper, check completo, programma standard con rustc e programma thiserror col manifest estratto dalla nota collegata. I due test Rust sono inclusi, non sommati ai gruppi Node.

Copertura: rename/skip/crate_path, default dei nomi, raw identifier, Unicode/spazi, ordine dei campi, struct vuote, campi tutti esclusi ma ancora accessibili, nessuna redazione di Debug. Generics con default, where/tipi associati, lifetime non static, unsized e tipi senza Clone/Debug.

Diagnostiche: typo con span, opzioni duplicate anche tra attributi separati, tipo sintattico errato, valori mancanti, posizioni non supportate, nomi campo duplicati e skip/rename in conflitto. Tuple/unit struct, enum e union esplicitamente rifiutati dal demo. Alias Cargo con override, percorso default e alias interno; errore senza override, helper senza derive, impl duplicati e regressione che riemette l'item originale.

Primo giro: **39/40**, **32,0 secondi**. L'array atteso delle versioni thiserror era ordinato male; corretto il controllo, non il codice Rust. Questo errore avveniva prima dell'esecuzione del demo thiserror.

Regressione seriale finale con Procedural macros: **69/69**, zero fallimenti/skip, **66,7 secondi**; include tutti i **40/40** casi nuovi e il demo thiserror realmente eseguito. Configura anche le variabili RUST_PROC_TEST_CARGO_HOME e RUST_PROC_TEST_TOOLS_BIN della suite precedente.

```powershell
node --test --test-concurrency=1 _Meta/tests/rust-procedural-macros.test.mjs _Meta/tests/rust-derive-macros.test.mjs
```

Cargo offline con lockfile temporanei e versioni risolte controllate; ambiente ripulito, configurazioni Cargo ereditate rifiutate, timeout, diagnostiche JSON, sorgenti delle sonde ripristinati e cleanup con realpath/parent/prefisso verificati. Nessuna modifica delle note da parte della suite.

Limiti: un compilatore/target e due risoluzioni note, non matrice MSRV/versioni, audit supply chain o verifica cross-target. Nessun serializer reale, I/O applicativo, protezione di credenziali, nightly, Miri o benchmark. Il demo custom gestisce metadati di struct nominate, non tutte le forme che il linguaggio consente per derive. Totale **82 suite Rust**, altre 80 e altri linguaggi non rieseguiti. Build Quartz e browser QA separati.

## Rust: Attribute macros

`rust-attribute-macros.test.mjs` ricostruisce il package della nota da Cargo.toml, src/lib.rs ed examples/counter.rs in una directory temporanea. Usa le stesse variabili di Procedural macros: RUSTC_TEST_EXECUTABLE, RUST_PROC_TEST_CARGO_HOME (cache popolata per syn 3.0.10 e quote 1.0.47) e, se necessari su Windows GNU, i binutils in RUST_PROC_TEST_TOOLS_BIN. Cargo lavora offline e usa un lockfile temporaneo.

```powershell
node --test _Meta/tests/rust-attribute-macros.test.mjs
```

15 casi: esempio pubblicato, future portato da Pending a Ready, ordine di due attributi, panic dell'hook e undici diagnostiche nel chiamante. Le varianti Actix Web e tracing sono riferimenti documentali: la suite non avvia server, subscriber o executor. Regressione del 18 novembre con i 40 casi di Derive macros: **55/55**.

## Rust: Function-like macros

`rust-function-like-macros.test.mjs` ricostruisce il package dai blocchi della nota: manifest, libreria proc-macro ed esempi query e maps. Usa la stessa toolchain, la cache Cargo e le variabili della sezione Attribute macros. Cargo genera un lockfile temporaneo offline e lo usa per le prove successive.

```powershell
node --test _Meta/tests/rust-function-like-macros.test.mjs
```

15 casi: entrambi i programmi, ordine degli effetti e move nella mappa, dodici compilazioni che devono fallire con la diagnostica attesa nel chiamante. Coprono sintassi della DSL, duplicati, token residui, tipo dell'espansione, virgola isolata e inferenza sulla mappa vuota. La suite non verifica SQL rispetto a un database. Regressione con Attribute macros: **30/30**.

## Rust: Hygiene

`rust-hygiene.test.mjs` ricostruisce dai blocchi della nota un chiamante, una libreria con macro dichiarative e una libreria proc-macro. Usa la toolchain e la cache offline della sezione Attribute macros.

```powershell
node --test _Meta/tests/rust-hygiene.test.mjs
```

Dieci casi controllano quali nomi sono visibili dopo l'espansione, la risoluzione con `$crate` quando la dipendenza ha un alias, il limite imposto da un costruttore privato e la differenza osservabile fra `Span::call_site()` e `Span::mixed_site()`.

## Rust: Unsafe Rust

`rust-unsafe-rust.test.mjs` esegue i tre blocchi Markdown con rustdoc (edition 2024), controlla le diagnostiche per i blocchi unsafe e i prestiti, poi compila il wrapper della nota in modalità ottimizzata e lo confronta con `split_at_mut`. Richiede rustc, rustdoc e un linker; non usa Cargo né dipendenze esterne Rust.

```powershell
node --test _Meta/tests/rust-unsafe-rust.test.mjs
```

Il confronto include slice vuote, estremi, elementi non Copy, tipi di dimensione zero e il panic fuori intervallo. I test non eseguono operazioni con precondizioni violate e non sostituiscono una verifica degli invarianti.

## Rust: Raw pointers

Per eseguire i quattro esempi così come appaiono nella nota:

```powershell
rustdoc --test --edition 2024 "Programmazione/Rust/Pagine/Raw pointers.md"
```

La suite esegue gli stessi esempi anche con ottimizzazioni, poi confronta gli accessi per indice con `get().copied()`, controlla il contratto nullo/non nullo su sottoslice vuote e non vuote e legge valori noti da un campo packed. Serve rustdoc con un linker; non richiede Miri o una libreria C.

```powershell
node --test _Meta/tests/rust-raw-pointers.test.mjs
```

## Rust: Unsafe functions

`rust-unsafe-functions.test.mjs` esegue i quattro esempi estratti dalla nota con rustdoc in edition 2024, con e senza ottimizzazioni. Due prove di sola compilazione usano rustc per verificare che un prestito non possa sfuggire al proprietario e che anche una chiamata valida a una funzione unsafe richieda un blocco da codice safe. Non occorrono librerie C.

```powershell
node --test _Meta/tests/rust-unsafe-functions.test.mjs
```

## Rust: Unsafe traits

La suite esegue con rustdoc i tre esempi della nota, con e senza ottimizzazioni. Tre prove di sola compilazione controllano le diagnostiche per un'impl priva di `unsafe` (E0200), un wrapper con `Cell<u32>` richiesto come `Sync` e un wrapper con `Rc<u32>` richiesto come `Send` (E0277). Non viene eseguita un'implementazione che viola il contratto.

```powershell
node --test _Meta/tests/rust-unsafe-traits.test.mjs
```

## Rust: Invariants

La suite esegue con rustdoc i tre esempi della nota in edition 2024, con e senza ottimizzazioni. In modalità ottimizzata verifica le 25.856 combinazioni di valore iniziale e input per `Percent::set` e lo stato del vettore dopo un panic della callback. Due prove di sola compilazione controllano la privacy del campo (E0616) e la durata del prestito (E0515).

```powershell
node --test _Meta/tests/rust-invariants.test.mjs
```

## Rust: Aliasing rules

La suite esegue i quattro esempi della nota con rustdoc in edition 2024, con e senza ottimizzazioni. Due programmi di sola compilazione controllano l'uso prematuro del prestito originale (E0503) e le doppie indicizzazioni mutabili (E0499). Una prova aggiuntiva verifica `split_two` su slice di String e su elementi di dimensione zero. La suite non esegue accessi con precondizioni violate e non richiede Miri.

```powershell
node --test _Meta/tests/rust-aliasing-rules.test.mjs
```

## Rust: Undefined behavior

La suite esegue con rustdoc i tre esempi pubblicati, con e senza ottimizzazioni. Verifica il parser su tutti i 256 byte e su un campo assente; in modalità ottimizzata confronta `None` con il panic dell'indicizzazione safe fuori intervallo (con unwinding). Non provoca UB e non richiede Miri.

```powershell
node --test _Meta/tests/rust-undefined-behavior.test.mjs
```

## Rust: Miri

La suite ricostruisce una crate temporanea senza dipendenze dal blocco `src/lib.rs` della nota ed esegue i due unit test. Per impostazione predefinita usa Cargo nativo e salta la prova dell'interprete; non installa toolchain.

```powershell
node --test _Meta/tests/rust-miri.test.mjs
```

Per includere la prova reale, prepara prima nightly, componente Miri e sysroot come nella nota. In una sessione PowerShell imposta:

```powershell
$env:RUN_MIRI_NOTE_TEST = '1'
```

Riesegui lo stesso comando Node. La prova richiede due test interpretati e, col filtro esatto, uno passato e uno escluso. Cargo lavora offline; la crate temporanea viene rimossa a fine suite.

## Rust: Unsafe abstractions sicure

La suite esegue con rustdoc i tre esempi su Rust 2024, con e senza ottimizzazioni. Confronta lo split con la libreria standard su slice di String, verifica gli estremi, i tipi di dimensione zero e la lunghezza inizializzata di RawBuffer. Due prove di sola compilazione controllano il prestito che uscirebbe dalla durata dei dati (E0515) e la mutazione del buffer mentre la sua slice è ancora in uso (E0502). Nessuna chiamata a librerie C.

```powershell
node --test _Meta/tests/rust-unsafe-abstractions.test.mjs
```

## Rust: FFI

La suite compila il wrapper di `abs` con e senza ottimizzazioni. Estrae poi dal Markdown la libreria Rust, l'header e il chiamante C: costruisce una `cdylib`, collega il programma C e ne esegue le asserzioni. Richiede Rust edition 2024 e un compilatore C nativo sullo stesso target. Su Windows usare un **Developer PowerShell x64** di Visual Studio con `cl.exe` e Rust MSVC x64; su Linux usare `cc`. Nessuna crate aggiuntiva.

```powershell
node --test _Meta/tests/rust-ffi.test.mjs
```

## Rust: bindgen e cbindgen

Due progetti temporanei estratti dalla nota verificano generazione, collegamento e chiamata in entrambi i versi. Servono Cargo, compilatore C nativo, libclang per bindgen e CLI cbindgen 0.29.2. Su Windows usare Developer PowerShell x64 e Rust MSVC x64. Se non sono rilevati automaticamente, impostare `LIBCLANG_PATH` (directory della libreria) e `CBINDGEN` (percorso dell'eseguibile). Cargo richiede accesso al registry al primo avvio o una cache già popolata.

```powershell
node --test _Meta/tests/rust-bindgen.test.mjs
```

## Rust: libc e nix

La suite ricostruisce la crate dalla nota, esegue l'esempio PID e lo confronta con il PID del processo figlio. Su Unix richiede anche i due test runtime (file e pipe) e verifica che omettere le feature di nix impedisca di compilare le API corrispondenti. Richiede Cargo e accesso alle crate o una cache già popolata.

```sh
node --test _Meta/tests/rust-libc-nix.test.mjs
```

Da Windows, con il target Linux già installato, imposta questa variabile prima di eseguire la suite per controllare anche il codice Unix con `cargo check`. Questo non esegue le chiamate Unix; il relativo test rimane esplicitamente saltato.

```powershell
$env:RUST_UNIX_CHECK_TARGET = "x86_64-unknown-linux-gnu"
```

## Rust: Memory layout e alignment

La suite compila i programmi Rust della nota con due livelli di ottimizzazione e confronta la struct con il programma C11 sullo stesso target. Verifica il rifiuto del riferimento a un campo packed (E0793, sola compilazione) e prova il parser su tutti i 256 discriminanti e su lunghezze diverse. Servono rustc, rustdoc e un compilatore C11 nativo; su Windows usare il Developer PowerShell x64 di Visual Studio con Rust MSVC x64.

```powershell
node --test _Meta/tests/rust-memory-layout.test.mjs
```

## Rust: Allocator

La suite compila i tre programmi del Markdown con rustc (edition 2024), a opt-level 0 e 3. Due eseguibili separati verificano i distruttori per valori sovra-allineati e di dimensione zero e il recupero del valore quando un allocatore di prova restituisce NULL. Non provoca esaurimento reale della memoria e non misura le prestazioni.

```powershell
node --test _Meta/tests/rust-allocator.test.mjs
```

## Rust: no_std

La suite estrae manifest, libreria e test dal Markdown. Esegue i test su host nelle modalità core, alloc e std, costruisce due rlib ARM e verifica che la modalità std venga rifiutata sul target privo di std. Richiede Rust con target `thumbv7em-none-eabi` già installato (comando nella nota); la suite lavora offline e non installa componenti. Nessuna esecuzione su hardware.

```powershell
node --test _Meta/tests/rust-no-std.test.mjs
```

## PostgreSQL: suite cumulativa delle note

Serve una distribuzione **PostgreSQL 18.x** completa con supporto TLS, `postgres`, `initdb`, `pg_ctl`, `createdb`, `pg_basebackup` e `psql` nel PATH oppure con `PG_BIN` impostata alla directory dei binari. Per generare i certificati di prova serve anche la CLI `openssl` nel PATH o il percorso dell'eseguibile in `PG_TEST_OPENSSL`. Eseguire come utente che può inizializzare un cluster, non come root su Unix.

```sh
node --test _Meta/tests/postgresql-architettura.test.mjs
```

La suite estrae i dieci blocchi SQL dai quattro Markdown; avvia e arresta un cluster temporaneo, non un servizio. Usa solo 127.0.0.1, una porta libera e una password casuale con SCRAM. Non si collega al database abituale dell'utente. I sei casi controllano sessioni, attese e lock, metodi di sort, percorsi e privilegi. Richiede una directory temporanea scrivibile e il permesso di aprire una porta locale. Non richiede PgBouncer o una replica.

Lo stesso comando esegue gli otto casi di `postgresql-setup.cases.mjs`: crea un database nel cluster di prova e verifica i dieci blocchi SQL e i tre meta-comandi delle cinque note di Setup. Controlla anche `pending_restart` prima e dopo il reset nella stessa sessione, i default al login, i privilegi del creatore e il rollback dello script `psql -1`. Il bootstrap automatico usa una password casuale via `--pwfile` al posto di `-W`. Non installa un servizio, non apre la rete esterna e non negozia TLS.

I dieci casi di `postgresql-sql-fondamentale.cases.mjs` eseguono tutti i 17 blocchi SQL delle sei note di SQL Fondamentale e alcune varianti che devono produrre risultati o errori precisi. Per il caso sulle prenotazioni serve anche l'estensione fornita con PostgreSQL `btree_gist` (su alcune distribuzioni è nel pacchetto contrib). Si crea esclusivamente nel database temporaneo. La suite distingue i risultati nulli dalle stringhe vuote e verifica i codici SQLSTATE, non il testo localizzato. Non misura le prestazioni delle query.

Gli otto casi di `postgresql-modellazione.cases.mjs` eseguono i nove blocchi SQL delle quattro note. Controllano il prezzo pattuito dopo una variazione di listino, la FK composta e le coppie parziali, l'opzionalità e il conteggio indipendente dei figli, gli effetti di RESTRICT e CASCADE, i due versi di AT TIME ZONE, scadenze e totali in fattura, overflow numerico e limiti di lunghezza. Il rimando JSON/JSONB è coperto dai test di SQL Fondamentale.

I dodici casi di `postgresql-avanzato.cases.mjs` eseguono tutti i 15 blocchi SQL del capitolo successivo. Verificano cicli e percorsi distinti, frame e pareggi, join laterali, righe restituite o saltate nelle scritture, refresh concorrente e ricerca testuale italiana. La prova sul refresh usa uno schema privato al cluster di test, creato e annullato nella transazione. Non è una misura dei tempi di risposta o dei lock con lettori simultanei.

I dieci casi di `postgresql-integrita.cases.mjs` eseguono i 13 blocchi su trigger, regole, PL/pgSQL, routine ed estensioni. Richiedono PL/pgSQL e i file server di `pgcrypto`, presente in contrib. Il superuser del cluster usa e getta crea un event trigger in una transazione annullata; una prova separata verifica la procedura con un ruolo ordinario, prima senza e poi con i privilegi sulla tabella. Non sono richiesti privilegi sul database personale. Il test sulle scorte copre risultati e argomenti non validi, non il carico concorrente.

I nove casi di `postgresql-transazioni.cases.mjs` eseguono i 25 blocchi delle quattro note di Transazioni e concorrenza. Il laboratorio avvia due client psql sullo stesso cluster; un osservatore controlla in `pg_stat_activity` l'avanzamento dei passi e, nel caso di deadlock, osserva la prima attesa prima di richiedere il secondo lock. I test distinguono errori di serializzazione, deadlock e lock non disponibile. Nessun crash del server, benchmark o collegamento a database personali.

I dieci casi di `postgresql-performance.cases.mjs` eseguono i 16 blocchi di Performance e Query Planning. Sul cluster di prova confrontano i dati restituiti e i nodi dei piani anche in formato JSON: indice scelto, sort, cardinalità, heap fetch prima e dopo una scrittura. Verificano inoltre unicità parziale, savepoint dopo EXPLAIN ANALYZE, dimensione della heap dopo un DELETE e monitoraggio di relazioni omonime. Nessuna asserzione su tempi assoluti o soglie universali; per VACUUM i blocchi vengono inviati nella stessa sessione senza una transazione esterna.

I sei casi di `postgresql-storage.cases.mjs` verificano WAL e checkpoint, fillfactor di heap e B-tree, aggiornamenti HOT, TOAST e tablespace. Per il tablespace usano il superuser del cluster usa e getta, generano una directory vuota sorella di PGDATA e passano il percorso al prompt dello script psql. Il server deve poter creare il collegamento al tablespace sul filesystem. I test non richiedono volumi aggiuntivi, non simulano un crash e non verificano archiviazione, restore PITR o replica.

I cinque casi di `postgresql-scalabilita.cases.mjs` richiedono anche `pg_basebackup`. Il primario temporaneo usa `wal_level=logical`. I test aprono solo porte di loopback e creano prima uno standby fisico, poi un subscriber indipendente con credenziali di prova. Verificano pruning e detach, durata di SET LOCAL, instradamento simulato per tenant, avanzamento del replay dopo una pausa controllata, rifiuto delle scritture sullo standby, selezione del writer con libpq e applicazione delle modifiche pubblicate. Il servizio libpq è definito in una directory temporanea; non si usano database o configurazioni personali. Non vengono avviati PgBouncer, un orchestratore HA o shard distribuiti.

I sei casi di `postgresql-sicurezza.cases.mjs` usano un database dedicato nel cluster temporaneo. Verificano grant predefiniti del creatore e SECURITY DEFINER, due contesti RLS sulla stessa connessione, eventi di audit transazionali, catalogo e installazione trusted di pgcrypto, rotazione SCRAM con un passfile e verifica TLS end-to-end. Per TLS generano CA e certificati effimeri, usano solo il loopback e ripristinano la configurazione della fixture. La prova rifiuta nome errato, CA estranea e TCP in chiaro. Non esegue il prompt interattivo di rotazione, un secret manager esterno o pgAudit.

I sei casi di `postgresql-osservabilita.cases.mjs` eseguono i 12 blocchi SQL di Slow query log, Lock monitoring e Metriche e alerting. Servono i moduli server `pg_stat_statements` e `auto_explain`. Solo nel cluster usa e getta il primo è precaricato all'avvio e il log è diretto al file di pg_ctl. I test leggono le nuove voci di log, confrontano due campioni di statement normalizzati, osservano un lock advisory da una terza connessione e misurano incrementi di rollback e distanza WAL di uno slot di prova. Non fanno benchmark, non installano un collector e non inviano notifiche.

I sette casi di `postgresql-operativita.cases.mjs` richiedono anche `pg_dump`, `pg_restore`, `pg_dumpall`, `pg_verifybackup` (con `pg_waldump` disponibile) e il modulo server `basic_archive`. Usano solo directory e database usa e getta. Ripristinano archivi custom, plain e directory, verificano dati, sequenza e vincoli, provano validazione differita, indice concorrente, atomicità del registro e passaggio tra vecchi e nuovi scrittori. Per il PITR inizializzano un primario separato con archiviazione locale, verificano il manifest e avviano una seconda copia fino al restore point: la riga inserita dopo il backup e cancellata dopo il target deve essere presente solo sulla copia. Entrambi i processi vengono fermati senza promuovere la copia. Non servono servizi di backup esterni.

I sei casi di `postgresql-estensioni.cases.mjs` coprono il capitolo Estensioni e funzionalità. Tre richiedono i moduli PostgreSQL `uuid-ossp`, `pgcrypto`, `postgres_fdw` e `test_decoding`: verificano i tipi di UUID, un mapping SCRAM tra due database locali e la lettura ripetibile o consumante di uno slot temporaneo. Le credenziali sono casuali e appartengono solo alla fixture.

Per includere anche le tre prove esterne, imposta `PG_TEST_EXTERNAL_EXTENSIONS=1` e fornisci moduli compatibili con i binari PostgreSQL del test: PostGIS (incluse le risorse PROJ), pgvector e TimescaleDB. Senza il flag questi tre casi risultano esplicitamente saltati; con il flag un modulo mancante fa fallire il test. La prova TimescaleDB avvia un cluster separato su loopback con precaricamento del modulo e telemetria disabilitata. Configurazione verificata: PostgreSQL 18.7, PostGIS 3.7.0, pgvector 0.8.2, TimescaleDB 2.23.1. Le prove non installano pacchetti di sistema, non misurano prestazioni ANN e non avviano servizi CDC esterni.

Gli otto casi di `postgresql-integrazione.cases.mjs` leggono gli esempi di driver, prepared statements, ORM, outbox e job table dai Markdown. Per i tre casi Python imposta `PG_APP_PYTHON` al percorso dell'interprete di un ambiente con Psycopg 3 e SQLAlchemy 2 (verificati con Python 3.12, `psycopg[binary]==3.2.9` e `SQLAlchemy==2.0.44`). Senza quel percorso i tre casi sono saltati esplicitamente. Per un giro senza skip servono anche i prerequisiti e il flag delle estensioni del paragrafo precedente.

Il profilo libpq e il passfile del login applicativo sono temporanei e usati solo su loopback. I test contano le SELECT sui dati, non le interrogazioni di inizializzazione. Per la job table usano due sessioni distinte, poi simulano la scadenza della lease agendo sulle date nella sola fixture. Le due consegne outbox sono simulate in SQL: non viene avviato un broker né viene promesso un effetto esterno eseguito esattamente una volta.

## PostgreSQL: promemoria Query

Con i binari PostgreSQL 18.x indicati sopra, dal root del vault:

```sh
node --test --test-name-pattern="Promemoria Query" _Meta/tests/postgresql-architettura.test.mjs
```

Il filtro esegue le sei prove di `postgresql-promemoria-query.cases.mjs` sui 41 blocchi SQL delle sei schede. Non servono driver Python o estensioni esterne. I test leggono il Markdown, usano sessioni temporanee e confrontano le righe (inclusi i NULL), le liste ordinate, il contenuto JSON e lo stato dopo rollback. Le varianti di UNION vengono eseguite con gli stessi input. Le prove verificano la correttezza dei risultati, non i tempi di paginazione né la concorrenza fra scrittori.

## PostgreSQL: promemoria Tipi e funzioni

Per eseguire questo blocco insieme al precedente su PostgreSQL 18.x:

```sh
node --test --test-name-pattern="Promemoria (Query|Tipi e funzioni)" _Meta/tests/postgresql-architettura.test.mjs
```

Le quattro prove di `postgresql-promemoria-tipi.cases.mjs` leggono i 28 blocchi SQL delle schede. Verificano il codice errore di un cast non valido, il numero di righe delle regex, il giorno romano di 23 ore da due fusi di sessione, gli oggetti JSON per contenuto e l'access method dell'indice temporaneo. Non servono moduli esterni. La prova dell'indice non misura prestazioni né impone al planner di usarlo.

## PostgreSQL: promemoria Struttura e prestazioni

Per eseguire tutti e quattro i capitoli dei promemoria su PostgreSQL 18.x:

```sh
node --test --test-name-pattern="Promemoria" _Meta/tests/postgresql-architettura.test.mjs
```

I tre casi di `postgresql-promemoria-struttura.cases.mjs` leggono 30 blocchi SQL dal Markdown. Provano i vincoli anche con dati non validi, controllano le definizioni degli indici e le righe effettive di EXPLAIN senza imporre un piano. Due client e una connessione osservatrice verificano NOWAIT, prenotazione con SKIP LOCKED, attesa e rilascio. Non misurano le prestazioni sotto carico. Il database della suite appartiene solo al cluster temporaneo.

## PostgreSQL: promemoria Gestione

Il filtro `Promemoria` include anche le tre prove di `postgresql-promemoria-gestione.cases.mjs`. I test eseguono i 24 blocchi delle ultime due schede: 13 SQL, 10 invocazioni dei client PostgreSQL e un meta-comando psql. Verificano grant attuali e futuri, revoca, righe visibili e scritture rifiutate sotto due identità distinte. Per i dump custom e plain ripristinano in due database vuoti e controllano dati, sequenza e vincoli; leggono inoltre il CSV locale e l'export dei globali senza verificatori di password. Non provano autenticazione di rete, recovery fisico o tempi di ripristino in produzione.

## Rust: promemoria di linguaggio e astrazioni

Dal root del vault, con Node.js e un `rustc` che supporta l'edition 2024:

```sh
node --test _Meta/tests/rust-promemoria-linguaggio.test.mjs
```

La suite estrae i 33 blocchi Rust dalle sette schede del capitolo Linguaggio e li compila con `-Dwarnings`. Ogni frammento viene eseguito in uno scope indipendente; il programma completo mantiene il proprio `main` e la suite ne confronta l'output con `id=42`. Tre varianti volutamente errate verificano la riassegnazione senza `mut` (E0384), il riuso dopo un move (E0382) e due prestiti in conflitto (E0502).

Per Astrazioni lo stesso comando esegue 22 blocchi in quattro schede, inclusi i casi di prestito dinamico con `RefCell`, ultimo proprietario di un `Rc` e accesso da un secondo thread. Quattro varianti devono fallire: vettore consumato (E0382), confronto senza bound (E0369), riferimento a una variabile locale (E0515) e `Arc<RefCell<_>>` inviato a un thread (E0277).

## Rust: promemoria di sistema e progetto

Dalla radice del vault, con Node, Rust edition 2024, Cargo, rustfmt e Clippy:

```sh
node --test _Meta/tests/rust-promemoria-sistema.test.mjs
```

La suite ricostruisce quattro progetti di esempio e i frammenti autonomi in directory temporanee. Le sei prove coprono I/O senza sovrascrittura, round-trip JSON, feature Cargo disabilitata/abilitata, thread standard, runtime Tokio e test di una libreria reale (unit, integrazione, doctest e lint). Non esegue indiscriminatamente i comandi shell presenti nelle note.

Per impostazione predefinita Cargo lavora offline: devono essere già in cache Serde con derive, serde_json, Tokio con macros e le dipendenze transitive. Per una prima esecuzione con accesso a crates.io si può impostare `CARGO_NET_OFFLINE=false` nell'ambiente. Su Windows usare una directory temporanea dal percorso breve se il linker restituisce LNK1104 sui file generati.

## Rust: Documentazione delle crate

La suite estrae dalla nota il README, le feature, la libreria e il programma di esempio. Con Cargo offline verifica il quick start incluso in rustdoc, le viste HTML con e senza `batch`, gli errori resi visibili solo dai doc test o solo dal controllo dei link, il comportamento documentato su Unicode e liste vuote, e i file restituiti da `cargo package --list`. Non pubblica nulla, né su crates.io né su docs.rs.

```powershell
node --test _Meta/tests/rust-crate-documentation.test.mjs
```

## Rust: Compatibility e breaking changes

La suite ricrea offline la libreria e il client dai blocchi della nota. Prova il passaggio da 1.3 a 1.4, il vecchio import con deprecazione normale o negata, il client migrato e la rimozione del wrapper. Distingue gli errori di compilazione esterni (nome mancante, enum non esaustivo, campo aggiunto) dalle regressioni osservabili solo nei test (spazi del valore e retry ignorati). Non confronta un'ABI binaria e non usa un registry.

```powershell
node --test _Meta/tests/rust-api-compatibility.test.mjs
```

## Rust: Feature flags ben progettate

La suite ricrea tre package temporanei dai blocchi della nota. Servono Cargo con edition 2024, il target `thumbv6m-none-eabi` installato e una cache Cargo con Serde 1, i suoi derive, serde_json 1 e le relative dipendenze. Il test usa la cache disponibile offline: non installa target né aggiorna le dipendenze del vault.

Controlla i test eseguiti in ciascuna delle quattro configurazioni, il comportamento di `serde?/std`, il JSON e i byte della CLI e i percorsi di attivazione in `cargo tree`. Due modifiche intenzionali isolano gli errori: attivare i default di Serde può rompere la compilazione bare metal pur lasciando verdi i test host; togliere `std` dal default di user-ids rompe il consumer che usa l'I/O.

```powershell
node --test _Meta/tests/rust-feature-design.test.mjs
```

## Rust: Extension traits

La suite ricrea offline la libreria e il client dai blocchi della nota. Prova `StringExt`, `IteratorExt` e `ResultExt` in debug e release. Controlla che il predicato per valore non soddisfi `filter`, che il prestito conservi la coda dell'iteratore e che la chiamata qualificata risolva le collisioni. Verifica anche le implementazioni vietate e i vincoli sul tipo di errore.

```powershell
node --test _Meta/tests/rust-extension-traits.test.mjs
```

## Rust: Builder pattern

La suite crea una crate temporanea offline dai blocchi effettivi della nota. Prova i default e la validazione in debug e release, il quarto test con `Command` senza avviare processi esterni, l'ordine dei setter e i confini fino al nanosecondo. Verifica separatamente il diagnostico E0382 per il riuso di un builder consumato e la regressione osservabile se il timeout omesso non eredita più il totale finale.

```powershell
node --test _Meta/tests/rust-builder-pattern.test.mjs
```

## Rust: Error types pubblici

La suite ricrea offline la libreria, il file di configurazione e il client direttamente dalla nota. Prova la lettura in debug e release, i limiti numerici, i byte non UTF-8 e la distinzione tra file assente e directory non leggibile come file. Verifica anche il match esterno su un enum non esaustivo e mostra che classificare un errore come assenza può cambiare il risultato senza produrre errori di compilazione. I controlli sul tipo concreto della causa riguardano questa implementazione, non un contratto promesso al client.

```powershell
node --test _Meta/tests/rust-public-error-types.test.mjs
```

## Rust: Public API design

La suite ricostruisce offline la libreria e il client dai blocchi della nota. Verifica i due test di integrazione in debug e release, i confini di visibilità e il match su un errore non esaustivo. Confronta poi tre modifiche: rinominare il modulo, cambiare la rappresentazione privata e rimuovere gli spazi dai nomi validi. Solo l'ultima altera il risultato promesso; togliere il re-export rompe invece gli import.

```powershell
node --test _Meta/tests/rust-public-api.test.mjs
```

## Rust: cargo deny

Dalla radice del vault, con Node e le dipendenze del sito installate, Cargo con supporto all'edizione 2024, Git e cargo-deny 0.22.0 nel PATH:

```powershell
node --test _Meta/tests/rust-cargo-deny.test.mjs
```

La suite estrae manifest, policy e comandi dalla nota e usa solo progetti temporanei. Verifica licenze SPDX, divieti su feature opzionali, duplicati e origini Git con un mirror locale. I check di cargo-deny sono offline: la prova sugli advisory verifica il fallimento a database assente, non esegue una scansione del database pubblico né del vault.

## Rust: cargo audit

Dalla radice del vault, con le dipendenze Node del sito già installate, Cargo con supporto all'edizione 2024 e cargo-audit 0.23.0 nel PATH:

```powershell
node --test _Meta/tests/rust-cargo-audit.test.mjs
```

La suite crea in directory temporanee un'app, una dipendenza transitiva vendorizzata in due versioni innocue e un database con advisory sintetici. Esegue offline i comandi della nota, legge i report JSON e controlla versioni, esiti dei test e codici di uscita. Il controllo dei pacchetti yanked è disattivato **solo nella fixture**; non viene eseguito un audit del vault o del database pubblico corrente.

## Rust: rustdoc

Dalla radice del vault, con le dipendenze Node del sito e una toolchain Rust con l'edizione 2024:

```powershell
node --test _Meta/tests/rust-rustdoc.test.mjs
```

La suite crea offline la crate descritta nella nota. Legge l'HTML per verificare il collegamento nel testo introduttivo, le sezioni della funzione e la separazione dei privati. Prova indipendentemente un link rotto, un'asserzione sbagliata e una costante pubblica non documentata. I doc test validi sono eseguiti sia in debug sia in release.

## Rust: rustfmt

Dalla radice del vault, con le dipendenze Node del sito installate, Cargo e il componente rustfmt compatibile con lo stile 2024:

```powershell
node --test _Meta/tests/rust-rustfmt.test.mjs
```

La suite estrae dal Markdown gli esempi prima e dopo la formattazione, la tabella esclusa, il file indipendente e la configurazione. Usa crate temporanee offline per distinguere controllo e scrittura, errori di tipo e di parsing, selezione dei pacchetti ed edizione di stile.

## Rust: Clippy

Dalla radice del vault, con le dipendenze Node del sito installate e una toolchain Rust con Clippy ed edition 2024:

```powershell
node --test _Meta/tests/rust-clippy.test.mjs
```

La suite estrae le funzioni dalle note Clippy e Unit test e le compila in progetti temporanei, senza dipendenze Cargo esterne. Controlla i codici e i livelli dei diagnostici, gli esiti dei cinque test, le eccezioni rimaste senza effetto e la portata di target e feature.

## Rust: cargo-nextest

Dalla radice del vault, con Node, Cargo, il comando `python` (Python 3 per leggere il JUnit XML) e cargo-nextest 0.9.152 nel PATH:

```powershell
node --test _Meta/tests/rust-nextest.test.mjs
```

La suite ricostruisce offline la crate delle note Unit test, Integration test e Doc test. Confronta i due filtri, introduce un errore solo nella documentazione, verifica i casi nel report XML sia dopo un successo sia dopo un fallimento e distingue avviso di lentezza e terminazione usando periodi abbreviati nella copia temporanea. Non modifica i test o la CI del vault.

## Rust: Snapshot testing

Dalla radice del vault, con Node, Rust e dipendenze Cargo disponibili da crates.io o in cache:

```powershell
node --test _Meta/tests/rust-snapshot-testing.test.mjs
```

La suite ricostruisce la CLI e i test della nota e installa cargo-insta 1.49.0 **in una directory temporanea**. Confronta le proposte con il testo e i dati attesi prima di accettarle; verifica rifiuto, accettazione di un cambio intenzionale, redazione del solo identificativo e modalità CI senza scritture. Per automatizzare le decisioni già controllate usa i comandi non interattivi della CLI soltanto nella fixture.

## Rust: Fuzzing

Dalla radice del vault, con Node, Rust, una toolchain C++ e le dipendenze Cargo disponibili dal registro o in cache:

```powershell
node --test _Meta/tests/rust-fuzzing.test.mjs
```

La suite ricostruisce dalla nota l'istogramma e il suo oracolo. Prova la classificazione di tutti i singoli byte e delle coppie, i duplicati e un confine volutamente errato. Installa la CLI cargo-fuzz 0.13.2 **solo in una directory temporanea**, inizializza il progetto, verifica il nome del target e ne controlla la compilazione con Cargo. Queste prove non sono fuzzing guidato dalla copertura. Su un host attrezzato con nightly e il runtime nativo si può impostare `VAULT_FUZZ_NIGHTLY=1` prima di eseguire la suite per includere il comando strumentato della nota.

## Rust: Property testing

Dalla radice del vault, con Node, Rust 1.88 o successivo e le dipendenze disponibili da crates.io oppure in cache:

```powershell
node --test _Meta/tests/rust-property-testing.test.mjs
```

La suite estrae il progetto dalla nota. Con proptest 1.12.0 verifica il controesempio ridotto, il replay del seed anche senza nuovi casi, il caso unitario esplicito e la differenza tra copertura ASCII e Unicode. Implementazioni volutamente errate e file di regressione vivono solo nella crate temporanea.

## Rust: Benchmarking con Criterion

Dalla radice del vault, con Node, Cargo e accesso a crates.io al primo avvio (oppure cache già popolata):

```powershell
node --test _Meta/tests/rust-criterion.test.mjs
```

La suite ricostruisce dalla nota una crate temporanea con Criterion 0.8.2. Controlla la somma anche oltre `u32`, distingue la prova senza misure dal benchmark ottimizzato e verifica i campioni delle due strategie su entrambe le dimensioni. Salva e rilegge una baseline nominata; la verifica richiede che resti intatta e che un ID diverso venga rifiutato. I tempi di campionamento sono abbreviati per il test: nessuna soglia di velocità o affermazione su quale implementazione vinca.

## Rust: Mocking

Dalla radice del vault, con Node e Cargo:

```powershell
node --test _Meta/tests/rust-mocking.test.mjs
```

La suite estrae i comandi e i tre blocchi Rust dal Markdown. Esegue i test in una libreria temporanea offline e verifica quali casi falliscono per cinque modifiche indipendenti: confronto al limite, invio mancante, invio doppio, destinatario errato ed errore del mittente ignorato.

## Rust: Doc test

Dalla radice del vault, con Node e Cargo installati:

```powershell
node --test _Meta/tests/rust-doc-tests.test.mjs
```

La suite innesta i commenti della nota Doc test sul parser della nota Unit test in una crate temporanea offline. Confronta doc test, test unitari e generazione HTML, poi introduce tre modifiche deliberate: un risultato atteso errato, un prestito incompatibile nel blocco `no_run` e una chiamata valida nel blocco `compile_fail`.

## Rust: Integration test

Dalla radice del vault:

```powershell
node --test _Meta/tests/rust-integration-tests.test.mjs
```

Con Node e Cargo, la suite ricostruisce offline il progetto delle note Unit test e Integration test. Interroga `cargo metadata` per verificare i target e la collocazione degli helper; esegue i test pubblicati, compresa la CLI reale, e confronta il filtro esatto con la suite intera. La controprova modifica solo la CLI in una copia temporanea: l'API resta verde, il test sul codice di uscita no.

## Rust: Unit test

Con Node e Cargo installati, eseguire dalla radice del vault:

```powershell
node --test _Meta/tests/rust-unit-tests.test.mjs
```

La suite usa soltanto la libreria standard Rust e lavora offline in una crate temporanea. Estrae i test e i comandi dalla nota: verifica entrambi i profili, i conteggi dei filtri e la diagnosi dopo un cast anticipato. Una piccola crate di test esterna controlla la differenza fra API pubblica, funzione privata e helper disponibile solo con `cfg(test)`.

## Rust: Embassy

Per verificare la nota Embassy servono Cargo, il target `thumbv7em-none-eabi`, il componente rustup `llvm-tools` e accesso alle dipendenze (o una cache popolata).

```powershell
node --test _Meta/tests/rust-embassy.test.mjs
```

La suite compila il firmware della nota e legge il vettore TIM2 nell'ELF. Esegue lo stesso produttore con l'executor Embassy sul PC e un orologio virtuale: verifica la soglia dei 250 ms, l'errore Busy e la consegna in ordine anche con il canale pieno. Una copia senza driver deve fallire al link. Non verifica elettricamente PA5 e non richiede una sonda.

## Rust: RTIC

Per compilare il binario della nota RTIC in aggiunta al progetto defmt e controllare i vettori con gli strumenti LLVM:

```powershell
node --test _Meta/tests/rust-rtic.test.mjs
```

Servono Cargo, il target `thumbv7em-none-eabi`, il componente rustup `llvm-tools` e le dipendenze in cache o accessibili. Il test confronta i puntatori EXTI0 e USART2 con i simboli nell'ELF; in copie temporanee verifica il rifiuto di un task software sincrono, di un conflitto di vettori e del doppio proprietario di una risorsa locale. Non misura latenze e non esegue il firmware su hardware.

## Rust: defmt

La suite richiede Cargo, il target `thumbv7em-none-eabi`, il componente rustup `llvm-tools` e l'accesso alle dipendenze o una cache popolata.

```powershell
node --test _Meta/tests/rust-defmt.test.mjs
```

Estrae firmware, configurazione e output atteso dalla nota. Confronta le build ARM con i filtri info/debug e controlla che una copia senza logger fallisca al link. Sul PC il decoder ufficiale interpreta due payload costruiti con gli indici dell'ELF e rifiuta una misura troncata; non viene emulato il trasporto RTT e non si accede a una scheda.

## Rust: probe-rs

La suite richiede la CLI `probe-rs` 0.32.0 nel PATH (oppure `PROBE_RS_EXE` con il percorso del binario), Cargo, il target `thumbv7em-none-eabi` e le dipendenze dell'esempio `blink` in cache o accessibili:

```powershell
node --test _Meta/tests/rust-probe-rs.test.mjs
```

Usa la CLI reale solo per versione, catalogo chip e help. Confronta il percorso ELF documentato con quello prodotto dal progetto della nota Embedded Rust. Durante `cargo run` un registratore locale prende il posto di probe-rs: il test verifica gli argomenti senza aprire connessioni USB, fare flash o leggere log.

## Rust: cortex-m

Il test estrae manifest, calcolo del periodo e firmware dalla nota e usa i tre file di linking indicati in `Embedded Rust`. Richiede Cargo, i target `thumbv6m-none-eabi` e `thumbv7em-none-eabi`, il componente rustup `llvm-tools` e le dipendenze in cache o accessibili da crates.io.

```powershell
node --test _Meta/tests/rust-cortex-m.test.mjs
```

Controlla il calcolo sull'host, verifica i tipi dell'esempio per M0 e collega due ELF per M4. Legge il vettore 15 in entrambi: con l'attributo punta al gestore applicativo, senza punta a quello predefinito. Non misura il clock né programma la scheda.

## Rust: embedded-hal

Per i trait portabili e il protocollo del driver LIS3DH della nota `embedded-hal`:

```powershell
node --test _Meta/tests/rust-embedded-hal.test.mjs
```

Servono Cargo, il target `thumbv7em-none-eabi` e la crate embedded-hal 1.0.0 (cache o accesso a crates.io per il primo build). Il runner estrae il codice dal Markdown. Prova sul PC ordine dei byte e delle operazioni, propagazione degli errori, GPIO e durata richiesta al timer; costruisce una rlib per ARM. In una copia temporanea divide la lettura SPI in due transazioni e verifica che il test del driver la respinga. Nessuna misura sul bus o programmazione di schede.

## Rust: Embedded Rust

La suite estrae i sette file dalla nota. Esegue il test GPIO nativo e collega l'esempio in release per NUCLEO-F401RE; controlla tipo di ELF, indirizzo dei vettori, stack e destinazione del reset. Richiede Cargo, target `thumbv7em-none-eabi`, componente rustup `llvm-tools` e accesso alle dipendenze oppure una cache popolata. Non avvia un emulatore, non usa un probe e non programma la scheda.

```powershell
node --test _Meta/tests/rust-embedded.test.mjs
```

## Rust: File descriptor

La suite estrae dal Markdown i test sul cursore di un file e sulla proprietà dei descriptor di una pipe. Usa Cargo offline, senza crate esterne. Su Unix esegue nativamente entrambe le pipe e controlla due diagnostiche di prestito/trasferimento; su Windows il test nativo delle pipe è escluso. Per interpretare i due test Linux anche da Windows, imposta `RUST_FD_MIRI_TOOLCHAIN` al nome di una nightly rustup con Miri, target e sysroot già preparati per `x86_64-unknown-linux-gnu`. L'interprete non sostituisce il kernel nativo.

```powershell
node --test _Meta/tests/rust-file-descriptor.test.mjs
```

## Rust: Memory mapping

La suite estrae dipendenze e test della nota. Usa file temporanei privati per provare le viste read-only, condivise e copy-on-write, controlla una finestra con offset di un byte e verifica in sola compilazione il lifetime della slice. Richiede Cargo e accesso alle due dipendenze dichiarate o una cache popolata. Non effettua test di perdita di alimentazione, troncatura di file mappati o writer concorrenti.

```powershell
node --test _Meta/tests/rust-memory-mapping.test.mjs
```

## Rust: Cross-compilation

Dalla radice del vault, con Cargo, un linker per l'host, i target Rust `aarch64-unknown-linux-gnu` e `wasm32-wasip1` installati nella toolchain attiva e Node.js 24 nel PATH:

```powershell
node --test _Meta/tests/rust-cross-compilation.test.mjs
```

Quattro prove su un progetto temporaneo senza crate esterne: esecuzione nativa, controllo senza linking per Linux ARM64, ispezione dell'artefatto WASI e avvio della CLI tramite il runner pubblicato. Non serve un linker Linux; la suite non esegue un binario ARM.

## Rust: Linking

Dalla radice del vault, in Developer PowerShell x64, con MSVC, Rust per Windows x64 MSVC e Node.js:

```powershell
node --test _Meta/tests/rust-linking.test.mjs
```

Quattro prove compilano i sorgenti della nota in directory temporanee. Confrontano le dipendenze degli eseguibili statico e dinamico, verificano l'errore di caricamento prima di distribuire la DLL e riproducono due errori di collegamento distinti: archivio assente e simbolo non risolto. Su sistemi diversi da Windows x64 i test vengono saltati.

## Rust: Performance e profiling

Dalla radice del vault con Node.js, Rust/Cargo 1.85+ e un linker per l'host:

```powershell
node --test _Meta/tests/rust-performance-profiling.test.mjs
```

Quattro prove ricostruiscono il laboratorio dal Markdown senza crate esterne. Verificano l'equivalenza in byte, il formato dei cinque lotti per entrambe le strategie, il rifiuto di zero iterazioni e, separatamente dal cronometro, l'assenza di crescita con capacità prenotata. Non richiedono un profiler di sistema e non impongono che un'implementazione sia più veloce.

## Rust: Zero-cost abstractions

Dalla radice del vault con Node.js, Rust/Cargo 1.85+ e un linker per l'host:

```powershell
node --test _Meta/tests/rust-zero-cost-abstractions.test.mjs
```

La suite esegue gli esempi pubblicati nei profili dev e release, controlla la somma modulare su 512 prefissi con un accumulatore di riferimento più ampio e genera assembly con il comando della nota. Non impone identità fra istruzioni, eliminazione delle chiamate indirette o soglie di tempo.

## Rust: CLI con clap

Dalla radice del vault con Node.js, Rust/Cargo con edition 2024 e linker per l'host:

```powershell
node --test _Meta/tests/rust-cli-clap.test.mjs
```

La suite allestisce un progetto temporaneo dai blocchi Markdown. Recupera clap 4.5.50 con Cargo (cache temporanea salvo `CARGO_HOME` già impostata), poi compila e prova il progetto offline con il lockfile. Sei test controllano parser, sottocomandi, contenuto UTF-8 o binario, stdout, stderr e codici di uscita dell'eseguibile.

## Rust: Configurazione applicativa

Dalla radice del vault, con Node.js, Cargo/Rust con edition 2024 e il linker per l'host:

```powershell
node --test _Meta/tests/rust-configurazione-applicativa.test.mjs
```

La suite compila il sorgente della nota con clap, Serde e TOML, usando una cache temporanea se `CARGO_HOME` non è impostata. Dopo il recupero delle dipendenze compila offline con il lockfile. Le sette prove avviano il binario in processi isolati: coprono le 64 combinazioni di override, errori di file e ambiente, riservatezza dei valori nei messaggi e validazione finale dei timeout.

## Rust: Logging con log

Dalla radice del vault, con Node.js, Rust/Cargo con edition 2024 e linker per l'host:

```powershell
node --test _Meta/tests/rust-logging-log.test.mjs
```

La suite ricostruisce libreria ed eseguibili dal Markdown. Dopo il recupero delle dipendenze (cache temporanea se `CARGO_HOME` non è impostata), compila offline con il lockfile. Sette test confrontano stdout, stderr e stato di uscita con filtri diversi; processi distinti verificano anche assenza del backend, seconda registrazione e livello massimo escluso dalla build release.

## Rust: Tracing con tracing

Dalla radice del vault, con Node.js, Rust/Cargo con edition 2024 e un linker per l'host:

```powershell
node --test _Meta/tests/rust-tracing.test.mjs
```

La suite compila il Markdown e le due varianti dello spawn, poi legge i record JSON per ID senza imporre un ordine fra task. Sette test verificano parentela, filtri, omissione del testo, canali di output e differenza fra una guardia di `enter()` e una future strumentata dopo un poll sospeso. Dipendenze recuperate in una cache temporanea se `CARGO_HOME` non è impostata; build offline con lockfile dopo il recupero.

## Rust: Error reporting

Dalla radice del vault con Node.js, Rust/Cargo con edition 2024 e un linker per l'host:

```powershell
node --test _Meta/tests/rust-error-reporting.test.mjs
```

La suite compila la libreria e la CLI dal Markdown. Dopo il recupero delle dipendenze usa il lockfile offline; la cache è temporanea salvo `CARGO_HOME` già impostata. Sette prove confrontano il report d'esempio con stderr, verificano causa tipizzata, canali e codici 0/1/2/3, senza assumere la lingua della diagnostica di sistema.

## Rust: Packaging e release

Dalla radice del vault con Node.js, Rust/Cargo con edition 2024, linker e `tar`:

```powershell
node --test _Meta/tests/rust-packaging-release.test.mjs
```

La suite lavora offline su una CLI temporanea senza dipendenze, creata dagli esempi della nota. Ispeziona sia la lista di Cargo sia i file reali del pacchetto sorgente. Su Windows x64 MSVC usa anche PowerShell per creare e provare lo ZIP e confrontarne il digest. Non crea tag e non contatta alcun registry.

## Rust: Networking con reqwest

Servono Node.js, Rust/Cargo con edition 2024, linker e Python 3 disponibile come `python`.

```powershell
node --test _Meta/tests/rust-networking-reqwest.test.mjs
```

La suite compila la CLI dal Markdown. Solo il recupero delle dipendenze richiede il registry (cache temporanea salvo `CARGO_HOME` impostata); build offline con lockfile. Il server Python dell'esempio e i server di prova ascoltano solo sul loopback. Sei test coprono GET, POST, status inattesi, decodifica, limite in byte e timeout prima e dopo gli header. Non sono prove di HTTPS o DNS.

## Rust: Web backend con axum

Servono Node.js con `fetch`, Rust/Cargo con edition 2024, linker e curl 7.82 o successivo.

```powershell
node --test _Meta/tests/rust-web-axum.test.mjs
```

La suite compila dai Markdown il server axum e il client reqwest in un workspace temporaneo. Dopo il recupero delle dipendenze da Cargo, la compilazione usa il lockfile offline. Ogni prova avvia un server separato sul solo loopback e lo chiude al termine. Sono verificati il contratto HTTP, gli errori degli extractor e del dominio, il limite in byte e gli ID durante POST concorrenti. Non richiede un database.

## Rust: Tower e middleware

Dalla radice del vault con Node.js, Rust/Cargo con edition 2024 e linker:

```powershell
node --test _Meta/tests/rust-tower-middleware.test.mjs
```

La suite crea la libreria temporanea dal Markdown. Solo il recupero delle crate richiede il registry (cache temporanea salvo `CARGO_HOME` impostata); compilazione e test usano il lockfile offline. Sei prove in-process, con tempo Tokio sospeso, coprono ordine e ambito dei layer, errore Tower rispetto a risposta HTTP, effetto già eseguito e lettura tardiva del corpo. Non viene avviato alcun server.

## Rust: Serde e serializzazione

Dalla radice del vault con Node.js, Rust/Cargo con edition 2024 e linker:

```powershell
node --test _Meta/tests/rust-serde-serializzazione.test.mjs
```

La suite compila i quattro blocchi Rust del Markdown in una libreria temporanea. Dopo il recupero delle crate, sette test Rust girano offline con lockfile: risposta pubblica, default, alias, patch a tre stati, eventi, categorie di errore e prestiti dal buffer. Nessun servizio HTTP o database necessario.

## Rust: SQLx

Dalla radice del vault con Node.js, Rust/Cargo con edition 2024, compilatore C e linker:

```powershell
node --test _Meta/tests/rust-sqlx.test.mjs
```

La suite compila il Rust e la migrazione SQLite dal Markdown. Verifica i saldi dopo commit e rollback, gli errori di lettura e il limite imposto dal database. Per provare davvero `prepare`, installa sqlx-cli 0.8.6 con il solo driver SQLite in una directory temporanea (serve il registry per le dipendenze). Confronta la build con metadati, senza metadati corrispondenti e con schema live non valido per la query. Non richiede né usa PostgreSQL o credenziali personali.

## Rust: Diesel

Dalla radice del vault con Node.js, Rust/Cargo compatibile con Diesel 2.3, compilatore C e linker:

```powershell
node --test _Meta/tests/rust-diesel.test.mjs
```

La suite compila schema, modelli e migrazioni del Markdown in una libreria temporanea. Sei prove Rust su SQLite in memoria verificano ricerca, aggiornamento, import atomico, ordine dei campi, database non allineato e migrazione inversa. Due build negative verificano tipo del filtro e nullabilità. Dopo il recupero delle crate, la suite usa il lockfile offline; non avvia né contatta database esterni.

## Rust: SeaORM

Dalla radice del vault con Node.js, Rust/Cargo con edition 2024, compilatore C e linker:

```powershell
node --test _Meta/tests/rust-seaorm.test.mjs
```

La suite compila in una crate temporanea le due entity e i blocchi applicativi del Markdown. Sette prove Rust verificano scritture e letture reali, stati dei campi, save con ID esplicito, relazione padre/figli, vincoli e rollback. Dopo il recupero delle crate la build usa il lockfile offline; il database SQLite vive in memoria e non occorre un server.

## Rust: Connection pooling

Dalla radice del vault con Node.js, Rust/Cargo con edition 2024, compilatore C e linker:

```powershell
node --test _Meta/tests/rust-connection-pooling.test.mjs
```

La suite compila il codice del Markdown in una crate temporanea. Sette prove con SQLite in memoria verificano contesa tra cloni, risposta delle sonde axum, sessione riutilizzata, transazione, query più lunga del timeout di acquisizione, chiusura e acquisizione non bloccante. La variante PostgreSQL è compilata, non eseguita. Dopo il recupero delle crate la suite usa il lockfile offline; niente server HTTP o database esterni.

## Rust: Background jobs

Dalla radice del vault con Node.js, Rust/Cargo con edition 2024, compilatore C e linker:

```powershell
node --test _Meta/tests/rust-background-jobs.test.mjs
```

La suite compila i blocchi Rust del Markdown in una crate temporanea. Sette prove con Tokio e file SQLite temporanei verificano riconsegna dopo riapertura, conflitto della chiave, rollback, due consumer, perdita del buffer, limite dei task e raccolta degli errori. Sono simulazioni locali senza broker e senza effetti su servizi esterni. Dopo il recupero delle dipendenze la compilazione usa il lockfile offline.

## Rust: wasm-bindgen

Servono Cargo, il target `wasm32-unknown-unknown` e la CLI `wasm-bindgen` della versione indicata nella nota. Per usare una CLI fuori dal PATH imposta `WASM_BINDGEN_CLI` al percorso dell'eseguibile. Il test usa Playwright e Chrome: `PLAYWRIGHT_MODULE_PATH` può indicare una cartella pacchetto esterna e `BROWSER_CHANNEL` un canale diverso.

```powershell
node --test _Meta/tests/rust-wasm-bindgen.test.mjs
```

La suite estrae manifest, Rust, comandi di build e HTML dal Markdown. In una cartella temporanea genera i binding reali e li serve su loopback. Quattro casi verificano la pagina, il contratto Unicode e le eccezioni, inizializzazione e rilascio delle istanze, e il fallimento se manca il binario. Non copre i target bundler, Node o WASI.

## Rust: wasm-pack

Servono Rust/Cargo, wasm-pack 0.15.1, npm, webpack 5, Playwright e Chrome. La CLI wasm-pack può essere nel PATH o indicata da `WASM_PACK_CLI`; per usare i binding già installati rendi disponibile nel PATH anche la CLI wasm-bindgen 0.2.130. Per webpack e Playwright esterni a `site` imposta `WEBPACK_MODULE_PATH` e `PLAYWRIGHT_MODULE_PATH` alle rispettive cartelle pacchetto. `BROWSER_CHANNEL` permette di cambiare il canale di Chrome.

```powershell
node --test _Meta/tests/rust-wasm-pack.test.mjs
```

La suite estrae la crate, i comandi e i consumatori dal Markdown in una cartella temporanea. Compila tre volte con target diversi, esegue il consumatore Node, controlla l'elenco di `npm pack --dry-run` e il caricamento dei due binari web su loopback (diretto e compilato con webpack). Non pubblica su npm e non misura il profilo release.

## Rust: Interop con JavaScript

Servono la toolchain Rust/Wasm, wasm-pack, Playwright e Chrome come per la suite precedente (`WASM_PACK_CLI`, `PLAYWRIGHT_MODULE_PATH`, `BROWSER_CHANNEL`); non serve webpack.

```powershell
node --test _Meta/tests/rust-js-interop.test.mjs
```

La suite compila i blocchi Rust del Markdown e carica HTML, binding e binari reali in Chrome tramite richieste intercettate da Playwright. Sei scenari coprono l'output della pagina, la validazione Serde, l'overflow in dev e release (senza post-processing wasm-opt), la copia di una vista di byte, le callback e i motivi di rifiuto delle Promise.

## Rust: WASI

Servono Node, Cargo, i target `wasm32-wasip1` e `wasm32-wasip2` e la CLI Wasmtime nel PATH (oppure in `WASMTIME_CLI`). Non servono browser, wasm-pack o crate esterne.

```powershell
node --test _Meta/tests/rust-wasi.test.mjs
```

La suite compila il sorgente del Markdown nei due formati ed esegue i comandi con Wasmtime, usando una directory temporanea di campioni. Sei scenari coprono compatibilità del binario, output, stdin, preopen, ambiente e diagnosi su stderr. Non esegue un componente P3 e non concede accesso alle note del vault.

## Rust: Limiti del runtime WebAssembly

Servono rustc con il target `wasm32-unknown-unknown`, un linker nativo, Node, Playwright e Chrome. Il test usa le stesse variabili opzionali `PLAYWRIGHT_MODULE_PATH` e `BROWSER_CHANNEL` delle altre suite browser; non servono wasm-pack o Wasmtime.

```powershell
node --test _Meta/tests/rust-wasm-runtime-limits.test.mjs
```

La suite estrae sorgente Rust, configurazione e HTML dal Markdown. Sei scenari verificano core nativo e cfg, configurazione HTTP senza ricompilazione, import mancante, somma i64 con due istanze, diagnosi di caricamento e crescita di una memoria limitata a due pagine. Server su loopback e file di esempio sono temporanei.

## Fondamenti

Dalla radice del vault:

```powershell
node --test _Meta/tests/javascript-fondamenti.test.mjs
```

32 test in contesti JavaScript isolati, con risposte Fetch simulate. Comprendono percorsi validi e casi che devono generare errori.

## JavaScript Moderno

```powershell
node --test _Meta/tests/javascript-moderno.test.mjs
```

26 test su arrow functions, template literals, default, destructuring, spread/rest e moduli. I test ESM creano package temporanei con i frammenti originali, li importano con Node e rimuovono soltanto la propria directory dopo averne verificato il percorso. Le dipendenze usate per simulare un guasto sono fixture esplicite, non copie delle funzioni sotto test.

## Strutture Dati

```powershell
node --test _Meta/tests/javascript-strutture-dati.test.mjs
```

34 test su metodi array, oggetti, Map/Set, JSON, date e regex. Verificano riferimenti condivisi, array vuoti/sparsi, chiavi speciali, schema dei dati, errori HTTP, date invalide, misurazione delle durate e ricerca testuale. Tre processi Node isolati impostano `TZ` a UTC, Europe/Rome e America/New_York prima di eseguire gli esempi: non cambiano il fuso orario del sistema.

## Logica Interna

```powershell
node --test _Meta/tests/javascript-logica-interna.test.mjs
```

36 test su scope, TDZ, hoisting, closure, receiver e prototipi. I casi ESM e CommonJS vengono eseguiti in file temporanei reali, con timeout e cancellazione limitata alla directory verificata del test. Timer simulati rendono deterministiche le prove su callback e loop. Sono inclusi input malformati della sessione dimostrativa e limiti numerici del contatore, non un collaudo di autenticazione.

## Programmazione ad Oggetti

```powershell
node --test _Meta/tests/javascript-oggetti.test.mjs
```

43 test su classi, ereditarieta, incapsulamento, campi privati/statici e descrittori. Verificano receiver e prototipi, ordine di inizializzazione, setter e campi pubblici, private brand, validazione e conservazione dello stato in caso di errore, copie dei dati e limiti numerici. Sono inclusi errori intenzionali di sintassi e runtime, definizioni parziali di proprieta e limiti di freeze e serializzazione. Gli esempi monetari usano centesimi interi: non sono un modello contabile completo.

## Asincronia: Fondamenti

```powershell
node --test _Meta/tests/javascript-asincronia.test.mjs
```

33 test su Event Loop, Callback e Promises. Verificano ordine delle microtask, suddivisione del lavoro in task, return e propagazione degli errori, stati adottati dalle Promise, catch/finally, timer e parsing/validazione delle risposte. Le API Node sono provate con veri file ESM e JSON in directory temporanee isolate, rimosse solo dopo controllo del percorso. I timer simulati controllano registrazione ed esecuzione, non il tempo trascorso; un processo separato verifica che un errore del consumatore non richiami due volte la callback.

## Asincronia: Composizione e Concorrenza

```powershell
node --test _Meta/tests/javascript-async-avanzato.test.mjs
```

28 test su Promise avanzate e Async Await. Verificano ordine ed errori dei combinatori, cleanup dei timer, timeout durante la lettura del corpo, validazione degli input, schema delle risposte e differenza fra return e return await. Il pool viene provato con limiti diversi, errori sincroni e asincroni, motivi di rifiuto falsy, array sparsi e attesa dei lavori gia avviati dopo un errore. Timer e risposte HTTP simulate controllano i contratti, non le prestazioni o le tempistiche della rete reale.

## Fetch e AbortController

```powershell
node --test _Meta/tests/javascript-fetch-abort.test.mjs
```

28 test su wrapper JSON, header in tre formati, HTTP e risposte vuote, consumo del corpo, validazione dello schema e timeout. Controllano che `wait()` rimuova il listener anche su successo e conservi i motivi di abort, inclusi null e zero. Le fixture di ricerca ignorano intenzionalmente il signal, cosi da provare che identita e cleanup impediscano aggiornamenti obsoleti anche quando l'operazione sottostante non collabora.

## AJAX e WebSocket

```powershell
node --test _Meta/tests/javascript-ajax-websocket.test.mjs
```

25 test su AJAX, WebSockets e Real-time con WebSocket. Le fixture XHR verificano stati terminali, HTTP, parsing, annullamento, timeout e rimozione dei listener. Gli helper WebSocket sono provati per schema, byte UTF-8, buffer di uscita, serializzazione e backoff. Un EventTarget simula i socket per verificare start/stop, riconnessione, budget totale, eventi obsoleti e cleanup, senza aspettare ritardi reali. Il codice sotto test e estratto dalle note, non riscritto nelle fixture.

## Stile e Paradigmi: Funzioni e Pattern

```powershell
node --test _Meta/tests/javascript-paradigmi.test.mjs
```

31 test su Functional Programming e Design Patterns: aggiornamenti senza mutare gli input, riferimenti condivisi, currying/applicazione parziale, pipeline sincrona, timestamp espliciti e schema degli utenti. Le prove sui pattern coprono factory, closure, Observer con snapshot, iscrizioni duplicate/rimosse, cleanup ed errori, strategie sconosciute e limiti degli input. Il wrapper viene provato con this, argomenti, risultato, errori del logger e identita delle Promise. I moduli ES sono importati da URL data temporanei nel processo di test: stessa URL condivide il modulo, fragment diversi creano identita distinte. Nessun file applicativo viene creato o modificato.

## Stile e Paradigmi: Copie e Iteratori

```powershell
node --test _Meta/tests/javascript-copie-iteratori.test.mjs
```

38 test su Immutabilita e Copia degli Oggetti e Generators e Iterators. Gli helper sono estratti dalle note; prove aggiuntive delle API verificano descrittori, getter, alias, transfer, SharedArrayBuffer e differenze tra clone e JSON. Il deepFreeze viene provato su cicli, array, Symbol, proprieta non enumerabili, dati gia frozen e input esclusi senza invocare getter. Sono verificati schema delle patch e conservazione dei riferimenti. Per iteratori e generatori si provano cursori monouso/indipendenti, next/return/throw, cleanup, estremi numerici e helper lazy. Fetch e timer simulati rendono deterministiche le prove di paginazione: query, HTTP/parsing/schema, limite pagine, break, abort e return accodato a una richiesta pendente.

## Web Workers e Service Workers

```powershell
node --test _Meta/tests/javascript-workers.test.mjs
```

10 test Node su strategie cache e handler opzionali. Verificano allowlist di URL, metodo e credenziali, cache hit/miss, guasti di rete, errori HTTP, clone delle risposte e scritture fallite. Le fixture Cache Storage simulano indisponibilita e quota; controllano anche la registrazione sincrona di waitUntil e l'assenza di rifiuti non gestiti durante revalidate. Push e messaggi di aggiornamento sono provati con eventi/registrazione simulati, non con un servizio push reale.

Con gli stessi prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-workers-browser.test.mjs
```

18 test Chrome con Web Worker e Service Worker reali, serviti da server HTTP temporanei su loopback. I file JavaScript vengono estratti dalle note e importati come moduli o caricati come worker classici, senza copie delle implementazioni nelle fixture. Ogni test usa un nuovo contesto browser e chiude contesto, worker e server alla fine.

Le prove comprendono input invalidi, errori runtime/caricamento, transfer, timeout, abort e terminazione dei job. Per i Service Worker: prima visita non controllata, ready, scope, precache fallito, cache appartenenti ad altre app, offline, cache eliminata, filtri delle richieste, update in attesa con due schede aperte e mantenimento della vecchia versione dopo un update fallito. Unregister viene verificato separatamente dalla cancellazione delle cache.

## Web Components e Scheduling

```powershell
node --test _Meta/tests/javascript-scheduling.test.mjs
```

31 test Node con timer, clock, rAF e deadline idle controllati. Verificano polling senza sovrapposizione, retry dopo errore, abort e stop ripetuto; somma con budget, limiti numerici, input sparsi, fallback di yield e rifiuti. Le prove rAF controllano timestamp iniziale zero, origine temporale arbitraria, completamento, cancellazione e reduced motion. Quelle idle verificano budget esaurito, singolo lavoro dopo timeout, limite per callback, fallback e cleanup.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-components-browser.test.mjs
```

20 test Chrome su componenti e API native. Gli esempi estratti dai Markdown coprono testo non interpretato come HTML, attributi iniziali e rimossi, stato alla riconnessione, registrazioni duplicate, template indipendenti, proprieta pre-upgrade, booleani, click e tastiera, disabilitazione e focus. Sono verificati propagazione/retargeting degli eventi, slot, custom properties/part e cleanup dei listener esterni. Scheduling viene provato anche con rAF, reduced motion emulato, misure border-box, requestIdleCallback, scheduler.yield e postTask reali. Ogni test usa un contesto isolato, intercetta la rete e lo chiude alla fine.

## WebAssembly interop

Per questi test serve anche il pacchetto `wabt` (verificato con `1.0.39`). Il helper `wasm-example.mjs` compila il WAT estratto dalla nota a ogni esecuzione, senza conservare un secondo sorgente o un binario precompilato. Il pacchetto non viene aggiunto alle dipendenze di Quartz. Esempio di installazione isolata, da rifare se la cartella temporanea viene rimossa:

```powershell
npm install --prefix "$env:TEMP/appunti-wasm-tools" --ignore-scripts --no-audit --no-fund --package-lock=false wabt@1.0.39
```

Imposta il percorso del pacchetto nella shell che esegue i test:

```powershell
$env:WABT_MODULE_PATH = Join-Path $env:TEMP 'appunti-wasm-tools/node_modules/wabt'
```

```powershell
node --test _Meta/tests/javascript-wasm.test.mjs
```

32 test Node: compilazione WAT, contratti import/export, overload di instantiate, istanze indipendenti, conversioni i32/i64, trap ed errori delle callback host. Il loader viene provato con MIME corretto/errato/assente, fallback senza streaming o doppio download, HTTP, binario invalido, import errati e abort prima/durante lettura e dopo istanziazione. Gli helper memoria sono verificati su UTF-8, NUL, surrogate isolate, input/range invalidi, capacita insufficiente senza scritture parziali, grow e buffer distaccati, alias/copie ed esclusione della memoria condivisa.

Con anche Playwright configurato come sotto:

```powershell
node --test _Meta/tests/javascript-wasm-browser.test.mjs
```

12 test Chrome: pagina HTML e moduli JS estratti dalla nota, binario prodotto dal WAT e URL risolti sotto `/demo/`. Verificati streaming/fallback, HTTP, ABI, UTF-8, grow, abort, errori gestiti e compilazione bloccata/consentita da CSP. Le risposte HTTP e gli header sono intercettati; esecuzione Wasm e policy del browser sono native. Nessuna modifica alla CSP del sito o generazione di asset demo dentro Quartz.

## Memory Lifecycle e Garbage Collection

```powershell
node --test _Meta/tests/javascript-memory.test.mjs
```

24 test Node sugli snippet estratti dalle note: primitivi, alias, parametri, closure, cicli e rimozione delle voci da una Map. Il ticker usa timer simulati per controllare input, lunghezza corrente, stop idempotente, callback obsolete, stop interno ed errori. WeakRef e FinalizationRegistry sono native per i casi deterministici; il target assente e simulato per provare il fallback senza attendere il GC. Il modulo con process.memoryUsage viene eseguito in un processo Node separato e controllato per forma e valori numerici, non per consumo atteso.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-memory-browser.test.mjs
```

8 test Chrome: markup, avvio e cleanup del widget estratti dai Markdown. Verificati click, input invalidi, testo non interpretato come HTML, dati del chiamante preservati, listener altrui non rimossi, cicli mount/unmount, cleanup ripetuto e nodi distaccati. Listener e cleanup conservati intenzionalmente dal test sono richiamati dopo lo stop per verificare l'assenza di effetti. Controllate anche WeakRef e FinalizationRegistry native. Nessuna attesa del collector, nessun heap snapshot del profilo personale.

## Memory Leaks e WeakMap/WeakSet

```powershell
node --test _Meta/tests/javascript-leaks-weak.test.mjs
```

34 test Node sugli snippet e sui contratti descritti nelle note. Provati globali accidentali in realm isolati non strict/strict, snapshot dell'ID nella closure, cache LRU con input invalidi, recenza, alias, undefined, eviction e pulizia. Per le collezioni deboli: identita, chiavi oggetto/funzione/simbolo, scritture rifiutate e letture assenti, assenza di enumerazione, valori condivisi, fallback has/set e stato privato. La visita del grafo gestisce cicli, nodi condivisi, dati invalidi e 12.000 livelli senza ricorsione. Non viene misurata la raccolta degli oggetti.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-leaks-weak-browser.test.mjs
```

15 test Chrome in contesti isolati: vista dimensioni con listener cancellabile, cleanup ripetuto, listener altrui preservati, callback obsolete e nodi distaccati. Fetch nativo con risposte intercettate prova successo, HTTP, JSON/schema e abort durante l'attesa. Operazioni simulate che ignorano abort provano risposte, corpo ed errori tardivi senza aggiornare l'output smontato. Verificati anche metadati DOM e getOrInsert/getOrInsertComputed nativi, incluso il valore undefined gia presente. Node.js 24.14.0 non espone questi due metodi e usa il fallback; Chrome 154.0.8037.98 esegue il ramo nativo.

## Optimization e Buffer/Typed Arrays

```powershell
node --test _Meta/tests/javascript-optimization-buffers.test.mjs
```

42 test Node sugli esempi estratti dai Markdown. Verificati risultato della misura senza soglie di performance, Set, formatter, factory, debounce trailing e throttle leading-only. Timer/orologio simulati controllano this, argomenti, rientranza, cancel, errori, prima chiamata a zero e limiti del delay. Il test DOM simulato verifica che tutte le letture precedano le scritture, non il costo del layout.

Provati conversioni, copie/alias, DataView con offset, resize, transfer, feature detection e codifica UTF-8. Il parser binario copre BOM, NUL, code point supplementari, limite di 65.535 byte, sottoviste e Buffer Node, input e header invalidi, lunghezza, UTF-8 malformato e rifiuto di memoria condivisa/ridimensionabile/distaccata. Fetch usa risposte simulate e propaga errori; il modulo Node Buffer viene eseguito con il proprio import originale.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-optimization-buffers-browser.test.mjs
```

11 test Chrome: filtro con timer reali, markup e cleanup estratti dalla nota, 20 cicli mount/unmount, callback tardive, listener esterni preservati, input invalidi e dimensioni border-box su NodeList. Eseguiti snippet binari nativi, parser, Fetch con risposte intercettate, errori e abort. SharedArrayBuffer/Atomics vengono provati in un contesto HTTPS temporaneo con COOP/COEP e crossOriginIsolated, in un solo thread; nessuna modifica alle intestazioni del sito Quartz.

## Proxy/Reflect e Circular Dependencies

```powershell
node --test _Meta/tests/javascript-proxy-cycles.test.mjs
```

42 test Node: snippet Proxy estratti dai Markdown, identita e alias, Symbol, receiver, strict/non strict, esiti Reflect, doppio percorso set/defineProperty, apply/newTarget, invarianti e revoca. Il record con age e provato su inizializzazione, assegnazione e descrittori, input invalidi, accessor rifiutati, schema non estensibile e freeze.

Il helper `cycle-examples.mjs` associa i file ai casi della nota. Le fixture ESM/CommonJS sono scritte in directory temporanee dedicate, verificate prima della rimozione, ed eseguite in processi Node puliti con timeout. Provati TDZ da entrambi gli ingressi, funzioni/live binding, classi con due entry point, injection e propagazione degli errori, export CommonJS parziali/sostituiti, import lazy riuscito/fallito e uscita 13 per il ciclo con top-level await. Varianti mirate cambiano const in var o aggiungono una chiamata anticipata per verificare le differenze descritte nel testo.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-proxy-cycles-browser.test.mjs
```

14 test Chrome in contesti puliti: snippet Proxy, validazione con descrittori, moduli ESM reali restituiti da richieste intercettate, markup module della nota, errori TDZ, classi, composizione e lazy loading. Verificato che la feature non venga richiesta prima della chiamata. Il caso di attesa reciproca resta pendente nella finestra osservata dopo il caricamento dei moduli; il contesto viene poi chiuso, senza attendere indefinitamente. CommonJS e provato solo in Node.

## Decorators

```powershell
node --test _Meta/tests/javascript-decorators.test.mjs
```

26 test Node: 24 casi condivisi con il browser, controllo dei sette blocchi JS e prova del comando CLI della nota in una directory temporanea dedicata. Il helper `decorators-examples.mjs` estrae gli esempi e li trasforma con esbuild, gia presente in `site`; versione verificata 0.27.3, target ES2022, experimentalDecorators false e useDefineForClassFields true. La demo CLI viene eseguita come modulo ESM e la sua cartella viene rimossa dopo averne verificato il percorso assoluto.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-decorators-browser.test.mjs
```

24 test Chrome in contesti isolati eseguono lo stesso output trasformato. Coprono receiver, Symbol, static/private, argomenti, errori, identita Promise, logger fallito, ordine factory/applicazione/wrapper, durata sincrona e attesa asincrona con orologio simulato. Verificati validazione iniziale dei campi, successive scritture degli auto-accessor, enumerabilita, receiver invalido, binding, composizione, fasi degli inizializzatori e registrazione tardiva. Metadata verificati su classe e sottoclasse, con bootstrap isolato del simbolo.

Questi test non dimostrano supporto nativo della sintassi decorator. Non sono provati Babel, tsc, la modalita legacy, reflect-metadata, framework DI o ogni revisione della proposta TC39. I tempi sono controllati tramite un orologio simulato, non misure di prestazioni; le Promise e gli slot privati dell'output compilato sono eseguiti dal runtime reale.

## Sicurezza e CORS

```powershell
node --test _Meta/tests/javascript-security-cors.test.mjs
```

24 test Node: URL delle origini, input e token del client CSRF, header, corpo, status 204 e rifiuti HTTP/rete/abort senza retry. Il server CORS viene importato dal blocco Markdown come modulo ESM, senza duplicarne l'implementazione. Verificati allowlist esatta e copiata, origini null/non consentite, assenza di Origin, Vary/no-store, preflight accettati e rifiutati, PUT dimostrativo, 404/405 e schema del client. Controllata la sintassi dei sette blocchi JS, incluso il file di avvio.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-security-cors-browser.test.mjs
```

21 test Chrome con server HTTP temporanei su loopback, porte assegnate dal sistema e contesti puliti. Per i moduli della demo si sostituisce soltanto l'origine locale fissa con la porta della fixture; il markup HTML della nota e eseguito interamente. Rendering testuale e URL sono provati nel DOM reale, compreso il rifiuto di blob con origine HTTPS incorporata. Fetch, preflight, cookie HttpOnly, filtraggio degli header e risposte opache sono comportamenti nativi, non risposte simulate da Playwright.

Provati invio di POST semplice senza lettura della risposta, blocco della richiesta dopo preflight fallito, header mancanti nella risposta finale, cookie con omit/default/include e assenti in OPTIONS, wildcard con include senza cookie, Authorization esplicito con omit, header esposti e Set-Cookie non leggibile, 404 leggibile, no-cors e same-origin. Il client CSRF usa un token fittizio e un endpoint locale di test; verificato il rifiuto dei redirect prima di inviare il token all'altra route.

Una sonda distinta registra la compatibilita di Authorization con Allow-Headers wildcard: Chrome 154.0.8037.98 la accetta con omit, diversamente dal requisito Fetch di dichiararlo esplicitamente. Il test distingue entrambi gli esiti possibili e li registra, senza certificare conformita allo standard; il percorso con allowlist esplicita e testato separatamente.

Limiti: nessun audit completo, sanitizer HTML, backend autenticato, emissione/verifica crittografica di token o sessione, TLS, cookie cross-site/di terze parti, cache CDN o matrice browser. I cookie sono fittizi, same-site su porte diverse e HTTP locale; non collaudano il cookie HTTPS di produzione descritto nella nota. Il server Python della procedura non e eseguito dai test: la fixture HTTP serve gli stessi file. I server temporanei vengono chiusi, senza modificare quello dell'anteprima Quartz.

## CSP e sanitizzazione HTML

```powershell
node --test _Meta/tests/javascript-csp-sanitization.test.mjs
```

8 test Node: nonce da 16 byte, unicita nel campione e corrispondenza header/markup, hash deterministico e sensibile ai newline, modalita invalide, direttive e header. Provati query string, caratteri riservati, limiti e rifiuto di input invalidi. Controllata la sintassi dei quattro blocchi JS; le funzioni eseguite sono estratte dai Markdown, non duplicate nei test.

Il browser richiede Playwright come descritto sotto e DOMPurify **3.4.16**. Installazione isolata, senza cambiare le dipendenze di Quartz:

```powershell
npm install --prefix (Join-Path $env:TEMP 'appunti-sanitizer-tools') --save-exact --ignore-scripts --no-audit --no-fund dompurify@3.4.16
```

```powershell
$env:DOMPURIFY_MODULE_PATH = Join-Path $env:TEMP 'appunti-sanitizer-tools/node_modules/dompurify'
```

```powershell
node --test _Meta/tests/javascript-csp-sanitization-browser.test.mjs
```

25 test Chrome con moduli reali, contesti isolati e server HTTP loopback temporanei. DOMPURIFY_MODULE_PATH indica la cartella del pacchetto, non il file ESM; la fixture verifica la versione e serve il suo purify.es.mjs. Nessun sanitizer fittizio e nessuna risposta CSP intercettata da Playwright.

Verificati nonce/hash validi e invalidi, report-only, eventi inline, eval, connect-src e fallback, policy multiple, loader con/senza strict-dynamic e self ignorato per script parser-inserted. Le prove di blocco usano codice eseguito da script della pagina autorizzati, non eval lanciato da DevTools; le violazioni attese non sono errori del test.

Verificati rendering testuale, query con origine corrente e demo HTML completa. Provati tag consentiti, attributi rimossi, script/immagini/link/form/SVG/MathML/custom element esclusi, markup incompleto ed entita. Controllati DOM finale, tipo e documento della destinazione, input invalidi senza coercizione, contenuto preservato su errore, sostituzione, vuoto e limite massimo.

Limiti: non e un audit XSS esaustivo o una prova crittografica della casualita. Non verificati consegna dei report a un collector, enforcement Trusted Types, browser diversi, DOM server-side, integrazione CDN/cache o applicazione della policy a Quartz. Il launcher server.mjs della nota e controllato sintatticamente; la fixture serve direttamente le risposte prodotte dalla funzione reale. Il comando Python e descritto ma non eseguito. DOMPurify resta isolato fuori dal vault; nessuna modifica a package.json o lockfile del sito in questo blocco.

## Supply chain npm

La procedura e verificata con Node.js 24.14.0 e **npm 11.19.0**. Il runner usa per default npm accanto al binario Node. Se il comando npm risolve un'altra installazione, imposta NPM_CLI_PATH al percorso assoluto del suo npm-cli.js; il test controlla la versione prima di procedere. Per l'installazione globale utente verificata su Windows:

```powershell
$env:NPM_CLI_PATH = Join-Path (npm config get prefix) 'node_modules/npm/bin/npm-cli.js'
```

```powershell
node --test _Meta/tests/javascript-supply-chain.test.mjs
```

12 test Node eseguono la CLI reale su directory temporanee e tarball locali generate dal test. Il package.json dimostrativo e i comandi principali vengono estratti dal Markdown. Verificati lockfile-only, ci senza lockfile/incoerente, manifest e lock immutati, ricreazione di node_modules, lifecycle del progetto/dipendenza saltati o eseguiti, build esplicita con/senza pre/post hook, ls/explain, omit=dev e pack dry-run senza hook o tarball.

Le fixture hanno configurazione utente/globale e cache isolate, offline attivo e registry loopback non utilizzabile. Non ereditano token, configurazioni npm arbitrarie o NODE_OPTIONS. Gli script controllati stampano messaggi o scrivono un solo marker nella dipendenza temporanea; non eseguono pacchetti esterni. Prima del cleanup ricorsivo viene verificato che la directory risolta sia la fixture creata dentro la directory temporanea.

Non vengono eseguiti audit/advisory o verifica firme contro registry reali, npm view/outdated online, pubblicazione, OIDC, gestione token, npm 12, dipendenze native/Git o una CI remota. I relativi comportamenti sono documentati da fonti ufficiali, non certificati da questi test. Nessun npm ci/install del test opera nella directory site e nessun lockfile del vault viene modificato.

## Node.js Runtime: Basics

Con la CLI npm 11.19.0 risolvibile tramite `NPM_CLI_PATH`, come nella sezione Supply chain:

```powershell
node --test _Meta/tests/javascript-node-basics.test.mjs
```

38 test Node estraggono config, CLI, manifest, file dimostrativi e test dalla nota Node.js Basics. Verificati default e limiti della configurazione, input invalidi, caricamento esplicito di .env e precedenza dell'ambiente, file mancanti/vuoti, percorsi con spazi, working directory distinta dagli import, stdout/stderr e codici di uscita. Provati inoltre runtime senza DOM, timer dopo codice sincrono, formati mjs/cjs/type, errore require in ESM, avvio npm, inoltro argomenti e test runner del demo.

Processi reali in fixture temporanee con ambiente e configurazione npm isolati; cleanup limitato al percorso risolto della directory creata. Nessuna installazione, richiesta al registry, modifica alle dipendenze del sito o scrittura nei file personali. La CLI legge piccoli file fidati: i test non certificano limiti di memoria, sicurezza di input remoti o gestione Unicode dei caratteri percepiti. Non sono provati watch/restart, shutdown di server, permessi del filesystem, pnpm/Yarn o una matrice di piattaforme/versioni.

## Node.js Runtime: File System, Path e Process

```powershell
node --test _Meta/tests/javascript-fs-path-process.test.mjs
```

77 test Node estraggono moduli e demo dalle due note. Provati lettura testo/Buffer, file opzionale vuoto/assente, abort gia richiesto, wx e conservazione del target, append, directory ordinate, dimensione in byte, rimozione del solo file dimostrativo e lettura limitata con FileHandle. L'esportazione JSON e provata su schema valido/invalido, parsing fallito, timestamp, selezione dei campi, sorgente conservato e output preesistente. Le pipeline eseguono copie binarie e propagano errori di sorgente/destinazione.

Le prove path/process coprono semantica POSIX e win32 esplicita, directory del modulo distinta dalla cwd, conversione URL con spazi e caratteri speciali, argv/execArgv, validazione di PORT/VERBOSE e precedenza CLI/ambiente/default. Le CLI reali vengono avviate con ambiente ridotto: verificati stdout/stderr, exit code e mancata esposizione dei campi riservati o del JSON malformato nei log.

Tutti i file sono in directory temporanee create dal test; la rimozione ricorsiva avviene solo dopo controllo del percorso risolto. Un link simbolico a directory (junction su Windows) collega due sottocartelle della stessa fixture e dimostra che il target reale puo essere fuori dalla base lessicale. Nessun accesso a dati personali, servizi esterni o registry; nessuna modifica alle dipendenze del sito.

Limiti: non sono un audit anti-path-traversal, un benchmark di memoria o un collaudo di crash, aggiornamenti concorrenti ostili, filesystem di rete, watcher, permessi multipiattaforma o shutdown dei servizi. L'abort e provato prima della lettura, non come rollback di una scrittura. I test FileHandle esercitano lettura e apertura fallita; non simulano un guasto intermedio di read/close. La sicurezza di una cancellazione reale non deriva dal successo di questa fixture.

## Node.js Runtime: Events e Streams

```powershell
node --test _Meta/tests/javascript-events-streams.test.mjs
```

58 test Node estraggono helper e demo dalle due note tramite AST. Verificati dispatch sincrono, receiver, registrazioni duplicate, once ricorsivo, off e cleanup idempotente, errori dei listener e captureRejections, attese installate prima della sorgente, abort ed errori di events.once. Il job e provato su batch vuoti, esecuzione sequenziale, sovrapposizione rifiutata, snapshot dell'array, worker e osservatori falliti, stato riutilizzabile e CLI completa.

Le prove stream eseguono lettura UTF-8 con caratteri multibyte a cavallo dei chunk, consumer asincrono sequenziale, scritture esclusive da iterable sincroni/asincroni, compressione e decompressione binaria reale, file vuoti/mancanti e destinazioni esistenti. Verificati serializzazione JSON Lines ed errori, break del Readable, write false con drain, errore della destinazione e abort durante una pipeline controllata. I pre-abort degli helper sono provati prima dell'apertura dei file.

Fixture temporanee e processi reali con ambiente ridotto; cleanup ricorsivo limitato alla directory creata, dopo verifica del percorso risolto. Nessuna rete, installazione o modifica a file personali e dipendenze del sito. Per questa suite non servono Playwright o npm CLI.

Limiti: niente benchmark di memoria/backpressure, prova di durabilita o rollback, matrice di sistemi operativi, carico HTTP o produttori async non cooperativi. L'abort durante il trasferimento e verificato su stream in memoria controllati, non mediante timing su file reali. Il confronto gzip riguarda il contenuto decompresso, non byte di archivio identici fra versioni. I test di cleanup verificano listener e stati osservabili, non tempi di garbage collection.

## Node.js Runtime: Buffer e HTTP server

```powershell
node --test _Meta/tests/javascript-buffer-http.test.mjs
```

79 test Node estraggono moduli, CLI e demo dalle note. Verificati lunghezze UTF-8/UTF-16, allocazione azzerata, conversioni numeriche, copia/alias, viste con offset, endianness e BigInt, hex rigoroso e conversione nativa permissiva, UTF-8 fatal, concatenazione e Base64. Il lettore limitato viene provato con file binari, nomi con spazi, file vuoti/mancanti, directory, limite esatto e superato, configurazioni invalide e diagnostica CLI.

Server HTTP reali ascoltano solo su 127.0.0.1 e porte assegnate dal sistema. Provati GET/HEAD, query, 404/405 e Allow, target rifiutati, byte length, charset/MIME, JSON/schema, UTF-8 invalido, BOM e body chunked. Verificati limite esatto, rifiuto anticipato tramite Content-Length, 413 dopo conteggio reale, header oltre limite, errori sync/async del servizio senza dettagli interni, upload interrotto, client disconnesso e signal cooperativo. Lo shutdown e provato sia attendendo una risposta attiva sia forzando la chiusura dopo il periodo di grazia.

Il client della nota contatta la fixture reale sostituendo soltanto la porta tramite il wrapper Fetch del test. La CLI server viene eseguita su argomenti invalidi e porta gia occupata dalla fixture; avvio riuscito e shutdown sono provati attraverso il modulo del server. Non vengono inviati SIGINT/SIGTERM a processi reali, ne certificata la gestione dei segnali su ogni sistema operativo.

File e processi temporanei con ambiente ridotto, cleanup dopo verifica dei percorsi risolti; server e socket chiusi alla fine delle prove. Nessuna richiesta esterna, registry, installazione o modifica al sito. Il sandbox puo impedire queste prove locali su socket e filesystem: non interpretare tale blocco come un errore delle note.

Limiti: non sono benchmark di memoria o un audit di parser HTTP, request smuggling, TLS, proxy, autenticazione, CORS, rate limiting o carico ostile. I timeout di ricezione/inattivita sono controllati come configurazione, non attendendo le loro scadenze reali; la tolleranza di shutdown viene invece esercitata. Le scritture HTTP frammentate possono essere ricombinate dal trasporto: non si assume una corrispondenza fra write del client e chunk lato server. Non vengono simulati short read/errori intermedi/close fallito del FileHandle, modifiche concorrenti al file o comportamento del pool in tutte le versioni.

## Node.js Runtime: Child process e Worker threads

```powershell
node --test _Meta/tests/javascript-child-worker.test.mjs
```

90 test Node sugli snippet estratti dal Markdown: programmi figli completi, argomenti letterali, UTF-8, input invalidi, JSON/schema, exit code e limiti stdout/stderr. Sono verificati anche ambiente ridotto, pre-abort, abort dopo l'avvio, cwd mancante, output ereditato e timeout reale su un processo figlio controllato.

I worker reali verificano conteggio dei primi e limiti, errori di costruzione, file mancante, input non clonabile, messaggi malformati/duplicati, uscita senza risultato, errore dopo il risultato, timeout e interruzione di un loop CPU. Sono controllati cleanup dei timer/listener, clone/transfer con ownership e Buffer ricevuto come Uint8Array. CLI e demo MessageChannel vengono eseguiti integralmente.

Fixture temporanee con percorsi verificati prima della rimozione, ambiente dei processi ridotto, nessun comando shell costruito da input e nessuna rete esterna. I processi e i thread avviati appartengono ai test; non vengono terminati servizi dell'utente.

Limiti: verifiche eseguite su Windows e Node 24.14.0, non una matrice OS/versioni. Nessuna prova di processi discendenti, shell injection contro tool reali, fork/IPC, segnali POSIX ignorati, pool, limiti RAM, OOM o sandbox. Messageerror nativo e fallimento interno di terminate non sono forzati; SharedArrayBuffer non e usato per un protocollo concorrente. I timeout non sono benchmark o deadline garantite. La prova di execFile su abort attende l'uscita del processo di fixture esterno, senza attribuire alla sola Promise del wrapper una garanzia di chiusura.

## Tooling: Testing ed ESLint

La suite richiede la CLI npm indicata da `NPM_CLI_PATH` e un'installazione separata dei tool, senza aggiungerli a Quartz. Per ricreare quella usata nelle prove, dalla shell PowerShell:

```powershell
$tools = Join-Path $env:TEMP 'appunti-eslint-tools'
npm install --prefix $tools --save-exact --ignore-scripts --no-audit --no-fund eslint@10.12.0 @eslint/js@10.0.1 globals@17.13.0
```

Il comando contatta il registro e scrive soltanto nella directory degli strumenti e nella cache npm. I test successivi usano le dipendenze locali, senza download.

```powershell
$env:ESLINT_TOOLS_DIR = Join-Path $env:TEMP 'appunti-eslint-tools'
node --test _Meta/tests/javascript-testing-eslint.test.mjs
```

74 test editoriali Node. Eseguono la suite di 11 test presentata nella nota Testing, il filtro per nome e il comando coverage; due alterazioni intenzionali nelle sole fixture verificano che i test rilevino gli errori. Provati inoltre limiti dello sconto, input e record invalidi, assenza distinta da guasto, propagazione asincrona e copia dei campi pubblici.

La configurazione ESLint e estratta integralmente dal Markdown ed eseguita con ESLint 10.12.0, @eslint/js 10.0.1 e globals 17.13.0. Prove API/CLI e npm verificano regole, scope browser/Node/CommonJS, import non risolto dal core, warning/soglie, exit code 0/1/2, ignore, disable inutili, fix/dry-run, print-config, debug e ricerca della configurazione da ciascun file in v10. Il comando print-config e stato corretto dopo aver osservato che lo script con `.` introduceva un secondo percorso.

Le fixture temporanee usano un link/junction verso le dipendenze esterne, non una nuova installazione per ogni caso. La rimozione controlla prima il percorso risolto della fixture; non elimina il target delle dipendenze. I test eseguono codice di esempio fidato e non modificano la configurazione o i pacchetti del sito.

Limiti: Node 24.14.0 e Windows, non una matrice OS/runtime. Non provati Jest, Vitest, plugin framework/import/TypeScript, editor, CI remota o watch persistente. I frammenti browser/server di ESLint sono analizzati dal linter, non collaudati come applicazione UI/backend. La coverage non certifica requisiti, correttezza contabile o assenza di difetti; le due mutazioni non sono una campagna completa di mutation testing.

## Tooling: Prettier e Vite

La suite usa Prettier 3.9.10 e Vite 8.3.4 installati fuori dal vault, la CLI npm indicata da `NPM_CLI_PATH` e Playwright/Chrome. Installazione iniziale, separata dai test:

```powershell
$tools = Join-Path $env:TEMP 'appunti-prettier-vite-tools'
npm install --prefix $tools --save-exact --ignore-scripts --no-audit --no-fund prettier@3.9.10 vite@8.3.4
```

Esecuzione successiva senza download:

```powershell
$env:PRETTIER_VITE_TOOLS_DIR = Join-Path $env:TEMP 'appunti-prettier-vite-tools'
node --test _Meta/tests/javascript-prettier-vite.test.mjs
```

32 test editoriali: 28 Node (incluso il contenitore della verifica del lifecycle) e 4 browser. I file dei progetti dimostrativi sono estratti dal Markdown tramite AST. Prettier e verificato con output esatto, idempotenza, mancato controllo semantico, parsing fallito, printWidth, lookup/override/EditorConfig, ignore, CLI e script npm, exit code 0/1/2, scrittura e anteprima API senza modifiche.

Vite viene provato con build npm reale, base /appunti/, CSS/asset, copia di public, pulizia di un vecchio output nella sola fixture, import mancante, TypeScript non verificato semanticamente e variabili dei mode. Una stringa privata fittizia resta fuori dal bundle; i valori pubblici e PROD sono controllati nell'output staging. Dev server e preview usano la configurazione della nota con la sola porta sostituita da 0, assegnata dal sistema; verificati host loopback e rifiuto di una porta gia occupata.

Chrome verifica il contatore, il link pubblico, CSS HMR senza perdere lo stato e reload completo dopo modifica al modulo vanilla. La build viene poi aperta su desktop/mobile, verificando titolo production, codice funzionante, assenza di overflow ed errori; cambiare il file env dopo la build non cambia il bundle servito. Questa prova non e il controllo visuale separato delle pagine Quartz.

Le fixture creano link/junction ai soli pacchetti esterni e shim CLI locali per gli script npm; non installano dipendenze a ogni caso. Configurazione e cache Vite restano nelle directory di prova. Server, browser e watcher sono chiusi; la rimozione ricorsiva verifica il percorso risolto e riguarda soltanto la fixture, non il target dei link. Nessun accesso a backend esterni o modifica dei pacchetti Quartz.

Limiti: Windows, Node 24.14.0 e Chrome 155.0.8059.40, non una matrice OS/browser. Nessun collaudo di editor, hook, plugin di terzi, template create-vite, framework, library mode, SSR, reverse proxy, hosting remoto o compatibilita legacy. La prova di mancata esposizione riguarda un valore fittizio con il prefisso predefinito, non un audit completo dei segreti. Il caso TypeScript dimostra che la build non fa type checking; non esegue tsc. Installazione con script disabilitati riuscita per i pacchetti e la piattaforma provati, non garanzia per qualunque plugin.

## Tooling: Bundling e source map

La suite riusa Vite 8.3.4 dalla directory `PRETTIER_VITE_TOOLS_DIR` descritta sopra, la CLI npm indicata da `NPM_CLI_PATH` e Playwright/Chrome. Non installa altri pacchetti.

```powershell
node --test _Meta/tests/javascript-bundling-sourcemaps.test.mjs
```

24 test editoriali: 20 Node e quattro Chrome. I demo completi sono estratti dal Markdown tramite AST e costruiti con Vite reale. Sono provati import nominati e namespace statici/dinamici, manifest, funzione inutilizzata con effetti nel corpo, inizializzazione del modulo, metadati sideEffects corretti/errati e annotazioni PURE con argomenti che hanno effetti.

Tre casi diagnostici distinguono tree shaking e DCE nell'output: Vite 8.3.4 conserva dce-only con build.minify false. Disabilitare un solo passaggio non conserva la funzione inutilizzata; disabilitando entrambi il marcatore resta. Questi casi hanno corretto l'assunzione iniziale del test, non un difetto della toolchain. Le varianti sintetiche di metadati e annotazioni sono create soltanto nelle fixture.

Le mappe sono verificate come JSON: modalita esterna, inline, hidden e false; sourcesContent presente/omesso, sorgente eliminato dal JavaScript ma ancora nel testo della mappa. Un GET reale dimostra che hidden non impedisce l'accesso al file distribuito. Una piccola entry destinata a Node verifica distintamente gli stack con e senza --enable-source-maps.

Chrome verifica caricamento del chunk al primo click, riuso del modulo e errore di rete intercettato senza bloccare il pulsante. Il debugger CDP si ferma sull'eccezione reale del bundle minificato; SourceMap di Node traduce la posizione generata nella riga originale. La correzione del chiamante viene ricostruita e provata su desktop/mobile, con risultato ADA e senza errori.

Fixture temporanee con link/junction alle dipendenze esterne, shim CLI locali e server loopback su porte assegnate dal sistema. Cleanup di server/browser e verifica del percorso risolto prima della rimozione; nessuna rete esterna durante le prove o modifica dei pacchetti Quartz.

Limiti: Windows, Node 24.14.0, Vite 8.3.4 e Chrome 155.0.8059.40. La traduzione CDP/SourceMap non automatizza l'interfaccia DevTools, Watch, logpoint o tutti i breakpoint. Non provati upload a error tracker, policy di hosting/CDN, cache di vecchie release, catene TypeScript/plugin, librerie pubblicate, CSS side effects, CommonJS o tutte le ottimizzazioni dei bundler. Le prove su console in VM riguardano fixture isolate, non un DOM completo. Nessun benchmark, audit dei segreti o matrice multipiattaforma.

## Applicazioni: SPA e API REST

La suite riusa Vite 8.3.4 dalla directory `PRETTIER_VITE_TOOLS_DIR` e Playwright/Chrome, senza nuove dipendenze del sito. Le API Fetch/Response sono quelle native di Node 24.14.0 e del browser.

```powershell
node --test _Meta/tests/javascript-spa-rest.test.mjs
```

44 test: 32 Node e 12 Chrome. Il codice di router, client HTTP e demo e estratto direttamente dal Markdown tramite AST. Il progetto SPA viene costruito con Vite e servito in preview su loopback; i test di parsing e del contratto REST usano risposte controllate.

Il client REST e verificato per base URL, ID, nomi, limiti e assenza di chiamate su input invalido; proiezione dei campi, body/header, GET/POST/DELETE, 204 senza JSON, status 2xx inattesi, media type, parsing, schema e ID incoerente. Gli errori Problem Details non sostituiscono lo status reale o espongono campi aggiuntivi; HTML, JSON malformato, errori di trasporto e pre-abort hanno prove distinte.

Tre server HTTP temporanei provano richieste reali, rifiuto dei redirect e abort dopo l'inizio della lettura JSON del corpo incompleto. Un wrapper strumenta la chiamata nativa response.json per sincronizzare quel test senza affidarsi a una pausa temporale. Il demo offline viene eseguito integralmente da Node. Nel browser, Fetch con risposte intercettate prova il contratto e l'omissione di un cookie fittizio gia presente sul dominio.

Le prove SPA verificano ingresso diretto, refresh e query, aggiornamento di URL/titolo/focus/aria-current senza nuovo documento, click ripetuto, Indietro/Avanti con stato null, 404 client e nomi ereditati, query non fidata, elementi annidati e cleanup idempotente. Quindici casi di click sono eventi sintetici con default finale bloccato dal test; Ctrl/Cmd-click, Enter e navigazione a un'ancora sono invece azioni reali di Chrome. Verificato anche che pushState/replaceState non aggiornino da soli la vista.

Fixture e collegamenti alle dipendenze vivono in directory temporanee, rimosse dopo controllo del percorso risolto. Server e browser sono chiusi; non vengono modificati routing, cookie o sorgenti di Quartz. Nessuna rete esterna o installazione durante i test.

Limiti: Windows, Node 24.14.0, Vite 8.3.4 e Chrome 155.0.8059.40, non una matrice browser/hosting. Il demo REST non e un backend con database, autenticazione o piena conformita REST; non sono collaudati PUT/PATCH, ETag, cache, paginazione, retry, limiti di byte, CORS o rollback server. Lo schema timeout della nota non viene atteso per cinque secondi: propagazione del signal e abort reale sono verificati separatamente. Per il router non sono provati framework, loader asincroni, scroll restoration con contenuti variabili, screen reader, BFCache, CSP, hash router o policy remote di fallback. I controlli del sito Quartz restano separati.

## Applicazioni: Server-side rendering

La suite usa soltanto Node.js e Playwright/Chrome gia disponibili, senza nuove dipendenze del sito.

```powershell
node --test _Meta/tests/javascript-ssr.test.mjs
```

33 test: 25 Node e otto Chrome. I quattro file del demo sono estratti dal Markdown tramite AST e scritti nella sola fixture temporanea. Renderer e server vengono importati realmente; una prova avvia anche main in un processo figlio, cambiando soltanto porta e URL stampato per usare una porta assegnata dal sistema.

Le prove Node coprono escaping, Unicode e dati di tipo errato; HTML iniziale, ricerca, trim, query duplicate e limite UTF-16, Content-Length in byte, GET/HEAD, asset fisso, 404/405/500 e header. Richieste HTTP native verificano il rifiuto dei target con autorita esterna. Un loader asincrono controllato sincronizza due richieste contemporanee per verificare la separazione di query e risultati. Errori e dati invalidi del loader non espongono dettagli nella risposta.

Chrome prova contenuto e form con JavaScript disabilitato, ordinamento dei nodi esistenti senza richieste, script bloccato, ricerca vuota, 404 reale e tastiera mobile. Due prove rimuovono la CSP solo nella risposta intercettata della fixture: l'assenza di markup iniettato dipende cosi dall'escaping, non da un blocco dello script da parte della policy. Il demo ordinario mantiene la CSP della nota e carica il modulo esterno.

Server loopback, browser e processo figlio vengono chiusi. La rimozione della directory temporanea controlla percorso risolto, parent e prefisso; nessuna modifica al sito, nuova installazione o rete esterna. Corretto un falso positivo iniziale dell'assertion: la parola italiana Errore non e lo stack JavaScript Error:.

Limiti: Windows, Node 24.14.0 e Chrome 155.0.8059.40; non una matrice browser o un audit XSS completo. Non vengono eseguiti hydration React, RSC, streaming, SSG, rigenerazione, edge, database, autenticazione, cache/CDN, deadline del loader o deployment. La concorrenza prova lo stato locale del demo, non l'isolamento di un sistema multiutente. Nessun benchmark SEO/performance, prova sotto carico, certificazione accessibilita o interruzione controllata del lavoro remoto. Le verifiche della pagina Quartz sono separate.

## Promemoria JavaScript

`javascript-promemoria.test.mjs` controlla tutte le 11 schede operative JavaScript, estraendo i blocchi dal Markdown tramite AST.

```powershell
node --test _Meta/tests/javascript-promemoria.test.mjs
```

Richiede Playwright/Chrome come le altre suite browser; usa esbuild gia presente in site soltanto per il controllo sintattico. Nessuna nuova dipendenza del sito.

64 test superati: 49 Node, di cui 11 gruppi di sola verifica sintattica (uno per scheda), e 15 Chrome. Il parsing di tutti i blocchi JavaScript non equivale alla loro esecuzione integrale.

- Node: binding, nullish/default, copie, funzioni/closure/this, mutazioni degli array, raggruppamento con chiavi speciali, proiezione dei campi, Map/Set, regex e precisione numerica.
- Date: processi separati in UTC ed Europe/Rome, con confronto fra sette giorni di calendario e durata fissa attraverso il cambio d'ora. I moduli ESM vengono scritti in fixture temporanee ed eseguiti realmente da Node e Chrome.
- Promise e Fetch: catene e cleanup, combinatori, lavoro sequenziale/concorrente, cancellazione del corpo, status/media type/schema, query e timeout durante la lettura JSON. Le prove VM usano fake dichiarati; il server loopback verifica anche una risposta HTTP reale incompleta.
- Chrome: selezioni DOM, testo, spostamento dei nodi, listener e cleanup, campi FormData ripetuti, delegazione che esclude liste annidate, DOMContentLoaded prima/dopo il caricamento, storage valido/corrotto/bloccato, reload di sessionStorage, abort immediato e header Authorization con credentials omit.
- Lo storage viene cancellato soltanto nell'origine locale isolata della fixture. Le prove di quota e accesso negato sostituiscono le API; non simulano una quota reale del browser. Le richieste intercettate non contattano un backend autenticato.

Directory temporanee rimosse dopo verifica di percorso risolto, parent e prefisso; server e contesti browser chiusi. Nessuna rete esterna, credenziale o modifica a dati personali. Limiti: versioni indicate, non matrice browser, benchmark o audit di sicurezza; gli esempi intenzionalmente schematici ricevono il contesto dichiarato nei test. Le prove delle schede Quartz sono separate dall'esecuzione degli snippet.

## Fondamenta React

`react-fondamenti.test.mjs` estrae gli esempi dalle cinque note iniziali di React, senza mantenere una seconda implementazione dei componenti. Non richiede modifiche alle dipendenze di Quartz.

Installa una toolchain isolata, fuori dal vault, solo se non gia disponibile:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund react@19.3.0 react-dom@19.3.0 vite@8.3.4 @vitejs/plugin-react@6.1.2
```

Indica il percorso se diverso da quello temporaneo predefinito:

```powershell
$env:REACT_TOOLCHAIN_PATH = Join-Path $env:TEMP 'appunti-react-tools'
```

Con Playwright e Chrome risolvibili come descritto nella sezione Browser:

```powershell
node --test _Meta/tests/react-fondamenti.test.mjs
```

Risultato del 2026-10-14: **33 test superati**, 19 Node.js 24.14.0 e 14 Chrome 155.0.8059.79. Cinque test Node controllano soltanto la sintassi JSX/JS; gli altri verificano rendering statico di componenti selezionati e build del progetto completo. Rendering statico nei test non significa che il demo sia un'app SSR.

- Controllati default, booleani, Fragment, style, escaping testuale, children, condizioni, importi visualizzati e dati congelati.
- Build reale tramite API Vite; il progetto minimo viene provato nel dev server e nella preview di produzione, anche a 390 px. Non viene invocato il generatore create-vite ne una nuova installazione per ogni fixture.
- Browser: callback, contatori funzione/classe equivalenti, initialValue rispetto a key, input controllati, label con useId, filtro/selezione/reset, bozze locali e identita del nodo dopo un riordino.
- Una variante generata soltanto nella fixture sostituisce la key stabile con l'indice: la prova riproduce la bozza sulla riga sbagliata. Non e un cambiamento agli appunti o una mutation suite completa.
- Fixture con directory node_modules locale e junction per singola dipendenza, per evitare problemi della cache Vite su Windows. Collegamenti rimossi senza attraversare le destinazioni; percorso risolto, parent e prefisso verificati prima di cancellare la fixture. Server e contesti browser chiusi.

Limiti: non matrice browser, audit di accessibilita o benchmark; non eseguiti framework, RSC/hydration, error boundary, lifecycle/effect, Fast Refresh, lint o type checking. Nessuna rete esterna durante i test, nessuna credenziale o dato personale. I controlli del sito Quartz sono separati. La suite JavaScript precedente non e stata rieseguita in questo blocco React.

## React: Stato e Rendering

`react-stato-rendering.test.mjs` estrae i componenti completi da useState, useEffect, useRef e Gestione Moduli. Riusa React/React DOM della toolchain esterna del blocco precedente; aggiungi soltanto la dipendenza dell'esempio form:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund react-hook-form@7.90.0
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati come sopra, esegui serialmente anche la regressione dei fondamenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs
```

Risultato del 2026-10-15: **62 test superati**, 33 precedenti e 29 nuovi. I nuovi sono 8 Node (quattro gruppi di sola sintassi, un initializer puro e tre render statici senza effect) e 21 Chrome. Ambiente: React 19.3.0, React Hook Form 7.90.0, Node 24.14.0, Chrome 155.0.8059.79.

- Bundle dei moduli estratti con esbuild e JSX automatico, mantenuto in memoria; nessuna seconda implementazione degli esempi, file applicativo o nuova dipendenza nel vault. Questo blocco non richiede junction o directory di fixture.
- React Strict Mode nel browser: coda degli updater, reset e aggiornamenti annidati; cleanup del titolo e intervallo unico. Timer controllati con l'orologio Playwright, senza attese reali arbitrarie; verificata rimozione degli handle allo smontaggio.
- Fetch reale su server HTTP loopback per successo, selezione, encoding dell'id, HTTP 404, JSON malformato e schema non valido. Il 404 atteso viene distinto dagli errori inattesi del browser.
- Due prove usano esplicitamente un mock Fetch differito che ignora l'abort: risposte fuori ordine, rifiuto di rete/abort, caricamento al cambio id e risposta dopo unmount. Verificano il guard `active` e i signal, non il trasporto di rete o la cancellazione sul server.
- Focus, testo non controllato, riprogrammazione/cancellazione timeout e storico del valore precedente all'evento.
- Form: select/checkbox, validazione HTML, invio con Enter, stato pending, lock contro invii simultanei, successo, errore/retry, reset; credenziali fittizie e password non normalizzata. FormData con selezioni multiple e reset nativo; React Hook Form con errore accessibile e normalizzazione del nome.
- Server e browser di prova chiusi. Nessun servizio remoto, autenticazione, salvataggio reale o modifiche a package/lockfile di Quartz.

Limiti: i frammenti schematici ricevono solo controllo sintattico. Non verificati tutti i comportamenti citati in prosa, ESLint/React Compiler, Controller, resolver Zod/Yup, Actions, SSR/hydration, applicazioni backend, idempotenza o sicurezza dell'autenticazione. I render statici verificano l'assenza di esecuzione degli effect, non una soluzione SSR. Nessuna matrice browser o audit completo di accessibilita. La suite JavaScript precedente non e stata rieseguita; la verifica Quartz resta separata.

## React: Toolchain e Styling

`react-toolchain-styling.test.mjs` ricostruisce tre progetti dagli esempi di Profiler e Debugging, CSS Modules e Styling base. Riusa package/config/HTML/main della nota introduttiva e le dipendenze esterne gia indicate; nessun pacchetto aggiuntivo necessario.

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` configurati:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs
```

Risultato del 2026-10-15: **90 test React superati**, 62 precedenti e 28 nuovi. I nuovi comprendono tre gruppi di sola sintassi JSX/CSS, tre controlli delle build Vite reali e 22 prove Chrome. React 19.3.0, Vite 8.3.4, plugin React 6.1.2, Node 24.14.0 e Chrome 155.0.8059.79.

- Verificati callback Profiler con mount/update e campi numerici; filtro, stato vuoto e reset sia in sviluppo sia in produzione. Nella build di produzione normale il callback non emette record. Nessuna soglia temporale usata come requisito di performance.
- Corretto un difetto del banco di prova: chiamare Vite build e poi createServer nello stesso processo lasciava NODE_ENV=production anche al server chiamato dev. Ora le build precedono tutti i server dev, NODE_ENV e esplicito e viene verificato config.isProduction=false. Correzione applicata anche al test dei fondamenti e intera regressione ripetuta; i vecchi risultati restano validi per i comportamenti verificati, non certificavano da soli la modalita sviluppo.
- CSS Modules: nomi distinti fra file, classi multiple da composes, stili applicati, selezione e ARIA, ereditarieta delle variabili, influenza del CSS globale e limite del selettore global discendente.
- Styling: tema locale, spaziatura dinamica, submit/reset, disabled effettivo, focus da tastiera, hover e movimento ridotto. Testata la produzione a 320, 390 e 1440 px, poi con font base al 200% e titolo lungo. Quest'ultima prova ha rilevato un overflow nel titolo dell'esempio CSS Modules, corretto nella nota.
- Screenshot dei demo opzionali: impostare REACT_QA_DIR a una directory di output prima del comando. Ispezionati quattro screenshot dei demo, con desktop/mobile e tema scuro. Non e una suite automatica di confronto pixel.
- Fixture temporanee con node_modules locale e junction sulle singole dipendenze. Browser/server chiusi; junction scollegate e percorsi risolti verificati prima della rimozione delle directory di test. Dipendenze originali e sito Quartz non modificati.

Limiti: non automatizzati i pannelli dell'estensione React DevTools, le Performance tracks, un profiler di produzione dedicato, un benchmark o un audit completo di accessibilita/contrasto. Non verificati Sass, altri trasformatori CSS, utility framework o CSS-in-JS, lint e type checking. I frammenti schematici hanno solo controllo sintattico. La suite JavaScript non e stata rieseguita; le pagine Quartz vengono controllate separatamente dai demo.

## React: Hooks e Stato

`react-hooks-stato.test.mjs` estrae gli esempi di useMemo e useCallback, useReducer e Custom Hooks. Riusa la toolchain esterna gia configurata; nessuna nuova dipendenza necessaria.

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati, esegui anche la regressione precedente:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs
```

Risultato del 2026-10-15: **128 test React superati**, 90 precedenti e 38 nuovi. I nuovi comprendono **14 test Node** (tre gruppi di sola sintassi, nove prove di funzioni pure e due render statici) e **24 test Chrome**, dodici per ambiente. React 19.3.0, Node 24.14.0 e Chrome 155.0.8059.79; la regressione conserva anche le build Vite 8.3.4 dei blocchi precedenti.

- Bundle esbuild in memoria, separati con NODE_ENV esplicito development/production, stessi snippet senza riscrittura degli algoritmi. Strict Mode nel browser; nessuna fixture su disco o junction per il nuovo file.
- Funzioni pure: filtro normalizzato, contatore, initializer indipendenti, copie annidate, errore/conferma/reset, no-op e azioni invalide. Stato e azioni congelati per rilevare mutazioni, determinismo controllato su chiamate ripetute.
- Catalogo: filtro, vuoto, contatore e callback che usa il nuovo sconto, preservando la fotografia dell'ultima scelta fino al clic successivo. Non viene misurata la velocita o promesso un numero fisso di render evitati.
- Reducer montati: due dispatch consecutivi, invio con Enter, errore associato all'input, normalizzazione, modifica dopo conferma, reset; nuove props iniziali non resettano, azione esplicita e nuova key si.
- Custom hook: pannelli indipendenti con ID distinti; titolo aggiornato e ripristinato con un solo proprietario. Debounce con orologio Playwright, query successive, cambio del ritardo, due istanze, handle annullati allo smontaggio e reset al remount. Verificate anche funzioni conservate come valori senza invocazione accidentale.
- Server HTTP loopback e browser chiusi a fine test. Nessun servizio remoto, persistenza, installazione o modifica al package/lockfile di Quartz.

Limiti: gli schemi ricevono solo controllo sintattico; la tabella delle transizioni asincrone non e un backend eseguito. Niente benchmark, React Compiler, ESLint/type checking, comparator personalizzati, invalidazione da Suspense/Fast Refresh, SSR/hydration, cache di rete, coordinamento di titoli concorrenti o matrice browser. I render statici non eseguono gli effect e non dimostrano un'app SSR. La suite JavaScript non e stata rieseguita; QA Quartz distinta dai test React.

## React: Context, Store e Stato Derivato

`react-context-store-derived.test.mjs` estrae gli esempi di Context API, State Management Esterno e Derived state. Alla toolchain temporanea esterna si aggiungono le tre librerie usate dagli esempi, senza modificare le dipendenze di Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund zustand@5.0.15 @reduxjs/toolkit@2.13.0 react-redux@9.3.0
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati come sopra, esegui la regressione completa React:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs
```

Risultato del 2026-10-15: **166 test React superati**, 128 precedenti e 38 nuovi. I nuovi comprendono **16 test Node** (tre gruppi di sola sintassi, quattro render statici e nove prove di store/funzioni pure) e **22 test Chrome**, undici per ambiente. React 19.3.0, Zustand 5.0.15, Redux Toolkit 2.13.0, React Redux 9.3.0, Node 24.14.0 e Chrome 155.0.8059.79.

- Bundle esbuild in memoria, con NODE_ENV development/production esplicito e Strict Mode nel browser. Il nuovo file non crea progetti Vite, junction o fixture su disco; la regressione conserva le build Vite reali dei blocchi precedenti.
- Context: fallback solo senza provider, undefined esplicito, guard, provider annidati indipendenti, ID distinti, aggiornamenti dei consumatori memo e differenza fra nuova prop iniziale e nuova key.
- Zustand e Redux: factory isolate, snapshot precedenti invariati, azioni e reset, sottoscrizioni manuali e unsubscribe. Nel browser lo stato e condiviso, sopravvive allo smontaggio del componente ma si perde dopo reload; il reset Zustand conserva le azioni grazie al merge.
- Dati derivati: initializer indipendenti, filtro normalizzato, ordinamento su copia e totale comprensivo delle quantita. Selezione aggiornata per ID, filtro che non elimina la selezione, rimozione, lista vuota e reset.
- Bozze: il cambio di key scarta la modifica; una nuova prop con la stessa identita non sovrascrive il valore locale. I render statici controllano il markup, non hydration o un'applicazione SSR.
- Browser e server loopback chiusi alla fine. Nessun backend remoto, persistenza aggiunta o modifica al package/lockfile di Quartz.

Limiti: schemi e anti-pattern ricevono solo controllo sintattico. Niente benchmark, conteggi fissi di render evitati, React Compiler, lint/type checking, SSR/hydration, middleware di persistenza, cache di rete, sincronizzazione fra schede o implementazioni Jotai/Recoil. Nessuna matrice browser o audit completo di accessibilita. La suite JavaScript non e stata rieseguita; QA delle pagine Quartz distinta dall'esecuzione degli esempi.

## React: Routing, Cache e Validazione

`react-routing-query-validation.test.mjs` estrae gli esempi di React Router, Data Fetching e Cache e Validazione Dati. Installa le dipendenze nella toolchain temporanea esterna, non in Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund react-router@8.4.0 @tanstack/react-query@5.104.3 zod@4.6.7
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` gia impostati:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs _Meta/tests/react-routing-query-validation.test.mjs
```

Risultato del 2026-10-15: **227 test React superati**, 166 precedenti e **61 nuovi**: 11 Node (tre gruppi di sintassi e otto prove di parser/schema/cache) e 50 Chrome, 25 per ambiente. React 19.3.0, React Router 8.4.0, TanStack Query 5.104.3, Zod 4.6.7, Node 24.14.0, Chrome 155.0.8059.79.

- Bundle esbuild in memoria con NODE_ENV esplicito development/production e Strict Mode. Nessuna riscrittura degli algoritmi delle note. La regressione include le build Vite dei blocchi precedenti; il nuovo file non crea un progetto Vite o fixture su disco.
- Router su server HTTP loopback: filtri URL, parametri preservati, history, layout, apertura profonda/reload con fallback SPA della fixture. Percorso sconosciuto, parametro invalido, record assente, HTTP fallito, JSON/schema invalidi, lista vuota e navigazione annullata. Parser utenti verificato nel browser.
- Query su endpoint locali GET/PATCH: caricamento, vuoto, errori iniziali e retry, refresh fallito con dati conservati, previsione ottimistica e risposta autorevole. Promise del refetch mantenuta in pending, rollback anche se il refetch fallisce, errore dopo una scrittura avvenuta, ID codificato/risposta incoerente e Fetch cancellato allo smontaggio.
- I gate del server rendono osservabili gli stati intermedi senza ritardi fissi. Le checkbox sono azionate con click e poi attese: `check()` presumeva erroneamente un cambio sincrono, mentre onMutate attende cancelQueries. La correzione riguarda il banco di prova, non un algoritmo diverso dal Markdown.
- Zod: input/output e copie, limiti numerici, vuoto/coercion, email e nome, errori globali/per campo, refine, campi sconosciuti. Browser: focus, attributi ARIA, Enter, testo escapato da React, reset e due form indipendenti. Non e una certificazione completa di accessibilita.
- Server/browser chiusi; cache Node ripulita per non lasciare timer. Endpoint e dati del server sono fixture di test, non un backend distribuito o fornito dalla libreria. Dipendenze/lockfile Quartz invariati.

Limiti: non eseguiti action/fetcher, Framework Mode, SSR/hydration, HashRouter/basename, migrazione di un'app esistente, deploy reale, matrice browser, lint o type checking. Nessun test completo di offline, GC della cache, polling, persistenza, scritture concorrenti, autenticazione o sicurezza backend. Non implementati resolver RHF e validatori asincroni; nessuna verifica di proprieta delle email. Il fallback SPA del server di test non certifica l'hosting dell'utente. Suite JavaScript non rieseguita; QA Quartz separata.

## React: Component Patterns

`react-component-patterns.test.mjs` estrae gli esempi di Compound Components Pattern, Control Props e State Reducer Pattern, Portals ed Error Boundaries. Usa React e React DOM 19.3.0 della toolchain temporanea gia descritta; nessuna nuova dipendenza Quartz.

Con le variabili `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostate:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs _Meta/tests/react-routing-query-validation.test.mjs _Meta/tests/react-component-patterns.test.mjs
```

Risultato del 2026-10-15: **281 test React superati** nella regressione seriale, 227 precedenti e **54 nuovi**: 10 Node (quattro gruppi di sintassi, due prove di reducer e quattro di render statico/server) e 44 Chrome, 22 in sviluppo e 22 in produzione. NODE_ENV esplicito, Strict Mode, Node 24.14.0 e Chrome 155.0.8059.79.

- Accordion: guard, ID e collegamenti ARIA, tastiera, singola apertura, stato conservato nei pannelli nascosti, default contro key, istanze indipendenti e provider annidati.
- Control Props: false controllato, default ignorato in controlled, richiesta rifiutata dal parent, aggiornamento accettato, callback non duplicata e assenza di submit. Reducer puro, limite, identita quando rifiuta, reset e quattro dispatch nello stesso batch; render prop eseguita dal demo.
- Portal: Context conservato, percorso degli eventi React distinto da un listener DOM nativo, target assente e cleanup. Render server senza document e hydration reale del suo placeholder, senza mismatch: prova limitata a questo wrapper, non a un framework SSR.
- Dialog nativo: ruolo/nome, stato modale, focus iniziale, Tab, impossibilita di focalizzare il controllo esterno, Escape, annullamento, conferma, ritorno del focus, riapertura e unmount. Nessuna certificazione screen reader o matrice browser.
- Boundary: isolamento, perdita dello stato del figlio dopo reset, conservazione del fratello, retry senza riparazione, errori di render/effect/Action async, fallback guasto catturato dal boundary superiore. Eventi e timer generano gli errori browser esattamente attesi, non un fallback; la classe non intercetta il render server.
- SaveButton: Promise controllata dal test per osservare pending, rifiuto gestito e retry riuscito. Non e una richiesta HTTP reale. Il reporting usa callback espliciti della root e del boundary, controllando messaggi e componentStack senza imporre conteggi identici in Strict Mode.
- Bundle in memoria e server loopback, chiusi insieme al browser al termine. Gli errori attesi sono confrontati esplicitamente; altri errori di console, pagina, root, hydration e HTTP fanno fallire le prove.

Limiti: niente full audit di accessibilita, animazioni, browser diversi, positioning di tooltip/menu, scroll locking, rimozione dinamica del target o combinazione controlled+state reducer. Non eseguiti streaming SSR, RSC, router/framework boundary, lazy/use con Promise, servizio remoto di logging, lint/type checking o audit di sicurezza. I test di API non certificano ogni caso descritto nella prosa. Suite JavaScript non rieseguita; QA Quartz distinta dagli esempi.

## React: UX e Accessibilita

`react-ux-accessibilita.test.mjs` estrae gli esempi di WAI-ARIA, Focus Management, Animazioni e Micro-interazioni e Internazionalizzazione. Le dipendenze aggiuntive sono isolate dalla toolchain Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund motion@14.2.0 @react-spring/web@10.1.2 i18next@26.4.5 react-i18next@17.0.16 axe-core@4.14.0
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati come nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs _Meta/tests/react-routing-query-validation.test.mjs _Meta/tests/react-component-patterns.test.mjs _Meta/tests/react-ux-accessibilita.test.mjs
```

Risultato del 2026-10-15: **328 test React superati** nella regressione seriale, 281 precedenti e **47 nuovi**: 11 Node (quattro gruppi di sola sintassi, sei prove di i18n/Intl e un render statico) e 36 Chrome, 18 per ambiente. React/React DOM 19.3.0, Node 24.14.0 e Chrome 155.0.8059.79. NODE_ENV esplicito, Strict Mode, bundle in memoria e server HTTP loopback.

- ARIA: disclosure con Enter/Space e Tab, pannello nascosto, stato del checkbox conservato, due istanze con ID indipendenti. Form: nome accessibile, descrizioni e riferimento all'errore, aria-invalid, invio con Enter, stato aggiornato e interpolazione trattata come testo.
- Focus: nessuno spostamento al mount iniziale, apertura dopo commit, Salva/Annulla/Escape e ritorno al controllo, bozza scartata, render che non ruba il focus. Il caso IME usa un KeyboardEvent sintetico con isComposing, non un sistema di input reale. Skip link attivato da tastiera, destinazione a tabindex -1 e successiva tabulazione.
- CSS: transition, hover, focus visibile e alternativa con prefers-reduced-motion. Motion: entrata, permanenza in uscita con inert/aria-hidden, rimozione, riapertura e variante senza movimento. React Spring: valori finali nei due regimi e cleanup. Non sono benchmark di frame rate o certificazioni di comfort visivo.
- i18n: istanze e cataloghi indipendenti, zero/plurali/grandi numeri, fallback e chiavi mancanti. Intl: locale distinto dalla valuta e fuso esplicito con cambio giorno. JSX non interpreta l'interpolazione come HTML.
- Browser i18n: cambio lingua, testo/nomi accessibili, lang/dir e ripristino, fuso Rome anche con browser impostato su America/Los_Angeles, bootstrap completo estratto dalla nota e reload senza persistenza. Pending, rifiuto e retry sono simulati con una Promise controllata, non con un backend di traduzioni.
- Due assunzioni iniziali dei test corrette: separatore italiano non obbligatorio sui numeri a quattro cifre e mock installato prima del mount, per rispettare il wrapper restituito da useTranslation. Nessuna dipendenza dell'esempio da dettagli interni di react-i18next.
- Dodici scansioni axe-core su stati selezionati, con tag WCAG 2 A/AA e 2.1 A/AA: nessuna violazione rilevata. Non equivalgono a conformita completa, verifica degli annunci vocali o copertura di tutta la UI. Errori di pagina/HTTP/console fanno fallire le prove; solo l'avviso specifico Motion sulla preferenza ridotta e ammesso nei relativi test.
- CSS della nota iniettato dal server fixture, non riscritto. Il nuovo file non avvia Vite; la regressione conserva le build reali dei blocchi precedenti. Browser/server chiusi e nessuna modifica alle dipendenze di Quartz.

Limiti: nessun screen reader reale, dispositivo touch, matrice browser, zoom/forced colors completo o revisione normativa. Non implementati widget con roving tabindex, focus di route, trap personalizzate, drag accessibile, animazioni di layout, Web Animations/View Transitions o cambi di preferenza durante un'uscita. Niente backend i18n, persistenza, SSR/hydration, UI RTL completa, Trans/ICU, copertura di tutti i plurali/locale/fusi o test di traduzione linguistica. Il caso IME e sintetico; Intl usa i dati linguistici del runtime. Suite JavaScript non rieseguita; QA Quartz separata.

## React: Performance e Internals, Primo Blocco

`react-performance-internals.test.mjs` estrae esempi e configurazione dalle note Virtual DOM, Fiber Architecture e Concurrent Mode, Batching e React Compiler. Usa la stessa toolchain temporanea esterna delle suite precedenti; non installare queste dipendenze nella cartella Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund babel-plugin-react-compiler@1.0.0 @rolldown/plugin-babel@0.2.4 @babel/core@7.29.0
```

Imposta `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` come nelle sezioni precedenti, poi esegui la regressione completa:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs _Meta/tests/react-routing-query-validation.test.mjs _Meta/tests/react-component-patterns.test.mjs _Meta/tests/react-ux-accessibilita.test.mjs _Meta/tests/react-performance-internals.test.mjs
```

Risultato del 2026-10-15: **359 test React superati**, 328 precedenti e **31 nuovi**. Nove prove Node/toolchain (quattro gruppi di sola sintassi, due controlli AST/modalita del Compiler, due render statici e una trasformazione Vite) e 22 prove Chrome, 11 per ambiente. React/React DOM 19.3.0, Node 24.14.0, Vite 8.3.4, plugin-react 6.1.2 e Chrome 155.0.8059.79. NODE_ENV esplicito, Strict Mode e build di produzione con il config estratto dalla nota.

- Identita: nodo DOM del contatore preservato, bozze associate agli ID dopo riordino, reset per key, props nuove e perdita dello stato dopo rimozione/rimontaggio.
- Transition: input aggiornato e risultato finale coerente, filtro case-insensitive/trim, nessun risultato e reset. Non misura interruzioni effettive, frame rate o latenza sotto carico.
- Batching: sostituzioni, updater e loro ordine, snapshot dell'handler; probe dedicati Promise/timer senza commit intermedi incoerenti. Nessun conteggio fisso delle chiamate al render.
- flushSync: ref disponibile subito dopo il commit, focus e ripristino, bozza scartata alla chiusura.
- Compiler: AST con cache nelle funzioni annotate e opt-out rispettato; infer distinto da annotation. Il catalogo viene eseguito sia compilato sia con opt-out intenzionale come baseline. Verificati filtro, totale, toggle e bootstrap reale in sviluppo e produzione. Il render statico confronta anche input congelati e testo escapato.
- Corrette assunzioni della fixture, non il codice delle note: node_modules locale con junction per singolo pacchetto per la cache Vite su Windows; helper generati distinti dalle funzioni esportate nell'AST; attesa di un nodo vuoto con stato attached anziche visible. Le junction vengono scollegate prima di eliminare la sola directory temporanea verificata.

Nessun benchmark, prova di tutte le lanes interne, audit completo di accessibilita, hydration/RSC, gating runtime o compilazione di librerie pubblicate. Nessuna configurazione ESLint nuova eseguita; dipendenze React 17/18 descritte ma non provate. La verifica funzionale non dimostra un guadagno prestazionale. Server/browser chiusi e fixture rimossa; suite JavaScript non rieseguita.

## React: Virtualizzazione e Suspense

`react-virtual-suspense.test.mjs` estrae JSX e CSS dalle note Virtualizzazione delle liste e Suspense e Lazy Loading, usando il progetto base di Introduzione e Toolchain. Aggiungi alla toolchain temporanea esterna, non a Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund @tanstack/react-virtual@3.14.20
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati come sopra, esegui la regressione completa:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs _Meta/tests/react-routing-query-validation.test.mjs _Meta/tests/react-component-patterns.test.mjs _Meta/tests/react-ux-accessibilita.test.mjs _Meta/tests/react-performance-internals.test.mjs _Meta/tests/react-virtual-suspense.test.mjs
```

Risultato del 2026-10-15: **388 test React superati**, 359 precedenti e **29 nuovi**. Cinque prove Node/toolchain (due gruppi di sola sintassi, markup statico, comportamento del boundary e manifest/chunk Vite) e 24 Chrome, 12 development e 12 production. React/React DOM 19.3.0, TanStack React Virtual 3.14.20, Vite 8.3.4, plugin-react 6.1.2, Node 24.14.0 e Chrome 155.0.8059.79. NODE_ENV esplicito, Strict Mode e build reale.

- Lista fissa: 5.000 record, meno di 50 righe montate, altezza/spazio totale coerenti, Inizio/Fine, rimozione delle righe lontane e PageDown senza perdere il focus della regione. ID e contenuto coerenti dopo riordino, riduzione da fondo lista, svuotamento e ripristino.
- Lista misurata: testi di altezze differenti, resize a 390 px, scorrimento fino all'ultimo record e assenza di sovrapposizioni fra le righe montate. Non e un benchmark o una prova di tutti i possibili cambiamenti del contenuto.
- Probe controllati: lazy risolto/rifiutato, loader invocato una volta, stato locale perso dopo unmount, reset effettivo del boundary senza nuovo loader. Boundary annidati e attesa gestita in effect distinta da Suspense.
- Progetto reale: chunk dinamica presente nel manifest, non precaricata dall'HTML; nessuna richiesta del pannello prima dell'apertura. Chiusura e riapertura conservano il titolo nel parent ma scartano la bozza del pannello.
- Import ritardato con intercettazione Playwright: fallback e controlli disponibili, chiusura senza annullare il caricamento e riapertura sulla stessa importazione. Errore di valutazione del modulo simulato con risposta JavaScript HTTP 200: il boundary isola l'errore, la riapertura non lo risolve e il reload esplicito recupera dopo aver rimosso il guasto, perdendo lo stato non persistito.
- Quattro scansioni axe su stati selezionati senza violazioni rilevate, oltre alle dodici ripetute dalla suite UX. Errori console/pagina/HTTP inattesi fanno fallire le prove; solo il messaggio del modulo intenzionalmente guasto e ammesso nei due casi dedicati.

Limiti: niente screen reader reale, certificazione di accessibilita, matrice browser, benchmark, righe interattive, griglie, immagini/font che cambiano altezza o caricamento infinito remoto. Non collaudati stale deploy reali, CDN, tutti gli errori di rete/cache, retry automatici, SSR streaming, hydration, RSC o fetch Suspense di framework. I render statici non certificano SSR. Server/browser chiusi e fixture temporanee rimosse dopo verifica dei percorsi e scollegamento delle junction. Nessuna modifica alle dipendenze Quartz; suite JavaScript non rieseguita. QA del sito separata.

## React: Server Components, SSR e SSG

`react-server-rendering.test.mjs` estrae il progetto Next dalla nota Server Components e le varianti da SSR e SSG. Usa la toolchain temporanea esterna, senza modificare Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund next@16.4.1 server-only@0.0.1
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati come sopra:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-server-rendering.test.mjs
```

Per includere tutte le suite React presenti:

```powershell
$tests = (Get-ChildItem -LiteralPath '_Meta/tests' -Filter 'react-*.test.mjs').FullName
node --test --test-concurrency=1 $tests
```

Risultato del 2026-10-15: **410 test React superati** nella regressione completa, 388 precedenti e **22 nuovi**: sei Node/API (due gruppi di sola sintassi), sei build/HTTP e dieci Chrome. Next 16.4.1, dipendenze React/React DOM 19.3.0, Node 24.14.0 e Chrome 155.0.8059.79. Tre build Webpack: progetto server, export statico e variante volutamente errata. Il server di produzione usa realmente la CLI `next start`; l'export e servito da HTTP Node senza runtime Next.

- Catalogo: campi pubblici espliciti, copie indipendenti, prezzo e interpolazione testuale. Il guard server-only e neutralizzato soltanto nel test unitario della funzione, poi verificato realmente con la build negativa: import dal modulo client rifiutato e diagnostica Webpack acquisita tramite un plugin della sola fixture negativa.
- Confini: manifest con catalogo prerenderizzato e route live/stream non statiche. HTML e bundle client non contengono i due marcatori interni del demo; non e una ricerca esaustiva di segreti o un audit della serializzazione.
- SSR: richieste di documento con ID distinti e Cache-Control privata/no-store. Click del pannello senza navigazione, ID e timestamp invariati dopo hydration. Il test legge l'HTML con parse5, senza assumere come viene serializzato il valore dell'attributo data.
- Streaming: HTTP loopback non compresso, shell/fallback in chunk precedenti al dettaglio; browser con dettaglio finale e fallback rimosso. Verifica ordine, non un tempo massimo di risposta o paint.
- SSG: HTML generato e servito identico senza runtime Next; catalogo leggibile senza JavaScript. In entrambe le distribuzioni i pulsanti funzionano dopo hydration, ID ARIA indipendenti, tastiera, reload e viewport mobile senza overflow. Due scansioni axe su stati selezionati senza violazioni rilevate.
- API React in probe separati: renderToString/static markup non aspettano la Promise sospesa; prerenderToNodeStream attende. Hydration compatibile conserva il nodo DOM, quella con mismatch intenzionale segnala onRecoverableError e ricrea l'albero. Questi probe non sostituiscono il protocollo RSC di Next.
- Prima esecuzione: 19/22 prove superate; corretti tre controlli del banco di prova che assumevano stringhe di log/attributi. La seconda esecuzione ha superato tutti i test senza modifiche al codice applicativo. I log CLI vengono raccolti fino alla chiusura degli stream del processo.

Limiti: nessuna prova Next in sviluppo/Turbopack, Server Functions/mutazioni, database, sessioni, autorizzazioni, ISR, CDN, CSP, annullamento di query, basePath o route dinamiche esportate. Non eseguito il comando Python del promemoria: l'export e verificato tramite server statico Node. Niente benchmark, screen reader reale, matrice browser o certificazione di accessibilita. Gli errori browser inattesi falliscono la suite; il mismatch intenzionale usa la callback dedicata. Processi/server/browser chiusi, fixture eliminate dopo verifica dei percorsi e scollegamento delle junction. Gli avvisi Next su cache di build assente e lockfile in una directory superiore non vengono interpretati come errori del demo. QA Quartz e suite JavaScript separate.

## React: Actions e useActionState

Suite `_Meta/tests/react-actions-state.test.mjs`, aggiunta il 2026-10-16. Usa la toolchain esterna e Playwright gia descritti: nessuna nuova dipendenza nel sito.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-actions-state.test.mjs
```

**34 nuovi test superati**, confermati nella regressione di **444 test React**: 13 Node/toolchain (inclusi due gruppi di sola sintassi), 11 Chrome development e 10 production. React/React DOM 19.3.0 e Chrome 155.0.8059.80; i bundle sono generati con esbuild, con NODE_ENV esplicito e Strict Mode. Componenti e funzioni estratti dai Markdown, non copie riscritte per il banco di prova.

- Validazione di alias mancanti, vuoti, non conformi e File; normalizzazione, stato precedente congelato, contatore dei tentativi, conferma e rifiuto previsto. Eseguiti anche i servizi didattici con il loro ritardo locale; eccezione inattesa propagata.
- Form action diretta: dati del pulsante submit, raccolta prima della disabilitazione, pending, reset, invio successivo ed errore intercettato dal boundary. `required` blocca il vuoto, mentre un errore applicativo restituito normalmente non impedisce il reset.
- useActionState: bozza controllata conservata, conferma normalizzata, errore successivo senza perdere l'ultima conferma, readOnly e bottoni disabilitati durante attesa. Svuota bozza non resetta il risultato dell'hook; invio da tastiera e viewport mobile.
- Probe React dichiarati: reset degli uncontrolled al default anche con `{ error }`, override formAction del pulsante, initialState diverso senza reset e remount tramite key. Coda sequenziale con tre dispatch; rigetto del primo cancella gli altri. Dispatch async fuori Action provato solo in sviluppo, con avviso atteso e pending non attivato.
- Sei scansioni axe su stati selezionati senza violazioni rilevate; non sono una certificazione di accessibilita. Errori console/pagina/HTTP inattesi fanno fallire i test. Le eccezioni intenzionali usano onCaughtError; il solo test negativo ammette l'avviso di contesto Action assente.

Limiti: non vengono eseguiti Server Functions, permalink, progressive enhancement, un servizio HTTP di mutazione o un database. I callback differiti sono fixture controllate; il demo di alias non registra utenti. Nessuna prova di concorrenza fra utenti, idempotenza, autorizzazioni o annullamento server. Nessuna matrice browser o screen reader reale. Server/browser chiusi e fixture rimossa dopo verifica del percorso temporaneo; QA Quartz e controlli strutturali restano separati.

## React: useOptimistic e useFormStatus

Suite `_Meta/tests/react-optimistic-form-status.test.mjs`, aggiunta il 2026-10-16; richiede soltanto la toolchain esterna e Playwright gia descritti.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-optimistic-form-status.test.mjs
```

**39 nuovi test superati**, confermati nella regressione di **483 test React**: otto Node/toolchain (due gruppi di sola sintassi), 16 Chrome development e 15 production. React/React DOM 19.3.0, Chrome 155.0.8059.80; bundle esbuild con NODE_ENV esplicito, non minificati per poter verificare i nomi delle action nei probe. Strict Mode attivo. Nessuna nuova dipendenza.

- Funzioni estratte dalle note: reducer e merge su record/array congelati, deduplicazione per id/requestId, conferme esterne, FormData con null/File, risposta con correlazione errata e selezione dei campi. Servizi locali eseguiti con il ritardo originale; rifiuto tipizzato e normalizzazione degli spazi.
- Commenti: previsione visibile prima della risoluzione, stato pending, nodo DOM conservato per key, testo canonico, bozza mantenuta e reset esplicito. Rifiuto seguito da retry, base aggiornata durante l'attesa senza perdere dati; conferma esterna non duplicata e non annullata da un successivo rifiuto. Il probe senza onConfirm dimostra che il solo successo del servizio non aggiorna la base.
- Form: due istanze con ID, bozze ed esiti separati, pending locale, payload raccolto prima della normalizzazione, invio Enter, validazione senza chiamata al servizio e ultimo risultato conservato. Rigetti inattesi e risposte incoerenti raggiungono un boundary della fixture.
- Probe React separati dai demo: lettura nello stesso componente o all'esterno non osserva il form discendente; un pulsante esterno con attributo form invia, ma non trasferisce il contesto al fratello. onSubmit async da solo non attiva il pending. FormData resta lo snapshot dell'invio mentre cambia un input non controllato; dopo il completamento data/method/action sono null.
- Nel client provato, method e get per una function action senza prop method; action identifica anche la funzione scelta tramite formAction. Il test verifica metadati locali, non una richiesta HTTP GET/POST. Setter ottimistico fuori Action controllato con avviso intenzionale solo in sviluppo.
- Quattro scansioni axe su stati selezionati senza violazioni rilevate, non una certificazione di accessibilita. Viewport mobile senza overflow nei due demo. Errori pagina/HTTP/console inattesi falliscono la suite; rigetti intenzionali gestiti tramite onCaughtError.

Limiti: niente Server Functions, database, persistenza, mutazioni HTTP, autorizzazioni, idempotenza, retry di rete, offline o concorrenza fra utenti. I callback differiti e la conferma esterna sono fixture dichiarate; non vengono misurati tempi di rendering o riprodotti tutti gli ordinamenti possibili. Nessuna matrice browser o screen reader reale. Processi HTTP/browser chiusi e fixture rimossa dopo verifica del percorso temporaneo; QA Quartz separata.

## React: use e Framework Mode

Suite `_Meta/tests/react-use-framework.test.mjs`, aggiunta il 2026-10-16. Usa codice estratto da use hook e Framework Next.js e Remix, non copie manuali dei demo. Alla toolchain temporanea esterna sono stati aggiunti @react-router/dev e @react-router/serve 8.4.0; servono anche @react-router/node 8.4.0 e isbot 5.2.2, presenti nelle dipendenze risolte. Pacchetti e lockfile di Quartz non modificati.

Per predisporre questi pacchetti in una toolchain esterna gia configurata:

```powershell
npm --prefix "$env:REACT_TOOLCHAIN_PATH" install --save-exact @react-router/dev@8.4.0 @react-router/serve@8.4.0 @react-router/node@8.4.0 isbot@5.2.2
```

Poi esegui la suite:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-use-framework.test.mjs
```

**27 test superati**, confermati nella regressione completa di **510 test React**: sette Node/toolchain (due di sola sintassi), sette Chrome development, sette production e sei di integrazione Framework Mode. Node 24.14.0, React/React DOM 19.3.0, React Router 8.4.0, Vite 8.3.4 e Chrome 155.0.8059.80. Bundle client Strict Mode con NODE_ENV esplicito; quello production e minificato. Il progetto router viene realmente compilato e servito in produzione su loopback.

- Promise: attesa/risultato/rigetto, identita conservata al re-render, nuovo caricamento dopo errore, risultato tardivo ignorato. Servizio locale originale eseguito anche senza mock. Callback differiti separati per controllare l'ordine.
- Context: default, undefined esplicito, provider annidato, lettura condizionale dopo early return, provider nello stesso componente. browser(): fallback SSR e lettura nel client, senza un falso aggiornamento automatico al resize.
- Router: loader con query normalizzata e duplicati/limiti rifiutati, copie pubbliche dei record, build server/client, campo interno assente da asset client e HTML. HTTP 400/404/405 reali e GET filtrato; ricerca, reload e Indietro con e senza JavaScript. Una risposta dati ritardata dalla fixture rende osservabile pending; la navigazione idratata conserva il documento.
- Cinque scansioni axe su stati selezionati e controllo overflow mobile di Context/catalogo, non un audit di accessibilita. Errori console/pagina/HTTP inattesi falliscono le prove browser; rigetti intenzionali catturati con onCaughtError.

Le prime prove hanno rilevato isbot non dichiarato e un selettore di test non corrispondente alla label implicita: dipendenza esplicitata nel demo e label resa esplicita con useId. Il primo collegamento dell'intera node_modules non funzionava con Vite su Windows: ora la fixture collega i singoli pacchetti e scollega le junction prima della rimozione verificata. Una fixture della prova fallita e stata pulita separatamente. La CLI non deve installare pacchetti durante i test.

Limiti: nessuna mutazione, autenticazione, migrazione Remix, RSC del router, cache condivisa, database o deploy remoto. Il confronto Next riusa gli esempi gia coperti dalla suite server-rendering. Il catalogo SSR e un server reale locale, non un backend persistente. Nessun benchmark, screen reader o matrice browser; QA Quartz separata. L'audit della toolchain esterna segnala un avviso low preesistente su @babel/core 7.29.0 (GHSA-4x5r-pxfx-6jf8); non applicato aggiornamento forzato o modifica ai pin dei demo precedenti.

## React: concorrenza e risorse

Suite `_Meta/tests/react-concurrency-resources.test.mjs`, aggiunta il 2026-10-18. Estrae i moduli JSX da useTransition e useDeferredValue e Gestione della memoria e AbortController. Usa la toolchain esterna gia configurata, senza nuove dipendenze o modifiche ai package/lockfile del sito.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-concurrency-resources.test.mjs
```

**24 test superati**, confermati nella regressione completa di **534 test React**: otto Node/toolchain (due di sola sintassi), otto Chrome development e otto production. React/React DOM 19.3.0, Node 24.14.0, Chrome 155.0.8059.80 ed esbuild 0.27.3. Bundle in memoria con NODE_ENV esplicito e Strict Mode; production minificato. Server HTTP su loopback e porte assegnate dal sistema, chiuso con il browser al termine.

- Demo originali: ricerca indipendente, filtro puro con trim/case, reset, risultato vuoto e limite di righe; label SSR distinte. Profilo locale realmente eseguito, schema/ID/proiezione, errore, cancel e reload; SSR senza effect o lettura di window.
- Probe API separati: callback startTransition sincrona, pending con Suspense e aggiornamento urgente; input nuovo con risultato differito precedente e scarto di una risoluzione superata. Le Promise controllate rendono osservabile l'attesa, senza introdurre busy loop o affermazioni sulla latenza.
- Loader iniettati: risposta fuori ordine ignorata anche senza supporto abort, cleanup allo smontaggio, timeout cooperativo, retry con controller nuovo e risultato scartato dopo cancel. I test controllano gli effetti osservabili, non il rilascio fisico della memoria.
- fetchProfile originale contro endpoint HTTP locale di fixture: ID codificato, 404/500, JSON/schema errati e abort dopo header ma prima del completamento del corpo. Non e il backend di un'applicazione reale.
- Listener resize e timer tracciati separatamente: un solo listener attivo dopo il setup Strict Mode, nessuno dopo cleanup e timer cancellato. Quattro scansioni axe e controllo overflow mobile sui due demo, non un audit di accessibilita completo.
- Errori inattesi console/pagina/HTTP fanno fallire le prove; solo 404/500 intenzionali e l'abort del caso HTTP hanno eccezioni esplicite. Nessuna installazione, junction o fixture su disco aggiuntiva.

Limiti: nessun benchmark, heap snapshot, misura GC, browser multipli o screen reader reale. Non provati WebSocket, observer, cache condivise, autenticazione, mutazioni remote, idempotenza, rollback server o cancellazione universale delle Promise. La suite non dimostra un numero fisso di render, una deadline o un tempo massimo dell'input. QA Quartz separata.

## React: XSS e autenticazione

Suite `_Meta/tests/react-xss-auth.test.mjs`, aggiunta il 2026-10-18. Estrae i moduli completi dalle note Protezione XSS e Gestione Autenticazione. Alla toolchain esterna React e stato aggiunto solo DOMPurify 3.4.17; pacchetti e lockfile di Quartz non modificati. La toolchain JavaScript separata conserva il proprio pin precedente.

```powershell
npm --prefix "$env:REACT_TOOLCHAIN_PATH" install --save-exact --ignore-scripts dompurify@3.4.17
```

```powershell
node --test --test-concurrency=1 _Meta/tests/react-xss-auth.test.mjs
```

**36 test superati**, confermati nella regressione completa di **570 test React**: dieci Node/toolchain (due di sola sintassi), tredici Chrome development e tredici production. React/React DOM 19.3.0, Node 24.14.0, DOMPurify 3.4.17 e Chrome 155.0.8059.80. Bundle esbuild in memoria con Strict Mode e NODE_ENV esplicito; production minificato.

- XSS: testo escaped, limiti UTF-16, URL con origine/protocollo/credenziali controllati; sanitizzazione reale di otto payload con eventi, script, immagini, SVG, MathML, iframe, form, attributi esclusi e markup malformato. Verificato il DOM risultante senza CSP che mascheri errori. Rich text SSR rifiutato senza un DOM supportato, non restituito grezzo.
- Sessione: schema e proiezione, SSR iniziale senza effetto, guardia del Context, 401 distinto da 403/500 e JSON/schema invalidi. Nome utente contenente markup reso come testo. Endpoint HTTP locale con cookie HttpOnly non leggibile da document.cookie ma inviato da Fetch; POST logout con token CSRF, rifiuto del token errato e scadenza del cookie.
- Errori e concorrenza: logout fallito resta non confermato, dati privati nascosti, retry esplicito; letture obsolete, smontaggio, cambio utente e bozza precedente scartata. Doppio logout e lettura durante revoca non duplicano l'operazione. API controllate separate per ordinare le risposte; nessun falso backend di produzione.
- Sei scansioni axe su stati selezionati e controllo overflow mobile. Errori inattesi console/pagina/HTTP e richieste esterne fanno fallire le prove; solo gli status intenzionali dichiarati sono ammessi. Server, contesti e browser chiusi al termine; nessuna fixture su disco o junction aggiuntiva.

Limiti: la fixture usa HTTP loopback e un cookie di test, non collauda HTTPS, Secure, prefisso \_\_Host-, isolamento SameSite cross-site o un login reale. Non implementa credenziali, crittografia, OIDC/PKCE, refresh, MFA, autorizzazione per risorsa, cache multiutente o difese CSRF complete. Nessun audit di sicurezza, prova di tutti i bypass XSS, matrice browser o screen reader. SSR del rich text e Trusted Types sono limiti dichiarati, non integrazioni implementate. QA Quartz separata.

Audit della toolchain esterna: rimane un low preesistente su @babel/core 7.29.0 (GHSA-4x5r-pxfx-6jf8), nessun avviso aggiuntivo su DOMPurify; nessun aggiornamento forzato dei pin precedenti.

## React: CSRF e CSP

Suite `_Meta/tests/react-csrf-csp.test.mjs`, aggiunta il 2026-10-18. Usa React/React DOM 19.3.0, esbuild 0.27.3, axe-core e Playwright della toolchain esterna gia descritta; non aggiunge dipendenze al sito.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-csrf-csp.test.mjs
```

**31 test superati**, confermati nella regressione completa di **601 test React**: otto Node/HTTP e 23 browser, senza prove saltate o fallite. Chrome 155.0.8059.80; regressione seriale in circa 216 secondi, completata prima della build Quartz.

Il codice viene estratto da CSRF e Content Security Policy. I test coprono:

- Validazione client, render SSR senza mutazioni, nonce casuali distinti e coerenti con l'HTML, direttive senza concessioni unsafe. Un test controlla soltanto la sintassi dei quattro moduli.
- Form React in development/production con Strict Mode: cookie HttpOnly, header e JSON, successo 204, 401/403/500, conservazione della bozza, doppio submit e unmount. L'abort client non annulla la scrittura della fixture gia in corso. Due scansioni axe su stati selezionati e viewport mobile, non un audit completo.
- Backend didattico su loopback: rifiuto di token assente, errato o associato a un'altra sessione, origine assente/null/diversa, sessione assente, Content-Type e schema errati. Non e un middleware di produzione e non implementa gestione completa delle sessioni, TLS, limiti del body o autorizzazioni per record.
- Due origini su porte diverse dello stesso host: form same-site cross-origin con cookie inviato senza preflight, ma metodo rifiutato; PUT/JSON/header soggetto a preflight, rifiutato senza mutazione. Non e una matrice cross-site/SameSite/third-party-cookie.
- CSP reale via HTTP: contatore interattivo, CSS esterno, nonce corretto; script inline, nonce errato e script esterno senza nonce bloccati. Solo report-only permette il controesempio e genera un evento di violazione. Baseline self e listener React provati separatamente.
- Server estratto dalla nota eseguito su porta effimera: HTML, MIME, 404/405 e 500 per asset mancante. readFile e sostituito da un archivio in memoria dei bundle compilati: non e una prova del filesystem o del comando npm install. La build usa le opzioni esbuild del comando documentato, senza override NODE_ENV.

La verifica CORS deve usare un contesto senza routing Playwright, neppure per favicon: nelle prime due prove l'intercettazione impediva di osservare OPTIONS. Rimosso il routing nel solo contesto CORS, il preflight nativo e verificabile. Le violazioni CSP/CORS intenzionali sono ammesse solo nei test negativi dedicati; errori browser/HTTP inattesi e richieste esterne fanno fallire le prove.

Limiti: rete fallita simulata; redirect error verificato come opzione del client, non con una catena reale. Niente login, HMAC double-submit, rotazione token, proxy, refresh, CDN/cache, reporting remoto, Trusted Types, CSS-in-JS, worker, lazy chunk, CSP Next/SSR streaming o matrice browser. Non e un audit di sicurezza. Server/browser chiusi; nessuna fixture su disco o nuova junction. Controlli del vault e QA Quartz separati.

## React: Jest, Playwright Test e Cypress

Suite `_Meta/tests/react-testing-runners.test.mjs`, aggiunta il 2026-10-18. Estrae i file dalle note Testing Jest e Testing Cypress e Playwright e li esegue in un progetto temporaneo. Nessun pacchetto o lockfile del sito viene modificato.

**23 test superati**, confermati nella regressione seriale completa di **624 test React** in circa 243 secondi, senza fallimenti o test saltati. Node 24.14.0 e Chrome 155.0.8059.80; i risultati interni di Jest, Playwright e Cypress sono controllati dai rispettivi gruppi, non sommati nuovamente al totale.

Richiede una toolchain **separata** da quella React precedente; il percorso predefinito e appunti-react-testing-tools sotto la directory temporanea. Puoi impostarlo esplicitamente:

```powershell
$env:REACT_TESTING_TOOLCHAIN_PATH = Join-Path $env:TEMP 'appunti-react-testing-tools'
```

Installa i pacchetti del demo, senza aggiornare la toolchain degli altri blocchi:

```powershell
npm --prefix "$env:REACT_TESTING_TOOLCHAIN_PATH" install --save-exact react@19.3.0 react-dom@19.3.0 vite@8.3.4 @vitejs/plugin-react@6.1.2 jest@30.5.2 jest-environment-jsdom@30.5.2 babel-jest@30.5.2 @babel/core@7.29.7 @babel/preset-env@7.29.7 @babel/preset-react@7.29.7 @testing-library/react@16.3.3 @testing-library/dom@10.4.2 @testing-library/jest-dom@7.0.1 @testing-library/user-event@14.6.8 @playwright/test@1.62.1 cypress@16.2.0
```

Servono Chrome installato e il binario Cypress. Se manca quest'ultimo:

```powershell
node "$env:REACT_TESTING_TOOLCHAIN_PATH/node_modules/cypress/bin/cypress" install
```

Avvio della suite:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-testing-runners.test.mjs
```

- Controlli Node di sintassi, pin, normalizzazione/UTF-16 e render SSR. Adapter con fetch iniettato: status HTTP, Content-Type, JSON/schema, normalizzazione del body, credenziali omesse e guasto rete. Una prova e di sola sintassi.
- Jest esegue **7 test originali** con jsdom, Babel, Testing Library, user-event e coverage; sono verificati payload, pending, singolo invio, errori, bozza e retry esplicito. Errore del servizio distinto da campo invalido. Nessun avviso act ignorato.
- Prova negativa controllata: nella sola fixture si rimuove il rifiuto del nome vuoto. Jest deve uscire con codice 1, due test falliti e nessun errore di caricamento; poi il sorgente originale viene ripristinato. E una verifica di efficacia mirata, non un mutation score complessivo.
- Build Vite reale prima dei test browser. Playwright Test CLI esegue **3 test** con il webServer originale della nota; Cypress Module API esegue gli stessi **3 casi** della propria spec in Chrome, con anteprima Vite esterna. Le porte sono effimere tramite TEST_PORT, le risposte API sono simulate e non esiste persistenza backend.
- I report dei runner sono analizzati come JSON, inclusi test saltati, falliti e flaky. I sette test Jest e i sei test browser sono verifiche interne ai gruppi della suite Node: non vanno sommati una seconda volta al conteggio dei gruppi della regressione.
- Fixture con collegamenti ai singoli pacchetti esterni; processi/server chiusi, junction scollegate e directory temporanea eliminata solo dopo verifica del percorso. Nessuna modifica al workflow remoto o all'anteprima Quartz.

Audit della nuova toolchain: 19 segnalazioni moderate nella catena Jest/Istanbul dovute all'advisory transitivo sprintf-js [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c); nessuna high/critical. Non applicato il downgrade automatico suggerito a Jest/babel-jest 25. I test usano sorgenti/configurazioni controllati. Questo risultato non modifica l'audit della vecchia toolchain React, che non e stata aggiornata.

Limiti: niente Vitest, MSW, ESM nativo Jest, TypeScript, fake timer, component runner Cypress, login/storageState/cy.session, database, browser diversi da Chrome, screen reader o audit completo. Coverage non equivale a correttezza. La prova negativa modifica soltanto la copia temporanea e l'adapter usa risposte simulate. Test delle note, verifica strutturale e QA del sito sono attivita distinte.

## React: test di accessibilita, ESLint e Prettier

Suite `_Meta/tests/react-accessibility-lint.test.mjs`, aggiunta il 2026-10-18. Estrae note e configurazioni dal vault, crea due progetti temporanei distinti e li elimina al termine dopo aver scollegato le junction. Nessun pacchetto del sito viene modificato.

Richiede la toolchain runner del blocco precedente, Chrome installato e una nuova toolchain qualita separata:

```powershell
$env:REACT_QUALITY_TOOLCHAIN_PATH = Join-Path $env:TEMP 'appunti-react-quality-tools'
```

```powershell
npm --prefix "$env:REACT_QUALITY_TOOLCHAIN_PATH" install --save-exact eslint@10.13.0 @eslint/js@10.0.1 globals@17.13.0 eslint-plugin-react-hooks@7.1.1 eslint-config-prettier@10.1.8 prettier@3.9.10 @axe-core/playwright@4.14.0 playwright-core@1.62.1
```

```powershell
node --test --test-concurrency=1 _Meta/tests/react-accessibility-lint.test.mjs
```

**26 test superati** nell'esecuzione mirata, confermati nella regressione seriale di **650 test React** in circa 263 secondi, senza fallimenti o test saltati. Node 24.14.0 e Chrome 155.0.8059.80; il pacchetto @playwright/test viene dalla toolchain runner precedente e playwright-core esplicito allinea il peer di axe al runner 1.62.1.

- Una prova di sola sintassi; pin verificati e render SSR iniziale del TitleCounter, senza eseguirne gli effect.
- ESLint CLI reale sul progetto positivo, incluso JSX importato, configurazioni e dist esclusa. print-config verifica regole Hooks, disattivazione delle regole stilistiche e globali effettivi.
- Casi negativi per hook condizionale, dipendenza mancante, mutazione props, render impuro, JSX non definito, variabile inutilizzata, coercizione e globali fuori ambiente. Casi positivi browser/Node ESM/CommonJS/Jest e soppressione ormai inutile.
- La stessa warning exhaustive-deps produce exit code 0 senza soglia e 1 con max-warnings 0. Prettier check non scrive, write modifica soltanto la fixture, gli output ignorati restano intatti; formattare il controesempio non elimina la diagnostica Hooks.
- Build Vite reale del demo con i componenti WAI-ARIA/Portals e Playwright Test CLI: **quattro test originali**, navigazione tastiera, descrizione dell'errore, stato locale e dialog. Cinque allegati axe analizzati: nessuna violazione o risultato incomplete nei cinque stati selezionati. I quattro casi sono interni al gruppo Node, non aggiunti nuovamente al totale.
- Prova negativa nella copia temporanea: rimosso lang da index.html, ricompilato il demo e rieseguita la scansione iniziale. Richiesti exit code 1 e violazione html-has-lang; poi ripristinato il sorgente. Non cambia la nota o il sito.

Audit della sola nuova toolchain: **zero advisory** al 2026-10-18. Nessun force/legacy-peer-deps: i plugin eslint-plugin-react 7.37.5 e jsx-a11y 6.10.2 non sono installati perche non dichiarano ESLint 10. Il preset Hooks non abilita la trasformazione React Compiler. Gli advisory delle altre toolchain restano separati e non sono risolti da questo risultato.

Limiti: browser Chrome, demo statico locale senza backend; nessun screen reader, prova manuale di zoom/reflow o certificazione WCAG. Nessun test TypeScript, preset Next, editor, pre-commit hook, plugin JSX aggiuntivo o CI remota. Il TitleCounter viene analizzato dal linter e renderizzato sul server, non collaudato qui per il ciclo di vita nel browser. Le suite precedenti restano indipendenti.

## React: Storybook e confronti visuali

`react-storybook-visual.test.mjs` estrae componente, CSS, storie, configurazioni e test dalle due note. Usa una toolchain temporanea separata: non installa Storybook nelle dipendenze di Quartz e non modifica le toolchain precedenti.

```powershell
$env:REACT_STORYBOOK_TOOLCHAIN_PATH = Join-Path $env:TEMP 'appunti-react-storybook-tools'
```

```powershell
npm --prefix "$env:REACT_STORYBOOK_TOOLCHAIN_PATH" install --save-exact storybook@10.6.2 @storybook/react-vite@10.6.2 @storybook/addon-docs@10.6.2 @storybook/addon-vitest@10.6.2 vitest@5.0.5 @vitest/browser-playwright@5.0.5 react@19.3.0 react-dom@19.3.0 vite@8.3.4 @vitejs/plugin-react@6.1.2 @playwright/test@1.62.1 playwright@1.62.1 http-server@14.1.1
```

```powershell
node --test --test-concurrency=1 _Meta/tests/react-storybook-visual.test.mjs
```

**9 test superati** nell'esecuzione mirata in circa 45 secondi, Node 24.14.0 e Chrome installato tramite channel chrome. Il runner pinna anche playwright direttamente: il peer del provider Vitest altrimenti puo risolvere una versione diversa da @playwright/test. Audit della nuova toolchain: zero advisory al 2026-10-19; nessuna correzione forzata o modifica alle segnalazioni delle altre toolchain.

- Un gruppo di sola sintassi e controllo delle versioni effettive.
- Vitest Browser Mode esegue le cinque storie originali; Activated controlla il callback, Disabled la mancata attivazione. Una prova negativa rimuove il callback soltanto nella fixture e richiede un fallimento specifico su Activated, con le altre quattro storie verdi.
- Build Storybook reale, verifica degli ID in index.json, pagina Docs, manager e iframe. La configurazione 10.6.2 usa le annotazioni automatiche dell'addon, senza il setup legacy setProjectAnnotations.
- Playwright Test reale su tre storie e due viewport: baseline assente fallisce senza crearla; aggiornamento esplicito genera sei PNG con dimensioni corrette; il confronto successivo passa senza riscriverli, verificando gli hash.
- Controllo negativo CSS: ricompilazione con sfondo rosso, fallimento del caso primary desktop e presenza del diff PNG. Baseline invariate; ripristino del CSS, nuova build e confronto verde senza aggiornare immagini.

Le cinque storie e i sei confronti sono casi interni ai gruppi Node, non sommati nuovamente ai nove test. La fixture usa junction per singolo pacchetto: un wrapper della sola configurazione di test autorizza Vite a servire la toolchain esterna. Gli snippet originali restano immutati; in un'installazione normale i pacchetti sono locali e il wrapper non serve. Browser/processi chiusi e junction scollegate prima di rimuovere la directory temporanea dopo controllo del percorso.

Regressione seriale aggiornata al 2026-10-19: **659 test React superati**, 650 precedenti e 9 nuovi, senza fallimenti o test saltati, in circa 355 secondi. Node 24.14.0 e Chrome 155.0.8059.80. Con le quattro toolchain React e PLAYWRIGHT_MODULE_PATH impostati come nelle rispettive sezioni:

```powershell
$tests = (Get-ChildItem -LiteralPath '_Meta/tests' -Filter 'react-*.test.mjs').FullName
node --test --test-concurrency=1 $tests
```

Eseguire la build Quartz dopo i test, non in parallelo con i browser. La suite JavaScript resta separata e non e stata rieseguita in questo blocco.

Limiti: screenshot di esempio generati nella stessa esecuzione, non approvazione umana di baseline di un prodotto. Solo Windows/Chrome, due viewport, tema chiaro e tre stati; mobile non e un dispositivo fisico. Non provati inizializzatore interattivo, addon a11y, servizi visuali remoti, upload del catalogo, CI remota, TypeScript, Next, MSW, decorators applicativi o altri browser. I casi visuali non attendono interazioni che cambiano aspetto: in questo esempio non ce ne sono. Test delle interazioni, confronti pixel e QA del sito Quartz restano verifiche distinte.

## React: design system e confini delle feature

`react-design-architecture.test.mjs` estrae TextField, CSS, model, form e composizione dalle due note; riusa la configurazione della nota Introduzione e Toolchain. Non contiene una seconda implementazione dei componenti e non installa nuove dipendenze nel sito.

Richiede REACT_TOOLCHAIN_PATH, REACT_TESTING_TOOLCHAIN_PATH e PLAYWRIGHT_MODULE_PATH configurati come nelle sezioni precedenti. La toolchain testing fornisce le assertion Playwright; React, Vite e axe provengono dalla toolchain React.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-design-architecture.test.mjs
```

**35 test mirati superati**: 17 gruppi Node, inclusi due di sola sintassi e due di solo render SSR, e 18 casi browser. Node 24.14.0, React 19.3.0, Vite 8.3.4 e Chrome 155.0.8059.80.

- Policy locale: tipo, trim, vuoto, limite UTF-16 e testo HTML non sanitizzato implicitamente. TextField: label, descrizioni presenti/assenti, required ed escaping nel markup SSR.
- Build Vite reale; grafo degli import ricavato dal metafile esbuild. Due mutazioni nella sola fixture mostrano che un deep import e una dipendenza shared -> feature compilano, ma violano la convenzione scelta. I file temporanei vengono ripristinati dopo ciascuna prova.
- Development e production: istanze indipendenti, ID stabili/univoci, errore, ref/focus, correzione, Enter, nessuna persistenza al reload, cambio tema senza perdere la bozza e focus visibile con Tab.
- Quattro scansioni axe sullo stato di errore, nei due temi e nelle due modalita: zero violazioni e zero risultati incomplete nell'esecuzione registrata. La suite fallisce sulle violazioni e stampa gli incomplete per il triage.
- Un consumer di prova importa il TextField originale e controlla required nativo, name/FormData, disabled escluso da invio e Tab, messaggi lunghi a 320px. Il demo di produzione viene verificato a 320, 390 e 1440px in entrambi i temi, senza overflow del documento.

Il controllo del grafo e intenzionalmente limitato ai tre livelli e alla sola feature del demo: non e un linter generale per alias, cicli, import dinamici o molteplici API pubbliche. Nessun backend, package pubblicato, React 18, hydration, framework router, screen reader o certificazione WCAG. Le prove automatiche di tema e geometria non sono approvazione visuale di un prodotto; il QA delle pagine Quartz resta separato. Dipendenze esistenti riutilizzate senza aggiornamenti; nessun nuovo audit npm in questo blocco.

Regressione seriale aggiornata al 2026-10-19: **694 test React superati**, 659 precedenti e 35 nuovi, nessun fallimento o test saltato, in circa 358 secondi. Eseguito il comando complessivo della sezione precedente, con tutte le toolchain configurate, prima di avviare la build Quartz. Suite JavaScript non rieseguita.

## React: stato colocato e API layer

`react-colocation-api.test.mjs` estrae esempi, CSS e adapter dalle note State colocato e API layer. Riusa la toolchain introduttiva e il ProfilePanel della nota su AbortController, senza duplicare il componente o installare nuove dipendenze nel sito.

Richiede REACT_TOOLCHAIN_PATH, REACT_TESTING_TOOLCHAIN_PATH e PLAYWRIGHT_MODULE_PATH come nelle sezioni precedenti. Il runner testing fornisce le assertion, la toolchain React fornisce React/Vite/axe.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-colocation-api.test.mjs
```

**60 casi**: 42 gruppi Node, inclusi due di sola sintassi e uno di render SSR, e 18 casi browser. La prima esecuzione mirata aveva 59 casi verdi; aggiunto poi un caso di abort prima degli header e ampliato il controllo del successo inatteso per rifiutare 204 quando si attende JSON.

- Filtro puro, dati immutati, markup SSR e ID; due build Vite reali per catalogo e client API. Development/production: istanze indipendenti, stato condiviso dai fratelli, dettaglio locale, hidden contro unmount, reset per key, focus e tastiera.
- Il consumer di prova importa Catalog e verifica che una nuova initialQuery non sovrascriva la bozza, mentre una key diversa la resetta. Produzione a 320/390/1440px senza overflow; due scansioni axe sul catalogo filtrato, zero violazioni e zero incomplete nell'esecuzione registrata. Gli incomplete sono stampati per triage, non ignorati come prova di conformita.
- HTTP: Headers in tre forme, copia senza mutazione, Accept/Content-Type, credenziali omesse, redirect rifiutati, POST 201, DELETE 204 senza parsing, errori HTTP/protocollo/body/rete, DTO proiettati e ID coerenti. Input, JSON non serializzabile e signal gia annullato non inviano richieste.
- Server temporaneo su loopback: Fetch reale per elenco/dettaglio/creazione/eliminazione e abort prima degli header o mentre response.json sta consumando il corpo. Il test del corpo verifica bodyUsed prima di annullare e controlla l'identita del motivo personalizzato.
- UI con API intercettata: cambio ID, mapping, 404, retry esplicito, testo HTML non interpretato e risposta appartenente a un altro ID rifiutata. La queryFn opzionale viene eseguita direttamente per verificare signal e chiave; non e un nuovo test dell'intero ciclo di vita TanStack Query.

Node 24.14.0, React 19.3.0, Vite 8.3.4 e Chrome 155.0.8059.80. Nessun backend di produzione, credenziale o dato reale usato; le scritture avvengono solo nella fixture locale senza persistenza. Browser, server e junction vengono chiusi/scollegati prima di rimuovere la directory temporanea, verificata sotto il percorso previsto.

Limiti: non e una libreria HTTP universale o un audit di sicurezza. Non verificati autenticazione, CORS tra origini, retry automatici, idempotenza backend, FormData, stream di download, SSR dell'adapter, client generati, altri browser o CI remota. Nessuna prova con screen reader o certificazione WCAG; nessun benchmark dei render. Le prove di timeout e obsolescenza del ProfilePanel restano nella suite precedente. Nessuna modifica alle dipendenze Quartz o nuovo audit npm.

Regressione seriale conclusiva al 2026-10-19: **754 test React superati**, 694 precedenti e 60 nuovi, senza fallimenti o test saltati, in circa 376 secondi. Usato il comando complessivo con tutte le toolchain configurate, prima della build Quartz; processi e fixture chiusi/rimossi. La suite JavaScript non e stata rieseguita. Le prove riguardano i casi descritti, non certificano ogni esempio delle 59 note React.

## Python: fondamenti del linguaggio

```powershell
node --test _Meta/tests/python-fondamenti.test.mjs
```

La suite richiede CPython 3.12 con venv/ensurepip disponibili. Usa `python` dal PATH; per un interprete diverso puoi impostare `PYTHON_TEST_EXECUTABLE` al percorso dell'eseguibile, senza argomenti. Baseline verificata: **CPython 3.12.10 su Windows**, Node 24.14.0. La patch indica il runtime provato, non una raccomandazione a installare una versione meno aggiornata.

Copertura: Comandi base, Sintassi e Variabili, Operatori, Strutture Condizionali, Cicli, Funzioni, Argomenti Flessibili ed Error Handling. **37 blocchi Python** estratti dal Markdown, compilati ed eseguiti con namespace controllato; i controesempi intenzionali hanno verifiche dedicate. I controlli di struttura e presenza delle fonti sono distinti da quelli comportamentali.

- Nomi, alias, riassegnazione, copie superficiali, scope, annotazioni senza validazione runtime.
- Divisione, resto, precedenza, truthiness, identita e appartenenza; valori zero e input bool distinti.
- Match, cattura dei nomi, chiavi extra; iteratori consumabili, zip strict e clausola else dei cicli.
- Default mutabili, closure, mutazione dei parametri, binding positional/keyword, unpacking e wrapper sincroni con wraps.
- Errori attesi, causa, else/finally, propagazione, file opzionali e limiti di assert con `-O`.
- CLI reale: esecuzione come script e modulo, argomenti, exit code, import senza effetti, py_compile e virtualenv temporaneo con pip list/freeze/check. Nessun download: pip proviene da ensurepip.

Esecuzione del 23 ottobre 2026: **58 test superati**, nessun fallimento o test saltato, circa 20 secondi. Le fixture sono create nella directory temporanea e rimosse dopo verifica dei percorsi. Non vengono modificati interprete globale, dipendenze o lockfile di Quartz.

Limiti: solo CPython 3.12 su Windows, non ogni interprete/piattaforma. I comandi di attivazione PowerShell/cmd/Bash sono controllati come testo, non eseguiti; nessuna modifica alle execution policy. L'installazione opzionale di requests non viene effettuata. Gli errori PermissionError e parte del cleanup sono simulati per verificare la gestione, non provano gli ACL reali. Nessun type checker, linter, servizio remoto, benchmark o audit di sicurezza. Le altre suite JavaScript/React/TypeScript non sono rieseguite da questo comando; build e QA Quartz restano verifiche separate.

## Python: strutture dati

```powershell
node --test _Meta/tests/python-strutture-dati.test.mjs
```

Stessi prerequisiti del blocco Fondamenti: dipendenze del parser Markdown gia installate, Node 24.14.0 e CPython 3.12; interprete selezionabile con `PYTHON_TEST_EXECUTABLE`. Baseline verificata: **CPython 3.12.10 su Windows**. Non vengono installati pacchetti o modificate le dipendenze del sito.

La suite estrae **27 blocchi Python** da Liste, Tuple, Set, Dizionari e Comprehensions. Ogni blocco e compilato ed eseguito in un processo isolato con dati propri e risultati verificati, senza dipendere dai blocchi precedenti della nota. I test editoriali su metadati, sezioni e fonti sono separati da quelli sul comportamento.

- Liste: accessi e errori, slicing, step, alias, sort stabile e key, copie, ripetizione delle righe e media senza risultati.
- Tuple: unpacking, contenuti mutabili, effetto parziale di +=, hashability, bounds e namedtuple senza validazione runtime.
- Set: add/update, operazioni, frozenset, chiavi numeriche equivalenti e deduplicazione con ordine.
- Dizionari: sentinel, get/setdefault non lazy, viste, ordine, merge superficiale, factory/proxy, proiezione dei record e duplicati rifiutati.
- Comprehensions: ordine di valutazione, filtri, scope, late binding, generatori consumabili, suffissi POSIX nella baseline e assenza di rollback degli effetti.

Regressione completa dei due blocchi Python:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs
```

Esecuzione del 23 ottobre 2026: **118 test superati**, 60 Strutture Dati + 58 Fondamenti, nessun fallimento o test saltato, circa 27 secondi. La nuova suite usa soltanto dati in memoria e processi Python brevi; le fixture temporanee del virtualenv appartengono alla suite Fondamenti e vengono ripulite da essa.

Limiti: non e un benchmark di complessita o memoria, ne una prova su interpreti/versioni alternative. Non si controllano valori esatti di hash o ordine dei set. Nessun file reale viene analizzato tramite le estensioni, nessun database/autorizzazione/email viene validato, nessun thread o servizio remoto coinvolto. Non viene rieseguita la suite completa JavaScript/React/TypeScript. Build e QA del sito sono controlli separati.

## Python: file, moduli e ambiente

Due suite estraggono gli esempi dalle sei note del capitolo. `python-file-standard.test.mjs` esegue 12 blocchi Python e 14 controprove oltre ai due controlli di struttura: **28 test**. `python-packaging.test.mjs` ricostruisce il package dai sette file Markdown (cinque Python, un TOML e un README) ed esegue anche il TOML/Python dell'applicazione Poetry: **16 gruppi di test**.

La toolchain e separata dal progetto site. Preparazione PowerShell dalla radice del vault, con CPython 3.12 disponibile; la prima installazione scarica i tool ufficiali e le loro dipendenze da PyPI. La directory deve essere nuova. Ogni comando va eseguito separatamente e interrotto se fallisce.

```powershell
$env:PYTHON_PACKAGING_TOOLS = Join-Path $env:TEMP ('appunti-python-packaging-tools-' + [guid]::NewGuid().ToString('N'))
```

```powershell
python -m venv $env:PYTHON_PACKAGING_TOOLS
```

```powershell
$env:PYTHON_TEST_EXECUTABLE = Join-Path $env:PYTHON_PACKAGING_TOOLS 'Scripts/python.exe'
```

```powershell
& $env:PYTHON_TEST_EXECUTABLE -m pip install --only-binary=:all: 'pip==26.2.2' 'build==1.6.1' 'setuptools==84.2.1' 'wheel==0.48.0' 'uv==0.13.5' 'pipx==1.18.4' 'poetry==2.5.1' 'tzdata==2026.5'
```

```powershell
& $env:PYTHON_TEST_EXECUTABLE -m pip download --only-binary=:all: --no-deps --dest (Join-Path $env:PYTHON_PACKAGING_TOOLS 'wheelhouse') 'setuptools==84.2.1'
```

```powershell
node --test --test-concurrency=1 _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs
```

La preparazione blocca le versioni dei tool principali, non tutte le loro dipendenze transitive. La suite richiede le baseline dichiarate e non installa pacchetti globali. I singoli virtualenv creati durante i test ricevono pip dal bundle ensurepip di Python: nella prova CPython 3.12.10 e pip 25.0.1, distinto dal pip 26.2.2 del frontend di build.

Copertura: file temporanei reali, apertura esclusiva, troncamento, encoding invalido, output parziale, copia multiblocco, schema JSON, CSV quotato, TOML, DST Europe/Rome e Queue con thread reale. Packaging: build isolata sdist/wheel, editable, installazione della wheel in un altro virtualenv, import e CLI fuori dai sorgenti, unittest del demo, constraints e freeze, pip uninstall. uv: init non impacchettato, lock/sync/run, add della wheel locale, locked rispetto a frozen e rimozione di dipendenze estranee. pipx: installazione CLI con backend uv, esecuzione e uninstall. Poetry: modalita applicativa, lock/install/run, add della wheel locale e sync.

Le fixture usano cache e directory di configurazione proprie; pip non accede agli indici e uv e offline durante le prove. Poetry usa una wheel locale senza dipendenze esterne: non e una prova di risoluzione su PyPI. Nessuna pubblicazione di package, modifica del PATH persistente, esecuzione di ensurepath o modifica della execution policy. Le directory dei test vengono cancellate solo dopo verifica del percorso. La toolchain preparata rimane separata e riutilizzabile.

Limiti: Windows e CPython 3.12, nessuna matrice Linux/macOS, compilazione C, race di filesystem, crash recovery o test di carico delle code. Le attivazioni delle shell e i comandi di snapshot sono controllati nel testo, non eseguiti in tutte le shell. Non sono testati registry privati, upload, aggiornamenti remoti, audit o compatibilita futura. Il parser dei titoli conserva i nomi speciali tramite inline code. Build Quartz e QA visiva restano verifiche separate.

Risultato del 2026-10-23: **162/162 test superati**, nessun fallimento o test saltato, circa 98 secondi nella regressione seriale dei tre capitoli revisionati (58 + 60 + 28 + 16). Le correzioni durante le prove hanno riguardato escape delle fixture, percorsi Windows 8.3, nomi speciali nei titoli e comportamento effettivo di uv init/locked/frozen.

Regressione dei tre capitoli revisionati:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs
```

## Python: programmazione ad oggetti

```powershell
node --test _Meta/tests/python-oggetti.test.mjs
```

La suite estrae **27 blocchi Python autonomi** dalle otto note del capitolo: Classi e Istanze, Dataclasses, Enum, Metodi Speciali, Ereditarieta, Incapsulamento, Proprieta e Metodi di classe e statici. **69 gruppi di test**, inclusi controlli editoriali e 33 controprove. I frammenti vengono eseguiti separatamente; il namespace e un modulo registrato in sys.modules, per consentire l'introspezione usata dalle dataclass.

Prerequisiti: dipendenze del parser Markdown gia installate, Node e CPython 3.12. Il percorso dell'interprete puo essere impostato tramite `PYTHON_TEST_EXECUTABLE`. Baseline verificata: **CPython 3.12.10**, **Node 24.14.0**, Windows. La nuova suite usa soltanto la standard library, non scarica pacchetti e non scrive fixture su disco.

- Classi: binding, inizializzazione, attributi condivisi, alias e conto con input errati senza modifiche al saldo.
- Dataclass: factory e valori condivisi, hash, tipo concreto, replace/asdict, campi esclusi dal repr, frozen superficiale, post-init, InitVar e limiti di super/slots.
- Enum: conversione rigorosa, errori e cause, alias, unique, JSON, interop con primitivi e flag.
- Metodi speciali: NotImplemented, operazioni riflesse, hash, ricerca sul tipo, iterazione riutilizzabile e copie.
- Ereditarieta: ABC, firme non validate, MRO, ordine delle basi, catena interrotta e composizione.
- Incapsulamento e proprieta: name mangling, alias, snapshot, read-only, validazione prima della mutazione e cached_property con invalidazione/assegnazione.
- Factory: cls/Self, dizionario invariato, sottoclassi con costruttore incompatibile e contatori di classe.

Regressione dei quattro capitoli, con la toolchain packaging e le variabili d'ambiente preparate come nella sezione precedente:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-oggetti.test.mjs
```

Risultato del 2026-10-23: **231 test superati**, 58 + 60 + 28 + 16 + 69, nessun fallimento o test saltato, circa 136 secondi. Il primo giro della sola nuova suite ha superato tutti i 69 test in circa 11 secondi.

Limiti: una baseline Windows/CPython, nessuna matrice di versioni, controllo statico di Self/Protocol, verifica concorrente delle cache o delle classi, audit, benchmark, servizio di notifica o sistema bancario reale. I test provano i contratti didattici dichiarati, non la correttezza di qualsiasi sottoclasse o oggetto ostile. Le suite degli altri linguaggi non sono rieseguite; build e QA Quartz restano verifiche separate.

## Python: concetti funzionali e iterazione

```powershell
node --test _Meta/tests/python-funzionale-iterazione.test.mjs
```

La suite estrae **33 blocchi Python autonomi** dalle sei note: Funzioni Lambda, Higher-order Functions, Decoratori, Generatori, Iteratori e Context Managers. **73 gruppi di test**: 33 esempi, 33 controprove, sei controlli editoriali e uno sulla baseline. La nota Higher-order Functions conserva il template teorico; le altre usano quello tecnico.

Prerequisiti: dipendenze del parser Markdown, Node e CPython 3.12. `PYTHON_TEST_EXECUTABLE` puo indicare l'interprete. Baseline provata: **CPython 3.12.10 su Windows**, **Node 24.14.0**; non e una raccomandazione di installare questa specifica patch. Nessuna dipendenza Python esterna per la nuova suite.

- Lambda e funzioni di ordine superiore: binding, ordinamento stabile, riferimenti condivisi, callback eager/lazy, errori parziali, reduce, closure, validazione e partial.
- Decoratori: metadati e firma, binding dei metodi, configurazione, ordine delle factory e wrapper, errori propagati e differenze tra funzioni sincrone, coroutine e generatori.
- Generatori: validazione differita, esaurimento, primo iterabile immediato, yield from, send/return, StopIteration e chiusura prima o dopo l'avvio.
- Iteratori: passate indipendenti, esaurimento stabile, backoff numerico senza attese, sentinelle, islice/batched nella baseline, groupby e tee.
- Context manager: ingresso fallito, assegnazione as fallita, return, soppressione e cleanup che fallisce. File temporanei reali, ExitStack e chiusura dopo errori di apertura/decoding.
- Async: coroutine reali su event loop locale, cancellazione sincronizzata con Event senza attese temporali arbitrarie e chiusura esplicita dei generatori asincroni. Clock sostituito nelle controprove che verificano una durata esatta.

Le fixture di I/O sono create e rimosse da TemporaryDirectory. I test non richiedono rete, servizi esterni o accesso ai file personali. Tutti gli esempi vengono eseguiti in un processo Python isolato.

Risultato mirato del 2026-10-23: **73/73 test superati**, circa 13 secondi. Nel primo giro mancavano gli import io/contextlib in tre controprove; corretti i test, nessuna modifica necessaria ai 33 esempi delle note.

Regressione dei cinque capitoli, con toolchain packaging e variabili d'ambiente configurate nella sezione precedente:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-oggetti.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs
```

Regressione seriale del 2026-10-23: **304/304 test superati**, 58 + 60 + 28 + 16 + 69 + 73, nessun fallimento o test saltato, circa 148 secondi. Riutilizzata la toolchain isolata del capitolo packaging, senza nuove installazioni.

Limiti: una baseline Windows/CPython, niente matrice di versioni, type checker, benchmark, test di carico, database o servizi di rete. Il cleanup viene provato sui percorsi dichiarati, non garantito contro arresti forzati o cancellazioni ripetute. Le suite degli altri linguaggi e le verifiche Quartz sono separate.

## Python: type hints e qualita

La suite `python-qualita.test.mjs` estrae **23 blocchi Python**, due configurazioni TOML e una JSON dalle quattro note Type Hinting, Stile, Testing e Logging. Diciotto frammenti sono autonomi; cinque file formano il progetto pytest/unittest. La nota Stile conserva il template teorico.

Richiede una toolchain temporanea dedicata, separata da quella packaging. Esempio PowerShell, con una directory nuova o riservata esclusivamente ai test:

```powershell
$env:PYTHON_QUALITY_TOOLS = Join-Path $env:TEMP 'appunti-python-quality-tools'
```

```powershell
python -m venv $env:PYTHON_QUALITY_TOOLS
```

```powershell
& (Join-Path $env:PYTHON_QUALITY_TOOLS 'Scripts/python.exe') -m pip install mypy==2.4.0 ruff==0.17.2 black==26.10.1 pytest==9.1.1 coverage==7.17.0
```

La CLI ufficiale Pyright e installata tramite npm nella sottocartella node, non globalmente:

```powershell
npm install --prefix (Join-Path $env:PYTHON_QUALITY_TOOLS 'node') --ignore-scripts --no-audit --no-fund --package-lock=false pyright@1.1.414
```

```powershell
node --test _Meta/tests/python-qualita.test.mjs
```

Baseline: CPython 3.12.10 e Node 24.14.0 su Windows. La suite richiede le versioni dei tool sopra elencate; indica cio che e stato provato, non impone di usarle in qualsiasi progetto futuro. L'installazione iniziale richiede i registry; le verifiche successive lavorano su fixture locali senza installazioni o servizi applicativi remoti.

**65 gruppi**:

- Otto esempi typing eseguiti e controllati con entrambi i checker in strict; sette gruppi negativi per checker, oltre a object/Any e varianza delle liste. Protocol runtime, cast, NewType e Literal verificati anche nei loro limiti.
- Ruff check/format, fix sicuri e ordinamento import I001; Black check/diff e formattazione. Verificato che le modalita check non cambino i sorgenti, che i comandi ritornino codici adeguati e che le correzioni agiscano solo nelle fixture.
- Progetto completo: 26 casi pytest, due test unittest, selezione e raccolta. Una mutazione intenzionale del limite della porta fa fallire i test. Zero test raccolti produce exit code 5.
- Coverage con branch, soglia e HTML; soglia fallita su un percorso incompleto. Una fixture separata raggiunge il 100% senza asserzioni: dimostra che la misura non certifica la verifica dei risultati.
- Mock con autospec/spec_set: firme e attributi limitati, tipi degli argomenti non convalidati. File e variabili d'ambiente isolati, senza notifiche reali.
- Logging: stderr distinto da output CLI, basicConfig/force, soglie e propagazione, doppia emissione, formattazione differita, eccezioni, JSON con newline e campi extra mancanti, rotazione su file temporanei.

Risultato mirato del 2026-10-23: **65/65 test superati**, circa 50 secondi. Il primo giro aveva rilevato due diagnostici Pyright sugli esempi didattici: isinstance ridondante e confronto di identita tra tipi staticamente incompatibili. Corrette le note senza disabilitare regole; mypy e Pyright ora accettano gli otto blocchi.

La suite crea soltanto fixture sotto una directory temporanea con prefisso verificato prima della rimozione. Le cache dei checker e gli artefatti coverage restano li; nessuna modifica a site, lockfile del vault o Python globale. Le prove logging usano processi separati per non condividere configurazione globale.

Regressione con entrambe le toolchain preparate e `PYTHON_TEST_EXECUTABLE` impostato come nella sezione packaging:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-oggetti.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-qualita.test.mjs
```

Regressione finale del 2026-10-23: **369/369 test superati**, 304 precedenti + 65 Qualita, nessun fallimento o test saltato, circa 182 secondi. Verificato anche l'output stderr dello script Logging, distinto dallo stdout.

Limiti: una versione per tool e una piattaforma, non verifica di tutti i frammenti inline, ambienti IDE, librerie di terze parti o protocolli arbitrari. Niente invio di log remoti, database, rete applicativa, benchmark, audit o concorrenza multiprocesso. Le controprove volutamente errate restano nelle fixture; le suite degli altri linguaggi, la build e la QA Quartz sono separate.

## Python: Standard Library Pratica

La suite `python-standard-pratica.test.mjs` estrae **17 blocchi Python** dalle cinque note Subprocess, CLI con argparse, SQLite con sqlite3, Networking base e Configurazione e Variabili d Ambiente. Usa soltanto standard library e Git disponibile nel PATH; nessuna dipendenza nuova. Baseline verificata: **CPython 3.12.10, SQLite 3.49.1, Node 24.14.0 su Windows**.

```powershell
node --test _Meta/tests/python-standard-pratica.test.mjs
```

`PYTHON_TEST_EXECUTABLE` puo indicare un interprete alternativo della stessa baseline. Eseguire senza ottimizzazione: le asserzioni delle fixture devono restare attive.

- Processi reali: argomenti letterali, stdin, cwd, ambiente, errori e timeout con cleanup. Git viene provato su un repository temporaneo, senza remoti, con commit locale di fixture e HEAD detached.
- Argparse: parsing/help/exit code, sottocomandi, entry point reali, file UTF-8, creazione esclusiva, overwrite esplicito, stesso percorso/hard link e input errati.
- SQLite: commit/rollback/close, vincoli e parametri, persistenza su file temporanei, foreign key per connessione, errore soppresso, autocommit, backup e accesso read-only.
- HTTP/TCP: server temporanei su 127.0.0.1, porta assegnata dal sistema; JSON, encoding, dimensioni, status e timeout. Frammentazione testata sia con stream reale sia con un test double che restituisce un byte per lettura. Thread e socket vengono chiusi.
- Configurazione: valori assenti/vuoti, parsing booleani, limiti ASCII delle porte, precedenza della CLI anche con False, rappresentazione senza URL e assenza di caricamento automatico di .env.

Risultato mirato del 2026-10-24: **57/57 test superati**, circa 12 secondi. Corrette inizialmente l'escaping e le variabili condivise delle fixture; precisato nelle note il comportamento di exit_on_error rispetto all'uscita per help, verificandolo sulla baseline reale.

Limiti: nessuna matrice di piattaforme, prova TLS/CA, DNS esterno, proxy/redirect, SSRF, carico, crash recovery, WAL concorrente o albero di processi. I test non eseguono i comandi PowerShell delle note ne installano python-dotenv/Pydantic Settings. Gli esempi HTTP non sono un client per URL non fidati; quelli SQLite non certificano compatibilita PostgreSQL. Build e controlli Quartz restano separati.

Regressione completa con le toolchain packaging e qualita predisposte come nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-oggetti.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-qualita.test.mjs _Meta/tests/python-standard-pratica.test.mjs
```

Regressione seriale del 2026-10-24: **426/426 test superati**, 369 precedenti + 57 Standard Library Pratica, nessun fallimento o test saltato, circa 194 secondi. Non eseguire contemporaneamente la build Quartz.

## Python: Internals e Gestione Risorse

La suite `python-internals.test.mjs` estrae **26 blocchi Python** dalle sei note Memory Management, Global Interpreter Lock, Introspezione, Data model, Descriptor protocol e Metaclassi. Baseline: **CPython 3.12.10 con GIL, Windows, Node 24.14.0**. La nuova suite usa soltanto la standard library; `PYTHON_TEST_EXECUTABLE` puo selezionare un interprete compatibile.

```powershell
node --test _Meta/tests/python-internals.test.mjs
```

- Memoria: alias e binding, weak reference e cicli, collector disabilitato/ripristinato, chiusura del generatore, LRU e riferimenti trattenuti, snapshot tracemalloc. Non vengono asseriti conteggi globali di oggetti o byte esatti.
- GIL: risultati con thread, lost update forzato da Barrier e correzione con Lock. Script ProcessPool reale con spawn, guardia di import e file temporaneo. Nessun confronto di velocita o deduzione di scaling.
- Introspezione: lookup statico/dinamico, effetti delle property, limiti di hasattr/dir/callable/vars, binding senza validazione dei tipi. Wrapper keyword con errori, default, metadati e firma originaria.
- Data model: lookup dei metodi speciali sul tipo, hash/uguaglianza, truthiness, fallback legacy di iterazione e contenitore Bag con snapshot, slice, errori e cursori indipendenti.
- Descriptor: precedenza e MRO, binding dei metodi, stato isolato e validazione prima della scrittura. Casi bool/NaN/infinito, cancellazione, assenza, storage aggirabile, slots, ereditarieta e set_name tardivo.
- Metaclassi: ordine effettivo degli hook, init_subclass, collisioni di registro, namespace e classcell conservata, conflitti, decorator che sostituisce la classe ed effetti non annullati da errori.

Risultato mirato del 2026-10-24: **73/73 test superati al primo giro**, circa 11 secondi. Esempi e controprove eseguiti in processi isolati; output catturato, timeout esterni e file temporanei. Il blocco ProcessPool viene anche salvato come script ed eseguito con il suo entry point, non solo importato.

Limiti: nessuna prova di build free-threaded, altri interpreti, RSS restituita al sistema, collector di versioni diverse, benchmark, estensioni native che rilasciano il GIL, memoria nativa o framework ORM/plugin reali. La sezione free-threaded delle note e documentale e riferita esplicitamente a 3.13/3.14. I test del vault e la QA Quartz restano separati.

Regressione con le toolchain packaging/qualita predisposte come sopra, senza build concorrente:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-oggetti.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-qualita.test.mjs _Meta/tests/python-standard-pratica.test.mjs _Meta/tests/python-internals.test.mjs
```

Regressione seriale del 2026-10-24: **499/499 test superati**, 426 precedenti + 73 Internals, nessun fallimento o test saltato, circa 197 secondi. Toolchain precedenti riutilizzate, nessuna dipendenza nuova.

## Python: Concorrenza e Parallelismo

La suite `python-concorrenza.test.mjs` estrae **19 blocchi Python** dalle quattro note Threading, Multiprocessing, Asyncio e Concurrent.futures. Baseline: **CPython 3.12.10 con GIL, Windows, Node 24.14.0**. Usa solo la standard library Python e il parser Markdown gia presente. `PYTHON_TEST_EXECUTABLE` puo selezionare l'interprete compatibile.

```powershell
node --test _Meta/tests/python-concorrenza.test.mjs
```

- Thread: Event di avvio/arresto, join con timeout, lock e contatore, coda limitata con sentinelle, errori e input invalidi. Controprova della mancata propagazione degli errori da join.
- Processi: quattro script eseguiti realmente con spawn, memoria separata, Pool, Queue e Value con lock. Raccolta di errori, risultati ed exit code; import senza avviare figli.
- Asyncio: creazione/attesa delle coroutine, TaskGroup rispetto a gather, cancellazione prima e dopo l'avvio, cleanup, timeout/wait_for e shield. Pipeline a worker fissi con errori del consumer/producer e cancellazione esterna, senza task orfani.
- Future: ordine di map, associazione input/esito, errori raccolti o non osservati, cancellazione pending rispetto a running, shutdown e timeout. Finestra di submit, consumo interrotto, input falliti, ProcessPool e import protetto.
- Test deterministici tramite Event e attese esplicite; nessuna asserzione sul tempo di accelerazione. La controprova di to_thread dimostra che la funzione gia avviata continua dopo la cancellazione della coroutine chiamante.

Risultato mirato del 2026-10-24: **63/63 test superati al primo giro**, circa 17 secondi: quattro controlli strutturali, 19 esempi, 35 controprove e cinque import senza effetti. Gli script multiprocessing sono creati in TemporaryDirectory e avviati come file .py; il contenuto applicativo arriva dal Markdown, non da una sua copia nei test. Processi isolati, output catturato e timeout esterni; nessuna rete applicativa.

Limiti: non e una prova di tutte le interleaving, deadlock possibili o resistenza ai crash. Nessun benchmark, build free-threaded, metodo fork/forkserver, altra piattaforma, shared_memory/Manager, processo congelato o libreria I/O esterna. Le differenze 3.14 su avvio e buffersize sono solo documentali. Il ramo di terminate di emergenza non viene provocato nei test. Thread e processi manuali non sono presentati come supervisori generici.

Regressione seriale del 2026-10-24: **562/562 test superati**, 499 precedenti + 63 Concorrenza, nessun fallimento o test saltato, circa 246 secondi. Toolchain gia presenti riutilizzate, nessuna nuova dipendenza. La build Quartz era in esecuzione separatamente: la durata non e un confronto prestazionale con le passate precedenti.

Regressione con le toolchain packaging/qualita predisposte nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-oggetti.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-qualita.test.mjs _Meta/tests/python-standard-pratica.test.mjs _Meta/tests/python-internals.test.mjs _Meta/tests/python-concorrenza.test.mjs
```

## Python: Performance e Distribuzione

La suite `python-performance.test.mjs` legge le cinque note Profiling, Caching, C extensions, Cython e PyInstaller. Baseline vincolata a **CPython 3.12.10, Windows, Node 24.14.0**. Le versioni degli strumenti sono controllate dal test, non dichiarate come ultime release.

Predisporre un ambiente separato, senza modificare Python globale o le dipendenze Quartz. Il percorso seguente deve essere nuovo o un virtualenv dedicato a questi test:

```powershell
python -m venv "$env:TEMP/appunti-python-performance-tools"
```

```powershell
& "$env:TEMP/appunti-python-performance-tools/Scripts/python.exe" -m pip install "Cython==3.3.0" "PyInstaller==6.22.3" "py-spy==0.4.2" "cachetools==7.2.4" "setuptools==84.2.1" "build==1.6.1" "wheel==0.48.0" "pyinstaller-hooks-contrib==2026.9"
```

```powershell
$env:PYTHON_PERFORMANCE_TOOLS = Join-Path $env:TEMP 'appunti-python-performance-tools'
```

```powershell
node --test _Meta/tests/python-performance.test.mjs
```

45 casi: metadati, dieci blocchi Python di profiling/cache, controprove, CLI e progetti completi estratti dai Markdown. Esito del 2026-10-24: **43 superati, 2 saltati per MSVC assente e nessun fallimento** dopo la correzione del comando py-spy.

- Profiling: input del carico, import senza effetti, correttezza dei due algoritmi, cProfile/pstats, timeit, orologi e tracemalloc. py-spy genera un SVG dal solo programma dimostrativo: `--subprocesses` segue anche il figlio del launcher del virtualenv Windows. Nessuna misura usata come promessa di prestazioni.
- Caching: eviction LRU, conteggi hit/miss, validazione prima della cache, normalizzazione delle chiavi e risultati immutabili. Orologio TTL controllato; Barrier/Event provano miss duplicati e clear durante un calcolo in corso senza dipendere da sleep arbitrari.
- Estensioni: parsing TOML e sintassi degli script, traduzione Cython reale in C e annotazione HTML. Due test tentano wheel native con build senza isolamento, poi installazione locale ed esecuzione dei verificatori. Se manca MSVC vengono **saltati esplicitamente**, non considerati riusciti; altri errori di build fanno fallire il test.
- PyInstaller: app sorgente, help e argomenti errati; build reali onedir/onefile con risorsa, ricostruzione dallo spec, avvio di copie fuori dalla directory di lavoro e con sorgenti temporaneamente non disponibili. Una risorsa rimossa nella copia del bundle deve produrre errore.
- I processi hanno timeout esterni e output catturato. Fixture, cache e output sono in una nuova directory temporanea verificata prima della rimozione. Nessuna installazione di compilatori, pubblicazione di package, ispezione di processi estranei o modifica alle policy del sistema.

Limiti: C e Cython non sono collaudati a runtime senza compilatore. La traduzione Cython non prova la correttezza del binario e i test Python non sostituiscono quelli della C API. PyInstaller e verificato sulla macchina di build, non su un sistema pulito privo di Python; non copre altri sistemi operativi, firme, antivirus, GUI, multiprocessing congelato o hook di pacchetti esterni. Nessun benchmark, profiler native, cache distribuita o matrice di interpreti.

Regressione seriale delle undici suite: **607 casi, 605 superati, zero fallimenti e 2 saltati**, circa 287 secondi. I 562 test precedenti restano superati; la nuova suite aggiunge 43 successi e due verifiche native non eseguibili. La build Quartz era in esecuzione separatamente: non e un confronto prestazionale.

Per la regressione impostare anche le toolchain Packaging e Qualita descritte sopra:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-oggetti.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-qualita.test.mjs _Meta/tests/python-standard-pratica.test.mjs _Meta/tests/python-internals.test.mjs _Meta/tests/python-concorrenza.test.mjs _Meta/tests/python-performance.test.mjs
```

## Python: Web, API e Database - Framework

La suite `python-web-frameworks.test.mjs` legge **Flask, Starlette, FastAPI e Django**: 14 blocchi Python e un template HTML. I tre verificatori e il progetto Django vengono ricostruiti dai Markdown, senza duplicare il codice applicativo nelle fixture.

Baseline: **CPython 3.12.10, Windows, Node 24.14.0**. Predisporre un nuovo virtualenv dedicato, senza modificare Python globale o il sito:

```powershell
python -m venv "$env:TEMP/appunti-python-web-tools"
```

```powershell
& "$env:TEMP/appunti-python-web-tools/Scripts/python.exe" -m pip install "Flask==3.1.3" "Werkzeug==3.1.9" "starlette==1.10.0" "fastapi==0.162.0" "pydantic==2.14.1" "Django==5.2.18" "httpx==0.28.1" "httpx2==2.16.0" "uvicorn==0.54.0" "websockets==17.3"
```

```powershell
$env:PYTHON_WEB_TOOLS = Join-Path $env:TEMP 'appunti-python-web-tools'
```

```powershell
node --test _Meta/tests/python-web-frameworks.test.mjs
```

Le versioni dirette sono controllate dal test; questi pin non sono un lock completo delle dipendenze transitive. httpx2 serve al TestClient corrente di Starlette, httpx al client del lifespan: non sono lo stesso pacchetto.

**Esito mirato del 2026-10-24: 53/53 test**, nessun fallimento o test saltato, circa 54 secondi. Un caso Node esegue anche i **sette test Django presenti nella nota**; questi non vanno sommati come sette ulteriori casi Node. Il primo giro aveva un errore nel test che presumeva tutte le route dell'app FastAPI piatte: corretto il controllo sul router originale, gli esempi applicativi erano gia eseguibili.

- Flask: schema, limiti, Content-Type/JSON, HEAD/OPTIONS/405 e Allow, factory isolate, contesti, errori inattesi e escaping. CLI scopre la factory; una richiesta HTTP reale passa attraverso un server Werkzeug su loopback.
- Starlette: lifespan ripetuto, client condiviso/chiuso, assenza di startup senza with, routing, CORS/preflight ed errori 500. WebSocket in-process: testo, byte UTF-8, binario, origine e chiusura; background task fallita e successive non eseguite; endpoint sync fuori dal thread del loop.
- FastAPI: tipi strict e limiti, schema OpenAPI, input/output separati, filtro campi, override isolati ed errori del servizio. Output invalido produce errore server; Response esplicita bypassa il modello. Gli eventi ASGI verificano il cleanup di yield prima/dopo l'invio secondo scope, anche in errore.
- Starlette/FastAPI: richieste HTTP reali tramite Uvicorn su porte effimere di loopback, seguite da shutdown e join.
- Django: startproject/startapp reali, file della nota, migrazione generata/applicata e controllo di assenza di altre modifiche. Form, validazione distinta da save, vincoli DB e rollback, query lazy, JSON/HTML, escaping, admin protetto, CSRF esplicitamente attivo e host rifiutati. check --deploy segnala correttamente settings di sviluppo.

Le fixture, il database e i file generati stanno in una nuova directory temporanea, verificata prima della rimozione. I processi hanno timeout; server/thread vengono chiusi. Nessuna creazione di account reali, migrazione su database utente o esposizione in rete esterna.

Limiti: client HTTP in-process non provano enforcement CORS del browser; WebSocket non collaudati attraverso socket/TLS/proxy. Nessun audit completo di autenticazione/permessi, configurazione di produzione, carico, job durabili, multiworker, crash recovery, transazioni PostgreSQL o matrice di versioni. Il client HTTP del lifespan non chiama servizi esterni; /docs non viene collaudata come UI offline. Questi test non completano le quattro note rimanenti del capitolo.

Regressione seriale delle dodici suite: **660 casi, 658 superati, zero fallimenti e 2 saltati**, circa 328 secondi. I due skip restano le build native C/Cython per MSVC assente. La durata include lavoro concorrente della build Quartz e non e un benchmark.

Regressione con anche le toolchain Packaging, Qualita e Performance predisposte nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-oggetti.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-qualita.test.mjs _Meta/tests/python-standard-pratica.test.mjs _Meta/tests/python-internals.test.mjs _Meta/tests/python-concorrenza.test.mjs _Meta/tests/python-performance.test.mjs _Meta/tests/python-web-frameworks.test.mjs
```

## Python: Web, API e Database - Persistenza e Client HTTP

La suite `python-database-http.test.mjs` estrae **16 blocchi Python e un INI** dalle note SQLAlchemy, Alembic, Pydantic e HTTPX e requests. Sono inclusi il frammento da inserire nella classe User, i verificatori e i sorgenti delle migrazioni: il codice applicativo non e duplicato nelle fixture.

Baseline: **CPython 3.12.10, Windows, Node 24.14.0**. Creare un nuovo ambiente dedicato; il percorso seguente e un esempio e non deve coincidere con un ambiente gia usato per altro.

```powershell
py -3.12 -m venv "$env:TEMP/appunti-python-database-tools"
```

```powershell
& "$env:TEMP/appunti-python-database-tools/Scripts/python.exe" -m pip install "SQLAlchemy[asyncio]==2.0.55" "alembic==1.20.1" "pydantic[email]==2.14.1" "email-validator==2.3.0" "aiosqlite==0.22.1" "httpx==0.28.1" "requests==2.34.2"
```

```powershell
$env:PYTHON_DATABASE_TOOLS = Join-Path $env:TEMP 'appunti-python-database-tools'
```

```powershell
node --test --test-concurrency=1 _Meta/tests/python-database-http.test.mjs
```

Versioni dirette controllate dal test; non e un lock completo delle dipendenze transitive. Nessuna modifica al Python globale o alle dipendenze di Quartz.

**Esito mirato del 2026-10-26: 68/68 test**, nessun fallimento o skip, circa 61 secondi. Il conteggio Node include dieci sotto-test Alembic e il relativo contenitore, non 68 programmi distinti.

- SQLAlchemy: script sync/async, flush distinto da commit, chiusura senza conferma, autobegin/autoflush, identity map, attributi scaduti, rollback dopo errore e atomicita. Controprove su create_all, String(254) in SQLite, NOT NULL e query parametrizzate.
- Alembic: init/revision CLI, INI/env reali, SQL offline senza creazione del database, upgrade/check/seed, rilevazione di drift, autogenerate e dati conservati. Downgrade su copia temporanea, perdita dei valori della colonna, stamp che non cambia lo schema e cancellazione finale della tabella.
- Pydantic: script originali, input negativi, strict Python/JSON, limiti, errori annidati, extra, default, liste indipendenti e mutazioni non intercettate. Controprove su construct/copy, istanze gia validate, nullable rispetto a omissibile, output pubblico e schema.
- HTTP: tre client su socket loopback, successo, redirect non seguito, 503/204, Content-Type/JSON, dimensione esatta e superamento del limite. Parser, POST JSON con status 201, read timeout HTTPX e deadline async reali; chiusura dello stream sync verificata separatamente con MockTransport.

Fixture e database in directory temporanee dedicate, con percorsi verificati prima della rimozione. Server limitati a 127.0.0.1 e porte effimere, chiusi con shutdown/join; sottoprocessi con timeout. Nessuna richiesta a servizi esterni durante i test.

Limiti: SQLite non prova concorrenza, isolamento, driver o migrazioni PostgreSQL. Non sono testati N+1 con relazioni reali, migrazioni di grandi tabelle, merge di branch, lock di produzione, autenticazione, TLS/proxy, HTTP/2, retry con idempotenza, carico o difesa completa da payload ostili. Le prove di validazione non verificano identita o consegna delle email. Nessuna matrice OS/versioni.

Con le altre toolchain predisposte e le variabili PYTHON_TEST_EXECUTABLE, PYTHON_PACKAGING_TOOLS, PYTHON_QUALITY_TOOLS, PYTHON_PERFORMANCE_TOOLS e PYTHON_WEB_TOOLS configurate come nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-oggetti.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-qualita.test.mjs _Meta/tests/python-standard-pratica.test.mjs _Meta/tests/python-internals.test.mjs _Meta/tests/python-concorrenza.test.mjs _Meta/tests/python-performance.test.mjs _Meta/tests/python-web-frameworks.test.mjs _Meta/tests/python-database-http.test.mjs
```

Regressione seriale delle tredici suite: **728 casi, 726 superati, zero fallimenti e 2 saltati**, circa 437 secondi. I due skip restano le build native C/Cython per MSVC assente; la compilazione nativa non e dichiarata verificata. La durata include la build Quartz concorrente e non e un benchmark.

## Python: Data, Automazione e LLM - Dati e Notebook

La suite `python-data-notebooks.test.mjs` legge pandas, NumPy e Jupyter: **11 blocchi Python e tre magic IPython** estratti dai Markdown. Ricostruisce il notebook con nbformat, riutilizzando il modulo sales_report della nota pandas, senza mantenere una seconda implementazione delle trasformazioni.

Baseline: **CPython 3.12.10, Windows, Node 24.14.0**. Predisporre un nuovo virtualenv dedicato; i comandi seguenti non devono puntare a un ambiente gia usato per altro.

```powershell
py -3.12 -m venv "$env:TEMP/appunti-python-data-tools"
```

```powershell
& "$env:TEMP/appunti-python-data-tools/Scripts/python.exe" -m pip install "pandas==3.1.0" "numpy==2.5.4" "jupyterlab==4.6.4" "notebook==7.6.3" "ipykernel==7.4.0" "nbconvert==7.17.2" "nbformat==5.11.1"
```

```powershell
$env:PYTHON_DATA_TOOLS = Join-Path $env:TEMP 'appunti-python-data-tools'
```

```powershell
node --test --test-concurrency=1 _Meta/tests/python-data-notebooks.test.mjs
```

I pin diretti sono controllati dalla suite, ma non costituiscono un lock di tutte le transitive. Il test isola directory di configurazione, dati, runtime e IPython; registra il kernelspec con `--prefix` nella fixture temporanea, invece di modificare il prefisso del virtualenv con `--sys-prefix` come nella procedura interattiva della nota.

Nuova suite **49/49 test superati** durante la regressione, con 11 blocchi Python e tre magic estratti dai Markdown. Il conteggio Node include gli undici sotto-test Jupyter e il loro contenitore, non 49 programmi distinti. Corretta la fixture del timeout; nessun test del nuovo blocco saltato.

- pandas: esecuzione dei tre script, schema e tipi, NA distinto da zero, importi mancanti, regioni assenti, totali parziali e riconciliazione delle righe. CSV errati, ID duplicati, codici NA/zeri iniziali, allineamento, Copy-on-Write/alias, copie object non ricorsive, cardinalita e chiavi dei merge.
- NumPy: cinque script, shape e broadcasting, vista/copia, assi, input non mutato, costanti, vuoti, tipi errati, NaN/inf e overflow. Controprove su dtype inferito, ddof, allclose con broadcasting, solve singolare e np.vectorize.
- Jupyter: kernelspec con interprete verificato, help CLI delle due interfacce, notebook valido e due esecuzioni pulite tramite kernel reale. Tabella HTML, export e rimozione degli output su copie, input non sovrascritto, fallimento per ordine errato delle celle e per errori marcati, timeout reale, tre magic originali.
- Il primo giro aveva un errore nella fixture di timeout: passava sia 60 sia 1 alla stessa opzione, rifiutata da traitlets. Corretta la composizione degli argomenti; il codice delle note e gli altri casi erano gia funzionanti.

I file restano in directory temporanee verificate prima della rimozione; non vengono caricati dati utente. nbconvert avvia e arresta kernel locali, senza esporre server Jupyter o modificare kernelspec globali. Nessun notebook aggiunto al vault.

Limiti: non sono un benchmark o una verifica statistica generale. Non provati Excel/Parquet e relativi engine, dataset grandi, elaborazione distribuita, ogni dtype/BLAS, addestramento ML, kernel remoti, UI interattiva Jupyter, grafici/widget o deployment pubblico. I controlli di sicurezza descritti non equivalgono a un audit.

Regressione con le sei toolchain temporanee (Packaging, Qualita, Performance, Web, Database e Data) e le relative variabili d'ambiente predisposte come nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-oggetti.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-qualita.test.mjs _Meta/tests/python-standard-pratica.test.mjs _Meta/tests/python-internals.test.mjs _Meta/tests/python-concorrenza.test.mjs _Meta/tests/python-performance.test.mjs _Meta/tests/python-web-frameworks.test.mjs _Meta/tests/python-database-http.test.mjs _Meta/tests/python-data-notebooks.test.mjs
```

Regressione seriale delle quattordici suite: **777 casi, 775 superati, zero fallimenti e 2 saltati**, circa 519 secondi. I due skip restano le build native C/Cython per MSVC assente. La durata comprende lavoro concorrente della build Quartz e non e un benchmark.

## Python: Data, Automazione e LLM - Scraping e Automazione

La suite `python-scraping-automation.test.mjs` estrae **quattro blocchi Python completi** da Scraping con BeautifulSoup e Automazione file e script. Non mantiene una seconda implementazione del parser o della rinomina.

Baseline: **CPython 3.12.10 su Windows, Node 24.14.0**, beautifulsoup4 4.15.0, SoupSieve 3.0.4, Requests 2.34.2. In questa sessione sono state riutilizzate queste dipendenze gia presenti nella toolchain temporanea Data, senza nuove installazioni. Per riprodurre la suite e sufficiente un nuovo ambiente dedicato piu piccolo:

```powershell
py -3.12 -m venv "$env:TEMP/appunti-python-automation-tools"
```

```powershell
& "$env:TEMP/appunti-python-automation-tools/Scripts/python.exe" -m pip install "beautifulsoup4==4.15.0" "soupsieve==3.0.4" "requests==2.34.2"
```

```powershell
$env:PYTHON_AUTOMATION_TOOLS = Join-Path $env:TEMP 'appunti-python-automation-tools'
```

```powershell
node --test _Meta/tests/python-scraping-automation.test.mjs
```

**48/48 test mirati superati**, zero skip, circa 20 secondi. Non sono 48 programmi differenti; includono controprove sulle funzioni estratte.

- Parser: titolo assente/vuoto, testo annidato ed entita, attributi mancanti, selettori, URL relativi/esterni, primo base, frammenti, query e duplicati, schemi/credenziali/porte, charset e JavaScript non eseguito.
- HTTP reale soltanto su loopback: successo, 503/204/302, nessun follow dei redirect, Content-Type errato/assente, charset HTTP/meta, dimensione esatta e oltre limite, limite sui byte decompressi gzip.
- Mock espliciti: configurazione timeout, propagazione di Timeout e chiusura della risposta dopo errore. Non e una nuova prova di timeout Requests su socket lento.
- Filesystem temporaneo: dry-run, contenuto binario invariato, apply, seconda esecuzione, selezione non ricorsiva, suffissi, collisioni prima delle modifiche, prefissi non validi e directory non ammesse.
- Controprove: destinazione comparsa dopo il piano, sorgente rimossa, errore simulato sulla seconda rinomina e prima operazione gia completata. Verificati messaggi DONE e codici CLI.
- Junction Windows reale rifiutata come directory; file symlink e link rotto verificati mediante simulazione di lstat. Non dichiarata una prova reale dei file symlink su tutte le piattaforme.
- Inventario dei log vuoti senza rimozioni. Pulizia limitata alle directory temporanee, con verifica del percorso prima della rimozione ricorsiva.

Il primo giro ha rilevato errori nelle fixture: escape Python interpretati da JavaScript e confronto tra percorso temporaneo breve Windows e percorso risolto. Corrette le stringhe raw e la normalizzazione nella suite; nessuna modifica al codice delle note per aggirare questi controlli.

Limiti: niente crawling di siti pubblici, robots automatico, browser automation, parser XML/lxml/html5lib, audit SSRF, corpus HTML ostile o grandi download. Nessuna prova Unix, race reale tra processi, filesystem remoto, crash/recovery o backup completo. Il controllo prima di rename non garantisce assenza di overwrite in presenza di altri scrittori.

Regressione mirata alle dipendenze concettuali del blocco, con le variabili Packaging e Database predisposte come nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-standard-pratica.test.mjs _Meta/tests/python-database-http.test.mjs _Meta/tests/python-scraping-automation.test.mjs _Meta/tests/quartz-preview.test.mjs
```

Regressione mirata: **208/208 test superati**, zero skip/fallimenti, circa 103 secondi; quattro suite Python piu i **7/7 test dell'anteprima**. La regressione completa delle altre suite Python e degli altri linguaggi non e stata rieseguita in questa sessione.

## Python: Data, Automazione e LLM - Inferenza Locale e OpenAI API

La suite `python-llm.test.mjs` estrae **cinque blocchi Python** dai Markdown: local_chat, local_completion, openai_text, classify_ticket e stream_text. Non mantiene una seconda implementazione delle funzioni delle note.

Baseline: **CPython 3.12.10 su Windows x64, Node 24.14.0**, llama-cpp-python 0.3.36 (wheel CPU), openai 3.38.0, HTTPX2 2.16.0 e Pydantic 2.14.1. Nel virtualenv sono presenti anche NumPy 2.5.4, diskcache 5.6.3 e Jinja2 3.1.6 come dipendenze del binding. Nessuna modifica a Python globale, dipendenze Quartz o lockfile.

In un nuovo ambiente temporaneo dedicato:

```powershell
py -3.12 -m venv "$env:TEMP/appunti-python-llm-tools"
```

```powershell
& "$env:TEMP/appunti-python-llm-tools/Scripts/python.exe" -m pip install "openai==3.38.0" "httpx2==2.16.0" "pydantic==2.14.1"
```

```powershell
& "$env:TEMP/appunti-python-llm-tools/Scripts/python.exe" -m pip install "llama-cpp-python==0.3.36" --only-binary=llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
```

```powershell
$env:PYTHON_LLM_TOOLS = Join-Path $env:TEMP 'appunti-python-llm-tools'
```

```powershell
node --test _Meta/tests/python-llm.test.mjs
```

Non viene compilato il binding: se la wheel non e disponibile, occorre predisporre una toolchain alternativa e verificarla separatamente. I pin diretti non bloccano tutte le dipendenze transitive.

**42/42 test mirati superati**, zero skip/fallimenti, circa 45 secondi.

- Import reali e firme API del binding; verifica di close e assenza del protocollo context manager su Llama nella baseline.
- Nessun caricamento o creazione client all'importazione dei moduli; help CLI e errore di configurazione senza richieste.
- Inferenza locale simulata: parametri, formato dei messaggi, assenza di stop universale, input vuoti, budget, token passati alla completion, output troncato/vuoto e tool call.
- Costruttore Llama simulato su un file temporaneo di sola fixture: controllo percorso/estensione e argomenti. Non e un modello GGUF valido e non viene passato al costruttore nativo reale.
- Punti d'ingresso provati con istanza simulata: caricamento singolo e close anche dopo errore.
- SDK OpenAI reale con HTTPX2 MockTransport: serializzazione di endpoint, header e body, output composto, stati non completati, rifiuti, input e risposta vuota.
- Structured Outputs: schema inviato, quattro categorie, JSON/categorie/campi extra non validi e risultato parsato assente. Controprova esplicita: una categoria formalmente valida puo essere semanticamente sbagliata.
- Errori HTTP simulati 400/401/403/404/429/500/503 con request ID, nessun retry, timeout e connessione simulati.
- Eventi SSE serializzati attraversano il parser streaming reale dello SDK: testo incrementale/finale, errore/incomplete/EOF, callback fallito e stream chiuso.

Le variabili OPENAI/Azure/LLAMA/Hugging Face vengono rimosse dall'ambiente dei processi di test. I client delle prove di richiesta usano una chiave fittizia e il dominio `api.openai.invalid` con trasporto in memoria, senza socket. La sola prova di configurazione crea e chiude un client per l'endpoint pubblico senza eseguire richieste.

**Limiti:** nessun modello GGUF scaricato o caricato, generazione reale, benchmark, GPU, chat template su pesi reali, server llama o embeddings. Nessuna chiamata OpenAI, disponibilita di un modello/account, fatturazione, TLS/rete reale, qualita o robustezza a prompt injection verificate. I test non equivalgono a un audit di sicurezza.

Regressione mirata, predisponendo anche PYTHON_DATABASE_TOOLS come nella sezione Database:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-llm.test.mjs _Meta/tests/python-database-http.test.mjs _Meta/tests/quartz-preview.test.mjs
```

Regressione mirata: **117/117 test superati**, zero skip/fallimenti, circa 112 secondi, inclusi **7/7 test dell'anteprima**. Non rieseguita tutta la suite Python o degli altri linguaggi.

## Python: Tooling e Qualita - isort, pre-commit, tox e nox

La suite `python-tooling.test.mjs` estrae configurazioni ed esempi dalle tre note operative, e riusa i sette file del package dimostrativo di Creazione di Package. Non mantiene una copia alternativa dell'applicazione.

Baseline: **CPython 3.12.10 su Windows x64 e Node 24.14.0**, isort 9.0.2, pre-commit 4.7.0, tox 4.67.1, nox 2026.10.20, Black 26.10.1, pytest 9.1.1 e Ruff 0.17.3. Toolchain in un nuovo virtualenv temporaneo; nessuna modifica al Python globale, al sito o ai lockfile. Per gli ambienti: virtualenv 21.15.0 e python-discovery 1.6.5; setuptools 84.2.1, wheel 0.48.0 e pip 26.2.2 nella wheelhouse.

Preparazione in un percorso temporaneo nuovo:

```powershell
py -3.12 -m venv "$env:TEMP/appunti-python-tooling-tools"
```

```powershell
& "$env:TEMP/appunti-python-tooling-tools/Scripts/python.exe" -m pip install "isort==9.0.2" "pre-commit==4.7.0" "tox==4.67.1" "nox==2026.10.20" "black==26.10.1" "pytest==9.1.1" "ruff==0.17.3" "virtualenv==21.15.0" "python-discovery==1.6.5"
```

```powershell
& "$env:TEMP/appunti-python-tooling-tools/Scripts/python.exe" -m pip download --dest "$env:TEMP/appunti-python-tooling-tools/wheelhouse" "pytest==9.1.1" "ruff==0.17.3" "setuptools==84.2.1" "wheel==0.48.0" "pip==26.2.2" "black==26.10.1" "isort==9.0.2"
```

```powershell
$env:PYTHON_TOOLING_TOOLS = Join-Path $env:TEMP 'appunti-python-tooling-tools'
```

```powershell
node --test --test-concurrency=1 _Meta/tests/python-tooling.test.mjs
```

I pin non costituiscono un lock completo delle dipendenze transitive. Git deve essere disponibile. La prima esecuzione pre-commit puo usare la rete per scaricare **pre-commit-hooks v6.0.0** e **isort 9.0.2** dai rispettivi repository ufficiali e prepararne le dipendenze. La cache resta sotto il virtualenv temporaneo, in `pre-commit-cache`. Le prove tox/nox usano invece `PIP_NO_INDEX` e le wheel predisposte; l'esecuzione dei test non richiede servizi applicativi esterni.

**37/37 test nuovi superati nella regressione finale**. Prima passata 36/37: la fixture isort non era tracciata, quindi le sue modifiche non comparivano nel diff Git usato dal runner; aggiunto il file all'indice per provare il normale caso di commit. Superata la ripetizione mirata e poi tutta la regressione, senza modificare la configurazione delle note.

Copertura:

- Metadati, template operativo e gerarchia dei titoli.
- isort: check/diff senza scrittura, gruppi, idempotenza, compatibilita Black, import inutilizzati, esclusioni su file espliciti e direttive di ordine.
- pre-commit reale: YAML, revisioni/stage, file non tracciati, correzioni e indice Git invariato, staging esplicito, Markdown, hook isort e hook locale manuale con ambiente fornito.
- Installazione/disinstallazione hook esclusivamente nel repository temporaneo. Non si installano hook, creano commit o effettuano push nel vault.
- tox/nox reali: discovery, wheel/installazione, import da site-packages fuori dai sorgenti, due test originali, selezione posargs, lint senza package, ricreazione/riuso e propagazione di fallimenti deliberati.
- Interprete inesistente 3.99 come controprova, non come piattaforma supportata o richiesta di download.
- Fixture rimosse dopo controllo del percorso assoluto; solo la toolchain/cache temporanea rimane riutilizzabile.

Limiti: solo Windows/Python 3.12.10, non matrice OS/interpreti, servizi di CI remoti o audit della supply chain. L'installazione dell'hook e verificata ma non si crea un vero commit per provarne l'invocazione automatica; non sono riprodotti conflitti di stash con commit parziali. Non vengono eseguiti autoupdate, pubblicazione di package o tutti i frammenti di variante. I due test interni del demo non vanno sommati nuovamente al conteggio della suite Node.

Regressione mirata, con PYTHON_PACKAGING_TOOLS e PYTHON_QUALITY_TOOLS predisposti nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-packaging.test.mjs _Meta/tests/python-qualita.test.mjs _Meta/tests/python-tooling.test.mjs _Meta/tests/quartz-preview.test.mjs
```

Risultato: **125/125 test**, zero fallimenti/skip, circa **277 secondi**, inclusi **37/37 nuovi test** e **7/7 test dell'anteprima**. Non rieseguita l'intera suite Python o degli altri linguaggi. La verifica editoriale/build e separata: 911 documenti raggiungibili, zero errori, 403 avvisi; nove test della trasformazione superati; build e QA delle tre pagine su desktop/mobile riuscite.

## Python: Promemoria - Sintassi Essenziale e Funzioni

`python-promemoria-linguaggio.test.mjs` estrae **24 blocchi Python autonomi**: 14 da Sintassi essenziale e 10 da Funzioni. Esegue ciascun blocco in un processo separato, quindi non maschera nomi mancanti con variabili definite da snippet precedenti.

Baseline: **CPython 3.12.10 su Windows x64 e Node 24.14.0**. Solo standard library, nessuna nuova installazione. Il comando `python` deve indicare quell'interprete; in alternativa imposta `PYTHON_TEST_EXECUTABLE` al percorso assoluto del Python da verificare.

```powershell
node --test _Meta/tests/python-promemoria-linguaggio.test.mjs
```

**53/53 test mirati superati al primo giro**, zero skip/fallimenti, circa 7 secondi.

- Struttura operativa, singolo H1, gerarchia dei titoli e metadati.
- Ogni snippet eseguito autonomamente, con asserzioni su output o variabili risultanti.
- Condizioni ai confini, short-circuit, default solo per None, conversioni e copie superficiali.
- Range, while senza iterazioni, continue/break/else, risultato zero valido, unpacking e walrus senza corrispondenza.
- Firme positional-only/keyword-only, default mutabili e valutazione alla definizione, keyword duplicate o non stringa.
- Annotazioni non imposte dal runtime, consumo di iteratori, sort in-place e sorted.
- Bounds su sequenza, input vuoto e controprova del generatore fuori contratto; risultato ed eccezioni delle callback.
- Le varianti modificano tramite AST soltanto un input dimostrativo top-level, non l'algoritmo. Nessuna modifica ai file delle note durante i test.

Non sono provate tutte le versioni Python, i type checker, oggetti con protocolli personalizzati o ogni frammento inline. La funzione bounds richiede una sequenza di numeri finiti: non e un validatore di input arbitrario. Nessun socket, servizio esterno, file applicativo o package installato da questa nuova suite.

Regressione mirata **dopo** che `site:build` e terminata, perche i test dell'anteprima richiedono gli HTML completi:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-promemoria-linguaggio.test.mjs _Meta/tests/quartz-preview.test.mjs
```

Risultato finale: **191/191 test superati**, zero skip/fallimenti, circa **37 secondi**, inclusi **53 nuovi test** e **7/7 test dell'anteprima**. La prima esecuzione era stata avviata durante la build: 184 test Python passati e sette test HTTP fermati dal prerequisito HTML assente. Ripetuta l'intera selezione dopo la build, senza modificare il codice dell'anteprima. Non rieseguite tutte le altre suite Python o degli altri linguaggi.

Controlli separati: 911 documenti raggiungibili, zero errori, 401 avvisi editoriali; **9/9 test della trasformazione**. Build Quartz riuscita e due pagine controllate su desktop/mobile, con quattro screenshot ispezionati. Questi controlli non equivalgono a test su tutte le versioni Python.

## Python: Promemoria - Collezioni e Dizionari

`python-promemoria-collezioni.test.mjs` estrae **24 blocchi Python autonomi**: 12 da Liste, tuple e set e 12 da Dizionari. Ogni blocco viene eseguito in un processo separato: nessuna variabile viene ereditata dagli altri snippet.

Baseline: **CPython 3.12.10 su Windows x64 e Node 24.14.0**. Solo standard library, nessuna nuova installazione. `python` deve indicare quell'interprete, oppure imposta `PYTHON_TEST_EXECUTABLE` al percorso assoluto.

```powershell
node --test _Meta/tests/python-promemoria-collezioni.test.mjs
```

Risultato: **55/55 test mirati**, zero skip/fallimenti, circa 8 secondi. Il primo giro era 54/55: la variante del raggruppamento non includeva il gruppo admin che il demo stampa. Corretta la fixture mantenendo admin e aggiungendo reader; nessun cambiamento all'algoritmo della nota per aggirare il test.

- Frontmatter, gerarchia dei titoli, struttura operativa e numero dei blocchi.
- Output o risultati di tutti gli snippet estratti.
- Indici/slice, metodi mutanti, append/extend, elementi assenti e liste vuote.
- Ordinamento stabile, chiavi, iteratori consumati, sort in place e sorted.
- Copie esterne, alias, mutazioni annidate, deepcopy su liste e ripetizione di riferimenti.
- Tuple singole, unpacking, posizioni non assegnabili e hashability.
- Operazioni sui set, pop senza ordine imposto, elementi non hashable e deduplicazione con input vuoto/valori numerici uguali.
- Dict: assenza rispetto a None/falsy, sentinella, update/merge superficiale, ordine e chiavi uguali.
- Pop/popitem, cambio di dimensione durante iterazione, viste vive e snapshot superficiali.
- Setdefault con gruppi distinti, None preesistente e valutazione del default; conteggi e filtri.
- Fromkeys con valore condiviso rispetto a comprehension con valori indipendenti.

Le varianti sostituiscono tramite AST solo gli input dimostrativi top-level, non il codice della procedura. Le note non vengono modificate durante i test. Nessun socket, file applicativo o package installato dalla suite.

Limiti: una versione Python e un OS; non una matrice di runtime, test di concorrenza, benchmark, checker statico, oggetti con hash/uguaglianza personalizzati o ogni frammento inline. Le prove di copie profonde riguardano le liste del demo, non risorse o oggetti arbitrari.

Regressione Python mirata:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-strutture-dati.test.mjs _Meta/tests/python-promemoria-linguaggio.test.mjs _Meta/tests/python-promemoria-collezioni.test.mjs
```

Risultato: **168/168 test**, zero skip/fallimenti, circa **26 secondi**. Dopo la fine di `site:build`, verificata separatamente l'anteprima:

```powershell
node --test _Meta/tests/quartz-preview.test.mjs
```

**7/7 test HTTP** superati; totale delle due esecuzioni **175 test**. Non rieseguite tutte le altre suite Python o degli altri linguaggi. Controlli separati: 911 documenti raggiungibili, zero errori, 399 avvisi editoriali; **9/9 test della trasformazione**, build e QA desktop/mobile delle due note riuscite, quattro screenshot ispezionati.

## Python: Promemoria - Stringhe, Numeri e Date

`python-promemoria-testo-date.test.mjs` estrae **27 blocchi Python autonomi**: 13 da Stringhe e regex e 14 da Numeri e date. Esegue ogni blocco in un processo isolato e controlla risultati, output e casi limite.

Baseline: **CPython 3.12.10 su Windows x64, Node 24.14.0 e tzdata 2026.5**. In questa passata riutilizzato il virtualenv temporaneo Packaging gia configurato; nessuna nuova installazione e nessuna modifica a Python globale o alle dipendenze del sito.

`PYTHON_TEST_EXECUTABLE` deve puntare all'interprete del virtualenv con tzdata. Per prepararlo da zero, vedi la sezione File, moduli e ambiente. Il test fallisce se la dipendenza manca, non salta silenziosamente i casi zoneinfo.

```powershell
node --test _Meta/tests/python-promemoria-testo-date.test.mjs
```

**74/74 test mirati**, zero skip/fallimenti, circa 15 secondi:

- Struttura operativa, metadati e 27 blocchi effettivamente eseguiti.
- Immutabilita, code point/byte, casefold distinto da normalizzazione Unicode.
- Strip rispetto a prefissi/suffissi, find zero/-1, split/join/splitlines, formattazione e predicati Unicode.
- Regex ASCII rispetto a IGNORECASE Unicode, fullmatch, search, match, gruppi e forma di findall.
- Nessun match, pattern errati, date formalmente corrette ma impossibili e sostituzione letterale.
- Conversioni, aggregazioni vuote, round, floor/ceil, isclose, NaN e infinito.
- Decimal da stringa, quantize, arrotondamento esplicito e ripristino di un contesto esterno personalizzato.
- Random isolato con seed, scelta su sequenza vuota, shuffle in place e token da 32 byte.
- Date aware/naive, ISO senza offset rifiutato, date impossibili, parsing/formattazione e durate negative.
- ZoneInfo con dati reali, offset estivo/invernale, fold e differenza UTC rispetto all'aritmetica locale.
- Simulazione controllata di dati IANA mancanti, timestamp in secondi e contatore monotono.

Prima esecuzione **72/73**: la simulazione di tzdata mancante lasciava accessibili sottopacchetti gia importati. Corretta la fixture bloccando tutti i moduli tzdata caricati, azzerando TZPATH e svuotando la cache ZoneInfo nel solo processo del test. Aggiunta poi la prova del contesto Decimal personalizzato. Le procedure nelle note non sono state cambiate per aggirare il test.

Gli input di variante sono sostituiti via AST solo nelle assegnazioni dimostrative top-level. Il test del contesto prepara Decimal prima di eseguire lo snippet originale; i casi ISO negativi verificano l'eccezione del blocco estratto. Nessuna modifica alle note da parte dei test.

Limiti: una baseline/OS; nessun benchmark, test statistico o certificazione crittografica, audit ReDoS, copertura di ogni locale/fuso/versione IANA, parser ISO universale, ogni frammento inline o validazione di dati arbitrari. La mancanza del database e simulata in memoria; il database presente e usato realmente. Nessuna chiamata remota o nuova installazione durante le prove.

Regressione Python mirata con lo stesso interprete configurato:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-fondamenti.test.mjs _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-promemoria-testo-date.test.mjs
```

Dopo il completamento di `site:build`, verificare separatamente l'anteprima:

```powershell
node --test _Meta/tests/quartz-preview.test.mjs
```

Risultato della regressione: **160/160 test Python**, zero skip/fallimenti, circa **43 secondi**, poi **7/7 test HTTP** dopo la build; **167 test complessivi** in due esecuzioni. Non rieseguite le altre suite Python o degli altri linguaggi.

Controlli separati: **911 documenti raggiungibili, zero errori e 397 avvisi editoriali**, nessuno sui due promemoria; **9/9 test della trasformazione**, build Quartz e QA desktop/mobile delle due note riuscite. Quattro screenshot ispezionati; le verifiche del sito non certificano ogni combinazione di input o piattaforma Python.

## Python: Promemoria - File, JSON e CSV

`python-promemoria-file-dati.test.mjs` estrae **23 blocchi Python autonomi**: 13 da File e percorsi e 10 da JSON e CSV. Ogni blocco viene eseguito in un processo isolato; il sorgente viene materializzato in un file temporaneo e compilato con il corrispondente `__file__`. La directory corrente e distinta dalla cartella dello script.

Baseline: **CPython 3.12.10 su Windows x64 e Node 24.14.0**. La suite nuova usa solo standard library, senza nuove installazioni. `PYTHON_TEST_EXECUTABLE` puo indicare un interprete esplicito; il default e `python`.

```powershell
node --test _Meta/tests/python-promemoria-file-dati.test.mjs
```

**75/75 test mirati**, zero skip/fallimenti, circa **16 secondi**:

- Struttura operativa, metadati e risultati/output di tutti gli snippet.
- Percorsi da script rispetto a cwd, componenti assolute, osservazioni non atomiche del filesystem.
- Encoding invalido, genitori assenti, lettura integrale o per righe, newline universali e byte.
- Creazione esclusiva, troncamento, append, chiusura su eccezione e scritture parziali.
- Directory, glob/rglob, filtri sui file e ricerca vuota.
- Rinomina e vecchio Path invariato, collisioni Windows, unlink, rmdir e copia/spostamento reali.
- Cleanup anche su eccezione; prova del fallback opzionale con PermissionError simulato.
- JSON: tipi, Unicode, file, BOM, output parziale, documenti concatenati, NaN/infinito e chiavi duplicate.
- Schema JSON minimo con booleano esatto, radici inattese e campi mancanti/extra.
- CSV: virgolette, virgole, newline interni, delimitatori, BOM, valori None e conversioni esplicite.
- Colonne mancanti/extra/duplicate/invertite, ID invalidi e nome vuoto; documentati e provati ID duplicati ammessi, segno/spazi e file con sola intestazione.

Le varianti cambiano tramite AST solo assegnazioni dimostrative top-level. I dati dei test e le directory create dagli esempi rimangono sotto una radice temporanea dedicata. Prima di ogni rimozione ricorsiva del test harness vengono verificati percorso risolto, directory genitore e prefisso. Verificato anche che gli esempi non lascino file nella cwd o nelle directory temporanee predisposte. Nessun file applicativo o appunto dell'utente viene spostato/cancellato.

Primo giro **72/75**: due confronti lessicali non risolvevano gli alias Windows 8.3; la prova di copia sullo stesso file attendeva SameFileError, mentre il ramo nativo CopyFile2 di CPython 3.12.10 ha generato PermissionError/WinError 32. Verificata l'implementazione locale: le prove confrontano ora percorsi risolti e controllano un errore OSError con sorgente invariata, senza cambiare gli snippet per aggirare le verifiche.

Limiti: Windows e una versione Python; non test reali POSIX, copie tra filesystem, tutti i metadati/ACL, symlink/junction, crash/durabilita, accessi concorrenti o filesystem non fidato. I permessi del fallback sono simulati; le altre operazioni descritte sono reali su fixture. Non e un audit di CSV injection o un validatore universale di JSON/CSV; non ogni frammento inline e eseguito.

Regressione con l'interprete temporaneo Packaging gia disponibile e tzdata 2026.5, richiesto dalla suite Standard Library; nessuna nuova installazione:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-file-standard.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-promemoria-file-dati.test.mjs
```

Dopo il completamento della build, eseguire separatamente i test HTTP:

```powershell
node --test _Meta/tests/quartz-preview.test.mjs
```

Risultati del 2026-10-27: **176/176 test Python**, zero skip/fallimenti, circa **36 secondi**. A build conclusa, **7/7 test dell'anteprima** superati separatamente: **183 complessivi**, non un'unica esecuzione. Non rieseguita l'intera suite Python o degli altri linguaggi.

Controlli separati: **911 documenti raggiungibili, zero errori e 395 avvisi editoriali**, nessuno sulle due note; **9/9 test della trasformazione** e build Quartz riusciti. QA desktop/mobile su Chrome 156.0.8078.48: HTTP 200, nessun errore console/JavaScript o overflow del documento; 23 elementi di codice scorrevoli su mobile, nessuno su desktop, quattro screenshot ispezionati. I controlli del sito non certificano gli esempi su altre piattaforme.

## Python: Promemoria - HTTP e Ambienti

`python-promemoria-http-ambienti.test.mjs` estrae **13 blocchi Python**: otto funzioni HTTP autonome e cinque blocchi su import/diagnostica, di cui tre costituiscono un esempio multifile. Estrae anche i comandi usati per il package, venv, pip e PowerShell.

Baseline: **CPython 3.12.10, Requests 2.34.2, HTTPX 0.28.1 e Node 24.14.0 su Windows x64**. Riutilizzati gli ambienti temporanei Database e Packaging. Pip **26.2.2** nella toolchain Packaging, **25.0.1** fornito da ensurepip nel nuovo venv di prova. Nessuna modifica al Python globale o alle dipendenze di site.

Imposta `PYTHON_DATABASE_TOOLS` e `PYTHON_PACKAGING_TOOLS` sui due virtualenv gia predisposti, come nelle rispettive sezioni. Nel secondo deve essere presente `wheelhouse/setuptools-84.2.1-py3-none-any.whl`; nessun download durante le prove.

```powershell
node --test _Meta/tests/python-promemoria-http-ambienti.test.mjs
```

**56/56 test mirati**, zero skip/fallimenti, circa **44 secondi**:

- HTTP reale su server loopback con porta effimera, senza servizi remoti. Verificati GET, query, POST JSON, status, redirect, cookie e header Bearer con token fittizio e netrc temporaneo.
- Risposte JSON invalide o fuori schema, errori HTTP e assenza di retry impliciti. Timeout e connessione fallita Requests simulati; la nota distingue questi casi dagli errori di parsing/contratto.
- Client sync e async reali, chiamata nel loop del chiamante, cancellazione simulata con chiusura verificata e deadline abbreviata su attesa simulata. Non misurate latenze di rete reali.
- Download reale, limite esatto/superato, file parziale, destinazione esistente invariata, genitore assente, risposta vuota e trasferimento troncato. Tutto in fixture temporanee.
- Import standard/alias, package multifile originale via -m, import senza avvio di main, cache del modulo, fallimento previsto dell'avvio diretto e shadowing locale.
- Creazione reale del venv con ensurepip, diagnostica senza attivazione, pip check/freeze e installazione da requirements usando esclusivamente la wheel locale fidata di setuptools.
- Requirements vuoto non elimina la dipendenza gia installata; non e una sincronizzazione esatta. Pip 26.2.2 verificato separatamente sulla toolchain esistente.
- Comandi PowerShell originali per interprete esplicito, attivazione, salvataggio UTF-8 dello snapshot e disattivazione. Controllati interprete selezionato, contenuto del file e ripristino del PATH.

Primo giro **52/56**: il filtro di rete della fixture ammetteva soltanto la porta del server, bloccando anche il socketpair loopback usato internamente da asyncio su Windows. Corretto per consentire loopback, senza modificare gli snippet della nota. Tutti gli URL della prova puntano al server temporaneo; nessuna chiamata HTTP esterna.

Le funzioni vengono eseguite come scritte, non reinterpretate. Il package viene materializzato dai tre blocchi e dai due `__init__.py` vuoti dichiarati. Prima della rimozione ricorsiva del test harness si verificano percorso risolto, parent e prefisso; nessun file del progetto viene cancellato. Browser e anteprima sono controlli separati.

Limiti: una versione/OS, niente TLS/proxy/CA reali, servizi autenticati, SSRF audit, HTTP/2, carico o garanzie di atomicita/durabilita dei download. Le varianti Bash/POSIX sono controllate nel testo, non eseguite. Non eseguiti l'installazione online di Requests/HTTPX o l'aggiornamento di pip; verificati import/versioni gia disponibili e installazione offline da requirements. Nessuna modifica alla execution policy. I test dei comandi non certificano ogni shell o distribuzione Linux.

Regressione mirata con gli stessi due ambienti:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-database-http.test.mjs _Meta/tests/python-packaging.test.mjs _Meta/tests/python-promemoria-http-ambienti.test.mjs
```

Dopo la fine di site:build, separatamente:

```powershell
node --test _Meta/tests/quartz-preview.test.mjs
```

Risultati del 2026-10-27: **140/140 test Python**, zero skip/fallimenti, circa **174 secondi**. Dopo la fine della build, **7/7 test dell'anteprima** superati separatamente: **147 complessivi**, non un'unica esecuzione. Non rieseguita l'intera suite Python o degli altri linguaggi.

Controlli separati: **911 documenti raggiungibili, zero errori e 394 avvisi editoriali**, nessuno sulle due note; **9/9 test della trasformazione** e build Quartz riusciti. QA Chrome 156.0.8078.48 desktop/mobile: HTTP 200, nessun errore console/JavaScript o overflow del documento; 14 elementi di codice scorrevoli su mobile, nessuno su desktop, quattro screenshot ispezionati. Le verifiche del sito non certificano i comandi su altre piattaforme.

## Python: Promemoria - Iterazione, Asyncio e Debug

`python-promemoria-iterazione-async-debug.test.mjs` estrae **33 blocchi Python**: 14 da Comprehension/iteratori/generatori, otto da Asyncio/concorrenza e undici da Eccezioni/log/debug. Usa solo standard library con **CPython 3.12.10 su Windows x64 e Node 24.14.0**; nessuna nuova installazione.

```powershell
node --test _Meta/tests/python-promemoria-iterazione-async-debug.test.mjs
```

**91/91 test mirati**, zero skip/fallimenti, circa **22 secondi**. Ogni esempio in un processo isolato, con output o risultati verificati:

- Comprehension, alias, input vuoti, duplicati, hashability, scope, appiattimento di un livello, enumerate e zip strict con errore differito.
- Sentinella distinta da None, consumo monouso, conversione differita, errori del generatore, variabili libere, chain/islice, groupby adiacente e gruppi condivisi, close prima/dopo l'avvio.
- Coroutine create/attese/riusate, ordine di gather diverso dal completamento e fratello non cancellato automaticamente. Il test libera e raccoglie comunque il lavoro rimasto.
- TaskGroup con errore e cleanup del fratello, timeout cooperativo e assenza di task residui. Errori delle coroutine iniettati mediante sostituzione della funzione dimostrativa chiamata, non delle primitive asyncio.
- to_thread eseguito realmente fuori dal thread del loop; Event coordina la prova che cancellare l'attesa non interrompe il thread, rilasciato e atteso alla fine.
- Coda limitata: input vuoto, contabilita comprensiva della sentinella e guasto del worker che propaga senza bloccare il producer.
- Eccezioni/fallback, chiusura su ritorni ed errori dell'else, file assenti/vuoti/invalidi, cause esplicite, errore personalizzato e soppressione limitata. PermissionError del file opzionale simulato; altre fixture filesystem reali.
- Logging: stderr/livelli, configurazione gia presente, import senza configurazione root, argomenti calcolati anche con DEBUG disattivo e traceback dell'eccezione corrente.
- Debugger reale con stdin controllato: breakpoint, ispezione e continuazione, piu avvio tramite python -m pdb. Nell'altro test unitario il breakpointhook viene sostituito per evitare interazione.
- repr, type, vars e assert: esecuzione reale anche con python -O per dimostrare la rimozione del controllo, non soltanto ispezione del sorgente.

Le varianti AST cambiano soltanto dati dimostrativi top-level; nessuna seconda implementazione degli algoritmi. File di prova sotto una radice temporanea; percorso risolto, parent e prefisso verificati prima del cleanup ricorsivo. Thread, loop e task vengono chiusi; nessun file personale modificato.

Il primo giro ha superato tutti i 91 casi; prima della regressione e stata resa esplicita anche l'asserzione sul root logger nel caso di import, oltre alla verifica che lo snippet non generi errori.

Limiti: una versione/OS, task factory standard con GIL, nessun carico o benchmark, eager task factory, free-threading, matrice di scheduler/versioni/IDE o audit dei log. Pdb provato in subprocess con comandi su stdin, non in un terminale grafico personale. Il cleanup non e una garanzia contro crash/arresto forzato. Non eseguito ogni frammento inline.

Regressione dei **13 promemoria** (sei suite), piu Funzionale/Iterazione, Concorrenza e Qualita. Imposta `PYTHON_TEST_EXECUTABLE` sull'interprete Packaging con tzdata gia disponibile e le variabili `PYTHON_DATABASE_TOOLS`, `PYTHON_PACKAGING_TOOLS`, `PYTHON_QUALITY_TOOLS` sui rispettivi ambienti descritti nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/python-promemoria-linguaggio.test.mjs _Meta/tests/python-promemoria-collezioni.test.mjs _Meta/tests/python-promemoria-testo-date.test.mjs _Meta/tests/python-promemoria-file-dati.test.mjs _Meta/tests/python-promemoria-http-ambienti.test.mjs _Meta/tests/python-promemoria-iterazione-async-debug.test.mjs _Meta/tests/python-funzionale-iterazione.test.mjs _Meta/tests/python-concorrenza.test.mjs _Meta/tests/python-qualita.test.mjs
```

Dopo il completamento della build, separatamente:

```powershell
node --test _Meta/tests/quartz-preview.test.mjs
```

Risultati del 2026-10-27: **605/605 test**, zero skip/fallimenti, circa **217 secondi**, inclusi **404 test dei promemoria**. Dopo la fine della build, **7/7 test dell'anteprima** superati separatamente: **612 complessivi**, non un'unica esecuzione. Non rieseguite tutte le altre suite delle note principali Python o degli altri linguaggi.

Controlli separati: **911 documenti raggiungibili, zero errori e 391 avvisi editoriali**, nessuno sulle tre note; **9/9 test della trasformazione** e build Quartz riusciti. QA Chrome 156.0.8078.48 desktop/mobile: HTTP 200, nessun errore console/JavaScript o overflow del documento; 25 elementi di codice scorrevoli su mobile, nessuno su desktop, sei screenshot ispezionati. La verifica del sito non e una certificazione degli esempi su altre piattaforme.

La passata Python comprende ora **75 note principali e 13 promemoria**. I **144 blocchi Python dei promemoria** sono coperti dalle sei suite dedicate, con i limiti descritti in ciascuna sezione; non confondere questo conteggio con tutti gli esempi inline o shell.

## TypeScript: fondamenti del linguaggio

`typescript-fondamenti.test.mjs` estrae i blocchi dalle sette note del capitolo Fondamenti del Linguaggio. Usa il parser Markdown del sito e il vero checker/emitter di TypeScript, non una seconda implementazione degli esempi.

Richiede le dipendenze gia installate in `site`: baseline fissata a **TypeScript 5.9.3**, verificata con Node **24.14.0**. Nessuna nuova toolchain o dipendenza aggiunta. Se il compilatore del sito cambia, il test di versione richiede di rivalidare le aspettative invece di considerarle automaticamente equivalenti.

```powershell
node --test _Meta/tests/typescript-fondamenti.test.mjs
```

Risultato del 2026-10-20: **52 test superati**, nessun fallimento o test saltato, in circa 68 secondi.

- 23 controlli di compilazione dei blocchi indipendenti in strict; l'unico blocco di continuazione viene verificato insieme al suo esempio.
- Test statici positivi e negativi: annotazioni, ritorni, inizializzazione, narrowing, literal, array, optional exact, unknown, never, union, intersection, merging e proprieta in eccesso.
- Esecuzione del JavaScript emesso: prezzi e totali con limiti numerici, proiezione dei dati, input invalidi, errori di parsing, risultato del catch e fallback per un valore lanciato non Error.
- CLI reale sull'esempio introduttivo: noEmit, emissione `.cts` -> `.cjs`, esecuzione Node e verifica che noEmitOnError lasci invariato un artefatto precedente dopo un errore.
- I file ordinari di prova restano virtuali; soltanto il caso CLI crea una cartella temporanea sotto il percorso di sistema. Prima della rimozione ricorsiva vengono verificati parent risolto e prefisso. Nessuna modifica al codice delle note o ai file del sito da parte dei test.

Limiti: un compilatore e un runtime, non una matrice di versioni o di bundler. I comandi npm di inizializzazione/installazione non vengono rieseguiti: la CLI usa il compilatore locale gia presente. Non sono collaudati backend, autenticazione, validazione completa di email, sicurezza contro oggetti Proxy/getter ostili o ogni frammento inline. La suite JavaScript/React non viene rieseguita per questo blocco; i controlli del vault e la build Quartz sono separati.

## TypeScript: funzioni, oggetti e collezioni

`typescript-funzioni-collezioni.test.mjs` estrae i blocchi delle sette note omonime dall'indice TypeScript. Il supporto al checker, all'emissione virtuale e all'esecuzione VM e ora in `typescript-examples.mjs`, riusato anche dalla suite Fondamenti.

Richiede TypeScript **5.9.3** nelle dipendenze del sito, Node **24.14.0** e, per il test DOM, Playwright e Chrome. `PLAYWRIGHT_MODULE_PATH` puo indicare un pacchetto Playwright esterno, come per le altre suite browser; `BROWSER_CHANNEL` permette di cambiare canale. La prova fallisce se il browser non e disponibile, non viene silenziosamente saltata.

```powershell
node --test _Meta/tests/typescript-funzioni-collezioni.test.mjs
```

**67 nuovi casi**: 29 compilazioni dei blocchi, un controllo della baseline, 36 gruppi Node e una prova browser con piu scenari DOM.

- Parametri, callback, default, rest, void e Promise; assenza/undefined/null, preview email senza invio e merge con Partial.
- Array readonly, copie e ordinamento numerico, indici assenti, tuple modificabili e riferimenti condivisi.
- Enum numerici/stringa, reverse mapping, const enum con preserveConstEnums, literal e guard condiviso con la lista runtime.
- Asserzioni prive di conversione, non-null che fallisce, guard con controlli sui tipi reali e campi propri. Una controprova reintroduce nella sola fixture il guard errato, mostrando che il checker non verifica la verita del predicate.
- Chrome: input valido anche con valore non email, elemento mancante, textarea/div e input appartenente a un altro realm; nessun servizio esterno.
- Overload con union, narrowing, ritorno inferito e ultima firma. Una mutazione controllata dell'implementazione dimostra che compilare non garantisce il risultato corretto di ogni overload.
- Dizionari: chiavi assenti, prototype, chiavi proprie speciali, Record finiti, metadata separati, opzioni di accesso e diagnostici. Controprova sul vecchio lookup che restituiva toString invece di boolean.

Regressione complessiva eseguita il 2026-10-20:

```powershell
$tests = (Get-ChildItem -LiteralPath '_Meta/tests' -Filter 'typescript-*.test.mjs').FullName
node --test --test-concurrency=1 $tests
```

**119 test superati**, 52 precedenti e 67 nuovi, zero fallimenti o test saltati, in circa 73 secondi. Il browser di prova viene chiuso; nessuna nuova dipendenza o modifica al lockfile. La build Quartz e stata avviata dopo la fine dei test.

Limiti: una baseline TypeScript e un runtime Node; il DOM e provato in Chrome, non una matrice di browser. Nessun backend, invio email, validazione completa di indirizzi, sicurezza contro Proxy/getter, CSV completo, bundler alternativi o test di ogni esempio inline. Le modifiche intenzionalmente errate avvengono soltanto in memoria. I 119 test non includono le suite JavaScript/React, non rieseguite in questo blocco.

## TypeScript: programmazione ad oggetti e generics

`typescript-oggetti-generics.test.mjs` estrae i blocchi dalle cinque note del capitolo Programmazione ad Oggetti. Riusa `typescript-examples.mjs`: checker/emitter reale con output virtuale ed esecuzione in VM, senza scrivere file compilati nel vault.

Richiede TypeScript **5.9.3** gia installato in `site` e Node **24.14.0**. La nuova suite non richiede browser; la regressione complessiva include ancora la prova DOM del blocco precedente, che richiede Playwright e Chrome come descritto sopra.

```powershell
node --test _Meta/tests/typescript-oggetti-generics.test.mjs
```

**54 nuovi casi**: 23 compilazioni di blocchi indipendenti, un controllo della baseline e 30 gruppi statici/runtime.

- Istanze e costruttori, membri statici, oggetti strutturali e prototipo; timer con clock deterministico, restart e default performance.now.
- Asserzione di inizializzazione, this esplicito, metodo estratto, bind e arrow per istanza; ordine dei campi, super, override e declare.
- Controlli di accesso statici, bracket access a private e mutazioni possibili dal JavaScript; #private, receiver errato, enumerazione/serializzazione e nomi stringa distinti.
- Factory locale con trim e limite UTF-16, costruttore private chiamabile nel JavaScript emesso, parameter properties incompatibili con erasableSyntaxOnly; readonly superficiale.
- Classi astratte e firme dei costruttori, sottoclasse concreta, repository in memoria, assenza/null, confronto esatto, riferimenti condivisi ed errori dell'adapter.
- Implementazione strutturale, mancata inferenza dei parametri da implements, proprieta opzionali non create, lato statico/istanza e test double email senza invio.
- Inferenza literal, unwrap senza conversione o validazione, array vuoto, constraint e sottotipi, slot generico e cancellazione dei parametri di tipo.
- Controprove intenzionali in memoria: hook nel costruttore prima dei campi derivati, bivarianza dei metodi, first con ritorno troppo stretto e aggiornamento generico che viola un literal. Non si modifica la fonte per provocare i fallimenti.

Regressione seriale al 2026-10-20 con il comando complessivo riportato sopra: **173 test superati**, 119 precedenti e 54 nuovi, zero fallimenti o test saltati, in circa 109 secondi. Nella prima esecuzione mirata era errato un codice diagnostico atteso dal test (2353 anziche 2345 per il literal con campo extra); corretto e aggiunto il caso separato della variabile priva di id. Nessuna dipendenza o lockfile modificato.

Limiti: un compilatore e un runtime, non matrice di versioni, browser o bundler. Non sono implementati SMTP, autenticazione, database, validazione email completa o misure di segretezza; performance.now non e un benchmark o una verifica della sospensione del sistema. La prova di type stripping controlla erasableSyntaxOnly, non avvia tutti i loader Node. Suite JavaScript/React non rieseguite; controlli del vault, build Quartz e QA del sito restano separati.

## TypeScript: narrowing e controllo dei tipi

`typescript-narrowing.test.mjs` estrae i blocchi dalle sei note del capitolo Narrowing e Controllo dei Tipi. Riusa il checker/emitter e la VM di `typescript-examples.mjs`; i sorgenti Markdown sono la fonte degli esempi, non una seconda implementazione.

Richiede TypeScript **5.9.3** gia installato in `site` e Node **24.14.0**. Questa suite usa solo Node; la prova tra realm usa un contesto VM separato. La regressione di tutte le suite richiede ancora Playwright e Chrome per il test DOM del secondo capitolo.

```powershell
node --test _Meta/tests/typescript-narrowing.test.mjs
```

**62 nuovi casi**: 26 compilazioni di blocchi indipendenti, un controllo della baseline e 35 gruppi statici/runtime.

- Narrowing dopo return, truthiness/nullish, assegnazioni, closure e snapshot di stringhe prima di una callback che muta l'oggetto originale.
- Guardia JSON con campi propri e tipi controllati, assenza distinta da undefined, ereditarieta e limiti di Object.hasOwn per il checker.
- Array densi/vuoti/sparsi, confronto con every che salta i buchi, mutazioni successive e Array.isArray tra realm.
- Union discriminate: payload obbligatorio, widening, satisfies, destructuring const rispetto a let/rest e nuova variante senza ritorno.
- Esaustivita: assertNever senza serializzare il payload, cicli/BigInt/toJSON, aggiunta di varianti, cast che aggira il controllo, noImplicitReturns e mapping Record incompleto.
- Predicate: categoria number, contratto del ramo false, filtri inferiti, Boolean, NonNullable, riferimenti condivisi e firme accettate con implementazione sbagliata.
- Assertion: config senza validazione URL, condizione/valore definito, zero e altri falsy, arrow annotata, catch, firma async non ammessa e corpo che non verifica la promessa.

Prima esecuzione mirata 61/62: era errata l'aspettativa del test che una condizione riscritta con ternario mantenesse il narrowing. Conservata come controprova negativa e verificati separatamente `value == null` e `!(value != null)`; nessun errore nei 26 blocchi delle note.

Regressione seriale completa al 2026-10-20, con il comando complessivo riportato sopra: **235 test superati**, 173 precedenti e 62 nuovi, zero fallimenti o test saltati, in circa 149 secondi. Nessuna nuova dipendenza o modifica al lockfile; build Quartz avviata soltanto dopo la conclusione dei test.

Limiti: una baseline TypeScript/Node, non una matrice di compilatori o target. Non sono provati tutti i frammenti inline, schemi arbitrari, Proxy/getter/iteratori ostili, autorizzazioni, pagamenti, URL sicuri o dati di produzione. Le controprove volutamente errate restano nelle fixture in memoria; il blocco unsafe nelle note e etichettato come controesempio. Nessun invio di rete applicativo, nessuna riesecuzione delle suite JavaScript/React.

## TypeScript: tipi avanzati

```powershell
node --test _Meta/tests/typescript-tipi-avanzati.test.mjs
```

Suite di **66 test** sulle nove note del capitolo, con il supporto condiviso `typescript-examples.mjs` invariato: 34 blocchi Markdown compilati dal checker reale, un controllo della versione 5.9.3 e 31 gruppi statici/runtime. Prima esecuzione completa riuscita: 66/66, zero fallimenti o test saltati, circa 106 secondi.

Copertura:

- Generics: chiave/valore, default e constraint, costruzione illegittima di un sottotipo; repository locale con sostituzione, riferimenti condivisi e chiave non aggiornata dopo una mutazione.
- Conditional: distribuzione rispetto al confronto globale, any/unknown/never, filtri di union, unwrap singolo rispetto ad Awaited e thenable.
- Mapped: readonly superficiale, tuple, conservazione di optional/readonly nel form, differenza fra exactOptionalPropertyTypes attivo e disattivo, remapping, collisioni e campi non rimossi a runtime.
- Template literal: prodotto cartesiano, nome/payload correlati e parser del solo prefisso; test di suffisso vuoto e input che non rispetta il pattern.
- Indexed access e keyof/typeof: getter specifici, chiavi mancanti, array vuoto, noUncheckedIndexedAccess, optional, symbol/numero, chiavi comuni e Object.keys diverso dalla vista statica.
- Infer: readonly, tuple vuote/aperte, never[] rispetto a unknown[], ultima firma di overload, ritorno generico e declare privo di implementazione.
- Ricorsione: albero finito e nodi condivisi, numeri non finiti/cicli in JsonValue, diagnostico di istanziazione non terminante, readonly profondo con alias e classi non supportate.
- Tuple variadiche: input readonly, risultato mutabile, label, wrapper senza log dei dati, this, throw e Promise identica con rejection gestita, concat superficiale e partial application.

La regressione delle cinque suite usa il comando complessivo TypeScript riportato sopra e il runtime Playwright per la prova DOM gia presente. Al 2026-10-21: **301 test superati**, 235 precedenti e 66 nuovi, zero fallimenti o test saltati, circa 290 secondi su Node 24.14.0. Build Quartz avviata soltanto a regressione conclusa.

Questa nuova suite non richiede un browser o dipendenze aggiuntive. Il confronto degli errori usa diagnostici del compilatore; il JavaScript viene eseguito in VM solo dopo compilazione riuscita. Gli input volutamente errati restano nelle fixture.

Limiti: baseline singola, non tutti i frammenti inline, target o versioni. Non sono collaudati servizi HTTP/email, persistenza, autenticazione, emitter o parser universali. Non vengono percorse strutture cicliche con una ricorsione runtime illimitata; il test TS2589 non promette una soglia di profondita stabile. I tipi non certificano immutabilita runtime o validita applicativa dei dati. Build/QA e test della trasformazione restano separati.

## TypeScript: moduli e configurazione

```powershell
node --test _Meta/tests/typescript-moduli-configurazione.test.mjs
```

Suite di **31 test** sulle sette note del capitolo. Configurazioni JSON, comandi ed esempi TypeScript sono estratti dai Markdown. Prima esecuzione mirata: **31/31 riusciti**, zero fallimenti o test saltati, circa 49 secondi.

Baseline: TypeScript **5.9.3**, Node **24.14.0**, esbuild **0.27.3**, tutti gia disponibili localmente. Le fixture risolvono `@types/node` **25.3.0**, presente in `site`, tramite `typeRoots` aggiunto soltanto nei config temporanei: nessuna installazione o modifica al lockfile. Gli esempi usano API eseguite in Node 24; questa differenza di major dei tipi non certifica la compatibilita di tutte le API Node 25 con Node 24.

Copertura:

- JSON, comandi copiabili separatamente e metadati delle sette note.
- `tsconfig`: output e runtime, `showConfig`, `noEmit`, `noEmitOnError` e artefatti vecchi, import di file esclusi, `rootDir`, `extends` e comportamento degli argomenti sorgente nella baseline.
- ESM/CommonJS: esempi `.ts` e `.cts`, `.mts`, estensioni mancanti, import solo di tipi ed effetti collaterali, `verbatimModuleSyntax`, `require()` di ESM sincrono e rifiuto del top-level await.
- Resolution: traccia reale, package locale con export map e sottopercorso privato, dichiarazione senza implementazione.
- Alias: `paths` senza `baseUrl`, CLI esbuild con bundling, mancata riscrittura di `tsc`, package imports `#` risolti prima della prima build e fallimento senza la mappatura runtime.
- References: build da zero e incrementale, `dry`, `force`, `clean`, dichiarazioni, cache, stop dei consumatori con errori, artefatti precedenti, dipendenza non costruita da `-p` e requisito `composite`.
- Strict: null/stringa vuota/array vuoto, accessi indicizzati, optional esatti, `any`, `catch`, iteratori e override delle singole opzioni.
- Source map: stack JavaScript e TypeScript con riga del throw verificata, mappe esterne e inline, sorgenti incorporati, opzioni incompatibili e `noEmit`.

Le CLI e il runtime lavorano in directory temporanee dedicate, rimosse solo dopo aver verificato il percorso assoluto. I casi volutamente errati non modificano i Markdown. Nessuna chiamata a servizi esterni o uso del browser personale.

Limiti: una baseline e Windows, non tutte le versioni, piattaforme o toolchain. Non vengono collaudati Vite/Jest/ESLint, pubblicazione npm di pacchetti dual-format, ogni condizione di exports, performance delle build o interfacce di debugger. La procedura Inspector e documentata ma non avviata dai test; gli stack sono verificati direttamente in Node. La presenza di una mappa non certifica ogni breakpoint o una pipeline di minificazione. Test della trasformazione, build Quartz e QA delle pagine restano controlli distinti.

Regressione seriale delle sei suite al 2026-10-21: **332 test superati**, 301 precedenti e 31 nuovi, zero fallimenti o test saltati, circa 460 secondi. Inclusa la prova DOM precedente con Playwright/Chrome; suite JavaScript e React non rieseguite. La build Quartz e stata avviata soltanto dopo la conclusione della regressione. Il comando complessivo TypeScript e riportato sopra; dettagli e QA sono registrati in `_Meta/Revisione contenuti.md`.

## TypeScript: utility e pattern di tipo

```powershell
node --test _Meta/tests/typescript-utility-pattern.test.mjs
```

Suite di **52 test** sulle sei note del capitolo: 21 blocchi Markdown compilati in strict, un controllo della baseline e 30 gruppi statici/runtime. Prima esecuzione mirata: **52/52 riusciti**, nessun fallimento o test saltato, circa 99 secondi.

Riusa `typescript-examples.mjs`, il compilatore **TypeScript 5.9.3** presente in site e **Node 24.14.0**. Nessuna nuova dipendenza; compilazione in memoria e JavaScript eseguito in VM. La suite non richiede browser; la regressione complessiva mantiene il requisito Playwright/Chrome del test DOM preesistente.

Copertura:

- Utility standard: Omit rispetto alla proiezione/serializzazione, patch esplicita e valori falsy, optional con exact attivo/disattivo, readonly superficiale, Record e noUncheckedIndexedAccess, firme/overload, Awaited e NoInfer.
- Utility personalizzate: modificatori e nullable superficiale, chiavi obbligatorie, limiti del controllo runtime, null/undefined, Omit distribuito con discriminanti e campi non rimossi dai valori.
- Brand: parser con unknown, formato completo e newline finali, brand incompatibili, tipo base, concatenazione, assertion elusiva, unique symbol cancellato e JSON da ricontrollare.
- satisfies: contextual typing di stringhe/booleani, stato annotato mutabile, chiavi finite/aperte, proprieta in eccesso, optional non aggiunti, identita runtime e bypass con any.
- as const e const generics: tuple readonly o mutabili secondo il contesto in 5.9.3, riferimenti condivisi, copie, limiti sintattici, vincoli, perdita di literal nelle variabili e argomenti di tipo espliciti.

Un controllo preliminare ha smentito l'aspettativa storica di fallback a string[] con const generic e vincolo mutabile: nota e test seguono il comportamento locale e la PR ufficiale 55229. Non vengono eseguite versioni storiche del compilatore.

Regressione seriale delle sette suite al 2026-10-22: **384 test superati**, 332 precedenti e 52 nuovi, nessun fallimento o test saltato, circa 561 secondi. Compresa la prova DOM preesistente; suite JavaScript e React non rieseguite. Build Quartz avviata soltanto a regressione conclusa.

Limiti: una baseline TypeScript/Node, non tutti i frammenti inline, target o combinazioni di utility. Nessun servizio email, database, verifica di autorizzazioni, validatore completo di email/URL o certificazione di immutabilita. Gli ID hanno un formato dimostrativo, non uno standard UUID. Gli input volutamente errati restano nelle fixture; build e QA del sito sono verifiche separate. Il risultato della regressione completa e registrato in `_Meta/Revisione contenuti.md`.

## TypeScript: type system in profondita

```powershell
node --test _Meta/tests/typescript-type-system.test.mjs
```

La suite richiede TypeScript **5.9.3**, Node **24.14.0** e Playwright/Chrome tramite `PLAYWRIGHT_MODULE_PATH`, come per le prove browser precedenti. Usa dipendenze gia disponibili; non installa pacchetti e non modifica i sorgenti degli esempi.

Contiene **51 test**: un controllo della baseline, otto controlli editoriali e 42 gruppi statici/runtime. I 35 blocchi TypeScript delle otto note sono estratti dai Markdown; quelli multifile vengono compilati insieme nelle fixture, quello legacy usa il suo flag. Copertura:

- Structural typing: proprieta extra conservate, identita, classi pubbliche/private, logger e weak types.
- Variance: reader/writer, strictFunctionTypes, metodi bivarianti, store invarianti, array mutabili e annotazioni in/out.
- Conditional types distributivi: wrapper, union concreta, array misti, filtri di eventi, never/any/unknown e prodotto di union.
- Inferenza: contextual typing, const, widening, chiavi assenti o duplicate nella Map e default dei generics espliciti.
- Declaration merging: proprieta, overload, promesse senza implementazione, scope globale/locale e Window nel browser reale. Il JavaScript CommonJS compilato usa uno shim locale di exports nella pagina di fixture, non il loader ESM del browser.
- Module augmentation: progetto ESM reale con NodeNext, plugin presente/assente, specifier errato, conflitti, noEmitOnError e differenza rispetto a un modulo ambient.
- Namespace: emissione runtime, membri non esportati, merging, soli tipi cancellati e dichiarazioni ambient senza implementazione.
- Decorators: this, parametri, ritorni, identita delle Promise, errori propagati, ordine di valutazione/applicazione, inizializzatori di field e modalita legacy. I comandi tsc e Node della nota sono eseguiti con file reali.

Il primo giro ha rilevato un'aspettativa troppo specifica nel test del modulo ambient: con la dichiarazione in un .d.ts, il consumer produce TS2307, non TS2664. Corretto il diagnostico atteso e riuscita la riesecuzione mirata. Il caso .ts con specifier di augmentation errato verifica separatamente TS2664.

Regressione seriale delle otto suite TypeScript del 2026-10-22: **435 test superati**, 384 precedenti e 51 nuovi, zero fallimenti o test saltati, circa 662 secondi. Incluse le prove DOM, senza build Quartz concorrente; suite JavaScript e React non rieseguite.

Limiti: una sola baseline, non ogni forma di merging, varianza, decorator o firma generica. Non sono eseguite integrazioni Express, dependency injection, reflect-metadata o Symbol.metadata, ne una matrice di browser/compilatori. I controesempi runtime sono intenzionali e intercettati dai test; non rappresentano errori della suite. La pulizia delle fixture verifica prima il percorso assoluto sotto la directory temporanea. Nessun servizio esterno, dato reale o browser personale viene usato.

## TypeScript: interoperabilita con JavaScript

La suite `typescript-interoperabilita.test.mjs` legge le sei note del capitolo, senza duplicare le implementazioni. Declaration Merging e gia coperta dalla suite precedente. **33 test**, tutti superati al primo giro in circa 94 secondi: baseline, sei controlli editoriali e 26 gruppi statici/runtime. Verificati i 17 blocchi JS/TS, 11 configurazioni JSON e lo schema OpenAPI del percorso dimostrativo.

Richiede TypeScript **5.9.3** nel progetto site, Node **24.14.0** e strumenti esterni fissati: **openapi-typescript 7.13.0**, **Lodash 4.18.1**, **@types/lodash 4.17.27**. La suite non installa dipendenze. Preparazione una tantum in una directory temporanea separata dal vault:

```powershell
$env:TYPESCRIPT_INTEROP_TOOLS_DIR = Join-Path $env:TEMP ("appunti-typescript-interop-tools-" + [guid]::NewGuid().ToString("N"))
```

```powershell
npm install --prefix "$env:TYPESCRIPT_INTEROP_TOOLS_DIR" --ignore-scripts --no-audit --no-fund --save-exact typescript@5.9.3 openapi-typescript@7.13.0 lodash@4.18.1 @types/lodash@4.17.27
```

In una sessione successiva, impostare la variabile al percorso gia preparato. Non usare come destinazione la root del vault o site; nessun package.json o lockfile del sito viene modificato.

```powershell
node --test _Meta/tests/typescript-interoperabilita.test.mjs
```

Copertura:

- Migrazione: progetto ESM prima/dopo la conversione, stesso output, allowJs/checkJs/ts-check/ts-nocheck, parametro any legacy e noEmitOnError con artefatti vecchi.
- Typing: modulo CommonJS locale con d.cts, unknown, errore di argomento, contratto deliberatamente falso e implementazione assente; risultati undefined ed eccezioni di JSON.
- JSDoc: tutti i file JS eseguiti, generic con undefined e readonly, satisfies rispetto a type, import di soli tipi senza file runtime e generazione delle dichiarazioni.
- Dichiarazioni: confronto tramite AST del contratto emesso, consumer per percorso e nome pubblico, exports types, emitDeclarationOnly, corpo vietato nel d.ts e Window non creato in Node.
- DefinitelyTyped: pacchetti reali, debounce/flush/cancel, parametri errati, dichiarazioni senza runtime e viceversa, globali automatici rispetto agli import con types vuoto.
- OpenAPI: CLI reale su schema locale, required/nullable, controllo di output mancante/obsoleto, riferimento invalido e consumer incompatibile dopo rigenerazione. Parser eseguito con dati corretti e sbagliati; Fetch simulato per URL codificata, HTTP 404, 204, JSON malformato, forma inattesa ed errore di rete.

La regressione mirata comprende questa suite e quelle su Moduli e Configurazione e Type System. Richiede anche Playwright/Chrome tramite PLAYWRIGHT_MODULE_PATH, come documentato nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/typescript-moduli-configurazione.test.mjs _Meta/tests/typescript-type-system.test.mjs _Meta/tests/typescript-interoperabilita.test.mjs
```

Risultato della regressione mirata del 2026-10-22: **115 test superati**, 33 nuovi, 31 di Moduli e Configurazione e 51 di Type System; zero fallimenti o test saltati, circa 219 secondi. Inclusa la prova DOM precedente. Le altre sei suite TypeScript e quelle JavaScript/React non sono state rieseguite: il risultato completo precedente da 435 test resta una verifica storica distinta. Supporto condiviso invariato.

Anche il comando complessivo `typescript-*.test.mjs` ora richiede TYPESCRIPT_INTEROP_TOOLS_DIR. Non avviare la build Quartz contemporaneamente alle prove tecniche.

Limiti: una baseline e Windows, non ogni versione o toolchain. La coppia Lodash/tipi e verificata per debounce, non per tutte le API. Non sono eseguiti servizi remoti, pubblicazione npm, generatori GraphQL/Prisma/RPC o validazione completa del contratto OpenAPI. Il parser proietta i campi minimi e non valida email, autorizzazioni o nickname. Le fixture usano copie locali dei pacchetti e rimuovono soltanto directory temporanee di cui controllano il percorso assoluto; l'installazione esterna resta disponibile per rieseguire la suite. Controlli del vault e QA Quartz sono separati.

## TypeScript: validazione e confine runtime

La suite `typescript-validazione-runtime.test.mjs` legge le cinque note del capitolo. Contiene **47 test**: baseline, cinque controlli editoriali, nove unita di compilazione strict ricavate dai 13 blocchi TypeScript, 31 gruppi runtime/statici e un progetto CLI ESM reale. I frammenti che compongono lo stesso file vengono uniti nell'ordine della nota.

Richiede **TypeScript 5.9.3** gia presente in site, **Node 24.14.0** e **Zod 4.6.7** in una directory temporanea esterna. La suite non installa pacchetti:

```powershell
$env:TYPESCRIPT_VALIDATION_TOOLS_DIR = Join-Path $env:TEMP ("appunti-typescript-validation-tools-" + [guid]::NewGuid().ToString("N"))
```

```powershell
npm install --prefix "$env:TYPESCRIPT_VALIDATION_TOOLS_DIR" --ignore-scripts --no-audit --no-fund --save-exact zod@4.6.7
```

In una nuova sessione impostare la variabile al percorso gia preparato. Il package e il lockfile del sito restano invariati.

```powershell
node --test _Meta/tests/typescript-validazione-runtime.test.mjs
```

Copertura:

- Confine runtime: assertion senza conversione, unknown, proiezione e identita, campi propri/ereditati, null/array, getter che lanciano e limiti della sola validazione di forma.
- Zod: parsing, errori, trim/default, input/output, quantita e email, campi extra, optional/nullable/nullish, prefault/catch, coercion, callback che lanciano, metodi async e limiti di JSON Schema.
- Guardie: stringa vuota, forma del prodotto separata dalla sua vendibilita, NaN/Infinity, ereditarieta, identita e mutazioni, ramo falso e buchi degli array.
- Parsing: porta fra 1 e 65535, formato decimale canonico, newline e conversioni indesiderate, oggetti con effetti collaterali rifiutati senza coercion; JSON, limite del testo, campi extra e duplicati.
- Contratto: discriminante, status e payload insieme, risposte 200/404, 204 e altri status inattesi, chiavi extra proiettate e messaggi remoti non esposti.
- CLI: configurazioni JSON della nota, compilazione NodeNext e quattro entry point ESM con output verificato. Le dipendenze vengono copiate nella fixture e la pulizia verifica prima il percorso assoluto.

Il primo giro ha superato 40 test su 47. Sette fallimenti dipendevano dal runner locale: nomi importati/esportati nelle espressioni di verifica non trasformati dal compilatore e Promise della VM proveniente da un realm diverso da Zod. Corretto il runner, senza modificare il supporto condiviso o indebolire gli esempi; la prova async usa Zod e callback nello stesso realm Node del demo. Riesecuzione Zod mirata: 12 test superati, incluso il controllo editoriale.

Regressione mirata, con entrambe le directory degli strumenti preparate:

```powershell
node --test --test-concurrency=1 _Meta/tests/typescript-narrowing.test.mjs _Meta/tests/typescript-interoperabilita.test.mjs _Meta/tests/typescript-validazione-runtime.test.mjs
```

Regressione seriale mirata del 2026-10-22: **142 test superati**, 47 nuovi + 62 Narrowing + 33 Interoperabilita, nessun fallimento o test saltato, circa 227 secondi. Nessuna modifica al supporto condiviso. Le altre suite TypeScript e quelle JavaScript/React non sono rieseguite; il risultato completo precedente da 435 test resta storico.

Anche il comando complessivo `typescript-*.test.mjs` richiede ora TYPESCRIPT_VALIDATION_TOOLS_DIR, oltre ai prerequisiti delle altre suite. Non eseguire Quartz contemporaneamente ai test tecnici. Dettagli della regressione in `_Meta/Revisione contenuti.md`.

Limiti: una baseline su Windows, non tutte le versioni o contesti cross-realm. Non sono eseguiti backend, autenticazione, autorizzazioni, transazioni o verifiche reali di proprieta delle email. Il parser JSON limita una stringa gia disponibile, non i byte scaricati o la memoria dell'intera applicazione; non rileva chiavi JSON duplicate. I parser sono per dati ordinari, non sandbox per getter/Proxy ostili. I test del decoder non provano il provider HTTP. Build e QA del sito restano verifiche separate.

## TypeScript: framework e applicazioni

`typescript-framework.test.mjs` estrae le sei note del capitolo e ricostruisce progetti reali in directory temporanee. **29 gruppi di test**: baseline, sei controlli editoriali e 22 prove di compilazione, runtime, HTTP, browser e workspace. I 21 blocchi TS/TSX, 15 configurazioni JSON, un modulo JavaScript e un HTML sono letti dai Markdown, non copiati come implementazioni parallele.

Baseline: TypeScript **5.9.3**, Node **24.14.0**, npm **11.19.0**, React/React DOM **19.3.0**, tipi React **19.3.0**, Vite **8.3.4**, plugin React **6.1.2**, Next **16.4.1**, Express **5.3.0**, tipi Express **5.0.6**, Fastify **5.12.7**, Zod **4.6.7**, tipi Node **24.19.2**, server-only **0.0.1**. Chrome tramite Playwright, come nella sezione Browser.

Preparare la toolchain esterna una volta, senza modificare package/lockfile di site:

```powershell
$env:TYPESCRIPT_FRAMEWORK_TOOLS_DIR = Join-Path $env:TEMP ("appunti-typescript-framework-tools-" + [guid]::NewGuid().ToString("N"))
```

```powershell
npm install --prefix "$env:TYPESCRIPT_FRAMEWORK_TOOLS_DIR" --ignore-scripts --no-fund --save-exact typescript@5.9.3 react@19.3.0 react-dom@19.3.0 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24.19.2 vite@8.3.4 @vitejs/plugin-react@6.1.2 next@16.4.1 server-only@0.0.1 express@5.3.0 @types/express@5.0.6 fastify@5.12.7 zod@4.6.7
```

Il successivo audit della toolchain del 2026-10-22 non riporta advisory; non e una certificazione futura o del sito. Le versioni sono baseline provate, non una dichiarazione di ultimo rilascio.

```powershell
node --test _Meta/tests/typescript-framework.test.mjs
```

Serve `PLAYWRIGHT_MODULE_PATH` se Playwright non e risolvibile da site. `NPM_CLI_PATH` puo indicare npm-cli.js; su Windows il default e quello dell'installazione accanto a node.exe. La prova workspace usa install e ci offline nella sola fixture: richiede la cache popolata dall'installazione iniziale degli strumenti.

Copertura:

- React: checker, build Vite, callback incompatibile e interazioni in Chrome con filtro, selezione e focus tramite ref.
- Node: compilazione ESM, argomenti, exit code, file errati, parser e proiezione; type stripping che non controlla i tipi, enum non cancellabile e import .js assente nei sorgenti.
- Client: input/output, normalizzazione, UTF-16, copia della URL, opzioni Fetch, media type, HTTP, JSON, schema e rete; annullamento prima della richiesta e durante un body HTTP reale incompleto.
- Express/Fastify: endpoint reali su porte loopback assegnate dal sistema, client condiviso, JSON malformato, titolo e extra non validi, 413/415. Test separato della politica Ajv nativa, diversa da quella Zod scelta nel demo.
- Next: typegen senza artefatti, checker, controprove params/Link, build di produzione Webpack, HTTP 200/404, interazione client e assenza del campo interno nell'HTML e nei bundle client.
- Monorepo: installazione workspace reale, collegamento del package, build e avvio, export map, firma incompatibile, pulizia degli output e npm ci seguito dalla build della sola app con dipendenze.

Primo giro: 26/29 gruppi superati. Corretti tre problemi del runner: risoluzione della CLI privata Vite, NODE_ENV modificato da preview e cache Vite non scrivibile attraverso una junction Windows. Il caso filesystem e stato riprodotto separatamente; React usa ora una directory node_modules reale per la cache e link ai package. Nessun cambiamento agli esempi richiesto da questi errori. Riesecuzione React/workspace: sette gruppi superati.

Regressione mirata, con anche TYPESCRIPT_VALIDATION_TOOLS_DIR preparata:

```powershell
node --test --test-concurrency=1 _Meta/tests/typescript-framework.test.mjs _Meta/tests/typescript-moduli-configurazione.test.mjs _Meta/tests/typescript-validazione-runtime.test.mjs
```

Regressione seriale mirata del 2026-10-22: **107 test superati**, 29 Framework + 31 Moduli + 47 Validazione, nessun fallimento o test saltato, circa 183 secondi. Le altre suite TypeScript e quelle complete React/JavaScript non sono rieseguite.

Il comando globale `typescript-*.test.mjs` richiede ora anche la toolchain framework. Helper condivisi invariati; non avviare Quartz contemporaneamente alle prove tecniche. Dettagli finali in `_Meta/Revisione contenuti.md`.

Limiti: una baseline Windows/Chrome, non ogni versione, plugin o piattaforma. Il demo React e client-side; quello Next e dinamico, non export Pages. I test server usano le factory su porte libere: gli entry point con porte fisse sono compilati, non lanciati. Nessun database, autenticazione, integrazione remota, provider GraphQL/RPC, benchmark o deploy. Il client non limita i byte di risposta e i file Node sono piccoli input locali. La prova non certifica uno shutdown di produzione o l'assenza generale di fughe di dati. Browser/server sono chiusi; i collegamenti vengono verificati e scollegati prima di eliminare le sole fixture temporanee. La toolchain rimane disponibile per successive esecuzioni.

## TypeScript: Qualita del Codice

`typescript-qualita.test.mjs` estrae le sei note del capitolo: **39 gruppi di test**, con 16 blocchi TS, otto configurazioni JSON e una flat config JavaScript. Il demo Vitest contiene inoltre 13 casi runtime; la controprova su expectTypeOf ne aggiunge temporaneamente uno. Questi casi interni non vengono sommati ai 39 gruppi Node.

Baseline: **TypeScript 5.9.3**, **Node 24.14.0**, **Vitest 4.1.12**, **Vite 8.3.4**, **ESLint 10.13.0**, **@eslint/js 10.0.1**, **typescript-eslint 8.72.0**, **Prettier 3.9.10**, **ts-reset 0.6.1**, tipi Node **24.19.2**. Nessuna dipendenza di site viene aggiornata.

Toolchain esterna:

```powershell
$env:TYPESCRIPT_QUALITY_TOOLS_DIR = Join-Path $env:TEMP ("appunti-typescript-quality-tools-" + [guid]::NewGuid().ToString("N"))
```

```powershell
npm install --prefix "$env:TYPESCRIPT_QUALITY_TOOLS_DIR" --ignore-scripts --no-fund --save-exact typescript@5.9.3 @types/node@24.19.2 vitest@4.1.12 vite@8.3.4 eslint@10.13.0 @eslint/js@10.0.1 typescript-eslint@8.72.0 prettier@3.9.10 @total-typescript/ts-reset@0.6.1
```

```powershell
node --test --test-concurrency=1 _Meta/tests/typescript-qualita.test.mjs
```

Copertura:

- Checker e Vitest reali: 13 casi, errori statici non visti dal runner, assertion expectTypeOf che richiedono il checker e mutazioni della logica che devono far fallire i test runtime.
- ESLint type-aware: Promise ignorata anche con void, any da JSON, file non incluso nel progetto e configurazione effettiva. Prettier check non modifica; write corregge la sola fixture.
- Parser numerico: formati, limiti, precisione e tipi inattesi, inclusi oggetti con conversioni che lanciano. Result non restringibile senza discriminante e risultato deliberatamente ignorabile.
- Errori: JSON/forma/intervallo, assenza distinta da I/O, causa originale, Promise cross-realm, messaggi pubblici, catch unknown e controllo esaustivo dei codici.
- Type tests: inclusione reale dei file, readonly, nullabilita, direttiva obsoleta, regressione any e comportamento runtime della funzione first.
- ts-reset: regola selettiva/preset completo, setup escluso, build senza import runtime, falsy filtrati, includes senza narrowing, Promise.catch unknown e JSON malformato che continua a lanciare.

Primo giro: **36/37 gruppi superati**. La prova di mutazione readonly ha individuato un caso insufficiente nella nota: il literal as const passato direttamente riceveva contextual typing e non faceva fallire il parametro mutabile. La nota ora dichiara prima una tupla readonly. Aggiunte due controprove; riesecuzione mirata: **3/3 superati**, senza cambiare l'aspettativa sul contratto.

Regressione mirata, preparando anche TYPESCRIPT_VALIDATION_TOOLS_DIR come nella sezione Validazione:

```powershell
node --test --test-concurrency=1 _Meta/tests/typescript-qualita.test.mjs _Meta/tests/typescript-moduli-configurazione.test.mjs _Meta/tests/typescript-validazione-runtime.test.mjs
```

Regressione seriale del 2026-10-22: **117 test superati**, 39 Qualita + 31 Moduli + 47 Validazione, nessun fallimento o test saltato, circa 203 secondi. Le altre suite TypeScript e quelle complete React/JavaScript non sono rieseguite. Il comando globale `typescript-*.test.mjs` richiede ora anche questa toolchain. Non eseguire Quartz contemporaneamente alle prove tecniche.

Limiti: baseline singola su Windows, nessuna matrice di versioni, nessuna misura di coverage, test UI, database, servizio remoto o implementazione reale dell'adapter I/O. I file intenzionalmente errati vivono solo nelle fixture; gli esempi type-level non vengono eseguiti come script. Le CLI usano gli stessi file e argomenti degli script delle note, senza reinstallare le dipendenze a ogni prova. I link ai package vengono controllati e rimossi prima della pulizia delle directory temporanee; la toolchain esterna rimane riutilizzabile. Helper condivisi invariati.

## TypeScript: Pattern e Architettura

`typescript-architettura.test.mjs` estrae le cinque note del capitolo: **38 gruppi di test**, con 20 blocchi TS e due configurazioni JSON. Repository, DTO, dominio e DI vengono compilati con il checker reale; il progetto Clean architecture viene ricostruito in una directory temporanea e compilato/eseguito come ESM.

Baseline: **TypeScript 5.9.3**, **Node 24.14.0**, target ES2022 e strict. Usa il compilatore gia presente in site; nessuna nuova dipendenza, installazione o modifica al lockfile.

```powershell
node --test _Meta/tests/typescript-architettura.test.mjs
```

Copertura:

- Repository: due richieste concorrenti, conflitti di email/ID, copie in ingresso/uscita, input vuoto e propagazione dei guasti.
- DTO: parser di input, proprieta extra/ereditate, limiti UTF-16, campi effettivamente serializzati e controesempio Pick senza proiezione runtime.
- Dominio: quantita, brand, ID, transizioni consentite/vietate, intervallo temporale, immutabilita e controllo esaustivo dopo l'aggiunta di uno stato.
- DI: clock deterministico, test double, errori del provider, Date invalida, copie e cancellazione delle interfacce.
- Clean architecture: checker, emissione ESM, quattro risposte del demo, adapter memoria, input invalidi e guasti I/O. Il controllo degli import rileva anche un import type verso l'adapter che tsc accetta.

Primo giro del 2026-10-22: **38/38 superati**, circa 27 secondi. Gli esempi sono estratti dalle note, non mantenuti come implementazioni parallele. Regressione seriale successiva: **108 test superati**, 38 Architettura + 31 Moduli + 39 Qualita, nessun fallimento o test saltato, circa 149 secondi. Le altre suite TypeScript e quelle complete React/JavaScript non sono rieseguite.

Regressione mirata con la toolchain Qualita preparata come nella sezione precedente:

```powershell
node --test --test-concurrency=1 _Meta/tests/typescript-architettura.test.mjs _Meta/tests/typescript-moduli-configurazione.test.mjs _Meta/tests/typescript-qualita.test.mjs
```

Limiti: una baseline Windows, non una matrice di versioni. Nessun database, transazione distribuita, SMTP, pagamento, autenticazione o server HTTP reale in questa suite. La concorrenza del repository riguarda una sola istanza JavaScript. I parser assumono dati ordinari e non isolano getter/Proxy ostili; readonly e freeze non diventano garanzie generali. Il controllo architetturale analizza gli import/export statici usati dalla fixture, non e un linter generale. Le CLI invocano direttamente tsc e Node con la configurazione della nota, senza rieseguire npm install. Fixture rimosse solo dopo verifica dei percorsi; helper condivisi invariati. Build Quartz e QA del sito restano verifiche separate.

## Quartz: anteprima locale

```powershell
node --test _Meta/tests/quartz-preview.test.mjs
```

Richiede una build aggiornata in site/public, con le pagine Python Dataclasses, Ereditarieta e Proprieta. La suite avvia il vero script preview-site su una porta loopback libera, legge baseUrl dalla configurazione e chiude il processo di prova alla fine. Non modifica o avvia il server usato dall'utente e non scrive negli HTML.

**7 test HTTP**: pagina ASCII, URL Unicode dalla radice e dal sottopercorso Pages, header Content-Disposition, redirect con query preservata, HEAD, URL malformato, traversal codificato e 404. Verificati con Node 24.14.0 su Windows, senza browser o rete esterna.

Il 2026-10-23 quattro casi Unicode riproducevano HTTP 500 con ERR_INVALID_CHAR nell'header generato da serve-handler; dopo l'override locale a Content-Disposition inline senza filename, **7/7 superati**. L'override non cambia i nomi delle note, le URL pubbliche o il contenuto degli HTML. Le verifiche visive desktop/mobile sono documentate separatamente nel registro di revisione.

## Browser

Il runner risolve `playwright` dal progetto `site`. Se e disponibile in un runtime esterno, imposta `PLAYWRIGHT_MODULE_PATH` al percorso assoluto della sua cartella pacchetto prima di eseguire il comando. `BROWSER_CHANNEL` permette di cambiare il canale; il default verificato e `chrome`. Il server WebSocket di test usa `ws`, gia presente nelle dipendenze del progetto site.

```powershell
node --test _Meta/tests/javascript-browser.test.mjs
```

63 test con nuovi contesti temporanei e HTML degli esempi. Comprendono DOM, eventi, storage, form, template testuali, import su richiesta, date in contesti UTC/Europe-Rome, globali classici/moduli, window.name, rimozione dei callback, campi di classe rispetto ai setter, copie del carrello e stato privato su istanze congelate. Le prove sull'asincronia aggiungono timer/microtask reali, dispatchEvent sincrono, cleanup dei listener, assenza di unhandledrejection dopo errori multipli nel pool e moduli con top-level await. Sono verificati inoltre multipart FormData, Authorization esplicito con credentials omit, signal gia annullati, timeout nativo e composizione con any.

Le prove di Stile e Paradigmi eseguono la shell DOM dei nomi utenti, controllando sostituzione della lista, caso vuoto e inserimento come testo senza HTML. Import ESM reali da URL intercettate verificano la condivisione della configurazione e l'identita distinta quando cambia la query della URL.

Le nuove prove su copie e generatori eseguono transfer reale di ArrayBuffer, rifiuto dei nodi DOM nel clone, deepFreeze con ciclo/getter, helper nativi Iterator e cleanup su break. La paginazione usa Fetch del browser con richieste intercettate: verificate query preservata, fine su items vuoto, nessuna richiesta successiva a break e cancellazione della pagina pendente tramite signal.

Le prove AJAX coprono XHR nativo con HTTP riuscito/fallito, JSON malformato, 204, timeout e abort. La lista viene aggiornata come testo, conserva i dati su errore, impedisce richieste sovrapposte e ignora risultati dopo unmount. L'avanzamento upload usa ProgressEvent sintetici: verifica il componente e il cleanup, non misura un upload reale.

Le richieste verso URL fittizi sono intercettate da Playwright. Quattro test avviano server temporanei su `127.0.0.1` e porte assegnate dal sistema: uno invia header e parte del JSON senza completarlo per provare l'abort del corpo; tre usano WebSocket reali per messaggi, disconnessione/reconnect, budget e vincoli nativi di send/close. Alla fine chiudono contesti, connessioni e server. Nessun servizio esterno, credenziale reale, storage del sito pubblicato o browser personale viene usato.

## Esecuzione complessiva JavaScript

Con Playwright, WABT, DOMPurify, i tool ESLint/Prettier/Vite e la CLI npm 11.19.0 risolvibili come descritto sopra:

```powershell
$tests = (Get-ChildItem -LiteralPath '_Meta/tests' -Filter 'javascript-*.test.mjs').FullName
node --test --test-concurrency=1 $tests
```

Il limite di concorrenza esegue un file per volta e riduce la competizione fra istanze browser. Non avviare la build Quartz contemporaneamente: una precedente esecuzione parallela ha superato il timeout di navigazione della fixture Wasm; la riesecuzione seriale completa, dopo la build e senza cambiare quel test, e passata.

Risultato aggiornato al 2026-10-13: 1483 test superati, di cui 1209 Node.js `24.14.0` e 274 Chrome `155.0.8059.40` (63 della suite browser generale, 18 della suite worker, 20 della suite componenti/scheduling, 12 WebAssembly, 8 memoria, 15 leak/weak, 11 optimization/buffers, 14 proxy/cycles, 24 decorators, 21 security/CORS, 25 CSP/sanitizzazione, 4 Vite, 4 bundling/source map, 12 SPA/REST, 8 SSR e 15 promemoria). La suite completa richiede accesso ai server di fixture su loopback e alle directory temporanee: il sandbox puo bloccarli con ERR_NETWORK_ACCESS_DENIED o EPERM anche quando le prove intercettate funzionano.

## Limiti JavaScript

Le funzioni e i frammenti selezionati sono elencati nei quarantaquattro file di test. Schemi, parti dipendenti da servizi esterni e frammenti non selezionati non sono certificati da questo risultato. Le verifiche API su any, timeout e WebSocket provano anche i comportamenti descritti nel testo, senza essere copie delle funzioni applicative. Non sono provati tutti i bundler, gli ambienti e le versioni browser. Le verifiche sulle date non coprono tutti i cambi d'ora storici; quelle sulle regex non sono benchmark ReDoS e non eseguono input intenzionalmente bloccanti. Le prove sulle closure non misurano tempi di garbage collection o consumo di memoria; la rimozione dei listener verifica il comportamento osservabile, non l'immediato rilascio fisico della memoria. Le prove sull'incapsulamento non costituiscono un audit di autenticazione o riservatezza dei dati.

Le prove su funzioni pure e pattern verificano i contratti dichiarati, non la purezza di qualunque callback o oggetto con getter/Proxy. Non certificano ordinamenti linguistici identici tra runtime, precisione contabile, conformita completa degli indirizzi email o un sistema di messaggistica distribuito. Il Subject sincrono non gestisce callback async o una coda persistente.

Il deepFreeze e limitato a dati ordinari nello stesso realm, senza Proxy; non e un contenitore sicuro per codice ostile. Le prove di clonazione non coprono tutti i tipi host o tutte le politiche di isolamento cross-origin; SharedArrayBuffer e verificato in Node, non certificato per ogni sito. La paginazione non collauda un backend reale, snapshot consistenti, retry, carico o consumo massimo di memoria. Queste prove riguardano copie e generatori; i test dei worker sono separati.

Le prove sull'Event Loop verificano ordine e separazione dei task, non latenza, frequenza dei frame, paint o throttling in background. Il controesempio di busy wait non viene eseguito. I timeout non sono deadline garantite: i test non misurano durate esatte, rate limit o carico. L'abort e provato prima della risposta e durante il corpo, ma non certifica l'annullamento di effetti sul server. Rete simulata, server locale di test e schema dimostrativo non sono un collaudo del backend. Non vengono provate tutte le politiche CORS, SameSite, cookie di terze parti, cache, redirect e retry. Per WebSocket non sono verificati TLS, autenticazione, heartbeat, replay, ACK applicativi, reti ostili o backpressure sotto carico: restano requisiti di un sistema reale, non funzionalita implicite del client dimostrativo.

I test dei Web Workers non sono benchmark di parallelismo, latenza, CPU, memoria o prestazioni del rendering. Messageerror e generato sinteticamente per provare il cleanup, non provocato tramite una deserializzazione nativa fallita. Non sono collaudati SharedWorker, pool, OffscreenCanvas, SharedArrayBuffer tra thread, CSP/Trusted Types o matrice di browser. Le strategie runtime sono verificate con Cache Storage/Fetch simulati; precache, controllo dei client, offline e update conservativo sono verificati anche nel browser reale.

Push e skipWaiting/claim opzionali sono provati con mock delle API; non costituiscono una verifica di permessi, consegna push o aggiornamento forzato nativo. Background Sync resta uno schema architetturale. Del manifest viene verificata la sintassi JSON, non l'installazione su un dispositivo, le icone reali o la promozione del browser. Quota, eviction e sicurezza dei dati richiedono prove aggiuntive nell'app di destinazione. I test non installano worker nel sito Quartz o nel profilo personale.

I test dei componenti non sono un audit completo di accessibilita, compatibilita framework, form-associated elements, Declarative Shadow DOM, adozione fra documenti o scoped registries. Tastiera, focus, stato e semantica del pulsante dimostrativo non certificano tutti gli screen reader. Le prove di scheduling verificano contratti e risultati, non scadenze, priorita sotto carico, frame effettivamente dipinti o throttling delle schede nascoste. Il polling non contatta un backend reale.

I test Wasm non sono benchmark e non collaudano Rust/C/C++, binding generati, WASI, Wasm GC, memory64, buffer ridimensionabili, SIMD o thread condivisi. La compilazione WAT usa WABT; il comando del server Python e riportato come prerequisito del demo, non e il server usato dalle fixture. Le prove CORS/rete non sono una matrice completa di distribuzione. L'abort dopo compilazione e simulato per verificare lo scarto del risultato, non per misurare o interrompere la compilazione nativa.

I test sulla memoria verificano effetti osservabili del cleanup e contratti delle API, non il rilascio fisico di oggetti, buffer o pagine del processo. Non forzano il GC, non attendono callback di finalizzazione e non sono un profiler o un benchmark di leak. Il ramo WeakRef senza target e una simulazione dichiarata; non prova che il collector abbia eliminato uno specifico oggetto. Il ticker richiede una callback sincrona, il widget un pulsante dello stesso realm e un record ordinario con id stringa.

I test leak/weak non dimostrano assenza universale di leak ne rilascio degli ephemeron. La LRU limita il numero di voci, non i byte, e non implementa TTL o cleanup dei valori. Il grafo ha record ordinari finiti e stabili, senza getter o Proxy ostili; la visita deduplica identita, non rileva distintamente i cicli. Il fallback di inserimento riguarda soltanto la factory sincrona del demo e non e un polyfill generale. Le richieste restano locali/intercettate: nessun backend reale, benchmark o matrice di browser.

I test optimization/buffers non sono benchmark, profili JIT o misure di GC. Il debounce e sincrono, senza maxWait/leading/flush; il throttle scarta il trailing. Il parser didattico accetta byte dello stesso realm su memoria ordinaria fissa, non un flusso da ricomporre o un formato standard. Non collauda limiti di download, autenticazione, cifratura, file di terzi, Float16 su ogni runtime o sincronizzazione tra thread. La verifica SharedArrayBuffer nel browser riguarda soltanto una fixture isolata controllata, non la configurazione del sito pubblicato.

I test proxy/cycles non sono un audit di sandboxing, un motore reattivo o un benchmark di trap. Il record age ha schema limitato, non valida oggetti arbitrari. Non coprono tutte le invarianti di ogni trap, tutti gli oggetti host o proxy cross-realm. I cicli sono provati nei loader nativi: non sono verificati bundler, HMR, lint, alias di progetto o interop ESM/CommonJS. La composizione dei permessi e un esempio architetturale, non un sistema di autorizzazione completo. L'osservazione browser di una Promise pendente e limitata nel tempo; il test Node verifica distintamente l'uscita 13 del caso senza altre risorse attive.

La verifica di contenuti, trasformazione e HTML resta separata:

```powershell
npm --prefix site run content:check -- --report
```

```powershell
npm --prefix site run content:test
```

```powershell
npm --prefix site run site:build
```
