---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - tooling
  - formatter
aliases:
  - Formatter
  - Code formatter
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Convenzioni di progetto]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Linter]]"
  - "[[Programmazione/Clean Code/Pagine/Pre-commit hooks]]"
  - "[[Programmazione/Clean Code/Pagine/Code quality gates]]"
title: Formatter
---

# Formatter

## Sintesi

Un formatter decide **come si presenta** un programma, non quale regola di business dovrebbe applicare. Prettier può uniformare spazi e indentazione; non corregge una tariffa errata e non è, di per sé, uno strumento per riordinare gli import. Separare la formattazione da una modifica funzionale rende il diff più facile da verificare.

## Esempio: controllo e scrittura non sono la stessa operazione

In un progetto di prova con Prettier 3.8.1 già installato localmente, metti in `shipping.mjs` questo esempio volutamente non formattato. La tariffa è espressa in centesimi.

```js
export function shippingCents(total){return total>=2000?0:350}
```

Verifica lo stile **senza modificare il file**. `--no-install` evita di installare il tool se manca; le regole di progetto devono essere le stesse per editor e CI.

```sh
npx --no-install prettier --check shipping.mjs
```

Riscrivi solo il file indicato e controlla il diff:

```sh
npx --no-install prettier --write shipping.mjs
```

Con lo stile predefinito entrambi gli importi restano identici. Il primo controllo segnala il file da formattare con codice 1; dopo la scrittura lo stesso controllo termina con 0. Un errore di esecuzione di Prettier è distinto dal semplice disallineamento di stile. Una seconda scrittura con la stessa versione e configurazione non dovrebbe produrre un altro diff.

## Come usarlo in un progetto

- Fissa la versione nel progetto e nel lockfile. Una nuova versione può stampare lo stesso codice in modo diverso.
- Fai riscrivere all'editor o a un comando locale; in CI usa il controllo in sola lettura, così la correzione resta nel commit dell'autore.
- Escludi consapevolmente dipendenze e output generati. Una riformattazione estesa va in un commit separato.

Un programma che usa `>` anziché `>=` può essere perfettamente formattato. Quel difetto richiede una specifica e un test sul valore di soglia; vedi [[Programmazione/Clean Code/Pagine/Mutation testing|Mutation testing]]. Per la configurazione completa vedi [[Programmazione/JavaScript/Pagine/Prettier|Prettier in JavaScript]].

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Convenzioni di progetto|Convenzioni di progetto]]
- [[Programmazione/Clean Code/Pagine/Linter|Linter]]
- [[Programmazione/Clean Code/Pagine/Pre-commit hooks|Pre-commit hooks]]
- [[Programmazione/Clean Code/Pagine/Code quality gates|Code quality gates]]

## Fonti

- Prettier Documentation
- Black Documentation
- rustfmt Documentation
- [Prettier: CLI, check, write ed exit code](https://prettier.io/docs/cli)
