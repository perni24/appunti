# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-05-22 - Completamento Cargo e compatibilita Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Cargo, Editions e Compatibilita` dell'indice Rust.
- Sviluppati Cargo, manifest, lockfile, crates.io, semantic versioning, MSRV, editions, migrazione edition, feature, build script, profili e dipendenze workspace.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo chiarisce il ruolo di compatibilita, MSRV e edition come parte della manutenzione di crate e applicazioni Rust.

### Prossimi passi

- Proseguire con il percorso avanzato Rust partendo da `Concorrenza e Asincronia`.

## 2026-05-22 - Completamento standard library Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Standard Library` dell'indice Rust.
- Sviluppati Iterator API, conversioni `From`/`Into`/`TryFrom`/`TryInto`, `AsRef`/`AsMut`/`Borrow`, `Default`, `Display`/`Debug`, path, stringhe OS, file I/O, processi e tempo.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo `Standard Library` viene trattato come base operativa prima delle sezioni Cargo, tooling, async e applicazioni.

### Prossimi passi

- Completare il capitolo `Cargo, Editions e Compatibilita`.

## 2026-05-22 - Completamento smart pointer Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Smart Pointers e Interior Mutability` dell'indice Rust.
- Sviluppati `Box<T>`, `Deref`, `Drop`, `Rc<T>`, `Arc<T>`, `RefCell<T>`, `Cell<T>`, `Mutex<T>`, `RwLock<T>`, `OnceLock`, `LazyLock`, interior mutability e `Pin`/`Unpin`.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo collega ownership, borrowing e concorrenza, preparando le sezioni su standard library, async e unsafe.

### Prossimi passi

- Completare il capitolo `Standard Library` oppure approfondire concorrenza e async.

## 2026-05-22 - Completamento lifetimes Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Lifetimes` dell'indice Rust.
- Sviluppati lifetime annotations, lifetime elision, lifetimes nelle struct, lifetimes nei trait, lifetimes avanzati e HRTB.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo `Lifetimes` fa da ponte tra ownership/borrowing e le sezioni su GAT, trait object, smart pointer e unsafe.

### Prossimi passi

- Completare il capitolo `Smart Pointers e Interior Mutability`.

## 2026-05-21 - Completamento astrazione e generici Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Astrazione e Generici` dell'indice Rust.
- Sviluppati generics, traits, trait bounds, derive, associated types, GAT, trait object, dispatch, object safety e blanket implementations.
- Aggiornati frontmatter, esempi pratici, checklist e collegamenti interni.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo viene trattato come base del percorso intermedio Rust prima di lifetime avanzati e smart pointer.

### Prossimi passi

- Completare il capitolo `Lifetimes` o collegare meglio queste note alle future sezioni su smart pointer e standard library.

## 2026-05-20 - Correzione frontmatter Rust

### Fatto

- Verificato il frontmatter YAML delle pagine Rust.
- Quotate le wikilink nei campi `prerequisites` e `related` delle note completate.
- Normalizzato il frontmatter delle pagine Rust ancora seedling secondo `AGENTS.md`.

### Decisioni

- Le pagine Rust generate o modificate dal modello restano con `status: "non revisionato"`.
- Le pagine non ancora completate mantengono il contenuto placeholder, ma ora hanno intestazione YAML valida e coerente.

### Prossimi passi

- Continuare il completamento dei capitoli Rust senza dover correggere nuovamente il frontmatter di base.

## 2026-05-20 - Completamento errori e collezioni Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Errori e Collezioni` dell'indice Rust.
- Sviluppati `Option`, `Result`, operatore `?`, `panic!`, error handling idiomatico, `thiserror`, `anyhow`, `Vec`, mappe, set, iteratori e closure.
- Aggiunti esempi pratici, checklist, errori comuni e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo viene trattato come ponte tra i fondamenti Rust e il percorso intermedio su trait, generics e standard library.

### Prossimi passi

- Completare il percorso intermedio partendo dal capitolo `Astrazione e Generici`.

## 2026-05-20 - Completamento tipi personalizzati Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Tipi di Dato Personalizzati` dell'indice Rust.
- Sviluppati struct, tuple struct, enum, pattern matching, `if let`, `while let`, destructuring e pattern avanzati.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo collega i tipi personalizzati ai capitoli successivi su `Option`, `Result`, trait e API design.

### Prossimi passi

- Completare il capitolo Rust `Errori e Collezioni`, che dipende direttamente da enum, pattern matching e ownership.

## 2026-05-20 - Completamento ownership Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Ownership e Memory Safety` dell'indice Rust.
- Aggiunti esempi pratici su ownership, move semantics, borrowing, slice, stringhe, stack/heap, mutabilita e lifetime impliciti.
- Verificata la coerenza delle note con la struttura tecnica prevista da `AGENTS.md`.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo `Ownership e Memory Safety` diventa il riferimento base per i capitoli successivi su lifetime, smart pointer e unsafe.

### Prossimi passi

- Completare il capitolo Rust successivo sui tipi di dato personalizzati oppure approfondire i lifetime espliciti.

## 2026-05-20 - Completamento fondamenti Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Fondamenti del Linguaggio` dell'indice Rust.
- Normalizzate le note completate secondo il template tecnico previsto da `AGENTS.md`.
- Verificati frontmatter, sezioni obbligatorie e collegamenti interni delle note completate.

### Decisioni

- Le note Rust completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo `Fondamenti del Linguaggio` viene trattato come base operativa prima di completare gli altri capitoli Rust.

### Prossimi passi

- Completare progressivamente gli altri capitoli Rust partendo da ownership, borrowing e tipi composti.

## 2026-05-20 - Normalizzazione nuove note Programmazione

### Fatto

- Create e collegate le pagine mancanti per gli indici JavaScript, Postgres, Python e React.
- Normalizzato il frontmatter delle nuove note secondo `AGENTS.md`.
- Impostato `status: "non revisionato"` sulle note create dal modello.
- Aggiunte le sezioni richieste dai template `_Template/Nota teorica.md`, `_Template/Nota tecnica.md` e `_Template/Nota operativa.md` in base al tipo della nota.

### Decisioni

- Le nuove note generate dal modello restano non revisionate finche non vengono controllate dall'utente.
- I contenuti gia scritti sono stati preservati; le sezioni mancanti sono state aggiunte come tracce da completare.

### Prossimi passi

- Sviluppare progressivamente le sezioni marcate come `Da completare`.
- Applicare la stessa normalizzazione alle note Rust se si vuole renderle coerenti con `AGENTS.md`.

## 2026-05-13 - Struttura LLM del vault

### Fatto

- Creata la cartella `_Template/`.
- Creati i template `Nota teorica.md`, `Nota tecnica.md` e `Nota operativa.md`.
- Creato `AGENTS.md` come file principale di istruzioni per modelli e agenti.
- Ridotto `GEMINI.md` a rimando verso `AGENTS.md`.
- Creata la cartella `Raw/`.
- Creato `Raw/log.md` per tracciare i documenti analizzati.
- Aggiunta la regola dello storico recente in `_Meta/Storico recente.md`.
- Sistemata `Home.md` come indice generale pulito del vault.
- Rinominate le cartelle `pagine` in `Pagine`.
- Aggiornati i link interni che puntavano a `pagine/`.
- Sistemate le note della sezione `Basi` di JavaScript: `Variabili`, `Tipi di Dati`, `Operatori`, `Strutture Condizionali`, `Cicli`, `Funzioni`, `Manipolazione del DOM`, `Gestione Eventi`.
- Sistemate le note della sezione `JavaScript Moderno (ES6+)`: `Strict Mode`, `Arrow Functions`, `Template Literals`, `Destructuring`, `Spread & Rest Operators`, `Moduli`, `Dynamic Import`, `Circular Dependencies`, `Default Parameters`.
- Sistemate le note della sezione `Strutture Dati e Manipolazione` di JavaScript: `Array Methods`, `Oggetti Avanzati`, `Property Descriptors`, `Immutabilita e Copia degli Oggetti`, `Map e Set`, `JSON`, `Date & Time`, `Buffer e Typed Arrays`.
- Sistemate le note della sezione `Logica Interna` di JavaScript: `Scope`, `Hoisting`, `Closures`, `Context`, `Prototypes`.
- Sistemate le note della sezione `Asincronia e Networking` di JavaScript: `Event Loop`, `Callback`, `Promises`, `Promise avanzate`, `Async Await`, `Fetch API`, `AbortController`, `WebSockets`, `AJAX`, `Scheduling Browser`.
- Create e collegate le pagine mancanti della sezione `Node.js Runtime` di JavaScript: `Node.js Basics`, `File System fs`, `Path e Process`, `Events Node.js`, `Streams Node.js`, `Buffer Node.js`.
- Completata la ristrutturazione dei file vecchi JavaScript: sezioni `Gestione della Memoria e Performance`, `Programmazione ad Oggetti e Classi`, `Web APIs e Concetti Avanzati`, `Tooling e Qualita del Codice`.
- Aggiornate le pagine Postgres alla nuova struttura: frontmatter standard, sezione `Sintesi`, link indice assoluti e pulizia dei caratteri corrotti.
- Aggiornate le pagine Python alla nuova struttura: frontmatter standard, sezione `Sintesi`, link interni assoluti, pulizia encoding e creazione delle pagine native mancanti (`Dataclasses`, `Enum`, `Subprocess`, `argparse`, `sqlite3`, networking e configurazione).
- Aggiornate le pagine React alla nuova struttura: frontmatter standard, sezione `Sintesi`, link interni assoluti e pulizia encoding.

### Decisioni

- Le nuove note devono partire dai template in `_Template/`.
- `status` usa i valori `"non revisionato"` e `"revisionato (da me)"`.
- Una nota modificata da un modello torna a `status: "non revisionato"`.
- I file assimilati da `Raw/` vengono rinominati con prefisso `completato - `.
- Ogni macro argomento deve essere collegato in `Home.md`.
- Lo storico recente mantiene solo le ultime 10 voci operative.
- Le cartelle di contenuto devono usare la forma `Pagine/`.
- Le note riscritte da un modello restano con `status: "non revisionato"` fino a revisione utente.

### Prossimi passi

- Creare una guida generale del vault se serve.
- Uniformare gradualmente le cartelle `pagine` in `Pagine`.
- Aggiungere frontmatter alle note che ne sono prive.
- Pulire `Home.md` dai caratteri corrotti.
