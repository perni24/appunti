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
  - bindgen
  - cbindgen
prerequisites:
  - "[[Programmazione/Rust/Pagine/FFI]]"
  - "[[Programmazione/Rust/Pagine/Build scripts]]"
related:
  - "[[Programmazione/Rust/Pagine/libc e nix]]"
  - "[[Programmazione/Rust/Pagine/Linking]]"
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
title: bindgen e cbindgen
---

# bindgen e cbindgen

## Sintesi

Scegli il generatore partendo dal file che **fa da fonte**. Se il fornitore pubblica un header C e il tuo chiamante è Rust, usa `bindgen`. Se sei tu a scrivere la libreria in Rust e vuoi distribuirne l'header ai chiamanti C, usa `cbindgen`. Non servono entrambi nello stesso progetto.

| Fonte | Strumento | Risultato | Cosa manca ancora |
| --- | --- | --- | --- |
| Header C | `bindgen` | Dichiarazioni Rust in `bindings.rs` | Collegare la libreria C e rispettarne il contratto. |
| API Rust compatibile con C | `cbindgen` | Prototipi e tipi in un header C | Costruire la libreria Rust e collegarla al chiamante C. |

## Quando usarlo

Usa un generatore quando l'API è ampia o cambia versione: evita di dover riallineare a mano due copie delle firme. Per una singola funzione stabile può bastare una dichiarazione manuale, come in [[Programmazione/Rust/Pagine/FFI|FFI]]. I due esempi seguenti sono **progetti indipendenti**, entrambi in edition 2024.

## Come funziona

### Da C a Rust con bindgen

**Obiettivo:** chiamare da Rust una funzione già implementata in C. Servono Cargo, un compilatore C per il target e la libreria condivisa **libclang** caricabile sul computer che esegue la build. Avere il solo comando `clang` non basta; se il rilevamento fallisce, `LIBCLANG_PATH` può indicare la directory della libreria.

Nella prima crate, il manifest `Cargo.toml` dichiara due **dipendenze di build** con compiti diversi:

```toml
[package]
name = "note_import"
version = "0.1.0"
edition = "2024"

[build-dependencies]
bindgen = "=0.72.1"
cc = "1"
```

`native/note.h` è il contratto pubblico. Il risultato è sempre uno dei due argomenti: non c'è un'addizione che potrebbe traboccare.

```c
#ifndef NOTE_H
#define NOTE_H
int note_max(int a, int b);
#endif
```

`native/note.c` è l'implementazione. Includere l'header permette al compilatore C di controllare la definizione rispetto al prototipo.

```c
#include "note.h"

int note_max(int a, int b) {
    return a > b ? a : b;
}
```

`build.rs`, accanto al manifest, compie due operazioni distinte. `bindgen` legge l'header e scrive in `OUT_DIR`; la crate `cc` compila il sorgente C in una libreria statica e comunica a Cargo come collegarla.

```rust
use std::{env, path::PathBuf};

fn main() {
    println!("cargo::rerun-if-changed=native/note.c");
    bindgen::Builder::default()
        .header("native/note.h")
        .allowlist_function("note_max")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("lettura di native/note.h con libclang")
        .write_to_file(PathBuf::from(env::var_os("OUT_DIR").unwrap()).join("bindings.rs"))
        .expect("scrittura di bindings.rs");

    cc::Build::new().file("native/note.c").compile("note_native");
}
```

`CargoCallbacks` segnala a Cargo anche gli header letti da Clang. Se la libreria è già fornita dal sistema, non ricompilarla con `cc`: devi invece far trovare al linker **quella** libreria, della versione e architettura corrispondenti all'header.

## API / Sintassi

In `src/lib.rs`, tieni i binding in un modulo privato. Il wrapper usa `c_int` perché il prototipo specifica `int`, non `int32_t`. È safe perché la specifica **e l'implementazione** di `note_max` ammettono ogni coppia di `int`; non lo diventa automaticamente perché il binding è generato.

```rust
use std::ffi::c_int;

mod raw {
    include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
}

pub fn maximum(a: c_int, b: c_int) -> c_int {
    // SAFETY: la funzione accetta ogni coppia di int e non accede a puntatori.
    unsafe { raw::note_max(a, b) }
}

#[test]
fn maximum_uses_c() {
    assert_eq!(maximum(-7, -3), -3);
    assert_eq!(maximum(5, 5), 5);
    assert_eq!(maximum(c_int::MAX, c_int::MIN), c_int::MAX);
}
```

Dalla radice di `note_import`, il seguente comando genera i binding, compila, collega ed esegue il test. Un semplice `cargo check` non eserciterebbe il collegamento finale né la chiamata.

```sh
cargo test
```

## Esempio pratico

### Da Rust a C con cbindgen

**Obiettivo inverso:** la fonte è ora `src/lib.rs`; il chiamante C riceve un header generato. Nella seconda crate, `Cargo.toml` richiede una libreria dinamica utilizzabile da C:

```toml
[package]
name = "note_export"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib"]
```

In `src/lib.rs` il tipo `i32` ha larghezza fissa: nell'header C corrisponderà a `int32_t`. La funzione è già progettata per l'ABI C; il generatore non converte un'API Rust arbitraria in un'API C.

```rust
// SAFETY: il nome note_max_i32 è riservato a questa libreria.
#[unsafe(no_mangle)]
pub extern "C" fn note_max_i32(a: i32, b: i32) -> i32 {
    a.max(b)
}
```

Se la CLI non è già disponibile, questo comando la installa nel percorso degli strumenti Cargo dell'utente:

```sh
cargo install --locked --version 0.29.2 cbindgen
```

Dalla radice di `note_export`, genera `note_export.h`:

```sh
cbindgen --lang c --crate note_export --output note_export.h
```

Costruisci il binario separatamente:

```sh
cargo build
```

Salva il chiamante come `client.c` accanto all'header. **Includi il file prodotto**, senza ricopiare il prototipo: così la prova esercita proprio il risultato di `cbindgen`.

```c
#include "note_export.h"
#include <assert.h>

int main(void) {
    assert(note_max_i32(-7, -3) == -3);
    assert(note_max_i32(INT32_MIN, INT32_MAX) == INT32_MAX);
    return 0;
}
```

Su Linux, con GCC o Clang, metti il chiamante accanto alla libreria e indica al loader di cercarla nella directory dell'eseguibile:

```sh
cc client.c -Ltarget/debug -lnote_export -Wl,-rpath,'$ORIGIN' -o target/debug/client
```

```sh
./target/debug/client
```

Su Windows x64 con Rust MSVC e Developer PowerShell x64, il linker usa la libreria di importazione `.dll.lib`; all'avvio il programma trova la DLL nella propria directory:

```powershell
cl /nologo client.c /Fetarget\debug\client.exe /link target\debug\note_export.dll.lib
```

```powershell
.\target\debug\client.exe
```

Se le asserzioni passano, il chiamante termina senza output. I percorsi presuppongono il profilo di sviluppo e la directory Cargo di destinazione predefinita.

## Varianti

- **Generare durante la build o distribuire il risultato.** Nel primo caso chi compila la crate deve avere libclang. Nel secondo, i consumatori possono usare binding già generati senza libclang, ma devono comunque disporre della libreria C corretta. In CI rigenera con versioni fissate e confronta il risultato con il file distribuito.
- **Ridurre l'API.** Una allowlist limita la generazione alle funzioni o ai tipi necessari e alle relative dipendenze; una blocklist esclude elementi precisi. Per un'API grande, una crate `-sys` può esporre le dichiarazioni a basso livello e una seconda crate offrire il wrapper safe.
- **Cross-compilazione e C++.** Libclang gira sull'host, ma deve leggere header, macro e include del **target**, coerenti con la build nativa. Non tutto C++ è traducibile direttamente: per classi o template complessi una piccola facciata con ABI C è spesso il confine più semplice da mantenere.

## Errori comuni

- **Libclang non trovata durante la generazione:** controlla installazione e percorso della libreria condivisa sull'host. Aggiungere una libreria al linker del target non risolve un errore di caricamento di libclang.
- **Binding presenti, ma simbolo non risolto al link:** verifica che esista un'implementazione, che il linker la riceva e che il nome esportato corrisponda. Rigenerare un header identico non crea il simbolo.
- **Il client compila, ma non parte:** per una libreria dinamica controlla il percorso di ricerca del loader. La libreria di importazione Windows basta al linker, non all'esecuzione.
- **«La firma è generata, quindi il puntatore è valido»:** nullabilità, prestiti, callback e responsabilità di rilascio restano parte del contratto. Documentali e controllali nel wrapper dove possibile.

## Checklist

- Qual è la fonte da modificare: header del fornitore o API Rust esportata?
- Le opzioni di Clang, il target, le versioni dei generatori e la versione della libreria sono riproducibili?
- Se cambio un header incluso, il processo di build o la CI rigenera i binding?
- Un chiamante reale compila, si collega e usa il file generato senza duplicarne le dichiarazioni?

## Collegamenti

- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/Build scripts|Build scripts]]
- [[Programmazione/Rust/Pagine/libc e nix|libc e nix]]
- [[Programmazione/Rust/Pagine/Linking|Linking]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]

## Fonti

- [bindgen User Guide: requisiti di libclang](https://rust-lang.github.io/rust-bindgen/requirements.html) e [uso in build.rs](https://rust-lang.github.io/rust-bindgen/tutorial-3.html).
- [bindgen 0.72.1: CargoCallbacks](https://docs.rs/bindgen/0.72.1/bindgen/struct.CargoCallbacks.html) e [crate cc: compilazione e collegamento](https://docs.rs/cc/latest/cc/).
- [cbindgen 0.29.2: guida ufficiale](https://github.com/mozilla/cbindgen/blob/v0.29.2/docs.md).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
