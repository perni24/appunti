---
date: 2026-04-23
tags: [react, server-components, rsc, server-side, rendering, frontend, javascript]
type: #permanent-note
status: budding
---

# Server Components

I **React Server Components** (**RSC**) sono componenti React che vengono eseguiti sul server invece che nel browser.

Il loro obiettivo e spostare parte del lavoro di rendering e data fetching fuori dal client, riducendo il JavaScript inviato al browser e migliorando la separazione tra logica server-side e interattivita client-side.

> [!INFO] Punto chiave
> Un Server Component puo preparare UI e leggere dati lato server, ma non puo usare stato interattivo del client come `useState` o gestire eventi browser come `onClick`.

---

## 1. Il problema che risolvono

Nelle SPA tradizionali, molto lavoro finisce nel browser:
- download del bundle JavaScript;
- parsing ed esecuzione del codice;
- fetch dei dati dopo il mount;
- rendering della UI lato client;
- gestione di loading state iniziali.

Questo puo creare problemi:
- bundle piu pesanti;
- dati caricati troppo tardi;
- waterfall di request;
- codice server esposto indirettamente al client;
- interfacce che dipendono troppo da `useEffect` per ottenere dati.

I Server Components provano a ridurre questo costo spostando sul server cio che non richiede interattivita browser.

---

## 2. Server Components vs Client Components

La distinzione fondamentale e questa:

### Server Components
Eseguono sul server.

Possono:
- leggere dati dal database;
- chiamare API interne;
- accedere a file o risorse server;
- preparare markup e dati;
- evitare di inviare codice componente al client.

Non possono:
- usare `useState`;
- usare `useEffect`;
- accedere direttamente a `window` o `document`;
- gestire eventi come `onClick`.

### Client Components
Eseguono nel browser.

Possono:
- usare stato locale;
- gestire eventi;
- accedere ad API browser;
- usare hook client-side;
- implementare interazioni dinamiche.

In pratica:
- Server Component per dati e struttura;
- Client Component per interazione.

---

## 3. Il confine `"use client"`

In framework che supportano RSC, un file puo essere marcato come Client Component con la direttiva:

```javascript
"use client";
```

Esempio:

```javascript
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

Senza `"use client"`, un componente puo essere trattato come server-side dal framework.

La direttiva crea un confine: da quel punto in poi, il codice deve essere compatibile con il browser.

---

## 4. Data fetching nei Server Components

Uno dei vantaggi principali e poter recuperare dati direttamente sul server.

Esempio concettuale:

```javascript
async function ProductList() {
  const products = await getProductsFromDatabase();

  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```

Qui non serve:
- `useEffect`;
- stato `loading` locale per il fetch iniziale;
- fetch dal browser;
- inviare al client codice per ottenere quei dati.

Questo cambia il modo di pensare [[Data Fetching e Cache]] nelle app React moderne.

---

## 5. Riduzione del bundle client

Un Server Component non deve essere spedito come JavaScript eseguibile al browser nello stesso modo di un Client Component.

Questo puo ridurre:
- dimensione del bundle;
- tempo di parsing;
- codice client inutile;
- dipendenze pesanti inviate al browser.

Esempio pratico:
- un componente che formatta contenuto statico dal database puo restare server-side;
- un bottone che apre un menu deve essere client-side.

Il risultato migliore si ottiene quando il confine tra server e client e progettato intenzionalmente.

---

## 6. Interattivita e composizione

Un Server Component puo renderizzare un Client Component.

Esempio concettuale:

```javascript
async function ProductPage() {
  const product = await getProduct();

  return (
    <div>
      <h1>{product.name}</h1>
      <AddToCartButton productId={product.id} />
    </div>
  );
}
```

`ProductPage` puo essere server-side, mentre `AddToCartButton` puo essere client-side per gestire click, stato e interazione.

Questo pattern permette di:
- tenere dati e rendering strutturale sul server;
- isolare l'interattivita nei punti necessari;
- ridurre client JavaScript.

---

## 7. Cosa non sono

I Server Components non sono semplicemente:
- SSR classico;
- una sostituzione totale delle SPA;
- un modo per eliminare i Client Components;
- una soluzione automatica a ogni problema di performance.

Sono un modello di rendering e composizione che separa meglio lavoro server e lavoro client.

La UI interattiva continua ad avere bisogno del client.

---

## 8. RSC vs SSR

SSR e RSC sono concetti collegati ma diversi.

### SSR
Renderizza HTML sul server per una risposta iniziale piu pronta.

### Server Components
Permettono ad alcuni componenti di restare server-side nel modello di composizione React, riducendo il codice client e migliorando il data fetching lato server.

In molte architetture moderne possono lavorare insieme, ma non indicano la stessa cosa.

Questo si collega direttamente a Server-Side Rendering e Static Site Generation.

---

## 9. Suspense e streaming

I Server Components si integrano bene con [[Suspense e Lazy Loading]].

In scenari moderni, parti della UI possono essere:
- preparate sul server;
- inviate progressivamente;
- mostrate con fallback mentre alcune risorse sono ancora in attesa.

Questo rende possibile una UX piu progressiva:
- shell iniziale;
- sezioni che arrivano dopo;
- fallback controllati;
- meno blocco totale della pagina.

---

## 10. Limiti e tradeoff

I Server Components introducono anche complessita.

Limiti principali:
- richiedono framework e bundler compatibili;
- impongono distinzione chiara tra server e client;
- non possono usare hook client-side;
- possono confondere se il team non capisce il confine `"use client"`;
- non eliminano la necessita di caching e progettazione dati.

Rischio comune:
- marcare troppi componenti come client-side e perdere i benefici;
- oppure tentare di mettere interattivita in componenti server.

---

## 11. Quando usarli

Sono adatti per:
- pagine data-heavy;
- dashboard con dati iniziali server-side;
- contenuti da database o CMS;
- pagine prodotto;
- layout con molta UI non interattiva;
- applicazioni full-stack con framework moderni.

Sono meno rilevanti quando:
- l'app e una SPA puramente client-side;
- quasi tutto e interattivo lato browser;
- il progetto non usa un framework compatibile;
- la complessita introdotta supera il beneficio.

---

## 12. Relazione con React moderno

I Server Components si collegano a:
- [[Suspense e Lazy Loading]] per fallback e rendering progressivo;
- [[Data Fetching e Cache]] per spostare parte del fetching sul server;
- [[React Router]] nei framework che integrano routing e data loading;
- Server-Side Rendering e Static Site Generation;
- framework come Next.js.

Il punto architetturale e pensare il frontend non piu solo come bundle client, ma come composizione tra server e browser.

---

## 13. Best Practices

1. **Tieni server-side cio che non richiede interattivita:** data fetching, layout statici e contenuti da backend sono buoni candidati.
2. **Usa Client Components solo dove servono eventi, stato o API browser:** evita `"use client"` troppo in alto nell'albero.
3. **Progetta bene il confine server/client:** e il punto piu importante per mantenere benefici e chiarezza.
4. **Non usare `useEffect` per dati che puoi recuperare server-side:** riduci waterfall e loading inutili.
5. **Combina RSC con Suspense quando serve rendering progressivo:** fallback e streaming migliorano la UX se progettati bene.
6. **Ricorda che RSC non sostituisce sicurezza e caching:** dati, permessi e performance restano responsabilita architetturali.

---
