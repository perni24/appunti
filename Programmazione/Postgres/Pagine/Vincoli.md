---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Vincoli (Constraints)]
prerequisites: []
related: []
---

# Vincoli (Constraints) in PostgreSQL

## Sintesi

Nota su Vincoli (Constraints) in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Quando usarlo

Usa i vincoli ogni volta che una regola del dominio deve essere sempre vera:

- una colonna obbligatoria non deve essere `NULL`;
- un valore deve essere unico;
- una riga deve riferirsi a una riga valida in un'altra tabella;
- un importo deve essere positivo;
- due intervalli non devono sovrapporsi;
- una cancellazione deve essere impedita o propagata secondo una regola esplicita.

La validazione applicativa e utile, ma i vincoli proteggono i dati anche da script, import manuali, bug e applicazioni diverse.

## Come funziona

### Concetto chiave
I **Vincoli** sono regole applicate alle colonne o alle tabelle per limitare il tipo di dati che possono essere inseriti. Il loro scopo fondamentale è garantire l'**Integrità dei Dati** (Data Integrity) a livello di database, impedendo che errori applicativi o inserimenti manuali corrompano la coerenza delle informazioni.

---
### Tipologie di Vincoli
### 1. NOT NULL
Garantisce che una colonna non possa contenere valori `NULL`.
```sql
CREATE TABLE utenti (
    id serial PRIMARY KEY,
    username text NOT NULL
);
```

### 2. UNIQUE
Assicura che tutti i valori in una colonna (o combinazione di colonne) siano distinti tra loro.
- **Nota:** Postgres crea automaticamente un indice per supportare questo vincolo.

### 3. PRIMARY KEY
Unisce `NOT NULL` e `UNIQUE`. Identifica univocamente ogni riga della tabella. Ogni tabella può avere una sola chiave primaria.

### 4. FOREIGN KEY (Integrità Referenziale)
Garantisce che un valore in una colonna corrisponda a un valore esistente in un'altra tabella.

```sql
CREATE TABLE ordini (
    id serial PRIMARY KEY,
    utente_id int REFERENCES utenti(id) ON DELETE CASCADE
);
```
**Referential Actions:**
- `ON DELETE CASCADE`: Se elimini l'utente, vengono eliminati anche i suoi ordini.
- `ON DELETE SET NULL`: Se elimini l'utente, il campo `utente_id` negli ordini diventa NULL.
- `ON DELETE RESTRICT`: Impedisce l'eliminazione dell'utente se ha ordini associati.

### 5. CHECK
Consente di definire espressioni booleane personalizzate che i dati devono soddisfare.
```sql
CREATE TABLE prodotti (
    prezzo numeric CHECK (prezzo > 0),
    sconto numeric CHECK (sconto >= 0 AND sconto < prezzo)
);
```

### 6. EXCLUSION (Esclusione)
Un vincolo avanzato di PostgreSQL che garantisce che, se due righe vengono confrontate su colonne specifiche usando determinati operatori, non tutte le uguaglianze siano vere contemporaneamente.
- **Esempio tipico:** Impedire la sovrapposizione di prenotazioni (range temporali).

---
### Logic layer: Integrità Dichiarativa
L'utilizzo dei vincoli implementa l'**Integrità Dichiarativa**. 

> [!INFO] Perché nel Database e non nell'App?
> Sebbene sia possibile validare i dati nel codice dell'applicazione, i vincoli nel database sono l'ultima linea di difesa. Essi garantiscono la coerenza indipendentemente da quale applicazione o script acceda ai dati, proteggendo il sistema da bug software o accessi diretti via SQL.

---

## API / Sintassi

```sql
CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'active',

  CONSTRAINT users_pk PRIMARY KEY (id),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled'))
);
```

Foreign key:

```sql
CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL,
  total_amount numeric(12, 2) NOT NULL,

  CONSTRAINT orders_user_fk
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT orders_total_positive
    CHECK (total_amount > 0)
);
```

## Esempio pratico

Impedire prenotazioni sovrapposte:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE room_bookings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id bigint NOT NULL,
  period tstzrange NOT NULL,

  CONSTRAINT room_bookings_no_overlap
    EXCLUDE USING gist (
      room_id WITH =,
      period WITH &&
    )
);
```

Il vincolo di esclusione impedisce che due prenotazioni della stessa stanza abbiano periodi sovrapposti.

## Varianti

- `NOT NULL`: campo obbligatorio.
- `UNIQUE`: valore o combinazione di valori univoca.
- `PRIMARY KEY`: identificatore della riga.
- `FOREIGN KEY`: integrita referenziale.
- `CHECK`: regola booleana personalizzata.
- `EXCLUDE`: regola avanzata basata su operatori.
- `DEFERRABLE`: controllo rimandabile fino al commit della transazione.

## Errori comuni

- Mettere tutte le regole solo nell'applicazione.
- Non nominare i vincoli, ottenendo messaggi di errore meno leggibili.
- Dimenticare indici sulle colonne foreign key molto usate.
- Usare `ON DELETE CASCADE` senza valutare l'impatto sui dati figli.
- Usare `CHECK` troppo deboli o non allineati con il dominio.
- Non gestire `NULL` nei vincoli e nei confronti.

## Checklist

### Best Practices
- **Nomi ai vincoli:** Assegna sempre un nome esplicito ai vincoli complessi (specialmente `CHECK` e `FOREIGN KEY`) per facilitare il debugging degli errori:
  `CONSTRAINT prezzo_positivo CHECK (prezzo > 0)`
- **Validazione differita:** Se necessario, i vincoli possono essere impostati come `DEFERRABLE`, permettendo di violarli temporaneamente durante una transazione e controllandoli solo al `COMMIT`.
- **Indici su FK:** Postgres non crea automaticamente indici sulle Foreign Key. È quasi sempre consigliabile crearli manualmente per velocizzare le JOIN e le operazioni di eliminazione.
- Verificare che ogni regola importante sia espressa nel database.
- Scegliere policy `ON DELETE` esplicite.
- Testare inserimenti validi e non validi.
- Documentare i vincoli che rappresentano regole di business.

---

## Collegamenti

- [[Programmazione/Postgres/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/Postgres/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/Postgres/Pagine/Normalizzazione|Normalizzazione]]
