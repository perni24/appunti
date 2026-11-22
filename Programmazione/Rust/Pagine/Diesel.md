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
  - backend-networking-e-database
aliases:
  - Diesel
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics|Generics]]"
  - "[[Programmazione/Rust/Pagine/Traits|Traits]]"
  - "[[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]"
related:
  - "[[Programmazione/Rust/Pagine/SQLx|SQLx]]"
  - "[[Programmazione/Rust/Pagine/SeaORM|SeaORM]]"
  - "[[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]"
title: Diesel
---

# Diesel

## Sintesi

**Diesel controlla la query rispetto allo schema dichiarato in Rust, non rispetto al database che incontrerà in produzione.** Il DSL (per esempio `notes::table.filter(...)`) costruisce un'espressione tipizzata; l'I/O avviene quando chiami `load`, `first` o `execute` su una connessione. Per compilare l'esempio non serve un database acceso. Per sapere che la migrazione funziona e che i dati letti hanno il significato atteso, serve eseguire la query.

Usa Diesel se vuoi comporre query relazionali in Rust con controlli su colonne, tipi, nullabilità e proiezioni. In [[Programmazione/Rust/Pagine/SQLx|SQLx]] parti invece dall'SQL esplicito e puoi far verificare le macro contro uno schema o metadati preparati. [[Programmazione/Rust/Pagine/SeaORM|SeaORM]] offre un modello asincrono basato su entità e relazioni.

## Tre pezzi da tenere allineati

| Pezzo | A cosa serve | Cosa non garantisce |
| --- | --- | --- |
| Migrazioni `up.sql` e `down.sql` | Cambiano lo schema del database quando vengono eseguite. | Aggiungere il file in Git non aggiorna un database già distribuito. |
| `src/schema.rs` con `table!` | Dichiara tabelle, chiavi e tipi SQL al compilatore Rust. | Modificarlo non crea colonne. Il codice può compilare e poi fallire su un database non migrato. |
| Modelli Rust | `Insertable` descrive cosa scrivere; `Selectable` costruisce la proiezione; `Queryable` ricostruisce il valore dalla riga. | `Queryable` non abbina automaticamente i risultati per nome. Se scambi due colonne dello stesso tipo puoi ottenere dati sbagliati senza errori di tipo. |

## Esempio: archivio di note

Vogliamo distinguere tre casi: **nota assente**, **nota presente senza riassunto** e **lettura fallita**. Usiamo Diesel 2.3 con SQLite in memoria e una sola connessione sincrona. Non occorrono server, credenziali o Diesel CLI. Servono Rust compatibile con Diesel 2.3, compilatore C e linker per la libreria SQLite inclusa.

```sh
cargo new --lib --edition 2024 archivio-diesel
```

```sh
cd archivio-diesel
```

In `Cargo.toml`, aggiungi sotto `[dependencies]`:

```toml
diesel = { version = "~2.3.0", default-features = false, features = ["sqlite"] }
diesel_migrations = "~2.3.0"
libsqlite3-sys = { version = "0.35", features = ["bundled"] }
```

### 1. Creare la tabella e descriverla in Rust

Crea `migrations/00000000000001_create_notes/up.sql`. Lo slug identifica la nota; il titolo è obbligatorio, il riassunto può essere SQL `NULL`.

```sql
CREATE TABLE notes (
    slug TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    summary TEXT
);
```

Nella stessa cartella, `down.sql` descrive l'operazione inversa. **Applicarla elimina anche le righe**, non soltanto la definizione della tabella. Il test del demo usa un database nuovo in memoria.

```sql
DROP TABLE notes;
```

Crea `src/schema.rs`:

```rust
diesel::table! {
    notes (slug) {
        slug -> Text,
        title -> Text,
        summary -> Nullable<Text>,
    }
}
```

Qui lo schema è fornito per rendere il demo autonomo. In un progetto con Diesel CLI, applica le migrazioni al database di sviluppo e usa `diesel print-schema` per ispezionare la dichiarazione ricavata dal database; versiona migrazioni e schema insieme. Se modifichi SQL incorporato con `embed_migrations!`, fai rilevare a Cargo anche le modifiche alla cartella: in un `build.rs` usa `fn main() { println!("cargo:rerun-if-changed=migrations"); }`.

### 2. Inserire, leggere e aggiornare

Sostituisci `src/lib.rs` con i due blocchi seguenti, in ordine. La connessione a `:memory:` crea un archivio effimero: **una nuova connessione non è un'altra vista degli stessi dati**. Mantieni quella restituita da `demo_connection` per tutta la prova.

```rust
pub mod schema;

use diesel::prelude::*;
use diesel::sqlite::{Sqlite, SqliteConnection};
use diesel_migrations::{EmbeddedMigrations, MigrationHarness, embed_migrations};
use schema::notes;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

pub fn demo_connection() -> Result<SqliteConnection, Box<dyn std::error::Error + Send + Sync>> {
    let mut conn = SqliteConnection::establish(":memory:")?;
    conn.run_pending_migrations(MIGRATIONS)?;
    Ok(conn)
}

#[derive(Debug, Queryable, Selectable)]
#[diesel(table_name = notes)]
#[diesel(check_for_backend(Sqlite))]
pub struct Note {
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
}

#[derive(Insertable)]
#[diesel(table_name = notes)]
pub struct NewNote<'a> {
    pub slug: &'a str,
    pub title: &'a str,
    pub summary: Option<&'a str>,
}
```

```rust
pub fn import(conn: &mut SqliteConnection, batch: &[NewNote<'_>]) -> QueryResult<()> {
    conn.transaction(|tx| {
        for note in batch {
            diesel::insert_into(notes::table).values(note).execute(tx)?;
        }
        Ok(())
    })
}

pub fn find(conn: &mut SqliteConnection, key: &str) -> QueryResult<Option<Note>> {
    notes::table
        .find(key)
        .select(Note::as_select())
        .first(conn)
        .optional()
}

pub fn list(conn: &mut SqliteConnection) -> QueryResult<Vec<Note>> {
    notes::table
        .order(notes::slug.asc())
        .select(Note::as_select())
        .load(conn)
}

pub fn set_summary(
    conn: &mut SqliteConnection,
    key: &str,
    value: Option<&str>,
) -> QueryResult<usize> {
    diesel::update(notes::table.find(key))
        .set(notes::summary.eq(value))
        .execute(conn)
}
```

- **Scrittura:** tutti gli inserimenti usano la stessa transazione. Se uno slug è duplicato, `execute(tx)?` propaga l'errore dalla closure e Diesel esegue il rollback anche degli inserimenti precedenti del lotto. Restituire `Ok` dopo aver ignorato l'errore non esprimerebbe la stessa intenzione.
- **Lettura:** `find(key)` filtra per chiave primaria; `first` senza righe produce `Error::NotFound`. `optional()` trasforma **solo** quell'errore in `Ok(None)`: un errore di connessione o una colonna mancante rimangono `Err`. Una lista vuota restituita da `load` non è un errore.
- **Aggiornamento:** qui `.set(notes::summary.eq(None::<&str>))` assegna esplicitamente SQL `NULL`. `execute` restituisce il numero di righe interessate: se lo slug non esiste ottieni `Ok(0)`, non `NotFound`. Per azzerare il riassunto non serve cancellare la nota.

### 3. Verificare il risultato

Aggiungi questo test in fondo a `src/lib.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn riga_assente_e_valore_nullo() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut conn = demo_connection()?;
        assert!(find(&mut conn, "indice")?.is_none());

        let input = NewNote {
            slug: "indice",
            title: "Indice Rust",
            summary: Some("Guida"),
        };
        import(&mut conn, &[input])?;
        assert_eq!(set_summary(&mut conn, "indice", None)?, 1);
        let note = find(&mut conn, "indice")?.expect("nota appena inserita");
        assert_eq!(note.title, "Indice Rust");
        assert_eq!(note.summary, None);
        assert_eq!(set_summary(&mut conn, "assente", Some("Test"))?, 0);
        Ok(())
    }
}
```

```sh
cargo test --lib
```

Il primo `None` del test indica che **manca la riga**. Il secondo, in `note.summary`, indica che **manca un valore in una riga esistente**. Un handler web può convertire il primo caso in `404` senza scambiare un guasto del database per una nota assente.

## Leggere una diagnosi

| Sintomo | Quando emerge | Cosa controllare |
| --- | --- | --- |
| Confronti `slug` (`Text`) con `42_i32`, oppure carichi `Nullable<Text>` in `String`. | In compilazione nel DSL tipizzato. | Parti da tipo SQL in `schema.rs`, proiezione e tipo Rust. `check_for_backend` sul modello aiuta a localizzare l'incompatibilità. |
| Compila ma `slug` contiene il titolo e viceversa. | Nei risultati, senza errore del DB. | Una proiezione manuale `(title, slug, summary)` ha gli stessi tipi di `(slug, title, summary)`. Usa `Note::as_select()` e un test con valori distinti. |
| Compila ma l'esecuzione segnala una colonna inesistente. | Quando il database prepara o esegue la query. | Verifica quali migrazioni sono state applicate **a quel database**. Rendere il campo Rust opzionale non crea la colonna. |
| Il secondo inserimento viola una chiave unica. | Durante la scrittura. | È un errore di vincolo, non un errore di schema Rust né `NotFound`. Decidi a livello applicativo se il conflitto è previsto. |

## Scelte operative

- **Query dinamiche:** componi i filtri con il DSL; se i rami condizionali producono tipi diversi, puoi usare `into_boxed` per il backend scelto. Con `sql_query` e SQL scritto a mano perdi i controlli strutturali del DSL: usa parametri bind per i valori e un risultato adatto al mapping per nome (`QueryableByName`).
- **In un backend Tokio/axum:** `SqliteConnection` e `PgConnection` di Diesel sono sincrone. Un [[Programmazione/Rust/Pagine/Connection pooling|pool]] riusa le connessioni, non rende asincrone le query. Con un pool sincrono, sposta **sia l'acquisizione sia l'intera operazione** in `spawn_blocking`, dimensionando pool e concorrenza. In alternativa valuta una connessione compatibile con `diesel-async` per il backend scelto.
- **Passando a PostgreSQL:** abilita il driver `postgres`, usa `PgConnection`, migrazioni per quel motore e adatta `check_for_backend`. Riesegui i test sul servizio reale: SQLite in memoria non verifica permessi, lock o concorrenza di PostgreSQL. Il modello di persistenza non deve per forza essere la risposta HTTP: scegli esplicitamente i campi pubblici come nella nota su [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde]].

## Fonti ufficiali

- [Diesel: primi passi con migrazioni, schema e modelli](https://diesel.rs/guides/getting-started)
- [Diesel 2.3: Selectable e proiezioni](https://docs.rs/diesel/2.3/diesel/expression/trait.Selectable.html)
- [Queryable: ordine e tipi dei campi](https://docs.rs/diesel/2.3/diesel/deserialize/trait.Queryable.html)
- [OptionalExtension: conversione di NotFound](https://docs.rs/diesel/2.3/diesel/result/trait.OptionalExtension.html)
- [Connection: commit e rollback della closure](https://docs.rs/diesel/2.3/diesel/connection/trait.Connection.html#method.transaction)
- [embed_migrations!: quando Cargo ricompila le migrazioni incorporate](https://docs.rs/diesel_migrations/2.3/diesel_migrations/macro.embed_migrations.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]
- [[Programmazione/Rust/Pagine/SQLx|SQLx]]
- [[Programmazione/Rust/Pagine/SeaORM|SeaORM]]
- [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]
