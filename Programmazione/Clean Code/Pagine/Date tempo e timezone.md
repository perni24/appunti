---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - date
  - timezone
aliases:
  - Date tempo e timezone
  - Date
  - tempo e timezone
  - Timezone
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
  - "[[Programmazione/Clean Code/Pagine/Configurazione applicativa]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
  - "[[Programmazione/Clean Code/Pagine/Parsing e serializzazione]]"
title: Date tempo e timezone
---

# Date tempo e timezone

## Sintesi

«Il 26 ottobre», «le 02:30 a Roma» e «un'ora dopo» non rappresentano lo stesso tipo di dato. **Un istante ordina gli eventi; una data civile appartiene al calendario; una durata misura un intervallo.** Scegli prima che cosa intende il dominio, poi il formato.

## Come scegliere

| Domanda | Rappresentazione | Errore da evitare |
| --- | --- | --- |
| Quando è scaduta la sessione? | Istante, per esempio millisecondi dall'epoch o timestamp con offset | Confrontare stringhe con offset differenti |
| Qual è il giorno del compleanno? | Data civile, senza ora e senza fuso | Trasformarla in mezzanotte UTC e mostrarla come giorno precedente |
| Quando suona ogni giorno alle 09:00 a Roma? | Ora locale, regola di ricorrenza e zona IANA `Europe/Rome` | Sommare sempre 24 ore al primo istante |
| Quanto è durata una ricerca? | Differenza tra letture di un orologio monotono | Usare un orologio civile che può essere corretto durante la misura |

## Esempio pratico

Il 26 ottobre 2025 a Roma, al ritorno all'ora solare, le **02:30 si presentano due volte**. L'offset numerico distingue i due istanti; il nome della zona permette di ricostruire l'ora civile di ciascuno.

```js
const firstMs = Date.parse("2025-10-26T02:30:00+02:00");
const secondMs = Date.parse("2025-10-26T02:30:00+01:00");
const romeClock = new Intl.DateTimeFormat("it-IT", {
  timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function isExpired(expiresAtMs, nowMs) {
  if (![expiresAtMs, nowMs].every(Number.isSafeInteger)) {
    throw new TypeError("Attesi istanti in millisecondi interi");
  }
  return nowMs >= expiresAtMs;
}
```

`romeClock.format(firstMs)` e `romeClock.format(secondMs)` mostrano entrambi `02:30`, ma la differenza è **3.600.000 ms**. Per una scadenza al secondo istante, al primo non è ancora scaduta; a parità di istante sì. Passare `nowMs` consente di provare entrambi i casi senza aspettare.

## L'operazione inversa

Da **istante + zona** ricavi un'ora civile. Da **ora civile + zona** puoi ottenere due istanti (ora ripetuta), uno, oppure nessuno: a Roma il 30 marzo 2025 si passò dalle 01:59 alle 03:00. Un modulo di prenotazione deve scegliere una regola esplicita: per esempio rifiutare le ore inesistenti e chiedere quale occorrenza si intende per quelle doppie. `Intl.DateTimeFormat` formatta istanti: non effettua questa scelta. Un offset fisso non sostituisce le regole di una zona per eventi futuri.

## Checklist

- Il nome indica l'unità, soprattutto se un'API lavora in secondi e l'altra in millisecondi?
- La zona è quella del dominio o dell'utente, non quella implicita del server?
- I test includono l'istante esatto della scadenza e un passaggio di ora legale?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Clean Code/Pagine/Parsing e serializzazione|Parsing e serializzazione]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]

## Fonti

- Martin Fowler, *TimeNarrative*
- ISO 8601
- [IANA: banca dati dei fusi orari](https://www.iana.org/time-zones)
- [ECMA-402: Intl.DateTimeFormat](https://tc39.es/ecma402/#datetimeformat-objects)
- [ECMAScript: formato delle stringhe data e ora](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date-time-string-format)
