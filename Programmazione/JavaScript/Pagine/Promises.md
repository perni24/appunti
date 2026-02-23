---
date: 2026-02-20
tags: [javascript, programming, async]
type: #permanent-note
status: budding
---

# Promises in JavaScript

Una **Promise** è un oggetto che rappresenta l'eventuale completamento (o fallimento) di un'operazione asincrona e il suo valore risultante. È l'evoluzione delle callback per gestire l'asincronia in modo più pulito.

## 1. I Tre Stati di una Promise

Una Promise può trovarsi in uno di questi tre stati:
- **Pending (In sospeso)**: Stato iniziale, l'operazione asincrona è ancora in corso.
- **Fulfilled (Completata)**: L'operazione è terminata con successo e la promise ha un valore.
- **Rejected (Rifiutata)**: L'operazione è fallita e la promise ha un motivo (errore).

## 2. Consumare una Promise

Per gestire il risultato di una Promise, utilizziamo dei metodi specifici:

### `.then()`
Viene eseguito quando la Promise passa allo stato *Fulfilled*. Riceve il risultato dell'operazione.

```javascript
miaPromise.then((valore) => {
    console.log("Successo:", valore);
});
```

### `.catch()`
Viene eseguito quando la Promise passa allo stato *Rejected*. È fondamentale per la gestione degli errori.

```javascript
miaPromise.catch((errore) => {
    console.error("Errore:", errore);
});
```

### `.finally()`
Viene eseguito sempre, indipendentemente dall'esito (successo o fallimento). Utile per operazioni di pulizia (chiudere loader, resettare stati).

## 3. Promise Chaining

Uno dei vantaggi principali delle Promise è la possibilità di concatenarle. Ogni `.then()` restituisce a sua volta una nuova Promise, permettendo di scrivere codice asincrono sequenziale senza cadere nel "Callback Hell".

```javascript
ottieniUtente(1)
    .then(utente => ottieniPost(utente.id))
    .then(posts => ottieniCommenti(posts[0].id))
    .then(commenti => console.log(commenti))
    .catch(err => console.error("Qualcosa è andato storto:", err));
```

> [!TIP] Centralizzazione degli errori
> In una catena di `.then()`, un singolo `.catch()` alla fine può gestire gli errori che si verificano in **qualsiasi** punto della catena.

---