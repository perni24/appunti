---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, hooks, performance, memoization]
aliases: [useMemo, useCallback, Memoization strategy]
prerequisites: []
related: []
---

# useMemo e useCallback

## Sintesi

`useMemo` memorizza il risultato di un calcolo; `useCallback` memorizza una funzione. Entrambi servono a ridurre lavoro o identita instabili tra render, ma non sono strumenti da usare ovunque.

La memoization va guidata da misure o da un problema chiaro di identita, non da abitudine.

## Quando usarlo

Usa `useMemo` per calcoli costosi o per stabilizzare valori passati a componenti memoizzati. Usa `useCallback` per stabilizzare callback passate a componenti memoizzati o usate come dipendenze di hook.

Evitali su calcoli banali: aggiungono complessita e non garantiscono miglioramenti.

## Come funziona

```jsx
const filteredItems = useMemo(() => {
  return items.filter((item) => item.name.includes(query));
}, [items, query]);
```

```jsx
const handleSelect = useCallback((id) => {
  onSelect(id);
}, [onSelect]);
```

React riusa il valore finche le dipendenze non cambiano.

## API / Sintassi

`useMemo`:

```jsx
const value = useMemo(() => compute(input), [input]);
```

`useCallback`:

```jsx
const callback = useCallback(() => {
  doSomething(value);
}, [value]);
```

Con `React.memo`:

```jsx
const Row = React.memo(function Row({ item, onSelect }) {
  return <button onClick={() => onSelect(item.id)}>{item.name}</button>;
});
```

## Esempio pratico

```jsx
function ProductList({ products, query, onSelect }) {
  const visibleProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [products, query]);

  const handleSelect = useCallback((id) => {
    onSelect(id);
  }, [onSelect]);

  return visibleProducts.map((product) => (
    <ProductRow key={product.id} product={product} onSelect={handleSelect} />
  ));
}
```

## Varianti

- **`useMemo` per calcolo**: filtri, ordinamenti, trasformazioni costose.
- **`useMemo` per identita oggetto**: props stabili verso child memoizzati.
- **`useCallback` per callback**: identita funzione stabile.
- **`React.memo`**: evita render se props non cambiano.
- **React Compiler**: puo ridurre il bisogno di memoization manuale in progetti compatibili.

## Errori comuni

- Memoizzare tutto senza misurare.
- Usare dipendenze incomplete.
- Pensare che `useMemo` renda immutabile un valore.
- Creare piu complessita del beneficio.
- Usare `useCallback` senza componenti memoizzati o dipendenze rilevanti.
- Nascondere calcoli che dovrebbero essere spostati fuori dal componente.

## Checklist

- Esiste un problema reale di performance o identita?
- Le dipendenze sono complete?
- Il calcolo e davvero costoso?
- Il componente figlio e memoizzato?
- Il profiler conferma il beneficio?
- React Compiler cambia la strategia del progetto?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Profiler e Debugging]]
- [[Virtualizzazione delle liste]]
- [[React Compiler]]
- [[useTransition e useDeferredValue]]
