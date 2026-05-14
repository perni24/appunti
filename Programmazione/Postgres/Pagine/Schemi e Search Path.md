---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Schemi e Search Path]
prerequisites: []
related: []
---
# Schemi e Search Path in PostgreSQL

## Sintesi

Nota su Schemi e Search Path in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
Un **Database Cluster** in PostgreSQL contiene uno o più database. Ogni database contiene uno o più **Schemi**. Uno schema è essenzialmente un namespace o una "cartella logica" che organizza tabelle, viste e funzioni, permettendo a più utenti di utilizzare lo stesso database senza conflitti di nomi.

---

##  Gestione degli Schemi

### 1. Lo schema `public`
Per impostazione predefinita, ogni nuovo database ha uno schema chiamato `public`. Se non specifichi uno schema durante la creazione di una tabella, questa verrà inserita qui.

### 2. Creare e utilizzare schemi personalizzati
```sql
# Schemi e Search Path in PostgreSQL

## Sintesi

Nota su Schemi e Search Path in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
CREATE SCHEMA vendite;

# Schemi e Search Path in PostgreSQL

## Sintesi

Nota su Schemi e Search Path in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
CREATE TABLE vendite.ordini ( ... );

# Schemi e Search Path in PostgreSQL

## Sintesi

Nota su Schemi e Search Path in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
SELECT * FROM vendite.ordini;
```

---

##  Il Search Path (Percorso di Ricerca)

Il `search_path` è un parametro di configurazione che determina l'ordine in cui Postgres cerca gli oggetti quando non viene usato un nome qualificato (es. `SELECT * FROM ordini;` invece di `vendite.ordini`).

### Visualizzare e impostare il Search Path
```sql
# Schemi e Search Path in PostgreSQL

## Sintesi

Nota su Schemi e Search Path in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
SHOW search_path;

# Schemi e Search Path in PostgreSQL

## Sintesi

Nota su Schemi e Search Path in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
SET search_path TO vendite, public;

# Schemi e Search Path in PostgreSQL

## Sintesi

Nota su Schemi e Search Path in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
ALTER ROLE luca SET search_path TO vendite, public;
```

---

## Logic layer: Isolamento e Sicurezza

Gli schemi sono lo strumento principale per implementare il **Multi-tenancy** (più clienti sullo stesso database) o per separare i dati per ambiente.

> [!INFO] Il ruolo di `"$user"`
> Spesso il `search_path` predefinito include `"$user"`. Questo significa che Postgres cercherà prima in uno schema che ha lo stesso nome dell'utente connesso, permettendo a ogni utente di avere le proprie tabelle private "trasparenti".

---

##  Casi d'Uso Tipici
- **Separazione Funzionale**: `anagrafiche`, `contabilita`, `logistica`.
- **Versioning**: `versione_1`, `versione_2`.
- **Sicurezza**: Creare uno schema `audit` accessibile solo a determinati ruoli.
- **Estensioni**: Molti amministratori installano le estensioni (es. PostGIS) in uno schema dedicato chiamato `extensions` per non sporcare il catalogo principale.

---

##  Best Practices
- **Evita lo schema `public`**: Per progetti medi o grandi, è meglio creare schemi dedicati e revocare i permessi di creazione su `public` per motivi di sicurezza.
- **Sii esplicito**: Nelle applicazioni e negli script di migrazione, usa nomi qualificati (`schema.tabella`) per evitare ambiguità se il `search_path` dovesse cambiare.
- **Usa gli schemi per le API**: Puoi definire funzioni e viste in uno schema `api` che funge da interfaccia pubblica, nascondendo la complessità delle tabelle reali.

---
