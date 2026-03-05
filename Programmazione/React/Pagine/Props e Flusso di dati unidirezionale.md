---
date: 2026-03-02
tags: [react, props, data-flow, frontend, basics]
type: #permanent-note
status: budding
---

# Props e Flusso di dati unidirezionale

In React, le **Props** (abbreviazione di *properties*) sono il meccanismo principale per passare dati da un componente genitore (Parent) a un componente figlio (Child). Insieme allo stato, costituiscono il cuore della reattività di React.

## 1. Cosa sono le Props?

Le props sono oggetti JavaScript che contengono i dati passati a un componente. Possono essere paragonate agli argomenti di una funzione.

```jsx
// Definizione del componente figlio
function UserProfile(props) {
  return <h2>Utente: {props.username}</h2>;
}

// Utilizzo nel componente genitore
function App() {
  return <UserProfile username="Luca" />;
}
```

> [!IMPORTANT] Immutabilità
> Le props sono **read-only** (sola lettura). Un componente non deve mai modificare le proprie props. Se i dati devono cambiare, il cambiamento deve avvenire nel genitore tramite lo stato.

---

## 2. Flusso di dati unidirezionale (One-way Data Flow)

React segue un modello di flusso dati rigorosamente **dall'alto verso il basso**. Questo significa che:
- Il genitore possiede il dato (stato).
- Il genitore passa il dato al figlio tramite le props.
- Il figlio consuma il dato per renderizzare la UI.

Questo approccio rende l'applicazione più facile da debuggare, poiché l'origine di un dato è sempre chiara e tracciabile risalendo l'albero dei componenti.

---

## 3. Comunicazione Figlio-Genitore: Lifting State Up

Se un figlio deve comunicare un cambiamento al genitore (ad esempio, l'invio di un form), non può "scrivere" nelle props. Invece, il genitore passa una **funzione di callback** come prop.

```jsx
function SearchBar(props) {
  return (
    <input 
      type="text" 
      onChange={(e) => props.onSearchChange(e.target.value)} 
    />
  );
}

function App() {
  const handleSearch = (value) => console.log("Cercando:", value);
  return <SearchBar onSearchChange={handleSearch} />;
}
```

Questo pattern è conosciuto come **Lifting State Up** (Spostamento dello stato verso l'alto).

---

## 4. Props Destructuring

Per rendere il codice più pulito, è pratica comune estrarre le proprietà direttamente nella firma della funzione:

```jsx
// Invece di function User(props) { ... props.name ... }
function User({ name, age }) {
  return <div>{name} ha {age} anni</div>;
}
```

---
