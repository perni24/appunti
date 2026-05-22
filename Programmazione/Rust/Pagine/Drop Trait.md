---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - smart-pointers-e-interior-mutability
aliases:
  - "Drop"
  - "RAII Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Box T]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Deref Trait]]"
  - "[[Programmazione/Rust/Pagine/File descriptor]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
---

# Drop Trait

## Sintesi

`Drop` definisce cosa succede quando un valore esce dallo scope. E il fondamento del modello RAII di Rust: risorse come memoria, file, lock e connessioni vengono rilasciate automaticamente quando il proprietario viene distrutto.

Nella maggior parte dei casi non serve implementare `Drop`: i campi vengono droppati automaticamente.

## Quando usarlo

- Quando un tipo possiede una risorsa esterna che richiede cleanup.
- Quando vuoi rilasciare un lock, file descriptor o handle in modo deterministico.
- Quando costruisci smart pointer o astrazioni unsafe.
- Quando devi eseguire logica di chiusura alla fine della vita del valore.

## Come funziona

```rust
impl Drop for Resource {
    fn drop(&mut self) {
        // cleanup
    }
}
```

Rust chiama `drop` automaticamente quando il valore esce dallo scope. Dopo il tuo `drop`, Rust droppa anche i campi del valore.

Non puoi chiamare direttamente `value.drop()`. Per distruggere esplicitamente un valore si usa `std::mem::drop(value)`.

## API / Sintassi

```rust
struct Guard {
    name: String,
}

impl Drop for Guard {
    fn drop(&mut self) {
        println!("rilascio {}", self.name);
    }
}
```

Drop esplicito:

```rust
let guard = Guard { name: String::from("lock") };
std::mem::drop(guard);
```

## Esempio pratico

```rust
struct Transaction {
    committed: bool,
}

impl Transaction {
    fn commit(mut self) {
        self.committed = true;
        println!("commit");
    }
}

impl Drop for Transaction {
    fn drop(&mut self) {
        if !self.committed {
            println!("rollback");
        }
    }
}
```

Se la transazione esce dallo scope senza commit, `Drop` esegue rollback.

## Varianti

- Drop automatico dei campi.
- Implementazione manuale di `Drop`.
- `std::mem::drop`: forza la distruzione anticipata.
- `ManuallyDrop<T>`: disabilita drop automatico in casi avanzati.
- RAII guard: tipo che rilascia una risorsa in `drop`.

## Errori comuni

- Implementare `Drop` quando i campi gestiscono gia tutto.
- Fare panic dentro `drop`, specialmente durante unwinding.
- Aspettarsi ordine di drop diverso: i campi vengono droppati dopo `drop`.
- Usare `Drop` per logica applicativa essenziale che dovrebbe essere esplicita.
- Provare a muovere campi fuori da un tipo che implementa `Drop` senza tecniche dedicate.

## Checklist

- Il tipo possiede davvero una risorsa da rilasciare?
- Il cleanup puo fallire? Se si, `Drop` non puo restituire `Result`.
- Un metodo esplicito come `close` o `commit` serve comunque?
- Il codice in `drop` puo fare panic?
- I campi gestiscono gia il proprio cleanup?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Box T|Box T]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/File descriptor|File descriptor]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
