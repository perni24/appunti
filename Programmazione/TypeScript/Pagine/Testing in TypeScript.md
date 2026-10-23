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
  - testing
  - vitest
  - jest
  - quality
aliases:
  - Test in TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Node.js]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Type-level testing]]"
  - "[[Programmazione/TypeScript/Pagine/Error Handling]]"
  - "[[Programmazione/TypeScript/Pagine/Source maps e debugging]]"
title: Testing in TypeScript
---

# Testing in TypeScript

## Sintesi

Un progetto TypeScript ha almeno due controlli distinti: **il checker verifica i tipi**, i **test eseguono il comportamento**. Una funzione puo avere la firma corretta e restituire il risultato sbagliato; un test puo passare anche se un altro file contiene errori di tipo.

Baseline dell'esempio: **TypeScript 5.9.3**, **Node 24.14.0**, **Vitest 4.1.12**, **Vite 8.3.4**. Sono versioni riproducibili, non un'indicazione automatica delle ultime release.

## Quando usarlo

- Logica di dominio, parser e trasformazioni.
- Integrazioni con database, filesystem e servizi.
- Componenti UI e flussi completi nel browser.
- Refactor di API pubbliche o generiche.

## Come funziona

Vitest trasforma il TypeScript ed esegue JavaScript. Nel setup seguente non effettua il type checking: `npm run check` e `npm test` devono riuscire entrambi. Il primo include anche i test, il secondo usa un ambiente Node, **non un browser**.

Scegli cosa verificare in base al rischio:

- **Unit test**: input/output di una funzione, inclusi limiti e fallimenti.
- **Integration test**: moduli e dipendenze reali insieme; una risposta simulata non collauda il server.
- **E2E**: un percorso utente su un'app avviata, per esempio con Playwright o Cypress.
- **Contract test**: accordo tra consumer e provider, non soltanto la forma di un oggetto locale.
- **Type-level test**: inferenza e chiamate ammesse dal compilatore; non prova effetti runtime.

Un mock rende deterministico un confine, ma deve rispettare il contratto reale. Evita di simulare proprio la funzione che vuoi verificare. Coverage alta non dimostra la qualita delle assertion o l'assenza di casi mancanti.

## API / Sintassi

Progetto minimo separato dal vault. `package.json`:

```json
{
  "name": "typescript-testing-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "@types/node": "24.19.2",
    "vitest": "4.1.12",
    "vite": "8.3.4"
  }
}
```

`tsconfig.json`, per questo progetto trasformato da Vite:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

Non e una configurazione di emissione per Node: il demo non produce una cartella `dist`. Per eseguire JavaScript compilato direttamente con Node usa la configurazione NodeNext della nota dedicata.

## Esempio pratico

`src/quantity.ts` applica un contratto piccolo: quantita intera tra 1 e 99, senza conversioni implicite.

```ts
export function parseQuantity(input: unknown): number {
  if (
    typeof input !== "number" ||
    !Number.isInteger(input) ||
    input < 1 ||
    input > 99
  ) {
    throw new RangeError("Quantity must be an integer from 1 to 99");
  }
  return input;
}

export async function loadQuantity(
  read: () => Promise<unknown>,
): Promise<number> {
  return parseQuantity(await read());
}
```

`tests/quantity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadQuantity, parseQuantity } from "../src/quantity";

describe("parseQuantity", () => {
  it.each([1, 42, 99])("accetta %s", (value) => {
    expect(parseQuantity(value)).toBe(value);
  });

  it.each([0, 100, 1.5, NaN, Infinity, "2", null, true])(
    "rifiuta %s",
    (value) => {
      expect(() => parseQuantity(value)).toThrow(RangeError);
    },
  );
});

it("valida il valore ottenuto dalla dipendenza", async () => {
  await expect(loadQuantity(() => Promise.resolve(2))).resolves.toBe(2);
  await expect(loadQuantity(() => Promise.resolve("2"))).rejects.toThrow(
    RangeError,
  );
});

it("propaga il fallimento della lettura", async () => {
  const cause = new Error("Read failed");
  await expect(loadQuantity(() => Promise.reject(cause))).rejects.toBe(cause);
});
```

Sono **13 casi runtime**: tre validi, otto invalidi, due asincroni. Le callback sono dipendenze simulate: non viene letto un database o un file.

Installazione dalla cartella del demo:

```bash
npm install
```

Controllo statico:

```bash
npm run check
```

Esecuzione singola, adatta anche alla CI:

```bash
npm test
```

Modalita watch per lo sviluppo:

```bash
npm run test:watch
```

Conserva il lockfile generato. In CI usa `npm ci` prima dei due controlli; non usare il watch come job destinato a terminare.

## Varianti

- **Jest**: necessita di una trasformazione TS coerente con ESM/CommonJS; non assumere che ogni transformer controlli i tipi.
- **Node test runner**: alternativa senza Vitest; compila prima oppure usa il supporto TS del runtime, sempre con checker separato.
- **UI**: DOM simulato e browser reale non sono equivalenti; layout e API browser richiedono prove appropriate.
- **Type tests**: `expectTypeOf` e `assertType` dipendono dal checker. La loro presenza in un test trasformato non rende il runner un verificatore statico.
- **Source map**: aiutano a leggere stack trace e debug, non aumentano da sole la copertura.

## Errori comuni

- **Dimenticare await/return** su un'assertion asincrona: il test puo concludersi prima del lavoro che dovrebbe osservare.
- **Usare toThrow per una Promise**: usare `await expect(promise).rejects`.
- **Includere solo src nel tsconfig**: i file test possono contenere errori non controllati.
- **Test basati su attese temporali arbitrarie**: preferire segnali espliciti; con timer simulati ripristinare lo stato.
- **Credere a un verde senza test**: verificare discovery, numero di casi e codice di uscita.

## Checklist

- Checker e runner eseguiti e bloccanti in CI.
- Casi nominali, limiti e fallimenti verificati.
- Promise delle assertion attese.
- Mock, timer e risorse ripristinati.
- Versioni, ambiente e limiti della prova dichiarati.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type-level testing|Type-level testing]]
- [[Programmazione/TypeScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/TypeScript/Pagine/TypeScript con Node.js|TypeScript con Node.js]]
- [[Programmazione/TypeScript/Pagine/Source maps e debugging|Source maps e debugging]]

## Fonti

- [Vitest 4: setup](https://v4.vitest.dev/guide/).
- [Vitest 4: funzionalita e trasformazione TypeScript](https://v4.vitest.dev/guide/features.html).
- [Vitest 4: test dei tipi](https://v4.vitest.dev/guide/testing-types).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
