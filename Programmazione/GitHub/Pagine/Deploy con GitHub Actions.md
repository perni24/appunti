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
  - deploy
  - cd
aliases:
  - Deploy con GitHub Actions
  - Deployment GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Environments GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/OIDC GitHub Actions]]"
title: Deploy con GitHub Actions
---

# Deploy con GitHub Actions

## Sintesi

La CI verifica un cambiamento. Il **deploy** rende una revisione disponibile in una destinazione precisa, per esempio il sito Pages del repository. Creare un tag, caricare un artifact o pubblicare una release sono operazioni distinte: nessuna delle tre, da sola, aggiorna il sito.

Con la *continuous delivery* prepari una versione distribuibile e puoi decidere quando promuoverla; con il *continuous deployment* un cambiamento che supera i controlli arriva automaticamente in produzione. Per capire quale flusso hai davanti guarda trigger, controlli e destinazione, non il nome del file YAML.

## Seguire un deploy del vault

| Fase | Che cosa dimostra | Che cosa non dimostra |
| --- | --- | --- |
| Push su `main` o avvio manuale | È partita un’esecuzione per una certa revisione. | Un commit rimasto locale non avvia il workflow remoto. |
| `build` | I controlli sono passati ed è stato generato `site/public`. | I file nel workspace del runner non sono ancora online. |
| Upload dell’artifact Pages | Quell’output è disponibile per il deploy del run. | Un upload riuscito non è un deployment riuscito. |
| `deploy` con `needs: build` | Il job di pubblicazione attende la build e usa il suo artifact. | Il nome `github-pages` non dimostra che qualcuno abbia approvato. |

Questo è il comportamento descritto in `.github/workflows/deploy-pages.yml`, non l’esito di uno specifico run. Un’alternativa per un’applicazione è promuovere lo **stesso artifact** prima in staging e poi in produzione: compilare di nuovo al momento della promozione può produrre un risultato diverso da quello testato.

## Esempio pratico: un controllo prima dell’upload

Dalla radice del vault, dopo la build e con Node disponibile, verifica che la home generata sia un file non vuoto. Il comando non contatta GitHub e non pubblica nulla.

```bash
node -e "const s = require('node:fs').statSync('site/public/index.html'); if (!s.isFile() || s.size === 0) process.exitCode = 1"
```

È un controllo preliminare: non verifica i link profondi, l’URL pubblico o i permessi della destinazione. Se manca la home, correggi la build; se l’artifact esiste ma il job non parte, guarda dipendenze e regole dell’environment; se il job fallisce, leggi il primo errore della pubblicazione.

## Recuperare una versione funzionante

Registra SHA, run, artifact e URL del deployment. Per il vault, se è una modifica agli appunti ad aver rotto il sito, puoi proporre il revert di quella modifica e far ripassare la pipeline. Rilanciare la build dello **stesso commit difettoso** non è un rollback. Per servizi con migrazioni dati verifica anche la compatibilità della versione precedente con lo schema corrente.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Environments GitHub Actions|Environments GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Deployment approvals GitHub Actions|Deployment approvals GitHub Actions]]
- [[Programmazione/GitHub/Pagine/OIDC GitHub Actions|OIDC GitHub Actions]]

## Fonti

- [GitHub Docs - Gestire i deployment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments)
- [GitHub Docs - Workflow di pubblicazione Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Docs - Ambienti e regole di protezione](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
