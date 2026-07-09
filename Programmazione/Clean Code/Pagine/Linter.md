---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: base
tags: [clean-code, tooling, linter]
aliases: [Linter, Code linter]
prerequisites: [Convenzioni di progetto]
related: [Formatter, Static analysis, Code quality gates]
---

# Linter

## Sintesi

Un **linter** analizza il codice per segnalare problemi di stile, errori probabili, pattern rischiosi e convenzioni non rispettate.

Nel Clean Code aiuta a spostare controlli ripetitivi dalla code review agli strumenti automatici.

## Quando usarlo

- Quando vuoi individuare bug semplici prima dei test.
- Quando il progetto ha convenzioni condivise.
- Quando vuoi evitare pattern noti come pericolosi.
- In editor, pre-commit e CI.
- Quando vuoi rendere le code review piu concentrate sul design.

## Come funziona

Il linter scansiona i file e applica un insieme di regole.

Alcune regole sono stilistiche, altre cercano bug o problemi di sicurezza. Le regole devono essere poche, utili e sostenibili.

## API / Sintassi

```text
linter check
linter fix
```

Molti linter possono correggere automaticamente una parte dei problemi.

## Esempio pratico

```text
1. esegui formatter
2. esegui linter con fix automatico
3. correggi manualmente i problemi rimasti
4. fai passare il controllo in CI
```

Formatter e linter hanno ruoli diversi ma complementari.

## Varianti

- Linter di stile.
- Linter di bug pattern.
- Linter di sicurezza.
- Linter specifici per framework.
- Linter con autofix.

## Errori comuni

- Attivare troppe regole non rilevanti.
- Ignorare warning fino a renderli rumore.
- Disabilitare regole senza motivo.
- Usare il linter come sostituto dei test.
- Mescolare formattazione e linting senza sapere quale strumento decide cosa.

## Checklist

- Le regole attive sono utili al progetto?
- I warning vengono trattati con disciplina?
- Le eccezioni sono motivate?
- Il linter gira in CI?
- Gli autofix sono separati dalle modifiche funzionali quando necessario?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Formatter]]
- [[Static analysis]]
- [[Code quality gates]]
- [[Pre-commit hooks]]

## Fonti

- ESLint Documentation
- Ruff Documentation
- Clippy Documentation
