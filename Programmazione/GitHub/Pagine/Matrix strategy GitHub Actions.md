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
  - matrix
  - ci
aliases:
  - Matrix strategy GitHub Actions
  - Matrix GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Jobs steps e runners]]"
  - "[[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]"
title: Matrix strategy GitHub Actions
---

# Matrix strategy GitHub Actions

## Sintesi

Una **matrix** ripete lo stesso job con input diversi. È utile per controllare una promessa di compatibilità, per esempio «i test del formato passano sia su Windows sia su Linux». Ogni variante ha il proprio runner, checkout ed esito. Una combinazione mai eseguita non è coperta.

## Esempio pratico: contare i job prima di lanciarli

Frammento `jobs` di un workflow di CI con `permissions: { contents: read }`. Le versioni sono quelle **scelte per l’esempio**, non una dichiarazione di supporto del vault. I valori della matrix devono arrivare davvero a `runs-on` e `setup-node`, altrimenti si ripete la stessa prova con etichette diverse.

```yaml
jobs:
  compatibilita:
    name: Note su ${{ matrix.os }} con Node ${{ matrix.node }}
    strategy:
      fail-fast: false
      max-parallel: 2
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: ['22', '24']
        exclude:
          - os: windows-latest
            node: '22'
        include:
          - os: macos-latest
            node: '24'
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: ${{ matrix.node }}
          cache: npm
          cache-dependency-path: site/package-lock.json
      - run: npm ci
        working-directory: site
      - run: npm run content:test
        working-directory: site
```

**Risultato atteso: quattro job.** Il prodotto iniziale è 2 × 2. Si toglie Windows/22 e si aggiunge macOS/24: restano Ubuntu/22, Ubuntu/24, Windows/24 e macOS/24. `max-parallel: 2` limita a due i job contemporanei, non riduce le quattro varianti.

## Come interpretare un fallimento

Con `fail-fast: false` le altre varianti possono finire anche se una fallisce; il fallimento resta visibile. Con il valore predefinito `true` un fallimento non tollerato può annullare varianti già in esecuzione o in coda. `continue-on-error` è una scelta diversa: tollera l’errore del job interessato. Usalo solo per varianti dichiaratamente sperimentali.

`include` non significa sempre «aggiungi un job»: può anche completare combinazioni esistenti con un campo aggiuntivo. Per una lista esatta di coppie usa una matrix con il solo `include`. Se l’elenco dipende dai package modificati, un job precedente può produrre JSON da leggere con `fromJSON`; conserva una matrix statica quando il supporto è noto.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Jobs steps e runners|Jobs steps e runners]]
- [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]

## Fonti

- [GitHub Docs - Matrix, include, exclude e limiti di concorrenza](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations)
- [GitHub Docs - Sintassi di strategy e continue-on-error](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [actions/setup-node - Input per la versione di Node](https://github.com/actions/setup-node/tree/v6)
