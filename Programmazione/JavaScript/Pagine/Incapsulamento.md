---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, oop, encapsulation, private-fields]
aliases: [Encapsulation JS, Incapsulamento JS]
prerequisites: [Classi, Closures]
related: [Private Fields e Static Blocks, Classi, Closures, Ereditarietà]
---

# Incapsulamento

## Sintesi

L'incapsulamento consiste nel proteggere lo stato interno di un oggetto e nell'esporre solo un'API controllata.

Serve a mantenere invarianti, ridurre accoppiamento e rendere il codice piu facile da modificare.

---

## Quando usarlo

Usa incapsulamento quando uno stato interno deve rispettare regole e non deve essere modificato liberamente dall'esterno.

Casi comuni:

- conti, carrelli, sessioni e oggetti con invarianti;
- classi con stato mutabile;
- moduli che espongono una API pubblica;
- oggetti che devono evitare modifiche accidentali;
- refactor dove vuoi nascondere dettagli implementativi.

## Come funziona

### Convenzione con underscore
Prima dei private fields, spesso si usava `_` per indicare proprieta interne.

```js
class Account {
  constructor(balance) {
    this._balance = balance;
  }
}
```

Questa e solo una convenzione: il campo resta pubblico.

---
### Closure
Le closure permettono stato privato reale.

```js
function createCounter() {
  let count = 0;

  return {
    increment() {
      count += 1;
    },
    getCount() {
      return count;
    },
  };
}
```

`count` non e accessibile direttamente dall'esterno.

---
### Private fields
I campi privati nativi si dichiarano con `#`.

```js
class BankAccount {
  #balance = 0;

  deposit(amount) {
    if (amount <= 0) {
      throw new Error("Importo non valido");
    }

    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }
}
```

L'accesso esterno a `#balance` e un errore di sintassi.

---
### Getter e setter
Getter e setter permettono accesso controllato.

```js
class User {
  #age = 0;

  get age() {
    return this.#age;
  }

  set age(value) {
    if (value < 0) {
      throw new Error("Eta non valida");
    }

    this.#age = value;
  }
}
```

---
### Vantaggi
- Protegge invarianti interne.
- Riduce dipendenze da dettagli implementativi.
- Permette refactor senza rompere chiamanti.
- Rende esplicita l'API pubblica.
- Limita modifiche accidentali allo stato.

---

## API / Sintassi

### API pubblica
L'incapsulamento non significa nascondere tutto.

Significa decidere cosa puo essere usato dall'esterno e cosa resta dettaglio interno.

```js
class Cart {
  #items = [];

  addItem(item) {
    this.#items.push(item);
  }

  getTotal() {
    return this.#items.reduce((total, item) => total + item.price, 0);
  }
}
```

Il chiamante non deve sapere come gli item sono memorizzati.

---

## Esempio pratico

Carrello con stato interno protetto:

```js
class Cart {
  #items = [];

  addItem(item) {
    if (item.price < 0) {
      throw new Error("Prezzo non valido");
    }

    this.#items.push(item);
  }

  getItems() {
    return [...this.#items];
  }

  getTotal() {
    return this.#items.reduce((total, item) => total + item.price, 0);
  }
}
```

`getItems()` restituisce una copia superficiale, cosi il chiamante non puo modificare direttamente l'array interno.

## Varianti

- **Convenzione `_field`**: segnala intento, ma non protegge davvero.
- **Closure**: privacy reale tramite scope lessicale.
- **Private fields `#`**: privacy nativa nelle classi.
- **Getter/setter**: accesso controllato a valori.
- **Modulo ES**: esporta solo API pubblica.
- **Object.freeze**: impedisce modifiche superficiali a un oggetto.

## Errori comuni

- Credere che `_field` sia privato.
- Esporre direttamente strutture mutabili interne.
- Rendere privato tutto senza motivo.
- Usare getter e setter per nascondere logica pesante.
- Confondere incapsulamento con sicurezza contro codice ostile.

---

## Checklist

### Checklist operativa
- Esponi metodi che rappresentano operazioni di dominio.
- Proteggi solo lo stato che ha invarianti da preservare.
- Non restituire direttamente array o oggetti interni mutabili se possono rompere lo stato.
- Usa `#` quando serve privacy reale.
- Mantieni piccola l'API pubblica.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks|Private Fields e Static Blocks]]
- [[Programmazione/JavaScript/Pagine/Closures|Closures]]
- [[Programmazione/JavaScript/Pagine/Ereditarietà|Ereditarieta]]
