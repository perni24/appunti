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
  - parsing
  - input-validation
  - security
aliases:
  - Parsing sicuro
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Schema validation con Zod]]"
  - "[[Programmazione/TypeScript/Pagine/API contract]]"
  - "[[Programmazione/TypeScript/Pagine/Error Handling]]"
title: Parsing sicuro di input esterni
---

# Parsing sicuro di input esterni

## Sintesi

Un parser di confine trasforma dati esterni in valori utilizzabili secondo una **politica esplicita**. "Sicuro" non significa accettare qualsiasi input convertibile: significa decidere formati ammessi, limiti, normalizzazione ed errori.

Baseline: **TypeScript 5.9.3**, `strict: true`, target **ES2022**, **Node.js 24.14.0**. Il demo non apre porte e non legge variabili d'ambiente reali.

## Quando usarlo

- Configurazioni e variabili ambiente.
- Request HTTP, file e messaggi.
- Valori letti da storage o integrazioni esterne.
- Confini in cui una conversione permissiva nasconderebbe un errore.

## Come funziona

Separa il formato dal valore finale. `Number(true)` produce `1`, `Number([8080])` produce `8080` e una conversione puo chiamare metodi di un oggetto. Questi comportamenti JavaScript non costituiscono una politica adeguata per una porta di configurazione.

Il parser seguente accetta:

- un `number` intero tra **1 e 65535**;
- una stringa ASCII decimale canonica di una-cinque cifre, senza spazi, segno o zeri iniziali, nello stesso intervallo.

Rifiuta deliberatamente `0`: alcuni usi di rete lo interpretano come richiesta di una porta assegnata dal sistema, ma non e il contratto di questa configurazione. Non verifica che la porta sia libera o utilizzabile con i permessi correnti.

## API / Sintassi

I tre blocchi TypeScript seguenti appartengono allo stesso file. Il tipo risultato:

```ts
type ParseResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        code: "type" | "format" | "range" | "json" | "shape" | "size";
        message: string;
      };
    };

type Port = number;
```

`Port = number` e un alias, non un brand: non impedisce di assegnare `-1` altrove. La garanzia proviene dal percorso attraverso il parser; per proteggerlo anche staticamente vedi Brand Types.

## Esempio pratico

### Parser della porta

```ts
function parsePort(input: unknown): ParseResult<Port> {
  let port: number;

  if (typeof input === "number") {
    port = input;
  } else if (typeof input === "string") {
    if (
      input.length < 1 ||
      input.length > 5 ||
      input[0] === "0" ||
      /[^0-9]/.test(input)
    ) {
      return {
        ok: false,
        error: {
          code: "format",
          message: "Expected decimal digits without padding",
        },
      };
    }
    port = Number(input);
  } else {
    return {
      ok: false,
      error: { code: "type", message: "Expected a number or decimal string" },
    };
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return {
      ok: false,
      error: {
        code: "range",
        message: "Port must be an integer from 1 to 65535",
      },
    };
  }

  return { ok: true, value: port };
}

console.log(parsePort("8080").ok); // true
console.log(parsePort(true).ok); // false
console.log(parsePort("8080\n").ok); // false
```

La conversione avviene **dopo** aver ristretto il tipo e verificato tutta la stringa. Non vengono eseguiti `valueOf` o `toString` di oggetti ricevuti. `NaN`, infinito, frazioni e numeri fuori intervallo falliscono.

`"1e3"` e `"0x50"` non sono sintassi accettate. Un numero gia pari a `1000` invece e valido: la notazione originale non esiste piu quando il parser riceve un `number`.

### Documento JSON di configurazione

Aggiungere allo stesso file:

```ts
function parsePortDocument(input: unknown): ParseResult<Port> {
  if (typeof input !== "string") {
    return {
      ok: false,
      error: { code: "type", message: "Expected JSON text" },
    };
  }
  if (input.length > 128) {
    return {
      ok: false,
      error: { code: "size", message: "Configuration text is too long" },
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch {
    return {
      ok: false,
      error: { code: "json", message: "Malformed JSON" },
    };
  }

  if (
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data) ||
    !Object.hasOwn(data, "port") ||
    !("port" in data)
  ) {
    return {
      ok: false,
      error: { code: "shape", message: "Expected an object with a port field" },
    };
  }

  return parsePort(data.port);
}

const result = parsePortDocument('{"port":"8080"}');
if (result.ok) {
  console.log(result.value); // 8080
} else {
  console.log(result.error.code);
}
```

Il `catch` circonda solo la decodifica, non tutta la logica applicativa. Sintassi JSON errata, forma errata e porta non valida sono casi distinti. I messaggi non includono il contenuto ricevuto.

La soglia di 128 e un limite dimostrativo in **unita UTF-16**, non byte. Il testo e gia in memoria: in HTTP o nella lettura di un file serve anche un limite del trasporto prima dell'allocazione. Il parser non e una difesa completa contro input voluminosi.

I campi aggiuntivi sono ignorati e non copiati nel risultato. Un JSON con chiavi duplicate non viene rifiutato da questa procedura: se il contratto richiede tale controllo, occorre una strategia di decodifica che lo supporti.

## Varianti

- **Eccezioni**: utili per invarianti o errori gestiti da un livello superiore; non confonderle con un risultato discriminato.
- **Schema runtime**: utile per record complessi e percorsi degli errori.
- **Normalizzazione**: `trim`, conversioni o default solo se previsti dal contratto. Per password o identificatori non applicare automaticamente modifiche del testo.
- **Parser e dominio**: il dato valido puo ancora richiedere autorizzazione, verifica dello stato o una transazione.
- **Formati differenti**: CSV, date e URL hanno grammatiche proprie; non generalizzare il parser della porta.

## Errori comuni

- Convertire con `Number` prima di distinguere il tipo.
- Usare `parseInt` e accettare un prefisso numerico come `"8080abc"`.
- Usare un cast al posto di una verifica.
- Perdere la distinzione tra sintassi, forma e vincoli.
- Scambiare un limite sul testo per un limite di download.
- Restituire o registrare input sensibili negli errori.

## Checklist

- Quali tipi e quali sintassi accetto esattamente?
- Conversioni, spazi e default sono intenzionali?
- Ho limiti sia sul trasporto sia sul dato decodificato?
- Gli errori permettono al chiamante di reagire senza esporre il payload?
- Ho testato estremi, newline, simboli, oggetti e valori non finiti?
- La validazione e separata da effetti collaterali e autorizzazione?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]
- [[Programmazione/TypeScript/Pagine/Schema validation con Zod|Schema validation con Zod]]
- [[Programmazione/TypeScript/Pagine/API contract|API contract]]
- [[Programmazione/TypeScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/TypeScript/Pagine/Brand Types|Brand Types]]

## Fonti

- [MDN - Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
- [MDN - JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [Node.js 24.14.0 - net.Server.listen: porta zero](https://nodejs.org/download/release/v24.14.0/docs/api/net.html#serverlisten)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
