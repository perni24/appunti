---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, date, time, intl, timezone]
aliases: [Date JavaScript, Date and Time]
prerequisites: [Tipi di Dati]
related: [Internazionalizzazione, JSON]
---

# Date & Time

## Sintesi

JavaScript gestisce date e orari principalmente con l'oggetto `Date`.

`Date` rappresenta un istante nel tempo come timestamp in millisecondi dalla Unix Epoch, ma molte API lavorano in timezone locale, creando possibili ambiguita.

---

## Creare date

Data corrente:

```js
const now = new Date();
```

Da timestamp:

```js
const date = new Date(0);
```

Da stringa ISO:

```js
const date = new Date("2026-05-13T10:00:00.000Z");
```

Da componenti:

```js
const date = new Date(2026, 4, 13, 10, 30);
```

> [!WARNING]
> Nei costruttori con componenti numerici, i mesi partono da `0`: gennaio e `0`, maggio e `4`.

---

## Timestamp

`Date.now()` restituisce il timestamp corrente in millisecondi.

```js
const timestamp = Date.now();
```

`getTime()` restituisce il timestamp di una data.

```js
const date = new Date();

console.log(date.getTime());
```

---

## Getter principali

```js
const date = new Date();

date.getFullYear();
date.getMonth();
date.getDate();
date.getDay();
date.getHours();
date.getMinutes();
date.getSeconds();
date.getMilliseconds();
```

Attenzione:

- `getMonth()` restituisce `0-11`;
- `getDate()` restituisce il giorno del mese;
- `getDay()` restituisce il giorno della settimana, con domenica `0`.

---

## UTC vs locale

Molti metodi hanno versione locale e UTC.

```js
const date = new Date();

date.getHours();
date.getUTCHours();
```

La stessa data puo produrre valori diversi in base al fuso orario.

Per dati scambiati tra sistemi, preferisci formato ISO UTC.

```js
const iso = new Date().toISOString();
```

---

## Formattare date

Usa `Intl.DateTimeFormat` per mostrare date all'utente.

```js
const formatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "full",
  timeStyle: "short",
});

console.log(formatter.format(new Date()));
```

Formato personalizzato:

```js
const formatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
```

---

## Parsing

Il parsing di stringhe non ISO puo essere ambiguo.

```js
new Date("05/06/2026"); // Ambiguo
```

Preferisci ISO 8601.

```js
new Date("2026-06-05T00:00:00.000Z");
```

---

## Operazioni tra date

Differenza in millisecondi:

```js
const start = new Date("2026-05-13T10:00:00.000Z");
const end = new Date("2026-05-13T12:30:00.000Z");

const diffMs = end.getTime() - start.getTime();
const diffMinutes = diffMs / 1000 / 60;
```

Per operazioni complesse su calendario, timezone, giorni lavorativi o ricorrenze, valuta librerie dedicate.

---

## JSON e Date

Quando serializzi una `Date` in JSON, viene convertita in stringa ISO.

```js
const data = {
  createdAt: new Date(),
};

const json = JSON.stringify(data);
```

Quando fai `JSON.parse()`, non torna automaticamente una `Date`: torna una stringa.

---

## Errori comuni

- Dimenticare che i mesi partono da `0`.
- Confondere `getDate()` e `getDay()`.
- Fare parsing di date non ISO.
- Ignorare timezone e UTC.
- Aspettarsi che `JSON.parse()` ricrei oggetti `Date`.
- Implementare logica calendaria complessa senza librerie o test adeguati.

---

## Checklist

- Sto usando timestamp, locale o UTC?
- La data arriva in formato ISO?
- Devo mostrare la data all'utente? Usa `Intl.DateTimeFormat`.
- Sto gestendo timezone?
- Ho testato i casi di fine mese, cambio anno e ora legale?

---

## Collegamenti

- [[JSON]]
- [[Internazionalizzazione]]
- [[Tipi di Dati]]
- [[Form Handling e Validazione]]
