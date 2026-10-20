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
  - architecture
aliases:
  - Custom Hooks
  - Hook personalizzati
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
  - "[[Programmazione/React/Pagine/useEffect|useEffect]]"
related:
  - "[[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]"
  - "[[Programmazione/React/Pagine/Context API|Context API]]"
title: Custom Hooks
---

# Custom Hooks

## Sintesi

Un custom hook incapsula logica React riutilizzabile, come stato, timer o subscription. Il nome inizia con `use` seguito da una maiuscola, per esempio `useToggle`. Estrae comportamento senza aggiungere un componente wrapper al DOM.

**Condivide la logica, non automaticamente lo stato.** Due chiamate che usano ciascuna `useState` hanno due stati indipendenti, anche nello stesso componente. Un hook che legge un Context o uno store puo invece esporre quella sorgente condivisa.

Esempi per React 19.3.0 nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Sono esempi client, senza API remote o persistenza.

## Quando usarlo

Usa custom hook quando:

- la stessa logica viene duplicata in piu componenti;
- vuoi isolare data fetching, subscription, storage o timer;
- vuoi rendere un componente piu leggibile;
- vuoi testare logica separatamente;
- vuoi creare API interne coerenti.

Non serve attendere una duplicazione: isolare una sincronizzazione complessa puo essere utile anche per un solo componente. Evita invece astrazioni generiche senza un contratto chiaro. Una trasformazione pura che non usa hook dovrebbe normalmente essere una funzione comune, richiamabile anche fuori da React.

## Come funziona

Il corpo del custom hook viene eseguito durante ogni render del componente chiamante. Non e un processo separato e non esegue il suo corpo una sola volta; e React a mantenere lo stato delle chiamate interne agli hook.

Esempio completo: due pannelli con la stessa logica ma stati separati. Puo sostituire `src/App.jsx`:

```jsx
import { useCallback, useId, useState } from "react";

export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => {
    setValue((current) => !current);
  }, []);
  return [value, toggle];
}

export function Panel({ name, initialOpen = false }) {
  const [isOpen, toggleOpen] = useToggle(initialOpen);
  const contentId = useId();

  return (
    <section aria-label={name}>
      <button type="button" onClick={toggleOpen}
        aria-expanded={isOpen} aria-controls={contentId}>
        {name}
      </button>
      <p id={contentId} hidden={!isOpen}>Contenuto di {name}</p>
    </section>
  );
}

export default function Panels() {
  return (
    <main>
      <h1>Pannelli</h1>
      <Panel name="Dettagli" />
      <Panel name="Filtri" />
    </main>
  );
}
```

`initialValue` e un booleano iniziale, non una prop controllata: modificarlo dopo il mount non resetta lo stato. `toggle` usa un updater e non cattura il vecchio booleano. Qui `useCallback` espone una funzione stabile mentre la cache rimane valida; non rende stabile anche la tupla restituita, ricreata a ogni render.

## API / Sintassi

Non esiste una firma obbligatoria: definisci input, output ed effetti del tuo hook. In particolare documenta:

- quali parametri sono iniziali e quali sincronizzati a ogni cambiamento;
- se restituisce un valore, una tupla, un oggetto o funzioni;
- quali risorse apre e chi le chiude;
- se gli oggetti restituiti cambiano identita;
- quali API richiedono il browser.

Chiama questi custom hook al livello superiore di componenti funzione o di altri hook, non dentro eventi, cicli, condizioni o dopo return condizionali. Puoi rendere condizionale la logica **dentro** un effect, mantenendo incondizionata la chiamata dell'hook. La particolare API React `use` ha regole specifiche: non generalizzare la sua eccezione ai custom hook.

Un hook non viene montato come `<UseSomething />`. Puo tecnicamente restituire anche un valore JSX, ma la presentazione normalmente appartiene al componente; non esiste un divieto React sul tipo del valore restituito.

Hook di sincronizzazione del titolo, da chiamare in un componente che sia l'unico proprietario del titolo durante il suo mount:

```jsx
import { useEffect } from "react";

export function useDocumentTitle(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
```

L'effect ripristina il valore precedente prima di applicare un nuovo titolo o allo smontaggio. Se piu componenti scrivono contemporaneamente `document.title`, questi cleanup non costituiscono un sistema di coordinamento: usa un unico responsabile o l'integrazione del framework. Il corpo dell'effect non viene eseguito durante il rendering server.

## Esempio pratico

Debounce *trailing*: il valore iniziale e disponibile subito; i cambiamenti successivi vengono applicati dopo un periodo senza nuovi cambiamenti. Questo demo sostituisce `src/App.jsx` ed e indipendente dai pannelli precedenti.

```jsx
import { useEffect, useId, useState } from "react";

export function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(() => value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedValue(() => value);
    }, delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debouncedValue;
}

const TOPICS = ["React", "Rust", "Python", "PostgreSQL"];

export function DebouncedSearch({ label, delay = 300 }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, delay);
  const inputId = useId();
  const visibleTopics = TOPICS.filter((topic) =>
    topic.toLowerCase().includes(debouncedQuery.trim().toLowerCase()),
  );

  return (
    <section aria-label={label}>
      <h2>{label}</h2>
      <label htmlFor={inputId}>Ricerca {label}</label>
      <input id={inputId} value={query}
        onChange={(event) => setQuery(event.target.value)} />
      <p role="status">Filtro applicato: {debouncedQuery || "(vuoto)"}</p>
      {visibleTopics.length > 0
        ? <ul>{visibleTopics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
        : <p>Nessun argomento.</p>}
    </section>
  );
}

export default function SearchDemo() {
  const [delay, setDelay] = useState(300);
  const [showFirst, setShowFirst] = useState(true);

  return (
    <main>
      <h1>Filtri indipendenti</h1>
      <label>
        Ritardo
        <select value={delay} onChange={(event) => setDelay(Number(event.target.value))}>
          <option value={300}>300 ms</option>
          <option value={600}>600 ms</option>
        </select>
      </label>
      <button type="button" onClick={() => setShowFirst((value) => !value)}>
        {showFirst ? "Nascondi filtro A" : "Mostra filtro A"}
      </button>
      {showFirst && <DebouncedSearch label="A" delay={delay} />}
      <DebouncedSearch label="B" delay={delay} />
    </main>
  );
}
```

Contratto del demo: `delay` e un numero finito tra 0 e 60.000 millisecondi; il select fornisce soltanto 300 o 600. L'hook non valida parametri arbitrari. `value` va trattato come immutabile: mutare in-place un oggetto non produce una nuova dipendenza. I wrapper `() => value` permettono di conservare anche una funzione come valore senza invocarla come initializer/updater.

Prove da fare:

1. Scrivi `Ru` nel filtro A: l'input cambia subito, la lista passa a Rust dopo l'attesa. Il filtro B rimane indipendente.
2. Scrivi una nuova query prima della scadenza: il cleanup annulla il timer precedente; resta l'ultimo valore ricevuto.
3. Cambia il ritardo mentre aspetti: il vecchio timer viene annullato e l'attesa riparte dal nuovo effect con il nuovo ritardo.
4. Nascondi A prima della scadenza: la sua risorsa viene chiusa. Rimostrandolo, input e stato ripartono vuoti; B mantiene i suoi dati.

Il timer parte dall'effect, non dall'istante preciso della pressione del tasto. `setTimeout` indica un ritardo minimo, non una scadenza esatta; anche zero resta asincrono e il browser puo ritardarlo. In Strict Mode setup/cleanup aggiuntivi non devono lasciare timer duplicati.

Questo hook posticipa un **valore**, non annulla una richiesta HTTP gia partita. Per ricerche remote restano necessari gestione errori, risposte obsolete, eventuale abort e cache. La lista del demo e locale e non effettua fetch.

## Varianti

- **UI e form**: toggle, disclosure, stato e validazione; chiarisci se il chiamante controlla il valore o fornisce solo quello iniziale.
- **Subscription e integrazioni**: listener, media query, storage e librerie esterne richiedono cleanup e una strategia per SSR; per store esterni valuta `useSyncExternalStore`.
- **Data fetching**: un hook sopra una cache non deve nascondere errori, retry e ownership dei dati. `useLocalStorage` e solo un nome possibile, non un hook fornito da React.
- **Composizione**: un hook puo usare altri hook e offrire un'API piu specifica. Evita wrapper come `useMount(callback)` che nascondono dipendenze e intenzione della sincronizzazione.
- **Debounce e throttle**: il primo aspetta una pausa, il secondo limita la frequenza secondo una politica scelta. `useDeferredValue` segue invece la schedulazione React, non un ritardo fisso in millisecondi.

## Errori comuni

- Pensare che due `useToggle()` condividano un booleano: per condividerlo solleva lo stato o usa una sorgente condivisa esplicita.
- Chiamare un hook da un handler: chiama l'hook durante il render e usa la funzione che restituisce nell'handler.
- Testare un hook chiamandolo come funzione normale: montalo in un componente di prova; solo le funzioni pure estratte si testano direttamente.
- Omettere dipendenze o cleanup: timer, listener e closure rimangono obsoleti.
- Passare a ogni render un oggetto nuovo al debounce: l'identita diversa riavvia continuamente l'attesa, anche dopo l'aggiornamento prodotto dall'hook.
- Promettere stabilita dell'intero oggetto restituito solo perche una sua funzione usa `useCallback`.
- Leggere `window` durante il render senza considerare server e hydration, oppure credere che un hook renda automaticamente universale un'API browser.

## Checklist

- Nome specifico e contratto di input/output/effetti documentato?
- Chiamate in ordine stabile, senza condizioni o eventi?
- Stato iniziale distinto da input reattivi e sorgenti condivise?
- Cleanup verificato dopo aggiornamento, unmount e con Strict Mode?
- Testate due istanze indipendenti e cambiamenti rapidi dei parametri?
- Eventuale stabilita delle funzioni motivata, senza promettere cache permanenti?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/useEffect|useEffect]]
- [[Programmazione/React/Pagine/useReducer|useReducer]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Context API|Context API]]
- [[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]
- [[Programmazione/React/Pagine/useTransition e useDeferredValue|useTransition e useDeferredValue]]
- [[Programmazione/React/Pagine/use hook|use hook]]

## Fonti

- [React: riusare logica con custom hook](https://react.dev/learn/reusing-logic-with-custom-hooks), naming, composizione e stato indipendente.
- [React: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks), punti di chiamata ammessi.
- [React: useEffect](https://react.dev/reference/react/useEffect), dipendenze e cleanup.
- [React: useState](https://react.dev/reference/react/useState), valore iniziale e funzioni come stato.
- [React: useCallback](https://react.dev/reference/react/useCallback), callback esposte da custom hook.
- [React: use](https://react.dev/reference/react/use), regole particolari dell'API rispetto agli hook.
- [React: useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore), subscription e snapshot di store esterni.
- [React: useDeferredValue](https://react.dev/reference/react/useDeferredValue), differenza rispetto a un ritardo fisso.
- [MDN: setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout), ritardi e limiti del timer browser.

Documentazione React 19.3 e MDN consultata il 2026-10-15.
