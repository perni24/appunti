---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, accessibility, focus]
aliases: [Focus Management, Keyboard navigation]
prerequisites: []
related: []
---

# Focus Management

## Sintesi

Focus management controlla dove si trova il focus da tastiera e come si muove durante interazioni, route change, dialog, menu e componenti dinamici. E fondamentale per accessibilita e UX.

## Quando usarlo

Serve per modali, drawer, menu, tab, form error, route transition, skip link, componenti creati con portal e UI che appare o scompare dinamicamente.

## Come funziona

```jsx
function SearchDialog() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} aria-label="Cerca" />;
}
```

Il focus viene spostato quando il dialog si apre.

## API / Sintassi

Focus imperativo:

```jsx
element.focus();
```

Ref:

```jsx
const ref = useRef(null);
```

Gestione Escape:

```jsx
function handleKeyDown(event) {
  if (event.key === "Escape") onClose();
}
```

## Esempio pratico

Dialog:

1. salva elemento che aveva focus;
2. sposta focus nel dialog;
3. intrappola focus dentro il dialog;
4. chiudi con Escape;
5. restituisci focus all'elemento iniziale.

## Varianti

- **Auto focus controllato**: focus iniziale.
- **Focus restore**: ritorno focus dopo chiusura.
- **Focus trap**: modali.
- **Roving tabindex**: menu, tab, toolbar.
- **Skip link**: salta navigazione.
- **Focus on validation error**: primo campo errato.

## Errori comuni

- Rimuovere outline focus.
- Aprire modali senza spostare focus.
- Non restituire focus alla chiusura.
- Usare elementi non focusable per controlli.
- Non gestire tastiera.
- Confondere focus visuale e focus DOM.

## Checklist

- Tutto e usabile da tastiera?
- Il focus iniziale e prevedibile?
- Il focus torna dove deve?
- I controlli hanno focus visible?
- I portal gestiscono focus?
- I test coprono navigazione tastiera?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[WAI-ARIA]]
- [[Portals]]
- [[Test di accessibilita]]
- [[Gestione Moduli]]
