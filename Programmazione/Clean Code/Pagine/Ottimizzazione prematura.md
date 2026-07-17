---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, performance, ottimizzazione]
aliases: [Ottimizzazione prematura, Premature optimization]
prerequisites: [Performance e leggibilita]
related: [Profiling prima del refactoring, Hot path, Debito tecnico]
---

# Ottimizzazione prematura

## Sintesi

L'**ottimizzazione prematura** e il tentativo di rendere il codice piu veloce prima di sapere dove siano davvero i colli di bottiglia.

E pericolosa perche aggiunge complessita senza una prova concreta del beneficio.

## Problema che risolve

Molti sistemi accumulano codice difficile per motivi ipotetici:

- cache inutili;
- strutture dati complicate;
- funzioni poco leggibili;
- branch speciali;
- duplicazione per evitare chiamate percepite come costose;
- astrazioni nate da supposizioni.

Il risultato e debito tecnico mascherato da performance.

## Concetto chiave

Non ottimizzare cio che non e misurato.

Prima identifica requisito, metrica e scenario. Poi misura. Solo dopo cambia il codice.

## Dettagli importanti

- Prematura non significa sempre sbagliata: alcuni vincoli sono noti fin dall'inizio.
- Scegliere un algoritmo adeguato non e micro-ottimizzazione.
- Evitare sprechi evidenti e parte del buon design.
- Le ottimizzazioni devono avere un motivo tracciabile.
- Dopo l'ottimizzazione bisogna verificare che il comportamento sia invariato.

## Esempio

Scelta fragile:

```js
// Cache aggiunta senza sapere se questa funzione e lenta.
const cache = new Map();
```

Scelta piu disciplinata:

```text
1. misuro latenza della funzione
2. verifico che sia in hot path
3. aggiungo cache con strategia di invalidazione
4. misuro di nuovo
```

## Limiti

- In sistemi embedded, realtime o ad alto volume, alcuni vincoli vanno considerati subito.
- Alcune scelte architetturali sono costose da correggere dopo.
- Non misurare perche "tanto e leggibile" e l'errore opposto.

## Errori comuni

- Citare la performance senza dati.
- Rendere opaco codice non critico.
- Aggiungere cache senza invalidazione.
- Usare strutture low-level dove una struttura standard basta.
- Non rimuovere ottimizzazioni che non servono piu.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Performance e leggibilita]]
- [[Profiling prima del refactoring]]
- [[Cache e invalidazione]]
- [[Debito tecnico]]

## Fonti

- Donald Knuth, *Structured Programming with go to Statements*
- Martin Fowler, *Refactoring*
- Brendan Gregg, *Systems Performance*
