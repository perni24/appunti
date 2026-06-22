---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: base
tags: [typescript, funzioni, overload, function-types]
aliases: [Function signatures, Overload TypeScript]
prerequisites: [Funzioni tipizzate, Union e Intersection Types]
related: [Generics, Generics avanzati]
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

## API / Sintassi

```ts
function parse(value: string): string[];
function parse(value: string[]): string;
function parse(value: string | string[]): string | string[] {
  return Array.isArray(value) ? value.join(",") : value.split(",");
}
```

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
```

`port` viene inferito come `number`, `host` come `string`.

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

## Checklist

- Usare overload solo quando migliorano davvero l'API.
- Mantenere poche firme chiare.
- Verificare che ogni overload sia coperto dall'implementazione.
- Considerare generics se input e output sono collegati.
- Testare i tipi con esempi di chiamata reali.

## Collegamenti

- [[Funzioni tipizzate]]
- [[Union e Intersection Types]]
- [[Generics]]
