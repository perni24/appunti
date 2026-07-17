---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, testing, mutation-testing]
aliases: [Mutation testing, Test mutazionale]
prerequisites: [Coverage, Test unitari leggibili]
related: [Codice testabile, Code quality gates, Refactoring sicuro]
---

# Mutation testing

## Sintesi

Il **mutation testing** modifica automaticamente piccole parti del codice e verifica se i test falliscono.

Serve a capire se i test controllano davvero il comportamento o se eseguono codice senza rilevare errori.

## Quando usarlo

- Su logica critica.
- Quando la coverage e alta ma non ti fidi dei test.
- Prima di refactoring rischiosi.
- In librerie o moduli con contratti importanti.
- Come controllo periodico, non necessariamente su ogni commit.

## Come funziona

Lo strumento crea mutanti, per esempio:

- cambia `>` in `>=`;
- sostituisce `true` con `false`;
- rimuove una chiamata;
- cambia un valore costante;
- inverte una condizione.

Se i test non falliscono, il mutante sopravvive e indica un possibile buco nei test.

## API / Sintassi

```text
mutation-test run
mutation-test report
```

Il report mostra mutanti uccisi, sopravvissuti e non coperti.

## Esempio pratico

Codice:

```js
function canBuy(age) {
  return age >= 18;
}
```

Mutante:

```js
return age > 18;
```

Se i test non controllano il caso `18`, il mutante puo sopravvivere.

## Varianti

- Mutation testing completo.
- Mutation testing su file critici.
- Mutation testing differenziale.
- Soglie di mutation score.
- Esecuzione periodica in CI notturna.

## Errori comuni

- Usarlo su tutto il repository senza considerare tempi.
- Trattare ogni mutante sopravvissuto come bug certo.
- Ignorare mutanti equivalenti.
- Non migliorare asserzioni dopo il report.
- Usarlo come sostituto della progettazione dei test.

## Checklist

- Il modulo e abbastanza critico da giustificare il costo?
- I test sono gia stabili?
- I mutanti sopravvissuti indicano asserzioni deboli?
- I mutanti equivalenti vengono gestiti?
- Il risultato viene usato per migliorare test reali?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Coverage]]
- [[Test unitari leggibili]]
- [[Codice testabile]]
- [[Refactoring sicuro]]
- [[Code quality gates]]

## Fonti

- PIT Mutation Testing Documentation
- Stryker Mutator Documentation
- Gerard Meszaros, *xUnit Test Patterns*
