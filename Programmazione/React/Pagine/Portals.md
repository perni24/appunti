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
  - portals
  - ui
aliases:
  - Portals
  - React Portal
prerequisites:
  - "[[Programmazione/React/Pagine/useEffect|useEffect]]"
related:
  - "[[Programmazione/React/Pagine/Focus Management|Focus Management]]"
title: Portals
---

# Portals

## Sintesi

`createPortal` colloca del contenuto in un altro nodo DOM, mantenendolo nello stesso albero React. Context e propagazione degli eventi React seguono quell'albero; layout, ereditarieta CSS e antenati DOM seguono invece la posizione fisica.

Un portal **non e un modal manager**: non assegna ruoli, non blocca lo sfondo, non posiziona un tooltip e non gestisce da solo focus, Escape o scroll.

## Quando usarlo

E utile per uscire da un contenitore che taglia un overlay, integrare una UI in un nodo di un widget esterno o usare un'area notifiche separata. Non occorre per ogni elemento sovrapposto.

Un `<dialog>` aperto con `showModal()` entra nel top layer del browser anche senza portal. Scegli prima la semantica e il comportamento richiesti, poi valuta dove collocare il DOM.

## Come funziona

- Il nodo destinazione deve esistere. `document.getElementById()` puo restituire `null`.
- Cambiare destinazione ricrea il contenuto del portal, con possibile perdita dello stato locale.
- Il portal non crea una seconda root React: puo leggere i provider del chiamante.
- Un `onClick` su un antenato React puo ricevere click del portal anche se non e un suo antenato DOM. I listener DOM nativi seguono invece il percorso DOM.
- Spostare il contenuto sotto `body` puo cambiare font, custom properties ereditate, selettori CSS e ordine di tabulazione.

## API / Sintassi

```text
createPortal(children, domNode, key?)
```

Nel documento HTML, le due destinazioni sono sorelle. Il secondo nodo deve essere stabile e non rimosso da codice esterno mentre e in uso:

```html
<div id="root"></div>
<div id="overlay-root"></div>
```

## Esempio pratico

### Destinazione client e albero React

Modulo `PortalDemo.jsx`. Il primo render restituisce `null` per il portal; l'effect cerca il target solo sul client. Questo rende identico il placeholder del render server e del primo render di hydration, ma non esegue il portal sul server.

```jsx
import { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const LocaleContext = createContext("en");

export function ClientPortal({ children, targetId = "overlay-root" }) {
  const [target, setTarget] = useState(null);
  useEffect(() => {
    const node = document.getElementById(targetId);
    if (!node) throw new Error(`Target portal assente: ${targetId}`);
    setTarget(node);
  }, [targetId]);
  return target ? createPortal(children, target) : null;
}

function PortalButton() {
  const locale = useContext(LocaleContext);
  return <button type="button">{locale === "it" ? "Saluta" : "Hello"}</button>;
}

export default function PortalDemo() {
  const [clicks, setClicks] = useState(0);
  return (
    <LocaleContext.Provider value="it">
      <div data-testid="logical-parent" onClick={() => setClicks(n => n + 1)}>
        <p>Click ricevuti dal parent: {clicks}</p>
        <ClientPortal><PortalButton /></ClientPortal>
      </div>
    </LocaleContext.Provider>
  );
}
```

Il pulsante si trova in `overlay-root`, legge comunque `it` e aggiorna il contatore del parent React. L'`onClick` sul contenitore serve qui a osservare la propagazione, non a creare un controllo interattivo senza semantica.

Questo wrapper presuppone un `targetId` stabile. Non osserva il DOM per rilevare rimozioni o sostituzioni del nodo. Per target prodotti dinamicamente da un widget, conserva esplicitamente il nodo nello stato e renderizza il portal solo quando e disponibile. Evita accessi a `document` a livello di modulo in codice condiviso con SSR.

### Dialog nativo dentro un portal

Modulo `DialogDemo.jsx`, accanto al precedente. Qui il portal e una scelta organizzativa; la modalita e fornita da `showModal()`, **non** da `createPortal` o da un semplice `aria-modal`.

```jsx
import { useEffect, useId, useRef, useState } from "react";
import { ClientPortal } from "./PortalDemo.jsx";

export function ConfirmDialog({ onConfirm, onCancel }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog ref={ref} aria-labelledby={titleId}
      onClick={event => event.stopPropagation()}
      onCancel={event => { event.preventDefault(); onCancel(); }}>
      <h2 id={titleId}>Conferma operazione</h2>
      <p>Applicare le modifiche alla bozza?</p>
      <button type="button" autoFocus onClick={onCancel}>Annulla</button>
      <button type="button" onClick={onConfirm}>Conferma</button>
    </dialog>
  );
}

export default function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("Nessuna modifica");
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Apri conferma</button>
      <p role="status">{result}</p>
      {open && <ClientPortal>
        <ConfirmDialog onCancel={() => setOpen(false)} onConfirm={() => {
          setResult("Bozza aggiornata");
          setOpen(false);
        }} />
      </ClientPortal>}
    </>
  );
}
```

Il browser rende il resto del documento inerte mentre il dialog e modale. Escape genera `cancel`: il codice impedisce la chiusura automatica e chiede al parent di smontare il componente. I pulsanti seguono lo stesso contratto; il cleanup chiude il dialog e tenta il ritorno al controllo di apertura. Lo stop del click evita di attivare un eventuale handler di un antenato React.

Non aggiungere anche `open` come prop JSX: un dialog aperto con il solo attributo `open` e non modale, e mescolarlo a `showModal()` puo causare errori. Questo esempio usa il mount/unmount come unica fonte di verita; non usa `form method="dialog"` o chiusure imperative esterne che richiederebbero sincronizzazione aggiuntiva.

Limiti: una sola conferma alla volta, nessuna animazione di uscita o richiesta HTTP, nessuna chiusura cliccando il backdrop. In un'app reale verifica anche scroll della pagina, viewport mobile, supporto del browser e destinazione del focus se il controllo di apertura scompare. Non equiparare il test da tastiera a un audit completo con screen reader.

## Varianti

- **Tooltip/menu**: oltre al portal servono posizionamento rispetto all'ancora, gestione tastiera e semantica specifica.
- **Toast**: area separata con annunci adeguati, senza sottrarre automaticamente il focus.
- **Widget esterno**: target posseduto da un'altra libreria, con ciclo di vita esplicito.
- **Dialog senza portal**: spesso sufficiente grazie al top layer del browser.

## Errori comuni

- Credere che `<div role="dialog" aria-modal="true">` renda lo sfondo inerte o intrappoli il focus.
- Cercare il target prima che esista oppure passare `null` a `createPortal`.
- Considerare il portal una garanzia di essere sopra qualsiasi altro elemento: non crea automaticamente il top layer.
- Perdere lo stile spostando il DOM fuori dal contenitore da cui ereditava il tema.
- Dimenticare che click interni possono attivare un antenato React.

## Checklist

- Il target esiste, e stabile ed e disponibile solo quando serve?
- Il primo render SSR/client e coerente?
- Focus iniziale, Tab, Escape e ritorno del focus funzionano?
- Comportamento modale e stato React hanno una sola fonte di verita?
- Stili ereditati, propagazione eventi e scroll sono verificati?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Focus Management|Focus Management]]
- [[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]
- [[Programmazione/React/Pagine/Compound Components Pattern|Compound Components Pattern]]
- [[Programmazione/React/Pagine/Design system|Design system]]

## Fonti

- [React: createPortal](https://react.dev/reference/react-dom/createPortal) e [useEffect](https://react.dev/reference/react/useEffect).
- [MDN: dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog), [showModal](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) e [cancel](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/cancel_event).
- [WAI-ARIA APG: Dialog modale](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- Esempi verificati con React e React DOM 19.3.0 in Chrome; il comportamento nativo va verificato anche nei browser supportati dall'applicazione.
