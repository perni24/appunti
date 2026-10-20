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
  - memory
  - abortcontroller
  - effects
aliases:
  - Gestione memoria React
  - AbortController
  - Race condition negli effect
  - Cancellation
prerequisites:
  - "[[Programmazione/React/Pagine/useEffect|useEffect]]"
  - "[[Programmazione/JavaScript/Pagine/AbortController|AbortController]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]"
  - "[[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]"
title: Gestione della memoria e AbortController
---

# Gestione della memoria e AbortController

## Sintesi

Il cleanup interrompe le sincronizzazioni e rilascia le risorse possedute da un effect. `AbortController` invia un segnale di annullamento alle API che lo supportano; una guardia impedisce invece a un'operazione obsoleta di pubblicare risultati.

Sono problemi diversi: **richiesta superata, stato errato e memoria trattenuta non sono sinonimi**. La risoluzione tardiva di una Promise non dimostra da sola un memory leak. Il leak richiede riferimenti o risorse che restano vivi oltre il necessario.

## Quando usarlo

Usa un cleanup quando apri listener, timer, subscription, observer, WebSocket o istanze imperative. Per Fetch abbina cancellazione del lavoro ancora interrompibile e protezione dall'obsolescenza.

La nota [[Programmazione/React/Pagine/useEffect|useEffect]] contiene il caricamento base al cambio di ID. Qui si aggiungono annullamento esplicito, timeout, retry e un loader locale riproducibile. Esempi React/React DOM 19.3.0 e browser moderni con `AbortSignal.throwIfAborted` e listener con `signal`.

## Come funziona

### Chi possiede la risorsa

Ogni setup possiede il suo controller, timer e subscription. Il cleanup viene eseguito prima del nuovo setup quando cambiano le dipendenze, oltre che allo smontaggio. In Strict Mode di sviluppo un ulteriore ciclo setup/cleanup verifica questa simmetria.

Non riusare un controller gia annullato: il segnale e monouso. Anche con dipendenze corrette, una risposta precedente puo arrivare dopo quella nuova. L'abort non interrompe qualunque Promise e non annulla una scrittura gia avvenuta sul server.

### Due protezioni complementari

- **Annullamento**: Fetch osserva `signal` e puo interrompere richiesta o lettura del corpo. Anche `response.json()` puo fallire se il corpo viene interrotto dopo la ricezione degli header.
- **Obsolescenza**: il flag locale `active` impedisce al vecchio setup di aggiornare stato dopo il cleanup, anche se il loader ignora il segnale.

Un controllo basato solo su `error.name === "AbortError"` non copre ogni motivo: `abort(reason)` puo usare un valore personalizzato. Il codice distingue il proprio segnale annullato dall'errore di rete/HTTP/schema. Per una scrittura remota un timeout non prova che l'operazione non sia stata eseguita.

## API / Sintassi

| Risorsa | Chiusura o controllo |
| --- | --- |
| Fetch | Passa `signal`; usa `abort()` e gestisci il rigetto |
| Timer | `clearTimeout` / `clearInterval` sul relativo ID |
| Listener DOM | `removeEventListener` con callback/capture coerenti, oppure `signal` |
| Observer | `disconnect()` secondo il contratto dell'API |
| WebSocket | `close()` sulla connessione posseduta |
| Subscription/libreria | Funzione unsubscribe oppure metodo dispose documentato |

`signal.aborted` indica lo stato, `signal.reason` il motivo e `signal.throwIfAborted()` lo rilancia. `AbortSignal.timeout()` e `AbortSignal.any()` offrono composizione nelle piattaforme supportate; non sostituiscono il contratto di cancellazione dell'operazione. Un signal non chiude automaticamente timer, WebSocket o risorse arbitrarie.

## Esempio pratico

### Profilo con annullamento, timeout e retry

Modulo `ProfileDemo.jsx`, da rendere con `<ProfileDemo />` in un progetto React. Il loader predefinito simula solo una lettura locale, rispetta l'abort e non usa un backend. `load(userId, { signal })` deve restituire una Promise del profilo; mantieni stabile l'identita di `load` fra i render.

```jsx
import { useEffect, useId, useRef, useState } from "react";

export function checkProfile(value, userId) {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || value.id !== userId || typeof value.name !== "string"
    || value.name.trim() === "") {
    throw new TypeError("Profilo non valido");
  }
  return { id: value.id, name: value.name };
}

export function loadProfileDemo(userId, { signal }) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      const names = { a: "Ada", b: "Grace", slow: "Profilo lento" };
      if (!Object.hasOwn(names, userId)) reject(new Error("Profilo assente"));
      else resolve({ id: userId, name: names[userId] });
    }, userId === "slow" ? 6000 : 450);
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export async function fetchProfile(userId, { signal }) {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return checkProfile(await response.json(), userId);
}

export function ProfilePanel({ userId, load = loadProfileDemo, timeoutMs = 2000 }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ userId: null, attempt: -1, status: "loading" });
  const current = useRef(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const request = { userId, attempt, controller };
    current.current = request;
    setResult({ userId, attempt, status: "loading" });
    const timer = setTimeout(() => {
      controller.abort(new DOMException("Tempo scaduto", "TimeoutError"));
    }, timeoutMs);

    async function run() {
      try {
        const value = await load(userId, { signal: controller.signal });
        controller.signal.throwIfAborted();
        const user = checkProfile(value, userId);
        if (active) setResult({ userId, attempt, status: "success", user });
      } catch {
        if (!active) return;
        const status = !controller.signal.aborted ? "error"
          : controller.signal.reason?.name === "TimeoutError" ? "timeout" : "cancelled";
        setResult({ userId, attempt, status });
      } finally {
        clearTimeout(timer);
        if (current.current === request) current.current = null;
      }
    }
    void run();
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
      if (current.current === request) current.current = null;
    };
  }, [userId, attempt, load, timeoutMs]);

  const matches = result.userId === userId && result.attempt === attempt;
  const status = matches ? result.status : "loading";
  const loading = status === "loading";
  function cancel() {
    const request = current.current;
    if (request?.userId === userId && request.attempt === attempt) {
      request.controller.abort(new DOMException("Annullato", "AbortError"));
    }
  }

  return (
    <section aria-label="Profilo richiesto">
      <p role="status">{loading ? "Caricamento profilo..."
        : status === "cancelled" ? "Caricamento annullato."
        : status === "success" ? "Profilo pronto." : "Caricamento terminato."}</p>
      {status === "success" && <p>Utente: {result.user.name}</p>}
      {status === "timeout" && <p role="alert">Tempo di attesa esaurito.</p>}
      {status === "error" && <p role="alert">Impossibile caricare il profilo.</p>}
      <button type="button" disabled={!loading} onClick={cancel}>Annulla</button>{" "}
      <button type="button" disabled={loading}
        onClick={() => setAttempt((n) => n + 1)}>Ricarica</button>
    </section>
  );
}

export default function ProfileDemo() {
  const id = useId();
  const [userId, setUserId] = useState("a");
  return (
    <>
      <label htmlFor={id}>Profilo</label>{" "}
      <select id={id} value={userId} onChange={(e) => setUserId(e.target.value)}>
        <option value="a">Ada</option>
        <option value="b">Grace</option>
        <option value="slow">Risposta lenta</option>
        <option value="missing">Profilo assente</option>
      </select>
      <ProfilePanel userId={userId} />
    </>
  );
}
```

`userId` e una stringa non vuota; `timeoutMs` e un numero finito positivo nell'intervallo supportato dai timer. Questi sono contratti delle props, non dati remoti gia validati. Il controllo della risposta seleziona solo i campi pubblici usati dalla UI.

Prova cambio rapido Ada/Grace, Annulla durante l'attesa, Ricarica dopo annullamento, Profilo assente e Risposta lenta. Ogni tentativo crea un nuovo controller. La coppia ID/tentativo evita di mostrare i vecchi dati mentre parte il nuovo effect; il cleanup non viene mostrato come annullamento richiesto dall'utente.

Il timeout usa un timer cancellabile, ma non e una scadenza precisa: event loop e schede in background possono ritardarlo. Se una API ignora `signal`, non puoi obbligarla a terminare con `abort()`; la guardia impedisce la pubblicazione dopo cleanup, e `throwIfAborted` scarta un risultato arrivato dopo annullamento. Un loader che resta pending per sempre richiede una diversa politica di attesa. Errori imprevisti andrebbero anche osservati nel sistema di logging dell'app: qui la UI rimane volutamente generica.

### Collegamento a un backend reale

Per usare `load={fetchProfile}` serve un endpoint sulla stessa origine `GET /api/users/:id` che restituisca `{ "id": "a", "name": "Ada" }`. Vite non lo crea. L'helper controlla HTTP, parsing JSON e corrispondenza dell'ID; 404, 500, JSON invalido e schema errato non diventano un falso successo. Non sono implementati autenticazione, cache, deduplicazione o retry automatici.

### Listener e timer sono risorse distinte

Modulo indipendente `ViewportWidth.jsx`, esempio di subscription con debounce locale. Non serve per sostituire CSS responsive: mostra il rilascio di un listener e del suo timer.

```jsx
import { useEffect, useState } from "react";

export default function ViewportWidth() {
  const [width, setWidth] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    let timer;
    function handleResize() {
      clearTimeout(timer);
      timer = setTimeout(() => setWidth(window.innerWidth), 150);
    }
    window.addEventListener("resize", handleResize, { signal: controller.signal });
    handleResize();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);
  return <p role="status">{width === null ? "Misura in attesa..." : `Larghezza: ${width}`}</p>;
}
```

L'abort rimuove il listener, non il timer: per questo servono entrambe le operazioni. In SSR il valore iniziale resta `null` e l'effect non legge `window` sul server. La variante manuale deve passare a `removeEventListener` la stessa funzione e lo stesso valore di `capture` usati nella registrazione.

## Varianti

- **Guardia senza abort**: evita pubblicazioni obsolete, ma non riduce il lavoro sottostante.
- **Request ID**: utile per operazioni avviate da eventi sovrapposti; non sostituisce autorizzazione o idempotenza server.
- **Data fetching library**: verifica se il query function consuma il signal e quale componente possiede la subscription; non cancellare arbitrariamente richieste condivise.
- **WebSocket/observer**: separa chiusura della risorsa e rimozione dei callback secondo il relativo contratto.
- **Memoria**: cerca cache senza limiti, listener globali, closure e nodi DOM trattenuti con heap snapshot e retaining paths. Chiudere una risorsa non forza il garbage collector e non promette un calo immediato della memoria del processo.

## Errori comuni

- Riutilizzare un controller annullato o conservarne uno per tutti i mount.
- Catturare soltanto AbortError e ignorare HTTP, parsing e schema.
- Scrivere uno stato generico in `finally`, sovrascrivendo il nuovo tentativo.
- Usare un flag globale "montato" che torna true e riabilita una vecchia richiesta.
- Rendere `async` il callback di useEffect invece della funzione interna.
- Pensare che rimuovere un listener annulli timer gia avviati o scritture remote.
- Dichiarare un leak soltanto per una Promise tardiva, senza misurare riferimenti trattenuti.

## Checklist

- Ogni setup possiede e chiude solo le proprie risorse?
- Dipendenze e identita del loader sono stabili e complete?
- Errori, timeout, annullamento e cleanup hanno esiti distinti?
- Una risposta vecchia, anche da un loader non cancellabile, puo sovrascrivere quella nuova?
- Il corpo HTTP e il payload vengono realmente controllati?
- Strict Mode, cambio parametro e smontaggio sono provati?
- L'eventuale sospetto di leak e supportato da misure, non dal solo stato UI?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useEffect|useEffect]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/Memory Leaks|Memory Leaks]]
- [[Programmazione/React/Pagine/useTransition e useDeferredValue|useTransition e useDeferredValue]]

## Fonti

- [React: useEffect](https://react.dev/reference/react/useEffect), setup, cleanup e dipendenze.
- [React: sincronizzazione con gli effect](https://react.dev/learn/synchronizing-with-effects), richieste obsolete e Strict Mode.
- [MDN: AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal), motivi e contratti di cancellazione.
- [MDN: Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), HTTP, corpo e abort.
- [MDN: addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener), signal e rimozione.
- [Chrome DevTools: memory problems](https://developer.chrome.com/docs/devtools/memory-problems), diagnosi e riferimenti trattenuti.

Consultate il 2026-10-18; prove locali React/React DOM 19.3.0. Non costituiscono una misura di garbage collection o un audit del backend.
