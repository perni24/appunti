---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, web, controller]
aliases: [Controller sottili, Thin controllers]
prerequisites: [Separazione delle responsabilita, Validazione ai confini]
related: [Service layer, Validazione input API, DTO e modelli di dominio]
---

# Controller sottili

## Sintesi

I **controller sottili** gestiscono il confine HTTP o UI senza contenere la logica principale dell'applicazione.

Il loro compito e ricevere input, validarlo o delegarne la validazione, chiamare il caso d'uso corretto e trasformare il risultato in una risposta.

## Problema che risolve

Controller troppo grandi diventano punti in cui si accumulano:

- parsing input;
- validazione;
- autorizzazione;
- logica di business;
- query;
- gestione errori;
- serializzazione della risposta.

Questo rende difficile testare e riusare il comportamento fuori dal framework web.

## Concetto chiave

Un controller dovrebbe coordinare, non decidere tutto.

La logica applicativa dovrebbe vivere in service, use case o handler dedicati. Il controller resta vicino al protocollo: request, response, status code, headers e formato.

## Dettagli importanti

- Il controller puo validare forma e presenza dei dati.
- Le regole di dominio non dovrebbero restare nel controller.
- I dettagli HTTP non dovrebbero invadere il dominio.
- Errori e risposte devono essere tradotti in modo coerente.
- Controller piccoli rendono piu semplice testare i casi d'uso senza server web.

## Esempio

Controller carico:

```js
async function createOrderController(request, response) {
  if (!request.body.customerId) {
    return response.status(400).json({ error: "customerId is required" });
  }

  const customer = await db.customers.find(request.body.customerId);
  const order = await db.orders.insert({ customerId: customer.id });
  await email.sendOrderCreated(customer.email, order.id);

  return response.status(201).json(order);
}
```

Controller piu sottile:

```js
async function createOrderController(request, response) {
  const input = parseCreateOrderRequest(request.body);
  const result = await createOrder(input);

  return toHttpResponse(response, result);
}
```

Il controller mostra il flusso senza contenere tutti i dettagli.

## Limiti

- Un controller troppo sottile puo solo spostare confusione in service generici.
- Alcuni framework richiedono codice specifico nel controller.
- Validazione, autorizzazione e mapping vanno comunque progettati.
- Non ogni endpoint semplice richiede un use case separato.

## Errori comuni

- Mettere query SQL direttamente nei controller.
- Far dipendere il dominio da oggetti `request` o `response`.
- Duplicare gestione errori in ogni handler.
- Creare service generici chiamati `manager` senza responsabilita chiara.
- Usare controller sottili come regola meccanica, senza migliorare il design.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Separazione delle responsabilita]]
- [[Validazione ai confini]]
- [[Service layer]]
- [[Validazione input API]]
- [[DTO e modelli di dominio]]

## Fonti

- Martin Fowler, *Patterns of Enterprise Application Architecture*
- Robert C. Martin, *Clean Architecture*
- Eric Evans, *Domain-Driven Design*
