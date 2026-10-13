---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - tooling
  - type-checking
aliases:
  - Type checking
  - Controllo dei tipi
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Tipi significativi]]"
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Static analysis]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione ai confini]]"
title: Type checking
---

# Type checking

## Sintesi

Il **type checking** verifica che valori, funzioni e strutture rispettino i tipi attesi.

Nel Clean Code i tipi sono uno strumento per rendere contratti e assunzioni piu espliciti prima dell'esecuzione.

## Quando usarlo

- Quando il linguaggio supporta tipi statici o graduali.
- Quando vuoi ridurre errori di integrazione tra moduli.
- Quando API e DTO devono avere contratti chiari.
- Quando refactoring e autocomplete devono essere piu sicuri.
- Quando vuoi documentare forme dati complesse.

## Come funziona

Il type checker confronta uso e dichiarazioni dei tipi.

Puo intercettare parametri mancanti, valori incompatibili, campi inesistenti, ritorni non previsti e contratti non rispettati.

## API / Sintassi

```text
typecheck
```

Il comando dipende dal linguaggio, ma il principio e eseguire un controllo senza necessariamente avviare l'applicazione.

## Esempio pratico

```ts
type UserId = string;

function loadUser(userId: UserId): Promise<User> {
  return repository.findById(userId);
}
```

Il tipo chiarisce l'intenzione del parametro e aiuta il refactoring.

## Varianti

- Tipi statici obbligatori.
- Tipi graduali.
- Type hints.
- Brand types o newtypes.
- Schema runtime piu tipi generati.

## Errori comuni

- Usare `any` o equivalenti per evitare il problema.
- Tipizzare solo la superficie e lasciare `unknown` non validati.
- Confondere tipi compile-time e validazione runtime.
- Creare tipi troppo generici.
- Non modellare stati impossibili.

## Checklist

- I tipi esprimono concetti del dominio?
- I confini esterni vengono validati a runtime?
- Il type checker gira in CI?
- I tipi evitano parametri ambigui?
- Gli errori di tipo vengono corretti, non aggirati?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Tipi significativi|Tipi significativi]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]
- [[Programmazione/Clean Code/Pagine/Static analysis|Static analysis]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]

## Fonti

- TypeScript Handbook
- Python Documentation, *typing*
- Rust Book, *The Type System*
