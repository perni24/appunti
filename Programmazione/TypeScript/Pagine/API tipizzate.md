---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, api, dto, contract, backend]
aliases: [API TypeScript tipizzate]
prerequisites: [API contract, Validazione runtime e tipi statici]
related: [Generazione di tipi da API, DTO e modelli di dominio, TypeScript con Node.js]
---

# API tipizzate

## Sintesi

Un'API tipizzata usa TypeScript per descrivere request, response, errori e DTO. L'obiettivo e ridurre mismatch tra client e server e rendere espliciti i contratti tra moduli o servizi.

I tipi statici aiutano, ma il backend deve comunque validare dati runtime.

## Quando usarlo

- API REST o RPC in TypeScript.
- Frontend e backend nello stesso monorepo.
- SDK client generati.
- Integrazioni tra servizi.
- DTO condivisi o generati da schema.

## Come funziona

Si definiscono tipi per input e output. Idealmente questi tipi derivano da un contratto condiviso o da uno schema validato. Il client usa i tipi per chiamare l'API, il server li usa per implementare handler e validazione.

## API / Sintassi

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

## Esempio pratico

```ts
type CreateUserRequest = {
  email: string;
  password: string;
};

type UserResponse = {
  id: string;
  email: string;
};

async function createUser(
  input: CreateUserRequest
): Promise<ApiResult<UserResponse>> {
  return {
    ok: true,
    data: { id: "u_1", email: input.email },
  };
}
```

Il tipo del risultato obbliga il chiamante a gestire successo ed errore.

## Varianti

- **REST con DTO TypeScript**.
- **OpenAPI + tipi generati**.
- **GraphQL codegen**.
- **tRPC o RPC type-safe**.
- **Schema runtime condiviso** con Zod o simili.

## Errori comuni

- **Condividere tipi senza validare runtime**.
- **Usare modelli database come response pubblica**.
- **Non modellare errori**.
- **Lasciare drift tra frontend e backend**.
- **Usare `any` nel client API**.

## Checklist

- Modellare request, response ed errori.
- Validare input lato server.
- Separare DTO, dominio e persistenza.
- Generare tipi quando esiste uno schema affidabile.
- Testare contratti API critici.

## Collegamenti

- [[API contract]]
- [[Generazione di tipi da API]]
- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Validazione runtime e tipi statici]]
