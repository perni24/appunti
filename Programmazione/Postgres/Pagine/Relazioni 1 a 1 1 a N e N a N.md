---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: theory-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - modellazione
  - relazioni
aliases:
  - Relazioni 1:1
  - 1:N e N:N
prerequisites: []
related: []
---

# Relazioni 1:1, 1:N e N:N

## Sintesi

Le relazioni descrivono come le entita del dominio si collegano tra loro: uno-a-uno, uno-a-molti o molti-a-molti.

## Tipi

- **1:1**: una riga corrisponde al massimo a una riga nell'altra tabella.
- **1:N**: una riga padre puo avere molte righe figlie.
- **N:N**: molte righe da entrambi i lati, modellate con tabella ponte.

```sql
CREATE TABLE user_roles (
  user_id bigint REFERENCES users(id),
  role_id bigint REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
```

## Errori comuni

- Modellare N:N con array invece di tabella ponte.
- Non imporre unicita nelle relazioni 1:1.
- Usare nomi ambigui per foreign key.

## Problema che risolve

Da completare: descrivere il problema concettuale o tecnico che questa nota chiarisce.

## Concetto chiave

Da completare durante revisione.

## Dettagli importanti

- Da completare: aggiungere dettagli, casi limite e differenze da concetti simili.

## Esempio

```text
Da completare con un esempio minimo.
```

## Limiti

- Da completare: indicare limiti, ambiguita e casi in cui il concetto non basta.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/Postgres/Pagine/Normalizzazione|Normalizzazione]]
- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]


