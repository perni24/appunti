---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Funzioni e Store Procedures]
prerequisites: []
related: []
---
# Funzioni e Store Procedures in PostgreSQL

## Sintesi

Nota su Funzioni e Store Procedures in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

In PostgreSQL, la logica di business può essere incapsulata all'interno del database utilizzando **Funzioni** e **Procedure**. Sebbene simili, hanno scopi e comportamenti transazionali diversi.

## Concetto chiave
Le **Funzioni** sono progettate per calcolare e restituire dati, mentre le **Procedure** (introdotte in Postgres 11) sono progettate per gestire l'esecuzione di task che richiedono il controllo esplicito delle transazioni (`COMMIT`, `ROLLBACK`).

---

##  Funzioni (UDF - User Defined Functions)

Una funzione restituisce sempre un valore (o un set di valori) e viene invocata all'interno di una query SQL (`SELECT`).

```sql
CREATE OR REPLACE FUNCTION calcola_sconto(prezzo numeric, sconto numeric)
RETURNS numeric AS $$
BEGIN
    RETURN prezzo - (prezzo * sconto / 100);
END;
$$ LANGUAGE plpgsql;

-- Invocazione
SELECT nome, calcola_sconto(prezzo, 10) FROM prodotti;
```

### Categorie di Volatilità
Il Planner usa queste categorie per ottimizzare le query:
- **VOLATILE:** Può modificare il database o restituire valori diversi (es: `random()`). Viene rieseguita per ogni riga.
- **STABLE:** Restituisce lo stesso risultato per la stessa riga all'interno di una singola query.
- **IMMUTABLE:** Restituisce sempre lo stesso risultato per gli stessi input (es: funzioni matematiche). Il Planner può pre-calcolarla.

---

##  Stored Procedures

A differenza delle funzioni, le procedure non restituiscono un valore e vengono invocate con il comando `CALL`. La loro caratteristica principale è la capacità di gestire transazioni interne.

```sql
CREATE OR REPLACE PROCEDURE trasferisci_fondi(da_id int, a_id int, importo numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE conti SET bilancio = bilancio - importo WHERE id = da_id;
    UPDATE conti SET bilancio = bilancio + importo WHERE id = a_id;
    
    -- Controllo transazionale esplicito
    COMMIT;
END;
$$;

-- Invocazione
CALL trasferisci_fondi(1, 2, 500.00);
```

---

##  Parametri e Modalità

| Tipo | Descrizione |
| :--- | :--- |
| **IN** | Parametro di input (Default). |
| **OUT** | Restituisce un valore senza usare `RETURN` (utile per restituire più colonne). |
| **INOUT** | Funziona sia come input che come output. |
| **VARIADIC** | Permette di passare un numero variabile di argomenti (array). |

---

## Logic layer: Perché incapsulare la logica?

1.  **Sicurezza:** Puoi concedere i permessi di esecuzione (`GRANT EXECUTE`) su una funzione senza dare accesso diretto alle tabelle sottostanti.
2.  **Astrazione:** Se la struttura delle tabelle cambia, basta aggiornare la funzione; il codice dell'applicazione (API, Frontend) rimane invariato.
3.  **Performance:** Riduce il traffico di rete combinando più query in un'unica chiamata al server.

> [!INFO] Linguaggi Supportati
> Oltre a [[Programmazione/Postgres/Pagine/PL-pgSQL|PL/pgSQL]], Postgres supporta SQL "puro", C, e tramite estensioni anche Python (PL/Python), JavaScript (V8) e altri.

---
