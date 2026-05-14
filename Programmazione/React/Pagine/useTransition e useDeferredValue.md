---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [useTransition e useDeferredValue (Concurrent React)]
prerequisites: []
related: []
---
# useTransition e useDeferredValue (Concurrent React)

## Sintesi

Nota su useTransition e useDeferredValue (Concurrent React) in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

In React 18, sono stati introdotti nuovi hook per gestire la **priorità del rendering**. Questi strumenti permettono di mantenere l'interfaccia utente (UI) reattiva anche durante aggiornamenti pesanti dello stato, come il filtraggio di lunghe liste o la generazione di grafici complessi.

---

## 1. useTransition

Il hook `useTransition` permette di marcare alcuni aggiornamenti dello stato come **non urgenti** (transizioni). Questo consente a React di dare priorità ad azioni immediate (come scrivere in un input) rispetto ad aggiornamenti pesanti che possono essere rimandati.

### Sintassi e Utilizzo
```javascript
const [isPending, startTransition] = useTransition();

const handleChange = (e) => {
  // Aggiornamento urgente: l'input deve essere immediato
  setInputValue(e.target.value);

  // Aggiornamento non urgente: il rendering della lista può aspettare
  startTransition(() => {
    setFilteredList(hugeData.filter(item => item.includes(e.target.value)));
  });
};
```

> [!INFO] isPending
> La variabile booleana `isPending` permette di mostrare un indicatore di caricamento o uno stato visivo mentre la transizione è in corso.

---

## 2. useDeferredValue

`useDeferredValue` è simile a `useTransition`, ma si applica a un **valore** invece che a una funzione di aggiornamento dello stato. Permette di posticipare il re-render di una parte lenta della UI finché il valore non "si stabilizza".

### Quando usarlo
È ideale quando ricevi un valore come prop da un componente genitore e non hai controllo diretto sulla funzione `setState` che lo genera.

```javascript
const deferredValue = useDeferredValue(inputValue);

// Questo componente pesante userà il valore differito e non bloccherà l'input principale
<SlowList text={deferredValue} />
```

---

## 3. Confronto Rapido

| Hook | Meccanismo | Punto d'Uso |
| :--- | :--- | :--- |
| **`useTransition`** | Avvolge la funzione `setState`. | Nel componente dove viene gestito lo stato. |
| **`useDeferredValue`** | Crea una copia "ritardata" di un valore. | Nel componente che riceve il valore (spesso come prop). |

---

## 4. Concurrent Rendering: Come funziona

Dietro le quinte, questi hook sfruttano il **Concurrent Mode** di React. Invece di un unico rendering bloccante, React può ora:
- Interrompere un rendering pesante.
- Gestire un'interazione utente più urgente (es. un click).
- Riprendere il rendering pesante in background.

> [!TIP] UX vs Performance
> Questi hook non rendono il codice più veloce in termini assoluti, ma migliorano la **percezione della velocità** da parte dell'utente, evitando che l'interfaccia si "congeli".

---
