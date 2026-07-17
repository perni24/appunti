---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, option, error-handling]
aliases:
  - "Option Rust"
  - "Valori opzionali"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
related:
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
  - "[[Programmazione/Rust/Pagine/if let e while let]]"
---

# Option

## Sintesi

`Option<T>` rappresenta un valore che puo esserci oppure no. Sostituisce l'uso di `null` e obbliga il chiamante a gestire esplicitamente il caso assente.

Le due varianti sono `Some(T)` e `None`.

## Quando usarlo

- Quando un valore puo essere assente senza essere un errore.
- Quando una ricerca puo non trovare risultati.
- Quando una collection puo essere vuota e vuoi estrarre un elemento.
- Quando un campo e opzionale nel modello di dominio.

## Come funziona

`Option` e un enum generico:

```rust
enum Option<T> {
    Some(T),
    None,
}
```

Un valore `Some(T)` contiene un dato. `None` indica assenza.

```rust
let nome: Option<String> = Some(String::from("Luca"));
let vuoto: Option<String> = None;
```

Per usare il valore contenuto bisogna gestire entrambe le possibilita.

## API / Sintassi

```rust
let valore = Some(10);

match valore {
    Some(n) => println!("{n}"),
    None => println!("nessun valore"),
}
```

Metodi comuni:

```rust
let valore = Some(3);

let doppio = valore.map(|n| n * 2);
let con_default = valore.unwrap_or(0);
let presente = valore.is_some();
```

Conversione con `?`:

```rust
fn primo_carattere(s: &str) -> Option<char> {
    let c = s.chars().next()?;
    Some(c)
}
```

## Esempio pratico

```rust
fn trova_email(id: u64) -> Option<String> {
    if id == 1 {
        Some(String::from("luca@example.com"))
    } else {
        None
    }
}

fn dominio_email(id: u64) -> Option<String> {
    let email = trova_email(id)?;
    let (_, dominio) = email.split_once('@')?;
    Some(dominio.to_owned())
}
```

`?` su `Option` interrompe la funzione con `None` se il valore e assente.

## Varianti

- `Some(T)`: valore presente.
- `None`: valore assente.
- `Option<&T>`: riferimento opzionale.
- `Option<T>` con `take()`: estrae il valore lasciando `None`.
- `Option<Result<T, E>>` e `Result<Option<T>, E>`: forme diverse per combinare assenza ed errore.

## Errori comuni

- Usare `unwrap()` in codice applicativo senza garanzia forte.
- Usare `Option` per errori che dovrebbero spiegare il motivo del fallimento.
- Confondere valore assente con valore vuoto, per esempio `None` e `Some("")`.
- Clonare il valore interno invece di usare `as_ref()` o pattern su riferimento.
- Nascondere casi importanti con `unwrap_or` troppo generici.

## Checklist

- L'assenza e un caso normale? Usa `Option`.
- Serve spiegare perche manca? Usa `Result`.
- Il chiamante deve distinguere `None` da valore vuoto?
- Puoi usare `?`, `map`, `and_then` o `ok_or` invece di match verbosi?
- `unwrap()` e giustificato da una invariante chiara?

## Collegamenti

- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]

