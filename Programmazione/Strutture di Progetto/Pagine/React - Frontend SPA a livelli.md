---
date: 2026-07-28
area: Programmazione
topic: Strutture di Progetto
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [react, frontend, spa, vite, struttura-progetto]
aliases: [Struttura frontend React, React SPA structure]
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
`-- vite.config.js
```

## Decisione iniziale: JavaScript o TypeScript

La struttura proposta mescola componenti `.jsx` e moduli `.ts`. Vite puo trasformare entrambi, ma questa scelta non fornisce automaticamente un controllo completo dei tipi nei componenti React.

Sono possibili due strategie coerenti.

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

Gli esempi successivi mantengono i nomi originali, ma il progetto reale dovrebbe scegliere una delle due varianti.

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

Un layout riceve il contenuto tramite `children` o tramite il sistema di routing. Non dovrebbe caricare dati specifici di una singola entita.

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
import { EntityCard } from "../components/EntityCard"
import { useEntity } from "../context/useEntity"


export default function Home() {
  const { entities, loading, error, refresh } = useEntity()

  if (loading) return <p>Caricamento...</p>
  if (error) return <p role="alert">{error.message}</p>
  if (entities.length === 0) return <p>Nessuna entita disponibile.</p>

  return (
    <section>
      <button type="button" onClick={refresh}>
        Aggiorna
      </button>

      {entities.map((entity) => (
        <EntityCard key={entity.id} entity={entity} />
      ))}
    </section>
  )
}
```

La directory `pages` non implementa automaticamente il routing. Per associare URL e pagine serve un router o una strategia di navigazione esplicita.

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
  useMemo,
  useState,
} from "react"

import { getEntities } from "../api/entityApi"


export const EntityContext = createContext(null)


export function EntityProvider({ children }) {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setEntities(await getEntities())
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }, [])

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

Non e necessario avvolgere ogni risposta in un tipo generico se il backend non usa realmente quel formato.

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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL


export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
  }
}


export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
```

Il cast del JSON non valida la risposta. Quando il contratto e critico, il risultato deve essere controllato con uno schema runtime prima di essere restituito.

Le variabili con prefisso `VITE_` vengono incluse nel bundle client. Non devono contenere password, token privati o altri segreti.

### `src/api/entityApi.ts`

Descrive gli endpoint della risorsa senza gestire lo stato React:

```typescript
import type { CreateEntityInput, Entity } from "../types/entities"
import { apiRequest } from "./apiCore"


export function getEntities(signal?: AbortSignal): Promise<Entity[]> {
  return apiRequest<Entity[]>("/entities", { signal })
}


export function getEntity(
  entityId: number,
  signal?: AbortSignal,
): Promise<Entity> {
  return apiRequest<Entity>(`/entities/${entityId}`, { signal })
}


export function createEntity(input: CreateEntityInput): Promise<Entity> {
  return apiRequest<Entity>("/entities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })
}
```

Questo modulo non deve mostrare notifiche, cambiare pagina o modificare direttamente un Context.

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
})
```

Configurazioni come proxy API, alias e percorso base devono essere aggiunte soltanto quando richieste dal deployment.

### `package.json`

Descrive dipendenze e comandi del progetto. Per una variante TypeScript:

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

- [ ] Il progetto usa coerentemente JavaScript oppure TypeScript.
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

- [[Programmazione/Strutture di Progetto/Pagine/Python - Backend API a livelli]]
- [[Programmazione/React/Pagine/Context API]]
- [[Programmazione/React/Pagine/Custom Hooks]]
- [[Programmazione/React/Pagine/API layer]]
- [[Programmazione/React/Pagine/Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Linting e Formattazione]]
- [[Programmazione/React/Pagine/Error Boundaries]]
- [[Programmazione/Clean Code/Pagine/Organizzazione dei file]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]
