---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: advanced
tags: [react, security, csp]
aliases: [Content Security Policy, CSP]
prerequisites: []
related: []
---

# Content Security Policy

## Sintesi

Content Security Policy e una policy HTTP che limita quali script, stili, immagini, font, frame e connessioni il browser puo caricare. Riduce impatto di XSS e caricamenti non autorizzati.

In React e utile soprattutto per proteggere bundle, API, asset e contenuti dinamici.

## Quando usarlo

Usa CSP in applicazioni esposte pubblicamente, app con dati sensibili, dashboard autenticate e prodotti dove XSS avrebbe impatto alto.

## Come funziona

Header concettuale:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
```

La policy viene inviata dal server e applicata dal browser.

## API / Sintassi

Direttive comuni:

```text
default-src
script-src
style-src
img-src
connect-src
frame-ancestors
object-src
base-uri
```

Report-only:

```text
Content-Security-Policy-Report-Only: ...
```

Utile per testare senza bloccare.

## Esempio pratico

Policy iniziale prudente:

```text
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
connect-src 'self' https://api.example.com;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
```

Va adattata a CDN, analytics, font e API realmente usati.

## Varianti

- **Report-only**: osserva violazioni.
- **Nonce/hash**: autorizza script specifici.
- **Strict CSP**: riduce dipendenza da allowlist.
- **frame-ancestors**: protegge da clickjacking.
- **connect-src**: limita API chiamabili.

## Errori comuni

- Aggiungere `'unsafe-inline'` senza motivo.
- Copiare policy generiche.
- Non testare in staging.
- Dimenticare asset, font o API.
- Non usare report-only in fase iniziale.
- Pensare che CSP sostituisca sanitizzazione.

## Checklist

- La policy e generata dal server?
- Script inline sono evitati o gestiti con nonce/hash?
- `connect-src` limita API attese?
- `object-src 'none'` e presente?
- La policy e testata in report-only?
- XSS e sanitizzazione restano gestiti?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Protezione XSS]]
- [[CSRF]]
- [[Gestione Autenticazione]]
- [[API layer]]
