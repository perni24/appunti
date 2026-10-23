---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - typescript
  - decorators
  - metaprogramming
  - classes
aliases:
  - Decorator TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Classi]]"
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Visibilita e modificatori di accesso]]"
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Node.js]]"
title: Decorators
---

# Decorators

## Sintesi

I decorators sono funzioni applicate a classi o loro membri per aggiungere comportamento, sostituire un'implementazione o registrare informazioni. In TypeScript bisogna distinguere **decorators moderni** e **decorators legacy**: la sintassi con `@` puo somigliare, ma firme e semantica non coincidono.

Baseline: **TypeScript 5.9.3**, `strict: true`, target `ES2022`; runtime verificato con Node.js **24.14.0** dopo compilazione. Questo non implica supporto nativo dei decorators nel motore JavaScript.

## Quando usarlo

- Implementare comportamento trasversale richiesto dall'architettura o da un framework.
- Avvolgere un metodo mantenendone parametri, ritorno e `this`.
- Comprendere inizializzazione e registrazione di classi.
- Verificare la compatibilita di un framework prima di cambiare configurazione.

Per un singolo caso, una funzione wrapper esplicita puo essere piu facile da leggere e testare.

## Come funziona

### Due modalita da non mescolare

- **Moderna**: disponibile da TypeScript 5.0 senza `experimentalDecorators: true`. Un decorator di metodo riceve il metodo e un oggetto `context`; puo restituire un metodo sostitutivo.
- **Legacy**: attivata con `experimentalDecorators: true`. Un decorator di metodo riceve target, chiave e descriptor.
- I decorators moderni non supportano decorators sui parametri e non sono compatibili con `emitDecoratorMetadata`.
- Un decorator compatibile con una modalita non e automaticamente compatibile con l'altra.

Le firme cambiano anche in base al membro: classe, metodo, field, getter, setter e auto-accessor non sono intercambiabili. `context` descrive il membro, per esempio `kind`, `name`, `static` e `private`. `addInitializer` permette di registrare inizializzazione aggiuntiva, con tempi dipendenti dal tipo di elemento; non e un hook eseguito a ogni chiamata.

## API / Sintassi

### Decorator moderno tipizzato

Il blocco seguente e autonomo. Salvarlo come `modern.cts` in un progetto con TypeScript 5.9.3 installato:

```ts
function loggedMethod<This, Args extends unknown[], Return>(
  original: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Return
  >,
) {
  return function(this: This, ...args: Args): Return {
    console.log("Calling " + String(context.name));
    return original.call(this, ...args);
  };
}

class Service {
  constructor(private prefix: string) {}

  @loggedMethod
  run(name: string): string {
    return this.prefix + name;
  }
}

console.log(new Service("job:").run("build"));
// Calling run
// job:build
```

`This`, `Args` e `Return` conservano il contratto del metodo. Una firma generica `Function` non esprime queste relazioni. Il wrapper inoltra il ricevitore con `call`, non intercetta errori e restituisce il risultato senza convertirlo: se e una Promise, rimane la stessa Promise.

Il decorator non lega automaticamente il metodo all'istanza. Estrarre `const run = service.run` e chiamarlo senza ricevitore resta un problema di `this`.

Compilare il solo file:

```sh
npm exec -- tsc modern.cts --strict --target ES2022 --module NodeNext --outDir dist-modern --noEmitOnError
```

Eseguire:

```sh
node dist-modern/modern.cjs
```

Passare il file esplicitamente usa le opzioni CLI, non il `tsconfig.json` del progetto in questa baseline. Il suffisso `.cts` produce `.cjs`, evitando ambiguita sul tipo di modulo.

## Esempio pratico

### Ordine di valutazione e applicazione

Questo e un secondo esempio indipendente, in modalita moderna:

```ts
function mark(label: string) {
  console.log("evaluate " + label);
  return function<This, Args extends unknown[], Return>(
    original: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Return
    >,
  ) {
    console.log("apply " + label + ":" + String(context.name));
    return original;
  };
}

class Job {
  @mark("outer")
  @mark("inner")
  run(): string {
    return "done";
  }
}

console.log(new Job().run());
// evaluate outer
// evaluate inner
// apply inner:run
// apply outer:run
// done
```

Le espressioni dei decorators sullo stesso elemento vengono valutate dall'alto verso il basso; i decorators vengono applicati dal basso verso l'alto. Nell'esempio avviene durante la definizione della classe, non quando si chiama `run`. Se i decorators restituiscono wrapper, anche il loro ordine di composizione conta.

## Varianti

### Un field decorator non e un validatore permanente

Esempio moderno indipendente:

```ts
function trimmed<This>(
  _value: undefined,
  _context: ClassFieldDecoratorContext<This, string>,
) {
  return function(initial: string): string {
    return initial.trim();
  };
}

class Title {
  @trimmed
  text = "  ready  ";
}

const title = new Title();
console.log(title.text); // ready
title.text = "  later  ";
console.log(title.text); // conserva gli spazi
```

Il valore restituito dal decorator trasforma l'inizializzazione del campo per ciascuna istanza. Non intercetta le assegnazioni successive: per quelle serve un'altra API, per esempio un setter con controlli espliciti.

### Decorator legacy

Esempio autonomo per `legacy.cts`, distinto dai precedenti. Il decorator e intenzionalmente limitato a metodi senza argomenti che restituiscono stringhe:

```ts
function legacyLogged(
  _target: object,
  key: string | symbol,
  descriptor: TypedPropertyDescriptor<() => string>,
): void {
  const original = descriptor.value;
  if (!original) throw new TypeError("Expected a method");

  descriptor.value = function(this: object): string {
    console.log("Legacy " + String(key));
    return original.call(this);
  };
}

class LegacyService {
  @legacyLogged
  run(): string {
    return "ok";
  }
}

console.log(new LegacyService().run());
// Legacy run
// ok
```

Compilare in modalita legacy:

```sh
npm exec -- tsc legacy.cts --strict --target ES2022 --module NodeNext --experimentalDecorators --outDir dist-legacy --noEmitOnError
```

Eseguire:

```sh
node dist-legacy/legacy.cjs
```

Non attivare `experimentalDecorators` pensando che abiliti una versione piu potente dei decorators moderni: seleziona la diversa implementazione legacy.

### Metadati e framework

`emitDecoratorMetadata` riguarda la modalita legacy. Per le API di lettura comunemente usate serve anche un runtime come `reflect-metadata`; l'opzione del compilatore non lo installa. I metadati emessi non conservano tutta la struttura di union, interfacce e generics e non validano JSON.

I metadati dei decorators moderni, supportati dal compilatore da TypeScript 5.2, usano un meccanismo diverso basato su `context.metadata` e `Symbol.metadata`. Tipi di libreria e disponibilita runtime devono essere configurati separatamente; non sono un sostituto automatico di `reflect-metadata`.

## Errori comuni

- Mescolare le firme legacy e moderne nello stesso progetto senza verificarne il supporto.
- Perdere `this`, parametri o tipo di ritorno nel wrapper.
- Assumere che il decorator venga riapplicato a ogni chiamata o assegnazione.
- Usare metadati di tipo come validazione o autenticazione.
- Dimenticare che il decorator introduce codice eseguito e puo produrre effetti collaterali.
- Registrare argomenti o dati sensibili in un logger generico.

## Checklist

- Framework, compilatore e pipeline usano la stessa modalita?
- La firma corrisponde al tipo di elemento decorato?
- Il wrapper conserva ricevitore, argomenti, ritorno ed errori?
- Ho verificato ordine di composizione e inizializzazione?
- I metadati eventualmente richiesti sono disponibili anche a runtime?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Classi|Classi]]
- [[Programmazione/TypeScript/Pagine/tsconfig|tsconfig]]
- [[Programmazione/TypeScript/Pagine/TypeScript con Node.js|TypeScript con Node.js]]

## Fonti

- [TypeScript 5.0 - Decorators moderni](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#decorators)
- [TypeScript Handbook - Decorators legacy](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [TypeScript 5.2 - Decorator Metadata](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#decorator-metadata)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
