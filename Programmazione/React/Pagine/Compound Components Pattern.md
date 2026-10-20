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
  - components
aliases:
  - Compound Components Pattern
  - Compound Components
prerequisites:
  - "[[Programmazione/React/Pagine/Context API|Context API]]"
related:
  - "[[Programmazione/React/Pagine/Control Props e State Reducer Pattern|Control Props e State Reducer Pattern]]"
title: Compound Components Pattern
---

# Compound Components Pattern

## Sintesi

Il Compound Components Pattern espone un gruppo di componenti coordinati, per esempio `Accordion`, `Accordion.Item`, `Accordion.Header` e `Accordion.Panel`. Il chiamante decide il contenuto e la composizione; il gruppo condivide stato e convenzioni.

La notazione con il punto e una normale proprieta JavaScript, non una funzione speciale di React. Il pattern **non rende automaticamente accessibile** un widget: semantica HTML, tastiera e relazioni ARIA vanno implementate.

## Quando usarlo

Usalo per componenti con parti realmente componibili: accordion, tabs, menu e design system. Per un pulsante o un contenitore con due aree, props esplicite o slot come `header` e `children` sono spesso sufficienti.

## Come funziona

- Il root possiede il valore aperto e l'azione di toggle.
- Ogni item associa il proprio valore a ID DOM univoci.
- Header e panel leggono il contesto dell'item piu vicino.
- Un wrapper DOM intermedio non interrompe Context; un provider annidato puo invece creare un gruppo indipendente.

Non serve scansionare i figli con `Children` o iniettare props con `cloneElement`. Quel metodo rende piu difficile seguire i dati e non equivale ad attraversare il risultato renderizzato di tutti i discendenti.

## API / Sintassi

Contratto dell'esempio:

| Parte | Responsabilita |
| --- | --- |
| `Accordion defaultValue` | Valore inizialmente aperto; `null` significa nessuno |
| `Accordion.Item value` | Stringa unica nel gruppo, non indice della lista |
| `Accordion.Header` | Un solo pulsante per item, dentro un titolo |
| `Accordion.Panel` | Un solo pannello per item, associato al pulsante |

E un accordion **uncontrolled, a singola apertura, richiudibile**. `defaultValue` inizializza lo stato: cambiarlo dopo il mount non seleziona un altro item. Per controllo esterno serve un'API `value/onValueChange`, descritta nella nota sui Control Props.

## Esempio pratico

Modulo completo, utilizzabile come `App.jsx` in un progetto React. I titoli `h3` presuppongono una sezione `h2`: adegua il livello al documento reale.

```jsx
import { createContext, useContext, useId, useState } from "react";

const AccordionContext = createContext(null);
const ItemContext = createContext(null);

function useRequiredContext(context, message) {
  const value = useContext(context);
  if (value === null) throw new Error(message);
  return value;
}

export function Accordion({ defaultValue = null, children }) {
  const [value, setValue] = useState(defaultValue);
  function toggle(itemValue) {
    setValue(current => current === itemValue ? null : itemValue);
  }
  return (
    <AccordionContext.Provider value={{ value, toggle }}>
      {children}
    </AccordionContext.Provider>
  );
}

Accordion.Item = function Item({ value, children }) {
  const group = useRequiredContext(AccordionContext, "Item richiede Accordion");
  const id = useId();
  const item = {
    open: group.value === value,
    triggerId: `${id}-trigger`,
    panelId: `${id}-panel`,
    toggle: () => group.toggle(value),
  };
  return <ItemContext.Provider value={item}>{children}</ItemContext.Provider>;
};

Accordion.Header = function Header({ children }) {
  const item = useRequiredContext(ItemContext, "Header richiede Accordion.Item");
  return (
    <h3>
      <button type="button" id={item.triggerId}
        aria-expanded={item.open} aria-controls={item.panelId}
        onClick={item.toggle}>
        {children}
      </button>
    </h3>
  );
};

Accordion.Panel = function Panel({ children }) {
  const item = useRequiredContext(ItemContext, "Panel richiede Accordion.Item");
  return <div id={item.panelId} hidden={!item.open}>{children}</div>;
};

export default function AccordionDemo() {
  return (
    <section>
      <h2>Domande frequenti</h2>
      <Accordion defaultValue="account">
        <Accordion.Item value="account">
          <div><Accordion.Header>Account</Accordion.Header></div>
          <Accordion.Panel>
            <label>Bozza nome <input defaultValue="Ada" /></label>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="privacy">
          <Accordion.Header>Privacy</Accordion.Header>
          <Accordion.Panel>Puoi esportare i dati dal profilo.</Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </section>
  );
}
```

Tab raggiunge i pulsanti; Invio e Spazio li attivano grazie all'HTML nativo. Frecce, Home ed End sono estensioni opzionali del pattern accordion, non implementate qui. Un **tabs widget ha un contratto diverso**, incluso il movimento del focus tra tab: non basta rinominare questi componenti o aggiungere `role="tab"`.

`hidden` mantiene il pannello montato: la bozza dell'input sopravvive alla chiusura, ma anche eventuali effect rimangono attivi. Il rendering condizionale smonterebbe il pannello, perdendo lo stato locale. Non sovrascrivere `hidden` con CSS che renda comunque visibile il contenuto.

`useId` collega DOM e ARIA; non sostituisce le `key` di una lista. Se generi gli item da un array, usa un ID dei dati sia come `key` sia come `value`. Il componente non rileva valori duplicati o parti mancanti: sono vincoli dell'API da rispettare e testare.

## Varianti

- **Controlled**: il parent possiede la selezione; non mantenere una seconda copia attiva.
- **Apertura multipla**: lo stato diventa un insieme di valori e cambiano le transizioni.
- **Headless**: nessuno stile imposto, ma il contratto di comportamento rimane necessario.
- **Slot**: aree nominate passate come props, senza obbligare i figli a leggere Context.
- **Libreria accessibile**: preferibile per combobox, menu o tabs complessi; verifica comunque l'integrazione nella pagina.

I consumer di Context si aggiornano quando cambia il valore del provider. Questo esempio privilegia chiarezza; non promette isolamento dei render e non richiede `useMemo` per essere corretto.

## Errori comuni

- Usare Header o Panel fuori da Item: l'esempio genera un errore esplicito.
- Duplicare `value`: piu pannelli possono apparire aperti insieme.
- Inserire link o altri controlli dentro il pulsante dell'header.
- Confondere liberta di composizione con assenza di vincoli: servono un header e un panel associati.
- Aggiungere `role="region"` a ogni pannello senza valutare il numero di landmark; qui e omesso intenzionalmente.

## Checklist

- Valori, key e ID hanno ruoli distinti e sono univoci dove richiesto?
- Il pulsante espone `aria-expanded` e un `aria-controls` valido?
- Tastiera, titoli, pannelli nascosti e focus sono verificati nel contesto reale?
- La conservazione dello stato nei pannelli chiusi e intenzionale?
- Serve davvero una API composta invece di props piu semplici?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Context API|Context API]]
- [[Programmazione/React/Pagine/Control Props e State Reducer Pattern|Control Props e State Reducer Pattern]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]

## Fonti

- [React: useContext](https://react.dev/reference/react/useContext), [useId](https://react.dev/reference/react/useId) e [alternative a cloneElement](https://react.dev/reference/react/cloneElement#alternatives).
- [WAI-ARIA APG: Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) e [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): contratti distinti.
- Esempio verificato con React e React DOM 19.3.0; la verifica automatica non sostituisce una prova con tecnologie assistive.
