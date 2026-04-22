---
date: 2026-04-22
tags: [react, authentication, jwt, cookies, httpOnly, localStorage, frontend, javascript]
type: #permanent-note
status: budding
---

# Gestione Autenticazione

La **gestione autenticazione** in React riguarda il modo in cui il frontend riconosce un utente autenticato, conserva il suo stato di sessione e limita l'accesso a certe aree dell'interfaccia.

Nel frontend, pero, l'autenticazione non e solo un problema di UX. E anche un problema di sicurezza, sincronizzazione con il backend e gestione corretta dei token o cookie.

> [!INFO] Punto chiave
> Il frontend non "garantisce" l'autenticazione. Può solo rappresentare e usare uno stato autenticato deciso dal backend o da un sistema di identita affidabile.

---

## 1. Autenticazione vs autorizzazione

Conviene distinguere due concetti.

### Autenticazione
Risponde alla domanda:

"Chi sei?"

Esempio:
- login con email e password;
- accesso con provider OAuth;
- sessione utente attiva.

### Autorizzazione
Risponde alla domanda:

"Cosa puoi fare?"

Esempio:
- area admin;
- permessi di scrittura;
- accesso a risorse riservate.

Nel frontend i due concetti spesso si intrecciano, ma non vanno confusi.

---

## 2. Cosa gestisce davvero il frontend

Nel frontend React, la gestione auth tipicamente include:
- sapere se l'utente e loggato;
- conoscere i dati base dell'utente corrente;
- mostrare UI diverse in base allo stato auth;
- proteggere certe route lato client;
- inviare credenziali o token nelle request;
- gestire login, logout e stato di caricamento iniziale.

Questa logica viene spesso centralizzata tramite [[Context API]], custom hook o store esterno.

---

## 3. Stato di autenticazione nel client

Uno schema comune e questo:

```javascript
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // bootstrap session

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

Il frontend deve spesso fare un bootstrap iniziale per capire:
- se esiste gia una sessione valida;
- se un token e ancora valido;
- quali dati utente minimi sono disponibili.

Fino a quel momento, la UI puo trovarsi in uno stato intermedio tra "anonimo" e "autenticato".

---

## 4. Protezione delle route

Nel frontend e comune limitare certe pagine agli utenti autenticati.

Pattern tipico:

```javascript
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

Questo si integra naturalmente con [[React Router]].

Ma e importante capire il limite:
- la route protection lato client migliora il flusso UX;
- non sostituisce il controllo autorizzativo lato server.

Un utente non autorizzato non deve poter ottenere dati riservati solo perche manipola il frontend.

---

## 5. JWT: cosa sono

I **JWT** (**JSON Web Token**) sono token firmati che rappresentano informazioni di autenticazione o identita.

Nel frontend spesso vengono usati per:
- identificare una sessione;
- essere inviati nelle request API;
- portare alcune informazioni utente o di scadenza.

Esempio concettuale:

```http
Authorization: Bearer <token>
```

Il frontend, pero, non dovrebbe considerare un JWT come "prova sufficiente" da verificare da solo. Il controllo reale resta lato server.

---

## 6. Dove conservare il token

Questo e uno dei punti piu delicati.

Le opzioni piu discusse sono:
- `localStorage`;
- `sessionStorage`;
- memoria runtime;
- cookie `HttpOnly`.

Ognuna ha tradeoff diversi.

---

## 7. localStorage

`localStorage` e semplice da usare:

```javascript
localStorage.setItem("token", token);
```

Vantaggi:
- persistenza tra refresh;
- API semplice;
- facile bootstrap della sessione.

Problemi:
- il token e leggibile dal JavaScript client;
- un attacco XSS puo esporlo;
- richiede molta disciplina lato sicurezza.

Per questo `localStorage` e comodo, ma va valutato con attenzione. Si collega direttamente a [[Protezione XSS]].

---

## 8. HttpOnly cookies

I cookie `HttpOnly` sono spesso considerati piu sicuri per la conservazione delle credenziali di sessione, perche:
- non sono leggibili dal JavaScript del frontend;
- riducono l'impatto di molte forme di XSS sul furto del token;
- si integrano bene con modelli di sessione server-side o token cookie-based.

Il tradeoff e che richiedono piu attenzione su:
- configurazione del backend;
- `SameSite`;
- `Secure`;
- gestione CSRF.

In pratica:
- `HttpOnly cookies` migliorano la protezione del token lato browser;
- ma spostano parte della complessita su configurazione HTTP e backend.

---

## 9. JWT in localStorage vs HttpOnly cookies

Il confronto corretto non e "uno e perfetto, l'altro no".

### localStorage
- piu semplice lato frontend;
- piu esposto in caso di XSS;
- piu facile per client API puramente token-based.

### HttpOnly cookies
- migliore protezione del token contro lettura via JavaScript;
- piu robusti in molti scenari reali;
- richiedono attenzione a CSRF e configurazione server.

Regola pratica:
- se l'architettura lo supporta bene, i cookie `HttpOnly` sono spesso preferibili;
- se usi token accessibili al client, devi essere piu rigoroso su XSS e lifecycle del token.

---

## 10. Login, bootstrap e logout

### Login
Il frontend invia credenziali al backend e riceve:
- sessione;
- token;
- oppure un errore di autenticazione.

### Bootstrap
Al mount dell'app, il frontend verifica se esiste una sessione valida.

Questo puo avvenire:
- leggendo un token locale;
- interrogando un endpoint `/me`;
- lasciando che il cookie venga inviato automaticamente e recuperando l'utente corrente.

### Logout
Il logout non e solo "nascondere la UI". Significa:
- invalidare lato server se serve;
- rimuovere token locali;
- resettare stato auth;
- fare redirect coerente.

```javascript
function logout() {
  setUser(null);
  localStorage.removeItem("token");
}
```

Nei sistemi a cookie, il logout passa spesso anche da una chiamata API che invalida la sessione.

---

## 11. Refresh token e scadenza sessione

Molti sistemi hanno:
- access token a breve durata;
- refresh token piu duraturo.

Il frontend deve allora gestire:
- token scaduti;
- refresh trasparente;
- retry delle request;
- redirect al login se la sessione non puo piu essere rinnovata.

Questa parte si collega anche a [[Data Fetching e Cache]], perche gli errori auth possono influire sulla strategia di fetch, retry e invalidazione dei dati.

---

## 12. UI auth-aware

Una UI React autenticata cambia spesso in base allo stato utente:
- navbar diversa per guest o user loggato;
- pulsanti login/logout;
- pagine protette;
- placeholder durante bootstrap sessione;
- messaggi di permesso negato.

Per questo l'autenticazione non e solo un layer di sicurezza. E anche un layer di stato applicativo condiviso, spesso ben rappresentato tramite [[Context API]] o store esterno.

---

## 13. Errori comuni

Errori frequenti:
- fidarsi solo della route protection client-side;
- tenere token sensibili in posti troppo esposti senza considerare XSS;
- non gestire stato di bootstrap iniziale;
- non distinguere utente non loggato da sessione ancora in verifica;
- logout incompleto;
- assenza di strategia chiara per scadenza token o refresh.

Il frontend deve essere chiaro sia sullo stato tecnico sia su quello UX.

---

## 14. Best Practices

1. **Distingui sempre autenticazione e autorizzazione:** sono problemi collegati ma diversi.
2. **Usa il frontend per rappresentare lo stato auth, non per fare enforcement finale:** la sicurezza reale resta lato server.
3. **Preferisci cookie `HttpOnly` quando l'architettura lo consente:** riducono l'esposizione dei token al JavaScript client.
4. **Se usi token accessibili al client, tratta XSS come rischio prioritario:** `localStorage` e semplice, ma alza il costo di un'iniezione.
5. **Centralizza lo stato auth in un provider o hook dedicato:** evita logica dispersa nei componenti.
6. **Gestisci bene bootstrap, loading iniziale e logout:** sono parti essenziali del flusso, non dettagli secondari.

---
