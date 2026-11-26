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
  - funzioni
  - responsabilita
aliases:
  - Funzioni con responsabilita singola
  - Single responsibility functions
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Funzioni piccole]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Funzioni piccole]]"
  - "[[Programmazione/Clean Code/Pagine/Manutenibilita del codice]]"
title: Funzioni con responsabilita singola
---

# Funzioni con responsabilita singola

## Sintesi

Per una funzione, «responsabilità singola» è una domanda di progettazione: **quali decisioni cambiano insieme e quali possono cambiare indipendentemente?** Non è un limite al numero di istruzioni, parametri o verbi nel nome.

## Esempio: registrare un utente

Nel caso di esempio una registrazione crea l'utente, invia il benvenuto e apre la fattura iniziale, in quest'ordine. Il modo di validare e salvare un utente, il testo dell'email e le regole fiscali non devono essere implementati nella stessa funzione.

```js
async function registerUser(input, { createUser, sendWelcomeEmail, createInitialInvoice }) {
  const user = await createUser(input);
  await sendWelcomeEmail(user);
  await createInitialInvoice(user);
  return user;
}
```

Qui `createUser` è responsabile della validazione e del salvataggio. `registerUser` ha una responsabilità diversa: coordinare il caso d'uso. Cambiare l'oggetto dell'email non richiede di toccare la registrazione; decidere che la fattura debba precedere il benvenuto sì.

## Come verificarlo

- Per il **flusso**, passa tre collaboratori che annotano le chiamate. Se `createUser` fallisce, non devono partire né email né fattura.
- Per la **politica di fatturazione**, verifica il calcolo senza inviare email né creare utenti. Se per cambiarne un'aliquota devi riscrivere tutti i test di registrazione, probabilmente il confine è nel posto sbagliato.
- In questo esempio un errore dell'email interrompe la sequenza, ma l'utente esiste già. Se la fattura è obbligatoria anche quando l'email fallisce, questo flusso **non soddisfa il requisito**: non basta rinominare le funzioni.

## Limiti ed errori comuni

Una funzione che modifica stato e restituisce il risultato non ha per questo due responsabilità: per esempio creare un utente e restituirne l'ID può essere un unico contratto. Fare tre wrapper attorno a tre righe non separa le decisioni se cambia sempre tutto insieme. Al contrario, una funzione corta può ancora incorporare politiche che evolvono separatamente.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]
- [[Programmazione/Clean Code/Pagine/Manutenibilita del codice|Manutenibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Naming di variabili e funzioni|Naming di variabili e funzioni]]
- [[Programmazione/Clean Code/Pagine/Debito tecnico|Debito tecnico]]

## Fonti

- Robert C. Martin, *Clean Code*
- Robert C. Martin, *Agile Software Development, Principles, Patterns, and Practices*
- Robert C. Martin, [The Single Responsibility Principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html)
