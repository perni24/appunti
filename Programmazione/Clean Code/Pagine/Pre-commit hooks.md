---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, git, pre-commit]
aliases: [Pre-commit hooks, Hook pre-commit]
prerequisites: [Formatter, Linter]
related: [Code quality gates, Type checking, Test unitari leggibili]
---

# Pre-commit hooks

## Sintesi

I **pre-commit hooks** sono controlli eseguiti automaticamente prima di creare un commit.

Aiutano a intercettare problemi semplici presto: formattazione, lint, file generati, segreti, test rapidi o controlli specifici.

## Quando usarlo

- Quando vuoi evitare commit non formattati.
- Quando vuoi bloccare segreti o file indesiderati.
- Quando controlli rapidi possono girare localmente.
- Quando vuoi ridurre fallimenti banali in CI.
- Quando il team accetta uno standard comune.

## Come funziona

Git permette di eseguire script in momenti specifici del flusso.

Il pre-commit hook viene eseguito prima della creazione del commit. Se fallisce, il commit viene bloccato finche il problema non viene corretto o bypassato consapevolmente.

## API / Sintassi

```text
git commit
-> pre-commit hook
-> controlli
-> commit consentito o bloccato
```

Gli hook devono essere veloci e affidabili.

## Esempio pratico

```text
pre-commit:
- format staged files
- lint staged files
- scan secrets
- reject large generated files
```

I controlli locali evitano errori banali prima della pull request.

## Varianti

- Hook Git manuali.
- Framework `pre-commit`.
- Hook su file staged.
- Hook su tutto il progetto.
- Hook server-side o CI come controllo finale.

## Errori comuni

- Eseguire controlli troppo lenti.
- Avere hook diversi tra sviluppatori.
- Non documentare installazione e bypass.
- Affidarsi solo agli hook locali senza CI.
- Modificare file durante il commit senza renderlo chiaro.

## Checklist

- Gli hook sono veloci?
- Sono documentati e installabili facilmente?
- CI ripete i controlli importanti?
- I bypass sono eccezioni consapevoli?
- Gli hook lavorano solo sui file rilevanti quando possibile?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Formatter]]
- [[Linter]]
- [[Code quality gates]]
- [[Type checking]]
- [[Test unitari leggibili]]

## Fonti

- Git Documentation, *Hooks*
- pre-commit Documentation
- GitHub Actions Documentation
