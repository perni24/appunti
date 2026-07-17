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
  - backend-networking-e-database
aliases:
  - "SeaORM"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione]]"
  - "[[Programmazione/Rust/Pagine/Connection pooling]]"
related:
  - "[[Programmazione/Rust/Pagine/SQLx]]"
  - "[[Programmazione/Rust/Pagine/Diesel]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum]]"
---

# SeaORM

## Sintesi

SeaORM e un ORM async per Rust basato su entity, model, active model e relation. E pensato per applicazioni backend che vogliono lavorare con database relazionali usando un modello piu vicino agli ORM tradizionali, ma integrato con `async/await`.

Rispetto a SQLx, SeaORM nasconde piu SQL dietro API di alto livello. Rispetto a Diesel, punta su un modello async e su entity generate o dichiarate in modo piu orientato all'applicazione.

## Quando usarlo

Usa SeaORM quando:

- vuoi un ORM async;
- il dominio ha molte entita e relazioni;
- vuoi generare entity a partire dallo schema;
- preferisci API CRUD e relation rispetto a SQL scritto a mano;
- vuoi integrazione comoda con backend async;
- il team accetta un layer ORM piu esplicito.

Non e sempre la scelta migliore per query altamente ottimizzate o SQL molto specifico. In quei casi SQLx puo dare piu controllo.

## Come funziona

SeaORM modella il database con:

- **Entity**: rappresenta una tabella;
- **Model**: rappresenta una riga letta dal database;
- **ActiveModel**: rappresenta dati da inserire o aggiornare;
- **Relation**: descrive relazioni tra entity;
- **DatabaseConnection**: connessione/pool async.

Le query vengono costruite tramite metodi:

- `Entity::find()`;
- `filter`;
- `order_by`;
- `find_related`;
- `insert`;
- `update`;
- `delete`.

Questo rende il codice piu uniforme, ma e importante sapere cosa produce a livello SQL.

## API / Sintassi

Esempio schematico di lettura:

```rust
use sea_orm::{DatabaseConnection, EntityTrait};

async fn list_users(db: &DatabaseConnection) -> Result<Vec<user::Model>, sea_orm::DbErr> {
    user::Entity::find().all(db).await
}

mod user {
    pub use entity::*;

    mod entity {
        use sea_orm::entity::prelude::*;

        #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
        #[sea_orm(table_name = "users")]
        pub struct Model {
            #[sea_orm(primary_key)]
            pub id: i32,
            pub name: String,
        }

        #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
        pub enum Relation {}

        impl ActiveModelBehavior for ActiveModel {}
    }
}
```

In progetti reali le entity stanno in moduli generati o organizzati separatamente.

## Esempio pratico

Inserimento con `ActiveModel`:

```rust
use sea_orm::{ActiveModelTrait, ActiveValue::Set, DatabaseConnection};

async fn create_user(
    db: &DatabaseConnection,
    name: String,
) -> Result<user::Model, sea_orm::DbErr> {
    let active = user::ActiveModel {
        name: Set(name),
        ..Default::default()
    };

    active.insert(db).await
}

# mod user {
#     use sea_orm::entity::prelude::*;
#     #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#     #[sea_orm(table_name = "users")]
#     pub struct Model {
#         #[sea_orm(primary_key)]
#         pub id: i32,
#         pub name: String,
#     }
#     #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
#     pub enum Relation {}
#     impl ActiveModelBehavior for ActiveModel {}
# }
```

`ActiveModel` rende espliciti i campi impostati, ma va separato dai DTO API e dal modello di dominio quando l'applicazione cresce.

## Varianti

- **Entity generate**: schema database tradotto in codice.
- **Entity manuali**: maggiore controllo, piu manutenzione.
- **ActiveModel CRUD**: inserimenti e update comodi.
- **Relation query**: navigazione tra tabelle correlate.
- **Raw query**: fallback per query particolari.
- **Migration companion**: gestione schema tramite tool dedicati.

## Errori comuni

- Usare entity ORM come DTO pubblici.
- Non controllare le query SQL prodotte.
- Caricare relazioni in modo inefficiente.
- Nascondere troppa logica di dominio negli ActiveModel.
- Ignorare transazioni per operazioni multi-step.
- Trattare l'ORM come sostituto della conoscenza SQL.
- Non gestire correttamente errori di vincolo e not found.

## Checklist

- Entity, DTO e dominio sono separati?
- Le query critiche sono osservate o loggate?
- Le relazioni non producono carichi inutili?
- Le operazioni multi-step usano transazioni?
- Gli errori DB sono mappati?
- Le migrazioni sono integrate nel flusso di deploy?
- SeaORM aggiunge valore rispetto a SQLx per questo progetto?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Async Await]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Connection pooling]]
- [[Programmazione/Rust/Pagine/SQLx]]
- [[Programmazione/Rust/Pagine/Diesel]]
- [[Programmazione/Rust/Pagine/Web backend con axum]]
