---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - typescript
  - interfaces
  - implements
  - oop
aliases:
  - implements TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
  - "[[Programmazione/TypeScript/Pagine/Classi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Classi]]"
  - "[[Programmazione/TypeScript/Pagine/Classi astratte]]"
  - "[[Programmazione/TypeScript/Pagine/Generics]]"
title: Implementazione di interfacce
---

# Implementazione di interfacce

## Sintesi

Una classe puo usare `implements` per dichiarare che rispetta una o piu interfacce. Questo permette di separare il contratto dalla classe concreta.

L'interfaccia descrive cosa deve essere disponibile; la classe decide come implementarlo.

## Quando usarlo

- Quando vuoi dipendere da un contratto invece che da una classe concreta.
- Quando piu classi devono offrire la stessa API.
- Quando applichi dependency injection.
- Quando vuoi rendere testabile un servizio.
- Quando vuoi separare dominio, infrastruttura e implementazioni concrete.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022.

`implements` controlla la compatibilita del **lato istanza** con il contratto. I membri richiesti possono essere dichiarati nella classe o ereditati. Non copia codice, non genera proprieta e non inserisce controlli runtime.

Per le interfacce pubbliche mostrate qui conta la struttura: anche un oggetto letterale o una classe senza `implements` puo essere assegnabile. L'interfaccia viene eliminata e non si puo usare con `instanceof`. Il controllo di compatibilita non dimostra che il comportamento rispetti promesse come "invia davvero il messaggio".

## API / Sintassi

```ts
interface Logger {
  info(message: string): void;
  error(message: string): void;
}

class ConsoleLogger implements Logger {
  info(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }
}
```

## Esempio pratico

Un test double registra richieste in memoria. Non e un client SMTP e non invia email:

```ts
interface EmailSender {
  send(to: string, subject: string): Promise<void>;
}

class RecordingEmailSender implements EmailSender {
  readonly messages: { to: string; subject: string }[] = [];

  async send(to: string, subject: string): Promise<void> {
    this.messages.push({ to, subject });
  }
}

async function notify(sender: EmailSender): Promise<void> {
  await sender.send("luca@example.com", "Benvenuto");
}

const sender = new RecordingEmailSender();

async function demo(): Promise<number> {
  await notify(sender);
  return sender.messages.length;
}
```

Alla prima chiamata `await demo()` restituisce `1`. `notify` attende la Promise e propaga un eventuale rifiuto. Un adapter reale deve implementare trasporto, errori e configurazione; il tipo da solo non garantisce la consegna. `messages` e un buffer ispezionabile per test, non una coda persistente o immutabile.

### `implements` non inferisce i parametri

```ts
interface NameChecker {
  check(name: string): boolean;
  description?: string;
}

class NonEmptyName implements NameChecker {
  check(name: string): boolean {
    return name.trim().length > 0;
  }
}

const checker = new NonEmptyName();
console.log(checker.check("  ")); // false
// checker.description; // Errore: non dichiarata nella classe.

const contract: NameChecker = checker;
console.log(contract.description); // undefined
```

Se togli `: string` dal parametro `name`, `implements` non lo ricava dall'interfaccia: con `noImplicitAny` incluso in `strict` ottieni un errore. Analogamente, `description?` non viene creata nella classe. La vista `NameChecker` ne permette la lettura come `string | undefined`, senza modificare l'oggetto.

### Il costruttore va controllato separatamente

```ts
interface Formatter {
  format(value: string): string;
}

interface FormatterConstructor {
  new (prefix: string): Formatter;
}

class PrefixFormatter implements Formatter {
  constructor(private readonly prefix: string) {}

  format(value: string): string {
    return this.prefix + value;
  }
}

const FormatterClass: FormatterConstructor = PrefixFormatter;
const formatter = new FormatterClass("Nota: ");
console.log(formatter.format("TypeScript")); // Nota: TypeScript
```

`PrefixFormatter implements Formatter` controlla le istanze. L'assegnazione di `PrefixFormatter` a `FormatterConstructor` controlla invece la firma `new` del valore classe. I membri `static` si controllano sul lato costruttore, non aggiungendoli all'interfaccia delle istanze.

### Metodi e callback non hanno sempre la stessa varianza

Le firme metodo possono ammettere parametri piu stretti per le regole di bivarianza di TypeScript, anche con `strictFunctionTypes`. Per un contratto callback in cui vuoi il controllo contravariante usa una proprieta funzione, per esempio `handle: (value: string | number) => void`, e verifica che l'implementazione gestisca entrambi i casi. `implements` non e una prova universale di correttezza; approfondimento in [[Programmazione/TypeScript/Pagine/Variance|Variance]].

## Varianti

- **Classe che implementa una interface**: `class A implements B`.
- **Classe che implementa piu interfacce**: `implements A, B`.
- **Interface generica**: `interface Repository<T>`.
- **Classe astratta**: alternativa quando serve codice condiviso.

## Errori comuni

- **Pensare che `implements` cambi il runtime**: e solo controllo statico.
- **Usare `instanceof Interface`**: impossibile, perche l'interfaccia non esiste a runtime.
- **Interfacce troppo grandi**: rendono le classi difficili da implementare e testare.
- **Confondere `extends` e `implements`**: il primo eredita comportamento; il secondo controlla un contratto statico, anche descritto da un type alias oggetto.

## Checklist

- Usare interfacce piccole e focalizzate.
- Dipendere dal contratto quando serve flessibilita.
- Non usare `implements` se una classe concreta basta.
- Ricordare che il controllo e strutturale.
- Usare type guard runtime se devi distinguere valori a runtime.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces|Type Aliases e Interfaces]]
- [[Programmazione/TypeScript/Pagine/Classi|Classi]]
- [[Programmazione/TypeScript/Pagine/Classi astratte|Classi astratte]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]


## Fonti

- [TypeScript: implements clauses](https://www.typescriptlang.org/docs/handbook/2/classes.html#implements-clauses), controlli e limiti.
- [TypeScript: interfaces, static and instance sides](https://www.typescriptlang.org/docs/handbook/interfaces.html#difference-between-the-static-and-instance-sides-of-classes), firma del costruttore.
- [TypeScript: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), compatibilita strutturale.
- [TypeScript 2.6: strict function types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html#strict-function-types), eccezione per i metodi.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
