# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

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
