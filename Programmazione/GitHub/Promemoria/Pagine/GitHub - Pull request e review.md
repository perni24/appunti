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
  - pull-request
  - review
aliases:
  - Cheatsheet pull request GitHub
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Review code su GitHub]]"
title: GitHub - Pull request e review
---

# GitHub - Pull request e review

## Creare una pull request

Con `gh` autenticato nel repository giusto, scegli **uno** dei due esempi. `--fill` ricava titolo e descrizione dai commit; `--base` è il branch di destinazione, `--head` quello delle modifiche. Nel secondo esempio il branch sorgente deve essere già pubblicato.

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

Cambia il branch del clone, non lo stato della PR. Controlla prima di non avere lavoro locale da preservare.

```powershell
gh pr checkout 123
```

## Controlli

Il primo comando fotografa i check; `--watch` ne segue l’esito. Per vedere solo quelli richiesti dalla protezione del branch aggiungi `--required`: i check verdi non sostituiscono le approvazioni richieste.

```powershell
gh pr checks 123
```

```powershell
gh pr checks 123 --watch
```

## Review

Scegli un solo esito. Un commento non approva la PR; non puoi approvare la tua PR.

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

Alternative, da usare solo quando vuoi integrare la PR. `--squash` concentra il lavoro in un commit, `--rebase` riapplica i commit separatamente; `--delete-branch` richiede anche la rimozione del branch sorgente locale e remoto. Se vuoi conservarlo, ometti il flag. Con una merge queue obbligatoria lascia che sia la coda a gestire l’integrazione.

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

## Fonti

- [GitHub CLI: creare una PR](https://cli.github.com/manual/gh_pr_create)
- [GitHub CLI: consultare i check](https://cli.github.com/manual/gh_pr_checks)
- [GitHub CLI: merge, coda ed eliminazione del branch](https://cli.github.com/manual/gh_pr_merge)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Aprire una pull request corretta|Aprire una pull request corretta]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]
- [[Programmazione/GitHub/Pagine/Checklist pull request GitHub|Checklist pull request GitHub]]
- [[Programmazione/GitHub/Pagine/Troubleshooting pull request|Troubleshooting pull request]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub|Merge squash e rebase su GitHub]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
