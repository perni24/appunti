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
  - auth
  - security
aliases:
  - Gestione Autenticazione
  - Token React
  - Sessione utente
prerequisites:
  - "[[Programmazione/React/Pagine/Context API|Context API]]"
  - "[[Programmazione/React/Pagine/useEffect|useEffect]]"
related:
  - "[[Programmazione/React/Pagine/Protezione XSS|Protezione XSS]]"
  - "[[Programmazione/React/Pagine/CSRF|CSRF]]"
  - "[[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]"
title: Gestione Autenticazione
---

# Gestione Autenticazione

## Sintesi

React rappresenta la sessione nell'interfaccia: caricamento iniziale, utente corrente, accesso richiesto, errori e logout. **Non autentica una persona e non autorizza una richiesta** soltanto perche un Context contiene un utente o una route e nascosta.

Il server o il provider d'identita verifica le credenziali; ogni API protetta controlla sessione e permessi sulla risorsa richiesta. Il frontend deve riflettere questi esiti senza inventare successi, perdere errori o mostrare dati dell'utente precedente.

## Quando usarlo

Usa un confine di sessione nelle app con dati privati, ruoli o API autenticate. La scelta fra cookie, bearer token e provider OIDC dipende dall'architettura, non da React. Per la produzione preferisci le integrazioni mantenute del framework/provider; l'esempio sotto illustra il contratto client di una sessione cookie sulla stessa origine.

## Come funziona

### Autenticazione, sessione e autorizzazione

- **Autenticazione**: come e stata verificata l'identita.
- **Sessione**: come quella verifica viene associata alle richieste successive e quando scade o viene revocata.
- **Autorizzazione**: quali operazioni sono consentite su quel record, tenant o funzione. Va verificata server-side a ogni richiesta, non soltanto sul ruolo mostrato in UI.

Il client puo essere modificato: nascondere un pulsante o aggiungere RequireAuth serve al flusso utente, non impedisce chiamate dirette alle API. Anche i loader e le Server Functions devono effettuare i propri controlli; non basta proteggere il layout.

### Stati che non vanno confusi

| Stato | Significato | UI |
| --- | --- | --- |
| loading | La sessione non e ancora nota | Attesa, senza dati privati |
| authenticated | Il server ha restituito una sessione valida | Area utente |
| anonymous | Il contratto API segnala sessione assente/scaduta | Accesso richiesto |
| error | Rete, server o risposta non valida | Errore e tentativo esplicito |
| logging-out | La revoca e in corso | Dati privati rimossi dalla UI |

Non trasformare qualunque errore in "utente anonimo": un 500 o una rete assente non certificano la fine della sessione. Normalmente 401 richiede una nuova autenticazione; 403 indica accesso rifiutato secondo il contratto dell'API e non va trattato come un comando di refresh infinito.

## API / Sintassi

### Contratto dell'esempio

Serve un backend sulla **stessa origine**, oppure un proxy di sviluppo verso quel backend. Vite e GitHub Pages non creano questi endpoint:

- `GET /api/session`: 200 JSON `{ user: { id, name }, csrfToken }`; 401 per sessione assente. L'ID e il nome sono stringhe non vuote; in questo esempio il token CSRF e una stringa base64url di 32-256 caratteri.
- `POST /api/logout`: riceve `X-CSRF-Token`, revoca la sessione e scade il cookie; 204 conferma l'esito. La ripetizione dopo una revoca gia eseguita deve essere gestita dal backend senza duplicare effetti.
- `/login`: pagina o flusso gestito dal server/provider; non implementato dal demo.
- Risposte private con `Cache-Control: no-store`, senza segreti del server nel JSON. Controlli di origine/CSRF e autorizzazione sono obblighi del backend, non effetti dell'header inviato dal browser.

Esempio di cookie impostato dal **server in HTTPS**; session ID generato in modo sicuro, non letterale:

```http
Set-Cookie: __Host-session=opaque-session-id; Path=/; Secure; HttpOnly; SameSite=Lax
```

Il prefisso __Host- richiede Secure, Path=/ e nessun Domain. HttpOnly impedisce document.cookie, non l'invio automatico ne le richieste di un eventuale XSS. SameSite riguarda il sito, non la stessa origine; Lax non e una difesa CSRF universale. Il token CSRF leggibile dal client non e il cookie di autenticazione.

## Esempio pratico

### Sessione cookie e interfaccia completa

Modulo `SessionDemo.jsx` per React/React DOM 19.3.0, da rendere con `<SessionDemo />`. Senza il backend previsto mostra un errore: non finge di autenticare. `api` e un punto di sostituzione per test/integratori e deve avere identita stabile.

```jsx
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";

export function checkSession(value) {
  const user = value?.user;
  if (!value || typeof value !== "object" || Array.isArray(value)
    || !user || typeof user !== "object" || Array.isArray(user)
    || typeof user.id !== "string" || user.id.trim() === ""
    || typeof user.name !== "string" || user.name.trim() === ""
    || typeof value.csrfToken !== "string"
    || !/^[A-Za-z0-9_-]{32,256}$/.test(value.csrfToken)) {
    throw new TypeError("Sessione non valida");
  }
  return { user: { id: user.id, name: user.name }, csrfToken: value.csrfToken };
}

export async function readSession({ signal }) {
  const response = await fetch("/api/session", {
    credentials: "same-origin", cache: "no-store", redirect: "error",
    headers: { Accept: "application/json" }, signal,
  });
  if (response.status === 401) return null;
  if (response.status !== 200) throw new Error(`Sessione HTTP ${response.status}`);
  return checkSession(await response.json());
}

export async function endSession(csrfToken, { signal }) {
  const response = await fetch("/api/logout", {
    method: "POST", credentials: "same-origin", cache: "no-store", redirect: "error",
    headers: { "X-CSRF-Token": csrfToken }, signal,
  });
  if (response.status !== 204) throw new Error(`Logout HTTP ${response.status}`);
}

const sessionApi = { readSession, endSession };
const AuthContext = createContext(null);

export function AuthProvider({ children, api = sessionApi }) {
  const [view, setView] = useState({ status: "loading", user: null });
  const session = useRef(null);
  const operation = useRef(null);

  const run = useCallback(async (kind) => {
    // Non avviare letture o altri logout durante una revoca gia in corso.
    if (operation.current?.kind === "logout") return;
    const known = session.current;
    if (kind === "logout" && !known) return;
    operation.current?.controller.abort();
    const request = { kind, controller: new AbortController() };
    operation.current = request;
    if (kind === "load") session.current = null;
    setView({ status: kind === "logout" ? "logging-out" : "loading", user: null });
    try {
      const options = { signal: request.controller.signal };
      const next = kind === "logout"
        ? (await api.endSession(known.csrfToken, options), null)
        : await api.readSession(options);
      if (operation.current !== request || request.controller.signal.aborted) return;
      session.current = next;
      setView(next ? { status: "authenticated", user: next.user }
        : { status: "anonymous", user: null });
    } catch {
      if (operation.current !== request || request.controller.signal.aborted) return;
      setView({ status: "error", user: null, failed: kind });
    } finally {
      if (operation.current === request) operation.current = null;
    }
  }, [api]);

  useEffect(() => {
    void run("load");
    return () => {
      operation.current?.controller.abort();
      operation.current = null;
      session.current = null;
    };
  }, [run]);

  const value = { ...view, reload: () => run("load"), logout: () => run("logout") };
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Serve AuthProvider");
  return value;
}

export function RequireAuth({ children }) {
  const auth = useAuth();
  if (auth.status === "loading") return <p role="status">Verifica sessione...</p>;
  if (auth.status === "logging-out") return <p role="status">Disconnessione...</p>;
  if (auth.status === "anonymous") return <p>Accesso richiesto. <a href="/login">Accedi</a></p>;
  if (auth.status === "error") {
    return (
      <section aria-label="Errore sessione">
        <p role="alert">{auth.failed === "logout"
          ? "Logout non confermato: la sessione sul server potrebbe essere ancora attiva."
          : "Impossibile verificare la sessione."}</p>
        {auth.failed === "logout" && <button type="button" onClick={auth.logout}>Riprova logout</button>}{" "}
        <button type="button" onClick={auth.reload}>Verifica di nuovo</button>
      </section>
    );
  }
  if (auth.status !== "authenticated") return null;
  return <section key={auth.user.id} aria-label="Area personale"
    style={{ overflowWrap: "anywhere" }}>{children}</section>;
}

export function PrivatePanel() {
  const { user, logout, reload } = useAuth();
  const id = useId();
  const [draft, setDraft] = useState("");
  return (
    <>
      <p>Utente: {user.name}</p>
      <label htmlFor={id}>Bozza locale</label>{" "}
      <input id={id} value={draft} onChange={(e) => setDraft(e.target.value)} />
      <p><button type="button" onClick={reload}>Ricontrolla sessione</button>{" "}
        <button type="button" onClick={logout}>Esci</button></p>
    </>
  );
}

export default function SessionDemo({ api = sessionApi }) {
  return <AuthProvider api={api}><RequireAuth><PrivatePanel /></RequireAuth></AuthProvider>;
}
```

Il confine smonta il pannello privato quando la sessione e incerta o termina: la bozza locale viene scartata anche durante una nuova verifica. E una scelta prudente della demo, non persistenza o sincronizzazione automatica di cache esterne.

Una lettura precedente non puo ripristinare la UI dopo cleanup o dopo un'operazione successiva, anche se l'API iniettata ignora abort. Strict Mode puo ripetere il GET iniziale in sviluppo: non inserire mutazioni nel bootstrap.

### Logout, cache e fallimenti

Il logout nasconde subito i dati, ma segnala successo solo dopo il 204 previsto. In caso di errore conserva la sessione nel ref del provider per il tentativo esplicito, senza ripubblicare l'utente nel Context; non dichiara la sessione revocata. Un POST annullato o un timeout non garantiscono che il server non abbia eseguito la revoca.

Nell'app reale annulla le richieste legate alla vecchia identita e svuota o isola le cache per utente/tenant. Considera query cache, store, dati persistiti e service worker: smontare React non li cancella. Dopo cambio account nessuna risposta della sessione precedente deve ripopolarli. Gli errori inattesi richiedono logging senza cookie, token o credenziali; qui la UI e volutamente generica.

## Varianti

### Cookie, bearer e OIDC

- **Cookie HttpOnly**: utile per sessioni same-origin o BFF; richiede HTTPS, scadenza/revoca server e difese CSRF. JavaScript non deve leggere il cookie per sapere chi e l'utente: interroga l'endpoint di sessione.
- **Bearer token in memoria**: evita persistenza su disco tramite Web Storage, ma non protegge dal codice XSS gia in esecuzione. LocalStorage e sessionStorage sono leggibili dagli script dell'origine; cifrare con una chiave disponibile allo stesso JavaScript non risolve quel problema.
- **OIDC/OAuth**: OAuth delega accesso, OIDC aggiunge identita. Per client browser pubblici usa il flusso supportato dal provider, normalmente Authorization Code con PKCE; non inserire client secret nel bundle. Non implementare manualmente callback, state, nonce o validazione dei token se esiste un SDK mantenuto.
- **Refresh**: serializza i tentativi concorrenti, limita i retry e termina il ciclo quando il refresh fallisce. Evita il replay automatico di mutazioni non idempotenti. Rotazione/revoca e riuso dei refresh token appartengono al server/provider; la demo non li implementa.

### Router, scadenza e piu schede

Un router puo sostituire il messaggio con un redirect a login, conservando solo una destinazione interna ammessa. Non passare una returnTo arbitraria a location o al provider: valida destinazione e flusso per evitare open redirect e loop.

Un 401 di un'API privata deve provocare una politica esplicita di rivalutazione della sessione, non una catena infinita di redirect. Il 403 va gestito come accesso negato secondo il contratto. Ruoli e claim nel client orientano la UI, non autorizzano la richiesta.

La demo rilegge la sessione al mount e su comando; non implementa timer di scadenza, refresh al focus o sincronizzazione fra schede. Un messaggio BroadcastChannel puo segnalare "ricontrolla la sessione", ma non prova un'identita. In SSR usa stato per richiesta e non una sessione globale condivisa fra utenti.

## Errori comuni

- Trattare UI nascosta, setUser o JWT decodificato nel browser come autorizzazione.
- Convertire qualsiasi eccezione in utente anonimo o lasciare un rigetto non gestito nel bootstrap.
- Confondere HttpOnly con assenza di XSS, o SameSite con assenza di CSRF.
- Dichiarare logout riuscito dopo il solo reset locale.
- Conservare cache o risposte del vecchio utente dopo cambio account.
- Fare refresh/redirect senza limiti, oppure ripetere una scrittura senza idempotenza.
- Inserire password, token, client secret o URL di ritorno non validati nel bundle/log.

## Checklist

- Contratto API, stati anonimo/errore e codici HTTP sono definiti?
- Il server autorizza ogni operazione e ogni risorsa/tenant?
- Cookie, CSRF, HTTPS, durata e revoca sono configurati lato server?
- Bootstrap, logout fallito, scadenza e cambio account sono provati?
- Richieste obsolete e cache sono legate alla corretta identita?
- Redirect e refresh hanno destinazioni, limiti e politiche di retry espliciti?
- Nessun dato privato viene incluso nel bundle o in cache condivise?
- Il flusso reale di login/provider e testato separatamente dalla sola UI?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Protezione XSS|Protezione XSS]]
- [[Programmazione/React/Pagine/CSRF|CSRF]]
- [[Programmazione/React/Pagine/Content Security Policy|Content Security Policy]]
- [[Programmazione/React/Pagine/Context API|Context API]]
- [[Programmazione/React/Pagine/API layer|API layer]]
- [[Programmazione/React/Pagine/React Router|React Router]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Gestione della memoria e AbortController|Gestione della memoria e AbortController]]

## Fonti

- [OWASP: Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
- [OWASP: Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).
- [OWASP: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).
- [OWASP: CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- [OWASP: HTML5 Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html).
- [OWASP: OAuth2](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html).
- [React: useEffect](https://react.dev/reference/react/useEffect).

Consultate il 2026-10-18. Esempio client React/React DOM 19.3.0; non implementa credenziali, backend, OIDC, refresh token o un sistema completo di autorizzazione.
