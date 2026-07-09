---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, parsing, input-esterni]
aliases: [Parsing di input esterni, External input parsing]
prerequisites: [Parsing e serializzazione, Validazione ai confini]
related: [Pipeline dati leggibili, Validazione input API, Messaggi di errore utili]
---

# Parsing di input esterni

## Sintesi

Il **parsing di input esterni** trasforma dati non affidabili in strutture interne controllate.

Ogni input esterno va considerato sospetto finche non e stato letto, validato e normalizzato.

## Quando usarlo

- File importati da utenti o sistemi terzi.
- Payload API e webhook.
- Output di comandi CLI.
- CSV, JSON, XML, HTML o log.
- Risposte generate da modelli LLM.

## Come funziona

Un parser pulito dovrebbe:

- distinguere formato non valido e valore non valido;
- conservare contesto dell'errore;
- normalizzare solo cio che e sicuro normalizzare;
- non eseguire side effects;
- produrre un risultato tipizzato o strutturato.

## API / Sintassi

```text
raw external input -> parse -> validate -> normalized input
```

Il parser dovrebbe restituire successo o errore esplicito.

## Esempio pratico

```js
function parsePrice(rawPrice) {
  const value = Number(rawPrice);

  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: "invalid_price" };
  }

  return { ok: true, value };
}
```

Il chiamante non deve indovinare se il parsing e riuscito.

## Varianti

- Parser permissivo: accetta piu formati e normalizza.
- Parser stretto: accetta solo il formato previsto.
- Parser con schema: valida forma e tipi.
- Parser streaming: utile per file grandi.
- Parser con errori accumulati: utile per import massivi.

## Errori comuni

- Fidarsi di dati esterni perche arrivano da un sistema interno.
- Restituire `null` senza motivo.
- Perdere numero di riga, campo o sorgente.
- Normalizzare in modo distruttivo.
- Mescolare parsing e salvataggio.

## Checklist

- L'origine dell'input e tracciabile?
- Gli errori mantengono contesto utile?
- Il parser e testabile senza side effects?
- Il formato esterno e separato dal dominio?
- Esistono test su input malformati?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Parsing e serializzazione]]
- [[Validazione ai confini]]
- [[Pipeline dati leggibili]]
- [[Validazione input API]]
- [[Messaggi di errore utili]]

## Fonti

- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Microsoft, *REST API Guidelines*
- Martin Kleppmann, *Designing Data-Intensive Applications*
