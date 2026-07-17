---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [github, github-actions, composite-actions, automation]
aliases: [Composite actions, Composite action GitHub Actions]
prerequisites: [GitHub Actions, Actions marketplace, Sintassi YAML GitHub Actions]
related: [Reusable workflows, Actions marketplace, Permissions GitHub Actions]
---

# Composite actions

## Sintesi

Le **composite actions** sono action personalizzate che raggruppano piu step in una singola action. Sono utili quando vuoi riusare una sequenza tecnica dentro piu workflow senza creare un intero workflow riutilizzabile.

La differenza pratica e questa: una composite action riusa step; un reusable workflow riusa job o workflow completi.

## Quando usarlo

Usale quando:

- ripeti gli stessi step in molti workflow;
- vuoi incapsulare setup, lint, build o validazioni;
- vuoi distribuire una piccola automazione interna;
- vuoi evitare script lunghi direttamente nel workflow;
- vuoi creare una action locale dentro `.github/actions`;
- vuoi pubblicare una action riusabile in piu repository.

## Come funziona

Una composite action ha un file `action.yml` o `action.yaml` che descrive:

- nome e descrizione;
- input;
- output;
- step eseguiti;
- shell usata dagli step `run`.

La action puo vivere:

- nello stesso repository, per uso locale;
- in un repository separato, per uso condiviso;
- in una cartella come `.github/actions/nome-action`.

## API / Sintassi

File `.github/actions/setup-project/action.yml`:

```yaml
name: Setup project
description: Prepara dipendenze e cache del progetto

runs:
  using: composite
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: "22"
    - run: npm ci
      shell: bash
```

Uso nel workflow:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: ./.github/actions/setup-project
```

## Esempio pratico

Se ogni workflow ripete:

```yaml
- uses: actions/setup-node@v4
- run: npm ci
- run: npm run lint
```

puoi creare una composite action `project-checks` e richiamarla da CI, release e deploy. Il workflow diventa piu leggibile e la logica ripetuta rimane in un solo posto.

## Varianti

- **Composite action locale**: vive nello stesso repository.
- **Composite action pubblica**: vive in un repository dedicato.
- **Composite action interna**: usata solo da un'organizzazione.
- **JavaScript action**: piu adatta quando serve logica complessa in Node.js.
- **Docker action**: utile quando serve un ambiente containerizzato.

## Errori comuni

- Usare una composite action per orchestrare interi job.
- Nascondere troppa logica rendendo i log difficili da capire.
- Non dichiarare `shell` negli step `run`.
- Eseguire input non fidato senza validazione.
- Usare action esterne senza pinning a tag o SHA.
- Confondere composite action e reusable workflow.

## Checklist

- Gli step raggruppati sono davvero ripetuti?
- Il nome della action descrive il risultato?
- Gli input sono documentati?
- Gli output servono davvero?
- La action e versionata se usata da altri repository?
- I log restano leggibili?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Actions marketplace]]
- [[Reusable workflows]]
- [[Workflow GitHub Actions]]

## Fonti

- [GitHub Docs - Creating a composite action](https://docs.github.com/en/actions/tutorials/create-actions/create-a-composite-action)
