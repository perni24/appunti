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
  - ci-cd
  - automazione
aliases:
  - GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions]]"
title: GitHub Actions
---

# GitHub Actions

## Sintesi

Un commit locale non avvia GitHub Actions. Serve un **evento su GitHub** ascoltato da un workflow: per esempio un push su un branch, l’apertura di una pull request o una richiesta manuale. Il workflow è la ricetta nel repository; un **run** è una sua singola esecuzione, con evento, revisione del codice, log ed esito propri.

## Come leggere un run

| Livello | Domanda a cui risponde | Esempio nel vault |
| --- | --- | --- |
| Workflow | Che cosa viene automatizzato? | `Deploy Quartz to GitHub Pages`, definito in `.github/workflows/deploy-pages.yml`. |
| Evento | Perché è partito? | Push su `main` oppure avvio manuale. La sola apertura di una PR non attiva questo workflow. |
| Job e runner | Quale gruppo di operazioni va eseguito, e dove? | `build` e `deploy` ricevono ciascuno un runner Ubuntu. |
| Step | Qual è l’operazione corrente? | Uno step `run` esegue un comando; uno step `uses` richiama un’action, come il checkout. |

Actions non è sinonimo di pubblicazione: un workflow può limitarsi a validare una PR, etichettare una issue o eseguire una manutenzione periodica. Sono gli **step**, non il nome del workflow, a stabilire gli effetti.

## Esempio pratico: dal Markdown al sito

1. Dopo il push su `main`, `build` scarica il repository, prepara Node e installa le dipendenze e i plugin in `site/`.
2. Convalida le note ed esegue i test di trasformazione, poi genera il sito. La directory `site/public` viene caricata come **artifact di Pages**: non viene aggiunta a Git.
3. Il job `deploy` ha `needs: build`. Se la build riesce, usa l’artifact per pubblicare nell’environment `github-pages`. Un upload riuscito, da solo, non prova che il sito sia online: controlla anche l’esito di `deploy` e il suo URL.

## Diagnosi: il sito non è cambiato

Non confondere **CI** (lint, test e build) con **deploy** (aggiornamento dell’ambiente). Anche preparare una release con changelog e artifact o eseguire una scansione di sicurezza sono automazioni distinte: possono riuscire senza che cambi una pagina del sito.

Dalla radice del clone, con GitHub CLI autenticata e accesso in lettura, cerca il tuo commit tra le esecuzioni:

```bash
gh run list --workflow deploy-pages.yml --branch main --limit 5 --json databaseId,event,headSha,status,conclusion
```

Se il run esiste ed è fallito, sostituisci `RUN_ID` con il suo `databaseId` per leggere il primo step in errore:

```bash
gh run view RUN_ID --log-failed
```

Se manca proprio il run, controlla push, branch e trigger. Se `deploy` è saltato, parti da `build`. Se entrambi sono verdi ma manca **una sola nota**, verifica il suo frontmatter e i criteri di pubblicazione del vault prima di rilanciare il deploy.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions|Eventi e trigger GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Jobs steps e runners|Jobs steps e runners]]
- [[Programmazione/GitHub/Pagine/Variabili e secrets GitHub Actions|Variabili e secrets GitHub Actions]]

## Fonti

- [GitHub Docs - Componenti di GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)
- [GitHub CLI - gh run list](https://cli.github.com/manual/gh_run_list)
- [GitHub CLI - gh run view](https://cli.github.com/manual/gh_run_view)
