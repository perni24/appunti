---
date: 2026-07-28
area: Programmazione
topic: Strutture di Progetto
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - frontend
  - spa
  - vite
  - struttura-progetto
aliases:
  - Struttura frontend React
  - React SPA structure
prerequisites:
  - "[[Programmazione/React/Pagine/Componenti Funzionali vs Componenti a Classe]]"
  - "[[Programmazione/Clean Code/Pagine/Separazione delle responsabilita]]"
related:
  - "[[Programmazione/React/Pagine/Context API]]"
  - "[[Programmazione/React/Pagine/Custom Hooks]]"
  - "[[Programmazione/React/Pagine/API layer]]"
  - "[[Programmazione/React/Pagine/Data Fetching e Cache]]"
  - "[[Programmazione/React/Pagine/Linting e Formattazione]]"
  - "[[Programmazione/React/Pagine/Error Boundaries]]"
  - "[[Programmazione/Clean Code/Pagine/Organizzazione dei file]]"
  - "[[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]"
title: React - Frontend SPA a livelli
---

# React - Frontend SPA a livelli

## Sintesi

Questa struttura organizza una Single Page Application React costruita con Vite separando:

- componenti visivi riutilizzabili;
- pagine associate alle principali viste;
- stato condiviso e custom Hook;
- comunicazione con il backend;
- tipi dei dati;
- configurazione di build e analisi statica.

Il flusso principale e:

```text
pagina -> custom Hook -> Context -> API layer -> backend
   |
   `-> componenti visivi
```

La struttura e adatta a un frontend piccolo o medio con poche aree funzionali. Quando le funzionalita diventano numerose, una suddivisione per feature puo rendere piu vicini i file che cambiano insieme.

## Quando usarla

- Dashboard o pannello amministrativo.
- Frontend di un'applicazione CRUD.
- SPA che comunica con un backend HTTP.
- Progetto con stato condiviso semplice.
- Applicazione nella quale componenti, richieste e tipi devono rimanere separati.

Non e necessario creare tutte le directory in un prototipo minimo. Ogni cartella deve avere una responsabilita reale, non essere aggiunta soltanto in previsione di una crescita futura.

## Struttura delle directory

```text
frontend/
|-- public/
|-- src/
|   |-- components/
|   |   |-- layout/
|   |   |-- common/
|   |   `-- EntityCard.jsx
|   |-- context/
|   |   |-- AppProviders.jsx
|   |   |-- EntityContext.jsx
|   |   `-- useEntity.js
|   |-- pages/
|   |   |-- Home.jsx
|   |   `-- Entity.jsx
|   |-- types/
|   |   |-- apiResponses.ts
|   |   `-- entities.ts
|   |-- api/
|   |   |-- apiCore.ts
|   |   `-- entityApi.ts
|   |-- App.jsx
|   |-- index.css
|   `-- main.jsx
|-- eslint.config.js
|-- index.html
|-- package.json
|-- package-lock.json
|-- tsconfig.json
`-- vite.config.js
```

## Decisione iniziale: JavaScript o TypeScript

La struttura proposta mescola componenti `.jsx` e moduli `.ts`. Vite puo trasformare entrambi, ma questa scelta non fornisce automaticamente un controllo completo dei tipi nei componenti React.

L'albero mostra una **variante mista intenzionale**: i moduli API e i contratti sono TypeScript; pagine e Context restano JavaScript. Per controllare proprio i moduli tipizzati, il `tsconfig.json` della radice può essere:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src/api/**/*.ts", "src/types/**/*.ts"]
}
```

Con questa configurazione `tsc --noEmit` **non verifica il JSX**. Di seguito due alternative se vuoi usare un solo linguaggio.

### Progetto TypeScript

Rinominare i file che contengono JSX:

```text
App.jsx             -> App.tsx
main.jsx            -> main.tsx
EntityCard.jsx      -> EntityCard.tsx
AppProviders.jsx    -> AppProviders.tsx
EntityContext.jsx   -> EntityContext.tsx
Home.jsx            -> Home.tsx
Entity.jsx          -> Entity.tsx
useEntity.js        -> useEntity.ts
```

Aggiungere inoltre:

```text
tsconfig.json
src/vite-env.d.ts
```

Questa e la scelta piu lineare se `types/entities.ts` e `types/apiResponses.ts` sono parte importante del progetto.

Vite trasforma i file TypeScript, ma non esegue il type checking completo. Lo script di build deve quindi richiamare anche `tsc --noEmit` oppure `tsc -b`.

### Progetto JavaScript

Mantenere `.jsx` e `.js`, eliminando i file TypeScript oppure usandone i tipi tramite JSDoc e una configurazione che controlli anche JavaScript.

Esempio:

```javascript
/** @typedef {import("../types/entities").Entity} Entity */

/** @param {Entity} entity */
export function formatEntity(entity) {
  return entity.name.trim()
}
```

Mescolare le estensioni senza una strategia esplicita puo dare l'impressione di avere controlli statici che in realta non coprono l'intera applicazione.

Gli esempi successivi usano la variante mista. Per la conversione completa a TSX aggiorna anche gli import, il riferimento in `index.html` e la configurazione del compilatore (inclusione di tutta `src`, JSX React e tipi React).

## Flusso di avvio

```text
index.html
    |
    v
src/main.jsx
    |
    v
context/AppProviders.jsx
    |
    v
src/App.jsx
    |
    v
pages/*
    |
    +--> components/*
    |
    `--> context/useEntity.js
              |
              v
       context/EntityContext.jsx
              |
              v
         api/entityApi.ts
              |
              v
          api/apiCore.ts
              |
              v
            Backend
```

## Responsabilita delle directory

### `public/`

Contiene file serviti senza essere importati dal codice sorgente e senza passare attraverso la pipeline di trasformazione di Vite.

Esempi:

- `favicon.ico`;
- `robots.txt`;
- manifest;
- file che devono conservare esattamente il proprio nome.

Le immagini, i font e gli altri asset usati dai componenti dovrebbero normalmente essere importati da `src/assets/`, cosi Vite puo elaborarli e assegnare nomi adatti alla cache.

Non bisogna duplicare `index.html` dentro `public/`: in Vite il file si trova nella radice del progetto.

### `src/components/layout/`

Contiene i componenti che definiscono la struttura visiva comune:

- header;
- navigazione;
- sidebar;
- footer;
- contenitore principale;
- layout autenticato.

Un layout riceve il contenuto tramite `children` o tramite il sistema di routing. Non dovrebbe caricare dati specifici di una singola entita. Il frammento è una variante: `Header` va definito e importato se aggiungi questo layout; la Home dell'esempio non lo usa.

```jsx
export function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Header />
      <main>{children}</main>
    </div>
  )
}
```

### `src/components/common/`

Contiene componenti generici riutilizzati in piu aree:

- `Button`;
- `Modal`;
- `Spinner`;
- `EmptyState`;
- `ErrorMessage`;
- controlli di form.

Un componente realmente generico non deve importare pagine, Context specifici o endpoint API.

Se un componente viene usato soltanto dalla funzionalita `Entity`, puo essere piu chiaro tenerlo vicino a quella funzionalita anziche inserirlo prematuramente in `common`.

### `src/components/EntityCard.jsx`

Rappresenta una singola entita. Idealmente e un componente presentazionale:

```jsx
export function EntityCard({ entity, onSelect }) {
  return (
    <article>
      <h2>{entity.name}</h2>
      <button type="button" onClick={() => onSelect(entity.id)}>
        Apri
      </button>
    </article>
  )
}
```

Riceve dati e callback tramite props. Non deve conoscere l'URL del backend o eseguire direttamente `fetch`.

### `src/pages/`

Contiene i componenti associati alle viste principali.

Una pagina:

- legge parametri di navigazione;
- usa Hook o servizi per ottenere i dati;
- gestisce gli stati di caricamento, errore e contenuto vuoto;
- compone componenti di layout e di dominio.

```jsx
import { useState } from "react"
import { EntityCard } from "../components/EntityCard"
import { useEntity } from "../context/useEntity"


export default function Home() {
  const { entities, loading, error, refresh } = useEntity()
  const [selectedId, setSelectedId] = useState(null)
  const selectedEntity = entities.find((entity) => entity.id === selectedId)

  return (
    <section>
      <button type="button" onClick={refresh} disabled={loading}>
        Aggiorna
      </button>

      {loading && <p role="status">Caricamento...</p>}
      {error && <p role="alert">{error.message}</p>}
      {!loading && !error && entities.length === 0 && (
        <p>Nessuna entita disponibile.</p>
      )}

      {selectedEntity ? (
        <article>
          <h2>{selectedEntity.name}</h2>
          <p>ID: {selectedEntity.id}</p>
          <button type="button" onClick={() => setSelectedId(null)}>
            Torna all'elenco
          </button>
        </article>
      ) : entities.map((entity) => (
        <EntityCard key={entity.id} entity={entity} onSelect={setSelectedId} />
      ))}
    </section>
  )
}
```

La directory `pages` non implementa automaticamente il routing. Per associare URL e pagine serve un router o una strategia di navigazione esplicita.

Qui `Apri` seleziona un dettaglio locale senza cambiare URL; un router puo sostituire questa selezione con la navigazione a `pages/Entity.jsx`. Il pulsante `Aggiorna` resta disponibile anche dopo un errore o una risposta vuota. Durante il refresh si conservano gli ultimi dati ricevuti.

### `src/context/AppProviders.jsx`

Compone i provider globali in un solo punto:

```jsx
import { EntityProvider } from "./EntityContext"


export function AppProviders({ children }) {
  return (
    <EntityProvider>
      {children}
    </EntityProvider>
  )
}
```

Con la crescita dell'applicazione puo includere provider per autenticazione, tema, lingua o cache delle richieste.

L'ordine puo essere importante: un provider puo usare soltanto quelli che lo avvolgono.

### `src/context/EntityContext.jsx`

Espone stato e operazioni condivise relative alle entita:

```jsx
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { getEntities } from "../api/entityApi"


export const EntityContext = createContext(null)


export function EntityProvider({ children }) {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const activeRequest = useRef(null)

  const refresh = useCallback(async () => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setLoading(true)
    setError(null)

    try {
      const data = await getEntities(controller.signal)
      if (!controller.signal.aborted) setEntities(data)
    } catch (requestError) {
      if (!controller.signal.aborted) {
        setError(requestError instanceof Error
          ? requestError
          : new Error("Caricamento non riuscito"))
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    return () => activeRequest.current?.abort()
  }, [refresh])

  const value = useMemo(
    () => ({ entities, loading, error, refresh }),
    [entities, loading, error, refresh],
  )

  return (
    <EntityContext.Provider value={value}>
      {children}
    </EntityContext.Provider>
  )
}
```

Context e utile quando dati e operazioni servono a componenti distanti. Non deve essere usato automaticamente per ogni stato: uno stato locale alla pagina dovrebbe rimanere nella pagina.

L'effetto avvia il primo caricamento. Il cleanup annulla la richiesta all'unmount, e ogni refresh annulla quella precedente. I controlli sul segnale impediscono a una risposta obsoleta di sovrascrivere dati o stato di caricamento, anche nel ciclo aggiuntivo di setup/cleanup di `StrictMode` in sviluppo. `getEntities` inoltra il segnale al livello HTTP mostrato sotto.

Context inoltre non offre da solo deduplicazione, invalidazione, retry o cache persistente dei dati remoti. Per server state complesso puo essere piu adatta una libreria dedicata al data fetching.

### `src/context/useEntity.js`

Nasconde l'accesso diretto al Context e produce un errore chiaro quando manca il provider:

```jsx
import { useContext } from "react"

import { EntityContext } from "./EntityContext"


export function useEntity() {
  const context = useContext(EntityContext)

  if (context === null) {
    throw new Error("useEntity must be used within EntityProvider")
  }

  return context
}
```

Il prefisso `use` e necessario per un custom Hook. Il file dovrebbe esportare logica React, non funzioni API generiche.

### `src/types/entities.ts`

Definisce i tipi del dominio usati dal frontend:

```typescript
export interface Entity {
  id: number
  name: string
}

export interface CreateEntityInput {
  name: string
}
```

Questi tipi descrivono cio che il frontend si aspetta, ma non validano i dati ricevuti a runtime. Una risposta HTTP puo comunque essere malformata: per dati non affidabili serve una validazione runtime.

### `src/types/apiResponses.ts`

Contiene i contratti trasversali delle risposte:

```typescript
export interface ApiErrorBody {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  total: number
}
```

Questi due wrapper sono opzionali, **non** il formato del backend Python collegato: quello restituisce direttamente un array per la lista, un oggetto per il dettaglio o la creazione e `detail` per gli errori FastAPI.

### `src/api/apiCore.ts`

Centralizza il comportamento comune delle richieste:

- URL base;
- header;
- serializzazione JSON;
- gestione degli status non riusciti;
- parsing delle risposte;
- supporto ad `AbortSignal`;
- eventuale autenticazione.

```typescript
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "")


export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
  }
}


export async function apiRequest(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const headers = new Headers(options.headers)
  if (!headers.has("Accept")) headers.set("Accept", "application/json")
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    throw new Error("L'endpoint JSON ha restituito una risposta vuota")
  }

  return response.json()
}
```

`apiRequest` serve endpoint che promettono JSON: uno status non riuscito conserva il codice in `ApiError.status`; un `204` non diventa un'entità fittizia. Per operazioni senza body usa un helper separato che restituisca `Promise<void>`. La forma del JSON si verifica nel modulo che conosce la risorsa.

Le variabili con prefisso `VITE_` vengono incluse nel bundle client. Non devono contenere password, token privati o altri segreti.

### `src/api/entityApi.ts`

Descrive gli endpoint della risorsa senza gestire lo stato React:

```typescript
import type { CreateEntityInput, Entity } from "../types/entities"
import { apiRequest } from "./apiCore"


function readEntity(value: unknown): Entity {
  if (typeof value !== "object" || value === null ||
      !("id" in value) || typeof value.id !== "number" || !Number.isSafeInteger(value.id) ||
      !("name" in value) || typeof value.name !== "string") {
    throw new Error("Risposta API: entità non valida")
  }
  return { id: value.id, name: value.name }
}

export async function getEntities(signal?: AbortSignal): Promise<Entity[]> {
  const data = await apiRequest("/entities", { signal })
  if (!Array.isArray(data)) throw new Error("Risposta API: elenco atteso")
  return data.map(readEntity)
}


export async function getEntity(
  entityId: number,
  signal?: AbortSignal,
): Promise<Entity> {
  return readEntity(await apiRequest(`/entities/${entityId}`, { signal }))
}


export async function createEntity(input: CreateEntityInput): Promise<Entity> {
  return readEntity(await apiRequest("/entities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  }))
}
```

Questo modulo non mostra notifiche né modifica il Context. Con il [[Programmazione/Strutture di Progetto/Pagine/Python - Backend API a livelli|backend Python di esempio]], `getEntities()` chiama `GET /api/entities` e riceve un array; `createEntity({name: "Example"})` riceve l'entità completa con status 201, non soltanto l'ID. Un duplicato arriva come `ApiError` con status 409.

### `src/App.jsx`

Definisce la composizione delle pagine e, se presente, il routing:

```jsx
import Home from "./pages/Home"


export default function App() {
  return <Home />
}
```

Quando viene aggiunto un router, `App` puo contenere la tabella delle rotte e il layout principale. Le regole di business e le chiamate HTTP devono restare fuori da questo file.

### `src/main.jsx`

E il punto di ingresso del codice React:

```jsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App"
import { AppProviders } from "./context/AppProviders"
import "./index.css"


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
```

In sviluppo `StrictMode` puo rieseguire alcune operazioni per rilevare effetti privi di cleanup. Il codice di caricamento deve quindi gestire correttamente annullamento e risposte obsolete.

### `src/index.css`

Contiene stili globali realmente trasversali:

- reset o normalizzazione;
- variabili CSS;
- tipografia;
- stile di `body` e dell'elemento root;
- utility globali essenziali.

Gli stili specifici di un componente possono stare accanto al componente tramite CSS Modules o nella soluzione di styling scelta dal progetto.

### `index.html`

E l'entry point HTML di Vite:

```html
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
```

Deve contenere metadati, elemento root e riferimenti iniziali. Non deve duplicare l'interfaccia gestita da React.

### `eslint.config.js`

Configura l'analisi statica:

- regole JavaScript o TypeScript;
- regole React;
- Hooks;
- eventuali convenzioni sugli import;
- directory generate da ignorare.

Il lint deve essere eseguibile in locale e nella CI:

```bash
npm run lint
```

Il lint non sostituisce il type checking o i test.

### `vite.config.js`

Configura Vite e i plugin necessari:

```javascript
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"


export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://127.0.0.1:8000" } },
})
```

Il proxy qui serve **solo in sviluppo**: la richiesta del browser a Vite su `/api/entities` arriva a FastAPI con lo stesso percorso. In produzione configura il reverse proxy dell'host o imposta `VITE_API_BASE_URL` all'URL pubblico dell'API **prima della build**. Se l'origine è diversa, configura CORS anche sul backend: il proxy di sviluppo non viene distribuito con i file statici.

### `package.json`

Descrive dipendenze e comandi del progetto. Questo è il frammento degli script, non un manifest installabile da solo: servono `react` e `react-dom`, più Vite, il plugin React, TypeScript ed ESLint (con i plugin usati dalla configurazione) tra le dipendenze di sviluppo.

```json
{
  "scripts": {
    "dev": "vite",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview"
  }
}
```

Per JavaScript puro lo script `typecheck` puo essere omesso, a meno che il progetto non usi il controllo JavaScript tramite TypeScript.

### `package-lock.json`

Registra le versioni risolte delle dipendenze e deve essere versionato insieme a `package.json`.

In CI e preferibile:

```bash
npm ci
```

Questo comando installa in base al lockfile e fallisce quando non e coerente con `package.json`.

## Regole delle dipendenze

```text
main -> AppProviders e App
App -> pages e layout
pages -> components e custom Hook
custom Hook -> Context
Context -> API layer
entityApi -> apiCore e types
components/common -> nessuna pagina o API specifica
```

Da evitare:

```text
api -> context
api -> components
components/common -> pages
types -> componenti React
EntityCard -> chiamate fetch dirette
```

Le dipendenze circolari sono spesso il sintomo di responsabilita sovrapposte.

## Gestione del caricamento dei dati

Ogni operazione asincrona dovrebbe rappresentare almeno:

- stato iniziale;
- caricamento;
- successo con dati;
- successo senza dati;
- errore;
- eventuale aggiornamento.

Quando una richiesta dipende da un parametro o da una pagina, bisogna impedire che una risposta precedente sovrascriva dati piu recenti. Le strategie comuni sono:

- annullare la richiesta con `AbortController`;
- ignorare risposte diventate obsolete;
- usare una libreria di cache che gestisca concorrenza e deduplicazione.

Non bisogna usare un Effect per derivare dati che possono essere calcolati direttamente durante il rendering.

## Routing

La presenza di `pages/Home.jsx` e `pages/Entity.jsx` suggerisce almeno due route:

```text
/              -> Home
/entities/:id  -> Entity
```

Il router dovrebbe:

- leggere i parametri dell'URL;
- gestire navigazione e pagina non trovata;
- supportare route protette quando necessario;
- mantenere gli URL condivisibili;
- separare il caricamento di pagine pesanti quando utile.

Il nome `pages` non crea automaticamente questa associazione in un progetto Vite React: le route devono essere configurate esplicitamente.

## Sicurezza

- Il frontend non puo custodire segreti: tutto cio che raggiunge il browser e ispezionabile.
- Il backend deve ripetere validazione e autorizzazione.
- Non renderizzare HTML non affidabile senza sanitizzazione.
- Non mostrare stack trace o dettagli interni delle API.
- Gestire token e cookie secondo il modello di autenticazione scelto.
- Non considerare CORS un sistema di autenticazione.
- Codificare correttamente dati inseriti in URL e query string.
- Limitare nei log client dati personali e credenziali.

## Test mancanti nella struttura iniziale

L'albero proposto non include test automatici. Una possibile aggiunta e:

```text
src/
|-- components/
|   `-- EntityCard.test.jsx
|-- context/
|   `-- EntityContext.test.jsx
`-- api/
    `-- entityApi.test.ts
tests/
`-- e2e/
    `-- entity-flow.spec.ts
```

- Test di componente: rendering e interazioni.
- Test del Context: stati di caricamento, successo ed errore.
- Test API layer: URL, metodo, payload e gestione degli status.
- Test end-to-end: flusso reale dal browser.

I test dovrebbero verificare il comportamento osservabile, non i dettagli interni dei componenti.

## Evoluzione per feature

Quando aumentano entita e pagine, la struttura per livello puo produrre directory molto grandi:

```text
components/
context/
pages/
api/
types/
```

Una possibile evoluzione e:

```text
src/
|-- app/
|   |-- App.jsx
|   `-- AppProviders.jsx
|-- features/
|   `-- entities/
|       |-- api/
|       |-- components/
|       |-- hooks/
|       |-- pages/
|       `-- types.ts
|-- components/
|   |-- layout/
|   `-- common/
`-- main.jsx
```

In questo modello i file specifici di `Entity` rimangono vicini. `components/common` conserva soltanto elementi realmente condivisi da piu feature.

## Errori comuni

- Usare Context per ogni stato locale.
- Eseguire `fetch` direttamente in molti componenti.
- Considerare i tipi TypeScript una validazione runtime.
- Inserire segreti nelle variabili `VITE_*`.
- Dimenticare stati di errore, vuoto e caricamento.
- Ignorare richieste concorrenti o risposte obsolete.
- Inserire componenti specifici troppo presto in `common`.
- Far dipendere il livello API da React.
- Mescolare `.jsx` e `.ts` senza una strategia di type checking.
- Affidarsi alla sola build Vite per controllare TypeScript.
- Non distinguere asset importati da file statici di `public`.
- Aggiungere memoizzazione senza aver misurato un problema.

## Checklist

- [ ] È esplicito quali file sono controllati da TypeScript, anche nel progetto misto JSX/TS.
- [ ] Se usa TypeScript, il comando di build esegue anche il type checking.
- [ ] `main` contiene soltanto il bootstrap dell'applicazione.
- [ ] Le pagine compongono componenti e gestiscono gli stati della vista.
- [ ] I componenti presentazionali non eseguono richieste HTTP.
- [ ] Il Context viene usato soltanto per stato realmente condiviso.
- [ ] Il custom Hook segnala l'assenza del provider.
- [ ] L'API layer controlla gli status HTTP e supporta l'annullamento.
- [ ] Le risposte critiche vengono validate anche a runtime.
- [ ] Le variabili `VITE_*` non contengono segreti.
- [ ] Routing e pagina non trovata sono configurati esplicitamente.
- [ ] Sono presenti test proporzionati ai flussi piu importanti.
- [ ] ESLint, type checking, test e build vengono eseguiti in CI.
- [ ] `package-lock.json` e versionato.

## Riferimenti

- [React - Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [React - Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React - Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [Vite - Static Asset Handling](https://vite.dev/guide/assets.html)
- [Vite - Env Variables and Modes](https://vite.dev/guide/env-and-mode)
- [Vite - TypeScript](https://vite.dev/guide/features#typescript)
- [TypeScript - JSX](https://www.typescriptlang.org/docs/handbook/jsx.html)

## Collegamenti

- [[Programmazione/Strutture di Progetto/Pagine/Python - Backend API a livelli|Python - Backend API a livelli]]
- [[Programmazione/React/Pagine/Context API|Context API]]
- [[Programmazione/React/Pagine/Custom Hooks|Custom Hooks]]
- [[Programmazione/React/Pagine/API layer|API layer]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Linting e Formattazione|Linting e Formattazione]]
- [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]
- [[Programmazione/Clean Code/Pagine/Organizzazione dei file|Organizzazione dei file]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]


## Navigazione

- [[Programmazione/Strutture di Progetto/Indice Strutture di Progetto|Indice Strutture di Progetto]]
