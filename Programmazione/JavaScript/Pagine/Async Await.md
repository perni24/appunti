---
date: 2026-02-20
tags: [javascript, programming, async]
type: #permanent-note
status: budding
---

# Async / Await in JavaScript

La sintassi **Async/Await** (introdotta in ES2017) è "zucchero sintattico" costruito sopra le [[Programmazione/JavaScript/Pagine/Promises|Promises]]. Permette di scrivere codice asincrono che sembra e si comporta in modo molto simile al codice sincrono, rendendolo estremamente più leggibile.

## 1. La keyword `async`

Viene posta davanti a una funzione. La sua presenza implica due cose:
1. La funzione restituirà **sempre** una Promise.
2. Se la funzione restituisce un valore semplice, questo viene automaticamente avvolto in una Promise risolta.

```javascript
async function saluta() {
    return "Ciao!";
}

saluta().then(msg => console.log(msg)); // "Ciao!"
```

## 2. La keyword `await`

Può essere usata **solo all'interno di funzioni `async`**.
- Sospende l'esecuzione della funzione fino a quando la Promise non viene risolta (o rifiutata).
- Restituisce direttamente il valore della Promise risolta, eliminando la necessità di usare `.then()`.

```javascript
async function mostraDati() {
    const risposta = await fetch('https://api.esempio.com/dati');
    const dati = await risposta.json();
    console.log(dati);
}
```

## 3. Gestione degli Errori con `try...catch`

A differenza delle Promises tradizionali che usano `.catch()`, con async/await usiamo il classico blocco `try...catch` della programmazione sincrona.

```javascript
async function caricaProfilo(id) {
    try {
        const utente = await ottieniUtente(id);
        const posts = await ottieniPost(utente.id);
        console.log(posts);
    } catch (errore) {
        console.error("Errore durante il caricamento:", errore);
    } finally {
        console.log("Operazione terminata");
    }
}
```

## 4. Perché usarlo?

> [!TIP] Leggibilità e Manutenibilità
> - **Codice Lineare**: Elimina il "nesting" del Callback Hell e il concatenamento lungo dei `.then()`.
> - **Debugging**: Gli errori stack trace sono più precisi e il debugging passo-passo è più naturale.
> - **Logica Complessa**: Gestire flussi condizionali asincroni (es: "se A aspetta B, altrimenti aspetta C") è molto più semplice.

---