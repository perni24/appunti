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
  - inheritance
  - classes
  - prototypes
aliases:
  - Ereditarieta JS
  - Inheritance JavaScript
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Prototypes]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Classi]]"
  - "[[Programmazione/JavaScript/Pagine/Incapsulamento]]"
  - "[[Programmazione/JavaScript/Pagine/Prototypes]]"
  - "[[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks]]"
title: Ereditarieta
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

Gli esempi con `Report` sono varianti alternative della stessa sottoclasse: eseguili separatamente, mantenendo la classe base `Document` del primo esempio. Non ridefinire la stessa classe nello stesso scope.

### `extends`
```js
class Document {
  constructor(title) {
    this.title = title;
  }

  describe() {
    return `Documento: ${this.title}`;
  }
}

class Report extends Document {
  format() {
    return "report";
  }
}

const report = new Report("Vendite");

console.log(report.describe()); // "Documento: Vendite"
console.log(report.format()); // "report"
```

`Report.prototype` delega a `Document.prototype`. I metodi non vengono copiati nelle istanze. Se manca il costruttore della sottoclasse, il costruttore predefinito inoltra gli argomenti alla base.

---
### `super` nel costruttore
Se una sottoclasse definisce `constructor`, deve chiamare `super()` prima di usare `this`.

```js
class Report extends Document {
  constructor(title, period) {
    super(title);
    this.period = period;
  }
}
```

`super(title)` esegue il costruttore della base per inizializzare l'istanza derivata. Puoi eseguire istruzioni che non usano `this` prima di `super`, ma leggere `this` prima produce `ReferenceError`. Il percorso ordinario deve chiamare `super` una sola volta.

Esiste un caso avanzato in cui un costruttore derivato restituisce esplicitamente un altro oggetto senza usare `this`: non e il modello adottato qui. Un ritorno di un primitivo diverso da `undefined` dalla sottoclasse genera `TypeError`.

---
### `super` nei metodi
`super` puo richiamare metodi della classe base.

```js
class Report extends Document {
  describe() {
    return `${super.describe()} (report)`;
  }
}
```

Questo consente di estendere un comportamento invece di riscriverlo completamente. `super.describe()` cerca il metodo sulla base ma lo chiama con il `this` corrente, cioe l'istanza derivata: non crea un secondo oggetto "genitore".

`super` non legge i campi di istanza della base come se fossero sul prototipo:

```js
class BaseView {
  label = "base";
  readLabel() { return this.label; }
}

class DetailView extends BaseView {
  label = "detail";
  inspect() {
    return [super.readLabel(), super.label];
  }
}

console.log(new DetailView().inspect()); // ["detail", undefined]
```

La destinazione di ricerca di `super` dipende da dove il metodo e definito; il receiver resta quello della chiamata. Nei metodi statici `super.method()` cerca invece nella catena dei costruttori.

---
### Override
Una sottoclasse puo ridefinire un metodo della classe base.

```js
class Memo extends Document {
  describe() {
    return `Promemoria: ${this.title}`;
  }
}
```

Quando il metodo viene chiamato sull'istanza, JavaScript usa la versione piu vicina nella prototype chain.

Rispetta il contratto della base: cambiare arbitrariamente tipo del risultato, significato dei parametri o errori puo rompere chi usa la sottoclasse come un `Document`. Evita chiamate a metodi sovrascrivibili dal costruttore base: i campi della derivata non sono ancora inizializzati durante quel costruttore.

---
### Prototype chain
```js
console.log(Object.getPrototypeOf(Report.prototype) === Document.prototype); // true
console.log(Object.getPrototypeOf(Report) === Document); // true
```

La catena e:

- istanza;
- `Report.prototype`;
- `Document.prototype`;
- `Object.prototype`;
- `null`.

La seconda uguaglianza riguarda invece la catena dei costruttori, che rende raggiungibili i membri statici pubblici della base. Un campo statico oggetto ereditato non viene clonato per sottoclasse; i campi statici privati non sono accessibili tramite il receiver della derivata.

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

function createJob(name, logger) {
  return {
    run() {
      logger.log(`Esecuzione: ${name}`);
      return name;
    },
  };
}

const job = createJob("backup", createLogger("jobs"));
job.run(); // stampa "[jobs] Esecuzione: backup"
```

Il job **ha un** logger, non **e un** logger. Il contratto del collaboratore e un metodo `log(message)`; puoi fornirne uno diverso nei test senza una nuova sottoclasse del job.

---

## API / Sintassi

Sintassi base schematica: presuppone una classe `Parent` con costruttore e metodo compatibili.

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
  constructor(message, status, options = {}) {
    super(message, options);
    if (!Number.isInteger(status) || status < 400 || status > 599) {
      throw new RangeError("Stato HTTP di errore richiesto");
    }
    this.name = "ApiError";
    this.status = status;
  }
}

class NotFoundError extends ApiError {
  constructor(message = "Risorsa non trovata", options = {}) {
    super(message, 404, options);
    this.name = "NotFoundError";
  }
}

const cause = new Error("Record assente");
const error = new NotFoundError("Utente non trovato", { cause });
console.log(error instanceof ApiError); // true
console.log(error instanceof Error); // true
console.log(error.status); // 404
console.log(error.cause === cause); // true
```

Qui `NotFoundError` e un tipo specifico di `ApiError`, quindi l'ereditarieta ha un significato chiaro. Il contratto di `ApiError` accetta stati HTTP 400-599. L'opzione `cause` conserva l'errore originale senza sostituirne la provenienza; `name` rende riconoscibile il tipo nei messaggi, ma non sostituisce un controllo affidabile dei dati ricevuti dall'esterno.

## Varianti

### Limiti
JavaScript non ha ereditarieta multipla tra classi.

Inoltre i private fields della classe base non sono accessibili direttamente dalla sottoclasse.

```js
class Base {
  #value = 1;

  getValue() {
    return this.#value;
  }
}

class Child extends Base {
  read() {
    // this.#value qui sarebbe SyntaxError: nome privato della base
    return this.getValue();
  }
}

console.log(new Child().read()); // 1
```

La parte privata della base e installata anche sull'istanza derivata, e i metodi della base possono usarla. La sottoclasse non puo nominare direttamente quel campo; dichiarare un altro `#value` crea un nome privato distinto. I metodi esposti come sopra sono pubblici anche per altri chiamanti: JavaScript non ha `protected` nativo.

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


## Fonti

- [MDN: extends e costruttori derivati](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends).
- [MDN: super e receiver](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super).
- [MDN: Error e opzione cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error).
- [MDN: elementi privati](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
