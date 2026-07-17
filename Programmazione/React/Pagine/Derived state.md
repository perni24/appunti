---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, state, rendering]
aliases: [Derived state, Stato derivato]
prerequisites: []
related: []
---

# Derived state

## Sintesi

Derived state e un valore calcolabile da props, state o dati esistenti. In React, se un valore puo essere derivato durante il render, di solito non va salvato in uno state separato.

Salvare stato derivato crea duplicazione e rischio di inconsistenza.

## Quando usarlo

Deriva valori quando devi filtrare, ordinare, contare, calcolare flag, comporre testo o costruire dati visuali da input gia disponibili.

Memorizza nello state solo cio che non puo essere calcolato in modo affidabile dal resto.

## Come funziona

Meglio:

```jsx
function Cart({ items }) {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return <p>Totale: {total}</p>;
}
```

Peggio:

```jsx
const [total, setTotal] = useState(0);
```

Se `total` dipende sempre da `items`, salvarlo separatamente puo desincronizzarlo.

## API / Sintassi

Calcolo semplice:

```jsx
const fullName = `${user.firstName} ${user.lastName}`;
```

Filtro:

```jsx
const visibleItems = items.filter((item) => item.active);
```

Memoization solo se serve:

```jsx
const sortedItems = useMemo(() => {
  return [...items].sort(compareItems);
}, [items]);
```

## Esempio pratico

```jsx
function ProductTable({ products, query }) {
  const visibleProducts = products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );

  return <Table rows={visibleProducts} />;
}
```

`visibleProducts` non deve essere state: e una vista derivata.

## Varianti

- **Valori derivati semplici**: stringhe, booleani, contatori.
- **Filtri e ordinamenti**: spesso derivati da dati e query.
- **Memoized derived state**: `useMemo` per calcoli costosi.
- **URL-derived state**: filtri derivati da query params.
- **Server-derived state**: dati trasformati da cache remota.

## Errori comuni

- Copiare props in state senza motivo.
- Aggiornare stato derivato con `useEffect`.
- Salvare sia dato originale sia dato calcolato.
- Usare `useMemo` per tutto.
- Dimenticare dipendenze del calcolo memoizzato.

## Checklist

- Il valore puo essere calcolato da dati esistenti?
- Serve davvero conservarlo?
- Potrebbe desincronizzarsi?
- Il calcolo e abbastanza costoso da richiedere `useMemo`?
- Il valore dovrebbe derivare dall'URL o dalla cache?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[useState]]
- [[useMemo e useCallback]]
- [[State colocato]]
- [[Data Fetching e Cache]]
