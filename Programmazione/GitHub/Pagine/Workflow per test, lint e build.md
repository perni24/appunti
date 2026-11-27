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
  - ci
  - test
  - lint
  - build
aliases:
  - Workflow per test lint e build
  - Test lint build GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Required status checks]]"
  - "[[Programmazione/GitHub/Pagine/Cache GitHub Actions]]"
title: Workflow per test, lint e build
---

# Workflow per test, lint e build

## Sintesi

Lint, controllo dei tipi, test e build rispondono a **domande diverse**. Prima di scrivere `npm run lint` in un workflow, apri il `package.json` del progetto: npm non crea quel comando perché il repository contiene file JavaScript. Nel vault il manifesto è `site/package.json`.

| Controllo | Domanda | Esempio o limite |
| --- | --- | --- |
| Lint o formato | Il sorgente rispetta le regole statiche concordate? | ESLint, Ruff e Clippy dipendono dal linguaggio. Un formatter non verifica la logica. |
| Typecheck | Le operazioni sono compatibili con i tipi dichiarati? | In TypeScript `tsc --noEmit` non esegue i test né produce il sito. |
| Test | Un comportamento atteso è osservabile su casi precisi? | `content:test` verifica, tra l’altro, la trasformazione dei wikilink. |
| Build | È possibile produrre l’output distribuibile? | `site:build` genera gli HTML di Quartz e ne controlla i riferimenti. Non pubblica online. |

## Esempio pratico: validazione e build del sito

Frammento da inserire in `jobs.<id>.steps` su un runner Ubuntu, **dopo** checkout e setup di Node 24. I plugin vanno preparati prima della build. Gli step sono nello stesso job: il sito ritrova dipendenze e plugin già installati.

```yaml
- name: Installa le dipendenze
  working-directory: site
  run: npm ci
- name: Controlla il vault
  working-directory: site
  run: npm run content:check
- name: Esegui i test di trasformazione
  working-directory: site
  run: npm run content:test
- name: Installa i plugin Quartz
  working-directory: site
  run: npm run install-plugins
- name: Genera il sito e controlla i link HTML
  working-directory: site
  run: npm run site:build
```

È una variante didattica dei controlli del repository, non una seconda configurazione attiva. `content:check` controlla le **note**, non è ESLint; lo script `check` del generatore combina invece TypeScript e Prettier. In un altro progetto usa i comandi presenti nel suo manifesto, con il runtime e il lockfile previsti.

## Errori da distinguere

- **Installazione rossa:** con `npm ci` un lockfile incoerente con il manifesto deve essere corretto nel sorgente. Non far passare la CI sostituendo il comando con `npm install`.
- **Test rosso e build saltata:** per impostazione predefinita lo step successivo non parte. Non aggiungere `continue-on-error` a un controllo obbligatorio per far comparire il report: rendi condizionale solo l’upload diagnostico.
- **Tutto verde ma nessun file scaricabile:** generare un bundle sul runner non lo conserva. Se serve dopo il job, caricalo come artifact. Per parallelizzare lint e test usa job indipendenti e prevedi il setup in ciascuno.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Cache GitHub Actions|Cache GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Artifacts GitHub Actions|Artifacts GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Required status checks|Required status checks]]

## Fonti

- [GitHub Docs - Integrazione continua](https://docs.github.com/en/actions/get-started/continuous-integration)
- [npm Docs - Contratto di npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/)
- [GitHub Docs - Ordine e condizioni degli step](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
