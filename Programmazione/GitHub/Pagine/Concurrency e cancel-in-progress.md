---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [github, github-actions, concurrency, ci-cd]
aliases: [Concurrency e cancel-in-progress, Concurrency GitHub Actions]
prerequisites: [GitHub Actions, Workflow GitHub Actions]
related: [Deploy con GitHub Actions, Workflow GitHub Actions, Debug GitHub Actions]
---

# Concurrency e cancel-in-progress

## Sintesi

`concurrency` controlla quante esecuzioni dello stesso workflow o job possono procedere in parallelo. `cancel-in-progress` permette di annullare run precedenti quando arriva una run piu recente nello stesso gruppo.

Serve a evitare sprechi, deploy sovrapposti e risultati obsoleti.

## Quando usarlo

Usalo quando:

- una nuova push rende inutile la CI precedente;
- vuoi evitare piu deploy sullo stesso ambiente;
- vuoi serializzare release o migrazioni;
- vuoi proteggere staging o produzione;
- vuoi ridurre consumo di minuti;
- vuoi evitare race condition tra workflow.

## Come funziona

Definisci un gruppo di concorrenza con `concurrency.group`. Tutte le run nello stesso gruppo vengono coordinate.

Con:

```yaml
cancel-in-progress: true
```

GitHub annulla la run precedente ancora in esecuzione quando parte una nuova run nello stesso gruppo.

Il gruppo puo essere statico o basato su espressioni come `github.ref`, `github.workflow` o `github.head_ref`.

## API / Sintassi

Annullare CI obsolete sullo stesso branch:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Serializzare deploy di produzione:

```yaml
concurrency:
  group: production-deploy
```

## Esempio pratico

Per una pull request, ogni push sostituisce la precedente:

```yaml
name: Pull request CI

on:
  pull_request:

concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

Questo evita di sprecare tempo su commit ormai superati.

## Varianti

- **Concurrency a livello workflow**: controlla l'intera run.
- **Concurrency a livello job**: controlla solo un job specifico.
- **Gruppo per branch**: usa `github.ref`.
- **Gruppo per workflow e branch**: evita collisioni tra workflow diversi.
- **Deploy serializzato**: usa un gruppo fisso per ambiente.

## Errori comuni

- Usare un gruppo troppo generico e cancellare workflow non correlati.
- Usare `cancel-in-progress` sui deploy di produzione senza pensarci.
- Dimenticare `github.workflow` nel nome del gruppo.
- Costruire gruppi con contesti non sempre disponibili.
- Non distinguere comportamento CI e comportamento deploy.

## Checklist

- Il gruppo identifica davvero la risorsa condivisa?
- Le CI obsolete vanno cancellate?
- I deploy vanno cancellati o messi in coda?
- Il gruppo evita collisioni con altri workflow?
- Le espressioni usate sono disponibili per tutti gli eventi?
- I log rendono chiaro cosa e stato cancellato?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Deploy con GitHub Actions]]
- [[Debug GitHub Actions]]

## Fonti

- [GitHub Docs - Control workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
