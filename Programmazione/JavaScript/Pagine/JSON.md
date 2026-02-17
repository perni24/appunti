---
date: 2026-02-17
tags: [javascript, json, data-format, stringify, parse]
type: #permanent-note
status: budding
---

# JSON (JavaScript Object Notation)

Il **JSON** è un formato leggero per lo scambio di dati, basato sulla sintassi degli oggetti JavaScript ma indipendente dal linguaggio. È ampiamente utilizzato per inviare dati tra un server e un'applicazione web.

## 1. Regole del Formato

Sebbene derivi da JavaScript, il JSON ha regole più rigide:
- **Chiavi**: Devono sempre essere racchiuse tra **virgolette doppie** (`"key"`).
- **Stringhe**: Devono usare esclusivamente virgolette doppie.
- **Tipi supportati**: Stringhe, numeri, oggetti, array, booleani (`true`/`false`) e `null`.
- **Niente trailing commas**: L'ultima proprietà di un oggetto o elemento di un array non deve avere la virgola.
- **Niente commenti**: Il formato standard JSON non supporta i commenti.

---

## 2. Metodi JSON in JavaScript

JavaScript fornisce l'oggetto globale `JSON` per gestire la conversione tra oggetti e stringhe.

### `JSON.stringify()`
Converte un oggetto (o un array) JavaScript in una stringa in formato JSON. È utile per inviare dati a un'API.

```javascript
const user = {
  name: "Luca",
  isAdmin: true
};

const jsonString = JSON.stringify(user);
console.log(jsonString); // '{"name":"Luca","isAdmin":true}'
```

### `JSON.parse()`
Converte una stringa JSON in un oggetto JavaScript. È utile per elaborare una risposta ricevuta da un server.

```javascript
const data = '{"id": 101, "status": "active"}';

const obj = JSON.parse(data);
console.log(obj.id); // 101
```

---

## Casi d'Uso: Deep Clone (Clonazione Profonda)
Un trucco comune per clonare oggetti semplici (senza funzioni o simboli) è usare la combinazione dei due metodi:

```javascript
const original = { a: 1, b: { c: 2 } };
const clone = JSON.parse(JSON.stringify(original));

clone.b.c = 3;
console.log(original.b.c); // 2 (L'originale non è stato modificato)
```

> [!WARNING] Limitazioni del Deep Clone
> Questo metodo perde i tipi di dati speciali come `Date`, `Map`, `Set`, `undefined` e le funzioni.

---