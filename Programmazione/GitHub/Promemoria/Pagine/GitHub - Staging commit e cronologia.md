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
  - commit
  - staging
aliases:
  - Cheatsheet commit Git
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Conventional commits su GitHub]]"
title: GitHub - Staging, commit e cronologia
---

# GitHub - Staging, commit e cronologia

## Stato

```powershell
git status
```

```powershell
git status --short
```

## Differenze

`git diff` confronta i file tracciati sul disco con lo staging; `--staged` confronta lo staging con `HEAD`. Se modifichi un file dopo `git add`, può comparire in entrambi i diff: solo la versione nello staging entrerà nel commit.

```powershell
git diff
```

```powershell
git diff --staged
```

```powershell
git diff main...feature/user-search
```

## Aggiungere allo staging

Scegli un file, singoli blocchi (`--patch`) oppure tutte le modifiche sotto la directory corrente (`.`), incluse le rimozioni. Sostituisci i percorsi e i nomi dei branch con i tuoi.

```powershell
git add path/to/file
```

```powershell
git add --patch
```

```powershell
git add .
```

Controllare sempre `git diff --staged` prima del commit.

## Commit

```powershell
git commit -m "Add user validation"
```

```powershell
git commit
```

## Modificare l'ultimo commit

```powershell
git commit --amend
```

```powershell
git commit --amend --no-edit
```

`--amend` sostituisce l’ultimo commit con un nuovo commit che include lo staging attuale; `--no-edit` conserva il messaggio, non il vecchio identificatore. Evitalo su commit già condivisi.

## Cronologia

```powershell
git log --oneline --decorate --graph --all
```

```powershell
git log -- path/to/file
```

```powershell
git show commit-sha
```

## Autore di una riga

```powershell
git blame path/to/file
```

## File ignorati

```powershell
git check-ignore -v path/to/file
```

## Fonti

- [Git: confrontare working tree, indice e commit](https://git-scm.com/docs/git-diff)
- [Git: selezionare le modifiche con add](https://git-scm.com/docs/git-add)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub|Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Conventional commits su GitHub|Conventional commits su GitHub]]
- [[Programmazione/GitHub/Pagine/Repository hygiene|Repository hygiene]]
- [[Programmazione/GitHub/Pagine/README LICENSE e gitignore|README LICENSE e gitignore]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
