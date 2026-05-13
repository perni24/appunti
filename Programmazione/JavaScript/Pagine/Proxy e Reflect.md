---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: advanced
tags: [javascript, proxy, reflect, metaprogramming, objects]
aliases: [Proxy JS, Reflect JS]
prerequisites: [Oggetti Avanzati, Property Descriptors]
related: [Prototypes, Property Descriptors, Error Handling]
---

# Proxy e Reflect

## Sintesi

`Proxy` permette di intercettare operazioni su un oggetto.

`Reflect` espone metodi standard per eseguire quelle operazioni in modo coerente.

---

## Proxy base

```js
const target = { name: "Luca" };

const proxy = new Proxy(target, {
  get(object, property) {
    console.log(`lettura ${String(property)}`);
    return object[property];
  },
});

console.log(proxy.name);
```

Il secondo argomento e un handler con trap.

---

## Trap comuni

Trap frequenti:

- `get`;
- `set`;
- `has`;
- `deleteProperty`;
- `ownKeys`;
- `apply`;
- `construct`.

```js
const user = new Proxy({}, {
  set(target, property, value) {
    if (property === "age" && value < 0) {
      throw new Error("Eta non valida");
    }

    target[property] = value;
    return true;
  },
});
```

---

## Reflect

`Reflect` contiene metodi equivalenti alle operazioni intercettabili.

```js
const proxy = new Proxy({ count: 1 }, {
  get(target, property, receiver) {
    return Reflect.get(target, property, receiver);
  },
});
```

Usare `Reflect` riduce errori in trap complessi e preserva semantica standard.

---

## Casi d'uso

`Proxy` e utile per:

- validazione;
- logging;
- reactive state;
- lazy loading;
- virtualizzazione di oggetti;
- API fluenti;
- controllo accessi.

Va usato con attenzione perche rende il comportamento meno esplicito.

---

## Limiti

- Puo impattare performance.
- Puo rendere il debug piu difficile.
- Non intercetta accessi a private fields.
- Alcuni invarianti del linguaggio devono essere rispettati.

---

## Errori comuni

- Dimenticare `return true` nel trap `set`.
- Violare invarianti di oggetti non configurabili.
- Usare Proxy per logica semplice risolvibile con funzioni.
- Nascondere side effect in letture di proprieta.
- Non usare `Reflect` come fallback standard.

---

## Checklist operativa

- Usa Proxy solo quando serve intercettare operazioni generiche.
- Mantieni handler piccoli.
- Usa `Reflect` per comportamento base.
- Documenta side effect.
- Misura performance se e in hot path.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Oggetti Avanzati|Oggetti Avanzati]]
- [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]
- [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
