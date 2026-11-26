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
  - code-smell
  - modellazione
aliases:
  - Primitive obsession
  - Ossessione per le primitive
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Value objects]]"
  - "[[Programmazione/Clean Code/Pagine/Tipi significativi]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
title: Primitive obsession
---

# Primitive obsession

## Sintesi

La **primitive obsession** si riconosce quando il significato di un valore dipende da informazioni che ogni chiamante deve ricordare: `transfer(1250, "EUR")` indica 1.250 euro o 12,50 euro? Il difetto non è che si usi un numero, ma che si possano scambiare unità, invertire parametri o applicare regole diverse senza accorgersene.

## Esempio: costruire un importo da trasferire

Per questo servizio sono ammessi solo trasferimenti positivi in EUR o USD. L'unità è il centesimo per entrambe le valute. Dare un nome ai campi permette di leggere l'importo; una funzione che riceve dati grezzi controlla che i valori rispettino la regola.

```ts
type TransferAmount = Readonly<{
  cents: number;
  currency: "EUR" | "USD";
}>;

function transferAmount(cents: unknown, currency: unknown): TransferAmount {
  if (currency !== "EUR" && currency !== "USD") {
    throw new RangeError("Valuta non supportata");
  }
  if (typeof cents !== "number" || !Number.isSafeInteger(cents) || cents <= 0) {
    throw new RangeError("Importo atteso in centesimi interi positivi");
  }
  return { cents, currency };
}
```

`transferAmount(1250, "EUR")` rappresenta 12,50 euro. `12.5` è rifiutato, non arrotondato; `"1250"` non viene convertito implicitamente. Non sono regole universali del denaro: un saldo può essere zero e una valuta diversa può non usare i centesimi.

## Criterio di scelta

| Se il problema è… | Prima soluzione da considerare |
| --- | --- |
| Un valore locale poco chiaro | Rinominare `n` in `amountCents` |
| Valuta e importo che viaggiano separati | Raggrupparli in un record con campi nominati |
| Valori esterni con formato o intervallo incerti | Farli passare da un costruttore o parser controllato |
| Due identificatori numerici corretti ma scambiabili | Usare tipi distinti, per esempio dei *brand*, nei punti in cui si incontrano |

## Limiti ed errori comuni

Un alias come `type Cents = number` non crea da solo un tipo distinto. Anche `TransferAmount` è strutturale: scrivere direttamente `{ cents: -1, currency: "EUR" }` può soddisfare il tipo. La positività è garantita **per i risultati della funzione al momento della costruzione**, non per qualsiasi oggetto annotato con quel nome. `Readonly` non valida il JSON né congela l'oggetto a runtime.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Value objects|Value objects]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Modellare stati impossibili|Modellare stati impossibili]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/TypeScript/Pagine/Brand Types|Brand types in TypeScript]]

## Fonti

- Martin Fowler, [Replace Primitive with Object](https://refactoring.com/catalog/replacePrimitiveWithObject.html)
- Eric Evans, *Domain-Driven Design*
