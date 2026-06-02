---
date: 2026-06-02
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - react
  - state
  - architettura
aliases: []
prerequisites: []
related: []
---

# State colocato

## Sintesi

Lo **state colocato** consiste nel tenere lo stato il piu vicino possibile al componente o alla feature che lo usa.

## Quando usarlo

### Quando alzare lo stato
- Quando piu componenti fratelli devono leggerlo.
- Quando deve sopravvivere a navigazioni.
- Quando deve essere condiviso tra feature.
- Quando rappresenta cache server o sessione utente.

## Come funziona

### Concetto chiave
Non tutto lo stato deve essere globale. Uno stato locale e piu semplice da capire, testare e rimuovere.

```jsx
function SearchBox() {
  const [query, setQuery] = useState("");

  return <input value={query} onChange={event => setQuery(event.target.value)} />;
}
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

- Mettere tutto in uno store globale.
- Duplicare lo stesso stato in componenti diversi.
- Confondere stato UI, stato server e stato di dominio.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/State Management Esterno|State Management Esterno]]
- [[Programmazione/React/Pagine/Derived state|Derived state]]
