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
  - "Diesel"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Connection pooling]]"
related:
  - "[[Programmazione/Rust/Pagine/SQLx]]"
  - "[[Programmazione/Rust/Pagine/SeaORM]]"
  - "[[Programmazione/Rust/Pagine/Error types pubblici]]"
---

# Diesel

## Sintesi

Diesel e un ORM e query builder Rust fortemente tipizzato per database SQL. Il suo obiettivo e portare molte verifiche a compile time: schema, colonne, tipi e composizione delle query vengono modellati nel type system.

Rispetto a SQLx, Diesel tende a nascondere piu SQL dietro un DSL Rust. Questo puo aumentare sicurezza e refactoring, ma introduce tipi complessi e una curva di apprendimento piu alta.

## Quando usarlo

Usa Diesel quando:

- vuoi query builder tipizzato;
- vuoi modellare lo schema nel codice Rust;
- preferisci evitare SQL string-based in molte parti dell'applicazione;
- lavori su un dominio relazionale ben strutturato;
- vuoi errori di composizione query a compile time;
- il team e disposto ad accettare maggiore complessita generica.

Se vuoi scrivere SQL esplicito e lavorare async in modo diretto, SQLx puo essere piu semplice. Se vuoi ORM async con entity e relation, SeaORM puo essere piu naturale.

## Come funziona

Diesel genera o mantiene una rappresentazione dello schema database in Rust. Le query vengono costruite con un DSL:

- `table.filter(...)`;
- `select`;
- `insert_into`;
- `update`;
- `delete`;
- mapping tramite trait come `Queryable` e `Insertable`.

Il compilatore verifica che colonne, tipi e operazioni siano compatibili. Il prezzo e che gli errori di compilazione possono essere lunghi e che alcune query dinamiche richiedono piu lavoro.

## API / Sintassi

Esempio schematico:

```rust
use diesel::prelude::*;

#[derive(Debug, Queryable)]
struct User {
    id: i32,
    name: String,
}

fn find_user(
    conn: &mut PgConnection,
    user_id: i32,
) -> QueryResult<User> {
    use crate::schema::users::dsl::*;

    users
        .filter(id.eq(user_id))
        .first::<User>(conn)
}
```

Inserimento:

```rust
use diesel::prelude::*;

#[derive(Insertable)]
#[diesel(table_name = users)]
struct NewUser<'a> {
    name: &'a str,
}
```

## Esempio pratico

Separare repository e handler:

```rust
use diesel::prelude::*;

struct UserRepository;

impl UserRepository {
    fn list(conn: &mut PgConnection) -> QueryResult<Vec<User>> {
        use crate::schema::users::dsl::*;

        users
            .order(id.asc())
            .load::<User>(conn)
    }
}

#[derive(Debug, Queryable)]
struct User {
    id: i32,
    name: String,
}
```

In un backend async, se usi connessioni Diesel sincrone, devi evitare di bloccare direttamente il runtime async. Servono pool e strategie di esecuzione adeguate.

## Varianti

- **Query builder tipizzato**: DSL Rust per query.
- **Raw SQL**: possibile quando il DSL non basta.
- **Migrations Diesel**: gestione evoluzione schema.
- **Repository pattern**: separa accesso dati dal web layer.
- **Pooling con r2d2 o equivalenti**: riuso connessioni sincrone.
- **Uso in backend async**: richiede attenzione al blocco del runtime.

## Errori comuni

- Sottovalutare la complessita dei tipi Diesel.
- Eseguire query sincrone direttamente in task async sensibili.
- Mescolare modelli Diesel, DTO API e dominio in una sola struct.
- Usare raw SQL senza parametri sicuri.
- Ignorare migrazioni e schema versionato.
- Rendere le query troppo generiche prima che serva.
- Non gestire bene `NotFound` rispetto agli altri errori DB.

## Checklist

- Lo schema Rust e sincronizzato con il database?
- Le query sincrone non bloccano il runtime async?
- I modelli database sono separati dai DTO?
- Gli errori Diesel sono mappati in errori applicativi?
- Le migrazioni sono incluse nel processo di release?
- Le query complesse restano leggibili?
- Diesel e davvero piu adatto di SQL esplicito per questo caso?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Generics]]
- [[Programmazione/Rust/Pagine/Traits]]
- [[Programmazione/Rust/Pagine/Connection pooling]]
- [[Programmazione/Rust/Pagine/SQLx]]
- [[Programmazione/Rust/Pagine/SeaORM]]
- [[Programmazione/Rust/Pagine/Error types pubblici]]
