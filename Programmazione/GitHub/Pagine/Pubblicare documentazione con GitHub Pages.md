---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-pages, documentazione, procedura]
aliases: [Pubblicare documentazione con GitHub Pages, Deploy documentazione GitHub Pages]
prerequisites: [GitHub Pages con Actions, Repository GitHub]
related: [Deploy con GitHub Actions, Environments GitHub Actions, Workflow GitHub Actions]
---

# Pubblicare documentazione con GitHub Pages

## Obiettivo

Pubblicare documentazione statica con GitHub Pages, scegliendo se usare una branch dedicata, una cartella del repository o un workflow GitHub Actions.

Per documentazione generata da tool moderni e preferibile usare GitHub Actions, perche build e pubblicazione restano esplicite e ripetibili.

## Quando usarlo

Usalo quando:

- vuoi pubblicare documentazione tecnica;
- vuoi esporre un sito statico;
- usi generatori come Quartz, VitePress, MkDocs, Docusaurus o Astro;
- vuoi collegare documentazione al repository;
- vuoi aggiornare il sito a ogni push.

## Procedura

1. Verifica che il repository possa usare GitHub Pages.
2. Decidi la sorgente: branch/cartella o GitHub Actions.
3. Prepara il comando di build della documentazione.
4. Crea il workflow di deploy.
5. Imposta permessi `contents: read`, `pages: write`, `id-token: write`.
6. Carica l'artifact Pages.
7. Esegui il deploy.
8. Controlla l'URL pubblicato.
9. Se usi dominio custom, configura DNS e impostazioni Pages.

## Snippet

Workflow base con GitHub Actions:

```yaml
name: Deploy docs

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Adattamenti comuni

- **Sito statico gia pronto**: pubblica direttamente la cartella generata.
- **MkDocs**: il path di output tipico e `site`.
- **Vite/Astro**: il path di output tipico e `dist`.
- **Quartz**: usa il comando build previsto dal progetto.
- **Dominio custom**: aggiungi `CNAME` e configura DNS.
- **Repository privato**: verifica disponibilita Pages per il piano usato.

## Debug rapido

- Se il sito e 404, controlla branch, source e artifact pubblicato.
- Se il deploy fallisce per permessi, controlla `pages: write` e `id-token: write`.
- Se l'output e vuoto, verifica il path `dist` o equivalente.
- Se CSS e asset non caricano, controlla base URL del generatore.
- Se il dominio custom non funziona, controlla DNS e file `CNAME`.

## Checklist finale

- Build documentazione funzionante.
- Path di output corretto.
- Pages abilitato.
- Workflow con permessi corretti.
- Artifact caricato.
- URL finale verificato.
- Dominio custom configurato se serve.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Pages con Actions]]
- [[Deploy con GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Environments GitHub Actions]]
- [[Permissions GitHub Actions]]

## Fonti

- [GitHub Docs - Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [GitHub Docs - Configuring a publishing source for GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
