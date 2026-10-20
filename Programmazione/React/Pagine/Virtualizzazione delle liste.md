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
  - performance
  - lists
aliases:
  - Virtualizzazione liste
  - List virtualization
prerequisites:
  - "[[Programmazione/React/Pagine/Rendering Condizionale e Liste|Rendering e liste]]"
  - "[[Programmazione/React/Pagine/useRef|useRef]]"
related:
  - "[[Programmazione/React/Pagine/Virtual DOM|Virtual DOM]]"
  - "[[Programmazione/React/Pagine/Focus Management|Focus Management]]"
title: Virtualizzazione delle liste
---

# Virtualizzazione delle liste

## Sintesi

La virtualizzazione, o windowing, mantiene montata una porzione della lista e simula lo spazio occupato dalle altre righe. Il numero di nodi dipende dal viewport e dal margine di righe aggiuntive, non direttamente dal numero totale dei record.

Riduce il lavoro del DOM, ma non scarica meno dati da sola e non rende piu veloce un filtro eseguito sull'intero array. Non e il [[Programmazione/React/Pagine/Virtual DOM|Virtual DOM]]: quello riguarda il modello di rendering di React.

## Quando usarlo

Valutala quando il profiler mostra un costo significativo nel montare molte righe: archivi, log, tabelle e risultati estesi. Non esiste una soglia universale: poche righe molto complesse possono costare piu di molte righe semplici.

Per elenchi piccoli preferisci il normale rendering. Paginazione e ricerca possono essere piu semplici da usare e rendere disponibili tutti i risultati anche senza scroll continuo. Un dropdown virtualizzato richiede inoltre la gestione completa di tastiera, selezione e focus del relativo widget: non basta riciclare una lista di testo.

## Come funziona

Il contenitore esterno e il viewport scorrevole; un elemento interno rappresenta l'estensione totale. La libreria calcola intervallo e posizione delle righe da montare. L'overscan aggiunge righe prima e dopo quelle visibili per limitare vuoti durante lo scroll, al costo di altro lavoro.

```text
Con altezza fissa di 48 px e viewport di 320 px:
circa 7-8 righe intersecano il viewport, piu il margine overscan.
Il numero preciso cambia durante lo scroll e ai bordi della lista.
```

## API / Sintassi

Qui si usa **TanStack Virtual 3.14.20**, headless: calcola la geometria, mentre markup, stile e accessibilita restano responsabilita dell'app. Il vecchio `FixedSizeList` appartiene all'API v1 di react-window; react-window 2 usa API diverse. Non mescolare esempi di librerie o major differenti.

| API | Ruolo nell'esempio |
| --- | --- |
| `useVirtualizer` | Istanza collegata al contenitore di scroll |
| `count`, `getItemKey` | Numero di righe e ID persistente, distinto dall'indice corrente |
| `estimateSize` | Dimensione stimata; coincide con quella reale solo nella variante fissa |
| `overscan` | Margine di righe aggiuntive |
| `getTotalSize`, `getVirtualItems` | Estensione e righe da posizionare |
| `measureElement` e `data-index` | Misurazione delle righe dinamiche |
| `scrollToIndex` | Scorrimento verso una posizione, non assegnazione del focus |

## Esempio pratico

Nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]], con React 19.3.0 e Vite 8.3.4, installa la dipendenza nella root dell'app, non in Quartz:

```bash
npm install --save-exact @tanstack/react-virtual@3.14.20
```

`src/VirtualLog.jsx` riceve record `{ id, text }` con ID univoci e stabili. Le righe sono di sola lettura; non e un componente listbox o un editor.

```jsx
import { useCallback, useId, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import "./virtual-log.css";

export function VirtualLog({ items, variable = false }) {
  const headingId = useId();
  const scrollRef = useRef(null);
  const getItemKey = useCallback((index) => items[index].id, [items]);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    getItemKey,
    estimateSize: () => 48,
    overscan: 5,
  });

  return (
    <section className="virtual-log">
      <h2 id={headingId}>Archivio eventi</h2>
      <p>Eventi totali: {items.length}</p>
      <div className="virtual-log-actions">
        <button type="button" disabled={items.length === 0}
          onClick={() => virtualizer.scrollToIndex(0, { align: "start" })}>
          Inizio
        </button>
        <button type="button" disabled={items.length === 0}
          onClick={() => virtualizer.scrollToIndex(items.length - 1, { align: "end" })}>
          Fine
        </button>
      </div>
      <div ref={scrollRef} className="virtual-log-viewport"
        role="region" aria-labelledby={headingId} tabIndex={0}>
        {items.length === 0 ? <p>Nessun evento</p> : (
          <ul role="list" className="virtual-log-space"
            style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((row) => (
              <li key={row.key} data-index={row.index}
                data-item-id={items[row.index].id}
                ref={variable ? virtualizer.measureElement : undefined}
                aria-posinset={row.index + 1} aria-setsize={items.length}
                className={`virtual-log-row${variable ? " measured" : ""}`}
                style={{ transform: `translateY(${row.start}px)` }}>
                {items[row.index].text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
```

`src/virtual-log.css`: il box effettivo della variante fissa deve misurare 48 px, bordi e padding inclusi. I testi del demo sono brevi; per testi lunghi usa la variante misurata, non tagliarli senza alternativa.

```css
.virtual-log { max-width: 48rem; }
.virtual-log-actions { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.virtual-log-viewport {
  height: 320px;
  overflow: auto;
  border: 1px solid #767676;
  overflow-anchor: none;
}
.virtual-log-viewport:focus-visible {
  outline: 3px solid #176b3a;
  outline-offset: 2px;
}
.virtual-log-space {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
}
.virtual-log-row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 48px;
  box-sizing: border-box;
  padding: 10px 12px;
  border-bottom: 1px solid #b8b8b8;
  line-height: 26px;
}
.virtual-log-row.measured {
  height: auto;
  min-height: 48px;
  overflow-wrap: anywhere;
}
```

`src/App.jsx` usa dati locali gia caricati, non una richiesta o un flusso live:

```jsx
import { VirtualLog } from "./VirtualLog.jsx";

const events = Array.from({ length: 5000 }, (_, index) => ({
  id: `event-${index + 1}`,
  text: `Evento ${String(index + 1).padStart(5, "0")}`,
}));

export default function VirtualLogDemo() {
  return <VirtualLog items={events} />;
}
```

## Varianti

### Righe misurate

In alternativa al precedente `App.jsx`, questo esempio abilita misurazioni reali. L'altezza totale inizialmente e una stima e si affina quando le righe vengono montate o ridimensionate:

```jsx
import { VirtualLog } from "./VirtualLog.jsx";

const messages = Array.from({ length: 200 }, (_, index) => ({
  id: `message-${index}`,
  text: `Messaggio ${index + 1}: ` + "Dettaglio operativo. ".repeat(1 + index % 8),
}));

export default function MeasuredLogDemo() {
  return <VirtualLog items={messages} variable />;
}
```

Non imporre contemporaneamente un'altezza fissa che taglia il testo. Larghezza, font e immagini possono cambiare le misure; prova anche resize e zoom. Non sovrascrivere le stesse misure con `resizeItem` e `measureElement`. I demo non cambiano modalita a caldo: per farlo serve invalidare le misure, o rimontare intenzionalmente il virtualizer.

### Altre strategie

- **Paginazione**: limita il gruppo di record visualizzati o scaricati. Puo convivere con la virtualizzazione.
- **Infinite loading**: aggiunge dati progressivamente e richiede loading, errore, fine risultati e coordinamento della cache. Non limita da solo i nodi DOM accumulati.
- **Tabelle e griglie**: virtualizzare anche colonne richiede geometria e semantica specifiche, intestazioni e navigazione; una lista di `div` non diventa automaticamente una tabella accessibile.
- **Scroll della finestra/orizzontale**: richiede l'adapter o l'orientamento coerente, non solo cambiare una proprieta CSS.

### Stato, focus e accessibilita

Quando una riga esce dall'intervallo montato puo perdere lo stato locale. Una key stabile identifica il record, ma non conserva un componente smontato: bozze e selezione persistenti vanno mantenute fuori dalla riga, indicizzate per ID.

Nel demo la regione e focalizzabile e usa lo scroll nativo da tastiera; i pulsanti Inizio/Fine non spostano il focus dentro una riga. Con controlli interattivi devi impedire che la riga focalizzata sparisca o gestire esplicitamente il trasferimento del focus. L'overscan da solo non risolve questo problema.

`aria-posinset` indica la posizione da 1 e `aria-setsize` il totale, ma non rende disponibili ai lettori di schermo i nodi non montati. La ricerca nella pagina, la stampa e l'esportazione non possono basarsi solo su questo DOM parziale. Prevedi una vista paginata/accessibile o un'esportazione dei dati, e verifica con tecnologie assistive reali. Il demo non include queste funzioni ne una certificazione di accessibilita.

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

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Rendering Condizionale e Liste|Rendering Condizionale e Liste]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]
- [[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]
- [[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]
- [[Programmazione/React/Pagine/Focus Management|Focus Management]]
- [[Programmazione/React/Pagine/Virtual DOM|Virtual DOM]]

## Fonti

- [TanStack Virtual: introduzione](https://tanstack.com/virtual/latest/docs/introduction), [adapter React](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual) e [API Virtualizer](https://tanstack.com/virtual/latest/docs/api/virtualizer).
- [TanStack: esempio ad altezza fissa](https://tanstack.com/virtual/latest/docs/framework/react/examples/fixed). Il codice sopra usa la versione 3.14.20; la documentazione latest puo evolvere.
- [react-window: documentazione e differenze fra major](https://github.com/bvaughn/react-window).
- [MDN: aria-posinset](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-posinset) e [aria-setsize](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-setsize).
- [React: identita e stato](https://react.dev/learn/preserving-and-resetting-state).
