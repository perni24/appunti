---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, invarianti, stato]
aliases: [Invarianti interne, Internal invariants]
prerequisites: [Invarianti del dominio, Incapsulamento]
related: [Gestione dello stato, Lifecycle degli oggetti, Modellare stati impossibili]
---

# Invarianti interne

## Sintesi

Le **invarianti interne** sono condizioni che un oggetto, modulo o componente deve mantenere sempre vere per funzionare correttamente.

Proteggono la coerenza interna anche quando il codice evolve.

## Problema che risolve

Senza invarianti interne, un componente puo entrare in stati incoerenti:

- campi obbligatori mancanti;
- cache e sorgente non allineate;
- contatori negativi;
- oggetti chiusi ma ancora usabili;
- collezioni duplicate;
- transizioni di stato impossibili.

## Concetto chiave

Un'invariante deve essere protetta nel punto che possiede lo stato.

Non basta sperare che i chiamanti usino bene l'oggetto: il componente dovrebbe impedire o intercettare stati invalidi.

## Dettagli importanti

- Le invarianti interne non sono sempre regole di dominio.
- Possono riguardare performance, cache, lifecycle o consistenza tecnica.
- L'incapsulamento aiuta a proteggerle.
- I test dovrebbero coprire le transizioni che potrebbero romperle.
- Le assert interne possono essere utili per errori di programmazione.

## Esempio

```js
class LimitedQueue {
  constructor(limit) {
    this.limit = limit;
    this.items = [];
  }

  push(item) {
    if (this.items.length >= this.limit) {
      throw new Error("Queue limit exceeded");
    }

    this.items.push(item);
  }
}
```

L'oggetto protegge direttamente il proprio limite.

## Limiti

- Troppe difese interne possono rendere il codice rumoroso.
- Alcune invarianti richiedono transazioni o lock.
- In sistemi distribuiti alcune invarianti sono eventuali.
- Non tutte le precondizioni devono essere replicate ovunque.

## Errori comuni

- Esporre collezioni mutabili interne.
- Consentire campi pubblici che rompono lo stato.
- Spostare la protezione solo nei controller.
- Non testare transizioni invalide.
- Lasciare oggetti in stati intermedi osservabili.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]
- [[Gestione dello stato]]
- [[Lifecycle degli oggetti]]
- [[Modellare stati impossibili]]

## Fonti

- Bertrand Meyer, *Object-Oriented Software Construction*
- Eric Evans, *Domain-Driven Design*
- Robert C. Martin, *Clean Code*
