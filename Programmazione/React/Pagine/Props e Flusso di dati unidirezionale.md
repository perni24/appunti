---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [react, props, state, frontend]
aliases: [Props, Flusso dati React, Children, Composizione componenti]
prerequisites: []
related: []
---

# Props e Flusso di dati unidirezionale

## Sintesi

Le props sono dati passati da un componente padre a un componente figlio. In React il flusso dati e unidirezionale: i dati scendono tramite props, gli eventi risalgono tramite callback.

Questo rende la UI piu prevedibile: guardando props e state puoi capire da dove arriva un valore e chi puo modificarlo.

## Quando usarlo

Usa props per configurare componenti, passare dati, callback, children e varianti visuali. Usa callback quando il figlio deve notificare al padre un evento.

Non usare props per creare dipendenze globali profonde: se il passaggio diventa troppo lungo, valuta composizione, context o state management.

## Come funziona

```jsx
function UserCard({ user, onSelect }) {
  return (
    <button onClick={() => onSelect(user.id)}>
      {user.name}
    </button>
  );
}

function UserList({ users }) {
  function handleSelect(userId) {
    console.log(userId);
  }

  return users.map((user) => (
    <UserCard key={user.id} user={user} onSelect={handleSelect} />
  ));
}
```

Il padre possiede la logica, il figlio emette eventi.

## API / Sintassi

Props base:

```jsx
<Button label="Salva" disabled={isSaving} />
```

Destructuring:

```jsx
function Button({ label, disabled }) {
  return <button disabled={disabled}>{label}</button>;
}
```

Children:

```jsx
function Card({ children }) {
  return <section className="card">{children}</section>;
}
```

Composizione:

```jsx
<Card>
  <h2>Profilo</h2>
  <UserDetails user={user} />
</Card>
```

## Esempio pratico

Componente controllato:

```jsx
function SearchBox({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Cerca"
    />
  );
}
```

Il valore vive nel padre; il figlio descrive solo input e notifica cambiamenti.

## Varianti

- **Props primitive**: stringhe, numeri, booleani.
- **Props oggetto**: dati strutturati.
- **Callback props**: eventi dal figlio al padre.
- **Children**: composizione dichiarativa.
- **Render props**: funzione passata come prop per controllare rendering.
- **Controlled props**: il padre controlla stato e comportamento.

## Errori comuni

- Modificare direttamente una prop.
- Passare oggetti enormi senza confini chiari.
- Usare props drilling eccessivo.
- Nascondere side effect in callback poco nominate.
- Duplicare lo stesso dato in piu stati locali.
- Usare children quando una prop esplicita sarebbe piu chiara.

## Checklist

- Il proprietario del dato e chiaro?
- Il figlio riceve solo cio che gli serve?
- Gli eventi risalgono con callback nominate bene?
- `children` migliora davvero la composizione?
- C'e duplicazione tra props e state?
- Serve context o basta passare props?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[State colocato]]
- [[Context API]]
- [[Control Props e State Reducer Pattern]]
- [[Rendering Condizionale e Liste]]
