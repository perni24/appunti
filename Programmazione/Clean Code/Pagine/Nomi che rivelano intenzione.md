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
  - naming
  - intenzione
aliases:
  - Nomi che rivelano intenzione
  - Intention-revealing names
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Naming di variabili e funzioni]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Principio del minimo stupore]]"
title: Nomi che rivelano intenzione
---

# Nomi che rivelano intenzione

## Sintesi

Un nome rivela l'intenzione se permette di distinguere due concetti che hanno lo **stesso tipo** ma ragioni diverse per esistere. `days` descrive una misura; `trialPeriodDays` dice *quale regola* stai configurando.

## Esempio: due valori uguali, due decisioni

In questo prodotto di esempio la prova gratuita e il preavviso di disdetta durano entrambi 30 giorni. Il marketing decide la prima durata; il contratto con il cliente determina la seconda.

```js
const trialPeriodDays = 30;
const cancellationNoticeDays = 30;
```

Se la prova gratuita passa a 14 giorni, cambia soltanto `trialPeriodDays`. Un'unica costante `defaultDays` inviterebbe invece ad aggiornare anche il preavviso. Non è la ripetizione del numero a determinare se c'è duplicazione: conta se si tratta **della stessa decisione**.

## Come scegliere il nome

Completa la frase del chiamante: «La prova termina dopo ___» e «La disdetta richiede un preavviso di ___». Se un solo nome sembra intercambiabile in entrambe le frasi, verifica se è troppo generico. Lo stesso criterio vale per `list`: la domanda non è «è un array?», ma «sono fatture da pagare o pagamenti già eseguiti?».

## Limiti ed errori comuni

Il nome non sostituisce il contratto. `trialPeriodDays` non dice se si contano giorni di calendario o intervalli di 24 ore, né se l'ultimo giorno sia incluso; specifica la regola dove si calcola la scadenza e coprila con un caso limite. Evita sia nomi generici lontani dal punto d'uso, sia nomi che promettono condizioni non verificate.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Naming di variabili e funzioni|Naming di variabili e funzioni]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Principio del minimo stupore|Principio del minimo stupore]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, [Replace Magic Literal](https://refactoring.com/catalog/replaceMagicLiteral.html)
