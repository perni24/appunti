---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, oop, design]
aliases: [Tell Don't Ask, Tell Dont Ask]
prerequisites: [Incapsulamento]
related: [Oggetti con responsabilita chiara, Invarianti del dominio, Law of Demeter]
---

# Tell Don't Ask

## Sintesi

**Tell Don't Ask** suggerisce di dire a un oggetto cosa deve fare, invece di chiedergli dati interni per decidere fuori da lui cosa fare.

Il principio aiuta a mantenere comportamento e dati collegati nello stesso confine.

## Problema che risolve

Quando il codice interroga molti dettagli di un oggetto e poi prende decisioni esterne, la logica di dominio si disperde.

L'oggetto diventa un contenitore passivo e le regole finiscono in controller, service o helper.

## Concetto chiave

Invece di:

```text
chiedo dati -> controllo condizioni -> modifico oggetto
```

preferisci:

```text
chiedo all'oggetto di eseguire una operazione significativa
```

L'oggetto protegge le proprie regole.

## Dettagli importanti

- Non significa eliminare tutti i getter.
- E utile quando i dati sono legati a regole di dominio.
- Funziona bene con incapsulamento e invarianti.
- Non va applicato meccanicamente ai DTO.
- Aiuta a ridurre duplicazione di condizioni.

## Esempio

Ask:

```ts
if (order.status === "draft" && order.total > 0) {
  order.status = "paid";
}
```

Tell:

```ts
order.markAsPaid();
```

La regola di pagamento resta dentro `Order`.

## Limiti

- Per oggetti puramente dati, chiedere campi puo essere normale.
- Alcuni casi d'uso coordinano piu oggetti e richiedono logica esterna.
- Applicarlo troppo rigidamente puo creare metodi poco naturali.
- Serve distinguere dominio e trasporto dati.

## Errori comuni

- Usare getter per ricostruire regole all'esterno.
- Mettere logica di dominio nei controller.
- Creare metodi su oggetti sbagliati solo per evitare `if`.
- Confondere Tell Don't Ask con assenza totale di query.
- Applicarlo a DTO o response model senza bisogno.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]
- [[Oggetti con responsabilita chiara]]
- [[Invarianti del dominio]]
- [[Law of Demeter]]
- [[Data objects e behavior objects]]

## Fonti

- The Pragmatic Programmers, *Tell, Don't Ask*
- Martin Fowler, *Anemic Domain Model*
