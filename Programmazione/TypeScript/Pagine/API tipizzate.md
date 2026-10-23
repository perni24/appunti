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
  - api
  - dto
  - contract
  - backend
aliases:
  - API TypeScript tipizzate
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/API contract]]"
  - "[[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Generazione di tipi da API]]"
  - "[[Programmazione/TypeScript/Pagine/DTO e modelli di dominio]]"
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Node.js]]"
title: API tipizzate
---

# API tipizzate

## Sintesi

Un client tipizzato descrive input, output ed errori, ma deve anche controllare cio che arriva dalla rete. Qui un'API calcola l'anteprima di un titolo: normalizza il testo e ne restituisce la lunghezza. Non finge di creare un utente o salvare dati.

Baseline: **TypeScript 5.9.3**, **Zod 4.6.7**, **Node 24.14.0** con Fetch. Gli endpoint corrispondenti sono nella nota Express/Fastify.

## Quando usarlo

- Client HTTP usati da piu componenti.
- Contratti condivisi fra frontend e backend.
- Risposte esterne che devono entrare nell'app come valori controllati.
- Errori che la UI deve distinguere senza esporre il payload remoto.

## Come funziona

Il protocollo dimostrativo e `POST /preview` con JSON `{ title: string }`. Il server applica trim, ammette titoli di 1-80 unita UTF-16 e risponde `200` con `{ title, length }`. Nessuna persistenza o autenticazione e implementata.

La stessa versione dello schema non garantisce che client e server siano aggiornati insieme. Servono test negativi e compatibilita del protocollo. Le risposte possono contenere campi nuovi: il decoder li elimina dal valore pubblico.

## API / Sintassi

Usa il package e il tsconfig NodeNext della nota Zod. I tre blocchi seguenti compongono `src/preview-client.ts`.

```ts
import { z } from "zod";

export const PreviewInputSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .refine(
      (text) => text.length >= 1 && text.length <= 80,
      "Expected 1-80 UTF-16 units",
    ),
});
export type PreviewInput = z.input<typeof PreviewInputSchema>;

export const PreviewSchema = z
  .object({
    title: z.string(),
    length: z.number().int().min(1).max(80),
  })
  .refine(
    (value) =>
      value.title === value.title.trim() && value.title.length === value.length,
  );
export type Preview = z.output<typeof PreviewSchema>;

export type PreviewResult =
  | { ok: true; data: Preview }
  | {
      ok: false;
      error:
        | {
            code:
              | "input"
              | "aborted"
              | "network"
              | "content_type"
              | "json"
              | "schema";
          }
        | { code: "http"; status: number };
    };
```

La lunghezza e una scelta del protocollo, non il numero di caratteri percepiti dall'utente. Un'emoji puo occupare due unita UTF-16. La regola e esplicita anche per non dipendere dal significato di lunghezza adottato da un validatore.

## Esempio pratico

Il factory riceve una URL configurata dall'applicazione, non un indirizzo fornito da un utente remoto. La copia impedisce che una successiva mutazione della URL cambi la destinazione.

```ts
export function createPreviewClient(
  endpoint: URL,
  fetcher: typeof fetch = fetch,
) {
  const url = new URL(endpoint);

  return async function preview(
    input: PreviewInput,
    signal?: AbortSignal,
  ): Promise<PreviewResult> {
    if (signal?.aborted) return { ok: false, error: { code: "aborted" } };
    const parsed = PreviewInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: { code: "input" } };

    try {
      const response = await fetcher(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(parsed.data),
        credentials: "omit",
        redirect: "error",
        signal,
      });

      if (response.status !== 200) {
        await response.body?.cancel();
        return { ok: false, error: { code: "http", status: response.status } };
      }
      const mediaType = response.headers
        .get("content-type")
        ?.split(";", 1)[0]
        ?.trim()
        .toLowerCase();
      if (mediaType !== "application/json") {
        await response.body?.cancel();
        return { ok: false, error: { code: "content_type" } };
      }

      const text = await response.text();
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        return { ok: false, error: { code: "json" } };
      }
      const result = PreviewSchema.safeParse(payload);
      return result.success
        ? { ok: true, data: result.data }
        : { ok: false, error: { code: "schema" } };
    } catch {
      return {
        ok: false,
        error: { code: signal?.aborted ? "aborted" : "network" },
      };
    }
  };
}
```

Il client controlla anche il proprio input: un chiamante JavaScript o un cast puo aggirare il checker. `200` e l'unico successo previsto; un `204` non diventa un oggetto vuoto.

Questo blocco completa lo stesso modulo senza effettuare richieste al suo caricamento:

```ts
export async function printPreview(endpoint: URL): Promise<void> {
  const preview = createPreviewClient(endpoint);
  const result = await preview(
    { title: "  Appunti  " },
    AbortSignal.timeout(3000),
  );
  if (result.ok) {
    console.log(result.data.title, result.data.length);
  } else {
    console.error(result.error.code);
  }
}
```

Compilare:

```sh
npm exec -- tsc -p tsconfig.json
```

Con il server Express della nota collegata attivo su loopback, eseguire:

```sh
node --input-type=module -e "import { printPreview } from './dist/preview-client.js'; await printPreview(new URL('http://127.0.0.1:3000/preview'));"
```

Risultato: `Appunti 7`. La funzione termina senza lanciare per gli errori modellati, ma il tipo Promise non impedisce eccezioni dovute a difetti futuri o codice chiamante.

### Limiti del trasporto

Il segnale copre anche la lettura del body; il codice raggruppa timeout e annullamento volontario in `aborted`. Non esegue retry e l'abort non annulla effetti gia avvenuti sul server. Questo endpoint non modifica dati.

`response.text()` legge l'intera risposta: il demo non implementa un tetto ai byte ricevuti. URL, HTTPS, credenziali, CORS, limiti e autenticazione richiedono una policy dell'app reale. `credentials: "omit"` non e una soluzione universale per API autenticate.

## Varianti

OpenAPI e GraphQL codegen producono artefatti specifici; controlla se sono solo tipi, un client o anche validatori. Un RPC tipizzato non elimina rete, disallineamento di versioni o autorizzazione.

Per dati reali mantieni DTO pubblici distinti dai record del database. Un risultato discriminato richiede narrowing per leggere `data`, ma non obbliga il chiamante a mostrare o trattare ogni errore: puo ancora ignorare il risultato.

## Errori comuni

- Chiamare API una funzione che restituisce un successo inventato.
- Usare un generic o un cast come validatore.
- Accettare ogni 2xx o ignorare il content type.
- Registrare corpi e messaggi remoti senza una policy.
- Credere che una union imponga una gestione esaustiva al chiamante.

## Checklist

- Il contratto specifica metodo, status, rappresentazione ed errori?
- Controllo input e output realmente?
- Uso il valore proiettato dal parser?
- Timeout, cancellazione e limiti sono espliciti?
- Esistono test del client e del server, oltre al checker?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/API contract|API contract]]
- [[Programmazione/TypeScript/Pagine/Schema validation con Zod|Schema validation con Zod]]
- [[Programmazione/TypeScript/Pagine/TypeScript con Express-Fastify|Server Express/Fastify]]
- [[Programmazione/TypeScript/Pagine/Generazione di tipi da API|Generazione di tipi da API]]

## Fonti

- [MDN - Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN - AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [Zod - Parsing e inferenza](https://zod.dev/basics)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
