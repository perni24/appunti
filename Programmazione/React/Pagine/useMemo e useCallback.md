---
date: 2026-03-03
tags: [react, hooks, performance, optimization, memoization, javascript]
type: #permanent-note
status: budding
---

# useMemo e useCallback

In React, ogni cambiamento allo stato o alle props innesca un nuovo ciclo di rendering del componente e di tutti i suoi figli. Per ottimizzare le prestazioni ed evitare calcoli costosi o re-render non necessari, React fornisce due hook basati sul concetto di **Memoization**: `useMemo` e `useCallback`.

## 1. useMemo

Il hook `useMemo` serve a memorizzare il **risultato** di un calcolo complesso, calcolandolo nuovamente solo quando una delle sue dipendenze cambia.

### Sintassi e Utilizzo
```javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

> [!INFO] Quando usare useMemo
> È utile quando hai una funzione "costosa" (che richiede molto tempo o risorse) che viene eseguita ad ogni render. Se i parametri di input (`a`, `b`) rimangono gli stessi, `useMemo` restituisce istantaneamente il valore precedentemente calcolato invece di rieseguire la funzione.

---

## 2. useCallback

A differenza di `useMemo`, `useCallback` memorizza l'**istanza della funzione** stessa invece del suo risultato.

### Il Problema del Referenziamento
In JavaScript, ogni volta che un componente React viene renderizzato, tutte le funzioni definite al suo interno vengono ricreate come nuove istanze (con nuovi riferimenti in memoria). Se passi una di queste funzioni come prop a un componente figlio ottimizzato con `React.memo`, il figlio si ri-renderizzerà sempre perché vedrà una prop "diversa" ad ogni ciclo.

```javascript
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

> [!TIP] Integrazione con React.memo
> `useCallback` è fondamentale quando passi funzioni a componenti figli pesanti che utilizzano `React.memo` per evitare aggiornamenti superflui dell'interfaccia.

---

## 3. Confronto Rapido

| Hook | Cosa memorizza? | Scopo Principale |
| :--- | :--- | :--- |
| **`useMemo`** | Il **Valore di ritorno** | Evitare calcoli pesanti ad ogni render. |
| **`useCallback`** | L'**Istanza della funzione** | Mantenere l'uguaglianza referenziale delle funzioni passate come prop. |

---

## 4. Attenzione alla Premature Optimization

Non bisogna usare questi hook ovunque. Entrambi hanno un "costo" in termini di memoria (devono salvare i valori e controllare le dipendenze).

> [!WARNING] Best Practice
> 1. **Profila prima di ottimizzare:** Usa i React DevTools per individuare colli di bottiglia reali.
> 2. **Leggibilità del codice:** L'abuso di questi hook rende il codice più difficile da leggere. Usali solo se c'è un beneficio tangibile in termini di performance.
> 3. **Non saltare i render per logica:** Non usarli per gestire il flusso dell'applicazione, ma solo per l'efficienza.

---
