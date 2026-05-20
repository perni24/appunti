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
  - sicurezza
  - browser
aliases: []
prerequisites: []
related: []
---

# Content Security Policy

## Sintesi

La **Content Security Policy** (CSP) e un meccanismo di sicurezza del browser che limita quali script, stili, immagini, font e connessioni possono essere caricati da una pagina.

## Concetto chiave

CSP riduce l'impatto di vulnerabilita come XSS, impedendo l'esecuzione di script non autorizzati.

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
```

## Direttive comuni

- `default-src`: fallback per le risorse.
- `script-src`: sorgenti consentite per JavaScript.
- `style-src`: sorgenti consentite per CSS.
- `img-src`: sorgenti consentite per immagini.
- `connect-src`: endpoint usabili da `fetch`, WebSocket e simili.
- `frame-ancestors`: controlla chi puo incorporare la pagina.

## Uso pratico

Una CSP efficace parte spesso in modalita report-only, poi viene irrigidita gradualmente.

```http
Content-Security-Policy-Report-Only: default-src 'self'; report-to csp-endpoint
```

## Errori comuni

- Usare `'unsafe-inline'` senza motivo.
- Rompere script legittimi perche mancano CDN o endpoint API in policy.
- Pensare che CSP sostituisca la sanitizzazione dell'input.

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
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/Sanitizzazione input|Sanitizzazione input]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]


