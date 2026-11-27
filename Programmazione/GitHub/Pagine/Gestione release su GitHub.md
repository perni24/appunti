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
  - release
  - versioning
  - manutenzione
aliases:
  - Gestione release su GitHub
  - Release GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Tag, versioni e changelog]]"
related:
  - "[[Programmazione/GitHub/Pagine/Release automation GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Tag, versioni e changelog]]"
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
title: Gestione release su GitHub
---

# Gestione release su GitHub

## Sintesi

Il **tag Git** identifica una revisione; la **release GitHub** presenta quella versione a chi la usa, con note di aggiornamento ed eventuali file da scaricare. Il **deploy** è un'altra operazione: pubblicare una release non aggiorna da solo un sito o un ambiente.

## Cosa si distribuisce

| Elemento | A cosa serve |
| --- | --- |
| Archivio sorgente | GitHub offre gli archivi del codice associato al tag. Non sono automaticamente un'app compilata. |
| Asset della release | File allegato dai manutentori o dalla CI, per esempio un binario e il suo checksum. Verificare origine, versione e piattaforma. |
| Artifact di un workflow | Output di una specifica esecuzione Actions, con proprie regole di accesso e conservazione. Diventa asset della release solo se viene caricato come tale. |

## Esempio: dal tag alla pubblicazione

Prerequisiti: GitHub CLI autenticata, permesso di scrittura, repository corretto e tag `v2.0.0` **già presente sul remoto e verificato rispetto al commit testato**. I comandi seguenti si riferiscono al repository del clone corrente.

**Preparare la bozza.** Crea una release sul remoto ma non la pubblica. Senza `--verify-tag`, il comando può creare un tag mancante sul branch predefinito. Il flag controlla l'esistenza del tag remoto, non che sia il commit desiderato.

```bash
gh release create v2.0.0 --verify-tag --draft --generate-notes --title "v2.0.0"
```

**Rivedere il risultato.** Controllare le PR incluse nelle note generate; aggiungere cosa cambia per l'utente e le eventuali migrazioni. Caricare i file previsti nella bozza e verificare nomi e checksum prima di pubblicare, specialmente se le release sono immutabili.

```bash
gh release view v2.0.0 --json tagName,isDraft,isPrerelease,assets,url
```

**Pubblicare solo dopo la verifica.** Questo comando rende la release disponibile agli utenti che possono accedere al repository:

```bash
gh release edit v2.0.0 --draft=false
```

## Varianti ed errori comuni

- **Draft** indica che la release non è ancora pubblicata. **Pre-release** segnala una versione non stabile: una beta può essere pubblica. Per una beta usare un tag distinto, per esempio `v2.0.0-beta.1`, e il flag `--prerelease`.
- **Latest** è un'etichetta della release, non prova che quel commit sia distribuito in produzione.
- Il changelog descrive l'impatto, non solo i titoli delle PR. «Rinominare `OLD_API_URL` in `API_URL` prima dell'aggiornamento» aiuta più di «aggiornata la configurazione».
- Il workflow Quartz di questo vault pubblica su push a `main` o avvio manuale: un tag o una release da soli non ne attivano il deploy.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Tag, versioni e changelog|Tag, versioni e changelog]]
- [[Programmazione/GitHub/Pagine/Release automation GitHub Actions|Release automation GitHub Actions]]
- [[Programmazione/GitHub/Pagine/GitHub REST API|GitHub REST API]]
- [[Programmazione/GitHub/Pagine/GitHub CLI|GitHub CLI]]
- [[Programmazione/GitHub/Pagine/Protected tags|Protected tags]]

## Fonti

- [GitHub Docs: tag, release e archivi sorgente](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [GitHub Docs: gestire le release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [GitHub Docs: note generate](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)
- [GitHub CLI: gh release create](https://cli.github.com/manual/gh_release_create)
- [GitHub CLI: gh release view](https://cli.github.com/manual/gh_release_view)
- [GitHub CLI: gh release edit](https://cli.github.com/manual/gh_release_edit)
