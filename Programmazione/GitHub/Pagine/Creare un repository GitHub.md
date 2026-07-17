---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [github, repository, procedura]
aliases: [Creare un repository GitHub, Nuovo repository GitHub]
prerequisites: [GitHub, Repository GitHub]
related: [README LICENSE e gitignore, Repository settings, Template organizzativi GitHub]
---

# Creare un repository GitHub

## Obiettivo

Creare un nuovo repository GitHub con nome, visibilita, file iniziali e impostazioni di base coerenti con lo scopo del progetto.

Una buona creazione iniziale evita molti problemi successivi: repository senza README, visibilita sbagliata, licenza assente, `.gitignore` mancante o ownership non chiara.

## Quando usarlo

Usa questa procedura quando:

- inizi un nuovo progetto;
- sposti un progetto locale su GitHub;
- crei un repository dentro un'organizzazione;
- vuoi partire da un template;
- vuoi preparare una base ordinata per CI, issue e pull request.

## Procedura

1. Scegli l'owner corretto: account personale o organizzazione.
2. Scegli un nome descrittivo e stabile.
3. Aggiungi una descrizione breve.
4. Decidi la visibilita: public, private o internal se disponibile.
5. Se esiste un template adatto, crea il repository dal template.
6. Se parti da zero, aggiungi README, `.gitignore` e LICENSE quando servono.
7. Crea il repository.
8. Clonalo in locale.
9. Aggiungi i primi file del progetto.
10. Configura impostazioni minime: default branch, features attive, accessi e branch protection se il repository e condiviso.

## Snippet

Creazione con GitHub CLI:

```bash
gh repo create OWNER/REPOSITORY --private --description "Descrizione breve"
```

Clone dopo la creazione:

```bash
git clone https://github.com/OWNER/REPOSITORY.git
cd REPOSITORY
```

Primo push da progetto locale:

```bash
git init
git remote add origin https://github.com/OWNER/REPOSITORY.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

## Adattamenti comuni

- **Repository personale**: va bene per studio, demo e progetti individuali.
- **Repository organizzazione**: preferibile per progetti di team o lavoro.
- **Repository da template**: utile se vuoi CI, struttura e file standard gia pronti.
- **Repository pubblico**: richiede piu attenzione a license, secret e dati sensibili.
- **Repository privato**: comunque non deve contenere secret in chiaro.

## Debug rapido

- Se non puoi creare repository nell'organizzazione, controlla i permessi di creazione.
- Se il push fallisce, verifica remote `origin` e autenticazione.
- Se hai creato README su GitHub e anche commit locali, potresti avere storie divergenti.
- Se il nome non e disponibile, controlla repository esistenti, archiviati o rinominati.
- Se il repository deve essere pubblico, controlla prima che non contenga secret o dati privati.

## Checklist finale

- Owner corretto.
- Nome descrittivo.
- Visibilita corretta.
- README presente.
- `.gitignore` coerente con linguaggio e tooling.
- LICENSE presente se il progetto e pubblico o open source.
- Remote locale configurato.
- Accessi e branch protection valutati.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[README LICENSE e gitignore]]
- [[Clone fork e template repository]]
- [[GitHub CLI]]
- [[Repository settings]]
- [[Template organizzativi GitHub]]

## Fonti

- [GitHub Docs - Creating a new repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
