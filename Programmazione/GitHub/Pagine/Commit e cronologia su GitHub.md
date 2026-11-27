---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - git
  - commit
  - history
aliases:
  - Commit GitHub
  - Cronologia GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Git e GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
title: Commit e cronologia su GitHub
---

# Commit e cronologia su GitHub

## Sintesi

Un commit registra **lo snapshot dei file tracciati così come sono nello staging**. L’oggetto commit fa riferimento all’albero dei file e agli eventuali commit genitori, e conserva autore, committer e messaggio. Il primo commit non ha genitori; un merge può averne più di uno. Il diff che leggi su GitHub è un **confronto** tra snapshot, non una patch memorizzata nel commit.

## Esempio: una correzione e il suo test

Sul branch `fix/export-vuoto` hai modificato `src/export.js` e `tests/export.test.js`. Vuoi registrarli insieme, lasciando fuori gli appunti personali.

Controlla cosa è cambiato:

```bash
git status --short
```

Prepara i due percorsi:

```bash
git add -- src/export.js tests/export.test.js
```

Controlla il contenuto che entrerebbe nel commit:

```bash
git diff --staged
```

Se tocchi nuovamente un file dopo `git add`, la seconda modifica rimane sul disco ma **non** entra nel commit finché non la prepari. Per vederla:

```bash
git diff
```

Dopo aver verificato il comportamento, crea il commit locale:

```bash
git commit -m "Mantiene l'intestazione CSV nei report vuoti"
```

È un commit **atomico** se codice e test descrivono una sola modifica logica. `fix` direbbe poco; mescolare qui un refactor indipendente renderebbe più difficile sia la review sia l’annullamento. Il commit apparirà sul remoto soltanto dopo il push.

## Leggere o correggere la cronologia

Per orientarti fra i branch locali e i riferimenti remoti già scaricati:

```bash
git log --oneline --graph --decorate --all
```

Per esaminare l’ultimo commit ordinario e la modifica rispetto al suo genitore:

```bash
git show HEAD
```

Su GitHub la cronologia del file aiuta a circoscrivere una regressione. **Blame** indica il commit a cui è attribuita l’ultima modifica di una riga, non chi abbia introdotto un difetto. Un commit di merge registra l’unione delle storie; uno squash può rappresentare un’intera PR.

Se devi correggere l’ultimo commit **non condiviso**, controlla lo staging e poi usa `git commit --amend`: il commit viene sostituito e può cambiare identificatore. Per una cronologia già condivisa, preferisci un commit correttivo salvo accordo esplicito del team.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]

## Fonti

- [GitHub Docs - About commits](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits)
- [Pro Git: oggetti commit, tree e genitori](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)
