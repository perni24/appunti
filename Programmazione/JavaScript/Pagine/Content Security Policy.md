---
date: 2026-06-02
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

## Quando usarlo

Usa Content Security Policy quando una pagina web deve ridurre il rischio di XSS, caricamenti non autorizzati o esecuzione di script non previsti.

E utile per:

- applicazioni con login;
- dashboard e pannelli amministrativi;
- siti che renderizzano contenuti utente;
- applicazioni che gestiscono dati sensibili;
- progetti dove vuoi controllare origini di script, immagini, font e connessioni.

CSP non sostituisce escaping, sanitizzazione e validazione: aggiunge uno strato di difesa.

## Come funziona

### Concetto chiave
CSP riduce l'impatto di vulnerabilita come XSS, impedendo l'esecuzione di script non autorizzati.

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
```
### Direttive comuni
- `default-src`: fallback per le risorse.
- `script-src`: sorgenti consentite per JavaScript.
- `style-src`: sorgenti consentite per CSS.
- `img-src`: sorgenti consentite per immagini.
- `connect-src`: endpoint usabili da `fetch`, WebSocket e simili.
- `frame-ancestors`: controlla chi puo incorporare la pagina.
### Uso pratico
Una CSP efficace parte spesso in modalita report-only, poi viene irrigidita gradualmente.

```http
Content-Security-Policy-Report-Only: default-src 'self'; report-to csp-endpoint
```

## API / Sintassi

La policy si imposta di solito come header HTTP:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'
```

Direttive frequenti:

```text
default-src 'self'
script-src 'self' 'nonce-...'
style-src 'self'
img-src 'self' data: https:
connect-src 'self' https://api.example.com
frame-ancestors 'none'
object-src 'none'
base-uri 'self'
```

Per osservare senza bloccare:

```http
Content-Security-Policy-Report-Only: default-src 'self'
```

## Esempio pratico

Header iniziale abbastanza restrittivo:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

Per consentire chiamate API verso un dominio specifico:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; connect-src 'self' https://api.example.com; object-src 'none'
```

Prima di bloccare tutto in produzione puoi usare `Content-Security-Policy-Report-Only` per osservare violazioni senza interrompere l'app.

## Varianti

- **Header CSP**: applicato dal server, scelta preferibile.
- **Meta tag CSP**: utile solo in casi limitati, meno potente dell'header.
- **Report-only**: registra violazioni senza bloccare risorse.
- **Nonce**: autorizza singoli script inline generati dal server.
- **Hash**: autorizza script inline specifici se il contenuto non cambia.
- **Strict CSP**: policy basata su nonce/hash invece che allowlist estese.

## Errori comuni

- Usare `'unsafe-inline'` senza motivo.
- Rompere script legittimi perche mancano CDN o endpoint API in policy.
- Pensare che CSP sostituisca la sanitizzazione dell'input.

## Checklist

- Parti da `default-src 'self'`.
- Blocca `object-src` se non serve.
- Evita `unsafe-inline` e `unsafe-eval` quando possibile.
- Aggiungi `connect-src` per API e WebSocket necessari.
- Testa in report-only prima di applicare blocchi rigidi.
- Mantieni la policy aggiornata quando cambiano CDN, asset o integrazioni.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/Sanitizzazione input|Sanitizzazione input]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
