---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, database, repository-pattern]
aliases: [Repository pattern, Pattern Repository]
prerequisites: [Service layer, Dipendenze esplicite]
related: [Query leggibili, Migrazioni e schema evolution, Modellazione del dominio]
---

# Repository pattern

## Sintesi

Il **Repository pattern** incapsula l'accesso ai dati dietro un'interfaccia orientata al dominio o al caso d'uso.

Aiuta a separare logica applicativa e dettagli di persistenza come SQL, ORM, collezioni, indici e mapping.

## Problema che risolve

Quando query e dettagli database sono sparsi ovunque, il codice diventa difficile da cambiare:

- controller con SQL;
- service accoppiati a ORM specifici;
- duplicazione di query;
- mapping incoerenti;
- test lenti o fragili;
- regole di persistenza confuse con regole di dominio.

## Concetto chiave

Un repository dovrebbe esporre operazioni significative, non solo riflettere tabelle.

Esempi:

```text
findOrderById
saveInvoice
decrementStockIfAvailable
findPendingJobs
```

L'interfaccia deve rendere chiaro cosa il chiamante puo aspettarsi.

## Dettagli importanti

- Il repository puo nascondere SQL o ORM.
- Non deve diventare un wrapper passivo di ogni metodo database.
- Le query complesse possono meritare query object o reader dedicati.
- Le transazioni vanno coordinate a livello applicativo o unit of work.
- Il mapping tra database e dominio deve essere esplicito.

## Esempio

```js
async function reserveProduct(productId, productRepository) {
  const reserved = await productRepository.decrementStockIfAvailable(productId);

  if (!reserved) {
    return { ok: false, error: "out_of_stock" };
  }

  return { ok: true };
}
```

Il service non conosce la query concreta, ma richiede un'operazione atomica significativa.

## Limiti

- In CRUD semplici un repository puo essere eccessivo.
- Nascondere troppo l'ORM puo creare astrazioni deboli.
- Query di reportistica spesso non si adattano bene al modello repository classico.
- Non elimina la necessita di capire transazioni e performance database.

## Errori comuni

- Creare repository con metodi generici `get`, `set`, `update` senza intenzione.
- Restituire direttamente record database quando il chiamante si aspetta dominio.
- Nascondere query inefficienti dietro nomi innocui.
- Duplicare repository per ogni tabella senza criterio.
- Usare repository per evitare di progettare il modello.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Service layer]]
- [[Dipendenze esplicite]]
- [[Query leggibili]]
- [[Operazioni atomiche]]
- [[Modellazione del dominio]]

## Fonti

- Martin Fowler, *Repository*
- Eric Evans, *Domain-Driven Design*
- Martin Fowler, *Patterns of Enterprise Application Architecture*
