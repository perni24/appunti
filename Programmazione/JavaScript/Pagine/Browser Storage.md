---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, browser, storage, localstorage, sessionstorage, indexeddb]
aliases: [Storage Browser, Web Storage]
prerequisites: [JSON, BOM]
related: [CORS, Sicurezza, Service Workers e PWA]
---

# Browser Storage

## Sintesi

Il browser offre diverse API per salvare dati lato client.

Le principali sono `localStorage`, `sessionStorage`, cookie, IndexedDB e Cache API.

---

## localStorage

`localStorage` salva coppie chiave-valore persistenti.

```js
localStorage.setItem("theme", "dark");

const theme = localStorage.getItem("theme");
```

I dati restano anche dopo la chiusura del browser, finche non vengono rimossi.

Limiti:

- solo stringhe;
- API sincrona;
- accessibile da JavaScript della stessa origine;
- non adatto a dati sensibili.

---

## sessionStorage

`sessionStorage` ha API simile, ma dura solo per la sessione della tab.

```js
sessionStorage.setItem("draft", "testo temporaneo");
```

E utile per dati temporanei legati alla pagina corrente.

---

## Cookie

I cookie vengono inviati automaticamente al server nelle richieste compatibili.

Sono utili per sessioni e autenticazione, ma vanno configurati correttamente.

Attributi importanti:

- `HttpOnly`;
- `Secure`;
- `SameSite`;
- `Expires` o `Max-Age`;
- `Path`;
- `Domain`.

Per token sensibili, preferire cookie `HttpOnly` quando l'architettura lo permette.

---

## IndexedDB

IndexedDB e un database client-side asincrono per dati strutturati e volumi piu grandi.

E adatto a:

- app offline;
- cache applicative;
- dati indicizzati;
- sincronizzazione differita.

Per dati semplici, `localStorage` puo bastare. Per dati grandi o complessi, IndexedDB e piu corretto.

---

## Cache API

La Cache API salva richieste e risposte HTTP.

E usata spesso con Service Worker.

```js
const cache = await caches.open("assets-v1");
await cache.add("/app.css");
```

Non e un database generico: serve principalmente per risorse e response.

---

## Errori comuni

- Salvare token sensibili in `localStorage`.
- Dimenticare che `localStorage` e sincrono.
- Non gestire quote e limiti di spazio.
- Usare cookie senza `Secure` e `SameSite`.
- Usare Cache API come sostituto generico di un database.

---

## Checklist operativa

- Usa `sessionStorage` per dati temporanei di tab.
- Usa `localStorage` per preferenze non sensibili.
- Usa IndexedDB per dati grandi o strutturati.
- Usa cookie sicuri per sessioni lato server.
- Non salvare segreti leggibili da JavaScript se puoi evitarlo.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/JSON|JSON]]
- [[Programmazione/JavaScript/Pagine/Service Workers e PWA|Service Workers e PWA]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
