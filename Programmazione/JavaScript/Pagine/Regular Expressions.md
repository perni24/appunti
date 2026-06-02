---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, regex, regexp, strings, validation]
aliases: [Regex JS, RegExp]
prerequisites: [Tipi di Dati, Stringhe]
related: [Form Handling e Validazione, Error Handling]
---

# Regular Expressions

## Sintesi

Le regular expressions descrivono pattern testuali.

In JavaScript sono rappresentate da oggetti `RegExp` e vengono usate per cercare, validare, sostituire ed estrarre testo.

---

## Quando usarlo

Usa regex quando devi riconoscere o trasformare pattern testuali relativamente regolari.

Esempi:

- validare formati semplici;
- estrarre parti da una stringa;
- sostituire pattern ricorrenti;
- cercare parole, numeri o delimitatori;
- fare parsing leggero di log o testo.

Evita regex per formati complessi come HTML, JSON o linguaggi annidati: usa parser dedicati.

## Come funziona

### Creazione
Literal:

```js
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

Costruttore:

```js
const pattern = new RegExp("hello", "i");
```

Usa il costruttore quando il pattern deve essere costruito dinamicamente.

---
### Metodi principali
```js
const pattern = /js/i;

console.log(pattern.test("JavaScript")); // true
```

```js
const match = "abc123".match(/\d+/);

console.log(match[0]); // "123"
```

Metodi comuni:

- `regexp.test(string)`;
- `regexp.exec(string)`;
- `string.match(regexp)`;
- `string.replace(regexp, value)`;
- `string.split(regexp)`;
- `string.search(regexp)`.

---
### Flag
Flag principali:

- `i`: case-insensitive;
- `g`: ricerca globale;
- `m`: multiline;
- `s`: dotAll;
- `u`: Unicode;
- `y`: sticky;
- `d`: indici dei match, dove supportato.

```js
const words = "uno due tre".match(/\w+/g);
```

---
### Gruppi
```js
const pattern = /(\d{4})-(\d{2})-(\d{2})/;
const match = "2026-05-13".match(pattern);

console.log(match[1]); // "2026"
```

Gruppi nominati:

```js
const pattern = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = "2026-05-13".match(pattern);

console.log(match.groups.year);
```

---
### Sostituzione
```js
const result = "hello world".replace(/\b\w/g, (letter) => {
  return letter.toUpperCase();
});

console.log(result); // "Hello World"
```

La callback di `replace` e utile per trasformazioni non banali.

---

## API / Sintassi

Sintassi base:

```js
const pattern = /hello/i;
pattern.test("Hello"); // true
```

Costruzione dinamica:

```js
const pattern = new RegExp(searchTerm, "i");
```

Metodi principali:

```js
/\d+/.test("abc123");
"abc123".match(/\d+/);
"a,b,c".split(/,/);
"hello".replace(/h/, "H");
```

Se il pattern dinamico contiene input utente, fai escape dei caratteri speciali.

## Esempio pratico

Estrarre data in formato ISO semplice:

```js
const pattern = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = "Creato il 2026-06-02".match(pattern);

if (match) {
  console.log(match.groups.year);
  console.log(match.groups.month);
  console.log(match.groups.day);
}
```

I gruppi nominati rendono piu leggibile il risultato rispetto agli indici numerici.

## Varianti

- **Literal regex**: `/pattern/flags`, comoda per pattern statici.
- **RegExp constructor**: utile per pattern costruiti a runtime.
- **Gruppi catturanti**: estraggono parti del match.
- **Gruppi nominati**: migliorano leggibilita.
- **Lookahead/lookbehind**: controllano contesto senza consumare caratteri.
- **Flag global `g`**: trova piu match, ma influenza `lastIndex`.

## Errori comuni

- Usare regex troppo complesse quando basta parsing esplicito.
- Dimenticare che `g` rende `exec` e `test` stateful tramite `lastIndex`.
- Validare email o URL reali con pattern troppo semplici.
- Non fare escape di input utente in regex dinamiche.
- Ignorare Unicode.

---

## Checklist

### Checklist operativa
- Mantieni regex leggibili e testate.
- Usa gruppi nominati per estrazioni complesse.
- Evita regex dinamiche senza escape.
- Usa `u` quando lavori con Unicode.
- Per form, combina regex con Constraint Validation API.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]
