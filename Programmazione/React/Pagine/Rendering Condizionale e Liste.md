---
date: 2026-03-02
tags: [react, rendering, lists, key-prop, conditional-rendering]
type: #permanent-note
status: budding
---

# Rendering Condizionale e Liste (Key prop)

In React, le interfacce dinamiche richiedono spesso di mostrare o nascondere elementi in base a determinate condizioni o di generare componenti a partire da array di dati.

## 1. Rendering Condizionale

Il rendering condizionale in React funziona allo stesso modo delle condizioni in JavaScript. Si utilizzano operatori come `if`, l'operatore ternario o l'operatore logico `&&`.

### Operatore Ternario (`condition ? true : false`)
Ideale per scegliere tra due output differenti.
```jsx
function Welcome({ isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? <button>Logout</button> : <button>Login</button>}
    </div>
  );
}
```

### Operatore Logico `&&` (Short-circuit)
Usato quando si vuole renderizzare qualcosa solo se la condizione è vera, altrimenti nulla.
```jsx
function Notification({ count }) {
  return (
    <div>
      {count > 0 && <p>Hai {count} nuove notifiche!</p>}
    </div>
  );
}
```

---

## 2. Rendering di Liste

Per renderizzare una lista di elementi, si utilizza solitamente il metodo `.map()` di JavaScript per trasformare un array di dati in un array di elementi JSX.

```jsx
const users = ['Alice', 'Bob', 'Charlie'];

function UserList() {
  return (
    <ul>
      {users.map((user) => (
        <li key={user}>{user}</li>
      ))}
    </ul>
  );
}
```

---

## 3. L'importanza della `key` prop

La **key** è un attributo speciale che devi includere quando crei liste di elementi in React. Le chiavi aiutano React a identificare quali elementi sono cambiati, sono stati aggiunti o rimossi.

### Perché è necessaria?
React utilizza le chiavi per il processo di **Riconciliazione** (Diffing). Senza chiavi univoche, se l'ordine della lista cambia, React non saprebbe se l'elemento è stato rimosso o semplicemente spostato, costringendo a un re-render completo di tutti gli elementi della lista, compromettendo le prestazioni.

> [!WARNING] Regole per le chiavi
> 1. **Univocità:** Le chiavi devono essere univoche tra gli elementi fratelli (non necessariamente in tutta l'app).
> 2. **Stabilità:** Non usare valori casuali (`Math.random()`) come chiavi, altrimenti gli elementi verranno distrutti e ricreati a ogni render.
> 3. **Evita l'indice dell'array:** Usare l'indice (`map((item, index) => ... )`) è sconsigliato se la lista può essere riordinata, filtrata o se gli elementi vengono inseriti in mezzo, poiché causerebbe bug nello stato dei componenti e problemi di performance.

### Esempio corretto con ID
```jsx
// Utilizza sempre un ID univoco proveniente dai tuoi dati
{items.map(item => (
  <li key={item.id}>{item.text}</li>
))}
```

---