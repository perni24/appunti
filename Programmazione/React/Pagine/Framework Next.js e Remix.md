---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - nextjs
  - remix
  - framework
aliases:
  - Next.js
  - Remix
  - Framework React
prerequisites:
  - "[[Programmazione/React/Pagine/React Router|React Router]]"
  - "[[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]"
related:
  - "[[Programmazione/React/Pagine/Server Components|Server Components]]"
  - "[[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]"
title: Framework Next.js e Remix
---

# Framework Next.js e Remix

## Sintesi

Un framework React integra routing, caricamento dati, build e strategie di rendering. Non sostituisce il dominio applicativo: database, permessi, validazione e osservabilita richiedono comunque decisioni esplicite.

Qui si confrontano **Next.js App Router 16.4.1** e **React Router Framework Mode 8.4.0**. Il riferimento a Remix riguarda **Remix v2**, il framework React da cui deriva il percorso di migrazione verso React Router v7 e poi v8. Il nuovo sito Remix presenta uno stack distinto, con un proprio modello UI: non applicare automaticamente a quel prodotto gli esempi `@remix-run/react` di v2.

## Quando usarlo

Sceglilo quando vuoi convenzioni condivise per URL, layout annidati, dati e distribuzione. SSR/SSG possono aiutare contenuto iniziale e indicizzazione, ma non garantiscono SEO o performance senza misure.

| Esigenza | Criterio di scelta |
| --- | --- |
| Contenuto pubblico poco variabile | Valuta prerender statico, costi e tempi di ricostruzione |
| Dati personali a ogni richiesta | Serve un runtime o API esterna con autorizzazione; SSR non e un controllo accessi |
| App con backend gia separato | SPA Vite con React Router puo bastare, anche oltre progetti piccoli |
| RSC e composizione server/client | Valuta l'integrazione App Router e i relativi confini |
| URL, loader e form come asse dell'app | Valuta i route module di React Router Framework Mode |

Non scegliere in base alla sola dimensione dell'app. Considera hosting, competenze, dipendenze, debugging e necessita reali di eseguire codice sul server.

## Come funziona

### Due modelli, non due nomi per le stesse API

In Next App Router le cartelle descrivono i segmenti URL e i file speciali definiscono pagina, layout, loading, errore ed endpoint. `page` e `layout` sono Server Components per default; i confini `"use client"` introducono interattivita. Il Pages Router e un altro modello: non mescolare `getServerSideProps` con le convenzioni di `app/`.

React Router Framework Mode aggiunge il plugin Vite e la build server/client ai concetti del router. Il `loader` server prepara dati, il componente route li riceve e viene anche idratato nel browser; **loader server non significa componente RSC**. Le API RSC del router sono ancora indicate come unstable nella documentazione 8.4.0 e non sono usate qui.

Su primo accesso SSR il browser riceve HTML e dati; nella navigazione migliorata il router richiede dati senza riscaricare tutto il documento. `clientLoader`/`clientAction` sono scelte esplicite per lavoro nel browser. Un loader in Data Mode con `createBrowserRouter`, invece, viene eseguito nel client: il nome da solo non identifica l'ambiente.

## API / Sintassi

Convenzioni Next App Router:

```text
app/
  layout.jsx
  page.jsx
  products/
    page.jsx
    [id]/
      page.jsx
      loading.jsx
      error.jsx
  api/products/
    route.js
```

`products/[id]` definisce il segmento dinamico; `route.js` espone handler HTTP, non una pagina UI. Per un progetto Next completo, con versioni e comandi, usa il [[Programmazione/React/Pagine/Server Components|catalogo RSC]]; per export statico e rendering per richiesta, [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]].

Convenzioni **Remix v2**, utili per leggere un progetto esistente:

```text
app/
  root.tsx
  routes/
    _index.tsx
    users.$id.tsx
```

In React Router Framework Mode l'esempio seguente registra invece esplicitamente le route in `app/routes.ts`. I nomi dei file non creano automaticamente URL; la convenzione file-based richiede l'integrazione dedicata. Non mischiare i vecchi import `@remix-run/*` con gli import della nuova major.

## Esempio pratico

### Catalogo filtrato con loader server

Progetto separato dal vault e dai demo Vite/Next. Usa Node **24.14.0**; `@react-router/dev` 8.4.0 richiede almeno Node 22.22. Il catalogo e locale, pubblico e di sola lettura: nessun database o salvataggio simulato.

`package.json`:

```json
{
  "name": "router-framework-notes-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "start": "react-router-serve ./build/server/index.js"
  },
  "dependencies": {
    "@react-router/node": "8.4.0",
    "@react-router/serve": "8.4.0",
    "isbot": "5.2.2",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "react-router": "8.4.0"
  },
  "devDependencies": {
    "@react-router/dev": "8.4.0",
    "vite": "8.3.4"
  }
}
```

`vite.config.js`: non aggiungere anche il normale plugin React del demo SPA.

```javascript
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
export default defineConfig({ plugins: [reactRouter()] });
```

`react-router.config.ts`:

```typescript
export default { ssr: true };
```

`app/routes.ts`:

```typescript
import { index } from "@react-router/dev/routes";
export default [index("routes/catalog.jsx")];
```

`app/root.jsx`: documento HTML comune, outlet e script di hydration. Gli entry point standard sono forniti dal framework; quello server usa anche `isbot`, dichiarato nelle dipendenze per evitare installazioni implicite durante la build.

```jsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./app.css";

export function Layout({ children }) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" href="data:," />
        <Meta /><Links />
      </head>
      <body>{children}<ScrollRestoration /><Scripts /></body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
```

`app/catalog.server.js`: il suffisso impedisce che il modulo finisca nel grafo client. Non protegge i campi restituiti dal loader: la proiezione esplicita resta necessaria.

```javascript
const records = [
  { id: "p1", name: "Taccuino", internalRef: "INTERNAL-CATALOG-A" },
  { id: "p2", name: "Penna", internalRef: "INTERNAL-CATALOG-B" },
];

export function searchCatalog(query) {
  const needle = query.toLowerCase();
  return records
    .filter((item) => item.name.toLowerCase().includes(needle))
    .map(({ id, name }) => ({ id, name }));
}
```

`app/routes/catalog.jsx`:

```jsx
import { Form, Link, isRouteErrorResponse, useNavigation } from "react-router";
import { searchCatalog } from "../catalog.server.js";

export function meta() {
  return [{ title: "Catalogo filtrabile" }];
}

export function loader({ request }) {
  const params = new URL(request.url).searchParams;
  const values = params.getAll("q");
  if (values.length > 1 || (values[0]?.length ?? 0) > 80) {
    throw new Response("Filtro non valido", { status: 400 });
  }
  const query = (values[0] ?? "").trim();
  return { query, products: searchCatalog(query) };
}

export default function Catalog({ loaderData }) {
  const { query, products } = loaderData;
  const busy = useNavigation().state !== "idle";
  return (
    <main>
      <h1>Catalogo pubblico</h1>
      <Form method="get" action="/" role="search">
        <label htmlFor="query">Cerca un prodotto</label>{" "}
        <input key={query} id="query" name="q" defaultValue={query} maxLength={80} />{" "}
        <button type="submit">Cerca</button>{" "}
        <Link to="/">Tutti</Link>
      </Form>
      <p role="status">{busy ? "Ricerca..." : (
        `${products.length} ${products.length === 1 ? "risultato" : "risultati"}`
      )}</p>
      {products.length === 0 ? <p>Nessun prodotto trovato.</p> : (
        <ul>{products.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
      )}
    </main>
  );
}

export function ErrorBoundary({ error }) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return (
    <main>
      <h1>Errore {status}</h1>
      <p role="alert">Impossibile caricare il catalogo.</p>
      <Link to="/">Torna al catalogo</Link>
    </main>
  );
}
```

`app/app.css`:

```css
body { margin: 24px; font-family: system-ui, sans-serif; color: #202020; background: #fff; }
main { max-width: 48rem; margin-inline: auto; overflow-wrap: anywhere; }
input, button { font: inherit; max-width: 100%; box-sizing: border-box; }
input, button, a { margin-block: .25rem; }
:focus-visible { outline: 3px solid #176b3a; outline-offset: 3px; }
```

Dalla root del demo, esegui separatamente:

```bash
npm install
```

```bash
npm run dev
```

Apri l'URL indicato dal terminale. Per la prova di produzione ferma lo sviluppo, poi:

```bash
npm run build
```

```bash
npm run start
```

Conserva il lockfile e usa `npm ci` per ripetere l'installazione. I pin descrivono l'esempio verificato, non una ragione per ignorare aggiornamenti di sicurezza.

### Cosa verificare

- `/?q=pen` restituisce solo Penna; il reload mantiene il filtro perche e nell'URL.
- Cerca un valore assente: zero risultati e uno stato valido, non un errore 404.
- Indietro e Tutti ripristinano la ricerca. La `key` dell'input lo rimonta quando cambia il filtro confermato; la bozza non e un secondo stato sincronizzato con l'URL.
- `/?q=a&q=b` riceve HTTP 400 su accesso diretto, gestito dal boundary della route. Il limite HTML non sostituisce il controllo nel loader.
- Senza JavaScript il form GET continua a funzionare con navigazione del documento. Dopo hydration il router migliora l'interazione: non e obbligatorio trasformare tutto in handler `onSubmit`.
- Il modulo server contiene `internalRef`, ma HTML, dati serializzati e bundle client devono esporre solo `id` e `name`. La separazione dei moduli non autorizza a restituire l'intero record.

Il GET e intenzionalmente senza effetti di scrittura. Non mettere segreti nei filtri URL; cronologia e log possono conservarli. `useNavigation` indica il lavoro del router, non ogni fetch dell'app, e una risposta locale veloce puo rendere il messaggio di attesa quasi impercettibile.

## Varianti

### Mutazioni e cache

In React Router Framework Mode un `<Form method="post">` puo invocare l'export `action` server della route; `fetcher.Form` consente un invio senza navigazione. Dopo una action il router normalmente rivalida i dati interessati. `clientAction` e invece codice client. Sono contratti diversi dalle Actions React e dalle Server Functions di Next: non sono nomi intercambiabili.

Nel demo non esiste una action: un POST non salva niente. Per aggiungerla servono parsing, validazione server, autenticazione/autorizzazione quando richieste, gestione CSRF e concorrenza, oltre a persistenza reale. Non scambiare la rivalidazione del loader con una transazione del database.

In Next cache dei dati, output della route e stato client sono livelli diversi; le impostazioni cambiano fra versioni e modalita. Specifica la politica richiesta e verifica build/navigazione/invalidation, senza assumere che ogni `fetch` sia sempre memorizzato o sempre fresco. Il [[Programmazione/React/Pagine/Data Fetching e Cache|data layer client]] ha a sua volta regole proprie.

### Hosting e alternative

Next supporta runtime server oppure export statico con limitazioni. React Router supporta SSR, prerender di URL selezionati e SPA. Il demo usa SSR e un loader a ogni richiesta: **non basta copiare `build/client` su GitHub Pages** per conservarne il comportamento. Una conversione statica richiede ridisegnare la ricerca o spostare i dati su API esterna; una SPA richiede inoltre la strategia di fallback degli URL.

Vite SPA e una scelta valida quando il browser puo chiamare un backend indipendente. Astro con isole React e un'altra architettura per contenuti prevalentemente statici; non e illustrata dal demo. Il sito di questi appunti rimane Quartz: nessuno di questi esempi ne modifica il runtime.

## Errori comuni

- Copiare un tutorial Remix senza controllare versione, pacchetti e modello UI.
- Mescolare App Router, Pages Router, Data Mode e Framework Mode nello stesso esempio.
- Considerare SSR equivalente a RSC, oppure un loader sempre server.
- Leggere `window` nel codice eseguito durante SSR.
- Esporre dati privati tramite props/loader, pensando che basti un file `.server`.
- Confondere cache, revalidation e persistenza, o usare GET per mutazioni.
- Distribuire solo gli asset statici di un progetto che richiede un runtime.

## Checklist

- Framework, major, router e runtime sono dichiarati?
- Ogni lettura/scrittura ha un ambiente e un contratto chiari?
- Layout, pending, errori, status HTTP e navigazione diretta sono verificati?
- Il form funziona nel livello di progressive enhancement promesso?
- Dati inviati al browser, autorizzazioni e cache sono stati controllati?
- Il deploy supporta davvero SSR/azioni o serve un progetto statico diverso?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]
- [[Programmazione/React/Pagine/Server Components|Server Components]]
- [[Programmazione/React/Pagine/React Router|React Router]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]
- [[Programmazione/React/Pagine/use hook|use]]

## Fonti

- [Next: layout e pagine](https://nextjs.org/docs/app/getting-started/layouts-and-pages).
- [Next: caricamento dati](https://nextjs.org/docs/app/getting-started/fetching-data) e [export statico](https://nextjs.org/docs/app/guides/static-exports).
- [Remix v2: documentazione storica](https://v2.remix.run/docs/) e [migrazione a React Router v7](https://reactrouter.com/7.18.4/upgrading/remix).
- [Remix: stack attuale](https://remix.run/), da non confondere con v2 React.
- [React Router: routing](https://reactrouter.com/start/framework/routing), [route module](https://reactrouter.com/start/framework/route-module) e [loader](https://reactrouter.com/start/framework/data-loading).
- [React Router: action](https://reactrouter.com/start/framework/actions), [strategie di rendering](https://reactrouter.com/start/framework/rendering) e [moduli server](https://reactrouter.com/api/framework-conventions/server-modules).

Consultate il 2026-10-16. Demo React Router 8.4.0; confronto con Next 16.4.1 e note Next gia collegate. Non e una procedura completa di migrazione o un audit di sicurezza.
