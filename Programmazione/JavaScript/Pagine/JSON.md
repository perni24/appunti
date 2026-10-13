---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - json
  - data-format
  - parse
  - stringify
aliases:
  - JavaScript Object Notation
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
  - "[[Programmazione/JavaScript/Pagine/Oggetti Avanzati]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Browser Storage]]"
  - "[[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti]]"
title: JSON
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

Non rappresenta direttamente funzioni, riferimenti circolari, tipi complessi o commenti. Per tipi applicativi particolari serve un formato di conversione esplicito, condiviso da chi scrive e chi legge.

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

Il valore principale non deve necessariamente essere un oggetto: `null`, `42`, `true`, `"testo"` e `[]` sono documenti JSON validi. I token numerici `NaN` e `Infinity` non sono ammessi; per interi oltre la precisione di `Number`, come alcuni identificatori, concorda una rappresentazione in stringa.

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

### Valori trasformati, omessi o non serializzabili

Il comportamento predefinito non e sempre una conversione senza perdita:

| Valore JavaScript | Risultato di stringify |
| --- | --- |
| `undefined`, funzione o simbolo in una proprieta | Proprieta omessa |
| Gli stessi valori in un array, oppure un buco | `null` |
| Gli stessi valori al livello principale | `undefined`, non una stringa JSON |
| `NaN`, `Infinity`, `-Infinity` | `null` |
| `Date` valida | Stringa ISO tramite `toJSON()` |
| `Date` invalida | `null` |
| Map e Set ordinari | `{}`, senza contenuto della collezione |
| BigInt senza conversione personalizzata | `TypeError` |
| Riferimento circolare | `TypeError` |

```js
const data = { missing: undefined, values: [undefined, NaN], count: Infinity };
console.log(JSON.stringify(data)); // {"values":[null,null],"count":null}
console.log(JSON.stringify(undefined)); // undefined
```

Per gli oggetti vengono serializzate le proprieta proprie enumerabili con chiave stringa. Getter e metodi `toJSON()` possono eseguire codice: serializzare un oggetto applicativo non e una validazione ne una sandbox.

---
### JSON.parse
`JSON.parse()` converte una stringa JSON in valore JavaScript.

```js
const json = '{"name":"Luca","active":true}';
const user = JSON.parse(json);

console.log(user.name); // "Luca"
```

Se la stringa non e JSON valido, genera `SyntaxError`.

```js
try {
  JSON.parse("{invalid}");
} catch (error) {
  console.error("JSON non valido");
}
```

---
### Invio con fetch
Esempi da usare in una funzione `async` o in un modulo con top-level await, con endpoint forniti dall'applicazione:

```js
const response = await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Luca",
  }),
});
if (!response.ok) throw new Error(`HTTP ${response.status}`);
```

Ricezione:

```js
const response = await fetch("/api/users/1");
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const user = await response.json();
```

Un `404` non fa rigettare automaticamente `fetch`. `response.json()` esegue parsing, non verifica lo schema; fallisce su corpo vuoto (per esempio `204`) o JSON invalido. Questi esempi presuppongono JSON nella risposta GET e richiedono gestione degli errori da parte del chiamante.

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

Il filtro rimuove solo chiavi chiamate `password`, non ogni possibile segreto. Per una risposta pubblica seleziona esplicitamente i campi ammessi invece di escludere soltanto quelli sensibili gia noti.

---
### Reviver
`JSON.parse()` puo ricevere un reviver.

```js
const json = '{"createdAt":"2026-05-13T10:00:00.000Z"}';

function reviveCreatedAt(key, value) {
  if (key === "createdAt") {
    if (typeof value !== "string") throw new TypeError("createdAt deve essere una stringa");
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
      throw new RangeError("createdAt deve essere un istante ISO UTC canonico");
    }
    return date;
  }

  return value;
}

const data = JSON.parse(json, reviveCreatedAt);
```

Questo reviver e specifico del formato dichiarato: `createdAt` deve coincidere con l'output di `toISOString()`. Non convertire automaticamente qualunque stringa simile a una data. Il reviver visita prima i figli e infine la radice (chiave vuota); restituire `undefined` elimina la proprieta visitata.

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

Funziona solo per dati JSON-safe e non conserva l'identita dei riferimenti condivisi.

Perde:

- `Date`;
- `Map`;
- `Set`;
- `undefined`;
- funzioni;
- `Symbol`;
- prototipi;
- con riferimenti circolari, invece di perdere il campo, genera un errore.

Per copie profonde di tipi supportati, valuta `structuredClone()`: conserva anche cicli e alcune collezioni, ma non clona funzioni o nodi DOM. Vedi la nota collegata su copie e immutabilita.

---

## API / Sintassi

API JavaScript principali: i nomi non definiti nei frammenti sono segnaposto.

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
if (!response.ok) throw new Error(`HTTP ${response.status}`);
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

Parsing con risultato esplicito, separato dalla validazione dei dati:

```js
function parseJsonSafe(text) {
  try {
    if (typeof text !== "string") throw new TypeError("Serve testo JSON");
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

`ok: true` indica soltanto che il testo e stato interpretato: anche `null` o un array possono essere risultati validi. Un secondo passo controlla i campi richiesti:

```js
// Richiede parseJsonSafe definita sopra.
function readPreferences(text) {
  const result = parseJsonSafe(text);
  if (!result.ok) throw result.error;
  const data = result.value;
  if (
    data === null || typeof data !== "object" || Array.isArray(data) ||
    !Object.hasOwn(data, "theme") || !["light", "dark"].includes(data.theme) ||
    !Object.hasOwn(data, "pageSize") || !Number.isInteger(data.pageSize) ||
    data.pageSize < 1 || data.pageSize > 100
  ) {
    throw new TypeError("Preferenze non valide");
  }
  return { theme: data.theme, pageSize: data.pageSize };
}

console.log(readPreferences('{"theme":"dark","pageSize":20}'));
```

Il risultato contiene solo i due campi ammessi; eventuali campi extra non vengono trasferiti. Per schemi estesi usa un validatore dedicato. Limita anche dimensione dei payload e dati registrati nei log. Non usare `eval()` per leggere JSON e non considerare `JSON.stringify()` un escape adatto a inserire dati in HTML.

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
- Confondere parsing riuscito con dati conformi allo schema o sicuri per qualunque contesto.

---

## Checklist

- La stringa e JSON valido?
- Ho gestito errori di parsing?
- I dati contengono tipi non serializzabili?
- Sto inviando `Content-Type: application/json`?
- Serve leggibilita con indentazione?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]
- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Browser Storage|Browser Storage]]
- [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti|Immutabilita e Copia degli Oggetti]]


## Fonti

- [MDN - JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [MDN - JSON.parse e reviver](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [MDN - Riferimenti circolari](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value)
- [OWASP - Validazione degli input](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
