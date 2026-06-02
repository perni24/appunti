---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, oop, inheritance, classes, prototypes]
aliases: [Ereditarieta JS, Inheritance JavaScript]
prerequisites: [Classi, Prototypes]
related: [Classi, Incapsulamento, Prototypes, Private Fields e Static Blocks]
---

# Ereditarieta

## Sintesi

L'ereditarieta permette a una classe di specializzare o riusare comportamento di un'altra classe.

In JavaScript l'ereditarieta delle classi usa `extends` e `super`, ma il meccanismo sottostante resta la prototype chain.

---

## Quando usarlo

Usa ereditarieta quando una classe specializzata e davvero un tipo piu specifico della classe base e deve rispettarne il contratto.

Casi adatti:

- gerarchie piccole e stabili;
- API dove la classe base definisce comportamento comune;
- specializzazioni che condividono invarianti;
- framework che richiedono estensione di classi.

Evitala se vuoi solo riusare qualche metodo: composizione, funzioni o moduli sono spesso piu flessibili.

## Come funziona

### `extends`
```js
class Animal {
  constructor(name) {
    this.name = name;
  }

  eat() {
    return `${this.name} sta mangiando`;
  }
}

class Dog extends Animal {
  bark() {
    return "bau";
  }
}

const dog = new Dog("Fido");

console.log(dog.eat());
console.log(dog.bark());
```

`Dog` eredita i metodi definiti su `Animal.prototype`.

---
### `super` nel costruttore
Se una sottoclasse definisce `constructor`, deve chiamare `super()` prima di usare `this`.

```js
class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
}
```

`super(name)` chiama il costruttore della classe base.

---
### `super` nei metodi
`super` puo richiamare metodi della classe base.

```js
class Dog extends Animal {
  eat() {
    return `${super.eat()} con entusiasmo`;
  }
}
```

Questo consente di estendere un comportamento invece di riscriverlo completamente.

---
### Override
Una sottoclasse puo ridefinire un metodo della classe base.

```js
class Cat extends Animal {
  eat() {
    return `${this.name} mangia con calma`;
  }
}
```

Quando il metodo viene chiamato sull'istanza, JavaScript usa la versione piu vicina nella prototype chain.

---
### Prototype chain
```js
console.log(Object.getPrototypeOf(Dog.prototype) === Animal.prototype); // true
```

La catena e:

- istanza;
- `Dog.prototype`;
- `Animal.prototype`;
- `Object.prototype`;
- `null`.

---
### Composizione vs ereditarieta
Usa ereditarieta quando esiste una relazione "e un tipo di".

Usa composizione quando vuoi combinare comportamenti senza creare gerarchie rigide.

```js
function createLogger(target) {
  return {
    log(message) {
      console.log(`[${target}] ${message}`);
    },
  };
}
```

Nel dubbio, composizione tende a essere piu flessibile.

---

## API / Sintassi

Sintassi base:

```js
class Child extends Parent {
  constructor(value) {
    super(value);
  }

  method() {
    return super.method();
  }
}
```

Concetti:

```js
child instanceof Child;
child instanceof Parent;
Object.getPrototypeOf(Child.prototype) === Parent.prototype;
```

`super()` e obbligatorio nel costruttore di una sottoclasse prima di usare `this`.

## Esempio pratico

Specializzare una classe base:

```js
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

class NotFoundError extends ApiError {
  constructor(message = "Risorsa non trovata") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}
```

Qui `NotFoundError` e un tipo specifico di `ApiError`, quindi l'ereditarieta ha un significato chiaro.

## Varianti

### Limiti
JavaScript non ha ereditarieta multipla tra classi.

Inoltre i private fields della classe base non sono accessibili direttamente dalla sottoclasse.

```js
class Base {
  #value = 1;
}

class Child extends Base {
  read() {
    // this.#value non e valido
  }
}
```

Se serve accesso controllato, esponi metodi pubblici o usa convenzioni esplicite.

---

## Errori comuni

- Usare ereditarieta per semplice riuso di codice.
- Dimenticare `super()` prima di `this`.
- Creare gerarchie troppo profonde.
- Pensare che i private fields siano visibili alle sottoclassi.
- Sovrascrivere metodi senza rispettare il contratto della classe base.

---

## Checklist

### Checklist operativa
- Usa `extends` solo per relazioni chiare.
- Mantieni gerarchie basse.
- Chiama `super()` prima di usare `this`.
- Documenta metodi pensati per override.
- Valuta composizione prima di aggiungere nuove sottoclassi.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Prototypes|Prototypes]]
- [[Programmazione/JavaScript/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks|Private Fields e Static Blocks]]
