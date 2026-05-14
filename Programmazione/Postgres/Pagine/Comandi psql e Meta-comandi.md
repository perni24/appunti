---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Comandi psql e Meta-comandi]
prerequisites: []
related: []
---
# Comandi psql e Meta-comandi

## Sintesi

Nota su Comandi psql e Meta-comandi in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
`psql` è l'interfaccia a riga di comando (CLI) interattiva ufficiale per PostgreSQL. Oltre all'esecuzione di query SQL standard, offre una vasta gamma di **meta-comandi** (identificati dal prefisso backslash `\`) che permettono di ispezionare il database, gestire le connessioni e automatizzare script senza dover interrogare direttamente le tabelle di sistema (`information_schema`).

---

##  Meta-comandi di Ispezione

Questi comandi sono essenziali per navigare nella struttura del database. Se aggiungi un `+` alla fine (es. `\d+`), otterrai informazioni molto più dettagliate.

| Comando | Descrizione |
| :--- | :--- |
| `\l` | Elenca tutti i **database** disponibili nel cluster. |
| `\c [nome_db]` | Si **connette** a un database specifico. |
| `\dn` | Elenca tutti gli **schemi**. |
| `\dt` | Elenca le **tabelle** presenti nello schema corrente. |
| `\di` | Elenca gli **indici**. |
| `\df` | Elenca le **funzioni**. |
| `\dv` | Elenca le **viste**. |
| `\du` | Elenca gli **utenti** (ruoli) e i loro permessi. |
| `\d [nome_tabella]` | Mostra la **definizione** della tabella (colonne, tipi, vincoli). |

---

##  Comandi di Gestione e Utility

### 1. `\copy` (Import/Export Client-side)
A differenza del comando SQL `COPY` (che richiede l'utente superuser e file sul filesystem del server), `\copy` funziona con i permessi dell'utente locale e file residenti sul client.

```bash
# Comandi psql e Meta-comandi

## Sintesi

Nota su Comandi psql e Meta-comandi in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
\copy mia_tabella TO 'backup_dati.csv' WITH (FORMAT CSV, HEADER);

# Comandi psql e Meta-comandi

## Sintesi

Nota su Comandi psql e Meta-comandi in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
\copy mia_tabella FROM 'nuovi_dati.csv' WITH (FORMAT CSV, HEADER);
```

### 2. `\watch` (Monitoraggio)
Esegue ripetutamente la query precedente ogni $N$ secondi. Estremamente utile per monitorare processi lunghi o l'occupazione della memoria.
```sql
SELECT count(*) FROM sessioni_attive;
\watch 2
```

### 3. `\x` (Expanded Display)
Attiva o disattiva la visualizzazione estesa. Utile quando le righe hanno molte colonne che non entrano nello schermo (trasforma le colonne in righe verticali).

---

## Logic layer: Scripting e Output

`psql` può essere utilizzato per eseguire script direttamente dal terminale del sistema operativo:

- **Esecuzione file:** `psql -d mio_db -f script.sql`
- **Singolo comando:** `psql -c "SELECT now();"`
- **Output pulito:** L'opzione `-t` rimuove le intestazioni delle colonne e i riepiloghi finali, ideale per passare dati a strumenti come `grep` o `awk`.

> [!TIP] Editare query complesse
> Se stai scrivendo una query molto lunga e complessa, usa il comando `\e`. Si aprirà l'editor di testo predefinito (es. Vim o Nano); salvando e uscendo, la query verrà eseguita immediatamente in psql.

---

##  Uscita e Aiuto
- **`\q`**: Chiude la sessione psql (Quit).
- **`\?`**: Mostra l'aiuto per tutti i meta-comandi.
- **`\h [nome_comando]`**: Mostra l'aiuto per un comando SQL specifico (es. `\h SELECT`).

---
