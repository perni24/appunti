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
  - best-practices
  - quality
  - type-safety
aliases:
  - Best practice TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Strict mode]]"
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Linting e formattazione]]"
  - "[[Programmazione/TypeScript/Pagine/Error Handling]]"
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
title: Best Practices
---

# Best Practices

## Sintesi

Usa TypeScript per rendere chiari i contratti e ridurre gli stati ambigui. La priorita e **rendere affidabili i confini dei dati**, non costruire il tipo piu sofisticato possibile.

Baseline degli esempi: **TypeScript 5.9.3**, `strict: true`, target **ES2022**. Queste indicazioni sono criteri di progetto, non regole universali.

## Quando usarlo

- Nuovi progetti e migrazioni graduali.
- Code review e refactor.
- API pubbliche, configurazioni e modelli di dominio.
- Scelte tra annotazioni, inferenza e validazione.

## Come funziona

### Prima i confini

Dati provenienti da JSON, HTTP o storage non diventano attendibili grazie a `as User`. Trattali come `unknown`, verifica le condizioni richieste e usa il risultato del parser. Un controllo statico non verifica permessi, unicita nel database o correttezza di un servizio remoto.

Anche `unknown` non rende il parser infallibile: conversioni, getter o codice eseguito durante la validazione possono lanciare. Evita conversioni indiscriminate e specifica quali input sono supportati.

### Tipi proporzionati

- Attiva `strict`; valuta separatamente `noUncheckedIndexedAccess` ed `exactOptionalPropertyTypes`.
- Lascia inferire variabili locali evidenti; annota contratti pubblici quando rende visibile l'intenzione o evita variazioni involontarie.
- Modella alternative con union discriminate, non con gruppi di booleani e campi opzionali incoerenti.
- Usa `readonly` per limitare modifiche attraverso quel riferimento; non equivale a deep freeze.
- Non usare `any`, `!` e assertion per spegnere errori senza giustificare l'invariante.
- `satisfies` verifica compatibilita statica: non valida, converte o elimina proprieta a runtime.
- Preferisci utility semplici ai conditional types ricorsivi se il contratto non richiede complessita.

## API / Sintassi

I due blocchi seguenti appartengono allo stesso file. Il risultato esplicito permette di distinguere categoria dell'errore e valore:

```ts
type NumberError = "type" | "format" | "range";

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

Un `Result` non obbliga a usare il valore restituito: impedisce l'accesso diretto a `value` senza restringere la union, se non si aggirano i controlli.

## Esempio pratico

Questo parser accetta un numero finito oppure una stringa decimale ASCII di massimo 64 caratteri **prima del trim**. Per le stringhe ammette segno opzionale e frazione con cifre dopo il punto; rifiuta esponenti, esadecimale, virgole e separatori.

```ts
function parseNumber(value: unknown): Result<number, NumberError> {
  let parsed: number;

  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string") {
    if (value.length > 64) {
      return { ok: false, error: "format" };
    }
    const text = value.trim();
    if (!/^[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/.test(text)) {
      return { ok: false, error: "format" };
    }
    parsed = Number(text);
  } else {
    return { ok: false, error: "type" };
  }

  return Number.isFinite(parsed)
    ? { ok: true, value: parsed }
    : { ok: false, error: "range" };
}

const result = parseNumber(" 12.5 ");

if (result.ok) {
  console.log(result.value); // 12.5
} else {
  console.log(result.error);
}
```

Il punto importante non e la regex, ma **la politica prima della conversione**:

- `true`, `null`, array, oggetti, bigint e Symbol sono rifiutati senza convertirli.
- Stringa vuota, soli spazi, `"0x10"`, `"1e3"`, `"1."` e `"1,5"` non sono il formato ammesso.
- `".5"`, `"+2"`, `"-0"` e zeri iniziali sono ammessi deliberatamente.
- NaN e Infinity sono rifiutati; **finito non significa esatto**. Il parser usa numeri IEEE 754, puo arrotondare decimali e grandi interi: non e adatto da solo a denaro o identificatori esatti.
- Un numero gia ricevuto come `number` non conserva la sintassi con cui era stato scritto.

La versione ingenua `Number(value)` avrebbe accettato booleani e valori vuoti, e avrebbe potuto lanciare con Symbol o conversioni di oggetti. Per una porta o una quantita preferisci un parser con vincoli di dominio specifici.

## Varianti

- **Schema condiviso**: quando molti campi richiedono validazione e messaggi strutturati.
- **Brand**: protegge staticamente l'uso di valori gia validati; non rende valida una conversione con `as`.
- **DTO separati dal dominio**: evita che un cambiamento del database diventi automaticamente un cambiamento dell'API.
- **Migrazione**: isola gli `any` temporanei e registrane il motivo; non imporre una riscrittura totale per iniziare.

## Errori comuni

- Definire "sicuro" un parser soltanto perche accetta `unknown`.
- Tipizzare un'interfaccia esterna senza verificare i dati reali.
- Aggiungere generics che non esprimono relazioni tra input e output.
- Duplicare tipi/schema a mano senza controlli di sincronizzazione.
- Confondere compilazione riuscita, test riusciti e approvazione di una code review.

## Checklist

- Contratti e invarianti leggibili.
- Input esterni validati prima dell'uso.
- Formati, coercion e precisione dichiarati.
- Assertion motivate e localizzate.
- Test runtime, type tests e lint scelti in base al rischio.
- Complessita dei tipi giustificata dal problema.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]
- [[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni|Parsing sicuro di input esterni]]
- [[Programmazione/TypeScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/TypeScript/Pagine/Domain modeling|Domain modeling]]

## Fonti

- [TypeScript: narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
- [TypeScript: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html).
- [MDN: conversioni e precisione di Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
