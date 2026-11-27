---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - git
  - github
  - promemoria
  - repository
  - remote
aliases:
  - Cheatsheet repository GitHub
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Remote origin e upstream]]"
title: GitHub - Repository e remote
---

# GitHub - Repository e remote

## Iniziare oppure clonare

Scegliere **una** strada. Da una cartella di progetto nuova, creare il repository solo sul disco:

```powershell
git init -b main
```

Per lavorare su un repository già esistente, clonarlo invece dalla directory che conterrà il progetto. Sostituire `OWNER/REPO`; HTTPS e SSH sono alternative. Il clone configura già `origin`.

```powershell
git clone https://github.com/OWNER/REPO.git
```

```powershell
git clone git@github.com:OWNER/REPO.git
```

## Identità dei commit

Dentro il clone, impostare l'autore **solo per questo repository**. Non sono credenziali di accesso a GitHub.

```powershell
git config --local user.name "Nome Cognome"
```

```powershell
git config --local user.email "nome@example.com"
```

Per un default dell'utente usare `--global` al posto di `--local`. Per i futuri `git init` si può impostare `git config --global init.defaultBranch main`: non rinomina branch esistenti.

## Controllare prima di cambiare

```powershell
git status --short --branch
```

```powershell
git remote -v
```

Leggere la destinazione di push configurata senza contattare il server:

```powershell
git remote get-url --push origin
```

`git remote show origin` interroga anche il remoto; non prova che si possa scrivere.

## Cambiare la configurazione locale

**Aggiungere** `origin` se manca (per esempio dopo `git init`); se esiste già, **cambiarne** l'URL con il secondo comando. Nessuno dei due crea il repository su GitHub o invia commit.

```powershell
git remote add origin https://github.com/OWNER/REPO.git
```

```powershell
git remote set-url origin git@github.com:OWNER/REPO.git
```

In un fork, `origin` indica di solito la propria copia; `upstream` è un nome convenzionale per il progetto originale:

```powershell
git remote add upstream https://github.com/ORIGINAL-OWNER/REPO.git
```

```powershell
git fetch upstream
```

Il fetch aggiorna i riferimenti locali al remoto, non integra le modifiche nel branch corrente. Per rinominare o scollegare un remoto, scegliere solo l'operazione necessaria:

```powershell
git remote rename origin github
```

```powershell
git remote remove upstream
```

La rimozione cancella dal clone la configurazione e i riferimenti di tracciamento di quel remoto, **non** il repository su GitHub.

## Fonti

- [Git: inizializzazione](https://git-scm.com/docs/git-init)
- [Git: livelli di configurazione](https://git-scm.com/docs/git-config)
- [Git: gestione dei remote](https://git-scm.com/docs/git-remote)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Creare un repository GitHub|Creare un repository GitHub]]
- [[Programmazione/GitHub/Pagine/Clone fork e template repository|Clone fork e template repository]]
- [[Programmazione/GitHub/Pagine/Remote origin e upstream|Remote origin e upstream]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]

## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
