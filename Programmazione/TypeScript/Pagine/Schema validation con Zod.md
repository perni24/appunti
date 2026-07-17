---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, zod, schema-validation, runtime-validation]
aliases: [Zod, Validazione con Zod]
prerequisites: [Validazione runtime e tipi statici, Strict mode]
related: [Parsing sicuro di input esterni, API contract]
---

# Schema validation con Zod

## Sintesi

Zod e una libreria TypeScript-first per definire schemi di validazione runtime e derivare tipi statici dagli stessi schemi.

E utile quando vuoi una sola fonte di verita per validare dati esterni e ottenere tipi TypeScript coerenti.

## Quando usarlo

- Validazione di request body.
- Validazione di form.
- Parsing di env vars.
- Risposte API esterne.
- Configurazioni JSON.
- Contratti condivisi tra frontend e backend.

## Come funziona

Definisci uno schema con `z.object`, `z.string`, `z.number` e altri costruttori. Poi usi `parse` o `safeParse` per validare input runtime.

Con `z.infer<typeof Schema>` ottieni il tipo TypeScript derivato dallo schema.

## API / Sintassi

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;
```

## Esempio pratico

```ts
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function parseCreateUser(input: unknown) {
  return CreateUserSchema.parse(input);
}
```

`parse` restituisce un valore validato oppure lancia errore.

## Varianti

- **`parse`**: lancia errore se l'input non e valido.
- **`safeParse`**: restituisce successo/errore senza eccezioni.
- **`z.infer`**: deriva il tipo TypeScript.
- **Transform/refine**: validazione o trasformazione personalizzata.
- **JSON Schema conversion**: Zod 4 include supporto alla conversione JSON Schema.

## Errori comuni

- **Duplicare schema e tipo manuale**: meglio derivare il tipo dallo schema.
- **Usare `parse` dove serve gestione errore controllata**: in API spesso `safeParse` e piu comodo.
- **Validare solo al frontend**: il backend deve validare comunque.
- **Non abilitare `strict`**: Zod documenta `strict` come requisito/best practice.

## Checklist

- Derivare i tipi con `z.infer`.
- Usare `safeParse` sui confini API.
- Tenere gli schemi vicino al confine runtime.
- Validare backend e frontend quando necessario.
- Verificare versione Zod e requisiti TypeScript.

## Collegamenti

- [[Validazione runtime e tipi statici]]
- [[Parsing sicuro di input esterni]]
- [[API contract]]
- https://zod.dev/
