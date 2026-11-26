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
  - esplicito
aliases:
  - Codice esplicito vs codice implicito
  - Codice esplicito
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Principio del minimo stupore]]"
title: Codice esplicito vs codice implicito
---

# Codice esplicito vs codice implicito

## Sintesi

Una dipendenza è implicita quando per prevedere il risultato devi conoscere qualcosa che non compare al punto d'uso: per esempio un client globale, l'orologio di sistema o una configurazione letta durante l'import. Renderla esplicita serve quando quella dipendenza cambia gli esiti o rende difficile verificarli.

## Esempio: attendere davvero un invio

Con un `emailClient` globale, la firma `sendWelcomeEmail(user)` non rivela quale servizio userà il codice. Qui il chiamante fornisce un client il cui metodo `send` restituisce una Promise con la ricevuta di invio:

```js
function sendWelcomeEmail(user, emailClient) {
  return emailClient.send(user.email, "Welcome");
}
```

Il `return` conta quanto il parametro: consente al chiamante di attendere il completamento o gestire il rifiuto. Scrivere solo `emailClient.send(...)` avvierebbe comunque l'operazione, ma restituirebbe `undefined`: un `await` del chiamante non aspetterebbe l'invio.

## Verifica pratica

Fornisci un client locale che annota destinatario e messaggio e restituisce una ricevuta nota. Poi fanne uno che restituisce una Promise rifiutata: il chiamante deve ricevere l'errore, non un apparente successo. Questa prova verifica il contratto tra funzione e client; non dimostra che un'email sia stata consegnata.

## Limiti ed errori comuni

- Non serve passare ogni costante come parametro. Un formatter deterministico importato da un modulo e un servizio di rete globale hanno costi di verifica diversi.
- Se dieci funzioni intermedie inoltrano lo stesso client senza usarlo, può essere più leggibile passarlo una volta alla creazione del servizio. Un contenitore globale chiamato `dependencies` non rende esplicito quali servizi siano davvero necessari.
- Un parametro esplicito non sostituisce la validazione ai confini: qui si assume che `user.email` sia già stato validato.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Principio del minimo stupore|Principio del minimo stupore]]
- [[Programmazione/Clean Code/Pagine/Naming di variabili e funzioni|Naming di variabili e funzioni]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]

## Fonti

- Robert C. Martin, *Clean Code*
- Steve McConnell, *Code Complete*
- Martin Fowler, [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)
