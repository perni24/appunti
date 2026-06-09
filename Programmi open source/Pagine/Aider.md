---
date: 2026-06-09
area: Programmi open source
topic: Coding assistant da terminale
type: technical-note
status: "non revisionato"
difficulty: base
tags: [open-source, ai, coding, cli]
aliases: [aider, Aider]
prerequisites: []
related: []
---

# Aider

## Sintesi

**Aider** e uno strumento open source da terminale che usa modelli LLM per aiutare a modificare codice dentro un repository Git.

Serve come assistente di programmazione operativo: legge i file rilevanti, propone modifiche, applica patch e puo lavorare su bugfix, refactor, test e piccole feature.

## Quando usarlo

- Modificare codice restando nel terminale.
- Chiedere a un LLM di intervenire su file reali del repository.
- Generare patch controllabili con Git.
- Iterare su bug, test e refactor senza copiare manualmente blocchi di codice.
- Lavorare su progetti dove e importante vedere chiaramente le diff.

## Come funziona

Aider si collega a un modello LLM tramite provider configurato dall'utente e lavora nel contesto di una repository Git. L'utente indica cosa vuole ottenere e quali file sono rilevanti; lo strumento propone e applica modifiche che poi possono essere controllate con `git diff`.

## Esempio d'uso

```bash
# Avvia aider dentro una repository Git
aider

# Esempio di richiesta
Correggi il parsing degli argomenti CLI e aggiungi un test.
```

## Punti forti

- **Terminal-first**: si integra bene con workflow da shell.
- **Git-aware**: le modifiche restano controllabili come diff.
- **Utile per iterare**: adatto a correzioni e refactor guidati.
- **Flessibile**: puo essere usato con diversi modelli e provider supportati.

## Limiti

- Richiede configurazione di chiavi API o provider locali.
- Le modifiche vanno sempre revisionate.
- Su codebase grandi bisogna fornire contesto in modo selettivo.
- Non sostituisce test, review e comprensione del dominio.

## Checklist

- Lavorare dentro una repository Git pulita o con modifiche note.
- Controllare sempre `git diff` dopo le modifiche.
- Eseguire test e lint quando disponibili.
- Non passare segreti o file sensibili al modello.
- Dare richieste piccole e verificabili.

## Collegamenti

- [[Programmi open source/Indice programmi open source]]
