---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, git, branch, workflow]
aliases: [Branch GitHub, Branch su GitHub]
prerequisites: [Git e GitHub, Repository GitHub]
related: [Pull request, Merge squash e rebase su GitHub]
---

# Branch su GitHub

## Sintesi

Un **branch** e una linea di sviluppo separata. Su GitHub i branch servono a isolare modifiche, aprire pull request, eseguire controlli automatici e proteggere il ramo principale del progetto.

Il branch principale di solito si chiama `main`. Le modifiche non banali dovrebbero avvenire su branch dedicati e arrivare su `main` solo dopo review e controlli.

## Quando usarlo

Usa branch separati quando:

- sviluppi una nuova feature;
- correggi un bug;
- prepari una release;
- vuoi aprire una pull request;
- devi sperimentare senza toccare `main`;
- lavori in team e vuoi evitare conflitti diretti.

## Come funziona

Un branch locale puo esistere solo sulla tua macchina. Per farlo comparire su GitHub devi eseguire un push.

Flusso tipico:

1. parti da `main` aggiornato;
2. crei un branch;
3. fai commit;
4. invii il branch a GitHub;
5. apri una pull request;
6. esegui merge dopo review.

## API / Sintassi

Creare e spostarsi su un branch:

```bash
git switch main
git pull
git switch -c feature/nuova-funzione
```

Inviare il branch a GitHub:

```bash
git push -u origin feature/nuova-funzione
```

Eliminare un branch locale:

```bash
git branch -d feature/nuova-funzione
```

Eliminare un branch remoto:

```bash
git push origin --delete feature/nuova-funzione
```

## Esempio pratico

Branch per una correzione:

```bash
git switch main
git pull
git switch -c fix/login-error

# modifica i file
git add .
git commit -m "Corregge errore nel login"
git push -u origin fix/login-error
```

Su GitHub puoi poi aprire una pull request da `fix/login-error` verso `main`.

## Varianti

- **feature branch**: per una nuova funzionalita.
- **fix branch**: per una correzione.
- **release branch**: per stabilizzare una versione.
- **hotfix branch**: per correzioni urgenti.
- **branch protetto**: branch con regole che impediscono merge o push non controllati.

## Errori comuni

- Lavorare direttamente su `main`.
- Creare branch da una base non aggiornata.
- Usare nomi branch vaghi come `test` o `modifiche`.
- Tenere branch aperti per troppo tempo.
- Fare push senza `-u` e poi confondersi sul tracking.
- Dimenticare di eliminare branch gia mergiati.

## Checklist

- Il branch parte da `main` aggiornato?
- Il nome descrive lo scopo?
- Il branch contiene una modifica coerente?
- Hai fatto push verso il remote giusto?
- Esiste una pull request collegata?
- Il branch puo essere eliminato dopo il merge?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Git e GitHub]]
- [[Repository GitHub]]
- [[Pull request]]
- [[Merge squash e rebase su GitHub]]

## Fonti

- [GitHub Docs - About branches](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-branches)
