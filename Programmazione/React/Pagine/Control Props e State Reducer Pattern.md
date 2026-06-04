---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: advanced
tags: [react, patterns, state]
aliases: [Control Props, State Reducer Pattern, Render props, Componenti controllati]
prerequisites: []
related: []
---

# Control Props e State Reducer Pattern

## Sintesi

Control Props e State Reducer Pattern sono pattern per componenti riusabili avanzati. Permettono al chiamante di controllare stato e transizioni senza duplicare tutta la logica interna.

Sono utili in librerie UI, design system e componenti headless.

## Quando usarlo

Usali quando un componente deve funzionare sia in modo autonomo sia controllato dal chiamante. Esempi: select, combobox, accordion, tabs, menu, dialog.

## Come funziona

Control prop:

```jsx
function Toggle({ checked, defaultChecked = false, onChange }) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const value = isControlled ? checked : internalChecked;

  function setValue(nextValue) {
    if (!isControlled) setInternalChecked(nextValue);
    onChange?.(nextValue);
  }

  return <button onClick={() => setValue(!value)}>{String(value)}</button>;
}
```

## API / Sintassi

State reducer:

```jsx
function defaultReducer(state, action) {
  switch (action.type) {
    case "open":
      return { ...state, open: true };
    case "close":
      return { ...state, open: false };
    default:
      return state;
  }
}
```

Il chiamante puo intercettare o modificare transizioni.

## Esempio pratico

```jsx
<Toggle
  checked={enabled}
  onChange={setEnabled}
/>
```

Il componente non possiede piu lo stato: lo riceve dal parent e notifica cambiamenti.

## Varianti

- **Controlled component**: valore e callback passati dal parent.
- **Uncontrolled component**: stato interno.
- **Hybrid API**: `value`/`defaultValue`.
- **State reducer**: personalizza transizioni.
- **Render props**: espone stato e azioni a una funzione render.
- **Headless UI**: logica senza stile.

## Errori comuni

- Mescolare controlled e uncontrolled senza avvisi.
- Non chiamare `onChange`.
- Cambiare modalita durante vita del componente.
- Esporre troppe opzioni.
- Non documentare priorita tra stato interno e prop controllata.

## Checklist

- Serve davvero supporto controlled?
- L'API segue `value/defaultValue/onChange`?
- Le transizioni sono prevedibili?
- Gli edge case sono testati?
- La documentazione spiega chi possiede lo stato?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Props e Flusso di dati unidirezionale]]
- [[Compound Components Pattern]]
- [[useReducer]]
- [[Design system]]
