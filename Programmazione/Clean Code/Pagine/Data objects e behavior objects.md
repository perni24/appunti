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
  - modellazione
  - oggetti
aliases:
  - Data objects e behavior objects
  - Data objects
  - Behavior objects
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Oggetti con responsabilita chiara]]"
  - "[[Programmazione/Clean Code/Pagine/Incapsulamento]]"
  - "[[Programmazione/Clean Code/Pagine/Value objects]]"
title: Data objects e behavior objects
---

# Data objects e behavior objects

## Sintesi

Un **data object** descrive dei dati; un **DTO** (*Data Transfer Object*) lo fa per trasportarli attraverso un confine. Un oggetto di dominio, invece, può decidere se un'operazione è ammessa e applicarla senza esporre i campi da modificare. La differenza è chi prende la decisione, non la presenza della parola `class`.

## Esempio: mostrare un saldo e spendere un credito

Il client deve mostrare il saldo dei crediti, ma non deve poter spendere lo stesso ultimo credito due volte sulla stessa istanza. Il costruttore valida il saldo; `spendOne` decide e aggiorna; `snapshot` restituisce soltanto i dati da trasmettere.

```ts
type CreditBalanceDto = { available: number };

class CreditBalance {
  #available: number;

  constructor(initial: number) {
    if (!Number.isSafeInteger(initial) || initial < 0) {
      throw new RangeError("Saldo iniziale non valido");
    }
    this.#available = initial;
  }

  spendOne(): boolean {
    if (this.#available === 0) return false;
    this.#available -= 1;
    return true;
  }

  snapshot(): CreditBalanceDto {
    return { available: this.#available };
  }
}
```

Partendo da 1, due chiamate a `spendOne()` restituiscono `true` e `false`; il saldo finale è 0. Un DTO ottenuto prima continua a mostrare 1. Scriverci `available = 100` cambia la copia, non autorizza una nuova spesa. Il DTO ha lo scopo di separare due contratti, non di autenticare i dati ricevuti dal client.

## Criterio di scelta

- Se devi soltanto proiettare o serializzare dati per un report, il DTO basta. Non ha senso inventare metodi per farlo sembrare un oggetto di dominio.
- Se la stessa decisione di spesa compare nel controller, nel job e nell'interfaccia, c'è il rischio che una copia dimentichi il controllo. Concentrala nel modello o in una funzione di dominio condivisa: non è obbligatorio adottare uno stile a classi.
- Due istanze caricate dallo stesso record non si coordinano tramite questo metodo. Per proteggere il saldo condiviso tra richieste serve anche una scrittura condizionata o una transazione con controllo della concorrenza nel sistema che lo conserva.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Clean Code|Clean Code]]
- [[Programmazione/Clean Code/Pagine/Oggetti con responsabilita chiara|Oggetti con responsabilita chiara]]
- [[Programmazione/Clean Code/Pagine/Value objects|Value objects]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]

## Fonti

- Martin Fowler, [Data Transfer Object](https://martinfowler.com/eaaCatalog/dataTransferObject.html) e *Anemic Domain Model*
- Eric Evans, *Domain-Driven Design*
