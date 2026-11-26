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
  - logging
  - tracing
  - osservabilita
aliases:
  - Logging e tracing
  - Logging and tracing
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Logging leggibile]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
  - "[[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili]]"
title: Logging e tracing
---

# Logging e tracing

## Sintesi

Un **log** descrive un evento («autorizzazione fallita»); uno **span** misura una singola operazione dall'inizio alla fine. Una **traccia** collega gli span della stessa operazione complessiva, per esempio ricezione dell'ordine e chiamata al servizio pagamenti. Un messaggio di log da solo non misura la durata, e uno span aperto ma mai terminato non descrive l'operazione completa.

## Come leggere una richiesta

Il `traceId` è condiviso dagli span della stessa traccia; lo `spanId` identifica lo specifico passaggio. Due tentativi di autorizzazione possono avere lo stesso `traceId` ma span diversi. Un `requestId` applicativo può affiancarli: non crea automaticamente una relazione padre-figlio. Tra processi, un propagatore come quello W3C inietta ed estrae il contesto dagli header; copiare un identificatore nel log non basta.

## Esempio pratico

Il servizio inietta un `tracer` OpenTelemetry, l'enum `SpanStatusCode` di `@opentelemetry/api`, un logger con metodi `info(record)` e `error(record)` e la funzione di pagamento. Lo span rimane attivo mentre si attende l'esito. Il log seleziona i campi: né i dati di pagamento né il testo grezzo dell'eccezione vanno nel record.

```js
async function authorizeOrder(order, { tracer, SpanStatusCode, log, authorize }) {
  return tracer.startActiveSpan("payment.authorize", async span => {
    try {
      const { traceId, spanId } = span.spanContext();
      const fields = { orderId: order.id, traceId, spanId };
      let receipt;
      try {
        receipt = await authorize(order.payment);
      } catch (cause) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        log.error({ event: "payment.authorization_failed", ...fields });
        throw cause;
      }
      log.info({ event: "payment.authorized", ...fields });
      return receipt;
    } finally {
      span.end();
    }
  });
}
```

Il `catch` riguarda solo il pagamento: non attribuisce un errore del logger al servizio pagamenti. L'esempio presuppone che il logger non lanci eccezioni; in produzione un problema del sistema di log non dovrebbe far ritentare un pagamento già riuscito. Registrare lo stato dello span è distinto dal catturare dettagli sensibili dell'eccezione.

## Limiti e checklist

- Per avere tracce reali servono un provider configurato e un esportatore. Il campionamento può lasciare un log senza traccia consultabile.
- Controlla che successo e rifiuto terminino lo span **una sola volta** e che l'errore originale raggiunga il chiamante.
- Non usare `traceId`, `orderId` o altri identificatori per singola richiesta come etichette di metriche aggregate. Un audit con requisiti di completezza è un altro contratto, non una traccia campionata.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Logging leggibile|Logging leggibile]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]

## Fonti

- Charity Majors, Liz Fong-Jones, George Miranda, *Observability Engineering*
- Michael Nygard, *Release It!*
- [OpenTelemetry JavaScript: span attivi, stato e chiusura](https://opentelemetry.io/docs/languages/js/instrumentation/)
- [W3C Trace Context: propagazione tra servizi](https://www.w3.org/TR/trace-context/)
