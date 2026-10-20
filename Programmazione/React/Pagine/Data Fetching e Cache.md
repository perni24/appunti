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
  - data-fetching
  - cache
  - frontend
aliases:
  - Data Fetching
  - Cache React
  - TanStack Query
  - Optimistic updates
prerequisites:
  - "[[Programmazione/React/Pagine/useEffect|useEffect]]"
related:
  - "[[Programmazione/React/Pagine/React Router|React Router]]"
  - "[[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]"
title: Data Fetching e Cache
---

# Data Fetching e Cache

## Sintesi

Il fetching carica dati remoti; una cache coordina risultati condivisi, freschezza, richieste e invalidazione. La cache del client non sostituisce il server come fonte autorevole, ne coincide con la cache HTTP del browser.

Questa nota usa **TanStack Query 5.104.3** e React 19.3.0. Le bozze locali restano stato UI; risultati API, refetch ed errori remoti appartengono al livello dati.

## Quando usarlo

Una cache dedicata e utile per dati letti da piu componenti, navigazioni ripetute, mutazioni e aggiornamenti in background. Per una richiesta isolata puo bastare un effect con cleanup; un router o framework puo gia offrire un livello dati adeguato.

Non e vietato tenere risultati remoti in Redux o altro store: significa assumersi le responsabilita di cache, sincronizzazione ed errori. Evita copie prive di una ragione nei due sistemi.

## Come funziona

1. Un `QueryClient` conserva la cache; il provider lo rende disponibile. L'istanza deve restare stabile, non essere ricreata a ogni render.
2. `queryKey` identifica il risultato. Includi le variabili usate dalla richiesta, per esempio ID, filtri e ambito utente, senza inserirvi token segreti.
3. `queryFn` restituisce dati validi oppure rifiuta/lancia un errore. Fetch non rifiuta automaticamente per HTTP 404 o 500: controlla `response.ok`, JSON e schema.
4. Gli osservatori ricevono dati e stato della richiesta. Una mutazione deve aggiornare o invalidare le query interessate.

Le chiavi sono array serializzabili, confrontati tramite hashing del contenuto: un nuovo array equivalente non crea automaticamente una nuova cache. L'ordine degli elementi dell'array conta; quello delle proprieta di un oggetto nella chiave non e significativo. Non usare la stessa chiave per risposte con forme diverse, per esempio query normale e infinite query.

Per un esempio completo di fetch manuale con `catch`, abort e guard contro risposte obsolete, vedi [[Programmazione/React/Pagine/useEffect|useEffect]]. Un frammento che chiama `response.json()` senza controlli non e una base completa da copiare.

## API / Sintassi

| Campo/API | Significato in v5 |
| --- | --- |
| `isPending` | Non c'e ancora un risultato riuscito disponibile nello stato pending |
| `isFetching` | La query sta eseguendo la funzione, anche in background con dati gia presenti |
| `isLoading` | `isPending && isFetching`: non include una query iniziale in pausa |
| `fetchStatus` | `fetching`, `paused` o `idle`, distinto dallo stato dei dati |
| `staleTime` | Quanto a lungo il dato e considerato fresco; non e un timer di polling |
| `gcTime` | Tempo di conservazione di una query inattiva, non scadenza dei dati osservati |
| `invalidateQueries` | Segna le query corrispondenti come stale e normalmente rifetcha quelle attive |
| `setQueryData` | Aggiorna sincronicamente la cache, con dati/copie immutabili |

I default client includono dati subito stale, garbage collection delle query inattive dopo cinque minuti e tre retry delle query fallite. Query stale possono rifare la richiesta al mount, al ritorno del focus e alla riconnessione. Le mutation non hanno retry automatico di default. Sono politiche configurabili, non promesse di una richiesta unica.

Il signal ricevuto da `queryFn` va inoltrato al trasporto. Senza consumarlo, una richiesta divenuta inutilizzata puo continuare e alimentare la cache. L'abort di Fetch non equivale all'annullamento di una scrittura gia eseguita dal server.

## Esempio pratico

Frontend completo per un'API dimostrativa. **Il backend non e incluso**: devi fornire i due endpoint sotto sulla stessa origine, o un proxy dell'app. Non sono endpoint realmente offerti da TanStack Query. Senza API vedrai lo stato di errore, non una lista simulata.

| Richiesta | Contratto |
| --- | --- |
| `GET /api/tasks` | HTTP 200, array di record con `id` stringa non vuota e unica, `title` stringa non vuota, `done` booleano |
| `PATCH /api/tasks/:id` | JSON `{ "done": true }` o false; HTTP 200 con il record aggiornato avente lo stesso ID; errore HTTP se rifiutato |

L'API deve rendere osservabile una scrittura riuscita nelle letture successive. Esempio di risposta GET: `[{"id":"a","title":"Studiare cache","done":false}]`. Autenticazione, autorizzazione, idempotenza e limiti del backend restano da progettare.

Nel progetto introduttivo, installa nella cartella dell'app:

```sh
npm install --save-exact @tanstack/react-query@5.104.3
```

Sostituisci `src/App.jsx`:

```jsx
import { useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useMutation,
  useQuery, useQueryClient } from "@tanstack/react-query";

export const TASKS_KEY = ["tasks"];

export function parseTask(value) {
  if (!value || typeof value.id !== "string" || !value.id.trim() ||
      typeof value.title !== "string" || !value.title.trim() ||
      typeof value.done !== "boolean") throw new Error("Attivita non valida");
  return { id: value.id, title: value.title, done: value.done };
}

export function parseTasks(value) {
  if (!Array.isArray(value)) throw new Error("Elenco non valido");
  const tasks = value.map(parseTask);
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) {
    throw new Error("ID duplicati");
  }
  return tasks;
}

export async function loadTasks({ signal }) {
  const response = await fetch("/api/tasks", { signal });
  if (!response.ok) throw new Error(`Lettura fallita: HTTP ${response.status}`);
  return parseTasks(await response.json());
}

export async function updateTask({ id, done }) {
  const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  if (!response.ok) throw new Error(`Salvataggio fallito: HTTP ${response.status}`);
  const saved = parseTask(await response.json());
  if (saved.id !== id) throw new Error("ID della risposta non coerente");
  return saved;
}

export function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: {
    staleTime: 30_000, gcTime: 300_000, retry: false,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
  } } });
}

export function TasksPage() {
  const client = useQueryClient();
  const locked = useRef(false);
  const query = useQuery({ queryKey: TASKS_KEY, queryFn: loadTasks });
  const mutation = useMutation({
    mutationFn: updateTask,
    retry: false,
    onMutate: async ({ id, done }) => {
      await client.cancelQueries({ queryKey: TASKS_KEY, exact: true });
      const previous = client.getQueryData(TASKS_KEY);
      client.setQueryData(TASKS_KEY, (items) =>
        items?.map((item) => item.id === id ? { ...item, done } : item)
      );
      return { previous };
    },
    onError: (_error, _variables, snapshot) => {
      if (snapshot?.previous !== undefined) {
        client.setQueryData(TASKS_KEY, snapshot.previous);
      }
    },
    onSuccess: (saved) => {
      client.setQueryData(TASKS_KEY, (items) =>
        items?.map((item) => item.id === saved.id ? saved : item)
      );
    },
    onSettled: () => client.invalidateQueries({ queryKey: TASKS_KEY, exact: true }),
  });

  async function toggle(task) {
    if (locked.current) return;
    locked.current = true;
    try {
      await mutation.mutateAsync({ id: task.id, done: !task.done });
    } catch {
      // L'errore e rappresentato da mutation.isError nella UI.
    } finally {
      locked.current = false;
    }
  }

  if (query.isPending) return <p role="status">{
    query.fetchStatus === "paused" ? "Richiesta in pausa." : "Caricamento attivita..."
  }</p>;
  if (query.data === undefined) return (
    <main><p role="alert">Caricamento non riuscito.</p>
      <button type="button" onClick={() => query.refetch()}>Riprova</button>
    </main>
  );

  return (
    <main>
      <h1>Attivita</h1>
      <button type="button" disabled={query.isFetching || mutation.isPending}
        onClick={() => query.refetch()}>Aggiorna</button>
      {query.isFetching && <p role="status">Aggiornamento in corso...</p>}
      {query.fetchStatus === "paused" && <p role="status">Richiesta in pausa.</p>}
      {query.isError && <p role="alert">Aggiornamento fallito: dati precedenti conservati.</p>}
      {mutation.isPending && <p role="status">Salvataggio in corso...</p>}
      {mutation.isError && <p role="alert">Salvataggio non confermato. Controlla i dati aggiornati.</p>}
      {query.data.length === 0 ? <p>Nessuna attivita.</p> : (
        <ul>{query.data.map((task) => (
          <li key={task.id}><label>
            <input type="checkbox" checked={task.done} disabled={mutation.isPending}
              onChange={() => toggle(task)} />{task.title}
          </label></li>
        ))}</ul>
      )}
    </main>
  );
}

export default function QueryDemo() {
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}><TasksPage /></QueryClientProvider>;
}
```

La checkbox cambia subito nella cache. Prima si annulla il refetch corrente, poi si conserva lo snapshot. In caso di errore si ripristina; in caso di successo si usa la risposta normalizzata del server. Infine si invalida e si attende il refetch: restituire la Promise mantiene la mutation pending fino alla fine di quel lavoro.

Verifica primo caricamento, lista vuota, errore iniziale e retry, refresh fallito con dati ancora visibili, PATCH riuscita e PATCH rifiutata. Retry automatici e refetch su focus/riconnessione sono disattivati esplicitamente nel demo, non sono i default della libreria.

### Limiti degli aggiornamenti ottimistici

Il demo consente una sola mutation per volta in un'unica `TasksPage`: ref sincrona contro doppio invio e controlli disabilitati. Un rollback dell'intera lista **non e una soluzione generale per scritture concorrenti**. Con piu pagine, tab o utenti servono riconciliazione per record, versioni o una diversa strategia; la mutation scope serializza l'esecuzione ma non risolve da sola ogni conflitto ottimistico.

Un errore di rete puo arrivare dopo che il server ha salvato: il rollback locale non annulla il salvataggio. Il refetch riconcilia quando possibile; se fallisce anch'esso, mostra che i dati non sono verificati e consenti un nuovo aggiornamento. Per operazioni non idempotenti progetta la deduplicazione lato server prima di introdurre retry delle scritture.

Un'alternativa e mostrare un elemento temporaneo dalla `mutation.variables` senza modificare la cache. E piu semplice quando la previsione serve in una sola vista; al fallimento rimuovi la previsione e mantieni un messaggio o una possibilita di retry.

## Varianti

- **Fetch in effect**: controlli espliciti per casi isolati, senza cache condivisa automatica.
- **TanStack Query/SWR**: gestione del ciclo di vita dei dati remoti; API e default diversi.
- **Loader del router/framework**: dati legati alla navigazione; nel Data Mode client non sono automaticamente server-side.
- **Aggiornamento pessimista**: aspetta la conferma prima di cambiare la UI; spesso preferibile a rollback complessi.
- **Optimistic UI/cache**: previsione locale o cache condivisa, con strategia di errore e riconciliazione.
- **SSR/persistenza**: client isolato per richiesta, hydration e plugin di persistenza richiedono configurazione ulteriore. La cache del demo sparisce al reload e va gestita al cambio utente.

## Errori comuni

- Nascondere dati validi quando un refresh in background fallisce.
- Confondere `staleTime`, garbage collection e polling.
- Omettere filtri/utente dalla chiave o riutilizzarla per risultati incompatibili.
- Restituire `undefined` da una query o scambiare un HTTP 500 per successo.
- Mutare l'array di cache in-place, ricreare QueryClient o duplicare risultati nello stato locale.
- Dimenticare la Promise dell'invalidazione e dichiarare concluso il lavoro troppo presto.
- Ripristinare uno snapshot globale sovrascrivendo modifiche concorrenti.
- Ignorare il rifiuto di `mutateAsync` o fare retry ciechi di una scrittura.

## Checklist

- Contratto HTTP e schema di risposta espliciti?
- Istanza client stabile e chiavi complete rispetto agli input?
- Distinti primo caricamento, pausa, vuoto e refresh fallito?
- Signal consumato e errori rappresentati senza Promise rifiutate ignorate?
- Snapshot, concorrenza, invalidazione e risposta autorevole gestiti?
- Cache isolata per richiesta/utente dove necessario, senza persistere segreti?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useEffect|useEffect]]
- [[Programmazione/React/Pagine/Gestione della memoria e AbortController|Gestione della memoria e AbortController]]
- [[Programmazione/React/Pagine/API layer|API layer]]
- [[Programmazione/React/Pagine/State Management Esterno|State Management Esterno]]
- [[Programmazione/React/Pagine/React Router|React Router]]
- [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]

## Fonti

- [TanStack Query: Quick Start](https://tanstack.com/query/latest/docs/framework/react/quick-start).
- [TanStack Query: default](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults).
- [TanStack Query: chiavi](https://github.com/TanStack/query/blob/main/docs/framework/react/guides/query-keys.md).
- [TanStack Query: cancellazione](https://github.com/TanStack/query/blob/main/docs/framework/react/guides/query-cancellation.md).
- [TanStack Query: aggiornamenti ottimistici](https://github.com/TanStack/query/blob/main/docs/framework/react/guides/optimistic-updates.md).
- [TanStack Query: mutation](https://tanstack.com/query/latest/docs/framework/react/guides/mutations).
- [MDN: usare Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), HTTP, JSON e signal.

Fonti consultate il 2026-10-15; esempio TanStack Query 5.104.3.
