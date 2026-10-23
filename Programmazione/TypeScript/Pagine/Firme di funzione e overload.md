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
  - funzioni
  - overload
  - function-types
aliases:
  - Function signatures
  - Overload TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Funzioni tipizzate]]"
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Generics]]"
  - "[[Programmazione/TypeScript/Pagine/Generics avanzati]]"
title: Firme di funzione e overload
---

# Firme di funzione e overload

## Sintesi

Una firma di funzione descrive parametri e ritorno senza necessariamente mostrare l'implementazione. Gli overload permettono a una funzione di esporre piu firme pubbliche, mantenendo una sola implementazione.

Sono utili quando una funzione accetta forme diverse di input e restituisce tipi diversi in base alla firma usata.

## Quando usarlo

- API con piu modi legittimi di chiamare la stessa funzione.
- Funzioni wrapper attorno a librerie JavaScript.
- Funzioni dove il ritorno dipende dalla forma dell'input.
- Callback o handler riutilizzati in piu punti.
- Librerie che devono esporre contratti ergonomici.

## Come funziona

Le firme di overload si scrivono prima dell'implementazione. L'implementazione deve essere compatibile con tutte le firme pubbliche, spesso usando union piu larghe e narrowing interno.

Chi chiama la funzione vede solo gli overload, non la firma interna di implementazione.

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022. Gli overload spariscono dall'output: a runtime esiste **una sola funzione**, che deve distinguere gli input con codice JavaScript.

Una chiamata deve trovare una firma pubblica applicabile. Due overload per `string` e `string[]` non implicano automaticamente un terzo overload per un valore `string | string[]`.

## API / Sintassi

```ts
function parse(value: string): string[];
function parse(value: string[]): string;
function parse(value: string | string[]): string | string[] {
  return Array.isArray(value) ? value.join(",") : value.split(",");
}

console.log(parse("a,b")); // ["a", "b"]
console.log(parse(["a", "b"])); // a,b

function forward(value: string | string[]): string | string[] {
  // return parse(value); // Nessun overload applicabile alla union.
  return typeof value === "string" ? parse(value) : parse(value);
}
```

`parse` e solo un esempio di split/join con virgola: non e un parser CSV, non gestisce quoting ed escape e non e sempre invertibile. `forward` restringe l'input prima di chiamare l'overload. In alternativa, aggiungi intenzionalmente una firma pubblica per la union, prima dell'implementazione.

## Esempio pratico

```ts
function getValue(key: "port"): number;
function getValue(key: "host"): string;
function getValue(key: "port" | "host"): number | string {
  if (key === "port") {
    return 3000;
  }

  return "localhost";
}

const port = getValue("port");
const host = getValue("host");
console.log(port, host); // 3000, localhost
```

`port` viene inferito come `number`, `host` come `string`. I valori sono locali e costanti: non viene letta una configurazione reale.

Il controllo di compatibilita dell'implementazione **non dimostra la corretta corrispondenza input/output di ogni ramo**. Se l'implementazione precedente restituisse sempre `"localhost"`, la firma interna `number | string` potrebbe ancora essere compatibile e `port` risulterebbe staticamente number ma realmente string. Servono test runtime oltre ai test delle firme.

### Quando basta una union

Se cambia soltanto il tipo di input e non il risultato, una firma unica e piu semplice:

```ts
function lengthOf(value: string | readonly unknown[]): number {
  return value.length;
}

console.log(lengthOf("ciao"), lengthOf([1, 2])); // 4, 2
```

### Firma chiamabile

Una funzione puo avere anche proprieta:

```ts
type Formatter = {
  description: string;
  (value: number): string;
};

const formatCount: Formatter = Object.assign(
  (value: number) => `${value} elementi`,
  { description: "Conteggio locale" },
);
console.log(formatCount(3)); // 3 elementi
```

Un alias di funzione semplice usa `=>` per il risultato; una call signature dentro un tipo oggetto usa `:`. Per descrivere un costruttore si usa una construct signature, per esempio `new (value: string) => URL`.

## Varianti

- **Function type alias**: `type Fn = (x: string) => number`.
- **Interface callable**: `interface Fn { (x: string): number }`.
- **Overload di funzione**: piu firme, una implementazione.
- **Generic function**: alternativa spesso migliore a overload ripetitivi.

## Errori comuni

- **Usare overload quando basta una union**: gli overload servono quando cambia il tipo di ritorno o l'ergonomia.
- **Rendere l'implementazione incompatibile con una firma**: TypeScript segnala errore.
- **Esporre troppi overload**: l'API diventa difficile da leggere.
- **Dimenticare il narrowing interno**: l'implementazione lavora con tipi piu larghi.
- **Aggiungere una firma catch-all con any**: puo nascondere errori e annullare la precisione degli overload.
- **Usare ReturnType per ottenere tutti i risultati degli overload**: l'inferenza usa l'ultima firma pubblica, non esegue la risoluzione per uno specifico argomento.

## Checklist

- Usare overload solo quando migliorano davvero l'API.
- Mantenere poche firme chiare.
- Verificare che ogni overload sia coperto dall'implementazione.
- Considerare generics se input e output sono collegati.
- Testare i tipi con esempi di chiamata reali.
- Verificare i risultati runtime di ogni variante, non solo la compilazione.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Funzioni tipizzate|Funzioni tipizzate]]
- [[Programmazione/TypeScript/Pagine/Union e Intersection Types|Union e Intersection Types]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]
- [[Programmazione/TypeScript/Pagine/Type-level testing|Type-level testing]]

## Fonti

- [TypeScript: More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html), overload, implementazione e firme chiamabili.
- [TypeScript: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html), inferenza dall'ultima firma.
- [TypeScript: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html), ReturnType.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
