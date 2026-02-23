---
date: 2026-02-18
tags: [javascript, web-dev, dates]
type: #permanent-note
status: budding
---

# Date & Time in JavaScript

In JavaScript, la gestione delle date e degli orari avviene principalmente tramite l'oggetto globale `Date`. Questo oggetto rappresenta un singolo momento nel tempo in un formato indipendente dalla piattaforma.

## Creazione di un Oggetto Date

È possibile creare un'istanza di `Date` in diversi modi:

```javascript
// Data e ora corrente
const now = new Date();

// Da una stringa (formato ISO 8601 raccomandato)
const specificDate = new Date("2026-02-18T09:00:00");

// Specificando i componenti (anno, mese, giorno, ora, minuti, secondi, ms)
// NOTA: I mesi partono da 0 (Gennaio = 0, Dicembre = 11)
const manualDate = new Date(2026, 1, 18, 10, 30); 
```

> [!WARNING]
> Ricorda che il conteggio dei mesi in JavaScript è **zero-based**. `0` è Gennaio, mentre `1` è Febbraio. Questo è una causa comune di bug.

## Metodi Principali (Getter & Setter)

Una volta creato l'oggetto, puoi estrarre o modificare i suoi componenti.

### Estrazione dei dati (Getter)
- `date.getFullYear()`: Restituisce l'anno (es. 2026).
- `date.getMonth()`: Restituisce il mese (0-11).
- `date.getDate()`: Restituisce il giorno del mese (1-31).
- `date.getDay()`: Restituisce il giorno della settimana (0 = Domenica).
- `date.getTime()`: Restituisce il timestamp in millisecondi dal 1 Gennaio 1970 (Unix Epoch).

### Modifica dei dati (Setter)
Ogni metodo getter ha il suo corrispettivo setter (es. `setFullYear(2027)`, `setMonth(5)`).

## Formattazione e Localizzazione

L'approccio moderno per formattare le date in modo leggibile per l'utente è l'utilizzo dell'API `Intl.DateTimeFormat`.

```javascript
const date = new Date();

// Formattazione standard italiana
const itFormat = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'full',
    timeStyle: 'short'
}).format(date);

console.log(itFormat); // es: "mercoledì 18 febbraio 2026, 09:17"

// Opzioni personalizzate
const customFormat = new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
}).format(date); // "18 febbraio 2026"
```

## Manipolazione con librerie esterne

> [!TIP]
> Per operazioni complesse come il calcolo della differenza tra date, la gestione dei fusi orari o il parsing di stringhe non standard, si consiglia l'uso di librerie moderne come **Luxon**, **Day.js** o **date-fns** invece della nativa `Date`.

---