---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, logging, osservabilita]
aliases: [Logging leggibile, Readable logging]
prerequisites: [Side effects controllati, Errori recuperabili e non recuperabili]
related: [Messaggi di errore utili, Codice pronto al deploy, Configurazione applicativa]
---

# Logging leggibile

## Sintesi

Il **logging leggibile** registra eventi utili per capire cosa e successo nel sistema senza sommergere chi legge.

Un log buono aiuta debug, monitoraggio e analisi post incidente.

## Problema che risolve

Log casuali o rumorosi non aiutano.

Problemi comuni:

- messaggi generici;
- mancanza di contesto;
- livelli sbagliati;
- dati sensibili esposti;
- log duplicati;
- assenza di correlation id;
- errori registrati troppo lontano dalla causa.

## Concetto chiave

Un log dovrebbe rispondere a domande operative:

- cosa e successo?
- su quale entita?
- con quale esito?
- quale richiesta o processo lo ha prodotto?
- serve intervenire?

## Esempio

Poco utile:

```js
logger.error("Error");
```

Piu utile:

```js
logger.error("Payment authorization failed", {
  orderId,
  paymentProvider,
  reason,
});
```

Il secondo log fornisce contesto diagnostico.

## Dettagli importanti

- Usa livelli coerenti: debug, info, warn, error.
- Non loggare segreti, password, token o dati personali non necessari.
- Preferisci log strutturati quando possibile.
- Includi identificativi utili, non interi oggetti rumorosi.
- Log e messaggi utente hanno scopi diversi.

## Limiti

- Il logging non sostituisce metriche, tracing e alerting.
- Troppi log possono aumentare costi e rumore.
- In ambienti regolati bisogna considerare privacy e retention.
- Loggare ogni eccezione a ogni livello crea duplicati.

## Errori comuni

- Usare `console.log` lasciati dal debug.
- Scrivere messaggi senza contesto.
- Registrare lo stesso errore in ogni layer.
- Usare `error` per eventi normali.
- Esporre dati sensibili nei log.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Side effects controllati]]
- [[Errori recuperabili e non recuperabili]]
- [[Messaggi di errore utili]]
- [[Dipendenze esplicite]]

## Fonti

- Michael Nygard, *Release It!*
- Charity Majors, Liz Fong-Jones, George Miranda, *Observability Engineering*
- Robert C. Martin, *Clean Code*
