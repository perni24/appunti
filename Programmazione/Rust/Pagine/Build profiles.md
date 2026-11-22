---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - Cargo profiles
  - Profili Cargo
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
related:
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Build scripts]]"
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
title: Build profiles
---

# Build profiles

## Sintesi

Un **profilo Cargo** sceglie come compilare: ottimizzazione, informazioni di debug, controlli e strategia di panic. Non seleziona le dipendenze come una feature e non rappresenta un ambiente applicativo: chiamare un profilo `production` non configura database, segreti o logging.

Conviene partire dai profili incorporati e introdurre varianti con un obiettivo misurabile. Questa nota usa un laboratorio senza dipendenze, con Rust **1.85 o successivo** per l'edition 2024.

## Quando usarlo

- Conservare informazioni utili al debugger in un programma ottimizzato.
- Riprodurre errori che compaiono soltanto fuori dalla compilazione di sviluppo.
- Confrontare tempi di compilazione, tempi di esecuzione e dimensioni.
- Personalizzare una dipendenza costosa senza rallentare tutto il progetto.
- Preparare un artefatto distribuibile con una politica di panic esplicita.

## Come funziona

### Selezione del profilo

I quattro profili incorporati di riferimento sono:

| Profilo | Selezione abituale | Impostazioni di partenza |
| --- | --- | --- |
| `dev` | `cargo build`, `cargo run`, `cargo check` | Ottimizzazione 0; debug info e controlli attivi |
| `release` | `--release` | Ottimizzazione 3; debug info e debug assertions disattivati |
| `test` | `cargo test` | Eredita da `dev` |
| `bench` | `cargo bench` | Eredita da `release` |

Sono valori di partenza, non proprieta immutabili. `--profile nome` seleziona anche un profilo personalizzato; `--release` equivale a `--profile release`. Non usare entrambe le opzioni nello stesso comando. [Cargo build](https://doc.rust-lang.org/cargo/commands/cargo-build.html#compilation-options).

Il profilo cambia la compilazione, non lo scopo del comando: `cargo build --profile test` non esegue i test, mentre `cargo test --release` li esegue con impostazioni ottimizzate. Il test harness rimane un elemento distinto. [Cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html).

### Dove dichiararlo e dove trovare gli artefatti

Le sezioni `[profile.*]` vanno nel `Cargo.toml` **radice del workspace**. Quelle dei membri o delle dipendenze non impongono impostazioni al progetto utilizzatore. In un package autonomo la radice e il suo manifest. Non serve un inesistente `profile.workspace = true`. [Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html).

Senza cambiare directory di output e senza `--target`:

- `dev` e `test` usano `target/debug/`;
- `release` e `bench` usano `target/release/`;
- un profilo `profiling` usa `target/profiling/`.

`debug` nel percorso non e il valore dell'opzione `debug`. Con un target esplicito si aggiunge normalmente il livello `target/<triple>/`; `CARGO_TARGET_DIR` puo cambiare la radice. Non ricavare il percorso di un eseguibile di test dal nome del package: Cargo lo comunica nei suoi messaggi. [Build cache](https://doc.rust-lang.org/cargo/reference/build-cache.html).

## API / Sintassi

### Opzioni da distinguere

| Opzione | Effetto e criterio di scelta |
| --- | --- |
| `opt-level` | `0..3` per ottimizzazione; `"s"` e `"z"` mirano alle dimensioni. Il valore maggiore non garantisce il risultato migliore |
| `debug` | `0`, `1`, `2` per quantita crescente di debug info; `false` equivale a 0 e `true` a 2 |
| `debug-assertions` | Controlla `cfg(debug_assertions)` e l'esecuzione di `debug_assert!` |
| `overflow-checks` | Abilita controlli di overflow nelle operazioni intere ordinarie a runtime |
| `panic` | `"unwind"` oppure `"abort"`, nei limiti del target e del tipo di artefatto |
| `lto` | `"thin"`, `"fat"` o `true` per LTO; `"off"` la disattiva |
| `codegen-units` | Numero positivo di unita di generazione del codice; meno unita puo ridurre il parallelismo di compilazione |
| `strip` | `"none"`, `"debuginfo"` o `"symbols"` per rimuovere informazioni dall'artefatto |
| `incremental` | Riutilizzo di lavoro del compilatore fra build; distinto dal normale controllo Cargo degli artefatti aggiornati |

I flag del compilatore sottostanti sono descritti nelle [Codegen options](https://doc.rust-lang.org/rustc/codegen-options/index.html). `lto = false` **non equivale sempre a** `"off"`: puo restare ThinLTO locale fra unita della stessa crate, quando applicabile. `lto = true` richiede invece la modalita fat. [Cargo profiles](https://doc.rust-lang.org/cargo/reference/profiles.html#lto).

### Debug info non significa controlli di debug

Un eseguibile puo essere ottimizzato e avere `debug = 2`, ma `debug-assertions = false`. Il debugger dispone di informazioni aggiuntive; l'ottimizzazione puo comunque rendere alcune variabili non osservabili o alterare il percorso passo-passo.

Non mettere effetti necessari dentro `debug_assert!`: l'espressione non viene eseguita quando le debug assertions sono disabilitate. La macro non sostituisce la validazione dell'input e viene comunque controllata dal sistema di tipi. [debug_assert!](https://doc.rust-lang.org/std/macro.debug_assert.html).

Per i calcoli di dominio scegli una semantica esplicita: `checked_add` restituisce `None` se il risultato non entra nel tipo; `wrapping_add` effettua wrapping; `saturating_add` limita il risultato. Non affidare la correttezza del programma al profilo. [Metodi degli interi](https://doc.rust-lang.org/std/primitive.u8.html#method.checked_add).

### Panic e test

Con `panic = "abort"` un panic termina il processo senza unwinding: non usare `catch_unwind` come rete di recupero e non fare affidamento sui distruttori locali per il cleanup dopo quel panic. `Result` continua invece a funzionare normalmente. [catch_unwind](https://doc.rust-lang.org/std/panic/fn.catch_unwind.html).

Il test harness standard sulle toolchain stable qui considerate richiede unwinding e ignora la scelta `abort`. Anche build script e proc macro non assumono la strategia del binario finale. Quindi test verdi con `cargo test --profile small` **non certificano** il comportamento del programma distribuito durante un panic. [Limiti di panic nei profili](https://doc.rust-lang.org/cargo/reference/profiles.html#panic).

## Esempio pratico

Crea un package dimostrativo `profile-demo` con i tre file seguenti. Usa una directory di prova indipendente dal vault e una toolchain con libreria standard e linker funzionanti. Tutti i comandi successivi si eseguono dalla sua radice.

Il laboratorio osserva configurazione e correttezza, **non misura prestazioni**.

### Cargo.toml

```toml
[package]
name = "profile-demo"
version = "0.1.0"
edition = "2024"
rust-version = "1.85"
publish = false

[profile.release]
overflow-checks = true

[profile.profiling]
inherits = "release"
debug = 2
strip = "none"

[profile.checked-release]
inherits = "release"
debug-assertions = true
overflow-checks = true

[profile.small]
inherits = "release"
opt-level = "z"
lto = "thin"
codegen-units = 1
panic = "abort"
strip = "symbols"
```

Qui `release` mantiene deliberatamente i controlli di overflow, diversamente dal suo default. Anche i tre profili derivati ereditano questa scelta. `profiling` aggiunge debug info, ma **non** riattiva le debug assertions.

`small` e una variante da confrontare, non una ricetta universale: accetta la terminazione del processo in caso di panic e rimuove simboli utili alla diagnosi. La precedente alternativa `lto = true` resta valida, ma richiede fat LTO e va misurata separatamente.

### src/lib.rs

```rust
/// Somma senza dipendere dai controlli di overflow del profilo.
///
/// ```
/// assert_eq!(profile_demo::add_checked(250, 10), None);
/// ```
pub fn add_checked(left: u8, right: u8) -> Option<u8> {
    left.checked_add(right)
}

#[cfg(test)]
mod tests {
    use super::add_checked;

    #[test]
    fn representable_sum() {
        assert_eq!(add_checked(20, 22), Some(42));
    }

    #[test]
    fn overflow_is_reported() {
        assert_eq!(add_checked(255, 1), None);
    }

    #[test]
    #[should_panic(expected = "harness probe")]
    fn harness_handles_a_panic() {
        panic!("harness probe");
    }
}
```

L'ultimo test verifica intenzionalmente il test harness, non l'API di somma: passa anche selezionando `small`, mentre un panic nel normale eseguibile `small` avrebbe conseguenze diverse.

### src/main.rs

```rust
use profile_demo::add_checked;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args().skip(1);
    let left: u8 = args.next().ok_or("missing left operand")?.parse()?;
    let right: u8 = args.next().ok_or("missing right operand")?.parse()?;

    if args.next().is_some() {
        return Err("expected exactly two operands".into());
    }

    println!("debug_assertions={}", cfg!(debug_assertions));
    println!("panic_abort={}", cfg!(panic = "abort"));
    println!("checked={:?}", add_checked(left, right));
    println!("wrapping={}", left.wrapping_add(right));
    Ok(())
}
```

Input mancante, non numerico o fuori da `u8` produce un errore e un exit status non zero. Non viene usato un panic per la validazione.

### Confronto dei profili

Compilazione ed esecuzione ordinaria:

```bash
cargo run --quiet -- 250 10
```

Variante release:

```bash
cargo run --quiet --release -- 250 10
```

Release con debug info:

```bash
cargo run --quiet --profile profiling -- 250 10
```

Release con debug assertions attive:

```bash
cargo run --quiet --profile checked-release -- 250 10
```

Variante orientata alle dimensioni:

```bash
cargo run --quiet --profile small -- 250 10
```

In tutti i casi il risultato e `checked=None` e `wrapping=4`. `debug_assertions` e `true` per `dev` e `checked-release`, `false` negli altri tre casi. Su un target che supporta unwinding, `panic_abort` e `true` solo per `small`. Non stiamo provocando un abort per fare questo confronto.

### Verifiche

Test ordinari, inclusi i doctest:

```bash
cargo test
```

Test in release:

```bash
cargo test --release
```

Test col profilo della variante piccola, mantenendo il limite del test harness spiegato sopra:

```bash
cargo test --profile small
```

Diagnostica di compilazione:

```bash
cargo build --profile profiling -vv
```

Se gli artefatti sono gia aggiornati, Cargo puo stampare `Fresh` senza richiamare il compilatore. Per osservare una build distinta senza cancellare la cache esistente:

```bash
cargo build --profile profiling --target-dir target/profile-inspection -vv --timings
```

Il comando scrive altri artefatti in `target/profile-inspection`. Il report di timings descrive **la build**, non la velocita del programma. Riusare poi la stessa directory non rende automaticamente la misura una nuova build da zero. [Cargo build](https://doc.rust-lang.org/cargo/commands/cargo-build.html#compilation-options).

Formattazione, senza modificare i sorgenti:

```bash
cargo fmt --all -- --check
```

Lint, con rustfmt e Clippy installati nella toolchain per i rispettivi comandi:

```bash
cargo clippy --all-targets -- -D warnings
```

## Varianti

### Override per package e per strumenti di build

Questo frammento opzionale si aggiunge al manifest del laboratorio e cambia soltanto l'ottimizzazione del package indicato, quando il profilo attivo e `dev`:

```toml
[profile.dev.package.profile-demo]
opt-level = 1
```

La chiave e il nome del **package**, non necessariamente il nome usato in un `use`. Con `package."*"` si selezionano le dipendenze esterne al workspace, non tutti i suoi membri.

Per strumenti eseguiti durante la build, un frammento distinto:

```toml
[profile.dev.build-override]
debug = true
```

Serve, per esempio, a migliorare la diagnosi di un build script; il laboratorio non ne contiene uno. Un override nominativo prevale su `"*"`, poi viene `build-override`, infine il profilo generale. Gli override non accettano `panic`, `lto` e `rpath`. Le funzioni generiche possono essere monomorfizzate nella crate chiamante: ottimizzare una dipendenza non garantisce di ottimizzare tutto il codice che ne deriva. [Override](https://doc.rust-lang.org/cargo/reference/profiles.html#overrides).

### Configurazione esterna e diagnosi

`.cargo/config.toml` e le variabili `CARGO_PROFILE_<NOME>_<OPZIONE>` possono sovrascrivere il manifest: per esempio `CARGO_PROFILE_RELEASE_DEBUG`. `CARGO_INCREMENTAL` e un ulteriore controllo globale. Prima di confrontare locale e CI, controlla anche `RUSTFLAGS` e le configurazioni ereditate dalle directory superiori. [Configurazione Cargo](https://doc.rust-lang.org/cargo/reference/config.html).

Non registrare nel repository le preferenze personali di profiling senza decidere che siano parte del progetto. Conserva toolchain, target, feature e input nel resoconto delle misure.

### Dimensioni, profiling e portabilita

`debug = true` e `strip = "symbols"` non sono una combinazione sensata per conservare le informazioni che stai cercando di osservare. `split-debuginfo` e la posizione dei simboli dipendono dalla piattaforma: un singolo file eseguibile non rappresenta sempre tutto l'artefatto di debug.

I nomi testuali dei livelli di debug, come `"line-tables-only"`, richiedono Cargo 1.71; il laboratorio usa `debug = 2`. Il target, il linker e le dipendenze native possono cambiare il risultato: una compilazione Windows non certifica Linux, macOS o embedded.

Confronta una modifica alla volta su un carico rappresentativo. Separa build iniziale, rebuild e tempo di esecuzione; registra sia dimensioni sia regressioni nei test. Non dedurre che `"z"` produca sempre meno byte di `"s"`, o che `codegen-units = 1` migliori sempre il throughput.

## Errori comuni

- Confondere `debug = true` con `debug-assertions = true`: il primo aggiunge informazioni, il secondo abilita controlli.
- Mettere validazioni o effetti indispensabili in `debug_assert!`: possono scomparire dall'esecuzione.
- Trattare `--release` come garanzia di correttezza o di migliori prestazioni.
- Cambiare il profilo di un membro aspettandosi che prevalga sulla radice del workspace.
- Definire un profilo personalizzato senza `inherits`: Cargo non sa quale base usare.
- Considerare un test `#[should_panic]` riuscito come prova del recupero da panic nel binario abort.
- Rimuovere i simboli prima di raccogliere una diagnosi.
- Leggere il tempo di `cargo run` come benchmark: puo includere compilazione e avvio.
- Pensare che `cargo check --release` abbia prodotto e collaudato l'eseguibile finale.

## Checklist

- L'obiettivo e dimensione, debug, tempo di build o tempo di esecuzione?
- Il profilo e definito nella radice corretta?
- Le impostazioni effettive includono override di ambiente o CI?
- Il programma mantiene la semantica desiderata anche senza debug assertions?
- La strategia di panic e compatibile con cleanup, FFI e target?
- I test sono passati anche col profilo ottimizzato?
- Hai conservato le informazioni necessarie per la diagnosi?
- Le misure usano stesso codice, toolchain, target e carico?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Workspace|Workspace]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Build scripts|Build scripts]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
- [[Programmazione/Rust/Pagine/panic|panic! e gestione dei panic]]

## Fonti

- [Cargo Book: profiles](https://doc.rust-lang.org/cargo/reference/profiles.html), scelta, ereditarieta e limiti degli override.
- [rustc: opzioni di generazione del codice](https://doc.rust-lang.org/rustc/codegen-options/index.html), flag e dipendenze dal target.
- [Rust Reference: overflow intero](https://doc.rust-lang.org/reference/expressions/operator-expr.html#overflow), distinto dalla gestione esplicita dei risultati.
- Fonti specifiche collegate nelle sezioni; verifiche riproducibili del laboratorio in `_Meta/tests/rust-build-profiles.test.mjs` nel repository, non nel sito pubblico.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
