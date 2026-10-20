---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - react
  - security
  - csp
aliases:
  - Content Security Policy
  - CSP
prerequisites:
  - "[[Programmazione/React/Pagine/Protezione XSS|Protezione XSS]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Content Security Policy|CSP nel browser]]"
  - "[[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]"
title: Content Security Policy
---

# Content Security Policy

## Sintesi

La **Content Security Policy** (CSP) limita risorse ed esecuzione di codice nel browser. In React va progettata insieme a bundle, CSS, lazy loading, API e, quando presente, rendering server-side. Non e una prop da aggiungere ad App.

La policy viene consegnata con la **risposta HTML**. Non sanitizza contenuti, non autentica utenti e non sostituisce CSRF. Per direttive, fallback, hash e reporting generale vedi [[Programmazione/JavaScript/Pagine/Content Security Policy|CSP nel browser]]; qui il focus e l'integrazione con un'app React.

## Quando usarlo

- Limitare l'impatto di XSS e caricamenti non autorizzati.
- Controllare destinazioni delle connessioni e incorporamento in frame.
- Verificare che dipendenze e codice generato rispettino i vincoli del deploy.

Inventaria le risorse della build reale: una policy copiata da un altro progetto puo bloccare l'app oppure concedere troppo.

## Come funziona

### Scegliere il modello di pubblicazione

| Modello | Scelta e conseguenza |
| --- | --- |
| SPA statica con JS/CSS esterni | Allowlist di origini; non richiede HTML diverso a ogni richiesta |
| HTML dinamico | Nonce nuovo per risposta e stessi valori nei tag autorizzati |
| Script inline statici | Hash dei byte esatti, da rigenerare quando cambia la build |
| Framework SSR/streaming | Anche script bootstrap, chunk e stili generati devono essere autorizzati |

`script-src 'self'` consente script della stessa origine: non e una strict CSP e non rende sicuri upload eseguibili o dipendenze compromesse. Un nonce, invece, autorizza tag specifici. Con `'strict-dynamic'` si propaga la fiducia ai caricamenti dinamici del codice autorizzato: nei browser CSP3 l'allowlist host/self non restringe poi quegli script. Il loader non deve usare URL arbitrarie fornite dall'utente. [Script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src).

Il nonce non e il token CSRF e non va memorizzato in localStorage. Deve essere imprevedibile, generato sul server per ogni risposta e coerente con HTML/header. Non attribuirlo automaticamente a qualsiasi tag inserito nei contenuti.

## API / Sintassi

### Baseline per asset statici

Header illustrativo per soli file locali, senza CSS-in-JS, script inline, iframe, worker o asset data URL:

```http
Content-Security-Policy: default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
```

`connect-src` riguarda fetch/XHR/WebSocket, non autorizza le API server e non concede CORS. `form-action` riguarda l'invio dei form; `frame-ancestors` stabilisce chi puo incorporare la pagina, non quali iframe essa puo caricare. Quest'ultima direttiva non eredita default-src e non funziona in un meta. [Frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

Con Vite, controlla gli asset piccoli incorporati come data URL: puoi disabilitare questo comportamento con `build.assetsInlineLimit: 0` invece di aggiungere `data:` ovunque. `html.cspNonce` inserisce il valore configurato nei tag e nel meta usato dal runtime; **non genera da solo un nonce casuale per richiesta**. Il placeholder deve essere sostituito dal server anche nell'HTML. [Vite e CSP](https://vite.dev/guide/features.html#content-security-policy-csp).

## Esempio pratico

### Demo isolato: React CSR con nonce

Questo esempio usa Node ESM e un bundle React **client-side**: genera la shell HTML, non esegue SSR o hydration. Tre file sorgente e un CSS in una directory di prova, senza modificare la configurazione Quartz.

File `app.jsx`:

```jsx
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";

function App() {
  const [count, setCount] = useState(0);
  return (
    <main>
      <h1>React con CSP</h1>
      <button type="button" onClick={() => setCount(value => value + 1)}>
        Incrementa
      </button>
      <p role="status">Conteggio: {count}</p>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
```

File `app.css`, foglio esterno senza style inline:

```css
body { font-family: system-ui, sans-serif; margin: 1.5rem; }
button { font: inherit; padding: 0.5rem 1rem; }
```

File `csp-page.mjs`, codice esclusivamente server:

```js
import { randomBytes } from "node:crypto";

export function createReactPage() {
  const nonce = randomBytes(16).toString("base64");
  const policy = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    "script-src-attr 'none'",
    "style-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  return {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": policy,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
    body: `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>React con CSP</title>
  <link rel="stylesheet" href="/app.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="/app.js"></script>
</body>
</html>`,
  };
}
```

I 16 byte casuali forniscono 128 bit prima della codifica base64. L'unica interpolazione e generata internamente, non contiene input utente. `no-store` evita il riuso della shell con nonce: una CDN/cache richiede una strategia specifica, non una risposta congelata. [Node crypto](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback).

File `server.mjs`, route esplicite per non esporre il filesystem:

```js
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReactPage } from "./csp-page.mjs";

const assets = new Map([
  ["/app.js", [new URL("./dist/app.js", import.meta.url), "text/javascript"]],
  ["/app.css", [new URL("./dist/app.css", import.meta.url), "text/css"]],
]);

createServer(async (req, res) => {
  req.resume();
  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    return res.end();
  }
  if (req.url === "/") {
    const { headers, body } = createReactPage();
    res.writeHead(200, headers);
    return res.end(body);
  }
  const asset = assets.get(req.url);
  if (!asset) {
    res.writeHead(404);
    return res.end();
  }
  try {
    const body = await readFile(asset[0]);
    res.writeHead(200, {
      "Content-Type": asset[1],
      "X-Content-Type-Options": "nosniff",
    });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end("Asset non disponibile: controlla la build.");
  }
}).listen(8091, "127.0.0.1");
```

Nella directory di prova, con Node e npm disponibili, inizializza il progetto:

```sh
npm init -y
```

Installa le versioni usate nel demo e conserva il lockfile:

```sh
npm install --save-exact react@19.3.0 react-dom@19.3.0
```

Installa il bundler come dipendenza di sviluppo:

```sh
npm install --save-dev --save-exact esbuild@0.27.3
```

Compila JS e CSS; `--minify` senza override NODE_ENV genera il bundle React production:

```sh
npx --no-install esbuild app.jsx --bundle --minify --format=esm --outdir=dist
```

Avvia il server con porta 8091 libera:

```sh
node server.mjs
```

Apri `http://127.0.0.1:8091/`: il contatore deve funzionare. `onClick` di React registra un listener, non un attributo HTML onclick; non necessita di unsafe-inline. In Network controlla la risposta document, il nonce corrispondente e il suo cambio al reload. Il server e solo locale: niente TLS, autenticazione, compressione, fallback router o raccolta report.

## Varianti

### Report-only e verifica negativa

In staging puoi consegnare la policy sotto `Content-Security-Policy-Report-Only`: osserva violazioni ma **non blocca**. Configura un vero endpoint se vuoi raccogliere report; Console e report remoto non sono la stessa cosa. Un'altra policy in enforcement continua a bloccare. Un header o meta aggiuntivo non puo allentare una policy gia attiva. [Guida CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).

Per il demo, in una copia locale controllata inserisci prima di `</body>` uno script senza nonce che assegna un semplice flag. Deve essere bloccato con enforcement e funzionare con il solo report-only. Prova anche un nonce errato. **Non usare comandi eseguiti direttamente da DevTools come prova di CSP**: il contesto degli strumenti non equivale a uno script della pagina.

### CSS, Trusted Types e framework

- Gli style tag di CSS-in-JS richiedono una policy e un nonce CSS compatibili. Il nonce di script-src non autorizza automaticamente gli stili; verifica la libreria usata. Non dedurre dai soli style prop React che tutti i sink CSS si comportino allo stesso modo.
- Trusted Types e una protezione ulteriore per specifici sink DOM, non un sanitizer. Non abilitare `require-trusted-types-for 'script'` senza verificare framework, DOMPurify e policy applicative. Il demo non lo abilita.
- Per React streaming, `renderToPipeableStream` accetta `nonce` per gli script emessi: deve coincidere con l'header. Non basta autorizzare il bundle ignorando i bootstrap inline. [React server rendering](https://react.dev/reference/react-dom/server/renderToPipeableStream).
- Next.js integra la propagazione del nonce, ma richiede rendering dinamico secondo la sua guida: non e la stessa configurazione di un export statico, ISR o PPR. Le opzioni SRI sono distinte e dipendono dalla versione/bundler. [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy).
- HMR, WebSocket e strumenti di debug possono richiedere concessioni solo in sviluppo. Testa la build production con la policy production, inclusi chunk lazy, font, immagini e API: non trasferire unsafe-eval/unsafe-inline per far sparire gli avvisi.

## Errori comuni

- Aggiungere CSP soltanto alle API JSON, lasciando il documento HTML senza policy.
- Usare un nonce fisso nella build statica o cache con header e HTML incoerenti.
- Consentire script da qualsiasi origine o `data:` per risolvere problemi di asset.
- Confondere report-only con enforcement e frame-src con frame-ancestors.
- Credere che un tag meta supporti tutte le protezioni di un header HTTP.
- Testare soltanto la pagina iniziale, ignorando lazy route, stili dinamici e caricamenti successivi.

## Checklist

- Verifica l'header effettivo in Network, inclusi error page e route servite dal fallback.
- Distingui nonce per risposta da hash per contenuto e scegli un modello compatibile col deploy.
- Esegui prove positive e negative: app funzionante, script non autorizzato bloccato.
- Controlla CSS, chunk lazy, API, immagini, font, worker e frame realmente usati.
- Non considerare il successo di un contatore una certificazione di tutte le dipendenze.
- Mantieni prevenzione XSS, CSRF e autorizzazione: CSP e difesa aggiuntiva.

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Protezione XSS|Protezione XSS]]
- [[Programmazione/React/Pagine/CSRF|CSRF]]
- [[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]
- [[Programmazione/React/Pagine/API layer|API layer]]
- [[Programmazione/JavaScript/Pagine/Content Security Policy|Direttive, hash e reporting CSP]]
- [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]
- [[Programmazione/React/Pagine/Introduzione e Toolchain|Toolchain React]]

## Fonti

- [MDN: guida CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), [script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src) e [frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).
- [Vite: integrazione CSP](https://vite.dev/guide/features.html#content-security-policy-csp), [Next.js: CSP](https://nextjs.org/docs/app/guides/content-security-policy) e [React: renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream).
- [Node: randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback) e [esbuild: definizioni automatiche](https://esbuild.github.io/api/#define). Demo verificato con Node 24.14.0, React 19.3.0 ed esbuild 0.27.3; non e una configurazione applicata al sito degli appunti.
