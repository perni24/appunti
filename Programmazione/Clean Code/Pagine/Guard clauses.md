---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - leggibilita
  - controllo-flusso
aliases:
  - Guard clauses
  - Clausole di guardia
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Funzioni piccole]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
  - "[[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola]]"
  - "[[Programmazione/Clean Code/Pagine/Complessita cognitiva]]"
title: Guard clauses
---

# Guard clauses

## Sintesi

Una **guard clause** gestisce un caso speciale con un'uscita anticipata, lasciando visibile il percorso principale. Se l'obiettivo è un refactoring, non devono cambiare i casi ammessi, l'ordine in cui sono valutati o gli effetti che avvengono prima dell'uscita.

## Esempio: inviare solo le fatture idonee

La versione di partenza accetta la richiesta d'invio solo quando esistono la fattura e un indirizzo non vuoto e il totale è maggiore di zero. Se l'invio fallisce, l'errore deve arrivare al chiamante; `"accepted"` indica accettazione da parte del servizio, non consegna dell'email.

```js
async function sendNested(invoice, send) {
  if (invoice) {
    if (invoice.customerEmail) {
      if (invoice.totalCents > 0) {
        await send(invoice.customerEmail, invoice);
        return "accepted";
      }
    }
  }
  return "skipped";
}
```

Lo stesso contratto con guard clauses:

```js
async function sendGuarded(invoice, send) {
  if (!invoice) return "skipped";
  if (!invoice.customerEmail) return "skipped";
  if (!(invoice.totalCents > 0)) return "skipped";

  await send(invoice.customerEmail, invoice);
  return "accepted";
}
```

## Perché non usare soltanto `<= 0`?

Con numeri ordinari sembra equivalente, ma in JavaScript **`NaN > 0` e `NaN <= 0` sono entrambi falsi**. Lo stesso accade se `totalCents` è assente e il confronto riceve `undefined`. La condizione negata conserva il comportamento di partenza; una guardia su `<= 0` lascerebbe partire l'invio in entrambi i casi.

Questa fedeltà al codice precedente non è una validazione completa: `"5" > 0` è vero per conversione implicita. Se il requisito è «intero positivo in centesimi», valida esplicitamente con `Number.isSafeInteger` e il confronto di segno al confine. È un **cambio di contratto** da testare separatamente. Analogamente, il controllo sull'indirizzo non certifica che sia recapitabile.

## Limiti ed errori comuni

- Fermati sui casi economici e necessari prima di leggere i campi successivi; se manca l'indirizzo, nessuna delle due versioni ha bisogno di leggere il totale.
- Puoi restituire esiti diversi per «incompleto» e «gratuito», ma solo se il chiamante ha bisogno della distinzione. Non trasformare per errore un rifiuto di `send` in `"skipped"`.
- Se hai già acquisito una risorsa, un `return` anticipato deve rispettarne il rilascio. Tieni i controlli prima dell'acquisizione quando possibile oppure racchiudi l'uso in `try/finally`.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/Clean Code/Pagine/Principio del minimo stupore|Principio del minimo stupore]]

## Fonti

- Martin Fowler, [Replace Nested Conditional with Guard Clauses](https://refactoring.com/catalog/replaceNestedConditionalWithGuardClauses.html)
- ECMA-262, [Relational Operators](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-relational-operators)
- Robert C. Martin, *Clean Code*
