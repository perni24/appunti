---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, variance, generics, type-system]
aliases: [Varianza TypeScript]
prerequisites: [Generics avanzati, Structural typing]
related: [Firme di funzione e overload, Strict mode]
---

# Variance

## Sintesi

La variance descrive come cambia la compatibilita tra tipi generici quando cambia il loro parametro di tipo.

E un concetto avanzato ma importante per capire array, callback, funzioni, container readonly e API generiche.

## Quando usarlo

- Quando progetti interfacce generiche.
- Quando lavori con callback e handler.
- Quando incontri errori di assegnabilita tra funzioni.
- Quando vuoi capire differenze tra lettura e scrittura.
- Quando usi `strictFunctionTypes`.

## Come funziona

In modo semplificato:

- **Covarianza**: se `Dog` estende `Animal`, allora `Box<Dog>` e assegnabile a `Box<Animal>`.
- **Contravarianza**: la direzione si inverte, tipicamente nei parametri funzione.
- **Invarianza**: nessuna direzione e sicura.
- **Bivarianza**: entrambe le direzioni sono accettate, storicamente presente in alcuni casi TypeScript.

## API / Sintassi

```ts
type Reader<T> = {
  get(): T;
};

type Writer<T> = {
  set: (value: T) => void;
};
```

Con `strictFunctionTypes: true` (incluso in `strict: true`), `Reader<T>` e covariante e questo `Writer<T>` e contravariante. La sintassi conta: una proprieta funzione `set: (value: T) => void` riceve il controllo contravariante, mentre un metodo `set(value: T): void` mantiene parametri bivarianti per compatibilita.

## Esempio pratico

```ts
type Animal = { name: string };
type Dog = Animal & { bark(): void };

type Handler<T> = (value: T) => void;

const handleAnimal: Handler<Animal> = (animal) => {
  console.log(animal.name);
};

const handleDog: Handler<Dog> = handleAnimal;
```

Un handler capace di gestire qualsiasi `Animal` puo gestire anche un `Dog`.

### Metodo e proprieta funzione

Continuando con i tipi `Animal`, `Dog` e `Writer` sopra:

```ts
type MethodWriter<T> = {
  set(value: T): void;
};

const dogMethod: MethodWriter<Dog> = {
  set: (dog) => dog.bark(),
};

const animalMethod: MethodWriter<Animal> = dogMethod; // Accettato
// animalMethod.set({ name: "Ada" }); // TypeError a runtime: manca bark

const dogWriter: Writer<Dog> = {
  set: (dog) => dog.bark(),
};

// Errore atteso con strictFunctionTypes: il writer non gestisce ogni Animal.
// @ts-expect-error
const animalWriter: Writer<Animal> = dogWriter;
```

L'assegnazione del metodo dimostra una permissivita del compilatore, non la sicurezza dell'operazione. La chiamata problematica resta commentata per non eseguirla accidentalmente.

### Lettura e scrittura insieme

```ts
type Store<T> = {
  read: () => T;
  write: (value: T) => void;
};
```

Questo `Store<T>` e invariante in strict mode: uno store di soli `Dog` non puo accettare un `Animal` generico, e uno store di `Animal` non promette di restituire sempre un `Dog`. Non estendere automaticamente questa regola a tutti i container mutabili di TypeScript: array e metodi hanno compromessi di compatibilita.

## Varianti

- **Covarianza**: tipi prodotti/ritornati.
- **Contravarianza**: parametri di funzione.
- **Invarianza**: lettura e scrittura insieme.
- **Bivarianza**: caso permissivo, da conoscere per compatibilita storica.

## Errori comuni

- **Pensare che `Array<Dog>` sia sempre sicuro come `Array<Animal>`**: la mutabilita complica il ragionamento.
- **Ignorare `strictFunctionTypes`**: cambia controlli sulle funzioni.
- **Progettare generic che leggono e scrivono senza vincoli**: possono diventare invarianti.
- **Non distinguere input e output**: e il punto centrale della variance.

## Checklist

- Separare reader e writer quando possibile.
- Usare `readonly` per container solo in lettura.
- Abilitare strict mode.
- Fare attenzione ai parametri funzione.
- Testare assegnabilita delle API generiche con esempi concreti.

## Collegamenti

- [[Generics avanzati]]
- [[Structural typing]]
- [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]]

## Fonti

- [TypeScript - strictFunctionTypes](https://www.typescriptlang.org/tsconfig/strictFunctionTypes.html)
