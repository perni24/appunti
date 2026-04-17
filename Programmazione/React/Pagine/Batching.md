---
date: 2026-04-17
tags: [react, batching, state, rendering, internals, frontend, javascript]
type: #permanent-note
status: budding
---

# Batching

Il **batching** e il meccanismo con cui React raggruppa piu aggiornamenti di stato nello stesso ciclo di rendering, evitando render inutili e mantenendo l'interfaccia coerente.

In pratica, se dentro lo stesso flusso logico esegui piu `setState`, React prova a processarli insieme invece di fare un render separato per ogni chiamata.

> [!INFO] Punto chiave
> Il batching non significa che lo stato cambia "in ritardo" per errore. Significa che React accumula gli aggiornamenti e applica il risultato finale nel momento corretto del rendering.

---

## 1. Perche esiste

Senza batching, ogni aggiornamento di stato potrebbe causare un nuovo render:
- piu lavoro per React;
- piu diffing del [[Virtual DOM]];
- maggiore probabilita di render ridondanti;
- interfaccia meno efficiente.

Con il batching, React puo:
- unire aggiornamenti collegati;
- ridurre il numero di render;
- applicare lo stato finale in modo piu prevedibile;
- migliorare la reattivita percepita.

Questo si collega direttamente al modo in cui React gestisce scheduling e priorita nella [[Fiber Architecture e Concurrent Mode]].

---

## 2. Esempio base

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  function handleClick() {
    setCount(count + 1);
    setIsVisible(true);
  }

  return (
    <button onClick={handleClick}>
      {count} - {isVisible ? "visibile" : "nascosto"}
    </button>
  );
}
```

Quando l'utente clicca:
- React riceve due aggiornamenti;
- li puo raggruppare;
- esegue un solo render finale con `count` aggiornato e `isVisible` a `true`.

Il vantaggio non e solo prestazionale: la UI viene aggiornata in modo piu coerente.

---

## 3. Perche leggere subito lo stato puo confondere

Un errore comune e pensare che il setter aggiorni immediatamente la variabile locale:

```javascript
function handleClick() {
  setCount(count + 1);
  console.log(count);
}
```

Il `console.log` non mostra il nuovo valore perche:
- il render corrente usa ancora il vecchio snapshot dello stato;
- React non ricalcola subito il componente in linea;
- il nuovo valore sara disponibile nel render successivo.

Questo non dipende solo dal batching: dipende anche dal modello dichiarativo di React.

Per questo [[useState]] va pensato come "richiesta di aggiornamento", non come assegnazione immediata a una variabile.

---

## 4. Aggiornamenti multipli sullo stesso stato

Se fai piu aggiornamenti consecutivi basati sullo stesso valore, puoi ottenere un risultato inatteso:

```javascript
function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
}
```

Visivamente sembra un incremento di `3`, ma in realta ogni chiamata legge lo stesso `count` del render corrente.

Per questo il risultato finale spesso e `+1`, non `+3`.

L'approccio corretto e usare la **updater function**:

```javascript
function handleClick() {
  setCount(prevCount => prevCount + 1);
  setCount(prevCount => prevCount + 1);
  setCount(prevCount => prevCount + 1);
}
```

Qui React applica gli aggiornamenti in sequenza usando ogni volta il valore piu recente.

> [!WARNING] Regola pratica
> Se il nuovo stato dipende dal precedente, usa la forma funzionale del setter.

---

## 5. Automatic batching in React 18

Nelle versioni moderne di React, il batching e diventato piu ampio.

Storicamente React faceva batching soprattutto negli event handler React. Con React 18, l'**automatic batching** copre meglio anche altri contesti, come callback asincrone e promise, quando il rendering passa dal nuovo root API.

Esempio concettuale:

```javascript
fetchData().then(data => {
  setUser(data.user);
  setLoading(false);
});
```

Con automatic batching, React puo trattare questi aggiornamenti come parte dello stesso ciclo, riducendo render separati non necessari.

Questo rende il comportamento piu coerente, ma non cambia una regola fondamentale:
- gli aggiornamenti restano asincroni dal punto di vista del codice applicativo;
- non bisogna scrivere logica che dipende da letture immediate dello stato appena settato.

---

## 6. Relazione con useReducer

Il batching non riguarda solo `useState`. Anche con [[useReducer]], piu `dispatch` ravvicinati possono essere raggruppati nello stesso flusso di render.

La differenza e concettuale:
- `useState` aggiorna singole porzioni di stato;
- `useReducer` centralizza le transizioni;
- il batching agisce comunque sul modo in cui React decide quando renderizzare.

Quindi il batching e un comportamento del motore React, non una feature esclusiva di un hook specifico.

---

## 7. Quando forzare un aggiornamento sincrono

Esistono casi rari in cui serve leggere il DOM aggiornato immediatamente dopo un cambio di stato, per esempio per misure layout o integrazione con API imperative.

In questi casi React espone `flushSync`:

```javascript
import { flushSync } from "react-dom";

function handleOpen() {
  flushSync(() => {
    setIsOpen(true);
  });

  measureDialog();
}
```

`flushSync` forza React a processare subito quell'aggiornamento, ma va usato con cautela:
- riduce i benefici del batching;
- puo peggiorare le performance;
- introduce coupling piu stretto tra stato e timing del DOM.

Va considerato un'eccezione, non il flusso normale.

---

## 8. Batching non significa deferred rendering totale

Un'altra confusione comune e pensare che batching, concurrent rendering e `useTransition` siano la stessa cosa.

Non lo sono:
- il **batching** raggruppa piu aggiornamenti in un singolo render;
- il **concurrent rendering** permette a React di schedulare il lavoro con piu flessibilita;
- `useTransition` marca alcuni aggiornamenti come meno urgenti.

Sono concetti collegati, ma distinti.

---

## 9. Best Practices

1. **Assumi che lo stato non venga aggiornato immediatamente nel corpo corrente della funzione:** evita logica fragile basata su letture subito dopo `setState`.
2. **Usa la updater function quando dipendi dal valore precedente:** e la difesa principale contro errori nei batch di aggiornamenti.
3. **Non ottimizzare manualmente contro il batching senza motivo:** React gestisce gia bene i casi comuni.
4. **Usa `flushSync` solo quando hai un motivo tecnico reale:** tipicamente misure DOM o integrazione con codice imperativo.
5. **Collega il concetto al rendering, non solo allo stato:** batching significa meno render inutili, non solo "setState raggruppati".
6. **Tieni distinti i concetti di batching, async state e concurrent rendering:** mescolarli porta a diagnosi sbagliate.

---
