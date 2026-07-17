---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: theory-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - postgres
  - modellazione
aliases: []
prerequisites: []
related: []
---

# Relazioni 1 a 1, 1 a N e N a N

## Sintesi

Le relazioni descrivono come le entita del dominio si collegano: uno-a-uno, uno-a-molti e molti-a-molti. In PostgreSQL si modellano con primary key, foreign key e tabelle ponte.

## Quando usarlo

Serve durante progettazione schema, normalizzazione, definizione foreign key e scrittura di join.

## Come funziona

Una relazione 1:1 usa una foreign key unica. Una relazione 1:N mette la foreign key sul lato molti. Una relazione N:N richiede una tabella ponte con due foreign key.

## API / Sintassi

1:N:

```sql
CREATE TABLE customers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);

CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customers(id)
);
```

N:N:

```sql
CREATE TABLE users_roles (
  user_id bigint REFERENCES users(id),
  role_id bigint REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
```

## Esempio pratico

Utente e profilo 1:1:

```sql
CREATE TABLE user_profiles (
  user_id bigint PRIMARY KEY REFERENCES users(id),
  display_name text NOT NULL
);
```

La primary key su `user_id` impedisce piu profili per lo stesso utente.

## Varianti

- 1:1 obbligatoria.
- 1:1 opzionale.
- 1:N classica.
- N:N con tabella ponte.
- Tabella ponte con attributi aggiuntivi.
- Relazione ricorsiva, per esempio manager/dipendente.

## Errori comuni

- Salvare liste di ID in una colonna testuale.
- Modellare N:N senza tabella ponte.
- Dimenticare indici sulle foreign key.
- Usare `ON DELETE CASCADE` senza valutare effetti.
- Confondere relazione opzionale con `NOT NULL`.

## Checklist

- La cardinalita e chiara?
- La foreign key e sul lato corretto?
- Le relazioni N:N hanno tabella ponte?
- Le policy `ON DELETE` sono esplicite?
- Le foreign key usate in join sono indicizzate?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Normalizzazione|Normalizzazione]]
- [[Programmazione/Postgres/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]
