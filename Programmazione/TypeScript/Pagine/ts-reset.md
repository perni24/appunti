---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, ts-reset, standard-library, type-safety]
aliases: [ts-reset]
prerequisites: [Strict mode, Best Practices]
related: [any, unknown e never, Linting e formattazione]
---

# ts-reset

## Sintesi

`ts-reset` e una libreria che modifica alcune dichiarazioni standard di TypeScript per renderle piu sicure. L'obiettivo e correggere tipi troppo permissivi della standard library, per esempio casi in cui funzioni comuni restituiscono `any`.

Va usata con consapevolezza, perche cambia il comportamento type-level globale del progetto.

## Quando usarlo

- Progetti TypeScript strict che vogliono ridurre `any` impliciti.
- Codebase dove `JSON.parse` e API simili sono punti rischiosi.
- Applicazioni in cui la sicurezza dei confini runtime e importante.
- Team disposti ad accettare tipi standard piu severi.

## Come funziona

La libreria importa dichiarazioni globali che sovrascrivono o restringono alcuni tipi della standard library. Per esempio, puo far risultare `JSON.parse` come `unknown` invece di `any`, obbligando a validare.

## API / Sintassi

```ts
import "@total-typescript/ts-reset";
```

## Esempio pratico

```ts
const value = JSON.parse('{"id":"u_1"}');

// con tipi piu severi, value va validato prima dell'uso
```

Questo spinge verso pattern piu sicuri con `unknown`, type guard o schema validation.

## Varianti

- **Import globale in entrypoint**.
- **Import in file dedicato di setup tipi**.
- **Alternative manuali**: wrapper sicuri per API problematiche.
- **Lint rules**: bloccano usi rischiosi senza modificare lib standard.

## Errori comuni

- **Importarlo senza capire l'impatto globale**.
- **Aggiungerlo in librerie pubbliche senza valutare effetti sui consumatori**.
- **Usarlo al posto di validazione runtime**.
- **Non documentare la scelta nel progetto**.

## Checklist

- Valutare se il team accetta tipi standard piu severi.
- Documentare l'import globale.
- Validare runtime i valori diventati `unknown`.
- Testare build e dipendenze dopo l'aggiunta.
- Evitare in librerie pubbliche se altera aspettative degli utenti.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]]
- [[any, unknown e never]]
- [[Validazione runtime e tipi statici]]
