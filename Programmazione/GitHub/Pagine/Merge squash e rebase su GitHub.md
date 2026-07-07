---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, git, merge, squash, rebase]
aliases: [Merge squash e rebase, Strategie di merge GitHub]
prerequisites: [Pull request]
related: [Branch su GitHub, Commit e cronologia su GitHub]
---

# Merge squash e rebase su GitHub

## Sintesi

GitHub offre diversi modi per unire una pull request:

- **merge commit**: conserva tutti i commit e crea un commit di merge;
- **squash merge**: comprime i commit della PR in un solo commit;
- **rebase merge**: riapplica i commit della PR sopra il branch base senza commit di merge.

La scelta influenza leggibilita della history, tracciabilita e facilita di rollback.

## Quando usarlo

Scegli consapevolmente la strategia quando:

- lavori in team;
- vuoi una history lineare;
- vuoi conservare tutti i commit intermedi;
- devi fare rollback semplice;
- vuoi mantenere PR piccole e leggibili;
- il repository ha regole precise di release.

## Come funziona

**Merge commit** mantiene la struttura dei branch. E utile quando vuoi vedere chiaramente che una PR e stata unita come unita logica.

**Squash merge** crea un solo commit su `main`. E utile quando i commit intermedi sono rumorosi o poco curati.

**Rebase merge** mantiene commit separati ma senza commit di merge. Richiede commit puliti e ordinati.

## API / Sintassi

Merge locale:

```bash
git switch main
git merge feature/nome-feature
```

Squash locale:

```bash
git switch main
git merge --squash feature/nome-feature
git commit -m "Aggiunge nuova feature"
```

Rebase del branch:

```bash
git switch feature/nome-feature
git fetch origin
git rebase origin/main
```

Su GitHub la scelta avviene dal pulsante di merge della pull request, se abilitata nelle impostazioni repository.

## Esempio pratico

PR con commit intermedi:

```text
WIP
fix typo
prova test
corregge validazione
```

In questo caso `squash merge` puo produrre una history piu utile:

```text
Corregge validazione del form di login
```

Se invece ogni commit e gia atomico e descrittivo, rebase o merge commit possono avere piu senso.

## Varianti

- **Merge commit**: massima tracciabilita del branch.
- **Squash merge**: history pulita, un commit per PR.
- **Rebase merge**: history lineare con commit separati.
- **Fast-forward**: possibile quando non ci sono divergenze.
- **Auto-merge**: GitHub unisce quando i controlli richiesti passano.

## Errori comuni

- Usare squash e perdere dettagli importanti dei commit.
- Usare rebase su branch condivisi senza coordinarsi.
- Fare merge con conflitti risolti frettolosamente.
- Non controllare il messaggio finale dello squash.
- Avere strategie diverse per ogni PR senza convenzione.
- Pensare che rebase e squash siano sempre "piu puliti" in ogni contesto.

## Checklist

- La strategia di merge e coerente con il repository?
- I commit intermedi sono utili o rumorosi?
- Il messaggio finale e chiaro?
- I controlli richiesti sono passati?
- La PR e aggiornata rispetto al branch base?
- Sai come fare rollback della modifica?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Branch su GitHub]]
- [[Commit e cronologia su GitHub]]
- [[Pull request]]
- [[Review code su GitHub]]

## Fonti

- [GitHub Docs - About merge methods](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github)
