---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - react
  - hooks
  - suspense
aliases:
  - use
  - use hook
  - React use
prerequisites:
  - "[[Programmazione/React/Pagine/Context API|Context API]]"
  - "[[Programmazione/React/Pagine/Suspense e Lazy Loading|Suspense e Lazy Loading]]"
related:
  - "[[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]"
  - "[[Programmazione/React/Pagine/Server Components|Server Components]]"
title: use hook
---

# use hook

## Sintesi

`use` legge una risorsa **durante il rendering**. Con un Context restituisce il valore corrente; con una Promise legge il risultato oppure sospende il componente. Non avvia da sola una richiesta HTTP, non crea una cache e non sostituisce gli effect.

Il nome della pagina conserva la voce dell'indice, ma tecnicamente `use` e una API con regole particolari, non un Hook ordinario. Gli esempi usano React/React DOM **19.3.0**; Promise e Context sono disponibili da React 19. La variante `browser()` in fondo richiede la versione che espone quella API, non genericamente qualsiasi React 19.

## Quando usarlo

- Leggere una Promise stabile fornita da un loader, una cache compatibile, un evento o un Server Component.
- Leggere un Context anche dopo un ritorno condizionale o dentro una condizione.
- Delegare attesa ed errore rispettivamente a Suspense e a un Error Boundary.

Per Context e Promise client non serve necessariamente Next.js. Serve invece un'integrazione RSC per trasferire una Promise da server a client. Per fetch ordinari con cache, retry e invalidazione, valuta prima il data layer gia usato dall'app.

## Come funziona

### Risultato, attesa ed errore

| Risorsa | Risultato |
| --- | --- |
| Context | Valore del provider piu vicino sopra il componente, oppure default |
| Promise pending | Sospensione; il boundary Suspense puo mostrare il fallback |
| Promise fulfilled | Valore risolto, non la Promise |
| Promise rejected | Errore propagato al boundary degli errori |

Suspense non e un gestore di errori. Inoltre una transition puo mantenere contenuto gia visibile anziche sostituirlo subito con il fallback: non dedurre lo stato della rete dalla sola presenza di uno spinner.

### Identita della Promise

La stessa operazione deve fornire la **stessa istanza** fra i tentativi di render. `fetch()`, una funzione `async`, `.then()` e `.catch()` producono nuove Promise: chiamarli direttamente nel componente che sospende puo ripetere richieste o causare l'avviso di Promise non memorizzata.

Un `useMemo` nel componente che sospende prima del primo mount non e una cache affidabile: React puo scartare quel tentativo. Nel demo la Promise nasce in un evento e rimane nello stato di un parent gia montato, sopra Suspense. Non viene creata durante il render.

La stabilita non implica freschezza: riusare una Promise gia risolta riusa quel risultato. Cache per utente, durata, invalidazione e cancellazione sono responsabilita separate.

## API / Sintassi

```jsx
import { use } from "react";
```

`use(resource)` si chiama nel corpo di un componente funzionale o di un custom Hook. Puo stare in condizioni e cicli, anche dopo un early return; non in event handler, funzioni arbitrarie, classi o blocchi `try/catch`. Le altre regole degli Hook non diventano facoltative per `useState` o `useEffect`.

Per gestire un rigetto usa un Error Boundary oppure prepara **prima del render** una Promise con un recupero esplicito. Un `.catch(() => valoreAlternativo)` converte l'errore in un risultato: non equivale a segnalarlo all'utente.

## Esempio pratico

### Promise client completa

In un progetto Vite React 19.3, salva questo modulo come `PromiseDemo.jsx` e rendi `<PromiseDemo />` dal tuo `App`. Non richiede backend, fetch o librerie aggiuntive. Il ritardo e il guasto sono una simulazione locale dichiarata.

```jsx
import { Component, Suspense, use, useState } from "react";

export function loadMessageDemo(shouldFail) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error("Guasto dimostrativo"));
      else resolve("Messaggio disponibile");
    }, 450);
  });
}

export class MessageBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed
      ? <p role="alert">Caricamento fallito. Avvia un nuovo caricamento.</p>
      : this.props.children;
  }
}

export function Message({ promise }) {
  const text = use(promise);
  return <p role="status">{text}</p>;
}

export default function PromiseDemo({ load = loadMessageDemo }) {
  const [request, setRequest] = useState(null);
  const [count, setCount] = useState(0);

  function begin(shouldFail) {
    const promise = load(shouldFail);
    // Osserva anche i rigetti di operazioni sostituite prima del render.
    // Conserviamo l'originale: use deve ancora ricevere il suo rigetto.
    promise.catch(() => {});
    setRequest((previous) => ({ id: (previous?.id ?? 0) + 1, promise }));
  }

  return (
    <section aria-label="Messaggio asincrono">
      <button type="button" onClick={() => begin(false)}>Carica</button>{" "}
      <button type="button" onClick={() => begin(true)}>Simula errore</button>{" "}
      <button type="button" onClick={() => setCount((n) => n + 1)}>
        Aggiorna contatore
      </button>
      <p>Contatore: {count}</p>
      {request === null ? <p>Nessun caricamento avviato.</p> : (
        <MessageBoundary key={request.id}>
          <Suspense fallback={<p role="status">Caricamento...</p>}>
            <Message promise={request.promise} />
          </Suspense>
        </MessageBoundary>
      )}
    </section>
  );
}
```

Premi Carica, poi incrementa il contatore: il parent cambia, ma non parte una seconda operazione. Simula errore mostra il fallback di errore; Carica crea una nuova Promise e la nuova `key` rimonta il boundary. Rimontare il solo boundary con la vecchia Promise rigettata non sarebbe un retry.

Premendo rapidamente due caricamenti, viene mostrato il risultato dell'ultimo selezionato: le operazioni precedenti **non vengono cancellate**. Il servizio `load` deve restituire una Promise di stringa; un errore sincrono nel click non e coperto da questo boundary. Non copiare il `.catch` vuoto come gestione generale degli errori: qui serve solo a osservare l'originale, che resta rigettata e viene letta da React.

### Context con lettura condizionale

Modulo indipendente `ContextDemo.jsx`; non usa Suspense perche il valore del Context e una stringa, non un dato asincrono.

```jsx
import { createContext, use, useId, useState } from "react";

export const LanguageContext = createContext("it");

export function Greeting({ show }) {
  if (!show) return <p>Saluto nascosto</p>;
  const language = use(LanguageContext);
  return <p>{language === "it" ? "Ciao" : "Hello"}</p>;
}

export default function ContextDemo() {
  const languageId = useId();
  const [language, setLanguage] = useState("it");
  const [show, setShow] = useState(true);
  return (
    <section aria-label="Lingua del saluto">
      <label htmlFor={languageId}>Lingua</label>{" "}
      <select id={languageId} value={language}
        onChange={(e) => setLanguage(e.target.value)}>
        <option value="it">Italiano</option>
        <option value="en">English</option>
      </select>
      <label><input type="checkbox" checked={show}
        onChange={(e) => setShow(e.target.checked)} />Mostra saluto</label>
      <LanguageContext value={language}>
        <Greeting show={show} />
      </LanguageContext>
    </section>
  );
}
```

La lettura vede un provider **antenato**, non un provider restituito dallo stesso componente che chiama `use`. Fuori dal provider il default e `it`; un provider con `value={undefined}` passa invece `undefined`, non ripristina il default. Nei Server Components non si usa il Context client in questo modo.

## Varianti

### Server e client

In un Server Component `async`, preferisci normalmente `await` per attendere dati li utilizzati. Per streaming puoi avviare una Promise sul server e passarla a un Client Component che la legge con `use`, sotto Suspense. Il valore risolto deve essere serializzabile da React e divulgabile al destinatario; una Promise non e un canale per nascondere segreti. Il protocollo e il ciclo di richiesta dipendono dal framework.

### Rendering solo nel browser

React DOM 19.3 espone `browser()`. Questo modulo client legge la larghezza una volta per render, **non si iscrive al resize**:

```jsx
"use client";
import { Suspense, use } from "react";
import { browser } from "react-dom";

export function Viewport() {
  use(browser());
  return <p>Larghezza: {window.innerWidth}</p>;
}

export default function BrowserDemo() {
  return (
    <Suspense fallback={<p>Misura disponibile nel browser.</p>}>
      <Viewport />
    </Suspense>
  );
}
```

Nel prerender server compare il fallback, nel browser il componente puo proseguire. Il boundary deve gia essere sopra la chiamata; il codice browser-only al livello del modulo rimane errato. Per layout responsive usa normalmente CSS, non questo esempio numerico.

## Errori comuni

- Scrivere `use(fetch(url))` e creare una nuova operazione a ogni render.
- Aggiungere `.then()` o `.catch()` durante il render anche a una Promise gia memorizzata.
- Catturare la sospensione con `try/catch`, oppure attendersi che Suspense mostri gli errori.
- Chiamare `use` nel click anziche creare li la risorsa e leggerla nel componente.
- Pensare che cache, annullamento, autenticazione o gestione dei 404 HTTP siano automatici.
- Usare una cache globale sul server per dati privati senza isolamento per richiesta/utente.

## Checklist

- Versioni e ambiente supportano la risorsa letta?
- Promise stabile anche se il primo render sospende?
- Attesa, errore, retry e risultato hanno comportamenti distinti?
- Il retry crea una nuova operazione, senza promettere cancellazione della precedente?
- Dati server serializzabili, autorizzati e privi di campi interni?
- Una cache applicativa gestirebbe meglio durata e invalidazione?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Suspense e Lazy Loading|Suspense e Lazy Loading]]
- [[Programmazione/React/Pagine/Server Components|Server Components]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Context API|Context API]]
- [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]
- [[Programmazione/React/Pagine/useTransition e useDeferredValue|useTransition e useDeferredValue]]

## Fonti

- [React: use](https://react.dev/reference/react/use), API e vincoli.
- [React: Suspense](https://react.dev/reference/react/Suspense), stato prima del mount e fallback.
- [React: useMemo](https://react.dev/reference/react/useMemo), limiti della memoizzazione.
- [React: use client](https://react.dev/reference/rsc/use-client), serializzazione e confini.
- [React DOM: browser](https://react.dev/reference/react-dom/browser), variante browser-only.

Consultate il 2026-10-16. Esempi locali React/React DOM 19.3.0, non un data layer di produzione.
