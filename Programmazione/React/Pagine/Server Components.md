---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - react
  - server-components
  - rsc
aliases:
  - Server Components
  - React Server Components
  - Server Actions
prerequisites:
  - "[[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e composizione]]"
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]"
  - "[[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]"
title: Server Components
---

# Server Components

## Sintesi

I React Server Components (RSC) vengono eseguiti in un ambiente separato dal browser, a build time o durante una richiesta. Il browser riceve il loro risultato, non il codice dei moduli esclusivamente server. Possono leggere dati e comporsi con componenti interattivi client.

Non sono sinonimo di SSR: **RSC decide dove eseguire i componenti; SSR/SSG riguardano la produzione dell'HTML**. Si possono combinare. Il protocollo RSC non e semplicemente HTML o JSON applicativo.

## Quando usarlo

Sono utili quando il lavoro di lettura/trasformazione puo restare vicino ai dati e non richiede stato interattivo. Un confine client piccolo puo ridurre il JavaScript distribuito, ma non garantisce automaticamente meno latenza o meno byte complessivi.

Usa Client Components per stato, effect e handler nel browser. Un normale progetto Vite con React non acquisisce RSC aggiungendo una direttiva: serve un'integrazione compatibile. Qui si usa esplicitamente **Next.js App Router 16.4.1**, non il Pages Router.

## Come funziona

Nel primo caricamento di Next App Router, il server prepara un payload RSC e l'HTML iniziale; il browser usa il payload per ricostruire l'albero e idrata le parti client. Nelle navigazioni successive il framework puo richiedere il payload senza un nuovo documento HTML completo.

`"use client"` definisce il confine nel **grafo degli import**, non in ogni relazione padre/figlio JSX. Le dipendenze ordinarie importate dal modulo client entrano nel suo grafo. Un parent server puo invece passargli JSX gia preparato tramite `children`, senza far importare il relativo modulo server dal client.

Client Component non significa "mai eseguito sul server": Next puo prerenderizzarlo per produrre l'HTML. Non leggere `window` o `localStorage` al livello del modulo o durante quel render; usa un handler/effect o un'integrazione dichiaratamente browser-only.

## API / Sintassi

| Elemento | Significato |
| --- | --- |
| `"use client"` | Direttiva iniziale, prima degli import, per un confine client |
| `async` component | Supportato nei Server Components; non trasforma da solo un componente in RSC |
| `server-only` | In Next impedisce import accidentali del modulo nel grafo client |
| `"use server"` | Contrassegna Server Functions asincrone, non Server Components |
| Props attraverso il confine | Devono rispettare la serializzazione di React ed essere dati divulgabili |

La serializzazione RSC e piu ampia di JSON: comprende, fra gli altri, Date, Map/Set con valori compatibili, Promise ed elementi JSX. Non accetta liberamente istanze di classi applicative o callback ordinarie definite sul server. Le Server Functions sono riferimenti speciali gestiti dal framework, non normali closure trasferite al browser.

## Esempio pratico

### Progetto riproducibile

Progetto separato da Quartz e dal demo Vite. Usa Node 24.14.0 e i pacchetti seguenti; Next 16.4.1 richiede almeno Node 20.9. Il bundler Webpack e scelto esplicitamente per rendere riproducibile questo esempio, non per affermare che sia l'unico supportato.

`package.json`:

```json
{
  "name": "react-rsc-notes-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack",
    "start": "next start"
  },
  "dependencies": {
    "next": "16.4.1",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "server-only": "0.0.1"
  }
}
```

`app/layout.jsx`:

```jsx
import "./globals.css";

export const metadata = { title: "Catalogo RSC" };

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head><link rel="icon" href="data:," /></head>
      <body>{children}</body>
    </html>
  );
}
```

`app/catalog.js`: sorgente locale dimostrativa, non un database. La proiezione seleziona esplicitamente i campi pubblici prima di usarli nella UI.

```javascript
import "server-only";

const records = [
  { id: "p1", name: "Taccuino", cents: 1250, internalRef: "INTERNAL-SUPPLIER-A" },
  { id: "p2", name: "Penna", cents: 300, internalRef: "INTERNAL-SUPPLIER-B" },
];

export async function getPublicProducts() {
  return records.map(({ id, name, cents }) => ({ id, name, cents }));
}
```

`app/ProductDetails.jsx`: anche la formattazione resta nel modulo server. Il testo risultante, invece, verra inviato al browser.

```jsx
import "server-only";

export default function ProductDetails({ product }) {
  const price = new Intl.NumberFormat("it-IT", {
    style: "currency", currency: "EUR",
  }).format(product.cents / 100);
  return <p>Prezzo: <strong>{price}</strong></p>;
}
```

`app/ProductPanel.jsx` non importa `ProductDetails` o il catalogo. Riceve solo il nome e il contenuto gia preparato:

```jsx
"use client";

import { useId, useState } from "react";

export default function ProductPanel({ name, children }) {
  const contentId = useId();
  const [open, setOpen] = useState(true);
  return (
    <section aria-label={name}>
      <h2>{name}</h2>
      <button type="button" aria-expanded={open} aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}>
        {open ? "Nascondi" : "Mostra"} dettagli di {name}
      </button>
      <div id={contentId} hidden={!open}>{children}</div>
    </section>
  );
}
```

`app/page.jsx` compone le parti sul server. Non aggiungere `"use server"` a questo file:

```jsx
import { getPublicProducts } from "./catalog.js";
import ProductDetails from "./ProductDetails.jsx";
import ProductPanel from "./ProductPanel.jsx";

export default async function ProductsPage() {
  const products = await getPublicProducts();
  return (
    <main>
      <h1>Catalogo pubblico</h1>
      {products.map((product) => (
        <ProductPanel key={product.id} name={product.name}>
          <ProductDetails product={product} />
        </ProductPanel>
      ))}
    </main>
  );
}
```

`app/globals.css`:

```css
body { margin: 24px; font-family: system-ui, sans-serif; color: #202020; background: #fff; }
main { max-width: 48rem; margin-inline: auto; overflow-wrap: anywhere; }
section { padding-block: 1rem; border-bottom: 1px solid #767676; }
button { font: inherit; max-width: 100%; white-space: normal; }
button:focus-visible { outline: 3px solid #176b3a; outline-offset: 3px; }
[hidden] { display: none !important; }
```

Dalla root del demo, installa e poi avvia lo sviluppo. Conserva il lockfile generato per le installazioni successive con `npm ci`.

```bash
npm install
```

```bash
npm run dev
```

Per provare la produzione, ferma il server di sviluppo e usa separatamente:

```bash
npm run build
```

```bash
npm run start
```

Apri `http://localhost:3000`. Senza JavaScript nomi e prezzi sono visibili, ma i pulsanti non commutano la UI. Con JavaScript ogni pannello e indipendente; il reload ripristina lo stato iniziale. Il catalogo e pubblico e non usa autenticazione, rete o persistenza.

### Cosa osservare

- La build puo prerenderizzare questa route: una funzione `async` non implica rendering a ogni richiesta. Per confrontare SSR e SSG usa gli esempi della [[Programmazione/React/Pagine/SSR e SSG|nota dedicata]].
- Il prezzo e gia nei contenuti inviati. Nasconderlo nel client non lo protegge, ne rinvia il lavoro server al click.
- I campi `internalRef` non sono proiettati nella UI. `server-only` impedisce import errati, ma **non filtra** un segreto passato esplicitamente come prop o testo.
- I moduli server restano fuori dai bundle client; il loro output puo comparire nell'HTML e nel payload. Non cercare semplicemente la parola "server" nel bundle come prova di sicurezza.

## Varianti

### Server Functions e Actions

`"use server"` su una funzione async, oppure in testa a un modulo di export async, crea funzioni richiamabili attraverso l'integrazione server. Quando una Server Function e usata come Action, si parla di Server Action. Non tutte le Actions React sono server: vedi [[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]].

Una mutazione richiede validazione degli argomenti, sessione verificata, autorizzazione sulla risorsa e gestione di errori/concorrenza. Un ID ricevuto dal client non prova il possesso del dato. Non eseguire scritture durante il render di un Server Component: prefetch e nuovi render potrebbero ripeterle. Il demo resta di sola lettura; per il flusso di invio passa alla nota sulle Actions.

### Dati, Context e streaming

Le letture indipendenti possono partire insieme; attendere una dopo l'altra crea waterfall anche sul server. La cache e l'invalidazione dipendono dal framework e dal tipo di dato, non dal solo fatto che il componente sia server.

Un provider client puo avvolgere contenuto composto sul server. I consumatori client leggono quel Context; un Server Component non legge automaticamente lo stato del provider client. Promise e Suspense permettono rivelazione progressiva, con supporto del framework; non trasformano un fetch in un effect in una sorgente RSC.

React 19 considera stabile il modello RSC, ma le API sottostanti per implementare bundler/framework non seguono necessariamente semver fra minor. Mantieni allineate versioni e patch di sicurezza del framework: il pin del demo documenta una prova, non una versione da conservare per sempre.

## Errori comuni

- Usare hook client in Server Components.
- Importare componenti server dentro client in modo non valido.
- Confondere SSR e RSC.
- Spostare tutto sul client per comodita.
- Non capire il confine dei dati serializzabili.
- Dipendere da API specifiche di framework senza documentarle.
- Trattare gli argomenti di una Server Function come affidabili senza validazione e autorizzazione.

## Checklist

- Il componente ha interazione client?
- Usa API browser o hook client?
- I dati sono serializzabili?
- Il confine `use client` e piccolo e coerente con gli import?
- Il framework supporta il pattern usato?
- Le Server Functions sono documentate, autorizzate e testate?
- HTML, payload e props espongono soltanto dati pubblici o autorizzati?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]
- [[Programmazione/React/Pagine/Framework Next.js e Remix|Framework Next.js e Remix]]
- [[Programmazione/React/Pagine/Suspense e Lazy Loading|Suspense e Lazy Loading]]
- [[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]

## Fonti

- [React: Server Components e stabilita delle integrazioni](https://react.dev/reference/rsc/server-components).
- [React: use client, grafo dei moduli e valori serializzabili](https://react.dev/reference/rsc/use-client).
- [React: Server Functions](https://react.dev/reference/rsc/server-functions) e [use server](https://react.dev/reference/rsc/use-server).
- [Next: Server e Client Components, composizione e server-only](https://nextjs.org/docs/app/getting-started/server-and-client-components).
- [Next: installazione e requisiti](https://nextjs.org/docs/app/getting-started/installation).
- [Next: sicurezza dei dati e mutazioni](https://nextjs.org/docs/app/guides/data-security). Riferimento del demo: Next 16.4.1, React/React DOM 19.3.0.
