---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, hooks, effects]
aliases: [useEffect, Effect React, Cleanup effect]
prerequisites: []
related: []
---

# useEffect

## Sintesi

`useEffect` sincronizza un componente React con sistemi esterni: DOM imperativo, subscription, timer, rete, storage o librerie non React. Non serve per calcolare valori derivati dal render: per quello usa variabili, `useMemo` solo se necessario, o ristruttura lo stato.

## Quando usarlo

Usa `useEffect` quando devi eseguire side effect dopo il render: registrare listener, avviare timer, sincronizzare document title, fare cleanup, collegarti a API browser o lanciare fetch controllati.

Evitalo per trasformare props in state senza motivo, gestire eventi utente o calcolare dati derivabili.

## Come funziona

```jsx
useEffect(() => {
  document.title = `Messaggi: ${count}`;
}, [count]);
```

React esegue l'effect dopo il render. L'array di dipendenze dice quando rieseguirlo.

Cleanup:

```jsx
useEffect(() => {
  const id = setInterval(tick, 1000);

  return () => clearInterval(id);
}, []);
```

Il cleanup viene eseguito prima del prossimo effect e quando il componente viene smontato.

## API / Sintassi

Effect dopo ogni render:

```jsx
useEffect(() => {
  console.log("render completato");
});
```

Effect una volta al mount:

```jsx
useEffect(() => {
  connect();
  return disconnect;
}, []);
```

Effect dipendente da valore:

```jsx
useEffect(() => {
  syncUser(userId);
}, [userId]);
```

## Esempio pratico

Fetch con cancellazione:

```jsx
useEffect(() => {
  const controller = new AbortController();

  async function loadUser() {
    const response = await fetch(`/api/users/${userId}`, {
      signal: controller.signal,
    });
    const data = await response.json();
    setUser(data);
  }

  loadUser();

  return () => controller.abort();
}, [userId]);
```

Questo evita aggiornamenti tardivi quando `userId` cambia o il componente si smonta.

## Varianti

- **Effect con cleanup**: subscription, timer, listener.
- **Effect senza cleanup**: sincronizzazioni semplici.
- **Effect con dipendenze**: rieseguito quando cambiano valori.
- **AbortController**: cancellazione di richieste.
- **Custom hook**: incapsula effect ripetuti.
- **Data fetching library**: spesso migliore per cache, retry e stati remoti.

## Errori comuni

- Usare effect per tutto.
- Dimenticare dipendenze.
- Ignorare cleanup di listener, timer o fetch.
- Creare loop aggiornando state dipendente dall'effect.
- Fare fetch senza gestire race condition.
- Usare effect per derivare stato calcolabile durante render.

## Checklist

- Sto sincronizzando con un sistema esterno?
- Le dipendenze sono complete?
- Serve cleanup?
- Ci sono race condition?
- Questo effect puo diventare custom hook?
- Una libreria di data fetching sarebbe piu adatta?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Gestione della memoria e AbortController]]
- [[Data Fetching e Cache]]
- [[Custom Hooks]]
- [[Derived state]]
