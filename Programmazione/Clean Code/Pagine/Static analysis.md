---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, tooling, static-analysis]
aliases: [Static analysis, Analisi statica]
prerequisites: [Linter, Type checking]
related: [Code quality gates, Complessita ciclomatica, Complessita cognitiva]
---

# Static analysis

## Sintesi

La **static analysis** analizza il codice senza eseguirlo per trovare errori, vulnerabilita, complessita, dead code, problemi di dipendenze o violazioni di regole architetturali.

E piu ampia del linting: puo includere sicurezza, qualita, tipi, metriche e dipendenze.

## Quando usarlo

- Prima di merge o release.
- In progetti con molti moduli.
- Quando vuoi controllare complessita e duplicazione.
- Quando devi individuare vulnerabilita note.
- Quando vuoi applicare regole architetturali.

## Come funziona

Gli strumenti di analisi statica costruiscono informazioni dal codice sorgente: AST, grafo delle dipendenze, tipi, flussi di dati o metriche.

Il risultato deve essere interpretato: non ogni warning e un bug, ma ogni warning ricorrente va governato.

## API / Sintassi

```text
static-analysis scan
static-analysis report
static-analysis fail-on-threshold
```

In CI si usano soglie e regole per decidere quando bloccare una modifica.

## Esempio pratico

```text
scan -> trova funzione con complessita alta -> review -> estrai responsabilita -> aggiungi test -> ripeti scan
```

L'analisi statica e un segnale per guidare il refactoring, non un giudice assoluto.

## Varianti

- Analisi di sicurezza.
- Analisi della complessita.
- Analisi dei tipi.
- Analisi delle dipendenze.
- Analisi architetturale.
- Analisi di duplicazione.

## Errori comuni

- Bloccare il team con regole troppo rumorose.
- Ignorare risultati fino a renderli inutili.
- Trattare metriche come obiettivi ciechi.
- Non distinguere codice nuovo e codice legacy.
- Non documentare eccezioni accettate.

## Checklist

- Le regole sono adatte al progetto?
- I falsi positivi sono gestiti?
- Le soglie sono realistiche?
- Il report distingue problemi nuovi e storici?
- Le eccezioni sono tracciate?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Linter]]
- [[Type checking]]
- [[Code quality gates]]
- [[Complessita ciclomatica]]
- [[Complessita cognitiva]]

## Fonti

- SonarSource Documentation
- CodeQL Documentation
- OWASP, *Static Application Security Testing*
