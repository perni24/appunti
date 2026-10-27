---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - sqlite
  - sqlite3
  - database
  - standard-library
aliases:
  - sqlite3 Python
  - SQLite Python
prerequisites:
  - "[[Programmazione/Python/Pagine/Context Managers]]"
  - "[[Programmazione/Python/Pagine/Error Handling]]"
related:
  - "[[Programmazione/Python/Pagine/Standard Library]]"
  - "[[Programmazione/Python/Pagine/Gestione File]]"
title: SQLite con sqlite3
---

# SQLite con sqlite3

## Sintesi

`sqlite3` permette di usare SQLite da Python senza un server separato: il database puo essere un file locale o vivere in memoria. E adatto a persistenza embedded, script, applicazioni desktop e prototipi.

Baseline: **Python 3.12**, verificata con **CPython 3.12.10 su Windows**, non l'ultima patch disponibile. Gli esempi usano `autocommit`, introdotto in Python 3.12; non copiarli invariati su 3.11. La versione di SQLite collegata all'interprete si legge con `sqlite3.sqlite_version`.

## Quando usarlo

- Dati locali strutturati con query, vincoli e transazioni.
- Applicazioni che non richiedono un server database separato.
- Test di codice che usa SQLite.

Non e un sostituto intercambiabile di PostgreSQL nei test: dialetto SQL, tipi, locking e migrazioni differiscono. Scegli in base al carico e alla distribuzione, non soltanto al numero di utenti.

## Come funziona

### Connessione e transazione sono due risorse diverse

```python
from contextlib import closing
import sqlite3

with closing(sqlite3.connect(":memory:", autocommit=False)) as connection:
    with connection:
        connection.execute("CREATE TABLE labels (name TEXT NOT NULL)")
        connection.execute("INSERT INTO labels VALUES (?)", ("draft",))
    rows = connection.execute("SELECT name FROM labels").fetchall()
    print(rows)  # [('draft',)]
```

`with connection` gestisce commit/rollback, **non chiude la connessione**. `closing` la chiude anche se si verifica un errore.

La modalita transazionale deve essere esplicita:

- `autocommit=False`: comportamento DB-API; dopo commit/rollback viene aperta una nuova transazione. Usa `with connection` o commit/rollback espliciti.
- `autocommit=True`: modalita autocommit di SQLite; `commit()` e `rollback()` Python non gestiscono una transazione e `with connection` non raggruppa le scritture.
- `LEGACY_TRANSACTION_CONTROL`: default di Python 3.12, legato a `isolation_level`. Non confonderlo con `False`.

Chiudere una connessione non sostituisce il commit. Non annidare `with connection` come se creasse savepoint indipendenti.

## API / Sintassi

- `execute(sql, parameters)`: esegue una istruzione e restituisce un cursore.
- `executemany(sql, rows)`: ripete un'istruzione; il confine transazionale resta al chiamante.
- `fetchone()`: restituisce una riga oppure `None`.
- Iterare il cursore evita `fetchall()` se il risultato e grande.
- `sqlite3.Row`: accesso per indice e nome; non e un `dict`, ma `dict(row)` costruisce una copia.
- `?` con tuple o `:name` con mapping: parametri per **valori**, non per nomi di tabella/colonna.
- `(user_id,)` e una tupla di un elemento; `(user_id)` non lo e.
- `IntegrityError`: vincoli violati; `OperationalError` puo segnalare, per esempio, un database bloccato. Non trasformare ogni errore in “riga assente”.

Gli identificatori dinamici richiedono una scelta fra nomi autorizzati; i parametri non risolvono quel problema. Non usare f-string con input dentro il testo SQL.

## Esempio pratico

Repository minimale con vincoli e rollback osservabile. Il demo usa solo un database in memoria; la funzione di connessione accetta anche un percorso su file.

```python
from contextlib import closing
import sqlite3

def open_database(path: str = ":memory:") -> sqlite3.Connection:
    connection = sqlite3.connect(path, autocommit=True, timeout=5)
    try:
        connection.execute("PRAGMA foreign_keys = ON")
        if connection.execute("PRAGMA foreign_keys").fetchone()[0] != 1:
            raise RuntimeError("Foreign key non abilitate")
        connection.row_factory = sqlite3.Row
        connection.autocommit = False
        return connection
    except BaseException:
        connection.close()
        raise

def create_schema(connection: sqlite3.Connection) -> None:
    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL CHECK (length(trim(name)) > 0),
            email TEXT NOT NULL UNIQUE
        )
    """)
    connection.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            title TEXT NOT NULL
        )
    """)

def create_user(connection: sqlite3.Connection, name: str, email: str) -> int:
    cursor = connection.execute(
        "INSERT INTO users (name, email) VALUES (?, ?)", (name, email)
    )
    if cursor.lastrowid is None:
        raise RuntimeError("Identificativo non disponibile")
    return cursor.lastrowid

with closing(open_database()) as connection:
    with connection:
        create_schema(connection)
        user_id = create_user(connection, "Luca", "luca@example.com")
    try:
        with connection:
            create_user(connection, "Anna", "anna@example.com")
            create_user(connection, "Duplicato", "luca@example.com")
    except sqlite3.IntegrityError:
        print("Intero secondo blocco annullato")
    row = connection.execute(
        "SELECT id, name, email FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    print(dict(row) if row is not None else None)
    count = connection.execute("SELECT count(*) FROM users").fetchone()[0]
    print(count)  # 1: anche Anna e stata annullata
```

La foreign key va abilitata **per ogni connessione**, fuori da una transazione. Il demo la abilita prima di passare a `autocommit=False` e verifica il risultato: un `PRAGMA foreign_keys=ON` dentro una transazione non la attiva.

Il `try` e esterno al blocco transazionale. Catturare e sopprimere l'errore _dentro_ `with connection` puo far confermare le operazioni precedenti. I repository non fanno commit: chi orchestra decide quali scritture appartengono alla stessa operazione.

`UNIQUE` sulla email nel demo non ne valida sintassi o equivalenza semantica. `CREATE TABLE IF NOT EXISTS` non aggiorna uno schema preesistente: servono migrazioni versionate.

## Varianti

### Backup tramite API

Copia coerente di un piccolo database in memoria verso un file temporaneo, poi verifica tramite una connessione di sola lettura. Il codice e autonomo e non modifica file personali.

```python
from contextlib import closing
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory

with TemporaryDirectory() as directory:
    target = Path(directory) / "backup.db"
    with closing(sqlite3.connect(":memory:", autocommit=True)) as source:
        source.execute("CREATE TABLE labels (name TEXT)")
        source.execute("INSERT INTO labels VALUES (?)", ("backup",))
        with closing(sqlite3.connect(target, autocommit=True)) as destination:
            source.backup(destination)
    uri = target.resolve().as_uri() + "?mode=ro"
    with closing(sqlite3.connect(uri, uri=True, autocommit=True)) as reader:
        saved = reader.execute("SELECT name FROM labels").fetchone()
        print(saved)  # ('backup',)
```

Non copiare soltanto il file principale di un database attivo in WAL: dati recenti possono essere nel file `-wal`. Per un backup reale scegli una destinazione dedicata e verifica anche il ripristino.

### Concorrenza e tipi

SQLite consente un solo writer per volta. WAL permette a lettori e writer di procedere contemporaneamente, ma non rende possibili piu writer simultanei e richiede processi sullo stesso host. `timeout` riguarda l'attesa di lock, non una durata massima universale delle query.

Di default una connessione Python va usata nel thread che l'ha creata. `check_same_thread=False` rimuove quel controllo, non implementa la sincronizzazione applicativa.

I tipi SQLite sono flessibili: `VARCHAR(20)` non impone automaticamente un limite di 20 caratteri. Usa vincoli adeguati o valuta tabelle STRICT secondo la versione SQLite. Definisci esplicitamente come rappresentare date e booleani. Gli adapter/converter predefiniti per date e timestamp sono deprecati da Python 3.12.

SQLAlchemy puo aggiungere un ORM, ma non cancella i limiti del database sottostante.

## Errori comuni

- Supporre che `with sqlite3.connect(...)` chiuda il file.
- Affidarsi a default transazionali senza dichiarare la versione.
- Abilitare le foreign key quando una transazione e gia aperta.
- Usare `executescript` come sostituto universale di una transazione: in modalita legacy puo confermare una transazione pendente prima dello script.
- Tenere aperte transazioni durante chiamate di rete o lunghe elaborazioni.
- Considerare un test SQLite una prova di compatibilita PostgreSQL.

## Checklist

- Parametri separati dall'SQL e vincoli verificati?
- Chiaramente distinti commit, rollback e close?
- Schema e migrazioni controllati?
- Foreign key abilitate e verificate su ciascuna connessione?
- Concorrenza, backup e ripristino provati per l'applicazione reale?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Pagine/SQLAlchemy|SQLAlchemy]]
- [[Programmazione/PostgreSQL/Indice PostgreSQL|PostgreSQL]]

## Fonti

- [Python 3.12: sqlite3 e controllo delle transazioni](https://docs.python.org/3.12/library/sqlite3.html).
- [PEP 249: connessioni, cursori ed errori DB-API](https://peps.python.org/pep-0249/).
- [SQLite: attivazione delle foreign key](https://www.sqlite.org/foreignkeys.html).
- [SQLite: isolamento](https://sqlite.org/isolation.html) e [WAL](https://sqlite.org/wal.html).
- [SQLite: tipi e affinity](https://sqlite.org/datatype3.html).
