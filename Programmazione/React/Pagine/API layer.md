---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - api
  - architecture
  - frontend
aliases:
  - API layer
  - Client API
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]"
  - "[[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]"
related:
  - "[[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]"
  - "[[Programmazione/React/Pagine/Feature-based architecture|Feature-based architecture]]"
title: API layer
---

# API layer

## Sintesi

L'API layer espone operazioni applicative come getUser senza far conoscere a ogni componente URL, header, formato della risposta e mapping dei dati. Non e un pacchetto di React: e una separazione di responsabilita.

Un wrapper Fetch risolve solo il trasporto. Validazione, modello del dominio, cache, stato della UI e autenticazione hanno contratti distinti, anche se in un progetto piccolo occupano pochi file.

## Quando usarlo

Utile quando piu schermate chiamano gli stessi endpoint o devono condividere errori, cancellazione e trasformazioni. Anche una funzione autonoma per un singolo endpoint puo essere sufficiente: non serve un framework di repository prima che esista una duplicazione reale.

Centralizzare non significa creare un unico file enorme con tutte le API, ne applicare automaticamente retry, token e Content-Type a qualunque richiesta.

## Come funziona

| Livello | Responsabilita | Non decide |
| --- | --- | --- |
| Trasporto | Fetch, header, HTTP, lettura del corpo, signal | Quale schermata mostrare |
| API della feature | Endpoint, input, schema e mapping DTO | Stato di apertura dei pannelli |
| Cache/loader | Chiavi, freschezza, deduplicazione e invalidazione | Autorizzazioni del server |
| UI | Loading, errori comprensibili, bozza e azioni | Il formato interno del backend |

Un DTO e il formato trasferito dal server, non necessariamente il modello che vuoi usare nella UI. Per esempio display_name puo diventare name; scartare campi inutilizzati riduce accoppiamento, ma non nasconde dati gia inviati al browser.

### Errori distinti

Fetch risolve anche per un HTTP 404 o 500. Occorre controllare lo status; poi Content-Type, parsing e schema restano verifiche diverse. Una pagina HTML di login con status 200 non e un elenco utenti valido.

Non trasformare ogni errore in array vuoto: "nessun utente" e "caricamento fallito" hanno significati differenti. Conserva informazioni tecniche utili per diagnosi, senza esporre body, token o dettagli interni al visitatore.

### Header, sicurezza e cancellazione

Usa Headers per accettare record, coppie o un'istanza Headers: lo spread di quest'ultima non ne copia correttamente le voci. Content-Type descrive il corpo inviato, Accept il formato richiesto; un GET senza body non ha bisogno di Content-Type JSON.

Un client con cookie o bearer token richiede una policy esplicita per origini, redirect, refresh e CSRF. Il codice client non conserva segreti affidabili e CORS non e autorizzazione. Il demo seguente riguarda un'API pubblica senza credenziali: non e un modello di login.

Inoltra AbortSignal fino a Fetch. Chi avvia il lavoro decide quando cancellarlo; il trasporto non deve inventare un controller globale. Un abort o timeout client non annulla una scrittura gia avvenuta sul server. Retry, backoff e idempotenza vanno progettati per operazione, non aggiunti indiscriminatamente nel wrapper.

## API / Sintassi

Il client seguente supporta deliberatamente soltanto GET/POST/PUT/PATCH/DELETE, body JSON e successi 200/201 con application/json oppure 204 senza corpo. Non e un wrapper universale per HEAD, upload, stream, download, 202 o media type JSON personalizzati.

`src/shared/api/http.js`:

```js
export class ApiError extends Error {
  constructor(kind, message, { status = null, cause } = {}) {
    super(message, { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

export async function requestJson(url, {
  method = "GET", data, headers, signal, expectedStatus = 200,
} = {}) {
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)
    || ![200, 201, 204].includes(expectedStatus)) {
    throw new TypeError("Contratto HTTP non supportato dal demo");
  }
  signal?.throwIfAborted();
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Accept")) requestHeaders.set("Accept", "application/json");
  let body;
  if (data !== undefined) {
    if (method === "GET") throw new TypeError("GET senza body nel demo");
    body = JSON.stringify(data);
    if (body === undefined) throw new TypeError("Body non serializzabile in JSON");
    requestHeaders.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(url, {
      method, headers: requestHeaders, body, signal,
      credentials: "omit", redirect: "error",
    });
  } catch (cause) {
    signal?.throwIfAborted();
    throw new ApiError("network", "Richiesta non completata", { cause });
  }
  signal?.throwIfAborted();
  if (!response.ok) {
    throw new ApiError("http", `HTTP ${response.status}`, { status: response.status });
  }
  if (response.status !== expectedStatus) {
    throw new ApiError("protocol", "Status di successo inatteso", { status: response.status });
  }
  if (response.status === 204) return undefined;
  const mediaType = (response.headers.get("Content-Type") ?? "")
    .split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw new ApiError("protocol", "Risposta non JSON", { status: response.status });
  }
  try {
    const value = await response.json();
    signal?.throwIfAborted();
    return value;
  } catch (cause) {
    signal?.throwIfAborted();
    throw new ApiError(cause instanceof SyntaxError ? "protocol" : "body",
      "Corpo della risposta non leggibile", { status: response.status, cause });
  }
}
```

URL e opzioni sono forniti da moduli applicativi fidati, non da input arbitrario. Le funzioni di feature sotto scelgono percorsi fissi sulla stessa origine e validano gli ID. `credentials: "omit"` evita le credenziali gestite dal browser, ma non rimuove un header Authorization che il chiamante inserisse esplicitamente: non passarlo a questo client pubblico.

Il signal annullato conserva il suo motivo, anche personalizzato, anziche diventare ApiError. I controlli espliciti su metodo/status e la serializzazione avvengono prima di Fetch; non sono una validazione generale di ogni opzione o URL. Network comprende anche errori CORS o redirect rifiutati: non dimostra da solo che il dispositivo sia offline. Body distingue problemi durante la lettura da JSON sintatticamente invalido; il payload d'errore del server non viene letto dal demo.

Con FormData serve un'operazione separata che passi il body originale e lasci al browser Content-Type/boundary: non inserirlo in data e non forzare multipart/form-data a mano.

Questo client legge il JSON interamente in memoria e non impone un limite di byte. Risposte grandi, paginazione, streaming e payload d'errore strutturati richiedono una policy aggiuntiva. Il timeout e deciso dal chiamante tramite signal; non c'e una scadenza o un retry nascosto nel wrapper.

## Esempio pratico

### Contratto del backend

**Il backend non e incluso.** Per il demo serve un servizio o proxy sulla stessa origine; Vite da solo non crea questi endpoint. Sono contratti didattici, non API offerte da React.

| Operazione | Richiesta | Successo atteso |
| --- | --- | --- |
| Elenco | GET /api/users | 200 JSON, array di DTO con ID unici |
| Dettaglio | GET /api/users/:id | 200 JSON, DTO con lo stesso ID richiesto |
| Creazione | POST /api/users, JSON con display_name | 201 JSON, DTO creato |
| Eliminazione | DELETE /api/users/:id | 204, nessun corpo |

DTO di esempio: `{"id":"a","display_name":"Ada"}`. ID: da 1 a 64 caratteri ASCII alfanumerici, trattino o underscore. Nome: stringa non vuota dopo trim, massimo 80 unita UTF-16. Sono limiti del contratto dimostrativo, non regole universali sui nomi. Il backend deve validare e autorizzare autonomamente, soprattutto le scritture.

### API per feature

`src/features/users/usersApi.js`: modulo indipendente da React. Le risposte diventano `{ id, name }`, con campi aggiuntivi scartati.

```js
import { ApiError, requestJson } from "../../shared/api/http.js";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function checkId(id) {
  if (typeof id !== "string" || !ID_PATTERN.test(id)) {
    throw new TypeError("ID non valido");
  }
}

export function parseUserDTO(value, expectedId) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || typeof value.id !== "string" || !ID_PATTERN.test(value.id)
    || typeof value.display_name !== "string"
    || value.display_name.trim() === "" || value.display_name.length > 80
    || (expectedId !== undefined && value.id !== expectedId)) {
    throw new ApiError("schema", "Utente non valido");
  }
  return { id: value.id, name: value.display_name };
}

export function parseUsersDTO(value) {
  if (!Array.isArray(value)) throw new ApiError("schema", "Elenco non valido");
  const users = value.map((item) => parseUserDTO(item));
  if (new Set(users.map((user) => user.id)).size !== users.length) {
    throw new ApiError("schema", "ID duplicati");
  }
  return users;
}

export async function getUsers({ signal } = {}) {
  return parseUsersDTO(await requestJson("/api/users", { signal }));
}

export async function getUser(id, { signal } = {}) {
  checkId(id);
  return parseUserDTO(await requestJson(`/api/users/${encodeURIComponent(id)}`,
    { signal }), id);
}

export async function createUser(name, { signal } = {}) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    throw new TypeError("Nome non valido");
  }
  return parseUserDTO(await requestJson("/api/users", {
    method: "POST", data: { display_name: name.trim() },
    expectedStatus: 201, signal,
  }));
}

export async function deleteUser(id, { signal } = {}) {
  checkId(id);
  await requestJson(`/api/users/${encodeURIComponent(id)}`, {
    method: "DELETE", expectedStatus: 204, signal,
  });
}
```

Encoding dell'ID e validazione hanno scopi diversi. `encodeURIComponent` da solo non definisce quali ID il backend accetta e non rende sicuro qualunque percorso. La policy qui esclude anche dot segment e slash. In un'API reale adatta regole e mapping al contratto documentato.

I tipi TypeScript e molti client generati non validano automaticamente il JSON a runtime. Per schemi estesi usa un validatore, come mostrato in [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]. Il mapping non e sanitizzazione HTML: React deve continuare a rendere name come testo.

`createUser` e `deleteUser` effettuano scritture reali se collegati a un backend: non provarli su dati importanti. Il demo UI seguente usa soltanto getUser; non implementa form di creazione o conferma di eliminazione. Nessun retry automatico, rollback o idempotenza e implicito.

### Collegare la UI senza duplicare il loader

Riusa la toolchain e il bootstrap di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Salva il modulo completo ProfileDemo.jsx di [[Programmazione/React/Pagine/Gestione della memoria e AbortController|Gestione della memoria e AbortController]] come `src/ProfileDemo.jsx`. Contiene ProfilePanel, gia dotato di timeout, annullamento, guardia contro risposte obsolete e retry esplicito.

Sostituisci `src/App.jsx`:

```jsx
import { useId, useState } from "react";
import { ProfilePanel } from "./ProfileDemo.jsx";
import { getUser } from "./features/users/usersApi.js";

export default function ApiDemo() {
  const id = useId();
  const [userId, setUserId] = useState("a");
  return (
    <main>
      <h1>Utenti da API</h1>
      <label htmlFor={id}>Profilo</label>{" "}
      <select id={id} value={userId}
        onChange={(event) => setUserId(event.currentTarget.value)}>
        <option value="a">Ada</option>
        <option value="b">Grace</option>
        <option value="missing">Assente</option>
      </select>
      <ProfilePanel userId={userId} load={getUser} />
    </main>
  );
}
```

Il pannello mantiene il proprio stato UI ma riceve dati gia validati dal nuovo adapter. Senza servizio vedrai un errore, non dati fittizi. L'errore mostrato e intenzionalmente generico; un'app puo mappare ApiError.kind/status a messaggi appropriati e logging redatto, senza mostrare il body grezzo. Per refresh con dati precedenti conservati usa una policy cache, non una seconda copia casuale del risultato.

### Integrazione alternativa con una cache

Modulo opzionale `src/features/users/usersQuery.js`, per la baseline TanStack Query v5 della nota [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]:

```js
import { getUsers } from "./usersApi.js";

export const usersQueryOptions = {
  queryKey: ["public-users"],
  queryFn: ({ signal }) => getUsers({ signal }),
  retry: false,
};
```

Queste opzioni si passano a useQuery sotto un QueryClientProvider configurato; non sono da aggiungere all'effect del pannello precedente per la stessa lettura. Il signal della query arriva fino a Fetch. Per filtri o identita diverse includi nella chiave gli input che cambiano il risultato, senza token segreti. Invalidazione dopo scritture, refresh e logout appartengono all'orchestrazione dati, non al wrapper HTTP.

## Varianti

- **Fetch wrapper:** contratto piccolo e controllabile; non reimplementare una libreria HTTP completa senza necessita.
- **Axios, ky o altro client:** API e default propri da verificare; cambiare libreria non definisce schema o autorizzazioni.
- **Client generato da OpenAPI:** riduce lavoro ripetitivo, ma verifica validazione runtime, trattamento errori e rigenerazione.
- **API per feature/repository:** endpoint e mapping vicini al dominio; shared non deve importare le feature.
- **BFF o route del framework:** codice server distinto dal bundle client, utile anche per segreti server-side. Non elimina autenticazione, CSRF o controllo degli accessi.
- **SSR:** URL assolute e credenziali per richiesta richiedono un adapter dedicato. Non usare un singleton mutabile con il token dell'ultimo utente. Il demo con URL relative e destinato al browser.

## Errori comuni

- Chiamare response.json() su 204, HTML o un corpo gia consumato.
- Usare sempre Content-Type JSON, anche per GET o FormData.
- Sostituire ogni errore con [] oppure trattare JSON valido come schema valido.
- Perdere status, cause o motivo di abort dentro un errore generico.
- Inviare credenziali a qualunque origine, fare refresh ricorsivi o retry ciechi delle scritture.
- Nascondere navigazione, toast, cache e regole del prodotto nel trasporto.
- Confondere una risposta fallita con la certezza che il server non abbia scritto.

## Checklist

- Metodi, URL, payload, status e media type hanno contratti espliciti?
- Network, HTTP, protocollo, schema e annullamento rimangono distinguibili?
- Header e credenziali hanno una policy per origine e tipo di corpo?
- Input e risposte sono validati, con mapping e controllo dell'ID richiesto?
- Signal, lettura del corpo e cleanup funzionano anche su risposta lenta?
- Cache, retry e idempotenza hanno un proprietario separato dal trasporto?
- Test coprono successo, vuoto, 204, HTML, JSON/schema errati, rete e cancellazione?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]
- [[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]
- [[Programmazione/React/Pagine/Feature-based architecture|Feature-based architecture]]
- [[Programmazione/React/Pagine/Gestione della memoria e AbortController|Gestione della memoria e AbortController]]
- [[Programmazione/React/Pagine/CSRF|CSRF]]
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]

## Fonti

- [MDN: usare Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- [MDN: Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers).
- [MDN: lettura e parsing della risposta](https://developer.mozilla.org/en-US/docs/Web/API/Response/json).
- [MDN: AbortSignal e motivi di annullamento](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal).
- [MDN: credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials).
- [MDN: FormData e boundary](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects).
- [MDN: HTTP 204](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/204).
- [TanStack Query: cancellazione](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation).

Consultate il 2026-10-19; API Fetch/Headers/AbortSignal dei browser moderni. Contratto e policy del demo sono deliberatamente limitati, non una specifica universale per API REST.
