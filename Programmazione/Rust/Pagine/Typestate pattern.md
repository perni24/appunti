---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - compile-time-e-type-level-programming
aliases:
  - "Typestate"
  - "Typestate pattern"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Marker types]]"
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
related:
  - "[[Programmazione/Rust/Pagine/PhantomData]]"
  - "[[Programmazione/Rust/Pagine/Newtype pattern]]"
  - "[[Programmazione/Rust/Pagine/Builder pattern]]"
---

# Typestate pattern

## Sintesi

Il typestate pattern rappresenta stati e transizioni nel type system. Invece di avere un campo runtime come `state: Connected`, il tipo stesso cambia: `Client<Disconnected>` diventa `Client<Connected>` dopo una transizione valida.

Questo permette al compilatore di impedire operazioni non valide in uno stato specifico.

## Quando usarlo

- Quando una API ha sequenze obbligate di operazioni.
- Quando vuoi impedire uso di oggetti non inizializzati o non validati.
- Quando una connessione, builder o transazione ha stati distinti.
- Quando gli errori di stato sono bug prevenibili a compile time.

## Come funziona

```rust
struct Disconnected;
struct Connected;

struct Client<State> {
    endpoint: String,
    _state: std::marker::PhantomData<State>,
}
```

Metodi disponibili solo in certi stati:

```rust
impl Client<Disconnected> {
    fn connect(self) -> Client<Connected> {
        Client {
            endpoint: self.endpoint,
            _state: std::marker::PhantomData,
        }
    }
}

impl Client<Connected> {
    fn send(&self, message: &str) {
        println!("{message}");
    }
}
```

## API / Sintassi

Costruzione:

```rust
impl Client<Disconnected> {
    fn new(endpoint: String) -> Self {
        Self {
            endpoint,
            _state: std::marker::PhantomData,
        }
    }
}
```

Uso:

```rust
let client = Client::<Disconnected>::new(String::from("localhost"));
let client = client.connect();
client.send("ping");
```

Non esiste `send` su `Client<Disconnected>`.

## Esempio pratico

```rust
struct Draft;
struct Published;

struct Post<State> {
    title: String,
    _state: std::marker::PhantomData<State>,
}

impl Post<Draft> {
    fn publish(self) -> Post<Published> {
        Post {
            title: self.title,
            _state: std::marker::PhantomData,
        }
    }
}

impl Post<Published> {
    fn title(&self) -> &str {
        &self.title
    }
}
```

Solo un post pubblicato espone il titolo come contenuto leggibile.

## Varianti

- Typestate con marker struct.
- Typestate con `PhantomData`.
- Builder type-state: impedisce `build` finche mancano campi obbligatori.
- Stati runtime piu type-level: enum per casi dinamici, typestate per sequenze statiche.
- Typestate con capability marker.

## Errori comuni

- Usare typestate per flussi troppo dinamici, dove una enum sarebbe piu semplice.
- Esplodere il numero di stati generici.
- Rendere errori utente compile-time impossibili da modellare quando sono runtime.
- Esporre marker interni non necessari.
- Dimenticare che ogni stato generico puo aumentare complessita della API.

## Checklist

- Gli stati sono noti staticamente?
- Le transizioni consumano `self` quando cambiano stato?
- L'API impedisce davvero operazioni invalide?
- Una enum runtime sarebbe piu leggibile?
- Il numero di stati resta gestibile?

## Collegamenti

- [[Programmazione/Rust/Pagine/Marker types|Marker types]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]
- [[Programmazione/Rust/Pagine/Builder pattern|Builder pattern]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
