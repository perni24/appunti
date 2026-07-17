---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, dominio, modellazione]
aliases: [Modellazione del dominio, Domain modeling]
prerequisites: [Value objects, Invarianti del dominio]
related: [Tipi significativi, Modellare stati impossibili, Data objects e behavior objects]
---

# Modellazione del dominio

## Sintesi

La **modellazione del dominio** consiste nel rappresentare nel codice concetti, regole e vincoli del problema reale.

Nel Clean Code e importante perche un buon modello riduce condizioni sparse, duplicazioni e interpretazioni ambigue.

## Problema che risolve

Quando il dominio non e modellato, le regole finiscono disperse in controller, service, helper, query e UI.

Il risultato e codice che sa fare molte operazioni ma non esprime chiaramente il problema che sta risolvendo.

## Concetto chiave

Un modello di dominio dovrebbe rendere espliciti:

- concetti principali;
- stati validi;
- transizioni ammesse;
- invarianti;
- termini usati dagli esperti del dominio;
- differenza tra dati grezzi e decisioni di business.

Non serve sempre un modello complesso. Serve un modello adeguato al rischio e alla complessita del dominio.

## Esempio

Regola sparsa:

```js
if (invoice.status !== "draft" || invoice.total <= 0) {
  throw new Error("Invoice cannot be issued");
}
```

Regola nel dominio:

```js
invoice.issue();
```

Il metodo `issue` puo proteggere internamente le condizioni valide per emettere una fattura.

## Dettagli importanti

- I nomi del codice dovrebbero riflettere il linguaggio del dominio.
- Le regole stabili meritano un posto esplicito.
- DTO, record database e modelli di dominio non sono sempre la stessa cosa.
- Un modello utile impedisce stati incoerenti o li rende evidenti.
- Il modello deve evolvere insieme alla comprensione del problema.

## Limiti

- Per CRUD semplici un modello ricco puo essere eccessivo.
- Un dominio mal compreso produce astrazioni sbagliate.
- Non tutte le regole appartengono agli oggetti: alcune sono policy o servizi di dominio.
- Il modello non elimina la necessita di validare input esterni.

## Errori comuni

- Creare classi anemiche che contengono solo dati e nessuna regola.
- Mettere tutta la logica nei service e lasciare il dominio passivo.
- Copiare la struttura del database come modello interno.
- Usare termini tecnici al posto dei concetti del dominio.
- Modellare troppo presto senza esempi reali.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Value objects]]
- [[Invarianti del dominio]]
- [[Modellare stati impossibili]]
- [[Tipi significativi]]
- [[Data objects e behavior objects]]

## Fonti

- Eric Evans, *Domain-Driven Design*
- Vaughn Vernon, *Implementing Domain-Driven Design*
- Martin Fowler, *Patterns of Enterprise Application Architecture*
