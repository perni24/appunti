---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, performance, lists]
aliases: [Virtualizzazione liste, List virtualization]
prerequisites: []
related: []
---

# Virtualizzazione delle liste

## Sintesi

La virtualizzazione renderizza solo gli elementi visibili di una lista lunga, piu un piccolo buffer. Riduce nodi DOM, tempo di render e memoria usata.

E utile quando una lista ha centinaia o migliaia di righe.

## Quando usarlo

Usala per tabelle grandi, feed, log, dropdown estesi, risultati di ricerca e liste dove il DOM diventa pesante.

Non usarla per liste piccole: aggiunge complessita e puo peggiorare accessibilita se implementata male.

## Come funziona

Il contenitore mantiene altezza totale simulata, ma renderizza solo gli item nel viewport.

```text
lista totale: 10.000 righe
DOM reale: 30-80 righe visibili
```

## API / Sintassi

Con librerie come `react-window` o TanStack Virtual:

```jsx
function Row({ index, style }) {
  return <div style={style}>{items[index].name}</div>;
}
```

Il `style` posiziona la riga nello spazio virtuale.

## Esempio pratico

```jsx
<FixedSizeList
  height={400}
  width="100%"
  itemCount={items.length}
  itemSize={40}
>
  {Row}
</FixedSizeList>
```

Il componente mostra solo le righe necessarie per l'altezza visibile.

## Varianti

- **Altezza fissa**: piu semplice e veloce.
- **Altezza variabile**: piu complessa.
- **Virtualizzazione tabella**: righe e colonne.
- **Infinite scroll**: caricamento progressivo.
- **Windowing orizzontale**: colonne larghe.

## Errori comuni

- Virtualizzare liste piccole.
- Non gestire focus e navigazione tastiera.
- Usare altezze variabili senza misurazione corretta.
- Rompere screen reader con markup non semantico.
- Non preservare key e identita.

## Checklist

- La lista e abbastanza grande?
- Il profiler mostra costo reale?
- Altezza righe e prevedibile?
- Accessibilita e focus sono gestiti?
- Infinite loading e virtualizzazione sono coordinati?
- Empty e loading state restano corretti?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Rendering Condizionale e Liste]]
- [[Profiler e Debugging]]
- [[useMemo e useCallback]]
- [[WAI-ARIA]]
