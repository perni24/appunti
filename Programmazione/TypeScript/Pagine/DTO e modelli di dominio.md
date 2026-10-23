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
  - dto
  - domain-modeling
  - architecture
aliases:
  - DTO TypeScript
  - Modelli di dominio
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/API tipizzate]]"
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Domain modeling]]"
  - "[[Programmazione/TypeScript/Pagine/API contract]]"
  - "[[Programmazione/TypeScript/Pagine/Pattern Repository e Service]]"
title: DTO e modelli di dominio
---

# DTO e modelli di dominio

## Sintesi

Un **DTO** definisce dati che attraversano un confine, per esempio una richiesta o risposta JSON. Il **modello di dominio** rappresenta significati, regole e comportamenti interni. Il **modello di persistenza** rappresenta invece come i dati vengono memorizzati.

La separazione e utile quando i contratti cambiano per ragioni diverse. Non richiede di creare tre copie identiche di ogni tipo.

Baseline: **TypeScript 5.9.3**, `strict: true`, target **ES2022**, **Node 24.14.0**.

## Quando usarlo

- API con campi pubblici diversi dai dati interni.
- Input che richiede validazione e normalizzazione.
- Database e API con nomi, nullabilita o rappresentazioni differenti.
- Evoluzione di un dominio senza cambiare automaticamente il contratto pubblico.

## Come funziona

Un percorso tipico e: **payload unknown → parser → input del caso d'uso → dominio → mapper di risposta → serializzazione**.

Il parser controlla i dati ricevuti. Il mapper costruisce il risultato; il serializzatore lo codifica. Sono operazioni diverse: dichiarare `UserResponseDto`, usare `Pick` o fare un cast non elimina proprieta a runtime.

Un'entita e riconosciuta per identita; un value object per valore e invarianti. Un DTO non acquisisce comportamento di dominio solo perche viene scritto come classe. Un view model puo invece aggiungere campi adatti alla UI, senza diventare il formato del database.

## API / Sintassi

I quattro blocchi TS seguenti appartengono allo stesso file. L'esempio aggiorna solo un nome visualizzato: non implementa registrazione, password o autenticazione.

```ts
type UpdateProfileDto = { displayName: string };

type User = Readonly<{
  id: string;
  displayName: string;
  canLogin: boolean;
  passwordHash: string;
  createdAt: Date;
}>;

type UserResponseDto = {
  id: string;
  displayName: string;
  createdAt: string;
};
```

Il dominio contiene una Date; il contratto JSON usa una stringa ISO in UTC. La scelta del formato deve essere condivisa con il consumer. Un campo opzionale assente non equivale sempre a null.

## Esempio pratico

### Input con politica esplicita

```ts
function parseUpdateProfile(input: unknown): UpdateProfileDto | null {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input) ||
    Object.keys(input).length !== 1 ||
    !Object.hasOwn(input, "displayName") ||
    !("displayName" in input) ||
    typeof input.displayName !== "string"
  ) {
    return null;
  }

  const displayName = input.displayName.trim();
  if (displayName.length < 1 || displayName.length > 80) return null;
  return { displayName };
}
```

Il demo accetta un oggetto ordinario ottenuto da JSON, con esattamente il campo displayName. Rifiuta extra come role o passwordHash; la lunghezza e in **unita UTF-16**, non in caratteri percepiti.

Non e un sandbox per oggetti JavaScript con getter o Proxy ostili. Il parsing JSON e i limiti del corpo HTTP sono responsabilita precedenti. Anche un DTO ben formato richiede autorizzazione per modificare il profilo scelto.

### Output costruito per inclusione

```ts
function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}

const user: User = {
  id: "u1",
  displayName: "Ada",
  canLogin: true,
  passwordHash: "not-a-real-hash",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const response = toUserResponse(user);
console.log(JSON.stringify(response));
// {"id":"u1","displayName":"Ada","createdAt":"2026-01-01T00:00:00.000Z"}
```

Il mapper seleziona i campi pubblici e produce un oggetto nuovo. Una Date invalida fa lanciare toISOString: il dominio deve garantire una data valida o il mapper deve gestire esplicitamente quell'errore. Readonly non impedisce di mutare l'oggetto Date contenuto.

### Controesempio: restringere il tipo non proietta i dati

```ts
const misleading: Pick<User, "id" | "displayName"> = user;
console.log(Object.keys(misleading));
// Include anche canLogin, passwordHash e createdAt.
```

Il riferimento e ancora lo stesso oggetto. Anche uno spread completo puo copiare campi riservati; il tipo di ritorno non e un filtro. Preferisci costruire la risposta per inclusione dei campi previsti, invece di eliminare una lista incompleta di segreti.

## Varianti

- **Request/response distinti**: una password puo appartenere a un input dedicato, mai per questo alla risposta o al modello utente condiviso.
- **Persistence mapper**: converte righe, tipi del driver e convenzioni del database; una riga ORM non e automaticamente il dominio.
- **Schema runtime**: puo unire validazione, trasformazione e inferenza; usa l'output del parser, non l'input originale.
- **DTO generati**: un generatore da schema aiuta la sincronizzazione, ma non rende attendibili dati ricevuti.
- **Oggetti immutabili**: il mapper qui usa soltanto primitive in uscita; per array e oggetti annidati servono scelte esplicite sulle copie.

JSON non conserva metodi o prototipi. Date richiede un formato concordato, bigint una conversione scelta dal contratto; undefined puo sparire dagli oggetti. Tipi statici e forma effettivamente serializzata vanno testati separatamente.

## Errori comuni

- Esporre un oggetto ORM completo confidando nell'interfaccia della risposta.
- Fare mass assignment con `{ ...body }` senza selezionare campi autorizzati.
- Confondere validazione del payload con permesso di eseguire l'operazione.
- Duplicare contratti senza mapper o test.
- Considerare un nome email o token una prova di validita/autenticita.

## Checklist

- Contratti di input, output e dominio distinti quando necessario.
- Politica per extra, assenza/null e normalizzazione documentata.
- Campi pubblici scelti esplicitamente.
- Date, numeri e identificatori serializzati senza ambiguita.
- Test del JSON realmente prodotto e dei campi che devono essere assenti.
- Autorizzazione e logging trattati separatamente dal mapping.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Domain modeling|Domain modeling]]
- [[Programmazione/TypeScript/Pagine/API contract|API contract]]
- [[Programmazione/TypeScript/Pagine/Pattern Repository e Service|Pattern Repository e Service]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]

## Fonti

- [Data Transfer Object, catalogo di Martin Fowler](https://martinfowler.com/eaaCatalog/dataTransferObject.html).
- [TypeScript: object types e readonly](https://www.typescriptlang.org/docs/handbook/2/objects.html).
- [TypeScript: assertion senza effetto runtime](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions).
- [MDN: JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
