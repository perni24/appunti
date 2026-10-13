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
  - es6
  - template-literals
  - strings
aliases:
  - Template strings
  - Stringhe template
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
  - "[[Programmazione/JavaScript/Pagine/Variabili]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM]]"
title: Template Literals
---

# Template Literals

## Sintesi

I template literals usano i backtick per delimitare parti testuali e interpolazioni. Nella forma ordinaria producono stringhe; con una funzione tag possono produrre anche altri tipi di valore.

Permettono interpolazione di espressioni, stringhe multilinea e forme avanzate come i tagged templates.

```js
const name = "Luca";

console.log(`Ciao ${name}`);
```

---

## Quando usarlo

Usa template literals quando devi comporre stringhe leggibili con variabili, espressioni o piu righe.

Sono utili per:

- messaggi di log;
- stringhe con valori interpolati;
- HTML template semplici;
- query o frammenti testuali controllati;
- tagged templates in librerie specializzate.

Se la stringa contiene input non fidato e finisce nel DOM, considera sicurezza e sanitizzazione.

## Come funziona

### Interpolazione
Dentro `${...}` puoi inserire variabili o espressioni JavaScript.

```js
const a = 5;
const b = 10;

console.log(`La somma e ${a + b}`);
```

Questo e piu leggibile della concatenazione.

```js
console.log("La somma e " + (a + b));
```

Le espressioni vengono valutate in quel momento e, nella forma ordinaria, convertite in stringa. Il risultato non si aggiorna quando una variabile cambia: non e un collegamento reattivo. Un identificatore non dichiarato genera `ReferenceError`.

---
### Stringhe multilinea
I template literals possono estendersi su piu righe.

```js
const message = `Prima riga
Seconda riga
Terza riga`;
```

La formattazione viene mantenuta nella stringa.

### Escape e testo raw

Per includere un backtick o scrivere letteralmente `${...}`, usa un backslash:

```js
const escaped = `Backtick: \`; segnaposto: \${name}`;
console.log(escaped); // "Backtick: `; segnaposto: ${name}"

const rawPath = String.raw`C:\notes\new`;
console.log(rawPath); // C:\notes\new, senza newline
```

`String.raw` conserva gli escape delle parti letterali, non sanitizza le interpolazioni.

---
### Espressioni
Dentro `${...}` puoi chiamare funzioni o usare ternari.

```js
const user = {
  name: "Luca",
  active: true,
};

const label = `${user.name} - ${user.active ? "attivo" : "non attivo"}`;
```

Evita pero espressioni troppo complesse: rendono la stringa difficile da leggere.

---
### Uso con HTML
I template literals sono comodi per creare markup.

```js
const user = {
  name: "Luca",
  role: "admin",
};

const html = `
  <article>
    <h2>${user.name}</h2>
    <p>${user.role}</p>
  </article>
`;
```

> [!WARNING]
> Se i dati arrivano da input utente o fonti non fidate, non inserirli direttamente in `innerHTML`.

Preferisci `textContent` o sanitizzazione.

---
### Tagged templates
Un tagged template passa parti statiche e valori interpolati a una funzione.

```js
function tag(strings, ...values) {
  return { parts: [...strings], values };
}

const result = tag`Totale: ${3} EUR`;
console.log(result.parts);  // ["Totale: ", " EUR"]
console.log(result.values); // [3], il numero non e convertito in stringa
```

Ci sono sempre `values.length + 1` parti statiche. Il tag decide come elaborarle e cosa restituire; senza `return`, il risultato sarebbe `undefined`. La sicurezza dipende dall'implementazione del tag, non dai backtick.

Uso avanzato:

- escaping specifico per il contesto, se implementato dalla libreria;
- internazionalizzazione;
- query builder;
- librerie CSS-in-JS;
- DSL interne.

---

## API / Sintassi

Sintassi base:

I seguenti frammenti riassumono la sintassi e presuppongono `name` e `tag` gia definiti.

```js
const message = `Ciao ${name}`;
```

Stringa multilinea:

```js
const text = `Riga 1
Riga 2`;
```

Tagged template:

```js
tag`Ciao ${name}`;
```

La funzione tag riceve prima un array con le parti statiche, poi i valori interpolati.

## Esempio pratico

Creare una label leggibile, assumendo dati gia validati con `name` stringa e `active` booleano:

```js
function formatUserLabel(user) {
  const status = user.active ? "attivo" : "non attivo";
  return `${user.name} (${status})`;
}
```

Nel browser, dopo aver definito `formatUserLabel`, inserire la label come testo:

```js
const user = { name: "<strong>Ada</strong>", active: true };
const label = document.createElement("span");
label.textContent = formatUserLabel(user);
document.body.append(label);
```

In questo modo la stringa non viene interpretata come HTML. Il nome resta testo visibile, compresi i caratteri `<` e `>`. Per query SQL usa parametri del driver, non interpolazioni di input dentro una query.

## Varianti

- **Interpolazione semplice**: `${value}`.
- **Espressioni**: `${count + 1}` o `${condition ? "si" : "no"}`.
- **Multilinea**: conserva newline e spazi.
- **Tagged templates**: trasformano parti statiche e valori.
- **Template HTML**: comodi, ma richiedono attenzione con input non fidato.

## Errori comuni

- Usare virgolette normali invece di backtick.
- Inserire logica troppo complessa dentro `${...}`.
- Usare template literals con `innerHTML` e input non fidato.
- Aspettarsi che l'indentazione del codice non influenzi la stringa multilinea.

---

## Checklist

- La stringa contiene variabili? Usa template literal.
- La stringa e multilinea? Usa template literal.
- Il contenuto verra inserito nel DOM? Valuta sicurezza/XSS.
- L'espressione dentro `${...}` e leggibile?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- Internazionalizzazione


## Fonti

- [MDN - Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
- [MDN - String.raw](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/raw)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
