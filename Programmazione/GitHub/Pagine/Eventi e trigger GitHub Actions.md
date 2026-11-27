---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-actions
  - events
  - triggers
aliases:
  - Eventi e trigger GitHub Actions
  - Trigger GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions]]"
title: Eventi e trigger GitHub Actions
---

# Eventi e trigger GitHub Actions

## Sintesi

`on` seleziona gli eventi che possono creare un **run**. Prima di aggiungere un filtro decidi quale domanda deve ricevere risposta: «Questa PR è valida?» richiede `pull_request`; «Il contenuto arrivato su `main` va pubblicato?» richiede `push` su quel branch. Le due domande possono riguardare lo stesso commit, ma non sono lo stesso evento.

## Esempio pratico: leggere i filtri

Questa è solo la sezione `on` di un workflow didattico, non la configurazione attiva di Quartz:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    paths:
      - 'Programmazione/**'
      - 'site/**'
  workflow_dispatch:
```

| Cosa succede | Si avvia? | Motivo |
| --- | --- | --- |
| Push su `main` che cambia solo `Home.md` | Sì | Il filtro per percorso appartiene a `pull_request`, non a `push`. |
| Apertura di una PR da `docs` verso `main` con una nota in `Programmazione/` | Sì | Per `pull_request`, `branches` indica il branch **di destinazione**. |
| Aggiornamento della stessa PR con un diff complessivo che cambia solo `Home.md` | No | Il branch corrisponde ma nessun file modificato corrisponde ai percorsi. |
| Push su `docs` senza PR aperta | No | Non corrisponde al push su `main` e non genera un evento di PR. |

Eventi diversi sono alternative; **branch e percorsi dello stesso evento** devono invece corrispondere entrambi. Senza `types`, `pull_request` risponde normalmente ad apertura, riapertura e aggiornamento del branch della PR. Se un check è obbligatorio per il merge, saltare l’intero workflow tramite filtri può lasciarlo in attesa: decidi prima quali PR devono sempre ricevere un esito.

## Altri trigger: scegli in base all’effetto

- **Manuale:** `workflow_dispatch` permette di scegliere un riferimento da eseguire. Per essere avviabile in questo modo, il workflow deve esistere sul branch predefinito.
- **Periodico:** `schedule` usa il branch predefinito; per esempio `17 6 * * 1` significa lunedì alle 06:17 UTC se non si specifica un fuso. È una pianificazione, non una garanzia al minuto.
- **Tag o release:** `push.tags: ['v*']` reagisce al push del riferimento Git; `release` con `types: [published]` alla pubblicazione di una release GitHub. Creare un tag non equivale a pubblicare una release.
- **Altri workflow:** `workflow_call` espone un workflow riutilizzabile chiamato esplicitamente; `workflow_run` reagisce al ciclo di vita di un altro workflow.

## Errori comuni

Un push sul branch di una PR può soddisfare sia `push` sia `pull_request` se entrambi sono abilitati senza filtri. Controlla l’evento di ciascun run prima di concludere che la CI sia duplicata. Nelle PR da fork mantieni separata la verifica del codice dalla pubblicazione: non passare a `pull_request_target` soltanto per rendere disponibili dei secret.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions|Sintassi YAML GitHub Actions]]

## Fonti

- [GitHub Docs - Eventi e tipi di attività](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [GitHub Docs - Filtri per branch, tag e percorsi](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub Docs - Avviare un workflow manualmente](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
