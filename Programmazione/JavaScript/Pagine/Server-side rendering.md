---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - javascript
  - ssr
  - frontend
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/HTTP server|HTTP server]]"
  - "[[Programmazione/JavaScript/Pagine/Moduli|Moduli]]"
related:
  - "[[Programmazione/JavaScript/Pagine/SPA e routing lato client|SPA e routing lato client]]"
  - "[[Programmazione/JavaScript/Pagine/Sanitizzazione input|Sanitizzazione input]]"
title: Server-side rendering
---

# Server-side rendering

## Sintesi

Il **server-side rendering** (SSR) produce sul server l'HTML che il browser riceve. In questa nota indica il rendering in risposta a una richiesta; se l'HTML viene prodotto durante la build e poi distribuito come file, parliamo di **Static Site Generation** (SSG).

SSR non significa automaticamente React, hydration o assenza di JavaScript. Una pagina HTML con link e form puo funzionare senza script; un'applicazione puo invece aggiungere interazioni con JavaScript o idratare componenti di un framework. Sono decisioni distinte.

## Quando usarlo

Valuta SSR per contenuti che devono essere presenti nella prima risposta e dipendono dalla richiesta: per esempio ricerca, schede prodotto aggiornate o pagine personalizzate dopo l'autenticazione.

Per blog e documentazione che cambiano soltanto quando pubblichi, SSG spesso basta. Per una dashboard privata molto interattiva, CSR puo essere una scelta ragionevole: non significa che SSR sia vietato o inutile, ma il beneficio va confrontato con complessita e costi.

L'HTML iniziale aiuta crawler e anteprime che non eseguono JavaScript. Non garantisce indicizzazione o posizionamento: contano anche accessibilita del contenuto, status HTTP, metadata e direttive per i crawler. Google puo eseguire JavaScript, quindi CSR non equivale automaticamente a "non indicizzabile". [Google Search Central](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)

## Come funziona

### Richiesta, dati e HTML

Il percorso tipico e:

```text
GET /pagina -> route e autorizzazione -> dati -> rendering -> risposta HTML
                                                           |
                                                browser interpreta HTML
                                                           |
                                        eventuale JavaScript / hydration
```

Il server deve decidere status e header, non soltanto produrre markup. Una risorsa inesistente richiede normalmente 404; un errore interno non deve diventare una pagina di successo 200. I controlli di accesso avvengono **prima** di inserire dati riservati nella risposta.

Il codice condiviso deve poter funzionare senza DOM: `window`, `document` e `localStorage` non sono disponibili in Node. Sposta gli effetti del browser nell'entry client o nei punti del lifecycle previsti dal framework. Non usare un singleton mutabile per conservare "l'utente corrente": richieste concorrenti potrebbero condividere dati.

### Hydration e progressive enhancement

Con **hydration**, il framework collega stato e comportamento al DOM generato dal suo renderer server. In React, `hydrateRoot` richiede che il primo rendering client corrisponda a quello server: stessi dati e struttura. Non serve per idratare HTML arbitrario prodotto da un altro template.

Date formattate in fusi diversi, `Math.random()` durante il render, dati ricaricati troppo presto o markup invalido possono produrre mismatch. Usa uno snapshot iniziale coerente; il fatto che il browser corregga HTML invalido non rende corretta l'hydration. Nascondere gli avvisi non risolve il problema. [React: hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)

**Progressive enhancement** significa invece partire da HTML funzionante e aggiungere capacita opzionali. Collegare un listener a un pulsante non dimostra che sia avvenuta l'hydration di un framework. Il demo sotto usa questo approccio.

### Prestazioni: non una garanzia

SSR puo anticipare il contenuto visibile, ma il caricamento dei dati e il rendering aumentano il lavoro server e possono ritardare il primo byte. L'hydration puo richiedere altro JavaScript e altro lavoro CPU nel browser.

Misura separatamente TTFB, contenuto principale visibile (LCP), reattivita (INP), byte trasferiti e costo server. Una pagina gia leggibile non e necessariamente pronta a gestire ogni interazione. Confronta i risultati con SSG e CSR su rete e dispositivi realistici. [Rendering on the Web](https://web.dev/articles/rendering-on-the-web)

## API / Sintassi

Non esiste una API JavaScript universale per SSR. Un server puo usare un template, una libreria di componenti o un framework che coordina route, dati e asset.

| Strumento | Responsabilita | Limite da ricordare |
| --- | --- | --- |
| `node:http` | Ricevere richieste e inviare status, header e corpo | Non offre da solo template, autenticazione o escaping |
| Renderer di template | Trasformare dati in markup | L'encoding deve essere adatto al contesto |
| `renderToPipeableStream` di React | Produrre uno stream HTML in ambiente Node | Richiede l'integrazione con risposta, errori e asset |
| `hydrateRoot` di React | Collegare React al markup del suo renderer server | Il primo output client deve essere coerente |
| Framework SSR | Coordinare server, client, route e build | API e policy di cache dipendono dalla versione |

I renderer con Web Streams non hanno necessariamente le stesse API di quelli per stream Node. Segui il runtime previsto dal framework, senza copiare indiscriminatamente esempi Node in un edge runtime.

## Esempio pratico

### Un catalogo filtrabile senza framework

Demo didattico con **Node.js 24.14.0**, nessuna dipendenza npm. Non e un server da esporre direttamente in produzione.

Crea questi quattro file nella stessa directory:

```text
ssr-demo/
  render.mjs
  server.mjs
  client.js
  main.mjs
```

Contratto: `GET /?q=mouse` filtra tre nomi prodotto; `q` e opzionale, puo comparire una sola volta e ha al massimo 80 code unit UTF-16 prima del trim. Gli altri parametri vengono ignorati. Una ricerca senza risultati resta 200: e una ricerca riuscita, non una route inesistente. Non inserire informazioni sensibili nella query, che puo finire in cronologia e log.

### 1. Template e dati testuali

`render.mjs`:

```js
export function escapeHtml(value) {
  if (typeof value !== "string") {
    throw new TypeError("Expected a string");
  }
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => entities[char]);
}

export function renderCatalog({ query, products }) {
  const title = query ? `Catalogo: ${query}` : "Catalogo";
  const items = products
    .map((name) => `<li>${escapeHtml(name)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <form method="get" action="/">
      <label for="query">Cerca prodotti</label>
      <input id="query" name="q" maxlength="80" value="${escapeHtml(query)}">
      <button type="submit">Cerca</button>
    </form>
    <p role="status" id="result-status">Risultati: ${products.length}</p>
    <button id="sort" type="button" hidden>Ordina per nome</button>
    <ul id="products">${items}</ul>
    ${products.length === 0 ? "<p>Nessun prodotto trovato.</p>" : ""}
  </main>
  <script type="module" src="/client.js"></script>
</body>
</html>`;
}
```

Solo markup fisso viene composto come HTML; nomi e query sono testo. L'helper vale qui per nodi testuali HTML e attributi tra virgolette: **non** autorizza URL, non sanitizza HTML e non e un encoder per JavaScript, CSS o SQL.

### 2. Server HTTP

`server.mjs`:

```js
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { renderCatalog } from "./render.mjs";

const clientScript = readFileSync(new URL("./client.js", import.meta.url), "utf8");

async function defaultLoadProducts() {
  return ["Tastiera", "Monitor", "Mouse & tappetino"];
}

export function createApp({ loadProducts = defaultLoadProducts } = {}) {
  return createServer(async (req, res) => {
    const send = (status, body, type = "text/plain; charset=utf-8") => {
      if (res.destroyed) return;
      res.writeHead(status, {
        "Content-Type": type,
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; script-src 'self'; base-uri 'none'; " +
          "form-action 'self'; frame-ancestors 'none'",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    };

    try {
      // Il demo non usa corpi di richiesta.
      req.resume();
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.setHeader("Allow", "GET, HEAD");
        return send(405, "Metodo non consentito");
      }

      if (!req.url?.startsWith("/") || req.url.startsWith("//")) {
        return send(400, "Target non valido");
      }
      const url = new URL(req.url, "http://localhost");
      if (url.origin !== "http://localhost") {
        return send(400, "Target non valido");
      }
      if (url.pathname === "/client.js") {
        return send(200, clientScript, "text/javascript; charset=utf-8");
      }
      if (url.pathname !== "/") {
        return send(404, "Pagina non trovata");
      }

      const queries = url.searchParams.getAll("q");
      const rawQuery = queries[0] ?? "";
      if (queries.length > 1 || rawQuery.length > 80) {
        return send(400, "Ricerca non valida");
      }
      const query = rawQuery.trim();
      const allProducts = await loadProducts();
      if (
        !Array.isArray(allProducts) ||
        !allProducts.every((name) => typeof name === "string")
      ) {
        throw new TypeError("Expected an array of product names");
      }

      const products = allProducts.filter((name) =>
        name.toLowerCase().includes(query.toLowerCase()),
      );
      const html = renderCatalog({ query, products });
      send(200, html, "text/html; charset=utf-8");
    } catch {
      console.error("SSR request failed");
      send(500, "Errore interno");
    }
  });
}
```

`loadProducts` e una dipendenza asincrona con contratto `Promise<string[]>`; il default restituisce dati fittizi, non contatta un database. Query e risultati restano locali alla richiesta. Un errore del loader produce 500 generico; lo stack non viene inserito nella risposta.

Si legge **un file statico noto**, non un percorso derivato dalla URL. Lo script viene letto all'avvio: dopo aver modificato i file del demo riavvia il server. Le route ignote non ricevono il catalogo come fallback. `HEAD` calcola gli stessi header di `GET` ma non invia il corpo. Il limite HTML `maxlength` non sostituisce il controllo server.

La CSP e specifica di questo demo senza CSS, immagini o script inline; non copiarla in un framework senza verificare gli asset e lo streaming. `private, no-store` disabilita la memorizzazione HTTP delle risposte del demo, compreso lo script, per semplificare le prove: non e una strategia ottimizzata per un catalogo pubblico.

### 3. Interazione facoltativa nel browser

`client.js`:

```js
const button = document.querySelector("#sort");
const list = document.querySelector("#products");
const status = document.querySelector("#result-status");

if (button && list && status && list.children.length > 1) {
  button.addEventListener("click", () => {
    const items = [...list.children];
    items.sort((a, b) =>
      a.textContent.localeCompare(b.textContent, "it"),
    );
    list.append(...items);
    status.textContent = "Prodotti ordinati per nome";
  });
  button.hidden = false;
}
```

Il modulo sposta nodi gia presenti, senza ricreare markup dai nomi. Senza JavaScript rimangono lista e ricerca tramite form; il pulsante aggiuntivo resta nascosto. Questo e progressive enhancement, **non React hydration**.

### 4. Avvio e controllo

`main.mjs`:

```js
import { createApp } from "./server.mjs";

const server = createApp();
server.on("error", (error) => {
  console.error(error.code ?? "Avvio non riuscito");
  process.exitCode = 1;
});
server.listen(3000, "127.0.0.1", () => {
  console.log("http://127.0.0.1:3000/");
});
```

Dalla directory del demo:

```shell
node main.mjs
```

Apri `http://127.0.0.1:3000/`. Se la porta e occupata, cambia 3000 in `main.mjs`. Ferma il processo con Ctrl+C.

Controlli utili:

- Disabilita JavaScript e ricarica: i prodotti e la ricerca restano disponibili.
- Invia `mouse`: la risposta HTML contiene soltanto il prodotto corrispondente.
- Riabilita JavaScript e ricarica senza filtro: il pulsante ordina la lista.
- Apri `/non-esiste`: ottieni HTTP 404, non solo un messaggio in una risposta 200.
- Cerca `<b>test</b>`: compare come testo, non come elemento HTML.

Limiti: dati in memoria, nessuna autenticazione, paginazione, scrittura, TLS o gestione della cache applicativa. Il loader non ha qui deadline o cancellazione; con un database servono timeout espliciti, limiti dei risultati, gestione delle disconnessioni e shutdown. I default HTTP di Node non sono una deadline per tutto il lavoro applicativo. Per i dettagli di trasporto vedi [[Programmazione/JavaScript/Pagine/HTTP server|HTTP server]].

## Varianti

| Approccio | Quando viene prodotto l'HTML | Cosa cambia |
| --- | --- | --- |
| SSR per richiesta | Durante la richiesta, salvo cache | Richiede un runtime server |
| SSG | Durante la build | Distribuisce file; aggiornare i dati richiede una nuova generazione |
| Rigenerazione / revalidation | Secondo la policy del framework o della piattaforma | Non e una API standard JavaScript; freschezza e invalidazione vanno definite |
| Streaming SSR | Il server invia progressivamente parti della risposta | Richiede gestione di errori, backpressure e disconnessioni |
| Isole interattive | Parti della pagina ricevono JavaScript separatamente | Non coincide necessariamente con l'hydration dell'intera app |
| Edge rendering | In un runtime vicino all'utente | Posizione e API disponibili, non un diverso formato HTML |

### Streaming e Server Components

Con streaming, una volta inviati gli header non puoi cambiare liberamente status o fare un redirect HTTP. Per esempio un errore tardivo puo richiedere un fallback nel documento, non una nuova risposta 500. In React, `onShellReady` e `onShellError` distinguono la shell disponibile dall'errore prima dell'invio; vanno pianificati abort e gestione degli errori dopo l'avvio. Il demo sopra costruisce tutta la stringa **prima** di rispondere e non prova lo streaming. [React: renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)

I **React Server Components** descrivono componenti eseguiti fuori dall'ambiente client, anche in build: non sono sinonimo di SSR per richiesta. Il codice dei Server Components non viene spedito come componente da eseguire nel browser, mentre eventuali Client Components possono essere prerenderizzati e poi idratati. Il protocollo e l'integrazione dipendono dal framework. [React: Server Components](https://react.dev/reference/rsc/server-components)

### Quartz e GitHub Pages

In questo vault Quartz genera HTML durante la build: e un sito statico, anche se usa JavaScript nel browser per navigazione e ricerca. Il server Node del demo **non** gira su GitHub Pages; Actions puo eseguire Node per costruire file, ma non mantiene un backend SSR attivo.

Per SSR a ogni richiesta serve un hosting con runtime server/serverless appropriato. Pubblicare questa nota non esegue il codice in essa contenuto. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## Errori comuni

### Confondere escaping e serializzazione

Non interpolare dati esterni direttamente nel titolo o nel corpo HTML. L'encoding dipende dal contesto; un URL richiede anche una policy sul protocollo, mentre HTML ricco richiede sanitizzazione.

`JSON.stringify` da solo **non** rende sicuro JSON incorporato in un elemento `script`: una stringa contenente `</script>` puo terminare l'elemento durante il parsing HTML, anche con `type="application/json"`. Usa il serializzatore del framework adatto all'HTML; non applicare semplicemente l'helper HTML del demo al JSON, perche in quel contesto le entita HTML non vengono decodificate come testo ordinario. In alternativa servi JSON separato con il media type corretto.

Le props o i dati serializzati per il client sono visibili all'utente: non includere token server, credenziali o campi privati. La CSP e una difesa aggiuntiva, non sostituisce encoding e autorizzazione. [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [HTML Standard](https://html.spec.whatwg.org/multipage/scripting.html#restrictions-for-contents-of-script-elements)

### Riutilizzare una risposta privata

Una cache indicizzata solo per URL puo mescolare risposte di utenti, lingue o permessi differenti. Definisci quali dati entrano nella chiave e quali risposte non devono essere condivise; non memorizzare HTML autenticato in una cache pubblica per comodita.

`private` impedisce la memorizzazione nelle cache condivise ma permette quella privata; `no-store` vieta di memorizzare la risposta; `no-cache` consente la memorizzazione ma impone la validazione prima del riuso. Questi header non cancellano automaticamente vecchie cache e non sostituiscono le policy delle cache applicative. [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)

Altri errori frequenti:

- Credere che SSR elimini il costo del JavaScript client o garantisca performance migliori.
- Fare una seconda richiesta client con dati diversi prima dell'hydration.
- Usare globali mutabili per dati specifici di una richiesta.
- Renderizzare qualunque URL con 200 o nascondere un errore del backend dietro una pagina vuota.
- Usare `GET` per modifiche persistenti: il form del demo cerca soltanto.
- Esporre lo stack dell'errore nel documento o scaricare nel bundle moduli contenenti segreti.

## Checklist

- Ho scelto SSR, SSG o CSR per motivi misurabili, non per abitudine?
- I contenuti essenziali sono gia nella risposta HTML quando richiesto?
- Status, redirect e autorizzazioni vengono decisi prima dell'invio?
- Dati e stato per richiesta sono isolati?
- I dati inseriti nell'HTML hanno encoding adatto al contesto?
- L'eventuale hydration parte dallo stesso snapshot?
- La cache distingue dati pubblici e privati?
- Sono definiti timeout, errori, disconnessioni e limiti dei risultati?
- Ho provato JS disabilitato, connessione lenta e route inesistenti?
- L'hosting supporta il runtime necessario, oppure sto pubblicando soltanto file statici?

## Collegamenti

- [[Programmazione/JavaScript/Pagine/HTTP server|HTTP server]]
- [[Programmazione/JavaScript/Pagine/SPA e routing lato client|SPA e routing lato client]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/API REST|API REST]]
- [[Programmazione/JavaScript/Pagine/Sanitizzazione input|Sanitizzazione input]]
- [[Programmazione/JavaScript/Pagine/Content Security Policy|Content Security Policy]]
- [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG in React]]
- [[Programmazione/React/Pagine/Server Components|Server Components]]

## Fonti

- [Node.js 24.14.0: HTTP](https://nodejs.org/download/release/v24.14.0/docs/api/http.html): trasporto e risposte del demo.
- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web): terminologia e compromessi.
- [React: hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot), [renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream), [Server Components](https://react.dev/reference/rsc/server-components): concetti e contratti delle API, non dipendenze del demo.
- [Google Search Central](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): rendering e indicizzazione.
- [OWASP: XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) e [HTML Standard](https://html.spec.whatwg.org/multipage/scripting.html#restrictions-for-contents-of-script-elements): contesti di encoding e parsing degli script.
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control) e [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy): header.
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages): hosting statico.

Fonti consultate il 2026-10-13. Demo verificato con Node.js 24.14.0 e Chrome 155.0.8059.40; hydration React, RSC, streaming ed edge sono spiegati ma non eseguiti dal demo.

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
