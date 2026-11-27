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
  - release
  - automation
aliases:
  - Release automation GitHub Actions
  - Automazione release GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Protected tags]]"
related:
  - "[[Programmazione/GitHub/Pagine/Artifacts GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Protected tags]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Packages con Actions]]"
title: Release automation GitHub Actions
---

# Release automation GitHub Actions

## Sintesi

Un **tag Git** identifica una revisione; una **release GitHub** aggiunge a un tag note, stato di pubblicazione ed eventuali asset scaricabili. Un artifact di Actions resta invece legato a un run e alla sua conservazione. Creare un tag non carica un binario; pubblicare una release non aggiorna automaticamente Pages o un registry.

## Esempio pratico: preparare una bozza dal tag già esistente

Esempio per un repository dimostrativo con un `README.md` tracciato. Un push di tag `v*` prepara uno ZIP contenente **solo** quel README e crea una **draft release**. Non è un workflow attivo del vault. Richiede Git, la CLI `gh` del runner Ubuntu e l’autorizzazione a creare release; su GitHub il comando finale **scrive davvero una bozza**. In un progetto reale, fai dipendere la pubblicazione dal job che ha testato e prodotto gli asset della stessa revisione.

```yaml
name: Prepara bozza di release
on:
  push:
    tags: ['v*']
permissions: {}
jobs:
  bozza:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - name: Archivia il README del commit selezionato
        run: git archive --format=zip --output=guida.zip HEAD -- README.md
      - name: Crea la bozza con l'asset
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAG: ${{ github.ref_name }}
        run: gh release create "$TAG" guida.zip --verify-tag --draft --generate-notes
```

`git archive` legge l’albero del commit, non modifiche locali o file non tracciati. `--verify-tag` impedisce alla CLI di creare implicitamente un tag remoto se manca. `--generate-notes` prepara le note della release; non verifica la qualità dell’asset. `--draft` lascia una bozza da controllare prima della pubblicazione; `--prerelease` indica invece una versione non stabile, non una bozza.

## Prima di pubblicare

- `v*` è un filtro per prefisso, non una validazione SemVer né una protezione. Limita chi può creare o modificare i tag di rilascio e verifica il commit puntato.
- Per binari o documentazione generata, riusa i file effettivamente testati. Non archiviare l’intero vault al posto del sito filtrato: anche note escluse dalla pubblicazione potrebbero finire nello ZIP.
- Se rilanci lo stesso run, una release per il tag può esistere già. Controllane stato e asset prima di riprovare; non sostituire in silenzio un file già distribuito. Checksum e attestazione possono documentare integrità e provenienza, non sostituiscono i test.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Artifacts GitHub Actions|Artifacts GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Protected tags|Protected tags]]
- [[Programmazione/GitHub/Pagine/GitHub Packages con Actions|GitHub Packages con Actions]]
- [[Programmazione/GitHub/Pagine/SBOM e attestazioni su GitHub|SBOM e attestazioni su GitHub]]

## Fonti

- [GitHub Docs - Relazione tra tag, release e asset](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [GitHub CLI - gh release create](https://cli.github.com/manual/gh_release_create)
- [Git - Contenuto di git archive](https://git-scm.com/docs/git-archive)
