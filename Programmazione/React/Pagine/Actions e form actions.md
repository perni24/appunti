---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
publish: true
difficulty: advanced
tags: [react, actions, forms]
aliases: [Actions, Form actions, React Actions]
prerequisites: []
related: []
---

# Actions e form actions

## Sintesi

Le Actions in React modellano aggiornamenti asincroni legati a interazioni, spesso form. Consentono di gestire pending state, errori, aggiornamenti ottimistici e integrazione con form in modo piu dichiarativo.

Nei framework compatibili, le form actions possono collegarsi anche a funzioni server.

## Quando usarlo

Usale quando una form o interazione avvia una mutazione asincrona: submit, salvataggio, aggiunta a carrello, invio commento o aggiornamento profilo.

## Come funziona

Una action e una funzione eseguita in risposta a una interazione. Puo essere usata con hook come `useActionState`, `useOptimistic` e `useFormStatus`.

```jsx
async function submitAction(previousState, formData) {
  const email = formData.get("email");
  return { email, saved: true };
}
```

## API / Sintassi

Form action:

```jsx
<form action={formAction}>
  <input name="email" />
  <button type="submit">Salva</button>
</form>
```

Con hook:

```jsx
const [state, formAction, isPending] = useActionState(action, initialState);
```

## Esempio pratico

```jsx
async function createUser(previousState, formData) {
  const email = formData.get("email");
  await api.createUser({ email });
  return { status: "success" };
}
```

La UI puo mostrare pending e risultato usando gli hook dedicati.

## Varianti

- **Client action**: logica nel client.
- **Server action**: supportata da framework compatibili.
- **useActionState**: stato legato all'action.
- **useFormStatus**: stato del form discendente.
- **useOptimistic**: UI aggiornata prima della conferma.

## Errori comuni

- Usare action senza validazione server-side.
- Confondere form action React con API specifiche del framework.
- Non gestire pending e errori.
- Applicare optimistic update senza rollback.
- Non considerare progressive enhancement.

## Checklist

- La mutazione ha validazione server-side?
- Pending, successo ed errore sono rappresentati?
- Serve optimistic update?
- La action gira client o server?
- Il framework supporta il pattern scelto?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[useActionState]]
- [[useOptimistic]]
- [[useFormStatus]]
- [[Gestione Moduli]]
- [[Server Components]]
