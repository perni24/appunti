---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - code-scanning
  - codeql
  - security
  - sast
aliases:
  - Code scanning
  - GitHub code scanning
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Required status checks]]"
related:
  - "[[Programmazione/GitHub/Pagine/Secret scanning]]"
  - "[[Programmazione/GitHub/Pagine/Required status checks]]"
title: Code scanning
---

# Code scanning

## Sintesi

**Code scanning** raccoglie risultati di analisi statica sul **sorgente**. Con CodeQL, per esempio, le query cercano nel codice situazioni che meritano una revisione. Un alert indica il file, la regola e il contesto da esaminare; non prova da solo che il difetto si manifesti in produzione. Per una dipendenza interessata da un advisory si parte invece da [[Programmazione/GitHub/Pagine/Dependabot|Dependabot]].

## Scegliere il setup

| Situazione | Scelta |
| --- | --- |
| Linguaggi supportati, nessuna esigenza particolare | **Default setup**: GitHub gestisce la configurazione. Controlla quali linguaggi ha selezionato e quando è terminata l’ultima analisi. |
| Occorrono trigger, build o query personalizzati | **Advanced setup**: mantieni un workflow nel repository. Per CodeQL scegli un solo percorso di configurazione: non sovrapporre il workflow al default setup. |
| Il progetto usa già un altro analizzatore | Se produce risultati compatibili **SARIF 2.1.0**, puoi caricarli in code scanning. Regole e copertura restano quelle dello strumento che li ha prodotti. |

Verifica disponibilità e permessi per il tipo di repository: GitHub.com offre code scanning nei repository pubblici; per quelli non pubblici contano il piano e l’abilitazione di GitHub Code Security.

## Esempio: workflow per JavaScript e TypeScript

Esempio di **advanced setup** per un repository pubblico con Actions attivo e branch predefinito `main`. Legge i sorgenti, non pubblica il sito e non richiede un token personale:

```yaml
name: CodeQL JavaScript e TypeScript
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v6
      - uses: github/codeql-action/init@v4
        with:
          languages: javascript-typescript
          build-mode: none
      - uses: github/codeql-action/analyze@v4
```

`push` stabilisce un riferimento sul branch principale; `pull_request` analizza le proposte dirette a quel branch. `security-events: write` consente di caricare i risultati. La modalità senza compilazione qui è scelta per JS/TS: per altri linguaggi occorre verificare le modalità supportate. Questo esempio non implica che CodeQL sia attivo nel vault.

## Come leggere un risultato

1. Identifica **strumento, linguaggio, branch e commit**. Un job verde dice che l’analisi si è conclusa, non che non abbia prodotto segnalazioni. Un linguaggio non analizzato non può essere dichiarato privo di problemi.
2. Apri la regola e le posizioni indicate; se lo strumento mostra un percorso dei dati, leggi origine, trasformazioni e destinazione nel contesto della modifica. Se correggi il codice, aggiungi un test sul comportamento atteso e controlla la nuova analisi sulla revisione corretta.
3. Se la segnalazione non si applica, documenta il motivo prima del *dismiss*. Per bloccare il merge in base ai risultati configura un **ruleset** con strumento richiesto e soglie di severità: è diverso dal rendere obbligatorio il solo completamento del job.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Required status checks|Required status checks]]
- [[Programmazione/GitHub/Pagine/Branch protection rules|Branch protection rules]]
- [[Programmazione/GitHub/Pagine/Secret scanning|Secret scanning]]

## Fonti

- [GitHub Docs: default setup, advanced setup e strumenti SARIF](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types)
- [GitHub Docs: prerequisiti dell’advanced setup](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configuring-advanced-setup-for-code-scanning)
- [CodeQL Action: versioni, permessi e modalità di build](https://github.com/github/codeql-action)
- [GitHub Docs: protezione del merge basata sui risultati](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/manage-your-configuration/set-merge-protection)
