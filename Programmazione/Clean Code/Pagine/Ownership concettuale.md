---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, ownership, responsabilita]
aliases: [Ownership concettuale, Conceptual ownership]
prerequisites: [Coesione e accoppiamento, Gestione dello stato]
related: [Lifecycle degli oggetti, Gestione delle risorse, Confini tra moduli]
---

# Ownership concettuale

## Sintesi

L'**ownership concettuale** indica quale parte del sistema possiede un dato, una risorsa o una decisione.

Non riguarda solo memoria o linguaggi specifici: riguarda responsabilita, confini e autorita di modifica.

## Problema che risolve

Quando nessuno possiede davvero un concetto, tutti lo modificano.

Questo porta a:

- regole duplicate;
- stato modificato da moduli lontani;
- confini deboli;
- bug da ordine di esecuzione;
- responsabilita distribuite male;
- difficolta nel refactoring.

## Concetto chiave

Per ogni dato importante dovrebbe essere chiaro:

- chi lo crea;
- chi puo modificarlo;
- chi lo valida;
- chi lo persiste;
- chi lo espone;
- chi lo elimina o invalida.

L'ownership riduce ambiguita e accoppiamento.

## Dettagli importanti

- Un modulo puo leggere un dato senza possederlo.
- Chi possiede una regola dovrebbe proteggere i suoi invarianti.
- Trasferire ownership deve essere un evento esplicito.
- Le API pubbliche dovrebbero evitare di esporre dettagli modificabili.
- Nel dominio, ownership e responsabilita spesso coincidono.

## Esempio

Se `OrderService`, `PaymentService` e `InvoiceService` modificano tutti lo stato `order.status`, nessuno controlla davvero il lifecycle dell'ordine.

Una soluzione piu chiara e far passare le transizioni attraverso il modello o il servizio che possiede l'ordine:

```js
order.markAsPaid(paymentId);
```

La regola resta nel posto responsabile.

## Limiti

- In sistemi distribuiti l'ownership puo essere condivisa o eventuale.
- Alcune decisioni attraversano piu domini.
- L'ownership troppo rigida puo rallentare evoluzione e integrazione.
- Serve disciplina nei confini, non solo nomi di moduli.

## Errori comuni

- Esporre oggetti mutabili e considerarli incapsulati.
- Far modificare lo stesso dato da molti servizi.
- Mettere regole di ownership solo nella documentazione.
- Confondere ownership con semplice importazione di un modulo.
- Duplicare copie dello stesso stato senza fonte autorevole.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Coesione e accoppiamento]]
- [[Confini tra moduli]]
- [[Gestione dello stato]]
- [[Lifecycle degli oggetti]]
- [[Invarianti interne]]

## Fonti

- Eric Evans, *Domain-Driven Design*
- Robert C. Martin, *Clean Architecture*
- Martin Fowler, *Patterns of Enterprise Application Architecture*
