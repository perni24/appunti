---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Compound Components Pattern]
prerequisites: []
related: []
---
# Compound Components Pattern

## Sintesi

Nota su Compound Components Pattern in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

I **Compound Components** sono un pattern React in cui piu componenti collaborano tra loro come parti di un unico componente "padre", condividendo stato e comportamento impliciti.

L'idea e simile a elementi HTML come `<select>` e `<option>`: i componenti figli hanno senso soprattutto nel contesto del contenitore principale e ne condividono la logica.

> [!INFO] Obiettivo del pattern
> Il Compound Components Pattern serve a costruire API dichiarative, flessibili e leggibili per componenti complessi come `Tabs`, `Accordion`, `Modal`, `Menu` o `Form`.

---

## 1. Il problema che risolve

Quando un componente diventa complesso, una API basata solo su props puo diventare rigida o difficile da leggere:

```jsx
<Tabs
  activeIndex={0}
  labels={['Profilo', 'Impostazioni']}
  panels={[<Profile />, <Settings />]}
/>
```

Questo approccio funziona, ma:
- forza una struttura prestabilita;
- limita la composizione;
- rende difficile inserire logica o markup personalizzato tra le sezioni.

Con i compound components, invece, l'API diventa piu naturale:

```jsx
<Tabs>
  <Tabs.List>
    <Tabs.Tab index={0}>Profilo</Tabs.Tab>
    <Tabs.Tab index={1}>Impostazioni</Tabs.Tab>
  </Tabs.List>

  <Tabs.Panels>
    <Tabs.Panel index={0}><Profile /></Tabs.Panel>
    <Tabs.Panel index={1}><Settings /></Tabs.Panel>
  </Tabs.Panels>
</Tabs>
```

---

## 2. Struttura di base

Il pattern di solito contiene:

1. un componente principale che gestisce lo stato;
2. sottocomponenti esposti come proprieta statiche;
3. un meccanismo di condivisione dello stato, spesso tramite [[Programmazione/React/Pagine/Context API]];
4. una API orientata alla composizione.

### Esempio semplificato

```javascript
import { createContext, useContext, useState } from 'react';

const TabsContext = createContext(null);

function Tabs({ children }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <TabsContext.Provider value={{ activeIndex, setActiveIndex }}>
      {children}
    </TabsContext.Provider>
  );
}

function Tab({ index, children }) {
  const { activeIndex, setActiveIndex } = useContext(TabsContext);

  return (
    <button
      aria-selected={activeIndex === index}
      onClick={() => setActiveIndex(index)}
    >
      {children}
    </button>
  );
}

function Panel({ index, children }) {
  const { activeIndex } = useContext(TabsContext);

  if (activeIndex !== index) return null;
  return <div>{children}</div>;
}

Tabs.Tab = Tab;
Tabs.Panel = Panel;
```

---

## 3. Come funziona

Il componente principale (`Tabs`) mantiene lo stato condiviso, mentre i sottocomponenti (`Tabs.Tab`, `Tabs.Panel`) leggono quel contesto e reagiscono di conseguenza.

Questo significa che:
- il padre controlla la logica globale;
- i figli restano specializzati;
- il chiamante compone liberamente il markup.

Dal punto di vista architetturale, il pattern separa:
- **state orchestration** nel contenitore;
- **UI specialization** nei sottocomponenti.

---

## 4. Perche usare i Compound Components

### API più dichiarativa
Il JSX descrive la struttura del componente in modo naturale.

### Composizione più flessibile
I consumer possono decidere ordine, layout e markup dei figli.

### Logica condivisa senza prop drilling
Il pattern si integra molto bene con [[Programmazione/React/Pagine/Context API]] per condividere stato e comportamenti.

### Componenti complessi più leggibili
Per widget articolati, una API composta e spesso piu chiara di una lista lunga di props booleane o array paralleli.

---

## 5. Esempio pratico: Accordion

```javascript
import { createContext, useContext, useState } from 'react';

const AccordionContext = createContext(null);

function Accordion({ children }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <AccordionContext.Provider value={{ openIndex, setOpenIndex }}>
      {children}
    </AccordionContext.Provider>
  );
}

function Item({ index, children }) {
  return <div>{children}</div>;
}

function Trigger({ index, children }) {
  const { openIndex, setOpenIndex } = useContext(AccordionContext);

  return (
    <button onClick={() => setOpenIndex(openIndex === index ? null : index)}>
      {children}
    </button>
  );
}

function Content({ index, children }) {
  const { openIndex } = useContext(AccordionContext);

  if (openIndex !== index) return null;
  return <div>{children}</div>;
}

Accordion.Item = Item;
Accordion.Trigger = Trigger;
Accordion.Content = Content;
```

Utilizzo:

```jsx
<Accordion>
  <Accordion.Item index={0}>
    <Accordion.Trigger index={0}>Cos'e React?</Accordion.Trigger>
    <Accordion.Content index={0}>Una libreria per UI.</Accordion.Content>
  </Accordion.Item>
</Accordion>
```

---

## 6. Compound Components vs Props-Based API

| Approccio | Vantaggi | Limiti |
| :--- | :--- | :--- |
| **Props-based API** | Semplice per componenti piccoli | Rigido per casi complessi |
| **Compound Components** | Flessibile, leggibile, composabile | Richiede piu struttura interna |

La regola pratica e:
- per componenti semplici, le props bastano;
- per componenti complessi e altamente compositivi, il pattern composto diventa spesso la scelta migliore.

---

## 7. Relazione con Context API e Custom Hooks

Il Compound Components Pattern viene spesso implementato con:
- [[Programmazione/React/Pagine/Context API]] per condividere lo stato;
- [[Programmazione/React/Pagine/Custom Hooks]] per incapsulare l'accesso al contesto.

Pattern comune:

```javascript
function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('Tabs components must be used inside <Tabs>');
  }

  return context;
}
```

Questo migliora:
- ergonomia;
- messaggi d'errore;
- riuso interno del pattern.

---

## 8. Limiti e tradeoff

Il pattern non e sempre la scelta giusta.

### Svantaggi tipici
- piu complessita interna;
- piu astrazione rispetto a un componente semplice;
- necessita di documentare bene la struttura prevista;
- debugging leggermente piu articolato se il contesto non e gestito bene.

### Rischio comune
Se si usa il pattern per componenti banali, si introduce overhead architetturale senza vero beneficio.

> [!WARNING] Overengineering
> Non ogni componente ha bisogno di sottocomponenti composti. Il pattern ha senso quando la composizione porta davvero chiarezza o flessibilita.

---

## 9. Best Practices

1. **Usa il pattern per componenti con parti semantiche chiare:** Tabs, Accordion, Menu, Modal, Stepper.
2. **Centralizza lo stato nel componente root:** evita duplicazioni o fonti di verita multiple.
3. **Proteggi l'accesso al contesto con custom hook dedicati:** semplifica l'uso e migliora gli errori.
4. **Mantieni l'API coerente e prevedibile:** i sottocomponenti devono avere responsabilita evidenti.
5. **Documenta la struttura prevista:** il consumer deve capire facilmente come comporre i pezzi.
6. **Non abusare del pattern:** per componenti semplici una normale props API e spesso meglio.

---
