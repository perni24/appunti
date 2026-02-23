---
date: 2026-02-20
tags: [javascript, programming, async]
type: #permanent-note
status: budding
---

# Callback in JavaScript

Una **Callback** è una funzione passata come argomento a un'altra funzione, che verrà poi invocata all'interno della funzione contenitore per completare una qualche azione. Questo è possibile perché in JavaScript le funzioni sono **First-Class Citizens** (possono essere trattate come qualsiasi altra variabile).

## 1. Callback Sincrone

Vengono eseguite immediatamente, durante l'esecuzione della funzione principale.

```javascript
const numeri = [1, 2, 3];

// .forEach accetta una callback sincrona
numeri.forEach(function(num) {
    console.log(num * 2);
});

console.log("Finito!"); 
// Output: 2, 4, 6, Finito!
```

## 2. Callback Asincrone

Vengono eseguite dopo che un'operazione asincrona è stata completata (es. una richiesta di rete o un timer). Non bloccano l'esecuzione del resto del codice.

```javascript
console.log("Inizio");

setTimeout(() => {
    console.log("Callback eseguita dopo 2 secondi");
}, 2000);

console.log("Fine");
// Output: Inizio, Fine, (attesa), Callback eseguita dopo 2 secondi
```

## 3. Il problema: Callback Hell

Quando si concatenano molte operazioni asincrone dipendenti l'una dall'altra, il codice tende a spostarsi verso destra, diventando difficile da leggere, manutenere e debuggare. Questa struttura è nota come **Callback Hell** (o *Pyramid of Doom*).

```javascript
// Esempio ipotetico di Callback Hell
ottieniDatiUtente(id, (utente) => {
    ottieniPostUtente(utente.username, (posts) => {
        ottieniCommentiPost(posts[0].id, (commenti) => {
            console.log(commenti);
            // E così via...
        });
    });
});
```

> [!WARNING] Gestione degli errori
> Nelle callback, la gestione degli errori è complessa perché ogni livello deve gestire il proprio errore, spesso portando a codice ripetitivo e fragile.

---
