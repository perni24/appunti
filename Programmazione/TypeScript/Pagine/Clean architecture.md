---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - typescript
  - clean-architecture
  - architecture
  - backend
aliases:
  - Clean Architecture TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Domain modeling]]"
  - "[[Programmazione/TypeScript/Pagine/Pattern Repository e Service]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Dependency injection]]"
  - "[[Programmazione/TypeScript/Pagine/DTO e modelli di dominio]]"
title: Clean architecture
---

# Clean architecture

## Sintesi

La clean architecture separa regole e casi d'uso dai dettagli esterni. La regola importante riguarda **le dipendenze del codice sorgente**, non il numero di cartelle: il nucleo non deve importare controller, ORM o implementazioni esterne.

Il costo e maggiore struttura e mapping. Va adottata dove riduce accoppiamenti reali, non come requisito per qualunque applicazione TypeScript.

Baseline del progetto: **TypeScript 5.9.3**, **Node 24.14.0**, target **ES2022**.

## Quando usarlo

- Dominio con regole da preservare nel tempo.
- Casi d'uso condivisi tra HTTP, CLI, queue o job.
- Test delle policy senza avviare infrastruttura.
- Sostituzione o evoluzione di adapter con contratti chiari.

Per un CRUD semplice, una separazione piu leggera puo essere sufficiente. L'architettura non rende gratuitamente intercambiabili database con semantiche diverse.

## Come funziona

Nel demo:

- **domain**: modello Task e regola per stabilire se e aperto.
- **application**: caso d'uso e porta di lettura di cui ha bisogno.
- **adapters**: memoria e traduzione da input sconosciuto a risposta JSON.
- **main**: composition root che collega le implementazioni.

La porta appartiene al lato che la usa, non obbligatoriamente a un generico livello "interfaces". Un import type verso l'adapter esterno violerebbe comunque il confine concettuale, anche se sparisce dal JavaScript.

```text
Dipendenze del sorgente:
main -> adapters -> application -> domain
                 -> domain

Flusso runtime:
adapter di ingresso -> caso d'uso -> porta -> adapter dei dati
```

Il flusso di esecuzione puo uscire verso una dipendenza ricevuta; il caso d'uso non deve importarne l'implementazione. Non e necessario usare classi: le factory di funzioni sono sufficienti qui.

## API / Sintassi

Progetto autonomo, senza framework, database o nuove dipendenze runtime:

```text
task-demo/
  package.json
  tsconfig.json
  src/
    domain/task.ts
    application/getOpenTask.ts
    adapters/memoryTasks.ts
    adapters/handleGetTask.ts
    main.ts
```

`package.json`:

```json
{
  "name": "clean-architecture-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "tsc --noEmit",
    "build": "tsc",
    "start": "node dist/main.js"
  },
  "devDependencies": {
    "typescript": "5.9.3"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "noEmitOnError": true,
    "rootDir": "src",
    "outDir": "dist",
    "types": []
  },
  "include": ["src/**/*.ts"]
}
```

DOM fornisce qui la dichiarazione di console usata dal demo: non installa API browser in Node. Per un'app che usa API specifiche Node, aggiungi i tipi Node coerenti con il runtime. Gli import locali terminano in .js per l'output ESM compilato.

## Esempio pratico

### Dominio e caso d'uso

`src/domain/task.ts`:

```ts
export type Task = Readonly<{
  id: string;
  title: string;
  done: boolean;
}>;

export function isOpen(task: Task): boolean {
  return !task.done;
}
```

`src/application/getOpenTask.ts`:

```ts
import { isOpen } from "../domain/task.js";
import type { Task } from "../domain/task.js";

export interface TaskReader {
  findById(id: string): Promise<Task | null>;
}

export type OpenTaskResult =
  | { kind: "found"; task: { id: string; title: string } }
  | { kind: "missing" }
  | { kind: "closed" };

export function makeGetOpenTask(reader: TaskReader) {
  return async function getOpenTask(id: string): Promise<OpenTaskResult> {
    const task = await reader.findById(id);
    if (task === null) return { kind: "missing" };
    if (!isOpen(task)) return { kind: "closed" };
    return { kind: "found", task: { id: task.id, title: task.title } };
  };
}

export type GetOpenTask = ReturnType<typeof makeGetOpenTask>;
```

Il caso d'uso non conosce status HTTP, console, SQL o la classe dell'adapter. Un errore della lettura si propaga: non diventa un risultato missing.

### Adapter

`src/adapters/memoryTasks.ts`:

```ts
import type { Task } from "../domain/task.js";
import type { TaskReader } from "../application/getOpenTask.js";

export function createMemoryTasks(seed: readonly Task[]): TaskReader {
  const tasks = new Map<string, Task>();
  for (const task of seed) {
    if (tasks.has(task.id)) throw new Error("Duplicate task ID");
    tasks.set(task.id, { id: task.id, title: task.title, done: task.done });
  }

  return {
    async findById(id) {
      const task = tasks.get(id);
      return task === undefined ? null : { ...task };
    },
  };
}
```

Il seed e una fixture tipizzata e attendibile, non un parser di dati esterni. Le copie proteggono i record in memoria da modifiche tramite riferimenti restituiti.

`src/adapters/handleGetTask.ts`:

```ts
import type { GetOpenTask } from "../application/getOpenTask.js";

type Reply =
  | { status: 200; body: { id: string; title: string } }
  | { status: 400; body: { error: "invalid_id" } }
  | { status: 404; body: { error: "not_available" } };

export function makeHandleGetTask(getOpenTask: GetOpenTask) {
  return async function handle(input: unknown): Promise<Reply> {
    if (
      typeof input !== "string" ||
      input.length < 1 ||
      input.length > 32 ||
      /[^a-z0-9-]/.test(input)
    ) {
      return { status: 400, body: { error: "invalid_id" } };
    }

    const result = await getOpenTask(input);
    switch (result.kind) {
      case "found":
        return { status: 200, body: result.task };
      case "missing":
      case "closed":
        return { status: 404, body: { error: "not_available" } };
      default: {
        const unhandled: never = result;
        return unhandled;
      }
    }
  };
}
```

Questo e un adapter che **costruisce dati di risposta**, non un server HTTP. La politica del demo rende indistinguibili closed e missing all'esterno; non e un sistema di autorizzazione. Il livello HTTP reale dovra gestire autenticazione, limiti, errori inattesi e invio della risposta.

### Composition root e avvio

`src/main.ts`:

```ts
import { makeGetOpenTask } from "./application/getOpenTask.js";
import { createMemoryTasks } from "./adapters/memoryTasks.js";
import { makeHandleGetTask } from "./adapters/handleGetTask.js";

const reader = createMemoryTasks([
  { id: "t1", title: "Studiare TypeScript", done: false },
  { id: "t2", title: "Nota completata", done: true },
]);
const handle = makeHandleGetTask(makeGetOpenTask(reader));

for (const input of ["t1", "t2", "missing", 42]) {
  console.log(JSON.stringify(await handle(input)));
}
```

Dalla cartella del demo:

```bash
npm install
```

```bash
npm run check
```

```bash
npm run build
```

```bash
npm start
```

L'output contiene quattro righe JSON con status **200, 404, 404, 400**. La prima espone id e title, non done. Conserva il lockfile; in CI usa npm ci. Nessuna porta viene aperta e nessun dato viene persistito.

## Varianti

- **Hexagonal/ports and adapters**: mette in evidenza le interazioni attraverso porte e adapter; condivide l'obiettivo di isolare policy e dettagli, senza essere una struttura identica obbligatoria.
- **Layered architecture**: separa responsabilita, ma la direzione degli import va comunque decisa.
- **Feature-based**: puoi organizzare prima per funzionalita e mantenere questi confini al suo interno.
- **Modular monolith**: i moduli possono stare nello stesso processo; separazione architetturale non implica microservizi.

Per i comandi che scrivono, definisci transazioni e controllo di concorrenza: questa query di lettura non li dimostra. Non trasferire automaticamente lo schema del demo a un pagamento o un ordine reale.

## Errori comuni

- Importare Express o l'ORM nel nucleo, anche soltanto attraverso tipi.
- Chiamare clean un progetto solo perche ha quattro cartelle.
- Passare oggetti Request, righe del driver o container globale al caso d'uso.
- Duplicare interfacce e mapper senza una ragione.
- Testare solo fake e assumere che l'adapter reale abbia le stesse garanzie.

## Checklist

- Dipendenze del sorgente dirette verso le policy.
- Porte definite secondo le esigenze del caso d'uso.
- Wiring in un punto esterno riconoscibile.
- Test del dominio, dei casi d'uso e degli adapter distinti.
- Controlli degli import in lint o test, inclusi quelli type-only.
- Costi della separazione giustificati.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Domain modeling|Domain modeling]]
- [[Programmazione/TypeScript/Pagine/Pattern Repository e Service|Pattern Repository e Service]]
- [[Programmazione/TypeScript/Pagine/Dependency injection|Dependency injection]]
- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS|Moduli ES e CommonJS]]

## Fonti

- [Robert C. Martin: The Clean Architecture e Dependency Rule](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html).
- [Alistair Cockburn: articolo originale su ports and adapters](https://alistair.cockburn.us/hexagonal-architecture).
- [Martin Fowler: presentation, domain e data layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
