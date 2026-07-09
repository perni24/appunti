---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, data-pipeline, dati]
aliases: [Pipeline dati leggibili, Readable data pipelines]
prerequisites: [Pipeline di trasformazione, Parsing e serializzazione]
related: [Parsing di input esterni, Output strutturati, Validazione dei dati generati]
---

# Pipeline dati leggibili

## Sintesi

Le **pipeline dati leggibili** trasformano dati grezzi in dati utilizzabili attraverso passaggi espliciti, nominati e verificabili.

Nel Clean Code una pipeline dati non dovrebbe essere una catena opaca di trasformazioni: deve rendere chiaro cosa entra, cosa cambia e cosa esce.

## Quando usarlo

- Quando importi file CSV, JSON, XML o log.
- Quando normalizzi dati provenienti da API esterne.
- Quando costruisci report o dataset intermedi.
- Quando prepari dati per automazioni o modelli LLM.
- Quando una trasformazione deve essere ripetibile e debuggabile.

## Come funziona

Una pipeline dati pulita separa:

- lettura input;
- parsing;
- validazione;
- normalizzazione;
- arricchimento;
- trasformazione;
- output;
- logging e metriche.

Ogni fase dovrebbe avere input e output chiari.

## API / Sintassi

```text
raw input -> parse -> validate -> normalize -> transform -> export
```

La sequenza deve mostrare il percorso del dato senza nascondere side effects importanti.

## Esempio pratico

```js
function importCustomers(rawFile) {
  const rows = parseCsv(rawFile);
  const validRows = validateCustomerRows(rows);
  const customers = validRows.map(toCustomer);

  return exportCustomers(customers);
}
```

Il flusso principale e leggibile e ogni passaggio puo essere testato separatamente.

## Varianti

- Pipeline batch: elabora dati in blocco.
- Pipeline streaming: elabora elementi man mano che arrivano.
- Pipeline idempotente: puo essere rieseguita senza duplicare effetti.
- Pipeline con staging: salva dati intermedi per audit o debug.

## Errori comuni

- Mescolare parsing, validazione e salvataggio nello stesso blocco.
- Usare nomi generici come `processData`.
- Non conservare contesto sugli errori di riga o campo.
- Ignorare input parzialmente validi.
- Nascondere side effects dentro trasformazioni apparentemente pure.

## Checklist

- Ogni fase ha un nome chiaro?
- Gli errori indicano riga, campo o origine?
- I dati intermedi sono verificabili quando serve?
- La pipeline e idempotente se viene rilanciata?
- I test coprono input valido, malformato e incompleto?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Pipeline di trasformazione]]
- [[Parsing e serializzazione]]
- [[Parsing di input esterni]]
- [[Output strutturati]]
- [[Validazione dei dati generati]]

## Fonti

- Martin Kleppmann, *Designing Data-Intensive Applications*
- Martin Fowler, *Refactoring*
- Wes McKinney, *Python for Data Analysis*
