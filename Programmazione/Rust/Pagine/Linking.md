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
  - Linking
  - Linker
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
  - "[[Programmazione/Rust/Pagine/Build scripts|Build scripts]]"
  - "[[Programmazione/Rust/Pagine/FFI|FFI]]"
related:
  - "[[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/libc e nix|libc e nix]]"
  - "[[Programmazione/Rust/Pagine/bindgen e cbindgen|bindgen e cbindgen]]"
title: Linking
---

# Linking

## Sintesi

Il compilatore può accettare una chiamata a una funzione C senza averne il corpo. Per costruire l'eseguibile, il **linker** deve risolverne il nome usando file oggetto, archivi o librerie d'importazione. Se la funzione viene da una libreria dinamica, il **loader** del sistema operativo deve anche trovare una versione compatibile di quella libreria quando il programma viene caricato. Un successo in una fase non dimostra il successo nella successiva.

## Dal sorgente al processo

| Fase | Domanda a cui risponde | Indizio tipico |
| --- | --- | --- |
| Compilazione | Il codice Rust è coerente con i tipi dichiarati? | `cargo check` accetta la dichiarazione esterna ma non costruisce l'eseguibile finale. |
| Collegamento | Esiste un input per il target che fornisca o permetta di importare il simbolo richiesto? | `cargo build` di una CLI fallisce se manca la libreria o se il nome non è risolto. |
| Caricamento | Il sistema trova le dipendenze dinamiche e le relative esportazioni? | La build passa, ma il programma può non arrivare a `main`. |

Un blocco `unsafe extern "C"` specifica come Rust chiama la funzione; non ne fornisce l'implementazione. Anche se il linker trova il nome, non controlla che la firma Rust corrisponda all'header C o che il chiamante rispetti il contratto di memoria. Questi sono controlli distinti: vedi [[Programmazione/Rust/Pagine/FFI|FFI]].

### Che cosa si distribuisce

- **Libreria statica**: il linker estrae dall'archivio il codice necessario. All'utente non serve quell'archivio per eseguire il programma. Questo non rende statiche le *altre* dipendenze.
- **Libreria dinamica**: l'eseguibile registra una dipendenza. Con MSVC, al link si usa in genere una **import library** `.lib`; all'avvio serve la **DLL**, non quel `.lib`. Su Linux e macOS i formati tipici sono rispettivamente `.so` e `.dylib`; le regole di ricerca del loader non sono le stesse.
- **Se produci la libreria in Rust**: per consumatori esterni scegli `staticlib` o `cdylib` e progetta esplicitamente l'ABI pubblica. Un `rlib` contiene anche metadati per `rustc` e non è il formato da offrire come libreria C. Il tipo di artefatto che produci e il modo in cui colleghi le sue dipendenze sono scelte diverse.

## Esempio pratico: stessa CLI, due modi di collegarla

Esempio per **Windows x64 MSVC**, da eseguire in una directory di prova. Servono Rust/Cargo 1.85 o successivi, il target host `x86_64-pc-windows-msvc` e una **Developer PowerShell for Visual Studio** con strumenti C++ inizializzati per **x64** (`cl.exe`, `lib.exe`, `dumpbin.exe`). Non servono crate esterne. I percorsi sotto assumono la directory `target` predefinita.

```powershell
cargo new --bin --vcs none link-lab
```

```powershell
cd link-lab
```

```powershell
New-Item -ItemType Directory native
```

### 1. Prepara la funzione C

In `native/gruppi.c` definisci una funzione totale, senza puntatori né stato: restituisce quanti gruppi **completi** da otto si possono formare.

```c
#include <stdint.h>

uint32_t gruppi_da_otto(uint32_t elementi) {
    return elementi / 8u;
}
```

Compila il sorgente in un oggetto, senza creare un eseguibile:

```powershell
cl.exe /nologo /c native\gruppi.c /Fonative\gruppi.obj
```

Crea l'archivio statico **gruppi_static.lib** a partire dall'oggetto:

```powershell
lib.exe /nologo /OUT:native\gruppi_static.lib native\gruppi.obj
```

Dallo stesso oggetto crea **gruppi_shared.dll** e la sua **gruppi_shared.lib**. Qui `/EXPORT` espone esplicitamente il nome della funzione C:

```powershell
cl.exe /nologo /LD native\gruppi.obj /Fenative\gruppi_shared.dll /link /EXPORT:gruppi_da_otto /IMPLIB:native\gruppi_shared.lib
```

### 2. Scegli la libreria durante la build

Aggiungi a `Cargo.toml` questa sezione. La feature sposta la scelta nel build script: non cambia la funzione chiamata.

```toml
[features]
con-dll = []
```

Crea `build.rs` accanto a `Cargo.toml`. Le direttive indicano **dove** cercare al link e **quale** libreria usare; non installano la DLL. Il percorso deriva dalla directory del manifest e non contiene il nome della macchina di sviluppo.

```rust
use std::{env, path::PathBuf};

fn main() {
    let native = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").unwrap()).join("native");
    println!("cargo::rerun-if-changed=native");
    println!("cargo::rustc-link-search=native={}", native.display());
    if env::var_os("CARGO_FEATURE_CON_DLL").is_some() {
        println!("cargo::rustc-link-lib=dylib=gruppi_shared");
    } else {
        println!("cargo::rustc-link-lib=static=gruppi_static");
    }
}
```

Sostituisci `src/main.rs`. La dichiarazione deve corrispondere alla definizione C:

```rust
unsafe extern "C" {
    fn gruppi_da_otto(elementi: u32) -> u32;
}

fn main() {
    // SAFETY: la funzione C accetta ogni uint32_t e non richiede altre precondizioni.
    let gruppi = unsafe { gruppi_da_otto(19) };
    println!("gruppi={gruppi}");
}
```

### 3. Osserva la differenza nell'eseguibile

Senza feature, Cargo sceglie l'archivio statico. Il risultato atteso è `gruppi=2`:

```powershell
cargo run
```

```powershell
dumpbin.exe /DEPENDENTS target\debug\link-lab.exe
```

Possono comparire DLL di sistema, ma **non** `gruppi_shared.dll`. Ricostruisci la stessa CLI in modalità dinamica:

```powershell
cargo build --features con-dll
```

```powershell
dumpbin.exe /DEPENDENTS target\debug\link-lab.exe
```

Ora deve comparire **`gruppi_shared.dll`**. Copia la DLL accanto all'eseguibile nella directory di prova e avvialo direttamente, fuori da Cargo:

```powershell
Copy-Item -LiteralPath native\gruppi_shared.dll -Destination target\debug\gruppi_shared.dll
```

```powershell
.\target\debug\link-lab.exe
```

Il risultato è ancora `gruppi=2`. È cambiato **da dove arriva la funzione**, non il calcolo. La lista di `dumpbin` descrive le dipendenze dirette dichiarate dall'eseguibile: non certifica che siano installate o che il programma si avvii sulla macchina di destinazione.

## Diagnosi rapida

| Sintomo | Primo controllo |
| --- | --- |
| `cannot find -lfoo` o MSVC `LNK1181` | Manca un file di input. Controlla nome, directory di ricerca e presenza dell'archivio o dell'import library del **target**. |
| `undefined reference` o `LNK2019` | Il simbolo richiesto non è stato risolto. Verifica input collegati e nome esportato, incluso l'eventuale name mangling C++. L'ordine degli archivi può contare con i linker Unix. |
| La build passa, ma all'avvio manca una libreria o un punto di ingresso | Verifica la distribuzione della DLL o libreria condivisa corretta e delle **sue** dipendenze. Aggiungere directory a `rustc-link-search` non configura il loader del destinatario. |
| Il formato o l'architettura sono incompatibili | Verifica che oggetti e librerie siano per la stessa destinazione. Il linker gira sull'host ma deve produrre il formato del target. |

Per una dichiarazione esterna puoi anche usare `#[link(name = "foo")]`: è un'alternativa quando il nome è noto, non un secondo passaggio obbligatorio dopo `rustc-link-lib`. Non assumere che un esempio con `#[link(name = "m")]` per la libreria matematica Unix sia portabile su MSVC. Se devi scegliere un driver del linker, usa la configurazione Cargo **del target**; evita `RUSTFLAGS` globali quando il requisito vale per una sola piattaforma. Nei firmware, un *linker script* può inoltre assegnare sezioni a regioni di memoria precise: non sostituisce il runtime o il codice di avvio.

## Fonti ufficiali

- [Rust Reference: linkage e tipi di artefatto](https://doc.rust-lang.org/reference/linkage.html)
- [Rust Reference: attributo link per librerie native](https://doc.rust-lang.org/reference/items/external-blocks.html#the-link-attribute)
- [Cargo: direttive dei build script per il linker](https://doc.rust-lang.org/cargo/reference/build-scripts.html#rustc-link-lib)
- [Microsoft: librerie statiche e collegamento con le DLL](https://learn.microsoft.com/en-us/cpp/build/dlls-in-visual-cpp)
- [Microsoft: ispezionare le dipendenze con DUMPBIN](https://learn.microsoft.com/en-us/cpp/build/reference/dependents)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Build scripts|Build scripts]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
- [[Programmazione/Rust/Pagine/libc e nix|libc e nix]]
- [[Programmazione/Rust/Pagine/bindgen e cbindgen|bindgen e cbindgen]]
