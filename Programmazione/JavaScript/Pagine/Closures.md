---
date: 2026-02-19
tags: [javascript, programming, logic]
type: #permanent-note
status: budding
---

# Closures in JavaScript

Una **Closure** (chiusura) è una funzione che "si ricorda" dell'ambiente in cui è stata creata. Più tecnicamente, è la combinazione di una funzione e del suo **ambiente lessicale**, che consente alla funzione di accedere alle variabili di uno scope esterno anche dopo che tale scope ha terminato l'esecuzione.

## 1. Come Funzionano

In JavaScript, le funzioni hanno accesso alle variabili definite nel loro scope genitore (Lexical Scoping). Una closure si crea ogni volta che una funzione viene definita dentro un'altra funzione e quest'ultima viene restituita o passata altrove.

```javascript
function creaSaluto(nome) {
    const frase = `Ciao, ${nome}!`;
    
    return function() {
        // Questa funzione è una closure: "chiude" su 'frase'
        console.log(frase);
    };
}

const salutaLuca = creaSaluto("Luca");
salutaLuca(); // "Ciao, Luca!"
```

Anche se `creaSaluto` ha terminato l'esecuzione, la funzione interna mantiene il riferimento alla variabile `frase`.

## 2. Esempi Pratici

### Conservazione dello Stato (Contatori)
Le closures sono ideali per mantenere uno stato interno senza inquinare lo scope globale.

```javascript
function creaContatore() {
    let conteggio = 0;
    
    return function() {
        conteggio++;
        return conteggio;
    };
}

const counter = creaContatore();
console.log(counter()); // 1
console.log(counter()); // 2
```

### Variabili Private (Encapsulation)
Possiamo emulare metodi e variabili private, rendendole inaccessibili dall'esterno se non tramite funzioni specifiche.

```javascript
function banca(saldoIniziale) {
    let _saldo = saldoIniziale; // Variabile "privata" (per convenzione con _)

    return {
        deposita: function(importo) {
            _saldo += importo;
            console.log(`Saldo attuale: ${_saldo}`);
        },
        getSaldo: function() {
            return _saldo;
        }
    };
}

const mioConto = banca(100);
mioConto.deposita(50); // Saldo attuale: 150
console.log(mioConto._saldo); // undefined (non accessibile direttamente!)
```

## 3. Considerazioni sulle Performance

> [!CAUTION] Memory Leaks
> Poiché le closures mantengono i riferimenti alle variabili esterne, queste non possono essere rimosse dal **Garbage Collector** finché la closure stessa è in memoria. Un uso eccessivo o non curato può portare a un consumo elevato di memoria.

---