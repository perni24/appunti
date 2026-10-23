---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - typescript
  - express
  - fastify
  - backend
  - api
aliases:
  - TypeScript con Express/Fastify
  - Express TypeScript
  - Fastify TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Node.js]]"
  - "[[Programmazione/TypeScript/Pagine/API tipizzate]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
  - "[[Programmazione/TypeScript/Pagine/API contract]]"
title: TypeScript con Express-Fastify
---

# TypeScript con Express-Fastify

## Sintesi

Express e Fastify collegano HTTP a handler applicativi. TypeScript descrive le firme; la validazione richiede codice runtime. Questa nota implementa lo stesso endpoint di anteprima in entrambi, senza database o finte operazioni di salvataggio.

Baseline: **TypeScript 5.9.3**, **Node 24.14.0**, **Express 5.3.0**, **@types/express 5.0.6**, **Fastify 5.12.7**, **Zod 4.6.7**, **@types/node 24.19.2**.

## Quando usarlo

- API HTTP con body, errori e risposte espliciti.
- Confrontare middleware Express e lifecycle/plugin Fastify.
- Separare parsing, validazione e logica applicativa.
- Verificare endpoint con richieste reali o injection di test.

## Come funziona

Express usa middleware ordinati; `express.json` decodifica il body ma non verifica il tuo schema. Annotare `Request<..., Body>` non rende fidati i dati ricevuti.

Fastify include tipi e supporta JSON Schema, validator e serializer. Un generic `Body` da solo non attiva questi controlli. Qui scegliamo Zod esplicito in entrambi per riusare il medesimo contratto; **non** stiamo configurando il validator/serializer JSON Schema di Fastify.

## API / Sintassi

In un progetto separato, riusa `tsconfig.json` della nota Node e `src/preview-client.ts` della nota API tipizzate. Quel modulo non invia richieste all'import e contiene gli schemi condivisi.

`package.json`:

```json
{
  "private": true,
  "type": "module",
  "scripts": { "build": "tsc -p tsconfig.json" },
  "dependencies": {
    "express": "5.3.0",
    "fastify": "5.12.7",
    "zod": "4.6.7"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "@types/node": "24.19.2",
    "@types/express": "5.0.6"
  }
}
```

`src/preview.ts` centralizza la trasformazione e la politica degli errori:

```ts
import type { Preview } from "./preview-client.js";

export type ApiError = { error: "invalid_request" | "internal_error" };

export function makePreview(title: string): Preview {
  return { title, length: title.length };
}

export function errorStatus(error: unknown): 400 | 413 | 415 | 500 {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const code = error.statusCode;
    if (code === 400 || code === 413 || code === 415) return code;
  }
  return 500;
}
```

`makePreview` presume un titolo gia normalizzato e validato: non e un parser. In un progetto piu ampio separa gli schemi dal trasporto HTTP invece di condividere un modulo client intero.

## Esempio pratico

### Express

`src/express-app.ts`:

```ts
import express from "express";
import type { ErrorRequestHandler, Request, Response } from "express";
import { PreviewInputSchema } from "./preview-client.js";
import type { Preview } from "./preview-client.js";
import { makePreview, errorStatus } from "./preview.js";
import type { ApiError } from "./preview.js";

export function buildExpress() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: 1024 }));

  app.post(
    "/preview",
    (
      req: Request<Record<string, string>, Preview | ApiError, unknown>,
      res: Response<Preview | ApiError>,
    ) => {
      if (!req.is("application/json")) {
        res.status(415).json({ error: "invalid_request" });
        return;
      }
      const result = PreviewInputSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: "invalid_request" });
        return;
      }
      res.json(makePreview(result.data.title));
    },
  );

  const onError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    const status = errorStatus(error);
    res.status(status).json({
      error: status === 500 ? "internal_error" : "invalid_request",
    });
  };
  app.use(onError);
  return app;
}
```

L'error handler mantiene quattro parametri, anche se alcuni non vengono usati. E adatto a questo endpoint non-streaming, prima dell'invio della risposta; un middleware generico deve gestire anche `headersSent`.

In Express 5 le Promise **restituite** dagli handler inoltrano il rifiuto al middleware degli errori. Questo non intercetta automaticamente timer, callback scollegati o Promise avviate senza ritorno/attesa.

### Fastify

`src/fastify-app.ts`:

```ts
import Fastify from "fastify";
import { PreviewInputSchema } from "./preview-client.js";
import type { Preview } from "./preview-client.js";
import { makePreview, errorStatus } from "./preview.js";
import type { ApiError } from "./preview.js";

export function buildFastify() {
  const app = Fastify({ logger: false, bodyLimit: 1024 });

  app.setErrorHandler((error, _request, reply) => {
    const status = errorStatus(error);
    return reply.code(status).send({
      error: status === 500 ? "internal_error" : "invalid_request",
    });
  });

  app.post<{ Body: unknown; Reply: Preview | ApiError }>(
    "/preview",
    async (request, reply) => {
      const mediaType = request.headers["content-type"]
        ?.split(";", 1)[0]
        ?.trim()
        .toLowerCase();
      if (mediaType !== "application/json") {
        return reply.code(415).send({ error: "invalid_request" });
      }
      const result = PreviewInputSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({ error: "invalid_request" });
      }
      return reply.code(200).send(makePreview(result.data.title));
    },
  );
  return app;
}
```

### Entry point e prova locale

`src/main-express.ts`:

```ts
import { buildExpress } from "./express-app.js";

const server = buildExpress().listen(3000, "127.0.0.1");
server.on("error", () => {
  console.error("Cannot start Express");
  process.exitCode = 1;
});
process.once("SIGINT", () => server.close());
```

`src/main-fastify.ts`:

```ts
import { buildFastify } from "./fastify-app.js";

const app = buildFastify();
try {
  await app.listen({ port: 3001, host: "127.0.0.1" });
  process.once("SIGINT", () => {
    void app.close().catch(() => {
      process.exitCode = 1;
    });
  });
} catch {
  console.error("Cannot start Fastify");
  process.exitCode = 1;
  await app.close();
}
```

Installare:

```sh
npm install
```

Compilare:

```sh
npm run build
```

Avviare uno dei due entry point; le porte devono essere libere:

```sh
node dist/main-express.js
```

```sh
node dist/main-fastify.js
```

In un altro terminale usa `printPreview` della nota API tipizzate con la porta scelta. Arresta con Ctrl+C. Non sono server da esporre in produzione: mancano autenticazione, policy operative, osservabilita e shutdown con deadline.

I body oltre 1024 byte producono `413`; JSON malformato o titolo invalido `400`; il media type non previsto `415`. Le forme di errore delle route sconosciute rimangono quelle del framework. Non restituiamo dettagli degli errori, payload o stack.

## Varianti

### JSON Schema in Fastify

`schema.body` configura validazione runtime; `schema.response` configura serializzazione. I type provider possono derivare i tipi, ma vanno attivati con pacchetti/configurazioni compatibili. Lo schema della risposta non va interpretato come un validatore universale di qualunque oggetto JavaScript.

Le opzioni Ajv predefinite possono convertire valori, applicare default e rimuovere extra. Non presumere la stessa politica di `z.strictObject`. Verifica con test input/output; non compilare schemi forniti da utenti. Controlli asincroni su database e permessi appartengono a fasi applicative successive.

### Request estese e plugin

Una augmentation per `req.user` descrive una proprieta, non la inizializza e non autentica. Serve middleware/hook che assegni il valore e controlli di accesso prima dell'handler. In Fastify considera anche encapsulation e ordine di registrazione dei plugin; un cast non registra un decorator.

## Errori comuni

- Body tipizzato prima della validazione.
- Validator e serializer confusi.
- Schema e tipi manuali che divergono.
- Middleware degli errori registrato prima delle route.
- Risposta costruita copiando tutti i campi ricevuti.
- Confrontare prestazioni dei framework sulla base di questo demo.

## Checklist

- Parsing, media type, dimensione e schema sono controllati?
- Gli errori pubblici non espongono dettagli interni?
- La logica riceve soltanto il dato validato?
- Risposta e status sono testati insieme?
- Autenticazione, lifecycle e requisiti di produzione sono separati?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/TypeScript con Node.js|TypeScript con Node.js]]
- [[Programmazione/TypeScript/Pagine/API tipizzate|API tipizzate e client di prova]]
- [[Programmazione/TypeScript/Pagine/Schema validation con Zod|Schema validation con Zod]]
- [[Programmazione/TypeScript/Pagine/Module augmentation|Module augmentation]]

## Fonti

- [Express 5 - Request](https://expressjs.com/en/5x/api/request/)
- [Express 5 - Error handling](https://expressjs.com/en/guide/error-handling/)
- [Fastify - TypeScript](https://fastify.dev/docs/latest/Reference/TypeScript/)
- [Fastify - Validation and Serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
