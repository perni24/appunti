---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - Feature flags ben progettate
  - Feature Cargo
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo features|Cargo features]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Public API design|Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/no_std|no_std]]"
  - "[[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]"
title: Feature flags ben progettate
---

# Feature flags ben progettate

## Sintesi

Una feature Cargo è una **capacità che un chiamante può richiedere alla compilazione**, non una preferenza privata. Se una libreria offre un identificativo numerico e aggiunge il supporto a Serde, abilitare Serde dovrebbe aggiungere la serializzazione, non cambiare il valore dell'identificativo né obbligare a usare `std`.

Parti da una promessa verificabile: «L'identificativo funziona sempre; con `std` posso scriverlo su un flusso; con `serde` posso serializzarlo anche senza `std`». I nomi delle feature, le combinazioni supportate e ciò che si ottiene per default fanno parte dell'API. Per la sintassi generale del manifest vedi [[Programmazione/Rust/Pagine/Cargo features|Cargo features]].

## Il contratto visto dal chiamante

| Richiesta alla libreria | Cosa deve funzionare | Cosa non deve essere richiesto da questa configurazione |
| --- | --- | --- |
| Nessuna feature, default disattivati | Creare un `UserId` e leggerne il numero | Né Serde né `std` |
| Default (`std`) | Anche scrivere otto byte little-endian su un `std::io::Write` | Serde |
| Solo `serde` | Anche i trait `Serialize` e `Deserialize` per l'identificativo | La libreria standard del target e un formato specifico come JSON |
| `std` e `serde` | Entrambe le capacità, con lo stesso valore numerico | Nessuna scelta tra backend incompatibili |

### Manifest: inoltrare senza attivare

In una directory di prova crea `user-ids/Cargo.toml` e `user-ids/src/lib.rs`. Servono Cargo con edition 2024 e accesso alle dipendenze di Serde, da una cache già popolata oppure al primo download.

```toml
[package]
name = "user-ids"
version = "0.1.0"
edition = "2024"

[features]
default = ["std"]
std = ["serde?/std"]
serde = ["dep:serde"]

[dependencies]
serde = { version = "1", optional = true, default-features = false, features = ["derive"] }
```

Ci sono **due default distinti**. Quello di `user-ids` offre l'integrazione I/O. Disattivare quello della *dipendenza* `serde` evita invece di richiedere indirettamente `std` nella combinazione «solo Serde». `dep:serde` collega il nome pubblico alla dipendenza opzionale. Il punto interrogativo in `serde?/std` dice: inoltra `std` a Serde **solo se Serde è già attiva**. Scrivere `serde/std` attiverebbe la dipendenza anche nella build predefinita che promette di non usarla.

### Codice: un solo tipo in tutte le configurazioni

Contenuto di `user-ids/src/lib.rs`:

```rust
#![cfg_attr(not(feature = "std"), no_std)]

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
#[cfg_attr(feature = "serde", serde(transparent))]
pub struct UserId(u64);

impl UserId {
    pub const fn new(value: u64) -> Self { Self(value) }
    pub const fn get(self) -> u64 { self.0 }

    #[cfg(feature = "std")]
    pub fn write_le(self, out: &mut impl std::io::Write) -> std::io::Result<()> {
        out.write_all(&self.0.to_le_bytes())
    }
}
```

I derive aggiungono trait al tipo esistente; non serve una seconda definizione di `UserId` né una seconda implementazione manuale di `Serialize`. **Serde non è JSON**: il formato viene scelto da chi serializza. Analogamente, `no_std` sulla crate non impedisce a una dipendenza di richiedere `std`. Per questo un test riuscito sul computer di sviluppo, da solo, non dimostra la portabilità.

## Verificare ogni promessa

Crea `user-ids/tests/api.rs`. Il test minimo deve essere sempre presente: se rendi condizionali *tutti* i test, Cargo potrebbe segnalare successo senza aver verificato il tipo di base.

```rust
use user_ids::UserId;

#[test]
fn base_api() {
    assert_eq!(UserId::new(42).get(), 42);
}

#[cfg(feature = "std")]
#[test]
fn writes_little_endian() {
    let mut bytes = Vec::new();
    UserId::new(258).write_le(&mut bytes).unwrap();
    assert_eq!(bytes, [2, 1, 0, 0, 0, 0, 0, 0]);
}

#[cfg(feature = "serde")]
#[test]
fn supports_serde() {
    use serde::de::value::{Error, U64Deserializer};
    use serde::{Deserialize, Serialize};
    fn serializable<T: Serialize>() {}
    serializable::<UserId>();
    let id = UserId::deserialize(U64Deserializer::<Error>::new(42)).unwrap();
    assert_eq!(id.get(), 42);
}
```

L'attributo `serde(transparent)` fa trattare `UserId` come il suo campo `u64`; la CLI più avanti verifica anche il round trip JSON. Il test non aggiunge un serializzatore JSON alle dipendenze della libreria.

Dalla directory `user-ids` prova le quattro configurazioni in invocazioni separate:

**Minima**: un test, nessun metodo di I/O e nessun derive Serde.

```sh
cargo test --test api --no-default-features
```

**Predefinita**: due test, base e I/O.

```sh
cargo test --test api
```

**Serde senza default**: due test, base e integrazione Serde.

```sh
cargo test --test api --no-default-features --features serde
```

**Completa**: tre test. Questa build da sola non rileva una dipendenza accidentale da `std`.

```sh
cargo test --test api --all-features
```

Con il target `thumbv6m-none-eabi` installato, verifica anche la **libreria**, senza il test harness dell'host. Non serve una scheda: questo è un controllo di compilazione, non un test su hardware.

```sh
cargo check --lib --target thumbv6m-none-eabi --no-default-features --features serde
```

## Due chiamanti dello stesso package

Una CLI dipende direttamente da `user-ids` chiedendo solo `serde`. Una seconda libreria, `id-log`, usa invece `user-ids` con i default. Quando la CLI include entrambe, Cargo unisce le richieste per **lo stesso package nello stesso contesto di compilazione**: la libreria avrà sia `serde` sia `std`. `default-features = false` significa «io non richiedo i default», non «nessun altro può attivarli». I resolver moderni separano alcuni contesti, per esempio build-dependencies e dipendenze normali; non isolano due dipendenze normali in questo esempio.

Per riprodurlo crea `id-log/` e `cli/` accanto a `user-ids/`. Sono tre package locali; non serve un workspace.

**`id-log/Cargo.toml`**

```toml
[package]
name = "id-log"
version = "0.1.0"
edition = "2024"

[dependencies]
user-ids = { path = "../user-ids" }
```

**`id-log/src/lib.rs`**

```rust
pub fn bytes(id: user_ids::UserId) -> std::io::Result<Vec<u8>> {
    let mut out = Vec::new();
    id.write_le(&mut out)?;
    Ok(out)
}
```

**`cli/Cargo.toml`**

```toml
[package]
name = "ids-cli"
version = "0.1.0"
edition = "2024"

[features]
log = ["dep:id-log"]

[dependencies]
user-ids = { path = "../user-ids", default-features = false, features = ["serde"] }
id-log = { path = "../id-log", optional = true }
serde_json = "1"
```

**`cli/src/main.rs`**

```rust
fn main() {
    let id = user_ids::UserId::new(258);
    let json = serde_json::to_string(&id).unwrap();
    assert_eq!(json, "258");
    assert_eq!(serde_json::from_str::<user_ids::UserId>(&json).unwrap(), id);
    println!("json={json}");

    #[cfg(feature = "log")]
    println!("bytes={:?}", id_log::bytes(id).unwrap());
}
```

Dalla directory `cli` confronta le due esecuzioni. Senza `log` compare solo `json=258`.

```sh
cargo run --quiet
```

Con `log` compare anche `bytes=[2, 1, 0, 0, 0, 0, 0, 0]`. Il JSON resta identico.

```sh
cargo run --quiet --features log
```

Per risalire al motivo di un'attivazione, osserva i percorsi **inversi** con e senza il secondo chiamante:

```sh
cargo tree -e features -i user-ids
```

```sh
cargo tree -e features -i user-ids --features log
```

Nel primo albero `user-ids` riceve `serde`, nel secondo riceve anche `default` e `std` da `id-log`. Questa CLI usa `std`: per verificare la promessa embedded conta il comando sul target eseguito dalla libreria isolata, non l'assenza della parola `std` nell'intero grafo della CLI.

## Scelte da mantenere nel tempo

- **Capacità positive.** `std` aggiunge I/O; una feature negativa come `disable-io` farebbe sparire un'API richiesta da un altro chiamante. Se due backend possono coesistere, compila entrambi e scegli quale usare con un parametro a runtime. Se non possono coesistere, valuta crate separate o documenta e rifiuta esplicitamente la combinazione.
- **Nomi pubblici, dipendenze private.** Nomina la capacità che intendi mantenere. Una feature di supporto a PostgreSQL, per esempio, non dovrebbe promettere automaticamente ogni funzione del driver scelto. Un nome con prefisso `_` non rende privata una feature del manifest.
- **`alloc` non è `std`.** Per un identificativo scalare non serve un allocatore. Se aggiungi API che costruiscono una `String` o un `Vec` senza `std`, documenta il requisito di allocazione e quali dipendenze devono abilitare la propria feature `alloc`.
- **Compatibilità.** Rimuovere una feature pubblica rompe i manifest che la nominano. Togliere `std` dal default romperebbe il chiamante `id-log`, che usa `write_le` senza richiederla esplicitamente. Aggiungere una feature non giustifica cambiare la rappresentazione JSON o il significato di un'API esistente.
- **Leggere il grafo giusto.** Una voce in `Cargo.lock` non dimostra che il relativo package sia compilato nella configurazione minima. Ispeziona `cargo tree` con le stesse feature e lo stesso target della build che stai diagnosticando.

## Fonti

- [Cargo Book: feature opzionali, inoltro e unificazione](https://doc.rust-lang.org/cargo/reference/features.html)
- [Cargo Book: modifiche compatibili e incompatibili](https://doc.rust-lang.org/cargo/reference/semver.html)
- [Serde: supporto no_std, derive e allocazione](https://serde.rs/no-std.html)
- [Serde: attributi del contenitore e rappresentazione transparent](https://serde.rs/container-attrs.html#transparent)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
