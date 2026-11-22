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
  - SQLx
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await|Async Await]]"
  - "[[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]"
  - "[[Programmazione/Rust/Pagine/Diesel|Diesel]]"
  - "[[Programmazione/Rust/Pagine/SeaORM|SeaORM]]"
title: SQLx
---

# SQLx

## Sintesi

Con SQLx scrivi direttamente SQL e lo esegui in modo asincrono da Rust. **Una query che compila, un'istruzione che riesce e un'operazione di dominio riuscita non sono la stessa cosa.** Se provi ad accreditare un conto inesistente, il database può eseguire correttamente l'`UPDATE` e modificare *zero* righe. SQLx non decide al posto tuo se questo sia accettabile.

Scegli SQLx quando vuoi controllare SQL, parametri, indici e transazioni. Se preferisci costruire le query attraverso un DSL tipizzato, confronta [[Programmazione/Rust/Pagine/Diesel|Diesel]]; per lavorare con entità e relazioni in un ORM asincrono, vedi [[Programmazione/Rust/Pagine/SeaORM|SeaORM]].

## Scegliere il tipo di query

| API di SQLx 0.8 | Quando verifica lo schema | Cosa restituisce |
| --- | --- | --- |
| `query(sql).bind(...).execute(...)` | Il database verifica l'istruzione all'esecuzione | Un risultato del driver: per un UPDATE puoi controllare `rows_affected()`. |
| `query_as::<_, Account>(sql)` | Colonne e conversioni vengono risolte all'esecuzione | Una struct tramite `FromRow`. Un refuso nel nome di una colonna non blocca `cargo build`. |
| `query!`, `query_as!`, `query_scalar!` | Durante la compilazione, per SQL letterale e un backend specifico, con schema disponibile o metadati preparati | Rispettivamente record generato, struct indicata (senza richiedere `FromRow`) o valore di una colonna. Vincoli, permessi e dati reali restano verifiche di esecuzione. |

**Quante righe ti aspetti?** `fetch_optional` restituisce `Ok(None)` se non ce ne sono; `fetch_one` restituisce `Error::RowNotFound`. Entrambi prelevano la *prima* riga: non provano che il risultato sia unico. Qui l'unicità è garantita dalla chiave primaria. Per molte righe, `fetch_all` le raccoglie in memoria; usa paginazione o `fetch` se il risultato può essere grande.

## Esempio: un trasferimento verificabile

Usiamo **SQLite in memoria** per poter riprodurre commit e rollback senza un servizio esterno. I saldi sono interi in centesimi; un tetto volutamente basso permette di provocare un errore sull'accredito. Più avanti trovi le differenze per PostgreSQL.

```sh
cargo new --lib --edition 2024 conti-sqlx
```

```sh
cd conti-sqlx
```

In `Cargo.toml` sostituisci la sezione vuota `[dependencies]` con le seguenti sezioni. Il driver SQLite compila la libreria nativa inclusa: servono anche compilatore C e linker per l'host. La feature di progetto `checked` abilita solo l'esempio opzionale di verifica delle query in compilazione.

```toml
[features]
checked = []

[dependencies]
sqlx = { version = "0.8.6", default-features = false, features = ["runtime-tokio", "sqlite", "macros", "migrate"] }
thiserror = "2"

[dev-dependencies]
tokio = { version = "1", features = ["macros", "rt"] }
```

### 1. Schema e ricerca

Crea `migrations/0001_accounts.sql`. La migrazione è la fonte dello schema sia per i test sia per la verifica delle macro. Il vincolo protegge i saldi anche se una scrittura arriva da un altro programma.

```sql
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY,
    owner TEXT NOT NULL,
    balance_cents INTEGER NOT NULL CHECK (balance_cents BETWEEN 0 AND 1000000)
) STRICT;
```

I blocchi Rust di questa nota vanno nello stesso `src/lib.rs`, nell'ordine indicato. Una sola connessione al database effimero rende il test indipendente dal riuso di connessioni diverse. **Non è una raccomandazione sulla dimensione di un pool di produzione.**

```rust
use sqlx::{FromRow, SqlitePool, sqlite::SqlitePoolOptions};

#[derive(Debug, FromRow)]
pub struct Account {
    pub id: i64,
    pub owner: String,
    pub balance_cents: i64,
}

pub async fn demo_pool() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await?;
    sqlx::migrate!().run(&pool).await?;
    Ok(pool)
}

pub async fn find(pool: &SqlitePool, id: i64) -> Result<Option<Account>, sqlx::Error> {
    sqlx::query_as::<_, Account>("SELECT id, owner, balance_cents FROM accounts WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}
```

Il placeholder rappresenta **un valore**, non un nome di colonna, un operatore o un frammento di `ORDER BY`. Per ordinamenti dinamici scegli fra espressioni SQL note; con `QueryBuilder` usa `push_bind` per i valori. Non interpolare nel testo SQL i dati ricevuti dall'utente.

### 2. Addebitare e accreditare sulla stessa connessione

Controlliamo il saldo **nello stesso UPDATE che effettua l'addebito**, non con un SELECT separato seguito da una decisione basata su un saldo potenzialmente superato. Entrambe le query usano `&mut *tx`, la connessione della transazione. Passare `pool` al posto di `tx` chiederebbe una connessione al pool: non arruola la query nella transazione e, con un pool da uno, può lasciarla in attesa.

```rust
#[derive(Debug, thiserror::Error)]
pub enum TransferError {
    #[error("importo non positivo o conti coincidenti")]
    Invalid,
    #[error("conto sorgente assente o saldo insufficiente")]
    DebitRejected,
    #[error("conto destinatario assente")]
    MissingTarget,
    #[error(transparent)]
    Db(#[from] sqlx::Error),
}

pub async fn transfer(
    pool: &SqlitePool,
    from: i64,
    to: i64,
    cents: i64,
) -> Result<(), TransferError> {
    if cents <= 0 || from == to {
        return Err(TransferError::Invalid);
    }
    let mut tx = pool.begin().await?;
    let debit = sqlx::query(
        "UPDATE accounts SET balance_cents = balance_cents - ? WHERE id = ? AND balance_cents >= ?",
    )
    .bind(cents)
    .bind(from)
    .bind(cents)
    .execute(&mut *tx)
    .await?;
    if debit.rows_affected() != 1 {
        tx.rollback().await?;
        return Err(TransferError::DebitRejected);
    }

    let credit = sqlx::query("UPDATE accounts SET balance_cents = balance_cents + ? WHERE id = ?")
        .bind(cents)
        .bind(to)
        .execute(&mut *tx)
        .await?;
    if credit.rows_affected() != 1 {
        tx.rollback().await?;
        return Err(TransferError::MissingTarget);
    }
    tx.commit().await?;
    Ok(())
}
```

- **Destinatario assente:** il secondo UPDATE riesce con zero righe. Il ramo esplicito attende il rollback, altrimenti il commit confermerebbe l'addebito senza accredito.
- **Accredito oltre il tetto:** il database rifiuta l'UPDATE per il vincolo `CHECK`. Qui `?` restituisce `TransferError::Db`; SQLx avvia il rollback quando la transazione ancora aperta viene rilasciata. Un rollback esplicito è utile quando vuoi attenderne e gestirne direttamente l'esito.
- **Successo:** soltanto dopo `commit().await?` restituiamo `Ok(())`. Un timeout del chiamante o un errore di comunicazione durante il commit non autorizzano a ritentare alla cieca un trasferimento reale: serve un identificatore di operazione e una strategia di riconciliazione.

### 3. Provare i saldi, non solo il risultato Rust

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn trasferimento_e_destinatario_assente() -> Result<(), Box<dyn std::error::Error>> {
        let pool = demo_pool().await?;
        sqlx::query(
            "INSERT INTO accounts (id, owner, balance_cents) VALUES (1, ?, 1000), (2, ?, 250)",
        )
        .bind("Ada")
        .bind("Lia")
        .execute(&pool)
        .await?;

        transfer(&pool, 1, 2, 300).await?;
        assert!(matches!(
            transfer(&pool, 1, 99, 100).await,
            Err(TransferError::MissingTarget)
        ));
        assert_eq!(find(&pool, 1).await?.unwrap().balance_cents, 700);
        assert_eq!(find(&pool, 2).await?.unwrap().balance_cents, 550);
        assert!(find(&pool, 99).await?.is_none());
        Ok(())
    }
}
```

```sh
cargo test --lib
```

Risultato atteso: il test passa e ogni esecuzione riparte con un database vuoto. Qui `migrate!` incorpora i file della migrazione; **non** effettua la verifica delle stringhe passate a `query` e `query_as`.

## Macro controllate e CI offline

Aggiungi quest'ultimo blocco a `src/lib.rs`. Senza la feature `checked` non viene compilato. Con la feature attiva, `query_scalar!` deve conoscere la colonna `balance_cents` **prima** di eseguire il programma.

```rust
#[cfg(feature = "checked")]
pub async fn checked_balance(pool: &SqlitePool, id: i64) -> Result<Option<i64>, sqlx::Error> {
    sqlx::query_scalar!("SELECT balance_cents FROM accounts WHERE id = ?", id)
        .fetch_optional(pool)
        .await
}
```

Per preparare i metadati servono **sqlx-cli 0.8.x con supporto SQLite** e un database di sviluppo con lo schema giusto. Esempio PowerShell dalla directory del progetto, indicando un **nuovo file locale di prova**, mai il database di produzione:

```powershell
$env:DATABASE_URL = "sqlite://schema-check.db"
```

```sh
sqlx database create
```

```sh
sqlx migrate run
```

```sh
cargo sqlx prepare -- --features checked
```

Versiona la directory generata `.sqlx/`, non il database o le credenziali. In una nuova sessione PowerShell, con i metadati presenti, forza SQLx a non interrogare il database di compilazione:

```powershell
$env:SQLX_OFFLINE = "true"
```

```sh
cargo check --features checked
```

Dopo una modifica a schema o query, riesegui `prepare` con la feature attiva e il database aggiornato. In una CI che dispone di quel database usa `cargo sqlx prepare --check -- --features checked` senza forzare la modalità offline. **`SQLX_OFFLINE` riguarda le macro, non Cargo né l'esecuzione delle query**: il programma continuerà ad aver bisogno del proprio database a runtime.

## Passaggio a PostgreSQL

| Nel demo SQLite | In un servizio PostgreSQL |
| --- | --- |
| `SqlitePoolOptions`, database in memoria | Abilita il driver `postgres`, configura TLS in base al deployment, crea un `PgPool` con `PgPoolOptions::new().max_connections(n).connect(url).await?` all'avvio e condividine l'handle. Vedi [[Programmazione/Rust/Pagine/Connection pooling\|Connection pooling]]. |
| Placeholder `?` separati | Placeholder numerati: l'addebito può usare `SET balance_cents = balance_cents - $1 WHERE id = $2 AND balance_cents >= $1`; fai il bind di importo e ID, in quest'ordine. |
| `INTEGER` SQLite per gli `i64` e tabella `STRICT` | Per gli stessi tipi usa `BIGINT` anche per l'ID; `STRICT` non fa parte di quel DDL PostgreSQL. Migrazioni e metadati checked devono corrispondere al driver e allo schema effettivamente usati. |

Il test SQLite dimostra le regole applicative, **non** il comportamento dei lock di PostgreSQL. Per un servizio che usa PostgreSQL prova sullo stesso motore migrazioni, contesa tra trasferimenti, isolamento e gestione degli errori. Mantieni la transazione breve, senza chiamate HTTP al suo interno; controlla indici e piani separatamente dalla verifica dei tipi.

## Fonti ufficiali

- [SQLx 0.8.6: query runtime e bind](https://docs.rs/sqlx/0.8.6/sqlx/fn.query.html)
- [query!: requisiti delle macro e metadati offline](https://docs.rs/sqlx/0.8.6/sqlx/macro.query.html)
- [query_as!: mapping su struct e differenze rispetto a FromRow](https://docs.rs/sqlx/0.8.6/sqlx/macro.query_as.html)
- [Transaction: commit, rollback e drop](https://docs.rs/sqlx/0.8.6/sqlx/struct.Transaction.html)
- [Guida sqlx-cli 0.8.6: database, migrazioni e prepare](https://github.com/launchbadge/sqlx/blob/v0.8.6/sqlx-cli/README.md)
- [SQLite: tipi ammessi e regole delle tabelle STRICT](https://www.sqlite.org/stricttables.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]
- [[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Diesel|Diesel]]
- [[Programmazione/Rust/Pagine/SeaORM|SeaORM]]
