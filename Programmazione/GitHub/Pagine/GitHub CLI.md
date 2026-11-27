---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - cli
  - gh
  - automazione
aliases:
  - GitHub CLI
  - gh
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Git e GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
title: GitHub CLI
---

# GitHub CLI

## Sintesi

`git` gestisce file, staging e commit; **GitHub CLI** (`gh`) ti permette di consultare o modificare risorse ospitate su GitHub, come issue, pull request, run e release. Una PR può essere letta con `gh` anche fuori dal clone se indichi il repository; controllare le modifiche **non committate** sul tuo disco resta un lavoro per Git.

## Prima di agire

Con la CLI installata, consulta l’help anche senza account:

```bash
gh pr view --help
```

Per iniziare una sessione personale usa `gh auth login`. Per verificare quale account è attivo su GitHub.com, senza chiedere di mostrare il token:

```bash
gh auth status --hostname github.com
```

Nel clone la CLI può ricavare il repository dai remoti; fuori dal clone o con più fork è preferibile `--repo OWNER/REPO`. L’account di `gh`, l’autore dei commit e la credenziale usata da `git push` sono tre cose distinte.

## Esempio: controllare una PR senza modificarla

Sostituisci `OWNER/REPO` e `34`. Gli esempi leggono dati dal servizio: non fanno checkout, non eseguono test e non cambiano branch.

Leggi base, head e stato della bozza in un formato utilizzabile anche da uno script:

```bash
gh pr view 34 --repo OWNER/REPO --json number,title,baseRefName,headRefName,isDraft
```

Controlla i check richiesti per il merge:

```bash
gh pr checks 34 --repo OWNER/REPO --required
```

Senza `--required` vedi anche gli altri check. Per `gh pr checks` il codice di uscita `8` indica check in attesa: uno script non dovrebbe registrarlo come «test falliti». Nessun check richiesto non significa che la modifica sia stata testata.

## Scegliere il comando

| Scopo | Lettura | Operazione con effetti |
| --- | --- | --- |
| Repository | `gh repo view` | `gh repo clone` scrive un clone sul disco; `gh repo create` crea un repository su GitHub. |
| Issue e PR | `gh issue list`, `gh issue view 12`, `gh pr status` | `gh issue create` e `gh pr create` pubblicano; `gh pr checkout 34` cambia il clone locale. |
| Run e release | `gh run list`, `gh release list` | Rilanciare un run o creare una release cambia lo stato sul server. |

Per aprire una PR, parti da un branch già pubblicato e verifica base e head. Esempio per due branch nello stesso repository:

```bash
gh pr create --repo OWNER/REPO --base main --head fix/export-vuoto --fill
```

`--fill` ricava titolo e descrizione dai commit: **non** è un’anteprima e non garantisce che il testo spieghi problema e verifiche. Per scrivere la descrizione interattivamente ometti `--fill`. Negli script usa output strutturato, permessi minimi e un token fornito dall’ambiente (per esempio `GH_TOKEN` in CI), mai dal codice o dai log. Per operazioni non coperte dai sottocomandi esiste `gh api`.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub|GitHub]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]

## Fonti

- [GitHub CLI Manual](https://cli.github.com/manual/)
- [GitHub CLI: campi strutturati di una PR](https://cli.github.com/manual/gh_pr_view)
- [GitHub CLI: stato e codici di uscita dei check](https://cli.github.com/manual/gh_pr_checks)
- [GitHub CLI: creare una pull request](https://cli.github.com/manual/gh_pr_create)
- [GitHub CLI: variabili d’ambiente e autenticazione](https://cli.github.com/manual/gh_help_environment)
