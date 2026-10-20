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
  - routing
  - frontend
aliases:
  - React Router
  - Routing React
prerequisites:
  - "[[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]"
related:
  - "[[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]"
  - "[[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]"
title: React Router
---

# React Router

## Sintesi

React Router collega URL, navigazione e albero dei componenti. Le route annidate rappresentano layout e pagine; parametri e query string rappresentano dati navigabili. Le funzioni disponibili dipendono dalla modalita scelta, non soltanto dalla versione.

Questa nota usa **React Router 8.4.0**, React/React DOM 19.3.0 e Node 24.14.0. La versione 8 richiede Node almeno 22.22 e React/React DOM almeno 19.2.7. Non mescolare questi import con tutorial di React Router 5, 6 o 7: in v8 `react-router-dom` e stato rimosso; si usano `react-router` e, per il provider DOM, `react-router/dom`.

## Quando usarlo

Usalo quando sezioni, dettagli o filtri devono poter essere aperti direttamente, condivisi come link e ripercorsi con Indietro/Avanti. Un tab puramente locale non deve necessariamente diventare una route.

Se il progetto usa gia un framework con router, segui quello: aggiungere un secondo router non e il modo normale per integrare una pagina. Le vecchie guide Remix v2 e il Framework Mode moderno di React Router non sono nomi da sostituire automaticamente nello stesso codice.

## Come funziona

| Modalita | Punto di ingresso | Responsabilita |
| --- | --- | --- |
| Declarative | `BrowserRouter` + `Routes` | Matching, link, parametri; fetching gestito separatamente |
| Data | `createBrowserRouter` + `RouterProvider` | Aggiunge loader, action, errori e stato della navigazione |
| Framework | Plugin Vite di React Router | Convenzioni dei moduli, code splitting e strategie di rendering |

Nel Data Mode il router viene creato fuori dal render. Il layout rende un `Outlet`, dove compare il figlio selezionato; una route `index` occupa l'URL del genitore senza aggiungere segmenti. Il loader fornisce dati alla route: non e un effect e non e automaticamente codice server. Nel demo gira nel browser.

Una route sconosciuta e un record inesistente sono casi distinti: `*` gestisce un percorso non riconosciuto, mentre il loader puo rifiutare `/users/99` anche se il percorso corrisponde al pattern.

## API / Sintassi

- `Link` conserva la semantica di un collegamento; `NavLink` aggiunge stato attivo e `aria-current`. Per un evento che conclude un'operazione puoi usare `useNavigate`, ma non sostituire ogni link con un pulsante.
- `useParams` restituisce segmenti testuali, non numeri validati. `useSearchParams` legge/modifica la query: usa il setter, non mutare soltanto l'oggetto ricevuto.
- `useLoaderData` legge il risultato del loader; `useNavigation` distingue `idle`, `loading` e `submitting`. Non misura tutte le richieste dell'app, per esempio quelle di una cache esterna.
- `errorElement` e `useRouteError` gestiscono gli errori della route; `isRouteErrorResponse` distingue le risposte lanciate dagli errori generici.
- `action`, `Form`, `useActionData` e `useFetcher` appartengono alle modalita dati/framework. Un'action riuscita normalmente provoca la rivalidazione dei loader interessati; non e una cache globale equivalente a TanStack Query.
- `replace: true` sostituisce la voce corrente della history. Per un ritorno garantito usa una destinazione esplicita: `navigate(-1)` potrebbe uscire dall'app se non conosci la voce precedente.

## Esempio pratico

Demo Data Mode completo, client-only, nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Installazione nella cartella dell'app, non nel `site` del vault:

```sh
npm install --save-exact react-router@8.4.0
```

Crea `public/users.json`, un file statico, non un endpoint con autenticazione:

```json
[
  { "id": "1", "name": "Ada" },
  { "id": "2", "name": "Grace" }
]
```

Sostituisci `src/App.jsx`. Il progetto e pubblicato alla radice; il percorso `/users.json` va adattato se usi un sottopercorso.

```jsx
import {
  createBrowserRouter, isRouteErrorResponse, Link, NavLink, Outlet,
  useLoaderData, useNavigation, useRouteError, useSearchParams,
} from "react-router";
import { RouterProvider } from "react-router/dom";

export function parseUsers(value) {
  if (!Array.isArray(value) || value.some((user) =>
    !user || typeof user.id !== "string" || !/^[1-9]\d*$/.test(user.id) ||
    typeof user.name !== "string" || !user.name.trim()
  )) throw new Error("Elenco utenti non valido");
  if (new Set(value.map((user) => user.id)).size !== value.length) {
    throw new Error("ID duplicati");
  }
  return value.map(({ id, name }) => ({ id, name: name.trim() }));
}

export async function usersLoader({ request }) {
  const response = await fetch(new URL("/users.json", request.url), {
    signal: request.signal,
  });
  if (!response.ok) throw new Response(null, { status: response.status });
  return parseUsers(await response.json());
}

export async function userLoader(args) {
  const id = args.params.userId;
  if (!/^[1-9]\d*$/.test(id ?? "")) {
    throw new Response(null, { status: 400 });
  }
  const users = await usersLoader(args);
  const user = users.find((item) => item.id === id);
  if (!user) throw new Response(null, { status: 404 });
  return user;
}

function Loading() {
  return <p role="status">Caricamento pagina...</p>;
}

function Layout() {
  const navigation = useNavigation();
  return (
    <main>
      <nav aria-label="Navigazione principale">
        <NavLink to="/" end>Utenti</NavLink>{" | "}
        <NavLink to="/about">Informazioni</NavLink>
      </nav>
      {navigation.state !== "idle" && <Loading />}
      <Outlet />
    </main>
  );
}

function UsersPage() {
  const users = useLoaderData();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const visible = users.filter((user) =>
    user.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  function changeQuery(value) {
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    setParams(next, { replace: true });
  }
  return (
    <>
      <h1>Utenti</h1>
      <label>Filtra utenti
        <input value={query} onChange={(event) => changeQuery(event.target.value)} />
      </label>
      {visible.length === 0 ? <p>Nessun utente.</p> : (
        <ul>{visible.map((user) => (
          <li key={user.id}><Link to={`/users/${user.id}`}>{user.name}</Link></li>
        ))}</ul>
      )}
    </>
  );
}

function UserPage() {
  const user = useLoaderData();
  return <><h1>{user.name}</h1><p>ID: {user.id}</p><Link to="/">Tutti gli utenti</Link></>;
}

function NotFound() {
  return <><h1>Pagina non trovata</h1><Link to="/">Torna agli utenti</Link></>;
}

function RouteError() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return (
    <main>
      <h1>Errore {status}</h1>
      <p role="alert">Impossibile aprire questa pagina.</p>
      <Link to="/">Torna agli utenti</Link>
    </main>
  );
}

export const routes = [{
  path: "/", element: <Layout />, errorElement: <RouteError />,
  HydrateFallback: Loading,
  children: [
    { index: true, loader: usersLoader, element: <UsersPage /> },
    { path: "users/:userId", loader: userLoader, element: <UserPage /> },
    { path: "about", element: <h1>Informazioni</h1> },
    { path: "*", element: <NotFound /> },
  ],
}];

const router = createBrowserRouter(routes);
export default function RouterDemo() {
  return <RouterProvider router={router} />;
}
```

Non aggiungere anche un `BrowserRouter` in `main.jsx`: questo provider e gia il router. `HydrateFallback` fornisce la UI durante il caricamento iniziale dei dati; il suo nome non rende il demo una soluzione SSR.

Prove: apri Ada, usa Indietro, filtra con `?q=gr`, ricarica `/users/2`, visita `/users/99`, `/users/no` e `/inesistente`. Il filtro e nell'URL e preserva gli altri parametri. Ogni battitura usa `replace`, quindi non crea una voce history distinta. Il cambio della query puo rivalidare il loader: non disabilitare `shouldRevalidate` senza capire quali dati dipendono dai parametri.

### Hosting, errori e limiti

Il dev server Vite supporta il fallback SPA. Su un hosting reale, un accesso diretto a `/users/2` deve ricevere l'HTML dell'app: una route `*` JavaScript non corregge un 404 restituito prima che lo script si avvii. Verifica rewrite, asset e `basename` per i sottopercorsi, oppure valuta `createHashRouter` su hosting senza fallback. Non e una richiesta di cambiare il router del sito Quartz.

La schermata "Errore 404" del client non modifica lo status HTTP del documento gia scaricato. Un vero status HTTP per indicizzazione richiede una strategia server o statica appropriata.

Il loader inoltra il signal a Fetch, ma l'abort non annulla eventuali effetti gia avvenuti sul server. Non ci sono action di scrittura, autenticazione, cache persistente o gestione completa di focus/titolo dopo la navigazione nel demo. Un redirect client non protegge dati riservati: il server deve verificarne l'accesso.

## Varianti

- **Browser/Hash router**: stesso obiettivo di navigazione, diverso uso dell'URL e requisiti di hosting.
- **Memory router**: history in memoria per test o ambienti senza barra degli indirizzi.
- **Route senza path**: aggiunge un layout senza un segmento URL; serve comunque `Outlet`.
- **Parametri/search params**: identita della risorsa rispetto a filtri e paginazione; valida entrambi secondo il contratto.
- **Action e fetcher**: mutazioni e interazioni dati; non sono implementati nell'esempio di sola lettura.
- **Framework Mode**: funzionalita aggiuntive, non necessarie per copiare questo demo Data Mode.

## Errori comuni

- Copiare import di una major diversa o sovrapporre due router.
- Creare il router durante ogni render, oppure omettere `Outlet` nel layout.
- Trattare un parametro come numero gia validato o concatenare query senza encoding.
- Duplicare il filtro URL in uno stato locale da sincronizzare.
- Confondere 404 del documento, percorso sconosciuto e record assente.
- Nascondere loading/error e aspettarsi che il router gestisca ogni fetch esterno.
- Usare redirect/route protette client come unica autorizzazione.

## Checklist

- Versione, import e modalita sono coerenti?
- Layout, index route, errori e fallback iniziale sono espliciti?
- URL, filtri e policy history sono riproducibili con reload e Indietro?
- Parametri e payload sono validati, signal inoltrato?
- Hosting verificato anche su URL profondi e sottopercorsi?
- Titolo, focus e autorizzazioni hanno una strategia separata?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Framework Next.js e Remix|Framework Next.js e Remix]]
- [[Programmazione/React/Pagine/API layer|API layer]]
- [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]
- [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]
- [[Programmazione/React/Pagine/Focus Management|Focus Management]]

## Fonti

- [React Router: modalita](https://reactrouter.com/start/modes).
- [React Router: migrazione a v8](https://reactrouter.com/upgrading/v7), requisiti e rimozione di react-router-dom.
- [React Router: routing](https://reactrouter.com/start/declarative/routing), annidamento e parametri.
- [React Router: caricamento dati](https://reactrouter.com/start/data/data-loading).
- [RouterProvider: API v8](https://api.reactrouter.com/v8/functions/react-router.RouterProvider.html), import DOM.
- [React Router: deploy SPA](https://reactrouter.com/how-to/spa), fallback dell'hosting.

Fonti consultate il 2026-10-15; esempio React Router 8.4.0.
