---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, state-management, frontend]
aliases: [State Management Esterno, Zustand, Redux Toolkit]
prerequisites: []
related: []
---

# State Management Esterno

## Sintesi

Lo state management esterno usa librerie fuori da React per gestire stato condiviso. Serve quando props, state locale e Context non bastano piu per coordinare dati client complessi.

Va distinto dalla cache server: stato UI e dati remoti hanno esigenze diverse.

## Quando usarlo

Usalo quando:

- molti componenti lontani aggiornano lo stesso stato;
- la logica di transizione e complessa;
- serve stato persistente client-side;
- Context causa render troppo ampi;
- vuoi strumenti di debug e pattern espliciti.

Non usarlo solo per evitare props drilling occasionale.

## Come funziona

Esempio concettuale con store:

```jsx
const useCartStore = create((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),
}));

function CartCount() {
  const count = useCartStore((state) => state.items.length);
  return <span>{count}</span>;
}
```

Il componente sottoscrive solo la parte di stato che usa.

## API / Sintassi

Pattern comuni:

- creare uno store;
- definire stato iniziale;
- definire azioni;
- selezionare solo i dati necessari;
- evitare mutazioni non controllate.

Redux Toolkit:

```jsx
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});
```

## Esempio pratico

Usa state esterno per stato client globale, per esempio un pannello laterale aperto da molti punti dell'app:

```jsx
const useLayoutStore = create((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
```

## Varianti

- **Zustand**: store leggero e selettori semplici.
- **Redux Toolkit**: pattern piu strutturato e tooling forte.
- **Jotai/Recoil-like**: stato atomico.
- **Context + reducer**: soluzione interna per casi piccoli.
- **TanStack Query**: non e state client generico, ma cache server.

## Errori comuni

- Mettere dati server nello store invece di usare cache dedicata.
- Creare store globali per stato locale.
- Sottoscrivere interi store causando render inutili.
- Non separare azioni e selettori.
- Usare librerie complesse senza bisogno reale.

## Checklist

- Il problema e stato client o dati server?
- Lo stato e davvero globale?
- I selettori sono granulari?
- Le azioni sono nominate bene?
- La soluzione riduce complessita?
- Esiste una strategia di debug e test?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Context API]]
- [[State colocato]]
- [[Data Fetching e Cache]]
- [[useReducer]]
