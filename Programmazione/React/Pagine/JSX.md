---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [JSX (JavaScript XML)]
prerequisites: []
related: []
---
# JSX (JavaScript XML)

## Sintesi

Nota su JSX (JavaScript XML) in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

**JSX** è un'estensione della sintassi di JavaScript che permette di scrivere codice simile all'HTML direttamente all'interno dei file JS/JSX. È lo strumento principale di React per descrivere come dovrebbe apparire l'interfaccia utente.

## 1. Natura di JSX

Nonostante l'aspetto simile all'HTML, JSX è JavaScript a tutti gli effetti. Ogni tag JSX viene trasformato (solitamente tramite strumenti come Babel o Vite) in una chiamata a funzione `React.createElement()`.

> [!INFO] Esempio di Compilazione
> **Codice JSX:**
> ```jsx
> const element = <h1 className="title">Hello World</h1>;
> ```
> **Compilato in JS:**
> ```javascript
> const element = React.createElement('h1', { className: 'title' }, 'Hello World');
> ```

---

## 2. Regole Fondamentali

Per scrivere JSX correttamente, è necessario seguire alcune regole ferree:

1. **Un solo elemento radice:** Un componente deve restituire un singolo elemento genitore. Se hai più elementi, avvolgili in un `div` o in un **Fragment** (`<>...</>`).
2. **Tag autochiudenti:** Tutti i tag devono essere chiusi. I tag senza figli si chiudono con lo slash finale: `<img src="..." />`.
3. **camelCase per gli attributi:** Poiché JSX è JavaScript, molti attributi HTML usano il camelCase. Ad esempio, `class` diventa `className` e `onclick` diventa `onClick`.

---

## 3. Espressioni in JSX

Uno dei punti di forza di JSX è la possibilità di inserire logica JavaScript direttamente nel markup utilizzando le **parentesi graffe** `{}`.

```jsx
const name = "Luca";
const element = <h1>Benvenuto, {name}!</h1>;
```

Tutto ciò che si trova tra `{}` deve essere un'**espressione** (qualcosa che restituisce un valore), non uno statement (come un ciclo `for` o un `if`).

---

## 4. Perché usare JSX?

- **Leggibilità:** È molto più immediato capire la struttura della UI rispetto a chiamate annidate di `createElement`.
- **Sicurezza:** React esegue l'escape di qualsiasi valore inserito in JSX prima di renderizzarlo, aiutando a prevenire attacchi XSS (Cross-Site Scripting).
- **Potenza:** Permette di sfruttare tutta la potenza di JavaScript (mappe, filtri, variabili) per generare HTML dinamico.

---
