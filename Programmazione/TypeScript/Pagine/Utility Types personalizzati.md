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
  - utility-types
  - type-system
  - mapped-types
aliases:
  - Custom utility types
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
  - "[[Programmazione/TypeScript/Pagine/Mapped Types]]"
  - "[[Programmazione/TypeScript/Pagine/Conditional Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Generics avanzati]]"
  - "[[Programmazione/TypeScript/Pagine/Infer nei Conditional Types]]"
title: Utility Types personalizzati
---

# Utility Types personalizzati

## Sintesi

Una utility personalizzata e una trasformazione di tipi riutilizzabile. Deve rendere una regola piu leggibile, non nascondere un modello confuso dietro generics complessi.

Gli esempi usano TypeScript **5.9.3** con `strict: true`. Ogni blocco e indipendente. Le utility non aggiungono valori, non verificano input e non eseguono trasformazioni runtime.

## Quando usarlo

- Una stessa trasformazione ricorre in piu punti del progetto.
- Le utility standard non esprimono direttamente il contratto desiderato.
- Serve distinguere un modello incompleto da un input pronto per un'operazione.
- Serve distribuire una trasformazione sulle varianti di una union.

Prima di crearla, provare a comporre utility standard. Il nome dovrebbe spiegare il risultato e l'ambito supportato.

## Come funziona

Mapped types, conditional types e indexed access trasformano la struttura statica. Decidere prima:

- Se cambiare solo il primo livello oppure attraversare anche i valori annidati.
- Se preservare `readonly` e proprieta opzionali.
- Se accettare un singolo tipo oggetto o anche union.
- Come trattare `null`, `undefined`, array, tuple e tipi speciali.

## API / Sintassi

Questa utility rende nullable i **valori delle proprieta**, non l'oggetto intero. Il mapped type preserva i modificatori `readonly` e `?`.

```ts
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type Profile = {
  readonly id: string;
  nickname?: string;
  address: { city: string };
};

type NullableProfile = Nullable<Profile>;

const profile: NullableProfile = {
  id: null,
  address: { city: "Roma" },
};
```

`nickname` resta opzionale; `id` resta readonly. `address` puo essere `null`, ma, quando e un oggetto, `city` deve ancora essere una stringa: la trasformazione non e ricorsiva. Per rendere nullable la radice, basta `Profile | null`.

## Esempio pratico

La seguente composizione rende obbligatorie solo alcune chiavi di un **singolo tipo oggetto**. Le altre restano come dichiarate.

```ts
type RequireKeys<T, K extends keyof T> =
  Omit<T, K> & Required<Pick<T, K>>;

type DraftUser = {
  id?: string;
  email?: string;
  name?: string;
};

type ReadyUser = RequireKeys<DraftUser, "id" | "email">;

function completeDraft(draft: DraftUser): ReadyUser {
  if (typeof draft.id !== "string" || typeof draft.email !== "string") {
    throw new Error("Mancano id o email");
  }

  return { ...draft, id: draft.id, email: draft.email };
}

const ready = completeDraft({ id: "u1", email: "user@example.com" });
console.log(ready.id); // u1
```

La funzione verifica solo che i due valori siano stringhe: non certifica il formato email, l'esistenza dell'utente o il salvataggio in un database. Per questo il nome e `ReadyUser`, non `PersistedUser`. Regole di dominio ulteriori richiedono altri controlli.

`Required` non significa `NonNullable`: un campo dichiarato `string | null` puo restare `null`. Inoltre, con `exactOptionalPropertyTypes: true`, `Required<{ x?: string | undefined }>` conserva l'unione esplicita con `undefined`; con l'opzione disattivata la rimozione di `?` rimuove anche `undefined`. Documentare la configurazione attesa.

## Varianti

### Trasformazioni distribuite sulle union

`Omit` applicato direttamente a una union puo perdere le proprieta specifiche delle varianti. Un conditional type sul parametro `T` permette di applicarlo separatamente a ciascun membro:

```ts
type DistributiveOmit<T, K extends PropertyKey> =
  T extends unknown ? Omit<T, K> : never;

type Job =
  | { kind: "email"; id: string; recipient: string }
  | { kind: "export"; id: string; format: "csv" | "json" };

type JobWithoutId = DistributiveOmit<Job, "id">;

const job: JobWithoutId = {
  kind: "email",
  recipient: "user@example.com",
};

function describeJob(value: JobWithoutId): string {
  if (value.kind === "email") {
    return value.recipient;
  }
  return value.format;
}

console.log(describeJob(job)); // user@example.com
```

Il discriminante `kind` resta legato al campo specifico della variante. Il vincolo `PropertyKey` consente anche chiavi assenti in alcuni membri; `Omit` le ignora. La utility non elimina `id` da un oggetto runtime.

### Trasformazioni profonde e di dominio

Le varianti con key remapping possono rinominare chiavi; quelle condizionali possono filtrare valori o estrarre firme con `infer`. Dare un nome distinto a trasformazioni con contratti diversi.

Non esiste una `DeepReadonly` universale ottenuta ricorrendo indistintamente su qualsiasi oggetto. Funzioni, `Date`, `Map`, classi e array richiedono decisioni specifiche. Per una utility delimitata a dati semplici vedere [[Programmazione/TypeScript/Pagine/Recursive types|Recursive types]].

## Errori comuni

- Usare `RequireKeys` su una union aspettandosi che preservi tutti i dettagli dei membri.
- Confondere obbligatorieta, non-nullabilita e validazione.
- Perdere accidentalmente modificatori o discriminanti.
- Ricorrere su ogni tipo oggetto senza definire i casi supportati.
- Aggiungere un'astrazione usata una sola volta quando un tipo esplicito sarebbe piu chiaro.

## Checklist

- Documentare esempi di ingresso e risultato atteso.
- Testare casi validi e assegnazioni da rifiutare.
- Verificare readonly, optional, union, `never` e chiavi inesistenti.
- Esplicitare la dipendenza da `exactOptionalPropertyTypes`.
- Tenere separate le funzioni runtime dalle trasformazioni type-level.

## Fonti

- [TypeScript Handbook: Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html).
- [TypeScript Handbook: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html).
- [TSConfig: exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html).

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]
- [[Programmazione/TypeScript/Pagine/Mapped Types|Mapped Types]]
- [[Programmazione/TypeScript/Pagine/Conditional Types|Conditional Types]]
- [[Programmazione/TypeScript/Pagine/Infer nei Conditional Types|Infer nei Conditional Types]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
