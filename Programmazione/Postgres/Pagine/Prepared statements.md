---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - postgres
  - performance
  - sql
aliases: []
prerequisites: []
related: []
---

# Prepared statements

## Sintesi

I prepared statements separano preparazione ed esecuzione di una query parametrica. Aiutano sicurezza, riuso e talvolta performance, specialmente tramite driver applicativi.

## Quando usarlo

Usali per query ripetute, parametri utente, riduzione SQL injection e integrazione con driver.

## Come funziona

PostgreSQL prepara il piano o la struttura della query e poi la esegue passando parametri. I segnaposto evitano concatenazione di stringhe SQL non sicure.

## API / Sintassi

```sql
PREPARE get_user_by_email(text) AS
SELECT id, email
FROM users
WHERE email = $1;

EXECUTE get_user_by_email('ada@example.com');

DEALLOCATE get_user_by_email;
```

## Esempio pratico

Nel codice applicativo e preferibile usare parametri del driver:

```sql
SELECT id, email
FROM users
WHERE email = $1;
```

Il valore viene passato separatamente dal testo SQL.

## Varianti

- Prepared statement SQL con `PREPARE`.
- Prepared statement gestiti dal driver.
- Server-side prepared statements.
- Generic plan e custom plan.
- Statement cache lato driver.

## Errori comuni

- Concatenare input utente nella query.
- Preparare troppe query diverse e consumare memoria.
- Usare prepared statements con pooler transaction senza verificarne compatibilita.
- Aspettarsi sempre miglioramento performance.
- Non tipizzare correttamente i parametri.

## Checklist

- Gli input utente sono parametri?
- Il driver gestisce prepared statements?
- Il pooler e compatibile?
- La query viene riusata abbastanza?
- Il piano scelto e ancora buono per parametri diversi?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Connection Pooling|Connection Pooling]]
