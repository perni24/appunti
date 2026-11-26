---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - promemoria
  - issue
  - label
  - projects
aliases:
  - Cheatsheet issue GitHub
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Projects]]"
title: GitHub - Issue, label e progetti
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

Le label devono già esistere nel repository; sostituisci `123` e `username` con l’issue e l’assegnatario reali.

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

Nel corpo di una PR diretta al branch predefinito, questa parola chiave chiude l’issue dello stesso repository **al merge**, non all’apertura. Per un altro repository usa `Closes owner/repository#123`.

```text
Closes #123
```

## Aggiungere un’issue a un Project

Il numero del **Project** e quello dell’**issue** sono distinti. Con `gh` autenticato, individua il progetto del proprietario; `@me` indica il tuo account, per un’organizzazione usa il suo nome.

```powershell
gh project list --owner "@me"
```

Aggiungi l’issue tramite il suo URL al Project numero `7`. Servono accesso in scrittura al progetto e credenziali abilitate a Projects (per il login OAuth di `gh`, scope `project`). L’issue resta nel suo repository.

```powershell
gh project item-add 7 --owner "@me" --url "https://github.com/owner/repository/issues/123"
```

## Ricerca utile

```text
is:issue is:open label:bug assignee:@me
```

```text
is:pr is:open review-requested:@me
```

## Fonti

- [GitHub Docs: collegare PR e issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
- [GitHub CLI: accesso ai Projects](https://cli.github.com/manual/gh_project)
- [GitHub CLI: aggiungere un elemento a un progetto](https://cli.github.com/manual/gh_project_item-add)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]
- [[Programmazione/GitHub/Pagine/Labels milestones e assignees|Labels milestones e assignees]]
- [[Programmazione/GitHub/Pagine/GitHub Projects|GitHub Projects]]
- [[Programmazione/GitHub/Pagine/Issue templates e pull request templates|Issue templates e pull request templates]]
- [[Programmazione/GitHub/Pagine/Automazioni issue e pull request|Automazioni issue e pull request]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
