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
  - inference
  - generics
  - type-system
aliases:
  - Inferenza avanzata TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Inferenza dei tipi]]"
  - "[[Programmazione/TypeScript/Pagine/Generics avanzati]]"
related:
  - "[[Programmazione/TypeScript/Pagine/const type parameters]]"
  - "[[Programmazione/TypeScript/Pagine/satisfies operator]]"
  - "[[Programmazione/TypeScript/Pagine/Infer nei Conditional Types]]"
title: Type inference avanzata
---

# Type inference avanzata

## Sintesi

La type inference avanzata riguarda il modo in cui TypeScript deduce tipi in presenza di generics, literal types, overload, callback, conditional types e contesto.

Capirla aiuta a progettare API che "sentono" bene nell'editor: chi le usa ottiene tipi precisi senza dover specificare tutto manualmente.

## Quando usarlo

- Builder API.
- Helper di configurazione.
- Funzioni generiche con callback.
- Librerie interne o pubbliche.
- API che devono preservare literal types.

## Come funziona

TypeScript inferisce dai valori passati, dal contesto atteso, dai vincoli generici e dal valore di ritorno. A volte un'annotazione troppo larga peggiora l'inferenza; altre volte serve una firma piu esplicita per guidarla.

## API / Sintassi

```ts
function defineConfig<const TConfig extends object>(config: TConfig): TConfig {
  return config;
}
```

## Esempio pratico

```ts
function createMap<const TItems extends readonly string[]>(
  items: TItems
): Record<TItems[number], boolean> {
  return Object.fromEntries(items.map((item) => [item, true])) as Record<
    TItems[number],
    boolean
  >;
}

const flags = createMap(["darkMode", "betaDashboard"]);
```

`flags` viene tipizzato con chiavi `"darkMode"` e `"betaDashboard"`.

## Varianti

- **Inferenza contestuale**: callback tipizzata dal contesto.
- **Inferenza da parametri generici**.
- **Inferenza literal con `as const` o const type parameters**.
- **Inferenza con overload**.
- **Inferenza con conditional types e `infer`**.

## Errori comuni

- **Annotare troppo presto**: allarga tipi che potevano restare precisi.
- **Usare `any` in una firma generica**: interrompe l'inferenza.
- **Forzare parametri generici manualmente**: spesso nasconde una firma migliorabile.
- **Non preservare readonly tuple**: perdi informazione posizionale.

## Checklist

- Disegnare API che inferiscono dal valore passato.
- Usare `const` type parameters per preservare literal types.
- Evitare annotazioni larghe su configurazioni.
- Usare `satisfies` quando vuoi controllo senza perdere precisione.
- Testare l'ergonomia con esempi reali.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Inferenza dei tipi|Inferenza dei tipi]]
- [[Programmazione/TypeScript/Pagine/Generics avanzati|Generics avanzati]]
- [[Programmazione/TypeScript/Pagine/const type parameters|const type parameters]]
- [[Programmazione/TypeScript/Pagine/satisfies operator|satisfies operator]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
