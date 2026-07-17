---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, ci, quality-gates]
aliases: [Code quality gates, Quality gates]
prerequisites: [Formatter, Linter, Coverage]
related: [Static analysis, Pre-commit hooks, Codice pronto al deploy]
---

# Code quality gates

## Sintesi

I **code quality gates** sono controlli automatici che una modifica deve superare prima di essere accettata, fusa o rilasciata.

Servono a rendere ripetibili gli standard minimi di qualita.

## Quando usarlo

- In pull request.
- Prima del merge su branch principali.
- Prima di release o deploy.
- Quando vuoi evitare regressioni su test, lint, coverage o sicurezza.
- Quando il team cresce e la review manuale non basta.

## Come funziona

Un quality gate puo controllare:

- formatter;
- linter;
- type checking;
- test;
- coverage;
- static analysis;
- vulnerabilita;
- build;
- migrazioni o controlli specifici.

Il gate deve fallire con messaggi utili e azioni chiare.

## API / Sintassi

```text
format check -> lint -> typecheck -> test -> coverage -> static analysis -> merge allowed
```

La sequenza dipende dal progetto, ma deve essere automatica e riproducibile localmente.

## Esempio pratico

```text
Pull request bloccata se:
- formatter non passa
- typecheck fallisce
- test falliscono
- coverage sul codice nuovo scende sotto soglia
- static analysis trova vulnerabilita critica
```

Il gate protegge il branch principale.

## Varianti

- Gate locale in pre-commit.
- Gate su pull request.
- Gate su branch principale.
- Gate pre-release.
- Gate differenziale solo sul codice modificato.

## Errori comuni

- Creare gate lenti e rumorosi.
- Bloccare per warning non rilevanti.
- Non permettere riproduzione locale.
- Usare soglie uguali per codice legacy e codice nuovo.
- Ignorare eccezioni e override.

## Checklist

- I controlli sono veloci abbastanza?
- Gli errori sono comprensibili?
- Il gate distingue problemi nuovi e storici?
- Gli sviluppatori possono eseguire i controlli localmente?
- Le eccezioni sono tracciate?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Formatter]]
- [[Linter]]
- [[Type checking]]
- [[Coverage]]
- [[Static analysis]]
- [[Pre-commit hooks]]
- [[Codice pronto al deploy]]

## Fonti

- GitHub Actions Documentation
- SonarSource Documentation
- Martin Fowler, *Continuous Integration*
