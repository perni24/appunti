---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - react
  - components
  - frontend
aliases:
  - Componenti Funzionali
  - Componenti a Classe
prerequisites:
  - "[[Programmazione/React/Pagine/JSX|JSX]]"
related:
  - "[[Programmazione/React/Indice React|Indice React]]"
title: Componenti Funzionali vs Componenti a Classe
---

# Componenti Funzionali vs Componenti a Classe

## Sintesi

Per nuovo codice React raccomanda componenti definiti come funzioni. Le classi restano supportate: non sono automaticamente errate o da riscrivere. In entrambi i casi il componente riceve props e descrive cosa visualizzare.

Un componente funzione non e necessariamente stateless e non viene creato un nuovo stato a ogni chiamata. React conserva lo stato associandolo alla posizione, al tipo e all'eventuale key nell'albero.

## Problema che risolve

Serve capire come leggere e mantenere entrambi i modelli senza confondere una migrazione sintattica con una modifica del comportamento. Error boundary implementati direttamente con le API React usano ancora classi nella versione qui verificata; una libreria puo nasconderle dietro un'interfaccia diversa.

## Concetto chiave

| Aspetto | Funzione | Classe |
| --- | --- | --- |
| Props | Parametro della funzione | this.props |
| Stato locale | useState/useReducer | this.state e setState |
| Aggiornamento | Il setter sostituisce il valore dello stato relativo | setState unisce superficialmente il parziale allo stato |
| Aggiornamento dal precedente | Setter con funzione updater | setState con funzione updater |
| Sincronizzazione esterna | Effect con dipendenze e cleanup | Lifecycle con setup, aggiornamento e cleanup |
| Logica condivisa | Custom hook | Composizione, adapter o altri pattern |
| Error boundary nativo | Nessun equivalente diretto dei metodi di cattura | getDerivedStateFromError e componentDidCatch |

Un effect non e una traduzione meccanica di un lifecycle: deve descrivere una sincronizzazione e come interromperla. Gli hook ordinari vanno al livello superiore di un componente funzione o custom hook, non nelle classi o nei gestori di eventi.

## Dettagli importanti

- Props e stato sono snapshot da trattare come immutabili. Il render non deve modificare dati esterni, fare richieste o registrare listener.
- Chiama il componente tramite JSX, non come una normale funzione per ottenere il suo markup.
- Un setter accoda un aggiornamento: non cambia la variabile dello stato nel render corrente. Per dipendere dal valore precedente usa un updater puro.
- Una prop initialValue inizializza il contatore quando viene montato. Cambiarla dopo non deve essere interpretato come un reset automatico.
- Non definire un componente dentro un altro componente: la nuova identita della funzione puo causare smontaggi e perdita di stato.
- StrictMode in sviluppo puo richiamare render e updater per controllare la purezza. Una singola pressione deve comunque incrementare una volta.

## Esempio

Due implementazioni con lo **stesso comportamento**, ciascuna in un file separato. Contratto: initialValue e un piccolo intero, label una stringa; contatori locali da demo, non contatori senza limite o valori persistenti.

`src/CounterFunction.jsx`:

```jsx
import { useState } from "react";

export default function CounterFunction({ initialValue = 0, label = "Funzione" }) {
  const [count, setCount] = useState(initialValue);
  return (
    <button type="button" onClick={() => setCount((current) => current + 1)}>
      {label}: {count}
    </button>
  );
}
```

`src/CounterClass.jsx`:

```jsx
import { Component } from "react";

export default class CounterClass extends Component {
  constructor(props) {
    super(props);
    const { initialValue = 0 } = props;
    this.state = { count: initialValue };
  }

  increment = () => {
    this.setState((previous) => ({ count: previous.count + 1 }));
  };

  render() {
    const { label = "Classe" } = this.props;
    return (
      <button type="button" onClick={this.increment}>
        {label}: {this.state.count}
      </button>
    );
  }
}
```

`src/App.jsx`, nel progetto introduttivo:

```jsx
import CounterFunction from "./CounterFunction.jsx";
import CounterClass from "./CounterClass.jsx";

export default function App() {
  return (
    <main>
      <h1>Due contatori indipendenti</h1>
      <CounterFunction initialValue={2} />
      <CounterClass initialValue={2} />
    </main>
  );
}
```

Ogni pulsante parte da 2 e aggiorna soltanto la propria istanza. La arrow di istanza increment mantiene il receiver this quando React invoca l'handler. Non serve aggiungere bind nel costruttore.

Componente di presentazione alternativo, con callback obbligatoria fornita dal padre:

```jsx
export function ProductCard({ product, onSelect }) {
  return (
    <article>
      <h2>{product.name}</h2>
      <button type="button" onClick={() => onSelect(product.id)}>
        Seleziona
      </button>
    </article>
  );
}
```

Qui non serve uno stato locale: il componente notifica un intento. Anche un componente senza hook puo avere handler.

## Limiti

- La funzione non garantisce da sola codice piu veloce; le classi non sono di per se piu lente.
- memo e PureComponent sono strumenti di ottimizzazione basati su confronti superficiali, non meccanismi per correggere mutazioni o logica errata.
- Un custom hook condivide logica, non automaticamente lo stato fra chi lo usa.
- Questo confronto riguarda componenti client ordinari. Server Components, effect, error boundary e concorrenza richiedono le rispettive note.

## Errori comuni

- Confrontare una funzione interattiva con una classe che visualizza soltanto un numero: manca la stessa funzionalita.
- Omettere gli import di Component o useState perche il JSX automatico non richiede React.
- Copiare props nello stato aspettandosi sincronizzazione continua.
- Mutare this.state o aspettarsi che setState restituisca una Promise da attendere.
- Trasferire richieste dal lifecycle direttamente nel corpo della funzione durante una migrazione.
- Riscrivere una classe funzionante senza test di interazioni, cleanup e mantenimento dello stato.

## Checklist

- Entrambe le implementazioni ricevono gli stessi dati e rispondono agli stessi eventi?
- Stato indipendente e aggiornamenti dal precedente verificati?
- Identita e key conservano lo stato dove previsto?
- Import espliciti e render puro?
- Migrazione verificata anche per setup e cleanup, non soltanto per il primo render?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/useEffect|useEffect]]
- [[Programmazione/React/Pagine/Custom Hooks|Custom Hooks]]
- [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]
- [[Programmazione/React/Pagine/Rendering Condizionale e Liste|Identita e key]]

## Fonti

- [React: Component e migrazione dalle classi](https://react.dev/reference/react/Component).
- [React: useState](https://react.dev/reference/react/useState).
- [React: purezza di componenti e hook](https://react.dev/reference/rules/components-and-hooks-must-be-pure).
- [React: conservare e reimpostare lo stato](https://react.dev/learn/preserving-and-resetting-state).
- [React: StrictMode](https://react.dev/reference/react/StrictMode).

Esempi verificati con React 19.3.0; consultazione del 2026-10-14.
