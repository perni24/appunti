---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, code-scanning, codeql, security, sast]
aliases: [Code scanning, GitHub code scanning]
prerequisites: [Repository GitHub, Required status checks]
related: [Secret scanning, Required status checks]
---

# Code scanning

## Sintesi

**Code scanning** analizza il codice per trovare vulnerabilita e pattern rischiosi. Su GitHub puo usare CodeQL o strumenti esterni che caricano risultati in formato SARIF.

E una forma di controllo statico: aiuta a individuare problemi prima del deploy, ma non sostituisce test, review e threat modeling.

## Quando usarlo

Usalo quando:

- il repository contiene codice applicativo;
- vuoi trovare vulnerabilita note a livello sorgente;
- vuoi bloccare regressioni di sicurezza nelle PR;
- vuoi centralizzare alert in GitHub;
- vuoi integrare CodeQL o scanner SAST esistenti;
- lavori su repository pubblici o sensibili.

## Come funziona

Il code scanning puo essere configurato in modi diversi:

- setup predefinito, se disponibile;
- workflow GitHub Actions;
- CodeQL con configurazione avanzata;
- upload SARIF da strumenti terzi;
- integrazione con merge protection.

Gli alert appaiono nella sezione Security e possono essere collegati a pull request.

## API / Sintassi

Esempio workflow CodeQL semplificato:

```yaml
name: CodeQL

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
      - uses: github/codeql-action/analyze@v3
```

## Esempio pratico

Per un progetto web:

1. abilita code scanning;
2. esegui analisi su PR e `main`;
3. controlla alert nuovi;
4. correggi o triagia i falsi positivi;
5. usa required status checks solo quando il segnale e stabile;
6. documenta regole di dismiss.

## Varianti

- **CodeQL default setup**: configurazione rapida.
- **CodeQL advanced setup**: workflow personalizzato.
- **SARIF upload**: risultati da scanner esterni.
- **PR alerts**: alert mostrati durante pull request.
- **Merge protection**: blocco merge in base agli alert, dove configurato.

## Errori comuni

- Attivare scanner senza processo di triage.
- Ignorare alert perche ci sono falsi positivi.
- Bloccare merge con regole troppo rumorose.
- Non analizzare branch o linguaggi importanti.
- Non aggiornare query o scanner.
- Confondere code scanning con dependency scanning.

## Checklist

- Code scanning copre i linguaggi principali?
- Gli alert hanno owner?
- I falsi positivi sono dismissati con motivo?
- Le PR mostrano alert nuovi?
- I controlli obbligatori sono stabili?
- I risultati sono rivisti periodicamente?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Required status checks]]
- [[Branch protection rules]]
- [[Secret scanning]]

## Fonti

- [GitHub Docs - Code scanning](https://docs.github.com/en/code-security/concepts/code-scanning/code-scanning)
