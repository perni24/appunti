---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, strict-mode, type-safety, tsconfig]
aliases: [strict TypeScript]
prerequisites: [tsconfig, any, unknown e never]
related: [Best Practices, Error Handling]
---

# Strict mode

## Sintesi

`strict` abilita un insieme di controlli rigorosi del compilatore TypeScript. E una delle opzioni piu importanti per ottenere vero valore dal type system.

Senza strict mode, TypeScript puo lasciare passare molti casi rischiosi, soprattutto intorno a `any`, `null`, parametri non tipizzati e inizializzazione delle classi.

## Quando usarlo

- In tutti i nuovi progetti TypeScript.
- Quando vuoi ridurre errori runtime.
- Quando lavori con input opzionali o nullable.
- Quando vuoi refactor piu affidabili.
- Quando stai alzando gradualmente la qualita di una codebase JS/TS.

## Come funziona

Nel `tsconfig`, `strict: true` abilita varie opzioni, come `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis` e altre.

Si possono anche abilitare o disabilitare opzioni specifiche, ma nei nuovi progetti conviene partire da `strict: true`.

## API / Sintassi

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

## Esempio pratico

```ts
function formatName(name: string | null): string {
  if (name === null) {
    return "Senza nome";
  }

  return name.toUpperCase();
}
```

Con `strictNullChecks`, TypeScript obbliga a gestire `null` prima di usare metodi da stringa.

## Varianti

- **`strict: true`**: attiva il pacchetto principale.
- **`noImplicitAny`**: impedisce `any` impliciti.
- **`strictNullChecks`**: separa `null`/`undefined` dagli altri tipi.
- **`strictPropertyInitialization`**: controlla proprieta di classe.
- **Opzioni extra consigliate**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.

## Errori comuni

- **Disabilitare strict per evitare errori iniziali**: spesso sposta il costo piu avanti.
- **Usare `any` per aggirare strict**: annulla il vantaggio.
- **Non abilitare controlli extra**: `strict` e ottimo, ma non copre tutto.
- **Migrare tutto in una volta**: su codebase grandi conviene procedere per zone.

## Checklist

- Usare `strict: true` nei nuovi progetti.
- Aggiungere `noUncheckedIndexedAccess` se lavori con dizionari/array.
- Aggiungere `exactOptionalPropertyTypes` se vuoi opzionali piu precisi.
- Tracciare gli `any` temporanei.
- Preferire `unknown` e narrowing per confini incerti.

## Collegamenti

- [[tsconfig]]
- [[any, unknown e never]]
- [[Best Practices]]
