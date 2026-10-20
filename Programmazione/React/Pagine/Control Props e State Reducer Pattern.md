---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - react
  - patterns
  - state
aliases:
  - Control Props
  - State Reducer Pattern
  - Render props
  - Componenti controllati
prerequisites:
  - "[[Programmazione/React/Pagine/useReducer|useReducer]]"
related:
  - "[[Programmazione/React/Pagine/Compound Components Pattern|Compound Components Pattern]]"
title: Control Props e State Reducer Pattern
---

# Control Props e State Reducer Pattern

## Sintesi

Tre pattern rispondono a domande diverse:

| Pattern | Cosa decide il chiamante |
| --- | --- |
| Control Props | Il valore corrente dello stato |
| State Reducer | Le regole delle transizioni |
| Render Props | Il markup prodotto usando stato e azioni |

Possono collaborare, ma non sono sinonimi. Un componente headless puo usare un custom Hook senza adottarli tutti.

## Quando usarlo

Sono utili in componenti riusabili e design system quando il chiamante deve sincronizzare una selezione, vincolare una transizione o cambiare la presentazione. Se bastano due props e un pulsante, non introdurre un reducer personalizzabile solo per uniformita.

## Come funziona

In modalita controlled il componente **richiede** un cambiamento tramite callback: non puo obbligare il parent ad accettarlo. In modalita uncontrolled aggiorna lo stato interno. La prop `defaultChecked` vale soltanto all'inizializzazione.

Modulo completo per un pulsante toggle. La prop controllata e un booleano; `undefined` significa uncontrolled, non `false`.

```jsx
import { useState } from "react";

export function Toggle({ checked, defaultChecked = false, onCheckedChange, children }) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const value = isControlled ? checked : internalChecked;

  function handleClick() {
    const nextValue = !value;
    if (!isControlled) setInternalChecked(nextValue);
    onCheckedChange?.(nextValue);
  }

  return (
    <button type="button" aria-pressed={value} onClick={handleClick}>
      {children}
    </button>
  );
}

export default function ControlDemo() {
  const [enabled, setEnabled] = useState(false);
  return (
    <>
      <Toggle checked={enabled} onCheckedChange={setEnabled}>Notifiche</Toggle>
      <p>Notifiche: {enabled ? "attive" : "disattive"}</p>
      <Toggle defaultChecked>Anteprima</Toggle>
    </>
  );
}
```

Il nome `onCheckedChange` e una scelta dell'API e riceve un booleano, **non** un evento DOM. L'etichetta rimane stabile mentre `aria-pressed` espone lo stato. `type="button"` evita submit accidentali dentro un form.

Il codice gestisce un toggle per evento utente. Non espone un comando imperativo da richiamare piu volte nello stesso batch; per comporre transizioni rispetto allo stato precedente usa `dispatch` o updater funzionali. Non mettere callback con effetti collaterali dentro updater o reducer: React puo rieseguirli in sviluppo.

## API / Sintassi

- `checked={false}` e comunque controlled; non usare `Boolean(checked)` per distinguere le modalita.
- In controlled `checked` prevale su `defaultChecked`. Il parent deve aggiornare la prop se vuole accettare la richiesta.
- Cambiare `defaultChecked` dopo il mount non resetta lo stato. Una nuova `key` rimonta il componente e perde lo stato locale.
- Non passare da controlled a uncontrolled durante la stessa istanza. React non aggiunge automaticamente un warning a questo componente personalizzato.
- Il callback di questo esempio segnala una richiesta generata dal click, non un commit dello stato; anche il parent puo rifiutarla.

## Esempio pratico

### Reducer personalizzabile e render prop

Secondo modulo indipendente: lo stato rimane interno al custom Hook. Il chiamante puo sostituire il reducer, riusare quello predefinito e scegliere il markup tramite `children`, che qui e una funzione.

```jsx
import { useReducer } from "react";

export function toggleReducer(state, action) {
  switch (action.type) {
    case "toggle":
      return { ...state, on: !state.on, changes: state.changes + 1 };
    case "reset":
      return { on: false, changes: 0 };
    default:
      throw new Error(`Azione sconosciuta: ${action.type}`);
  }
}

export function limitedReducer(state, action) {
  if (action.type === "toggle" && state.changes >= 3) return state;
  return toggleReducer(state, action);
}

export function useToggle({ reducer = toggleReducer } = {}) {
  const [state, dispatch] = useReducer(reducer, { on: false, changes: 0 });
  return {
    ...state,
    toggle: () => dispatch({ type: "toggle" }),
    reset: () => dispatch({ type: "reset" }),
  };
}

export function ToggleState({ reducer, children }) {
  const controls = useToggle({ reducer });
  return children(controls);
}

export default function ReducerDemo() {
  return (
    <ToggleState reducer={limitedReducer}>
      {({ on, changes, toggle, reset }) => (
        <>
          <button type="button" aria-pressed={on}
            disabled={changes >= 3} onClick={toggle}>Modalita compatta</button>
          <p>Cambiamenti: {changes} / 3</p>
          <button type="button" onClick={reset}>Ripristina</button>
        </>
      )}
    </ToggleState>
  );
}
```

La regola vive nel reducer, non soltanto nel `disabled` del pulsante: un dispatch aggiuntivo non supera il limite. `reset` rimane permesso e riporta sempre a `false` e zero. Il reducer e puro, non muta lo stato e restituisce la stessa forma `{ on, changes }`. Tre dispatch nello stesso evento sono elaborati in sequenza, ciascuno sul risultato precedente.

La render prop viene chiamata durante il rendering: non eseguire side effect e non chiamare Hook dentro quella callback. Se servono Hook, estrai un componente e renderizzalo con JSX. Passare una funzione nuova non e di per se un problema di correttezza.

## Varianti

- **Hook diretto**: `useToggle` permette di scrivere la UI nel chiamante senza render prop.
- **Reducer di transizioni open/close**: stesso principio per menu e dialog, ma eventi e stato vanno definiti esplicitamente.
- **Controlled + reducer**: decidi chi applica la transizione finale. Puoi spostare il reducer nel parent, evitando due fonti di verita.
- **Compound components**: condividono stato tramite Context; possono esporre anche control props.

## Errori comuni

- Copiare continuamente la prop controllata nello stato con un effect.
- Pensare che invocare il callback modifichi automaticamente la prop.
- Mutare lo stato, fare richieste HTTP o loggare eventi utente nel reducer.
- Restituire dal reducer solo un frammento dello stato: `useReducer` non esegue merge automatico.
- Disabilitare il reset con la stessa regola che blocca il toggle.
- Scambiare una limitazione UI per un controllo di autorizzazione: il server deve applicare le proprie regole.

## Checklist

- Proprietario dello stato, valore iniziale e callback sono documentati?
- Sono testati `false`, rifiuto del parent, nuova key e variazione del default?
- Reducer puro, azioni ignote e reset hanno un comportamento definito?
- Le transizioni multiple funzionano anche nello stesso batch?
- La UI mantiene etichette, semantica e comportamento da tastiera?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e Flusso di dati unidirezionale]]
- [[Programmazione/React/Pagine/Compound Components Pattern|Compound Components Pattern]]
- [[Programmazione/React/Pagine/useReducer|useReducer]]
- [[Programmazione/React/Pagine/Design system|Design system]]

## Fonti

- [React: condivisione dello stato](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components), [useState](https://react.dev/reference/react/useState) e [useReducer](https://react.dev/reference/react/useReducer).
- [React: render props come alternativa a cloneElement](https://react.dev/reference/react/cloneElement#passing-data-with-a-render-prop).
- Esempi verificati con React e React DOM 19.3.0. Nomi delle props, limite di tre transizioni e strategia di reset sono contratti degli esempi, non API obbligatorie di React.
