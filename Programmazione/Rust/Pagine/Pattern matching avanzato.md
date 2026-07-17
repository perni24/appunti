---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, pattern-matching, avanzato]
aliases:
  - "Pattern avanzati Rust"
  - "Match avanzato Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Destructuring]]"
related:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
---

# Pattern matching avanzato

## Sintesi

Il pattern matching avanzato usa pattern piu espressivi: alternative con `|`, range, guardie, binding con `@`, `ref`, `ref mut`, `..` e destructuring annidato. Serve per descrivere in modo compatto forme complesse dei dati.

Va usato con misura: pattern troppo densi possono diventare piu difficili da leggere di un controllo esplicito.

## Quando usarlo

- Quando devi combinare piu casi equivalenti.
- Quando vuoi controllare range numerici o caratteri.
- Quando vuoi estrarre dati e mantenere anche il valore intero.
- Quando vuoi evitare move usando binding per riferimento.
- Quando i dati sono annidati e il pattern chiarisce la struttura.

## Come funziona

Alternative:

```rust
match c {
    'a' | 'e' | 'i' | 'o' | 'u' => println!("vocale"),
    _ => println!("altro"),
}
```

Range:

```rust
match n {
    0..=9 => println!("cifra"),
    _ => println!("altro"),
}
```

Guardia:

```rust
match valore {
    Some(n) if n > 10 => println!("grande"),
    Some(n) => println!("{n}"),
    None => println!("vuoto"),
}
```

## API / Sintassi

Binding con `@`:

```rust
match n {
    valore @ 1..=5 => println!("piccolo: {valore}"),
    _ => println!("fuori range"),
}
```

Ignorare parti con `..`:

```rust
struct Punto3D {
    x: i32,
    y: i32,
    z: i32,
}

let punto = Punto3D { x: 1, y: 2, z: 3 };

match punto {
    Punto3D { x, .. } => println!("x = {x}"),
}
```

Borrow nel pattern:

```rust
match &messaggio {
    Messaggio::Testo(testo) => println!("{testo}"),
    Messaggio::Vuoto => {}
}
```

## Esempio pratico

```rust
enum Token {
    Numero(i64),
    Ident(String),
    Simbolo(char),
}

fn classifica(token: Token) -> &'static str {
    match token {
        Token::Numero(n @ 0..=9) => {
            let _ = n;
            "cifra"
        }
        Token::Numero(_) => "numero",
        Token::Ident(nome) if nome == "fn" || nome == "let" => "keyword",
        Token::Ident(_) => "identificatore",
        Token::Simbolo('(' | ')' | '{' | '}') => "delimitatore",
        Token::Simbolo(_) => "simbolo",
    }
}
```

Il match combina range, alternative e guardie. In questo esempio il token viene consumato; se serve conservarlo, si puo fare match su `&Token` e prendere i dati per riferimento.

## Varianti

- `|`: alternative tra pattern.
- `..`: ignora il resto di struct, tuple o slice.
- `@`: assegna un nome a un valore che deve anche rispettare un pattern.
- Guardie `if`: condizione aggiuntiva su un pattern.
- `ref` e `ref mut`: binding per riferimento quando non si matcha gia su un riferimento.
- Pattern annidati: enum dentro struct, tuple dentro enum, slice con elementi specifici.

## Errori comuni

- Scrivere pattern troppo complessi in un solo braccio.
- Usare guardie e aspettarsi che il compilatore mantenga la stessa esaustivita dei pattern puri.
- Muovere campi senza volerlo durante il match.
- Mettere un pattern generale prima di uno specifico.
- Usare `_` in modo troppo ampio e nascondere casi futuri.

## Checklist

- Il pattern e ancora leggibile?
- I casi specifici vengono prima dei fallback?
- Il match consuma il valore o lavora su riferimenti?
- Una guardia e necessaria o il pattern puo esprimere gia il vincolo?
- `_` nasconde casi che sarebbe meglio nominare?

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]

