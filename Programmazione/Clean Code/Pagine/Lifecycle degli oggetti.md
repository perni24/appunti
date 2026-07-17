---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, lifecycle, oggetti]
aliases: [Lifecycle degli oggetti, Object lifecycle]
prerequisites: [Incapsulamento, Gestione delle risorse]
related: [Ownership concettuale, Cleanup e rilascio risorse, Invarianti interne]
---

# Lifecycle degli oggetti

## Sintesi

Il **lifecycle degli oggetti** descrive le fasi attraversate da un oggetto: creazione, inizializzazione, uso, transizioni di stato e rilascio.

Un lifecycle chiaro evita oggetti mezzi validi, inizializzazioni incomplete e cleanup dimenticato.

## Problema che risolve

Oggetti con lifecycle confuso causano bug difficili:

- costruttori che non inizializzano tutto;
- metodi chiamabili nell'ordine sbagliato;
- oggetti usati dopo la chiusura;
- stati intermedi visibili;
- risorse non rilasciate;
- invarianti validi solo in alcuni momenti.

## Concetto chiave

Un oggetto dovrebbe essere valido appena creato, oppure rendere esplicito il suo stato incompleto.

Le transizioni importanti devono essere modellate con metodi chiari e controlli sugli invarianti.

## Dettagli importanti

- Evita oggetti costruiti in piu passaggi non protetti.
- I metodi dovrebbero essere validi solo negli stati previsti.
- Le risorse possedute dall'oggetto richiedono cleanup.
- Un oggetto chiuso non dovrebbe poter essere usato come se fosse aperto.
- Le factory possono aiutare a garantire creazione valida.

## Esempio

```js
class ReportWriter {
  constructor(file) {
    this.file = file;
    this.closed = false;
  }

  write(line) {
    if (this.closed) throw new Error("Cannot write to a closed report");
    this.file.write(line);
  }

  close() {
    this.closed = true;
    this.file.close();
  }
}
```

Lo stato `closed` protegge il lifecycle della risorsa.

## Limiti

- Modellare ogni stato con una classe diversa puo essere eccessivo.
- Alcuni framework impongono lifecycle propri.
- Oggetti molto semplici non richiedono gestione formale.
- La concorrenza rende il lifecycle piu difficile da proteggere.

## Errori comuni

- Lasciare campi obbligatori inizializzati a `null`.
- Consentire chiamate fuori ordine.
- Fare lavoro pesante in costruttori difficili da testare.
- Non distinguere oggetto aperto, chiuso e fallito.
- Nascondere dipendenze necessarie alla costruzione.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]
- [[Gestione delle risorse]]
- [[Ownership concettuale]]
- [[Cleanup e rilascio risorse]]
- [[Invarianti interne]]

## Fonti

- Martin Fowler, *Refactoring*
- Eric Evans, *Domain-Driven Design*
- Michael Feathers, *Working Effectively with Legacy Code*
