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
  - assertion-functions
  - narrowing
  - runtime-validation
aliases:
  - Assertion function
  - asserts
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Guards]]"
  - "[[Programmazione/TypeScript/Pagine/Type predicates]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Assertion e casting dei tipi]]"
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
title: Assertion functions
---

# Assertion functions

## Sintesi

Le **assertion functions** comunicano a TypeScript che, **se ritornano normalmente**, una condizione e vera o un valore ha un certo tipo. L'implementazione deve impedire di proseguire quando la promessa non vale, normalmente lanciando un errore.

Usano firme come `asserts condition` oppure `asserts value is Type`.

## Quando usarlo

- Quando vuoi fallire subito se un valore non e valido.
- Quando validi input all'inizio di una funzione.
- Quando vuoi evitare controlli ripetuti dopo una validazione.
- Quando scrivi helper di test o invariant check.
- Quando controlli dati `unknown` senza doverne creare una copia o trasformarli.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022.

Una firma `asserts` non espone al chiamante un risultato booleano; la chiamata si usa come istruzione, non come condizione di un `if`. Se ritorna normalmente, il checker restringe il tipo nel percorso successivo.

TypeScript si fida della firma: non inserisce un `throw` e non prova che il corpo validi davvero la promessa. Anche una funzione vuota con `asserts value is string` puo compilare. La correttezza del controllo resta responsabilita dell'implementazione e dei test.

## API / Sintassi

```ts
function assertString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError("Expected string");
  }
}
```

## Esempio pratico

Configurazione locale da JSON: viene verificata soltanto la forma minima, non la validita o l'affidabilita dell'URL.

```ts
type Config = {
  apiUrl: string;
};

function assertConfig(value: unknown): asserts value is Config {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !Object.hasOwn(value, "apiUrl") ||
    !("apiUrl" in value) ||
    typeof value.apiUrl !== "string"
  ) {
    throw new TypeError("Expected config.apiUrl to be a string");
  }
}

const raw: unknown = { apiUrl: "https://example.com" };

assertConfig(raw);

console.log(raw.apiUrl);
```

Dopo `assertConfig(raw)`, il percorso successivo usa `raw` come `Config`. Stringa vuota, URL non valido o protocollo indesiderato richiedono altre regole; l'esempio non avvia richieste di rete.

Il controllo conserva identita e campi aggiuntivi, non normalizza ne proietta l'oggetto. Sono assunti record ordinari da JSON, non getter o Proxy ostili. Una mutazione successiva tramite alias puo invalidare la premessa.

### Asserire una condizione

```ts
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function requireFiniteNumber(value: unknown): number {
  assert(typeof value === "number", "Expected number");
  assert(Number.isFinite(value), "Expected finite number");
  return value;
}

console.log(requireFiniteNumber(0)); // 0
```

La prima chiamata restringe a `number`; la seconda applica una regola runtime aggiuntiva, ma non crea un tipo speciale "numero finito". `assert(value, ...)` usato direttamente come controllo di presenza rifiuterebbe anche zero, false e stringa vuota.

### Helper per null e undefined

```ts
function assertDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error("Expected a defined value");
  }
}

function upperLabel(value: string | undefined): string {
  assertDefined(value);
  return value.toUpperCase();
}

console.log(upperLabel("ciao")); // CIAO
```

Questo helper conserva i valori falsy non nullish. Non promette stringhe non vuote, numeri positivi o oggetti completi.

### Arrow function: annotare il nome chiamato

```ts
const assertString: (value: unknown) => asserts value is string =
  (value) => {
    if (typeof value !== "string") {
      throw new TypeError("Expected string");
    }
  };

function shout(value: unknown): string {
  assertString(value);
  return value.toUpperCase();
}

console.log(shout("ciao")); // CIAO
```

Per usare l'effetto `asserts`, il checker richiede dichiarazioni esplicite appropriate sul nome chiamato. In questo caso annota la variabile, non soltanto il ritorno dell'arrow; altrimenti puoi ricevere TS2775. Una dichiarazione `function assertString(...)` con firma `asserts` evita questa ambiguita.

### Catch, async e conversioni

- Se catturi l'errore, il codice dopo il `catch` non puo assumere che il controllo sia riuscito. Il narrowing vale sul percorso di ritorno normale, non sul percorso che ha lanciato.
- Non esiste una firma `Promise<asserts value is T>`: per una validazione asincrona restituisci `Promise<T>` con un valore validato, oppure attendi il dato e applica un'asserzione sincrona.
- `as T` e `value!` non eseguono alcun controllo. Una assertion function ne esegue uno solo se il suo corpo lo implementa davvero.
- Per correggere o normalizzare i dati, usa un parser che restituisca il nuovo valore, non una firma `asserts` che pretende di aver convertito l'originale.

## Varianti

- **`asserts condition`**: garantisce che una condizione sia vera.
- **`asserts value is Type`**: restringe un valore a un tipo.
- **Invariant helper**: lancia se uno stato impossibile accade.
- **Test assertions**: helper per test e validazioni.

## Errori comuni

- **Usare assertion function per flussi recuperabili**: se il caso e normale, meglio restituire risultato/errore.
- **Non lanciare errore quando il valore e invalido**: la firma diventa falsa.
- **Nascondere validazioni complesse in funzioni non testate**: rischio alto ai confini runtime.
- **Confondere con type assertion `as`**: qui puo esserci logica runtime reale, ma la firma non la genera.

## Checklist

- Lanciare sempre errore quando la condizione non e valida.
- Usare assertion functions per invarianti o validazioni all'ingresso.
- Testare assertion usate su dati esterni.
- Preferire type guard se serve ramo `true/false`.
- Evitare messaggi d'errore generici nei confini importanti.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type Guards|Type Guards]]
- [[Programmazione/TypeScript/Pagine/Type predicates|Type predicates]]
- [[Programmazione/TypeScript/Pagine/Assertion e casting dei tipi|Assertion e casting dei tipi]]


## Fonti

- [TypeScript 3.7: assertion functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html), firme e comportamento.
- [TypeScript: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), percorsi di controllo.
- [TypeScript: NonNullable](https://www.typescriptlang.org/docs/handbook/utility-types.html#nonnullabletype).
- [MDN: Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn), proprieta proprie.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
