---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
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

## Quando usarlo

Usa JSON quando devi scambiare dati strutturati tra sistemi o serializzare dati semplici in formato testuale.

Casi comuni:

- richieste e risposte API;
- file di configurazione senza commenti;
- storage browser;
- log strutturati;
- payload tra frontend e backend;
- dati compatibili tra linguaggi diversi.

Non usarlo per dati con funzioni, riferimenti circolari, tipi complessi o commenti.

## Come funziona

### Regole del formato
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
### JSON.stringify
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
### JSON.parse
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
### Invio con fetch
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
### Replacer e space
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
### Reviver
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
### Deep clone con JSON
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

## API / Sintassi

API JavaScript principali:

```js
JSON.stringify(value);
JSON.stringify(value, replacer, space);
JSON.parse(text);
JSON.parse(text, reviver);
```

Esempio:

```js
const text = JSON.stringify({ ok: true }, null, 2);
const data = JSON.parse(text);
```

Con `fetch`:

```js
const response = await fetch("/api/data");
const data = await response.json();
```

Per inviare JSON:

```js
await fetch("/api/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

## Esempio pratico

Parsing sicuro di una stringa JSON:

```js
function parseJsonSafe(text) {
  try {
    return {
      ok: true,
      value: JSON.parse(text),
    };
  } catch (error) {
    return {
      ok: false,
      error,
    };
  }
}
```

Questo pattern evita che un input non valido interrompa il flusso normale senza controllo.

## Varianti

- **JSON compatto**: senza spazi, adatto a rete e storage.
- **JSON pretty printed**: indentato, piu leggibile per file e debug.
- **NDJSON**: un oggetto JSON per riga, utile per log e stream.
- **JSON con reviver/replacer**: trasforma valori durante parse/stringify.
- **JSON-safe data**: dati composti solo da tipi supportati dal formato.

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
