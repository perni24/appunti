---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, portals, ui]
aliases: [Portals, React Portal]
prerequisites: []
related: []
---

# Portals

## Sintesi

I Portals permettono di renderizzare un componente React in un nodo DOM diverso da quello del parent, mantenendo pero la relazione logica nell'albero React.

Sono utili per modali, tooltip, menu overlay e componenti che devono uscire da contenitori con overflow o stacking context.

## Quando usarlo

Usa un portal quando un elemento visivo deve apparire sopra il resto della pagina o fuori dal layout corrente. Esempi: dialog, popover, toast, tooltip, context menu.

## Come funziona

```jsx
import { createPortal } from "react-dom";

function Modal({ children }) {
  return createPortal(
    <div role="dialog">{children}</div>,
    document.getElementById("modal-root")
  );
}
```

Il DOM cambia posizione, ma gli eventi React continuano a propagarsi secondo l'albero React.

## API / Sintassi

```jsx
createPortal(children, domNode);
```

Esempio HTML:

```html
<div id="root"></div>
<div id="modal-root"></div>
```

## Esempio pratico

```jsx
function ConfirmDialog({ onConfirm, onCancel }) {
  return createPortal(
    <div role="dialog" aria-modal="true">
      <p>Confermi?</p>
      <button onClick={onConfirm}>Si</button>
      <button onClick={onCancel}>Annulla</button>
    </div>,
    document.body
  );
}
```

## Varianti

- **Modal portal**: dialog sopra la pagina.
- **Tooltip portal**: evita clipping da overflow.
- **Toast portal**: area notifiche globale.
- **Menu portal**: menu sopra layout complessi.
- **Portal target dedicato**: nodo DOM specifico.

## Errori comuni

- Ignorare focus management.
- Non gestire `aria-modal`, ruolo e label.
- Dimenticare blocco scroll o inert background quando serve.
- Rendere portal lato server senza verificare DOM disponibile.
- Non chiudere overlay con Escape quando previsto.

## Checklist

- Il portal e davvero necessario?
- Focus iniziale e ritorno focus sono gestiti?
- Il markup e accessibile?
- Lo scroll dietro e controllato?
- Esiste un target DOM stabile?
- Eventi e z-index sono prevedibili?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Focus Management]]
- [[WAI-ARIA]]
- [[Compound Components Pattern]]
- [[Design system]]
