---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [git, github, promemoria, branch, merge, rebase]
aliases: [Cheatsheet branch Git]
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub]]"
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

```powershell
git branch -d feature/completed
```

```powershell
git push origin --delete feature/completed
```

## Merge

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

```powershell
git log main..feature --oneline
```

```powershell
git diff main...feature
```

## Approfondimento

- [[Programmazione/GitHub/Pagine/Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Branching strategy su GitHub]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub]]
- [[Programmazione/GitHub/Pagine/Troubleshooting merge conflict]]
