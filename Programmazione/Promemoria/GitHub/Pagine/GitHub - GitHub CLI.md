---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [github, promemoria, gh, cli]
aliases: [Cheatsheet GitHub CLI]
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/GitHub CLI]]"
---

# GitHub - GitHub CLI

## Autenticazione

```powershell
gh auth login
```

```powershell
gh auth status
```

```powershell
gh auth logout
```

## Repository

```powershell
gh repo clone owner/repository
```

```powershell
gh repo view --web
```

```powershell
gh repo create repository --private --source . --push
```

```powershell
gh repo fork owner/repository --clone
```

```powershell
gh repo sync
```

## Stato

```powershell
gh status
```

## Workflow

```powershell
gh workflow list
```

```powershell
gh workflow run ci.yml
```

```powershell
gh run list
```

```powershell
gh run view run-id
```

```powershell
gh run watch run-id
```

```powershell
gh run rerun run-id --failed
```

## Release

```powershell
gh release list
```

```powershell
gh release view v1.0.0
```

## API REST

```powershell
gh api repos/{owner}/{repo}
```

```powershell
gh api repos/{owner}/{repo}/pulls --paginate
```

## JSON e jq

```powershell
gh pr list --json number,title,author
```

```powershell
gh pr list --json number,title --jq '.[] | [.number, .title]'
```

## Repository esplicito

```powershell
gh issue list --repo owner/repository
```

## Approfondimento

- [[Programmazione/GitHub/Pagine/GitHub CLI]]
- [[Programmazione/GitHub/Pagine/GitHub REST API]]
- [[Programmazione/GitHub/Pagine/GitHub GraphQL API]]
- [[Programmazione/GitHub/Pagine/GitHub Web UI]]
