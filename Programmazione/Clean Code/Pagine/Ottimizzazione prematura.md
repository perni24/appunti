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
  - performance
  - ottimizzazione
aliases:
  - Ottimizzazione prematura
  - Premature optimization
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Performance e leggibilita]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Profiling prima del refactoring]]"
  - "[[Programmazione/Clean Code/Pagine/Hot path]]"
  - "[[Programmazione/Clean Code/Pagine/Debito tecnico]]"
title: Ottimizzazione prematura
---

# Ottimizzazione prematura

## Sintesi

Un'ottimizzazione è prematura quando introduce un costo certo, per esempio memoria o invalidazione, a fronte di un beneficio che non sai ancora descrivere. Non significa rinviare ogni scelta: se un file non entra nella RAM disponibile, leggerlo a blocchi è un requisito di progetto, non una micro-ottimizzazione.

## Esempio: serve davvero una cache globale?

Un export riceve una lista di codici e cerca la descrizione di ciascuno. Prima di introdurre una cache condivisa tra richieste, prova un'alternativa più limitata: **riusare una lettura solo all'interno dello stesso export**. Il contratto d'esempio ammette che ogni codice abbia la stessa descrizione per l'intero lotto; `null` indica una descrizione assente.

```js
async function describeBatch(codes, readDescription) {
  const seen = new Map();
  const result = [];
  for (const code of codes) {
    if (!seen.has(code)) seen.set(code, await readDescription(code));
    result.push(seen.get(code));
  }
  return result;
}
```

Con `["A", "B", "A"]` ci sono due letture invece di tre, ma il risultato contiene tre posizioni nell'ordine originale. `has` distingue un valore `null` già letto da una chiave sconosciuta. Un errore di lettura interrompe il lotto: non viene trasformato in «nessuna descrizione». Il lotto successivo riparte con una mappa vuota.

## Decisione prima del rilascio

| Osservazione | Decisione ragionata |
| --- | --- |
| Quasi tutti i codici sono distinti | Il numero di letture non scende: la mappa aggiunge memoria senza risolvere quel costo |
| Molte ripetizioni nello stesso lotto, letture costose | Confronta la versione locale con la base, stesso input e stesso archivio |
| Si vuole riusare il risultato tra lotti o tra utenti | È un altro contratto: definisci chiave completa, scadenza, isolamento e invalidazione |
| Ogni lettura deve riflettere il dato più recente | Anche la sola mappa locale può essere scorretta: non adottarla |

## Verifica

Registra totale dei codici, distinti e chiamate effettive alla sorgente. La differenza è un beneficio in **letture evitate**, non in millisecondi. Misura poi il tempo del lotto con dati rappresentativi. Questa versione rimane intenzionalmente sequenziale; una API batch o letture concorrenti limitate sono alternative da valutare separatamente.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Performance e leggibilita|Performance e leggibilita]]
- [[Programmazione/Clean Code/Pagine/Profiling prima del refactoring|Profiling prima del refactoring]]
- [[Programmazione/Clean Code/Pagine/Cache e invalidazione|Cache e invalidazione]]
- [[Programmazione/Clean Code/Pagine/Debito tecnico|Debito tecnico]]

## Fonti

- Donald Knuth, *Structured Programming with go to Statements*
- Martin Fowler, *Refactoring*
- Brendan Gregg, *Systems Performance*
- [Microsoft Azure Architecture Center: costi e coerenza della cache](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
