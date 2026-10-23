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
  - variance
  - generics
  - type-system
aliases:
  - Varianza TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Generics avanzati]]"
  - "[[Programmazione/TypeScript/Pagine/Structural typing]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Firme di funzione e overload]]"
  - "[[Programmazione/TypeScript/Pagine/Strict mode]]"
title: Variance
---

# Variance

## Sintesi

La varianza descrive come cambia l'assegnabilita di un tipo generico quando cambia il suo parametro. Un produttore di valori specializzati puo spesso essere usato come produttore di valori generali; per chi **consuma** valori la direzione si inverte.

Baseline: **TypeScript 5.9.3**, `strict: true`, target `ES2022`. In particolare `strictFunctionTypes` e attivo. Ogni blocco e indipendente.

## Quando usarlo

- Progettare callback, repository, reader e writer.
- Capire assegnazioni tra generics senza risolverle con `any`.
- Distinguere proprieta funzione da metodi.
- Riconoscere compromessi di sicurezza negli array mutabili.

## Come funziona

Negli esempi `RenderTask` ha tutti i campi di `Task` e in piu `render`.

- **Covarianza**: la direzione rimane la stessa, per esempio da `Reader<RenderTask>` a `Reader<Task>`.
- **Contravarianza**: si inverte, per esempio da `Writer<Task>` a `Writer<RenderTask>`.
- **Invarianza**: non si puo assumere nessuna delle due sostituzioni.
- **Bivarianza**: sono consentite entrambe le direzioni del confronto dei parametri; puo nascondere errori runtime.

Queste regole dipendono dall'uso effettivo del parametro nella struttura. Un generico che non usa `T` nei membri non distingue necessariamente le sue istanze.

## API / Sintassi

### Valori prodotti e valori consumati

```ts
type Task = { id: string };
type RenderTask = Task & { render(): string };
type Reader<T> = { get: () => T };
type Writer<T> = { set: (value: T) => void };

const specialized: Reader<RenderTask> = {
  get: () => ({ id: "preview", render: () => "image" }),
};
const general: Reader<Task> = specialized;
console.log(general.get().id); // preview

const anyTaskWriter: Writer<Task> = {
  set: task => console.log(task.id),
};
const renderWriter: Writer<RenderTask> = anyTaskWriter;
renderWriter.set({ id: "export", render: () => "image" }); // export
```

Il reader conserva la promessa di restituire almeno un `Task`. Il writer generale sa gestire anche un `RenderTask`: il consumer specializzato non gli passera un caso piu generale di quelli che sa accettare.

## Esempio pratico

### Una callback troppo specifica non e un handler generale

```ts
type Task = { id: string };
type RenderTask = Task & { render(): string };
type Handler<T> = { handle: (value: T) => void };

const renderOnly: Handler<RenderTask> = {
  handle: task => console.log(task.render()),
};

// Errore con strictFunctionTypes: renderOnly non sa gestire ogni Task.
// const unsafeHandler: Handler<Task> = renderOnly;

const acceptsAny: Handler<Task> = {
  handle: task => console.log(task.id),
};
const safeHandler: Handler<RenderTask> = acceptsAny;
safeHandler.handle({ id: "job", render: () => "image" }); // job
```

### I metodi hanno una regola diversa

```ts
type Task = { id: string };
type RenderTask = Task & { render(): string };
type MethodHandler<T> = { handle(value: T): void };

const renderOnly: MethodHandler<RenderTask> = {
  handle(task) { console.log(task.render()); },
};

const widened: MethodHandler<Task> = renderOnly; // accettato
// widened.handle({ id: "plain" }); // compila, ma lancia TypeError
```

L'eccezione bivariante riguarda i parametri di firme originate da metodi e costruttori; `strictFunctionTypes` non la elimina. Per un contratto di callback in cui vuoi il controllo contravariante, usa una proprieta funzione: `handle: (value: T) => void`.

## Varianti

### Lettura e scrittura nello stesso contratto

```ts
type Task = { id: string };
type RenderTask = Task & { render(): string };
type Store<T> = {
  get: () => T;
  set: (value: T) => void;
};

let current: RenderTask = { id: "preview", render: () => "image" };
const store: Store<RenderTask> = {
  get: () => current,
  set: value => { current = value; },
};

// Errore: il setter del presunto Store<Task> accetterebbe Task senza render.
// const widenedStore: Store<Task> = store;
console.log(store.get().render()); // image
```

Con queste firme e `strictFunctionTypes`, `T` e invariante: compare sia in uscita sia in ingresso. Sostituire il setter con un metodo cambia il controllo e puo indebolire la garanzia.

### Array mutabili e viste readonly

```ts
type Task = { id: string };
type RenderTask = Task & { render(): string };

const renders: RenderTask[] = [{ id: "preview", render: () => "image" }];
const tasks: Task[] = renders;
tasks.push({ id: "plain" }); // accettato: muta anche renders

console.log(renders.length); // 2
// renders[1]!.render(); // compila, ma lancia TypeError

const view: readonly Task[] = renders;
// view.push({ id: "other" }); // errore: push non disponibile
```

`readonly` impedisce di scrivere attraverso quella vista, non congela l'array ne impedisce mutazioni da altri riferimenti. Non rende readonly le proprieta degli elementi.

### Annotazioni in / out

```ts
interface Source<out T> {
  read: () => T;
}
interface Sink<in T> {
  write: (value: T) => void;
}
interface Cell<in out T> {
  read: () => T;
  write: (value: T) => void;
}
```

Le annotazioni sono disponibili da TypeScript 4.7 e di solito non servono: il compilatore inferisce la varianza. Intervengono nei confronti tra istanze dello stesso generico, non modificano tutte le comparazioni strutturali. Devono descrivere la struttura; non usarle per forzare artificialmente un'API a essere sicura.

## Errori comuni

- Invertire la direzione di un consumer: chi accetta meno casi non puo sostituire chi li accetta tutti.
- Usare la sintassi metodo pensando di ottenere lo stesso controllo di una proprieta funzione.
- Interpretare un'assegnazione accettata fra array come prova di sicurezza delle successive mutazioni.
- Disattivare `strictFunctionTypes` per eliminare un errore senza correggere il contratto.

## Checklist

- Il parametro viene prodotto, consumato o entrambe le cose?
- I callback sono proprieta funzione o metodi?
- Le collezioni vengono mutate attraverso altri riferimenti?
- L'assegnazione resta corretta per il caso meno specializzato ammesso?
- Eventuali annotazioni di varianza corrispondono all'uso reale di `T`?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Generics avanzati|Generics avanzati]]
- [[Programmazione/TypeScript/Pagine/Structural typing|Structural typing]]
- [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]]

## Fonti

- [TypeScript - strictFunctionTypes](https://www.typescriptlang.org/tsconfig/strictFunctionTypes.html)
- [TypeScript - Variance Annotations](https://www.typescriptlang.org/docs/handbook/2/generics.html#variance-annotations)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
