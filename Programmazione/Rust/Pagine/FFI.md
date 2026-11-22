---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - rust-di-sistema
aliases:
  - Foreign Function Interface
  - extern C
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
related:
  - "[[Programmazione/Rust/Pagine/bindgen e cbindgen]]"
  - "[[Programmazione/Rust/Pagine/libc e nix]]"
  - "[[Programmazione/Rust/Pagine/Linking]]"
title: FFI
---

# FFI

## Sintesi

FFI (*Foreign Function Interface*) è il confine attraverso cui Rust chiama codice compilato in un altro linguaggio o rende le proprie funzioni chiamabili dall'esterno. Qui usiamo l'ABI C e Rust edition 2024.

Al confine servono **due accordi distinti**. La firma stabilisce *come* passare argomenti e risultati; il contratto stabilisce *quali valori* sono ammessi, *chi* possiede la memoria e *per quanto* resta valida. Il linker può trovare il simbolo anche quando uno di questi accordi è sbagliato.

## Quando usarlo

Usa la FFI per integrare una libreria C esistente, chiamare un'API di sistema o esporre una libreria Rust a un altro runtime. Se esiste già un wrapper Rust mantenuto che copre la funzione necessaria, parti da quello. Se scrivi il wrapper, tieni le dichiarazioni native in un modulo piccolo e offri al resto del programma tipi Rust che esprimano i vincoli.

## Come funziona

### Da Rust a C: controllare il dominio prima della chiamata

In C, `<stdlib.h>` dichiara `int abs(int)`. Se il risultato non è rappresentabile come `int`, il comportamento di C è indefinito. In Rust il wrapper può rifiutare quel valore **prima** di chiamare C:

```rust
use std::ffi::c_int;

unsafe extern "C" {
    fn abs(n: c_int) -> c_int;
}

fn native_abs(n: c_int) -> Option<c_int> {
    if n == c_int::MIN {
        return None;
    }
    // SAFETY: la firma coincide con l'header; |n| è rappresentabile.
    Some(unsafe { abs(n) })
}

fn main() {
    assert_eq!(native_abs(-7), Some(7));
    assert_eq!(native_abs(0), Some(0));
    assert_eq!(native_abs(c_int::MIN), None);
}
```

L'esempio presuppone un target con libreria C collegata. Per calcolare il valore assoluto in un progetto interamente Rust basta `checked_abs()`. L'aspetto utile qui è la firma del wrapper: chi chiama `native_abs` non deve conoscere la precondizione di C. Scrivere `unsafe extern "C"` riconosce la responsabilità della **dichiarazione**; non verifica l'header e non procura la libreria al linker.

## API / Sintassi

| Tipo nell'API C | Rappresentazione al confine Rust | Cosa controllare |
| --- | --- | --- |
| `int` | `std::ffi::c_int` | Segue l'ABI del target; se l'header usa `int32_t`, il corrispondente è invece `i32`. |
| `const char *` | `*const std::ffi::c_char` | Il tipo da solo non dice se è una stringa, se ammette NULL o quanti byte sono leggibili. |
| `struct` passata per valore | `#[repr(C)] struct` | Ordine e tipi dei campi devono corrispondere all'header; l'attributo non rende compatibile un campo `String` o `Vec<T>`. |

`extern "C"` seleziona la convenzione di chiamata; **non** significa da solo «funzione non sicura». Una funzione Rust esportata che accetta qualunque valore del suo tipo può restare safe. Se invece il chiamante deve garantire la validità di un puntatore, usa `unsafe fn` e documentane il contratto. In edition 2024, `#[unsafe(no_mangle)]` esporta il nome esatto: spetta all'autore evitare collisioni con altri simboli.

## Esempio pratico

### Da C a Rust: esportare due funzioni

In `lib.rs`, `app_add_sat` satura ai limiti di un intero a 32 bit: il risultato non dipende dai controlli di overflow della build. `app_is_ready` restituisce 1 solo per i byte di `ready`, altrimenti 0; accetta anche NULL. Non conserva né libera il puntatore.

```rust
use std::ffi::{c_char, c_int, CStr};

// SAFETY: il nome app_add_sat è riservato a questa libreria.
#[unsafe(no_mangle)]
pub extern "C" fn app_add_sat(a: i32, b: i32) -> i32 {
    a.saturating_add(b)
}

/// # Safety
/// Se label non è nullo, l'intera stringa fino al NUL incluso deve
/// essere leggibile in una sola allocazione, per meno di isize::MAX
/// byte complessivi, e non modificata per la durata della chiamata.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn app_is_ready(label: *const c_char) -> c_int {
    if label.is_null() {
        return 0;
    }
    // SAFETY: il ramo NULL è escluso; il chiamante garantisce il resto.
    let text = unsafe { CStr::from_ptr(label) };
    c_int::from(text.to_bytes() == b"ready")
}
```

Header pubblico `app.h` (C99 o successivo). Il commento sul prestito fa parte dell'API tanto quanto il prototipo:

```c
#ifndef APP_H
#define APP_H
#include <stdint.h>

int32_t app_add_sat(int32_t a, int32_t b);
/* NULL oppure stringa terminata da NUL, valida e immutata durante
   la chiamata. La libreria non trattiene il puntatore. */
int app_is_ready(const char *label);
#endif
```

Un programma C che include l'header e viene collegato alla libreria Rust può verificare il contratto senza passare puntatori non validi:

```c
#include "app.h"
#include <assert.h>
#include <stddef.h>

int main(void) {
    assert(app_add_sat(20, 22) == 42);
    assert(app_add_sat(INT32_MAX, 1) == INT32_MAX);
    assert(app_add_sat(INT32_MIN, -1) == INT32_MIN);
    assert(app_is_ready("ready") == 1);
    assert(app_is_ready("ready!") == 0);
    assert(app_is_ready("") == 0);
    assert(app_is_ready(NULL) == 0);
    return 0;
}
```

Per costruire la libreria destinata a C, scegli `cdylib` (dinamica) o `staticlib` (statica). Con una libreria dinamica servono sia il collegamento in compilazione sia una libreria trovabile dal loader all'avvio. L'header da solo non basta: vedi [[Programmazione/Rust/Pagine/Linking|Linking]].

## Varianti

- **Prestare una stringa da Rust.** `CString::new(input)` rifiuta i NUL interni. Conserva la `CString` in una variabile mentre C usa `as_ptr()`: estrarre il puntatore non prolunga la vita della stringa.
- **Leggere una stringa da C.** `CStr` è una vista presa in prestito; NUL non implica UTF-8. Nell'esempio bastano i byte; per ottenere `&str` usa `to_str()` e gestisci l'errore. Un buffer binario richiede invece puntatore e lunghezza.
- **Trasferire la proprietà.** Se Rust consegna una `CString` con `into_raw()`, prevedi una funzione Rust di rilascio che recuperi il puntatore originario una sola volta con `CString::from_raw`. C non deve usare `free` né cambiare la lunghezza della stringa. Per memoria allocata da una libreria C, usa la funzione di rilascio prevista da quella libreria.
- **Molte dichiarazioni.** `bindgen` parte dagli header C, `cbindgen` dall'API Rust. Nessuno dei due deduce dal solo tipo del puntatore la durata del prestito.

## Errori comuni

- **«Il simbolo è stato trovato, quindi la firma è corretta».** Il nome non convalida parametri, tipi di ritorno o calling convention. Confronta la dichiarazione con l'header relativo alla versione e al target in uso.
- **«Ho escluso NULL, quindi posso leggere».** Il controllo non dimostra che esista un terminatore o che i dati siano ancora vivi. Se il produttore offre solo buffer con lunghezza, non trattarli come stringhe C.
- **Usare un panic come errore per C.** Un panic Rust che raggiunge il confine di una funzione `extern "C"` non viene consegnato al chiamante come codice di errore: il processo termina. Rappresenta i fallimenti attesi nel protocollo C. `catch_unwind` non intercetta un panic configurato per abortire.

## Checklist

- Ho confrontato tipi e ABI con l'header per il target effettivo?
- Per ogni puntatore, ho specificato nullabilità, estensione leggibile, durata e responsabilità di rilascio?
- Il chiamante conosce il comportamento ai limiti, anche per input assenti o vuoti?
- Ho compilato **e avviato** almeno un chiamante nell'altro linguaggio, oltre a compilare la libreria?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/bindgen e cbindgen|bindgen e cbindgen]]
- [[Programmazione/Rust/Pagine/libc e nix|libc e nix]]

## Fonti

- [Rust Reference: external blocks](https://doc.rust-lang.org/reference/items/external-blocks.html) e [attributo no_mangle](https://doc.rust-lang.org/reference/abi.html#the-no_mangle-attribute).
- [Rustonomicon: FFI, incluse le regole per l'unwinding](https://doc.rust-lang.org/nomicon/ffi.html).
- [Standard library: CStr::from_ptr](https://doc.rust-lang.org/std/ffi/struct.CStr.html#method.from_ptr) e [CString::into_raw](https://doc.rust-lang.org/std/ffi/struct.CString.html#method.into_raw).
- [The Open Group: abs, dominio e valore di ritorno](https://pubs.opengroup.org/onlinepubs/9799919799/functions/abs.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
