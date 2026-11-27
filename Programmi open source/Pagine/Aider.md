---
date: 2026-07-14
area: Programmi open source
topic: Coding assistant da terminale
type: technical-note
status: non revisionato
difficulty: base
tags:
  - open-source
  - ai
  - coding
  - cli
aliases:
  - Aider
prerequisites: []
related: []
title: Aider
publish: true
---

# Aider

## Sintesi

Aider è un assistente di programmazione open source da terminale. Può modificare i file di un repository Git tramite il modello linguistico scelto dall’utente. È utile per interventi circoscritti, per esempio correggere un bug, rifattorizzare una funzione o aggiungere un test.

## Come funziona

Avvia Aider nel repository e indica i file su cui può intervenire. Se usi un provider remoto, il contesto inviato al modello può contenere codice: non includere credenziali o materiale che non puoi condividere. Un modello locale richiede invece un backend compatibile e configurato.

## Esempio pratico

Dalla radice di un repository di prova, con Aider installato e il modello configurato, controlla se ci sono modifiche preesistenti:

```bash
git status --short
```

Avvia la sessione indicando due file del progetto (sostituisci i percorsi con quelli reali):

```bash
aider src/cli.py tests/test_cli.py
```

Nella chat di Aider, non nella shell:

```text
Correggi il parsing degli argomenti CLI e aggiungi un test per un argomento mancante.
```

Per vedere cosa è cambiato dall’ultimo messaggio, usa il comando della chat:

```text
/diff
```

## Verifica e limiti

- **Con i commit automatici** (comportamento predefinito), `git diff` può essere vuoto: mostra le modifiche non preparate, non quelle già registrate. Se quello di Aider è l’ultimo commit, controllane messaggio e patch dalla shell:

```bash
git show HEAD
```

- **Per decidere tu quando registrare le modifiche**, avvia una sessione con `aider --no-auto-commits` partendo da un repository pulito. Prima del tuo commit controlla `git status`, `git diff` e gli eventuali nuovi file non tracciati.
- Esegui il test aggiunto e quelli esistenti. Una patch leggibile o un commit riuscito non dimostrano che il comportamento sia corretto.

## Collegamenti

- [[Programmi open source/Indice Programmi Open Source|Catalogo open source]]

## Fonti

- [Aider: integrazione con Git e commit automatici](https://aider.chat/docs/git.html)
- [Aider: comandi disponibili nella chat](https://aider.chat/docs/usage/commands.html)
- [Aider: modelli e provider supportati](https://aider.chat/docs/llms.html)
