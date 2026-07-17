---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, data-fetching, cache, frontend]
aliases: [Data Fetching, Cache React, TanStack Query, Optimistic updates]
prerequisites: []
related: []
---

# Data Fetching e Cache

## Sintesi

Il data fetching in React riguarda il caricamento di dati remoti e la gestione di loading, error, cache, refetch, invalidazione e aggiornamenti ottimistici.

Per applicazioni reali, una libreria come TanStack Query spesso e piu adatta di fetch manuali dentro `useEffect`.

## Quando usarlo

Usa data fetching quando la UI dipende da API, backend, database o servizi esterni. Usa una cache dedicata quando gli stessi dati sono letti da piu componenti, devono essere invalidati o devono gestire retry e refetch.

## Come funziona

Fetch manuale:

```jsx
useEffect(() => {
  let active = true;

  async function loadUsers() {
    setStatus("loading");
    const response = await fetch("/api/users");
    const data = await response.json();
    if (active) {
      setUsers(data);
      setStatus("success");
    }
  }

  loadUsers();

  return () => {
    active = false;
  };
}, []);
```

Funziona, ma devi gestire manualmente molti casi.

## API / Sintassi

Con TanStack Query:

```jsx
const query = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});

if (query.isLoading) return <Spinner />;
if (query.error) return <ErrorView error={query.error} />;

return <UserList users={query.data} />;
```

Mutazione:

```jsx
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
});
```

## Esempio pratico

```jsx
function UsersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Errore caricamento utenti");
      return response.json();
    },
  });

  if (isLoading) return <p>Caricamento...</p>;
  if (error) return <p>Errore</p>;

  return <UserList users={data} />;
}
```

## Varianti

- **Fetch in effect**: adatto a casi piccoli.
- **TanStack Query**: cache server, retry, invalidazione, refetch.
- **SWR**: stale-while-revalidate.
- **Framework loaders**: Next.js o Remix caricano dati a livello route/server.
- **Optimistic updates**: aggiorni UI prima della conferma server.
- **AbortController**: cancella richieste obsolete.

## Errori comuni

- Non gestire loading, error e empty state.
- Fare fetch senza cancellazione o guardia contro race condition.
- Salvare dati server in store client globale.
- Non invalidare cache dopo mutazioni.
- Usare chiavi cache instabili.
- Duplicare la stessa richiesta in componenti diversi.

## Checklist

- I dati sono server state o client state?
- Loading, error e empty state sono espliciti?
- La cache ha chiavi stabili?
- Le mutazioni invalidano dati collegati?
- Ci sono race condition?
- Serve una libreria dedicata?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[useEffect]]
- [[Gestione della memoria e AbortController]]
- [[API layer]]
- [[State Management Esterno]]
