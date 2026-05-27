---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - "Serde e serializzazione"
  - "Serde"
  - "serializzazione Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Networking con reqwest]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa]]"
---

# Serde e serializzazione

## Sintesi

Serde e il principale framework Rust per serializzare e deserializzare dati. Permette di convertire struct ed enum Rust in formati come JSON, TOML, YAML, MessagePack o altri formati, e viceversa.

Nel backend Rust e centrale per API HTTP, configurazione, messaggi di coda, persistenza e integrazioni esterne. Il vantaggio e che il contratto dei dati viene espresso tramite tipi Rust, spesso con derive automatici.

## Quando usarlo

Usa Serde quando:

- ricevi o produci JSON in un'API;
- leggi file di configurazione;
- comunichi con servizi esterni;
- serializzi eventi o job;
- vuoi validare struttura e tipi dei dati in ingresso;
- vuoi separare DTO esterni e modelli interni.

Non usare direttamente i tipi di dominio come payload pubblici senza pensarci: spesso conviene avere struct dedicate per request e response.

## Come funziona

Serde si basa su due trait principali:

- `Serialize`: converte un valore Rust in un formato;
- `Deserialize`: costruisce un valore Rust da un formato.

La maggior parte dei casi usa derive:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
}
```

Il formato concreto viene gestito da crate separate, per esempio `serde_json` o `toml`.

Gli attributi Serde permettono di controllare naming, default, campi opzionali, campi ignorati e rappresentazione degli enum.

## API / Sintassi

JSON:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct CreateUser {
    #[serde(rename = "displayName")]
    display_name: String,

    #[serde(default)]
    admin: bool,
}

fn parse(input: &str) -> serde_json::Result<CreateUser> {
    serde_json::from_str(input)
}
```

Enum tagged:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum Event {
    UserCreated { id: u64 },
    UserDeleted { id: u64 },
}
```

La scelta della rappresentazione degli enum e parte del contratto esterno: cambiarla puo rompere client o dati salvati.

## Esempio pratico

DTO separato dal modello interno:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct CreateUserRequest {
    email: String,
    display_name: String,
}

#[derive(Debug, Serialize)]
struct UserResponse {
    id: i64,
    email: String,
    display_name: String,
}

struct User {
    id: i64,
    email: String,
    display_name: String,
    password_hash: String,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
        }
    }
}
```

Il campo `password_hash` non entra mai nella response pubblica perche il DTO e separato dal modello interno.

## Varianti

- **JSON API**: `serde_json` con `Serialize` e `Deserialize`.
- **Configurazione TOML/YAML**: file leggibili dall'utente.
- **Enum tagged/untagged**: diverse forme per protocolli e payload.
- **Borrowed deserialization**: riduce copie ma introduce lifetime.
- **Custom serializer**: utile per formati particolari.
- **DTO separati**: proteggono il dominio e l'API pubblica.

## Errori comuni

- Serializzare direttamente modelli interni con campi sensibili.
- Usare `Option<T>` senza distinguere "mancante" da "null".
- Cambiare `rename_all` o forma degli enum rompendo compatibilita.
- Affidarsi solo a deserializzazione senza validazione di dominio.
- Usare `unwrap()` su input esterno.
- Ignorare default impliciti che possono nascondere errori.
- Mescolare tipi database, dominio e API in una sola struct.

## Checklist

- Request e response hanno DTO dedicati?
- I campi sensibili sono esclusi?
- La compatibilita del formato e considerata?
- I default sono espliciti e intenzionali?
- Gli errori di parsing sono riportati bene?
- Dopo la deserializzazione c'e validazione di dominio?
- I test coprono casi validi e invalidi?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Structs]]
- [[Programmazione/Rust/Pagine/Enums]]
- [[Programmazione/Rust/Pagine/Derive traits]]
- [[Programmazione/Rust/Pagine/Networking con reqwest]]
- [[Programmazione/Rust/Pagine/Web backend con axum]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa]]
