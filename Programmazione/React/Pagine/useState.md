---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - react
  - hooks
  - state
aliases:
  - useState
prerequisites:
  - "[[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e flusso dati]]"
related:
  - "[[Programmazione/React/Pagine/Derived state|Derived state]]"
  - "[[Programmazione/React/Pagine/useReducer|useReducer]]"
title: useState
---

# useState

## Sintesi

`useState` conserva un dato locale che partecipa al rendering. Restituisce il valore di **questo render** e un setter: chiamarlo richiede un aggiornamento, non modifica la variabile gia in esecuzione.

Esempi client verificabili nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]], con React 19.3.0. Ogni blocco completo e un modulo separato; i frammenti dichiarati come schemi richiedono il componente circostante.

## Quando usarlo

Usalo per input, toggle, selezioni, modali e filtri. Il dato vive nel componente proprietario; se serve ai fratelli, spostalo nel loro antenato comune e passa props/callback.

Non salvare anche il totale di una lista se puoi calcolarlo dalla lista. Per transizioni complesse considera `useReducer`; per informazioni imperative non visibili considera `useRef`. Context e store esterni risolvono esigenze di condivisione, non sostituiscono automaticamente lo stato locale.

## Come funziona

### Snapshot e coda

Le funzioni create in un render leggono il suo snapshot. Anche dopo un `await`, una callback gia avviata non riceve automaticamente le variabili del render successivo. Il setter non restituisce una Promise: `await setCount(...)` non attende il commit.

React raggruppa gli aggiornamenti; tre sostituzioni con lo stesso valore non equivalgono a tre incrementi. Un updater riceve invece lo stato pendente, compresi gli updater precedenti nella coda. Nell'esempio, partendo da zero, il primo pulsante porta a 1; il secondo aggiunge davvero 3.

```jsx
import { useState } from "react";

export default function QueueCounter() {
  const [count, setCount] = useState(0);

  function replaceThreeTimes() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  function incrementThreeTimes() {
    setCount((current) => current + 1);
    setCount((current) => current + 1);
    setCount((current) => current + 1);
  }

  return (
    <section>
      <p role="status">Conteggio: {count}</p>
      <button type="button" onClick={replaceThreeTimes}>Tre sostituzioni</button>
      <button type="button" onClick={incrementThreeTimes}>Tre incrementi</button>
      <button type="button" onClick={() => setCount(0)}>Azzera</button>
    </section>
  );
}
```

L'updater e un calcolo puro: niente richieste HTTP, scritture storage o mutazioni al suo interno. In sviluppo Strict Mode puo richiamare initializer e updater per evidenziare impurita; non significa che un click utente debba produrre due operazioni esterne.

### Identita e inizializzazione

L'argomento iniziale non risincronizza lo stato quando cambiano le props. Lo stato resta legato all'identita del componente (tipo, posizione e `key`); uno smontaggio o una nuova identita lo ricreano. Non sopravvive da solo al reload.

Il setter ha identita stabile. Se il nuovo stato e uguale secondo `Object.is`, React puo saltare l'aggiornamento: non contare le chiamate al componente per dedurre le modifiche al DOM.

## API / Sintassi

Schemi da collocare nel corpo di un componente o custom Hook, mai in cicli, condizioni o handler:

```jsx
const [value, setValue] = useState(initialValue);
```

In un handler, sostituisci con un valore oppure accoda un calcolo:

```jsx
setCount((current) => current + 1);
```

Per una preparazione iniziale costosa passa la funzione, non il risultato della chiamata. `loadInitialItems` qui rappresenta un calcolo puro gia definito, non una richiesta asincrona:

```jsx
const [items, setItems] = useState(() => loadInitialItems());
```

Gli oggetti vengono **sostituiti**, non uniti automaticamente come il `setState` delle classi:

```jsx
setUser((user) => ({
  ...user,
  name: "Luca",
}));
```

## Esempio pratico

### Copie degli oggetti e degli array

Modulo completo, utilizzabile come `App.jsx`. `createProfile` crea un oggetto nuovo senza effetti esterni. Lo spread copia un solo livello: per cambiare la citta va copiato anche `address`. Gli elementi dell'array sono stringhe; un array di oggetti richiederebbe di copiare anche gli oggetti modificati.

```jsx
import { useState } from "react";

export function createProfile() {
  return { name: "Luca", address: { city: "Roma" }, skills: ["JS", "SQL"] };
}

export default function ProfileEditor() {
  const [profile, setProfile] = useState(createProfile);

  function changeCity(city) {
    setProfile((current) => ({
      ...current,
      address: { ...current.address, city },
    }));
  }

  function removeSkill(skill) {
    setProfile((current) => ({
      ...current,
      skills: current.skills.filter((item) => item !== skill),
    }));
  }

  return (
    <section>
      <h2>{profile.name}</h2>
      <label>
        Citta
        <input value={profile.address.city} onChange={(event) => changeCity(event.target.value)} />
      </label>
      <ul>
        {profile.skills.map((skill) => (
          <li key={skill}>
            {skill} <button type="button" onClick={() => removeSkill(skill)}>Rimuovi {skill}</button>
          </li>
        ))}
      </ul>
      <p>Competenze: {profile.skills.length}</p>
      <button type="button" onClick={() => setProfile(createProfile())}>Ripristina</button>
    </section>
  );
}
```

Non usare `push`, `splice`, `sort` o `reverse` direttamente sull'array nello stato. Usa una nuova copia, `map`, `filter` o metodi non mutanti. Non serve clonare indiscriminatamente tutto: copia i livelli che stai cambiando.

### Input controllato

Questo form mostra soltanto il testo corrente: non effettua ricerche remote e impedisce la navigazione al submit.

```jsx
import { useState } from "react";

export default function SearchForm() {
  const [query, setQuery] = useState("");

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <label>
        Ricerca
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p>Ricerca: {query}</p>
    </form>
  );
}
```

L'input resta una stringa anche quando e vuoto. Non inizializzarlo con `undefined` per poi trasformarlo in controllato.

## Varianti

- **Stato primitivo**: una stringa, un numero o un booleano, senza copie strutturali.
- **Stato coordinato**: raggruppa dati che devono cambiare insieme; valuta un reducer se aumentano gli eventi.
- **Funzione come dato**: `useState(() => handler)` conserva `handler`; `setHandler(() => nextHandler)` conserva la nuova funzione. Passarla direttamente la farebbe interpretare come initializer/updater.
- **Reset**: un setter ripristina i valori scelti; una nuova `key` ricrea anche tutto lo stato del sottoalbero.

## Errori comuni

- Mutare l'oggetto e ripassare lo stesso riferimento: UI non aggiornata o snapshot precedenti alterati.
- Chiamare il setter incondizionatamente durante il render: ciclo di render. Gli aggiornamenti di questi esempi appartengono agli handler.
- Pensare che lo spread sia una copia profonda o che il setter faccia un merge.
- Usare la prop iniziale come se restasse sincronizzata: scegli invece un componente controllato o un reset esplicito.
- Duplicare stato derivabile o condiviso: diventano possibili due versioni discordanti dello stesso dato.

## Checklist

- Il valore influenza il rendering?
- Il dato appartiene davvero a questo componente?
- Il nuovo stato dipende dal precedente?
- Oggetti e array vengono copiati?
- Il dato potrebbe essere derivato invece di salvato?
- Serve `useReducer` per logica piu complessa?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/State colocato|State colocato]]
- [[Programmazione/React/Pagine/Derived state|Derived state]]
- [[Programmazione/React/Pagine/useReducer|useReducer]]
- [[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e Flusso di dati unidirezionale]]
- [[Programmazione/React/Pagine/Batching|Batching]]
- [[Programmazione/React/Pagine/useRef|useRef]]

## Fonti

Documentazione ufficiale consultata il 2026-10-15; esempi riferiti a React 19.3.0.

- [useState: contratto, initializer, updater e reset](https://react.dev/reference/react/useState).
- [Snapshot dello stato](https://react.dev/learn/state-as-a-snapshot).
- [Coda degli aggiornamenti e batching](https://react.dev/learn/queueing-a-series-of-state-updates).
- [Aggiornare oggetti](https://react.dev/learn/updating-objects-in-state) e [array](https://react.dev/learn/updating-arrays-in-state) senza mutare lo stato precedente.
- [Strict Mode: verifiche di sviluppo](https://react.dev/reference/react/StrictMode).
