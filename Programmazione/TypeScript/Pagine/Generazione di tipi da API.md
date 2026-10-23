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
  - api
  - codegen
  - openapi
  - graphql
aliases:
  - API type generation
  - Codegen tipi API
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/API tipizzate]]"
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript]]"
  - "[[Programmazione/TypeScript/Pagine/DTO e modelli di dominio]]"
title: Generazione di tipi da API
---

# Generazione di tipi da API

## Sintesi

La generazione dei tipi deriva contratti TypeScript da uno schema, evitando di riscrivere request e response a mano. Lo schema resta una descrizione: tipi generati correttamente da uno schema sbagliato continuano a essere sbagliati rispetto al server.

Baseline: **openapi-typescript 7.13.0**, **TypeScript 5.9.3**, **Node.js 24.14.0**. L'esempio usa OpenAPI **3.0.3** e genera dichiarazioni, non un client HTTP o un validatore.

## Quando usarlo

- Mantenere DTO frontend e contratto REST coerenti.
- Rilevare in CI modifiche allo schema non ancora rigenerate.
- Creare tipi per mock, SDK o adapter senza duplicare le forme.
- Separare la rappresentazione sulla rete dal modello di dominio.

## Come funziona

Il percorso e: schema versionato, generatore con versione fissata, output generato, consumer controllato. Per una modifica dell'API vanno verificati anche server, gestione degli errori e compatibilita dei consumer.

La nota usa uno schema locale completo, senza autenticazione o servizi esterni. Non trattare una URL remota mutabile come una fonte riproducibile: acquisisci una versione identificabile e non inserire token o header riservati nel repository.

## API / Sintassi

Nel progetto dimostrativo, installare gli strumenti:

```sh
npm install --save-dev --save-exact openapi-typescript@7.13.0 typescript@5.9.3
```

Impostare `"type": "module"` nel `package.json`. `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "rootDir": "src",
    "outDir": "dist",
    "noEmitOnError": true,
    "types": []
  },
  "include": ["src/**/*.ts"]
}
```

Le API Fetch sono descritte dai tipi DOM inclusi di default in questa configurazione e sono disponibili nel runtime Node scelto. Una libreria di tipi non aggiunge Fetch a un ambiente che ne e privo.

## Esempio pratico

### 1. Schema sorgente

`openapi.yaml`:

```yaml
openapi: 3.0.3
info:
  title: Users demo
  version: 1.0.0
paths:
  /users/{id}:
    get:
      operationId: getUser
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: User found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "404":
          description: User not found
components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: string
        email:
          type: string
        nickname:
          type: string
          nullable: true
```

`required` stabilisce la presenza; `nullable` in OpenAPI 3.0 ammette `null`. Qui `nickname` puo mancare oppure valere stringa o null. In OpenAPI 3.1 la nullabilita si modella con le regole JSON Schema, non copiando automaticamente `nullable`.

### 2. Generazione

```sh
npm exec -- openapi-typescript openapi.yaml -o src/generated/api-types.d.ts
```

Il file e un output da rigenerare, non da modificare a mano. Questo comando, con le opzioni mostrate, produce tipi privi di implementazione runtime.

### 3. Consumer e validazione esplicita

`src/client.ts`:

```ts
import type { paths } from "./generated/api-types.js";

export type GetUserResponse =
  paths["/users/{id}"]["get"]["responses"][200]["content"]["application/json"];

export function parseUser(payload: unknown): GetUserResponse {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("id" in payload) ||
    typeof payload.id !== "string" ||
    !("email" in payload) ||
    typeof payload.email !== "string"
  ) {
    throw new TypeError("Invalid user response");
  }

  return { id: payload.id, email: payload.email };
}

export async function getUser(id: string): Promise<GetUserResponse> {
  const url = "https://api.example.test/users/" + encodeURIComponent(id);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
  const payload: unknown = await response.json();
  return parseUser(payload);
}
```

L'import e solo di tipi: nessun `api-types.js` deve essere caricato a runtime. La risposta JSON e trattata come `unknown`, poi controllata e proiettata sui campi utilizzati.

Il parser e volutamente minimo: non verifica formato email, identita o autorizzazione. Non conserva `nickname`; per usarlo occorre aggiungere il suo controllo. Lo schema generato **non ha creato questo parser**. Per una validazione completa del contratto usa un validatore coerente con lo schema e testane la configurazione.

Compilare:

```sh
npm exec -- tsc -p tsconfig.json
```

La compilazione non invoca `getUser`. Il dominio `api.example.test` e dimostrativo e non rappresenta un servizio disponibile; per eseguire una richiesta devi sostituirlo con un server controllato o simulare Fetch nei test.

## Varianti

### Controllo in CI

Se versioni l'output generato, dopo `npm ci` verifica che corrisponda allo schema e alla versione fissata del generatore:

```sh
npm exec -- openapi-typescript openapi.yaml -o src/generated/api-types.d.ts --check
```

Poi controlla i consumer:

```sh
npm exec -- tsc -p tsconfig.json --noEmit
```

Il primo controllo rileva un output mancante o diverso; il secondo rileva incompatibilita statiche dei consumer. Nessuno confronta automaticamente lo schema con il server reale. Se non versioni l'output, generalo prima della compilazione in ogni build.

### Altre fonti e altri output

- **OpenAPI**: alcuni strumenti generano solo tipi, altri client o validatori. Non attribuire a tutti le stesse funzioni.
- **GraphQL**: i tipi delle operazioni dipendono anche da query, mutation e fragment effettivi, non soltanto dallo schema.
- **JSON Schema**: tipi generati e validatore runtime possono avere limiti diversi.
- **Prisma**: il modello del database non e automaticamente il contratto HTTP pubblico.
- **RPC tipizzato**: condividere tipi fra componenti non elimina validazione, compatibilita di versioni o problemi di rete.
- **Schema-first / code-first**: cambia la fonte autorevole; deve restare chiaro quale artefatto viene rigenerato.

### Limiti del formato

Un `date-time` sulla rete resta normalmente una stringa, non un oggetto `Date`. Formati, limiti numerici, pattern e vincoli tra campi non diventano necessariamente verifiche TypeScript. Enum, nullabilita e campi opzionali vanno osservati nell'output reale. La generazione non implementa retry, autenticazione, timeout o gestione di tutte le risposte HTTP.

## Errori comuni

- Fidarsi di un cast sul risultato di `response.json()`.
- Usare il tipo della sola risposta 200 per ignorare errori, JSON malformato o body assente.
- Modificare file generati invece della fonte.
- Generare con versioni diverse in locale e CI.
- Confondere schema database, DTO e modello di dominio.
- Dare per scontato che lo schema pubblicato sia fedele al server.

## Checklist

- Ho una fonte autorevole e versionata?
- Generatore e lockfile rendono ripetibile l'output?
- I tipi di presenza e nullabilita corrispondono al contratto?
- Gestisco status HTTP, errori di parsing e dati non validi?
- La CI verifica output generato e consumer?
- I test confrontano anche il comportamento effettivo del servizio?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/API tipizzate|API tipizzate]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]
- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]

## Fonti

- [openapi-typescript - Introduzione](https://openapi-ts.dev/introduction)
- [openapi-typescript - CLI](https://openapi-ts.dev/cli)
- [OpenAPI 3.0.3 - Schema Object](https://spec.openapis.org/oas/v3.0.3.html#schema-object)
- [OpenAPI 3.1.0 - Schema Object](https://spec.openapis.org/oas/v3.1.0.html#schema-object)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
