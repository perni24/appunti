---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
difficulty: advanced
tags: [react, server-components, rsc]
aliases: [Server Components, React Server Components, Server Actions]
prerequisites: []
related: []
---

# Server Components

## Sintesi

React Server Components permettono di renderizzare componenti sul server senza includere il loro codice nel bundle client. Sono pensati per leggere dati server-side, ridurre JavaScript inviato al browser e comporre UI tra server e client.

Nella pratica si usano tramite framework compatibili, come Next.js.

## Quando usarlo

Usali per componenti che leggono dati, non hanno interazione client diretta e possono restare sul server. Usa Client Components per state, effect, event handler e API browser.

## Come funziona

Server Component:

```jsx
async function ProductPage({ productId }) {
  const product = await getProduct(productId);
  return <ProductDetails product={product} />;
}
```

Client Component:

```jsx
"use client";

function AddToCartButton() {
  const [pending, setPending] = useState(false);
  return <button>Aggiungi</button>;
}
```

Il confine client/server e esplicito.

## API / Sintassi

Direttiva client:

```jsx
"use client";
```

I Server Components non richiedono una direttiva `"use server"`: il framework determina quali moduli sono server-side. `"use server"` contrassegna invece una funzione asincrona, o gli export asincroni di un modulo, come **Server Functions** richiamabili dal client.

```jsx
async function addToCart(productId) {
  "use server";
  await cart.add(productId);
}
```

Le API precise, il trasporto e il bundling dipendono dal framework. Gli argomenti delle Server Functions provengono dal client e devono essere validati e autorizzati sul server.

## Esempio pratico

```jsx
async function ProductsPage() {
  const products = await db.product.findMany();

  return (
    <ProductList>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ProductList>
  );
}
```

La lista puo essere preparata sul server; solo le parti interattive diventano client.

## Varianti

- **Server Component**: render server, niente state/effect client.
- **Client Component**: interattivita nel browser.
- **Server Functions**: funzioni server richiamabili dal client; alcuni framework e materiali precedenti usano il nome Server Actions.
- **Streaming**: UI inviata progressivamente.
- **RSC + Suspense**: confini di caricamento granulari.

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
- Il confine `use client` e minimo?
- Il framework supporta il pattern usato?
- Le Server Functions sono documentate, autorizzate e testate?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[SSR e SSG]]
- [[Framework Next.js e Remix]]
- [[Suspense e Lazy Loading]]
- [[Actions e form actions]]

## Fonti

- [React - Server Components](https://react.dev/reference/rsc/server-components)
- [React - use server](https://react.dev/reference/rsc/use-server)
