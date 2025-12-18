# Condizionali in JavaScript

I condizionali permettono di eseguire blocchi di codice diversi in base al fatto che una condizione sia vera o falsa.

## `if`, `else if`, `else`

La struttura `if` è la più comune per gestire i condizionali.

```javascript
let età = 18;

if (età >= 18) {
  console.log("Sei maggiorenne.");
} else if (età >= 13) {
  console.log("Sei un adolescente.");
} else {
  console.log("Sei minorenne.");
}
```

## `switch`

L'istruzione `switch` viene utilizzata per eseguire azioni diverse in base a diversi valori di una singola variabile.

```javascript
let giornoDellaSettimana = "Lunedì";

switch (giornoDellaSettimana) {
  case "Lunedì":
    console.log("Inizio settimana lavorativa.");
    break;
  case "Venerdì":
    console.log("Quasi weekend!");
    break;
  case "Sabato":
  case "Domenica":
    console.log("Weekend!");
    break;
  default:
    console.log("Giorno normale.");
}
```

## Operatore Condizionale (Ternario)

L'operatore ternario `? :` è una scorciatoia per un'istruzione `if...else` ed è spesso usato per assegnazioni condizionali.

```javascript
let isMaggiorenne = (età >= 18) ? "Sì" : "No";
console.log("È maggiorenne? " + isMaggiorenne);
```

## Valori Truthy e Falsy

In JavaScript, non solo i valori booleani `true` e `false` vengono interpretati come tali nelle condizioni. Esistono valori "truthy" e "falsy":

### Valori Falsy:
* `false`
* `0` (numero zero)
* `""` (stringa vuota)
* `null`
* `undefined`
* `NaN`

### Valori Truthy:
Tutti gli altri valori, inclusi:
* `true`
* `[]` (array vuoto)
* `{}` (oggetto vuoto)
* `"0"` (stringa "0")
* `"false"` (stringa "false")
* Qualsiasi numero diverso da zero

```javascript
let nome = "";

if (nome) {
  console.log("Il nome è definito.");
} else {
  console.log("Il nome è vuoto o non definito."); // Questo verrà stampato
}

let numeri = [];
if (numeri) {
  console.log("L'array numeri è truthy."); // Questo verrà stampato
}
```
