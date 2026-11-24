---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - Builder pattern
  - Builder Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs|Structs]]"
  - "[[Programmazione/Rust/Pagine/Default|Default]]"
  - "[[Programmazione/Rust/Pagine/Public API design|Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]"
title: Builder pattern
---

# Builder pattern

## Sintesi

Un **builder** separa le scelte ancora modificabili dal valore pronto all'uso. Per configurare un client, per esempio, chi chiama può scegliere il timeout totale, limitare la sola fase di connessione e impostare uno user agent. I nomi dei metodi spiegano quale opzione si sta cambiando; `build()` controlla che le scelte siano compatibili tra loro.

Non serve un builder solo perché la costruzione può fallire. Se l'unico dato richiesto è un nome da validare, `new(name) -> Result<Self, E>` è più diretto. Un builder diventa utile quando le opzioni sono facoltative, si combinano o vengono decise in più punti del programma.

## Chi possiede il builder?

| Firma dei setter | Come la usa il chiamante | Conseguenza |
| --- | --- | --- |
| `fn timeout(self, value: Duration) -> Self` | Concatena le chiamate o riassegna il risultato | Il setter consuma il vecchio builder. Con `build(self)` puoi trasferire al prodotto dati posseduti, come una `String`, senza clonarli |
| `fn arg(&mut self, value: ...) -> &mut Self` | Modifica una variabile in più istruzioni, anche dentro un `if` | Il setter prende il builder in prestito. La possibilità di riusarlo **dopo l'operazione finale** dipende dalla firma di quel metodo |

Entrambi gli stili permettono di concatenare chiamate. Conta soprattutto cosa deve succedere alle risorse alla fine. Con `build(&self)` non puoi spostare una `String` fuori dal riferimento condiviso: puoi copiarne il contenuto, condividerlo o progettare il prodotto perché lo prenda in prestito. Con `build(self)` il builder viene consumato anche se il risultato è `Err`.

## Esempio: configurare due timeout

Crea una libreria in una directory libera. Non usa dipendenze esterne e non esegue richieste di rete.

```sh
cargo new --lib --edition 2024 client_options
```

Entra in `client_options`. In `src/lib.rs` sostituisci il contenuto con il seguente. Il contratto è: timeout totale predefinito di cinque secondi; se il timeout di connessione è omesso, eredita il totale **finale**. Entrambi devono essere positivi e la connessione non può durare più del totale.

```rust
use std::{error::Error, fmt, time::Duration};

#[derive(Debug)]
pub struct ClientConfig {
    timeout: Duration,
    connect_timeout: Duration,
    user_agent: String,
}

impl ClientConfig {
    pub fn builder() -> ClientBuilder {
        ClientBuilder {
            timeout: Duration::from_secs(5),
            connect_timeout: None,
            user_agent: String::from("my-client"),
        }
    }

    pub fn timeout(&self) -> Duration { self.timeout }
    pub fn connect_timeout(&self) -> Duration { self.connect_timeout }
    pub fn user_agent(&self) -> &str { &self.user_agent }
}

#[must_use]
pub struct ClientBuilder {
    timeout: Duration,
    connect_timeout: Option<Duration>,
    user_agent: String,
}

#[derive(Debug, PartialEq, Eq)]
#[non_exhaustive]
pub enum BuildError {
    ZeroTimeout,
    ConnectionExceedsTotal,
}

impl fmt::Display for BuildError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Self::ZeroTimeout => "timeouts must be positive",
            Self::ConnectionExceedsTotal => "connection timeout exceeds total timeout",
        })
    }
}

impl Error for BuildError {}

impl ClientBuilder {
    pub fn timeout(mut self, value: Duration) -> Self {
        self.timeout = value;
        self
    }

    pub fn connect_timeout(mut self, value: Duration) -> Self {
        self.connect_timeout = Some(value);
        self
    }

    pub fn user_agent(mut self, value: impl Into<String>) -> Self {
        self.user_agent = value.into();
        self
    }

    pub fn build(self) -> Result<ClientConfig, BuildError> {
        let connect_timeout = self.connect_timeout.unwrap_or(self.timeout);
        if self.timeout.is_zero() || connect_timeout.is_zero() {
            return Err(BuildError::ZeroTimeout);
        }
        if connect_timeout > self.timeout {
            return Err(BuildError::ConnectionExceedsTotal);
        }
        Ok(ClientConfig {
            timeout: self.timeout,
            connect_timeout,
            user_agent: self.user_agent,
        })
    }
}
```

`None` significa *non scelto*, non *zero*. Un esplicito timeout zero è quindi un errore, non una richiesta di usare il default. Risolvere `None` in `build()` rende irrilevante l'ordine di setter **diversi**; ripetere lo stesso setter invece sostituisce il valore precedente. I campi privati impediscono a un client esterno di costruire una configurazione aggirando il controllo. Lo user agent qui è solo testo posseduto: non si sta validando un header HTTP.

### Provare i casi che distinguono le scelte

Crea `tests/builder.rs`. I test usano la libreria come farebbe un'altra crate, senza accedere ai campi privati.

```rust
use client_options::{BuildError, ClientConfig};
use std::time::Duration;

#[test]
fn defaults_follow_the_final_total() -> Result<(), BuildError> {
    let defaults = ClientConfig::builder().build()?;
    assert_eq!(defaults.timeout(), Duration::from_secs(5));
    assert_eq!(defaults.connect_timeout(), defaults.timeout());
    assert_eq!(defaults.user_agent(), "my-client");

    let short = Duration::from_millis(250);
    let config = ClientConfig::builder().timeout(short).build()?;
    assert_eq!(config.connect_timeout(), short);
    Ok(())
}

#[test]
fn conditional_override() -> Result<(), BuildError> {
    fn configured(agent: Option<String>) -> Result<ClientConfig, BuildError> {
        let mut builder = ClientConfig::builder()
            .connect_timeout(Duration::from_secs(8))
            .timeout(Duration::from_secs(10));
        if let Some(name) = agent {
            builder = builder.user_agent(name);
        }
        builder.build()
    }

    assert_eq!(configured(None)?.user_agent(), "my-client");
    let custom = configured(Some(String::from("notes-sync/1.0")))?;
    assert_eq!(custom.user_agent(), "notes-sync/1.0");
    assert_eq!(custom.connect_timeout(), Duration::from_secs(8));
    Ok(())
}

#[test]
fn rejects_invalid_combinations() {
    let zero = ClientConfig::builder().connect_timeout(Duration::ZERO);
    assert_eq!(zero.build().unwrap_err(), BuildError::ZeroTimeout);

    let too_long = ClientConfig::builder().connect_timeout(Duration::from_secs(6));
    assert_eq!(too_long.build().unwrap_err(), BuildError::ConnectionExceedsTotal);
}
```

Esegui dalla directory del manifest:

```sh
cargo test --test builder
```

Devono passare tre test. In `conditional_override` si imposta prima un timeout di connessione di otto secondi, superiore al totale *provvisorio* di cinque. Scartarlo nel setter farebbe dipendere l'esito dall'ordine delle chiamate; validare in `build()` accetta correttamente otto su dieci. Se togli la riassegnazione da `builder = builder.user_agent(name);`, la chiamata successiva a `builder.build()` non compila: il setter ha preso possesso del builder e il risultato è stato scartato.

## Il caso opposto: modificare per riferimento

Con `std::process::Command`, `arg(&mut self, ...)` modifica lo stesso oggetto senza riassegnarlo. Puoi aggiungere questo quarto test a `tests/builder.rs` e ripetere il comando precedente: ispeziona gli argomenti senza avviare alcun processo.

```rust
#[test]
fn borrowed_setters_keep_the_same_command() {
    use std::{ffi::OsStr, process::Command};

    let mut command = Command::new("example-tool");
    command.arg("list");
    command.arg("--short").arg("--all");

    let args: Vec<_> = command.get_args().collect();
    assert_eq!(args, [OsStr::new("list"), OsStr::new("--short"), OsStr::new("--all")]);
}
```

## Varianti e limiti

- **Campi obbligatori.** Se uno è sempre necessario, chiedilo in `builder(required)`: il chiamante non può dimenticarlo. Usa un [[Programmazione/Rust/Pagine/Typestate pattern|builder con typestate]] quando serve rendere disponibile `build()` solo dopo certe operazioni. Il typestate non verifica da solo valori letti a runtime.
- **Builder infallibile.** Se i tipi e i setter garantiscono già tutti gli invarianti, `build() -> T` può bastare. Se è la *combinazione* a poter fallire, restituisci un [[Programmazione/Rust/Pagine/Error types pubblici|errore tipizzato]]; evita di correggere silenziosamente una scelta esplicita.
- **Prestiti e default.** Un builder che conserva `&str` invece di `String` dipende dalla durata dell'input; è una decisione distinta da usare setter `&mut self`. Offri `Default` quando esiste un punto di partenza sensato: un derive sui campi numerici non inventa i valori di dominio.
- **Evoluzione dell'API.** Un setter facoltativo con campi privati permette in genere di conservare le chiamate esistenti. Verifica anche il comportamento quando non lo si usa: cambiare il timeout ereditato può rompere un client pur lasciandolo compilare.

## Fonti

- [Rust API Guidelines: quando usare un builder e come scegliere i receiver](https://rust-lang.github.io/api-guidelines/type-safety.html#builders-enable-construction-of-complex-values-c-builder)
- [Libreria standard: Command e i setter per riferimento](https://doc.rust-lang.org/std/process/struct.Command.html#method.arg)
- [Libreria standard: thread::Builder::name prende il builder per valore](https://doc.rust-lang.org/std/thread/struct.Builder.html#method.name)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Rust/Pagine/Default|Default]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
