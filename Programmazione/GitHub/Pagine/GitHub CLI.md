---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, cli, gh, automazione]
aliases: [GitHub CLI, gh]
prerequisites: [GitHub, Git e GitHub]
related: [Pull request, Issues GitHub]
---

# GitHub CLI

## Sintesi

**GitHub CLI** e lo strumento da terminale `gh` per interagire con GitHub. Permette di gestire repository, issue, pull request, release, workflow e autenticazione senza passare sempre dalla Web UI.

E utile per velocizzare operazioni frequenti e per integrare GitHub in script locali.

## Quando usarlo

Usa GitHub CLI quando:

- lavori spesso da terminale;
- vuoi creare pull request senza aprire il browser;
- devi consultare issue o PR velocemente;
- vuoi controllare status check;
- vuoi clonare repository in modo rapido;
- vuoi automatizzare operazioni ripetibili.

## Come funziona

`gh` usa l'account GitHub autenticato e dialoga con API GitHub. Lavora bene dentro repository Git locali per capire automaticamente owner, repository, branch e pull request corrente.

Le aree principali sono:

- `gh auth`: autenticazione;
- `gh repo`: repository;
- `gh issue`: issue;
- `gh pr`: pull request;
- `gh run`: workflow run;
- `gh release`: release.

## API / Sintassi

Autenticazione:

```bash
gh auth login
gh auth status
```

Repository:

```bash
gh repo view
gh repo clone owner/repository
gh repo create nome-repository
```

Pull request:

```bash
gh pr create
gh pr status
gh pr checks
gh pr checkout 123
```

Issue:

```bash
gh issue list
gh issue create
gh issue view 12
```

## Esempio pratico

Creare una pull request dal branch corrente:

```bash
git switch -c feature/export-csv
git add .
git commit -m "Aggiunge export CSV"
git push -u origin feature/export-csv
gh pr create --base main --fill
```

`--fill` usa dati dei commit per precompilare titolo e descrizione. Conviene comunque controllare e migliorare il testo.

## Varianti

- **Uso interattivo**: `gh pr create` guida tramite prompt.
- **Uso scriptabile**: flag espliciti per automazioni.
- **Uso con editor**: apre testo di PR o issue nell'editor configurato.
- **Uso con API**: `gh api` permette chiamate dirette alle API GitHub.
- **Uso in CI**: possibile, ma richiede token e permessi corretti.

## Errori comuni

- Usare `gh` senza controllare quale account e autenticato.
- Creare PR con descrizioni generate automaticamente ma poco chiare.
- Confondere `gh` con `git`: uno parla con GitHub, l'altro gestisce Git.
- Usare token troppo permissivi per automazioni.
- Eseguire comandi nel repository locale sbagliato.

## Checklist

- `gh auth status` mostra l'account corretto?
- Sei nella cartella del repository giusto?
- Il branch corrente e quello della modifica?
- La PR ha base e head corretti?
- I comandi scriptati usano permessi minimi?
- Hai verificato l'output prima di procedere?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub]]
- [[Git e GitHub]]
- [[Pull request]]
- [[Issues GitHub]]

## Fonti

- [GitHub CLI Manual](https://cli.github.com/manual/)
