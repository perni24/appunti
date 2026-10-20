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
  - state-management
  - frontend
aliases:
  - State Management Esterno
  - Zustand
  - Redux Toolkit
prerequisites:
  - "[[Programmazione/React/Pagine/useReducer|useReducer]]"
  - "[[Programmazione/React/Pagine/Context API|Context API]]"
related:
  - "[[Programmazione/React/Pagine/Derived state|Derived state]]"
  - "[[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]"
title: State Management Esterno
---

# State Management Esterno

## Sintesi

Uno store esterno conserva dati e operazioni di aggiornamento fuori dallo stato locale di un componente React. I componenti leggono uno snapshot e si sottoscrivono agli aggiornamenti, spesso attraverso selector.

"Esterno" non significa necessariamente globale, persistente o remoto. Uno store puo essere limitato a una pagina, a un provider o a una richiesta server. Stato client e cache dei dati remoti hanno responsabilita diverse.

## Problema che risolve

E utile quando piu parti dell'interfaccia coordinano gli stessi dati, quando servono transizioni centralizzate o quando selector e strumenti di debug rendono il flusso piu chiaro. Non e obbligatorio aspettare che Context diventi inutilizzabile, ma nemmeno introdurre uno store per ogni input.

Prima stabilisci chi possiede il dato:

| Dato | Punto di partenza |
| --- | --- |
| Bozza di un singolo form, apertura locale | Stato del componente |
| Filtro da condividere come link | URL e router |
| Tema o dipendenza di un sottoalbero | Context, con un proprietario esplicito |
| Stato client coordinato fra viste | Store o reducer condiviso |
| Risultati API con scadenza e invalidazione | Cache dedicata, per esempio TanStack Query o RTK Query |

Non e vietato conservare dati ricevuti dal server in uno store. Devi pero gestirne freschezza, richieste concorrenti, errori e invalidazione. RTK Query, per esempio, implementa una cache server sopra Redux: "Redux contiene solo dati client" sarebbe una regola sbagliata.

## Concetto chiave

Il flusso tipico e: evento -> azione -> nuovo stato -> sottoscrizioni -> UI. Il selector ricava il dato necessario, come `state.items.length`, senza duplicarlo nello store. Per un carrello questo conta le righe, non necessariamente la somma delle quantita.

Il componente e sottoscritto allo store; il selector e il confronto del suo risultato determinano quando l'aggiornamento richiede un render. Non significa che lo store non venga letto o che il selector non possa essere rieseguito. Render da props o stato locale restano possibili.

## Dettagli importanti

### Zustand e Redux Toolkit

- **Zustand**: `create` restituisce un hook collegato allo store, con metodi come `getState` e `subscribe`. Il `set` standard fa un merge superficiale al primo livello; gli oggetti annidati vanno aggiornati immutabilmente.
- **Zustand 5**: evita selector che producono sempre un nuovo oggetto/array non stabilizzato. Possono creare snapshot instabili e cicli di aggiornamento; usa selezioni separate, risultati memoizzati o `useShallow` quando il confronto superficiale e appropriato.
- **Redux Toolkit**: `createSlice` genera reducer e action creator; `configureStore` crea lo store. React Redux fornisce `Provider`, `useSelector` e `useDispatch`.
- **Immer**: dentro i reducer di `createSlice`, una scrittura sul draft produce un aggiornamento immutabile. Non autorizza a mutare lo stato restituito da `getState`, gli argomenti esterni o un normale reducer React.
- **Selector Redux**: `useSelector` confronta di default il risultato con `===`. Oggetti nuovi richiedono selector memoizzati, selezioni separate o `shallowEqual`, non l'aspettativa di un confronto profondo automatico.

`getState()` restituisce una lettura istantanea, non una sottoscrizione React. Se chiami manualmente `subscribe`, conserva e invoca la funzione di unsubscribe. In UI usa gli hook della libreria, che gestiscono il collegamento con React.

### Ambito e durata

Uno store a livello di modulo viene condiviso dai componenti che importano quella istanza. Smontare un consumatore non lo resetta. Ricaricare la pagina ricrea invece il modulo: i demo sotto ripartono dallo stato iniziale.

La persistenza richiede una scelta esplicita: quali dati salvare, formato, versione, migrazioni, errori di storage e cosa cancellare al logout. Non inserirvi segreti o considerarla una garanzia di autorizzazione. Se fai SSR, non usare un singleton mutabile con dati utente condiviso fra richieste: servono istanze isolate e snapshot coerenti per hydration.

## Esempio

Due implementazioni **alternative**, non da incollare insieme. Usano React 19.3.0 nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Gli store a livello di modulo sono scelti per un demo SPA client; nessuna rete, persistenza o configurazione SSR.

### Zustand: pannello condiviso

Nella cartella dell'applicazione, non nella cartella `site` del vault:

```sh
npm install --save-exact zustand@5.0.15
```

Sostituisci `src/App.jsx`:

```jsx
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

export function createLayoutStore() {
  return create((set) => ({
    sidebarOpen: false,
    count: 0,
    openSidebar: () => set({ sidebarOpen: true }),
    closeSidebar: () => set({ sidebarOpen: false }),
    increment: () => set((state) => ({ count: state.count + 1 })),
    reset: () => set({ sidebarOpen: false, count: 0 }),
  }));
}

export const useLayoutStore = createLayoutStore();

export function LayoutSummary() {
  const { sidebarOpen, count } = useLayoutStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    count: state.count,
  })));
  return <p role="status">Voci: {count}; pannello: {sidebarOpen ? "aperto" : "chiuso"}.</p>;
}

export function Sidebar() {
  const open = useLayoutStore((state) => state.sidebarOpen);
  const close = useLayoutStore((state) => state.closeSidebar);
  return (
    <aside aria-label="Pannello condiviso" hidden={!open}>
      <h2>Pannello</h2>
      <button type="button" onClick={close}>Chiudi pannello</button>
    </aside>
  );
}

export default function ZustandDemo() {
  const open = useLayoutStore((state) => state.openSidebar);
  const increment = useLayoutStore((state) => state.increment);
  const reset = useLayoutStore((state) => state.reset);
  return (
    <main>
      <h1>Layout con Zustand</h1>
      <button type="button" onClick={open}>Apri pannello</button>
      <button type="button" onClick={increment}>Aggiungi voce</button>
      <button type="button" onClick={reset}>Ripristina</button>
      <LayoutSummary />
      <Sidebar />
    </main>
  );
}
```

Apri il pannello, incrementa due volte e chiudi dal componente `Sidebar`: il riepilogo riflette tutte le azioni. `reset` aggiorna soltanto i due dati e conserva le funzioni grazie al merge superficiale. Usare `set(..., true)` sostituirebbe l'intero stato e potrebbe rimuovere anche le azioni.

L'oggetto prodotto dal selector del riepilogo e stabilizzato da `useShallow`; non e un confronto profondo e non sostituisce l'immutabilita. La factory permette di creare store indipendenti nei test. Il demo usa comunque una sola istanza condivisa e non necessita di un provider Zustand.

### Redux Toolkit: stesso comportamento

In un'applicazione alternativa, installa i due pacchetti:

```sh
npm install --save-exact @reduxjs/toolkit@2.13.0 react-redux@9.3.0
```

Sostituisci `src/App.jsx`:

```jsx
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { Provider, useDispatch, useSelector } from "react-redux";

const layoutSlice = createSlice({
  name: "layout",
  initialState: { sidebarOpen: false, count: 0 },
  reducers: {
    openSidebar(state) { state.sidebarOpen = true; },
    closeSidebar(state) { state.sidebarOpen = false; },
    increment(state) { state.count += 1; },
    reset() { return { sidebarOpen: false, count: 0 }; },
  },
});

export const { openSidebar, closeSidebar, increment, reset } = layoutSlice.actions;
export const layoutReducer = layoutSlice.reducer;

export function makeStore() {
  return configureStore({ reducer: { layout: layoutReducer } });
}

export const store = makeStore();

export function ReduxSummary() {
  const count = useSelector((state) => state.layout.count);
  const open = useSelector((state) => state.layout.sidebarOpen);
  return <p role="status">Voci: {count}; pannello: {open ? "aperto" : "chiuso"}.</p>;
}

export function ReduxSidebar() {
  const open = useSelector((state) => state.layout.sidebarOpen);
  const dispatch = useDispatch();
  return (
    <aside aria-label="Pannello condiviso" hidden={!open}>
      <h2>Pannello</h2>
      <button type="button" onClick={() => dispatch(closeSidebar())}>
        Chiudi pannello
      </button>
    </aside>
  );
}

export function ReduxControls() {
  const dispatch = useDispatch();
  return (
    <>
      <button type="button" onClick={() => dispatch(openSidebar())}>Apri pannello</button>
      <button type="button" onClick={() => dispatch(increment())}>Aggiungi voce</button>
      <button type="button" onClick={() => dispatch(reset())}>Ripristina</button>
    </>
  );
}

export default function ReduxDemo() {
  return (
    <Provider store={store}>
      <main>
        <h1>Layout con Redux Toolkit</h1>
        <ReduxControls />
        <ReduxSummary />
        <ReduxSidebar />
      </main>
    </Provider>
  );
}
```

Ripeti le stesse interazioni. `increment()` crea un'azione; `dispatch(increment())` la invia. La chiave `layout` in `configureStore` spiega il percorso `state.layout.count`. Il provider distribuisce l'istanza dello store, che non viene ricreata a ogni render.

Nei reducer Immer scegli fra modificare il draft e restituire un nuovo stato: non fare entrambe le cose. Il `reset` restituisce un oggetto nuovo; `increment` modifica solo il draft e non restituisce il risultato numerico di un incremento.

## Limiti

- Gli esempi mostrano uno stato UI semplice, non dimostrano che serva una libreria per un singolo pannello. Per un pannello locale, `useState` basta.
- Non c'e un vincitore universale: valuta modello dei dati, selector, strumenti richiesti e convenzioni del progetto. Context con reducer resta un'opzione interna a React.
- Jotai rappresenta l'approccio atomico. Il vecchio riferimento generico "Jotai/Recoil-like" non indica prodotti equivalenti: il repository Recoil e archiviato dal 2025-01-01, quindi e un riferimento storico, non la proposta di questo demo.
- TanStack Query e RTK Query affrontano soprattutto dati remoti e cache. Evita di ricopiare automaticamente gli stessi risultati in un secondo store.
- Persistenza, sincronizzazione fra schede, effetti asincroni, DevTools e integrazione SSR richiedono configurazioni ulteriori, qui non implementate.

## Errori comuni

- Spostare tutte le bozze locali nello store condiviso e perdere il confine del loro ciclo di vita.
- Creare lo store nel corpo del componente a ogni render: perdi l'istanza e le sottoscrizioni.
- Leggere soltanto `getState()` in JSX e aspettarsi aggiornamenti automatici.
- Mutare array o oggetti di Zustand: il merge non e profondo e non rende lecite mutazioni in-place.
- Confondere le scritture su draft Immer con mutazioni ammesse ovunque.
- Sottoscrivere l'intero stato quando serve un singolo campo, oppure restituire oggetti nuovi senza una strategia per l'identita.
- Dimenticare reset dei dati sensibili al cambio utente o condividere un singleton server fra richieste.

## Checklist

- Dato client, URL o cache remota? Una sola fonte autorevole per ciascun dato?
- Ambito e durata dello store espliciti, compreso il reset?
- Azioni leggibili e selector puri, con risultati stabili dove richiesto?
- Copie immutabili e regole della libreria rispettate?
- Store isolati nei test e unsubscribe per sottoscrizioni manuali?
- Persistenza e SSR progettati separatamente, se necessari?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Context API|Context API]]
- [[Programmazione/React/Pagine/State colocato|State colocato]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/useReducer|useReducer]]
- [[Programmazione/React/Pagine/Derived state|Derived state]]

## Fonti

- [Zustand: repository e API di base](https://github.com/pmndrs/zustand), store, hook e sottoscrizioni.
- [Zustand: merge e immutabilita](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/immutable-state-and-merging.md).
- [Zustand: useShallow](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/prevent-rerenders-with-use-shallow.md).
- [Zustand: isolamento delle richieste server](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/nextjs.md).
- [Redux: Quick Start](https://redux.js.org/tutorials/quick-start), Toolkit e React Redux.
- [Redux Toolkit: reducer con Immer](https://redux.js.org/toolkit/usage/immer-reducers).
- [React Redux: hooks e confronti dei selector](https://redux.js.org/react-redux/api/hooks).
- [React: useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore), sottoscrizioni e stabilita dello snapshot.
- [RTK Query: panoramica](https://redux.js.org/toolkit/rtk-query/overview) e [TanStack Query: panoramica](https://tanstack.com/query/latest/docs/framework/react/overview), cache dei dati remoti.
- [Jotai: documentazione](https://jotai.org/docs), modello atomico; [Recoil: repository archiviato](https://github.com/facebookexperimental/Recoil).

Fonti consultate il 2026-10-15. Versioni degli esempi: React 19.3.0, Zustand 5.0.15, Redux Toolkit 2.13.0 e React Redux 9.3.0.
