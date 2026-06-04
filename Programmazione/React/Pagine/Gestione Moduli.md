---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, forms, modules]
aliases: [Gestione Moduli, Form React, Controlled components, Uncontrolled components, Gestione eventi]
prerequisites: []
related: []
---

# Gestione Moduli

## Sintesi

La gestione dei moduli in React riguarda input, validazione, submit, errori, stato sporco, touched state e integrazione con API. I form possono essere controllati da React o non controllati, a seconda del livello di controllo richiesto.

## Quando usarlo

Usa form controllati per input piccoli o quando lo stato deve reagire in tempo reale. Usa librerie come React Hook Form quando i form diventano grandi, con validazione, performance e molti campi.

## Come funziona

Controlled input:

```jsx
function LoginForm() {
  const [email, setEmail] = useState("");

  return (
    <input
      value={email}
      onChange={(event) => setEmail(event.target.value)}
    />
  );
}
```

Uncontrolled input:

```jsx
const inputRef = useRef(null);
```

Il valore viene letto dal DOM quando serve.

## API / Sintassi

Submit:

```jsx
function handleSubmit(event) {
  event.preventDefault();
  submitForm({ email });
}
```

Select:

```jsx
<select value={role} onChange={(event) => setRole(event.target.value)}>
  <option value="admin">Admin</option>
  <option value="user">User</option>
</select>
```

Checkbox:

```jsx
<input
  type="checkbox"
  checked={accepted}
  onChange={(event) => setAccepted(event.target.checked)}
/>
```

## Esempio pratico

```jsx
function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ email, password });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(event) => setEmail(event.target.value)} />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button type="submit">Accedi</button>
    </form>
  );
}
```

## Varianti

- **Controlled components**: valore gestito da React.
- **Uncontrolled components**: valore gestito dal DOM.
- **React Hook Form**: form grandi e performanti.
- **Zod/Yup validation**: validazione schema.
- **Server actions / actions**: pattern moderni legati ai framework.
- **Form native**: semantica HTML e progressive enhancement.

## Errori comuni

- Non usare `event.preventDefault()` quando serve.
- Dimenticare label accessibili.
- Mescolare controlled e uncontrolled sullo stesso input.
- Validare solo lato client.
- Disabilitare submit senza comunicare stato.
- Perdere errori e touched state.

## Checklist

- Ogni input ha label o nome accessibile?
- Il submit gestisce errori e loading?
- Serve controlled o uncontrolled?
- La validazione e anche server-side?
- Il form resta usabile da tastiera?
- Una libreria form ridurrebbe complessita?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Validazione Dati]]
- [[Pydantic]]
- [[Focus Management]]
- [[Data Fetching e Cache]]
