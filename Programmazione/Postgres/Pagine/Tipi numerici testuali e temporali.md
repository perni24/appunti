---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - tipi-di-dato
aliases:
  - Tipi numerici
  - testuali e temporali
prerequisites: []
related: []
---

# Tipi numerici, testuali e temporali

## Sintesi

PostgreSQL offre tipi numerici, testuali e temporali con semantiche diverse. Scegliere il tipo corretto evita sprechi, bug e conversioni inutili.

## Tipi numerici

- `integer`, `bigint`: interi.
- `numeric`: precisione arbitraria, utile per denaro e calcoli esatti.
- `real`, `double precision`: floating point.

## Tipi testuali

- `text`: scelta generale consigliata.
- `varchar(n)`: testo con limite.
- `char(n)`: lunghezza fissa, raramente utile.

## Tipi temporali

- `timestamp`: data e ora senza timezone.
- `timestamptz`: istante assoluto con gestione timezone.
- `date`, `time`, `interval`.

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
- [[Programmazione/Postgres/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]


