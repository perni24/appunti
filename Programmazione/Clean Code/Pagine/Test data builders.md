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
  - testing
  - test-data
aliases:
  - Test data builders
  - Builder per dati di test
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
  - "[[Programmazione/Clean Code/Pagine/Arrange Act Assert]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
  - "[[Programmazione/Clean Code/Pagine/Test come documentazione]]"
  - "[[Programmazione/Clean Code/Pagine/Modellazione del dominio]]"
title: Test data builders
---

# Test data builders

## Sintesi

I **test data builders** sono helper che creano dati di test leggibili e modificabili.

Servono a evitare setup ripetitivo e a rendere chiaro quali dettagli contano in uno scenario.

## Problema che risolve

I test spesso richiedono oggetti con molti campi obbligatori.

Senza builder, ogni test deve costruire manualmente dati lunghi, anche quando solo un campo e rilevante. Questo nasconde l'intenzione del test.

## Concetto chiave

Un builder fornisce default validi e permette di sovrascrivere solo cio che serve al caso.

Il test resta concentrato sul comportamento, non sulla burocrazia del setup.

## Esempio

```js
function userBuilder(overrides = {}) {
  return {
    id: "user-1",
    email: "user@example.com",
    active: true,
    role: "customer",
    ...overrides,
  };
}

const lockedUser = userBuilder({ active: false });
```

Il test mostra solo la variazione importante.

## Dettagli importanti

- I default devono rappresentare un oggetto valido.
- I builder devono usare termini del dominio.
- Evita builder globali enormi e magici.
- Un builder puo nascondere dettagli tecnici, non regole importanti.
- Quando il dominio cambia, i builder riducono il costo di aggiornamento dei test.

## Limiti

- Builder troppo generici diventano difficili da capire.
- Default non realistici possono mascherare bug.
- Troppi helper possono rendere difficile capire i dati reali.
- Nei test di integrazione servono spesso factory che persistono dati.

## Errori comuni

- Nascondere condizioni essenziali dentro default invisibili.
- Usare nomi come `makeData` o `fixture1`.
- Creare dati validi solo per caso.
- Condividere oggetti mutabili tra test.
- Usare builder per compensare modelli troppo complessi o confusi.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]
- [[Programmazione/Clean Code/Pagine/Arrange Act Assert|Arrange Act Assert]]
- [[Programmazione/Clean Code/Pagine/Test come documentazione|Test come documentazione]]
- [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]

## Fonti

- Nat Pryce, *Test Data Builders*
- Gerard Meszaros, *xUnit Test Patterns*
- Kent Beck, *Test Driven Development*
