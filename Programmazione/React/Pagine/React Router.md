---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, routing, frontend]
aliases: [React Router, Routing React]
prerequisites: []
related: []
---

# React Router

## Sintesi

React Router gestisce navigazione e routing client-side in applicazioni React. Mappa URL a componenti, supporta route annidate, parametri, link, navigazione programmatica e, nelle versioni moderne, anche loader e action.

## Quando usarlo

Usalo in SPA o applicazioni React dove l'URL deve rappresentare sezioni, dettagli, filtri o flussi. Se usi Next.js o Remix, il routing e gia gestito dal framework.

## Come funziona

```jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/users/:userId", element: <UserPage /> },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

`path` descrive l'URL, `element` descrive la UI da renderizzare.

## API / Sintassi

Link:

```jsx
<Link to="/users/1">Utente</Link>
```

Parametro:

```jsx
const { userId } = useParams();
```

Navigazione:

```jsx
const navigate = useNavigate();
navigate("/dashboard");
```

Route annidate:

```jsx
{
  path: "/settings",
  element: <SettingsLayout />,
  children: [
    { path: "profile", element: <ProfileSettings /> },
  ],
}
```

## Esempio pratico

```jsx
function UserPage() {
  const { userId } = useParams();

  return (
    <main>
      <h1>Utente {userId}</h1>
    </main>
  );
}
```

## Varianti

- **Browser router**: URL normali con history API.
- **Hash router**: utile in hosting statici limitati.
- **Nested routes**: layout condivisi.
- **Route params**: segmenti dinamici.
- **Search params**: filtri e paginazione.
- **Data routers**: loader, action e error boundary per route.

## Errori comuni

- Mettere stato condivisibile nell'app invece che nell'URL.
- Non gestire route non trovate.
- Usare navigazione programmatica quando un link sarebbe piu accessibile.
- Non separare layout e pagine.
- Non gestire errori di loader/action.
- Duplicare logica di parsing query params.

## Checklist

- L'URL rappresenta lo stato navigabile?
- Le route hanno layout chiari?
- Parametri e query string sono validati?
- Esiste una pagina 404?
- Link e navigazione sono accessibili?
- Serve un framework con routing server-side?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Data Fetching e Cache]]
- [[Framework Next.js e Remix]]
- [[API layer]]
- [[Error Boundaries]]
