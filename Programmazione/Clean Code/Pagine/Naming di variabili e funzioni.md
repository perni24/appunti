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
  - naming
  - leggibilita
aliases:
  - Naming di variabili e funzioni
  - Naming
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Nomi che rivelano intenzione]]"
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
title: Naming di variabili e funzioni
---

# Naming di variabili e funzioni

## Sintesi

Un nome deve permettere di usare correttamente un valore o una funzione nel suo contesto. Per un valore chiedi «che cosa rappresenta, in quale unità?»; per una funzione «quale risultato ottengo o quale effetto avvio?». Un nome più lungo non è per forza più informativo.

## Esempio: la scadenza di un abbonamento

```js
function isRenewalDue(expiresAtMs, nowMs) {
  return nowMs >= expiresAtMs;
}
```

I parametri sono **istanti**, entrambi espressi in millisecondi dalla stessa origine, non durate. Con `expiresAtMs = 2000`, a `1999` il risultato è falso e a `2000` è vero. `isRenewalDue` risponde a una domanda; non invia un promemoria. Per un comando che effettua l'invio, `sendRenewalReminder` comunicherebbe un contratto diverso.

## Dettagli importanti

| Scelta | Quando è utile |
| --- | --- |
| `activeSubscriptions` invece di `data` | Il nome rivela la selezione e il fatto che si tratta di una raccolta |
| `hasCredit` invece di `notEmpty` | Nel chiamante si legge una condizione positiva del dominio |
| `timeoutMs` invece di `timeout` | Il chiamante deve distinguere millisecondi e secondi |
| `i` come indice di un ciclo breve | Il ruolo è già evidente; un nome più lungo non aggiunge informazione |

## Limiti ed errori comuni

- Usa il vocabolario condiviso: se «cliente» e «intestatario» hanno ruoli differenti, non alternarli per varietà.
- Un suffisso come `Ms` segnala una convenzione, ma non converte né valida un valore. Al confine con un'API in secondi serve una conversione esplicita.
- La rinomina di una variabile locale non ha lo stesso impatto della rinomina di una chiave JSON pubblica. Controlla prima chi dipende da quel nome.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Nomi che rivelano intenzione|Nomi che rivelano intenzione]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]

## Fonti

- Robert C. Martin, *Clean Code*
- Steve McConnell, *Code Complete*
- Martin Fowler, [Rename Variable](https://refactoring.com/catalog/renameVariable.html)
