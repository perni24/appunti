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
  - hooks
  - effects
aliases:
  - useEffect
  - Effect React
  - Cleanup effect
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/Gestione della memoria e AbortController|Gestione della memoria e AbortController]]"
  - "[[Programmazione/React/Pagine/Derived state|Derived state]]"
title: useEffect
---

# useEffect

## Sintesi

`useEffect` sincronizza un componente con qualcosa che React non gestisce direttamente: un timer, un listener, la rete o una libreria imperativa. Il suo ciclo e **setup, eventuale cleanup, nuovo setup**: non e semplicemente un modo per eseguire codice "una volta".

Gli esempi sono moduli client per React 19.3.0. I primi due non richiedono servizi; l'ultimo richiede l'endpoint dichiarato, non incluso nel progetto Vite.

## Quando usarlo

- **Render**: filtra una lista o calcola il totale direttamente dai dati disponibili.
- **Evento**: salva un ordine quando l'utente preme Conferma, nel relativo handler.
- **Effect**: mantieni una connessione attiva finche una schermata e presente, o ricarica un profilo quando cambia il suo identificatore.

Non spostare una mutazione remota in un effect solo perche e asincrona. Un mount ripetuto potrebbe inviarla di nuovo. Per cache, deduplicazione e caricamento coordinato con le rotte preferisci gli strumenti del framework o una libreria di data fetching.

## Come funziona

React esegue il setup dopo un **commit**, non dopo ogni tentativo di render. Quando cambiano le dipendenze, prima pulisce la precedente sincronizzazione con i vecchi valori, poi avvia quella nuova. Esegue il cleanup anche allo smontaggio.

Non garantisce "sempre dopo il paint": gli effect legati a interazioni possono precederlo. Per misure/posizionamenti che devono bloccare il paint esiste `useLayoutEffect`, da usare con cautela. Durante il rendering sul server gli effect non vengono eseguiti.

Esempio completo: una sola istanza possiede il titolo della pagina mentre e montata. Non usarlo per coordinare piu proprietari concorrenti del titolo.

```jsx
import { useEffect, useState } from "react";

export default function TitleCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Messaggi: ${count}`;
    return () => { document.title = previousTitle; };
  }, [count]);

  return (
    <button type="button" onClick={() => setCount((current) => current + 1)}>
      Messaggi: {count}
    </button>
  );
}
```

## API / Sintassi

| Dipendenze | Comportamento |
| --- | --- |
| Argomento omesso | Setup dopo ogni commit del componente; cleanup precedente, se presente. |
| `[]` | Nessuna dipendenza reattiva; non riparte per normali aggiornamenti di props/state, ma riparte a un nuovo mount. |
| `[userId]` | Riparte se cambia `userId` secondo `Object.is`, oltre al mount. |

Inserisci tutti i valori reattivi letti dal setup/cleanup: props, stato, funzioni e oggetti dichiarati nel componente. L'array ha lunghezza costante e viene scritto inline. Un nuovo oggetto o una nuova funzione possono risultare diversi a ogni render anche se sembrano "uguali".

Non scegliere le dipendenze per imporre una frequenza: correggi prima la logica e usa il controllo `exhaustive-deps`. Il setter di `useState` e stabile; `ref.current` invece non e un segnale reattivo.

Con Strict Mode alla radice, in sviluppo il mount include un ciclo aggiuntivo setup/cleanup. Il cleanup deve annullare cio che quel setup ha avviato. Un flag ref "gia eseguito" nasconde spesso il problema invece di risolverlo.

## Esempio pratico

### Timer e stato precedente

Questo componente conta le notifiche del timer, non misura precisamente il tempo trascorso: una scheda in background puo rallentare gli intervalli. Il cleanup chiude lo specifico timer creato da quel setup.

```jsx
import { useEffect, useState } from "react";

export default function IntervalCounter() {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTicks((current) => current + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section>
      <p role="status">Tick: {ticks}</p>
      <button type="button" onClick={() => setTicks(0)}>Azzera tick</button>
    </section>
  );
}
```

L'updater evita di catturare sempre il valore iniziale di `ticks`. Non occorre ricreare l'intervallo a ogni incremento.

### Fetch, errori e risultati obsoleti

Contratto: `userId` e una stringa non vuota. `GET /api/users/:id`, sulla stessa origine, deve restituire un JSON `{ "id": "a", "name": "Ada" }`, con `id` uguale a quello richiesto. Il codice controlla HTTP, parsing e i campi utilizzati. Senza questo backend mostra un errore; Vite non crea automaticamente l'API.

```jsx
import { useEffect, useState } from "react";

export function UserProfile({ userId }) {
  const [result, setResult] = useState({ userId: null, status: "loading" });

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setResult({ userId, status: "loading" });

    async function loadUser() {
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Risposta HTTP non riuscita");
        const user = await response.json();
        if (
          user === null || typeof user !== "object" || Array.isArray(user) ||
          user.id !== userId || typeof user.name !== "string"
        ) {
          throw new Error("Formato utente non valido");
        }
        if (active) setResult({ userId, status: "success", user });
      } catch {
        if (active) setResult({ userId, status: "error" });
      }
    }

    void loadUser();
    return () => {
      active = false;
      controller.abort();
    };
  }, [userId]);

  if (result.userId !== userId || result.status === "loading") {
    return <p role="status">Caricamento profilo...</p>;
  }
  if (result.status === "error") {
    return <p role="alert">Impossibile caricare il profilo.</p>;
  }
  return <p>Utente: {result.user.name}</p>;
}

export default function App() {
  const [userId, setUserId] = useState("a");
  return (
    <section>
      <label>
        Profilo
        <select value={userId} onChange={(event) => setUserId(event.target.value)}>
          <option value="a">Profilo A</option>
          <option value="b">Profilo B</option>
        </select>
      </label>
      <UserProfile userId={userId} />
    </section>
  );
}
```

Due protezioni diverse: `abort()` interrompe il lavoro Fetch ancora cancellabile; `active` impedisce al vecchio setup di pubblicare un risultato o un errore dopo il cleanup, anche se un'operazione non rispetta l'abort. L'identificatore nello stato evita di mostrare i dati di A sotto la selezione B mentre parte il nuovo effect.

Il callback passato a `useEffect` non e `async`: deve restituire niente oppure una funzione di cleanup, non una Promise. La funzione asincrona interna gestisce anche il rifiuto causato dall'abort. Non ci sono cache, retry, deduplicazione o autenticazione; l'abort client non garantisce che il server interrompa l'elaborazione.

## Varianti

- **Effect con cleanup**: subscription, timer, listener.
- **Effect senza cleanup**: solo quando non rimangono risorse o sincronizzazioni da annullare.
- **Effect con dipendenze**: rieseguito quando cambiano valori.
- **AbortController**: cancellazione di richieste.
- **Custom hook**: incapsula effect ripetuti.
- **Data fetching library**: spesso migliore per cache, retry e stati remoti.

## Errori comuni

- Usare effect per tutto.
- Dimenticare dipendenze.
- Ignorare cleanup di listener, timer o fetch.
- Creare loop aggiornando state dipendente dall'effect.
- Fare fetch senza gestire race condition.
- Usare effect per derivare stato calcolabile durante render.

## Checklist

- Sto sincronizzando con un sistema esterno?
- Le dipendenze sono complete?
- Serve cleanup?
- Ci sono race condition?
- Questo effect puo diventare custom hook?
- Una libreria di data fetching sarebbe piu adatta?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Gestione della memoria e AbortController|Gestione della memoria e AbortController]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Custom Hooks|Custom Hooks]]
- [[Programmazione/React/Pagine/Derived state|Derived state]]
- [[Programmazione/React/Pagine/Linting e Formattazione|Linting e Formattazione]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]

## Fonti

Documentazione consultata il 2026-10-15; React 19.3.0.

- [useEffect: commit, dipendenze e timing](https://react.dev/reference/react/useEffect).
- [Sincronizzazione, cleanup e race condition](https://react.dev/learn/synchronizing-with-effects).
- [Quando un effect non serve](https://react.dev/learn/you-might-not-need-an-effect).
- [Strict Mode e ciclo aggiuntivo di sviluppo](https://react.dev/reference/react/StrictMode).
- [Fetch: errori HTTP, JSON e cancellazione](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
