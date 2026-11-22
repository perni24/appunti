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
  - SeaORM
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await|Async Await]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]"
  - "[[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]"
related:
  - "[[Programmazione/Rust/Pagine/SQLx|SQLx]]"
  - "[[Programmazione/Rust/Pagine/Diesel|Diesel]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]"
title: SeaORM
---

# SeaORM

## Sintesi

In SeaORM una riga **letta** e una riga **da scrivere** non sono la stessa cosa. Un `Model` contiene i dati restituiti dal database. Un `ActiveModel` aggiunge un'informazione per campo: devo inviare questo valore, lasciarlo com'è o non specificarlo affatto? La differenza è visibile quando una colonna ammette sia un valore predefinito sia SQL `NULL`.

La nota usa **SeaORM 1.1.x** con SQLite. Sceglilo se vuoi comporre operazioni asincrone su entità e relazioni. Rispetto a [[Programmazione/Rust/Pagine/SQLx|SQLx]] scrivi meno SQL per il CRUD; rispetto al DSL di [[Programmazione/Rust/Pagine/Diesel|Diesel]] qui il punto di partenza è l'entità e il suo modello modificabile. Rimangono responsabilità del database i vincoli, gli indici e l'esecuzione delle query.

## Leggere e scrivere una riga

`Entity` identifica una tabella e costruisce query, per esempio `Entity::find_by_id(7)`. `Model` è il risultato di una lettura; convertirlo in `ActiveModel` marca i campi letti come `Unchanged`. Per una singola scrittura, considera una colonna ordinaria `summary: Option<String>`:

| Stato nell'ActiveModel | In un INSERT singolo | In un UPDATE |
| --- | --- | --- |
| `NotSet` | La colonna è omessa: il DB applica il default, se presente. | Non compare tra le assegnazioni: il valore resta invariato. |
| `Set(Some(testo))` | Scrive il testo fornito. | Assegna il testo anche se coincide con quello già salvato. |
| `Set(None)` | Scrive esplicitamente SQL `NULL`, senza usare il default. | Cancella il valore della colonna, non la riga. |
| `Unchanged(valore)` | Se espressamente presente, anche questo valore può essere inserito. Non equivale a ometterlo. | Un campo ordinario `Unchanged` non fa parte del `SET`. La chiave primaria identifica la riga da aggiornare. |

Non usare `save()` come sinonimo di *upsert*. In questa versione sceglie insert o update in base allo stato della chiave primaria, **non** interrogando prima il database per sapere se la riga esiste. Usa `insert` o `update` se conosci l'intento; per un vero upsert devi scegliere il vincolo di conflitto e cosa aggiornare.

## Esempio: quaderni e note

Un quaderno può contenere più note. Il riassunto di una nota non è obbligatorio; se lo ometti **in inserimento**, il database scrive `Da rivedere`. Non servono server, credenziali o CLI di generazione: il test crea due tabelle in memoria. Servono Rust/Cargo con edition 2024, compilatore C e linker per SQLite.

```sh
cargo new --lib --edition 2024 quaderni-orm
```

```sh
cd quaderni-orm
```

In `Cargo.toml` sostituisci la sezione vuota `[dependencies]` con:

```toml
[dependencies]
sea-orm = { version = "~1.1.0", default-features = false, features = ["macros", "sqlx-sqlite", "runtime-tokio"] }

[dev-dependencies]
tokio = { version = "1", features = ["macros", "rt"] }
```

### 1. Dichiarare la relazione

Crea `src/notebook.rs`. `DeriveEntityModel` genera, tra gli altri, `Entity`, `Column` e `ActiveModel`. `Related` indica come raggiungere la tabella figlia; non carica ancora alcuna riga.

```rust
use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "notebooks")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub name: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::note::Entity")]
    Note,
}

impl Related<super::note::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Note.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
```

Crea `src/note.rs`. Sul lato figlio sono esplicite le due colonne del collegamento: `notes.notebook_id` e `notebooks.id`.

```rust
use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "notes")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub notebook_id: i32,
    pub title: String,
    pub summary: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::notebook::Entity",
        from = "Column::NotebookId",
        to = "super::notebook::Column::Id"
    )]
    Notebook,
}

impl Related<super::notebook::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Notebook.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
```

### 2. Preparare i dati e caricare i figli

Sostituisci `src/lib.rs` con il blocco seguente. La singola connessione serve a tenere il database SQLite in memoria sulla stessa connessione durante il test: non è una regola di dimensionamento di un [[Programmazione/Rust/Pagine/Connection pooling|pool]].

```rust
pub mod note;
pub mod notebook;

use sea_orm::{
    ActiveValue::Set, ConnectOptions, ConnectionTrait, Database, DatabaseConnection, DbErr,
    EntityTrait, QueryOrder,
};

pub async fn demo_db() -> Result<DatabaseConnection, DbErr> {
    let mut opts = ConnectOptions::new("sqlite::memory:");
    opts.max_connections(1);
    let db = Database::connect(opts).await?;
    db.execute_unprepared("PRAGMA foreign_keys = ON").await?;
    db.execute_unprepared("CREATE TABLE notebooks (id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
        .await?;
    db.execute_unprepared(
        "CREATE TABLE notes (
            id INTEGER PRIMARY KEY,
            notebook_id INTEGER NOT NULL REFERENCES notebooks(id),
            title TEXT NOT NULL,
            summary TEXT DEFAULT 'Da rivedere',
            UNIQUE (notebook_id, title)
        )",
    )
    .await?;
    Ok(db)
}

pub fn draft(notebook_id: i32, title: &str) -> note::ActiveModel {
    note::ActiveModel {
        notebook_id: Set(notebook_id),
        title: Set(title.to_owned()),
        ..Default::default()
    }
}

pub async fn notebooks_with_notes(
    db: &impl ConnectionTrait,
) -> Result<Vec<(notebook::Model, Vec<note::Model>)>, DbErr> {
    notebook::Entity::find()
        .order_by_asc(notebook::Column::Id)
        .find_with_related(note::Entity)
        .all(db)
        .await
}
```

La dichiarazione `belongs_to` serve all'ORM per costruire il join; è la clausola SQL `REFERENCES`, con il controllo delle foreign key attivo, a rifiutare note orfane. Il DDL qui è una **fixture**, non una strategia di deploy: in un servizio versiona le migrazioni e allinea le entity al database migrato, a mano o con il generatore di SeaORM.

### 3. Verificare gli effetti rileggendo il database

Aggiungi questo test in fondo a `src/lib.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sea_orm::ActiveModelTrait;

    #[tokio::test]
    async fn omettere_non_significa_scrivere_null() -> Result<(), DbErr> {
        let db = demo_db().await?;
        let book = notebook::ActiveModel {
            name: Set("Rust".into()),
            ..Default::default()
        }
        .insert(&db)
        .await?;

        let first = draft(book.id, "Indice").insert(&db).await?;
        assert_eq!(first.summary.as_deref(), Some("Da rivedere"));

        let mut second = draft(book.id, "Esercizi");
        second.summary = Set(None);
        let second = second.insert(&db).await?;
        assert_eq!(second.summary, None);

        let mut edit: note::ActiveModel = first.into();
        edit.title = Set("Indice Rust".into());
        let updated = edit.update(&db).await?;
        let stored = note::Entity::find_by_id(updated.id)
            .one(&db)
            .await?
            .unwrap();
        assert_eq!(stored.title, "Indice Rust");
        assert_eq!(stored.summary.as_deref(), Some("Da rivedere"));
        Ok(())
    }
}
```

```sh
cargo test --lib
```

In lettura ci sono **due livelli diversi di assenza**: `find_by_id(id).one(db).await?` restituisce `None` se manca la riga; `Some(model)` con `model.summary == None` indica una riga presente con riassunto `NULL`. Un errore di query è `Err(DbErr)`, non un'assenza. Per aggiornare da un payload HTTP conserva anche la distinzione tra campo omesso e `null`: vedi [[Programmazione/Rust/Pagine/Serde e serializzazione|la patch a tre stati con Serde]].

## Relazioni e scritture concorrenti

- **Un solo padre:** `book.find_related(note::Entity).all(db).await?` con `ModelTrait` in scope recupera le note di quel quaderno. Se prima leggi N quaderni e poi chiami questo metodo una volta per ciascuno, esegui **1 + N query**, anche se ogni chiamata è async.
- **Elenco con i figli:** `notebooks_with_notes` usa un `LEFT JOIN` e raggruppa le righe in coppie padre/figli: un quaderno vuoto compare con un vettore vuoto. L'esempio ordina i quaderni per ID, non promette un ordine dei figli. Un join può ripetere molti dati del padre; per paginare *quaderni*, non righe del join, valuta una pagina di padri seguita da un caricamento in blocco dei figli (`load_many`).
- **Due modifiche inseparabili:** usa una transazione e passa lo **stesso handle di transazione** a tutte le query. Se il secondo inserimento viola `UNIQUE (notebook_id, title)`, propaga l'errore dalla closure transazionale perché anche il primo venga annullato. Due `.await` consecutive sulla connessione non danno atomicità.
- **Aggiornamenti concorrenti:** `Unchanged` evita di riscrivere una colonna non modificata, ma non rileva due scritture sullo stesso campo. Se devi rifiutare aggiornamenti basati su una versione superata, usa una condizione sulla versione attesa e controlla le righe modificate.
- **API pubblica:** un `Model` rappresenta lo schema di persistenza, non i permessi di chi lo invia o lo legge. Mappa esplicitamente i campi autorizzati in ingresso e in uscita. Per query critiche osserva l'SQL generato e misura sul motore realmente usato; il test SQLite non verifica lock o piani di PostgreSQL.

## Fonti ufficiali

- [SeaORM 1.1: modelli ed entità](https://www.sea-ql.org/SeaORM/docs/1.1.x/generate-entity/entity-structure/)
- [ActiveValue: Set, Unchanged e NotSet](https://docs.rs/sea-orm/1.1/sea_orm/enum.ActiveValue.html)
- [ActiveModelTrait: insert, update e save](https://docs.rs/sea-orm/1.1/sea_orm/entity/trait.ActiveModelTrait.html)
- [SeaORM 1.1: caricamento delle relazioni](https://www.sea-ql.org/SeaORM/docs/1.1.x/relation/eager-and-lazy-loading/)
- [SeaORM 1.1: transazioni](https://www.sea-ql.org/SeaORM/docs/1.1.x/advanced-query/transaction/)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]
- [[Programmazione/Rust/Pagine/SQLx|SQLx]]
- [[Programmazione/Rust/Pagine/Diesel|Diesel]]
- [[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]
