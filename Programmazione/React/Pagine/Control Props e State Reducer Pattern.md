---
date: 2026-04-17
tags: [react, design-patterns, control-props, state-reducer, frontend, javascript]
type: #permanent-note
status: budding
---

# Control Props e State Reducer Pattern

I pattern **Control Props** e **State Reducer** servono a rendere un componente piu flessibile, permettendo al consumer di controllarne parzialmente o totalmente il comportamento interno.

Sono particolarmente utili quando stai costruendo componenti riusabili di libreria o componenti complessi come `Toggle`, `Accordion`, `Select`, `Combobox` o `Dialog`.

> [!INFO] Obiettivo del pattern
> Questi pattern risolvono un problema preciso: un componente con stato interno e comodo all'inizio, ma spesso diventa troppo rigido quando l'applicazione ha bisogno di personalizzare logica, side effects o vincoli di business.

---

## 1. Il problema che risolvono

Un componente con stato interno puro e facile da usare:

```jsx
<Toggle />
```

ma puo diventare limitante se il chiamante vuole:
- controllare esplicitamente lo stato;
- bloccare alcuni cambiamenti;
- aggiungere regole di business;
- sincronizzare il componente con uno stato esterno.

In questi casi servono pattern che spostino parte del controllo dal componente al consumer.

---

## 2. Control Props Pattern

Il **Control Props Pattern** in React segue la stessa logica degli input controllati del DOM.

Esempio nativo:

```jsx
<input value={value} onChange={handleChange} />
```

Lo stato non vive piu dentro l'input, ma nel componente padre.

### Applicazione a un componente custom

```javascript
import { useState } from 'react';

function Toggle({ isOn: controlledIsOn, onChange }) {
  const [internalIsOn, setInternalIsOn] = useState(false);
  const isControlled = controlledIsOn !== undefined;
  const isOn = isControlled ? controlledIsOn : internalIsOn;

  function toggle() {
    const nextValue = !isOn;

    if (!isControlled) {
      setInternalIsOn(nextValue);
    }

    onChange?.(nextValue);
  }

  return <button onClick={toggle}>{isOn ? 'ON' : 'OFF'}</button>;
}
```

Qui il componente puo funzionare in due modi:
- **uncontrolled**: usa il proprio stato interno;
- **controlled**: il valore arriva da fuori tramite prop.

---

## 3. Come funziona il Control Props Pattern

La logica tipica e:

1. controllare se una prop di stato e stata fornita;
2. se presente, considerare il componente **controlled**;
3. se assente, usare stato interno;
4. notificare comunque i cambiamenti tramite callback.

Questo crea una API molto flessibile:

```jsx
function App() {
  const [isOn, setIsOn] = useState(true);

  return <Toggle isOn={isOn} onChange={setIsOn} />;
}
```

Dal punto di vista architetturale, il controllo del dato passa dal componente figlio al chiamante.

Questo pattern si collega direttamente al tema di [[Props e Flusso di dati unidirezionale]].

---

## 4. Limiti del solo Control Props

Il Control Props Pattern funziona bene quando il consumer vuole controllare **il valore**, ma non sempre basta quando serve controllare anche **la logica di transizione dello stato**.

Esempio:
- un `Toggle` non deve superare un certo numero di cambi;
- un `Accordion` deve impedire la chiusura dell'ultima sezione;
- una `Select` deve bloccare certe transizioni.

In questi casi entra in gioco lo **State Reducer Pattern**.

---

## 5. State Reducer Pattern

Lo **State Reducer Pattern** permette al consumer di intercettare e modificare la logica di aggiornamento dello stato.

L'idea e:
- il componente definisce un reducer interno di default;
- il consumer puo passare un reducer personalizzato;
- ogni cambiamento di stato passa attraverso quel reducer.

### Esempio

```javascript
import { useReducer } from 'react';

function defaultReducer(state, action) {
  switch (action.type) {
    case 'toggle':
      return { on: !state.on };
    default:
      return state;
  }
}

function Toggle({ reducer = defaultReducer }) {
  const [state, dispatch] = useReducer(reducer, { on: false });

  return (
    <button onClick={() => dispatch({ type: 'toggle' })}>
      {state.on ? 'ON' : 'OFF'}
    </button>
  );
}
```

Consumer con reducer custom:

```javascript
function limitedToggleReducer(state, action) {
  if (action.type === 'toggle' && state.on) {
    return state;
  }

  return defaultReducer(state, action);
}
```

---

## 6. Relazione con `useReducer`

Lo State Reducer Pattern si appoggia molto bene a [[useReducer]], perche separa chiaramente:
- stato;
- azioni;
- logica di transizione.

Questo rende il componente:
- piu estensibile;
- piu testabile;
- piu adatto a casi complessi.

In pratica, il reducer interno diventa il punto di estensione dell'API.

---

## 7. Control Props vs State Reducer

| Pattern | Cosa controlla il consumer | Quando usarlo |
| :--- | :--- | :--- |
| **Control Props** | Il valore dello stato | Quando basta controllare il dato finale |
| **State Reducer** | La logica di transizione dello stato | Quando serve personalizzare il comportamento interno |

Molto spesso i due pattern convivono nello stesso componente.

---

## 8. Esempio combinato

Un componente piu avanzato puo:
- supportare `isOn` e `onChange` per essere controlled;
- usare un reducer custom per modificare la logica interna quando non e totalmente controllato.

Questo approccio e potente, ma aumenta anche la complessita dell'API.

Per questo conviene usarlo solo su componenti davvero riusabili o destinati a casi articolati.

---

## 9. Tradeoff e complessita

Questi pattern sono molto utili, ma non sono gratuiti.

### Vantaggi
- piu flessibilita;
- migliore riusabilita;
- maggiore controllo per il consumer;
- API piu adatte a librerie di componenti.

### Svantaggi
- implementazione piu complessa;
- maggiore superficie API;
- rischio di inconsistenze tra modalita controlled e uncontrolled;
- necessita di documentazione chiara.

> [!WARNING] Complessita API
> Se un componente e semplice e usato solo localmente, introdurre questi pattern puo essere overengineering. Hanno senso quando la flessibilita richiesta e reale e ripetuta.

---

## 10. Best Practices

1. **Supporta control props solo se il caso d'uso e reale:** non aggiungere complessita "preventiva".
2. **Mantieni coerente il comportamento controlled/uncontrolled:** i due modi d'uso non devono entrare in conflitto.
3. **Esplicita bene le callback:** il consumer deve capire quando e con quali dati viene notificato un cambiamento.
4. **Usa reducer puri:** la logica di transizione deve restare prevedibile e testabile.
5. **Documenta i casi di override:** se il consumer puo cambiare il reducer, deve sapere quali action type esistono.
6. **Combina questi pattern con criterio:** insieme sono potenti, ma aumentano il carico cognitivo dell'API.

---
