---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [react, jsx, frontend]
aliases: [JSX]
prerequisites: []
related: []
---

# JSX

## Sintesi

JSX e una sintassi JavaScript che permette di descrivere UI con una forma simile a HTML. Non e HTML: viene trasformato in chiamate JavaScript che React usa per costruire l'albero dei componenti.

JSX rende esplicito il legame tra markup, dati e componenti.

## Quando usarlo

Usa JSX in componenti React per descrivere cosa deve essere renderizzato. E adatto a markup dinamico, composizione di componenti, rendering condizionale e liste.

Evita di inserire logica complessa direttamente nel JSX: se una espressione diventa difficile da leggere, estraila in variabili o componenti.

## Come funziona

Dentro JSX puoi usare espressioni JavaScript tra `{}`.

```jsx
function Welcome({ name }) {
  return <h1>Ciao {name}</h1>;
}
```

Gli attributi seguono convenzioni JavaScript:

```jsx
<button className="primary" onClick={handleClick}>
  Salva
</button>
```

`class` diventa `className`, gli handler usano camelCase e i valori dinamici vanno tra parentesi graffe.

## API / Sintassi

Rendering condizionale:

```jsx
{isLoading ? <Spinner /> : <Content />}
```

Lista:

```jsx
{items.map((item) => (
  <li key={item.id}>{item.label}</li>
))}
```

Fragment:

```jsx
<>
  <Header />
  <Main />
</>
```

Stile inline:

```jsx
<div style={{ display: "flex", gap: 8 }} />
```

## Esempio pratico

```jsx
function UserCard({ user }) {
  return (
    <article className="user-card">
      <h2>{user.name}</h2>
      {user.isAdmin && <strong>Admin</strong>}
    </article>
  );
}
```

Il componente descrive direttamente come lo stato dell'utente si riflette nella UI.

## Varianti

- **JSX in componenti**: uso normale in React.
- **Fragment**: evita wrapper DOM inutili.
- **Componenti custom**: tag con lettera maiuscola.
- **Elementi DOM**: tag minuscoli come `div`, `button`, `form`.
- **Espressioni JavaScript**: valori dinamici tra `{}`.

## Errori comuni

- Usare `class` invece di `className`.
- Usare `for` invece di `htmlFor` sulle label.
- Dimenticare `key` nelle liste.
- Mettere statement complessi dentro JSX.
- Usare oggetti come children renderizzabili.
- Confondere valori booleani, stringhe e numeri negli attributi.

## Checklist

- Il JSX resta leggibile?
- Le liste hanno `key` stabili?
- La logica complessa e stata estratta?
- Gli attributi usano naming React?
- I componenti custom iniziano con maiuscola?
- Il markup prodotto e semanticamente corretto?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Rendering Condizionale e Liste]]
- [[Props e Flusso di dati unidirezionale]]
- [[Componenti Funzionali vs Componenti a Classe]]
