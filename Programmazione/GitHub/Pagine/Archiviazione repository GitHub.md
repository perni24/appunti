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
  - repository
  - archiviazione
  - manutenzione
aliases:
  - Archiviazione repository GitHub
  - Archiviare repository GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository hygiene]]"
related:
  - "[[Programmazione/GitHub/Pagine/Governance repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Migrazione repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository settings]]"
title: Archiviazione repository GitHub
---

# Archiviazione repository GitHub

## Sintesi

Archiviare un repository su GitHub significa **mantenerlo consultabile ma renderlo di sola lettura**. È una scelta adatta a un progetto concluso o sostituito. Non cancella i dati, non cambia automaticamente la visibilità e non crea una copia di sicurezza indipendente.

## Prima di archiviare

1. Aggiornare README e descrizione **prima** di bloccarne le modifiche. Indicare l'ultima versione mantenuta, l'eventuale successore e dove chiedere assistenza.
2. Rispondere alle issue e alle PR aperte. Chi legge deve distinguere il lavoro completato da quello non più seguito.
3. Fare un inventario di ciò che dipende dal repository: sito Pages e dominio, pacchetti, release, workflow e webhook. Verificare ogni servizio separatamente; l'archiviazione non è una procedura di migrazione.
4. Se serve un backup, definirne il perimetro e provarne il ripristino. Per esempio, un bundle Git non conserva issue, binari delle release o contenuti Git LFS.

### Esempio: salvare branch e tag

Da un repository locale completo e aggiornato, scegliere un **nuovo** file di destinazione. Il comando salva i branch e i tag presenti nel clone e gli oggetti Git raggiungibili; non include modifiche non committate né branch presenti soltanto come riferimenti remoti.

```bash
git bundle create ../progetto.bundle --branches --tags
```

Dallo stesso repository, controllare che Git riconosca il bundle e che eventuali prerequisiti siano soddisfatti:

```bash
git bundle verify ../progetto.bundle
```

La verifica del bundle non sostituisce una prova di ripristino né un'esportazione dei dati GitHub necessari.

## Archiviazione e verifica

Con accesso amministratore: **Settings → General → Danger Zone → Archive this repository**. Dopo la conferma, anche i manutentori non possono fare push, modificare issue o release, né aggiungere o rimuovere collaboratori finché non disarchiviano. Chi aveva accesso conserva la possibilità di leggere; eventuali modifiche fatte in un clone locale non sono pushabili verso il repository archiviato.

Per controllare lo stato, con GitHub CLI e accesso al repository (sostituire `OWNER/REPO`):

```bash
gh repo view OWNER/REPO --json nameWithOwner,isArchived,visibility
```

`isArchived: true` conferma l'archiviazione; `visibility` risponde a una domanda diversa: chi può vedere il repository? Per riprendere la manutenzione, usare **Unarchive this repository**, poi verificare accessi, CI e istruzioni prima di annunciare la riapertura.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/Repository hygiene|Repository hygiene]]
- [[Programmazione/GitHub/Pagine/Migrazione repository GitHub|Migrazione repository GitHub]]
- [[Programmazione/GitHub/Pagine/Gestione release su GitHub|Gestione release su GitHub]]

## Fonti

- [GitHub Docs: archiviazione e riapertura](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories)
- [GitHub Docs: backup del repository](https://docs.github.com/en/repositories/archiving-a-github-repository/backing-up-a-repository)
- [Git: cosa contiene un bundle](https://git-scm.com/docs/git-bundle)
- [GitHub CLI: gh repo view](https://cli.github.com/manual/gh_repo_view)
