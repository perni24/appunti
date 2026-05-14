---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Context API]
prerequisites: []
related: []
---
# Context API

## Sintesi

Nota su Context API in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

La **Context API** e un meccanismo nativo di React che permette di condividere dati tra componenti anche molto distanti nell'albero, senza dover passare manualmente le `props` ad ogni livello intermedio.

E particolarmente utile per dati "globali" o trasversali come tema grafico, lingua, utente autenticato o configurazioni applicative.

> [!INFO] Prop Drilling
> Con **prop drilling** si intende il passaggio ripetuto delle stesse `props` attraverso molti componenti intermedi che in realta non le usano direttamente, ma servono solo a inoltrarle piu in profondita.

---

## 1. Struttura di base

La Context API ruota attorno a tre elementi:

1. **Context**: l'oggetto creato con `createContext`.
2. **Provider**: il componente che rende disponibile un valore ai discendenti.
3. **Consumer o useContext**: il modo in cui i componenti leggono quel valore.

```javascript
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ThemeButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button onClick={toggleTheme}>
      Tema attuale: {theme}
    </button>
  );
}
```

---

## 2. Come funziona

Quando un componente React e racchiuso dentro un `Provider`, puo leggere il valore del context tramite `useContext`.

- React cerca il `Provider` piu vicino nell'albero dei componenti.
- Se trova un `Provider`, restituisce il valore passato tramite la prop `value`.
- Se non lo trova, usa il valore di default definito in `createContext`.

> [!INFO] Lookup del Provider
> La ricerca del valore del context avviene risalendo l'albero dei componenti. Questo rende il context un sistema di **dependency injection** molto leggero: il dato non viene passato esplicitamente via `props`, ma "fornito" da un antenato comune.

Dal punto di vista architetturale, il vantaggio principale e la separazione tra:
- **componenti infrastrutturali**, che forniscono dati condivisi;
- **componenti di presentazione**, che si limitano a consumarli.

---

## 3. Esempio pratico: autenticazione

Uno degli usi piu comuni della Context API e la condivisione dello stato di autenticazione.

```javascript
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = username => {
    setUser({ name: username });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function UserPanel() {
  const { user, login, logout } = useContext(AuthContext);

  if (!user) {
    return <button onClick={() => login('Luca')}>Login</button>;
  }

  return (
    <div>
      <p>Benvenuto, {user.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

In questo modo non serve passare `user`, `login` e `logout` attraverso molti livelli di componenti.

---

## 4. useContext: il modo moderno di consumare un Context

In React moderno si preferisce quasi sempre `useContext` rispetto al vecchio pattern con `Context.Consumer`.

```javascript
const value = useContext(MyContext);
```

`useContext` rende il codice:
- piu leggibile;
- piu vicino allo stile dei [[Programmazione/React/Pagine/Custom Hooks]];
- piu semplice da comporre con [[Programmazione/React/Pagine/useState]], [[Programmazione/React/Pagine/useReducer]] e [[Programmazione/React/Pagine/useEffect]].

---

## 5. Quando usare la Context API

La Context API e adatta quando un dato deve essere letto da molti componenti in aree diverse dell'applicazione.

### Casi tipici
- tema dell'interfaccia;
- lingua corrente;
- utente autenticato;
- preferenze applicative;
- servizi condivisi o configurazioni globali.

### Quando non e la scelta migliore
Se il dato serve solo a pochi componenti vicini tra loro, spesso e meglio continuare a usare le `props`. Introdurre un context troppo presto puo rendere il flusso dei dati meno esplicito.

> [!WARNING] Context != State Manager completo
> La Context API non sostituisce automaticamente strumenti piu avanzati di state management. Con stati molto dinamici, aggiornamenti frequenti o logiche complesse, puo essere utile combinarla con [[Programmazione/React/Pagine/useReducer]] oppure valutare librerie dedicate.

---

## 6. Performance e re-render

Ogni volta che cambia il valore passato al `Provider`, tutti i componenti che consumano quel context possono essere rieseguiti.

Questo succede perche React confronta il riferimento del valore nella prop `value`. Se il valore e un nuovo oggetto creato ad ogni render, i consumer verranno aggiornati anche quando non strettamente necessario.

```javascript
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

Nel codice sopra, `value` e un nuovo oggetto ad ogni render.

### Strategie utili
- separare i context per responsabilita diverse;
- evitare di mettere nel context dati che cambiano continuamente;
- usare [[Programmazione/React/Pagine/useMemo e useCallback]] quando serve stabilizzare il valore fornito;
- combinare Context API e [[Programmazione/React/Pagine/useReducer]] per centralizzare meglio gli aggiornamenti.

---

## 7. Pattern comune: custom hook dedicato

Una Best Practice molto diffusa e incapsulare `useContext` in un custom hook dedicato. In questo modo:
- il context resta piu semplice da usare;
- si centralizza la validazione;
- si evita di importare il context grezzo ovunque.

```javascript
import { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
```

Questo pattern si integra molto bene con i [[Programmazione/React/Pagine/Custom Hooks]].

---

## 8. Context API vs Props

| Caratteristica | Props | Context API |
| :--- | :--- | :--- |
| **Visibilita del flusso dati** | Molto esplicita | Meno esplicita |
| **Comodita su alberi profondi** | Scomoda | Molto comoda |
| **Riutilizzo locale** | Ottimo | Puo essere eccessivo |
| **Dati globali condivisi** | Poco pratica | Ideale |

La regola pratica e semplice:
- usa le `props` quando il passaggio dei dati e locale e chiaro;
- usa il context quando il dato e trasversale a piu rami dell'interfaccia.

---

## 9. Best Practices

1. **Crea context piccoli e mirati:** un context per tema, uno per autenticazione, uno per preferenze, invece di un unico mega-context.
2. **Non abusare del context:** se basta passare una prop per due livelli, spesso e la scelta piu chiara.
3. **Incapsula `useContext` in custom hook:** migliora ergonomia e sicurezza.
4. **Mantieni stabile `value` quando necessario:** soprattutto se il provider espone oggetti e funzioni.
5. **Combina con altri hook:** il context funziona molto bene con [[Programmazione/React/Pagine/useState]], [[Programmazione/React/Pagine/useReducer]] e [[Programmazione/React/Pagine/Custom Hooks]].

---
