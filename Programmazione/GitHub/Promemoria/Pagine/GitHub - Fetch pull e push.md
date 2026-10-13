---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - git
  - github
  - promemoria
  - fetch
  - pull
  - push
aliases:
  - Cheatsheet sincronizzazione Git
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Remote origin e upstream]]"
title: GitHub - Fetch, pull e push
---

# GitHub - Fetch, pull e push

## Scaricare riferimenti

```powershell
git fetch origin
```

```powershell
git fetch --all --prune
```

`fetch` aggiorna i riferimenti remoti senza modificare il branch corrente.

## Vedere commit in arrivo

```powershell
git log HEAD..origin/main --oneline
```

## Pull con fast-forward

```powershell
git pull --ff-only
```

## Pull con rebase

```powershell
git pull --rebase
```

## Pubblicare un nuovo branch

```powershell
git push --set-upstream origin feature/user-search
```

## Push successivi

```powershell
git push
```

## Push dopo rebase

```powershell
git push --force-with-lease
```

Preferire `--force-with-lease` a `--force`.

## Aggiornare un fork

```powershell
git fetch upstream
```

```powershell
git switch main
```

```powershell
git merge --ff-only upstream/main
```

```powershell
git push origin main
```

## Pruning locale

```powershell
git remote prune origin
```

## Approfondimento

- [[Programmazione/GitHub/Pagine/Remote origin e upstream|Remote origin e upstream]]
- [[Programmazione/GitHub/Pagine/Clone fork e template repository|Clone fork e template repository]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Troubleshooting merge conflict|Troubleshooting merge conflict]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
