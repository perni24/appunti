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

Un test data builder prepara **un nuovo dato di prova** con default espliciti e validi. Chi legge il test dovrebbe vedere subito il campo importante per lo scenario. Il builder non dovrebbe eseguire il comportamento che si vuole verificare, né salvare dati senza dirlo.

## Esempio: preparare bozze indipendenti

Per il modello delle fatture un semplice helper con parametri nominati basta; non serve un'interfaccia fluente. La bozza di default è emettibile. L'array è copiato, perché il test non deve modificare per sbaglio né l'argomento né i dati di un'altra prova.

```js
function aDraftInvoice({ id = "I-1", lineCents = [100] } = {}) {
  return { id, status: "draft", lineCents: [...lineCents] };
}
```

Per verificare il caso senza righe scrivi `aDraftInvoice({ lineCents: [] })`. Per il totale zero usa `aDraftInvoice({ lineCents: [0] })`: chiamare entrambi `invalidInvoice()` nasconderebbe proprio ciò che li distingue. Il builder non calcola il totale e non crea automaticamente una riga quando riceve una lista vuota.

## Limiti ed errori comuni

- Due chiamate di default restituiscono oggetti e array distinti ma lo **stesso ID**. In un test che salva più fatture, specifica ID differenti o esplicita che stai provando il vincolo di unicità.
- La copia superficiale basta qui perché gli elementi sono numeri. Se le righe diventano oggetti mutabili, decidi se crearli o copiarli per ogni prova.
- Un default è utile se irrilevante per il test. Quando il comportamento dipende dal totale, rendi visibili le righe; altrimenti un cambiamento del default modifica silenziosamente il significato del caso.
- Il builder produce dati in memoria. Una fixture che persiste una fattura dovrebbe avere un nome che renda esplicito l'effetto.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]
- [[Programmazione/Clean Code/Pagine/Arrange Act Assert|Arrange Act Assert]]
- [[Programmazione/Clean Code/Pagine/Test come documentazione|Test come documentazione]]
- [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]

## Fonti

- Nat Pryce, *Test Data Builders*; Gerard Meszaros, *xUnit Test Patterns*; Kent Beck, *Test Driven Development*
- Martin Fowler, [Object Mother](https://martinfowler.com/bliki/ObjectMother.html), per il confronto con fixture preconfezionate.
