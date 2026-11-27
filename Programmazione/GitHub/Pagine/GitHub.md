---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - git
  - repository
  - collaborazione
aliases:
  - GitHub
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Git e GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
title: GitHub
---

# GitHub

## Sintesi

GitHub ospita repository Git e aggiunge strumenti per discutere, verificare e distribuire le modifiche. **Git conserva la storia del codice; GitHub coordina il lavoro attorno a quella storia.** Puoi fare un commit senza GitHub e puoi discutere una issue su GitHub senza fare un commit.

## Cosa trovo in un progetto

| Domanda | Dove guardare |
| --- | --- |
| Quale versione contiene questa correzione? | Commit, branch e tag Git |
| Qual è il problema da risolvere? | Issue; Discussions per confronti aperti |
| Che cosa propone un collaboratore? | Diff, conversazione e review della pull request |
| Sono passati i test? | Check associati al commit o alla PR; log dell’esecuzione |
| Dove sono istruzioni e distribuzioni? | README, documentazione o wiki; release per note di versione e allegati |

Una distinzione utile: la **definizione** di un workflow Actions può essere un file Git in `.github/workflows/`. I log di un’esecuzione, le approvazioni di una PR e i permessi del repository sono invece gestiti dal servizio: non arrivano con `git clone`.

## Esempio: proporre una correzione al README

Prerequisiti: sei nel clone di un repository di prova, hai accesso in scrittura a `origin`, il branch di partenza è quello giusto e il working tree è pulito. Se non puoi scrivere nell’originale, usa un fork.

1. Crea un branch dalla versione corrente:

```bash
git switch -c docs/avvio
```

2. Modifica e salva `README.md`. Prepara solo quel file:

```bash
git add -- README.md
```

3. Controlla cosa entrerà nel commit:

```bash
git diff --staged
```

4. Registra la modifica **in locale**:

```bash
git commit -m "Documenta il primo avvio"
```

5. Pubblica **il branch** sul remoto:

```bash
git push -u origin docs/avvio
```

6. Su GitHub apri una pull request scegliendo come **base** il branch di destinazione e come **compare** `docs/avvio`. In alternativa, con GitHub CLI autenticata e un branch di destinazione chiamato `main`:

```bash
gh pr create --base main --head docs/avvio
```

Il push non crea da solo una PR; l’apertura della PR non unisce i branch. I check partono solo se configurati. Per consultarne lo stato, leggi la scheda della PR; per elencare le tue PR dal terminale usa `gh pr status`.

## Quando usarlo e cosa controllare

- Repository personale o di organizzazione: scegli proprietario e visibilità in base a chi deve amministrare e leggere il progetto. Pubblico non significa automaticamente open source.
- Prima di chiedere la review verifica che il diff riguardi la modifica descritta, non contenga segreti e punti alla base corretta.
- Per un progetto condiviso, documenta come eseguirlo, concorda quando richiedere review e check, e proteggi i branch importanti. Per consultare il repository o le issue da CLI esistono anche `gh repo view` e `gh issue list`.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]

## Fonti

- [GitHub Docs: Git e GitHub](https://docs.github.com/en/get-started/start-your-journey/what-is-github)
- [GitHub Docs: cosa contiene un repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
