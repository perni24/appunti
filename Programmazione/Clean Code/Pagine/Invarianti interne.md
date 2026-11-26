---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - invarianti
  - stato
aliases:
  - Invarianti interne
  - Internal invariants
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Incapsulamento]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Gestione dello stato]]"
  - "[[Programmazione/Clean Code/Pagine/Lifecycle degli oggetti]]"
  - "[[Programmazione/Clean Code/Pagine/Modellare stati impossibili]]"
title: Invarianti interne
---

# Invarianti interne

## Sintesi

Un'invariante descrive ciò che deve essere vero **ogni volta che il componente è osservabile**: appena costruito e dopo ogni operazione, anche rifiutata. Per una coda limitata la regola è `0 ≤ numero di elementi ≤ capacità`. Dire al chiamante di non modificare l'array non basta se l'array rimane pubblico.

## Esempio: una coda con capienza fissata alla creazione

```js
class LimitedQueue {
  #limit;
  #items = [];

  constructor(limit) {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new RangeError("Capacità non valida");
    this.#limit = limit;
  }
  get size() { return this.#items.length; }

  push(item) {
    if (this.size >= this.#limit) throw new RangeError("Coda piena");
    this.#items.push(item);
  }

  take() {
    if (!this.size) return { found: false };
    return { found: true, value: this.#items.shift() };
  }

  snapshot() { return [...this.#items]; }
}
```

Con capacità uno, dopo `push("A")` un secondo inserimento fallisce **prima** di cambiare lo stato: `take()` restituisce ancora A. Il limite viene controllato anche alla costruzione: con `NaN` un confronto di capienza basato solo su `>=` non bloccherebbe nulla. La copia di `snapshot()` protegge la struttura della coda; non clona gli oggetti contenuti.

## Precondizione, invariante, risultato

- **Precondizione:** per costruire la coda serve una capienza intera positiva.
- **Invariante:** nessuna operazione pubblica può portare la dimensione oltre il limite. Un contatore separato sarebbe un secondo valore da mantenere coerente.
- **Risultato:** un prelievo riuscito toglie l'elemento più vecchio. Il ramo `found` distingue una coda vuota da una che contiene deliberatamente `undefined`.

## Limiti e verifica

Verifica pieno, vuoto, ordine FIFO e stato dopo un rifiuto. Modifica anche la copia restituita per escludere che aggiri la protezione. L'esempio è locale e sincrono, senza attese o callback tra controllo e modifica; non impone una capienza globale a più processi. Se il vincolo appartiene a un archivio condiviso deve essere protetto anche lì.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/Clean Code/Pagine/Gestione dello stato|Gestione dello stato]]
- [[Programmazione/Clean Code/Pagine/Lifecycle degli oggetti|Lifecycle degli oggetti]]
- [[Programmazione/Clean Code/Pagine/Modellare stati impossibili|Modellare stati impossibili]]

## Fonti

- Bertrand Meyer, *Object-Oriented Software Construction*
- Eric Evans, *Domain-Driven Design*
- Robert C. Martin, *Clean Code*
- [ECMAScript: elementi privati di una classe](https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-class-definitions)
