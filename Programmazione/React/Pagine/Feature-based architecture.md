---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
difficulty: intermediate
tags: [react, architecture, frontend]
aliases: [Feature-based architecture, Architettura per feature]
prerequisites: []
related: []
---

# Feature-based architecture

## Sintesi

La feature-based architecture organizza il codice per funzionalita di prodotto invece che solo per tipo tecnico. In un'app React reale, questo aiuta a mantenere vicini componenti, hook, API, test e logica di una stessa area.

## Quando usarlo

Usala quando l'app cresce oltre pochi componenti e inizia ad avere domini come utenti, ordini, pagamenti, impostazioni o report.

## Come funziona

```text
src/
  features/
    users/
      components/
      hooks/
      api/
      pages/
      tests/
    orders/
      components/
      api/
  shared/
    ui/
    lib/
```

Ogni feature contiene cio che e specifico di quel dominio.

## API / Sintassi

Import consigliato:

```jsx
import { UserList } from "@/features/users/components/UserList";
import { Button } from "@/shared/ui/Button";
```

Separazione:

- `features/`: codice di dominio;
- `shared/`: componenti e utility riusabili;
- `app/`: bootstrap, routing, provider;
- `pages/` o route: entry point visuali.

## Esempio pratico

La feature `users` puo contenere:

```text
users/
  api/getUsers.ts
  components/UserTable.tsx
  hooks/useUsers.ts
  pages/UsersPage.tsx
```

La pagina importa il hook della feature, non dettagli del backend sparsi.

## Varianti

- **Layer-based**: components, hooks, services globali.
- **Feature-based**: codice raggruppato per dominio.
- **Hybrid**: feature per dominio, shared per UI comune.
- **Vertical slice**: ogni feature e quasi autonoma.
- **Monorepo packages**: feature o shared estratti in package.

## Errori comuni

- Creare cartelle feature troppo presto.
- Mettere tutto in `shared`.
- Duplicare componenti simili senza criterio.
- Rendere feature troppo accoppiate tra loro.
- Non definire regole di import.

## Checklist

- Le feature hanno confini di dominio chiari?
- `shared` contiene solo codice davvero comune?
- Gli import tra feature sono controllati?
- API, hook e componenti di una feature sono vicini?
- La struttura aiuta o aggiunge burocrazia?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[API layer]]
- [[Design system]]
- [[State colocato]]
- [[Linting e Formattazione]]
