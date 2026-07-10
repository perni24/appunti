---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, logging, tracing, osservabilita]
aliases: [Logging e tracing, Logging and tracing]
prerequisites: [Logging leggibile, Side effects controllati]
related: [Configurazione applicativa, Messaggi di errore utili, Errori recuperabili e non recuperabili]
---

# Logging e tracing

## Sintesi

**Logging** e **tracing** servono a capire cosa succede durante l'esecuzione di un sistema.

Il logging registra eventi significativi. Il tracing collega operazioni distribuite o sequenziali dentro una stessa richiesta, job o flusso.

## Quando usarlo

- Quando un errore deve essere diagnosticabile dopo l'esecuzione.
- Quando una richiesta attraversa piu componenti.
- Quando servono tempi, passaggi e correlation id.
- Quando bisogna distinguere problema applicativo, infrastrutturale o di integrazione.
- Quando un sistema deve essere osservabile in produzione.

## Come funziona

Un log utile registra eventi. Una traccia utile collega eventi e span dentro un flusso.

In un'applicazione moderna, ogni richiesta dovrebbe avere un identificatore correlabile, cosi log e metriche possono essere letti insieme.

## API / Sintassi

```js
logger.info("Order submitted", { orderId, requestId });

tracer.startSpan("submit_order", { attributes: { orderId } });
```

I nomi e i campi devono essere stabili e comprensibili.

## Esempio pratico

```js
async function submitOrder(order, context) {
  logger.info("Submitting order", {
    orderId: order.id,
    requestId: context.requestId,
  });

  return paymentService.authorize(order.payment);
}
```

Il log contiene evento, entita e contesto di correlazione.

## Varianti

- Log testuali: semplici, ma meno interrogabili.
- Log strutturati: piu adatti a produzione.
- Tracing distribuito: utile in sistemi con microservizi o code.
- Audit log: registra eventi di business e sicurezza, non debug tecnico.

## Errori comuni

- Loggare tutto a livello `error`.
- Non propagare correlation id.
- Registrare dati sensibili.
- Duplicare lo stesso errore in ogni layer.
- Confondere log diagnostici e audit trail.

## Checklist

- Ogni log importante ha contesto sufficiente?
- I dati sensibili sono esclusi o mascherati?
- Esiste un request id o correlation id?
- I livelli di log sono coerenti?
- Gli errori vengono loggati nel punto giusto?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Logging leggibile]]
- [[Messaggi di errore utili]]
- [[Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]

## Fonti

- Charity Majors, Liz Fong-Jones, George Miranda, *Observability Engineering*
- Michael Nygard, *Release It!*
- OpenTelemetry Documentation
