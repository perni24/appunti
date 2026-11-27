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
  - clone
  - fork
  - template
  - repository
aliases:
  - Clone fork e template repository
  - Fork GitHub
  - Template repository
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Remote origin e upstream]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
title: Clone fork e template repository
---

# Clone fork e template repository

## Sintesi

La scelta dipende da due domande: **dove deve vivere la copia** e **deve condividere la storia del progetto originale**?

| Operazione | Risultato | Quando sceglierla |
| --- | --- | --- |
| Clone | Repository Git sul tuo computer, con un remoto verso la sorgente | Vuoi lavorare in locale. Non crea un nuovo repository su GitHub e non concede il diritto di push. |
| Fork | Nuovo repository su GitHub, collegato alla rete di fork dell’originale | Vuoi pubblicare un tuo branch e aprire una PR verso l’originale senza scrivervi direttamente. |
| Usa un template | Nuovo repository con i file iniziali selezionati ma senza la storia di commit del modello | Vuoi avviare un progetto indipendente; gli aggiornamenti del template non vengono incorporati automaticamente. |
| Scarica ZIP | I file a una certa revisione, senza `.git` | Ti serve solo leggere o usare una copia dei file. |

## Esempio: contribuire senza accesso in scrittura

Sul sito crea un fork del progetto e clona **il tuo** fork (sostituisci i segnaposto). Per un repository pubblico, la sola lettura via HTTPS non richiede un token:

```bash
git clone https://github.com/TUO-ACCOUNT/progetto.git
```

Entra nella cartella `progetto`. Nel clone normale Git ha creato `origin` con l’URL che hai usato. C’è normalmente un solo branch locale iniziale, quello estratto; `git branch --remotes` mostra invece i riferimenti ai branch remoti conosciuti dal clone.

Come **alternativa** ai due passaggi sul sito e nel terminale, da fuori del clone e con la CLI autenticata:

```bash
gh repo fork OWNER/progetto --clone
```

In entrambi i casi controlla `git remote -v` prima di aggiungere un eventuale `upstream`: la CLI può averlo già configurato. Crea un branch dedicato, registra il tuo cambiamento e pubblica il branch su `origin`. Nella PR scegli come **base** il progetto originale e come **head** il branch del fork. Una PR non concede accesso in scrittura all’originale.

## Quando il template è la scelta giusta

Per tre applicazioni con la stessa struttura iniziale, usa **Use this template** e crea tre repository indipendenti. Di norma basta il branch predefinito. Se includi tutti i branch del template, i branch generati hanno storie indipendenti tra loro: non è un modo per conservare la genealogia di sviluppo. Se invece vuoi restituire correzioni al progetto di partenza, scegli un fork.

## Controlli pratici

- HTTPS o SSH cambia il trasporto e l’autenticazione, non trasforma un clone in fork.
- Per usare `git push` occorrono credenziali valide **e** il permesso di scrivere sul destinatario. Un fork può essere personale o di un’organizzazione, se le regole lo consentono.
- Se l’originale avanza, il tuo fork non si aggiorna per il solo fatto di esservi collegato: sincronizzalo esplicitamente.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Remote origin e upstream|Remote origin e upstream]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]

## Fonti

- [GitHub Docs: clonare un repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
- [GitHub Docs: come funzionano i fork](https://docs.github.com/en/pull-requests/reference/forks)
- [GitHub Docs: generare un repository da un template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)
- [GitHub CLI: creare e clonare un fork](https://cli.github.com/manual/gh_repo_fork)
