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
  - funzioni
  - composizione
aliases:
  - Composizione di funzioni
  - Function composition
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Funzioni pure e impure]]"
  - "[[Programmazione/Clean Code/Pagine/Funzioni piccole]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Pipeline di trasformazione]]"
  - "[[Programmazione/Clean Code/Pagine/Trasformazioni dichiarative]]"
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
title: Composizione di funzioni
---

# Composizione di funzioni

## Sintesi

La **composizione di funzioni** consiste nel costruire comportamento complesso combinando funzioni piccole, nominate e prevedibili.

Nel Clean Code e utile per trasformare codice procedurale lungo in una sequenza di passaggi leggibili.

## Problema che risolve

Una funzione grande spesso contiene molti livelli di dettaglio:

- normalizzazione input;
- validazione;
- calcolo;
- trasformazione;
- filtro;
- formattazione;
- side effects finali.

Quando tutto e nello stesso blocco, diventa difficile capire il flusso principale.

## Concetto chiave

Comporre funzioni significa far passare un valore attraverso piu trasformazioni, dove ogni trasformazione ha uno scopo chiaro.

Il lettore dovrebbe poter leggere i nomi delle funzioni e capire la storia generale prima di entrare nei dettagli.

## Dettagli importanti

- Le funzioni composte dovrebbero avere input e output compatibili.
- I nomi devono descrivere il ruolo del passaggio.
- La composizione funziona meglio con funzioni pure o con side effects confinati.
- La funzione di alto livello puo restare orchestration.
- La composizione non elimina la necessita di modellare bene i dati.

## Esempio

Codice poco leggibile:

```js
function getActiveCustomerEmails(customers) {
  return customers
    .filter((customer) => customer.active && customer.email)
    .map((customer) => customer.email.trim().toLowerCase())
    .filter((email) => email.includes("@"));
}
```

Versione composta con nomi espliciti:

```js
const isActiveCustomer = (customer) => customer.active && customer.email;
const normalizeEmail = (customer) => customer.email.trim().toLowerCase();
const isValidEmail = (email) => email.includes("@");

function getActiveCustomerEmails(customers) {
  return customers
    .filter(isActiveCustomer)
    .map(normalizeEmail)
    .filter(isValidEmail);
}
```

La seconda versione esplicita i concetti del dominio.

## Limiti

- Troppe funzioni minuscole con nomi deboli peggiorano la navigazione.
- Una composizione troppo astratta puo nascondere dettagli importanti.
- Debuggare catene molto lunghe puo essere scomodo.
- Non tutti gli algoritmi sono piu chiari se spezzati in pipeline.

## Errori comuni

- Estrarre funzioni solo per ridurre righe.
- Usare nomi generici come `process`, `handle`, `transform`.
- Comporre funzioni che mutano lo stesso oggetto in punti diversi.
- Nascondere side effects dentro passaggi che sembrano trasformazioni.
- Mescolare livelli di astrazione nella funzione orchestratrice.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Funzioni pure e impure|Funzioni pure e impure]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]
- [[Programmazione/Clean Code/Pagine/Pipeline di trasformazione|Pipeline di trasformazione]]
- [[Programmazione/Clean Code/Pagine/Trasformazioni dichiarative|Trasformazioni dichiarative]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
- Eric Elliott, *Composing Software*
