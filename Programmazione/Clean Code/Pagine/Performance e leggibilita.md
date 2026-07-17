---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, performance, leggibilita]
aliases: [Performance e leggibilita, Performance vs readability]
prerequisites: [Leggibilita del codice, Profiling prima del refactoring]
related: [Ottimizzazione prematura, Hot path, Allocazioni inutili]
---

# Performance e leggibilita

## Sintesi

**Performance e leggibilita** non sono obiettivi opposti in modo assoluto. Spesso codice semplice, diretto e ben strutturato e anche abbastanza veloce.

Il problema nasce quando si sacrifica chiarezza per ottimizzazioni non misurate, oppure quando si ignora una criticita reale per mantenere codice comodo.

## Problema che risolve

Il codice puo peggiorare in due direzioni:

- ottimizzazioni premature che rendono difficile capire il comportamento;
- codice molto leggibile ma inefficiente nei punti realmente critici.

Un buon approccio distingue tra codice normale e hot path misurati.

## Concetto chiave

Prima rendi il codice corretto e leggibile. Poi misura. Solo dopo ottimizza dove serve.

Quando ottimizzi, conserva intenzione e confini:

- isola il codice piu complesso;
- nomina la ragione dell'ottimizzazione;
- aggiungi test e benchmark;
- documenta il vincolo se non e evidente.

## Dettagli importanti

- La leggibilita riduce bug e costo di manutenzione.
- Le performance vanno valutate con dati reali.
- Un algoritmo migliore puo essere piu leggibile e piu veloce.
- Micro-ottimizzazioni senza misura raramente valgono il costo.
- I vincoli di latenza, memoria e throughput devono essere espliciti.

## Esempio

Codice leggibile ma potenzialmente inefficiente:

```js
const activeUsers = users.filter((user) => user.active);
const emails = activeUsers.map((user) => user.email);
```

In un punto non critico va bene. In un hot path con milioni di elementi, puo essere meglio fondere i passaggi o usare streaming, ma solo dopo misura.

## Limiti

- Alcuni domini richiedono performance come requisito primario.
- Il codice ottimizzato puo richiedere strutture meno intuitive.
- I benchmark possono mentire se non rappresentano l'uso reale.
- La leggibilita per un esperto di dominio puo essere diversa dalla leggibilita per un principiante.

## Errori comuni

- Ottimizzare senza profiler.
- Cambiare strutture dati senza misurare l'impatto.
- Rendere tutto piu complesso per casi rari.
- Ignorare prestazioni degradate in produzione.
- Non lasciare test o commenti sulle ottimizzazioni non ovvie.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Leggibilita del codice]]
- [[Ottimizzazione prematura]]
- [[Profiling prima del refactoring]]
- [[Hot path]]
- [[Allocazioni inutili]]

## Fonti

- Donald Knuth, *Structured Programming with go to Statements*
- Martin Fowler, *Refactoring*
- Brendan Gregg, *Systems Performance*
