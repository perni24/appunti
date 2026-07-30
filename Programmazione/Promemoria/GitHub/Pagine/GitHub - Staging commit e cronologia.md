---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [git, github, promemoria, commit, staging]
aliases: [Cheatsheet commit Git]
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Conventional commits su GitHub]]"
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

```powershell
git diff
```

```powershell
git diff --staged
```

```powershell
git diff main...feature
```

## Aggiungere allo staging

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

Evitare `--amend` su commit gia condivisi.

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

## Approfondimento

- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Conventional commits su GitHub]]
- [[Programmazione/GitHub/Pagine/Repository hygiene]]
- [[Programmazione/GitHub/Pagine/README LICENSE e gitignore]]
