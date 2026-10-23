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
  - api-contract
  - validation
  - dto
aliases:
  - Contratto API
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/API tipizzate]]"
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Generazione di tipi da API]]"
  - "[[Programmazione/TypeScript/Pagine/DTO e modelli di dominio]]"
title: API contract
---

# API contract

## Sintesi

Un contratto API descrive piu di un'interfaccia TypeScript: metodo, percorso, parametri, rappresentazione sulla rete, status, errori e regole di compatibilita. Tipi condivisi riducono il lavoro duplicato, ma non verificano automaticamente il servizio.

Baseline del decoder dimostrativo: **TypeScript 5.9.3**, **Zod 4.6.7**, **Node.js 24.14.0**. E una funzione locale, non un server o un client HTTP completo.

## Quando usarlo

- Coordinare frontend e backend distribuiti separatamente.
- Pubblicare API o generare SDK.
- Verificare request e response con test ripetibili.
- Gestire evoluzione del protocollo senza rompere i consumer.

## Come funziona

Mantieni una fonte autorevole e identifica quali artefatti sono generati. Tipi, schemi runtime, OpenAPI e client non sono intercambiabili: ogni strumento produce un insieme specifico di garanzie.

Un contratto dovrebbe precisare:

- metodo e percorso, parametri e body;
- content type, codifica e rappresentazione di date e numeri;
- risposte per status e formato degli errori;
- autenticazione e autorizzazione richieste;
- limiti, paginazione e semantica dei retry quando rilevanti;
- compatibilita tra versioni di provider e consumer.

Request e response possono avere forme diverse: un dato necessario in una richiesta di creazione, come una password, non deve comparire per questo nella risposta pubblica. Il DTO non e automaticamente il modello del database.

## API / Sintassi

Per l'esempio locale assumiamo questa parte di protocollo:

- `GET /v1/users/{id}`, nessun request body.
- L'adapter HTTP deve validare/codificare `id` e verificare la rappresentazione JSON prevista.
- `200`: oggetto con `id` non vuoto ed `email` nel formato scelto dallo schema.
- `404`: oggetto con `code: "NOT_FOUND"` e messaggio non vuoto.
- Altri status: esito inatteso per questo consumer; non vengono convertiti in un utente.
- Campi aggiuntivi delle risposte tollerati ma eliminati dal valore restituito.

Questa e una scelta del demo, non una regola universale per tutte le API. Il contratto reale deve definire anche accesso ai dati, status di autorizzazione e comportamento degli intermediari.

Usa il progetto e la configurazione della nota Zod. I tre blocchi seguenti compongono `src/contract.ts`:

```ts
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
});

const NotFoundSchema = z.object({
  code: z.literal("NOT_FOUND"),
  message: z.string().min(1),
});

export type UserDto = z.output<typeof UserSchema>;

export type GetUserResult =
  | { ok: true; data: UserDto }
  | { ok: false; error: { kind: "not_found" } }
  | { ok: false; error: { kind: "invalid_response" } }
  | { ok: false; error: { kind: "unexpected_status"; status: number } };
```

`ok` e un discriminante applicativo. Non e `Response.ok`, che indica soltanto uno status HTTP nell'intervallo 200-299 e non controlla il body.

## Esempio pratico

### Decoder della risposta

Il payload e gia stato decodificato dal JSON ma resta `unknown`:

```ts
export function decodeGetUser(status: number, payload: unknown): GetUserResult {
  if (status === 200) {
    const result = UserSchema.safeParse(payload);
    return result.success
      ? { ok: true, data: result.data }
      : { ok: false, error: { kind: "invalid_response" } };
  }

  if (status === 404) {
    const result = NotFoundSchema.safeParse(payload);
    return result.success
      ? { ok: false, error: { kind: "not_found" } }
      : { ok: false, error: { kind: "invalid_response" } };
  }

  return { ok: false, error: { kind: "unexpected_status", status } };
}
```

Il messaggio remoto del 404 non viene mostrato automaticamente all'utente o copiato nei log. Il consumer sceglie un testo locale dal codice dell'errore.

### Uso senza rete

```ts
const found = decodeGetUser(200, {
  id: "u1",
  email: "user@example.test",
  internalToken: "demo",
});

if (found.ok) {
  console.log(found.data.id); // u1
  console.log(Object.keys(found.data)); // ["id", "email"]
}

const missing = decodeGetUser(404, {
  code: "NOT_FOUND",
  message: "No matching user",
});
if (!missing.ok) {
  console.log(missing.error.kind); // not_found
}
```

Compilare:

```sh
npm exec -- tsc -p tsconfig.json
```

Eseguire:

```sh
node dist/contract.js
```

Lo status viene dall'adapter HTTP. Prima di chiamare il decoder, l'adapter deve distinguere errori di rete, timeout/cancellazione, content type inatteso, JSON malformato e body assente. `204`, per esempio, non e una risposta utente valida per questo contratto.

Il decoder non invia request, non autentica utenti e non prova che il server rispetti lo schema. Il parser di un'email non ne verifica la proprieta o l'esistenza. Non inviare dati privati confidando che sia il client a eliminarli: anche il server deve costruire la risposta pubblica.

## Varianti

### Strategie di definizione

- **Schema-first**: parti da OpenAPI, JSON Schema o schema GraphQL e verifichi gli artefatti prodotti.
- **Runtime schema**: parti da schemi eseguibili; la conversione in altri formati puo avere limiti.
- **Type-first**: servono strumenti espliciti per ottenere verifiche runtime; i tipi TS cancellati non bastano.
- **Contract-first**: concordi il protocollo prima delle implementazioni, indipendentemente dal formato.
- **RPC tipizzato**: la condivisione dei tipi non elimina rete, versioni distribuite e input malevoli.

### Evoluzione compatibile

Aggiungere un campo opzionale a una risposta puo funzionare con un consumer tollerante, ma fallire con un decoder che rifiuta chiavi extra. Aggiungere una variante di enum o union puo rompere uno switch esaustivo. Rendere obbligatorio un nuovo campo di request rompe i client che non lo inviano.

La compatibilita dipende dalla **direzione del dato** e dalle versioni effettivamente distribuite. Nel demo i campi extra della risposta sono tollerati; per le request puo essere preferibile una politica piu restrittiva.

`undefined` in una proprieta non viene rappresentato come `null` nel JSON. Date e interi molto grandi richiedono convenzioni esplicite: una stringa data non diventa da sola `Date`, e un `number` JavaScript non rappresenta esattamente tutti gli interi.

### Test del contratto

Controlla status e payload insieme, non solo una fixture valida del body. Aggiungi casi malformati e almeno una prova d'integrazione contro il provider reale, verificando che request e response serializzate rispettino il contratto. Un test del decoder locale non prova il backend.

## Errori comuni

- Credere che tipi condivisi o un client generato validino qualsiasi risposta.
- Trattare ogni 2xx come lo stesso tipo di successo.
- Ignorare il payload degli errori o mostrare messaggi remoti senza una politica.
- Far derivare automaticamente la risposta da tutti i campi del modello interno.
- Chiamare non-breaking una modifica senza provare i vecchi consumer.
- Confondere successo del parser con autenticazione e autorizzazione.

## Checklist

- Fonte autorevole e artefatti generati sono identificati?
- Status, payload ed errori di trasporto sono separati?
- Request e response hanno schemi appropriati e campi pubblici espliciti?
- La politica sui campi extra e compatibile con l'evoluzione prevista?
- Ho test negativi e una verifica d'integrazione del provider?
- Versioni distribuite, autorizzazione e limiti sono documentati?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/API tipizzate|API tipizzate]]
- [[Programmazione/TypeScript/Pagine/Generazione di tipi da API|Generazione di tipi da API]]
- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Programmazione/TypeScript/Pagine/Schema validation con Zod|Schema validation con Zod]]

## Fonti

- [OpenAPI 3.1.0 - Responses Object](https://spec.openapis.org/oas/v3.1.0.html#responses-object)
- [MDN - Response.ok](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok)
- [Zod - Objects e politica delle chiavi](https://zod.dev/api#objects)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
