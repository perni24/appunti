---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [PL/pgSQL]
prerequisites: []
related: []
---
# PL/pgSQL in PostgreSQL

## Sintesi

Nota su PL/pgSQL in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

**PL/pgSQL** (Procedural Language/PostgreSQL) è un linguaggio procedurale caricabile per il database PostgreSQL. Permette di estendere il classico SQL aggiungendo strutture di controllo, variabili e gestione degli errori.

## Concetto chiave
PL/pgSQL consente di eseguire logica complessa direttamente sul server. Questo riduce drasticamente il traffico di rete (round-trips) tra client e server, poiché i dati vengono elaborati internamente senza essere trasferiti per ogni passaggio intermedio.

---

##  Struttura di un Blocco

Il codice PL/pgSQL è organizzato in blocchi delimitati dalle keyword `BEGIN` e `END`.

```sql
DO $$ -- Blocco anonimo per test rapidi
DECLARE
    contatore integer := 0;
BEGIN
    contatore := contatore + 1;
    RAISE NOTICE 'Il valore è %', contatore;
END $$;
```

---

##  Variabili e Tipi

Le variabili devono essere dichiarate nella sezione `DECLARE`.

### Assegnazione e %TYPE
Una delle funzionalità più potenti è `%TYPE`, che permette di ereditare il tipo di dato direttamente da una colonna esistente.

```sql
DECLARE
    v_nome utenti.nome%TYPE; -- Eredita il tipo dalla colonna 'nome'
    v_totale numeric(10,2) DEFAULT 0.0;
BEGIN
    SELECT nome INTO v_nome FROM utenti WHERE id = 1;
    v_totale := 100.50;
END;
```

---

##  Controllo del Flusso

### IF / THEN / ELSE
```sql
IF v_totale > 1000 THEN
    -- logica
ELSIF v_totale > 500 THEN
    -- logica
ELSE
    -- logica
END IF;
```

### Cicli (LOOP, WHILE, FOR)
Il ciclo `FOR` è particolarmente utile per iterare sui risultati di una query.
```sql
FOR riga IN SELECT * FROM ordini LOOP
    RAISE NOTICE 'Ordine ID: %', riga.id;
END LOOP;
```

---

##  Cursori

I cursori permettono di incapsulare una query e scorrere i risultati riga per riga, utile per gestire dataset molto grandi senza saturare la memoria.

```sql
DECLARE
    cur_utenti CURSOR FOR SELECT nome FROM utenti;
    v_nome text;
BEGIN
    OPEN cur_utenti;
    FETCH cur_utenti INTO v_nome;
    -- elaborazione
    CLOSE cur_utenti;
END;
```

> [!TIP] Cursor vs FOR loop
> Nella maggior parte dei casi, un ciclo `FOR` implicitamente gestisce l'apertura e la chiusura dei cursori in modo più pulito e leggibile. Usa i cursori espliciti solo se hai bisogno di logiche di navigazione complesse (es. tornare indietro con `FETCH PRIOR`).

---

## Logic layer: Perché usare PL/pgSQL?

1.  **Performance:** Sposta la logica vicino ai dati.
2.  **Sicurezza:** Può essere usato per creare API di database (tramite Funzioni), nascondendo la complessità delle tabelle sottostanti.
3.  **Integrità:** Fondamentale per la scrittura di Trigger complessi che garantiscono vincoli di business non esprimibili con semplici `CHECK`.

---
