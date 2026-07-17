---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, api, codegen, openapi, graphql]
aliases: [API type generation, Codegen tipi API]
prerequisites: [API tipizzate, Validazione runtime e tipi statici]
related: [Typing di librerie JavaScript, DTO e modelli di dominio]
---

# Generazione di tipi da API

## Sintesi

La generazione di tipi da API consiste nel produrre tipi TypeScript a partire da una fonte di verita esterna, come OpenAPI, GraphQL schema, JSON Schema, Prisma schema o contratti RPC.

Riduce duplicazione tra backend e frontend, ma funziona bene solo se lo schema sorgente e aggiornato e rappresenta davvero il comportamento dell'API.

## Quando usarlo

- API REST documentate con OpenAPI.
- API GraphQL con schema introspezionabile.
- Monorepo con backend e frontend TypeScript.
- SDK generati per client esterni.
- Progetti dove i DTO cambiano spesso.

## Come funziona

Un tool legge lo schema API e genera tipi, client o helper. Il codice applicativo importa i tipi generati invece di riscrivere manualmente request e response.

La generazione va integrata nella build o in uno script controllato.

## API / Sintassi

```bash
openapi-typescript ./openapi.json -o ./src/generated/api-types.ts
```

## Esempio pratico

```ts
import type { paths } from "./generated/api-types";

type GetUserResponse =
  paths["/users/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
```

Il tipo della risposta deriva dallo schema OpenAPI.

## Varianti

- **OpenAPI codegen**: genera tipi e a volte client REST.
- **GraphQL codegen**: genera tipi per query, mutation e fragment.
- **tRPC/RPC typed contracts**: condivisione tipi diretta in TypeScript.
- **Schema-first**: lo schema genera tipi.
- **Code-first**: il codice genera schema e tipi derivati.

## Errori comuni

- **Schema non aggiornato**: i tipi generati diventano falsa sicurezza.
- **Confondere tipi generati e validazione runtime**: il client deve comunque gestire errori reali.
- **Modificare a mano file generati**: le modifiche vengono perse.
- **Usare tipi API come dominio interno**: DTO e modello di dominio possono avere esigenze diverse.

## Checklist

- Definire una fonte di verita chiara.
- Generare tipi in modo ripetibile.
- Non modificare manualmente file generati.
- Validare runtime quando i dati arrivano da rete.
- Separare DTO esterni e modelli di dominio quando necessario.

## Collegamenti

- [[API tipizzate]]
- [[Validazione runtime e tipi statici]]
- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
