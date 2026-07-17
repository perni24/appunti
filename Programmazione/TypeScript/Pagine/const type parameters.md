---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, const-type-parameters, generics, literal-types]
aliases: [const generics TypeScript]
prerequisites: [Generics avanzati, as const]
related: [Inferenza dei tipi, Variadic tuple types]
---

# const type parameters

## Sintesi

I `const type parameters` permettono a una funzione generica di preservare tipi letterali e tuple readonly durante l'inferenza, senza obbligare chi chiama a usare sempre `as const`.

Sono utili per helper che lavorano con configurazioni, tuple, route, mappe e costanti.

## Quando usarlo

- Funzioni helper che ricevono oggetti di configurazione.
- Builder di route o schema.
- Funzioni che devono preservare tuple precise.
- API interne dove la precisione dei literal e importante.
- Alternative piu ergonomiche a `as const` nella chiamata.

## Come funziona

Si aggiunge `const` davanti al parametro generico: `<const T>`. TypeScript usa un'inferenza piu stretta, simile a quella ottenuta con `as const` in molti casi.

## API / Sintassi

```ts
function defineRoutes<const TRoutes extends Record<string, string>>(
  routes: TRoutes
): TRoutes {
  return routes;
}
```

## Esempio pratico

```ts
function tuple<const T extends readonly unknown[]>(value: T): T {
  return value;
}

const result = tuple(["id", "email"]);

type Field = (typeof result)[number];
```

`Field` viene inferito come `"id" | "email"` invece di `string`.

## Varianti

- **Generic normale**: inferenza piu larga.
- **`as const` sul valore**: precisione richiesta dal chiamante.
- **Const type parameter**: precisione gestita dalla funzione.
- **Vincoli con readonly**: spesso necessari per array e tuple.

## Errori comuni

- **Usarli ovunque**: servono quando la precisione literal ha valore.
- **Dimenticare `readonly` per tuple/array**: puo perdere compatibilita.
- **Pensare che cambino il runtime**: sono solo type-level.
- **Confonderli con generics di altri linguaggi**: non sono parametri costanti runtime.

## Checklist

- Usare const type parameters per builder e helper di configurazione.
- Verificare che la precisione inferita sia davvero utile.
- Gestire array come `readonly unknown[]` quando appropriato.
- Evitare API troppo magiche.
- Documentare l'effetto sull'inferenza.

## Collegamenti

- [[Generics avanzati]]
- [[as const]]
- [[Variadic tuple types]]
