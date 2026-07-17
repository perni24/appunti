---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - webassembly
aliases:
  - "WASI"
  - "WebAssembly System Interface"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly]]"
  - "[[Programmazione/Rust/Pagine/no_std]]"
related:
  - "[[Programmazione/Rust/Pagine/File I O]]"
  - "[[Programmazione/Rust/Pagine/Process e Command]]"
---

# WASI

## Sintesi

WASI, **WebAssembly System Interface**, e un'interfaccia di sistema per eseguire WebAssembly fuori dal browser con accesso controllato a risorse come file, ambiente, clock e standard I/O. In pratica prova a dare a moduli Wasm un set di capability simile a una piccola piattaforma di sistema, ma con sandboxing esplicito.

Per Rust, WASI e rilevante quando vuoi compilare programmi CLI, componenti server-side o plugin sandboxati in WebAssembly senza dipendere da JavaScript o dal browser.

## Quando usarlo

Usa WASI quando:

- vuoi eseguire WebAssembly lato server o CLI;
- ti serve sandboxing con permessi espliciti;
- vuoi distribuire plugin portabili;
- vuoi evitare integrazione JavaScript/browser;
- il programma ha bisogno di file, stdin/stdout o clock in modo controllato;
- il runtime di destinazione supporta le capability necessarie.

Non usare WASI per codice destinato al browser: li il modello host e dato dalle Web APIs e da JavaScript.

## Come funziona

Un modulo WASI viene compilato per un target Wasm con interfacce di sistema disponibili. Il runtime esegue il modulo e decide quali capability concedere:

- accesso a directory specifiche;
- variabili d'ambiente;
- argomenti CLI;
- stdin, stdout, stderr;
- clock;
- eventuali API aggiuntive supportate.

Questo e diverso da un processo nativo: il modulo non vede automaticamente tutto il filesystem o la rete. Il runtime deve concedere esplicitamente cio che serve.

## API / Sintassi

Build concettuale:

```powershell
rustup target add wasm32-wasip1
cargo build --target wasm32-wasip1 --release
```

Programma Rust semplice:

```rust
fn main() {
    println!("hello from WASI");
}
```

Accesso a un file:

```rust
use std::fs;

fn main() -> std::io::Result<()> {
    let text = fs::read_to_string("input.txt")?;
    println!("{}", text.len());
    Ok(())
}
```

Il file sara accessibile solo se il runtime WASI concede al modulo la directory corretta.

## Esempio pratico

CLI sandboxata che legge stdin:

```rust
use std::io::{self, Read};

fn main() -> io::Result<()> {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input)?;

    let lines = input.lines().count();
    println!("{lines}");

    Ok(())
}
```

Questo tipo di programma e adatto a pipeline, plugin o ambienti dove vuoi eseguire codice non nativo con permessi limitati.

## Varianti

- **Browser Wasm**: usa JavaScript e Web APIs, non WASI.
- **WASI CLI**: programmi con stdin/stdout e filesystem controllato.
- **Plugin sandboxati**: host concede capability specifiche.
- **Server-side Wasm**: runtime esegue moduli come componenti.
- **no_std Wasm**: modulo senza standard library completa.
- **Component model**: modello piu evoluto per composizione e interfacce.

## Errori comuni

- Pensare che WASI abbia accesso automatico a filesystem o rete.
- Confondere target browser e target WASI.
- Usare crate che dipendono da API OS non disponibili.
- Non testare il modulo nel runtime effettivo di destinazione.
- Assumere prestazioni identiche a un binario nativo.
- Ignorare la configurazione delle capability.
- Trattare WASI come un sostituto completo di Linux.

## Checklist

- Il target Wasm e quello giusto per WASI?
- Il runtime supporta le API necessarie?
- Le capability sono concesse esplicitamente?
- Le crate usate funzionano su WASI?
- L'applicazione gestisce assenza di rete o filesystem?
- Il modulo viene testato nel runtime reale?
- La sandbox e parte del modello di sicurezza?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cross-compilation]]
- [[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly]]
- [[Programmazione/Rust/Pagine/no_std]]
- [[Programmazione/Rust/Pagine/File I O]]
- [[Programmazione/Rust/Pagine/Process e Command]]
