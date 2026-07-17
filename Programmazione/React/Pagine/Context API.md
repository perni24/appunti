---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, context, state]
aliases: [Context API, React Context]
prerequisites: []
related: []
---

# Context API

## Sintesi

Context API permette di passare dati attraverso l'albero React senza inoltrare props a ogni livello. E utile per valori globali o semi-globali come tema, locale, sessione utente, feature flag o dipendenze applicative.

Non e automaticamente uno state manager completo: se ogni aggiornamento causa render estesi o la logica diventa complessa, valuta strumenti dedicati.

## Quando usarlo

Usa Context quando molti componenti distanti devono leggere lo stesso valore. E adatto a dati letti spesso ma aggiornati raramente. Evitalo per stato molto dinamico, grandi oggetti mutabili o cache server.

## Come funziona

```jsx
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  const theme = useContext(ThemeContext);
  return <div data-theme={theme} />;
}
```

Il provider rende disponibile un valore ai discendenti.

## API / Sintassi

Creazione:

```jsx
const AuthContext = createContext(null);
```

Provider:

```jsx
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

Hook dedicato:

```jsx
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
```

## Esempio pratico

```jsx
function LocaleProvider({ children }) {
  const [locale, setLocale] = useState("it");

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}
```

`useMemo` evita di creare un nuovo oggetto a ogni render quando il valore non cambia.

## Varianti

- **Context di configurazione**: tema, locale, feature flag.
- **Context di sessione**: utente corrente e permessi.
- **Context + reducer**: stato condiviso semplice.
- **Context multipli**: separare domini diversi.
- **Hook wrapper**: nasconde dettagli e valida uso corretto.

## Errori comuni

- Usare Context per tutto lo stato.
- Mettere troppi valori non correlati nello stesso provider.
- Passare oggetti creati inline senza memoization quando il render pesa.
- Usarlo come cache server.
- Nascondere dipendenze globali difficili da testare.

## Checklist

- Il dato serve a componenti distanti?
- Il valore cambia raramente?
- Il provider ha responsabilita chiara?
- Serve separare piu context?
- Il consumo avviene tramite hook dedicato?
- Un state manager o data fetching cache sarebbe piu adatto?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[State Management Esterno]]
- [[useReducer]]
- [[Gestione Autenticazione]]
- [[Internazionalizzazione]]
