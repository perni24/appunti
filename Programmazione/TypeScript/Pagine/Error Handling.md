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
  - error-handling
  - result
  - exceptions
aliases:
  - Gestione errori TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Discriminated Unions]]"
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
related:
  - "[[Programmazione/TypeScript/Pagine/API tipizzate]]"
  - "[[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni]]"
  - "[[Programmazione/TypeScript/Pagine/Best Practices]]"
title: Error Handling
---

# Error Handling

## Sintesi

Distingui **fallimenti previsti** dal contratto, **problemi tecnici** e **bug**. Un tipo `Result` descrive risultati ordinari, mentre eccezioni e Promise rifiutate rimangono possibili. TypeScript non ha checked exceptions: `Promise<T>` non dichiara il tipo dei rifiuti.

Baseline: **TypeScript 5.9.3**, `strict: true`, target/lib **ES2022**, **Node 24.14.0**. `Error.cause` richiede supporto del runtime oltre alle dichiarazioni del compilatore.

## Quando usarlo

- Parser, configurazioni e operazioni I/O.
- Client e server HTTP.
- Funzioni con fallimenti attesi da mostrare all'utente.
- Workflow asincroni dove occorre preservare la causa di un errore.

## Come funziona

### Result ed eccezioni

Un `Result` e utile se il chiamante deve decidere cosa fare con un fallimento ordinario. Non rende automaticamente totale una funzione e non costringe il chiamante a usarlo.

Le eccezioni sono appropriate quando il livello corrente non puo completare il lavoro e deve trasferire il controllo. Non catturare tutto soltanto per restituire un successo fittizio, un array vuoto o un errore "input invalido".

### Unknown e confini

In questa baseline `strict` include `useUnknownInCatchVariables`: una variabile `catch` non annotata e `unknown`. Non assumere che abbia `message`, `stack` o `code`. `instanceof Error` funziona nel normale caso dello stesso realm, ma non copre tutti gli oggetti errore cross-realm.

Questo flag non rende automaticamente `unknown` il parametro di `Promise.catch`: nelle dichiarazioni standard puo essere `any`; annotalo esplicitamente se lo usi.

## API / Sintassi

I blocchi seguenti sono un unico modulo. Il contratto distingue assenza, JSON malformato e contenuto non conforme:

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type Config = { port: number };
type ConfigError = "missing" | "invalid_json" | "invalid_config";
```

I codici sono stabili per il chiamante. Messaggi tecnici, stack trace e credenziali non devono diventare automaticamente payload HTTP.

## Esempio pratico

### Parsing e validazione

```ts
function parseConfig(text: string): Result<Config, ConfigError> {
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return { ok: false, error: "invalid_json" };
    }
    throw error;
  }

  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input) ||
    !Object.hasOwn(input, "port") ||
    !("port" in input) ||
    typeof input.port !== "number" ||
    !Number.isInteger(input.port) ||
    input.port < 1 ||
    input.port > 65535
  ) {
    return { ok: false, error: "invalid_config" };
  }

  return { ok: true, value: { port: input.port } };
}
```

Sono verificati forma e intervallo della porta; eventuali campi extra non vengono copiati. Non e una prova che la porta sia libera. Il testo e gia in memoria: limiti di dimensione e lettura appartengono al livello precedente.

### Lettura asincrona e causa

```ts
async function loadConfig(
  readText: () => Promise<string | undefined>,
): Promise<Result<Config, ConfigError>> {
  let text: string | undefined;
  try {
    text = await readText();
  } catch (cause: unknown) {
    throw new Error("Configuration read failed", { cause });
  }

  if (text === undefined) {
    return { ok: false, error: "missing" };
  }
  return parseConfig(text);
}
```

La dipendenza segnala **assenza con undefined** e problemi tecnici con un rifiuto. Un adapter filesystem dovrebbe tradurre soltanto l'errore di file assente, non ogni errore I/O, in undefined. Qui non viene letto alcun file reale.

Il `try` e ristretto alla lettura: un bug nel parser non viene etichettato erroneamente come errore I/O. La causa originale, anche se non e un Error, resta disponibile per diagnostica interna. Non serializzarla indiscriminatamente.

### Consumo esplicito

```ts
async function describeConfig(
  readText: () => Promise<string | undefined>,
): Promise<string> {
  try {
    const result = await loadConfig(readText);
    if (result.ok) {
      return `Port: ${result.value.port}`;
    }

    switch (result.error) {
      case "missing":
        return "Configuration missing";
      case "invalid_json":
        return "Malformed JSON";
      case "invalid_config":
        return "Invalid configuration";
      default: {
        const unhandled: never = result.error;
        return unhandled;
      }
    }
  } catch {
    return "Configuration unavailable";
  }
}
```

Il messaggio finale e pubblico e volutamente generico. In un'app reale aggiungi al confine una diagnostica interna redatta e un identificatore di correlazione. Non registrare lo stesso errore a ogni livello; non restituire lo stack al client.

`await` dentro il try osserva il rifiuto. Un semplice `return loadConfig(...)` senza await non permetterebbe a quel catch di intercettarne il rifiuto asincrono.

## Varianti

- **Error subclass**: utile per categorie locali, ma `instanceof` non e un formato di trasporto e JSON non preserva il prototipo.
- **Oggetto discriminato**: adatto a risultati e DTO; va validato quando arriva da remoto.
- **Retry**: solo per fallimenti riconosciuti come temporanei e operazioni ripetibili; non per ogni catch.
- **Abort/timeout**: mantenere una categoria distinguibile quando prevista dal contratto; annullare il client non garantisce il rollback del server.
- **Cleanup**: `finally` per liberare risorse. Un return o un nuovo throw in finally puo mascherare il risultato o l'errore precedente.

## Errori comuni

- `catch (error)` seguito da `error.message` senza narrowing.
- Convertire tutti i fallimenti in "input invalido".
- Pensare che `void task()` gestisca un rifiuto.
- Rilanciare con `new Error(String(error))` perdendo la causa originale.
- Credere che `Promise<Result<...>>` non possa rifiutarsi.
- Ignorare un Result o utilizzare fallback che nascondono un guasto.

## Checklist

- Fallimenti attesi e problemi tecnici distinti.
- Catch ristretto al lavoro che si vuole classificare.
- Cause preservate e messaggi pubblici separati.
- Promise attese e risultati interpretati.
- Test di successo, assenza, input errato e rifiuto.
- Cleanup e retry con politica esplicita.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Discriminated Unions|Discriminated Unions]]
- [[Programmazione/TypeScript/Pagine/API tipizzate|API tipizzate]]
- [[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni|Parsing sicuro di input esterni]]
- [[Programmazione/TypeScript/Pagine/Linting e formattazione|Linting e formattazione]]

## Fonti

- [TypeScript: useUnknownInCatchVariables](https://www.typescriptlang.org/tsconfig/useUnknownInCatchVariables.html).
- [TypeScript: narrowing e never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
- [MDN: Error.cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause).
- [typescript-eslint: Promise non gestite](https://typescript-eslint.io/rules/no-floating-promises/).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
