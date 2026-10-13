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
  - date
  - time
  - intl
  - timezone
aliases:
  - Date JavaScript
  - Date and Time
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Tipi di Dati]]"
related:
  - "[[Programmazione/React/Pagine/Internazionalizzazione]]"
  - "[[Programmazione/JavaScript/Pagine/JSON]]"
title: Date & Time
---

# Date & Time

## Sintesi

JavaScript gestisce date e orari principalmente con l'oggetto `Date`.

`Date` rappresenta un istante nel tempo come timestamp in millisecondi dalla Unix Epoch, ma molte API lavorano in timezone locale, creando possibili ambiguita.

Non conserva il nome di un fuso orario. Distingui un **istante** (un evento avvenuto), una **data di calendario** (un compleanno, senza ora) e una **durata**: non sono lo stesso tipo di dato.

---

## Quando usarlo

Usa `Date` quando devi rappresentare un istante, salvare timestamp, formattare date o calcolare differenze semplici.

Casi comuni:

- mostrare date all'utente;
- salvare `createdAt` e `updatedAt`;
- calcolare durata tra due istanti;
- serializzare date in JSON;
- ordinare eventi per timestamp.

Per calendari complessi, timezone multiple, ricorrenze e regole locali, valuta librerie dedicate o API moderne quando disponibili.

`Temporal` distingue questi concetti con tipi dedicati; verifica il supporto del runtime o del polyfill prima di usarlo. Questa nota documenta le API `Date` e `Intl` gia presenti negli esempi del vault.

## Come funziona

### Creare date
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

Il costruttore a componenti usa il fuso locale e normalizza valori fuori intervallo: il 31 febbraio puo diventare un giorno di marzo, non `Invalid Date`. Gli anni numerici da `0` a `99` vengono interpretati come `1900`-`1999`; non usare questa forma per validare alla cieca date inserite dall'utente.

---
### Timestamp
`Date.now()` restituisce il timestamp corrente in millisecondi.

```js
const timestamp = Date.now();
```

`getTime()` restituisce il timestamp di una data.

Molte API esterne usano secondi Unix, non millisecondi: `new Date(seconds * 1000)`. Specifica sempre l'unita nel contratto, senza dedurla dalla grandezza del numero.

```js
const date = new Date();

console.log(date.getTime());
```

---
### Getter principali
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
### UTC vs locale
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
### Formattare date
Usa `Intl.DateTimeFormat` per mostrare date all'utente.

```js
const formatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

console.log(formatter.format(new Date()));
```

Formato personalizzato:

```js
const formatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Rome",
});
```

La locale sceglie la forma linguistica, non il fuso: senza `timeZone` conta l'ambiente di esecuzione. `Intl` formatta ma non interpreta stringhe di input. Non usare le stringhe localizzate come formato persistente; anche spazi e punteggiatura possono variare tra versioni dei dati internazionali.

---
### Parsing
Il parsing di stringhe non ISO puo essere ambiguo.

```js
new Date("05/06/2026"); // Ambiguo
```

Per un istante, usa il formato standard con offset esplicito o `Z`, non la generica etichetta "ISO":

```js
new Date("2026-06-05T00:00:00.000Z");
```

`"2026-06-05"` (solo data) viene interpretata come mezzanotte UTC; `"2026-06-05T00:00:00"` (data e ora senza offset) usa il fuso locale. Una data di calendario va conservata come `YYYY-MM-DD` validato, senza convertirla automaticamente in un istante: visualizzarla in un altro fuso potrebbe cambiare giorno.

### Date invalide e contratto di input

`new Date("testo")` produce normalmente una Date invalida, non lancia subito un errore. `getTime()` restituisce `NaN` e `toISOString()` genera `RangeError`.

Per un campo API che richiede esattamente `YYYY-MM-DDTHH:mm:ss.sssZ`, un parser puo verificare formato e round trip:

```js
function parseUtcInstant(text) {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(text)) {
    throw new TypeError("Serve YYYY-MM-DDTHH:mm:ss.sssZ");
  }
  const date = new Date(text);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== text) {
    throw new RangeError("Istante non valido o non canonico");
  }
  return date;
}
```

Questo contratto volutamente ristretto rifiuta offset, anni estesi, date inesistenti e normalizzazioni implicite. Non e un parser di tutti i formati ISO. Anche `null` va rifiutato prima del costruttore: `new Date(null)` rappresenterebbe l'epoch.

---
### Operazioni tra date
Differenza in millisecondi:

```js
const start = new Date("2026-05-13T10:00:00.000Z");
const end = new Date("2026-05-13T12:30:00.000Z");

const diffMs = end.getTime() - start.getTime();
const diffMinutes = diffMs / 1000 / 60;
```

Per operazioni complesse su calendario, timezone, giorni lavorativi o ricorrenze, valuta librerie dedicate.

### Giorno di calendario e 24 ore

I setter modificano l'istanza. Per preservare l'originale crea prima una copia. Esempio con ambiente impostato su `Europe/Rome`, al cambio dell'ora legale del 2026:

```js
const start = new Date(2026, 2, 28, 12);
const after24Hours = new Date(start.getTime() + 24 * 60 * 60 * 1000);
const nextLocalDay = new Date(start);
nextLocalDay.setDate(nextLocalDay.getDate() + 1);

console.log(after24Hours.getHours()); // 13
console.log(nextLocalDay.getHours()); // 12
console.log((nextLocalDay - start) / 3600000); // 23 ore trascorse
```

`setDate` segue il calendario locale; sommare millisecondi segue il tempo trascorso. Vicino al cambio d'ora un giorno locale puo durare 23 o 25 ore. Per appuntamenti in un fuso scelto dall'utente conserva anche l'identificatore IANA e usa uno strumento con semantica di calendario esplicita.

---
### JSON e Date
Quando serializzi una `Date` valida in JSON, viene convertita in stringa ISO. Una Date invalida viene serializzata come `null`.

```js
const data = {
  createdAt: new Date(),
};

const json = JSON.stringify(data);
```

Quando fai `JSON.parse()`, non torna automaticamente una `Date`: torna una stringa.

---

## API / Sintassi

Creazione:

I frammenti di sintassi presuppongono `timestamp` in millisecondi e una `date` valida.

```js
new Date();
new Date(timestamp);
new Date("2026-06-02T10:00:00.000Z");
```

Timestamp:

```js
Date.now();
date.getTime();
```

Serializzazione:

```js
date.toISOString();
JSON.stringify({ createdAt: date });
```

Formattazione:

```js
new Intl.DateTimeFormat("it-IT", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(date);
```

## Esempio pratico

Misurare un'operazione con un orologio monotono, non con l'orologio civile di `Date.now()`:

```js
async function measureJob(job, now = () => performance.now()) {
  if (typeof job !== "function") throw new TypeError("Serve una funzione");
  const startedAt = now();
  const value = await job();
  return { value, durationMs: now() - startedAt };
}
```

Il chiamante attende `measureJob(() => operazione())` e gestisce eventuali errori: se il job fallisce, il rifiuto viene propagato. `performance.now()` e relativo alla time origin, non all'epoch; non usarlo come timestamp persistente. Precisione e comportamento durante sospensione del sistema dipendono dalla piattaforma.

Mostrare un istante salvato nel formato UTC canonico, dopo aver definito `parseUtcInstant`:

```js
function formatCreatedAt(text, timeZone = "Europe/Rome") {
  const date = parseUtcInstant(text);
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

console.log(formatCreatedAt("2026-05-13T10:00:00.000Z"));
// In Europe/Rome: 13 maggio 2026, ore 12:00 (punteggiatura secondo il runtime)
```

## Varianti

- **Timestamp millisecondi**: numero da Unix Epoch.
- **Stringa ISO UTC**: formato consigliato per scambio dati.
- **Data locale**: interpretata secondo timezone dell'ambiente.
- **UTC methods**: `getUTCFullYear`, `getUTCHours` e simili.
- **Intl formatting**: formattazione localizzata.
- **Librerie dedicate**: utili per timezone, calendari e ricorrenze.

## Errori comuni

- Dimenticare che i mesi partono da `0`.
- Confondere `getDate()` e `getDay()`.
- Fare parsing di date non ISO.
- Ignorare timezone e UTC.
- Aspettarsi che `JSON.parse()` ricrei oggetti `Date`.
- Implementare logica calendaria complessa senza librerie o test adeguati.
- Considerare `Date.now()` monotono o interpretare secondi Unix come millisecondi.

---

## Checklist

- Sto usando timestamp, locale o UTC?
- La data arriva in formato ISO?
- Devo mostrare la data all'utente? Usa `Intl.DateTimeFormat`.
- Sto gestendo timezone?
- Ho testato i casi di fine mese, cambio anno e ora legale?

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/JSON|JSON]]
- Internazionalizzazione
- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati]]
- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]


## Fonti

- [MDN - Date, istanti e fusi](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [MDN - Costruttore Date e normalizzazione](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)
- [MDN - Parsing delle date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)
- [MDN - Intl.DateTimeFormat e timeZone](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
- [MDN - performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
- [MDN - Temporal e compatibilita](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
