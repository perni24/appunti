---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [github, promemoria, pull-request, review]
aliases: [Cheatsheet pull request GitHub]
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Review code su GitHub]]"
---

# GitHub - Pull request e review

## Creare una pull request

```powershell
gh pr create --fill
```

```powershell
gh pr create --base main --head feature/user-search --draft
```

## Elencare e visualizzare

```powershell
gh pr list
```

```powershell
gh pr view 123 --web
```

```powershell
gh pr diff 123
```

## Checkout locale

```powershell
gh pr checkout 123
```

## Controlli

```powershell
gh pr checks 123
```

```powershell
gh pr checks 123 --watch
```

## Review

```powershell
gh pr review 123 --approve
```

```powershell
gh pr review 123 --comment --body "Commento generale"
```

```powershell
gh pr review 123 --request-changes --body "Correggere il caso limite"
```

## Modificare la PR

```powershell
gh pr edit 123 --add-label bug --add-reviewer username
```

```powershell
gh pr ready 123
```

## Merge

```powershell
gh pr merge 123 --squash --delete-branch
```

```powershell
gh pr merge 123 --rebase --delete-branch
```

## Checklist rapida

- Diff limitato allo scopo.
- Test e lint completati.
- Nessun segreto o file generato.
- Descrizione con motivazione e verifica.
- Migrazioni e breaking change segnalati.

## Approfondimento

- [[Programmazione/GitHub/Pagine/Pull request]]
- [[Programmazione/GitHub/Pagine/Aprire una pull request corretta]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub]]
- [[Programmazione/GitHub/Pagine/Checklist pull request GitHub]]
- [[Programmazione/GitHub/Pagine/Troubleshooting pull request]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub]]
