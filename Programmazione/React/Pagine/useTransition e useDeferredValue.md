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
  - concurrent-rendering
aliases:
  - useTransition
  - useDeferredValue
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
  - "[[Programmazione/React/Pagine/useMemo e useCallback|Memoizzazione]]"
related:
  - "[[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]"
  - "[[Programmazione/React/Pagine/Suspense e Lazy Loading|Suspense e Lazy Loading]]"
title: useTransition e useDeferredValue
---

# useTransition e useDeferredValue

## Sintesi

`useTransition` e `useDeferredValue` permettono di dare precedenza alle interazioni urgenti rispetto a una parte del rendering. **Non spostano JavaScript su un altro thread**, non rendono un algoritmo piu veloce e non cancellano richieste di rete.

Con `useTransition` scegli quali aggiornamenti di stato sono una transition; con `useDeferredValue` leggi una versione differita di un valore che hai gia ricevuto. Gli esempi si riferiscono a React/React DOM **19.3.0**.

## Quando usarlo

| Situazione | Strumento |
| --- | --- |
| Controlli il setter di una schermata o di un filtro | `useTransition` |
| Ricevi una prop/valore e vuoi differirne il consumo | `useDeferredValue` |
| Vuoi aspettare che l'utente smetta di digitare | Debounce, con una propria durata |
| Vuoi ridurre il numero di righe nel DOM | Virtualizzazione |
| Un singolo calcolo sincrono blocca a lungo | Ottimizzazione, suddivisione del lavoro o Web Worker |

Prima misura con il Profiler. Su una lista piccola aggiungere scheduling e memoizzazione puo non produrre un beneficio visibile.

## Come funziona

### Aggiornamento urgente e lavoro differibile

Il valore che controlla un input deve aggiornarsi nell'evento, fuori dalla transition. Il rendering dei risultati puo usare un altro stato aggiornato con priorita minore. React puo abbandonare e riprendere il lavoro di render per servire aggiornamenti piu urgenti; il render deve quindi restare puro.

La funzione passata a `startTransition` viene chiamata **subito**: cambia la priorita degli aggiornamenti React, non l'esecuzione del codice arbitrario. Un `filter` enorme eseguito prima del setter blocca comunque. Anche dentro un componente, React non puo interrompere a meta una singola lunga chiamata JavaScript: suddividere componenti e lavoro e distinto dallo scheduling.

### Differire un valore

Quando `query` cambia, il render urgente puo usare ancora il precedente `deferredQuery`; React tenta poi un render con il valore nuovo. Un'altra digitazione puo interrompere quel tentativo. Non c'e un ritardo fisso in millisecondi e non viene applicato un debounce alle richieste.

Il consumo costoso deve stare in un ramo che possa evitare il render urgente. Nel demo il filtro e dentro un componente `memo`, con props stabili. Filtrare nel parent dell'input, oppure passare al figlio un array appena creato o il flag `stale`, vanifica questa separazione. `memo` e un'ottimizzazione, non una garanzia contrattuale di non esecuzione.

## API / Sintassi

```jsx
import { useTransition, useDeferredValue } from "react";
```

- `const [isPending, startTransition] = useTransition()`: `isPending` riguarda la transition associata, non ogni lavoro asincrono dell'app. `startTransition` non restituisce una Promise da attendere.
- `const deferred = useDeferredValue(value, initialValue?)`: al primo render restituisce normalmente `value`; un `initialValue` esplicito permette una prima versione differita. Per valori uguali usa `Object.is`. Preferisci primitivi o oggetti la cui identita sia intenzionalmente stabile.
- Se l'aggiornamento e gia dentro una transition, `useDeferredValue` non aggiunge un secondo differimento dello stesso tipo.
- Esiste anche `startTransition` importato direttamente da React, utilizzabile senza Hook, ma senza il relativo flag `isPending`.

## Esempio pratico

### Due ricerche locali complete

Modulo `SearchComparison.jsx` in un progetto Vite con React 19.3. Rendi `<SearchComparison />` dal tuo `App`. Le due ricerche sono indipendenti e leggono dati locali, senza API o ritardi artificiali. Il componente riceve eventualmente un array stabile di record `{ id, name }`, con ID univoci.

```jsx
import { memo, useDeferredValue, useId, useState, useTransition } from "react";

export const demoItems = Array.from({ length: 2000 }, (_, index) => ({
  id: String(index + 1),
  name: `Documento ${index + 1}`,
}));

export function filterItems(items, query) {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(needle));
}

export const Results = memo(function Results({ items, query }) {
  const found = filterItems(items, query);
  return (
    <>
      <p>{found.length} risultati per: {query || "tutti"}</p>
      {found.length === 0 ? <p>Nessun risultato.</p> : (
        <ul>{found.slice(0, 40).map((item) => <li key={item.id}>{item.name}</li>)}</ul>
      )}
      {found.length > 40 && <p>Visualizzati i primi 40 risultati.</p>}
    </>
  );
});

export function TransitionSearch({ items = demoItems }) {
  const id = useId();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function change(next) {
    setInput(next);
    startTransition(() => setQuery(next));
  }

  return (
    <section aria-label="Ricerca con transition">
      <h2>useTransition</h2>
      <label htmlFor={id}>Filtro transition</label>{" "}
      <input id={id} value={input} onChange={(e) => change(e.target.value)} />{" "}
      <button type="button" onClick={() => change("")}>Azzera</button>
      <p role="status">{isPending ? "Aggiornamento risultati..." : "Risultati aggiornati."}</p>
      <div aria-busy={isPending}><Results items={items} query={query} /></div>
    </section>
  );
}

export function DeferredSearch({ items = demoItems }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const stale = query !== deferredQuery;
  return (
    <section aria-label="Ricerca con valore differito">
      <h2>useDeferredValue</h2>
      <label htmlFor={id}>Filtro differito</label>{" "}
      <input id={id} value={query} onChange={(e) => setQuery(e.target.value)} />{" "}
      <button type="button" onClick={() => setQuery("")}>Azzera</button>
      <p role="status">{stale ? "Risultati della ricerca precedente." : "Risultati aggiornati."}</p>
      <div aria-busy={stale}><Results items={items} query={deferredQuery} /></div>
    </section>
  );
}

export default function SearchComparison({ items = demoItems }) {
  return <><TransitionSearch items={items} /><DeferredSearch items={items} /></>;
}
```

Prova `Documento 2000`, un termine assente e Azzera. Gli ID degli input sono distinti; l'indicatore non viene passato come prop al ramo memoizzato. Il limite a 40 righe e una scelta della demo: non e paginazione ne virtualizzazione e il filtro continua a esaminare tutto l'array.

Su un dispositivo veloce potresti non vedere lo stato intermedio. Questo non prova che l'API non funzioni: confronta i commit e la responsivita con dati rappresentativi. Non inserire un ciclo di attesa per "dimostrare" che React esegue codice in parallelo.

## Varianti

### Suspense e dati precedenti

Una transition puo mantenere contenuto gia rivelato quando la nuova versione sospende. Un nuovo boundary puo comunque mostrare il suo fallback. Con `useDeferredValue` la UI puo mostrare input nuovo e risultati vecchi: dichiaralo visivamente, soprattutto se l'utente puo agire sui risultati.

Suspense richiede una sorgente compatibile, come una Promise stabile letta con `use`; un normale fetch in un effect non lo attiva. Qui il filtro e locale. Per dati remoti servono cache e una politica per richieste obsolete separata da `stale`/`isPending`.

### Actions asincrone

In React 19 puoi passare una Action `async` alla funzione di `useTransition`: l'attesa contribuisce al pending. Nella versione documentata, i setter **dopo `await`** richiedono un'altra chiamata a `startTransition` per essere marcati come transition. Un setter dentro un timer non eredita automaticamente il contesto esterno.

Il pending non stabilisce quale risposta remota sia la piu recente. Per invii in sequenza considera [[Programmazione/React/Pagine/useActionState|useActionState]]; per letture sostituibili usa annullamento e guardie. Piu transition in corso possono essere raggruppate: non trattare un singolo booleano come registro di ogni richiesta.

Gli errori di una Action associata a `useTransition` possono raggiungere un Error Boundary. La funzione standalone non ha la stessa associazione a un componente: non generalizzare automaticamente la stessa gestione. Esempi completi e limiti sono nelle note su [[Programmazione/React/Pagine/Actions e form actions|Actions]] e [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]].

## Errori comuni

- Mettere nella transition lo stato che controlla il testo dell'input.
- Filtrare nel parent urgente o passare props sempre nuove al figlio memoizzato.
- Aspettarsi che la callback di `startTransition` venga eseguita piu tardi.
- Confondere rendering concorrente con esecuzione parallela del JavaScript.
- Promettere meno richieste HTTP, un ritardo fisso o assenza di race condition.
- Nascondere che i dati mostrati corrispondono ancora al valore precedente.

## Checklist

- L'input si aggiorna urgentemente e il ramo costoso puo evitare quel render?
- Props, identita degli array e purezza del render sono controllate?
- Il Profiler misura un problema reale, distinto dal numero di richieste?
- Dati precedenti e pending sono spiegati nell'interfaccia?
- Dopo await/timer la priorita e intenzionale?
- Cancellazione, errori e ordine delle risposte hanno una politica separata?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Fiber Architecture e Concurrent Mode|Fiber Architecture e Concurrent Mode]]
- [[Programmazione/React/Pagine/Virtualizzazione delle liste|Virtualizzazione delle liste]]
- [[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]
- [[Programmazione/React/Pagine/use hook|use]]
- [[Programmazione/React/Pagine/Gestione della memoria e AbortController|Gestione della memoria e AbortController]]

## Fonti

- [React: useTransition](https://react.dev/reference/react/useTransition), priorita, Actions e limiti.
- [React: useDeferredValue](https://react.dev/reference/react/useDeferredValue), initialValue, valori precedenti e rete.
- [React: startTransition](https://react.dev/reference/react/startTransition), funzione standalone e callback immediata.
- [React: memo](https://react.dev/reference/react/memo), identita delle props e ottimizzazione.
- [React: Suspense](https://react.dev/reference/react/Suspense), rivelazione e contenuto precedente.

Consultate il 2026-10-18. Esempio React/React DOM 19.3.0; non e un benchmark o una promessa di latenza.
