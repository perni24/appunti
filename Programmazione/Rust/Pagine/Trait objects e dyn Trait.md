---
date: 2026-05-21
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - astrazione-e-generici
aliases:
  - "Trait object"
  - "dyn Trait"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Object safety]]"
related:
  - "[[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
  - "[[Programmazione/Rust/Pagine/Box T]]"
---

# Trait objects e dyn Trait

## Sintesi

Un trait object permette di usare valori di tipi diversi tramite lo stesso trait a runtime. La forma esplicita e `dyn Trait`, di solito dietro un puntatore come `&dyn Trait`, `Box<dyn Trait>` o `Arc<dyn Trait>`.

Rispetto ai generics, il tipo concreto non e noto staticamente nel punto d'uso. Le chiamate ai metodi avvengono con dynamic dispatch.

## Quando usarlo

- Quando devi conservare tipi diversi nella stessa collection.
- Quando vuoi scegliere implementazioni a runtime.
- Quando vuoi ridurre monomorfizzazione e codice generato.
- Quando una API deve restituire "qualcosa che implementa un trait" senza esporre il tipo concreto e `impl Trait` non basta.

## Come funziona

Un trait object e un fat pointer composto da:

- puntatore al valore;
- puntatore alla vtable con i metodi del trait.

```rust
trait Draw {
    fn draw(&self);
}

struct Button;
struct Text;

impl Draw for Button {
    fn draw(&self) {
        println!("button");
    }
}

impl Draw for Text {
    fn draw(&self) {
        println!("text");
    }
}
```

Uso:

```rust
let widgets: Vec<Box<dyn Draw>> = vec![Box::new(Button), Box::new(Text)];
```

## API / Sintassi

Riferimento dinamico:

```rust
fn render(item: &dyn Draw) {
    item.draw();
}
```

Ownership dinamica:

```rust
fn boxed() -> Box<dyn Draw> {
    Box::new(Button)
}
```

Collection eterogenea:

```rust
let items: Vec<Box<dyn Draw>> = vec![Box::new(Button), Box::new(Text)];
```

## Esempio pratico

```rust
trait Logger {
    fn log(&self, message: &str);
}

struct StdoutLogger;

impl Logger for StdoutLogger {
    fn log(&self, message: &str) {
        println!("{message}");
    }
}

fn run(logger: &dyn Logger) {
    logger.log("avvio");
}
```

`run` non e generica: accetta qualsiasi implementazione tramite riferimento dinamico.

## Varianti

- `&dyn Trait`: prestito dinamico.
- `Box<dyn Trait>`: ownership heap del valore dinamico.
- `Arc<dyn Trait>`: ownership condivisa thread-safe.
- `dyn Trait + Send + Sync`: trait object con marker trait.
- `impl Trait`: alternativa statica quando il tipo concreto resta unico.

## Errori comuni

- Usare `dyn Trait` quando i generics sarebbero piu semplici e veloci.
- Dimenticare che `dyn Trait` richiede object safety.
- Provare a mettere valori di tipi diversi in `Vec<T>` senza usare indirection.
- Restituire `dyn Trait` senza puntatore: i trait object sono unsized.
- Confondere `impl Trait` e `dyn Trait`.

## Checklist

- Servono tipi diversi nello stesso contenitore?
- Il tipo concreto deve essere scelto a runtime?
- Il trait e object safe?
- Il costo di dynamic dispatch e accettabile?
- Serve ownership (`Box`) o basta un riferimento (`&dyn`)?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Object safety|Object safety]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/Box T|Box T]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc T e Arc T]]
