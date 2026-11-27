---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - git
  - branching
  - workflow
aliases:
  - Branching strategy GitHub
  - Strategia di branch GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
related:
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub]]"
title: Branching strategy su GitHub
---

# Branching strategy su GitHub

## Sintesi

Una strategia di branch stabilisce **da dove parte una modifica, dove viene integrata e quali versioni ricevono ancora correzioni**. La dimensione del team da sola non determina la scelta. Una domanda più utile è: «Se oggi correggo l’export CSV, devo consegnarlo solo nella prossima versione o anche a chi usa la serie precedente?».

## Scegliere una strategia

| Situazione | Strategia plausibile | Costo da tenere presente |
| --- | --- | --- |
| Una sola linea attiva, modifiche sottoposte a review | **GitHub flow**: branch breve da `main`, PR, controlli, merge e rimozione del branch concluso. | Una PR aperta per settimane ritarda l’integrazione. |
| Integrazioni piccole e molto frequenti | **Trunk-based**: si integra spesso sul tronco, anche tramite branch brevissimi. | Servono test rapidi e modifiche compatibili; il lavoro incompleto può richiedere feature flag. |
| Due serie pubblicate ricevono correzioni | **Branch di manutenzione**, per esempio `release/1.x`, oltre a `main`. | Ogni correzione va valutata, eventualmente riportata e testata su entrambe le linee. |
| Sviluppo e preparazione della release hanno fasi separate | **Git Flow** introduce branch come `develop`, release e hotfix. | Più integrazioni da coordinare: non introdurlo se basta una sola linea. |

Un **branch** individua una linea di storia; un **ambiente** è una destinazione di deploy. Il merge su `main` non dimostra che quel commit sia in produzione: verifica il deployment o l’artefatto distribuito.

## Esempio: iniziare il fix dalla base giusta

Prerequisiti: clone con remoto `origin`, branch remoto `main`, working tree pulito e nessun branch locale chiamato `fix/export-vuoto`. Sostituisci i nomi se il repository ne usa altri.

```bash
git status --short
```

Se compaiono modifiche, decidi prima a quale lavoro appartengono. Aggiorna i riferimenti remoti senza integrare nulla nel branch corrente:

```bash
git fetch origin
```

Crea il branch a partire dal commit remoto appena osservato, **senza** impostare `origin/main` come upstream del nuovo branch:

```bash
git switch --no-track -c fix/export-vuoto origin/main
```

Fai la correzione e il commit, pubblica il branch dedicato e apri la PR verso `main`. Review e check diventano obbligatori solo se le regole del repository li richiedono. Prima del merge verifica che la base della PR sia la linea prevista, non solo che i test siano verdi.

## Caso diverso: il difetto riguarda anche la versione 1.x

Se `main` è già passato alla 2.x, non fondere tutto `main` in `release/1.x` per trasferire una sola correzione. Prepara una PR separata con base `release/1.x` e verifica la correzione con i test di quella versione. Se riusi un commit tramite `cherry-pick`, riesamina le dipendenze: poterlo applicare senza conflitti non dimostra che il fix funzioni sul codice più vecchio.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub|Merge squash e rebase su GitHub]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]

## Fonti

- [GitHub Docs - GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow)
- [Git: creare un branch da uno start-point e controllarne il tracking](https://git-scm.com/docs/git-switch)
- [Git: cosa aggiorna fetch](https://git-scm.com/docs/git-fetch)
