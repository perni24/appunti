---
date: 2026-05-20
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - javascript
  - tooling
  - formattazione
aliases: []
prerequisites: []
related: []
---

# Prettier

## Sintesi

**Prettier** e un formatter automatico. Riscrive il codice secondo regole coerenti, riducendo discussioni manuali su spazi, indentazione, virgole e wrapping.

## Concetto chiave

Prettier non cerca di capire se il codice e corretto dal punto di vista logico. Il suo scopo e produrre formattazione consistente.

```powershell
npx prettier . --write
```

## Uso tipico

- Formattazione al salvataggio nell'editor.
- Check in CI.
- Hook pre-commit.
- Standard condiviso nel team.

## Esempio di configurazione

```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 100
}
```

## Rapporto con ESLint

[[Programmazione/JavaScript/Pagine/ESLint|ESLint]] segnala problemi di qualita e possibili bug. Prettier gestisce la forma del codice.

## Errori comuni

- Usare ESLint e Prettier con regole di formattazione in conflitto.
- Cambiare impostazioni spesso, generando diff rumorosi.
- Applicarlo a file generati.

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

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]


