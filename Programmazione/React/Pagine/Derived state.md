---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - state
  - rendering
aliases:
  - Derived state
  - Stato derivato
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]"
  - "[[Programmazione/React/Pagine/State Management Esterno|State Management Esterno]]"
title: Derived state
---

# Derived state

## Sintesi

Un valore derivato si calcola da dati gia disponibili, come props, stato locale, URL o cache. Se deve sempre rappresentare gli input correnti, calcolalo durante il render o in un selector invece di conservarne una seconda copia modificabile.

Esempi: nome completo, elementi filtrati, totale del carrello e oggetto corrispondente a un ID selezionato. Gli esempi della nota usano React 19.3.0.

## Problema che risolve

Se conservi sia `items` sia `total`, ogni aggiunta, eliminazione e modifica deve aggiornare entrambi correttamente. Una transizione dimenticata rende la UI incoerente. Con `total = calculateTotal(items)` il vincolo e espresso direttamente dal calcolo.

Non significa "nessuna duplicazione e mai lecita". Una bozza modificabile, una fotografia del valore al momento di un evento o uno storico hanno un significato diverso dai dati correnti. In quel caso spiega la divergenza intenzionale e quando azzerarla o confermarla.

## Concetto chiave

Separa **input indipendenti** da **viste degli input**. Un filtro digitato dall'utente e stato; la lista filtrata e derivata. Un ID selezionato e stato; la copia dell'intero record selezionato di solito e evitabile.

Schema minimo, con `user` e `items` forniti dal componente:

```jsx
const fullName = `${user.firstName} ${user.lastName}`;
const visibleItems = items.filter((item) => item.active);
const canSubmit = fullName.trim().length > 0;
```

Queste variabili vengono calcolate nello stesso render degli input. Non serve un effect per "sincronizzarle".

### Perche non usare un effect

Anti-pattern, non un componente completo da copiare: supponi che il totale debba sempre riflettere `items`.

```jsx
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(calculateTotal(items));
}, [items]);
```

Il primo render usa un totale non ancora aggiornato; l'effect programma un ulteriore aggiornamento. Anche aggiungendo tutte le dipendenze mantieni due copie da sincronizzare. Meglio `const total = calculateTotal(items)`.

Gli effect servono a sincronizzarsi con sistemi esterni, non a tenere allineati due valori interni calcolabili. Una richiesta remota, invece, non e un calcolo puro da avviare nel render.

## Dettagli importanti

- **Purezza**: nessuna mutazione degli input. `sort()` modifica l'array; ordina una copia, per esempio `[...items].sort(...)`, o il nuovo array restituito da `filter()`.
- **Memoizzazione**: `useMemo` puo evitare calcoli costosi, ma non e la fonte autorevole del dato e non rende il calcolo immutabile. Le dipendenze devono includere anche una funzione comparatrice reattiva, se usata; una funzione costante di modulo non e una nuova dipendenza a ogni render.
- **Selezione**: conserva l'ID e cerca il record nei dati correnti. Se manca, gestisci `null`; se il filtro lo nasconde, decidi se la selezione deve restare valida.
- **Fonti esterne**: se il filtro e nell'URL, ricavalo dal router invece di mantenere una copia da sincronizzare. Una trasformazione della cache remota puo restare un selector; un effect non e necessario solo perche i dati arrivano da un server.
- **Array nuovi**: `filter` produce un nuovo riferimento. Il calcolo e corretto, ma se alimenta un figlio memoizzato o uno store con selector considera anche le regole di identita, non solo l'uguaglianza del contenuto.

## Esempio

Sostituisci `src/App.jsx` del progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Il carrello e locale: dati fittizi, prezzi interi in centesimi e quantita intere positive. Non sono implementati tasse, pagamento o arrotondamenti commerciali.

```jsx
import { useState } from "react";

export function createItems() {
  return [
    { id: "keyboard", name: "Tastiera", priceCents: 5000, quantity: 1 },
    { id: "mouse", name: "Mouse", priceCents: 2500, quantity: 2 },
    { id: "screen", name: "Monitor", priceCents: 20000, quantity: 1 },
  ];
}

export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
}

export function selectVisible(items, query) {
  const normalized = query.trim().toLowerCase();
  return items
    .filter((item) => item.name.toLowerCase().includes(normalized))
    .sort((left, right) => left.priceCents - right.priceCents);
}

export default function CartDemo() {
  const [items, setItems] = useState(createItems);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const visibleItems = selectVisible(items, query);
  const total = calculateTotal(items);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  function increment(id) {
    setItems((current) => current.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
    ));
  }

  function remove(id) {
    setItems((current) => current.filter((item) => item.id !== id));
    setSelectedId((current) => current === id ? null : current);
  }

  function reset() {
    setItems(createItems());
    setQuery("");
    setSelectedId(null);
  }

  return (
    <main>
      <h1>Carrello locale</h1>
      <label>
        Filtra prodotti
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <button type="button" onClick={reset}>Ripristina carrello</button>
      <p>Totale carrello: {(total / 100).toFixed(2)} EUR</p>
      <p>Righe visibili: {visibleItems.length} su {items.length}</p>
      {visibleItems.length === 0 ? <p>Nessun prodotto visibile.</p> : (
        <ul>
          {visibleItems.map((item) => (
            <li key={item.id}>
              <span>{item.name}: {item.quantity} unita</span>{" "}
              <button type="button" onClick={() => setSelectedId(item.id)}
                aria-pressed={selectedId === item.id}>
                Seleziona {item.name}
              </button>{" "}
              <button type="button" onClick={() => increment(item.id)}>
                Aumenta {item.name}
              </button>{" "}
              <button type="button" onClick={() => remove(item.id)}>
                Rimuovi {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p role="status">
        {selected
          ? `Selezionato: ${selected.name}, ${selected.quantity} unita.`
          : "Nessuna selezione."}
      </p>
    </main>
  );
}
```

Verifiche osservabili:

1. Il totale iniziale e `300.00 EUR`, comprese le due unita di Mouse; le righe sono ordinate per prezzo unitario.
2. Seleziona Mouse e aumentane la quantita: totale `325.00 EUR` e selezione a tre unita, senza sincronizzare una copia di `selected`.
3. Filtra per `Tastiera`: una riga visibile, ma totale dell'intero carrello e selezione di Mouse conservati. E una politica esplicita, non un errore di sincronizzazione.
4. Svuota il filtro e rimuovi Mouse: totale `250.00 EUR` e selezione vuota. Rimuovere tutte le righe produce totale zero e lista vuota.
5. Ripristina: dati, query e selezione tornano al punto iniziale tramite un evento, non tramite un effect.

Il calcolo e piccolo: non serve `useMemo`. Se in seguito diventa costoso, misura prima. La derivazione non valida dati arbitrari: eventuali valori provenienti da rete richiedono un controllo del contratto.

### Una bozza non e una vista dei dati correnti

Esempio alternativo completo per `src/App.jsx`. La bozza parte dal nome della persona, poi puo divergere. Cambiare persona scarta la bozza locale tramite `key`; nessun salvataggio viene effettuato.

```jsx
import { useState } from "react";

const PEOPLE = [
  { id: "ada", name: "Ada" },
  { id: "grace", name: "Grace" },
];

export function NameDraft({ person }) {
  const [draft, setDraft] = useState(person.name);
  return (
    <section>
      <h2>Bozza di {person.name}</h2>
      <label>
        Nome nella bozza
        <input value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
      <p role="status">Bozza: {draft}</p>
    </section>
  );
}

export default function DraftDemo() {
  const [personId, setPersonId] = useState("ada");
  const person = PEOPLE.find((item) => item.id === personId);
  return (
    <main>
      <h1>Bozza locale</h1>
      <label>
        Persona
        <select value={personId} onChange={(event) => setPersonId(event.target.value)}>
          {PEOPLE.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <NameDraft key={person.id} person={person} />
    </main>
  );
}
```

Il select genera solo ID presenti in `PEOPLE`. Con dati esterni, gestisci anche un ID mancante. Se cambia `person.name` per la stessa identita, `useState(person.name)` non sovrascrive la bozza gia montata: stabilisci se mantenerla, chiedere conferma o applicare un reset esplicito. Non aggiungere automaticamente un effect che cancelli cio che l'utente sta scrivendo.

## Limiti

- Una fotografia storica non puo essere ricostruita dai soli dati correnti: conservarla puo essere corretto.
- Calcolare durante il render non rende economico un algoritmo pesante: selector memoizzati, indici o una diversa organizzazione dei dati possono essere necessari.
- Il calcolo puro non sostituisce fetch, validazione o aggiornamenti sul server.
- Il nome storico `getDerivedStateFromProps` e un'API delle classi per casi particolari, non la raccomandazione di copiare tutte le props nello stato.

## Errori comuni

- Conservare insieme sorgente e risultato senza una ragione semantica, poi aggiornarli in punti diversi.
- Usare un effect per il totale o il filtro: introduce un aggiornamento evitabile e un risultato inizialmente non allineato.
- Salvare l'oggetto selezionato anziche l'ID e continuare a mostrare dati vecchi dopo una modifica.
- Ordinare direttamente props o state con `sort()` e mutare i dati originali.
- Usare `useMemo` come correzione di una dipendenza mancante o di dati mutati in-place.
- Trattare una bozza come se dovesse sempre rispecchiare la prop, oppure cambiarne la key a ogni battitura e perdere input e focus.

## Checklist

- Quali sono gli input indipendenti e quali risultati sono ricalcolabili?
- Ogni eventuale copia rappresenta una bozza o fotografia con significato esplicito?
- Selezione assente, nascosta dal filtro o rimossa hanno regole chiare?
- Filtri e ordinamenti lasciano invariati gli input?
- Gli effect presenti sincronizzano davvero sistemi esterni?
- URL, cache e store hanno una fonte autorevole identificata?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]
- [[Programmazione/React/Pagine/State colocato|State colocato]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/State Management Esterno|State Management Esterno]]

## Fonti

- [React: scegliere la struttura dello stato](https://react.dev/learn/choosing-the-state-structure), ridondanza e selezione per ID.
- [React: quando non serve un effect](https://react.dev/learn/you-might-not-need-an-effect), calcoli, filtri e props.
- [React: preservare e resettare lo stato](https://react.dev/learn/preserving-and-resetting-state), identita e key.
- [React: aggiornare array nello stato](https://react.dev/learn/updating-arrays-in-state), copie e ordinamenti.
- [Redux: derivare dati con selector](https://redux.js.org/usage/deriving-data-selectors), viste e memoizzazione.
- [React: getDerivedStateFromProps](https://react.dev/reference/react/Component#static-getderivedstatefromprops), API specifica delle classi e alternative consigliate.

Documentazione consultata il 2026-10-15; esempi React 19.3.0.
