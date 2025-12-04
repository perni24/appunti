# Comandi Base di Rust

Questa pagina contiene i comandi essenziali per iniziare a programmare in Rust, con un focus particolare su `cargo`, il build system e package manager di Rust.

## Gestione del Progetto con Cargo

Cargo gestisce la maggior parte delle attività comuni nello sviluppo di un progetto Rust, come la creazione, la compilazione, il testing e la gestione delle dipendenze.

### Creare un Nuovo Progetto

Per creare un nuovo progetto Rust, si usa il comando `cargo new`.

- **Creare un eseguibile (binary):**
  ```bash
  cargo new nome_eseguibile
  ```
  o esplicitamente:
  ```bash
  cargo new nome_eseguibile --bin
  ```
  Questo è il comportamento di default.

- **Creare una libreria (library):**
  ```bash
  cargo new nome_libreria --lib
  ```

Questo comando crea una nuova directory con il nome specificato, contenente una struttura di base per il progetto, incluso un file `Cargo.toml` (il file di configurazione del progetto) e una directory `src` con un file `main.rs` o `lib.rs`.

### Compilazione ed Esecuzione

- **Compilare il progetto:**
  ```bash
  cargo build
  ```
  Questo comando compila il codice sorgente e crea un eseguibile nella directory `target/debug/`.

- **Eseguire il progetto:**
  ```bash
  cargo run
  ```
  Questo comando compila ed esegue il progetto. È utile per uno sviluppo rapido.

- **Controllare il codice senza compilare:**
  ```bash
  cargo check
  ```
  Questo comando controlla il codice per errori di compilazione in modo molto più veloce rispetto a `cargo build`, poiché non produce un file eseguibile. È ideale per verificare la correttezza del codice durante lo sviluppo.

### Build di Rilascio (Release)

Per compilare il progetto con ottimizzazioni per la produzione, si usa il flag `--release`.

```bash
cargo build --release
```

L'eseguibile ottimizzato sarà disponibile in `target/release/`.

### Compilazione Cross-Platform

È possibile compilare un eseguibile per un sistema operativo o un'architettura diversa da quella in uso (cross-compilazione).

Prima, è necessario installare il "target" desiderato con `rustup`:

```bash
rustup target add <nome_del_target>
```

Poi, si può compilare il progetto specificando il target:

```bash
cargo build --release --target <nome_del_target>
```

Alcuni target comuni:

- **Windows:**
  ```bash
  rustup target add x86_64-pc-windows-gnu
  cargo build --release --target x86_64-pc-windows-gnu
  ```

- **Linux:**
  ```bash
  rustup target add x86_64-unknown-linux-gnu
  cargo build --release --target x86_64-unknown-linux-gnu
  ```

- **ARM (es. Raspberry Pi):**
  ```bash
  rustup target add armv7-unknown-linux-gnueabihf
  cargo build --release --target armv7-unknown-linux-gnueabihf
  ```

- **macOS:**
  ```bash
  rustup target add x86_64-apple-darwin
  cargo build --release --target x86_64-apple-darwin
  ```

## Gestione delle Dipendenze

Cargo semplifica l'aggiunta e la gestione delle dipendenze (chiamate "crates" in Rust).

### Aggiungere una Dipendenza

Per aggiungere una nuova dipendenza al progetto, si può usare il comando `cargo add`:

```bash
cargo add nome_crate
```

Questo comando scarica la dipendenza e la aggiunge automaticamente al file `Cargo.toml`.

### Cercare una Dipendenza

Per cercare un crate disponibile su [crates.io](https://crates.io/), puoi usare il comando `cargo search`:

```bash
cargo search nome_crate
```

## Qualità e Formattazione del Codice

- **Formattare il codice:**
  ```bash
  cargo fmt
  ```
  Questo comando formatta automaticamente il codice secondo lo stile standard di Rust.

- **Analisi statica (Linting):**
  ```bash
  cargo clippy
  ```
  Clippy è uno strumento di analisi statica che rileva errori comuni e suggerisce miglioramenti stilistici e di performance.

## Testing

Per eseguire i test del progetto (contenuti nei moduli di test, di solito annotati con `#[cfg(test)]`), si usa:

```bash
cargo test
```

## Documentazione

Per generare la documentazione del progetto e delle sue dipendenze e aprirla nel browser:

```bash
cargo doc --open
```