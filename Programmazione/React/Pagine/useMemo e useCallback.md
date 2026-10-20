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
  - hooks
  - performance
  - memoization
aliases:
  - useMemo
  - useCallback
  - Memoization strategy
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
  - "[[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e flusso dei dati]]"
related:
  - "[[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]"
  - "[[Programmazione/React/Pagine/React Compiler|React Compiler]]"
title: useMemo e useCallback
---

# useMemo e useCallback

## Sintesi

`useMemo` riusa il risultato di un calcolo; `useCallback` riusa una funzione. Sono ottimizzazioni del rendering, non contenitori persistenti dello stato. Il componente deve funzionare correttamente anche senza queste cache.

Gli esempi usano React 19.3.0 nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]], senza React Compiler. Prima di ottimizzare, individua il costo con [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]].

## Quando usarlo

Usa `useMemo` per evitare di ripetere trasformazioni costose o per mantenere una prop oggetto/array confrontabile da un componente memoizzato. Usa `useCallback` quando un consumatore trae beneficio dall'identita della funzione, per esempio un figlio con `memo`.

Non serve memoizzare ogni handler di un pulsante DOM. Per una dipendenza di un effect, verifica prima se puoi definire oggetti e funzioni dentro l'effect o spostare costanti fuori dal componente. Non nascondere dipendenze reali per evitare aggiornamenti.

## Come funziona

- Il calcolo di `useMemo` viene eseguito durante il render: deve essere puro, senza fetch, timer, mutazioni delle props o aggiornamenti di stato.
- `useCallback` restituisce una funzione senza chiamarla. Non memorizza i risultati delle sue chiamate e non impedisce la creazione dell'espressione funzione a ogni render.
- React confronta ogni dipendenza con `Object.is`, non con un confronto profondo. Un nuovo array con gli stessi elementi e comunque una dipendenza diversa.
- La lista va scritta inline, con lunghezza costante e tutti i valori reattivi letti. `[]` non significa "usa sempre i dati piu recenti": una closure continua a riferirsi ai valori del render in cui e stata creata.

La cache e locale a quella chiamata dell'hook in quella istanza. Non e una cache condivisa o una mappa di tutti gli argomenti passati: tornando da una query A a B e poi ad A, non aspettarti il recupero di tutte le vecchie ricerche.

React puo invalidare la cache, per esempio dopo una modifica del file in sviluppo o una sospensione al primo mount. In Strict Mode il calcolo puro puo essere chiamato due volte in sviluppo; non ricavare da questo un conteggio delle interazioni dell'utente.

## API / Sintassi

Schema di un componente che riceve `items`, `query` e `onSelect`; il progetto completo e sotto:

```jsx
const filteredItems = useMemo(
  () => items.filter((item) => item.name.includes(query)),
  [items, query],
);

const handleSelect = useCallback((id) => onSelect(id), [onSelect]);
```

`memo` riguarda invece il componente. Import esplicito e componente completo:

```jsx
import { memo } from "react";

export const Row = memo(function Row({ item, onSelect }) {
  return <button onClick={() => onSelect(item.id)}>{item.name}</button>;
});
```

Di default `memo` confronta ogni prop con `Object.is`. Puo saltare il render dovuto al genitore, ma non blocca aggiornamenti del proprio stato o del context consumato. Non e una garanzia di zero render. La freccia dentro `Row` non annulla il confronto delle props ricevute da `Row`.

## Esempio pratico

Sostituisci `src/App.jsx` del progetto introduttivo. Il piccolo catalogo rende visibile il flusso dei dati, **non dimostra un guadagno prestazionale**: non ci sono rallentamenti artificiali. Prezzi espressi in centesimi, sconto controllato dal demo, nessun acquisto reale.

```jsx
import { memo, useCallback, useMemo, useState } from "react";

const PRODUCTS = [
  { id: "keyboard", name: "Tastiera", priceCents: 5000 },
  { id: "screen", name: "Monitor", priceCents: 20000 },
  { id: "mouse", name: "Mouse", priceCents: 2500 },
];

export function filterProducts(products, query) {
  const normalized = query.trim().toLowerCase();
  return products.filter((product) =>
    product.name.toLowerCase().includes(normalized),
  );
}

export const ProductList = memo(function ProductList({ products, onSelect }) {
  if (products.length === 0) return <p>Nessun prodotto.</p>;

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          <button type="button" onClick={() => onSelect(product)}>
            Seleziona {product.name}
          </button>
        </li>
      ))}
    </ul>
  );
});

export function ProductPicker({ products, discount }) {
  const [query, setQuery] = useState("");
  const [clicks, setClicks] = useState(0);
  const [selection, setSelection] = useState(null);

  const visibleProducts = useMemo(
    () => filterProducts(products, query),
    [products, query],
  );

  const handleSelect = useCallback((product) => {
    setSelection({
      name: product.name,
      priceCents: Math.round(product.priceCents * (1 - discount / 100)),
    });
  }, [discount]);

  return (
    <section aria-label="Catalogo">
      <label>
        Cerca prodotto
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <button type="button" onClick={() => setClicks((count) => count + 1)}>
        Contatore indipendente: {clicks}
      </button>
      <ProductList products={visibleProducts} onSelect={handleSelect} />
      <p role="status">
        {selection
          ? `Ultima scelta: ${selection.name}, ${(selection.priceCents / 100).toFixed(2)} EUR`
          : "Nessuna scelta."}
      </p>
    </section>
  );
}

export default function App() {
  const [discount, setDiscount] = useState(10);

  return (
    <main>
      <h1>Catalogo</h1>
      <button type="button" onClick={() => setDiscount((value) => value === 10 ? 20 : 10)}>
        Sconto: {discount}%
      </button>
      <ProductPicker products={PRODUCTS} discount={discount} />
    </main>
  );
}
```

Verifica queste interazioni:

1. Cerca ` MO `: restano Monitor e Mouse. Il filtro dipende da prodotti e query.
2. Incrementa il contatore: cambia lo stato del genitore, ma non le props della lista. Il filtro e la lista possono riusare il lavoro precedente.
3. Seleziona Tastiera con sconto 10%: compare `45.00 EUR`.
4. Porta lo sconto al 20% e seleziona di nuovo Tastiera: compare `40.00 EUR`. La dipendenza `[discount]` evita di conservare il vecchio sconto.

"Ultima scelta" e volutamente una fotografia del prezzo al clic: cambiare sconto non modifica retroattivamente quella scelta. Non e un prezzo corrente da duplicare nello stato.

Per misurare, confronta la stessa interazione nel Profiler prima e dopo la memoizzazione; non aggiungere contatori mutabili al render. Rimuovere `useMemo`, `useCallback` e `memo` deve lasciare invariato il comportamento. Per tre prodotti, il calcolo diretto e normalmente sufficiente.

## Varianti

- **Updater funzionale**: se una callback legge lo stato solo per calcolare il prossimo valore, `setCount((current) => current + 1)` evita di catturare quel valore. Non permette di omettere altre props realmente lette.
- **Oggetti nelle dipendenze**: se crei `options = { query }` nel render, `[options]` cambia ogni volta. Costruisci l'oggetto dentro il calcolo e dipendi da `query`, quando possibile.
- **Comparator personalizzato di `memo`**: va confrontato anche il comportamento delle callback. Ignorare una funzione cambiata puo conservare una closure obsoleta; un confronto profondo puo costare piu del render.
- **React Compiler**: nei progetti configurati puo memoizzare automaticamente. Non e attivato solo perche hai installato React o Vite; vedi la nota dedicata.
- **Liste grandi**: memoizzazione e [[Programmazione/React/Pagine/Virtualizzazione delle liste|virtualizzazione]] risolvono costi diversi. `useMemo` non sposta il lavoro su un thread separato e non velocizza il primo calcolo.

## Errori comuni

- Memoizzare tutto: piu codice e memoria senza un costo evitato dimostrabile.
- Togliere dipendenze per conservare la cache: dati o handler diventano obsoleti. Mantieni attiva la regola `exhaustive-deps`.
- Mutare un array mantenendone il riferimento: il confronto puo non rilevare il cambiamento. `useMemo` non rende immutabili i dati.
- Passare comunque una prop sempre nuova a un figlio memoizzato: il render non viene evitato.
- Usare la cache per ID permanenti, richieste HTTP o stato applicativo: scegli lo strumento con la semantica corretta.
- Chiamare hook nel ciclo che crea le righe: estrai un componente, non rendere variabile l'ordine degli hook.

## Checklist

- Il problema rimane dopo aver semplificato stato, props ed effect?
- Calcolo puro, dipendenze complete e dati immutabili?
- Un consumatore usa davvero l'identita stabilizzata?
- Il codice funziona anche se React ricalcola tutto?
- Confrontate misure ripetibili, senza confondere Strict Mode con produzione?
- Verificata la configurazione effettiva di React Compiler?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]
- [[Programmazione/React/Pagine/Virtualizzazione delle liste|Virtualizzazione delle liste]]
- [[Programmazione/React/Pagine/React Compiler|React Compiler]]
- [[Programmazione/React/Pagine/useTransition e useDeferredValue|useTransition e useDeferredValue]]
- [[Programmazione/React/Pagine/useEffect|useEffect]]
- [[Programmazione/React/Pagine/Custom Hooks|Custom Hooks]]

## Fonti

- [React: useMemo](https://react.dev/reference/react/useMemo), cache, purezza e invalidazione.
- [React: useCallback](https://react.dev/reference/react/useCallback), identita e dipendenze della funzione.
- [React: memo](https://react.dev/reference/react/memo), confronto delle props e limiti.
- [React: exhaustive-deps](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps), closure e dipendenze.
- [React: aggiornamenti in coda](https://react.dev/learn/queueing-a-series-of-state-updates), updater funzionali.
- [React Compiler: installazione](https://react.dev/learn/react-compiler/installation), configurazione esplicita della toolchain.

Documentazione React 19.3 consultata il 2026-10-15. Gli esempi non sono benchmark.
