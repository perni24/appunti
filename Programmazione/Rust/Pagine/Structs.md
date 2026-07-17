---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, structs, tipi-dato]
aliases:
  - "Struct Rust"
  - "Struct con campi nominati"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
related:
  - "[[Programmazione/Rust/Pagine/Tuple structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
---

# Structs

## Sintesi

Una `struct` definisce un tipo personalizzato composto da campi. In Rust e il modo principale per modellare dati con significato di dominio: utenti, configurazioni, messaggi, coordinate, record letti da un database.

Le struct non hanno ereditarieta. Il comportamento si aggiunge con blocchi `impl` e con i trait.

## Quando usarlo

- Quando piu valori devono viaggiare insieme con un nome chiaro.
- Quando i campi hanno significati diversi e conviene nominarli.
- Quando vuoi associare metodi a un tipo.
- Quando vuoi rendere esplicite invarianti e confini della API.

## Come funziona

Una struct con campi nominati dichiara nome e tipo di ogni campo:

```rust
struct Utente {
    id: u64,
    email: String,
    attivo: bool,
}
```

Un valore della struct possiede i campi che contiene, salvo campi che sono riferimenti. Le regole di ownership si applicano campo per campo.

```rust
let utente = Utente {
    id: 1,
    email: String::from("luca@example.com"),
    attivo: true,
};
```

I metodi si definiscono in un blocco `impl`:

```rust
impl Utente {
    fn disattiva(&mut self) {
        self.attivo = false;
    }
}
```

## API / Sintassi

```rust
struct Nome {
    campo: Tipo,
}

impl Nome {
    fn nuovo(campo: Tipo) -> Self {
        Self { campo }
    }

    fn campo(&self) -> &Tipo {
        &self.campo
    }
}
```

Sintassi utile:

```rust
let email = String::from("a@b.test");
let utente = Utente { id: 1, email, attivo: true };

let altro = Utente {
    id: 2,
    ..utente
};
```

La sintassi `..utente` muove o copia i campi rimanenti da `utente`.

## Esempio pratico

```rust
#[derive(Debug, Clone)]
struct Config {
    host: String,
    port: u16,
    debug: bool,
}

impl Config {
    fn new(host: impl Into<String>, port: u16) -> Self {
        Self {
            host: host.into(),
            port,
            debug: false,
        }
    }

    fn endpoint(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}

fn main() {
    let config = Config::new("localhost", 5432);
    println!("{}", config.endpoint());
}
```

`Config` raggruppa dati correlati e concentra la logica di costruzione nel metodo `new`.

## Varianti

- Struct con campi nominati: `struct Utente { id: u64 }`.
- Tuple struct: `struct UserId(u64)`.
- Unit-like struct: `struct Marker;`.
- Struct generiche: `struct Wrapper<T> { value: T }`.
- Struct con lifetime: `struct View<'a> { text: &'a str }`.

## Errori comuni

- Rendere pubblici tutti i campi senza proteggere invarianti.
- Usare una tuple quando i campi hanno significato diverso e meritano nomi.
- Dimenticare che assegnare un campo `String` puo muovere ownership.
- Creare costruttori che accettano tipi troppo rigidi, per esempio solo `String` invece di `impl Into<String>`.
- Confondere metodi associati `Self::new()` e metodi su istanza `self.metodo()`.

## Checklist

- I campi rappresentano un concetto unico?
- I nomi dei campi rendono chiaro il dominio?
- I campi devono essere pubblici o serve una API controllata?
- Serve un costruttore per garantire invarianti?
- Ha senso derivare `Debug`, `Clone`, `Copy`, `Eq` o altri trait?

## Collegamenti

- [[Programmazione/Rust/Pagine/Tuple structs|Tuple structs]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]

