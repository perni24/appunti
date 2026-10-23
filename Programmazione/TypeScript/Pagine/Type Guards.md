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
  - type-guards
  - narrowing
  - runtime-validation
aliases:
  - Type guard
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Narrowing]]"
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Type predicates]]"
  - "[[Programmazione/TypeScript/Pagine/Assertion functions]]"
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
title: Type Guards
---

# Type Guards

## Sintesi

I **type guards** sono controlli che permettono a TypeScript di restringere un tipo. Possono essere controlli nativi, come `typeof`, oppure funzioni definite dall'utente con un type predicate.

Sono il ponte tra dati runtime e type system statico.

## Quando usarlo

- Per usare in sicurezza valori `unknown`.
- Per distinguere membri di una union.
- Per validare forme minime di oggetti ricevuti dall'esterno.
- Per evitare assertion fragili.
- Per centralizzare controlli riutilizzati in piu punti.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022.

Una guardia esegue un controllo runtime riconosciuto dal checker, oppure comunica il risultato tramite un predicate. Il narrowing e spiegato in [[Programmazione/TypeScript/Pagine/Type Narrowing|Type Narrowing]]; il contratto dei due rami di `value is T` in [[Programmazione/TypeScript/Pagine/Type predicates|Type predicates]].

- `typeof` distingue categorie primitive: `"object"` include anche `null` e array.
- `Array.isArray` identifica un array, non il tipo dei suoi elementi.
- `instanceof` usa normalmente la catena dei prototipi: un oggetto letto da JSON non diventa un'istanza della classe corrispondente.
- `in` considera anche il prototipo e non verifica il tipo del valore della proprieta.
- `Object.hasOwn` verifica una proprieta propria, ma nella baseline non restringe da solo il tipo dell'oggetto per permetterne la lettura.

Le API native non sono intercambiabili. Per esempio `Array.isArray` funziona anche su array di un altro realm; `instanceof Array` puo dare `false`.

## API / Sintassi

```ts
function isString(value: unknown): value is string {
  return typeof value === "string";
}
```

## Esempio pratico

Guardia minima per record JSON con campi propri, non per autenticare utenti:

```ts
type User = {
  id: string;
  email: string;
};

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.hasOwn(value, "id") &&
    Object.hasOwn(value, "email") &&
    "id" in value &&
    "email" in value &&
    typeof value.id === "string" &&
    typeof value.email === "string"
  );
}

function handle(value: unknown): string {
  if (!isUser(value)) {
    return "Utente non valido";
  }

  return value.email;
}

console.log(handle({ id: "u_1", email: "x@example.com" })); // x@example.com
console.log(handle({ id: 1, email: null })); // Utente non valido
```

`Object.hasOwn` applica la policy sui campi propri; `in` consente anche al checker di leggere quelle proprieta da un `object`; `typeof` controlla i valori effettivi. Formato email, stringhe vuote, esistenza dell'utente e permessi non sono verificati.

Il guard restituisce un booleano: non elimina campi aggiuntivi, non copia e non normalizza. Assume record ordinari da JSON, non getter o Proxy ostili. La policy "campi propri, non array" e piu stretta del solo tipo strutturale `User`: usa questa guardia su `unknown` al confine JSON, non per dedurre che un valore gia tipizzato `User` non sia un utente solo perche eredita un campo.

### Presenza non significa valore utilizzabile

```ts
function readLabel(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "label" in value &&
    typeof value.label === "string"
  ) {
    return value.label;
  }
  return undefined;
}

console.log(readLabel({ label: undefined })); // undefined
console.log(readLabel({ label: "Appunti" })); // Appunti
```

Questo helper ammette anche una `label` ereditata: e una scelta diversa dalla policy JSON precedente. Una proprieta opzionale puo comparire sia nel ramo vero sia nel ramo falso di `in`; non e un discriminante esclusivo.

### Un array richiede controlli sugli elementi

```ts
function isStringArray(value: unknown): value is string[] {
  if (!Array.isArray(value)) {
    return false;
  }
  for (const item of value) {
    if (typeof item !== "string") {
      return false;
    }
  }
  return true;
}

console.log(isStringArray(["a", "b"]), isStringArray(["a", 1])); // true false
```

Il ciclo verifica anche le posizioni vuote come `undefined`, mentre `every` salta i buchi negli array sparsi. L'array vuoto passa: non viene promesso che contenga almeno un elemento. Non e una copia immutabile; un alias puo modificarlo dopo il controllo. Anche qui si assumono array ordinari e non iteratori o getter ostili.

## Varianti

- **Guard nativi**: `typeof`, `instanceof`, `in`.
- **Custom type guard**: funzione con ritorno `value is Type`.
- **Guard compositi**: combinano piu controlli.
- **Schema validator**: utile per schemi complessi e diagnostici; la robustezza dipende dalle regole realmente configurate.

## Errori comuni

- **Scrivere guard incompleti**: TypeScript si fida della firma, anche se la logica e sbagliata.
- **Validare solo presenza della proprieta**: non basta se conta anche il tipo del valore.
- **Usare guard troppo generici**: `isObject` spesso non garantisce abbastanza.
- **Confondere guard e parser**: un guard verifica, un parser puo trasformare o normalizzare.

## Checklist

- Controllare sia presenza sia tipo delle proprieta importanti.
- Tenere i guard piccoli e testabili.
- Usare `unknown` come input dei guard.
- Non dichiarare `value is Type` se il controllo non e sufficiente.
- Valutare schema validation per dati esterni complessi.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type Narrowing|Type Narrowing]]
- [[Programmazione/TypeScript/Pagine/Type predicates|Type predicates]]
- [[Programmazione/TypeScript/Pagine/Assertion functions|Assertion functions]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]


## Fonti

- [TypeScript: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), guardie native e proprieta opzionali.
- [TypeScript 4.9: unlisted property narrowing](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html), lettura di proprieta dopo `in`.
- [MDN: in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in) e [Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn).
- [MDN: Array.isArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray) e [Array.prototype.every](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
