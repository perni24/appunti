---
date: 2026-02-24
tags: [javascript, programming, oop, classes]
type: #permanent-note
status: budding
---

# Classi in JavaScript

Le **Classi**, introdotte in ES6, forniscono una sintassi molto più chiara e concisa per creare oggetti e gestire l'ereditarietà. È importante ricordare che in JavaScript le classi sono principalmente "zucchero sintattico" sopra l'ereditarietà basata sui [[Programmazione/JavaScript/Pagine/Prototypes|prototipi]].

## 1. Sintassi Base

Una classe si definisce con la keyword `class` e include quasi sempre un metodo speciale `constructor()`, che viene eseguito automaticamente alla creazione di una nuova istanza.

```javascript
class Persona {
    constructor(nome, eta) {
        this.nome = nome; // Proprietà di istanza
        this.eta = eta;
    }

    // Metodo di istanza
    saluta() {
        console.log(`Ciao, mi chiamo ${this.nome}`);
    }
}

const luca = new Persona("Luca", 30);
luca.saluta(); // "Ciao, mi chiamo Luca"
```

## 2. Metodi Statici

I metodi definiti con la keyword `static` non appartengono alle istanze della classe, ma alla classe stessa. Vengono spesso usati per funzioni di utilità.

```javascript
class Matematica {
    static somma(a, b) {
        return a + b;
    }
}

console.log(Matematica.somma(5, 10)); // 15
// const m = new Matematica(); m.somma(5, 10); // ERRORE
```

## 3. Campi della Classe (Public & Private)

Nelle versioni più recenti di JS (ES2022+), possiamo definire proprietà direttamente nel corpo della classe.

- **Campi Pubblici**: Accessibili da chiunque.
- **Campi Privati**: Definiti con il prefisso `#`, sono accessibili **solo** all'interno della classe stessa.

```javascript
class ContoCorrente {
    #saldo = 0; // Campo privato

    deposita(importo) {
        this.#saldo += importo;
    }

    mostraSaldo() {
        console.log(`Il saldo è: ${this.#saldo}`);
    }
}

const mioConto = new ContoCorrente();
mioConto.deposita(100);
// console.log(mioConto.#saldo); // ERRORE: Campo privato
```

## 4. Getters e Setters

Permettono di definire metodi che vengono usati come se fossero proprietà, utili per validare i dati o calcolare valori al volo.

```javascript
class Rettangolo {
    constructor(larghezza, altezza) {
        this.larghezza = larghezza;
        this.altezza = altezza;
    }

    get area() {
        return this.larghezza * this.altezza;
    }

    set dimensione(valore) {
        if (valore <= 0) console.error("Valore non valido");
        else this.larghezza = this.altezza = valore;
    }
}
```

> [!NOTE] Classi vs Funzioni Costruttrici
> Sotto il cofano, `class Persona {}` crea una funzione chiamata `Persona` e aggiunge i metodi a `Persona.prototype`. La sintassi `class` rende il codice più leggibile e meno propenso a errori rispetto alla manipolazione manuale dei prototipi.

---
