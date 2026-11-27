---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-actions
  - troubleshooting
  - ci-cd
aliases:
  - Troubleshooting GitHub Actions
  - Troubleshooting workflow GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Debug GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Troubleshooting permissions GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Troubleshooting secrets GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Checklist GitHub Actions]]"
title: Troubleshooting GitHub Actions
---

# Troubleshooting GitHub Actions

## Obiettivo

Trovare **il primo passaggio che non è avvenuto come previsto**. Un workflow che non parte, un job in attesa e uno step terminato con errore richiedono tre diagnosi diverse. Annotare evento, branch, SHA e, se esiste, link al run e numero del tentativo.

## Dal sintomo al primo controllo

| Sintomo | Dove guardare | Cosa distingue le cause |
| --- | --- | --- |
| Nessun run per la modifica | `.github/workflows/`, evento `on`, filtri di branch e percorsi, annotazioni di sintassi | Un commit solo locale non genera un push GitHub. Per una PR da fork controllare anche se l'esecuzione richiede approvazione. |
| Run presente, job non avviato | Stato del job, `runs-on`, gruppo di concorrenza, eventuale environment | Un runner senza etichette compatibili, un altro run attivo e un'approvazione di deploy mancante non si risolvono aumentando il timeout di uno step. |
| Job o step saltato | Condizione `if`, dipendenze `needs` e risultati a monte | Se `build` fallisce e `deploy` dipende da esso, il deploy saltato è una conseguenza. Diagnosticare prima la build. |
| Step fallito | Primo comando con errore nel job interessato | Distinguere checkout mancante, directory sbagliata, lockfile assente e tool incompatibile. Un errore di accesso o un secret vuoto hanno procedure dedicate sotto. |
| Output mancante nonostante il job verde | Percorso prodotto, upload, download e job consumatore | Due job non condividono automaticamente il filesystem. Una cache mancante dovrebbe comportare una nuova installazione, non sostituire un artifact necessario. |

## Esempio: seguire un run di Quartz

Nel vault `.github/workflows/deploy-pages.yml` parte al push su `main` o manualmente. Non cercare una sua esecuzione per la sola apertura di una PR. I comandi seguenti sono di sola lettura: con GitHub CLI autenticata sostituire `12345` con l'ID del run e `OWNER/REPO` con il repository.

```bash
gh run view 12345 --repo OWNER/REPO --json event,headSha,attempt,status,conclusion,jobs
```

Se la build ha fallito al primo tentativo, leggere gli step falliti **di quel tentativo**:

```bash
gh run view 12345 --repo OWNER/REPO --attempt 1 --log-failed
```

Se `npm ci` segnala un lockfile mancante, verificare nei log la directory effettiva e nel commit la presenza di `site/package-lock.json`: qui gli step npm girano da `site`, mentre l'upload legge `site/public` dal workspace. Confrontare anche Node e npm del runner con quelli locali prima di cambiare le dipendenze.

## Verificare la correzione

Per un problema transitorio può avere senso ripetere lo stesso run. Un *re-run* riutilizza però lo SHA e il ref originari: **non testa una correzione committata dopo**. In quel caso verificare una nuova esecuzione sul nuovo SHA. Se serve più dettaglio, abilitare temporaneamente `ACTIONS_STEP_DEBUG` o, per problemi del runner, `ACTIONS_RUNNER_DEBUG` a `true` come variabile o secret Actions. Evitare dump dell'ambiente e non condividere log con credenziali.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions|Eventi e trigger GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Debug GitHub Actions|Debug GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Checklist GitHub Actions|Checklist GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Troubleshooting permissions GitHub Actions|Troubleshooting permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Troubleshooting secrets GitHub Actions|Troubleshooting secrets GitHub Actions]]

## Fonti

- [GitHub CLI: run, tentativi e log](https://cli.github.com/manual/gh_run_view)
- [GitHub Docs: cosa viene riutilizzato da un re-run](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs)
- [GitHub Docs: abilitare i log di debug](https://docs.github.com/en/actions/how-tos/monitor-workflows/enable-debug-logging)
