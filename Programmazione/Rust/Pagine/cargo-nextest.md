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
  - cargo-nextest
  - nextest
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unit test|Unit test]]"
  - "[[Programmazione/Rust/Pagine/Integration test|Integration test]]"
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
related:
  - "[[Programmazione/Rust/Pagine/Benchmarking con Criterion|Benchmarking con Criterion]]"
  - "[[Programmazione/Rust/Pagine/Clippy|Clippy]]"
  - "[[Programmazione/Rust/Pagine/cargo deny|cargo deny]]"
title: cargo-nextest
---

# cargo-nextest

## Sintesi

`cargo-nextest` cambia **come vengono eseguiti i test**, non le asserzioni che devi scrivere. Chiede a Cargo di compilare i binari di test, ne interroga l'elenco dei casi e avvia ogni caso selezionato in un processo separato. È utile, per esempio, per eseguire in CI solo i test della CLI o per distinguere due test omonimi senza rinominarli.

**Un run verde di nextest non comprende i doc test.** Se gli esempi nella documentazione sono parte del contratto della libreria, serve anche `cargo test --doc`.

## Quando usarlo

Per una piccola crate, `cargo test` può bastare. Nextest diventa utile se più binari contengono molti test, se vuoi applicare filtri ripetibili o se la CI deve raccogliere un report con l'esito di ogni caso. Non dare per scontato un guadagno di velocità: dipende anche dal costo di avviare ogni processo.

| Comando | Che cosa fa | Che cosa non prova |
| --- | --- | --- |
| `cargo nextest list` | Compila quanto serve e interroga i binari per elencare i casi. | Non esegue il corpo dei test. |
| `cargo nextest run` | Esegue i test selezionati, ciascuno nel proprio processo. | Non esegue gli esempi di rustdoc. |
| `cargo test --doc` | Controlla gli esempi nella documentazione della libreria. | Non esegue i test unitari o di integrazione. |

Due processi non condividono la memoria, ma possono ancora usare la stessa porta, scrivere nello stesso file o modificare lo stesso database. Usa risorse temporanee distinte; se non è possibile, configura un *test group* che limiti la concorrenza per i soli casi interessati.

## Esempio pratico

### 1. Usare la suite del capitolo

Dalla radice di `percentage_notes` (la directory con `Cargo.toml`), usa questi tre blocchi già disponibili nel vault:

- [[Programmazione/Rust/Pagine/Unit test|Unit test]]: `src/lib.rs` contiene il parser e **5** test unitari.
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]: il binario `percent` e i target `tests/api.rs` (**2** casi) e `tests/cli.rs` (**3** casi). `tests/common/mod.rs` è un helper, non un quarto gruppo di casi.
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]: aggiungi a `parse_percentage` il blocco principale con **2** esempi. Per questi conteggi non aggiungere le varianti facoltative.

Nextest è un sottocomando esterno, non una dipendenza da aggiungere a `Cargo.toml`. Questa nota usa la versione **0.9.152**. Installa il [binario ufficiale per la tua piattaforma](https://nexte.st/docs/installation/pre-built-binaries/) oppure, con una toolchain Rust compatibile, compilalo da crates.io:

```sh
cargo install cargo-nextest --version 0.9.152 --locked
```

Controlla quale versione stai usando:

```sh
cargo nextest --version
```

### 2. Distinguere due test con lo stesso nome

Elenca i casi disponibili:

```sh
cargo nextest list
```

Nell'elenco cerca `tests::rejects_percent_suffix` della libreria e `rejects_percent_suffix` del binario di integrazione `api`. Entrambi controllano il rifiuto di `"42%"`, ma il secondo usa soltanto l'API pubblica. Il filtro posizionale cerca una **sottostringa**: questo comando esegue **due** test.

```sh
cargo nextest run rejects_percent_suffix
```

Per verificare la selezione prima di eseguire qualcosa, usa un *filterset*. Le virgolette tengono l'espressione insieme nella shell; `&` richiede entrambe le condizioni e `=` indica corrispondenza esatta:

```sh
cargo nextest list -E 'binary(=api) & test(=rejects_percent_suffix)'
```

Sostituisci `list` con `run` per eseguire **solo il caso di integrazione**:

```sh
cargo nextest run -E 'binary(=api) & test(=rejects_percent_suffix)'
```

### 3. Eseguire la suite senza perdere i doc test

Per i **10 test ordinari** (5 unitari, 2 dell'API, 3 della CLI):

```sh
cargo nextest run
```

Per i **2 esempi** nella documentazione:

```sh
cargo test --doc
```

**Controprova:** nel solo commento di documentazione cambia da `100` a `99` il valore atteso per `" 120 "`. Nextest resta verde perché non è cambiato nessuno dei dieci test ordinari. Il secondo comando fallisce perché l'esempio pubblicato non coincide più con il parser. Ripristina `100` prima di continuare.

## Configurazione CI

Crea `.config/nextest.toml` nella radice del workspace. Questo profilo esegue anche i casi restanti dopo un errore, non ritenta i fallimenti e produce un report JUnit:

```toml
[profile.ci]
fail-fast = false
retries = 0
slow-timeout = { period = "30s", terminate-after = 2 }

[profile.ci.junit]
path = "junit.xml"
```

Seleziona esplicitamente il profilo:

```sh
cargo nextest run --profile ci
```

Il report si trova in `target/nextest/ci/junit.xml` rispetto alla radice del workspace: nextest risolve `junit.path` sotto `store.dir/<profilo>/`. Cambiare solo `CARGO_TARGET_DIR` sposta i prodotti della compilazione, non il report. Il file contiene i casi eseguiti da nextest, non i doc test del comando Cargo separato. `--profile ci` seleziona le **regole del runner**: non attiva il profilo di compilazione release.

- **Soglia e interruzione:** dopo un periodo di 30 secondi il test è segnalato come lento; dopo due periodi nextest ne avvia la terminazione. Con il solo `slow-timeout = "30s"` ci sarebbe la segnalazione periodica, non la terminazione. Il tempo effettivo di arresto può dipendere dalla piattaforma.
- **Retry:** un tentativo aggiuntivo può aiutare a diagnosticare un test intermittente, ma può anche lasciare la pipeline verde con un caso passato solo al secondo tentativo. Limita la regola ai casi motivati e correggi la causa.
- **Livelli di controllo:** `cargo fmt --check` verifica la formattazione e `cargo clippy --all-targets --all-features` esegue i lint. Restano passi separati: nessuno dei due sostituisce l'esecuzione dei test.

## Errori comuni

- Confondere il numero di binari compilati con il numero di casi eseguiti. Leggi il riepilogo e controlla i casi esclusi quando usi un filtro.
- Usare un filtro breve in CI aspettandosi che selezioni un solo caso. Provalo prima con `list -E` e distingui nome del binario e nome completo del test.
- Usare il successo di un retry come prova che l'isolamento sia sufficiente, oppure affidarsi all'ordine di esecuzione dei test.
- Attivare JUnit nel profilo `ci` e cercarne il report dopo aver eseguito solo il profilo predefinito.

## Checklist

- L'elenco del filtro corrisponde ai casi che intendo eseguire?
- La CI esegue separatamente gli esempi pubblicati nella documentazione?
- Ho distinto soglia di lentezza, terminazione e numero di tentativi?
- Il report proviene dal profilo e dal run giusti?

## Fonti

- [Nextest: modello di esecuzione](https://nexte.st/docs/design/how-it-works/) e [limite sui doc test](https://nexte.st/docs/running/)
- [Filterset: predicati, operatori e nomi esatti](https://nexte.st/docs/filtersets/reference/)
- [Nextest: test lenti e timeout](https://nexte.st/docs/features/slow-tests/)
- [Nextest: report JUnit](https://nexte.st/docs/machine-readable/junit/)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]
- [[Programmazione/Rust/Pagine/Benchmarking con Criterion|Benchmarking con Criterion]]
- [[Programmazione/Rust/Pagine/Clippy|Clippy]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
