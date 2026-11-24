---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - cargo audit
  - RustSec audit
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/Crates.io|Crates.io]]"
  - "[[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]"
related:
  - "[[Programmazione/Rust/Pagine/cargo deny|cargo deny]]"
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]"
title: cargo audit
---

# cargo audit

## Sintesi

`cargo audit` risponde a una domanda circoscritta: **tra le versioni registrate nel mio `Cargo.lock`, ce ne sono di interessate da un avviso pubblicato su RustSec?** Cargo sceglie le versioni; l'audit confronta quelle già scelte con il database. Non legge il codice dell'applicazione per stabilire se una funzione venga chiamata e non aggiorna una dipendenza per il solo fatto di averla segnalata.

## Primo controllo

L'esempio usa **cargo-audit 0.23.0**, sottocomando esterno da installare una volta, non una dipendenza da aggiungere al manifest dell'app. Per installarlo da crates.io con le dipendenze fissate dal lockfile **dello strumento**:

```sh
cargo install cargo-audit --version 0.23.0 --locked
```

Verifica quale versione stai eseguendo:

```sh
cargo audit --version
```

Dalla directory che contiene il lockfile dell'applicazione o del workspace:

```sh
cargo audit --file Cargo.lock
```

La prima esecuzione normale richiede accesso al database RustSec; il controllo delle versioni ritirate (*yanked*) usa anche l'indice di crates.io. Se vuoi controllare il file della release, passa il percorso esplicito come sopra: se manca, ottieni un errore, **non un audit pulito**. In questa versione, il semplice `cargo audit`, eseguito accanto a un manifest senza lockfile, può chiedere a Cargo di generarne uno. Quella risoluzione nuova non dimostra cosa contenesse una release già distribuita.

## Leggere il risultato

| Esito | Significato | Passo successivo |
| --- | --- | --- |
| Vulnerabilità segnalata | Nome e versione risolta corrispondono a un advisory secondo i dati e la configurazione usati. | Leggi ID, versione installata, intervallo corretto ed eventuali condizioni. Individua chi introduce la crate. |
| Solo avviso, per esempio *unmaintained* | Una dipendenza non più mantenuta non equivale, da sola, a una vulnerabilità. Un avviso può non rendere rosso il comando. | Valuta manutenzione e alternative; decidi se la tua CI debba bloccarlo. |
| Nessuna segnalazione | Il confronto non ha trovato corrispondenze da riportare. | Verifica che lockfile, database e filtri siano quelli attesi; non è una certificazione del software. |
| Lockfile illeggibile o database indisponibile | Non c'è un risultato su cui basare il rilascio. | Correggi l'errore operativo e ripeti il controllo. |

Il lockfile di una libreria descrive **il suo ambiente di sviluppo**, non impone quelle versioni alle applicazioni che la importano. Inoltre può contenere dipendenze per target o feature diversi da quelli della build effettiva. Le sorgenti Git, i fork e le dipendenze locali richiedono attenzione: non dare per scontato che un confronto con gli advisory delle crate pubblicate copra anche il loro contenuto.

## Esempio: aggiornare una dipendenza transitiva

Scenario didattico, con **nomi e advisory fittizi**: `notes-app` usa `notes-reader`, che a sua volta richiede `notes-codec = "1.2"`. Il lockfile contiene `notes-codec 1.2.0`; l'avviso indica come corrette le versioni da `1.2.1`. I nomi nei comandi vanno sostituiti con quelli del proprio report: non occorre installare queste crate.

**1. Risali alla dipendenza diretta.** L'albero inverso risponde a «chi usa questa versione?». Leggilo da `notes-codec` verso `notes-reader` e infine `notes-app`. `--locked` impedisce a Cargo di cambiare la risoluzione durante l'ispezione.

```sh
cargo tree --locked -i notes-codec@1.2.0
```

**2. Aggiorna la versione registrata.** In questo esempio `1.2.1` soddisfa il requisito del genitore. Il comando seguente **modifica il lockfile**: controlla il diff. `--precise` rende esplicita la versione scelta per l'esempio; in un progetto reale scegli una versione supportata che risolva l'avviso.

```sh
cargo update -p notes-codec@1.2.0 --precise 1.2.1
```

Se il genitore richiede esattamente `=1.2.0`, il comando non può ignorarne il vincolo. Aggiorna o sostituisci la dipendenza che lo impone, invece di editare a mano `Cargo.lock`. Se non c'è una versione corretta, registra esplicitamente la decisione e valuta un'alternativa.

**3. Verifica due cose diverse.** Esegui i test sul lockfile aggiornato:

```sh
cargo test --locked
```

Poi ripeti `cargo audit --file Cargo.lock`. I test possono essere verdi **anche prima** dell'aggiornamento; dopo, vuoi sia il comportamento atteso sia la scomparsa dell'avviso specifico. Cambiare solo `Cargo.toml` o vedere «test passati» non fornisce entrambe le risposte.

## Uso in CI

Per produrre dati strutturati senza cambiare il significato dell'esito:

```sh
cargo audit --file Cargo.lock --json
```

Nel JSON guarda `vulnerabilities.list` per pacchetto, versione e advisory, e `warnings` per gli avvisi. Preserva anche il **codice di uscita**: se il comando fallisce prima di generare il report, l'assenza di JSON non significa «zero problemi». Per bloccare anche sugli avvisi del report:

```sh
cargo audit --file Cargo.lock --deny warnings
```

Esegui l'audit sulle modifiche e periodicamente anche senza commit: **lo stesso lockfile può cambiare esito quando cambia il database**. Conserva il report con il commit, la data e la versione dello strumento. Un controllo su una copia offline del database risponde solo per quella copia. Un'eccezione in `.cargo/audit.toml` deve indicare advisory, ragione, responsabile e data di riesame: ignorare un avviso non corregge il pacchetto.

## Checklist

- Ho controllato il lockfile della versione effettivamente distribuita?
- So se la dipendenza è diretta o transitiva e quale requisito ammette la correzione?
- Ho verificato sia il nuovo report sia i test, senza confondere un errore dello strumento con un esito pulito?
- Se servono anche regole su licenze o sorgenti, ho considerato [[Programmazione/Rust/Pagine/cargo deny|cargo deny]]?

## Fonti

- [RustSec: cosa controlla cargo-audit](https://rustsec.org/) e [release 0.23.0](https://github.com/RustSec/rustsec/releases/tag/cargo-audit%2Fv0.23.0)
- [RustSec: scelta del lockfile nella versione 0.23.0](https://github.com/RustSec/rustsec/blob/cargo-audit/v0.23.0/cargo-audit/src/lockfile.rs)
- [Cargo Book: aggiornamento mirato del lockfile](https://doc.rust-lang.org/cargo/commands/cargo-update.html) e [albero inverso delle dipendenze](https://doc.rust-lang.org/cargo/commands/cargo-tree.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/cargo deny|cargo deny]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
