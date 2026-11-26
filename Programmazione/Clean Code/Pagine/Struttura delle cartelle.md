---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - cartelle
  - architettura
aliases:
  - Struttura delle cartelle
  - Folder structure
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Organizzazione dei file]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Moduli piccoli]]"
  - "[[Programmazione/Clean Code/Pagine/Confini tra moduli]]"
  - "[[Programmazione/Clean Code/Pagine/Convenzioni di progetto]]"
title: Struttura delle cartelle
---

# Struttura delle cartelle

## Sintesi

La struttura delle cartelle è una **mappa di navigazione**: stabilisce quale domanda porre per prima quando cerchi del codice. Una struttura per layer chiede «che tipo di lavoro fa?», una per feature «quale funzione del prodotto riguarda?». Nessuna delle due, da sola, impedisce dipendenze indesiderate.

## Esempio: gli stessi quattro file, due percorsi di ricerca

Un'applicazione accetta ordini e resi. In una struttura **per layer**, i due ingressi HTTP stanno insieme e le due regole di dominio anche:

```text
src/
  http/
    submit-order.mjs
    request-return.mjs
  domain/
    order-policy.mjs
    return-policy.mjs
```

In una struttura **per feature** si raggruppano l'ingresso e la regola di ciascun caso d'uso:

```text
src/
  orders/
    submit-order.mjs
    order-policy.mjs
  returns/
    request-return.mjs
    return-policy.mjs
```

Per cambiare la finestra di reso e la risposta HTTP quando è scaduta, la seconda mappa porta subito in `returns/`. Per uniformare gli header di tutti gli ingressi, la prima rende più facile trovarli insieme; se la decisione è davvero condivisa, può essere preferibile un unico middleware. **Il comportamento dei quattro file non cambia con il loro indirizzo.**

## Criteri di scelta

- **Per layer:** utile se molti interventi seguono la stessa responsabilità tecnica o il framework impone percorsi. Rischio: una singola feature si ricostruisce attraversando molte directory.
- **Per feature o area di dominio:** utile quando le richieste cambiano insieme per area. Non creare una feature per ogni schermata se più schermate condividono la stessa regola di dominio.
- **Ibrida:** puoi usare `orders/` come primo livello e separare `http/` e `domain/` al suo interno quando crescono davvero. Mantieni un solo criterio per livello, rispettando gli ingressi convenzionali del framework.
- **Condivisione:** estrai `shared/` solo se sai chi possiede il codice e quali dipendenze può avere. Se `shared/` importa da `orders/` e `orders/` importa da `shared/`, la nuova cartella ha nascosto un ciclo, non l'ha risolto.

## Prova prima di migrare

Prendi due modifiche recenti: segna dove le avresti cercate nelle due mappe. Se emerge un vantaggio, sposta **una sola area** senza cambiarne anche la logica; aggiorna import, discovery dei test, risorse e documentazione. Verifica gli ingressi pubblici da un consumatore. Se il progetto è piccolo e si naviga già bene, non c'è un problema da risolvere.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Organizzazione dei file|Organizzazione dei file]]
- [[Programmazione/Clean Code/Pagine/Moduli piccoli|Moduli piccoli]]
- [[Programmazione/Clean Code/Pagine/Confini tra moduli|Confini tra moduli]]
- [[Programmazione/Clean Code/Pagine/Convenzioni di progetto|Convenzioni di progetto]]
- [[Programmazione/Strutture di Progetto/Indice Strutture di Progetto|Strutture di progetto per linguaggio e utilizzo]]

## Fonti

- Martin Fowler, [Presentation Domain Data Layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html)
- Angular, [Style guide: Project structure](https://angular.dev/style-guide#project-structure)
- Robert C. Martin, *Clean Architecture*; Eric Evans, *Domain-Driven Design*
