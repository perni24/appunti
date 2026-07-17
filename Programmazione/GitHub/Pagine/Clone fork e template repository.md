---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [github, clone, fork, template, repository]
aliases: [Clone fork e template repository, Fork GitHub, Template repository]
prerequisites: [Repository GitHub]
related: [Remote origin e upstream, Pull request]
---

# Clone fork e template repository

## Sintesi

**Clone**, **fork** e **template repository** sono tre modi diversi di partire da un repository GitHub.

- `clone`: scarica una copia locale di un repository.
- `fork`: crea una copia su GitHub collegata al progetto originale.
- `template repository`: crea un nuovo repository indipendente partendo da una struttura esistente.

Scegliere il meccanismo giusto evita confusione su permessi, pull request e aggiornamenti futuri.

## Quando usarlo

Usa:

- **clone** quando vuoi lavorare localmente su un repository a cui hai accesso;
- **fork** quando vuoi contribuire a un progetto dove non puoi fare push diretto;
- **template** quando vuoi creare un nuovo progetto usando una base gia pronta;
- **download ZIP** solo per consultare file senza history Git.

## Come funziona

Il clone copia history e branch sul tuo computer:

```bash
git clone https://github.com/owner/repository.git
```

Il fork crea un repository nel tuo account. Di solito:

- il tuo fork diventa `origin`;
- il repository originale puo essere aggiunto come `upstream`;
- lavori su branch nel fork;
- apri una pull request verso il progetto originale.

Il template invece non mantiene un rapporto di fork. Serve per iniziare un nuovo progetto indipendente.

## API / Sintassi

Clone:

```bash
git clone https://github.com/owner/repository.git
```

Fork con GitHub CLI:

```bash
gh repo fork owner/repository --clone
```

Aggiungere upstream:

```bash
git remote add upstream https://github.com/original-owner/repository.git
git fetch upstream
```

Aggiornare il branch locale dal progetto originale:

```bash
git switch main
git fetch upstream
git merge upstream/main
```

## Esempio pratico

Contribuire a una libreria open source:

```bash
gh repo fork original/progetto --clone
cd progetto
git switch -c fix/errore-validazione

# modifica i file
git add .
git commit -m "Corregge validazione"
git push -u origin fix/errore-validazione
```

Poi apri una pull request dal tuo fork verso il repository originale.

## Varianti

- **Clone HTTPS**: semplice, usa credenziali/token.
- **Clone SSH**: comodo per sviluppatori abituali con chiavi SSH.
- **Fork personale**: utile per contributi esterni.
- **Fork interno a organizzazione**: utile per team con permessi separati.
- **Template repository**: utile per starter kit e standard di progetto.

## Errori comuni

- Fare fork quando basta clone.
- Usare template quando vuoi contribuire al progetto originale.
- Non configurare `upstream` dopo un fork.
- Lavorare su `main` del fork invece che su branch dedicato.
- Confondere pull request dal fork con push diretto.
- Dimenticare di sincronizzare il fork con il repository originale.

## Checklist

- Devi contribuire al progetto originale o creare un progetto nuovo?
- Hai permessi di push sul repository originale?
- `origin` punta al tuo fork o al repository principale?
- Hai configurato `upstream` se lavori da fork?
- Stai lavorando su un branch dedicato?
- La pull request ha base e compare corretti?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[Remote origin e upstream]]
- [[Git e GitHub]]

## Fonti

- [GitHub Docs - Cloning a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
- [GitHub Docs - About forks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/about-forks)
- [GitHub Docs - Creating a repository from a template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)
