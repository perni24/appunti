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
  - tooling
  - import
aliases: []
prerequisites: []
related: []
---

# isort

## Sintesi

**isort** ordina automaticamente gli import Python secondo regole coerenti.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Uso base
```powershell
isort .
```
### Cosa fa
- Raggruppa import standard library, terze parti e locali.
- Ordina alfabeticamente.
- Applica wrapping coerente.
- Riduce diff inutili.
### Con Black
isort viene spesso configurato con profilo compatibile con Black.

```toml
[tool.isort]
profile = "black"
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Stile|Stile]]
- [[Programmazione/Python/Pagine/pre-commit|pre-commit]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv, pipx e poetry]]
