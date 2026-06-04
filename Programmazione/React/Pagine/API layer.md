---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, api, architecture, frontend]
aliases: [API layer, Client API]
prerequisites: []
related: []
---

# API layer

## Sintesi

L'API layer separa la UI dalle chiamate HTTP e dai dettagli del backend. Invece di chiamare `fetch` ovunque nei componenti, centralizzi client, endpoint, gestione errori, trasformazioni e validazione.

## Quando usarlo

Usalo quando l'app chiama piu endpoint, deve gestire token, errori, base URL, retry, mapping DTO o validazione runtime. Per demo minime puo bastare un fetch locale, ma nei progetti reali l'API layer riduce duplicazione.

## Come funziona

```jsx
async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error("API error");
  }

  return response.json();
}
```

## API / Sintassi

Funzioni per dominio:

```jsx
export function getUsers() {
  return request("/users");
}

export function createUser(data) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

Uso con cache:

```jsx
const query = useQuery({
  queryKey: ["users"],
  queryFn: getUsers,
});
```

## Esempio pratico

```jsx
export async function getUser(userId) {
  const data = await request(`/users/${userId}`);
  return UserSchema.parse(data);
}
```

Il componente riceve un oggetto gia validato, non una risposta HTTP grezza.

## Varianti

- **Fetch wrapper**: leggero e interno.
- **Client HTTP dedicato**: Axios, ky o fetch esteso.
- **Generated client**: da OpenAPI.
- **API per feature**: endpoint vicini al dominio.
- **Repository frontend**: separa chiamate, mapping e validazione.
- **BFF/framework route**: il frontend chiama route interne del framework.

## Errori comuni

- Chiamare endpoint direttamente in ogni componente.
- Non centralizzare errori e token.
- Non validare payload ricevuti.
- Mescolare DTO backend e modello UI senza mapping.
- Nascondere troppa logica applicativa nell'API layer.
- Non distinguere cache server e stato client.

## Checklist

- Esiste un client centralizzato?
- Gli errori sono normalizzati?
- I dati ricevuti sono validati?
- Token e header sono gestiti in un solo punto?
- Le funzioni API sono organizzate per dominio?
- Il layer resta indipendente dalla UI?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Data Fetching e Cache]]
- [[Validazione Dati]]
- [[Gestione Autenticazione]]
- [[Feature-based architecture]]
