---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - unsafe-rust-in-profondita
aliases:
  - "unsafe fn"
  - "Funzioni unsafe"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Invariants]]"
related:
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Unsafe traits]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
---

# Unsafe functions

## Sintesi

Una `unsafe fn` e una funzione che richiede al chiamante di rispettare un contratto non verificabile completamente dal compilatore. La chiamata deve avvenire dentro un blocco unsafe.

Il punto importante e che unsafe nella firma sposta una responsabilita sul chiamante.

## Quando usarlo

- Quando una funzione accetta raw pointer da dereferenziare.
- Quando richiede precondizioni su aliasing, allineamento, inizializzazione o lunghezza.
- Quando espone un'operazione valida solo in uno stato specifico non verificabile dal tipo.
- Quando crea astrazioni a basso livello usate da wrapper sicuri.

## Come funziona

```rust
unsafe fn get_unchecked<T>(slice: &[T], index: usize) -> &T {
    slice.get_unchecked(index)
}
```

Il chiamante deve garantire che `index < slice.len()`.

Chiamata:

```rust
let values = [1, 2, 3];
let value = unsafe { get_unchecked(&values, 1) };
```

## API / Sintassi

Documentazione del contratto:

```rust
/// # Safety
///
/// `ptr` must be non-null, aligned, initialized, and valid for reads.
unsafe fn read_i32(ptr: *const i32) -> i32 {
    *ptr
}
```

Wrapper safe:

```rust
fn read_first(slice: &[i32]) -> Option<i32> {
    let ptr = slice.as_ptr();
    (!slice.is_empty()).then(|| unsafe { read_i32(ptr) })
}
```

## Esempio pratico

```rust
/// # Safety
///
/// `ptr` must point to `len` initialized `u8` values valid for reads.
unsafe fn bytes_from_raw<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
    std::slice::from_raw_parts(ptr, len)
}
```

Questa funzione non puo verificare che memoria e lunghezza siano valide. Il contratto deve essere rispettato dal chiamante.

## Varianti

- `unsafe fn`: chiamata unsafe.
- Funzione safe con blocco unsafe interno.
- Metodo unsafe su tipo.
- FFI function dichiarata unsafe.
- Unsafe constructor per tipi con invarianti manuali.

## Errori comuni

- Non scrivere la sezione `# Safety` nella documentazione.
- Rendere unsafe una funzione solo perche contiene un blocco unsafe interno.
- Esporre precondizioni troppo vaghe.
- Fidarsi di input utente per rispettare invarianti unsafe.
- Dimenticare che il corpo di una unsafe fn deve comunque usare blocchi unsafe per operazioni unsafe nelle edition moderne.

## Checklist

- Quali precondizioni deve rispettare il chiamante?
- La funzione deve essere unsafe o puo essere safe con controlli interni?
- La documentazione `# Safety` e concreta?
- Esistono test per casi validi e invalidi dove possibile?
- Si puo costruire un wrapper safe?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
