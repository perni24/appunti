---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - panic
  - error-handling
aliases:
  - panic!
  - Panic Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Result]]"
related:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
  - "[[Programmazione/Rust/Pagine/Unit test]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
title: panic!
---

# panic!

## Sintesi

`panic!` segnala una violazione del contratto o di un'invariante e interrompe il flusso ordinario. Non e il sostituto di `Result` per input non valido, file mancanti o altri fallimenti previsti.

Il comportamento dipende dalla strategia di compilazione: con **unwind** risale lo stack del thread; con **abort** termina il processo senza eseguire il normale cleanup dello stack. Un panic non e, da solo, undefined behavior.

## Quando usarlo

- Invarianti interne che il chiamante doveva rispettare, documentando il contratto.
- Test nei quali una condizione falsa deve far fallire la prova.
- Prototipi, con i punti fallibili da rivedere prima dell'uso reale.
- Non classificare automaticamente come bug ogni errore che l'applicazione non sa recuperare: anche terminare con un `Result` segnalato e una gestione valida.

## Come funziona

Con la standard library, il panic hook viene invocato prima della strategia di panic. Quello predefinito scrive su stderr; il backtrace puo essere abilitato separatamente.

- **Unwind**: vengono distrutti i valori locali negli scope attraversati. Se non intercettato, il thread termina; un panic nel thread principale fa fallire il programma.
- **Abort**: il processo termina, anche se il panic nasce in un worker; non fare affidamento su `Drop` per salvare o completare dati.
- Il cleanup non e rollback: modifiche a file, database o stato condiviso possono essere gia avvenute.

### Panic esplicito

Baseline: Rust 1.99.1, edition 2024, standard library. I blocchi Rust sono programmi autonomi per `src/main.rs`. **Questo primo programma termina intenzionalmente con un panic**:

```rust
fn main() {
    let state = "empty";
    panic!("internal queue invariant violated: state={state}");
}
```

Anche `values[index]` fuori range, `Option::unwrap` su `None` e `Result::unwrap` su `Err` fanno panic. Per indici esterni considera `get` e gestisci l'assenza. In codice safe un controllo fallito dell'indice non autorizza accessi fuori memoria.

## API / Sintassi

### expect deve spiegare una garanzia reale

```rust
fn main() {
    let default_port = "8080"
        .parse::<u16>()
        .expect("the hardcoded default port should be a valid u16");
    assert_eq!(default_port, 8080);
}
```

Il literal e controllato nel sorgente. Una variabile d'ambiente come `HOME` non ha la stessa garanzia: puo mancare e non e portabile come requisito implicito su tutti i sistemi. Per input esterno propaga o gestisci l'errore.

`expect` cambia il messaggio, non la strategia: puo comunque fare panic. Evita segreti o interi payload nei messaggi; `unwrap` su `Result` puo includere la rappresentazione `Debug` dell'errore.

### assert e debug_assert non sono intercambiabili

Questo programma mostra volutamente un effetto collaterale nel controllo, **da non usare come logica applicativa**:

```rust
fn main() {
    let mut checks = 0;
    debug_assert!({
        checks += 1;
        true
    });
    assert_eq!(checks, usize::from(cfg!(debug_assertions)));
}
```

`assert!`, `assert_eq!` e `assert_ne!` restano attivi anche in release. `debug_assert!` dipende da `debug-assertions`: normalmente abilitato in dev e disabilitato in release, ma configurabile. Il codice viene comunque controllato nei tipi. Non usarlo come unica validazione o precondizione di codice unsafe.

## Esempio pratico

### Tipo con contratto documentato e alternativa fallibile

```rust
#[derive(Debug, PartialEq)]
struct Percentage(u8);

impl Percentage {
    /// # Panics
    /// Panics when value exceeds 100.
    fn new(value: u8) -> Self {
        assert!(value <= 100, "percentage must be at most 100");
        Self(value)
    }

    fn try_new(value: u8) -> Result<Self, &'static str> {
        if value <= 100 {
            Ok(Self(value))
        } else {
            Err("percentage must be at most 100")
        }
    }

    fn value(&self) -> u8 {
        self.0
    }
}

fn main() {
    assert_eq!(Percentage::new(50).value(), 50);
    assert_eq!(Percentage::try_new(101), Err("percentage must be at most 100"));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_endpoints() {
        assert_eq!(Percentage::new(0).value(), 0);
        assert_eq!(Percentage::new(100).value(), 100);
    }

    #[test]
    #[should_panic(expected = "percentage must be at most 100")]
    fn rejects_invalid_contract() {
        Percentage::new(101);
    }
}
```

`new` e una scelta di API con precondizione, non un obbligo del linguaggio. `try_new` permette al chiamante di gestire l'input senza panic. Il campo e privato verso altri moduli, ma il modulo che lo definisce puo ancora costruire direttamente il valore: deve mantenere l'invariante.

Nel progetto Cargo, esegui separatamente:

```sh
cargo run
```

```sh
cargo test
```

`should_panic(expected = "...")` cerca una sottostringa nel messaggio: restringe il test, ma non prova da solo che il panic venga dalla riga desiderata. Mantieni il corpo del test piccolo. Un `should_panic` senza `expected` passa anche per un panic estraneo al comportamento previsto.

## Varianti

### Intercettare un unwind a un confine controllato

Il programma termina con successo, ma il panic hook predefinito scrive comunque su stderr:

```rust
use std::panic;

struct Guard;

impl Drop for Guard {
    fn drop(&mut self) {
        println!("guard dropped");
    }
}

fn main() {
    let outcome = panic::catch_unwind(|| {
        let _guard = Guard;
        panic!("demonstration panic");
    });
    assert!(outcome.is_err());
    println!("caller continues");
}
```

Con strategia unwind, stdout contiene prima `guard dropped`, poi `caller continues`. `catch_unwind` non e un normale try/catch applicativo: non cattura abort e non ripristina invarianti o stato. Il bound `UnwindSafe` richiama l'attenzione sullo stato catturato; `AssertUnwindSafe` e un'asserzione del programmatore, non una riparazione.

### Panic di un worker osservato con join

Anche questo esempio ha successo **con unwind**, lasciando la diagnostica del worker su stderr:

```rust
fn main() {
    let worker = std::thread::spawn(|| {
        panic!("worker invariant violated");
    });
    assert!(worker.join().is_err());
    println!("main continues");
}
```

Non vale per `panic = "abort"`, che termina l'intero processo. `join` restituisce il payload del panic, non necessariamente un tipo che implementa `std::error::Error`.

### Strategia nel profilo Cargo

Frammento da integrare nel `Cargo.toml` alla radice del workspace:

```toml
[profile.release]
panic = "abort"
```

Riguarda il profilo release, non automaticamente il normale `cargo run`. La strategia non equivale al livello di ottimizzazione. Il normale test harness Cargo usa unwind e ignora questa impostazione per i test: `cargo test --release` non dimostra il comportamento abort del binario di produzione.

Per una diagnosi locale in PowerShell, in un progetto che riproduce il panic:

```powershell
$env:RUST_BACKTRACE = '1'
```

```powershell
cargo run
```

La variabile vale per quella sessione e i processi figli; `'full'` richiede un backtrace piu esteso. Simboli, build e piattaforma influenzano i dettagli disponibili. Ripristina l'eventuale valore precedente dopo la diagnosi.

## Errori comuni

- Confondere un errore di input con una violazione di contratto interno.
- Dare per certo che un panic termini ogni thread o che sia sempre intercettabile.
- Aspettarsi che `catch_unwind` nasconda il messaggio del hook.
- Cambiare globalmente il hook in una libreria solo per silenziare un errore: e una risorsa di processo.
- Fare panic in `Drop` durante un unwind: puo provocare l'abort; i distruttori non sono un canale affidabile di reporting fallibile.
- Trattare il panic come una barriera generale per FFI o undefined behavior: i contratti ABI/unsafe restano separati.

## Checklist

- L'errore e previsto dal dominio oppure viola una precondizione?
- Esiste un'alternativa fallibile per input esterno?
- Il panic possibile e documentato?
- Stai verificando il profilo e la strategia effettivamente distribuiti?
- Cleanup, diagnostica e consistenza dopo il fallimento sono distinti?
- I test falliscono per la causa prevista?

## Collegamenti

- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]

## Fonti

Riferimento: Rust 1.99.1, edition 2024, target Windows GNU per le prove locali; nessuna MSRV complessiva dichiarata.

- [panic! e hook predefinito](https://doc.rust-lang.org/std/macro.panic.html).
- [Rust Book: unwind e abort](https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html).
- [Scelta tra panic e Result](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html).
- [catch_unwind](https://doc.rust-lang.org/std/panic/fn.catch_unwind.html), [set_hook](https://doc.rust-lang.org/std/panic/fn.set_hook.html) e [join](https://doc.rust-lang.org/std/thread/struct.JoinHandle.html#method.join).
- [debug_assert!](https://doc.rust-lang.org/std/macro.debug_assert.html), [profili Cargo](https://doc.rust-lang.org/cargo/reference/profiles.html#panic) e [should_panic](https://doc.rust-lang.org/reference/attributes/testing.html#the-should_panic-attribute).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
