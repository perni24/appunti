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
  - runtime-validation
  - type-safety
  - validation
aliases:
  - Validazione runtime TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
  - "[[Programmazione/TypeScript/Pagine/Type Guards]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Schema validation con Zod]]"
  - "[[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni]]"
  - "[[Programmazione/TypeScript/Pagine/API contract]]"
title: Validazione runtime e tipi statici
---

# Validazione runtime e tipi statici

## Sintesi

TypeScript controlla il programma, non certifica i valori che arrivano da rete, file, form o storage. Un'annotazione o un'assertion non modifica il valore: il confine con dati esterni richiede codice eseguito realmente.

Baseline degli esempi: **TypeScript 5.9.3**, `strict: true`, target **ES2022**, **Node.js 24.14.0**. Il caso pratico riguarda dati JSON ordinari, non oggetti con getter o Proxy ostili.

## Quando usarlo

- Ricevere request, webhook, messaggi o risposte API.
- Leggere configurazioni, file o dati persistiti da versioni diverse dell'app.
- Verificare risultati di query o integrazioni senza presumere che un tipo del driver descriva ogni dato.
- Decidere dove fermare dati malformati prima della logica applicativa.

## Come funziona

Distingui quattro passaggi:

1. **Decodifica**: ottenere un valore dal formato esterno. `JSON.parse` controlla la sintassi JSON, non lo schema applicativo.
2. **Validazione**: controllare struttura e vincoli dichiarati.
3. **Normalizzazione e proiezione**: scegliere esplicitamente conversioni e campi da conservare.
4. **Regole applicative**: verificare permessi, disponibilita o vincoli che dipendono dallo stato del sistema.

`unknown` impedisce di usare liberamente il dato nel codice tipizzato; non lo isola e non lo rende innocuo. Dopo la validazione puoi usare solo le garanzie davvero controllate. Una stringa non e automaticamente un'email valida, un ID esistente o un utente autorizzato.

## API / Sintassi

Questo controesempio compila, ma il tipo dichiarato non corrisponde al valore:

```ts
type ClaimedUser = { id: string };

const claimed = JSON.parse('{"id":42}') as ClaimedUser;
console.log(typeof claimed.id); // number
// claimed.id.toUpperCase(); // compilerebbe, ma lancerebbe TypeError
```

Anche un generico `fetchJson<User>()` deve implementare una verifica reale: il parametro di tipo, da solo, non ne crea una. Lo stesso vale per interfacce e tipi generati da uno schema.

## Esempio pratico

Il parser seguente accetta un record con due campi propri di tipo stringa e costruisce un nuovo oggetto contenente soltanto quei campi:

```ts
type UserSummary = {
  id: string;
  email: string;
};

function parseUserSummary(input: unknown): UserSummary {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input) ||
    !Object.hasOwn(input, "id") ||
    !Object.hasOwn(input, "email") ||
    !("id" in input) ||
    !("email" in input) ||
    typeof input.id !== "string" ||
    typeof input.email !== "string"
  ) {
    throw new TypeError("Expected id and email strings");
  }

  return { id: input.id, email: input.email };
}

const raw: unknown = JSON.parse(
  '{"id":"u1","email":"user@example.test","internalToken":"demo"}',
);
const user = parseUserSummary(raw);

console.log(user.id); // u1
console.log(Object.keys(user)); // ["id", "email"]
console.log(user === raw); // false
```

`Object.hasOwn` verifica la proprieta propria; `in` permette anche il narrowing del checker. Non sono controlli equivalenti: `in` da solo vede anche proprieta ereditate.

La proiezione esclude `internalToken` dall'oggetto restituito, ma non cancella il campo dal valore originale. Non passare poi `raw` al resto dell'applicazione al posto di `user`.

### Garanzie e limiti

Il parser verifica **forma e tipi dei due campi**. Accetta anche stringhe vuote o un'email dal formato errato: aggiungi vincoli se fanno parte del contratto. Non verifica account esistente, proprieta dell'indirizzo, autorizzazioni o unicita.

I due campi restituiti sono primitive, quindi non condividono un oggetto annidato con l'input. Per oggetti piu complessi devi decidere come copiare o normalizzare i dati. Il risultato non e congelato; un alias mutabile puo invalidare garanzie dopo il controllo.

La lettura di proprieta di oggetti JavaScript arbitrari puo eseguire getter o trap. Questo esempio e destinato a dati decodificati da JSON, non e una sandbox per codice ostile.

## Varianti

- **Guardia**: classifica il valore e permette narrowing; non lo trasforma.
- **Assertion function**: il ritorno normale restringe il tipo, il fallimento lancia. Il checker non dimostra la correttezza della promessa.
- **Parser con Result**: restituisce successo oppure un errore strutturato senza usare eccezioni per input attesi.
- **Schema runtime**: centralizza controlli e tipi derivati, ma va comunque applicato ai dati.
- **Validatore generato**: richiede uno strumento che generi controlli, non soltanto dichiarazioni TypeScript.

### Dove validare

Valida ai confini di fiducia e quando cambia il contratto del dato. Il controllo nel form migliora l'esperienza, ma il server deve applicare le proprie verifiche. Non serve ripetere automaticamente lo stesso parser a ogni chiamata interna: conserva tipi e invarianti, e ricontrolla quando i dati possono essere stati alterati.

## Errori comuni

- Usare `as User` o `any` per aggirare un confine non controllato.
- Confondere JSON sintatticamente valido con un DTO valido.
- Usare un campo `role` inviato dal client come autorizzazione.
- Accettare i dati validati e continuare a utilizzare l'input grezzo.
- Credere che un tipo escluda campi aggiuntivi dalla serializzazione.
- Trattare una validazione riuscita come una garanzia permanente dopo mutazioni.

## Checklist

- Qual e la fonte del dato e quale contratto deve rispettare?
- Ho distinto sintassi, forma, vincoli e autorizzazione?
- I campi extra sono rifiutati, ignorati o conservati deliberatamente?
- Uso il risultato del parser invece del valore originale?
- Gestisco errori senza registrare payload riservati?
- Ho testato casi vuoti, mancanti, malformati e mutazioni rilevanti?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Schema validation con Zod|Schema validation con Zod]]
- [[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni|Parsing sicuro di input esterni]]
- [[Programmazione/TypeScript/Pagine/API contract|API contract]]
- [[Programmazione/TypeScript/Pagine/Type Guards|Type Guards]]

## Fonti

- [TypeScript - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [MDN - JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [MDN - Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
