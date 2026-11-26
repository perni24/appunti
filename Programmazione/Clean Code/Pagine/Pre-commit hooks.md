---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - git
  - pre-commit
aliases:
  - Pre-commit hooks
  - Hook pre-commit
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Formatter]]"
  - "[[Programmazione/Clean Code/Pagine/Linter]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Code quality gates]]"
  - "[[Programmazione/Clean Code/Pagine/Type checking]]"
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
title: Pre-commit hooks
---

# Pre-commit hooks

## Sintesi

Un hook `pre-commit` è un programma locale che Git invoca prima di creare un commit. Un esito non zero interrompe il commit. La domanda utile è **«ho controllato ciò che entrerà nel commit?»**: dopo uno staging parziale, il contenuto nell'indice può essere diverso dal file nella working tree.

## Esempio: controllare il diff preparato senza riscriverlo

In un repository di prova crea `.githooks/pre-commit` con terminatori LF. Git for Windows fornisce una shell compatibile con questo script; su Unix il file deve essere eseguibile nella working tree.

```sh
#!/bin/sh
exec git diff --cached --check
```

`--cached` confronta ciò che è nell'indice con `HEAD` (sul primo commit, con l'albero vuoto). `--check` segnala, tra l'altro, gli errori di whitespace introdotti nel diff secondo la configurazione Git. `exec` conserva il codice di uscita. Il comando **non** riformatta i file, non aggiunge modifiche allo staging, non analizza i segreti e non prova il comportamento applicativo.

Su Unix rendi eseguibile lo script:

```sh
chmod +x .githooks/pre-commit
```

Prepara lo script per il commit registrando il bit eseguibile anche nell'indice:

```sh
git add --chmod=+x -- .githooks/pre-commit
```

Solo nel repository in cui vuoi attivarlo, indica a Git dove cercare gli hook:

```sh
git config --local core.hooksPath .githooks
```

Questa impostazione locale cambia la directory per **tutti** gli hook del repository: prima controlla se il progetto usa già un gestore. Lo script versionato viene clonato, l'impostazione locale no. Non sostituire una configurazione esistente solo per provare l'esempio.

## Prova decisiva: indice contro working tree

1. Prepara nell'indice una riga nuova con spazi finali. Toglili nella working tree **senza** ripetere `git add`: il commit deve essere rifiutato perché lo snapshot preparato li contiene ancora.
2. Prepara la correzione. Se sporchi di nuovo **solo** la working tree, il controllo sul diff preparato passa; quella modifica locale non entra nel commit.
3. Dopo una correzione automatica di un altro strumento, guarda il diff staged prima di aggiungerlo. Un `git add` indiscriminato può includere anche modifiche che avevi scelto di lasciare fuori.

## Limiti

L'hook può non essere installato e non controlla la storia o le righe invariate. Tieni locali i controlli veloci e ripeti in CI quelli necessari per il merge. Un framework come `pre-commit` aiuta a distribuire versioni e configurazioni, non sostituisce la verifica sul server.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Formatter|Formatter]]
- [[Programmazione/Clean Code/Pagine/Linter|Linter]]
- [[Programmazione/Clean Code/Pagine/Code quality gates|Code quality gates]]
- [[Programmazione/Clean Code/Pagine/Type checking|Type checking]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]

## Fonti

- Git Documentation, *Hooks*
- pre-commit Documentation
- GitHub Actions Documentation
- [Git: pre-commit e directory degli hook](https://git-scm.com/docs/githooks)
- [Git: diff --cached e --check](https://git-scm.com/docs/git-diff)
