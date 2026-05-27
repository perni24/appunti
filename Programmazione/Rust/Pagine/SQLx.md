---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - "SQLx"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Connection pooling]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/Web backend con axum]]"
  - "[[Programmazione/Rust/Pagine/Diesel]]"
  - "[[Programmazione/Rust/Pagine/SeaORM]]"
---

# SQLx

## Sintesi

SQLx e una crate Rust async per lavorare con database SQL usando query esplicite. Supporta database come PostgreSQL, MySQL e SQLite e offre macro che possono verificare le query a compile time contro uno schema reale o tramite metadati preparati.

Il suo approccio e "SQL-first": scrivi SQL, ma ottieni mapping tipizzato e integrazione con `async/await`. E adatto quando vuoi controllo diretto sulle query senza introdurre un ORM pesante.

## Quando usarlo

Usa SQLx quando:

- vuoi scrivere SQL esplicito;
- lavori in un backend async;
- vuoi connection pool integrato;
- vuoi controllare performance e query generate;
- il team conosce SQL e vuole evitare astrazioni ORM troppo opache;
- vuoi verificare query e tipi in fase di build.

Se preferisci query builder fortemente tipizzato e schema generato in Rust, Diesel puo essere piu adatto. Se vuoi un ORM async con entity e relation, valuta SeaORM.

## Come funziona

I concetti principali sono:

- **pool**: insieme di connessioni riutilizzabili;
- **query**: SQL testuale con parametri bind;
- **query_as**: mapping verso struct;
- **macro checked**: verifica query e colonne;
- **transaction**: blocco atomico di operazioni;
- **migration**: evoluzione dello schema.

SQLx lavora bene quando le query sono parte esplicita del codice. Questo rende chiaro cosa va al database, ma richiede disciplina nel separare query, dominio e handler HTTP.

## API / Sintassi

Pool PostgreSQL:

```rust
use sqlx::postgres::PgPoolOptions;

async fn build_pool(database_url: &str) -> Result<sqlx::PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
}
```

Query con mapping:

```rust
#[derive(Debug)]
struct User {
    id: i64,
    name: String,
}

async fn find_user(pool: &sqlx::PgPool, id: i64) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as!(
        User,
        "select id, name from users where id = $1",
        id
    )
    .fetch_optional(pool)
    .await
}
```

## Esempio pratico

Transazione:

```rust
async fn transfer(
    pool: &sqlx::PgPool,
    from: i64,
    to: i64,
    amount: i64,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    sqlx::query!("update accounts set balance = balance - $1 where id = $2", amount, from)
        .execute(&mut *tx)
        .await?;

    sqlx::query!("update accounts set balance = balance + $1 where id = $2", amount, to)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(())
}
```

La transazione rende atomiche le due modifiche. In un'applicazione reale servono anche vincoli database e gestione degli errori di concorrenza.

## Varianti

- **query!**: verifica colonne e tipi per una query.
- **query_as!**: mappa righe su struct.
- **QueryBuilder**: utile per query dinamiche controllate.
- **Transaction**: operazioni atomiche.
- **Migrations**: versionamento schema.
- **Offline mode**: utile in CI senza database live, se configurato.

## Errori comuni

- Costruire SQL dinamico concatenando stringhe non fidate.
- Usare una connessione singola invece di un pool.
- Tenere transazioni aperte durante chiamate HTTP esterne.
- Ignorare indici, piani di esecuzione e vincoli DB.
- Mettere query complesse direttamente negli handler web.
- Non distinguere errori di vincolo, not found e problemi infrastrutturali.
- Lasciare il pool senza timeout o limiti coerenti.

## Checklist

- Le query usano parametri bind?
- Il pool e configurato con limiti sensati?
- Le transazioni sono brevi?
- Le query sono separate dagli handler?
- Gli errori DB sono mappati in errori applicativi?
- Le migrazioni sono versionate?
- Le query critiche sono coperte da test o verifica SQLx?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Async Await]]
- [[Programmazione/Rust/Pagine/Connection pooling]]
- [[Programmazione/Rust/Pagine/Web backend con axum]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Diesel]]
- [[Programmazione/Rust/Pagine/SeaORM]]
