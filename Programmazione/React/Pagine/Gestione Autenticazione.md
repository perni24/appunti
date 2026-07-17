---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, auth, security]
aliases: [Gestione Autenticazione, Token React, Sessione utente]
prerequisites: []
related: []
---

# Gestione Autenticazione

## Sintesi

La gestione autenticazione in React riguarda sessione utente, stato di login, token, refresh, redirect, route protette e sicurezza dei dati. React gestisce la UI; la sicurezza reale dipende dal backend, dai cookie/token e dalle policy applicative.

## Quando usarlo

Serve in app con utenti, ruoli, permessi, dashboard private, API protette e sessioni persistenti.

## Come funziona

Pattern comune:

```jsx
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  return (
    <AuthContext.Provider value={{ user, status, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

L'app mostra loading iniziale finche non conosce la sessione.

## API / Sintassi

Route protetta:

```jsx
function RequireAuth({ children }) {
  const { user, status } = useAuth();

  if (status === "loading") return <SessionSkeleton />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
```

Logout:

```jsx
async function logout() {
  await api.logout();
  setUser(null);
}
```

## Esempio pratico

Bootstrap sessione:

```jsx
useEffect(() => {
  let active = true;

  async function loadSession() {
    try {
      const user = await getCurrentUser();
      if (active) setUser(user);
    } finally {
      if (active) setStatus("ready");
    }
  }

  loadSession();
  return () => { active = false; };
}, []);
```

## Varianti

- **Cookie httpOnly**: spesso preferibile per sessioni web.
- **Access token in memoria**: riduce esposizione a XSS.
- **Refresh token**: gestito con molta cautela.
- **Auth provider esterno**: OAuth/OIDC.
- **Role-based UI**: nasconde o mostra azioni, ma il backend deve autorizzare.

## Errori comuni

- Trattare UI nascosta come autorizzazione.
- Salvare token sensibili in localStorage senza valutare XSS.
- Non gestire refresh e scadenza.
- Non avere loading state sessione.
- Non invalidare cache dopo logout.
- Non separare autenticazione e autorizzazione.

## Checklist

- Dove sono salvati i token?
- Il backend autorizza ogni azione?
- La sessione iniziale ha loading state?
- Logout pulisce cache e stato?
- Gli errori auth hanno redirect coerente?
- XSS e CSRF sono considerati?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Protezione XSS]]
- [[CSRF]]
- [[Programmazione/React/Pagine/Content Security Policy|Content Security Policy]]
- [[Context API]]
- [[API layer]]
