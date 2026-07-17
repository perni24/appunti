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
  - rust-di-sistema
aliases:
  - "Foreign Function Interface"
  - "extern C"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
related:
  - "[[Programmazione/Rust/Pagine/bindgen e cbindgen]]"
  - "[[Programmazione/Rust/Pagine/libc e nix]]"
  - "[[Programmazione/Rust/Pagine/Linking]]"
---

# FFI

## Sintesi

FFI, Foreign Function Interface, e il meccanismo con cui Rust comunica con codice scritto in altri linguaggi, soprattutto C. Permette di chiamare funzioni esterne, esportare funzioni Rust e scambiare dati a basso livello.

Quasi tutta la FFI richiede unsafe, perche il compilatore Rust non puo verificare contratti di memoria, ABI, layout e ownership del codice esterno.

## Quando usarlo

- Quando devi chiamare una libreria C o API di sistema.
- Quando vuoi esporre una libreria Rust a C, C++ o altri linguaggi.
- Quando integri codice legacy.
- Quando lavori con driver, sistemi operativi, embedded o runtime nativi.

## Come funziona

Dichiarare funzioni esterne:

```rust
unsafe extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    let value = unsafe { abs(-5) };
    println!("{value}");
}
```

`extern "C"` indica l'ABI. La chiamata e unsafe perche Rust non puo verificare che la funzione esterna rispetti il contratto dichiarato.

## API / Sintassi

Esportare funzione Rust:

```rust
#[unsafe(no_mangle)]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

Stringhe C:

```rust
use std::ffi::{CStr, CString};

let c_string = CString::new("hello").unwrap();
let ptr = c_string.as_ptr();
```

Tipi C:

```rust
use std::os::raw::{c_char, c_int};
```

## Esempio pratico

```rust
use std::ffi::CStr;
use std::os::raw::c_char;

/// # Safety
///
/// `ptr` must be non-null and point to a valid NUL-terminated C string.
pub unsafe fn print_c_string(ptr: *const c_char) {
    let text = unsafe { CStr::from_ptr(ptr) };
    println!("{}", text.to_string_lossy());
}
```

La funzione documenta chiaramente il contratto richiesto dal puntatore C.

## Varianti

- Chiamare funzioni C da Rust.
- Esportare funzioni Rust verso C.
- Usare `bindgen` per generare binding Rust da header C.
- Usare `cbindgen` per generare header C da Rust.
- Collegare librerie native tramite build script.

## Errori comuni

- Passare puntatori a dati Rust che non vivono abbastanza.
- Usare `String` o `Vec<T>` direttamente nel confine FFI.
- Dimenticare terminatore NUL per stringhe C.
- Assumere layout Rust stabile senza `repr(C)`.
- Lasciare attraversare panic Rust oltre confini FFI.

## Checklist

- ABI e calling convention sono corrette?
- I tipi hanno layout compatibile?
- Ownership e responsabilita di free sono documentate?
- Le stringhe sono gestite come `CStr`/`CString`?
- Panic ed errori sono convertiti in codici o risultati compatibili?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/bindgen e cbindgen|bindgen e cbindgen]]
- [[Programmazione/Rust/Pagine/Linking|Linking]]
