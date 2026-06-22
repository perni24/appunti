---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, express, fastify, backend, api]
aliases: [TypeScript con Express/Fastify, Express TypeScript, Fastify TypeScript]
prerequisites: [TypeScript con Node.js, API tipizzate]
related: [Validazione runtime e tipi statici, API contract]
---

# TypeScript con Express-Fastify

## Sintesi

Express e Fastify sono framework backend Node.js usati per costruire API HTTP. Con TypeScript puoi tipizzare request, response, handler, plugin, middleware e DTO.

La differenza pratica e che Fastify ha un modello di typing piu integrato e schema-oriented, mentre Express richiede spesso piu dichiarazioni manuali o augmentation.

## Quando usarlo

- Backend REST.
- API interne.
- Servizi Node.js con validazione request/response.
- Middleware di autenticazione.
- Plugin o estensioni request.

## Come funziona

In Express spesso tipizzi handler e usi module augmentation per aggiungere proprieta a `Request`. In Fastify puoi collegare schema e tipi in modo piu strutturato, spesso con validator e serializer.

In entrambi i casi TypeScript non valida automaticamente il body: serve validazione runtime.

## API / Sintassi

```ts
type CreateUserBody = {
  email: string;
  password: string;
};
```

## Esempio pratico

```ts
import type { Request, Response } from "express";

type CreateUserBody = {
  email: string;
  password: string;
};

function createUserHandler(
  req: Request<unknown, unknown, CreateUserBody>,
  res: Response
) {
  res.json({ email: req.body.email });
}
```

Questo tipizza `req.body`, ma non garantisce che il body runtime sia valido.

## Varianti

- **Express**: flessibile, ecosistema enorme, typing spesso manuale.
- **Fastify**: schema e plugin system piu strutturati.
- **Schema validation**: Zod, JSON Schema o validator integrati.
- **Module augmentation**: per aggiungere `req.user`.
- **Generated API types**: da OpenAPI o schema condiviso.

## Errori comuni

- **Tipizzare `req.body` senza validarlo**.
- **Aggiungere `req.user` senza module augmentation**.
- **Mescolare DTO di request con modelli database**.
- **Non tipizzare error handler e middleware**.
- **Ignorare differenze tra Express e Fastify nel sistema plugin/schema**.

## Checklist

- Validare request body, params e query.
- Tipizzare response ed errori importanti.
- Usare module augmentation solo quando serve.
- Separare handler, service e DTO.
- Generare o condividere contratti API se client e server sono collegati.

## Collegamenti

- [[TypeScript con Node.js]]
- [[API tipizzate]]
- [[Schema validation con Zod]]
- [[Module augmentation]]
