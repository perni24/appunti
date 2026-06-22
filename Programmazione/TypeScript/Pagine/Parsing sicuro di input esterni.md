---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, parsing, input-validation, security]
aliases: [Parsing sicuro]
prerequisites: [Validazione runtime e tipi statici]
related: [Schema validation con Zod, API contract, Error Handling]
---

# Parsing sicuro di input esterni

## Sintesi

Il parsing sicuro consiste nel trasformare input non fidati in valori validati, tipizzati e adatti al dominio applicativo.

In TypeScript il parsing sicuro evita il pattern rischioso `JSON.parse(...) as Type`.

## Quando usarlo

- Request HTTP.
- Webhook.
- File caricati dall'utente.
- Variabili ambiente.
- Local storage.
- Messaggi da queue o eventi.

## Come funziona

Un parser sicuro:

1. Riceve `unknown`.
2. Valida struttura e valori.
3. Normalizza se necessario.
4. Restituisce un tipo affidabile o un errore esplicito.

## API / Sintassi

```ts
type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
```

## Esempio pratico

```ts
type Port = number;

function parsePort(value: unknown): ParseResult<Port> {
  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    return { ok: false, error: "Porta non valida" };
  }

  return { ok: true, value: port };
}
```

Il parser non restituisce semplicemente `number`: applica regole di dominio.

## Varianti

- **Parser manuale**: funzioni dedicate.
- **Schema parser**: Zod o librerie simili.
- **Parser con Result**: ritorna successo/errore.
- **Parser con eccezione**: lancia se invalido.
- **Parser + normalizzazione**: trim, lowercase, default controllati.

## Errori comuni

- **Confondere parsing e casting**: `as` non controlla nulla.
- **Accettare input parzialmente valido** senza segnalarlo.
- **Normalizzare senza documentare**: puo nascondere errori.
- **Usare tipi runtime come se fossero dominio**: un DTO valido puo non essere un oggetto di dominio valido.

## Checklist

- Trattare tutto l'esterno come `unknown`.
- Restituire errori leggibili.
- Separare validazione e logica di business.
- Testare casi malformati.
- Non usare `as` sui confini esterni.

## Collegamenti

- [[Validazione runtime e tipi statici]]
- [[Schema validation con Zod]]
- [[API contract]]
- [[Error Handling]]
