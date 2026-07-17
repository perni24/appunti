---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, tooling, formatter]
aliases: [Formatter, Code formatter]
prerequisites: [Convenzioni di progetto]
related: [Linter, Pre-commit hooks, Code quality gates]
---

# Formatter

## Sintesi

Un **formatter** applica automaticamente uno stile di formattazione al codice: indentazione, spazi, newline, ordine di alcuni elementi e convenzioni sintattiche.

Nel Clean Code serve a togliere discussioni manuali sullo stile e rendere il codice piu uniforme.

## Quando usarlo

- In progetti con piu sviluppatori.
- Quando vuoi ridurre diff rumorosi.
- Quando il linguaggio ha formattatori standard o molto diffusi.
- Prima di commit, pull request o build CI.
- Quando vuoi separare stile e contenuto nelle code review.

## Come funziona

Il formatter legge i file e li riscrive seguendo regole configurate o predefinite.

L'obiettivo non e creare lo stile perfetto, ma avere uno stile stabile e automatico.

## API / Sintassi

```text
formatter check
formatter write
```

In genere si usa una modalita di controllo in CI e una modalita di scrittura in locale.

## Esempio pratico

```text
prima del commit -> formatter write -> test/lint -> commit
CI -> formatter check -> fallisce se il codice non e formattato
```

La formattazione diventa parte del flusso normale.

## Varianti

- Formatter opinionated: poche opzioni, stile deciso dallo strumento.
- Formatter configurabile: molte opzioni di progetto.
- Formatter integrato nell'IDE.
- Formatter eseguito in pre-commit.
- Formatter eseguito in CI solo come controllo.

## Errori comuni

- Discutere manualmente regole gia automatizzabili.
- Cambiare configurazione spesso.
- Formattare tutto il repository insieme a una modifica logica.
- Non allineare IDE, pre-commit e CI.
- Usare formatter diversi nello stesso progetto.

## Checklist

- Il formatter e documentato nel progetto?
- IDE e CI usano la stessa configurazione?
- La formattazione viene controllata automaticamente?
- Le modifiche di sola formattazione sono separate da refactoring logici?
- Il team sa come eseguire il formatter localmente?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Convenzioni di progetto]]
- [[Linter]]
- [[Pre-commit hooks]]
- [[Code quality gates]]

## Fonti

- Prettier Documentation
- Black Documentation
- rustfmt Documentation
