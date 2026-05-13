---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, es6, template-literals, strings]
aliases: [Template strings, Stringhe template]
prerequisites: [Tipi di Dati, Variabili]
related: [Tipi di Dati, Manipolazione del DOM]
---

# Template Literals

## Sintesi

I template literals sono stringhe delimitate da backtick.

Permettono interpolazione di espressioni, stringhe multilinea e forme avanzate come i tagged templates.

```js
const name = "Luca";

console.log(`Ciao ${name}`);
```

---

## Interpolazione

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

---

## Stringhe multilinea

I template literals possono estendersi su piu righe.

```js
const message = `Prima riga
Seconda riga
Terza riga`;
```

La formattazione viene mantenuta nella stringa.

---

## Espressioni

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

## Uso con HTML

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

## Tagged templates

Un tagged template passa parti statiche e valori interpolati a una funzione.

```js
function tag(strings, ...values) {
  console.log(strings);
  console.log(values);
}

const name = "Luca";

tag`Ciao ${name}`;
```

Uso avanzato:

- escaping sicuro;
- internazionalizzazione;
- query builder;
- librerie CSS-in-JS;
- DSL interne.

---

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

- [[Tipi di Dati]]
- [[Manipolazione del DOM]]
- [[Sicurezza]]
- [[Internazionalizzazione]]
