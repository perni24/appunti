---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - javascript
  - metaprogrammazione
  - classi
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Classi|Classi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Decorators|Decorators in TypeScript]]"
title: Decorators
---

# Decorators

## Sintesi

Un **decorator** e una funzione che interviene sulla definizione di una classe o di un suo elemento. Puo sostituire un metodo, trasformare un valore iniziale o registrare un'inizializzazione aggiuntiva. `@logged` non e un commento: esegue codice e puo cambiare il comportamento della classe.

Al controllo del **7 ottobre 2026**, il [registro TC39](https://github.com/tc39/proposals#stage-27) colloca Decorators in **Stage 2.7**, non tra le proposte concluse. I vecchi articoli che parlano di Stage 3 descrivono uno stato precedente. Non dedurre supporto nativo o semantica esatta dal solo nome della funzionalita.

Questa nota usa i **decorator moderni** trasformati con **esbuild 0.27.3**, non quelli legacy. Gli esempi compilati sono verificati in Node.js 24.14.0 e Chrome 154: questo non certifica il parsing nativo di `@` ne la conformita a ogni futura revisione della proposta.

## Quando usarlo

- Logging e misurazione ripetuti su piu metodi.
- Inizializzazione o validazione degli elementi di una classe, con un contratto preciso.
- Registrazione di metadati letti da un framework.
- Dependency injection, soltanto con un sistema che definisca come registrare e risolvere le dipendenze: `@` da solo non lo implementa.

Per un caso isolato, una funzione esplicita o la composizione possono essere piu leggibili. Autorizzazione, transazioni e gestione degli errori non devono diventare comportamenti nascosti impossibili da seguire dal punto di chiamata.

## Come funziona

### Definizione, inizializzazione e chiamata

Il decorator di metodo riceve la funzione originale e un oggetto `context`. La funzione restituita sostituisce il metodo; restituire `undefined` lo lascia invariato. Il decorator viene applicato durante la definizione della classe, mentre il wrapper viene eseguito a ogni chiamata.

```js
function logged(value, context) {
  if (context.kind !== "method") {
    throw new TypeError("logged richiede un metodo");
  }
  return function (...args) {
    console.log(`Calling ${String(context.name)}`);
    return value.apply(this, args);
  };
}

class Service {
  prefix = "report";

  @logged
  run(id) {
    return `${this.prefix}:${id}`;
  }
}

console.log(new Service().run(7)); // Calling run, poi report:7
```

La funzione normale mantiene il `this` del chiamante; una arrow catturerebbe quello della definizione. Il wrapper inoltra argomenti, valore restituito ed eccezioni sincrone. Se il metodo restituisce una Promise, inoltra **la stessa Promise**, senza attenderla. `String(context.name)` funziona anche con nomi Symbol.

Questo esempio assume che il logger non lanci errori: se `console.log` fallisce, il metodo non parte. Non registra automaticamente esito o durata di una Promise. Inoltre un metodo estratto dall'istanza continua a perdere il receiver, salvo un binding esplicito.

### Ambiente riproducibile

In una **directory demo separata**, con Node.js e npm disponibili, inizializza il progetto:

```sh
npm init -y
```

Installa la versione usata per questi esempi, non una promessa di versione piu recente:

```sh
npm install --save-dev --save-exact esbuild@0.27.3
```

Nel file `tsconfig.json` della demo rendi esplicita la modalita moderna. Queste opzioni interessano anche i file JavaScript elaborati da esbuild:

```json
{
  "compilerOptions": {
    "experimentalDecorators": false,
    "useDefineForClassFields": true
  }
}
```

Ogni blocco JS di questa nota e indipendente. Per eseguirne uno, usalo come contenuto di `demo.js` e compila:

```sh
npx --no-install esbuild demo.js --target=es2022 --format=esm --outfile=dist/demo.mjs --tsconfig=tsconfig.json
```

Il comando crea o sovrascrive solo l'output indicato. Poi esegui il file trasformato:

```sh
node dist/demo.mjs
```

Il target obbliga la trasformazione dei decorator, invece di lasciarli all'interprete. Non cambiare la configurazione di Quartz per provare la demo. Per il browser servi l'output e importalo come modulo; un polyfill da solo non insegna al parser a leggere `@`.

## API / Sintassi

### Contratto per elemento

| `context.kind` | Primo argomento | Risultato ammesso |
| --- | --- | --- |
| `class` | Costruttore | Costruttore sostitutivo o `undefined` |
| `method` | Funzione | Funzione sostitutiva o `undefined` |
| `getter` / `setter` | Funzione get o set | Funzione sostitutiva dello stesso ruolo o `undefined` |
| `field` | `undefined` | Funzione che trasforma il valore iniziale o `undefined` |
| `accessor` | Oggetto con `get` e `set` | Oggetto con `get`, `set`, `init` opzionali, oppure `undefined` |

Un campo non consegna il proprio valore al decorator durante la definizione della classe: e la **funzione inizializzatrice restituita** a riceverlo in seguito. Per i campi di istanza questo avviene a ogni costruzione; per quelli statici durante l'inizializzazione della classe.

| Membro di `context` | Significato |
| --- | --- |
| `name` | Nome dell'elemento, anche Symbol; una classe anonima puo non avere un nome significativo |
| `static`, `private` | Flag degli elementi, non proprieta da presumere su un decorator di classe |
| `access` | Operazioni disponibili sull'elemento, per esempio `get(object)` o `set(object, value)`; non presenti tutte per ogni tipo |
| `addInitializer(fn)` | Registra una funzione da eseguire nella fase di inizializzazione appropriata |
| `metadata` | Oggetto per metadati, se implementato/configurato dal toolchain; vedi la sezione dedicata |

I decorator moderni qui trattati non decorano parametri, funzioni libere o variabili locali. Non sono intercambiabili con funzioni che ricevono `(target, key, descriptor)`.

### Ordine dei decorator

Per due decorator sullo **stesso metodo**, le espressioni sono valutate dall'alto verso il basso, ma i decorator vengono applicati dal basso verso l'alto. Il wrapper esterno riceve il risultato di quello interno:

```js
const trace = [];

function layer(label) {
  trace.push(`evaluate:${label}`);
  return function (value, context) {
    if (context.kind !== "method") throw new TypeError("Solo metodi");
    trace.push(`apply:${label}`);
    return function (...args) {
      trace.push(`enter:${label}`);
      try {
        return value.apply(this, args);
      } finally {
        trace.push(`exit:${label}`);
      }
    };
  };
}

class Task {
  @layer("outer")
  @layer("inner")
  run() { trace.push("body"); }
}

new Task().run();
console.log(trace.join(", "));
// evaluate:outer, evaluate:inner, apply:inner, apply:outer,
// enter:outer, enter:inner, body, exit:inner, exit:outer
```

Non estendere questo ordine a tutti gli elementi della classe: definizione, applicazione dei decorator, campi statici e inizializzatori sono fasi diverse. Un errore durante l'applicazione puo interrompere la definizione prima che esista una nuova istanza.

## Esempio pratico

### Misura sincrona e asincrona

Un `finally` sincrono misura solo il tempo fino al ritorno della funzione, non fino al completamento della Promise restituita. Servono due contratti distinti:

```js
function recordDuration(name, start) {
  try {
    console.log(`${String(name)}: ${performance.now() - start} ms`);
  } catch {
    // Diagnostica best effort: non sostituire l'esito del metodo.
  }
}

function timedSync(value, context) {
  if (context.kind !== "method") throw new TypeError("Solo metodi");
  return function (...args) {
    const start = performance.now();
    try {
      return value.apply(this, args);
    } finally {
      recordDuration(context.name, start);
    }
  };
}

function timedAsync(value, context) {
  if (context.kind !== "method") throw new TypeError("Solo metodi");
  return async function (...args) {
    const start = performance.now();
    try {
      return await value.apply(this, args);
    } finally {
      recordDuration(context.name, start);
    }
  };
}

class ReportService {
  @timedSync
  generate() {
    return "report";
  }

  @timedAsync
  async load() {
    await Promise.resolve();
    return "loaded";
  }
}

console.log(new ReportService().generate());
const loaded = new ReportService().load();
loaded.then((result) => console.log(result));
```

`return await` tiene aperto il `try` fino all'esito: misura sia risoluzione sia rifiuto. Il wrapper async restituisce **una nuova Promise** e trasforma anche un throw sincrono in un rifiuto; non preserva l'identita della Promise originale. Il chiamante deve gestire i rifiuti dei metodi che possono fallire; la demo risolve senza errori.

`performance` e un prerequisito del runtime. Il logger e deliberatamente best effort, mentre la lettura iniziale dell'orologio non viene protetta. La durata comprende attese e scheduling, non solo CPU; non e un benchmark e i millisecondi non hanno un valore atteso fisso.

### Campo: validazione soltanto all'inizio

```js
function nonNegativeField(value, context) {
  if (context.kind !== "field") throw new TypeError("Solo campi");
  return function (initialValue) {
    if (!Number.isSafeInteger(initialValue) || initialValue < 0) {
      throw new RangeError("Atteso un intero sicuro non negativo");
    }
    return initialValue;
  };
}

class CounterField {
  @nonNegativeField
  count = 0;
}

const fieldCounter = new CounterField();
fieldCounter.count = -1;
console.log(fieldCounter.count); // -1: il decorator non intercetta la scrittura
```

Per validare ogni assegnazione serve un setter, non soltanto un inizializzatore. Un campo decorato rimane un campo.

### Auto-accessor: validazione delle assegnazioni

`accessor` crea un getter/setter con uno slot di memorizzazione privato. Il decorator puo sostituire il setter e trasformare l'inizializzazione:

```js
function nonNegativeAccessor(value, context) {
  if (context.kind !== "accessor") throw new TypeError("Solo auto-accessor");
  function validate(input) {
    if (!Number.isSafeInteger(input) || input < 0) {
      throw new RangeError("Atteso un intero sicuro non negativo");
    }
    return input;
  }
  return {
    init(initialValue) { return validate(initialValue); },
    set(nextValue) { value.set.call(this, validate(nextValue)); },
  };
}

class CounterAccessor {
  @nonNegativeAccessor
  accessor count = 0;
}

const accessorCounter = new CounterAccessor();
accessorCounter.count = 2;
try {
  accessorCounter.count = -1;
} catch (error) {
  console.log(error.name); // RangeError
}
console.log(accessorCounter.count); // 2: valore precedente conservato
console.log(Object.keys(accessorCounter)); // []
```

Il getter originale resta invariato perche non lo sostituiamo. `count` non e piu un campo proprio enumerabile: spread, `Object.keys` e `JSON.stringify` non lo includono automaticamente. La convalida riguarda gli accessi normali al setter, non e una barriera contro codice che ridefinisce le proprieta. Lo slot privato richiede un receiver compatibile: avvolgere l'istanza in un Proxy generico puo rompere l'accesso.

### addInitializer e binding per istanza

Un inizializzatore di **metodo di istanza** viene eseguito prima dei campi della propria classe. Puo installare una funzione bound, ma non deve leggere campi non ancora inizializzati. In una classe derivata questa fase avviene dopo il ritorno di `super()`.

```js
function bound(value, context) {
  if (context.kind !== "method" || context.static || context.private) {
    throw new TypeError("bound richiede un metodo pubblico di istanza");
  }
  context.addInitializer(function () {
    Object.defineProperty(this, context.name, {
      value: this[context.name].bind(this),
      writable: true,
      configurable: true,
      enumerable: false,
    });
  });
}

class ButtonModel {
  label = "Save";

  @bound
  click() { return this.label; }
}

const button = new ButtonModel();
const callback = button.click;
console.log(callback()); // Save
console.log(callback === button.click); // true
```

Il binding legge il metodo finale dell'istanza, inclusi eventuali altri wrapper, e crea una funzione per istanza. Per rimuovere un listener conserva quel riferimento. La demo non prevede un campo omonimo o override in sottoclassi: questi possono sovrascrivere il binding o cambiare la funzione selezionata.

Non confondere `addInitializer` con l'inizializzatore restituito da un decorator di campo: quest'ultimo trasforma il valore; il callback aggiuntivo viene eseguito dopo l'inizializzazione di quel campo. Per una classe, il callback registrato dal decorator gira dopo i suoi campi statici. `addInitializer` va chiamato durante l'applicazione del decorator, non piu tardi da un timer o da un suo metodo.

## Varianti

### Moderni e legacy non sono due nomi della stessa API

| Aspetto | Moderni usati qui | Legacy TypeScript |
| --- | --- | --- |
| Metodo | `(value, context)` | `(target, key, descriptor)` |
| Configurazione TS | `experimentalDecorators` assente o `false` | `experimentalDecorators: true` |
| Parametri | Non decorabili con questa proposta | Supportati dalla modalita legacy |
| Metadati dei tipi TS | Non emessi automaticamente | `emitDecoratorMetadata` in un toolchain compatibile |

TypeScript supporta i decorator moderni da 5.0, ma il vecchio flag continua a selezionare quelli legacy. `emitDecoratorMetadata` non e compatibile con il modello moderno. esbuild non emette quei metadati dei tipi neanche per il codice legacy: accettare la sintassi non equivale a fornire tutte le funzionalita di `tsc`.

In Babel il plugin distingue revisioni esplicite, per esempio `version: "2023-11"`, e `legacy`. Quell'etichetta identifica una semantica implementata, non la data dell'ultimo standard. Controlla anche le librerie del framework prima di cambiare modalita: una migrazione puo richiedere decorator riscritti, non solo un flag.

### Metadati: oggetti espliciti, non tipi riflessi

La proposta separata Decorator Metadata permette ai decorator di una classe di condividere `context.metadata`, poi esposto su `Class[Symbol.metadata]`. Non crea uno schema di validazione e non recupera automaticamente i tipi TypeScript cancellati dalla compilazione.

Esempio autonomo con bootstrap **prima** della classe decorata, usando lo stesso simbolo condiviso dal toolchain della demo:

```js
Symbol.metadata ??= Symbol.for("Symbol.metadata");

function category(label) {
  if (typeof label !== "string" || label.length === 0) {
    throw new TypeError("Categoria non vuota richiesta");
  }
  return function (value, context) {
    if (context.kind !== "class" || !context.metadata) {
      throw new TypeError("Decorator di classe con metadata richiesto");
    }
    context.metadata.category = label;
  };
}

@category("service")
class Catalog {}

console.log(Catalog[Symbol.metadata].category); // service
```

Il bootstrap aggiunge una chiave a `Symbol` se assente, non implementa da solo il protocollo dei decorator. In un progetto reale deve essere una scelta condivisa tra i moduli. Una riga prima di un **import statico** non basta, perche le dipendenze sono valutate prima del corpo del modulo: usa un modulo di bootstrap caricato prima delle classi, oppure un import dinamico successivo.

Gli oggetti metadata possono ereditare da quelli della classe base. Assegnare una nuova proprieta e diverso dal mutare un array ereditato: per collezioni usa una copia prima di aggiungere elementi, se non vuoi modificare anche la base. Non conservarvi segreti; concedere `context.access` su elementi privati a codice esterno concede un accesso effettivo.

La libreria `reflect-metadata` dell'ecosistema legacy e un protocollo distinto: non sostituisce automaticamente `context.metadata` o `Symbol.metadata`. Il decorator di classe qui lascia il costruttore invariato; sostituirlo richiede considerare identita, ereditarieta, costruttore e membri statici, soprattutto quelli privati.

## Errori comuni

- Copiare un decorator legacy in una configurazione moderna, o viceversa.
- Usare una arrow come wrapper quando serve preservare il receiver.
- Restituire un valore di tipo errato, per esempio un numero al posto di un metodo.
- Pensare che un decorator di campo intercetti anche le scritture successive.
- Misurare una Promise con un `finally` sincrono, oppure dimenticare che il wrapper async cambia l'identita del risultato.
- Generalizzare l'ordine dei decorator a tutto il ciclo di inizializzazione.
- Aspettarsi che metadata, dependency injection o supporto nativo compaiano solo perche il codice compila.

## Checklist

- Semantica e versione del compilatore sono esplicite e bloccate nel lockfile?
- Il decorator controlla il tipo di elemento e documenta static/private?
- Sono preservati this, argomenti, ritorno ed errori? Quali differenze sono intenzionali?
- Sono testati ordine di composizione, inizializzazione e casi asincroni?
- Logger e metadati non introducono errori o esposizione di dati inattesa?
- L'output compilato funziona nel runtime di destinazione, indipendentemente dal supporto nativo di `@`?

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Classi|Classi]]
- [[Programmazione/JavaScript/Pagine/Proxy e Reflect|Proxy e Reflect]]
- [[Programmazione/JavaScript/Pagine/Property Descriptors|Property Descriptors]]
- [[Programmazione/TypeScript/Pagine/Decorators|Decorators in TypeScript]]

## Fonti

- [TC39 - Decorators proposal](https://github.com/tc39/proposal-decorators)
- [TC39 - ECMAScript proposals](https://github.com/tc39/proposals)
- [TC39 - Decorator Metadata](https://github.com/tc39/proposal-decorator-metadata)
- [TypeScript 5.0 - Decorators](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#decorators)
- [TypeScript 5.2 - Decorator Metadata](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#decorator-metadata)
- [esbuild - JavaScript e TypeScript](https://esbuild.github.io/content-types/)
- [Babel - Plugin proposal decorators](https://babeljs.io/docs/babel-plugin-proposal-decorators)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
