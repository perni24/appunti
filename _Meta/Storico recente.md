# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-07-09 - Tooling qualita Clean Code

### Fatto

- Create 8 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Tooling e Qualita del Codice`.
- Compilati contenuti reali su formatter, linter, static analysis, type checking, coverage, mutation testing, code quality gates e pre-commit hooks.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note trattano gli strumenti come guardrail automatici per coerenza, testabilita e sicurezza del processo, non come sostituti della progettazione.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con le sezioni operative di `Conoscenza Operativa`.

## 2026-07-09 - Data automazione e LLM Clean Code

### Fatto

- Create 7 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Data, Automazione e LLM`.
- Compilati contenuti reali su pipeline dati, notebook mantenibili, script di automazione, parsing input esterni, prompt applicativi, output strutturati e validazione dati generati.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note trattano automazioni e LLM come parti del codice applicativo, quindi con contratti, validazione, test e tracciabilita.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con il blocco `Tooling e Qualita del Codice`.

## 2026-07-09 - Web API e database Clean Code

### Fatto

- Create 7 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Web, API e Database`.
- Compilati contenuti reali su controller sottili, service layer, repository pattern, DTO/modelli di dominio, validazione input API, query leggibili e migrazioni/schema evolution.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- La nota `DTO e modelli di dominio` e stata creata anche in Clean Code per trattare il concetto in modo trasversale, distinto dalla nota specifica TypeScript.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con il blocco `Data, Automazione e LLM`.

## 2026-07-09 - Performance e distribuzione Clean Code

### Fatto

- Create 6 pagine dell'area `Programmazione/Clean Code/Pagine` per completare il blocco `Performance e Distribuzione`.
- Compilati contenuti reali su performance/leggibilita, ottimizzazione prematura, profiling, hot path, allocazioni inutili e codice pronto al deploy.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md`; `Configurazione applicativa` resta collegata alla pagina condivisa gia creata.

### Decisioni

- Le note trattano la performance come disciplina guidata da misure e vincoli operativi, non come micro-ottimizzazione preventiva.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con il blocco `Web, API e Database`.

## 2026-07-09 - Concorrenza Clean Code

### Fatto

- Create 7 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Concorrenza e Parallelismo`.
- Compilati contenuti reali su stato condiviso, race condition, lock, idempotenza, operazioni atomiche, code/worker e codice asincrono leggibile.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note trattano concorrenza e asincronia come problemi di leggibilita, confini e gestione degli effetti, non solo come primitive tecniche.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con il blocco `Performance e Distribuzione`.

## 2026-07-09 - Internals e risorse Clean Code

### Fatto

- Create 9 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Internals e Gestione Risorse`.
- Compilati contenuti reali su stato, risorse, lifecycle, ownership concettuale, cache, cleanup, invarianti interne, refactoring sicuro e legacy code.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note distinguono responsabilita concettuali, lifecycle e gestione tecnica delle risorse per evitare duplicazioni con i blocchi precedenti.
- Le note create restano con `status: "non revisionato"`.

### Prossimi passi

- Continuare con il blocco `Concorrenza e Parallelismo`.

## 2026-07-09 - Standard library pratica Clean Code

### Fatto

- Create 7 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Standard Library Pratica`.
- Compilati contenuti reali su gestione errori, eccezioni, logging/tracing, configurazione, parsing/serializzazione, date/timezone e file system/I/O.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink le nuove voci e collegando la voce duplicata `Configurazione applicativa` alla stessa pagina.

### Decisioni

- Le note create usano `type: technical-note` perche descrivono pratiche tecniche e uso disciplinato di API/risorse comuni.
- `Configurazione applicativa` resta una pagina unica condivisa tra `Standard Library Pratica` e `Performance e Distribuzione`.

### Prossimi passi

- Continuare con il blocco `Internals e Gestione Risorse`.

## 2026-07-09 - Contratti tipi e qualita Clean Code

### Fatto

- Create 15 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Contratti, Tipi e Qualita`.
- Compilati contenuti reali su contratti, validazione ai confini, tipi significativi, modellazione del dominio, errori, complessita, test, logging e messaggi di errore.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- La sezione collega qualita del codice, contratti e testing come strumenti di design, non solo come controlli finali.

### Prossimi passi

- Continuare con il blocco `Standard Library Pratica`.

## 2026-07-09 - Concetti funzionali Clean Code

### Fatto

- Create 7 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Concetti Funzionali e Composizione`.
- Compilati contenuti reali su funzioni pure/impure, composizione, immutabilita, trasformazioni dichiarative, pipeline, guard clauses e side effects controllati.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- La sezione tratta i concetti funzionali come strumenti pragmatici per ridurre stato implicito e side effects, non come obbligo di programmazione funzionale pura.

### Prossimi passi

- Continuare con il blocco `Contratti, Tipi e Qualita`.

## 2026-07-09 - OOP e design Clean Code

### Fatto

- Create 9 pagine dell'area `Programmazione/Clean Code/Pagine` per il blocco `Programmazione ad Oggetti e Design`.
- Compilati contenuti reali su incapsulamento, coesione/accoppiamento, separazione responsabilita, SOLID, DIP, ISP, Tell Don't Ask, Law of Demeter e code smells.
- Aggiornato `Programmazione/Clean Code/Indice Clean Code.md` trasformando in wikilink solo le nuove voci ora esistenti.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- I principi OOP sono trattati come strumenti per controllare responsabilita e dipendenze, non come regole da applicare meccanicamente.

### Prossimi passi

- Continuare con il blocco `Concetti Funzionali e Composizione`.
