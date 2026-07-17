---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "cargo audit"
  - "RustSec audit"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
  - "[[Programmazione/Rust/Pagine/Packaging e release]]"
related:
  - "[[Programmazione/Rust/Pagine/cargo deny]]"
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
---

# cargo audit

## Sintesi

`cargo audit` e uno strumento che controlla `Cargo.lock` contro il database RustSec per individuare dipendenze con advisory di sicurezza note. Aiuta a scoprire vulnerabilita pubblicate nelle crate usate dal progetto.

Non fa analisi statica del tuo codice e non dimostra che il progetto sia sicuro: controlla soprattutto se le versioni bloccate nel lockfile compaiono in advisory conosciuti.

## Quando usarlo

Usa `cargo audit` quando:

- hai un'applicazione con `Cargo.lock`;
- distribuisci binari o servizi;
- vuoi controlli di sicurezza in CI;
- aggiorni dipendenze;
- prima di una release;
- periodicamente anche senza modifiche al codice.

Per librerie, il lockfile non sempre viene pubblicato o usato dagli utenti, ma audit resta utile per workspace, esempi, binari e CI interna.

## Come funziona

`cargo audit` legge `Cargo.lock`, risolve le versioni effettive delle dipendenze e le confronta con advisory RustSec. Se trova una vulnerabilita nota, segnala crate, versione, advisory e spesso indicazioni di aggiornamento.

Il risultato dipende da:

- presenza e aggiornamento di `Cargo.lock`;
- copertura del database advisory;
- versioni effettivamente risolte;
- eventuali ignore espliciti;
- aggiornamenti disponibili compatibili con SemVer.

## API / Sintassi

Installazione:

```powershell
cargo install cargo-audit
```

Uso:

```powershell
cargo audit
```

In CI:

```powershell
cargo audit --deny warnings
```

Ignorare un advisory deve essere una decisione documentata, non una soluzione silenziosa.

## Esempio pratico

Workflow di aggiornamento:

```powershell
cargo audit
cargo update -p vulnerable_crate
cargo test
cargo audit
```

Se l'aggiornamento richiede una major version, devi valutare breaking changes e testare il comportamento applicativo.

## Varianti

- **Audit locale**: controllo manuale durante sviluppo.
- **Audit in CI**: blocca release con vulnerabilita note.
- **Audit schedulato**: gira anche senza commit recenti.
- **Ignore temporaneo**: per advisory non applicabile, con scadenza e motivazione.
- **cargo deny advisories**: controllo piu ampio integrato con policy.
- **Tool esterni**: scanner container o supply-chain complementari.

## Errori comuni

- Pensare che `cargo audit` basti per la sicurezza.
- Non committare `Cargo.lock` per applicazioni.
- Ignorare advisory senza motivazione.
- Non eseguire audit periodico.
- Fermarsi all'update senza test.
- Non distinguere vulnerabilita diretta e transitiva.
- Usare dipendenze da git/path senza policy chiara.

## Checklist

- `Cargo.lock` e aggiornato?
- `cargo audit` gira in CI?
- Esiste un controllo schedulato?
- Gli ignore sono motivati e temporanei?
- Gli aggiornamenti passano test e lint?
- Le dipendenze transitive sono comprese?
- Per policy piu ampie serve `cargo deny`?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/cargo deny]]
- [[Programmazione/Rust/Pagine/Cargo.lock]]
- [[Programmazione/Rust/Pagine/Crates.io]]
- [[Programmazione/Rust/Pagine/Packaging e release]]
- [[Programmazione/Rust/Pagine/Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Cargo]]
