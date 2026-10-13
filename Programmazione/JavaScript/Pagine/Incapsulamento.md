---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - oop
  - encapsulation
  - private-fields
aliases:
  - Encapsulation JS
  - Incapsulamento JS
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Closures]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks]]"
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Closures]]"
  - "[[Programmazione/JavaScript/Pagine/Ereditarietà]]"
title: Incapsulamento
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

Gli esempi sono indipendenti. Per invariante si intende una regola che deve essere vera dopo ogni operazione pubblica: nascondere un campo non basta se i metodi accettano dati invalidi o espongono riferimenti mutabili.

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
Le closure permettono di nascondere binding nello scope lessicale, senza renderli proprieta dell'oggetto restituito.

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
I campi privati nativi si dichiarano con `#`. In questo esempio il saldo usa **centesimi interi non negativi**, non numeri decimali in euro; il deposito deve essere strettamente positivo. E un esempio di invariante, non un modello contabile completo.

```js
class BankAccount {
  #balance = 0;

  deposit(amountCents) {
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new RangeError("Deposito: intero sicuro positivo in centesimi");
    }

    const next = this.#balance + amountCents;
    if (!Number.isSafeInteger(next)) throw new RangeError("Saldo fuori intervallo");
    this.#balance = next;
  }

  getBalance() {
    return this.#balance;
  }
}
```

L'accesso diretto esterno `account.#balance` e un errore di sintassi; `account["#balance"]` indica invece un'eventuale proprieta pubblica con quel nome, non il campo privato. Il controllo numerico evita anche stringhe, `NaN`, infinito e overflow prima di modificare lo stato.

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
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError("Eta: intero sicuro non negativo richiesto");
    }

    this.#age = value;
  }
}
```

L'esempio definisce un'eta intera non negativa, senza imporre un massimo anagrafico. Se il dominio richiede altri limiti, vanno dichiarati e verificati. Un setter che controlla solo `value < 0` lascerebbe passare `NaN`, stringhe e molti altri valori non ammessi.

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

Significa decidere cosa puo essere usato dall'esterno e cosa resta dettaglio interno. La versione minima seguente mostra la forma dell'API, ma e **volutamente incompleta**: non valida i record e conserva l'oggetto del chiamante. Non usarla come implementazione protetta.

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

Il chiamante non deve sapere come gli item sono memorizzati. Questa prima versione pero permette di alterare il totale modificando `item.price` dopo `addItem`: il campo privato nasconde l'array, non rende privati tutti gli oggetti raggiungibili. La versione corretta segue sotto.

---

## Esempio pratico

Carrello con stato interno protetto. Ogni chiamata aggiunge una voce con `id` stringa non vuota e `priceCents` intero sicuro non negativo; non gestisce quantita, sconti, imposte o deduplicazione degli id.

```js
class Cart {
  #items = [];

  addItem(item) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new TypeError("Voce del carrello non valida");
    }
    const { id, priceCents } = item;
    if (typeof id !== "string" || id.trim() === "") {
      throw new TypeError("Id non vuoto richiesto");
    }
    if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
      throw new RangeError("Prezzo: intero sicuro non negativo in centesimi");
    }
    if (!Number.isSafeInteger(this.getTotal() + priceCents)) {
      throw new RangeError("Totale fuori intervallo");
    }
    this.#items.push({ id, priceCents });
  }

  getItems() {
    return this.#items.map((item) => ({ ...item }));
  }

  getTotal() {
    return this.#items.reduce((total, item) => total + item.priceCents, 0);
  }
}

const cart = new Cart();
const product = { id: "book", priceCents: 1200 };
cart.addItem(product);
product.priceCents = 1;
const snapshot = cart.getItems();
snapshot[0].priceCents = 2;
console.log(cart.getTotal()); // 1200, non 1 o 2
```

L'ingresso seleziona e copia solo due campi primitivi; l'uscita crea un nuovo array e nuovi record. Copiare soltanto l'array con `[...this.#items]` non sarebbe sufficiente: gli oggetti rimarrebbero condivisi. Se aggiungi campi annidati, devi definire anche per quelli una strategia di copia o immutabilita.

Il contratto riguarda record dati ordinari, per esempio derivati da JSON: leggere proprieta di un Proxy o getter puo eseguire codice del chiamante. L'incapsulamento non e una sandbox contro oggetti ostili.

### Privacy e immutabilita sono diverse

Un metodo pubblico puo modificare un campo privato anche dopo `Object.freeze(instance)`: freeze agisce sulle proprieta ordinarie, non sugli elementi privati. Inoltre una proprieta non scrivibile che contiene un oggetto non congela quell'oggetto. Vedi [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]] e [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks|Private Fields e Static Blocks]].

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


## Fonti

- [MDN: elementi privati e limiti](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements).
- [MDN: freeze e mutabilita annidata](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).
- [MDN: interi sicuri](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
