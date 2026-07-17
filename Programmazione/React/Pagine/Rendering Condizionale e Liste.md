---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [react, rendering, liste, frontend]
aliases: [Rendering Condizionale, Liste React, key React]
prerequisites: []
related: []
---

# Rendering Condizionale e Liste

## Sintesi

Il rendering condizionale permette di mostrare UI diverse in base a stato, props o permessi. Le liste permettono di trasformare array di dati in elementi React usando `map`.

La regola critica per le liste e usare `key` stabili, cosi React puo riconciliare correttamente gli elementi.

## Quando usarlo

Usa rendering condizionale per loading state, error state, permessi, feature flag, empty state e layout alternativi. Usa liste per renderizzare dati ripetuti come utenti, righe tabella, menu, card o notifiche.

## Come funziona

Condizionale con ternario:

```jsx
{isLoading ? <Spinner /> : <UserList users={users} />}
```

Condizionale con `&&`:

```jsx
{error && <Alert message={error.message} />}
```

Lista:

```jsx
{users.map((user) => (
  <UserCard key={user.id} user={user} />
))}
```

## API / Sintassi

Early return:

```jsx
function UserPanel({ user, isLoading }) {
  if (isLoading) return <Spinner />;
  if (!user) return <EmptyState />;

  return <UserDetails user={user} />;
}
```

Lista con empty state:

```jsx
function Notifications({ items }) {
  if (items.length === 0) {
    return <p>Nessuna notifica</p>;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
}
```

## Esempio pratico

```jsx
function OrdersView({ orders, status }) {
  if (status === "loading") return <p>Caricamento...</p>;
  if (status === "error") return <p>Errore nel caricamento</p>;
  if (orders.length === 0) return <p>Nessun ordine</p>;

  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          {order.code} - {order.total}
        </li>
      ))}
    </ul>
  );
}
```

Questo rende espliciti tutti gli stati della UI.

## Varianti

- **Ternario**: due rami alternativi.
- **`&&`**: rendering opzionale semplice.
- **Early return**: stati esclusivi e leggibili.
- **Switch/mappa di componenti**: molti stati possibili.
- **Liste annidate**: richiedono key a ogni livello.
- **Virtualizzazione**: utile per liste molto grandi.

## Errori comuni

- Usare indice array come `key` quando l'ordine puo cambiare.
- Dimenticare empty state.
- Mescolare troppa logica nel JSX.
- Usare `&&` con valori numerici che possono renderizzare `0`.
- Non gestire loading ed error state.
- Fare `map` su valori potenzialmente `undefined`.

## Checklist

- Ogni lista ha key stabili?
- Loading, errore e vuoto sono gestiti?
- Le condizioni sono leggibili?
- Il rendering non contiene logica di dominio complessa?
- La lista puo diventare tanto grande da richiedere virtualizzazione?
- Gli elementi renderizzati hanno markup semantico?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[JSX]]
- [[Props e Flusso di dati unidirezionale]]
- [[Data Fetching e Cache]]
- [[Virtualizzazione delle liste]]
