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
  - state
  - architecture
aliases:
  - State colocato
  - Colocation state
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
  - "[[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props]]"
related:
  - "[[Programmazione/React/Pagine/Derived state|Derived state]]"
  - "[[Programmazione/React/Pagine/Feature-based architecture|Feature-based architecture]]"
title: State colocato
---

# State colocato

## Sintesi

Colocare lo stato significa assegnarlo al piu piccolo ambito che puo gestirne **consumatori, regole e durata**. Non significa mettere tutti gli useState nelle foglie, ne scegliere una cartella particolare.

Ogni dato ha un proprietario autorevole. Se due componenti devono coordinarsi, condividono quel dato; se rappresentano due interazioni indipendenti, possono avere stati distinti anche usando lo stesso componente.

## Problema che risolve

Portare ogni bozza, pannello aperto o selezione nello store globale aumenta accoppiamento e regole di reset. All'opposto, duplicare un valore che deve restare sincronizzato crea due fonti di verita e richiede correzioni con effect.

Il criterio non e soltanto quanti componenti leggono il dato. Una bozza usata da una sola schermata puo dover sopravvivere alla sua chiusura: serve allora un proprietario piu duraturo o una persistenza esplicita.

## Concetto chiave

Per ogni stato chiedi chi lo legge, chi lo cambia, quali vincoli coordina e quando deve sparire. Sollevalo al piu vicino antenato comune **adeguato a queste esigenze**, non necessariamente alla root.

| Esigenza | Possibile proprietario | Attenzione |
| --- | --- | --- |
| Disclosure o bozza indipendente | Componente locale | Lo smontaggio perde lo stato |
| Input e risultati coordinati | Antenato comune | Una sorgente, props e callback |
| Dato usato in un sottoalbero | Provider vicino al sottoalbero | Context distribuisce, non persiste |
| Stato applicativo condiviso | Store con scope esplicito | Non serve solo per evitare alcune props |
| Filtro navigabile/condivisibile | URL gestita dal router | Parsing, default e history da definire |
| Risultati remoti | Cache o livello dati | Freschezza e invalidazione non sono stato della bozza |
| Totale o lista filtrata | Calcolo dagli input | Non un altro useState da sincronizzare |

Per un accordion indipendente ogni item puo possedere open. Se deve rimanere aperto un solo item, l'accordion possiede invece l'ID attivo. Per le tab, lista dei selettori e pannello condividono la selezione nel coordinatore; array vuoto e ID rimossi richiedono una policy. I pattern completi e la semantica dei controlli sono trattati in [[Programmazione/React/Pagine/Compound Components Pattern|Compound Components Pattern]] e [[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]].

## Dettagli importanti

### Posizione, identita e durata

Lo stato appartiene all'istanza nell'albero React, non al file della funzione. Riordinare le cartelle non cambia il suo ciclo di vita. Tipo, posizione e key determinano se un'istanza viene conservata o ricreata.

Nascondere un normale sottoalbero montato con hidden non equivale a rimuoverlo dal JSX: nel primo caso lo stato resta, nel secondo viene perso. Hidden non sospende automaticamente effect, timer o subscription. Cambiare key resetta anche i discendenti e puo perdere focus: non usarne una casuale o basata sul testo digitato.

### Condivisione senza copie

Un figlio controllato riceve valore e callback. Non deve aggiungere una copia locale dello stesso valore, salvo una bozza deliberatamente separata con regole di conferma/reset.

Estrarre useState in un custom hook riusa logica, **non crea stato condiviso**: chiamate indipendenti restano indipendenti, a meno che il hook legga una sorgente comune come Context o uno store. Context puo essere limitato a una feature; non e sinonimo di stato globale.

### Rendering e prestazioni

Avvicinare aggiornamenti frequenti al loro utilizzo puo ridurre lavoro nel resto dell'albero. Non garantisce pero che ogni altro componente smetta di renderizzare: contano props, Context, composizione e memoizzazione. Non misurare la correttezza contando i render, soprattutto in Strict Mode; usa il Profiler per problemi reali.

Per un semplice hover visivo usa normalmente CSS. Per URL, cache, sessione o bozze persistenti scegli prima il contratto del dato; non introdurre uno store soltanto per ottimizzare un render ipotetico.

## Esempio

### Un filtro condiviso e un dettaglio locale

Progetto React 19 della nota [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Sostituisci `src/App.jsx` e aggiungi il CSS seguente; nessuna nuova dipendenza o API remota.

```jsx
import { useId, useState } from "react";
import "./colocation.css";

const ITEMS = [
  { id: "pen", name: "Penna" },
  { id: "book", name: "Quaderno" },
  { id: "ruler", name: "Righello" },
];

export function filterItems(items, query) {
  const normalized = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(normalized));
}

export function SearchField({ query, onQueryChange }) {
  const id = useId();
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <div className="catalog-search">
      <label htmlFor={id}>Filtro</label>
      <input id={id} type="search" value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)} />
      <button type="button" aria-expanded={helpOpen}
        aria-controls={`${id}-help`}
        onClick={() => setHelpOpen((open) => !open)}>Dettagli del filtro</button>
      <p id={`${id}-help`} hidden={!helpOpen}>
        Il confronto ignora maiuscole e spazi esterni.
      </p>
    </div>
  );
}

export function Results({ items }) {
  return (
    <div>
      <p role="status">{items.length} risultati</p>
      {items.length === 0 ? <p>Nessun risultato.</p> : (
        <ul>{items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
      )}
    </div>
  );
}

export function Catalog({ title, items, initialQuery = "" }) {
  const headingId = useId();
  const [query, setQuery] = useState(initialQuery);
  const visibleItems = filterItems(items, query);
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <SearchField query={query} onQueryChange={setQuery} />
      <Results items={visibleItems} />
    </section>
  );
}

export default function ColocationDemo() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);
  const [version, setVersion] = useState(0);
  return (
    <main className="colocation-demo">
      <h1>Cataloghi indipendenti</h1>
      <label><input type="checkbox" checked={visible}
        onChange={(event) => setVisible(event.currentTarget.checked)} />
        Primo catalogo visibile</label>
      <label><input type="checkbox" checked={mounted}
        onChange={(event) => setMounted(event.currentTarget.checked)} />
        Primo catalogo montato</label>
      <button type="button" onClick={() => setVersion((value) => value + 1)}>
        Reset primo catalogo
      </button>
      <div hidden={!visible}>
        {mounted && <Catalog key={version} title="Primo" items={ITEMS} />}
      </div>
      <Catalog title="Secondo" items={ITEMS} />
    </main>
  );
}
```

`src/colocation.css`, layout minimo senza dipendenze da un tema esterno:

```css
body { margin: 0; }
.colocation-demo {
  max-width: 60rem;
  padding: 1rem;
  font: 1rem/1.5 Arial, sans-serif;
  overflow-wrap: anywhere;
}
.colocation-demo h1 { font-size: 1.75rem; }
.colocation-demo h2 { font-size: 1.25rem; }
.colocation-demo section { border-top: 1px solid #777; margin-top: 1.5rem; }
.colocation-demo label { display: block; }
.catalog-search input {
  box-sizing: border-box;
  display: block;
  width: 100%;
  max-width: 24rem;
  padding: 0.5rem;
  font: inherit;
}
.colocation-demo button {
  max-width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem;
  font: inherit;
  overflow-wrap: anywhere;
}
.colocation-demo :is(input, button):focus-visible {
  outline: 3px solid #005fcc;
  outline-offset: 2px;
}
```

### Cosa osservare

- Ogni Catalog possiede query, condivisa tra input e risultati tramite il loro antenato. La lista filtrata e derivata, non sincronizzata da un effect.
- SearchField possiede helpOpen: il dettaglio non interessa a Results o al secondo catalogo. Cambiare query non rimonta SearchField e non ne chiude il dettaglio.
- Togliere e rimettere visibile conserva filtro e apertura; togliere e rimettere montato li resetta. Reset cambia la key solo del primo catalogo e lascia intatto il secondo.
- initialQuery viene letta solo all'inizializzazione. Una nuova prop non sovrascrive il filtro gia modificato; per controllarlo dall'esterno cambia il contratto, non aggiungere una sincronizzazione implicita.
- items e un array di record con ID unici stabili e name stringa; title e una stringa non vuota, initialQuery e una stringa. Sono props fidate del demo: i dati esterni vanno validati prima. Il filtro non muta gli input e non implementa ricerca linguistica accent-insensitive.

## Limiti

- Stato locale non significa persistenza: reload e smontaggio non conservano automaticamente bozze.
- Un dato sensibile non e protetto perche locale a un componente. Autorizzazione e isolamento dei dati restano responsabilita separate.
- Colocation del codice e colocation dello stato non sono la stessa cosa; una feature puo usare dati globali e mantenere bozze locali.
- Local storage, URL, Context e cache richiedono politiche di sincronizzazione/reset proprie. Non sono sostituti intercambiabili di useState.

## Errori comuni

- Rendere globale un dettaglio locale senza esigenze di durata o condivisione.
- Duplicare lo stesso valore nei fratelli e sincronizzarlo con effect.
- Lasciare uno stato troppo in basso quando deve sopravvivere allo smontaggio.
- Confondere una bozza con la cache del server o conservare un risultato derivabile.
- Definire componenti dentro altri componenti o usare key instabili e provocare reset involontari.
- Usare Context o uno store come risposta automatica a qualsiasi passaggio di props.

## Checklist

- Proprietario, lettori e scrittori sono espliciti?
- La durata coincide con il requisito, inclusi chiusura, cambio record e reload?
- Ogni copia ha un significato diverso, per esempio bozza contro dato confermato?
- Valori derivabili restano calcoli e filtri condivisibili stanno nell'URL quando necessario?
- Nascondere, smontare e cambiare key hanno comportamenti intenzionali?
- Le prestazioni sono misurate prima di introdurre uno store o memoizzazione?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e Flusso di dati unidirezionale]]
- [[Programmazione/React/Pagine/Context API|Context API]]
- [[Programmazione/React/Pagine/State Management Esterno|State Management Esterno]]
- [[Programmazione/React/Pagine/Derived state|Derived state]]
- [[Programmazione/React/Pagine/Custom Hooks|Custom Hooks]]
- [[Programmazione/React/Pagine/React Router|React Router]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Feature-based architecture|Feature-based architecture]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]

## Fonti

- [React: condividere stato tra componenti](https://react.dev/learn/sharing-state-between-components).
- [React: preservare e resettare lo stato](https://react.dev/learn/preserving-and-resetting-state).
- [React: custom hook e indipendenza dello stato](https://react.dev/learn/reusing-logic-with-custom-hooks).
- [React: struttura dello stato](https://react.dev/learn/choosing-the-state-structure).
- [React: Context](https://react.dev/reference/react/useContext).
- [React: memoizzazione e limiti](https://react.dev/reference/react/memo).

Consultate il 2026-10-19; esempio React 19.3.0. Nessuna garanzia prestazionale basata sul solo posizionamento dello stato.
