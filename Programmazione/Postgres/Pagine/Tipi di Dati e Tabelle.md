---
tags:
  - programmazione
  - postgres
  - teoria
argomento: "Tipi di Dati e Tabelle"
data: "2025-12-21"
stato: 📝 in_elaborazione
---

# Tipi di Dati e Tabelle

## 💡 Concetto Chiave
In PostgreSQL, i dati sono organizzati in **tabelle** relazionali. Ogni colonna di una tabella ha un **tipo di dato** specifico che definisce la natura dell'informazione che può contenere (numeri, testo, date, JSON, ecc.) e le operazioni consentite su di essa.

---

## 📝 Sintassi
La creazione di una tabella e la definizione dei tipi avviene tramite il comando `CREATE TABLE`.

```sql
CREATE TABLE nome_tabella (
    nome_colonna1 TIPO_DATO [VINCOLI],
    nome_colonna2 TIPO_DATO [VINCOLI],
    ...
    PRIMARY KEY (nome_colonna_chiave)
);
```

### Tipi di Dati Comuni
- **Numerici:** `INTEGER` (o `INT`), `SERIAL` (auto-incrementante), `NUMERIC(p,s)` (decimale esatto), `REAL`/`DOUBLE PRECISION` (virgola mobile).
- **Testo:** `VARCHAR(n)` (lunghezza variabile con limite), `TEXT` (lunghezza variabile illimitata, preferito in Postgres), `CHAR(n)` (lunghezza fissa).
- **Date/Tempo:** `TIMESTAMP` (data e ora), `DATE` (solo data), `TIME` (solo ora), `INTERVAL` (durata).
- **Booleani:** `BOOLEAN` (TRUE, FALSE, NULL).
- **Strutturati:** `JSONB` (JSON binario indicizzabile), `ARRAY`.

---

## 💻 Esempi Pratici

### Esempio Base: Creazione Tabella Utenti
```sql
CREATE TABLE utenti (
    id SERIAL PRIMARY KEY,           -- Intero auto-incrementante
    username VARCHAR(50) NOT NULL,   -- Testo max 50 car, obbligatorio
    email TEXT UNIQUE,               -- Testo illimitato, unico
    is_active BOOLEAN DEFAULT true,  -- Booleano con default
    created_at TIMESTAMP DEFAULT NOW() -- Data creazione automatica
);
```

### Esempio Avanzato: Tipi Complessi (JSONB)
```sql
CREATE TABLE prodotti (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    prezzo NUMERIC(10, 2), -- 10 cifre totali, 2 decimali
    attributi JSONB        -- Dati semi-strutturati (es. colore, taglia)
);

-- Inserimento dati JSON
INSERT INTO prodotti (nome, prezzo, attributi)
VALUES ('T-Shirt', 19.99, '{"colore": "blu", "taglia": "L"}');
```

---

## ⚙️ Funzionamento Interno (Teoria)
- **Gestione Memoria (Pages & Tuples):** Postgres salva i dati in file divisi in "pages" (di default 8kB). Le righe sono chiamate "tuples".
- **TOAST:** Per campi molto grandi (come `TEXT` o `JSONB` lunghi), Postgres usa una tecnica chiamata TOAST (The Oversized-Attribute Storage Technique) per comprimerli e salvarli "out-of-line", mantenendo la tabella principale snella.
- **MVCC:** Postgres usa il Multiversion Concurrency Control. Quando aggiorni una riga, non sovrascrive quella vecchia ma ne crea una nuova versione, marcando la vecchia come "morta" (da pulire poi con VACUUM).

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Da fare:** Usa `TEXT` invece di `VARCHAR` se non hai uno stretto bisogno di limitare la lunghezza (in Postgres non c'è differenza di performance).
- ✅ **Da fare:** Usa `JSONB` invece di `JSON` per permettere l'indicizzazione e query più veloci.
- ✅ **Da fare:** Usa sempre la Primary Key.
- ❌ **Da evitare:** Usare `FLOAT` o `REAL` per importi monetari (errori di arrotondamento). Usa `NUMERIC` o `DECIMAL`.
- 💣 **Errori comuni:** Dimenticare che i nomi non quotati (`nomeTabella`) vengono convertiti in minuscolo (`nometabella`). Usa `snake_case` per evitare problemi.

---

## 📚 Riferimenti
- [Documentazione Ufficiale Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [[Comandi Base]]
