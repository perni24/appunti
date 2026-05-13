---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, json, data-format, parse, stringify]
aliases: [JavaScript Object Notation]
prerequisites: [Tipi di Dati, Oggetti Avanzati]
related: [Fetch API, Browser Storage, Immutabilita e Copia degli Oggetti]
---

# JSON

## Sintesi

JSON significa **JavaScript Object Notation**.

E un formato testuale leggero per scambiare dati tra sistemi. Deriva dalla sintassi degli oggetti JavaScript, ma ha regole piu rigide ed e indipendente dal linguaggio.

---

## Regole del formato

JSON supporta:

- stringhe;
- numeri;
- booleani;
- `null`;
- array;
- oggetti.

```json
{
  "name": "Luca",
  "age": 30,
  "active": true,
  "roles": ["admin", "editor"],
  "profile": null
}
```

Regole importanti:

- le chiavi devono essere tra virgolette doppie;
- le stringhe usano virgolette doppie;
- non sono ammessi commenti;
- non sono ammesse trailing comma;
- non sono supportati `undefined`, funzioni, `Symbol`, `Map`, `Set`.

---

## JSON.stringify

`JSON.stringify()` converte un valore JavaScript in stringa JSON.

```js
const user = {
  name: "Luca",
  active: true,
};

const json = JSON.stringify(user);

console.log(json); // {"name":"Luca","active":true}
```

---

## JSON.parse

`JSON.parse()` converte una stringa JSON in valore JavaScript.

```js
const json = '{"name":"Luca","active":true}';
const user = JSON.parse(json);

console.log(user.name); // "Luca"
```

Se la stringa non e JSON valido, genera errore.

```js
try {
  JSON.parse("{invalid}");
} catch (error) {
  console.error("JSON non valido");
}
```

---

## Invio con fetch

```js
await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Luca",
  }),
});
```

Ricezione:

```js
const response = await fetch("/api/users/1");
const user = await response.json();
```

---

## Replacer e space

`JSON.stringify()` accetta un replacer e un numero di spazi.

```js
const user = {
  name: "Luca",
  password: "secret",
};

const json = JSON.stringify(
  user,
  (key, value) => key === "password" ? undefined : value,
  2
);
```

---

## Reviver

`JSON.parse()` puo ricevere un reviver.

```js
const json = '{"createdAt":"2026-05-13T10:00:00.000Z"}';

const data = JSON.parse(json, (key, value) => {
  if (key === "createdAt") {
    return new Date(value);
  }

  return value;
});
```

---

## Deep clone con JSON

```js
const original = {
  user: {
    name: "Luca",
  },
};

const clone = JSON.parse(JSON.stringify(original));
```

Funziona solo per dati JSON-safe.

Perde:

- `Date`;
- `Map`;
- `Set`;
- `undefined`;
- funzioni;
- `Symbol`;
- prototipi;
- riferimenti circolari.

Per copie profonde moderne, valuta `structuredClone()`.

---

## Errori comuni

- Scrivere JSON con apici singoli.
- Aggiungere trailing comma.
- Pensare che JSON supporti commenti.
- Usare JSON clone su oggetti con `Date`, `Map`, funzioni o cicli.
- Non gestire errori di `JSON.parse()`.

---

## Checklist

- La stringa e JSON valido?
- Ho gestito errori di parsing?
- I dati contengono tipi non serializzabili?
- Sto inviando `Content-Type: application/json`?
- Serve leggibilita con indentazione?

---

## Collegamenti

- [[Fetch API]]
- [[Tipi di Dati]]
- [[Oggetti Avanzati]]
- [[Browser Storage]]
- [[Immutabilita e Copia degli Oggetti]]
