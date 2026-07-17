---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, testing, coverage]
aliases: [Coverage, Test coverage]
prerequisites: [Test unitari leggibili, Test di integrazione]
related: [Mutation testing, Code quality gates, Codice testabile]
---

# Coverage

## Sintesi

La **coverage** misura quanta parte del codice viene eseguita dai test.

E un indicatore utile, ma non misura da sola la qualita dei test: codice eseguito non significa comportamento verificato bene.

## Quando usarlo

- Quando vuoi individuare zone non coperte.
- Quando lavori su codice critico o legacy.
- Quando vuoi evitare regressioni nella copertura.
- Quando una pull request modifica logica importante.
- Quando vuoi guidare test aggiuntivi, non sostituire review.

## Come funziona

Gli strumenti di coverage eseguono i test e registrano quali righe, rami o funzioni sono stati attraversati.

Le metriche comuni sono:

- line coverage;
- branch coverage;
- function coverage;
- statement coverage.

## API / Sintassi

```text
test --coverage
coverage report
```

Il report mostra aree eseguite e non eseguite.

## Esempio pratico

```text
Coverage alta ma test debole:
- il test esegue una funzione
- non verifica il risultato importante

Coverage piu utile:
- il test copre il ramo
- verifica output, errori e side effects attesi
```

Il numero va interpretato insieme alla qualita delle asserzioni.

## Varianti

- Coverage per righe.
- Coverage per branch.
- Coverage differenziale sulla pull request.
- Coverage per file critici.
- Coverage combinata unit e integration test.

## Errori comuni

- Inseguire il 100% senza pensare al valore.
- Scrivere test senza asserzioni utili.
- Escludere file problematici senza motivo.
- Misurare solo unit test ignorando integrazione.
- Bloccare modifiche per soglie irrealistiche su legacy code.

## Checklist

- La coverage copre i rami importanti?
- I test verificano comportamento, non solo esecuzione?
- Le soglie sono realistiche?
- Il report evidenzia codice nuovo non coperto?
- Le esclusioni sono motivate?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Test unitari leggibili]]
- [[Test di integrazione]]
- [[Codice testabile]]
- [[Mutation testing]]
- [[Code quality gates]]

## Fonti

- Martin Fowler, *TestCoverage*
- Gerard Meszaros, *xUnit Test Patterns*
- Kent Beck, *Test Driven Development*
