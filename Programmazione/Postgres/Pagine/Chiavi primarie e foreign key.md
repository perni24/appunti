---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - vincoli
  - modellazione
aliases: []
prerequisites: []
related: []
---

# Chiavi primarie e foreign key

## Sintesi

Una **primary key** identifica univocamente una riga. Una **foreign key** collega una tabella a un'altra, mantenendo integrita referenziale.

## Esempio

```sql
CREATE TABLE users (
  id bigserial PRIMARY KEY,
  email text NOT NULL UNIQUE
);

CREATE TABLE orders (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id)
);
```

## Perche servono

- Evitano righe orfane.
- Rendono esplicite le relazioni.
- Aiutano il modello dati a descrivere il dominio.

## Errori comuni

- Usare foreign key solo nell'applicazione e non nel database.
- Dimenticare indici sulle colonne referenzianti molto usate.
- Non scegliere policy `ON DELETE` coerenti.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
- [[Programmazione/Postgres/Pagine/Normalizzazione|Normalizzazione]]
- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]


