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
  - brand-types
  - nominal-typing
  - domain-modeling
aliases:
  - Branded types
  - Opaque types
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Domain modeling]]"
  - "[[Programmazione/TypeScript/Pagine/DTO e modelli di dominio]]"
title: Brand Types
---

# Brand Types

## Sintesi

Un branded type distingue valori con la stessa rappresentazione runtime ma significati diversi, per esempio un ID utente e un ID ordine. E un pattern costruito con intersection types, non una nuova categoria nominale nativa di TypeScript.

Il brand aiuta a evitare scambi accidentali nel codice tipizzato. Non e una protezione contro input ostili, assertion scorrette o accessi non autorizzati.

Riferimento degli esempi: TypeScript **5.9.3**, `strict: true`.

## Quando usarlo

- Distinguere ID, unita di misura o valori sottoposti a una regola di dominio.
- Rendere visibile il passaggio da input non attendibile a valore controllato.
- Evitare di scambiare due parametri entrambi dichiarati `string`.

Usarlo quando il significato aggiunto giustifica parser e conversioni esplicite. Un brand `Email` o `Token` e utile solo quanto la verifica che lo crea: il nome non dimostra validita, proprieta o autenticita.

## Come funziona

Si interseca il tipo base con una proprieta usata soltanto dal compilatore. Nel pattern qui mostrato il parser restituisce la stessa stringa, senza aggiungere proprieta runtime.

Una stringa normale non e assegnabile al tipo branded; il valore branded rimane invece assegnabile a `string`. Il controllo si puo aggirare con `as` o `any`: serve disciplina ai confini del programma.

## API / Sintassi

La versione semplice usa una proprieta convenzionale. Due definizioni strutturalmente identiche di questo brand restano compatibili:

```ts
type Brand<T, Name extends string> = T & { readonly __brand: Name };

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;
```

Una chiave `unique symbol` riduce le collisioni fra definizioni indipendenti. Le parti del progetto che devono condividere un brand devono importare la stessa definizione.

## Esempio pratico

Il blocco e autonomo. Il formato scelto e **solo una convenzione dimostrativa**: prefisso `usr_` o `ord_`, seguito da otto caratteri ASCII minuscoli o cifre. Non e uno standard UUID e non verifica l'esistenza di record.

```ts
declare const brand: unique symbol;

type Brand<T, Name extends string> = T & {
  readonly [brand]: Name;
};

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

function parseUserId(value: unknown): UserId {
  if (
    typeof value !== "string" ||
    value.length !== 12 ||
    !/^usr_[a-z0-9]{8}$/.test(value)
  ) {
    throw new Error("Formato UserId non valido");
  }
  return value as UserId;
}

function parseOrderId(value: unknown): OrderId {
  if (
    typeof value !== "string" ||
    value.length !== 12 ||
    !/^ord_[a-z0-9]{8}$/.test(value)
  ) {
    throw new Error("Formato OrderId non valido");
  }
  return value as OrderId;
}

function describeOrder(userId: UserId, orderId: OrderId): string {
  return userId + " -> " + orderId;
}

const userId = parseUserId("usr_ab12cd34");
const orderId = parseOrderId("ord_ef56gh78");

console.log(describeOrder(userId, orderId));
// usr_ab12cd34 -> ord_ef56gh78
console.log(typeof userId); // string
// describeOrder(orderId, userId); // Errore statico
```

Le assertion sono concentrate nei due parser, dopo i controlli. `declare const brand` non crea un simbolo JavaScript: viene usato solo nella definizione del tipo e non va letto a runtime.

`describeOrder` compone una stringa: non legge un database e non prova che l'ordine appartenga all'utente. Autenticazione e autorizzazione sono verifiche separate.

## Varianti

### Serializzazione e operazioni

Dopo un passaggio attraverso JSON, trattare il risultato come `unknown` e ricostruire il brand con il parser. L'output di `JSON.parse` e tipizzato `any`: annotarlo direttamente `UserId` salterebbe il controllo.

Una concatenazione di stringhe restituisce normalmente `string`, non `UserId`. Analogamente, un brand numerico non fornisce automaticamente algebra delle unita di misura: le operazioni di dominio devono stabilire tipo e validita del risultato.

### Brand, opacita e value object

- Una chiave convenzionale come `__brand` e semplice, ma puo coincidere con altre definizioni.
- Una chiave `unique symbol` non esportata limita la costruzione strutturale ordinaria fuori dal modulo; non impedisce assertion.
- Un'API opaca espone operazioni e nasconde dettagli di rappresentazione. Il solo alias branded non garantisce questa disciplina.
- Una classe o un value object puo fornire metodi e identita runtime, al costo di una rappresentazione diversa dalla primitiva.

## Errori comuni

- Scrivere `value as UserId` in ogni chiamante, senza controllo.
- Chiamare `includes("@")` una validazione completa dell'email: accetta stringhe non valide.
- Cercare il brand a runtime con `in`, reflection o serializzazione.
- Considerare un ID ben formato una prova di autorizzazione.
- Riutilizzare un brand dopo operazioni che ne possono violare la regola.

## Checklist

- Definire precisamente cosa garantisce il parser e cosa non verifica.
- Accettare `unknown` ai confini non attendibili.
- Concentrare le assertion in pochi costruttori controllati.
- Testare input validi, invalidi e scambi fra brand.
- Ricontrollare dati deserializzati e valori derivati.
- Valutare un value object se servono comportamenti runtime.

## Fonti

- [TypeScript Handbook: unique symbol](https://www.typescriptlang.org/docs/handbook/symbols.html#unique-symbol).
- [TypeScript Handbook: compatibilita dei tipi](https://www.typescriptlang.org/docs/handbook/type-compatibility.html).
- [TypeScript Handbook: type assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions).

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces|Type Aliases e Interfaces]]
- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
