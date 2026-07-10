---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, api-contract, validation, dto]
aliases: [Contratto API]
prerequisites: [API tipizzate, Validazione runtime e tipi statici]
related: [Generazione di tipi da API, DTO e modelli di dominio]
---

# API contract

## Sintesi

Un API contract descrive in modo esplicito cosa un'API accetta e cosa restituisce: endpoint, metodi, parametri, body, response, errori e versioni.

In TypeScript il contratto puo essere rappresentato da tipi, schema runtime, OpenAPI, GraphQL, tRPC o librerie contract-first.

## Quando usarlo

- Frontend e backend sviluppati separatamente.
- API pubbliche o consumate da piu client.
- Monorepo full-stack.
- SDK generati.
- Validazione di request/response.

## Come funziona

Il contratto deve avere una fonte di verita. Da quella fonte puoi derivare tipi TypeScript, validator runtime, documentazione o client.

Il punto critico e mantenere allineati type checking e comportamento runtime.

## API / Sintassi

```ts
type CreateUserRequest = {
  email: string;
  password: string;
};

type CreateUserResponse = {
  id: string;
  email: string;
};
```

## Esempio pratico

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type GetUserResponse = ApiResult<{
  id: string;
  email: string;
}>;
```

Il client deve gestire sia successo sia errore, invece di assumere sempre risposta valida.

## Varianti

- **Type-first**: tipi TypeScript come fonte principale.
- **Schema-first**: OpenAPI, JSON Schema, GraphQL.
- **Contract-first**: contratto condiviso genera client/server.
- **Runtime schema**: Zod o simili come fonte di validazione.
- **Generated client**: tipi e chiamate generate.

## Errori comuni

- **Avere tipi frontend diversi dal backend**: drift inevitabile.
- **Non modellare errori**: il client gestisce solo happy path.
- **Confondere DTO e dominio**: il contratto API non e sempre il modello interno.
- **Non versionare breaking change**: rompe client esistenti.

## Checklist

- Definire una fonte di verita.
- Modellare request, response ed errori.
- Validare runtime lato server.
- Generare tipi o client quando possibile.
- Separare DTO e dominio se hanno responsabilita diverse.

## Collegamenti

- [[API tipizzate]]
- [[Generazione di tipi da API]]
- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Schema validation con Zod]]
