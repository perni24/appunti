---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [clean-code, profiling, performance]
aliases: [Profiling prima del refactoring, Profile before refactoring]
prerequisites: [Performance e leggibilita, Refactoring sicuro]
related: [Hot path, Ottimizzazione prematura, Codice testabile]
---

# Profiling prima del refactoring

## Sintesi

Il **profiling prima del refactoring** consiste nel misurare dove il programma spende tempo, memoria o I/O prima di cambiare il codice per motivi di performance.

Serve a evitare modifiche costose nei punti sbagliati.

## Quando usarlo

- Quando una funzione sembra lenta ma non hai dati.
- Quando una modifica di performance rischia di peggiorare leggibilita.
- Quando devi scegliere tra piu ottimizzazioni.
- Quando la lentezza appare solo in produzione.
- Quando vuoi verificare se un refactoring ha migliorato davvero.

## Come funziona

Un ciclo utile e:

```text
definisci metrica -> riproduci scenario -> profila -> individua hot path -> cambia -> misura di nuovo
```

Senza confronto prima/dopo non sai se l'ottimizzazione ha funzionato.

## API / Sintassi

```text
latency
throughput
CPU time
memory allocations
I/O wait
database query time
```

La metrica deve essere collegata al problema reale.

## Esempio pratico

```text
Problema: endpoint lento.
Misura: p95 latency.
Profilo: 80% del tempo su query N+1.
Intervento: caricare dati in batch.
Verifica: p95 prima/dopo sullo stesso scenario.
```

Il profiling indirizza il refactoring verso la causa reale.

## Varianti

- CPU profiler: trova consumo di calcolo.
- Memory profiler: trova allocazioni e leak.
- Query profiler: trova query lente o ripetute.
- Tracing: mostra tempo distribuito tra servizi.
- Benchmark mirato: confronta alternative controllate.

## Errori comuni

- Ottimizzare in base a intuizione.
- Misurare su dati troppo piccoli.
- Confondere media e percentile.
- Cambiare molte cose prima di misurare di nuovo.
- Ignorare database, rete e I/O.

## Checklist

- Esiste una metrica chiara?
- Lo scenario rappresenta l'uso reale?
- Hai una misura prima della modifica?
- Sai qual e l'hot path?
- Hai misurato dopo il refactoring?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Performance e leggibilita]]
- [[Ottimizzazione prematura]]
- [[Hot path]]
- [[Refactoring sicuro]]
- [[Codice testabile]]

## Fonti

- Brendan Gregg, *Systems Performance*
- Martin Fowler, *Refactoring*
- Michael Nygard, *Release It!*
