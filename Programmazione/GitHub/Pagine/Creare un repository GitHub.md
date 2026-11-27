---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - repository
  - procedura
aliases:
  - Creare un repository GitHub
  - Nuovo repository GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/README LICENSE e gitignore]]"
  - "[[Programmazione/GitHub/Pagine/Repository settings]]"
  - "[[Programmazione/GitHub/Pagine/Template organizzativi GitHub]]"
title: Creare un repository GitHub
---

# Creare un repository GitHub

## Obiettivo

Creare il repository sotto l'owner giusto e arrivare a una sola cronologia condivisa. **Si parte da zero oppure da commit locali già esistenti:** scegliere un solo percorso, non eseguire entrambi.

## Prima di iniziare

Servono Git, GitHub CLI autenticata e permesso di creare repository nell'account o nell'organizzazione scelti. Sostituire `OWNER/REPO`. Verificare account attivo, nome disponibile e visibilità desiderata; gli esempi creano repository **privati**.

```bash
gh auth status
```

## Percorso A: nuovo progetto senza cronologia locale

Da una directory che possa contenere il nuovo clone, creare su GitHub il repository con un primo README e clonarlo:

```bash
gh repo create OWNER/REPO --private --add-readme --clone
```

Entrare nella nuova directory `REPO`. Il clone ha già il commit iniziale e il remoto `origin`: non servono un altro `git init` o un secondo `remote add`. Se si parte da un template organizzativo, generare invece il repository dal template, poi clonare quello generato.

## Percorso B: progetto locale da pubblicare

1. Dalla radice del progetto, verificare la cronologia con `git log -1 --oneline`. Se è una cartella **non ancora inizializzata**, usare `git init -b main`, preparare README e `.gitignore` e creare il primo commit selezionando esplicitamente i file. Controllare anche la cronologia già esistente: un file rimosso dall'ultima versione può restare nei commit da pubblicare.
2. Creare il remoto **vuoto**, senza README, licenza o template generati su GitHub:

```bash
gh repo create OWNER/REPO --private
```

3. Controllare i remoti già configurati. Se `origin` esiste, verificarne l'indirizzo: non sovrascriverlo per tentativi.

```bash
git remote -v
```

Solo se `origin` manca, collegare la cartella locale al remoto appena creato:

```bash
git remote add origin https://github.com/OWNER/REPO.git
```

4. Leggere il nome del branch corrente. Se l'output è vuoto, si è su un commit senza branch: fermarsi e scegliere quale branch pubblicare.

```bash
git branch --show-current
```

5. Se il branch da pubblicare si chiama `main` e contiene i commit desiderati, inviarlo e impostare il relativo upstream. Per un nome diverso adattare il comando; non è necessario rinominare a forza il branch.

```bash
git push --set-upstream origin main
```

## Verifica e problemi comuni

- Aprire il repository e confrontare branch, ultimo commit e visibilità. In locale, `git branch -vv` mostra il branch remoto seguito.
- Se il primo push viene rifiutato perché il remoto contiene già commit, **non forzarlo**. Per un progetto appena iniziato può essere più semplice partire dal clone remoto e portarvi i file; se entrambe le storie sono importanti, esaminarle prima di integrarle.
- Configurare descrizione, accessi, branch predefinito e protezioni utili. Scegliere una licenza appropriata se si intende consentire il riuso: rendere pubblico il repository non è una licenza.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/README LICENSE e gitignore|README LICENSE e gitignore]]
- [[Programmazione/GitHub/Pagine/Clone fork e template repository|Clone fork e template repository]]
- [[Programmazione/GitHub/Pagine/GitHub CLI|GitHub CLI]]
- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/Template organizzativi GitHub|Template organizzativi GitHub]]

## Fonti

- [GitHub Docs: creare un repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [GitHub CLI: creazione, inizializzazione e clone](https://cli.github.com/manual/gh_repo_create)
- [Git: push e upstream](https://git-scm.com/docs/git-push)
