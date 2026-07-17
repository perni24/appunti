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
  - "File descriptor"
  - "fd"
prerequisites:
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/libc e nix]]"
related:
  - "[[Programmazione/Rust/Pagine/FFI]]"
  - "[[Programmazione/Rust/Pagine/Process e Command]]"
  - "[[Programmazione/Rust/Pagine/Memory mapping]]"
---

# File descriptor

## Sintesi

Un **file descriptor** e un handle numerico usato dai sistemi Unix-like per rappresentare risorse aperte: file, socket, pipe, terminali, device e altri oggetti del kernel. In Rust il punto delicato non e solo chiamare le syscall, ma modellare correttamente **ownership** della risorsa: chi possiede il descriptor deve chiuderlo una sola volta.

La standard library espone tipi come `File`, `TcpStream`, `Stdin` e `OwnedFd` che gestiscono automaticamente la chiusura tramite `Drop`. Quando si passa a API di basso livello come `libc` o `nix`, bisogna distinguere bene tra prendere in prestito un fd, duplicarlo o trasferirne la proprieta.

## Quando usarlo

Lavora direttamente con file descriptor quando:

- devi integrare Rust con API POSIX;
- passi handle a codice C;
- gestisci pipe, socket, epoll/kqueue, terminali o device;
- devi usare `mmap`;
- devi costruire astrazioni di I/O non coperte direttamente da `std`;
- devi controllare flags come close-on-exec, non-blocking o append.

Per I/O ordinario preferisci tipi di alto livello come `std::fs::File`, `std::net::TcpStream` e `std::process::Command`.

## Come funziona

Su Unix un file descriptor e un intero associato a una voce nella tabella dei file aperti del processo. Il kernel mantiene stato come posizione del file, flags, riferimento all'oggetto aperto e contatore di riferimenti.

Rust aggiunge un livello di disciplina:

- un valore proprietario chiude il descriptor nel suo `Drop`;
- un riferimento prestato permette di usare il descriptor senza chiuderlo;
- un raw fd e solo un intero, quindi non contiene informazioni di ownership;
- duplicare un fd crea un nuovo handle verso la stessa risorsa kernel.

La differenza critica e tra:

- **borrow**: uso temporaneo, non chiude;
- **ownership transfer**: il ricevente diventa responsabile della chiusura;
- **duplication**: crea un nuovo descriptor indipendente da chiudere separatamente.

## API / Sintassi

API ricorrenti:

- `AsRawFd`: ottiene un raw fd senza trasferire ownership;
- `IntoRawFd`: consuma l'oggetto e trasferisce il raw fd al chiamante;
- `FromRawFd`: costruisce un oggetto proprietario da un raw fd;
- `AsFd`: espone un `BorrowedFd`, piu sicuro di un raw fd;
- `OwnedFd`: possiede un file descriptor e lo chiude in `Drop`;
- `BorrowedFd`: descriptor preso in prestito con lifetime.

Esempio:

```rust
use std::fs::File;
use std::os::fd::{AsFd, AsRawFd};

fn inspect(file: &File) {
    let raw = file.as_raw_fd();
    let borrowed = file.as_fd();

    println!("raw fd: {raw}");
    println!("borrowed fd: {:?}", borrowed);
}
```

`as_raw_fd()` non trasferisce ownership: non devi chiamare `close` su quel valore.

## Esempio pratico

Quando un'API C richiede un fd ma non ne prende ownership, passa un fd preso in prestito:

```rust
use std::fs::File;
use std::os::fd::AsRawFd;

fn call_c_api(file: &File) {
    let fd = file.as_raw_fd();

    unsafe {
        // La funzione C usa fd, ma non deve chiuderlo.
        c_api_read_only(fd);
    }
}

unsafe fn c_api_read_only(_fd: std::os::fd::RawFd) {}
```

Quando invece ricevi un raw fd da una funzione che ti trasferisce ownership, incapsulalo subito:

```rust
use std::os::fd::{FromRawFd, OwnedFd, RawFd};

unsafe fn take_owned_fd(fd: RawFd) -> OwnedFd {
    // Safety: fd deve essere valido, aperto e non posseduto da altri oggetti Rust.
    unsafe { OwnedFd::from_raw_fd(fd) }
}
```

Questo evita leak e rende la chiusura automatica.

## Varianti

- **Raw fd**: semplice intero, utile per FFI ma fragile.
- **BorrowedFd**: prestito tipizzato con lifetime.
- **OwnedFd**: ownership esplicita del descriptor.
- **File/TcpStream/UnixStream**: astrazioni di `std` che possiedono fd.
- **Descriptor duplicato**: ottenuto con `dup`, `try_clone` o API equivalenti.
- **Windows handles**: concetto simile ma API diversa; non usare fd Unix su Windows.

## Errori comuni

- Chiamare `close` su un fd ottenuto con `as_raw_fd()`.
- Usare `FromRawFd` su un descriptor ancora posseduto da un `File`: porta a double close.
- Dimenticare `close-on-exec` quando si lanciano processi figli.
- Condividere descriptor non-blocking senza sapere che il flag puo influenzare altri handle duplicati.
- Trattare `0`, `1`, `2` come sempre disponibili senza considerare stdin/stdout/stderr chiusi o rediretti.
- Ignorare gli errori di syscall sui descriptor.

## Checklist

- Chi possiede il descriptor?
- La funzione chiamata prende ownership o usa solo un prestito?
- Serve duplicare il descriptor prima di passarlo altrove?
- Il descriptor deve essere non-blocking?
- Deve essere chiuso automaticamente con `Drop`?
- Il descriptor puo essere ereditato da processi figli?
- Stai usando `OwnedFd`/`BorrowedFd` quando possibile invece di raw fd?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/File I O]]
- [[Programmazione/Rust/Pagine/Ownership]]
- [[Programmazione/Rust/Pagine/libc e nix]]
- [[Programmazione/Rust/Pagine/FFI]]
- [[Programmazione/Rust/Pagine/Process e Command]]
- [[Programmazione/Rust/Pagine/Memory mapping]]
