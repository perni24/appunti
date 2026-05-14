---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, sqlite, sqlite3, database, standard-library]
aliases: [sqlite3 Python]
prerequisites: [Context Managers, Error Handling]
related: [Standard Library, Gestione File]
---

# SQLite con sqlite3

## Sintesi

`sqlite3` e il modulo standard Python per usare database SQLite locali.

E utile per script, prototipi, app desktop, test e piccoli database embedded.

## Connessione

```python
import sqlite3

with sqlite3.connect("app.db") as conn:
    cursor = conn.execute("SELECT sqlite_version()")
    print(cursor.fetchone())
```

Il context manager gestisce commit o rollback a seconda dell'esito.

## Query parametrizzate

```python
user_id = 1

cursor = conn.execute(
    "SELECT id, name FROM users WHERE id = ?",
    (user_id,),
)
```

Usa sempre parametri invece di concatenare stringhe SQL.

## Creare tabelle

```python
conn.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
)
""")
```

## Errori comuni

- Costruire SQL concatenando input utente.
- Dimenticare commit quando non si usa context manager.
- Usare SQLite per carichi concorrenti non adatti.
- Non gestire migrazioni dello schema.

## Collegamenti

- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
