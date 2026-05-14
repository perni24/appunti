---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [useEffect: Side effects e Cleanup]
prerequisites: []
related: []
---
# useEffect: Side effects e Cleanup

## Sintesi

Nota su useEffect: Side effects e Cleanup in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

Il hook `useEffect` permette di gestire gli **effetti collaterali** (side effects) nei componenti funzionali. È l'equivalente dei metodi del ciclo di vita nelle classi (`componentDidMount`, `componentDidUpdate`, e `componentWillUnmount`).

## 1. Cos'è un Side Effect?

Un effetto collaterale è qualsiasi operazione che interagisce con il mondo esterno al di fuori del puro calcolo del rendereing di React. Esempi comuni includono:
- **Data Fetching:** Chiamate API per recuperare dati.
- **Manipolazione manuale del DOM:** Modifica di titoli o focus.
- **Timer:** Utilizzo di `setTimeout` o `setInterval`.
- **Sottoscrizioni:** Listener di eventi globali (window resize, scroll) o WebSockets.

## 2. Sintassi e Dependencies Array

`useEffect` accetta due argomenti: una funzione di callback e un array opzionale di dipendenze.

### Comportamento in base alle dipendenze:

| Array di Dipendenze | Quando viene eseguito? |
| :--- | :--- |
| **Omesso** (`useEffect(() => {})`) | Ad **ogni render** del componente. |
| **Vuoto** (`[]`) | Solo **una volta**, al montaggio (mounting). |
| **Con variabili** (`[count]`) | Al montaggio e ogni volta che `count` cambia. |

```jsx
useEffect(() => {
  console.log("L'effetto è stato eseguito");
}, [data]); // Si riesegue solo se 'data' cambia
```

---

## 3. La Funzione di Cleanup

Per evitare **memory leak** o comportamenti inattesi, `useEffect` può restituire una funzione di "pulizia". Questa funzione viene eseguita:
1. Prima che il componente venga rimosso dal DOM (unmounting).
2. Prima di rieseguire l'effetto se le dipendenze sono cambiate.

> [!IMPORTANT] Prevenzione Memory Leak
> È fondamentale rimuovere event listener o annullare timer nella funzione di cleanup per evitare che continuino a girare in background consumando risorse.

```javascript
useEffect(() => {
  const handleResize = () => console.log(window.innerWidth);
  window.addEventListener('resize', handleResize);

  // Funzione di Cleanup
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []); // Listener aggiunto una volta e rimosso allo smontaggio
```

---

## 4. Best Practices

- **Separazione degli interessi:** Usa più `useEffect` separati per logiche diverse invece di un unico grande effetto.
- **Fetch dei dati:** Quando effettui chiamate API, considera l'uso di un `AbortController` o di librerie come TanStack Query (React Query) per gestire caching e stati di caricamento in modo più professionale.

---
