---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - typescript
  - nextjs
  - react
  - fullstack
aliases:
  - Next.js con TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/TypeScript con React]]"
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Node.js]]"
related:
  - "[[Programmazione/TypeScript/Pagine/API tipizzate]]"
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
title: TypeScript con Next.js
---

# TypeScript con Next.js

## Sintesi

Next.js aggiunge a React convenzioni di routing, rendering e confini server/client. TypeScript controlla i moduli e i tipi generati dal framework; non verifica automaticamente parametri, permessi o dati esterni.

Baseline del demo: **Next.js 16.4.1**, **React/React DOM 19.3.0**, tipi React **19.3.0**, **TypeScript 5.9.3**, **Node 24.14.0**, **@types/node 24.19.2**. Questa nota usa **App Router**, non Pages Router.

## Quando usarlo

- Pagine React con caricamento server e interazioni client.
- Route dinamiche con contratti controllati.
- Applicazioni in cui server e UI condividono DTO pubblici.
- Diagnosi di errori fra tipi generati, checker e build.

## Come funziona

In App Router le pagine sono Server Components per default. `"use client"` introduce un confine nella dipendenza dei moduli: non significa che il componente non possa essere prerenderizzato sul server.

Nella baseline, `params` e `searchParams` delle pagine sono **Promise**: occorre attenderle, non accedere come nelle vecchie API sincrone. I tipi di route descrivono la forma, non l'esistenza dell'elemento richiesto.

## API / Sintassi

Progetto separato; `package.json`:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "check": "next typegen && tsc --noEmit",
    "build": "next build --webpack",
    "start": "next start"
  },
  "dependencies": {
    "next": "16.4.1",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "server-only": "0.0.1"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@types/node": "24.19.2"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const config: NextConfig = { typedRoutes: true };
export default config;
```

Next genera `next-env.d.ts` e i tipi delle route: non modificarli a mano. `next typegen` prima di `tsc` rende il controllo ripetibile anche senza una precedente sessione dev. La build del demo usa esplicitamente Webpack; la scelta del bundler e distinta dalle regole TypeScript.

## Esempio pratico

### Catalogo server e DTO

`lib/types.ts`:

```ts
export type ProductDto = { id: string; name: string };
```

`lib/catalog.ts`:

```ts
import "server-only";
import type { ProductDto } from "./types";

const products = new Map([
  ["p1", { id: "p1", name: "Taccuino", supplierCode: "INTERNAL-DEMO" }],
]);

export function getProduct(id: string): ProductDto | undefined {
  const product = products.get(id);
  return product ? { id: product.id, name: product.name } : undefined;
}
```

Il catalogo e una fixture in memoria, non un database. Il valore pubblico viene costruito esplicitamente: annotare un record interno come `ProductDto` non ne eliminerebbe `supplierCode`.

### Componente client

`components/ProductPanel.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { ProductDto } from "../lib/types";

export default function ProductPanel({ product }: { product: ProductDto }) {
  const [selected, setSelected] = useState(false);
  return (
    <section aria-label="Prodotto">
      <h1>{product.name}</h1>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => setSelected((value) => !value)}
      >
        {selected ? "Selezionato" : "Seleziona"}
      </button>
    </section>
  );
}
```

### Pagine e layout

`app/layout.tsx`:

```tsx
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx`:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <Link href="/products/p1">Apri prodotto</Link>
    </main>
  );
}
```

`app/products/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getProduct } from "../../../lib/catalog";
import ProductPanel from "../../../components/ProductPanel";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: PageProps<"/products/[id]">) {
  const { id } = await params;
  if (id.length > 32 || /[^a-z0-9-]/.test(id)) notFound();
  const product = getProduct(id);
  if (!product) notFound();

  return (
    <main>
      <ProductPanel product={product} />
    </main>
  );
}
```

`PageProps` e un helper globale generato, non un tipo inventato da importare. `typedRoutes` controlla collegamenti compatibili con le route, ma non prova che `p1` esista nel catalogo. `notFound` interrompe il rendering; non e un normale valore da restituire o da inghiottire con un catch generico.

### Comandi

Installare:

```sh
npm install
```

Generare i tipi e controllare:

```sh
npm run check
```

Compilare:

```sh
npm run build
```

Avviare localmente, su una porta libera:

```sh
npm start -- --hostname 127.0.0.1 --port 3002
```

Apri `http://127.0.0.1:3002/products/p1`. Un ID assente attiva not-found; il pulsante aggiorna soltanto stato client, non salva una preferenza. Arresta con Ctrl+C. Questa variante dinamica richiede un server Next: non e un export statico per GitHub Pages.

## Varianti

- **Search params**: dopo l'attesa, un valore puo essere `string`, `string[]` o assente; non e un `URLSearchParams`. Controlla ripetizioni e formati.
- **Route Handler**: riceve request HTTP; JSON e FormData richiedono schema, autorizzazione e status espliciti. Il generico di una risposta non valida il contenuto.
- **Server Functions**: input proveniente dal client resta non fidato; una firma tipizzata non sostituisce controlli server.
- **Pages Router**: segue altre API, come `getServerSideProps`; non mescolare esempi dei due router.

Il confine React server/client non e semplicemente `JSON.stringify`: ammette anche alcuni valori supportati dal protocollo React, per esempio Date. Restano vietati molti oggetti/funzioni arbitrari. Il demo passa un DTO di stringhe, senza segreti o riferimenti a moduli server. `server-only` protegge import errati, non tutti i possibili flussi di dati riservati.

## Errori comuni

- Accesso sincrono a `params` copiato da esempi precedenti.
- Helper di route usati prima della generazione.
- Disattivare gli errori di build per ottenere un deploy.
- Importare implementazioni server nel grafo client.
- Confondere serializzabilita, validazione e autorizzazione.

## Checklist

- Versione e router sono espliciti?
- Generazione dei tipi e checker passano da checkout pulito?
- Parametri e dati esterni hanno controlli runtime?
- Il client riceve solo i campi pubblici necessari?
- La modalita di deploy supporta le funzionalita usate?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/TypeScript con React|TypeScript con React]]
- [[Programmazione/TypeScript/Pagine/TypeScript con Node.js|TypeScript con Node.js]]
- [[Programmazione/React/Pagine/Server Components|React Server Components]]
- [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]

## Fonti

- [Next.js - TypeScript](https://nextjs.org/docs/app/api-reference/config/typescript)
- [Next.js - Page e parametri](https://nextjs.org/docs/app/api-reference/file-conventions/page)
- [React - Confine use client e valori serializzabili](https://react.dev/reference/rsc/use-client)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
