---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, validation, forms, zod]
aliases: [Validazione Dati, Zod, Validazione Form]
prerequisites: []
related: []
---

# Validazione Dati

## Sintesi

La validazione dati nel frontend controlla input utente, payload API e valori provenienti da sistemi esterni prima di usarli nella UI. Non sostituisce la validazione server-side, ma migliora UX e riduce errori locali.

## Quando usarlo

Usa validazione client-side per form, filtri, payload API, configurazioni e dati non fidati. Usa schema validation quando i dati hanno forma complessa o devono essere condivisi tra piu punti.

## Come funziona

Validazione manuale:

```jsx
function validateEmail(value) {
  if (!value.includes("@")) {
    return "Email non valida";
  }
  return null;
}
```

Schema con Zod:

```jsx
const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().positive(),
});
```

## API / Sintassi

Parsing sicuro:

```jsx
const result = UserSchema.safeParse(data);

if (!result.success) {
  console.log(result.error);
} else {
  console.log(result.data);
}
```

Form validation:

```jsx
const errors = {};
if (!email) errors.email = "Email obbligatoria";
if (password.length < 8) errors.password = "Password troppo corta";
```

## Esempio pratico

```jsx
function handleSubmit(event) {
  event.preventDefault();

  const result = LoginSchema.safeParse({ email, password });

  if (!result.success) {
    setErrors(result.error.flatten().fieldErrors);
    return;
  }

  submitLogin(result.data);
}
```

La UI mostra errori specifici e invia solo dati validati.

## Varianti

- **Validazione HTML nativa**: `required`, `minLength`, `type`.
- **Validazione manuale**: semplice e locale.
- **Schema validation**: Zod, Yup, Valibot.
- **Runtime validation API**: controlla dati ricevuti dal backend.
- **Server-side validation**: sempre necessaria per sicurezza.
- **Form library integration**: React Hook Form + resolver.

## Errori comuni

- Validare solo lato client.
- Mostrare errori troppo tardi o troppo presto.
- Non validare dati ricevuti da API.
- Confondere type statici con validazione runtime.
- Usare uno schema troppo lontano dal contratto reale.
- Non gestire messaggi accessibili.

## Checklist

- I dati arrivano da una fonte fidata?
- La validazione server-side esiste?
- Gli errori sono mostrati vicino al campo?
- Gli errori sono accessibili?
- Lo schema e condiviso o duplicato?
- Output e input hanno forme diverse?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Gestione Moduli]]
- [[API layer]]
- [[Data Fetching e Cache]]
- [[Protezione XSS]]
