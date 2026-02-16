---
date: 2026-02-16
tags:
  - javascript
  - programming
  - basics
type: permanent-note
status: budding
---

# Operatori in JavaScript

Gli **operatori** sono simboli che permettono di eseguire operazioni su operandi (valori o variabili). In JavaScript, si dividono in diverse categorie in base alla loro funzione.

## 1. Operatori Aritmetici
Eseguono calcoli matematici.

| Operatore | Descrizione | Esempio (`x=10`, `y=5`) |
| :--- | :--- | :--- |
| `+` | Addizione | `x + y` -> `15` |
| `-` | Sottrazione | `x - y` -> `5` |
| `*` | Moltiplicazione | `x * y` -> `50` |
| `/` | Divisione | `x / y` -> `2` |
| `%` | Modulo (Resto) | `x % 3` -> `1` |
| `**` | Esponente (ES6) | `y ** 2` -> `25` |
| `++` | Incremento | `x++` (post) o `++x` (pre) |
| `--` | Decremento | `x--` (post) o `--x` (pre) |

> [!TIP] L'operatore `+`
> L'operatore `+` serve anche per la **concatenazione** di stringhe: `"Ciao " + "Mondo"` -> `"Ciao Mondo"`. Attenzione alla conversione di tipo implicita se sommi numeri e stringhe!

## 2. Operatori di Assegnazione
Assegnano un valore all'operando di sinistra basandosi sul valore dell'operando di destra.

- `=`: Assegnazione semplice (`x = y`)
- `+=`: Addizione e assegnazione (`x += y` equivale a `x = x + y`)
- `-=`, `*=`, `/=`: Analoghi per le altre operazioni.

## 3. Operatori di Confronto
Confrontano due valori e restituiscono un **Boolean** (`true` o `false`).

> [!IMPORTANT] Uguaglianza Debole vs Stretta
> - `==` (Debole): Converte i tipi prima di confrontare (`5 == "5" // true`)
> - `===` (Stretta): Confronta sia il valore che il tipo (`5 === "5" // false`)
>
> **Best Practice:** Usa sempre `===` per evitare bug dovuti a conversioni impreviste.

| Operatore | Descrizione |
| :--- | :--- |
| `==` / `!=` | Uguale / Diverso (con conversione tipo) |
| `===` / `!==` | Uguale / Diverso (stretto) |
| `>` / `>=` | Maggiore / Maggiore o uguale |
| `<` / `<=` | Minore / Minore o uguale |

## 4. Operatori Logici
Usati spesso con valori booleani per la logica condizionale.

- `&&` (**AND**): `true` se *entrambi* gli operandi sono true.
- `||` (**OR**): `true` se *almeno uno* degli operandi è true.
- `!` (**NOT**): Inverte il valore booleano (`!true` -> `false`).

```javascript
const maggiorenne = true;
const haPatente = false;

if (maggiorenne && haPatente) {
  console.log("Puoi guidare");
} else {
  console.log("Non puoi guidare");
}
```

## 5. Operatore Ternario
Unico operatore che prende 3 operandi. È una scorciatoia per l'`if...else`.

**Sintassi:** `condizione ? exprSeVera : exprSeFalsa`

```javascript
let età = 20;
let stato = (età >= 18) ? "Adulto" : "Minorenne";
```

## 6. Operatore `typeof`
Restituisce una stringa che indica il tipo dell'operando.

```javascript
typeof "Luca" // "string"
typeof 42     // "number"
```