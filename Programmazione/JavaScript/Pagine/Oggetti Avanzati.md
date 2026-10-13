---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - objects
  - object-methods
  - es6
aliases:
  - Oggetti JS
  - Object methods
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Property Descriptors]]"
  - "[[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti]]"
  - "[[Programmazione/JavaScript/Pagine/Prototypes]]"
title: Oggetti Avanzati
---

# Oggetti Avanzati

## Sintesi

Gli oggetti sono una delle strutture fondamentali di JavaScript.

Oltre alla sintassi base, JavaScript offre shorthand, computed properties, metodi statici di `Object`, descriptor, copia, freezing e integrazione con prototipi.

---

## Quando usarlo

Usa oggetti quando devi rappresentare entita, record, configurazioni o strutture con proprieta nominate.

Approfondisci gli oggetti avanzati quando:

- devi copiare o trasformare record;
- vuoi iterare chiavi e valori;
- usi proprieta calcolate;
- lavori con descriptor o prototipi;
- devi distinguere oggetti semplici, `Map` e classi;
- devi evitare mutazioni indesiderate.

## Come funziona

### Object literal
```js
const user = {
  name: "Luca",
  role: "admin",
};
```

Un oggetto e una collezione di coppie chiave-valore.

Le chiavi sono stringhe o simboli. Un numero usato come chiave diventa una stringa: `record[1]` e `record["1"]` indicano la stessa proprieta, diversamente dalle chiavi di una `Map`.

---
### Property shorthand
Se variabile e proprieta hanno lo stesso nome, puoi abbreviare.

```js
const name = "Luca";
const role = "admin";

const user = {
  name,
  role,
};
```

---
### Method shorthand
```js
const calculator = {
  sum(a, b) {
    return a + b;
  },
};
```

La forma seguente e valida, ma piu verbosa; non e un errore:

```js
const calculator = {
  sum: function (a, b) {
    return a + b;
  },
};
```

---
### Computed property names
Puoi calcolare il nome di una proprieta.

```js
const field = "email";

const user = {
  [field]: "luca@example.com",
};

console.log(user.email);
```

---
### Object.keys, values, entries
```js
const user = {
  name: "Luca",
  role: "admin",
};

console.log(Object.keys(user));    // ["name", "role"]
console.log(Object.values(user));  // ["Luca", "admin"]
console.log(Object.entries(user)); // [["name", "Luca"], ["role", "admin"]]
```

`Object.entries()` e utile per trasformare oggetti in array.

`keys`, `values` ed `entries` includono solo proprieta proprie, enumerabili e con chiave stringa. Escludono simboli e proprieta ereditate; `values` ed `entries` possono eseguire getter.

| API | Proprieta considerate |
| --- | --- |
| `Object.keys/values/entries` | Proprie, enumerabili, stringhe |
| `Object.getOwnPropertyNames` | Proprie, anche non enumerabili, stringhe |
| `Object.getOwnPropertySymbols` | Proprie, simboli |
| `Reflect.ownKeys` | Tutte le proprie, stringhe e simboli |
| `for...in` | Enumerabili con chiave stringa, anche ereditate |

Le chiavi che rappresentano indici di array (da `0` a `2^32 - 2`) vengono elencate in ordine numerico prima delle altre stringhe. Un oggetto non e quindi un sostituto di `Map` se serve l'ordine di inserimento di chiavi arbitrarie.

```js
for (const [key, value] of Object.entries(user)) {
  console.log(key, value);
}
```

---
### Object.fromEntries
`Object.fromEntries()` trasforma coppie `[key, value]` in oggetto.

```js
const entries = [
  ["name", "Luca"],
  ["role", "admin"],
];

const user = Object.fromEntries(entries);
```

Chiavi ripetute si sovrascrivono: rimane l'ultimo valore. Le chiavi non simboliche vengono convertite in stringhe; non e una conversione senza perdita da una `Map` con chiavi arbitrarie.

---
### Object.assign e spread
`Object.assign()` copia proprieta proprie enumerabili, stringhe e simboli, dentro il primo argomento. Modifica e restituisce quel target; `{}` serve a crearne uno nuovo.

```js
const user = Object.assign({}, { role: "reader" }, { name: "Luca" });
```

Nel codice moderno spesso si usa lo spread.

```js
const user = {
  ...baseUser,
  name: "Luca",
};
```

Entrambi fanno una copia superficiale.

Entrambi leggono i getter sorgente. `Object.assign()` puo chiamare setter sul target, mentre lo spread crea proprieta dati nel nuovo oggetto. Nessuno dei due preserva automaticamente descriptor o prototipi della sorgente.

---
### Object.hasOwn
`Object.hasOwn()` verifica se una proprieta appartiene direttamente all'oggetto.

```js
const user = {
  name: "Luca",
};

console.log(Object.hasOwn(user, "name")); // true
```

E piu sicuro di chiamare direttamente `hasOwnProperty()` sull'oggetto.

Funziona anche con un oggetto senza prototipo o con una proprieta chiamata `hasOwnProperty`. Il controllo e distinto da `in`, che include il prototipo, e da una lettura del valore:

```js
const record = Object.create({ inherited: 1 });
record.present = undefined;
console.log(Object.hasOwn(record, "inherited")); // false
console.log("inherited" in record); // true
console.log(Object.hasOwn(record, "present")); // true, anche se vale undefined
```

### freeze e seal

`Object.freeze()` impedisce aggiunte, rimozioni e riassegnazioni delle proprieta dati dell'oggetto, ma e superficiale:

```js
const settings = Object.freeze({ theme: "light", nested: { enabled: true } });
settings.nested.enabled = false;
console.log(settings.nested.enabled); // false: oggetto annidato ancora modificabile
// settings.theme = "dark"; // TypeError in strict mode; altrimenti puo fallire silenziosamente
```

`Object.seal()` impedisce aggiunte e rimozioni, ma lascia modificabili i valori delle proprieta writable. Nessuno dei due e una validazione o una protezione di segreti. Per i dettagli dei descriptor, vedi [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]].

---
### this nei metodi
Nei metodi normali, `this` dipende da come viene chiamata la funzione.

```js
const user = {
  name: "Luca",
  greet() {
    return `Ciao ${this.name}`;
  },
};
```

Evita arrow function per metodi che devono usare `this`.

---
### Copia superficiale
Spread e `Object.assign()` fanno copie superficiali.

```js
const original = {
  profile: {
    name: "Luca",
  },
};

const copy = {
  ...original,
};

copy.profile.name = "Marco";

console.log(original.profile.name); // "Marco"
```

Per copie profonde, vedi [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]].

---

## API / Sintassi

Creazione:

```js
const user = { name: "Luca", role: "admin" };
```

Accesso:

```js
user.name;
user["role"];
```

Metodi `Object` comuni:

```js
Object.keys(user);
Object.values(user);
Object.entries(user);
Object.fromEntries(entries);
Object.assign({}, source);
Object.hasOwn(user, "name");
Object.freeze(user);
```

Copia superficiale:

```js
const nextUser = { ...user, active: true };
```

## Esempio pratico

Rimuovere da un record dati i campi con valore `null`, `undefined` o stringa vuota:

```js
function removeEmptyFields(object) {
  if (object === null || typeof object !== "object" || Array.isArray(object)) {
    throw new TypeError("Serve un record dati, non null o un array");
  }
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      return value !== null && value !== undefined && value !== "";
    }),
  );
}

const cleanUser = removeEmptyFields({
  name: "Luca",
  email: "",
  role: "admin",
});
```

`Object.entries` trasforma l'oggetto in coppie, `filter` rimuove i campi vuoti e `Object.fromEntries` ricostruisce l'oggetto.

Il contratto e superficiale: conserva `0`, `false`, spazi, array vuoti e oggetti annidati, dei quali non crea copie profonde. Esclude simboli e campi non enumerabili e non preserva una classe personalizzata. Non e un sanitizzatore: non elimina segreti o nomi di campo pericolosi per elaborazioni successive. Per un output pubblico scegli i campi ammessi; per chiavi dinamiche usa `Map` o un dizionario senza prototipo.

## Varianti

- **Object literal**: record semplice.
- **Oggetto con metodi**: comportamento legato ai dati.
- **Oggetto come dizionario**: possibile, ma `Map` puo essere piu esplicita.
- **Oggetto frozen**: impedisce modifiche superficiali.
- **Oggetto con descriptor**: controlla writable, enumerable e configurable.
- **Oggetto con prototipo**: eredita comportamento tramite prototype chain.

## Errori comuni

- Pensare che spread faccia deep copy.
- Usare arrow function come metodo con `this`.
- Iterare oggetti come se fossero array.
- Confondere oggetto semplice e `Map` per chiavi dinamiche complesse.
- Aspettarsi che `Object.assign()` preservi descriptor e prototipo.

---

## Checklist

- Serve un oggetto semplice o una `Map`?
- Sto copiando in modo superficiale o profondo?
- Sto usando `this` correttamente?
- Devo preservare descriptor o prototipo?
- I nomi delle proprieta sono chiari?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]
- [[Programmazione/JavaScript/Pagine/Map e Set|Map e Set]]
- [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes]]
- [[Programmazione/JavaScript/Pagine/Context|Context]]


## Fonti

- [MDN - Proprieta proprie ed enumerabilita](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties)
- [MDN - Lavorare con gli oggetti](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects)
- [MDN - Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
- [MDN - Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
