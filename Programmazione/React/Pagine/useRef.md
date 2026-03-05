---
date: 2026-03-03
tags: [react, hooks, dom, persistence, javascript]
type: #permanent-note
status: budding
---

# useRef

Il hook `useRef` è uno strumento versatile in React che permette di mantenere un valore persistente tra i render senza scatenare un nuovo ciclo di rendering quando viene modificato. Restituisce un oggetto "ref" con una singola proprietà: `current`.

## 1. Due casi d'uso principali

`useRef` viene utilizzato principalmente per due scopi:
1. **Accedere direttamente al DOM:** Per interagire con elementi HTML (gestione del focus, misurazione delle dimensioni, integrazione con librerie esterne non React).
2. **Memorizzare valori mutabili:** Per conservare dati che non influiscono sulla UI (ID di timer, valori precedenti di props o stato) evitando render superflui.

> [!INFO] Definizione di Ref
> Una "ref" è come una scatola in cui puoi conservare un qualsiasi valore JavaScript. A differenza di [[useState]], cambiare il contenuto della scatola (`ref.current = newValue`) **non notifica React** e quindi non causa un aggiornamento visivo.

---

## 2. Accesso al DOM

Questo è l'uso più comune. Si assegna la ref all'attributo `ref` di un elemento JSX. React imposterà automaticamente `current` sull'elemento DOM reale una volta montato.

```jsx
import { useRef } from 'react';

function TextInputWithFocusButton() {
  const inputEl = useRef(null);

  const onButtonClick = () => {
    // Accediamo direttamente al metodo .focus() del DOM
    inputEl.current.focus();
  };

  return (
    <>
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </>
  );
}
```

---

## 3. Persistenza dei valori (Senza Render)

Se hai bisogno di memorizzare un'informazione (come un `setInterval` ID) che deve "sopravvivere" ai render ma che non deve essere mostrata nell'HTML, `useRef` è la scelta corretta.

```javascript
const timerId = useRef();

useEffect(() => {
  timerId.current = setInterval(() => {
    console.log("Tic Tac");
  }, 1000);

  return () => clearInterval(timerId.current);
}, []);
```

---

## 4. useRef vs useState

| Caratteristica | `useState` | `useRef` |
| :--- | :--- | :--- |
| **Trigger del Render** | Sì, ad ogni aggiornamento. | No, mai. |
| **Persistenza** | Sì, tra i render. | Sì, tra i render. |
| **Uso ideale** | Informazioni caricate nella UI. | Informazioni tecniche o accesso al DOM. |
| **Sincronia** | Asincrono (batching). | Sincrono (immediato). |

> [!WARNING] Regola d'oro
> Non leggere o scrivere `ref.current` durante la fase di rendering (ovvero nel corpo principale della funzione componente). Fallo sempre all'interno di `useEffect` o in gestori di eventi (event handlers).

---
