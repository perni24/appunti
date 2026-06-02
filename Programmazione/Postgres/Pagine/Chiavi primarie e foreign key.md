---
date: 2026-06-02
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

## Quando usarlo

Usa primary key e foreign key quando modelli entita e relazioni:

- una tabella deve identificare ogni riga in modo stabile;
- una tabella figlia dipende da una tabella padre;
- vuoi impedire righe orfane;
- vuoi rendere esplicite relazioni 1:1, 1:N o N:N;
- vuoi che il database protegga la coerenza anche fuori dall'applicazione.

## Come funziona

### Perche servono
- Evitano righe orfane.
- Rendono esplicite le relazioni.
- Aiutano il modello dati a descrivere il dominio.

## API / Sintassi

Primary key:

```sql
CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE
);
```

Foreign key con nome esplicito:

```sql
CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL,

  CONSTRAINT orders_user_fk
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
);
```

Indice sulla colonna referenziante:

```sql
CREATE INDEX orders_user_id_idx ON orders (user_id);
```

## Esempio pratico

### Esempio
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

## Varianti

- Chiave primaria surrogate: ID tecnico come `bigint` identity o `uuid`.
- Chiave primaria naturale: valore del dominio, per esempio codice ISO o slug stabile.
- Chiave composta: piu colonne identificano la riga.
- Foreign key nullable: relazione opzionale.
- Foreign key con `ON DELETE CASCADE`: elimina automaticamente i figli.
- Foreign key con `ON DELETE SET NULL`: scollega i figli senza eliminarli.
- Foreign key `DEFERRABLE`: controllo rimandabile fino al commit.

## Errori comuni

- Usare foreign key solo nell'applicazione e non nel database.
- Dimenticare indici sulle colonne referenzianti molto usate.
- Non scegliere policy `ON DELETE` coerenti.

## Checklist

- Ogni tabella principale dovrebbe avere una primary key.
- Usare chiavi stabili, non valori che cambiano spesso.
- Aggiungere foreign key per relazioni reali tra tabelle.
- Scegliere esplicitamente la policy `ON DELETE`.
- Indicizzare foreign key usate in join, filtri o cancellazioni.
- Usare tabelle ponte per relazioni molti-a-molti.

## Collegamenti

- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
- [[Programmazione/Postgres/Pagine/Normalizzazione|Normalizzazione]]
- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]
