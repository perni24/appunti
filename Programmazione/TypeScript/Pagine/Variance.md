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
  set(value: T): void;
};
```

`Reader<T>` tende a essere covariante, mentre `Writer<T>` coinvolge posizioni di input e richiede piu cautela.

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
