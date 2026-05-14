---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Data Fetching e Cache]
prerequisites: []
related: []
---
# Data Fetching e Cache

## Sintesi

Nota su Data Fetching e Cache in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

Per **data fetching** si intende il recupero di dati da API o servizi esterni. In React questo problema non riguarda solo la chiamata HTTP, ma anche tutto cio che viene dopo:
- stato di caricamento;
- gestione errori;
- caching;
- retry;
- sincronizzazione tra schermate;
- invalidazione dei dati obsoleti.

Per questo, nelle applicazioni reali, il data fetching e spesso trattato come un problema architetturale separato dal semplice uso di `fetch`.

> [!INFO] Punto chiave
> Recuperare dati dal server non significa solo "fare una request". Significa decidere quanto a lungo i dati restano validi, quando rifare il fetch e come evitare richieste duplicate o risultati incoerenti.

---

## 1. Approccio base con useEffect

Il modo piu diretto per fare fetch in React e usare [[Programmazione/React/Pagine/useEffect]].

```javascript
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch("/api/users");

        if (!response.ok) {
          throw new Error("Request failed");
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error</p>;

  return <UserTable users={users} />;
}
```

Questo approccio funziona, ma scala male quando aumentano esigenze come:
- refetch automatici;
- cache condivisa;
- retry;
- sincronizzazione tra componenti;
- invalidazione selettiva;
- deduplicazione delle richieste.

---

## 2. I limiti del fetch manuale

Con `useEffect` il codice tende rapidamente a ripetersi:
- `loading`;
- `error`;
- `data`;
- cleanup;
- race condition;
- logica di refetch;
- gestione della cache.

Inoltre, due componenti che fanno la stessa richiesta possono:
- duplicare il traffico;
- mantenere stati separati;
- non sapere quando i dati dell'altro sono gia aggiornati.

Questo e uno dei motivi per cui il data fetching non viene trattato come semplice side effect generico, ma come categoria specifica.

Si collega direttamente a [[Programmazione/React/Pagine/Gestione della memoria e AbortController]] quando la richiesta dipende dal ciclo di vita del componente.

---

## 3. Perche la cache e importante

La **cache** conserva risultati gia ottenuti in precedenza, cosi da evitare richieste inutili e migliorare la reattivita percepita.

Una buona cache puo:
- riusare dati gia scaricati;
- ridurre richieste duplicate;
- mostrare subito dati recenti;
- rifare il fetch in background;
- mantenere la UI piu fluida.

Ma la cache introduce anche una domanda fondamentale:

**Quando un dato e ancora valido?**

Qui entrano in gioco concetti come:
- fresh data;
- stale data;
- invalidazione;
- refetch on focus;
- refetch on reconnect.

---

## 4. TanStack Query

**TanStack Query**, storicamente noto come **React Query**, e una libreria specializzata per il recupero, caching e sincronizzazione del **server state**.

Non e uno state manager generale come Redux o Zustand. Il suo obiettivo e gestire bene dati remoti.

Esempio concettuale:

```javascript
import { useQuery } from "@tanstack/react-query";

function UserList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");

      if (!response.ok) {
        throw new Error("Request failed");
      }

      return response.json();
    }
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error</p>;

  return <UserTable users={data} />;
}
```

Con questo approccio:
- la query ha una identita;
- i dati vengono messi in cache;
- il refetch puo essere gestito automaticamente;
- lo stato della richiesta e standardizzato.

---

## 5. Query Key

La `queryKey` identifica in modo univoco una query nella cache.

Esempi:

```javascript
["users"]
["user", userId]
["products", { category, page }]
```

La query key e importante perche permette a TanStack Query di capire:
- quali dati appartengono alla stessa risorsa;
- quando puo riusare la cache;
- quali query invalidare dopo una mutation.

Se la chiave e progettata male, la cache diventa meno affidabile.

---

## 6. Fresh, stale e refetch

Uno dei concetti centrali di TanStack Query e la distinzione tra dati:
- **fresh**: considerati ancora validi;
- **stale**: presenti in cache ma candidati a un aggiornamento.

Questo comportamento si controlla con opzioni come `staleTime`.

```javascript
useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  staleTime: 60_000
});
```

Qui i dati restano considerati fresh per 60 secondi.

Vantaggio pratico:
- la UI puo mostrare subito dati gia disponibili;
- la libreria decide in modo piu intelligente quando rifare il fetch.

---

## 7. Mutations e invalidazione

Leggere dati e solo una parte del problema. L'altra e scrivere dati:
- creare;
- aggiornare;
- eliminare.

In TanStack Query si usano spesso le **mutations** per operazioni di scrittura, e poi si invalida la cache interessata.

Esempio concettuale:

```javascript
queryClient.invalidateQueries({ queryKey: ["users"] });
```

Questo segnala che i dati relativi a `users` non sono piu affidabili e vanno riallineati.

E un approccio piu solido rispetto a tentare di sincronizzare manualmente ogni pezzo di stato locale.

---

## 8. Server state vs client state

Uno dei punti piu importanti e distinguere:

### Client state
Stato interno all'interfaccia:
- modal aperta;
- tab attivo;
- sidebar;
- input locale;
- preferenze UI temporanee.

### Server state
Dati che arrivano da un backend:
- utenti;
- ordini;
- prodotti;
- risultati di ricerca;
- risorse condivise tra piu viste.

Il server state ha caratteristiche diverse:
- puo diventare obsoleto;
- puo essere condiviso;
- puo essere refetchato;
- richiede caching e invalidazione.

Per questo spesso va gestito con strumenti diversi rispetto a [[Programmazione/React/Pagine/State Management Esterno]].

---

## 9. Quando usare fetch manuale e quando TanStack Query

### Fetch manuale va bene quando
- il caso e semplice;
- la richiesta e locale a un solo componente;
- non ti serve cache condivisa;
- il costo della libreria non e giustificato.

### TanStack Query conviene quando
- piu componenti leggono gli stessi dati;
- vuoi caching e refetch automatico;
- servono retry e invalidazione;
- il progetto cresce;
- vuoi distinguere bene server state e client state.

La differenza non e solo di comodita: e di modello architetturale.

---

## 10. Relazione con React Router e useEffect

Il data fetching si collega spesso a:
- [[Programmazione/React/Pagine/React Router]] quando i dati dipendono da route params o query string;
- [[Programmazione/React/Pagine/useEffect]] se fai fetch manuale;
- [[Programmazione/React/Pagine/Gestione della memoria e AbortController]] per cleanup e cancellazione;
- gestione dell'UX tramite loading, error, empty state e refresh.

La route decide *quale vista* mostrare. Il layer di data fetching decide *come ottenere e mantenere sincronizzati i dati* di quella vista.

---

## 11. Best Practices

1. **Distingui sempre client state e server state:** non trattarli come lo stesso problema.
2. **Non duplicare a mano la stessa logica di fetch in piu componenti:** se il dato e condiviso, serve una strategia comune.
3. **Usa query key stabili e significative:** sono la base del caching corretto.
4. **Non abusare del fetch in `useEffect` quando l'app cresce:** il codice diventa rapidamente ripetitivo e fragile.
5. **Pensa a invalidazione e freschezza del dato fin dall'inizio:** la cache senza regole chiare genera inconsistenze.
6. **Gestisci bene loading, error ed empty state:** fanno parte del data fetching quanto la request stessa.

---
