---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, funzioni, responsabilita]
aliases: [Funzioni con responsabilita singola, Single responsibility functions]
prerequisites: [Funzioni piccole]
related: [Funzioni piccole, Manutenibilita del codice]
---

# Funzioni con responsabilita singola

## Sintesi

Una **funzione con responsabilita singola** ha un solo motivo principale per cambiare. Fa una cosa riconoscibile e la fa a un livello di astrazione coerente.

Questo non significa che contenga una sola istruzione, ma che rappresenti un solo concetto operativo.

## Problema che risolve

Le funzioni con molte responsabilita sono difficili da testare e modificare. Una correzione nella validazione puo rompere il salvataggio. Un cambio nel logging puo alterare il flusso.

Separare responsabilita riduce questi accoppiamenti.

## Concetto chiave

Una funzione ha probabilmente troppe responsabilita se:

- il nome contiene `and`;
- contiene fasi molto diverse;
- modifica stato e calcola risultato;
- valida, trasforma, salva e notifica insieme;
- richiede molti parametri non correlati;
- i test devono coprire scenari troppo diversi.

## Dettagli importanti

- Una funzione di orchestration puo chiamare piu funzioni, se coordina un solo caso d'uso.
- Responsabilita singola non significa isolamento assoluto.
- Il livello di astrazione e importante: non mischiare policy e dettagli.
- Il nome della funzione dovrebbe indicare chiaramente la responsabilita.
- Una responsabilita va definita rispetto al dominio, non solo al codice.

## Esempio

Troppo:

```js
function registerUserAndSendEmailAndCreateInvoice(userInput) {
  // validazione, salvataggio, email, fattura
}
```

Meglio:

```js
function registerUser(userInput) {
  const user = createUser(userInput);
  sendWelcomeEmail(user);
  createInitialInvoice(user);
}
```

La funzione principale coordina il caso d'uso, mentre i dettagli sono separati.

## Limiti

- Separare troppo puo rendere il flusso frammentato.
- Alcune responsabilita sono naturalmente accoppiate nel dominio.
- Serve equilibrio tra coesione e semplicita.
- La responsabilita puo cambiare quando il progetto cresce.

## Errori comuni

- Separare codice per tipo tecnico invece che per responsabilita.
- Nascondere responsabilita multiple dietro nomi vaghi.
- Aggiungere flag booleani per cambiare comportamento interno.
- Far dipendere una funzione da troppe risorse esterne.
- Usare la responsabilita singola come scusa per over-engineering.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Funzioni piccole]]
- [[Manutenibilita del codice]]
- [[Naming di variabili e funzioni]]
- [[Debito tecnico]]

## Fonti

- Robert C. Martin, *Clean Code*
- Robert C. Martin, *Agile Software Development, Principles, Patterns, and Practices*
