---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - rendering
  - internals
aliases:
  - Virtual DOM
  - VDOM
prerequisites:
  - "[[Programmazione/React/Pagine/JSX|JSX]]"
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/Fiber Architecture e Concurrent Mode|Fiber e concorrenza]]"
  - "[[Programmazione/React/Pagine/Rendering Condizionale e Liste|Rendering e liste]]"
title: Virtual DOM
---

# Virtual DOM

## Sintesi

Virtual DOM e un nome informale per la descrizione dell'interfaccia che React elabora prima di aggiornare il DOM. Non e un secondo documento HTML completo, ne lo Shadow DOM del browser. Gli elementi React descrivono il risultato desiderato; Fiber conserva anche informazioni sul lavoro e sullo stato dei componenti.

Il vantaggio e scrivere la UI in funzione dei dati. Non e una garanzia di velocita rispetto al DOM diretto: calcolo, riconciliazione e aggiornamenti del browser hanno tutti un costo.

## Quando usarlo

Non esiste una funzione da chiamare per "attivare il Virtual DOM". Questo modello serve a capire perche un render non implica ricreare la pagina, quando uno stato viene conservato e perche una key sbagliata associa una bozza alla riga sbagliata.

## Come funziona

Un aggiornamento di stato richiede lavoro a React. Il rendering del parent puo coinvolgere i figli anche se le loro props non sono cambiate; Context e ottimizzazioni come memoizzazione possono influire. Le fasi non vanno confuse:

| Passaggio | Cosa significa |
| --- | --- |
| Render | React chiama componenti puri per calcolare la UI |
| Riconciliazione | Determina quali istanze mantenere, aggiornare o sostituire |
| Commit | Applica al DOM il risultato scelto e aggiorna i ref |
| Layout e paint | Il browser calcola geometria e visualizza i pixel |

Un render puo non richiedere mutazioni DOM, oppure essere abbandonato prima del commit. Gli effect non sono "parte del Virtual DOM": servono a sincronizzare sistemi esterni; quelli di layout possono bloccare il paint.

Questo componente completo rende visibile un aggiornamento del testo senza cambiare il tipo del nodo:

```jsx
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Conteggio: {count}
    </button>
  );
}
```

Se il componente resta nella stessa posizione, React conserva il pulsante e ne aggiorna il contenuto. Contare chiamate alla funzione non equivale a contare nodi DOM creati.

## API / Sintassi

JSX produce elementi React, non inserisce direttamente nodi nel documento:

```jsx
const element = <h1>Ciao</h1>;
```

L'identita dipende dal tipo e dalla posizione nell'albero; una `key` distingue i figli nello stesso parent. Non e globale e non viene passata come prop: se serve l'ID dentro la riga, passalo esplicitamente. Cambiare tipo o key puo distruggere lo stato e ricreare il sottoalbero. Una key uguale non conserva una riga rimossa e poi montata di nuovo.

## Esempio pratico

Nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]], usa questo file come `App.jsx`. Scrivi una bozza per Ada e inverti l'ordine: la bozza segue Ada, non la prima posizione. Il reset cambia intenzionalmente le key. Il demo usa React 19.3.0 senza Compiler.

```jsx
import { useId, useState } from "react";

const initialUsers = [
  { id: "ada", name: "Ada" },
  { id: "grace", name: "Grace" },
];

export function UserRow({ user }) {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  return (
    <li data-user-id={user.id}>
      <label htmlFor={inputId}>Bozza per {user.name}</label>
      <input id={inputId} value={draft}
        onChange={(event) => setDraft(event.target.value)} />
    </li>
  );
}

export default function IdentityDemo() {
  const [users, setUsers] = useState(initialUsers);
  const [revision, setRevision] = useState(0);
  return (
    <section aria-label="Bozze locali">
      <button type="button"
        onClick={() => setUsers((current) => [...current].reverse())}>
        Inverti ordine
      </button>
      <button type="button" onClick={() => setRevision((value) => value + 1)}>
        Azzera bozze
      </button>
      <ul>
        {users.map((user) => (
          <UserRow key={`${user.id}:${revision}`} user={user} />
        ))}
      </ul>
    </section>
  );
}
```

`useId` collega label e input; non viene usato come key. La copia prima di `reverse()` evita di mutare lo stato. Le bozze sono locali e si perdono al reset, allo smontaggio o al reload: non sono salvate in un database.

## Varianti

- Un indice puo essere una key accettabile per una lista davvero statica; e rischioso con inserimenti, riordino e stato locale.
- `memo` puo evitare lavoro quando le props sono equivalenti, ma non cambia le regole di identita e non blocca gli update di stato o Context.
- Un renderer diverso, come React Native, non applica il risultato al DOM web. Non dipendere da campi Fiber privati.
- La virtualizzazione delle liste limita le righe montate: e una tecnica diversa dal Virtual DOM.

## Errori comuni

- Pensare che Virtual DOM sia sempre piu veloce del DOM diretto.
- Usare key instabili.
- Confondere render React con modifica DOM reale.
- Ottimizzare senza profiler.
- Mutare dati impedendo confronti affidabili.
- Definire il componente della riga dentro il parent: il nuovo tipo a ogni render puo causare reset inattesi.
- Generare key con `Math.random()` durante il render: provoca smontaggi, perdita di bozze e possibili problemi di focus.

## Checklist

- Le liste hanno key stabili?
- Il render e puro?
- I dati sono aggiornati in modo immutabile?
- Il problema e render React o commit DOM?
- Il profiler conferma il collo di bottiglia?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Fiber Architecture e Concurrent Mode|Fiber Architecture e Concurrent Mode]]
- [[Programmazione/React/Pagine/Batching|Batching]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]
- [[Programmazione/React/Pagine/Rendering Condizionale e Liste|Rendering Condizionale e Liste]]
- [[Programmazione/React/Pagine/Virtualizzazione delle liste|Virtualizzazione delle liste]]

## Fonti

- [React: render e commit](https://react.dev/learn/render-and-commit).
- [React: preservare e azzerare lo stato](https://react.dev/learn/preserving-and-resetting-state).
- [React: liste e key](https://react.dev/learn/rendering-lists).
- [React: memo](https://react.dev/reference/react/memo). Le API pubbliche sono il contratto, non la struttura interna degli alberi.
