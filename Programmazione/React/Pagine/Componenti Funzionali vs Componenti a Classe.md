---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [react, components, frontend]
aliases: [Componenti Funzionali, Componenti a Classe]
prerequisites: []
related: []
---

# Componenti Funzionali vs Componenti a Classe

## Sintesi

I componenti funzionali sono il modo moderno e consigliato per scrivere React. Sono funzioni che ricevono props e restituiscono JSX. I componenti a classe sono il modello storico, ancora presente in codebase legacy, ma raramente usato per nuovo codice.

Gli hook hanno reso i componenti funzionali sufficienti per state, effect, context e logica riusabile.

## Quando usarlo

Scrivi nuovi componenti come funzioni. Studia i componenti a classe se devi mantenere codice esistente, leggere esempi legacy o capire Error Boundaries, che storicamente richiedono classi.

## Come funziona

Componente funzionale:

```jsx
function Counter({ initialValue = 0 }) {
  const [count, setCount] = useState(initialValue);

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

Componente a classe:

```jsx
class Counter extends React.Component {
  state = { count: 0 };

  render() {
    return <button>{this.state.count}</button>;
  }
}
```

La versione funzionale e piu breve e si integra con custom hooks.

## API / Sintassi

Funzione:

```jsx
function UserName({ user }) {
  return <span>{user.name}</span>;
}
```

Classe:

```jsx
class UserName extends React.Component {
  render() {
    return <span>{this.props.user.name}</span>;
  }
}
```

Hook:

```jsx
const [value, setValue] = useState("");
useEffect(() => {
  document.title = value;
}, [value]);
```

## Esempio pratico

Per nuova UI:

```jsx
function ProductCard({ product, onSelect }) {
  return (
    <article>
      <h2>{product.name}</h2>
      <button onClick={() => onSelect(product.id)}>Seleziona</button>
    </article>
  );
}
```

La logica di interazione arriva tramite props, mentre lo stato locale resta dove serve.

## Varianti

- **Function component**: standard moderno.
- **Class component**: legacy e alcuni casi di error boundary.
- **PureComponent**: ottimizzazione storica per classi.
- **Memoized component**: `React.memo` per componenti funzionali.
- **Custom hooks**: alternativa moderna a molte logiche condivise tra classi.

## Errori comuni

- Scrivere nuovi componenti a classe senza motivo.
- Convertire classi legacy solo per estetica, senza test.
- Usare hook dentro condizioni o funzioni annidate.
- Confondere props e state.
- Mettere troppa logica in un singolo componente.

## Checklist

- Il nuovo componente e funzionale?
- La logica riusabile puo diventare custom hook?
- Il componente ha responsabilita chiara?
- Serve davvero mantenere una classe?
- Esistono test prima di migrare codice legacy?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[useState]]
- [[useEffect]]
- [[Custom Hooks]]
- [[Error Boundaries]]
