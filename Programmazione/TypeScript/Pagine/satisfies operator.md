---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, satisfies, type-checking, inference]
aliases: [satisfies]
prerequisites: [Inferenza dei tipi, Type Aliases e Interfaces]
related: [as const, Keyof e typeof]
---

# satisfies operator

## Sintesi

L'operatore `satisfies` verifica che un valore rispetti un tipo senza forzare l'inferenza a diventare piu larga.

E utile quando vuoi controllare la forma di un oggetto ma mantenere tipi letterali precisi per le sue proprieta.

## Quando usarlo

- Oggetti di configurazione.
- Mappe di handler.
- Dizionari di route, permessi o feature flag.
- Costanti dove vuoi validare forma e preservare literal types.
- Oggetti che devono rispettare un contratto ma restare inferiti con precisione.

## Come funziona

`satisfies` controlla assegnabilita verso un tipo target. A differenza di una annotazione esplicita, non cambia il tipo inferito del valore piu del necessario.

## API / Sintassi

```ts
type Route = {
  path: string;
  method: "GET" | "POST";
};

const route = {
  path: "/users",
  method: "GET",
} satisfies Route;
```

## Esempio pratico

```ts
type FeatureConfig = Record<string, { enabled: boolean }>;

const features = {
  darkMode: { enabled: true },
  betaDashboard: { enabled: false },
} satisfies FeatureConfig;

type FeatureName = keyof typeof features;
```

`features` viene controllato come `FeatureConfig`, ma `FeatureName` resta `"darkMode" | "betaDashboard"`.

## Varianti

- **Annotazione esplicita**: `const x: Type = ...`, puo allargare.
- **Assertion**: `as Type`, forza il tipo e puo nascondere errori.
- **`satisfies`**: controlla senza perdere inferenza.
- **`as const satisfies`**: pattern utile per configurazioni immutabili e precise.

## Errori comuni

- **Usare `satisfies` pensando trasformi il tipo**: controlla, non converte.
- **Usarlo al posto della validazione runtime**: non controlla dati esterni.
- **Confonderlo con `as`**: `as` forza, `satisfies` verifica.
- **Aspettarsi che renda tutti i campi readonly**: serve `as const`.

## Checklist

- Usare `satisfies` per costanti e configurazioni.
- Preferirlo ad annotazioni quando vuoi mantenere literal types.
- Preferirlo ad `as` quando vuoi controllo reale.
- Abbinarlo a `as const` se serve precisione readonly.
- Non usarlo per input runtime non validati.

## Collegamenti

- [[Inferenza dei tipi]]
- [[as const]]
- [[Keyof e typeof]]
