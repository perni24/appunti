---
date: 2026-05-20
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - python
  - performance
  - c
aliases: []
prerequisites: []
related: []
---

# C extensions

## Sintesi

Le **C extensions** permettono di scrivere moduli Python in C o di collegare librerie native a Python.

## Quando servono

- Performance molto alta.
- Binding a librerie C esistenti.
- Accesso a API di sistema.
- Ottimizzazione di hot path misurati.

## Tradeoff

Le estensioni C possono essere molto veloci, ma aumentano complessita di build, distribuzione, debugging e compatibilita tra piattaforme.

## Alternative

- [[Programmazione/Python/Pagine/Cython|Cython]]
- `ctypes`
- `cffi`
- binding Rust con PyO3
- ottimizzazione Python pura

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]


