---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, code-smell, refactoring]
aliases: [Code smells, Code smell]
prerequisites: [Clean Code]
related: [Debito tecnico, Refactoring sicuro, Coesione e accoppiamento]
---

# Code smells

## Sintesi

I **code smells** sono segnali nel codice che indicano un possibile problema di design, leggibilita o manutenibilita.

Non sono bug certi e non vanno corretti automaticamente. Sono indizi da valutare.

## Problema che risolve

Senza un linguaggio comune, molti problemi di qualita restano vaghi: "questa classe e brutta", "questa funzione non mi convince", "qui c'e qualcosa che non va".

I code smells danno nomi a sintomi ricorrenti e aiutano a discutere refactoring in modo concreto.

## Concetto chiave

Un code smell segnala una domanda:

```text
Questo codice e difficile da cambiare per una ragione strutturale?
```

Esempi frequenti:

- funzioni lunghe;
- classi troppo grandi;
- duplicazione;
- feature envy;
- shotgun surgery;
- primitive obsession;
- dead code;
- boolean blindness.

## Dettagli importanti

- Un smell non implica sempre una correzione immediata.
- Il contesto decide la gravita.
- Gli smell sono utili durante review e refactoring.
- Alcuni smell sono accettabili in codice temporaneo.
- Smell ripetuti indicano debito tecnico sistemico.

## Esempio

Smell:

```text
Ogni nuova regola di prezzo richiede modifiche in 6 file diversi.
```

Possibile diagnosi:

```text
Shotgun surgery: la responsabilita del pricing e dispersa.
```

Possibile refactoring:

```text
Concentrare le regole di prezzo in un modulo o policy dedicata.
```

## Limiti

- Gli smell non sostituiscono test e misurazione.
- Alcuni pattern sembrano smell ma sono scelte consapevoli.
- Correggere smell senza capire comportamento puo introdurre bug.
- Non tutti gli smell valgono lo stesso costo.

## Errori comuni

- Trattare ogni smell come emergenza.
- Fare refactoring estetico senza beneficio.
- Correggere smell senza test.
- Usare nomi di smell per bloccare discussioni.
- Ignorare smell in aree ad alto cambiamento.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Debito tecnico]]
- [[Coesione e accoppiamento]]
- [[Primitive obsession]]
- [[Funzioni piccole]]
- [[Moduli piccoli]]

## Fonti

- Martin Fowler, *Refactoring*
- Kent Beck, *Implementation Patterns*
