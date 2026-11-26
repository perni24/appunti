---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - testing
  - mutation-testing
aliases:
  - Mutation testing
  - Test mutazionale
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Coverage]]"
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
  - "[[Programmazione/Clean Code/Pagine/Code quality gates]]"
  - "[[Programmazione/Clean Code/Pagine/Refactoring sicuro]]"
title: Mutation testing
---

# Mutation testing

## Sintesi

Il mutation testing chiede: **se introduco una piccola modifica al comportamento, la suite se ne accorge?** Si parte da test verdi sul codice originale. Il motore applica un mutante per volta, esegue i test pertinenti e classifica l'esito. Un test che falliva già prima non è una prova contro il mutante.

## Esperimento ripetibile: la soglia inclusiva

Parti da `shipping.mjs` e `shipping.test.mjs` della nota [[Programmazione/Clean Code/Pagine/Coverage|Coverage]]. In una **copia di prova**, sostituisci solo la funzione con questo mutante:

```js
export function shippingCents(total) {
  if (total > 2000) {
    return 0;
  }
  return 350;
}
```

I casi 1999 e 2001 continuano a passare. Aggiungi al file di test, che importa già `test`, `assert` e `shippingCents`:

```js
test("anche la soglia esatta dà spedizione gratuita", () => {
  assert.equal(shippingCents(2000), 0);
});
```

```sh
node --test shipping.test.mjs
```

| Codice | Solo 1999 e 2001 | Anche 2000 |
| --- | --- | --- |
| Originale con `>=` | Passa | Passa |
| Mutante con `>` | Passa: mutante sopravvissuto | Fallisce: attesi 0 centesimi, ottenuti 350 |

Il nuovo test nasce dalla regola di spedizione, non da un dettaglio del mutatore. Ripristina l'originale nella copia e verifica che la suite completa torni verde. Questo è **un esperimento manuale su un solo mutante**, non un punteggio dell'intero modulo.

## Interpretare un report reale

- **Killed:** almeno un test distingue il mutante dall'originale. Controlla che fallisca per il motivo atteso, non per un guasto ambientale.
- **Survived / no coverage:** nel primo caso i test eseguiti non distinguono la modifica; nel secondo nessun test raggiunge il punto. Gli interventi utili possono essere diversi.
- **Equivalente:** per tutti gli input ammessi il comportamento rimane lo stesso. Per esempio, sul dominio dei soli centesimi interi `total >= 2000` e `total > 1999` sono equivalenti. Non inventare un requisito sui decimali solo per far fallire un test.
- Timeout ed errori di compilazione non sono sinonimi di asserzioni efficaci: leggi le categorie e il denominatore del tuo strumento prima di confrontare due mutation score.

Usa una campagna mirata su moduli con logica critica e suite stabile. Stryker e PIT automatizzano la generazione; i loro report non sostituiscono la scelta degli esempi di dominio.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Coverage|Coverage]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Refactoring sicuro|Refactoring sicuro]]
- [[Programmazione/Clean Code/Pagine/Code quality gates|Code quality gates]]

## Fonti

- PIT Mutation Testing Documentation
- Stryker Mutator Documentation
- Gerard Meszaros, *xUnit Test Patterns*
- [Stryker: stati dei mutanti e metriche](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/)
