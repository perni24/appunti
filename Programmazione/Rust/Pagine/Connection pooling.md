---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - Connection pooling
  - Pool di connessioni
prerequisites:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]"
related:
  - "[[Programmazione/Rust/Pagine/SQLx|SQLx]]"
  - "[[Programmazione/Rust/Pagine/Diesel|Diesel]]"
  - "[[Programmazione/Rust/Pagine/SeaORM|SeaORM]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]"
title: Connection pooling
---

# Connection pooling

## Sintesi

Un pool mantiene un numero limitato di connessioni riutilizzabili. **Clonare un `Pool` SQLx non apre una connessione e non aumenta la capacità:** i cloni sono handle dello stesso pool. Se tutte le connessioni sono in uso, anche un semplicissimo `SELECT 1` può fallire *prima* di arrivare al database.

Crea il pool una volta all'avvio del servizio e condividilo tra gli handler; non serve un altro `Mutex` intorno all'handle. Una CLI che esegue una sola operazione può invece usare direttamente una connessione. Questa nota tratta il pool **nel processo Rust**; un pooler esterno come [[Programmazione/PostgreSQL/Pagine/Connection Pooling|PgBouncer]] è un livello distinto, con limiti propri.

## Chi occupa la connessione?

| Oggetto o chiamata | Cosa accade | Quando torna disponibile il posto |
| --- | --- | --- |
| `pool.clone()` | Condivide il pool; non prende in prestito una connessione. | Non occupa un posto. |
| `fetch_one(&pool)` | SQLx acquisisce una connessione per l'operazione. | SQLx la restituisce al termine, se ancora utilizzabile. Uno stream di righe ancora in uso può trattenerla più a lungo. |
| `pool.acquire().await?` | Consegna una `PoolConnection`: le query su `&mut *conn` usano quella connessione. | Uscendo dallo scope o con `drop(conn)` parte la restituzione; non presumere che sia già inattiva nello stesso istante. |
| `pool.begin().await?` | La transazione trattiene una connessione per raggruppare operazioni atomiche. | Dopo commit o rollback e restituzione. Usa `&mut *tx` per le query della transazione. |

Due query consecutive su `&pool` **non hanno una garanzia di sessione comune**. Al contrario, se hai già una transazione e passi `&pool` a una funzione invece di passarle la connessione della transazione, la funzione proverà ad acquisirne un'altra. Con un pool da uno puoi finire ad aspettare proprio il posto che stai trattenendo. Vedi l'esempio di [[Programmazione/Rust/Pagine/SQLx|trasferimento con SQLx]].

## Esempio: saturare un pool da uno

Il demo usa SQLx 0.8 e SQLite in memoria. Una sola connessione rende la contesa riproducibile; non è una raccomandazione per la produzione. Servono Rust/Cargo con edition 2024, compilatore C e linker per SQLite. Non occorre avviare un database o un server HTTP.

```sh
cargo new --lib --edition 2024 pool-demo
```

```sh
cd pool-demo
```

In `Cargo.toml` sostituisci la sezione vuota `[dependencies]` con:

```toml
[features]
postgres-demo = ["sqlx/postgres"]

[dependencies]
axum = { version = "0.8", default-features = false }
sqlx = { version = "~0.8.6", default-features = false, features = ["runtime-tokio", "sqlite"] }

[dev-dependencies]
tokio = { version = "1", features = ["macros", "rt"] }
```

### 1. Condividere il pool e distinguere le due sonde

Sostituisci `src/lib.rs` con questo blocco. `/live` indica che l'applicazione può rispondere; `/ready` restituisce `204` solo se riesce a eseguire la sonda sul database. Su questo endpoint un errore dà `503` senza esporre dettagli interni. In produzione registra separatamente la causa: pool occupato, pool in chiusura ed errore SQL non richiedono lo stesso intervento.

```rust
use std::time::Duration;

use axum::{Router, extract::State, http::StatusCode, routing::get};
use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};

pub async fn demo_pool(wait: Duration) -> Result<SqlitePool, sqlx::Error> {
    SqlitePoolOptions::new()
        .max_connections(1)
        .acquire_timeout(wait)
        .connect("sqlite::memory:")
        .await
}

async fn ready(State(pool): State<SqlitePool>) -> StatusCode {
    match sqlx::query_scalar::<_, i64>("SELECT 1")
        .fetch_one(&pool)
        .await
    {
        Ok(1) => StatusCode::NO_CONTENT,
        _ => StatusCode::SERVICE_UNAVAILABLE,
    }
}

pub fn router(pool: SqlitePool) -> Router {
    Router::new()
        .route("/live", get(|| async { StatusCode::NO_CONTENT }))
        .route("/ready", get(ready))
        .with_state(pool)
}
```

Una sonda sullo stesso pool risponde a una domanda precisa: **questa istanza riesce a usare il database attraverso il normale percorso applicativo?** Un `503` non dimostra che il database sia spento; un `204` non verifica tutte le tabelle, le migrazioni o i permessi di scrittura. Evita sonde troppo frequenti: competono per gli stessi posti degli utenti.

### 2. Osservare attesa, rilascio e chiusura

Aggiungi il test in fondo a `src/lib.rs`. L'ordine non dipende dalla velocità di due task: il test mantiene deliberatamente la prima connessione per tutta la seconda acquisizione.

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn i_cloni_condividono_un_posto() -> Result<(), sqlx::Error> {
        let pool = demo_pool(Duration::from_secs(1)).await?;
        let other = pool.clone();
        let mut conn = pool.acquire().await?;

        assert!(other.try_acquire().is_none());
        assert!(matches!(
            other.acquire().await,
            Err(sqlx::Error::PoolTimedOut)
        ));
        let one: i64 = sqlx::query_scalar("SELECT 1").fetch_one(&mut *conn).await?;
        assert_eq!(one, 1);

        drop(conn);
        let again: i64 = sqlx::query_scalar("SELECT 1").fetch_one(&other).await?;
        assert_eq!(again, 1);

        pool.close().await;
        assert!(matches!(
            other.acquire().await,
            Err(sqlx::Error::PoolClosed)
        ));
        Ok(())
    }
}
```

```sh
cargo test --lib
```

`try_acquire()` non attende e non apre una nuova connessione. In questa prova il motivo del `None` è noto: l'unica connessione è in uso. In generale significa che non c'è una connessione immediatamente ottenibile, **non** che il server sia guasto. Dopo il timeout la prima connessione esegue ancora la query: il limite non ne revoca il prestito. Dopo `close()`, invece, nemmeno un clone può acquisire di nuovo.

## Tre tempi diversi

| Intervallo | Cosa comprende | Quale limite usare |
| --- | --- | --- |
| Acquisizione | Attesa di un posto e, se necessarie, apertura, verifica della connessione o callback di acquisizione. | `acquire_timeout` di SQLx. `PoolTimedOut` da solo non prova che tutti i posti fossero occupati. |
| Esecuzione SQL | Dal momento in cui la connessione è disponibile: include lavoro del DB e possibili attese su lock. | Politica di esecuzione sul database; in PostgreSQL distingui `statement_timeout` da `lock_timeout`, che riguarda solo l'attesa del lock. |
| Richiesta completa | Acquisizione, query, altri servizi, serializzazione e risposta, secondo il punto dove inizi a misurare. | Una scadenza applicativa coerente con quelle interne; vedi [[Programmazione/Rust/Pagine/Tower e middleware|Tower e middleware]]. |

Non tenere una connessione presa in prestito mentre aspetti una chiamata HTTP che non la usa. E non equiparare il timeout del chiamante a un rollback: se la richiesta smette di attendere durante un commit, l'esito della scrittura può richiedere verifica.

## Dimensionamento e diagnosi

1. **Conta i pool, non gli handler.** Esempio con connessioni dirette: su 100 posti disponibili, ne riservi 20 per amministrazione e altri servizi; due worker con un pool da 10 ciascuno ne possono usare altri 20. Se durante il deploy possono convivere **cinque** repliche web, il tetto teorico è `(100 - 20 - 2 × 10) / 5 = 12` connessioni per replica. È un limite di budget, non una promessa di throughput. Includi anche eventuali pool per tenant.
2. **Misura separatamente attesa, possesso e query.** Se il tempo di acquisizione cresce ma le query sono brevi, guarda quanto a lungo ogni task trattiene la connessione. Se cresce il tempo SQL, esamina piani, I/O e [[Programmazione/PostgreSQL/Pagine/Lock monitoring|attese su lock]]. `pool.size()` e `pool.num_idle()` sono istantanee, non misurano né la lunghezza della coda né la causa della saturazione.
3. **Cambia un limite alla volta.** Più connessioni possono aumentare la contesa sul DB. `min_connections` riguarda il numero minimo che il pool cerca di mantenere, non i posti riservati a un tipo di richiesta. `idle_timeout` e `max_lifetime` regolano il ricambio delle connessioni, non la durata di una query. Un tetto al pool non impedisce da solo l'accumulo di task in attesa.
4. **Chiudi nell'ordine giusto.** A fine servizio smetti di accettare nuovo lavoro, lascia terminare quello già ammesso secondo una scadenza e chiudi il pool. `pool.close().await` rifiuta nuove acquisizioni e aspetta il rientro delle connessioni in uso. Non attenderlo mentre trattieni tu stesso una connessione che rilasceresti solo dopo. Vedi [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]].

## Variante PostgreSQL

Questo blocco opzionale va nello stesso `src/lib.rs`. `max` e `wait` arrivano dalla configurazione; non creare un nuovo `PgPool` per ogni chiamata a `count_users`. La funzione di lettura usa una query runtime: per **compilarla** non serve la tabella, per **eseguirla** servono PostgreSQL, la tabella `users` e i permessi di lettura. Configura il supporto TLS richiesto dal deployment prima di usare un database remoto.

```rust
#[cfg(feature = "postgres-demo")]
pub mod postgres {
    use super::Duration;
    use sqlx::{PgPool, postgres::PgPoolOptions};

    pub async fn open(url: &str, max: u32, wait: Duration) -> Result<PgPool, sqlx::Error> {
        PgPoolOptions::new()
            .max_connections(max)
            .acquire_timeout(wait)
            .connect(url)
            .await
    }

    pub async fn count_users(pool: &PgPool) -> Result<i64, sqlx::Error> {
        sqlx::query_scalar("SELECT COUNT(*) FROM users")
            .fetch_one(pool)
            .await
    }
}
```

```sh
cargo check --features postgres-demo
```

Con [[Programmazione/Rust/Pagine/SeaORM|SeaORM]] condividi l'handle di connessione configurato all'avvio; con un pool sincrono per [[Programmazione/Rust/Pagine/Diesel|Diesel]] anche l'acquisizione può bloccare il thread. In un handler async non basta avvolgere il pool in uno stato clonabile: isola acquisizione e lavoro sincrono dal runtime. Per un client HTTP, verifica prima se ha già un pool interno invece di costruirne un altro.

## Fonti ufficiali

- [SQLx 0.8.6: Pool, acquire, try_acquire, metriche e chiusura](https://docs.rs/sqlx/0.8.6/sqlx/struct.Pool.html)
- [PoolOptions: cosa conta nel timeout e come avviene il ricambio](https://docs.rs/sqlx/0.8.6/sqlx/pool/struct.PoolOptions.html)
- [PoolConnection: restituzione della connessione al pool](https://docs.rs/sqlx/0.8.6/sqlx/pool/struct.PoolConnection.html)
- [PostgreSQL: statement_timeout e lock_timeout](https://www.postgresql.org/docs/current/runtime-config-client.html#RUNTIME-CONFIG-CLIENT-STATEMENT)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/SQLx|SQLx]]
- [[Programmazione/Rust/Pagine/Diesel|Diesel]]
- [[Programmazione/Rust/Pagine/SeaORM|SeaORM]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
