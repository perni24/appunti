---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, brand-types, nominal-typing, domain-modeling]
aliases: [Branded types, Opaque types]
prerequisites: [Type Aliases e Interfaces, Intersection Types]
related: [Domain modeling, DTO e modelli di dominio]
---

# Brand Types

## Sintesi

I brand types aggiungono un marchio type-level a un tipo strutturale, per distinguere valori che hanno la stessa rappresentazione runtime ma significati diversi.

Sono utili per evitare di mescolare ID, token, email, valute o unita di misura che a runtime sono tutte stringhe o numeri.

## Quando usarlo

- ID di entita diverse: `UserId`, `OrderId`, `ProductId`.
- Valori validati: `Email`, `Url`, `NonEmptyString`.
- Unita di misura: `Meters`, `Seconds`, `Celsius`.
- Token o chiavi opache.
- Modellazione di dominio piu sicura.

## Come funziona

Un brand type combina il tipo base con una proprieta fittizia unica. A runtime il valore resta una stringa o numero, ma TypeScript lo distingue da altri tipi compatibili.

## API / Sintassi

```ts
type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;
```

## Esempio pratico

```ts
type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };
type Email = Brand<string, "Email">;

function parseEmail(value: string): Email {
  if (!value.includes("@")) {
    throw new Error("Email non valida");
  }

  return value as Email;
}

function sendEmail(to: Email): void {
  console.log(`Invio email a ${to}`);
}

const email = parseEmail("luca@example.com");
sendEmail(email);
```

Il brand deve essere creato dopo una validazione o in un punto controllato.

## Varianti

- **Brand semplice**: `string & { __brand: "Email" }`.
- **Opaque type**: nasconde costruttore e rappresentazione.
- **Brand con `unique symbol`**: riduce collisioni.
- **Value object runtime**: alternativa con classe o oggetto validato.

## Errori comuni

- **Creare brand con `as` ovunque**: annulla il valore della tecnica.
- **Pensare che il brand esista a runtime**: e solo type-level.
- **Usare brand per tutto**: aumenta complessita.
- **Non centralizzare parser/costruttori**: valori invalidi possono entrare facilmente.

## Checklist

- Usare brand per valori con significato di dominio forte.
- Creare brand solo tramite funzioni validate.
- Evitare assertion sparse nel codice.
- Valutare classi/value object se servono metodi runtime.
- Documentare la rappresentazione runtime.

## Collegamenti

- [[Type Aliases e Interfaces]]
- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Validazione runtime e tipi statici]]
