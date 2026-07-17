---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, ownership, memory-safety]
aliases:
  - "Ownership in Rust"
  - "Sistema di ownership"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Sintassi di base]]"
  - "[[Programmazione/Rust/Pagine/Variabili mutabilita e shadowing]]"
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
related:
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
---

# Ownership

## Sintesi

L'ownership e il modello con cui Rust gestisce la memoria senza garbage collector. Ogni valore ha un solo proprietario, il valore viene liberato quando il proprietario esce dallo scope e il compilatore impedisce usi non sicuri come use-after-free, double free e riferimenti pendenti.

La regola da ricordare e semplice: in Rust la memoria non viene gestita da un runtime nascosto, ma dal tipo di relazione tra variabili, valori e riferimenti.

## Quando usarlo

- Quando si lavora con valori allocati sullo heap, come `String`, `Vec<T>` e strutture che possiedono risorse.
- Quando si passa un valore a una funzione e bisogna decidere se trasferirlo, copiarlo o prestarlo.
- Quando si progetta una API e si vuole rendere chiaro chi possiede i dati.
- Quando si deve evitare memoria condivisa non controllata.

## Come funziona

Rust applica tre regole principali:

- Ogni valore ha una variabile proprietaria.
- In ogni momento puo esserci un solo proprietario.
- Quando il proprietario esce dallo scope, il valore viene distrutto con `drop`.

Per tipi semplici come `i32` il valore viene copiato. Per tipi che possiedono memoria o risorse, come `String`, l'assegnazione trasferisce ownership.

```rust
let a = String::from("rust");
let b = a;

// println!("{a}"); // errore: a non possiede piu la String
println!("{b}");
```

Dopo `let b = a`, il proprietario diventa `b`. Questo impedisce che due variabili tentino di liberare la stessa allocazione.

## API / Sintassi

```rust
// ownership creata
let valore = String::from("test");

// ownership trasferita
let altro = valore;

// ownership passata a una funzione
fn consuma(s: String) {
    println!("{s}");
}

let nome = String::from("Luca");
consuma(nome);
// nome non e piu utilizzabile
```

Per non trasferire ownership si usa un riferimento:

```rust
fn stampa(s: &String) {
    println!("{s}");
}

let nome = String::from("Luca");
stampa(&nome);
println!("{nome}");
```

## Esempio pratico

```rust
fn lunghezza(s: &String) -> usize {
    s.len()
}

fn aggiungi_prefisso(mut s: String) -> String {
    s.insert_str(0, "id-");
    s
}

fn main() {
    let nome = String::from("ordine");

    let len = lunghezza(&nome);
    println!("lunghezza: {len}");

    let nome = aggiungi_prefisso(nome);
    println!("{nome}");
}
```

`lunghezza` prende in prestito la stringa, quindi il chiamante mantiene ownership. `aggiungi_prefisso` prende ownership per modificare e restituire il valore.

## Varianti

- Trasferire ownership: utile quando la funzione deve diventare responsabile del valore.
- Prendere un riferimento immutabile `&T`: utile per leggere senza consumare.
- Prendere un riferimento mutabile `&mut T`: utile per modificare senza trasferire.
- Restituire ownership: utile quando una funzione costruisce o trasforma un valore posseduto.

## Errori comuni

- Usare una variabile dopo un move.
- Passare `String` quando sarebbe bastato `&str`.
- Clonare valori grandi per evitare il borrow checker invece di modellare meglio l'ownership.
- Restituire riferimenti a valori locali che vengono distrutti alla fine della funzione.
- Confondere immutabilita della variabile e ownership del valore.

## Checklist

- Il chiamante deve continuare a usare il valore dopo la chiamata? Usa un riferimento.
- La funzione deve conservare il valore oltre la chiamata? Prendi ownership.
- Il valore e piccolo e `Copy`? La copia e spesso accettabile.
- Il valore e grande o possiede risorse? Evita `clone` non necessari.
- Il design della API comunica chiaramente chi possiede cosa?

## Collegamenti

- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]

