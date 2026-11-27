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
  - remote
  - origin
  - upstream
aliases:
  - origin e upstream
  - Remote GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Git e GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Clone fork e template repository]]"
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
title: Remote origin e upstream
---

# Remote origin e upstream

## Sintesi

Un **remote** è una configurazione locale che associa un nome a uno o più URL. `origin` è il nome predefinito assegnato da `git clone`, non significa «progetto originale». Nel clone di un fork, `origin` normalmente punta al fork; `upstream` è il nome convenzionale che puoi dare al repository sorgente.

## Tre significati da non confondere

| Termine | Significato nell’esempio |
| --- | --- |
| `upstream` | Nome di un remoto configurato nel clone. Si può chiamare diversamente. |
| `upstream/main` | Riferimento **locale** all’ultimo stato noto di `main` su quel remoto. |
| Upstream **del branch** locale `main` | Branch configurato per il tracciamento, spesso `origin/main` anche quando esiste un remoto chiamato `upstream`. |

Per leggere indirizzi di fetch e push:

```bash
git remote -v
```

Per vedere cosa traccia ciascun branch locale:

```bash
git branch -vv
```

La riga `(push)` mostra un indirizzo, **non** prova che tu sia autorizzato a scriverci.

## Esempio: sincronizzare un fork senza creare un merge inatteso

Prerequisiti: `origin` è il tuo fork, il progetto originale e il fork usano `main` e la copia di lavoro è pulita. Se il remoto dell’originale non è ancora configurato, aggiungilo **una sola volta** con l’URL reale:

```bash
git remote add upstream https://github.com/OWNER/progetto.git
```

Passa al branch da aggiornare:

```bash
git switch main
```

Aggiorna i riferimenti del progetto originale; questo non cambia i tuoi file:

```bash
git fetch upstream
```

Per mantenere `main` allineato all’originale, controlla prima i commit **solo locali** rispetto a `upstream/main`. Se l’elenco non è vuoto, fermati e decidi quali modifiche conservare su un branch dedicato.

```bash
git log --oneline upstream/main..main
```

Altrimenti avanza solo se non serve creare un commit di merge:

```bash
git merge --ff-only upstream/main
```

Solo dopo la verifica, aggiorna il fork sul server:

```bash
git push origin main
```

Se le storie divergono, `--ff-only` rifiuta l’integrazione. Se invece fallisce il push, anche il fork remoto può essere avanzato: recupera e confronta la sua storia prima di riprovare. Non serve un push forzato per diagnosticare nessuno dei due casi.

## Altre operazioni

- `git push -u origin nome-branch` pubblica il branch indicato e ne configura il tracciamento. `-u` è utile, non obbligatorio per un push esplicito.
- `git remote set-url origin NUOVO-URL` cambia la destinazione **in questo clone**, per esempio da HTTPS a SSH; verifica poi URL e credenziali.
- `git remote remove upstream` rimuove la configurazione di quel remoto e i suoi riferimenti di tracciamento dal clone, non elimina il repository sul server.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]
- [[Programmazione/GitHub/Pagine/Clone fork e template repository|Clone fork e template repository]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]

## Fonti

- [GitHub Docs: connessioni ai remoti](https://docs.github.com/en/get-started/git-basics/about-remote-repositories)
- [Git: aggiungere, cambiare o rimuovere un remoto](https://git-scm.com/docs/git-remote)
- [Git: comportamento di fetch](https://git-scm.com/docs/git-fetch)
