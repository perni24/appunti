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
  - tooling
  - import
aliases: []
prerequisites: []
related: []
---

# isort

## Sintesi

**isort** ordina automaticamente gli import Python secondo regole coerenti.

## Uso base

```powershell
isort .
```

## Cosa fa

- Raggruppa import standard library, terze parti e locali.
- Ordina alfabeticamente.
- Applica wrapping coerente.
- Riduce diff inutili.

## Con Black

isort viene spesso configurato con profilo compatibile con Black.

```toml
[tool.isort]
profile = "black"
```

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
- [[Programmazione/Python/Pagine/Stile|Stile]]
- [[Programmazione/Python/Pagine/pre-commit|pre-commit]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv, pipx e poetry]]


