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
  - runtime-validation
aliases:
  - Runtime type guards
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Guards]]"
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Type predicates]]"
  - "[[Programmazione/TypeScript/Pagine/Assertion functions]]"
title: Type guards runtime
---

# Type guards runtime

## Sintesi

Una type guard esegue un controllo e comunica al checker una classificazione tramite `value is Type`. Il booleano e runtime; il predicate e una promessa statica che TypeScript non dimostra automaticamente.

Questa nota riguarda l'uso ai confini con dati incerti. Per le regole generali di narrowing e predicate vedi i collegamenti. Baseline: **TypeScript 5.9.3**, `strict: true`, target **ES2022**, **Node.js 24.14.0**.

## Quando usarlo

- Riutilizzare controlli piccoli su `unknown`.
- Distinguere varianti di una union gia valida.
- Filtrare valori senza trasformarli.
- Controllare una forma semplice prima di accedere ai campi.

Se servono normalizzazione, errori per campo o regole complesse, un parser o uno schema runtime e spesso piu adatto.

## Come funziona

Il checker usa la firma in **entrambi i rami**: nel ramo vero restringe a `Type`, nel falso lo esclude quando puo. Un controllo piu restrittivo del tipo promesso puo rendere scorretto il ramo falso.

La guardia non converte, non clona, non congela e non elimina campi. Il valore resta lo stesso e puo essere modificato attraverso altri riferimenti.

## API / Sintassi

```ts
function isString(value: unknown): value is string {
  return typeof value === "string";
}

const values: unknown[] = ["ready", 42, null, ""];
console.log(values.filter(isString)); // ["ready", ""]
```

La stringa vuota appartiene al tipo `string`. Una selezione di sole stringhe non vuote e un criterio aggiuntivo, non una classificazione completa di stringhe e non-stringhe.

## Esempio pratico

La guardia seguente controlla una **forma minima**, non la validita commerciale del prodotto:

```ts
type Product = {
  id: string;
  price: number;
};

function isProduct(value: unknown): value is Product {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "price" in value &&
    typeof value.id === "string" &&
    typeof value.price === "number"
  );
}

function isSellable(product: Product): boolean {
  return (
    product.id.length > 0 &&
    Number.isFinite(product.price) &&
    product.price >= 0
  );
}

const raw: unknown = JSON.parse('{"id":"p1","price":0,"internal":"demo"}');

if (isProduct(raw)) {
  console.log(raw.id, isSellable(raw)); // p1 true
}

console.log(isProduct({ id: "p2", price: NaN })); // true
console.log(isSellable({ id: "p2", price: NaN })); // false
```

`typeof NaN` e `typeof Infinity` sono `"number"`. Il primo controllo e coerente con la proprieta `price: number`; il secondo decide un criterio piu stretto e restituisce deliberatamente `boolean`.

Non cambiare semplicemente `isProduct` per dichiarare `value is Product` e rifiutare i prezzi negativi: un prodotto con prezzo negativo resta strutturalmente un `Product`. Su una union il ramo falso potrebbe allora essere ristretto in modo sbagliato. Per un valore di dominio piu forte usa un parser con un risultato esplicito o un tipo validato dedicato.

### Limiti della guardia di forma

- `in` include proprieta ereditate. Non garantisce campi propri o un record JSON semplice.
- Campi extra restano sul valore: la guardia non e una proiezione.
- Il controllo e pensato per dati ordinari stabili, come JSON decodificato, non per classificare ogni oggetto strutturale possibile. Non riusarlo indiscriminatamente per escludere varianti di oggetti arbitrari.
- Getter e Proxy possono eseguire codice, lanciare o cambiare valore tra letture.
- Le regole di vendita dipendono anche da valuta, disponibilita e autorizzazione; `isSellable` e soltanto una regola locale dimostrativa.

Se il contratto esterno richiede un record con campi propri e senza dati extra, preferisci il parser con proiezione nella nota sulla validazione runtime.

## Varianti

### Union interna rispetto a JSON esterno

Su una union `Admin | Guest` gia verificata, il discriminante puo bastare per scegliere la variante. Su un oggetto esterno con `role: "admin"` devi controllare anche gli altri campi della variante, e il ruolo inviato dal client non conferisce permessi.

### Array

`Array.isArray` non verifica gli elementi. `every` salta i buchi degli array sparsi: non assumere che un controllo basato su `every` convalidi ogni posizione di un array JavaScript arbitrario. Gli array ottenuti dal JSON sono densi, ma possono contenere `null` o elementi sbagliati. Scegli la politica e testa i casi vuoti.

### Assertion o parser

Una assertion restringe dopo un ritorno normale; un parser puo costruire un valore nuovo e restituire errori strutturati. Non implementare una falsa guardia che chiama uno schema con trasformazioni e restituisce solo `success`: l'input originale potrebbe avere un tipo diverso dall'output dello schema.

## Errori comuni

- Restituire sempre `true`: il checker non dimostra la correttezza del predicate.
- Verificare un solo discriminante su dati non ancora validati.
- Confondere `number` con numero finito, intero o importo monetario valido.
- Aggiungere criteri di business a un predicate senza considerare il ramo falso.
- Credere che `filter` cloni gli oggetti selezionati.
- Usare una guardia come protezione contro codice JavaScript ostile.

## Checklist

- La promessa del predicate e corretta nei due rami?
- Controllo i tipi dei campi, non solo la loro presenza?
- Ho distinto forma, proprieta proprie e regole di dominio?
- Il risultato lascia invariati input e campi extra?
- Ci sono mutazioni o letture con effetti collaterali?
- Servirebbe un parser con errori dettagliati invece di un booleano?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type Guards|Type Guards]]
- [[Programmazione/TypeScript/Pagine/Type predicates|Type predicates]]
- [[Programmazione/TypeScript/Pagine/Assertion functions|Assertion functions]]
- [[Programmazione/TypeScript/Pagine/Schema validation con Zod|Schema validation con Zod]]

## Fonti

- [TypeScript - Type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [TypeScript 5.5 - Inferred type predicates](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html)
- [MDN - in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in)
- [MDN - Array.prototype.every](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
