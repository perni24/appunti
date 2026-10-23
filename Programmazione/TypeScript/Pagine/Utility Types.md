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
  - utility-types
  - mapped-types
  - conditional-types
aliases:
  - Utility Types TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Mapped Types]]"
  - "[[Programmazione/TypeScript/Pagine/Conditional Types]]"
  - "[[Programmazione/TypeScript/Pagine/Keyof e typeof]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Utility Types personalizzati]]"
  - "[[Programmazione/TypeScript/Pagine/Strict mode]]"
  - "[[Programmazione/TypeScript/Pagine/DTO e modelli di dominio]]"
title: Utility Types
---

# Utility Types

## Sintesi

Gli utility types derivano nuovi tipi senza duplicare a mano le proprieta di un modello. Non trasformano i valori: `Omit` non elimina campi, `Readonly` non congela oggetti e `Required` non riempie dati mancanti.

Riferimento degli esempi: TypeScript **5.9.3**, `strict: true`. Le differenze legate a `exactOptionalPropertyTypes` sono indicate sotto; questa opzione non viene attivata da `strict`.

## Quando usarlo

- Derivare input di aggiornamento con un insieme esplicito di campi modificabili.
- Descrivere DTO e viste di un modello, affiancandoli a una trasformazione runtime.
- Riutilizzare firme di funzioni e risultati asincroni.
- Esprimere vincoli statici senza riscrivere intere interfacce.

## Come funziona

Gli utility types sono disponibili globalmente: non serve importarli. Combinano trasformazioni di proprieta, selezione di membri di union e inferenza.

I tipi di oggetto sono strutturali: una variabile con campi aggiuntivi puo essere assegnabile a un tipo piu piccolo. Questo e il motivo per cui una semplice annotazione non protegge dalla pubblicazione di dati riservati.

## API / Sintassi

Questo blocco distingue il DTO dal codice che lo costruisce. Il valore del campo riservato e soltanto un segnaposto dimostrativo.

```ts
type User = {
  id: string;
  email: string;
  passwordHash: string;
};

type UserUpdate = Partial<Pick<User, "email">>;
type PublicUser = Omit<User, "passwordHash">;
type UserPreview = Pick<User, "id" | "email">;

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email };
}

const user: User = {
  id: "u1",
  email: "user@example.com",
  passwordHash: "demo-only",
};

const onlyTyped: PublicUser = user;
const projected = toPublicUser(user);

console.log(Object.hasOwn(onlyTyped, "passwordHash")); // true
console.log(Object.hasOwn(projected, "passwordHash")); // false
```

`onlyTyped` e lo stesso oggetto di `user`: serializzarlo include ancora `passwordHash`. `toPublicUser` crea invece un nuovo oggetto selezionando i campi. L'allowlist va aggiornata consapevolmente quando cambia il DTO.

`UserUpdate` non include `id` o `passwordHash` tra le chiavi dichiarate. Anche questo e un contratto statico, non un filtro per input ricevuti dalla rete.

## Esempio pratico

Una patch puo essere vuota. Qui la regola scelta e: **campo assente o `undefined` significa "mantieni il valore precedente"**. Gli argomenti sono configurazioni interne gia tipizzate, non JSON non attendibile.

```ts
type Config = {
  apiUrl: string;
  timeoutMs: number;
  retries: number;
};

function updateConfig(config: Config, patch: Partial<Config>): Config {
  return {
    apiUrl: patch.apiUrl === undefined ? config.apiUrl : patch.apiUrl,
    timeoutMs:
      patch.timeoutMs === undefined ? config.timeoutMs : patch.timeoutMs,
    retries: patch.retries === undefined ? config.retries : patch.retries,
  };
}

const initial: Config = {
  apiUrl: "/api",
  timeoutMs: 3000,
  retries: 2,
};

const updated = updateConfig(initial, { retries: 0 });
console.log(updated.retries); // 0
console.log(initial.retries); // 2
```

Con `exactOptionalPropertyTypes: false`, `{ timeoutMs: undefined }` e accettato come `Partial<Config>`. Uno spread `{ ...config, ...patch }` sovrascriverebbe il numero con `undefined`; la funzione sopra applica invece la regola dichiarata e copia solo le tre proprieta previste.

Con l'opzione attiva, quella patch viene rifiutata dal compilatore, perche `Config.timeoutMs` non include `undefined`. La lettura di un campo opzionale puo comunque restituire `undefined`.

Questa funzione non verifica URL, intervalli numerici o dati esterni. Per input `unknown`, serve prima una validazione runtime. Una patch annidata richiederebbe inoltre regole di merge dedicate.

## Varianti

### Proprieta e dizionari

- `Partial<T>`, `Required<T>`, `Readonly<T>`: modificano rispettivamente opzionalita, obbligatorieta e scrivibilita al primo livello.
- `Pick<T, K>`, `Omit<T, K>`: selezionano o escludono chiavi dal tipo.
- `Record<K, V>`: associa le chiavi `K` a valori `V`.

`Record<"it" | "en", string>` richiede entrambe le chiavi. `Record<string, string>` non garantisce che una chiave arbitraria esista a runtime: valutare `noUncheckedIndexedAccess` per rendere visibile `undefined` nelle letture.

`Readonly<{ items: string[] }>` impedisce di riassegnare `items`, non di chiamare `items.push(...)`. Per proteggere anche quell'array nel tipo, dichiararlo `readonly string[]`.

### Union, funzioni e Promise

- `Exclude<T, U>` e `Extract<T, U>`: filtrano membri di una union, non campi di un oggetto.
- `NonNullable<T>`: esclude `null` e `undefined` dal tipo.
- `Parameters<F>` e `ReturnType<F>`: derivano parametri e ritorno; con overload si basano sull'ultima firma.
- `ConstructorParameters<C>` e `InstanceType<C>`: derivano argomenti del costruttore e istanza.
- `Awaited<T>`: modella il risultato atteso da Promise/thenable anche annidati; non avvia alcuna operazione asincrona.

Per un contratto esterno stabile, non derivare automaticamente ogni DTO dalla firma di una funzione interna: una modifica all'implementazione potrebbe cambiare involontariamente l'API.

### Altre utility

`ThisParameterType`, `OmitThisParameter` e il marker `ThisType` riguardano la tipizzazione di `this`. Le trasformazioni `Uppercase`, `Lowercase`, `Capitalize` e `Uncapitalize` lavorano su tipi stringa, non sul testo runtime.

`NoInfer<T>`, disponibile da TypeScript 5.4, impedisce che una posizione contribuisca all'inferenza di `T`, mantenendo il controllo di compatibilita. In questo esempio il fallback deve appartenere alle opzioni inferite:

```ts
function choose<C extends string>(
  values: readonly C[],
  fallback: NoInfer<C>
): C {
  if (!values.includes(fallback)) {
    throw new Error("Fallback non presente");
  }
  return fallback;
}

const selected = choose(["compact", "wide"], "compact");
console.log(selected); // compact
// choose(["compact", "wide"], "unknown"); // Errore statico
```

Il controllo con `includes` e necessario anche per array gia allargati a `string[]`, per i quali il compilatore non conosce l'insieme concreto delle opzioni.

## Errori comuni

- Serializzare direttamente un'entita dopo averle assegnato un tipo `Omit`.
- Usare `Partial` come validazione o confonderlo con una patch profonda.
- Trattare `Required` o `NonNullable` come controlli runtime.
- Dimenticare le opzioni del compilatore quando si ragiona su optional e dizionari.
- Aspettarsi che `Omit` preservi automaticamente ogni variante di una union: vedere la nota sulle utility personalizzate.

## Checklist

- Separare derivazione del tipo, trasformazione dei dati e validazione.
- Definire quali campi sono modificabili e cosa significa `undefined`.
- Verificare eventuali strutture annidate e membri di union.
- Testare anche il risultato serializzato quando si espongono dati.
- Preferire un nome di dominio leggibile a utility annidate difficili da interpretare.

## Fonti

- [TypeScript Handbook: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html).
- [TypeScript: compatibilita strutturale](https://www.typescriptlang.org/docs/handbook/type-compatibility.html).
- [TSConfig: exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html).
- [TypeScript 5.4: NoInfer](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html#the-noinfer-utility-type).

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Mapped Types|Mapped Types]]
- [[Programmazione/TypeScript/Pagine/Conditional Types|Conditional Types]]
- [[Programmazione/TypeScript/Pagine/Utility Types personalizzati|Utility Types personalizzati]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
