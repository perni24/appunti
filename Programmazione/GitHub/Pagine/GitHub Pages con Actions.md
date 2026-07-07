---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, github-pages, deploy]
aliases: [GitHub Pages con Actions, Pages con Actions]
prerequisites: [GitHub Actions, Deploy con GitHub Actions]
related: [Environments GitHub Actions]
---

# GitHub Pages con Actions

## Sintesi

**GitHub Pages con Actions** permette di pubblicare siti statici usando workflow GitHub Actions. E utile per documentazione, blog, siti di progetto e build statiche generate da strumenti come Quartz, Vite, MkDocs, Docusaurus o altri generatori.

Il punto chiave e distinguere sorgente e output: il repository contiene sorgenti, il workflow costruisce e pubblica il sito.

## Quando usarlo

Usalo quando:

- vuoi pubblicare documentazione statica;
- il sito richiede una build;
- vuoi controllare deploy da branch o workflow;
- vuoi usare generatori statici;
- vuoi pubblicare un vault o wiki in HTML;
- vuoi integrare test e build prima della pubblicazione.

## Come funziona

GitHub Pages puo pubblicare da branch o da GitHub Actions. Con Actions:

1. il workflow parte su push o manualmente;
2. esegue build del sito;
3. carica artifact Pages;
4. esegue deploy verso GitHub Pages.

Spesso il workflow usa action ufficiali dedicate a Pages.

## API / Sintassi

Schema semplificato:

```yaml
name: Deploy Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Esempio pratico

Per una knowledge base:

```text
Markdown sorgente -> build statico -> artifact Pages -> deploy Pages
```

Il workflow consente di pubblicare sempre la versione derivata dall'ultimo commit su `main`.

## Varianti

- **Pages da branch**: semplice per HTML gia pronto.
- **Pages da Actions**: adatto a build statiche.
- **Custom domain**: dominio personalizzato.
- **Docs site**: documentazione tecnica.
- **Knowledge base pubblicata**: Markdown trasformato in sito.
- **Preview separata**: non sempre nativa, spesso richiede workflow dedicati.

## Errori comuni

- Pubblicare sorgenti invece dell'output buildato.
- Dimenticare permessi `pages: write` e `id-token: write`.
- Non configurare Pages su sorgente GitHub Actions.
- Usare path artifact sbagliato.
- Non distinguere deploy Pages da release asset.
- Non controllare link e asset dopo deploy.

## Checklist

- Pages e configurato per usare GitHub Actions?
- Il workflow produce output statico corretto?
- Il path di upload e giusto?
- I permessi sono minimi e sufficienti?
- Il deploy dipende dalla build?
- Il sito pubblicato viene verificato?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Deploy con GitHub Actions]]
- [[GitHub Actions]]
- [[Artifacts GitHub Actions]]
- [[Environments GitHub Actions]]

## Fonti

- [GitHub Docs - What is GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
