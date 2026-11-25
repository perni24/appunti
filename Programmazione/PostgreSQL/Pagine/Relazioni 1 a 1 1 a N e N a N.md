---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: theory-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - modellazione
aliases: []
prerequisites: []
related: []
title: Relazioni 1 a 1, 1 a N e N a N
---

# Relazioni 1 a 1, 1 a N e N a N

## Sintesi

Per modellare una relazione servono **due domande, una per direzione**: a quante righe di B può corrispondere una riga di A? E quante sono obbligatorie? Dire «uno a uno» senza specificare il minimo non distingue un profilo facoltativo da un profilo richiesto.

| Regola del dominio | Vincolo che la realizza | Cosa rimane possibile |
| --- | --- | --- |
| Un socio ha al massimo un profilo; ogni profilo appartiene a un socio | La PK del profilo è anche una FK verso il socio | Un socio senza profilo |
| Un socio può avere più incarichi; ogni incarico ha un socio | FK `NOT NULL` sul lato **incarichi**, senza `UNIQUE` | Un socio con zero incarichi |
| Un socio può aderire a più circoli e viceversa | Tabella iscrizioni con due FK e PK sulla coppia | Un socio o un circolo senza iscrizioni |

## Esempio: soci, profili e iscrizioni

Esegui i due blocchi nella stessa sessione. La cancellazione di un socio elimina profilo e iscrizioni, che dipendono da lui; la presenza di un incarico impedisce invece di eliminarlo prima di riassegnare o chiudere l'incarico (in questo esempio, rimuoverne la riga).

```sql
BEGIN;
CREATE TEMP TABLE lab_members (id integer PRIMARY KEY, name text NOT NULL);
CREATE TEMP TABLE lab_profiles (
  member_id integer PRIMARY KEY REFERENCES lab_members ON DELETE CASCADE,
  nickname text NOT NULL
);
CREATE TEMP TABLE lab_tasks (
  id integer PRIMARY KEY,
  member_id integer NOT NULL REFERENCES lab_members ON DELETE RESTRICT
);
CREATE TEMP TABLE lab_clubs (id integer PRIMARY KEY, name text NOT NULL);
CREATE TEMP TABLE lab_memberships (
  member_id integer REFERENCES lab_members ON DELETE CASCADE,
  club_id integer REFERENCES lab_clubs ON DELETE CASCADE,
  joined_on date NOT NULL,
  PRIMARY KEY (member_id, club_id)
);
INSERT INTO lab_members VALUES (1, 'Ada'), (2, 'Lia'), (3, 'Teo');
INSERT INTO lab_profiles VALUES (1, 'ada1');
INSERT INTO lab_tasks VALUES (10, 1), (11, 1);
INSERT INTO lab_clubs VALUES (7, 'Lettura'), (8, 'Musica');
INSERT INTO lab_memberships VALUES
  (1, 7, DATE '2026-05-01'), (1, 8, DATE '2026-05-02'), (2, 7, DATE '2026-05-03');
```

```sql
SELECT m.name, p.nickname,
       (SELECT count(*) FROM lab_tasks AS t WHERE t.member_id = m.id) AS tasks,
       (SELECT count(*) FROM lab_memberships AS s WHERE s.member_id = m.id) AS clubs
FROM lab_members AS m LEFT JOIN lab_profiles AS p ON p.member_id = m.id
ORDER BY m.id;
ROLLBACK;
```

Ada ha profilo `ada1`, due incarichi e due iscrizioni. Lia non ha profilo né incarichi, ma ha un'iscrizione; Teo non ha nessuno dei tre. Contare incarichi e iscrizioni **separatamente** evita di ottenere quattro combinazioni per Ada: un unico join sui due insiemi di figli moltiplicherebbe le righe prima del conteggio.

## Limiti e varianti

- **Profilo obbligatorio in entrambe le direzioni:** la PK condivisa impedisce un secondo profilo ma non intercetta l'inserimento di un socio senza profilo. Se i dati hanno lo stesso ciclo di vita, metti i campi davvero obbligatori nella tabella dei soci con `NOT NULL`.
- **Dati della relazione:** `joined_on` descrive l'iscrizione, non il socio né il circolo. La PK sulla coppia vieta un secondo record anche con data diversa. Per conservare uscite e reiscrizioni, modella periodi distinti e decidi se vietarne la sovrapposizione: una PK sulla coppia da sola non rappresenta uno storico.
- **Relazione ricorsiva:** una FK nullable `manager_id` sulla stessa tabella consente persone senza responsabile e impedisce riferimenti inesistenti. Non rileva cicli nella gerarchia.
- **Indici e navigazione:** la PK `(member_id, club_id)` supporta la ricerca dei circoli di un socio. Se cerchi spesso tutti i soci di un circolo, valuta anche un indice che inizi da `club_id`. Una lista testuale di ID non offre le stesse garanzie delle due FK.

**Fonte:** [PostgreSQL 18: vincoli e tabelle molti-a-molti](https://www.postgresql.org/docs/18/ddl-constraints.html#DDL-CONSTRAINTS-FK).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Normalizzazione|Normalizzazione]]
- [[Programmazione/PostgreSQL/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/PostgreSQL/Pagine/JOIN|JOIN]]
