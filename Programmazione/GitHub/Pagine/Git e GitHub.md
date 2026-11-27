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
  - git
  - versionamento
aliases:
  - Git e GitHub
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Remote origin e upstream]]"
title: Git e GitHub
---

# Git e GitHub

## Sintesi

**Git** registra versioni e confronta storie. **GitHub** è uno dei servizi che possono ospitare un remoto Git e offre anche issue, pull request, review, permessi e automazione. Per capire «perché non vedo la mia modifica su GitHub?» bisogna sapere quale copia stai osservando.

## Tre stati da distinguere

| Stato | Come osservarlo | Cosa non dimostra |
| --- | --- | --- |
| File modificati e staging del clone | `git status --short` | Che esista un commit |
| Commit sul branch locale | `git log -1 --oneline` | Che sia già stato inviato |
| Ultimo stato remoto conosciuto dal clone | `origin/main` dopo un fetch | Che i file sul disco siano stati aggiornati |

`git status`, `git log`, `git branch` e `git switch` lavorano sul clone. `git remote -v` legge gli URL configurati, non verifica la connessione. `git fetch`, `git pull` e `git push` sono anch’essi comandi **Git**, ma scambiano dati con un altro repository: non richiedono che il server sia GitHub. `gh issue list` e `gh pr create` operano invece sul servizio GitHub. Anche una modifica dall’interfaccia web può creare un normale commit Git.

## Esempio: il commit è locale o è stato pubblicato?

Nel clone di un repository con remoto `origin`, posizionati sul branch locale `main`. Se il progetto usa un altro nome, sostituiscilo in entrambi i riferimenti.

Aggiorna ciò che sai del remoto, senza unire né modificare i file del branch corrente:

```bash
git fetch origin
```

Mostra i commit raggiungibili da `main` ma non da `origin/main`:

```bash
git log --oneline origin/main..main
```

Inverti l’intervallo per vedere i commit presenti sul branch del server all’ultimo fetch ma assenti da quello locale:

```bash
git log --oneline main..origin/main
```

Se compare una riga solo nel primo elenco, il branch locale è avanti. Se compaiono righe in entrambi, le storie sono divergenti: ispezionale prima di integrarle. Nessuna riga in entrambi significa che le punte coincidono, **non** che il working tree sia pulito.

## Errori comuni

- `git pull` recupera e integra nel branch corrente. Una **pull request** è una proposta su GitHub: non scarica nulla nel clone del revisore.
- `origin` è un nome locale, non una garanzia che l’URL appartenga all’originale. Può puntare al tuo fork, a un altro servizio o a un repository su disco.
- Un clone, anche mirror, non è un backup completo di issue, discussioni e impostazioni GitHub.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub|GitHub]]
- [[Programmazione/GitHub/Pagine/Remote origin e upstream|Remote origin e upstream]]
- [[Programmazione/GitHub/Pagine/Clone fork e template repository|Clone fork e template repository]]

## Fonti

- [GitHub Docs: Git e GitHub](https://docs.github.com/en/get-started/start-your-journey/what-is-github)
- [Git: quali riferimenti aggiorna fetch](https://git-scm.com/docs/git-fetch)
