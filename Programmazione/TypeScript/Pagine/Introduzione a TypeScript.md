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
  - javascript
  - type-system
  - frontend
  - backend
aliases:
  - Introduzione a TypeScript
prerequisites: []
related:
  - "[[Programmazione/TypeScript/Pagine/Tipi primitivi]]"
  - "[[Programmazione/TypeScript/Pagine/Variabili e annotazioni di tipo]]"
  - "[[Programmazione/TypeScript/Pagine/Inferenza dei tipi]]"
title: Introduzione a TypeScript
---

# Introduzione a TypeScript

## Sintesi

TypeScript aggiunge a JavaScript un controllo statico dei tipi. Serve a rilevare incompatibilita prima dell'esecuzione e a rendere espliciti i contratti tra parti del programma.

**Controllo dei tipi, generazione del JavaScript ed esecuzione sono operazioni diverse.** Un programma che parte non e necessariamente stato controllato; un programma senza errori di tipo puo ancora avere bug logici, dati esterni invalidi o problemi di sicurezza.

## Quando usarlo

- Progetti JavaScript medio-grandi.
- Frontend con React, Vue, Angular o framework simili.
- Backend Node.js con API e modelli dati complessi.
- Librerie pubbliche che devono esporre API chiare.
- Codebase dove refactor, onboarding e manutenzione sono importanti.

## Come funziona

Il compilatore usa dichiarazioni, inferenza e flusso di controllo per verificare gli usi dei valori. Non esegue il programma per scoprire il contenuto di una risposta HTTP.

- `tsc --noEmit`: controlla il progetto senza scrivere JavaScript.
- `tsc`: puo controllare ed emettere JavaScript. Senza `noEmitOnError`, puo emettere anche in presenza di errori.
- Un transpiler o un runtime con type stripping puo rimuovere i tipi senza controllarli. Il supporto TypeScript di Node, per esempio, non sostituisce `tsc`.

Annotazioni, alias e interfacce vengono eliminati. Non ogni costrutto TypeScript e pero solo un'annotazione: per esempio gli `enum` ordinari possono generare codice JavaScript. La compatibilita dipende anche da target, moduli e runtime, non dall'estensione `.ts`.

`strict` abilita un insieme di controlli, inclusi `noImplicitAny` e `strictNullChecks`; non abilita ogni opzione disponibile. `noUncheckedIndexedAccess` ed `exactOptionalPropertyTypes` si configurano separatamente. I dettagli sono in [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]].

## API / Sintassi

```ts
function greet(name: string): string {
  return `Ciao ${name}`;
}

const message = greet("Luca");
// greet(42); // Errore statico: number non e assegnabile a string.
```

## Esempio pratico

Esercizio locale in una **cartella di prova vuota**, non nel progetto del sito. Richiede Node.js e npm; compilatore di riferimento **TypeScript 5.9.3**, usato anche per verificare queste note, senza affermare che sia l'ultima release.

Inizializza il progetto:

```sh
npm init -y
```

Installa il compilatore locale; il comando scrive manifest, lockfile e `node_modules`:

```sh
npm install --save-dev --save-exact typescript@5.9.3
```

File `demo.cts`; `.cts` dichiara esplicitamente un modulo CommonJS e produce `.cjs`:

```ts
type User = {
  id: string;
  email: string;
  isAdmin: boolean;
};

function shouldShowAdminLink(user: User): boolean {
  return user.isAdmin;
}

const user: User = {
  id: "u_1",
  email: "luca@example.com",
  isAdmin: false,
};

console.log(shouldShowAdminLink(user)); // false
```

Controlla senza generare file:

```sh
npm exec -- tsc --strict --noEmit --target ES2022 --module NodeNext demo.cts
```

Compila solo se non ci sono errori:

```sh
npm exec -- tsc --strict --noEmitOnError --target ES2022 --module NodeNext --outDir dist demo.cts
```

Esegui il risultato **solo dopo la compilazione riuscita**:

```sh
node dist/demo.cjs
```

Il risultato e `false`. Cambiare `isAdmin` in `"false"` causa un errore di tipo: la stringa non viene convertita in booleano. `noEmitOnError` non elimina un vecchio `dist/demo.cjs`; eseguirlo dopo una compilazione fallita puo quindi avviare codice non aggiornato.

Questo esempio decide soltanto se mostrare un collegamento, non autorizza un'operazione: accessi e permessi vanno verificati dal server. Il tipo `User` non valida l'indirizzo email e non rende attendibili dati ricevuti dalla rete.

Qui le opzioni sono tutte sulla riga di comando. Passando un file a `tsc`, il `tsconfig.json` non viene caricato: nei progetti reali usa una configurazione e `tsc -p .`. Le dichiarazioni di libreria disponibili al compilatore non installano API nel runtime.

## Varianti

- **JavaScript senza type checking**: controlli affidati ad altri strumenti e ai test.
- **TypeScript strict**: baseline esplicita per questo percorso; controlli aggiuntivi in base al progetto.
- **JavaScript con JSDoc e checkJs**: controllo statico anche senza convertire tutto in `.ts`.
- **Bundler o framework**: la build puo essere separata dal type check; verifica entrambi in CI.

## Errori comuni

- **Build riuscita = tipi verificati**: alcuni tool trasformano soltanto la sintassi.
- **Usare `as User` su JSON come validazione**: e un'asserzione, non un controllo dei dati.
- **Credere che i tipi rendano sicuro il client**: autorizzazione e validazione server restano necessarie.
- **Confondere `strict` con lo strict mode JavaScript**: il primo configura il checker; il secondo riguarda la semantica di esecuzione.

## Checklist

- Eseguire un type check esplicito, oltre alla build e ai test.
- Scegliere target e formato dei moduli compatibili con l'ambiente.
- Annotare i contratti importanti, lasciando inferire i dettagli locali.
- Validare gli input esterni e distinguere tipi, permessi e regole di dominio.
- Non eseguire vecchi artefatti dopo una compilazione fallita.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Tipi primitivi|Tipi primitivi]]
- [[Programmazione/TypeScript/Pagine/Variabili e annotazioni di tipo|Variabili e annotazioni di tipo]]
- [[Programmazione/TypeScript/Pagine/Inferenza dei tipi|Inferenza dei tipi]]
- [[Programmazione/TypeScript/Pagine/any, unknown e never|any, unknown e never]]
- [[Programmazione/TypeScript/Pagine/tsconfig|tsconfig]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]
- [[Programmazione/TypeScript/Pagine/JSDoc e type checking in JavaScript|JSDoc e type checking in JavaScript]]

## Fonti

- [TypeScript Handbook: The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html), controllo statico ed emissione.
- [TSConfig: noEmitOnError](https://www.typescriptlang.org/tsconfig/noEmitOnError.html) e [strict](https://www.typescriptlang.org/tsconfig/strict.html).
- [tsc CLI](https://www.typescriptlang.org/docs/handbook/compiler-options.html), file espliciti e configurazione.
- [Node.js: TypeScript](https://nodejs.org/api/typescript.html), distinzione tra type stripping e type checking; verificare la versione del runtime.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
