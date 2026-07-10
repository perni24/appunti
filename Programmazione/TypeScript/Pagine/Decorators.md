---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, decorators, metaprogramming, classes]
aliases: [Decorator TypeScript]
prerequisites: [Classi, tsconfig]
related: [Visibilita e modificatori di accesso, TypeScript con Node.js]
---

# Decorators

## Sintesi

I decorators sono una sintassi di metaprogrammazione per annotare o modificare classi e membri di classi.

In TypeScript bisogna distinguere con attenzione tra **decorators moderni** supportati dalle versioni recenti e **legacy decorators** abilitati tramite `experimentalDecorators`, usati storicamente da framework come Angular o librerie basate su metadata.

## Quando usarlo

- Framework che richiedono decorators.
- Annotazioni su classi, metodi o proprieta.
- Dependency injection e metadata.
- ORM, validator o serializer che usano metadati.
- Codice dove il framework documenta esplicitamente il pattern.

## Come funziona

Un decorator e una funzione applicata a una dichiarazione. Viene eseguito a runtime e puo osservare o modificare il comportamento della classe o del membro decorato.

La semantica cambia tra decoratori moderni e legacy, quindi bisogna seguire la documentazione del framework e della versione TypeScript in uso.

## API / Sintassi

```ts
function loggedMethod(
  originalMethod: Function,
  context: ClassMethodDecoratorContext
) {
  return function (this: unknown, ...args: unknown[]) {
    console.log(`Calling ${String(context.name)}`);
    return originalMethod.call(this, ...args);
  };
}
```

## Esempio pratico

```ts
class Service {
  @loggedMethod
  run(): string {
    return "ok";
  }
}
```

Questo esempio rappresenta lo stile dei decorators moderni. In progetti legacy la firma del decorator puo essere diversa.

## Varianti

- **Class decorator**: applicato a una classe.
- **Method decorator**: applicato a un metodo.
- **Accessor decorator**: applicato a getter/setter.
- **Field decorator**: applicato a campi.
- **Legacy decorators**: vecchia semantica TypeScript con `experimentalDecorators`.

## Errori comuni

- **Mescolare decorators moderni e legacy**: firme e comportamento differiscono.
- **Pensare che siano solo tipi**: i decorators eseguono codice runtime.
- **Dipendere da metadata senza configurazione corretta**: alcune librerie richiedono opzioni specifiche.
- **Usarli per logica invisibile**: possono rendere il codice difficile da seguire.

## Checklist

- Verificare versione TypeScript e semantica richiesta dal framework.
- Distinguere decorator moderni da legacy decorators.
- Controllare `tsconfig` e opzioni richieste.
- Evitare side effect nascosti non necessari.
- Scrivere test per comportamento introdotto dai decorators.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Classi|Classi]]
- [[tsconfig]]
- [[TypeScript con Node.js]]
- https://www.typescriptlang.org/docs/handbook/decorators.html
- https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators
