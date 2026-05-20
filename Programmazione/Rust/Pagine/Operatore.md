---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, operatore-question-mark, error-handling]
aliases:
  - "Operatore ?"
  - "Question mark operator"
  - "? in Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Option]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
related:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/Control flow avanzato]]"
---

# Operatore ?

## Sintesi

L'operatore `?` propaga automaticamente un errore o un valore assente. Con `Result`, se il valore e `Err`, la funzione ritorna subito quell'errore. Con `Option`, se il valore e `None`, la funzione ritorna subito `None`.

Serve a rendere lineare il codice fallibile senza scrivere `match` ripetitivi.

## Quando usarlo

- Quando una funzione restituisce `Result` e vuoi propagare errori.
- Quando una funzione restituisce `Option` e vuoi propagare assenza.
- Quando una sequenza di operazioni fallibili deve interrompersi al primo fallimento.
- Quando il chiamante superiore e il punto corretto per gestire l'errore.

## Come funziona

Con `Result`:

```rust
fn leggi() -> Result<String, std::io::Error> {
    let testo = std::fs::read_to_string("file.txt")?;
    Ok(testo)
}
```

E simile a:

```rust
let testo = match std::fs::read_to_string("file.txt") {
    Ok(testo) => testo,
    Err(err) => return Err(err.into()),
};
```

Con `Option`:

```rust
fn primo(s: &str) -> Option<char> {
    let c = s.chars().next()?;
    Some(c)
}
```

## API / Sintassi

```rust
let valore = operazione_fallibile()?;
```

La funzione corrente deve restituire un tipo compatibile:

```rust
fn parse_id(input: &str) -> Result<u64, std::num::ParseIntError> {
    let id = input.parse::<u64>()?;
    Ok(id)
}
```

Conversione dell'errore:

```rust
fn carica_numero(path: &str) -> Result<i32, Box<dyn std::error::Error>> {
    let testo = std::fs::read_to_string(path)?;
    let numero = testo.trim().parse::<i32>()?;
    Ok(numero)
}
```

Gli errori vengono convertiti tramite `From` quando possibile.

## Esempio pratico

```rust
fn dominio(email: &str) -> Option<&str> {
    let (_, dominio) = email.split_once('@')?;
    Some(dominio)
}

fn leggi_porta(path: &str) -> Result<u16, Box<dyn std::error::Error>> {
    let testo = std::fs::read_to_string(path)?;
    let porta = testo.trim().parse::<u16>()?;
    Ok(porta)
}
```

Il primo esempio propaga `None`. Il secondo propaga errori di I/O e parsing verso il chiamante.

## Varianti

- `?` su `Result<T, E>`.
- `?` su `Option<T>`.
- `?` in funzioni che restituiscono `Result`, `Option` o altri tipi compatibili con il meccanismo di try.
- `ok_or` e `ok_or_else` per convertire `Option` in `Result`.
- `map_err` per adattare un errore prima di usare `?`.

## Errori comuni

- Usare `?` in una funzione che non restituisce `Result` o `Option`.
- Perdere contesto propagando errori troppo grezzi.
- Confondere `?` con gestione dell'errore: `?` propaga, non risolve.
- Usare `?` quando il fallimento dovrebbe essere gestito localmente.
- Mescolare `Option` e `Result` senza conversione esplicita.

## Checklist

- La funzione corrente restituisce un tipo compatibile con `?`?
- L'errore propagato e abbastanza informativo?
- Serve convertire `Option` in `Result` con `ok_or_else`?
- Serve aggiungere contesto prima di propagare?
- Il chiamante superiore e davvero il posto giusto per gestire il fallimento?

## Collegamenti

- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Control flow avanzato|Control flow avanzato]]

