---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - typescript
  - any
  - unknown
  - never
  - type-safety
aliases:
  - any unknown never
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Introduzione a TypeScript]]"
  - "[[Programmazione/TypeScript/Pagine/Inferenza dei tipi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Type Narrowing]]"
  - "[[Programmazione/TypeScript/Pagine/Type Guards]]"
  - "[[Programmazione/TypeScript/Pagine/Exhaustiveness Checking]]"
title: any, unknown e never
---

# any, unknown e never

## Sintesi

`any`, `unknown` e `never` rappresentano tre casi speciali del type system TypeScript.

- `any` rinuncia a gran parte dei controlli sulle operazioni che coinvolgono quel valore.
- `unknown` puo contenere qualunque valore, ma richiede controlli prima degli usi che ne assumono una forma.
- `never` non ha valori: descrive un caso impossibile o una funzione che non termina normalmente.

Capirli e fondamentale per mantenere type safety nei confini incerti del programma.

## Quando usarlo

- `any`: solo come ultima risorsa o durante migrazioni temporanee.
- `unknown`: per input esterni, JSON, errori, dati non validati.
- `never`: per exhaustiveness checking, funzioni che lanciano sempre errore, stati impossibili.

## Come funziona

Gli esempi sono indipendenti e usano TypeScript 5.9.3 con `strict: true`.

| Tipo | Operazioni e assegnazioni |
| --- | --- |
| `any` | Permette accessi e chiamate non verificati; puo propagarsi ad altri valori. Non elimina ogni errore del programma. |
| `unknown` | Puo essere conservato, passato come `unknown`, confrontato o controllato. Non consente di chiamare metodi arbitrari senza narrowing. |
| `never` | E assegnabile a ogni tipo, ma nessun valore ordinario puo essergli assegnato; nemmeno `any` e una scappatoia per assegnare a `never`. |

`noImplicitAny` segnala l'assenza di informazioni in determinati punti, per esempio un parametro non annotato. **Non vieta `any` esplicito ne quello dichiarato da un'API**, come il ritorno di `JSON.parse` nelle librerie standard di questa versione.

`void` non significa `never`: una funzione `void` puo terminare normalmente, ma il suo risultato non viene usato come valore significativo. Una funzione `never` invece lancia sempre oppure non termina; una `async` che rifiuta sempre restituisce comunque una Promise al chiamante.

## API / Sintassi

```ts
const unsafe: any = JSON.parse("{}");
const value: unknown = JSON.parse("{}");

// unsafe.email.toUpperCase(); // Compila, ma qui lancia TypeError.
// value.email; // Errore statico: il valore e unknown.

function fail(message: string): never {
  throw new Error(message);
}
```

## Esempio pratico

Parser per **oggetti ottenuti da JSON**: accetta un campo proprio `email` che sia una stringa non vuota dopo `trim`, scarta gli altri campi e crea un nuovo oggetto. Non e un validatore completo di indirizzi email.

```ts
function parseUser(input: unknown): { email: string } {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input) ||
    !Object.hasOwn(input, "email") ||
    !("email" in input)
  ) {
    throw new TypeError("Expected an object with its own email");
  }

  const email = input.email;
  if (typeof email !== "string" || email.trim() === "") {
    throw new TypeError("Expected a non-empty email string");
  }
  return { email: email.trim() };
}

const raw: unknown = JSON.parse('{"email":" luca@example.com ","admin":true}');
const user = parseUser(raw);
console.log(user); // { email: "luca@example.com" }
```

`Object.hasOwn` impone la proprieta propria; `in` fornisce al checker il narrowing della proprieta. Il solo `in` accetterebbe anche proprieta ereditate. JSON invalido fallisce gia in `JSON.parse`, prima di questo parser.

Il contratto e limitato a dati JSON. Passare oggetti arbitrari con getter o Proxy puo eseguire codice durante i controlli: non e un isolamento per oggetti ostili.

### Errori e casi impossibili

Con `strict` il parametro di `catch` e `unknown`, salvo override dell'opzione dedicata:

```ts
function parseJsonMessage(text: string): string {
  try {
    JSON.parse(text);
    return "JSON valido";
  } catch (error) {
    return error instanceof Error ? error.message : "Errore non standard";
  }
}
```

`instanceof Error` non riconosce necessariamente gli Error di un altro realm; il ramo di fallback resta utile. In JavaScript si possono lanciare anche stringhe, numeri e `null`.

Un parametro `never` verifica che non rimangano alternative:

```ts
type Mode = "view" | "edit";

function assertNever(value: never): never {
  throw new Error("Unexpected mode");
}

function modeLabel(mode: Mode): string {
  switch (mode) {
    case "view":
      return "Visualizza";
    case "edit":
      return "Modifica";
    default:
      return assertNever(mode);
  }
}
```

Aggiungendo `"preview"` a `Mode` senza aggiungere il relativo `case`, la chiamata `assertNever(mode)` diventa un errore statico. L'eccezione resta una difesa runtime, non sostituisce la validazione degli input.

## Varianti

- **`any` implicito**: da evitare con `noImplicitAny`.
- **`unknown` per confini runtime**: scelta sicura per input non fidati.
- **`never` per stati impossibili**: utile con `switch` su union discriminate.
- **Algebra dei tipi**: `T | never` equivale a `T`; `T & unknown` equivale a `T`. `any` ha regole speciali: non usarlo come modello di queste relazioni.

## Errori comuni

- **Usare `any` per zittire il compilatore**: sposta gli errori al runtime.
- **Fare `value as User` invece del narrowing**: l'asserzione non verifica nulla.
- **Non capire `never` negli errori**: spesso significa che TypeScript ha dimostrato che un ramo e impossibile.
- **Tipizzare `catch (error)` come se fosse sempre `Error`**: in JavaScript si puo lanciare qualsiasi valore.

## Checklist

- Preferire `unknown` ad `any` per dati esterni.
- Abilitare `noImplicitAny`.
- Ridurre gli `any` temporanei con note di migrazione tracciabili.
- Usare `never` per verificare switch esaustivi.
- Validare dati runtime prima di convertirli in tipi applicativi.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Inferenza dei tipi|Inferenza dei tipi]]
- [[Programmazione/TypeScript/Pagine/Type Narrowing|Type Narrowing]]
- [[Programmazione/TypeScript/Pagine/Type Guards|Type Guards]]
- [[Programmazione/TypeScript/Pagine/Exhaustiveness Checking|Exhaustiveness Checking]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]

## Fonti

- [TypeScript: More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html), unknown, void e never.
- [TypeScript 3.0: unknown](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html).
- [TypeScript: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), rami esaustivi.
- [TSConfig: useUnknownInCatchVariables](https://www.typescriptlang.org/tsconfig/useUnknownInCatchVariables.html).
- [MDN: Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn), proprieta proprie.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
