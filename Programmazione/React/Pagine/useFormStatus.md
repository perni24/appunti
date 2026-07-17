---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: advanced
tags: [react, hooks, forms]
aliases: [useFormStatus]
prerequisites: []
related: []
---

# useFormStatus

## Sintesi

`useFormStatus` permette a un componente dentro una form di leggere lo stato della submission, come pending, senza passare props manualmente. E utile per bottoni submit e feedback locali legati alla form.

## Quando usarlo

Usalo quando un componente figlio della form deve sapere se la form e in invio, per esempio un `SubmitButton` riusabile.

## Come funziona

```jsx
function SubmitButton() {
  const { pending } = useFormStatus();

  return <button disabled={pending}>{pending ? "Invio..." : "Salva"}</button>;
}
```

Il componente deve essere renderizzato dentro una form.

## API / Sintassi

```jsx
import { useFormStatus } from "react-dom";
```

Uso:

```jsx
<form action={formAction}>
  <input name="email" />
  <SubmitButton />
</form>
```

## Esempio pratico

```jsx
function SaveButton() {
  const status = useFormStatus();

  return (
    <button type="submit" disabled={status.pending}>
      {status.pending ? "Salvataggio..." : "Salva"}
    </button>
  );
}
```

## Varianti

- **Submit button riusabile**: legge pending dalla form.
- **Pending indicator**: feedback locale.
- **Form action**: integrazione con action.
- **useActionState**: stato piu ampio della action.

## Errori comuni

- Usarlo fuori da una form.
- Passare comunque pending manualmente senza bisogno.
- Non gestire accessibilita del feedback.
- Confonderlo con stato globale di caricamento.
- Usarlo senza form actions compatibili.

## Checklist

- Il componente e dentro una form?
- Serve leggere pending localmente?
- Il bottone ha `type="submit"`?
- Il feedback e accessibile?
- La form gestisce errori e successo?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Actions e form actions]]
- [[useActionState]]
- [[Gestione Moduli]]
- [React Hooks reference](https://react.dev/reference/react/hooks)
