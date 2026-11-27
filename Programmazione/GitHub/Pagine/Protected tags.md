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
  - tags
  - release
  - rulesets
aliases:
  - Protected tags
  - Tag protetti GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Repository rulesets]]"
title: Protected tags
---

# Protected tags

## Sintesi

Su **GitHub.com** si proteggono i nomi dei tag con un **tag ruleset**. La vecchia funzione *tag protection rules* è stata ritirata nel 2024. Il nome `v1.0.0` indica una versione solo per convenzione; senza regole e un processo di rilascio non certifica chi l’ha creata, cosa contiene l’artefatto o dove è stata distribuita.

## Tre oggetti diversi

| Oggetto | Cosa rappresenta |
| --- | --- |
| Tag lightweight | Un riferimento Git a un oggetto, tipicamente il commit che vuoi rilasciare. |
| Tag annotato | Un riferimento a un oggetto tag che registra autore del tag, data, messaggio e oggetto di destinazione. Un tag annotato **non è necessariamente firmato**. |
| GitHub Release | Una pubblicazione associata a un tag, con note ed eventuali allegati. Creare il tag Git non crea da solo una Release, salvo automazioni del progetto. |

## Esempio: ispezionare un tag prima di pubblicarlo

In un **clone di prova** con almeno un commit, verifica prima che `HEAD` sia il commit previsto e che il nome non sia già utilizzato. Crea un tag annotato **solo locale**:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
```

Controlla che tipo di oggetto identifica il riferimento: l’output atteso per quello appena creato è `tag`, non `commit`.

```bash
git cat-file -t refs/tags/v1.0.0
```

Per ottenere invece lo SHA del commit di destinazione (le virgolette rendono l’esempio utilizzabile anche in PowerShell):

```bash
git rev-parse "refs/tags/v1.0.0^{commit}"
```

Per una **vera pubblicazione autorizzata**, dopo aver verificato repository, versione e commit, il comando seguente invia quel solo riferimento. È una scrittura sul remoto e può avviare una release o un deploy: non fa parte della prova locale.

```bash
git push origin refs/tags/v1.0.0
```

La firma è un controllo distinto: se il progetto richiede tag firmati, crea un tag firmato con `git tag -s` usando una chiave configurata e verificane la firma con `git tag -v`. Il ruleset sul nome da solo non verifica la firma del tag.

## Esempio di policy per le release

In **Settings → Rules → Rulesets**, usa come target i **tag** e come pattern `v*`. Include sia `v1.2.3` sia `v1.2.3-rc.1`, ma anche `versione-prova`: non è un validatore SemVer.

- Per riservare la **creazione** a chi rilascia, usa un ruleset che limita le creazioni e autorizza solo gli attori previsti per quel compito.
- Per impedire anche a chi crea il tag di riscrivere o cancellare normalmente una versione, usa un **secondo ruleset** sullo stesso target che limita aggiornamenti e cancellazioni, senza estendere a questo le eccezioni per la creazione.
- Se il riferimento remoto è sbagliato, non spostarlo o cancellarlo come normale procedura di correzione: i consumatori potrebbero averlo già scaricato. Pubblica una versione correttiva e documenta quella sostituita. Un rifiuto del push non cancella il tag locale.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Repository rulesets|Repository rulesets]]
- [[Programmazione/GitHub/Pagine/Conventional commits su GitHub|Conventional commits su GitHub]]

## Fonti

- [GitHub Changelog: ritiro delle vecchie protezioni dei tag](https://github.blog/changelog/2024-05-29-sunset-notice-tag-protections/)
- [GitHub Docs: creazione, aggiornamento e cancellazione nei ruleset](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Git: tag annotati, leggeri e firmati](https://git-scm.com/docs/git-tag)
- [GitHub Docs: differenza fra tag e release](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
