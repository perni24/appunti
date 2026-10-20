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
  - rendering
  - liste
  - frontend
aliases:
  - Rendering Condizionale
  - Liste React
  - key React
prerequisites:
  - "[[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e flusso dati]]"
related:
  - "[[Programmazione/React/Indice React|Indice React]]"
title: Rendering Condizionale e Liste
---

# Rendering Condizionale e Liste

## Sintesi

Condizioni JavaScript scelgono quali elementi descrivere; map trasforma dati ripetuti in elementi React. La key identifica un elemento fra i suoi fratelli: non e un contatore di render ne un id HTML.

Identita e stato sono collegati. Una key sbagliata puo far apparire una bozza o una selezione sulla riga sbagliata dopo un riordino.

## Quando usarlo

Per stati di caricamento, errore, risultato vuoto, permessi visuali e liste modificabili. Nascondere un pulsante non impedisce al client di chiamare un'API: l'autorizzazione resta un controllo server.

## Come funziona

### Condizioni esplicite

Contratto di LoadMessage: status e loading, error o success; gli altri valori hanno un fallback visibile.

```jsx
export function LoadMessage({ status }) {
  switch (status) {
    case "loading": return <p role="status">Caricamento...</p>;
    case "error": return <p role="alert">Caricamento non riuscito</p>;
    case "success": return null;
    default: return <p role="alert">Stato non riconosciuto</p>;
  }
}
```

null non produce DOM, ma il componente resta montato nella posizione assegnata dal padre. Se e il padre a rimuovere il componente dall'albero, il suo stato viene eliminato.

Il ternario sceglie due rami; && e adatto quando la parte sinistra e booleana. Questo esempio evita lo zero indesiderato:

```jsx
export function NotificationCount({ count }) {
  return <p>{count > 0 && <strong>Notifiche: {count}</strong>}</p>;
}
```

Con `count && ...`, count uguale a 0 viene renderizzato come testo. In un componente con hook, non inserire nuovi hook dopo un early return che puo cambiare da un render all'altro.

### Key e identita

- Usa un id del dato, stabile fra render e univoco tra fratelli; non deve essere unico in tutta l'app.
- La key va sull'elemento restituito direttamente da map, non su un suo discendente.
- Il figlio non riceve key come prop. Passa anche itemId o il record se serve.
- Non generare Math.random o UUID nel render: nuove key rimontano i componenti.
- L'indice descrive la posizione, non l'identita. E rischioso con inserimenti, eliminazioni, filtri o riordini; valuta il caso realmente statico, non usarlo per tacitare un warning.
- Le key non rendono una lista "gratis": per grandi quantita valuta paginazione o virtualizzazione.

## API / Sintassi

Esempio indipendente con dati gia validati. amountCents e un intero non negativo sicuro, code una stringa e id univoco; la visualizzazione non e un calcolo contabile.

```jsx
const money = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export function OrdersView({ orders, status }) {
  if (status === "loading") return <p role="status">Caricamento...</p>;
  if (status === "error") return <p role="alert">Errore nel caricamento</p>;
  if (status !== "success") return <p role="alert">Stato non riconosciuto</p>;
  if (orders.length === 0) return <p>Nessun ordine</p>;

  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>{order.code} - {money.format(order.amountCents / 100)}</li>
      ))}
    </ul>
  );
}
```

Solo il ramo success accede alla lista. In un'app reale il livello che carica i dati deve distinguere rete, schema e stato della richiesta; un default [] non deve nascondere una risposta invalida.

## Esempio pratico

File `src/App.jsx` nel progetto introduttivo. Tre righe con una bozza locale: scrivi in una riga e inverti l'ordine. Il testo deve seguire il nome della riga, non la posizione.

```jsx
import { useState } from "react";

const initialItems = [
  { id: "a", name: "Analisi" },
  { id: "b", name: "Sviluppo" },
  { id: "c", name: "Verifica" },
];

export function DraftRow({ item, onRemove }) {
  const [draft, setDraft] = useState("");
  return (
    <li>
      <label>
        {item.name}
        <input value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
      <button type="button" onClick={() => onRemove(item.id)} aria-label={`Rimuovi ${item.name}`}>
        Rimuovi
      </button>
    </li>
  );
}

export default function App() {
  const [items, setItems] = useState(initialItems);
  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main>
      <h1>Bozze per attivita</h1>
      <button type="button" onClick={() => setItems((current) => [...current].reverse())}>
        Inverti ordine
      </button>
      {items.length === 0 ? <p>Nessuna attivita</p> : (
        <ul>
          {items.map((item) => <DraftRow key={item.id} item={item} onRemove={removeItem} />)}
        </ul>
      )}
    </main>
  );
}
```

reverse opera su una copia: non modifica lo stato precedente. Rimuovere una riga elimina la sua bozza locale; ricaricare elimina tutte le bozze. Il demo non salva nulla. Per conservarle dopo smontaggio, il proprietario dello stato deve essere spostato o i dati persistiti.

Cambiare volontariamente la key e invece un modo per reimpostare lo stato di un sottoalbero, utile per esempio passando a un'entita diversa.

## Varianti

- Ternario per rami brevi; early return o switch per stati esclusivi.
- Array filtrato e poi mappato: conserva gli id dei dati, non rinumerare le key.
- Piu nodi per voce: Fragment esplicito con key, come nella nota JSX.
- Liste annidate: ogni insieme di fratelli ha il proprio dominio di key.
- Virtualizzazione: riduce elementi montati ma cambia anche il ciclo di vita delle righe; non conservare dati importanti solo in stato locale che puo essere smontato.

## Errori comuni

- Stato che passa alla riga accanto: controlla key basate sull'indice o duplicate.
- Input che si svuota a ogni render: key casuale o componente definito dentro il padre.
- Lista vuota senza messaggio: manca il caso empty.
- Render "protetto" ma API accessibile: la condizione non e autorizzazione.
- map con corpo a blocco senza return: produce valori undefined.
- Ordinare lo stato con sort/reverse direttamente: crea una copia o usa un metodo non mutante.

## Checklist

- Loading, errore, vuoto e successo sono distinti?
- I dati hanno un contratto verificato prima del rendering?
- Key stabili sul livello giusto?
- Riordino ed eliminazione mantengono le bozze sulle righe corrette?
- Lo stato che deve sopravvivere e fuori dal componente smontabile?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/JSX|JSX e Fragment]]
- [[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props]]
- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data fetching]]
- [[Programmazione/React/Pagine/Virtualizzazione delle liste|Virtualizzazione]]

## Fonti

- [React: rendering condizionale](https://react.dev/learn/conditional-rendering).
- [React: liste e key](https://react.dev/learn/rendering-lists).
- [React: identita, conservazione e reset dello stato](https://react.dev/learn/preserving-and-resetting-state).
- [React: aggiornare array nello stato](https://react.dev/learn/updating-arrays-in-state).

Esempi verificati con React 19.3.0; consultazione del 2026-10-14.
