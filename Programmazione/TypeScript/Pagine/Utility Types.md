---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, utility-types, mapped-types, conditional-types]
aliases: [Utility Types TypeScript]
prerequisites: [Mapped Types, Conditional Types, Keyof e typeof]
related: [Utility Types personalizzati, Partial, Pick, Omit]
---

# Utility Types

## Sintesi

Gli utility types sono tipi generici forniti da TypeScript per trasformare tipi esistenti. Servono a evitare duplicazione e a derivare varianti come versioni parziali, readonly, selezionate o escluse di un modello.

Molti utility types sono costruiti internamente con mapped types, conditional types e `keyof`.

## Quando usarlo

- Creare payload di update da un tipo completo.
- Selezionare solo alcune proprieta.
- Escludere proprieta sensibili.
- Estrarre parametri o ritorni di funzioni.
- Rendere un oggetto readonly o obbligatorio.

## Come funziona

Gli utility types prendono uno o piu tipi in input e producono un nuovo tipo. Non generano codice runtime: servono solo al compilatore.

## API / Sintassi

```ts
type User = {
  id: string;
  email: string;
  passwordHash: string;
};

type UserUpdate = Partial<User>;
type PublicUser = Omit<User, "passwordHash">;
type UserPreview = Pick<User, "id" | "email">;
```

## Esempio pratico

```ts
type Config = {
  apiUrl: string;
  timeoutMs: number;
  retries: number;
};

function updateConfig(config: Config, patch: Partial<Config>): Config {
  return { ...config, ...patch };
}
```

`Partial<Config>` permette di passare solo i campi da modificare.

## Varianti

- **`Partial<T>`**: rende opzionali tutte le proprieta.
- **`Required<T>`**: rende obbligatorie tutte le proprieta.
- **`Readonly<T>`**: rende readonly tutte le proprieta.
- **`Pick<T, K>`**: seleziona proprieta.
- **`Omit<T, K>`**: esclude proprieta.
- **`Record<K, V>`**: costruisce un dizionario tipizzato.
- **`ReturnType<T>` / `Parameters<T>`**: estraggono informazioni da funzioni.

## Errori comuni

- **Usare `Partial` per il dominio completo**: un'entita parziale non e sempre valida.
- **Abusare di `Omit` e `Pick` annidati**: puo diventare difficile leggere il modello.
- **Pensare che `Readonly` sia runtime**: impedisce mutazioni solo a type-checking.
- **Duplicare utility standard**: prima controlla se TypeScript ne offre gia una.

## Checklist

- Usare utility types per derivare tipi, non per nascondere modelli confusi.
- Separare DTO, input e dominio quando hanno significati diversi.
- Preferire nomi espliciti per tipi derivati importanti.
- Non sostituire validazione runtime con utility types.
- Controllare che il tipo derivato rappresenti davvero un caso valido.

## Collegamenti

- [[Mapped Types]]
- [[Conditional Types]]
- [[Utility Types personalizzati]]
