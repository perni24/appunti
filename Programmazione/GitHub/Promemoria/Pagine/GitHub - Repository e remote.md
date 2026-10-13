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

## Configurazione utente

```powershell
git config --global user.name "Nome Cognome"
```

```powershell
git config --global user.email "email@example.com"
```

```powershell
git config --global init.defaultBranch main
```

## Inizializzare

```powershell
git init
```

```powershell
git status
```

## Clonare

```powershell
git clone https://github.com/owner/repository.git
```

```powershell
git clone git@github.com:owner/repository.git
```

## Elencare remote

```powershell
git remote -v
```

## Aggiungere origin

```powershell
git remote add origin https://github.com/owner/repository.git
```

## Modificare URL

```powershell
git remote set-url origin git@github.com:owner/repository.git
```

## Aggiungere upstream

```powershell
git remote add upstream https://github.com/original-owner/repository.git
```

```powershell
git fetch upstream
```

## Rimuovere o rinominare

```powershell
git remote rename origin github
```

```powershell
git remote remove upstream
```

## Informazioni remote

```powershell
git remote show origin
```

## Approfondimento

- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Creare un repository GitHub|Creare un repository GitHub]]
- [[Programmazione/GitHub/Pagine/Clone fork e template repository|Clone fork e template repository]]
- [[Programmazione/GitHub/Pagine/Remote origin e upstream|Remote origin e upstream]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
