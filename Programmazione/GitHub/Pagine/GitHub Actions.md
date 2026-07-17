---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-actions, ci-cd, automazione]
aliases: [GitHub Actions]
prerequisites: [Repository GitHub]
related: [Workflow GitHub Actions, Eventi e trigger GitHub Actions]
---

# GitHub Actions

## Sintesi

**GitHub Actions** e la piattaforma di automazione integrata in GitHub. Permette di eseguire workflow in risposta a eventi del repository, per esempio push, pull request, release, esecuzioni manuali o schedulazioni.

Si usa soprattutto per CI/CD, ma puo anche automatizzare issue, release, controlli di sicurezza, pubblicazione pacchetti e manutenzione del repository.

## Quando usarlo

Usa GitHub Actions quando:

- vuoi eseguire test e lint su ogni pull request;
- vuoi creare build automatiche;
- vuoi pubblicare release o package;
- vuoi automatizzare controlli di sicurezza;
- vuoi eseguire script programmati;
- vuoi ridurre operazioni manuali ripetitive.

## Come funziona

I concetti base sono:

- **workflow**: processo automatizzato definito in YAML;
- **event**: evento che avvia il workflow;
- **job**: gruppo di step eseguiti su un runner;
- **step**: singolo comando o action;
- **runner**: macchina che esegue il job;
- **action**: componente riutilizzabile dentro uno step.

I file workflow stanno in:

```text
.github/workflows/
```

## API / Sintassi

Workflow minimo:

```yaml
name: CI

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

## Esempio pratico

Per un progetto JavaScript:

```yaml
name: Node CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm test
```

## Varianti

- **CI**: test, lint e build.
- **CD**: deploy automatici.
- **Release automation**: changelog, tag, artefatti.
- **Security automation**: scanning e attestazioni.
- **Repository automation**: label, issue, commenti, cleanup.
- **Manual workflow**: avvio tramite `workflow_dispatch`.

## Errori comuni

- Mettere troppa logica in un solo workflow.
- Non fissare versioni delle action.
- Usare secret in contesti non sicuri.
- Non limitare permessi del token del workflow.
- Ignorare differenze tra `push`, `pull_request` e `pull_request_target`.
- Non leggere i log quando un job fallisce.

## Checklist

- Il workflow ha uno scopo chiaro?
- Gli eventi sono quelli giusti?
- I job sono separati in modo leggibile?
- Le action sono versionate?
- I secret sono usati solo dove servono?
- I permessi sono minimi?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Workflow GitHub Actions]]
- [[Eventi e trigger GitHub Actions]]
- [[Jobs steps e runners]]
- [[Variabili e secrets GitHub Actions]]

## Fonti

- [GitHub Docs - GitHub Actions](https://docs.github.com/en/actions)
