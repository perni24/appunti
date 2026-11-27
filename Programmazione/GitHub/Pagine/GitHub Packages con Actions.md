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
  - github-packages
  - packages
  - registry
aliases:
  - GitHub Packages con Actions
  - Packages con Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Release automation GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/OIDC GitHub Actions]]"
title: GitHub Packages con Actions
---

# GitHub Packages con Actions

## Sintesi

Un **package** viene distribuito da un registry e consumato con un package manager. Non è un artifact temporaneo del workflow né un file allegato a una release. Scegli prima l’ecosistema: una libreria Node può andare in `npm.pkg.github.com`, un’immagine Docker in `ghcr.io`. Maven/Gradle, NuGet e RubyGems hanno configurazioni proprie.

## Esempio pratico: vedere cosa riceverebbe chi installa una libreria

In una **cartella di prova separata**, supponi di avere `index.js` e questo `package.json` minimo. `@esempio` è uno scope fittizio: per pubblicare servirebbe il proprietario reale, in minuscolo. Non modificare `site/package.json` del vault: è intenzionalmente `private: true` e serve a costruire il sito.

```json
{
  "name": "@esempio/guida",
  "version": "1.2.0",
  "files": ["index.js"],
  "publishConfig": { "registry": "https://npm.pkg.github.com" }
}
```

Dalla cartella di prova, con npm disponibile, ispeziona l’elenco dei file prima di inviare qualcosa:

```bash
npm pack --dry-run --ignore-scripts --json
```

Il risultato deve elencare `index.js` e `package.json`; possono esserci file inclusi per convenzione, come README e licenza. Il comando non pubblica, non richiede token e non prova l’accesso al registry. `--ignore-scripts` evita di eseguire gli script del pacchetto: se il progetto **genera** i file prima del pack, prepara e testa prima quel contenuto.

## Come cambia la pubblicazione reale

Per una libreria realmente destinata a GitHub Packages, questi sono gli **step finali del job di pubblicazione**, dopo checkout, installazione, build e test nella libreria. Presuppongono che la directory corrente contenga il suo manifesto, non quello del vault. Il job deve avere `contents: read` e `packages: write` e partire solo da una revisione di rilascio autorizzata. **`npm publish` invia il package al registry.**

```yaml
- uses: actions/setup-node@v6
  with:
    node-version: '24'
    registry-url: https://npm.pkg.github.com
    scope: '@esempio'
- name: Pubblica la versione verificata
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: npm publish
```

Prima dell’invio confronta versione del manifesto, tag e file del pacchetto. Se la versione esiste già, non contare su una sovrascrittura: verifica cosa è stato pubblicato. Se ricevi un 403 controlla scope, proprietario, collegamento al repository e permessi **del package per quel repository**. Concedere `packages: write` nel YAML non dà al repository accesso a qualsiasi package privato.

## Variante: un’immagine su GHCR

Per un’immagine, autenticati su `ghcr.io` con il token del job di pubblicazione, costruisci dal Dockerfile testato e usa un nome immagine in minuscolo. Associa l’immagine al repository, per esempio con la label OCI `org.opencontainers.image.source`. Un tag come `latest` può spostarsi; per distribuire esattamente l’immagine verificata registra il **digest**. Visibilità e accesso del package vanno controllati nel registry, non dedotti dal successo della build.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Release automation GitHub Actions|Release automation GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Pubblicare e installare con Actions](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions)
- [GitHub Docs - Registry npm, scope e accessi](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [GitHub Docs - Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [npm Docs - npm pack e dry-run](https://docs.npmjs.com/cli/v11/commands/npm-pack/)
