---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - hooks
  - reducer
  - state
aliases:
  - useReducer
  - Reducer pattern
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]"
  - "[[Programmazione/React/Pagine/Context API|Context API]]"
title: useReducer
---

# useReducer

## Sintesi

`useReducer` gestisce stato locale descrivendo gli aggiornamenti come **azioni**. React passa stato e azione al **reducer**, una funzione pura che restituisce il prossimo stato. Il vantaggio e centralizzare transizioni collegate, non rendere lo stato globale o aggiornare la UI piu velocemente.

Esempi per React 19.3.0 nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Nessun backend o libreria di gestione dello stato necessario.

## Quando usarlo

Usa `useReducer` quando:

- lo stato ha molti campi collegati;
- ci sono molte azioni possibili;
- la logica di update e complessa;
- vuoi separare rendering e transizioni;
- `useState` produce molti setter scollegati.

Per uno stato semplice, `useState` resta piu chiaro. Dipendere dal valore precedente non basta a richiedere un reducer: anche `useState` supporta updater funzionali.

## Come funziona

Il flusso e: evento -> `dispatch(action)` -> reducer -> nuovo render. L'azione descrive cosa e successo; il reducer decide come cambia lo stato. `type` e una convenzione utile, non un campo imposto da React.

Contatore minimo, completo e indipendente dall'esempio del form:

```jsx
import { useReducer } from "react";

export function counterReducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      throw new Error(`Azione sconosciuta: ${action.type}`);
  }
}

export default function Counter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <section aria-label="Contatore">
      <p role="status">Conteggio: {state.count}</p>
      <button type="button" onClick={() => dispatch({ type: "decrement" })}>-1</button>
      <button type="button" onClick={() => dispatch({ type: "increment" })}>+1</button>
      <button type="button" onClick={() => {
        dispatch({ type: "increment" });
        dispatch({ type: "increment" });
      }}>+2</button>
    </section>
  );
}
```

I due dispatch di `+2` vengono applicati in sequenza allo stato in lavorazione: non sono due sostituzioni calcolate dal medesimo snapshot. Leggere `state.count` nello stesso handler mostrerebbe comunque lo snapshot di quel render.

## API / Sintassi

Schema da usare dentro un componente; `reducer`, `initialArg` e `init` sono forniti dall'applicazione:

```jsx
const [state, dispatch] = useReducer(reducer, initialArg, init);
```

- Senza terzo argomento, lo stato iniziale e `initialArg`. Con `init`, React usa `init(initialArg)` all'inizializzazione; non chiamare `init(initialArg)` a ogni render per sbaglio.
- Cambiare `initialArg` in un render successivo non resetta lo stato. Serve un'azione esplicita o una nuova identita del componente, per esempio una `key` diversa.
- `dispatch` ha identita stabile per l'istanza e non restituisce il nuovo stato o una Promise da attendere.
- Il valore restituito dal reducer **sostituisce** lo stato: React non unisce automaticamente i campi degli oggetti.
- Se restituisci lo stesso stato secondo `Object.is`, React puo saltare l'aggiornamento; non usare una mutazione seguita da `return state`.

Reducer e initializer devono essere puri: nessun fetch, DOM, timer, scrittura in storage, contatore globale o generazione casuale di ID. Crea eventuali ID nell'evento e passali nell'azione. Strict Mode puo chiamare reducer e initializer due volte in sviluppo; non significa raddoppiare l'azione dell'utente.

## Esempio pratico

Form con dati annidati, validazione e stato dell'operazione. Sostituisci `src/App.jsx`; mantieni gli altri file del progetto introduttivo. L'azione `submit` verifica e conferma **solo in memoria**: il testo "Confermato localmente" non implica persistenza o invio a un server.

```jsx
import { useId, useReducer } from "react";

export function createForm(initialName = "") {
  return {
    values: { name: initialName, role: "reader" },
    status: "editing",
    error: "",
  };
}

export function formReducer(state, action) {
  switch (action.type) {
    case "change": {
      const allowed = action.name === "name" || action.name === "role";
      if (!allowed || typeof action.value !== "string") {
        throw new Error("Campo o valore non valido");
      }
      if (action.name === "role" && !["reader", "editor"].includes(action.value)) {
        throw new Error("Ruolo non valido");
      }
      if (state.values[action.name] === action.value) return state;
      return {
        ...state,
        values: { ...state.values, [action.name]: action.value },
        status: "editing",
        error: "",
      };
    }
    case "submit": {
      const name = state.values.name.trim();
      if (name.length < 2) {
        return { ...state, status: "invalid", error: "Inserisci almeno 2 caratteri." };
      }
      return {
        values: { ...state.values, name },
        status: "saved",
        error: "",
      };
    }
    case "reset":
      return createForm(action.initialName);
    default:
      throw new Error(`Azione sconosciuta: ${action.type}`);
  }
}

export default function ProfileForm({ initialName = "Ada" }) {
  const [state, dispatch] = useReducer(formReducer, initialName, createForm);
  const errorId = useId();

  return (
    <main>
      <h1>Profilo locale</h1>
      <form noValidate onSubmit={(event) => {
        event.preventDefault();
        dispatch({ type: "submit" });
      }}>
        <p>
          <label>
            Nome
            <input
              value={state.values.name}
              aria-invalid={Boolean(state.error)}
              aria-describedby={state.error ? errorId : undefined}
              onChange={(event) => dispatch({
                type: "change", name: "name", value: event.target.value,
              })}
            />
          </label>
        </p>
        <p>
          <label>
            Ruolo
            <select value={state.values.role} onChange={(event) => dispatch({
              type: "change", name: "role", value: event.target.value,
            })}>
              <option value="reader">Lettore</option>
              <option value="editor">Editor</option>
            </select>
          </label>
        </p>
        {state.error && <p id={errorId} role="alert">{state.error}</p>}
        <button type="submit">Conferma</button>
        <button type="button" onClick={() => dispatch({ type: "reset", initialName })}>
          Ripristina
        </button>
        <p role="status">
          {state.status === "saved"
            ? `Confermato localmente: ${state.values.name} (${state.values.role}).`
            : "Modifiche non confermate."}
        </p>
      </form>
    </main>
  );
}
```

Contratto: `initialName` e una stringa; le azioni sono oggetti interni al programma, non JSON arbitrario proveniente da rete. Il controllo dei campi evita errori del chiamante, non sostituisce validazione e autorizzazione server. Il ruolo del demo non concede alcun permesso reale.

Prova a inviare un nome fatto di spazi, poi ` Grace ` e ruolo Editor. Prima appare l'errore associato all'input; poi il nome viene normalizzato e confermato. Modificare un campo torna a `editing` e cancella la vecchia conferma. `Ripristina` ricrea lo stato con il valore **corrente** della prop `initialName`.

`noValidate` rende osservabile la validazione del reducer nel demo; non e una misura di sicurezza. Due caratteri secondo `length` sono una regola didattica, non una politica universale sui nomi.

### Invio asincrono

Per un server reale, aggiungi transizioni nominate e fai la richiesta nell'handler o nel livello dedicato, non nel reducer:

| Azione | Prossimo stato |
| --- | --- |
| `submitStarted` | `status: "submitting"`, errore svuotato |
| `submitSucceeded` | `status: "saved"`, dati confermati dal server |
| `submitFailed` | `status: "error"`, messaggio gestibile dalla UI |

Durante l'invio definisci cosa possono fare modifica, reset e invio ripetuto. Se ammetti richieste sovrapposte, occorre riconoscere quelle obsolete, per esempio con un ID di richiesta. Un reducer da solo non cancella la rete o risolve le race condition: vedi [[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]] e [[Programmazione/React/Pagine/useEffect|useEffect]]. La tabella e un progetto di transizioni, non codice di un backend gia implementato.

## Varianti

- **Reducer estratto**: spostalo in un modulo puro e testa stato/azione/risultato senza montare React.
- **Reducer + Context**: distribuisce lo stato di un provider; due chiamate separate a `useReducer` non condividono nulla automaticamente.
- **Macchina a stati**: uno `status` unico riduce combinazioni contraddittorie di booleani, ma il reducer non vieta da solo transizioni illegali. Le guardie vanno definite esplicitamente.
- **Redux-like pattern**: azioni e reducer sono concetti riutilizzabili, non equivalgono a installare uno store globale, middleware o strumenti di Redux.
- **Azioni sconosciute**: qui un errore rende visibili i refusi. In un reducer che riceve intenzionalmente azioni non pertinenti, `return state` puo essere una scelta documentata; non e obbligatorio ignorarle.

## Errori comuni

- Copiare solo l'oggetto esterno e mutare `state.values`: copia anche ogni livello che modifichi.
- Dimenticare un `return`: il nuovo stato diventa `undefined`.
- Restituire solo il campo cambiato: perdi gli altri campi, perche non c'e merge automatico.
- Aspettare `dispatch` con `await` per leggere il nuovo stato: non e una Promise di completamento del render.
- Avviare richieste nel reducer o ricavare ID da `Date.now()` li dentro: risultati impuri, soprattutto con riesecuzioni di sviluppo.
- Usare azioni generiche come `setData` per nascondere tutte le transizioni o introdurre reducer per un semplice booleano.

## Checklist

- Le azioni descrivono eventi riconoscibili e restituiscono sempre uno stato valido?
- Stato e azione di ingresso rimangono invariati anche se congelati nei test?
- Inizializzazione e reset hanno un comportamento esplicito quando cambiano le props?
- Errori e successo si escludono o sono combinazioni volute?
- Testati invalidita, correzione, conferma, reset e azioni sconosciute?
- Effetti esterni separati; `useState` non sarebbe piu semplice?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/Context API|Context API]]
- [[Programmazione/React/Pagine/State Management Esterno|State Management Esterno]]
- [[Programmazione/React/Pagine/Control Props e State Reducer Pattern|Control Props e State Reducer Pattern]]
- [[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]
- [[Programmazione/React/Pagine/Custom Hooks|Custom Hooks]]

## Fonti

- [React: useReducer](https://react.dev/reference/react/useReducer), inizializzazione, dispatch e caveat.
- [React: estrarre la logica in un reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer), azioni, purezza e organizzazione.
- [React: aggiornare oggetti nello stato](https://react.dev/learn/updating-objects-in-state), copie annidate e immutabilita.
- [React: aggiornamenti in coda](https://react.dev/learn/queueing-a-series-of-state-updates), snapshot e aggiornamenti sequenziali.

Documentazione React 19.3 consultata il 2026-10-15.
