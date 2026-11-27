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
  - repository
  - checklist
  - governance
aliases:
  - Checklist repository GitHub
  - Checklist repository
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository hygiene]]"
related:
  - "[[Programmazione/GitHub/Pagine/Governance repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository settings]]"
  - "[[Programmazione/GitHub/Pagine/README LICENSE e gitignore]]"
title: Checklist repository GitHub
---

# Checklist repository GitHub

## Obiettivo

Decidere se un repository è pronto da condividere, prendere in manutenzione o rendere pubblico. Annotare **quale repository, per quale uso e da chi è stato controllato**. Una voce non visibile con i propri permessi resta «da verificare», non «superata».

## Identificare il repository

Con GitHub CLI autenticata e accesso in lettura, sostituire `OWNER/REPO`. Il comando non cambia le impostazioni:

```bash
gh repo view OWNER/REPO --json nameWithOwner,visibility,defaultBranchRef,isArchived,viewerPermission
```

Leggere `defaultBranchRef.name` prima di cercare regole su `main`: il branch predefinito può avere un altro nome, o non esistere ancora in un repository vuoto. `viewerPermission` riguarda **l'account corrente**, non tutti i collaboratori.

## Checklist di consegna

- [ ] **Destinazione e responsabilità.** Owner e visibilità coincidono con quelli concordati; il README dice cosa fa il progetto, chi lo mantiene e dove segnalare problemi. Se non è più attivo, indica il successore o lo stato di archiviazione.
- [ ] **Avvio ripetibile.** Da un clone pulito seguire una volta i prerequisiti e il comando di verifica del README. Annotare il primo passaggio mancante. Se il progetto è solo documentazione, provare la navigazione o la build, non un avvio applicativo inesistente.
- [ ] **Contenuto condivisibile.** Controllare i file tracciati e ciò che è già nella storia prima di ampliare la visibilità. `.gitignore` non rimuove file già versionati. Verificare la licenza prevista per il riuso e, per contributi esterni, istruzioni e contatto di sicurezza.
- [ ] **Accessi e merge.** Con chi amministra il repository, controllare team, collaboratori esterni, diritti di scrittura e bypass. Verificare su una PR del branch predefinito che i check e le approvazioni previsti siano effettivamente richiesti.
- [ ] **Manutenzione.** Aprire un'issue o una PR **già esistente**, se presente: si capiscono stato e responsabile? Per dipendenze e alert individuare chi fa il triage. Se esistono rilasci, aprire l'ultimo e verificare come ottenere la versione supportata.

## Decisione

Per un repository personale senza release, segnare «rilasci: non applicabile» è più utile che inventare un tag. Per un progetto di produzione, richiedere invece un riferimento alla release o al deploy, un responsabile e una procedura di recupero. **Rinviare la condivisione** se visibilità, dati pubblicabili o responsabilità di accesso non sono chiariti; per le lacune non bloccanti registrare azione e responsabile.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/README LICENSE e gitignore|README LICENSE e gitignore]]
- [[Programmazione/GitHub/Pagine/Repository hygiene|Repository hygiene]]
- [[Programmazione/GitHub/Pagine/Governance repository GitHub|Governance repository GitHub]]
- [[Programmazione/GitHub/Pagine/Branch protection rules|Branch protection rules]]
- [[Programmazione/GitHub/Pagine/Dependabot|Dependabot]]
- [[Programmazione/GitHub/Pagine/Secret scanning|Secret scanning]]

## Fonti

- [GitHub CLI: campi disponibili in gh repo view](https://cli.github.com/manual/gh_repo_view)
- [GitHub Docs: buone pratiche per i repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories)
- [Git: file presenti nell'indice](https://git-scm.com/docs/git-ls-files)
