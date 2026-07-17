---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [python, sqlite, sqlite3, database, standard-library]
aliases: [sqlite3 Python, SQLite Python]
prerequisites: [Context Managers, Error Handling]
related: [Standard Library, Gestione File]
---

# SQLite con sqlite3

## Sintesi

`sqlite3` e il modulo standard Python per usare database SQLite locali. Non richiede un server separato: il database e un file.

E utile per script, prototipi, app desktop, test, piccoli database embedded e persistenza locale semplice.

## Quando usarlo

Usa SQLite con `sqlite3` quando:

- vuoi un database locale leggero;
- stai costruendo un prototipo;
- devi salvare dati strutturati in uno script;
- vuoi testare logica SQL senza avviare un server;
- la concorrenza in scrittura e limitata.

Per applicazioni web con molti utenti concorrenti, valuta database server come PostgreSQL.

## Come funziona

Connessione:

```python
import sqlite3

with sqlite3.connect("app.db") as connection:
    cursor = connection.execute("SELECT sqlite_version()")
    print(cursor.fetchone())
```

Il context manager fa commit se il blocco termina correttamente e rollback se viene sollevata un'eccezione.

Creare una tabella:

```python
with sqlite3.connect("app.db") as connection:
    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
        )
    """)
```

## API / Sintassi

Query parametrizzata:

```python
user_id = 1

cursor = connection.execute(
    "SELECT id, name, email FROM users WHERE id = ?",
    (user_id,),
)

row = cursor.fetchone()
```

Inserimento:

```python
connection.execute(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    ("Luca", "luca@example.com"),
)
```

Restituire righe come dizionari-like:

```python
connection.row_factory = sqlite3.Row

row = connection.execute("SELECT * FROM users").fetchone()
print(row["email"])
```

## Esempio pratico

Repository minimale:

```python
import sqlite3


def create_schema(connection):
    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        )
    """)


def create_user(connection, name):
    cursor = connection.execute(
        "INSERT INTO users (name) VALUES (?)",
        (name,),
    )
    return cursor.lastrowid


with sqlite3.connect("app.db") as connection:
    create_schema(connection)
    user_id = create_user(connection, "Luca")
    print(user_id)
```

## Varianti

- **Database su file**: `sqlite3.connect("app.db")`.
- **Database in memoria**: `sqlite3.connect(":memory:")`, utile per test.
- **`row_factory`**: accesso alle colonne per nome.
- **Transazioni esplicite**: utili quando vuoi controllo preciso.
- **SQLite + SQLAlchemy**: quando vuoi ORM o astrazione database.

## Errori comuni

- Concatenare input utente dentro SQL invece di usare parametri.
- Dimenticare commit quando non si usa context manager.
- Usare SQLite per carichi con molte scritture concorrenti.
- Non gestire migrazioni dello schema.
- Non impostare vincoli come `NOT NULL`, `UNIQUE` o foreign key quando servono.
- Confondere database locale leggero con database server multiutente.

## Checklist

- Le query usano parametri?
- Il ciclo transazionale e chiaro?
- Lo schema ha vincoli adeguati?
- La concorrenza prevista e compatibile con SQLite?
- Esiste una strategia per modifiche schema?
- I test coprono inserimento, lettura ed errori principali?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Context Managers]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Standard Library]]
- [[SQLAlchemy]]
- [[Programmazione/Postgres/Indice postgres|Postgres]]
