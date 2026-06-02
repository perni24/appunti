---
date: 2026-06-02
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - react
  - state
aliases: []
prerequisites: []
related: []
---

# Derived state

## Sintesi

Il **derived state** e uno stato calcolato a partire da props, state o dati esterni. In React conviene calcolarlo durante il render quando possibile, invece di duplicarlo in `useState`.

## Quando usarlo

### Quando usare useMemo
`useMemo` serve solo se il calcolo e costoso o se la stabilita referenziale e importante.

```jsx
const filteredItems = useMemo(
  () => items.filter(item => item.active),
  [items]
);
```

## Come funziona

### Concetto chiave
Se un valore puo essere derivato da dati gia presenti, spesso non deve essere salvato come nuovo stato.

```jsx
function Cart({ items }) {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return <p>Totale: {total}</p>;
}
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

- Copiare props in state senza motivo.
- Tenere due stati che possono divergere.
- Usare `useEffect` per sincronizzare valori derivabili nel render.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]
- [[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e Flusso di dati unidirezionale]]
