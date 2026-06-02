---
date: 2026-06-02
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

## Quando usarlo

### Quando servono
- Performance molto alta.
- Binding a librerie C esistenti.
- Accesso a API di sistema.
- Ottimizzazione di hot path misurati.

## Come funziona

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

### Tradeoff
Le estensioni C possono essere molto veloci, ma aumentano complessita di build, distribuzione, debugging e compatibilita tra piattaforme.
### Alternative
- [[Programmazione/Python/Pagine/Cython|Cython]]
- `ctypes`
- `cffi`
- binding Rust con PyO3
- ottimizzazione Python pura

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
