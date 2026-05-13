---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, es6, functions, default-parameters]
aliases: [Parametri default, Parametri predefiniti]
prerequisites: [Funzioni]
related: [Funzioni, Destructuring]
---

# Default Parameters

## Sintesi

I default parameters permettono di assegnare un valore predefinito a un parametro di funzione.

Il valore di default viene usato quando l'argomento e assente o vale `undefined`.

---

## Sintassi

```js
function greet(name = "Guest") {
  return `Ciao ${name}`;
}

console.log(greet());       // "Ciao Guest"
console.log(greet("Luca")); // "Ciao Luca"
```

Prima di ES6 si usavano spesso controlli manuali.

```js
function greet(name) {
  name = name || "Guest";
  return "Ciao " + name;
}
```

Questo pero tratta anche `""`, `0` o `false` come mancanti.

---

## undefined vs null

Il default si applica solo con `undefined`.

```js
function show(value = "default") {
  console.log(value);
}

show();          // "default"
show(undefined); // "default"
show(null);      // null
show("");        // ""
```

`null` e considerato un valore passato intenzionalmente.

---

## Espressioni come default

Il default puo essere il risultato di una espressione.

```js
function createUser(id = crypto.randomUUID()) {
  return { id };
}
```

L'espressione viene valutata al momento della chiamata, non alla definizione della funzione.

---

## Parametri precedenti

Un parametro puo usare parametri dichiarati prima.

```js
function createRectangle(width, height = width) {
  return {
    width,
    height,
    area: width * height,
  };
}

console.log(createRectangle(10).area); // 100
```

Non puo invece usare parametri dichiarati dopo.

---

## Default con destructuring

Molto utile con oggetti di opzioni.

```js
function connect({
  host = "localhost",
  port = 5432,
  secure = false,
} = {}) {
  return `${secure ? "https" : "http"}://${host}:${port}`;
}
```

Il `= {}` finale evita errore quando la funzione viene chiamata senza argomenti.

```js
connect();
```

---

## Quando usarli

- Parametri opzionali.
- Valori di configurazione.
- Oggetti di opzioni.
- Funzioni con fallback ragionevoli.
- API piu auto-documentanti.

---

## Errori comuni

- Aspettarsi che `null` attivi il default.
- Usare `param = param || default` quando `0`, `false` o `""` sono valori validi.
- Dimenticare `= {}` con destructuring nei parametri.
- Mettere logica troppo costosa come default senza necessita.

---

## Checklist

- Il parametro e davvero opzionale?
- Il default e chiaro nella firma?
- `null` deve essere trattato come valore valido?
- Con destructuring ho aggiunto `= {}`?
- Il default ha effetti collaterali?

---

## Collegamenti

- [[Funzioni]]
- [[Destructuring]]
- [[Operatori]]
- [[Tipi di Dati]]
