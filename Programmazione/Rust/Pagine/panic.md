---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, panic, error-handling]
aliases:
  - "panic!"
  - "Panic Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/Operatore]]"
  - "[[Programmazione/Rust/Pagine/Unit test]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
---

# panic!

## Sintesi

`panic!` interrompe il flusso normale del programma quando viene raggiunto uno stato considerato irrecuperabile. Non e il meccanismo principale per gestire errori prevedibili: per quelli si usa `Result`.

Un panic indica di solito un bug, una violazione di invariante o una condizione che il programma non sa gestire in modo sicuro.

## Quando usarlo

- Quando viene violata una invariante interna che non dovrebbe mai fallire.
- In prototipi, test o esempi dove il fallimento deve interrompere subito l'esecuzione.
- Quando continuare sarebbe piu pericoloso che fermarsi.
- In codice applicativo solo se il caso non e recuperabile.

## Come funziona

```rust
panic!("stato non valido");
```

Molte operazioni possono causare panic:

```rust
let numeri = vec![1, 2, 3];
println!("{}", numeri[10]); // panic: indice fuori range
```

Metodi come `unwrap` ed `expect` fanno panic se il valore e `None` o `Err`.

```rust
let n = "abc".parse::<i32>().unwrap(); // panic
```

## API / Sintassi

```rust
panic!("messaggio");
panic!("id non valido: {id}");
```

`expect` permette di documentare l'invariante:

```rust
let home = std::env::var("HOME").expect("HOME deve essere definita");
```

In test:

```rust
#[test]
#[should_panic]
fn fallisce_se_indice_non_valido() {
    let v = vec![1];
    let _ = v[10];
}
```

## Esempio pratico

```rust
struct Percentuale(u8);

impl Percentuale {
    fn new(value: u8) -> Self {
        assert!(value <= 100, "percentuale fuori range");
        Self(value)
    }
}
```

Qui `assert!` produce panic se l'invariante viene violata. In una API pubblica fallibile, pero, spesso e meglio restituire `Result`.

## Varianti

- `panic!`: panic esplicito.
- `assert!`, `assert_eq!`, `assert_ne!`: panic se l'asserzione fallisce.
- `unwrap`: panic con messaggio generico.
- `expect`: panic con messaggio fornito.
- Panic strategy: unwind o abort, configurabile a livello di build.

## Errori comuni

- Usare `unwrap()` su input utente, rete, file o database.
- Usare panic per errori recuperabili.
- Nascondere invarianti importanti dietro messaggi generici.
- Pensare che panic equivalga a eccezioni da catturare normalmente.
- Fare affidamento su panic in librerie pubbliche senza documentarlo.

## Checklist

- Il fallimento e un bug o un errore recuperabile?
- Il chiamante puo fare qualcosa? Se si, usa `Result`.
- Il messaggio spiega l'invariante violata?
- In una libreria, il panic e documentato?
- `expect` comunica meglio di `unwrap` il motivo per cui il valore dovrebbe esistere?

## Collegamenti

- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]

