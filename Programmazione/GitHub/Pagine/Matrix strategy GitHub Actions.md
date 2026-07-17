---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-actions, matrix, ci]
aliases: [Matrix strategy GitHub Actions, Matrix GitHub Actions]
prerequisites: [Jobs steps e runners, Pipeline CI GitHub Actions]
related: [Workflow per test, lint e build]
---

# Matrix strategy GitHub Actions

## Sintesi

La **matrix strategy** permette di eseguire lo stesso job con piu combinazioni di variabili, per esempio versioni di linguaggio, sistemi operativi o configurazioni.

E utile per scoprire problemi di compatibilita senza duplicare YAML.

## Quando usarlo

Usala quando:

- supporti piu versioni di runtime;
- vuoi testare Linux, Windows e macOS;
- hai piu versioni di database;
- vuoi verificare combinazioni di feature;
- mantieni una libreria pubblica;
- vuoi copertura ampia ma configurazione compatta.

## Come funziona

Nel job definisci `strategy.matrix`. GitHub Actions crea un job per ogni combinazione dei valori.

Esempio: 2 sistemi operativi x 3 versioni Node = 6 job.

Puoi anche usare:

- `include`;
- `exclude`;
- `fail-fast`;
- `max-parallel`;
- output generati dinamicamente.

## API / Sintassi

Matrix base:

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: [20, 22]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

## Esempio pratico

Escludere una combinazione:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    node-version: [18, 20, 22]
    exclude:
      - os: windows-latest
        node-version: 18
```

## Varianti

- **Matrix per runtime**: Node, Python, Rust, Java.
- **Matrix per OS**: Linux, Windows, macOS.
- **Matrix con include**: aggiunge combinazioni speciali.
- **Matrix con exclude**: rimuove combinazioni inutili.
- **Matrix dinamica**: generata da output di un job precedente.
- **Max parallel**: limita concorrenza.

## Errori comuni

- Creare troppe combinazioni e rendere la CI lenta.
- Testare versioni non supportate realmente.
- Non distinguere compatibilita critica da compatibilita opzionale.
- Dimenticare che ogni combinazione consuma tempo e minuti.
- Rendere required ogni combinazione instabile.
- Non leggere quale variante ha fallito.

## Checklist

- Le combinazioni sono davvero necessarie?
- La matrix riflette il supporto dichiarato?
- I job hanno nomi leggibili?
- `fail-fast` e configurato consapevolmente?
- Le combinazioni lente sono giustificate?
- La CI resta usabile sulle pull request?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Jobs steps e runners]]
- [[Pipeline CI GitHub Actions]]
- [[Workflow per test, lint e build]]

## Fonti

- [GitHub Docs - Running variations of jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations)
