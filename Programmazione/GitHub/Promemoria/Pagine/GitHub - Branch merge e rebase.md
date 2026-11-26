---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - git
  - github
  - promemoria
  - branch
  - merge
  - rebase
aliases:
  - Cheatsheet branch Git
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub]]"
title: GitHub - Branch, merge e rebase
---

# GitHub - Branch, merge e rebase

## Elencare branch

```powershell
git branch
```

```powershell
git branch --all
```

```powershell
git branch --verbose --verbose
```

## Creare e cambiare

```powershell
git switch -c feature/user-search
```

```powershell
git switch main
```

## Rinominare

```powershell
git branch -m new-name
```

## Eliminare

Sono due operazioni indipendenti: `-d` elimina il branch locale se risulta integrato nel suo upstream (o in `HEAD` se non ha upstream); `push --delete` elimina il ramo sul server anche per i collaboratori, se consentito. Non usare il secondo comando per ripulire solo il clone.

```powershell
git branch -d feature/completed
```

```powershell
git push origin --delete feature/completed
```

## Merge

Parti con un working tree pulito. Qui la destinazione è `main`; `--no-ff` chiede un commit di merge anche quando sarebbe possibile un fast-forward.

```powershell
git switch main
```

```powershell
git merge --no-ff feature/user-search
```

## Annullare merge non concluso

```powershell
git merge --abort
```

## Rebase

Alternativa al merge precedente: sul tuo branch di lavoro, riapplica i suoi commit sopra la versione appena scaricata di `origin/main`. I commit riapplicati hanno nuovi identificatori.

```powershell
git switch feature/user-search
```

```powershell
git fetch origin
```

```powershell
git rebase origin/main
```

## Continuare o annullare rebase

Dopo aver risolto il conflitto, prepara il file e usa `--continue`; `--abort` è l’alternativa per tornare allo stato di partenza.

```powershell
git add path/to/resolved-file
```

```powershell
git rebase --continue
```

```powershell
git rebase --abort
```

Non riscrivere con rebase una cronologia condivisa senza coordinamento.

## Confrontare branch

`log A..B` elenca i commit raggiungibili da B ma non da A; `diff A...B` mostra le modifiche dalla base comune a B. Il secondo confronto è direzionale.

```powershell
git log --oneline main..feature/user-search
```

```powershell
git diff main...feature/user-search
```

## Fonti

- [Git: merge e interruzione in caso di conflitto](https://git-scm.com/docs/git-merge)
- [Git: riapplicare i commit con rebase](https://git-scm.com/docs/git-rebase)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Branching strategy su GitHub|Branching strategy su GitHub]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub|Merge squash e rebase su GitHub]]
- [[Programmazione/GitHub/Pagine/Troubleshooting merge conflict|Troubleshooting merge conflict]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
