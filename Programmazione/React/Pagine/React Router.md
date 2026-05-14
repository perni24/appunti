---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [React Router]
prerequisites: []
related: []
---
# React Router

## Sintesi

Nota su React Router in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

**React Router** e la libreria piu usata per gestire la navigazione nelle applicazioni React a pagina singola (**SPA**, Single Page Application).

Permette di mappare la URL a componenti React, mantenendo il comportamento di navigazione tipico del web senza ricaricare completamente la pagina.

> [!INFO] Punto chiave
> In una SPA il browser cambia URL, ma il rendering della vista viene gestito dal client. React Router coordina questo passaggio tra URL, stato della navigazione e componenti da mostrare.

---

## 1. Perche serve

In un'app React non banale servono quasi sempre piu schermate:
- home;
- pagina dettaglio;
- area autenticata;
- pagina 404;
- layout con sidebar, header e contenuto centrale.

Senza un router, dovresti gestire tutto con rendering condizionale manuale, perdendo:
- URL significative;
- navigazione browser coerente;
- pulsanti avanti/indietro;
- deep linking;
- struttura piu chiara dell'app.

React Router risolve questo problema.

---

## 2. Struttura di base

I concetti principali sono:
- `BrowserRouter`: integra React con la history API del browser;
- `Routes`: contenitore che sceglie quale route renderizzare;
- `Route`: associa un path a un componente;
- `Link`: navigazione dichiarativa senza reload completo;
- `Outlet`: punto in cui renderizzare le route annidate.

Esempio minimo:

```javascript
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

Quando la URL cambia, React Router seleziona il componente corrispondente.

---

## 3. Link e navigazione

Per navigare non si usa normalmente il tag HTML `<a>` con URL interne, perche causerebbe un reload completo della pagina.

Si usa invece `Link`:

```javascript
<Link to="/dashboard">Dashboard</Link>
```

Per link di navigazione attiva, utile nei menu, si usa spesso `NavLink`, che permette di applicare stile diverso alla rotta corrente.

Questo mantiene il comportamento da SPA:
- niente refresh completo;
- stato React preservato dove possibile;
- navigazione piu fluida.

---

## 4. Parametri URL

React Router permette di definire segmenti dinamici nel path.

```javascript
<Route path="/users/:userId" element={<UserPage />} />
```

Dentro il componente puoi leggere il parametro con `useParams`:

```javascript
import { useParams } from "react-router-dom";

function UserPage() {
  const { userId } = useParams();

  return <h1>Utente {userId}</h1>;
}
```

Questo e utile per pagine dettaglio, profili, prodotti, articoli o risorse identificate da ID o slug.

---

## 5. Nested Routes e Outlet

Una delle feature piu importanti e la gestione delle **route annidate**.

Esempio:

```javascript
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

function DashboardLayout() {
  return (
    <div>
      <Sidebar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

Qui:
- `DashboardLayout` resta stabile;
- `Outlet` cambia contenuto in base alla sottorotta;
- la struttura UI segue meglio la gerarchia dell'app.

Questo pattern e molto utile per layout persistenti.

---

## 6. Navigazione programmatica

Non sempre la navigazione parte da un click su un link. A volte serve reindirizzare dopo:
- login;
- submit di un form;
- logout;
- controllo di autorizzazione;
- completamento di un'azione.

Per questo si usa `useNavigate`:

```javascript
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const navigate = useNavigate();

  function handleSuccess() {
    navigate("/dashboard");
  }

  return <button onClick={handleSuccess}>Login</button>;
}
```

E il modo corretto di navigare da codice.

---

## 7. Protezione delle rotte

Un caso molto comune e limitare l'accesso a certe pagine agli utenti autenticati.

Pattern tipico:

```javascript
import { Navigate } from "react-router-dom";

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

Uso:

```javascript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute isAuthenticated={isAuthenticated}>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

In applicazioni reali, `isAuthenticated` viene spesso letto da [[Programmazione/React/Pagine/Context API]] o da uno state manager esterno.

> [!WARNING] Sicurezza reale
> Proteggere una route lato client migliora UX e controllo del flusso, ma non sostituisce l'autorizzazione lato server. I controlli di sicurezza reali devono esistere anche sulle API.

---

## 8. Query string e stato della navigazione

Oltre ai parametri nel path, una route puo usare anche la query string:

```javascript
/products?category=books&page=2
```

Questo e utile per:
- filtri;
- ordinamenti;
- paginazione;
- stato condivisibile via URL.

La URL diventa cosi parte dello stato dell'applicazione, e spesso e preferibile a tenere tutto solo in [[Programmazione/React/Pagine/useState]].

---

## 9. Route not found

Una buona configurazione prevede quasi sempre una pagina di fallback:

```javascript
<Route path="*" element={<NotFound />} />
```

Serve per gestire:
- URL sbagliate;
- link obsoleti;
- percorsi non previsti.

E migliora robustezza e UX.

---

## 10. Relazione con React

React Router non sostituisce React: si integra con il suo modello dichiarativo.

Si collega bene a:
- [[Programmazione/React/Pagine/Context API]] per autenticazione, tema o permessi;
- [[Programmazione/React/Pagine/useEffect]] quando una route attiva side effect o fetch dipendenti dai parametri;
- [[Programmazione/React/Pagine/Suspense e Lazy Loading]] se vuoi caricare pagine solo quando servono;
- gestione del layout tramite composizione di componenti.

In pratica, React Router organizza **la navigazione**, mentre React continua a gestire **stato, rendering e composizione**.

---

## 11. Best Practices

1. **Modella le route come struttura dell'app, non come elenco casuale di path:** layout e annidamento devono riflettere la UI reale.
2. **Usa `Link` o `NavLink` per navigazione interna:** evita `<a>` per route client-side.
3. **Metti nello URL lo stato che deve essere condivisibile o ricaricabile:** filtri, pagina corrente, identificatori e tab spesso appartengono alla URL.
4. **Proteggi le route lato client per UX, ma valida sempre lato server:** sono due problemi diversi.
5. **Usa `Outlet` per layout persistenti:** riduce duplicazione e rende piu chiara la gerarchia.
6. **Non concentrare tutta la logica dell'app nelle route:** le route decidono cosa mostrare, ma il dominio applicativo deve restare nei componenti e nei servizi giusti.

---
