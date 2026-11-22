---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - webassembly
aliases:
  - WASI
  - WebAssembly System Interface
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly|Limiti del runtime WebAssembly]]"
  - "[[Programmazione/Rust/Pagine/no_std|no_std]]"
related:
  - "[[Programmazione/Rust/Pagine/File I O|File I O]]"
  - "[[Programmazione/Rust/Pagine/Process e Command|Process e Command]]"
title: WASI
---

# WASI

## Sintesi

**WASI** (WebAssembly System Interface) definisce come un programma WebAssembly chiede servizi all'ambiente che lo esegue. Non è né un sistema operativo né un runtime. In questa nota **Rust** compila il programma, **Wasmtime** è il runtime sul computer (*host*) e il programma Wasm è l'ospite (*guest*). Il guest può usare `std::fs` senza sapere se l'host è Windows o Linux; non per questo eredita le sue directory.

È utile per distribuire CLI o plugin quando l'host e il programma concordano sulle interfacce disponibili. Se l'obiettivo è aggiornare il DOM, vedi [[Programmazione/Rust/Pagine/Interop con JavaScript|Interop con JavaScript]]: il browser non fornisce WASI automaticamente. Un'app web può comunque implementare le interfacce richieste; «fuori dal browser» è un caso d'uso comune, non un requisito.

## Scegliere versione e artefatto

| Interfaccia | Che cosa si distribuisce | Che cosa verificare nell'host |
| --- | --- | --- |
| WASI 0.1 (P1, Preview 1) | `wasm32-wasip1` produce un **modulo core**. Una CLI Rust che usa I/O importa funzioni da `wasi_snapshot_preview1`. Il vecchio nome del target era `wasm32-wasi`. | Deve fornire gli import P1. È una scelta di compatibilità per host che eseguono moduli core. |
| WASI 0.2 (P2, Preview 2) | `wasm32-wasip2` produce un **componente**. Le interfacce sono descritte con WIT (*WebAssembly Interface Types*); un *world* raggruppa import ed export previsti. | Deve supportare il Component Model e le interfacce richieste. Per una CLI P2 come quella sotto l'host invoca `wasi:cli/run`; un plugin o un servizio HTTP può avere un contratto diverso. |
| WASI 0.3 (P3) | Usa ancora i componenti e aggiunge asincronia nativa alle interfacce, con future e stream. | Verifica che toolchain, binding e runtime supportino le interfacce P3 effettivamente usate. Una build per P2 non diventa P3 perché eseguita da un runtime più recente. |

Modulo e componente possono chiamarsi entrambi `.wasm`: l'estensione non dice quali import servono. Il target `wasm32-unknown-unknown` non aggiunge le API WASI; nemmeno `no_std` è sinonimo di WASI. L'esempio seguente usa la libreria standard senza dipendenze esterne.

## Esempio: contare righe da stdin o da file

La CLI riceve **un solo argomento**: `-` per leggere stdin fino a EOF, oppure un percorso visto dal guest. Stampa su stdout il numero di righe e di byte UTF-8. Un testo vuoto ha zero righe; l'ultima riga conta anche senza un ritorno a capo. Un errore di lettura va su stderr e il comando termina senza successo.

### Compilare lo stesso sorgente per P1 e P2

Servono Rust con Cargo e rustup e la [CLI ufficiale Wasmtime](https://docs.wasmtime.dev/cli-install.html) nel PATH. Esegui i comandi dalla stessa shell; la sintassi per preparare i dati più avanti è di PowerShell.

```sh
rustup target add wasm32-wasip1 wasm32-wasip2
```

```sh
cargo new --bin conta-righe
```

```sh
cd conta-righe
```

Sostituisci il contenuto di `src/main.rs`:

```rust
use std::{env, fs, io, process::ExitCode};

fn main() -> ExitCode {
    let mut args = env::args().skip(1);
    let (Some(source), None) = (args.next(), args.next()) else {
        eprintln!("uso: conta-righe <file|->");
        return ExitCode::FAILURE;
    };

    let input = if source == "-" {
        io::read_to_string(io::stdin().lock())
    } else {
        fs::read_to_string(&source)
    };

    match input {
        Ok(text) => {
            let label = env::var("REPORT_LABEL").unwrap_or_else(|_| "righe".into());
            println!("{label}={} byte={}", text.lines().count(), text.len());
            ExitCode::SUCCESS
        }
        Err(err) => {
            eprintln!("lettura non riuscita ({source}): {err}");
            ExitCode::FAILURE
        }
    }
}
```

```sh
cargo build --release --target wasm32-wasip1
```

```sh
cargo build --release --target wasm32-wasip2
```

### Leggere lo standard input senza aprire directory

```powershell
"alfa", "beta" | wasmtime run target/wasm32-wasip1/release/conta-righe.wasm -
```

La CLI di Wasmtime inoltra stdin e stdout. Devi vedere `righe=2`; il numero di byte include i terminatori di riga inseriti dalla shell e può cambiare tra piattaforme. Il programma legge tutto prima di contare: per flussi grandi servirebbe un conteggio incrementale, non `read_to_string`.

### Concedere una sola directory

Nella crate **appena creata**, prepara una directory dedicata e un file di prova. Il secondo comando scrive (o sostituisce) solo `campioni/input.txt`: il testo è ASCII, con un LF interno e senza terminatore finale.

```powershell
New-Item -ItemType Directory -Path campioni
```

```powershell
Set-Content -LiteralPath campioni/input.txt -Encoding ascii -NoNewline -Value "alfa`nbeta"
```

**Prima, senza concessione:** il file esiste sull'host ma il guest non ha una directory in cui cercare `/letture/input.txt`. Il programma deve fallire con `lettura non riuscita`; il dettaglio del sistema operativo può variare.

```sh
wasmtime run target/wasm32-wasip1/release/conta-righe.wasm /letture/input.txt
```

**Poi, con la concessione:** `--dir campioni::/letture` fa aprire a Wasmtime la directory host `campioni` e la presenta al guest come `/letture`. È una *preopen*: il nome guest identifica la risorsa concessa, non la directory corrente dell'host. Non serve esporre l'intero progetto.

```sh
wasmtime run --dir campioni::/letture target/wasm32-wasip1/release/conta-righe.wasm /letture/input.txt
```

Output atteso: **`righe=2 byte=9`**. Il programma legge soltanto, ma non per questo la directory concessa è automaticamente in sola lettura: i diritti dipendono da come l'host la apre.

**Infine, cambia artefatto e passa un valore d'ambiente esplicito:**

```sh
wasmtime run --dir campioni::/letture --env REPORT_LABEL=lines target/wasm32-wasip2/release/conta-righe.wasm /letture/input.txt
```

Il componente P2 produce **`lines=2 byte=9`**. Non è il cambio di versione a tradurre l'etichetta: è `--env`. Le opzioni per Wasmtime vanno **prima** del file Wasm; gli argomenti dopo quel file sono consegnati al programma.

## Diagnosi e limiti

| Sintomo | Cosa distinguere |
| --- | --- |
| Il runtime rifiuta l'artefatto prima che appaia l'output | Controlla se accetta moduli o componenti e se implementa le interfacce importate. Aggiungere `--dir` non risolve un import mancante. |
| Il programma parte ma non legge il file | Controlla directory **host**, alias **guest** e nome del file dentro la directory. Un file mancante e una concessione assente possono dare errori simili. |
| La CLI legge il file ma non vede una variabile dell'host | Directory e ambiente sono concessioni indipendenti. Passa solo le variabili necessarie, non tutto l'ambiente del processo. |
| Una crate compila ma fallisce quando usa rete, processi o thread | La presenza di `std` non garantisce le stesse operazioni di un eseguibile nativo. Per esempio il target P1 qui usato non permette di avviare un processo con `Command::spawn`. Per la rete servono sia l'interfaccia appropriata sia il permesso dell'host. |

Per un plugin controlla separatamente **quali risorse può raggiungere** e **quante risorse può consumare**: concedere una sola directory non stabilisce un limite di memoria o di tempo di esecuzione. Il comportamento della CLI Wasmtime non è una promessa sui valori predefiniti di tutti gli host.

## Fonti ufficiali

- [WASI: versioni, moduli e componenti](https://wasi.dev/releases)
- [Rust: target wasm32-wasip1 e limiti di std](https://doc.rust-lang.org/rustc/platform-support/wasm32-wasip1.html)
- [Rust: target wasm32-wasip2 e requisiti del runtime](https://doc.rust-lang.org/rustc/platform-support/wasm32-wasip2.html)
- [Wasmtime: esecuzione di comandi e ordine degli argomenti](https://docs.wasmtime.dev/cli-options.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
- [[Programmazione/Rust/Pagine/Limiti del runtime WebAssembly|Limiti del runtime WebAssembly]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/File I O|File I O]]
- [[Programmazione/Rust/Pagine/Process e Command|Process e Command]]
