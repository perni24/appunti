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
  - repository
  - git
aliases:
  - Repository GitHub
  - Repo GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Git e GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/README LICENSE e gitignore]]"
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
title: Repository GitHub
---

# Repository GitHub

## Sintesi

Un repository GitHub associa una storia Git a un proprietario (`owner/nome`), a una visibilità e a strumenti di collaborazione. Può contenere un’applicazione, una libreria, documentazione o più progetti correlati in un monorepo. Proprietario (persona oppure organizzazione) e visibilità (per esempio pubblica o privata) sono scelte distinte.

## Prima decisione: dove esiste già il progetto?

| Punto di partenza | Percorso |
| --- | --- |
| Su GitHub esistono già i file o il primo commit | Clona quel repository, poi modifica il clone. |
| Esistono solo i file o la storia locale | Crea su GitHub un repository **vuoto** e collegalo alla storia locale. |
| Servono una base riutilizzabile o un contributo all’originale | Scegli fra template e fork, non inizializzare un progetto indipendente per errore. |

## Esempio: pubblicare un progetto locale

Usa una cartella di prova con un `README.md` già scritto. Verifica la directory: se è già un repository con commit, **non ripartire da zero**, salta l’inizializzazione e usa il nome del branch esistente. Per un progetto nuovo:

```bash
git init -b main
```

```bash
git add -- README.md
```

```bash
git commit -m "Aggiunge il README iniziale"
```

Crea il repository su GitHub senza inizializzarlo con README, licenza o gitignore. Puoi farlo sul sito oppure con `gh repo create nome-repository --private` (richiede autenticazione e crea una risorsa remota). Copia l’URL effettivo. In un clone senza un remoto `origin`:

```bash
git remote add origin https://github.com/OWNER/REPO.git
```

Con accesso in scrittura, pubblica `main` e configura il tracciamento per i comandi successivi:

```bash
git push -u origin main
```

Se invece il progetto è nato sul server, il percorso alternativo è:

```bash
git clone https://github.com/OWNER/REPO.git
```

Con GitHub CLI l’equivalente è `gh repo clone OWNER/REPO`. Se sia la cartella locale sia il server hanno già un primo commit indipendente, un push può essere rifiutato. Non forzarlo: verifica le due storie; per pochi file è più semplice clonare il repository remoto e copiarvi le modifiche locali da registrare.

## Cosa mettere nel repository

```text
progetto/
  README.md
  LICENSE
  .gitignore
  src/
  tests/
  docs/
```

La struttura è indicativa. Il README spiega avvio e requisiti; la licenza chiarisce il riuso voluto; `.gitignore` esclude cache e output locali non tracciati. Per lavorare in team, chiarisci dove segnalare problemi, come proporre modifiche e quali controlli servono per il merge. Non includere credenziali, dipendenze ricostruibili o build per abitudine.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub|GitHub]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]
- [[Programmazione/GitHub/Pagine/README LICENSE e gitignore|README LICENSE e gitignore]]
- [[Programmazione/GitHub/Pagine/Clone fork e template repository|Clone fork e template repository]]

## Fonti

- [GitHub Docs: i repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
- [GitHub Docs: pubblicare codice già presente in locale](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
