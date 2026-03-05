---
date: 2026-03-03
tags: [react, hooks, state, frontend, javascript]
type: #permanent-note
status: budding
---

# useState: Gestione dello stato locale

Il hook `useState` è lo strumento fondamentale in React per aggiungere uno **stato locale** ai Componenti Funzionali. Prima della sua introduzione, la gestione dello stato era possibile solo all'interno delle classi.

## 1. Definizione e Sintassi

`useState` è una funzione che accetta un valore iniziale e restituisce un array con due elementi:
1. Il **valore corrente** dello stato.
2. Una **funzione di aggiornamento** (setter) per modificare quel valore.

> [!INFO] Definizione di Stato
> Lo stato rappresenta i dati che cambiano nel tempo all'interno di un componente. Quando lo stato cambia, React rileva la modifica e aggiorna automaticamente l'interfaccia tramite il Virtual DOM.

```javascript
import React, { useState } from 'react';

function Counter() {
  // Dichiarazione dello stato: valore iniziale 0
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Hai cliccato {count} volte</p>
      <button onClick={() => setCount(count + 1)}>
        Cliccami
      </button>
    </div>
  );
}
```

## 2. Come funziona il triggering del rendering

A differenza delle variabili normali, quando chiamiamo la funzione `setCount` (o qualsiasi setter di `useState`), React viene notificato del cambiamento. 
- React confronta la vecchia versione del componente con quella nuova.
- Se il valore dello stato è cambiato, viene eseguito un nuovo **render**.
- Le variabili locali vengono reinizializzate, ma il valore di `useState` viene preservato da React tra un render e l'altro.

## 3. Aggiornamento basato sullo stato precedente

Se il nuovo stato dipende dal valore precedente (come in un contatore), è Best Practice passare una funzione al setter invece del valore diretto. Questo garantisce che React utilizzi sempre il valore più recente dello stato, evitando race conditions dovute alla natura asincrona degli aggiornamenti.

```javascript
// Approccio consigliato per aggiornamenti incrementali
setCount(prevCount => prevCount + 1);
```

## 4. Stato come Oggetto o Array

A differenza di `this.setState` nelle classi, `useState` **non unisce automaticamente** gli oggetti quando vengono aggiornati; li sostituisce completamente.

> [!WARNING] Immutabilità
> In React, lo stato deve essere trattato come immutabile. Se lo stato è un oggetto o un array, non bisogna modificarlo direttamente (es. `myObject.prop = value`), ma crearne una copia aggiornata utilizzando l'operatore **spread**.

```javascript
const [user, setUser] = useState({ name: 'Luca', age: 25 });

const updateAge = () => {
  setUser({
    ...user,    // Copia tutte le proprietà esistenti
    age: 26     // Sovrascrivi solo quella desiderata
  });
};
```

---