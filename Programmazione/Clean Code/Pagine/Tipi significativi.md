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
  - tipi
  - modellazione
aliases:
  - Tipi significativi
  - Meaningful types
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Primitive obsession]]"
  - "[[Programmazione/Clean Code/Pagine/Value objects]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Modellazione del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
title: Tipi significativi
---

# Tipi significativi

## Sintesi

Un tipo è significativo quando rende difficile confondere due valori che il dominio considera diversi. Rinominare `number` in `Amount` aiuta a leggere ma non distingue, da solo, un prezzo in euro da uno in dollari. Una regola può riguardare **la relazione fra due valori**, non solo la validità di ciascuno.

## Esempio: sottrarre uno sconto nella stessa valuta

Il servizio supporta EUR e USD; i valori sono interi non negativi in centesimi. Una fattura da 500 EUR-cent e uno sconto da 100 USD-cent sono entrambi importi validi, ma non sono sottraibili senza una politica di cambio.

```ts
type Currency = "EUR" | "USD";

class Money {
  constructor(readonly cents: number, readonly currency: Currency) {
    if (!Number.isSafeInteger(cents) || cents < 0) throw new RangeError("Importo non valido");
    if (currency !== "EUR" && currency !== "USD") throw new RangeError("Valuta non supportata");
    Object.freeze(this);
  }

  lessDiscount(discount: Money): Money {
    if (discount.currency !== this.currency) throw new RangeError("Valute diverse");
    if (discount.cents > this.cents) throw new RangeError("Sconto superiore al totale");
    return new Money(this.cents - discount.cents, this.currency);
  }
}
```

Uno sconto pari al totale restituisce un nuovo importo zero; il prezzo originale resta invariato. L'unione `Currency` esclude valute non supportate nei chiamanti tipizzati, ma due variabili di tipo `Money` possono benissimo avere valute diverse: il confronto nel metodo serve ancora.

## Limiti ed errori comuni

Il metodo presuppone istanze già costruite e validate, non oggetti JSON forzati con `as Money`. Per un nuovo formato di trasporto serve un parser. Per valute con unità minori diverse o conversioni occorre un altro contratto: questa classe non le approssima. Applica la stessa domanda a identificatori e stati: un nome basta per una variabile locale; tipi distinti o un costruttore controllato servono quando uno scambio passa inosservato.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Primitive obsession|Primitive obsession]]
- [[Programmazione/Clean Code/Pagine/Value objects|Value objects]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]

## Fonti

- Martin Fowler, [Value Object](https://martinfowler.com/bliki/ValueObject.html)
- Eric Evans, *Domain-Driven Design*; Scott Wlaschin, *Domain Modeling Made Functional*; Martin Fowler, *Refactoring*
