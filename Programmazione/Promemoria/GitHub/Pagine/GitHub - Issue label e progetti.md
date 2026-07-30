---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [github, promemoria, issue, label, projects]
aliases: [Cheatsheet issue GitHub]
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Projects]]"
---

# GitHub - Issue, label e progetti

## Elencare issue

```powershell
gh issue list
```

```powershell
gh issue list --label bug --assignee "@me"
```

```powershell
gh issue list --state all --search "is:issue sort:updated-desc"
```

## Creare

```powershell
gh issue create --title "Titolo" --body "Descrizione"
```

```powershell
gh issue create --label bug --assignee "@me"
```

## Visualizzare

```powershell
gh issue view 123
```

```powershell
gh issue view 123 --web
```

## Modificare

```powershell
gh issue edit 123 --add-label priority:high
```

```powershell
gh issue edit 123 --add-assignee username
```

## Commentare e chiudere

```powershell
gh issue comment 123 --body "Correzione disponibile nella PR #456"
```

```powershell
gh issue close 123 --reason completed
```

```powershell
gh issue reopen 123
```

## Label

```powershell
gh label list
```

```powershell
gh label create "priority:high" --color B60205
```

## Collegare una PR

Nel corpo della pull request:

```text
Closes #123
```

## Ricerca utile

```text
is:issue is:open label:bug assignee:@me
```

```text
is:pr is:open review-requested:@me
```

## Approfondimento

- [[Programmazione/GitHub/Pagine/Issues GitHub]]
- [[Programmazione/GitHub/Pagine/Labels milestones e assignees]]
- [[Programmazione/GitHub/Pagine/GitHub Projects]]
- [[Programmazione/GitHub/Pagine/Issue templates e pull request templates]]
- [[Programmazione/GitHub/Pagine/Automazioni issue e pull request]]
