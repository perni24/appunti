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
  - domain-modeling
  - architecture
  - types
aliases:
  - Modellazione dominio TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/DTO e modelli di dominio]]"
  - "[[Programmazione/TypeScript/Pagine/Brand Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Clean architecture]]"
  - "[[Programmazione/TypeScript/Pagine/Error Handling]]"
title: Domain modeling
---

# Domain modeling

## Sintesi

Modellare il dominio significa rappresentare **dati, regole e transizioni** del problema, non soltanto dare un nome a un oggetto. Tipi, union e brand riducono gli stati incoerenti nel codice controllato; parser e operazioni devono mantenere le invarianti anche durante l'esecuzione.

Baseline: **TypeScript 5.9.3**, `strict: true`, target **ES2022**, **Node 24.14.0**.

## Quando usarlo

- Stati alternativi che richiedono campi diversi.
- Valori con vincoli o unita di misura.
- Regole che non devono dipendere da controller, ORM o componenti UI.
- Workflow dove una transizione puo essere vietata.

Non serve applicare tutti i concetti del Domain-Driven Design a ogni CRUD. Parti dal linguaggio e dalle regole effettive del problema.

## Come funziona

- **Entita**: possiede un'identita che rimane significativa anche se cambiano i suoi attributi.
- **Value object**: il significato dipende dai valori, non dall'identita di una singola istanza. In JavaScript `===` tra oggetti continua a confrontare riferimenti: l'uguaglianza per valore va definita.
- **Invariante**: condizione che deve restare vera dopo ogni operazione.
- **Aggregato**: confine entro cui proteggere insieme determinate invarianti; non coincide necessariamente con una tabella.
- **Transizione**: operazione che verifica lo stato iniziale e costruisce quello successivo.

Una union distingue draft, paid e cancelled; non impedisce da sola una transizione arbitraria o la costruzione manuale di valori incoerenti. Un brand Email creato con `includes("@")` dimostrerebbe soltanto la presenza di quel carattere, non validita dell'indirizzo o possesso della casella.

## API / Sintassi

I quattro blocchi TS formano un unico modulo. Il demo usa una quantita con una regola precisa, invece di presentare una verifica parziale come validazione completa dell'email.

```ts
declare const quantityBrand: unique symbol;
type Quantity = number & { readonly [quantityBrand]: true };

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function parseQuantity(input: unknown): Result<Quantity, "invalid_quantity"> {
  if (
    typeof input !== "number" ||
    !Number.isInteger(input) ||
    input < 1 ||
    input > 99
  ) {
    return { ok: false, error: "invalid_quantity" };
  }
  return { ok: true, value: input as Quantity };
}

type Order =
  | Readonly<{ kind: "draft"; id: string; quantity: Quantity }>
  | Readonly<{
      kind: "paid";
      id: string;
      quantity: Quantity;
      paidAt: number;
    }>
  | Readonly<{
      kind: "cancelled";
      id: string;
      quantity: Quantity;
      reason: string;
    }>;

type TransitionError = "not_draft" | "invalid_time" | "invalid_reason";
```

Il brand non esiste nel numero runtime e puo essere aggirato con assertion. PaidAt usa millisecondi dall'epoch, per evitare un riferimento Date mutabile; non costituisce una prova di pagamento.

## Esempio pratico

### Costruzione e transizioni

```ts
function createDraft(id: string, quantity: Quantity): Order {
  if (id.length < 1 || id.length > 32 || /[^a-z0-9-]/.test(id)) {
    throw new Error("Invalid order ID");
  }
  return Object.freeze({ kind: "draft", id, quantity });
}

function markPaid(
  order: Order,
  paidAt: number,
): Result<Order, TransitionError> {
  if (order.kind !== "draft") return { ok: false, error: "not_draft" };
  if (
    !Number.isSafeInteger(paidAt) ||
    paidAt < 0 ||
    paidAt > 8640000000000000
  ) {
    return { ok: false, error: "invalid_time" };
  }
  return {
    ok: true,
    value: Object.freeze({
      kind: "paid",
      id: order.id,
      quantity: order.quantity,
      paidAt,
    }),
  };
}

function cancel(order: Order, reason: string): Result<Order, TransitionError> {
  if (order.kind !== "draft") return { ok: false, error: "not_draft" };
  const normalized = reason.trim();
  if (normalized.length < 1 || normalized.length > 120) {
    return { ok: false, error: "invalid_reason" };
  }
  return {
    ok: true,
    value: Object.freeze({
      kind: "cancelled",
      id: order.id,
      quantity: order.quantity,
      reason: normalized,
    }),
  };
}
```

Il dominio di esempio permette pagamento o annullamento solo da draft. Un ordine pagato richiederebbe un diverso caso d'uso, per esempio un rimborso: non si riutilizza cancel fingendo che abbia lo stesso significato.

La data deve essere un intero non negativo nel limite rappresentabile da Date. Il chiamante decide da dove proviene il tempo; non viene letto un clock globale nella funzione.

### Uso osservabile

```ts
const quantity = parseQuantity(2);
if (!quantity.ok) throw new Error(quantity.error);

const draft = createDraft("ord-1", quantity.value);
const paid = markPaid(draft, 1767225600000);

console.log(draft.kind); // draft: l'input non viene mutato
if (paid.ok) {
  console.log(paid.value.kind); // paid
  console.log(cancel(paid.value, "Ripensamento"));
  // { ok: false, error: "not_draft" }
}
```

Le funzioni non contattano un provider, non addebitano denaro e non salvano nulla. Servono a modellare una regola locale. In produzione, evidenza del pagamento, concorrenza, autorizzazione e persistenza sono problemi separati.

### Elaborazione esaustiva

```ts
function describeOrder(order: Order): string {
  switch (order.kind) {
    case "draft":
      return "Da pagare";
    case "paid":
      return "Pagato";
    case "cancelled":
      return `Annullato: ${order.reason}`;
    default: {
      const unhandled: never = order;
      return unhandled;
    }
  }
}
```

Aggiungere uno stato alla union richiede di aggiornare questo switch. Un oggetto esterno non validato puo comunque violare il contratto: never non e un controllo runtime del payload.

## Varianti

- **Dati e funzioni pure**: rendono espliciti input/output e facilitano i test.
- **Classi/value object**: possono concentrare costruzione e comportamenti; valutare cosa rimane accessibile e modificabile.
- **State machine**: utile quando eventi, guardie ed effetti rendono molteplici le transizioni.
- **Domain service**: regole che coinvolgono piu concetti senza appartenere naturalmente a una singola entita.
- **Optimistic locking**: per evitare di salvare una transizione calcolata su una versione ormai superata; la purezza locale non risolve scritture concorrenti.

Readonly protegge il codice controllato, mentre Object.freeze opera a runtime ed e superficiale. In questo demo tutti i campi degli ordini sono primitive; l'aggiunta di array o oggetti richiede di rivalutare copie e invarianti.

La factory accetta una Quantity gia ottenuta dal parser. Dopo JSON o un confine non attendibile, ricostruisci i valori: non recuperi il brand con un cast.

## Errori comuni

- Booleani isPaid/isCancelled indipendenti che permettono combinazioni vietate.
- Brand con nomi forti ma controlli deboli.
- Mutare lo stesso oggetto aggirando le funzioni di dominio.
- Confondere stato paid con avvenuto addebito reale.
- Validare una volta e riutilizzare valori dopo operazioni che possono invalidarli.

## Checklist

- Regole e vocabolario condivisi.
- Formato, intervallo e significato dei valori distinti.
- Test di tutte le transizioni consentite e vietate.
- Input non mutati e strategia di copia esplicita.
- Invarianti tra piu scritture protette anche nella persistenza.
- Dominio indipendente dai framework.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Programmazione/TypeScript/Pagine/Brand Types|Brand Types]]
- [[Programmazione/TypeScript/Pagine/Discriminated Unions|Discriminated Unions]]
- [[Programmazione/TypeScript/Pagine/Clean architecture|Clean architecture]]
- [[Programmazione/TypeScript/Pagine/Error Handling|Error Handling]]

## Fonti

- [Domain Model, catalogo di Martin Fowler](https://martinfowler.com/eaaCatalog/domainModel.html).
- [Martin Fowler: value object e uguaglianza](https://martinfowler.com/bliki/ValueObject.html).
- [TypeScript: union discriminate e never](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
- [TypeScript: readonly e struttura degli oggetti](https://www.typescriptlang.org/docs/handbook/2/objects.html).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
