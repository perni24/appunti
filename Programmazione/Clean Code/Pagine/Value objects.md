---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - modellazione
  - value-object
aliases:
  - Value objects
  - Value object
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Primitive obsession]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Modellare stati impossibili]]"
title: Value objects
---

# Value objects

## Sintesi

Un **value object** rappresenta qualcosa che puoi sostituire con un altro esemplare dello stesso valore senza cambiare il significato del programma. Il posto «fila 3, sedile 2» resta lo stesso posto sulla pianta anche se leggi due volte il biglietto. Due **prenotazioni** per quel posto, invece, possono avere clienti, date e identità diverse.

## Esempio: confrontare due posti

Supponiamo una singola sala con 12 file da 8 sedili, numerati a partire da 1. Si confrontano entrambe le coordinate; nessuna delle due può cambiare dopo la costruzione.

```ts
class Seat {
  constructor(readonly row: number, readonly numberInRow: number) {
    if (!Number.isInteger(row) || row < 1 || row > 12 ||
        !Number.isInteger(numberInRow) || numberInRow < 1 || numberInRow > 8) {
      throw new RangeError("Posto fuori dalla pianta della sala");
    }
    Object.freeze(this);
  }

  equals(other: Seat): boolean {
    return this.row === other.row && this.numberInRow === other.numberInRow;
  }
}
```

Con `a = new Seat(3, 2)` e `b = new Seat(3, 2)`, `a.equals(b)` è vero, ma `a === b` è falso: in JavaScript le due istanze hanno riferimenti distinti. Anche una `Map` con chiavi oggetto non invoca `equals`. Se devi ritrovare lo stesso posto usando un'altra istanza, scegli una chiave stabile derivata da entrambe le coordinate.

## Cosa garantisce, e cosa no

- Il costruttore rifiuta anche `NaN`, frazioni e coordinate fuori limite. `readonly` aiuta il compilatore; il congelamento basta qui perché i due campi sono numeri, non oggetti mutabili.
- Un posto valido può essere **occupato**. La disponibilità appartiene alla prenotazione per uno spettacolo, non alle coordinate. Per confrontare posti di sale diverse occorrerebbe anche l'identificatore della sala.
- Il tipo deve promettere soltanto ciò che verifica. Per esempio, `value.includes("@")` accetta anche `"@"`: non basta a garantire che una stringa sia un indirizzo email valido, né che la casella sia raggiungibile.

## Quando conviene

Introduci il valore quando il concetto attraversa più punti del sistema e vuoi un'unica definizione di validità o uguaglianza. Non serve aggiungere metodi artificiali, un ID o dipendenze dal database solo per trasformare due dati locali in una classe.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Clean Code|Clean Code]]
- [[Programmazione/Clean Code/Pagine/Primitive obsession|Primitive obsession]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Modellare stati impossibili|Modellare stati impossibili]]
- [[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile|Stato mutabile e immutabile]]

## Fonti

- Eric Evans, *Domain-Driven Design*
- Martin Fowler, [Value Object](https://martinfowler.com/bliki/ValueObject.html)
