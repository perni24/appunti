---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, hooks, architecture]
aliases: [Custom Hooks, Hook personalizzati]
prerequisites: []
related: []
---

# Custom Hooks

## Sintesi

Un custom hook e una funzione JavaScript che usa hook React e incapsula logica riusabile. Per convenzione inizia con `use`, per esempio `useDebouncedValue` o `useLocalStorage`.

Serve a separare logica di stato/side effect dalla UI senza introdurre componenti wrapper inutili.

## Quando usarlo

Usa custom hook quando:

- la stessa logica viene duplicata in piu componenti;
- vuoi isolare data fetching, subscription, storage o timer;
- vuoi rendere un componente piu leggibile;
- vuoi testare logica separatamente;
- vuoi creare API interne coerenti.

Evita custom hook prematuri per logica usata una sola volta e ancora instabile.

## Come funziona

```jsx
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  function toggle() {
    setValue((current) => !current);
  }

  return [value, toggle];
}
```

Uso:

```jsx
function Panel() {
  const [isOpen, toggleOpen] = useToggle();

  return <button onClick={toggleOpen}>{isOpen ? "Chiudi" : "Apri"}</button>;
}
```

## API / Sintassi

Regole:

- il nome deve iniziare con `use`;
- puo chiamare altri hook;
- deve rispettare le Rules of Hooks;
- puo restituire valori, oggetti, funzioni o tuple;
- non renderizza JSX direttamente.

Hook con effect:

```jsx
function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
```

## Esempio pratico

Debounce:

```jsx
function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(id);
  }, [value, delay]);

  return debouncedValue;
}
```

Questo hook puo essere riusato in ricerche, filtri e input remoti.

## Varianti

- **Hook di UI state**: toggle, disclosure, tabs.
- **Hook di effect**: listener, media query, document title.
- **Hook di data fetching**: wrapper su cache o API.
- **Hook di form**: stato e validazione.
- **Hook di integrazione**: librerie esterne, storage, browser API.
- **Hook compositi**: combinano piu hook semplici.

## Errori comuni

- Creare hook troppo generici e difficili da capire.
- Nascondere side effect importanti.
- Restituire API instabili senza motivo.
- Violare Rules of Hooks.
- Usare hook per condividere stato quando in realta ogni chiamata ha stato separato.
- Non documentare dipendenze e comportamento.

## Checklist

- La logica e davvero riusabile?
- Il nome spiega il comportamento?
- L'API restituita e stabile e leggibile?
- Gli effect hanno cleanup?
- Le dipendenze sono corrette?
- Il chiamante capisce se lo stato e locale o condiviso?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[useState]]
- [[useEffect]]
- [[useReducer]]
- [[Data Fetching e Cache]]
