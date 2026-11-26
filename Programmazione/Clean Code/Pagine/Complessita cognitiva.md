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
  - complessita
  - leggibilita
aliases:
  - Complessita cognitiva
  - Cognitive complexity
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Complessita ciclomatica]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Guard clauses]]"
  - "[[Programmazione/Clean Code/Pagine/Funzioni piccole]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
title: Complessita cognitiva
---

# Complessita cognitiva

## Sintesi

La difficoltà di lettura non coincide con il numero di percorsi. La **Cognitive Complexity di SonarSource** è una metrica che usa incrementi per certe interruzioni del flusso lineare e per l'annidamento. È un indicatore, non una misura diretta del tempo che servirà a una persona per capire il codice.

## Esempio: tre decisioni in due forme

Con dati ordinari, il benvenuto è ammesso solo per un utente presente, attivo e non bloccato:

```js
function nested(user) {
  if (user) {
    if (user.active) {
      if (!user.locked) return true;
    }
  }
  return false;
}

function guarded(user) {
  if (!user) return false;
  if (!user.active) return false;
  if (user.locked) return false;
  return true;
}
```

Con il conteggio manuale del modello Sonar per questi soli `if`, `nested` vale **1 + 2 + 3 = 6**: il secondo e il terzo controllo sono annidati. `guarded` vale **1 + 1 + 1 = 3**. I normali `return` non aggiungono punti in questo esempio. La complessità **ciclomatica** rimane invece 4 in entrambi: cambiano la profondità e il modo di leggere la condizione, non il numero di decisioni.

## Come interpretarla

Verifica separatamente assenza dell'utente, inattività, blocco e ammissione. Il punteggio più basso non certifica che le due funzioni siano equivalenti. Nomi fuorvianti, dipendenze nascoste o una regola di dominio sconosciuta possono pesare sulla comprensione senza comparire nel conteggio.

Non spostare rami in helper dal nome generico solo per scendere sotto una soglia: chi legge deve comunque ricomporli. Se automatizzi la misura, indica linguaggio, analizzatore e versione prima di confrontare numeri di progetti diversi.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Guard clauses|Guard clauses]]
- [[Programmazione/Clean Code/Pagine/Complessita ciclomatica|Complessita ciclomatica]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]

## Fonti

- SonarSource, [Cognitive Complexity: definizione e regole di conteggio](https://www.sonarsource.com/docs/CognitiveComplexity.pdf)
- Robert C. Martin, *Clean Code*; Martin Fowler, *Refactoring*
