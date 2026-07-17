---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, date, timezone]
aliases: [Date tempo e timezone, Date, tempo e timezone, Timezone]
prerequisites: [Codice testabile, Configurazione applicativa]
related: [Gestione esplicita degli errori, Test unitari leggibili, Parsing e serializzazione]
---

# Date tempo e timezone

## Sintesi

Date, tempo e timezone sono una fonte frequente di bug perche sembrano semplici ma dipendono da fuso orario, formato, calendario, precisione e ambiente.

Nel Clean Code il tempo va trattato come una dipendenza esplicita, non come dettaglio casuale letto ovunque.

## Quando usarlo

- Quando salvi eventi, scadenze o appuntamenti.
- Quando confronti date tra utenti o sistemi.
- Quando generi token, sessioni o timeout.
- Quando importi dati da formati esterni.
- Quando scrivi test su comportamenti temporali.

## Come funziona

Una buona gestione del tempo distingue:

- istante assoluto;
- data locale;
- orario locale;
- durata;
- timezone;
- formato di presentazione.

Queste cose non dovrebbero essere rappresentate tutte con una stringa generica.

## API / Sintassi

```text
clock.now() -> instant
instant + timezone -> local date/time
local date/time + timezone -> instant
```

Il clock dovrebbe essere iniettato nei punti testabili.

## Esempio pratico

```js
function isExpired(expiresAt, now) {
  return now >= expiresAt;
}
```

Passare `now` come parametro rende il comportamento testabile e non dipendente dall'orologio di sistema.

## Varianti

- UTC per salvataggio di istanti.
- Timezone locale per visualizzazione e pianificazione.
- Date-only per compleanni o scadenze senza ora.
- Clock finto nei test.
- Librerie dedicate quando la standard library e insufficiente.

## Errori comuni

- Salvare date locali senza timezone.
- Confrontare stringhe invece di istanti.
- Usare il clock globale in logica di dominio.
- Ignorare ora legale e cambi timezone.
- Mescolare formato di storage e formato di visualizzazione.

## Checklist

- Stai rappresentando un istante o una data locale?
- Il timezone e esplicito?
- I test controllano il clock?
- Il formato esterno e validato?
- Storage e presentazione sono separati?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Parsing e serializzazione]]
- [[Test unitari leggibili]]

## Fonti

- Martin Fowler, *TimeNarrative*
- IANA Time Zone Database
- ISO 8601
