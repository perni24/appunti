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
  - regex
  - regexp
  - strings
  - validation
aliases:
  - Regex JS
  - RegExp
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
  - Stringhe
related:
  - "[[Programmazione/JavaScript/Pagine/Form Handling e Validazione]]"
  - "[[Programmazione/JavaScript/Pagine/Error Handling]]"
title: Regular Expressions
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

Questo controlla solo una forma comune di email: non copre tutta la sintassi e non prova che la casella esista.

Costruttore:

```js
const pattern = new RegExp("hello", "i");
```

Usa il costruttore quando il pattern deve essere costruito dinamicamente.

Con una stringa JavaScript c'e un livello di escape in piu:

```js
const literal = /\d+/;
const constructed = new RegExp("\\d+");
console.log(literal.test("abc123"), constructed.test("abc123")); // true, true
```

### Elementi del pattern

| Sintassi | Significato |
| --- | --- |
| `^` e `$` | Inizio e fine dell'input; con `m`, anche della riga |
| `[a-z]`, `[^0-9]` | Un carattere nell'insieme, oppure fuori dall'insieme |
| `.` | Un carattere, esclusi i terminatori di riga senza `s` |
| `*`, `+`, `?` | Zero o piu, uno o piu, zero o uno |
| `{2,4}` | Da due a quattro ripetizioni |
| `a\|b` | Alternativa tra due pattern |
| `(abc)`, `(?:abc)` | Gruppo catturante, gruppo senza cattura |

I quantificatori sono greedy; aggiungere `?`, come in `+?`, li rende lazy. Non trasformano pero una regex in un parser di HTML o altre strutture annidate.

---
### Metodi principali
```js
const pattern = /js/i;

console.log(pattern.test("JavaScript")); // false: "j" e "s" non sono consecutive
console.log(pattern.test("Uso JS")); // true
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

`test()` cerca una corrispondenza anche parziale, non necessariamente l'intera stringa. Per un controllo di formato usa ancore e verifica prima il tipo: RegExp converte automaticamente gli input in stringa. `match()` ed `exec()` restituiscono `null` quando non trovano nulla; controllalo prima di leggere gruppi o indici.

---
### Flag
Flag principali:

- `i`: case-insensitive;
- `g`: ricerca globale;
- `m`: cambia il significato delle ancore, non quello del punto;
- `s`: dotAll, include i terminatori di riga nel punto;
- `u`: modalita Unicode;
- `v`: modalita Unicode con insiemi avanzati, alternativa a `u`, non combinabile con esso;
- `y`: sticky, cerca esattamente da `lastIndex`;
- `d`: indici dei match, dove supportato.

```js
const words = "uno due tre".match(/\w+/g);
```

### Stato con g e y

Con `g` o `y`, `test()` ed `exec()` aggiornano `lastIndex`, anche se cambi stringa tra chiamate:

```js
const pattern = /a/g;
console.log(pattern.test("a"), pattern.lastIndex); // true, 1
console.log(pattern.test("a"), pattern.lastIndex); // false, 0
```

Per una validazione ripetuta usa normalmente un pattern senza `g`/`y`. Per estrarre tutte le occorrenze con gruppi, `matchAll()` e spesso piu chiaro di un ciclo manuale su `exec()`; con una RegExp richiede `g`:

```js
const text = "id=12; id=34";
const ids = [...text.matchAll(/id=(?<id>\d+)/g)].map(match => match.groups.id);
console.log(ids); // ["12", "34"]
```

### Unicode

`\d` indica cifre ASCII e `\w` non significa "tutte le lettere Unicode". Il solo flag `u` non cambia questo limite. Per categorie Unicode usa property escape, per esempio lettere e segni combinanti:

```js
const letters = /^[\p{L}\p{M}]+$/u;
console.log(letters.test("caff\u00e8")); // true
console.log(letters.test("caffe\u0300")); // true, forma con segno combinante
```

Questo e un esempio di categoria testuale, non un validatore universale di nomi personali. `\b` segue la nozione di word character e non e un segmentatore universale di parole.

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

Queste regex estraggono componenti, non verificano il calendario: `2026-99-99` ha la stessa forma. Per date reali applica anche controlli semantici, come quelli in [[Programmazione/JavaScript/Pagine/Date & Time|Date & Time]].

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

Costruzione dinamica per una ricerca letterale, non per eseguire un pattern fornito dall'utente:

```js
const searchTerm = "a+b.js";
if (typeof RegExp.escape !== "function") {
  throw new Error("Serve un runtime con RegExp.escape o un polyfill compatibile");
}
const pattern = new RegExp(RegExp.escape(searchTerm), "i");
console.log(pattern.test("File A+B.JS pronto")); // true
console.log(pattern.test("aaabXjs")); // false
```

Metodi principali:

```js
/\d+/.test("abc123");
"abc123".match(/\d+/);
"a,b,c".split(/,/);
"hello".replace(/h/, "H");
```

`RegExp.escape()` e disponibile nei runtime recenti (Baseline 2025); controlla gli ambienti da supportare. Evita sostituzioni artigianali che coprono solo parte dei casi. Per una semplice ricerca letterale case-sensitive basta `text.includes(searchTerm)` e non serve una regex.

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

L'esempio estrae una sequenza dal testo e non certifica una data valida. Per una validazione di formato semplice, il contratto puo invece essere esplicito:

```js
function isProductCode(value) {
  return typeof value === "string" && /^[A-Z]{2}-[0-9]{4}$/.test(value);
}

console.log(isProductCode("AB-0123")); // true
console.log(isProductCode("test AB-0123")); // false
```

### Complessita e input non fidati

Pattern con ripetizioni annidate o alternative ambigue possono richiedere tempi enormi su input sfavorevoli (ReDoS), bloccando l'event loop. Limita lunghezza dell'input, mantieni semplici i pattern e misura anche casi senza corrispondenza. `RegExp.escape` protegge il testo interpolato, non rende efficiente qualunque pattern che lo contiene. Non eseguire regex arbitrarie non fidate nel thread principale; per casi complessi usa parser o strumenti con garanzie adeguate.

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

- Mantieni regex leggibili e testate.
- Usa gruppi nominati per estrazioni complesse.
- Evita regex dinamiche senza escape.
- Scegli `u` o `v` e classi Unicode in base ai caratteri da riconoscere e alla compatibilita.
- Per form, combina regex con Constraint Validation API.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]


## Fonti

- [MDN - Guida alle espressioni regolari](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)
- [MDN - test e lastIndex](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test)
- [MDN - Character class escape](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class_escape)
- [MDN - matchAll](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll)
- [MDN - RegExp.escape e compatibilita](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape)
- [OWASP - Regular expression Denial of Service](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
