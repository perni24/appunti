---
date: 2026-02-17
tags: [javascript, es6, funzioni, parametri, default-values]
type: #permanent-note
status: budding
---

# Default Parameters

I **Default Parameters** (parametri predefiniti), introdotti in **ES6**, permettono di inizializzare i parametri formali di una funzione con valori predefiniti nel caso in cui non venga passato alcun valore o venga passato `undefined`.

## Sintassi

Prima di ES6, per gestire i valori di default era necessario scrivere logica manuale all'interno della funzione.

```javascript
// Old way (pre-ES6)
function greet(name) {
  name = name || "Ospite";
  console.log("Ciao " + name);
}

// Modern way (ES6+)
function greet(name = "Ospite") {
  console.log(`Ciao ${name}`); // Default value is used if name is missing
}
```

## Comportamento con `undefined` vs `null`

È fondamentale capire che il valore di default viene applicato **solo** se l'argomento è `undefined`. Se viene passato `null`, JavaScript lo considera un valore valido e non applicherà il default.

```javascript
function test(val = "Default") {
  console.log(val);
}

test();          // "Default"
test(undefined); // "Default"
test(null);      // null 
```

## Espressioni come Valori di Default

I valori predefiniti non devono essere necessariamente costanti; possono essere il risultato di espressioni o chiamate ad altre funzioni, valutate al momento dell'invocazione.

```javascript
const getDefaultAge = () => 18;

function registerUser(name, age = getDefaultAge()) {
  console.log(`${name} ha ${age} anni.`);
}

registerUser("Luca"); // "Luca ha 18 anni."
```

Inoltre, i parametri definiti a sinistra possono essere usati come default per i parametri successivi:
```javascript
function area(width, height = width) {
  return width * height; // height defaults to width if not provided
}
console.log(area(10)); // 100 (Square)
```

## Perché Utilizzarli

- **Codice più Pulito**: Elimina la necessità di controlli condizionali multipli all'inizio della funzione.
- **Auto-documentazione**: La firma della funzione dichiara esplicitamente quali sono i valori attesi e quelli opzionali.
- **Robustezza**: Previene errori logici derivanti da parametri dimenticati o mancanti.

