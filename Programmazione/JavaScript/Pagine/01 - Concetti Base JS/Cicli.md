# Cicli in JavaScript

I cicli permettono di ripetere un blocco di codice più volte, fino a quando una condizione specificata non viene più soddisfatta.

## `for`

Il ciclo `for` è il più comune e versatile. È composto da tre parti: inizializzazione, condizione e incremento/decremento.

```javascript
for (let i = 0; i < 5; i++) {
  console.log("Valore di i: " + i);
}
// Output:
// Valore di i: 0
// Valore di i: 1
// Valore di i: 2
// Valore di i: 3
// Valore di i: 4
```

### `for...in`

Il ciclo `for...in` itera sulle proprietà enumerabili di un oggetto.

```javascript
const persona = {
  nome: "Mario",
  età: 30,
  città: "Roma"
};

for (let chiave in persona) {
  console.log(chiave + ": " + persona[chiave]);
}
// Output:
// nome: Mario
// età: 30
// città: Roma
```

### `for...of`

Il ciclo `for...of` itera sui valori di oggetti iterabili (come Array, Stringhe, Map, Set, ecc.).

```javascript
const numeri = [10, 20, 30];

for (let numero of numeri) {
  console.log("Numero: " + numero);
}
// Output:
// Numero: 10
// Numero: 20
// Numero: 30

const testo = "Ciao";
for (let carattere of testo) {
  console.log("Carattere: " + carattere);
}
// Output:
// Carattere: C
// Carattere: i
// Carattere: a
// Carattere: o
```

## `while`

Il ciclo `while` esegue un blocco di codice finché la condizione specificata è vera. La condizione viene valutata prima di ogni iterazione.

```javascript
let contatore = 0;

while (contatore < 3) {
  console.log("Contatore: " + contatore);
  contatore++;
}
// Output:
// Contatore: 0
// Contatore: 1
// Contatore: 2
```

## `do...while`

Il ciclo `do...while` è simile al `while`, ma garantisce che il blocco di codice venga eseguito almeno una volta, perché la condizione viene valutata dopo l'esecuzione del blocco.

```javascript
let i = 0;

do {
  console.log("Il ciclo do...while è stato eseguito almeno una volta. i = " + i);
  i++;
} while (i < 0);
// Output:
// Il ciclo do...while è stato eseguito almeno una volta. i = 0
```

## `break` e `continue`

- **`break`**: Termina immediatamente il ciclo corrente e riprende l'esecuzione del codice dopo il ciclo.
- **`continue`**: Termina l'iterazione corrente del ciclo e passa all'iterazione successiva.

```javascript
for (let i = 0; i < 10; i++) {
  if (i === 3) {
    continue; // Salta l'iterazione quando i è 3
  }
  if (i === 7) {
    break; // Termina il ciclo quando i è 7
  }
  console.log(i);
}
// Output:
// 0
// 1
// 2
// 4
// 5
// 6
```
