---
date: 2026-04-17
tags: [react, virtual-dom, rendering, internals, frontend, javascript]
type: #permanent-note
status: budding
---

# Virtual DOM

Il **Virtual DOM** e una rappresentazione leggera in memoria dell'interfaccia utente. React lo usa per confrontare lo stato precedente e quello successivo della UI e decidere quali modifiche applicare davvero al DOM reale.

L'idea centrale non e "evitare sempre il DOM", ma **minimizzare e orchestrare meglio gli aggiornamenti necessari**.

> [!INFO] Punto chiave
> Il Virtual DOM non e una copia completa e magica del browser. E una struttura dati che permette a React di ragionare in modo efficiente su cosa e cambiato nell'interfaccia.

---

## 1. Il problema che risolve

Aggiornare direttamente il DOM a mano puo diventare costoso e difficile da gestire quando l'interfaccia cresce:
- bisogna capire cosa e cambiato;
- aggiornare i nodi corretti;
- evitare modifiche inutili;
- mantenere il codice coerente con lo stato applicativo.

React risolve questo problema in due fasi:

1. descrivi la UI come funzione di `props` e `state`;
2. React calcola come aggiornare il DOM reale nel modo piu coerente possibile.

Questo rende l'approccio dichiarativo molto piu praticabile.

---

## 2. Come funziona a grandi linee

Ogni render produce una nuova rappresentazione virtuale dell'interfaccia.

React poi confronta:
- il precedente albero virtuale;
- il nuovo albero virtuale.

Da questo confronto decide quali modifiche fare nel DOM reale.

Flusso semplificato:

1. cambia `state` o `props`;
2. il componente viene rieseguito;
3. React genera un nuovo albero virtuale;
4. React confronta vecchio e nuovo albero;
5. applica al DOM reale solo gli aggiornamenti necessari.

Questo processo e noto come **riconciliazione**.

---

## 3. Esempio concettuale

Componente:

```jsx
function Counter({ count }) {
  return <h1>Count: {count}</h1>;
}
```

Se `count` passa da `1` a `2`, React non distrugge tutta la pagina. Confronta la rappresentazione precedente con quella nuova e aggiorna solo il testo che cambia.

Concettualmente:

```jsx
// prima
<h1>Count: 1</h1>

// dopo
<h1>Count: 2</h1>
```

Il tag `h1` resta lo stesso; cambia solo il contenuto testuale.

---

## 4. Riconciliazione e diffing

Il Virtual DOM da solo non basta. Il punto cruciale e l'algoritmo con cui React confronta due alberi virtuali.

React usa euristiche pratiche per rendere il confronto efficiente:
- se il tipo dell'elemento cambia, spesso ricrea quel ramo;
- se il tipo resta uguale, prova ad aggiornare solo le parti mutate;
- nelle liste usa le `key` per capire identita e ordine degli elementi.

Questo si collega direttamente a [[Rendering Condizionale e Liste]].

### Esempio con lista

```jsx
items.map(item => <li key={item.id}>{item.name}</li>)
```

Le `key` aiutano React a capire:
- quale elemento e stato aggiunto;
- quale e stato rimosso;
- quale e stato spostato.

Senza chiavi corrette, React puo fare aggiornamenti meno efficienti o persino sbagliare il mapping dello stato locale.

---

## 5. Virtual DOM vs DOM reale

| Concetto | Ruolo |
| :--- | :--- |
| **DOM reale** | struttura effettiva gestita dal browser |
| **Virtual DOM** | rappresentazione in memoria usata da React |

Il DOM reale:
- e quello che il browser disegna;
- ha costi di manipolazione concreti;
- e collegato a layout, paint e reflow.

Il Virtual DOM:
- vive nel runtime React;
- e piu leggero da confrontare;
- guida gli aggiornamenti del DOM reale.

Quindi il Virtual DOM non sostituisce il browser: aiuta React a decidere come interagire con esso.

---

## 6. Perche non significa "nessun re-render"

Un malinteso comune e pensare che il Virtual DOM elimini il costo del rendering. Non e cosi.

Quando cambia lo stato:
- il componente React puo comunque rieseguire il render;
- React deve comunque produrre il nuovo albero virtuale;
- poi deve confrontarlo con il precedente.

Il vantaggio e che gli aggiornamenti sul DOM reale vengono gestiti in modo piu mirato, non che il lavoro scompaia.

> [!WARNING] Errore comune
> "React usa il Virtual DOM, quindi i render non costano". Falso. I render costano comunque; il Virtual DOM rende il processo piu gestibile ed efficiente, ma non gratuito.

---

## 7. Relazione con performance e profiling

Il Virtual DOM spiega **come** React aggiorna la UI, ma non garantisce automaticamente prestazioni ottimali.

Se un'app e lenta, i motivi possono essere:
- troppi render;
- componenti pesanti;
- liste grandi;
- props instabili;
- memoization inefficace;
- struttura dello stato sbagliata.

Per questo, quando sorgono problemi reali di performance, bisogna guardare strumenti come [[Profiler e Debugging]] e non fermarsi alla teoria del Virtual DOM.

---

## 8. Limiti del concetto

Il Virtual DOM e utile, ma non va idealizzato.

### Vantaggi
- semplifica l'approccio dichiarativo;
- rende piu prevedibili gli aggiornamenti UI;
- permette ottimizzazioni pratiche via riconciliazione.

### Limiti
- introduce comunque lavoro computazionale;
- non risolve automaticamente problemi architetturali;
- non evita tutti i re-render inutili;
- non sostituisce una buona gestione di stato, `key` corrette o ottimizzazioni mirate.

### Rischio comune
Usare "c'e il Virtual DOM" come spiegazione generica di qualunque performance issue porta fuori strada. Il Virtual DOM e solo una parte del modello di rendering React.

---

## 9. Best Practices

1. **Pensa in termini dichiarativi:** descrivi la UI come funzione di stato e props.
2. **Usa `key` stabili nelle liste:** aiutano React a riconciliare correttamente gli elementi.
3. **Non assumere che il Virtual DOM risolva tutto:** profiling e architettura restano fondamentali.
4. **Riduci re-render inutili alla fonte:** stato troppo alto, props instabili e liste pesanti restano problemi reali.
5. **Usa il Virtual DOM come modello mentale, non come slogan:** e utile per capire React, ma non basta per diagnosticare ogni problema concreto.

---
