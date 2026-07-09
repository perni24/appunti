---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: avanzato
tags: [clean-code, concorrenza, race-condition]
aliases: [Race condition e leggibilita, Race conditions]
prerequisites: [Stato condiviso]
related: [Lock e sezioni critiche, Operazioni atomiche, Idempotenza]
---

# Race condition e leggibilita

## Sintesi

Una **race condition** si verifica quando il risultato dipende dall'ordine non garantito di operazioni concorrenti.

Nel Clean Code non basta usare primitivi di concorrenza: il codice deve rendere leggibile dove esistono rischi di interleaving.

## Problema che risolve

Le race condition sono difficili perche spesso:

- appaiono solo sotto carico;
- non si riproducono sempre;
- dipendono da timing;
- passano i test locali;
- vengono mascherate da retry o cache;
- causano dati corrotti senza crash evidente.

## Concetto chiave

Un codice concorrente leggibile mostra chiaramente:

- quale stato e condiviso;
- quale operazione deve essere indivisibile;
- quale lock, transazione o operazione atomica protegge il dato;
- cosa succede se due operazioni arrivano insieme.

La leggibilita riduce la probabilita di protezioni incomplete.

## Dettagli importanti

- La sequenza `read -> modify -> write` e spesso pericolosa.
- Le transazioni database sono una forma di protezione.
- I lock devono avere scope piccolo e nome chiaro.
- L'idempotenza riduce danni da retry e duplicati.
- I test concorrenti aiutano, ma non dimostrano assenza di race.

## Esempio

Fragile:

```js
const stock = await repository.getStock(productId);

if (stock > 0) {
  await repository.setStock(productId, stock - 1);
}
```

Due richieste possono leggere lo stesso stock e vendere piu pezzi del disponibile.

Piu sicuro:

```js
await repository.decrementStockIfAvailable(productId);
```

Il nome segnala che decremento e controllo devono essere un'unica operazione protetta.

## Limiti

- Alcune race sono a livello di sistema distribuito, non di singolo processo.
- Lock e transazioni possono ridurre throughput.
- Non tutte le incoerenze richiedono consistenza forte.
- Alcuni bug richiedono test sotto carico o analisi specifica.

## Errori comuni

- Proteggere solo una parte della sequenza critica.
- Usare lock troppo ampi e creare colli di bottiglia.
- Fare retry senza idempotenza.
- Ignorare concorrenza a livello database.
- Nascondere operazioni concorrenti dietro helper generici.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Stato condiviso]]
- [[Lock e sezioni critiche]]
- [[Operazioni atomiche]]
- [[Idempotenza]]
- [[Test di integrazione]]

## Fonti

- Brian Goetz, *Java Concurrency in Practice*
- Martin Kleppmann, *Designing Data-Intensive Applications*
- Michael Nygard, *Release It!*
