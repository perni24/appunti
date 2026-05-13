---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, browser, web-api, cors, fetch, security, http]
aliases: [Cross-Origin Resource Sharing, CORS JS]
prerequisites: [Fetch API, AJAX, Sicurezza]
related: [Fetch API, AJAX, Sicurezza, Browser Storage]
---

# CORS

CORS significa **Cross-Origin Resource Sharing**.

E un meccanismo di sicurezza del browser che decide se una pagina web puo leggere la risposta di una richiesta fatta verso una origine diversa.

Non e una protezione del server in senso assoluto: e una regola applicata dal browser. Un client non-browser, come `curl`, Postman o un backend, non e bloccato da CORS nello stesso modo.

---

## 1. Origine

Una origine e composta da:

- protocollo;
- dominio;
- porta.

```text
https://example.com:443
```

Questi URL hanno origine diversa:

```text
https://example.com
http://example.com
https://api.example.com
https://example.com:3000
```

Anche una piccola differenza tra protocollo, host o porta crea una origine diversa.

---

## 2. Same-Origin Policy

La **Same-Origin Policy** e la regola di base: una pagina puo leggere liberamente risorse della stessa origine, ma non puo leggere risposte da origini diverse senza permesso.

Esempio:

```text
Frontend: https://app.example.com
API:      https://api.example.com
```

Il browser considera queste due origini diverse.

Per permettere al frontend di leggere la risposta dell'API, il server deve inviare header CORS adeguati.

---

## 3. CORS non blocca la richiesta, blocca la lettura

Un punto importante: spesso la richiesta arriva comunque al server.

Il blocco CORS avviene quando il browser decide se rendere la risposta accessibile al codice JavaScript.

```js
const response = await fetch("https://api.example.com/users");
const users = await response.json();
```

Se il server non autorizza l'origine, il browser blocca il codice JS dal leggere la risposta.

---

## 4. Header Access-Control-Allow-Origin

L'header principale e `Access-Control-Allow-Origin`.

```http
Access-Control-Allow-Origin: https://app.example.com
```

Questo dice al browser:

```text
La pagina proveniente da https://app.example.com puo leggere questa risposta.
```

Per API pubbliche senza credenziali si puo usare:

```http
Access-Control-Allow-Origin: *
```

`*` significa "qualunque origine", ma non puo essere usato insieme a credenziali come cookie o header di autenticazione gestiti dal browser.

---

## 5. Simple request

Alcune richieste cross-origin sono considerate semplici.

Una richiesta semplice usa metodi come:

- `GET`;
- `HEAD`;
- `POST`.

E usa solo header consentiti automaticamente dal browser, con `Content-Type` limitato a valori semplici come:

- `text/plain`;
- `application/x-www-form-urlencoded`;
- `multipart/form-data`.

Esempio:

```js
await fetch("https://api.example.com/public-data");
```

Il browser invia direttamente la richiesta e poi controlla gli header CORS della risposta.

---

## 6. Preflight request

Quando una richiesta non e semplice, il browser fa prima una richiesta preliminare `OPTIONS`.

Questa richiesta si chiama **preflight**.

Esempio che causa preflight:

```js
await fetch("https://api.example.com/users", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer token",
  },
  body: JSON.stringify({ name: "Luca" }),
});
```

Il browser invia prima qualcosa del genere:

```http
OPTIONS /users HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type, authorization
```

Il server deve rispondere autorizzando metodo e header.

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

Solo dopo una preflight positiva il browser invia la richiesta reale.

---

## 7. Header principali

| Header | Direzione | Scopo |
| --- | --- | --- |
| `Origin` | Request | Indica l'origine della pagina che fa la richiesta |
| `Access-Control-Allow-Origin` | Response | Indica quali origini possono leggere la risposta |
| `Access-Control-Allow-Methods` | Response preflight | Indica i metodi HTTP ammessi |
| `Access-Control-Allow-Headers` | Response preflight | Indica gli header custom ammessi |
| `Access-Control-Allow-Credentials` | Response | Permette credenziali cross-origin |
| `Access-Control-Max-Age` | Response preflight | Indica per quanto tempo cacheare la preflight |
| `Access-Control-Expose-Headers` | Response | Espone header custom al codice JS |

---

## 8. CORS con credenziali

Per inviare cookie o credenziali cross-origin, il frontend deve impostare `credentials`.

```js
const response = await fetch("https://api.example.com/profile", {
  credentials: "include",
});
```

Il server deve rispondere con:

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

Con credenziali non si puo usare:

```http
Access-Control-Allow-Origin: *
```

Bisogna indicare una origine specifica.

---

## 9. Expose headers

Di default JavaScript puo leggere solo alcuni header di risposta.

Se il server vuole esporre header custom, deve usare `Access-Control-Expose-Headers`.

```http
Access-Control-Expose-Headers: X-Total-Count, X-Request-Id
```

Poi il frontend puo leggerli:

```js
const response = await fetch("/api/users");

console.log(response.headers.get("X-Total-Count"));
console.log(response.headers.get("X-Request-Id"));
```

Senza `Access-Control-Expose-Headers`, questi header potrebbero essere presenti nella risposta ma non leggibili dal codice JS.

---

## 10. CORS e fetch()

`fetch()` usa CORS automaticamente quando chiami una origine diversa.

```js
await fetch("https://api.example.com/data");
```

Alcune opzioni rilevanti:

```js
await fetch("https://api.example.com/data", {
  mode: "cors",
  credentials: "include",
});
```

`mode: "cors"` e il comportamento normale per richieste cross-origin.

`credentials: "include"` include cookie e credenziali anche verso origini diverse, se il server lo permette.

---

## 11. no-cors

`mode: "no-cors"` non risolve davvero gli errori CORS.

```js
const response = await fetch("https://api.example.com/data", {
  mode: "no-cors",
});

console.log(response.type); // "opaque"
```

Con `no-cors`, la risposta diventa **opaque**: il browser permette di fare la richiesta, ma il codice JavaScript non puo leggere status, header o body.

Va usato solo in casi specifici, per esempio inviare una richiesta senza bisogno di leggerne il risultato.

---

## 12. Configurazione lato server

CORS si risolve lato server, non lato frontend.

Esempio Express:

```js
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://app.example.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});
```

In produzione conviene evitare configurazioni troppo permissive.

Meglio usare una allowlist di origini consentite.

---

## 13. Proxy in sviluppo

Durante lo sviluppo si puo evitare CORS usando un proxy del dev server.

Esempio concettuale:

```text
Browser -> http://localhost:5173/api/users
Dev server -> https://api.example.com/users
```

Dal punto di vista del browser, la richiesta resta verso `localhost:5173`, quindi non appare cross-origin.

Questo e utile in sviluppo, ma non sostituisce una corretta configurazione CORS in produzione.

---

## 14. CORS e sicurezza

CORS non serve ad autenticare utenti.

CORS non rende una API privata.

CORS controlla solo quali origini possono leggere le risposte nel browser.

Se una API contiene dati sensibili, deve comunque usare:

- autenticazione;
- autorizzazione;
- validazione lato server;
- cookie sicuri;
- token gestiti correttamente;
- controlli CSRF quando necessari.

---

## 15. Errori comuni

### Missing Access-Control-Allow-Origin

Il server non sta autorizzando l'origine.

Soluzione: aggiungere `Access-Control-Allow-Origin` lato server.

### Method not allowed by Access-Control-Allow-Methods

La preflight chiede un metodo che il server non autorizza.

Soluzione: aggiungere il metodo a `Access-Control-Allow-Methods`.

### Request header field authorization is not allowed

Il frontend invia un header custom, ma il server non lo autorizza.

Soluzione: aggiungere l'header a `Access-Control-Allow-Headers`.

### Credentials flag is true but Allow-Origin is *

Il frontend usa credenziali, ma il server risponde con `*`.

Soluzione: usare una origine specifica e `Access-Control-Allow-Credentials: true`.

---

## 16. Checklist di debug

- Controlla l'URL: protocollo, dominio e porta sono diversi?
- Guarda la richiesta `OPTIONS` nel Network tab.
- Verifica se il server risponde alla preflight.
- Controlla `Access-Control-Allow-Origin`.
- Controlla `Access-Control-Allow-Methods`.
- Controlla `Access-Control-Allow-Headers`.
- Se usi cookie, controlla `credentials: "include"`.
- Se usi cookie, evita `Access-Control-Allow-Origin: *`.
- Verifica che il backend gestisca `OPTIONS`.
- Ricorda che il problema va risolto lato server.

---

## 17. Best practice

- Usa una allowlist di origini affidabili.
- Evita `*` su API private.
- Non usare `*` con credenziali.
- Rispondi correttamente alle richieste `OPTIONS`.
- Limita metodi e header a quelli necessari.
- Usa `Access-Control-Max-Age` per ridurre preflight ripetute.
- Non considerare CORS una forma di autenticazione.
- In sviluppo usa un proxy solo come comodita, non come soluzione di sicurezza.

---

## 18. Mappa mentale

```text
CORS
|
|-- Same-Origin Policy
|   |-- protocollo
|   |-- dominio
|   |-- porta
|
|-- richiesta semplice
|   |-- inviata direttamente
|   |-- controllo sulla risposta
|
|-- preflight
|   |-- OPTIONS
|   |-- verifica metodi
|   |-- verifica header
|
|-- credenziali
|   |-- credentials: include
|   |-- Allow-Credentials: true
|   |-- niente wildcard *
|
|-- debug
|   |-- Network tab
|   |-- header CORS
|   |-- configurazione server
```

---
