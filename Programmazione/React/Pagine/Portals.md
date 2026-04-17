---
date: 2026-04-17
tags: [react, portals, frontend, dom, javascript]
type: #permanent-note
status: budding
---

# Portals

I **Portals** permettono di renderizzare un albero React in un nodo DOM diverso da quello in cui il componente appare logicamente nell'albero React.

In altre parole:
- nel **DOM** il contenuto viene montato altrove;
- nell'**albero React** il componente resta figlio logico del suo parent originale.

Questo pattern e molto utile per componenti come:
- modal;
- tooltip;
- dropdown;
- popover;
- overlay fullscreen.

> [!INFO] Perche esistono
> I Portals servono quando il posizionamento DOM normale crea problemi pratici, ad esempio `overflow: hidden`, stacking context, clipping o gerarchie HTML che rendono difficile mostrare elementi flottanti sopra il resto della pagina.

---

## 1. Sintassi di base

In React i portals si creano con `createPortal`.

```javascript
import { createPortal } from 'react-dom';

function Modal({ children }) {
  const modalRoot = document.getElementById('modal-root');

  return createPortal(
    <div className="modal">{children}</div>,
    modalRoot
  );
}
```

Qui il contenuto JSX viene renderizzato dentro `#modal-root`, anche se il componente `Modal` viene usato in un'altra parte dell'applicazione.

---

## 2. Esempio pratico: modal

Markup HTML di base:

```html
<div id="root"></div>
<div id="modal-root"></div>
```

Componente React:

```javascript
import { createPortal } from 'react-dom';

function Modal({ isOpen, children }) {
  const modalRoot = document.getElementById('modal-root');

  if (!isOpen) return null;

  return createPortal(
    <div className="backdrop">
      <div className="dialog">{children}</div>
    </div>,
    modalRoot
  );
}
```

Utilizzo:

```jsx
function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Apri modal</button>

      <Modal isOpen={isOpen}>
        <p>Contenuto della modal</p>
        <button onClick={() => setIsOpen(false)}>Chiudi</button>
      </Modal>
    </>
  );
}
```

Questo evita molti problemi tipici di z-index e clipping.

---

## 3. Come funzionano davvero

Il punto chiave e questo: un portal cambia la posizione nel DOM, ma **non rompe** la relazione logica nell'albero React.

Questo implica che:
- il componente continua a ricevere `props` normalmente;
- puo usare [[Context API]];
- puo usare hook come qualunque altro componente;
- partecipa normalmente al reconciliation di React.

Dal punto di vista concettuale, un portal e un "ponte" tra albero React e destinazione DOM.

---

## 4. Eventi e bubbling

Un aspetto importante dei portals e che gli eventi continuano a propagarsi secondo l'albero React, non solo secondo la posizione fisica nel DOM.

Esempio:

```javascript
function Parent() {
  function handleClick() {
    console.log('click catturato dal parent');
  }

  return (
    <div onClick={handleClick}>
      <Modal>
        <button>Cliccami</button>
      </Modal>
    </div>
  );
}
```

Anche se il bottone viene renderizzato fuori dal nodo DOM del parent, React continua a gestire il bubbling in modo coerente con l'albero React.

> [!INFO] Implicazione pratica
> Questo comportamento e molto utile, ma puo sorprendere se pensi ai portals solo come "spostamento nel DOM". React mantiene la semantica dell'albero componenti, non quella del solo markup fisico.

---

## 5. Quando usare i Portals

### Casi tipici
- modal e dialog;
- menu contestuali;
- tooltip e popover;
- overlay di loading;
- notifiche flottanti;
- componenti che devono uscire da contenitori con `overflow: hidden`.

### Quando non servono
Se il componente non ha problemi di stacking, clipping o layout, introdurre un portal puo aggiungere complessita inutile.

---

## 6. Portals e accessibilita

I portals sono spesso usati per componenti accessibili come modal e dialog, ma da soli non risolvono i problemi di accessibilita.

Con una modal, bisogna gestire anche:
- focus iniziale;
- focus trap;
- chiusura con `Escape`;
- `aria-modal`;
- `role="dialog"`;
- ritorno del focus all'elemento di origine.

Quindi un portal aiuta il layout, ma non sostituisce il lavoro semantico e comportamentale.

Questo si collega ai temi di accessibilita presenti nell'indice React.

---

## 7. Limiti e tradeoff

I portals risolvono problemi reali, ma introducono anche qualche complessita.

### Vantaggi
- migliore gestione di overlay e layering;
- meno problemi di clipping;
- separazione chiara tra contenuto principale e overlay UI.

### Svantaggi
- gestione piu complessa del focus;
- rischio di dipendenza da nodi DOM globali;
- maggiore attenzione necessaria su styling e lifecycle.

### Rischio comune
Usare portals ovunque per componenti normali crea piu complessita di quanta ne tolga.

> [!WARNING] Non tutto deve diventare un portal
> Se il problema si risolve con CSS normale e struttura DOM semplice, un portal non e necessario.

---

## 8. Portals vs Conditional Rendering

Un portal non sostituisce il [[Rendering Condizionale e Liste]].

I due concetti rispondono a problemi diversi:
- **rendering condizionale**: decide se un elemento esiste o no;
- **portal**: decide dove quell'elemento viene montato nel DOM.

Molto spesso si usano insieme:

```javascript
if (!isOpen) return null;
return createPortal(...);
```

---

## 9. Best Practices

1. **Usa i portals per overlay reali:** modal, tooltip, dropdown, popover, menu flottanti.
2. **Prevedi un nodo DOM dedicato:** ad esempio `#modal-root` o `#portal-root`.
3. **Gestisci bene focus e accessibilita:** soprattutto per dialog e componenti interattivi.
4. **Combina portal e rendering condizionale:** evita mount inutili quando il contenuto non deve essere visibile.
5. **Non abusare del pattern:** se il layout standard basta, evita la complessita extra.
6. **Ricorda che context ed eventi funzionano comunque:** il portal cambia il DOM, non rompe l'albero React.

---
