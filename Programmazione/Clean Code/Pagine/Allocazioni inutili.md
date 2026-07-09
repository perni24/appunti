---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [clean-code, performance, memoria]
aliases: [Allocazioni inutili, Unnecessary allocations]
prerequisites: [Hot path, Performance e leggibilita]
related: [Profiling prima del refactoring, Immutabilita, Pipeline di trasformazione]
---

# Allocazioni inutili

## Sintesi

Le **allocazioni inutili** sono creazioni di oggetti, array, stringhe o buffer che non aggiungono valore reale e aumentano lavoro di memoria e garbage collector.

Sono importanti soprattutto in hot path, loop grandi, pipeline dati e sistemi con vincoli di memoria.

## Quando usarlo

- Quando il profiler mostra pressione sulla memoria.
- Quando un loop crea molti oggetti temporanei.
- Quando una pipeline copia dati grandi piu volte.
- Quando una funzione e in hot path.
- Quando un sistema soffre di pause o picchi di memoria.

## Come funziona

Ogni allocazione ha un costo:

- memoria occupata;
- inizializzazione;
- possibile copia;
- lavoro di cleanup o garbage collection;
- pressione su cache CPU.

Il punto non e evitare ogni allocazione, ma eliminare quelle non necessarie nei punti che contano.

## API / Sintassi

```js
// Due passaggi e due array temporanei.
const activeNames = users
  .filter((user) => user.active)
  .map((user) => user.name);
```

Questa forma e leggibile. In un hot path enorme puo essere sostituita con un passaggio unico misurato.

## Esempio pratico

```js
const activeNames = [];

for (const user of users) {
  if (user.active) {
    activeNames.push(user.name);
  }
}
```

Il ciclo evita un array temporaneo. Ha senso solo se la misura mostra che l'allocazione e rilevante.

## Varianti

- Riutilizzo di buffer.
- Streaming invece di caricare tutto in memoria.
- Lazy evaluation.
- Strutture dati piu compatte.
- Batch controllati per ridurre oggetti intermedi.

## Errori comuni

- Ottimizzare allocazioni in codice non critico.
- Sacrificare leggibilita senza misura.
- Riutilizzare oggetti mutabili creando bug.
- Ignorare copie profonde involontarie.
- Confondere immutabilita utile con copia inutile.

## Checklist

- Il profiler mostra pressione sulla memoria?
- Il codice e in hot path?
- L'allocazione puo essere rimossa senza introdurre mutazione fragile?
- Esiste un test che protegge il comportamento?
- Il miglioramento e stato misurato dopo la modifica?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Hot path]]
- [[Performance e leggibilita]]
- [[Profiling prima del refactoring]]
- [[Immutabilita]]
- [[Pipeline di trasformazione]]

## Fonti

- Brendan Gregg, *Systems Performance*
- Martin Thompson, *Mechanical Sympathy*
- Martin Fowler, *Refactoring*
