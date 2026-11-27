---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-actions
  - ci
  - procedura
aliases:
  - Configurare una pipeline CI con GitHub Actions
  - Configurare CI GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]"
  - "[[Programmazione/GitHub/Pagine/Cache GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
title: Configurare una pipeline CI con GitHub Actions
---

# Configurare una pipeline CI con GitHub Actions

## Obiettivo

Installare una CI che **segnali prima del merge** un errore nei contenuti o nella trasformazione dei Markdown. In questo esempio si valida il vault: non si pubblicano HTML, non servono credenziali di produzione e non si cambia il workflow Pages esistente.

## Procedura

**1. Riprodurre i controlli in locale.** Dalla radice, con Git, Node e npm compatibili con `site/package.json` (il workflow del vault usa Node 24), installare le dipendenze dal lockfile. `npm ci` ricrea `site/node_modules`: non eseguirlo mentre un'altra build usa quella directory.

```bash
npm --prefix site ci
```

Verificare metadati, collegamenti e raggiungibilità:

```bash
npm --prefix site run content:check
```

Verificare le regole che trasformano le note per il sito:

```bash
npm --prefix site run content:test
```

**2. Creare il file CI.** Per adottare questa configurazione, partire dal workflow completo in [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]] e salvarlo come `.github/workflows/ci.yml` dalla radice. Il job si chiama `Validazione appunti`, usa `contents: read` ed esegue i passi `run` da `site`. Il percorso per la cache di `setup-node` invece è relativo al workspace: `site/package-lock.json`. La cache npm non sostituisce `npm ci`.

**3. Decidere quando validare.** Per controllare le PR dirette a `main`, i push su quel branch e i gruppi di una eventuale merge queue, sostituire soltanto il blocco `on` dell'esempio con questo **frammento**:

```yaml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  merge_group:
```

Il filtro `branches` di `pull_request` riguarda la **base**, non il nome del branch della modifica. Omettere `merge_group` se non si usa una coda. Evitare filtri `paths` a livello di workflow se il check è obbligatorio per tutte le PR.

**4. Provare entrambi gli esiti.** Su un branch di prova aggiungere temporaneamente in una nota pubblica un wikilink a una pagina inesistente: deve fallire `content:check`. Correggere il link e verificare che sull'ultimo commit siano verdi entrambi gli step. Solo allora selezionare il check nella regola di `main` se deve bloccare il merge. Creare il workflow da solo non lo rende obbligatorio.

## Adattare la procedura

- Un progetto applicativo può richiedere anche lint, test e build. Usare i comandi **esistenti nel progetto**: per Python, per esempio, Ruff e pytest con dipendenze fissate; per Rust, rustfmt, Clippy e test con la toolchain prevista.
- Una matrix serve se si supportano davvero più runtime o piattaforme. Conservare report come artifact quando aiutano la diagnosi; un artifact CI non è un deployment.
- Se la verifica deve comprendere il rendering Quartz, aggiungere installazione dei plugin e `site:build` come nel workflow reale. I soli controlli dei Markdown non garantiscono che ogni HTML venga generato.

## Debug rapido

`ENOENT` sul lockfile indica spesso la directory sbagliata. Un job verde senza i controlli attesi può invece essere il job di un altro workflow: confrontare evento, SHA e nomi degli step nella scheda *Actions*.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]
- [[Programmazione/GitHub/Pagine/Cache GitHub Actions|Cache GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Artifacts GitHub Actions|Artifacts GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]

## Fonti

- [GitHub Docs: sintassi dei workflow](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [actions/setup-node: directory e cache](https://github.com/actions/setup-node)
- [GitHub Docs: check richiesti e merge queue](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
