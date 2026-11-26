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
  - design
aliases:
  - Codice testabile
  - Testable code
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]"
  - "[[Programmazione/Clean Code/Pagine/Funzioni pure e impure]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
  - "[[Programmazione/Clean Code/Pagine/Test di integrazione]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
title: Codice testabile
---

# Codice testabile

## Sintesi

Un comportamento è testabile se si possono **controllare le condizioni di partenza** e **osservare il risultato o l'effetto che conta**. Per provare una scadenza non serve attendere un'ora né leggere campi privati: serve scegliere l'istante iniziale e osservare la scadenza passata all'archivio.

## Esempio: un promemoria tra un'ora

Il modulo `reminder.mjs` usa istanti Unix in **millisecondi**, come `Date.now()`. Il codice di avvio passa `Date.now` come `nowMs` e l'operazione di persistenza come `save`. L'ID della fattura è già validato.

```js
export async function scheduleReminder(invoiceId, { nowMs, save }) {
  const dueAtMs = nowMs() + 60 * 60 * 1000;
  return save({ invoiceId, dueAtMs });
}
```

Con un orologio che restituisce 1000, l'archivio deve ricevere `dueAtMs: 3601000`. Aggiungere solo 3600 a `Date.now()` sposterebbe la scadenza di **3,6 secondi**, non di un'ora. Qui «tra un'ora» è una durata trascorsa, non una regola di calendario o il formato richiesto da una libreria di token.

## Dove fermare il test

Un sostituto locale di `save` può registrare il dato ricevuto e restituire un ID noto. Si controllano così la scadenza **e** la promessa che l'ID o l'errore arrivino al chiamante. Questa prova non dimostra che un job parta davvero, che la scrittura sia durabile o che un server usi la stessa unità: quelle sono prove dell'adattatore o dell'integrazione.

Non introdurre un contenitore globale di servizi per rendere configurabili due operazioni. Il test completo, con una sola azione e due osservazioni dello stesso comportamento, è in [[Programmazione/Clean Code/Pagine/Arrange Act Assert|Arrange Act Assert]].

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]
- [[Programmazione/Clean Code/Pagine/Funzioni pure e impure|Funzioni pure e impure]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]
- [[Programmazione/Clean Code/Pagine/Test di integrazione|Test di integrazione]]

## Fonti

- Martin Fowler, [Clock Wrapper](https://martinfowler.com/bliki/ClockWrapper.html)
- Michael Feathers, *Working Effectively with Legacy Code*; Kent Beck, *Test Driven Development*; Robert C. Martin, *Clean Code*
