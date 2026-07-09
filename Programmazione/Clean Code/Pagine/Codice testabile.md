---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, testing, design]
aliases: [Codice testabile, Testable code]
prerequisites: [Dipendenze esplicite, Funzioni pure e impure]
related: [Test unitari leggibili, Test di integrazione, Side effects controllati]
---

# Codice testabile

## Sintesi

Il **codice testabile** e codice progettato in modo che comportamento, dipendenze e stati siano osservabili e controllabili nei test.

Non significa scrivere codice solo per i test, ma evitare design che rendono i test inutilmente difficili.

## Problema che risolve

Codice difficile da testare spesso segnala problemi di design:

- dipendenze globali;
- side effects nascosti;
- funzioni troppo grandi;
- stato condiviso;
- tempo e random non controllabili;
- logica di dominio mescolata con framework o I/O.

## Concetto chiave

Un buon design rende semplice isolare decisioni e verificare effetti.

La logica pura dovrebbe essere testabile senza database, rete o file system. Gli effetti andrebbero testati nei punti di integrazione appropriati.

## Esempio

Difficile da testare:

```js
function createToken(user) {
  return sign(user.id, process.env.SECRET, { expiresAt: Date.now() + 3600 });
}
```

Piu testabile:

```js
function createToken(user, secret, now) {
  return sign(user.id, secret, { expiresAt: now + 3600 });
}
```

Tempo e configurazione diventano input espliciti.

## Dettagli importanti

- Dipendenze esplicite rendono i test piu controllabili.
- Funzioni piccole riducono setup e casi da coprire.
- I side effects dovrebbero essere confinati.
- Testabilita e leggibilita spesso migliorano insieme.
- Un test difficile puo indicare responsabilita confuse.

## Limiti

- Non tutto deve essere unit-testato in isolamento.
- Mock eccessivi possono testare implementazione invece di comportamento.
- Alcuni bug emergono solo in integrazione.
- Rendere tutto configurabile puo appesantire API semplici.

## Errori comuni

- Usare singleton globali per database, clock o configurazione.
- Testare dettagli interni invece di comportamento osservabile.
- Mescolare domain logic e framework.
- Scrivere codice con side effects in costruttori o import.
- Ignorare il feedback dei test difficili da scrivere.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Dipendenze esplicite]]
- [[Funzioni pure e impure]]
- [[Side effects controllati]]
- [[Test unitari leggibili]]
- [[Test di integrazione]]

## Fonti

- Michael Feathers, *Working Effectively with Legacy Code*
- Kent Beck, *Test Driven Development*
- Robert C. Martin, *Clean Code*
