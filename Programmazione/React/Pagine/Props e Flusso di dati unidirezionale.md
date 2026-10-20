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
  - props
  - state
  - frontend
aliases:
  - Props
  - Flusso dati React
  - Children
  - Composizione componenti
prerequisites:
  - "[[Programmazione/React/Pagine/JSX|JSX]]"
related:
  - "[[Programmazione/React/Indice React|Indice React]]"
title: Props e Flusso di dati unidirezionale
---

# Props e Flusso di dati unidirezionale

## Sintesi

Le props sono l'interfaccia tra un componente e chi lo usa: dati, callback e contenuto composto. Il padre passa i valori; il figlio puo invocare una callback ricevuta per segnalare un'interazione.

Gli eventi non "risalgono" automaticamente come un canale React separato: e codice del figlio che chiama la funzione. Questo e distinto dalla propagazione degli eventi DOM.

## Problema che risolve

Stabilire chi possiede il dato evita copie non sincronizzate. Se due componenti devono usare lo stesso stato, spesso il proprietario adatto e il loro antenato comune piu vicino.

Non ogni dato deve essere globale. Prima di introdurre context o uno store, valuta stato locale, passaggio esplicito delle props e composizione.

## Concetto chiave

Props e stato del render sono snapshot immutabili per convenzione. **React non clona profondamente gli oggetti passati**: modificarne un campo annidato puo alterare dati condivisi senza aggiornare correttamente la UI.

Per cambiare un dato il figlio invia un intento; il proprietario aggiorna il proprio stato e passa nuovi valori. Una callback puo essere normale e sincrona: il figlio non deve inventare uno stato duplicato per rappresentarne l'esito.

### Valori predefiniti e contratti

```jsx
export function ActionButton({ label = "Salva", disabled = false, onAction }) {
  return <button type="button" disabled={disabled} onClick={onAction}>{label}</button>;
}
```

Il default vale per prop assente o undefined, non per null. Il chiamante deve passare un booleano a disabled e una callback a onAction. JavaScript non convalida questo contratto; TypeScript aiuta i chiamanti tipizzati, ma non verifica dati esterni a runtime.

### Children e composizione

```jsx
export function Card({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
```

Il contenuto annidato arriva come children; non e necessariamente un array o testo. Card non deve conoscere la logica dei suoi figli. Un componente come UserDetails puo essere inserito come child senza far dipendere Card dai dati dell'utente.

Una funzione passata come render prop invece deve essere **invocata** dal componente; non basta renderizzarla come un child ordinario.

## Dettagli importanti

- key serve a React e non arriva come props.key. Se il figlio usa l'identificatore, passa anche id o l'intero record.
- ref ha regole specifiche della versione: React 19 permette di riceverla come prop in componenti funzione; negli esempi React 18 trovi forwardRef. Non serve per il normale flusso dati.
- Una callback onValueChange e un'API definita da noi; React non la tratta automaticamente come un evento DOM.
- Un input controllato riceve value e notifica cambiamenti. Il padre deve aggiornare value; se non lo fa, il contenuto visualizzato rimane quello fornito.
- Usa una stringa fin dall'inizio per un input testuale controllato, non un passaggio undefined/stringa.
- Passare props per qualche livello e normale. Context cambia la distribuzione del dato, non elimina la necessita di definirne il proprietario.

## Esempio

Demo completo in `src/App.jsx` del progetto introduttivo. Dati fittizi gia validati: id stabili e univoci, name stringa. Nessuna chiamata HTTP.

```jsx
import { useId, useState } from "react";

const users = [
  { id: "u-1", name: "Ada" },
  { id: "u-2", name: "Grace" },
  { id: "u-3", name: "Linus" },
];

export function SearchBox({ value, onValueChange }) {
  const inputId = useId();
  return (
    <div>
      <label htmlFor={inputId}>Cerca utenti</label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </div>
  );
}

export function UserList({ items, selectedId, onSelect }) {
  if (items.length === 0) return <p>Nessun utente trovato</p>;
  return (
    <ul>
      {items.map((user) => (
        <li key={user.id}>
          <button
            type="button"
            aria-pressed={selectedId === user.id}
            onClick={() => onSelect(user.id)}
          >
            {user.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleUsers = users.filter((user) => user.name.toLowerCase().includes(normalizedQuery));
  const selectedUser = users.find((user) => user.id === selectedId);

  return (
    <main>
      <h1>Selezione utente</h1>
      <SearchBox value={query} onValueChange={setQuery} />
      <UserList items={visibleUsers} selectedId={selectedId} onSelect={setSelectedId} />
      <p role="status">Selezionato: {selectedUser?.name ?? "nessuno"}</p>
      <button type="button" onClick={() => { setQuery(""); setSelectedId(null); }}>
        Azzera
      </button>
    </main>
  );
}
```

App possiede query e selectedId. La lista filtrata e l'utente selezionato si **derivano** durante il render: non servono altri stati o effect.

La selezione resta valida anche se il filtro nasconde la riga; e una decisione esplicita del demo. Azzera modifica entrambi gli stati. useId collega label e input anche con piu istanze; non genera gli id dei dati o le key della lista.

## Varianti

- Props primitive per configurazioni semplici; oggetti quando costituiscono un contratto coerente.
- Callback per notificare intenti; l'aggiornamento o la richiesta remota appartengono al livello scelto dall'applicazione.
- Children per composizione; render prop quando il contenitore deve fornire dati al contenuto.
- Componente controllato: valore stabilito dal padre; non controllato: stato interno o valore DOM iniziale, con un contratto diverso.

## Limiti

Questi componenti non sono validatori, sistemi di autorizzazione o un motore di ricerca linguistico. Il filtro case-insensitive non copre tutte le regole di ordinamento e normalizzazione Unicode.

Props ordinarie possono includere funzioni e oggetti. Attraversare il confine Server Component/client aggiunge vincoli di serializzazione specifici: non dedurli da questo demo client.

## Errori comuni

- Scrivere user.name = ... dentro il figlio: muta un oggetto condiviso.
- Copiare value in useState e poi aspettarsi che segua sempre le props.
- Un input che non cambia: il padre non aggiorna value dopo la callback.
- Un figlio che si aggiorna "da solo": cercare una copia locale nascosta dello stesso dato.
- Spread indiscriminato verso il DOM: puo inoltrare props applicative o sovrascrivere handler.
- Confondere il callback del figlio con bubbling, context o uno store globale.

## Checklist

- Ogni dato modificabile ha un proprietario chiaro?
- L'input controllato riceve sempre una stringa?
- La callback descrive un intento e riceve il valore atteso?
- I dati derivati non sono duplicati in state?
- Children e props esplicite rendono leggibile il contratto?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/State colocato|Stato colocato]]
- [[Programmazione/React/Pagine/Context API|Context API]]
- [[Programmazione/React/Pagine/Control Props e State Reducer Pattern|Control props e render props]]
- [[Programmazione/React/Pagine/Rendering Condizionale e Liste|Rendering e liste]]
- [[Programmazione/React/Pagine/Derived state|Dati derivati]]

## Fonti

- [React: passare props](https://react.dev/learn/passing-props-to-a-component).
- [React: condividere lo stato](https://react.dev/learn/sharing-state-between-components).
- [React DOM: input controllati](https://react.dev/reference/react-dom/components/input).
- [React: useId](https://react.dev/reference/react/useId).
- [React 19: ref come prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop).

Esempi verificati con React 19.3.0; consultazione del 2026-10-14.
