---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - oop
  - accoppiamento
aliases:
  - Law of Demeter
  - Legge di Demetra
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Tell Don't Ask]]"
  - "[[Programmazione/Clean Code/Pagine/Incapsulamento]]"
  - "[[Programmazione/Clean Code/Pagine/Confini tra moduli]]"
title: Law of Demeter
---

# Law of Demeter

## Sintesi

La **Law of Demeter** (principio della minima conoscenza) invita a far collaborare un metodo con gli oggetti che conosce direttamente: per esempio i suoi parametri, i collaboratori propri o gli oggetti che crea. Il rischio non è «usare troppi punti», ma dover conoscere la struttura interna di un collaboratore per ottenere una risposta di dominio.

## Esempio: destinazione della spedizione, non residenza del cliente

Nell'esempio i pacchi partono dall'Italia e la destinazione decide se usare la coda nazionale o internazionale. `order.customer.address.country.code` impone al chiamante di conoscere quattro livelli della struttura e, peggio, può restituire il **paese del cliente**, non quello di consegna. Creare un metodo `isForCountry` che nasconde la stessa lettura sbagliata conserva il bug.

```ts
type Shipment = { destinationCountry(): string };

function queueFor(shipment: Shipment): "domestic" | "international" {
  return shipment.destinationCountry() === "IT" ? "domestic" : "international";
}
```

Il contratto richiede un codice paese già validato, in maiuscolo, relativo **a quella consegna**. L'adattatore che conosce l'ordine o il JSON di ingresso ricava la destinazione nel suo formato specifico. Il selettore di coda non ha bisogno di conoscere cliente, indirizzo di fatturazione o struttura del JSON. Un ordine fatturato in Italia e consegnato in Francia deve andare nella coda internazionale. Non è una regola fiscale.

## Come verificare che il confine serva

Se il magazzino sostituisce l'indirizzo annidato con un codice di destinazione al primo livello, adatta il dato in un solo punto. Esegui lo stesso selettore con i due adattatori: a parità di destinazione deve scegliere la stessa coda. Se devi ancora modificare il selettore, qualche dettaglio interno continua ad attraversare il confine.

## Limiti ed errori comuni

- `items.filter(...).map(...)` non dimostra da sola una violazione: è una successione di trasformazioni della collezione, non una ricerca di collaboratori nascosti. Al contrario, spezzare un accesso annidato in quattro variabili locali non ne riduce l'accoppiamento.
- Un adattatore **deve** conoscere lo schema esterno che traduce. L'obiettivo è non disperdere quella conoscenza in ogni caso d'uso.
- Non aggiungere una serie di passacarte che restituiscono uno dopo l'altro cliente, indirizzo e paese. Chiedi il dato o il comportamento che manca davvero al chiamante.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Tell Don't Ask|Tell Don't Ask]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/Clean Code/Pagine/Coesione e accoppiamento|Coesione e accoppiamento]]
- [[Programmazione/Clean Code/Pagine/Confini tra moduli|Confini tra moduli]]

## Fonti

- Progetto Demeter, Northeastern University, [Law of Demeter: Principle of Least Knowledge](https://www.ccs.neu.edu/home/lieber/LoD.html)
- Robert C. Martin, *Clean Code*
