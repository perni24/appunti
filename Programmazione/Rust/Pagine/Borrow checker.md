---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, borrow-checker, memory-safety]
aliases:
  - "Controllore dei prestiti"
  - "Borrow checking"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetime impliciti]]"
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
  - "[[Programmazione/Rust/Pagine/Mutabilita]]"
---

# Borrow checker

## Sintesi

Il borrow checker e la parte del compilatore Rust che verifica le regole di ownership e borrowing. Il suo compito e garantire che i riferimenti siano validi, che non ci siano accessi mutabili concorrenti non controllati e che i valori non vengano usati dopo essere stati mossi o distrutti.

Non e un sistema separato da imparare a memoria: e la conseguenza pratica delle regole di ownership, riferimenti e lifetime.

## Quando usarlo

Il borrow checker e sempre attivo. Diventa particolarmente importante quando:

- si lavora con riferimenti multipli allo stesso valore;
- si alternano letture e modifiche;
- si restituiscono riferimenti da funzioni;
- si manipolano collection mentre si itera;
- si struttura codice con closure, struct e metodi.

## Come funziona

Il compilatore controlla:

- se un valore e ancora valido dopo un move;
- se i riferimenti non vivono piu del valore referenziato;
- se un `&mut T` e esclusivo;
- se un valore non viene modificato mentre esistono riferimenti immutabili attivi;
- se i lifetime possono essere dedotti o devono essere esplicitati.

Esempio non valido:

```rust
let mut testo = String::from("rust");

let r = &testo;
testo.push_str("!");

println!("{r}");
```

`r` legge `testo`, ma `testo` viene modificato mentre il riferimento e ancora usato.

## API / Sintassi

Non esiste una API del borrow checker. Si controlla indirettamente tramite le firme:

```rust
fn leggi(v: &[i32]) -> usize {
    v.len()
}

fn modifica(v: &mut Vec<i32>) {
    v.push(10);
}

fn consuma(v: Vec<i32>) -> usize {
    v.len()
}
```

Le tre firme comunicano tre contratti diversi: leggere, modificare, consumare.

## Esempio pratico

```rust
fn aggiungi_se_manca(nomi: &mut Vec<String>, nome: &str) {
    let presente = nomi.iter().any(|n| n == nome);

    if !presente {
        nomi.push(nome.to_owned());
    }
}
```

Il borrow immutabile creato da `iter()` finisce dopo il calcolo di `presente`. Solo dopo viene creato il borrow mutabile per `push`.

Versione problematica:

```rust
fn esempio(nomi: &mut Vec<String>) {
    let primo = nomi.first();
    nomi.push(String::from("nuovo"));
    println!("{primo:?}");
}
```

`primo` puo puntare dentro il `Vec`; una `push` potrebbe riallocare e invalidarlo.

## Varianti

- Borrow checking classico: regole di ownership e riferimenti.
- Non-lexical lifetimes: il borrow termina all'ultimo uso effettivo.
- Interior mutability: sposta alcuni controlli da compile time a runtime, per esempio con `RefCell<T>`.
- Smart pointer condivisi: `Rc<T>` e `Arc<T>` gestiscono ownership condivisa con reference counting.

## Errori comuni

- Iterare su una collection e modificarla nello stesso ciclo senza separare le fasi.
- Tenere riferimenti a elementi di un `Vec` e poi fare operazioni che possono riallocare.
- Interpretare un errore del borrow checker come un limite arbitrario invece che come un conflitto di accesso.
- Usare `RefCell<T>` per evitare di modellare correttamente ownership e borrowing.

## Checklist

- Puoi ridurre lo scope del riferimento?
- Puoi separare fase di lettura e fase di modifica?
- Puoi estrarre il valore invece di conservarne un riferimento?
- La funzione dovrebbe prendere ownership invece di un riferimento?
- La collection puo riallocare mentre esistono riferimenti ai suoi elementi?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]

