---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - browser
  - web-api
  - cors
  - fetch
  - security
  - http
aliases:
  - Cross-Origin Resource Sharing
  - CORS JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/AJAX]]"
  - "[[Programmazione/JavaScript/Pagine/Sicurezza]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/AJAX]]"
  - "[[Programmazione/JavaScript/Pagine/Sicurezza]]"
  - "[[Programmazione/JavaScript/Pagine/Browser Storage]]"
title: CORS
---

# CORS

## Sintesi

**Cross-Origin Resource Sharing** e il protocollo con cui un server consente al browser di rendere una risposta cross-origin accessibile al codice della pagina. Si basa su header HTTP e, in alcuni casi, su una richiesta preliminare **preflight**.

Ricorda tre eventi distinti: **invio della richiesta**, **esecuzione sul server**, **lettura della risposta da JavaScript**. Un errore CORS non prova che i primi due non siano avvenuti. curl, Postman e Fetch di Node non applicano la Same-Origin Policy del browser: CORS non autentica utenti ne rende privata una API.

## Quando usarlo

- Frontend e API hanno origini diverse, anche soltanto per la porta locale.
- Il browser mostra un errore CORS, ma una prova con curl riesce.
- Devi usare cookie, Authorization o header di risposta personalizzati.
- Devi distinguere un preflight fallito da una risposta HTTP non leggibile.

## Come funziona

### Origin non significa site

L'origine e la terna **schema, host, porta effettiva**. Percorso, query e frammento non ne fanno parte; una porta predefinita esplicita non crea una nuova origine:

```js
const first = new URL("https://example.com/a").origin;
console.log(first === new URL("https://example.com:443/b?q=1").origin); // true
console.log(first === new URL("http://example.com").origin); // false
console.log(first === new URL("https://api.example.com").origin); // false
console.log(first === new URL("https://example.com:3000").origin); // false
```

`https://app.example.com` e `https://api.example.com` sono cross-origin ma normalmente same-site. SameSite dei cookie non e sinonimo di same-origin. Anche `localhost` e `127.0.0.1` sono host diversi: usa coerentemente quello configurato.

La Same-Origin Policy limita la condivisione fra origini; non impedisce universalmente navigazioni, form, immagini o ogni tipo di incorporamento. Qui ci concentriamo su Fetch/XHR. Origini opache, per esempio alcuni iframe sandboxed e documenti locali, possono essere serializzate come `null`: non aggiungerle alla allowlist per far sparire un errore.

### Senza preflight: invio prima del controllo della risposta

Una richiesta detta informalmente **semplice** puo partire direttamente. Sono necessari un metodo GET, HEAD o POST e header/valori che rispettino la CORS safelist; non basta scegliere POST.

| Caso cross-origin | Preflight normalmente necessario? |
| --- | --- |
| GET senza header applicativi particolari | No |
| POST con URLSearchParams o FormData, senza header aggiuntivi non ammessi | No |
| POST con Content-Type application/json | Si |
| GET con Authorization o X-CSRF-Token | Si |
| PUT, PATCH, DELETE | Si |

La safelist comprende, con vincoli sui valori e sulla lunghezza, Accept, Accept-Language, Content-Language, Content-Type e Range con un singolo intervallo. Per Content-Type sono ammessi i MIME essenziali `text/plain`, `application/x-www-form-urlencoded` e `multipart/form-data`. Esistono ulteriori condizioni, per esempio upload listener XHR e corpi ReadableStream. Con FormData lascia al browser il boundary; non impostare manualmente Content-Type.

Il tipo della **risposta** non decide se fare preflight: un GET che riceve JSON puo essere semplice. Nemmeno `credentials: "include"` da solo forza OPTIONS.

Se il server non autorizza l'origine della richiesta semplice, Fetch rifiuta la Promise invece di consegnare una Response leggibile. Il server puo comunque avere ricevuto cookie, elaborato dati o effettuato una modifica: e uno dei motivi per cui serve una protezione CSRF distinta.

### Con preflight: verifica prima della richiesta applicativa

Per una richiesta PUT con JSON e Authorization, il browser puo inviare:

```http
OPTIONS /users HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: authorization, content-type
```

Una risposta valida del server potrebbe essere:

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: PUT
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600
Vary: Origin
```

OPTIONS dichiara i **nomi** degli header richiesti, non invia il bearer applicativo. Il preflight cross-origin non porta i cookie di sessione della richiesta reale: non proteggerlo con un middleware che pretende quella sessione. Valida invece origine, metodo e header richiesti; autentica e autorizza poi la richiesta applicativa.

Una risposta OPTIONS 2xx da sola non basta: devono essere corretti anche gli header. Se la verifica fallisce, la richiesta applicativa non parte. Se riesce, anche la **risposta finale**, comprese 401/403/500 per un'origine consentita, deve contenere gli header CORS necessari. Per credenziali include servono origine esplicita e Allow-Credentials su entrambe le risposte rilevanti.

La cache preflight e distinta dalla normale cache HTTP. Max-Age puo ridurre OPTIONS ripetuti, ma i browser applicano limiti propri: non assumere una durata identica ovunque. Un preflight non visibile a ogni chiamata puo essere gia in cache.

### Credenziali: invio e leggibilita non coincidono

| `credentials` di Fetch | Cookie/credenziali gestiti dal browser |
| --- | --- |
| `omit` | Non inclusi |
| `same-origin` (default) | Inclusi solo verso la stessa origine |
| `include` | Ammessi anche cross-origin, se compatibili con le altre policy |

`include` non supera Domain, Path, Secure, SameSite, scadenza o blocchi ai cookie di terze parti. La presenza di Allow-Credentials non crea un cookie ne obbliga il browser a inviarlo. Per una richiesta semplice l'invio puo avvenire **prima** che il browser scopra l'assenza di questo header nella risposta.

Con **modalita include**, anche se nessun cookie esiste, `Access-Control-Allow-Origin: *` non e valido: serve l'origine esatta e `Access-Control-Allow-Credentials: true`, con valore minuscolo `true`. Senza include, `*` puo essere appropriato per risorse intenzionalmente pubbliche.

Un header Authorization impostato esplicitamente dallo script e un caso distinto: `credentials: "omit"` non lo elimina. Richiede preflight e, secondo Fetch, Authorization deve essere elencato esplicitamente in Allow-Headers, anche quando `*` sarebbe valido per altri header. Non dedurre la sicurezza di un bearer dal valore di credentials.

**Compatibilita verificata il 7 ottobre 2026:** Chrome 154.0.8037.98 accetta ancora Authorization tramite wildcard con omit nella fixture locale. La distinzione e documentata anche nei [dati di compatibilita MDN](https://github.com/mdn/browser-compat-data/blob/main/http/headers/Access-Control-Allow-Headers.json). Non dipendere da questa divergenza: elenca Authorization esplicitamente e prova i browser di destinazione.

### Header e cache

| Header | Dove | Scopo |
| --- | --- | --- |
| Origin | Richiesta browser | Origine chiamante; non e una prova d'identita del client |
| Access-Control-Request-Method / Headers | Preflight browser | Metodo e nomi degli header previsti |
| Access-Control-Allow-Origin | Risposta | Una sola origine esatta oppure `*` nei casi ammessi |
| Access-Control-Allow-Methods / Headers | Risposta preflight | Metodi e header consentiti |
| Access-Control-Allow-Credentials | Risposta | Consente l'accesso con modalita include |
| Access-Control-Expose-Headers | Risposta finale | Rende leggibili header di risposta aggiuntivi |
| Access-Control-Max-Age | Risposta preflight | Durata richiesta della cache preflight |
| Vary: Origin | Risposta variabile per origine | Evita il riuso della variante di un'altra origine nelle cache HTTP |

Non usare liste separate da virgole o pattern come `https://*.example.com` in Allow-Origin. Per piu frontend seleziona **una** origine da una allowlist esatta. Non riflettere automaticamente qualsiasi Origin e non fare confronti con startsWith o suffissi permissivi.

Se gli header cambiano anche per Access-Control-Request-Method/Headers e una cache HTTP intermedia memorizza quelle risposte, considera anche quelle dimensioni in Vary; conserva sempre gli eventuali valori Vary gia presenti. Vary non sostituisce una policy di cache appropriata ai dati personali.

### Expose-Headers non riguarda le richieste same-origin

Per una Response CORS sono leggibili per default Cache-Control, Content-Language, Content-Length, Content-Type, Expires, Last-Modified e Pragma. Gli altri header richiedono esposizione esplicita, per esempio:

```http
Access-Control-Expose-Headers: X-Total-Count, X-Request-Id
```

Per una richiesta same-origin non serve questa autorizzazione agli header personalizzati. `Set-Cookie` resta un header vietato alla lettura da JavaScript nel browser, anche se lo elenchi in Expose-Headers. Con include usa nomi espliciti: `*` non ha il significato di wildcard.

## API / Sintassi

### Cosa puo decidere il frontend

Fetch usa normalmente `mode: "cors"` per URL cross-origin. Il client puo scegliere URL, metodo, header consentiti e credentials, ma non concedersi il permesso CORS aggiungendo Allow-Origin alla richiesta. Anche Origin e gli header del preflight sono gestiti dal browser.

`mode: "same-origin"` impedisce un Fetch verso un'altra origine. `mode: "no-cors"` limita metodi/header e restituisce una risposta opaca per una risorsa cross-origin: non e un aggiramento per leggere una API.

Esempio browser da eseguire soltanto con la demo locale descritta sotto:

```js
async function opaqueDemo() {
  const response = await fetch("http://127.0.0.1:9000/data", {
    mode: "no-cors",
    credentials: "omit",
  });
  return {
    type: response.type,       // opaque
    status: response.status,   // 0, non lo status HTTP reale
    ok: response.ok,           // false, non prova che il server abbia fallito
    body: await response.text(), // stringa vuota: contenuto non disponibile
  };
}
```

Rete, TLS, CSP, mixed content e altre policy possono bloccare anche una richiesta no-cors. Non usarla come conferma di successo di un'operazione.

## Esempio pratico

### API locale completa e intenzionalmente non autenticata

Demo in una **directory separata**, con Node.js e Python disponibili e porte 5173 e 9000 libere. Le due origini sono `http://127.0.0.1:5173` e `http://127.0.0.1:9000`: cross-origin per porta, ma same-site. Non usare dati o cookie reali.

File `api.mjs`. Il server dimostra la policy per GET/PUT su `/data`; **PUT non salva niente e ignora il corpo**. Non implementa utenti, sessioni o validazione applicativa. La allowlist e configurazione fidata del server, mai un parametro inviato dal client.

```js
import { createServer } from "node:http";

export function createDemoServer(allowedOrigins) {
  const origins = new Set(allowedOrigins);
  const allowedHeaders = new Set(["content-type", "x-demo"]);

  return createServer((req, res) => {
    req.resume(); // La demo non usa il corpo delle richieste.
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Vary", "Origin");
    const origin = req.headers.origin;

    if (origin !== undefined && !origins.has(origin)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (origin !== undefined) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Expose-Headers", "X-Request-Id");
    }
    if (req.url !== "/data") {
      res.writeHead(404);
      res.end();
      return;
    }

    const requestedMethod = req.headers["access-control-request-method"];
    if (req.method === "OPTIONS" && origin !== undefined && requestedMethod) {
      const requestedHeaders = (req.headers["access-control-request-headers"] ?? "")
        .split(",").map((name) => name.trim().toLowerCase()).filter(Boolean);
      if (!["GET", "PUT"].includes(requestedMethod) ||
          requestedHeaders.some((name) => !allowedHeaders.has(name))) {
        res.writeHead(403);
        res.end();
        return;
      }
      res.setHeader("Access-Control-Allow-Methods", "GET, PUT");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Demo");
      res.setHeader("Access-Control-Max-Age", "600");
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("X-Request-Id", "demo-1");
      res.end(JSON.stringify({ message: "CORS demo" }));
    } else if (req.method === "PUT") {
      res.writeHead(204);
      res.end();
    } else {
      res.setHeader("Allow", "GET, PUT, OPTIONS");
      res.writeHead(405);
      res.end();
    }
  });
}
```

File `start-api.mjs`:

```js
import { createDemoServer } from "./api.mjs";

const api = createDemoServer(["http://127.0.0.1:5173"]);
api.listen(9000, "127.0.0.1", () => console.log("API su http://127.0.0.1:9000"));
```

Avvia l'API nel primo terminale:

```sh
node start-api.mjs
```

Il ramo senza Origin serve anche i client non-browser: conferma che **questa non e autenticazione**. In una API privata aggiungi controlli reali prima della logica applicativa. In produzione preferisci il middleware CORS mantenuto del framework, configurato con la stessa policy esplicita; questo handler didattico non e un sostituto generale.

### Client cross-origin e header esposto

File `client.js`, funzioni esportate per la pagina della demo:

```js
export async function readDemo() {
  const response = await fetch("http://127.0.0.1:9000/data", {
    credentials: "include",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data === null || typeof data !== "object" ||
      Array.isArray(data) || typeof data.message !== "string") {
    throw new TypeError("Risposta inattesa");
  }
  return { message: data.message, requestId: response.headers.get("X-Request-Id") };
}

export async function writeDemo() {
  const response = await fetch("http://127.0.0.1:9000/data", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-Demo": "test" },
    body: JSON.stringify({ message: "demo" }),
  });
  if (response.status !== 204) throw new Error(`HTTP ${response.status}`);
}
```

File `index.html` della directory demo:

```html
<!doctype html>
<html lang="it">
<meta charset="utf-8">
<title>Demo CORS</title>
<body>
<pre id="output"></pre>
<script type="module">
  import { readDemo, writeDemo } from "./client.js";
  const output = document.querySelector("#output");
  try {
    const result = await readDemo();
    await writeDemo();
    output.textContent = JSON.stringify(result, null, 2);
  } catch {
    output.textContent = "Richiesta fallita: controlla Console e Network.";
  }
</script>
</body>
</html>
```

Nel secondo terminale servi solo la directory demo, **non il vault con note private**:

```sh
python -m http.server 5173 --bind 127.0.0.1
```

Apri `http://127.0.0.1:5173/`. Il risultato contiene `message: "CORS demo"` e `requestId: "demo-1"`. In Network osserva GET diretto e OPTIONS prima di PUT; non occorre un cookie reale per usare include. Interrompi entrambi i server con Ctrl+C. Se cambi porta, aggiorna anche URL e allowlist; non disabilitare le protezioni del browser.

La demo verifica comunicazione locale e header esposto, non HTTPS, autenticazione o cookie cross-site. Gli esempi sono stati provati con Node.js 24.14.0 e Chrome 154; altri browser o configurazioni richiedono verifica propria.

## Varianti

### Proxy di sviluppo e reverse proxy

Con `Browser -> frontend /api -> backend` il browser vede una richiesta same-origin; il proxy effettua la chiamata successiva. Un proxy locale non viene automaticamente incluso nel deploy statico di Quartz/GitHub Pages. In produzione occorre configurare un reverse proxy/backend, oppure CORS sulla API reale. Non usare proxy pubblici casuali per dati o credenziali.

### Diagnosi senza conclusioni affrettate

Un TypeError di Fetch puo significare CORS, rete, TLS, mixed content o CSP: il codice JS non riceve sempre il dettaglio. Un 404/500 con CORS corretto invece produce una Response con `ok: false`. Non ritentare automaticamente una scrittura soltanto perche la risposta non e leggibile.

## Errori comuni

| Sintomo | Verifica utile |
| --- | --- |
| Allow-Origin assente | Origine approvata? Header presenti anche su errori del backend/proxy? |
| OPTIONS 401 o redirect al login | Preflight intercettato erroneamente dal middleware di autenticazione? |
| Metodo/header non ammesso | Confronta Request-Method/Headers con la policy: autorizza solo cio che serve |
| include con wildcard | Sostituisci `*` con l'origine consentita e aggiungi Allow-Credentials true |
| Header personalizzato leggibile in Network, ma get restituisce null | Manca Expose-Headers sulla risposta cross-origin? |
| Cookie assente | Controlla credentials e vincoli del cookie; non e necessariamente un errore CORS |
| Funziona con curl, non nel browser | curl non collauda la Same-Origin Policy |

## Checklist

- Confronta origine della pagina e dell'API, compresi schema e porta.
- Controlla OPTIONS e risposta finale, oppure l'eventuale cache preflight.
- Verifica origine esatta, metodi, header richiesti/esposti e credentials.
- Prova un'origine non consentita e risposte applicative 401/403/500.
- Controlla cache/Vary, cookie, CSP, redirect e proxy senza allargare la policy alla cieca.
- Mantieni autenticazione, autorizzazione, validazione e CSRF separate da CORS.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AJAX|AJAX]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/Browser Storage|Browser Storage]]
- [[Programmazione/JavaScript/Pagine/Content Security Policy|Content Security Policy]]

## Fonti

- [Fetch Standard - CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [MDN - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [MDN - Request.credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials)
- [MDN - Access-Control-Allow-Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Credentials)
- [MDN - Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers)
- [MDN - Access-Control-Allow-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Headers)
- [MDN - Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [Node.js 24 - HTTP](https://nodejs.org/docs/latest-v24.x/api/http.html)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
