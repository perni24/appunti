---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Componenti Funzionali vs Componenti a Classe]
prerequisites: []
related: []
---
# Componenti Funzionali vs Componenti a Classe

## Sintesi

Nota su Componenti Funzionali vs Componenti a Classe in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

In React, i componenti sono i mattoni fondamentali della UI. Storicamente, esistono due modi principali per definirli: tramite funzioni (**Functional Components**) o tramite classi ES6 (**Class Components**).

## 1. Componenti a Classe (Legacy)

Prima dell'introduzione dei Hooks (React 16.8), le classi erano l'unico modo per gestire lo **stato locale** (`this.state`) e i **metodi del ciclo di vita** (`componentDidMount`, `componentDidUpdate`, ecc.).

```jsx
class Welcome extends React.Component {
  render() {
    return <h1>Ciao, {this.props.name}</h1>;
  }
}
```

> [!WARNING] Svantaggi dei Class Components
> - **Verbosity:** Richiedono molto codice "boilerplate" (constructor, bind dei metodi).
> - **This context:** La gestione della parola chiave `this` in JavaScript può essere fonte di bug comuni.
> - **Difficoltà di ottimizzazione:** I tool di minificazione del codice hanno più difficoltà a ottimizzare le classi rispetto alle funzioni.

---

## 2. Componenti Funzionali (Standard Moderno)

Oggi i componenti funzionali sono la scelta raccomandata. Sono semplici funzioni JavaScript che accettano `props` come argomento e restituiscono JSX.

```jsx
function Welcome(props) {
  return <h1>Ciao, {props.name}</h1>;
}
```

### La rivoluzione: I Hooks
Con l'arrivo dei **Hooks**, i componenti funzionali hanno acquisito la capacità di gestire lo stato e gli effetti collaterali, rendendo le classi quasi del tutto superflue.
- `useState`: Sostituisce `this.state`.
- `useEffect`: Sostituisce i principali metodi del ciclo di vita.

---

## 3. Confronto Rapido

| Caratteristica | Componenti Funzionali | Componenti a Classe |
| :--- | :--- | :--- |
| **Sintassi** | Funzione JS (Semplice) | Classe ES6 (Complessa) |
| **Stato** | Gestito tramite `useState` | Gestito tramite `this.state` |
| **Ciclo di Vita** | Gestito tramite `useEffect` | Metodi predefiniti (`componentDid...`) |
| **Leggibilità** | Alta (Meno codice) | Bassa (Più boilerplate) |
| **Performance** | Generalmente migliori | Leggermente più pesanti |

---

## 4. Quando usare le classi?

Oggi non c'è quasi alcun motivo per scrivere nuovi componenti a classe. Tuttavia, potresti incontrarle in:
1. **Legacy Codebases:** Progetti scritti prima del 2019.
2. **Error Boundaries:** Al momento, la gestione degli errori globali nei componenti richiede ancora l'uso di un metodo della classe (`componentDidCatch`), sebbene esistano librerie esterne che risolvono il problema.

---
