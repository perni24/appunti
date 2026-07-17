---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, performance, hot-path]
aliases: [Hot path, Percorso critico]
prerequisites: [Profiling prima del refactoring]
related: [Performance e leggibilita, Allocazioni inutili, Cache e invalidazione]
---

# Hot path

## Sintesi

Un **hot path** e una parte del codice eseguita molto spesso o con impatto significativo su latenza, CPU, memoria o I/O.

Nel Clean Code un hot path puo giustificare scelte piu attente alla performance, ma deve essere identificato con misure.

## Problema che risolve

Non tutto il codice ha lo stesso peso.

Ottimizzare codice poco eseguito porta poco valore. Trascurare un hot path reale puo invece degradare l'intero sistema.

## Concetto chiave

Il trattamento del codice dipende dal suo ruolo.

Nel codice normale, privilegia chiarezza e semplicita. Nel hot path, conserva chiarezza ma valuta con piu attenzione allocazioni, I/O, complessita algoritmica e strutture dati.

## Dettagli importanti

- Un hot path va confermato con profiling o metriche.
- Piccole inefficienze ripetute milioni di volte diventano rilevanti.
- I/O e database possono essere hot path quanto la CPU.
- Ottimizzazioni in hot path meritano test e commenti mirati.
- Una cache in hot path richiede invalidazione corretta.

## Esempio

```js
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
```

Questa funzione e semplice. Se viene eseguita miliardi di volte in una pipeline dati, anche dettagli piccoli possono diventare misurabili. In una API normale, probabilmente non serve ottimizzarla.

## Limiti

- Un hot path puo cambiare con uso, dati e deploy.
- Misure locali possono non riflettere produzione.
- Ottimizzare un hot path puo spostare il collo di bottiglia altrove.
- Non tutto cio che e frequente e anche importante per l'utente.

## Errori comuni

- Dichiarare hot path una funzione senza dati.
- Ottimizzare micro-dettagli ignorando algoritmi e I/O.
- Rendere il codice critico illeggibile senza documentare il motivo.
- Non aggiornare benchmark dopo cambiamenti.
- Ignorare percentili e casi peggiori.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Profiling prima del refactoring]]
- [[Performance e leggibilita]]
- [[Allocazioni inutili]]
- [[Cache e invalidazione]]

## Fonti

- Brendan Gregg, *Systems Performance*
- Martin Thompson, *Mechanical Sympathy*
- Martin Fowler, *Refactoring*
