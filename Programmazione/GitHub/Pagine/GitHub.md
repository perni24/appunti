---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [github, git, repository, collaborazione]
aliases: [GitHub]
prerequisites: []
related: [Git e GitHub, Repository GitHub]
---

# GitHub

## Sintesi

**GitHub** e una piattaforma per ospitare repository Git, collaborare sul codice, revisionare modifiche, automatizzare controlli e pubblicare software. Non sostituisce Git: aggiunge un livello web e collaborativo sopra Git.

Per padroneggiarlo bisogna distinguere tre piani:

- **versionamento**: commit, branch, tag e history Git;
- **collaborazione**: issue, pull request, review e permessi;
- **automazione**: CI/CD, sicurezza, release e workflow con GitHub Actions.

## Quando usarlo

Usa GitHub quando:

- vuoi mantenere codice versionato in un repository remoto;
- devi collaborare con altre persone;
- vuoi discutere modifiche prima di unirle al ramo principale;
- vuoi automatizzare test, lint, build, release o deploy;
- vuoi rendere un progetto documentato, tracciabile e riutilizzabile.

## Come funziona

Un repository GitHub contiene un repository Git e metadati gestiti dalla piattaforma:

- issue;
- pull request;
- review;
- permessi;
- impostazioni di sicurezza;
- workflow di automazione;
- release;
- wiki o documentazione;
- progetti e discussioni.

Il flusso tipico e:

1. si crea o clona un repository;
2. si lavora su un branch;
3. si fanno commit locali;
4. si inviano le modifiche con `push`;
5. si apre una pull request;
6. si eseguono controlli automatici;
7. si fa review;
8. si esegue merge.

## API / Sintassi

Comandi Git tipici usati con GitHub:

```bash
git clone https://github.com/owner/repository.git
git status
git switch -c feature/nome-feature
git add .
git commit -m "Aggiunge nuova feature"
git push -u origin feature/nome-feature
```

GitHub CLI:

```bash
gh repo view
gh issue list
gh pr create
gh pr status
```

## Esempio pratico

Scenario: vuoi proporre una modifica a un progetto.

```bash
git clone https://github.com/owner/progetto.git
cd progetto
git switch -c fix/correzione-bug

# modifica i file
git add .
git commit -m "Corregge validazione input"
git push -u origin fix/correzione-bug
```

Poi apri una pull request su GitHub e aspetti review e controlli automatici.

## Varianti

- **Repository personale**: usato per progetti propri.
- **Repository di organizzazione**: usato da team, aziende o community.
- **Repository pubblico**: visibile a tutti.
- **Repository privato**: visibile solo a utenti autorizzati.
- **Fork**: copia collegata a un progetto sorgente.
- **Template repository**: base riutilizzabile per creare nuovi repository.

## Errori comuni

- Confondere GitHub con Git.
- Lavorare direttamente su `main` senza branch.
- Fare push di segreti, token o credenziali.
- Non usare pull request per modifiche rilevanti.
- Non proteggere branch importanti.
- Usare issue e pull request senza titolo e descrizione chiari.

## Checklist

- Il repository ha un `README` utile?
- Esiste una licenza se il progetto e pubblico?
- I branch principali sono protetti?
- I segreti sono fuori dal repository?
- Le pull request hanno controlli automatici?
- Le issue hanno label e priorita comprensibili?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Git e GitHub]]
- [[Repository GitHub]]
- Pull request

## Fonti

- [GitHub Docs - About GitHub and Git](https://docs.github.com/en/get-started/start-your-journey/about-github-and-git)
