---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, security, csrf]
aliases: [CSRF, Cross-Site Request Forgery]
prerequisites: []
related: []
---

# CSRF

## Sintesi

CSRF e un attacco in cui un sito malevolo induce il browser dell'utente autenticato a inviare una richiesta verso un altro sito. Il rischio riguarda soprattutto sessioni basate su cookie inviati automaticamente.

React non risolve CSRF da solo: la protezione e principalmente lato backend e configurazione cookie.

## Quando usarlo

Devi considerare CSRF se l'app usa cookie di sessione, mutazioni HTTP e autenticazione browser-based.

## Come funziona

Un form o script su un dominio malevolo puo provare a inviare una richiesta al tuo backend. Se il browser include automaticamente cookie validi, il server potrebbe interpretarla come azione dell'utente.

## API / Sintassi

Mitigazioni comuni:

```text
SameSite cookies
CSRF token
controllo Origin/Referer
metodi HTTP corretti
autorizzazione server-side
```

Invio token:

```jsx
await fetch("/api/transfer", {
  method: "POST",
  headers: {
    "X-CSRF-Token": csrfToken,
  },
});
```

## Esempio pratico

Il frontend legge un token fornito dal server e lo invia nelle richieste mutative. Il backend verifica che token, sessione e origine siano coerenti prima di eseguire l'azione.

## Varianti

- **SameSite=Lax/Strict**: riduce invio cross-site.
- **CSRF token per sessione**: inviato con header o form.
- **Double-submit cookie**: pattern specifico.
- **Origin check**: utile per richieste moderne.
- **Token bearer non automatici**: riducono CSRF ma aumentano rischio XSS se salvati male.

## Errori comuni

- Pensare che SPA significhi niente CSRF.
- Usare cookie auth senza SameSite.
- Non proteggere endpoint mutativi.
- Confondere CSRF e XSS.
- Fidarsi solo del frontend.
- Esporre token CSRF in modo incoerente.

## Checklist

- L'autenticazione usa cookie?
- I cookie hanno SameSite e Secure?
- Gli endpoint mutativi verificano token/origine?
- Il backend rifiuta metodi non previsti?
- XSS e CSRF sono trattati separatamente?
- Il frontend invia token dove richiesto?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Gestione Autenticazione]]
- [[Protezione XSS]]
- [[Content Security Policy]]
- [[API layer]]
