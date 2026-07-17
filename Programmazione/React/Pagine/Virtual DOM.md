---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, rendering, internals]
aliases: [Virtual DOM, VDOM]
prerequisites: []
related: []
---

# Virtual DOM

## Sintesi

Il Virtual DOM e una rappresentazione in memoria dell'interfaccia che React usa per calcolare come aggiornare il DOM reale. Non e "magicamente veloce" in ogni caso: il suo valore sta nel rendere il rendering dichiarativo e nel permettere riconciliazione efficiente.

## Quando usarlo

Non lo usi direttamente. Ti serve capirlo quando ragioni su render, key, riconciliazione, performance, memoization e aggiornamenti UI.

## Come funziona

Quando state o props cambiano, React riesegue i componenti interessati e produce un nuovo albero React. Poi confronta il nuovo albero con quello precedente e decide quali modifiche applicare al DOM.

```jsx
function Counter({ count }) {
  return <button>{count}</button>;
}
```

Se `count` cambia, React aggiorna il testo del bottone invece di ricostruire tutta la pagina.

## API / Sintassi

Il Virtual DOM emerge da JSX e componenti:

```jsx
const element = <h1>Ciao</h1>;
```

Le `key` aiutano React a riconoscere elementi in liste:

```jsx
items.map((item) => <Row key={item.id} item={item} />);
```

## Esempio pratico

Con key stabili:

```jsx
users.map((user) => <UserRow key={user.id} user={user} />);
```

React puo preservare correttamente identita e stato delle righe anche se l'ordine cambia.

## Varianti

- **Render phase**: React calcola il nuovo albero.
- **Commit phase**: React applica modifiche al DOM.
- **Reconciliation**: confronto tra alberi.
- **Keys**: identita degli elementi in liste.
- **Fiber**: architettura interna che rende il lavoro interrompibile e prioritizzabile.

## Errori comuni

- Pensare che Virtual DOM sia sempre piu veloce del DOM diretto.
- Usare key instabili.
- Confondere render React con modifica DOM reale.
- Ottimizzare senza profiler.
- Mutare dati impedendo confronti affidabili.

## Checklist

- Le liste hanno key stabili?
- Il render e puro?
- I dati sono aggiornati in modo immutabile?
- Il problema e render React o commit DOM?
- Il profiler conferma il collo di bottiglia?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Fiber Architecture e Concurrent Mode]]
- [[Batching]]
- [[Profiler e Debugging]]
- [[Rendering Condizionale e Liste]]
