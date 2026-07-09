---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, architettura, service-layer]
aliases: [Service layer, Application service]
prerequisites: [Separazione delle responsabilita, Controller sottili]
related: [Repository pattern, DTO e modelli di dominio, Modellazione del dominio]
---

# Service layer

## Sintesi

Il **service layer** coordina casi d'uso applicativi e regole di orchestrazione tra dominio, repository, integrazioni esterne e transazioni.

Serve a evitare che controller, UI o job contengano direttamente il flusso applicativo.

## Problema che risolve

Senza un layer applicativo chiaro, la logica viene distribuita in punti difficili da governare:

- controller;
- job;
- handler di eventi;
- componenti UI;
- repository;
- helper generici.

Questo produce duplicazione e rende incerto dove modificare un caso d'uso.

## Concetto chiave

Un service applicativo dovrebbe rappresentare un'azione significativa del sistema:

```text
createOrder
issueInvoice
registerPayment
sendPasswordReset
```

Non dovrebbe diventare una classe enorme con metodi scollegati, ne sostituire il modello di dominio.

## Dettagli importanti

- Coordina dipendenze, transazioni e side effects.
- Delega regole di dominio ai modelli o policy appropriate.
- Espone un contratto stabile per controller, job e API.
- Dovrebbe essere testabile senza framework web.
- Non deve trasformarsi in un contenitore generico di logica casuale.

## Esempio

```js
async function issueInvoice(command, dependencies) {
  const invoice = await dependencies.invoiceRepository.findById(command.invoiceId);

  invoice.issue(command.issuedAt);

  await dependencies.invoiceRepository.save(invoice);
  await dependencies.eventBus.publish("invoice.issued", { invoiceId: invoice.id });

  return invoice;
}
```

Il service coordina caricamento, regola di dominio, salvataggio ed evento.

## Limiti

- Un service layer anemico puo solo aggiungere passaggi inutili.
- Un service layer troppo grande diventa un "god service".
- Non sostituisce una buona modellazione del dominio.
- Per CRUD banali puo essere sufficiente una struttura piu semplice.

## Errori comuni

- Mettere tutte le regole nel service e lasciare oggetti passivi.
- Creare metodi generici come `processData`.
- Far dipendere i service da dettagli HTTP.
- Mescolare orchestration applicativa e query low-level.
- Duplicare lo stesso caso d'uso in piu service.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Controller sottili]]
- [[Repository pattern]]
- [[Modellazione del dominio]]
- [[Side effects controllati]]
- [[Codice testabile]]

## Fonti

- Martin Fowler, *Service Layer*
- Robert C. Martin, *Clean Architecture*
- Eric Evans, *Domain-Driven Design*
