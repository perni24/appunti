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
  - suspense
  - lazy-loading
  - performance
aliases:
  - Suspense
  - Lazy Loading
  - Bundle splitting
prerequisites:
  - "[[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]"
  - "[[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]"
related:
  - "[[Programmazione/React/Pagine/useTransition e useDeferredValue|Transition e valore differito]]"
  - "[[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]"
title: Suspense e Lazy Loading
---

# Suspense e Lazy Loading

## Sintesi

`lazy` differisce il caricamento del codice di un componente; `Suspense` decide quale UI mostrare mentre un discendente sospende. Il bundler puo trasformare un `import()` dinamico in una chunk separata. Sono tre responsabilita diverse: suddividere, caricare e presentare l'attesa.

Un semplice fetch in un effect non attiva Suspense. Una Promise rifiutata da `lazy` e un errore da gestire con un Error Boundary, non un caricamento da lasciare sullo spinner.

## Quando usarlo

Usa code splitting per funzionalita pesanti non immediatamente necessarie, per esempio un editor o un rapporto aperto su richiesta. Dividere ogni pulsante in una chunk puo peggiorare latenza e complessita; spezzare un modulo non garantisce da solo meno byte totali.

Posiziona il boundary attorno alla parte che puo attendere, lasciando navigazione e controlli utilizzabili. Per route di un framework o router verifica anche le sue API: caricare una route comprende spesso dati, errori e navigazione, non soltanto un componente `lazy`.

## Come funziona

Il primo tentativo di rendering del tipo restituito da `lazy` chiama il loader. Finche la Promise e pendente, il boundary Suspense piu vicino puo mostrare il fallback. Alla risoluzione React usa la proprieta `default` del modulo come componente.

La dichiarazione di `lazy` deve stare a livello di modulo, non dentro il componente. Quel tipo mantiene il risultato del caricamento: rimontarlo non equivale a ricominciare il download. La cache del codice, pero, non conserva lo stato di un'istanza smontata.

## API / Sintassi

| Strumento | Responsabilita |
| --- | --- |
| `import("./ReportsPanel.jsx")` | Promise del modulo; percorso analizzabile dal bundler |
| `lazy(loader)` | Tipo di componente React, con loader e risultato memorizzati |
| `<Suspense fallback={...}>` | UI temporanea per una sospensione, non per qualsiasi operazione async |
| Error Boundary | UI di errore per il rifiuto del loader o errori di rendering |
| `use(promise)` | Lettura di una Promise compatibile e stabile fra render; non ricreare un fetch a ogni render |

Un export nominato si puo adattare a `{ default: module.NamedComponent }` nella Promise del loader. Questo risolve il contratto di `lazy`, ma non garantisce che il bundler escluda tutti gli altri export.

## Esempio pratico

### Modulo caricato su richiesta

Nel progetto base di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]], usa i file seguenti con React/React DOM 19.3.0 e Vite 8.3.4. Non richiedono altre librerie. Il pannello simula una funzionalita locale, non un backend di report.

`src/ReportsPanel.jsx`:

```jsx
import { useId, useState } from "react";

export default function ReportsPanel() {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  return (
    <section aria-label="Rapporti">
      <h2>Rapporti</h2>
      <label htmlFor={inputId}>Bozza rapporto</label>
      <textarea id={inputId} value={draft}
        onChange={(event) => setDraft(event.target.value)} />
      <p>Caratteri: {draft.length}</p>
    </section>
  );
}
```

`src/ChunkBoundary.jsx` isola il pannello. L'eventuale callback `onError` deve essere affidabile; nel progetto reale puo collegarsi al reporting descritto in [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]].

```jsx
import { Component } from "react";

export class ChunkBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert">
          <p>Il pannello non e disponibile.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Ricarica pagina
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

`src/App.jsx` dichiara il tipo lazy una sola volta e lascia i controlli fuori dal fallback:

```jsx
import { lazy, Suspense, useId, useState } from "react";
import { ChunkBoundary } from "./ChunkBoundary.jsx";
import "./reports.css";

const ReportsPanel = lazy(() => import("./ReportsPanel.jsx"));

export default function ReportsApp() {
  const titleId = useId();
  const [title, setTitle] = useState("");
  const [show, setShow] = useState(false);
  return (
    <main className="reports-app">
      <h1>Area rapporti</h1>
      <label htmlFor={titleId}>Titolo della sessione</label>
      <input id={titleId} value={title}
        onChange={(event) => setTitle(event.target.value)} />
      <label className="reports-toggle">
        <input type="checkbox" checked={show}
          onChange={(event) => setShow(event.target.checked)} />
        Mostra rapporti
      </label>
      {show && (
        <div className="reports-slot">
          <ChunkBoundary>
            <Suspense fallback={<p role="status">Caricamento rapporti...</p>}>
              <ReportsPanel />
            </Suspense>
          </ChunkBoundary>
        </div>
      )}
    </main>
  );
}
```

`src/reports.css` riserva spazio per il contenuto, ma non puo prevedere la dimensione di qualsiasi report futuro:

```css
.reports-app { max-width: 42rem; }
.reports-app > input, .reports-app textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
}
.reports-app textarea { min-height: 6rem; }
.reports-toggle { display: block; margin-block: 1rem; }
.reports-slot { min-height: 14rem; }
.reports-app :is(input, textarea, button):focus-visible {
  outline: 3px solid #176b3a;
  outline-offset: 2px;
}
```

Chiudere il pannello ne scarta la bozza; il titolo della sessione resta nel parent. Se l'import e ancora in corso, chiudere il pannello non lo annulla: `import()` non accetta un `AbortSignal`. Riaprire usa il caricamento gia avviato o completato, ma crea una nuova istanza del pannello. Ricaricare la pagina perde entrambi gli stati non persistiti: il pulsante nel fallback non salva nulla e non garantisce di risolvere un errore permanente.

### Verificare il caricamento

Costruisci e servi la versione di produzione, dalla root dell'app:

```bash
npm run build
```

```bash
npm run preview
```

Nella scheda Network verifica le richieste prima e dopo "Mostra rapporti". Il demo non precarica il pannello: l'import parte al primo tentativo di mostrarlo. Su rete veloce il fallback puo essere impercettibile; per verificarlo usa throttling o un ritardo nel banco di prova, non un ritardo artificiale permanente nel codice dell'app.

Confronta anche una chiusura/riapertura e un reload. Le chunk condivise, il preloading e la cache dipendono dal bundler e dall'hosting; la suddivisione non promette una corrispondenza uno-a-uno tra pagina e file JavaScript.

### Errori e aggiornamenti del sito

`lazy` mantiene anche un caricamento rifiutato: azzerare solo il boundary o cambiarne la key non garantisce di richiamare lo stesso loader. Non aggiungere query casuali all'import per forzare retry illimitati. Una strategia di recupero deve considerare anche la cache dei moduli del browser.

Un'app gia aperta puo richiedere una vecchia chunk rimossa da un nuovo deploy. Controlla percorso base, disponibilita degli asset e cache HTML/CDN; conserva gli asset vecchi durante il passaggio quando possibile. Vite espone `vite:preloadError`, ma un reload automatico indiscriminato puo perdere lavoro o creare un loop. Il demo propone una ricarica esplicita, non una soluzione completa al deploy.

## Varianti

- **Boundary annidati**: separano gruppi che possono comparire in momenti diversi. Non crearne uno per ogni dettaglio senza una motivazione UX.
- **Transition e valori differiti**: possono mantenere visibile contenuto gia mostrato quando un aggiornamento sospende. Non evitano ogni fallback, soprattutto per boundary appena montati; vedi [[Programmazione/React/Pagine/useTransition e useDeferredValue|Transition e valore differito]].
- **Dati**: usa un'integrazione compatibile o una Promise con identita stabile letta con `use`. Suspense non fornisce da solo retry, deduplicazione, invalidazione, autorizzazione o annullamento delle richieste.
- **Server**: lo streaming e l'hydration dipendono dalle API server o dal framework. `renderToString` non attende il codice/dato sospeso: produce il fallback. Un demo client riuscito non prova SSR, SSG o Server Components.
- **Altre risorse**: React supporta anche casi documentati per stylesheet e integrazioni specifiche. Non dedurre che ogni immagine, font o Promise di un handler sia automaticamente coperta dal boundary.

Se la prima renderizzazione sospende prima del mount, React la ritenta senza conservare lo stato di quel tentativo. Quando contenuto gia visibile viene nascosto per una nuova sospensione, i layout effect richiedono cleanup e successiva riattivazione. Non far dipendere la logica applicativa dalla durata del fallback.

## Errori comuni

- Mettere fallback troppo grandi o instabili.
- Spezzare bundle in troppe chunk piccole.
- Non gestire errori di import con error boundary.
- Usare lazy loading per componenti sempre visibili.
- Creare layout shift durante fallback.

## Checklist

- Il componente e abbastanza pesante o raro?
- Il fallback preserva layout?
- C'e un error boundary vicino?
- La chunk migliora davvero il bundle iniziale?
- La UX resta comprensibile durante caricamento?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]
- [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]
- [[Programmazione/React/Pagine/Server Components|Server Components]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]
- [[Programmazione/React/Pagine/use hook|use hook]]
- [[Programmazione/React/Pagine/useTransition e useDeferredValue|Transition e valore differito]]
- [[Programmazione/React/Pagine/React Router|React Router]]

## Fonti

- [React: lazy, contratto e cache](https://react.dev/reference/react/lazy).
- [React: Suspense, sorgenti compatibili e lifecycle](https://react.dev/reference/react/Suspense).
- [MDN: import dinamico e cache dei moduli](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import).
- [Vite: code splitting e caricamento delle chunk](https://vite.dev/guide/features.html#async-chunk-loading-optimization).
- [Vite: errori di caricamento e deploy](https://vite.dev/guide/build.html#load-error-handling).
- [React DOM: limiti di renderToString](https://react.dev/reference/react-dom/server/renderToString).
