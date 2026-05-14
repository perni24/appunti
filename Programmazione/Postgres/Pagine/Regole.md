---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Il Sistema delle Regole (Rules System)]
prerequisites: []
related: []
---
# Il Sistema delle Regole (Rules System) in PostgreSQL

## Sintesi

Nota su Il Sistema delle Regole (Rules System) in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
Il **Rules System** (o Query Rewrite System) è un meccanismo unico di PostgreSQL che permette di modificare una query in arrivo prima che venga eseguita dal Query Planner. A differenza dei trigger, che agiscono sui dati riga per riga, le regole operano a livello di **struttura della query**, trasformando una richiesta SQL in un'altra (o in più query).

---

##  Come funzionano le Regole

Quando Postgres riceve una query, passa attraverso il sistema delle regole che può:
1.  **Sostituire** la query originale.
2.  **Aggiungere** altre query da eseguire prima o dopo quella originale.
3.  **Cancellare** la query (non eseguendo nulla).

La sintassi base è:
```sql
CREATE RULE nome_regola AS ON evento
TO tabella [ WHERE condizione ]
DO [ INSTEAD | ALSO ] azione;
```

---

##  Regole vs Trigger

Questa è la distinzione più importante per un amministratore di database:

| Caratteristica | Regole (Rules) | Trigger |
| :--- | :--- | :--- |
| **Punto di intervento** | Query Rewrite (Analisi) | Esecuzione (Riga per riga) |
| **Performance** | Più veloci per operazioni massicive (bulk). | Più lenti per grosse moli di dati (overhead per riga). |
| **Complessità** | Molto difficili da debuggare e prevedere. | Più intuitivi e documentati. |
| **Visibilità** | Possono nascondere righe o modificare logiche in modo "magico". | Seguono un flusso procedurale chiaro. |

---

##  Esempi di Utilizzo

### 1. Rendere una Vista scrivibile (Uso Storico)
Prima dell'introduzione dei trigger `INSTEAD OF`, le regole erano l'unico modo per permettere `INSERT` o `UPDATE` su viste complesse.

```sql
CREATE RULE vista_insert AS ON INSERT TO vista_utenti
DO INSTEAD
    INSERT INTO utenti_reali (nome, email) VALUES (NEW.nome, NEW.email);
```

### 2. Implementare un sistema di "Soft Delete"
Invece di cancellare una riga, la regola intercetta il `DELETE` e lo trasforma in un `UPDATE` di un campo flag.

```sql
CREATE RULE soft_delete AS ON DELETE TO prodotti
DO INSTEAD
    UPDATE prodotti SET attivo = false WHERE id = OLD.id;
```

---

## Logic layer: Perché evitarle?

Sebbene potenti, le regole sono spesso considerate **deprecate** per la logica di business quotidiana a favore dei trigger.

> [!CAUTION] Il pericolo delle Regole
> Le regole possono comportarsi in modo inaspettato con le subquery o le funzioni con effetti collaterali. Poiché riscrivono la query, una singola istruzione SQL potrebbe essere trasformata in modo tale da essere eseguita più volte o in un ordine non previsto, portando a risultati inconsistenti o performance degradate.

---

##  Best Practices
- **Usa i Trigger**: Nella quasi totalità dei casi, i trigger sono la scelta corretta.
- **Viste Updatable**: Usa le regole solo se hai bisogno di alte performance su aggiornamenti massivi di viste che i trigger non riescono a gestire efficientemente.
- **Documentazione**: Se decidi di usare una regola, documentala ossessivamente; è il posto più difficile dove cercare un bug.

---
