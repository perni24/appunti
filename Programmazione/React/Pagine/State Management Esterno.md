---
date: 2026-04-22
tags: [react, state-management, zustand, redux-toolkit, frontend, javascript]
type: #permanent-note
status: budding
---

# State Management Esterno

Per **state management esterno** si intende l'uso di librerie dedicate per gestire stato condiviso fuori dal singolo componente React.

Queste soluzioni diventano utili quando lo stato applicativo:
- e usato in molte parti dell'app;
- ha logiche di aggiornamento complesse;
- richiede debugging piu rigoroso;
- deve restare prevedibile anche con molte interazioni concorrenti.

Tra le soluzioni piu comuni nell'ecosistema React ci sono **Zustand** e **Redux Toolkit**.

> [!INFO] Punto chiave
> Uno store esterno non sostituisce React: sposta fuori dai componenti la responsabilita di conservare e aggiornare parte dello stato globale.

---

## 1. Quando nasce il problema

Con [[useState]], [[useReducer]] e [[Context API]] si coprono molti casi reali. Il problema emerge quando:
- lo stesso dato serve a molti rami dell'albero;
- il prop drilling diventa pesante;
- il context provoca troppi re-render;
- la logica di aggiornamento e difficile da seguire;
- vuoi strumenti di debugging, tracciamento o time travel.

In questi casi uno store esterno puo migliorare organizzazione e manutenibilita.

---

## 2. Cosa gestisce uno store esterno

Tipicamente uno store esterno gestisce:
- utente autenticato;
- preferenze globali;
- carrello;
- stato UI condiviso tra piu pagine;
- cache locale di dati lato client;
- workflow multi-step o interazioni complesse.

Non tutto pero deve finire in uno store globale.

Regola pratica:
- **stato locale del componente**: resta in [[useState]];
- **logica locale ma articolata**: spesso va bene [[useReducer]];
- **dato condiviso semplice e poco frequente**: puo bastare [[Context API]];
- **stato condiviso complesso o molto dinamico**: valuta uno store esterno.

---

## 3. Zustand

**Zustand** e una libreria leggera che permette di creare store globali con API molto semplici.

Esempio concettuale:

```javascript
import { create } from "zustand";

const useCounterStore = create(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 }))
}));

function Counter() {
  const count = useCounterStore(state => state.count);
  const increment = useCounterStore(state => state.increment);

  return <button onClick={increment}>{count}</button>;
}
```

Punti forti di Zustand:
- API molto compatta;
- curva di apprendimento bassa;
- poco boilerplate;
- selezione fine delle slice di stato;
- buona ergonomia per app piccole e medie.

E spesso scelto quando si vuole evitare complessita strutturale non necessaria.

---

## 4. Redux Toolkit

**Redux Toolkit** e l'approccio moderno consigliato per usare Redux senza il vecchio eccesso di boilerplate.

Redux si basa su alcuni principi:
- store centrale;
- azioni esplicite;
- reducer puri;
- aggiornamenti prevedibili;
- flusso dei dati unidirezionale.

Esempio semplificato:

```javascript
import { createSlice, configureStore } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: state => {
      state.value += 1;
    },
    decrement: state => {
      state.value -= 1;
    }
  }
});

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer
  }
});
```

Redux Toolkit e utile quando servono:
- forte standardizzazione;
- prevedibilita rigorosa;
- middleware;
- integrazione strutturata con async flow;
- debugging avanzato con DevTools.

Rispetto a Zustand, impone piu struttura ma offre anche piu disciplina.

---

## 5. Zustand vs Redux Toolkit

| Caratteristica | Zustand | Redux Toolkit |
| :--- | :--- | :--- |
| **Boilerplate** | Molto basso | Medio |
| **Curva di apprendimento** | Rapida | Piu alta |
| **Struttura architetturale** | Flessibile | Piu rigorosa |
| **Debugging e standardizzazione** | Buoni, ma meno prescrittivi | Molto forti |
| **Adatto per** | App snelle o team che vogliono semplicita | App grandi o team che vogliono convenzioni forti |

La scelta dipende dal contesto, non da una gerarchia assoluta.

---

## 6. Stato globale non significa stato migliore

Uno degli errori piu comuni e spostare troppo stato fuori dai componenti.

Se uno stato riguarda solo un form, un modal o una piccola sezione della pagina, spesso e meglio tenerlo locale. Portarlo in uno store globale puo:
- aumentare accoppiamento;
- rendere il flusso meno chiaro;
- complicare test e refactor;
- introdurre dipendenze inutili.

Lo store globale va usato quando il dato e davvero condiviso o quando il valore architetturale supera il costo della complessita introdotta.

---

## 7. Relazione con Context API

[[Context API]] e uno strumento di propagazione del dato nell'albero React. Uno store esterno e invece un contenitore di stato separato dai componenti.

Differenza pratica:
- il context distribuisce un valore ai discendenti;
- lo store esterno centralizza stato e aggiornamenti in un livello dedicato.

Molte librerie di state management usano comunque il context internamente, ma l'API pubblica resta piu evoluta:
- selettori;
- middleware;
- DevTools;
- separazione migliore della logica.

Quindi il confronto corretto non e "uno elimina l'altro", ma "quale livello di struttura serve davvero".

---

## 8. Stato server vs stato client

Un altro errore frequente e usare lo store globale per dati che in realta sono **server state**:
- risultati di fetch;
- cache remota;
- sincronizzazione con API;
- retry;
- invalidazione.

Per questi scenari spesso e piu adatto uno strumento come TanStack Query che non e uno state manager generale, ma una libreria per data fetching e cache.

Conviene distinguere:
- **client state**: tema, sidebar aperta, wizard locale, preferenze utente;
- **server state**: dati ottenuti dal backend.

Confondere i due piani porta a store troppo carichi e difficili da mantenere.

---

## 9. Criteri pratici di scelta

### Usa solo React nativo quando
- lo stato e locale o moderatamente condiviso;
- `useState`, `useReducer` e context bastano;
- il team vuole massima semplicita.

### Valuta Zustand quando
- vuoi uno store globale semplice;
- vuoi evitare troppo boilerplate;
- il team preferisce un approccio pragmatico.

### Valuta Redux Toolkit quando
- l'app e grande;
- il team e numeroso;
- servono convenzioni forti e debugging strutturato;
- vuoi un modello piu rigoroso e prevedibile.

---

## 10. Best Practices

1. **Non introdurre uno store esterno troppo presto:** prima verifica se React nativo copre gia il problema.
2. **Tieni locale tutto cio che non e davvero condiviso:** globalizzare stato locale peggiora il design.
3. **Scegli la libreria in base al team e alla complessita reale:** non in base alla popolarita del momento.
4. **Distingui client state da server state:** non usare Redux o Zustand come sostituto automatico del data fetching specializzato.
5. **Mantieni le azioni e le transizioni leggibili:** lo store deve chiarire il flusso, non nasconderlo.
6. **Evita mega-store monolitici quando possibile:** meglio organizzare slice o domini chiari.

---
