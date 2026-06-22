---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, structural-typing, type-system]
aliases: [Tipizzazione strutturale]
prerequisites: [Type Aliases e Interfaces, Classi]
related: [Brand Types, Variance]
---

# Structural typing

## Sintesi

TypeScript usa un sistema di tipi **strutturale**: due tipi sono compatibili se hanno una forma compatibile, anche se hanno nomi diversi.

Questo riflette il modo in cui JavaScript lavora con gli oggetti: conta quali proprieta e metodi sono presenti, non da quale classe nominale proviene il valore.

## Quando usarlo

- Quando definisci interfacce per API flessibili.
- Quando passi oggetti letterali a funzioni tipizzate.
- Quando vuoi capire perche due tipi diversi risultano compatibili.
- Quando modelli librerie JavaScript esistenti.
- Quando decidi se usare brand types per distinguere valori simili.

## Come funziona

Se un valore ha almeno le proprieta richieste da un tipo, TypeScript lo considera assegnabile. Il nome del tipo non crea una barriera nominale.

## API / Sintassi

```ts
type Point = {
  x: number;
  y: number;
};

const value = { x: 1, y: 2, label: "A" };

const point: Point = value;
```

## Esempio pratico

```ts
interface Logger {
  info(message: string): void;
}

const consoleLike = {
  info(message: string) {
    console.log(message);
  },
  error(message: string) {
    console.error(message);
  },
};

function run(logger: Logger): void {
  logger.info("start");
}

run(consoleLike);
```

`consoleLike` non dichiara `implements Logger`, ma e compatibile per struttura.

## Varianti

- **Structural typing**: compatibilita per forma.
- **Nominal typing**: compatibilita per nome/dichiarazione.
- **Brand types**: simulano distinzione nominale in TypeScript.
- **Duck typing runtime**: "se cammina come..." a runtime JavaScript.

## Errori comuni

- **Aspettarsi isolamento dal nome del tipo**: due tipi identici sono compatibili.
- **Confondere classi e istanze**: la classe esiste a runtime, ma il tipo dell'istanza resta strutturale.
- **Usare oggetti extra direttamente in literal**: excess property checks possono segnalare errori in assegnazioni dirette.
- **Mescolare ID diversi come stringhe**: serve brand se il dominio richiede distinzione.

## Checklist

- Ricordare che TypeScript controlla la forma.
- Usare interfacce piccole per sfruttare la tipizzazione strutturale.
- Usare brand types quando serve distinzione nominale.
- Capire excess property checks sugli object literal.
- Non dipendere da `implements` come requisito nominale.

## Collegamenti

- [[Type Aliases e Interfaces]]
- [[Implementazione di interfacce]]
- [[Brand Types]]
- [[Variance]]
