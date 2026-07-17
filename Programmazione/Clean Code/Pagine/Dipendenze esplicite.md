---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, dipendenze, modularita]
aliases: [Dipendenze esplicite, Dipendenze visibili]
prerequisites: [Clean Code]
related: [Codice esplicito vs codice implicito, Confini tra moduli, Moduli piccoli]
---

# Dipendenze esplicite

## Sintesi

Le **dipendenze esplicite** sono dipendenze visibili nel codice: parametri, import, costruttori, interfacce o configurazioni dichiarate.

Rendere esplicite le dipendenze aiuta a capire cosa serve a un modulo per funzionare e quali parti possono essere impattate da una modifica.

## Problema che risolve

Le dipendenze implicite nascoste in global state, singleton, variabili d'ambiente o configurazioni invisibili rendono il comportamento difficile da prevedere.

Il codice sembra semplice, ma dipende da contesto esterno non dichiarato.

## Concetto chiave

Una dipendenza dovrebbe essere visibile nel punto in cui serve.

Questo significa:

- import chiari;
- parametri espliciti;
- configurazione passata in modo controllato;
- niente accesso casuale a stato globale;
- boundary chiari verso infrastruttura;
- test capaci di sostituire collaboratori.

## Dettagli importanti

- Esplicito non significa passare venti parametri ovunque.
- Troppe dipendenze indicano spesso una responsabilita troppo ampia.
- Le dipendenze verso framework vanno isolate quando possibile.
- Le dipendenze di dominio dovrebbero essere piu stabili di quelle infrastrutturali.
- La dependency injection e utile solo se rende il codice piu chiaro e testabile.

## Esempio

Dipendenza implicita:

```ts
function createInvoice(order: Order) {
  return database.invoices.insert(order);
}
```

Dipendenza esplicita:

```ts
function createInvoice(order: Order, invoiceRepository: InvoiceRepository) {
  return invoiceRepository.insert(order);
}
```

La seconda versione rende chiaro che la funzione ha bisogno di un repository.

## Limiti

- Rendere tutto configurabile puo creare complessita inutile.
- In piccoli script, una dipendenza globale puo essere accettabile.
- Alcuni framework nascondono dipendenze per convenzione.
- Le dipendenze esplicite devono restare ergonomiche.

## Errori comuni

- Nascondere servizi in singleton globali.
- Leggere variabili d'ambiente in qualunque punto del codice.
- Importare infrastruttura dentro il dominio.
- Usare dependency injection senza ridurre accoppiamento reale.
- Accettare troppi parametri invece di separare responsabilita.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Codice esplicito vs codice implicito]]
- [[Confini tra moduli]]
- [[Moduli piccoli]]
- [[Oggetti con responsabilita chiara]]

## Fonti

- Robert C. Martin, *Clean Architecture*
- Martin Fowler, *Inversion of Control Containers and the Dependency Injection pattern*
