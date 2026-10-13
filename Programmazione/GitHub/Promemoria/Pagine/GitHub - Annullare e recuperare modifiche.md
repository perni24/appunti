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
  - restore
  - revert
  - reset
  - reflog
aliases:
  - Cheatsheet annullare modifiche Git
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
title: GitHub - Annullare e recuperare modifiche
---

# GitHub - Annullare e recuperare modifiche

## Rimuovere dallo staging

```powershell
git restore --staged path/to/file
```

## Scartare modifiche locali

```powershell
git restore path/to/file
```

Questo elimina le modifiche non salvate nel file.

## Ripristinare da un commit

```powershell
git restore --source commit-sha path/to/file
```

## Revert di un commit condiviso

```powershell
git revert commit-sha
```

```powershell
git revert --no-commit first-sha..last-sha
```

`revert` crea un nuovo commit e non riscrive la cronologia.

## Reset soft

```powershell
git reset --soft HEAD~1
```

Mantiene modifiche e staging.

## Reset mixed

```powershell
git reset HEAD~1
```

Mantiene i file modificati ma svuota lo staging.

## Reset hard

```powershell
git reset --hard commit-sha
```

Elimina le modifiche tracciate non salvate. Verificare sempre stato e SHA prima di usarlo.

## Recuperare con reflog

```powershell
git reflog
```

```powershell
git switch --detach commit-sha
```

```powershell
git branch recovery commit-sha
```

## Recuperare un branch eliminato

```powershell
git reflog
```

```powershell
git branch restored-branch commit-sha
```

## Approfondimento

- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub|Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Troubleshooting merge conflict|Troubleshooting merge conflict]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub|Merge squash e rebase su GitHub]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
