---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Custom Hooks]
prerequisites: []
related: []
---
# Custom Hooks

## Sintesi

Nota su Custom Hooks in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

I **Custom Hooks** sono funzioni JavaScript che permettono di estrarre e riutilizzare la logica di stato tra diversi componenti. Rappresentano lo strumento più potente di React per seguire il principio **DRY** (Don't Repeat Yourself).

## 1. Cos'è un Custom Hook?

Un custom hook è una funzione il cui nome inizia convenzionalmente con **`use`** (es: `useFetch`, `useAuth`, `useLocalStorage`). Al suo interno può richiamare altri Hook di React come [[Programmazione/React/Pagine/useState]], [[Programmazione/React/Pagine/useEffect]], ecc.

> [!INFO] Logica vs UI
> I custom hook servono a condividere la **logica di stato** (stateful logic), non lo stato stesso. Ogni volta che un componente chiama un custom hook, tutti gli stati e gli effetti al suo interno sono completamente isolati e indipendenti tra i vari componenti.

---

## 2. Esempio Pratico: `useWindowSize`

Immaginiamo di voler monitorare la larghezza della finestra in più componenti. Invece di riscrivere la logica ovunque, creiamo un hook dedicato:

```javascript
import { useState, useEffect } from 'react';

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    
    // Cleanup: rimuoviamo l'ascoltatore allo smontaggio
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

export default useWindowSize;
```

### Utilizzo nel componente
```jsx
function MyResponsiveComponent() {
  const { width } = useWindowSize();

  return <div>La larghezza attuale è: {width}px</div>;
}
```

---

## 3. Le Regole degli Hook (Recap)

Poiché un custom hook è a tutti gli effetti un Hook di React, deve rispettare le due regole fondamentali:
1. **Solo al Top Level:** Non chiamare hook all'interno di cicli, condizioni o funzioni annidate.
2. **Solo in Funzioni React:** Chiamali solo da componenti funzionali di React o da altri custom hook.

---

## 4. Perché usare i Custom Hook?

- **Pulizia del Codice:** I componenti diventano più snelli, occupandosi principalmente della visualizzazione (UI), mentre la logica complessa viene delegata agli hook.
- **Testabilità:** La logica estratta in un hook è molto più facile da testare in isolamento rispetto alla logica "affogata" in un componente gigante.
- **Composizionalità:** È possibile combinare più custom hook per creare logiche ancora più potenti e astratte, mantenendo il codice modulare.

---
