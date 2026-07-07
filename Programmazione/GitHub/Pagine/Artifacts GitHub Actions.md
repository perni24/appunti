---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, artifacts, ci]
aliases: [Artifacts GitHub Actions, Workflow artifacts]
prerequisites: [Pipeline CI GitHub Actions]
related: [Cache GitHub Actions]
---

# Artifacts GitHub Actions

## Sintesi

Gli **artifacts** di GitHub Actions sono file prodotti da un workflow e conservati da GitHub. Servono per scaricare build, log, report, coverage o per passare file tra job.

Non sono una cache: un artifact rappresenta un output di un run specifico.

## Quando usarlo

Usa artifacts quando:

- vuoi conservare report di test o coverage;
- vuoi scaricare build prodotte dalla CI;
- vuoi passare file tra job;
- vuoi debuggare output di un workflow;
- vuoi pubblicare artefatti in una release dopo una fase successiva;
- vuoi conservare log strutturati.

## Come funziona

Gli artifact si caricano con action dedicate, di solito `actions/upload-artifact`. Possono poi essere scaricati manualmente o da altri job con `actions/download-artifact`.

Ogni artifact e collegato a uno specifico workflow run e ha retention configurabile.

## API / Sintassi

Upload:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: test-report
    path: reports/
```

Download:

```yaml
- uses: actions/download-artifact@v4
  with:
    name: test-report
    path: downloaded-reports/
```

## Esempio pratico

Salvare coverage:

```yaml
- run: npm test -- --coverage
- uses: actions/upload-artifact@v4
  with:
    name: coverage
    path: coverage/
```

Questo permette di ispezionare il report anche se non viene pubblicato altrove.

## Varianti

- **Report artifact**: coverage, junit, log.
- **Build artifact**: binari o bundle.
- **Debug artifact**: file utili dopo fallimenti.
- **Artifact tra job**: passaggio output da build a deploy.
- **Release asset**: artifact promosso e pubblicato in release.

## Errori comuni

- Usare artifacts come cache.
- Caricare file troppo grandi o inutili.
- Conservare segreti negli artifact.
- Non impostare nomi chiari.
- Confondere artifact di workflow con asset di release.
- Non definire retention appropriata.

## Checklist

- L'artifact serve davvero dopo il run?
- Il nome e descrittivo?
- Non contiene segreti?
- La retention e adeguata?
- Il path e corretto?
- Se serve in una release, viene promosso esplicitamente?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Pipeline CI GitHub Actions]]
- [[Cache GitHub Actions]]
- [[Workflow per test, lint e build]]

## Fonti

- [GitHub Docs - Store and share data with workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data)
