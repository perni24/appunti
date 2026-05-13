---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, strict-mode, es5, debugging, best-practices]
aliases: [Modalita strict, use strict]
prerequisites: [Variabili, Funzioni]
related: [Moduli, Classi, Scope, Hoisting]
---

# Strict Mode

## Sintesi

Lo **Strict Mode** e una modalita piu rigorosa di JavaScript introdotta in ES5.

Serve a trasformare alcuni errori silenziosi in errori espliciti, impedire comportamenti ambigui e rendere il codice piu prevedibile.

I moduli ES e le classi sono gia automaticamente in strict mode.

---

## Quando usarlo

- In codice JavaScript non modulare.
- In codice legacy che vuoi rendere piu sicuro.
- Quando vuoi intercettare errori prima possibile.
- Quando vuoi evitare variabili globali accidentali.

Nel codice moderno basato su ES Modules, spesso non devi scriverlo manualmente.

---

## Attivazione per file

Per attivarlo in un intero file, inserisci la direttiva all'inizio.

```js
"use strict";

value = 10; // ReferenceError
```

La direttiva deve comparire prima di istruzioni reali.

```js
console.log("start");

"use strict"; // Troppo tardi: non attiva strict mode per il file
```

---

## Attivazione per funzione

Si puo attivare solo dentro una funzione.

```js
function run() {
  "use strict";

  value = 10; // ReferenceError
}
```

Questo era utile per migrare codice vecchio gradualmente.

---

## Moduli e classi

I moduli ES sono sempre strict.

```js
// file module.js
export const value = 1;
```

Anche il corpo delle classi e strict.

```js
class User {
  constructor(name) {
    this.name = name;
  }
}
```

Quindi, in codice moderno con `import` ed `export`, `"use strict"` e spesso ridondante.

---

## Variabili globali accidentali

Senza strict mode, assegnare a una variabile non dichiarata puo creare una proprieta globale.

```js
// Non strict
value = 10;
```

Con strict mode genera errore.

```js
"use strict";

value = 10; // ReferenceError
```

Questo evita bug difficili da tracciare.

---

## this nelle funzioni semplici

In non-strict mode, `this` in una funzione semplice puo puntare all'oggetto globale.

In strict mode, resta `undefined`.

```js
"use strict";

function showThis() {
  console.log(this);
}

showThis(); // undefined
```

Questo riduce comportamenti impliciti pericolosi.

---

## Errori non piu silenziosi

Strict mode rende espliciti alcuni errori.

```js
"use strict";

const user = {};

Object.defineProperty(user, "id", {
  value: 1,
  writable: false,
});

user.id = 2; // TypeError
```

Senza strict mode, alcune assegnazioni falliscono senza segnalare chiaramente il problema.

---

## Restrizioni sintattiche

Strict mode vieta alcune forme ambigue o legacy.

```js
"use strict";

// function sum(a, a) {
//   return a;
// }
```

Parametri duplicati e alcune parole riservate non sono permessi.

---

## Best practice

- Usa ES Modules quando possibile: sono strict di default.
- Usa `"use strict"` in script legacy non modulari.
- Non affidarti mai alla creazione implicita di globali.
- Preferisci errori espliciti a fallimenti silenziosi.
- Non aggiungere `"use strict"` a caso in bundle legacy concatenati senza test.

---

## Errori comuni

- Pensare che `"use strict"` serva dentro moduli ES.
- Mettere `"use strict"` dopo altre istruzioni e credere che funzioni.
- Confondere strict mode con un sistema di tipi.
- Aspettarsi che strict mode impedisca tutti i bug.

---

## Checklist

- Il file e un modulo ES? Allora e gia strict.
- Sto lavorando su script legacy? Aggiungere `"use strict"` puo aiutare.
- Il codice dipende da variabili globali implicite?
- Ho testato eventuali script concatenati?

---

## Collegamenti

- [[Moduli]]
- [[Classi]]
- [[Scope]]
- [[Hoisting]]
- [[Variabili]]
