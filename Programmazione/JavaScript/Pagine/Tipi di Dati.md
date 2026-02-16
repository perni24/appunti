---
date: 2026-02-16
tags:
  - javascript
  - programming
  - basics
type: permanent-note
status: budding
---

# 🧱 Tipi di Dati e Primitivi in JavaScript

In JavaScript, ogni valore appartiene a un determinato **tipo di dato**. Essendo un linguaggio a tipizzazione dinamica, non è necessario specificare il tipo durante la dichiarazione, ma è fondamentale conoscere come i dati vengono gestiti in memoria.

Esistono due macro-categorie: **Primitivi** e **Oggetti**.

## 1. Tipi Primitivi (Immutabili)

Un valore **primitivo** è un dato semplice (non un oggetto) che non ha proprietà o metodi permanenti.
La caratteristica fondamentale è l'**immutabilità**: una volta creato un valore primitivo, questo non può essere modificato nella sua struttura interna. Puoi solo **sostituirlo** con un valore completamente nuovo.

> [!INFO] Il concetto di Wrapper Objects
> Se i primitivi non sono oggetti, come mai possiamo scrivere `"ciao".toUpperCase()`?
> JavaScript avvolge temporaneamente il primitivo in un **Oggetto Wrapper** (es. `new String("ciao")`), esegue il metodo, e poi butta via l'oggetto.
>
> Questo spiega perché **non** puoi aggiungere proprietà a un primitivo:
> ```javascript
> let str = "ciao";
> str.customProp = 10; // Sembra funzionare...
> console.log(str.customProp); // undefined! (L'oggetto wrapper è stato distrutto subito dopo l'assegnazione)
> ```

### String
Sequenza di caratteri per rappresentare testo. Si possono usare `''`, `""` o i backtick `` ` ` `` per i Template Literal.
```javascript
const nome = "Luca";
const saluto = `Ciao, ${nome}!`; // Template Literal
```

### Number
Rappresenta sia interi che decimali (standard IEEE 754 a 64 bit). Include valori speciali:
- `Infinity`: Risultato di divisioni per zero.
- `NaN` (Not a Number): Risultato di operazioni matematiche non valide (es. `"ciao" * 2`).
```javascript
const intero = 42;
const decimale = 3.14;
```

### Boolean
Rappresenta un valore logico: `true` o `false`. Fondamentale per il controllo di flusso (`if`, `while`).

### Null
Rappresenta l'**assenza intenzionale** di un valore. È assegnato esplicitamente dal programmatore per indicare "vuoto".
> [!NOTE] Bug storico
> `typeof null` restituisce `"object"`. È un bug noto di JS che non può essere corretto per retro-compatibilità.

### Undefined
Rappresenta un valore **non assegnato**. Una variabile dichiarata ma non inizializzata vale `undefined`.
```javascript
let x; 
console.log(x); // undefined
```

### Symbol (ES6)
Crea un valore **unico** e immutabile, spesso usato come chiave univoca per proprietà di oggetti per evitare collisioni.
```javascript
const id = Symbol('id');
```

### BigInt (ES2020)
Permette di rappresentare interi arbitrariamente grandi, oltre il limite di `Number.MAX_SAFE_INTEGER` ($2^{53} - 1$).
```javascript
const bigNumber = 9007199254740991n;
```

## 2. Oggetti (Mutabili)

Tutto ciò che non è primitivo è un **Oggetto**. Gli oggetti sono collezioni di coppie chiave-valore e sono **mutabili** e passati per **riferimento**.
Includono:
- **Object Literal**: `{ key: value }`
- **Array**: `[1, 2, 3]`
- **Function**
- **Date**, **RegExp**, etc.

## Operatore `typeof`

Per verificare il tipo di un valore, si usa l'operatore `typeof`:
```javascript
typeof "test"   // "string"
typeof 42       // "number"
typeof true     // "boolean"
typeof undefined // "undefined"
typeof null     // "object" (attenzione!)
typeof []       // "object"
typeof {}       // "object"
```