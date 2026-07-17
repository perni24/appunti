---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: advanced
tags: [react, hooks, actions, forms]
aliases: [useActionState]
prerequisites: []
related: []
---

# useActionState

## Sintesi

`useActionState` e un hook per gestire stato prodotto da una action. E utile soprattutto con form e mutazioni asincrone, per collegare submit, stato precedente, risultato e pending state.

## Quando usarlo

Usalo quando una form deve inviare dati e aggiornare stato in base al risultato dell'action. E utile per messaggi di errore, conferme, stato pending e integrazione con form actions.

## Come funziona

```jsx
const [state, formAction, isPending] = useActionState(action, initialState);
```

La action riceve lo stato precedente e i dati dell'azione.

## API / Sintassi

```jsx
async function updateName(previousState, formData) {
  const name = formData.get("name");
  return { name, saved: true };
}
```

```jsx
function ProfileForm() {
  const [state, formAction, isPending] = useActionState(updateName, {});

  return (
    <form action={formAction}>
      <input name="name" />
      <button disabled={isPending}>Salva</button>
      {state.saved && <p>Salvato</p>}
    </form>
  );
}
```

## Esempio pratico

Gestione errore:

```jsx
async function login(previousState, formData) {
  const email = formData.get("email");
  if (!email) return { error: "Email obbligatoria" };
  return { success: true };
}
```

## Varianti

- **Client action**: action locale.
- **Server function/action**: in framework compatibili.
- **Form state**: messaggi e valori derivati.
- **Pending state**: terzo valore restituito.
- **useOptimistic**: per UI immediata mentre action e in corso.

## Errori comuni

- Non validare input.
- Usare lo stato restituito come unica fonte di verita globale.
- Non gestire `isPending`.
- Mescolare logica di dominio complessa nel componente.
- Assumere supporto server senza verificare framework.

## Checklist

- La action restituisce stato semplice?
- Input ed errori sono validati?
- Il bottone gestisce pending?
- La UI mostra risultato o errore?
- Serve optimistic update?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Actions e form actions]]
- [[useOptimistic]]
- [[useFormStatus]]
- [[Gestione Moduli]]
- [useActionState](https://react.dev/reference/react/useActionState)
