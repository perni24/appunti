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
  - zod
  - schema-validation
  - runtime-validation
aliases:
  - Zod
  - Validazione con Zod
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
  - "[[Programmazione/TypeScript/Pagine/Strict mode]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni]]"
  - "[[Programmazione/TypeScript/Pagine/API contract]]"
title: Schema validation con Zod
---

# Schema validation con Zod

## Sintesi

Zod descrive schemi eseguibili e permette di derivarne tipi TypeScript. Lo schema esiste a runtime; il tipo ottenuto con `z.infer` no. Definire lo schema non basta: devi applicarlo al valore ricevuto e utilizzare il risultato.

Baseline: **Zod 4.6.7**, **TypeScript 5.9.3**, **Node.js 24.14.0**. La documentazione richiede `strict` e dichiara supporto da TypeScript 5.5. Gli esempi non sono una guida alla migrazione da Zod 3.

## Quando usarlo

- Validare form, request, configurazioni e risposte esterne.
- Condividere un contratto runtime senza duplicare a mano le interfacce.
- Ottenere errori associati ai percorsi dei campi.
- Applicare trasformazioni esplicite e distinguere input da output.

## Come funziona

- `parse` restituisce il dato elaborato oppure lancia un `ZodError` per una violazione dello schema.
- `safeParse` restituisce una union con `success`: usa `data` nel ramo positivo e `error.issues` nel ramo negativo.
- `parseAsync` e `safeParseAsync` servono per refinement o transform asincroni.

`safeParse` **non e un contenitore universale di eccezioni**. Errori lanciati dal tuo callback possono propagarsi; un refinement deve segnalare l'esito tramite il contratto Zod, non con un `throw` arbitrario. Anche usare il metodo sincrono con una validazione asincrona e un errore.

## API / Sintassi

In un progetto dimostrativo separato, `package.json`:

```json
{
  "private": true,
  "type": "module",
  "dependencies": { "zod": "4.6.7" },
  "devDependencies": { "typescript": "5.9.3" }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "types": [],
    "rootDir": "src",
    "outDir": "dist",
    "noEmitOnError": true
  },
  "include": ["src/**/*.ts"]
}
```

Installare nel progetto dimostrativo, non nella root del vault:

```sh
npm install
```

Conserva il lockfile e usa `npm ci` nelle successive installazioni riproducibili.

## Esempio pratico

`src/main.ts`:

```ts
import { z } from "zod";

export const CreateItemSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  quantity: z.number().int().min(1).max(100).default(1),
  contactEmail: z.email().optional(),
});

export type CreateItemInput = z.input<typeof CreateItemSchema>;
export type CreateItem = z.output<typeof CreateItemSchema>;

const raw: unknown = { name: "  Notebook  " };
const result = CreateItemSchema.safeParse(raw);

if (result.success) {
  console.log(result.data.name, result.data.quantity); // Notebook 1
} else {
  console.log(
    result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      code: issue.code,
    })),
  );
}
```

Compilare:

```sh
npm exec -- tsc -p tsconfig.json
```

Eseguire:

```sh
node dist/main.js
```

La quantita e opzionale in input ma presente nell'output grazie al default. `z.infer<typeof CreateItemSchema>` equivale al tipo di output. Il numero positivo rimane staticamente `number`, non un intervallo numerico codificato nel tipo.

Il nome viene normalizzato con `trim` prima dei controlli; `quantity: "2"` viene rifiutato. `null` non attiva il default. Il formato email e controllato dalla regola Zod, ma non prova che l'indirizzo esista o appartenga all'utente.

Il risultato e un nuovo record elaborato; `raw` non viene modificato. Non ignorare `result.data` dopo aver chiamato `safeParse`.

## Varianti

### Campi sconosciuti

Con dati JSON ordinari scegli una politica:

- `z.object` elimina le chiavi non dichiarate dal risultato.
- `z.strictObject` rifiuta chiavi non dichiarate.
- `z.looseObject` conserva le chiavi aggiuntive.
- `catchall` controlla anche il valore delle chiavi aggiuntive.

La scelta influenza compatibilita e sicurezza del confine. Non usare un oggetto permissivo direttamente per aggiornare un record del database. Nessuna di queste opzioni sostituisce l'autorizzazione dei campi.

### Input e output differenti

Esempio indipendente:

```ts
import { z } from "zod";

const LengthSchema = z.string().transform((text) => text.length);
type LengthInput = z.input<typeof LengthSchema>; // string
type LengthOutput = z.output<typeof LengthSchema>; // number

console.log(LengthSchema.parse("book")); // 4
```

Qui la lunghezza usa JavaScript `text.length`, quindi unita UTF-16. La funzione non viene eseguita dal solo uso del tipo `LengthOutput`.

### Coercion da usare deliberatamente

Esempio indipendente dei comportamenti da non confondere con un parser restrittivo:

```ts
import { z } from "zod";

console.log(z.coerce.number().parse("")); // 0
console.log(z.coerce.number().parse(true)); // 1
console.log(z.coerce.boolean().parse("false")); // true
```

La coercion segue conversioni JavaScript. Per una variabile ambiente con sintassi precisa, prima restringi i valori ammessi oppure usa un parser dedicato. Non accettare `true` come porta di rete solo perche diventa `1`.

### Assenza, null e fallback

`optional` ammette `undefined`, `nullable` ammette `null`, `nullish` entrambi. `default` risponde a `undefined` e puo saltare le trasformazioni precedenti; `prefault` fornisce invece un input da elaborare. `catch` sostituisce un errore di validazione con un fallback: applicarlo senza una decisione esplicita puo nascondere una configurazione sbagliata.

### Refinement, asincronia e JSON Schema

Un refinement aggiunge un vincolo, non autorizza un'operazione. Una verifica asincrona di disponibilita non sostituisce un vincolo transazionale: lo stato puo cambiare dopo il controllo.

Zod 4 include `z.toJSONSchema`. Trasformazioni, tipi JavaScript non JSON e controlli custom possono non essere rappresentabili o perdere informazioni; non assumere equivalenza completa tra schema esportato e comportamento Zod. Scegli e verifica anche il lato input/output e il formato di destinazione.

## Errori comuni

- Duplicare schema e interfaccia fino a farli divergere.
- Usare `safeParse(...).success` e poi trattare l'input originale come se fosse l'output trasformato.
- Promettere che `safeParse` non possa mai lanciare.
- Accettare coercion o default senza documentarli.
- Esportare l'errore completo o il payload nei log senza valutare i dati riservati.
- Validare solo nel frontend o confondere uno schema con una politica di password/autenticazione completa.

## Checklist

- Versioni e `strict` sono espliciti?
- Ho distinto `z.input`, `z.output` e il dato realmente restituito?
- Ho scelto la politica per campi extra, assenza e null?
- Conversioni e fallback sono voluti e testati?
- Uso i metodi async quando necessari?
- La validazione applicativa e separata da autorizzazione e persistenza?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]
- [[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni|Parsing sicuro di input esterni]]
- [[Programmazione/TypeScript/Pagine/API contract|API contract]]

## Fonti

- [Zod - Requisiti](https://zod.dev/)
- [Zod - Parsing e tipi derivati](https://zod.dev/basics)
- [Zod - Schemi e refinement](https://zod.dev/api)
- [Zod - JSON Schema](https://zod.dev/json-schema)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
