---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - forms
  - modules
aliases:
  - Gestione Moduli
  - Form React
  - Controlled components
  - Uncontrolled components
  - Gestione eventi
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]"
  - "[[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]"
title: Gestione Moduli
---

# Gestione Moduli

## Sintesi

Qui "moduli" significa **form**, non moduli JavaScript. Un form raccoglie valori, li valida, gestisce invio/esito e rende comprensibili gli errori. La scelta principale e chi possiede il valore corrente: React oppure il DOM.

Esempi client per React 19.3.0; solo l'ultimo richiede React Hook Form 7.90.0. I componenti sono moduli separati e si possono montare nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]].

## Quando usarlo

- **Controllato**: il valore serve mentre l'utente scrive, per filtri, anteprime o campi dipendenti.
- **Non controllato**: basta leggere il valore al submit; `FormData` spesso elimina la necessita di una ref per ogni campo.
- **Libreria**: molti campi, errori coordinati, dirty/touched, array dinamici o componenti di terze parti. Non e obbligatoria solo perche il form e grande: valuta complessita e misurazioni.

## Come funziona

| Campo | Controllato | Non controllato |
| --- | --- | --- |
| Testo e textarea | `value` e `onChange` | `defaultValue`, poi lettura dal DOM |
| Checkbox e radio | `checked` e `onChange` | `defaultChecked` |
| Select | `value` sul `select` | `defaultValue` sul `select` |

`defaultValue` indica il valore iniziale: non forza quello corrente dopo una modifica dell'utente. Non alternare `undefined`/`null` e una stringa nello stesso input controllato, ne usare insieme `value` e `defaultValue`. Per le checkbox leggi `event.target.checked`, non `value`.

`dirty` indica una differenza rispetto ai valori iniziali; `touched` indica un campo visitato, solitamente dopo il blur. Servono a decidere **quando** mostrare gli errori, non sostituiscono la validazione. Un errore remoto di autenticazione e diverso da un campo vuoto.

## API / Sintassi

### Eventi

Passa una funzione a `onChange`, `onClick` o `onSubmit`, non il risultato della sua chiamata. `onChange` sugli input di testo React segue le modifiche durante la digitazione. L'handler aggiorna subito lo stato controllato con il valore letto dall'evento.

Gestisci il submit sul `<form>`, non soltanto sul click del pulsante: copri anche l'invio da tastiera. `preventDefault()` blocca l'azione nativa, `stopPropagation()` blocca la propagazione: non sono intercambiabili. Leggi `event.currentTarget` e i valori necessari **prima** di un `await`.

Un pulsante nel form puo essere un submit implicito: specifica `type="button"` per azioni secondarie, `type="submit"` per inviare, `type="reset"` per ripristinare. La validazione HTML puo impedire il submit prima che l'handler sia chiamato.

### Select e checkbox controllati

Esempio locale, senza assegnazione reale di autorizzazioni. Un ruolo selezionato nel browser non conferisce permessi: il server deve verificarli.

```jsx
import { useState } from "react";

export default function Preferences() {
  const [role, setRole] = useState("user");
  const [accepted, setAccepted] = useState(false);
  return (
    <section>
      <label>
        Ruolo richiesto
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <label>
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
        Accetto le condizioni
      </label>
      <p role="status">{role}; consenso: {accepted ? "si" : "no"}</p>
    </section>
  );
}
```

## Esempio pratico

### Login controllato con callback asincrona

`LoginForm` riceve `onLogin({ email, password })`: la callback deve restituire una Promise e rifiutarla in caso di errore. La demo esportata usa una simulazione locale, non autentica nessuno. Per collegare un backend sostituisci la callback con il livello API e verifica il contratto HTTP.

```jsx
import { useRef, useState } from "react";

export function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState("idle");
  const inFlight = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    const credentials = { email, password };
    setPhase("pending");
    try {
      await onLogin(credentials);
      setPassword("");
      setPhase("success");
    } catch {
      setPhase("error");
    } finally {
      inFlight.current = false;
    }
  }

  function handleReset(event) {
    event.preventDefault();
    if (inFlight.current) return;
    setEmail("");
    setPassword("");
    setPhase("idle");
  }

  return (
    <form method="post" onSubmit={handleSubmit} onReset={handleReset}>
      <fieldset disabled={phase === "pending"}>
        <legend>Accesso</legend>
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required
            value={email} onChange={(event) => { setEmail(event.target.value); setPhase("idle"); }} />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required
            value={password} onChange={(event) => { setPassword(event.target.value); setPhase("idle"); }} />
        </label>
        <button type="submit">Accedi</button>
        <button type="reset">Svuota</button>
      </fieldset>
      <p role="status">
        {phase === "pending" ? "Accesso in corso..." : phase === "success" ? "Operazione completata." : ""}
      </p>
      {phase === "error" && <p role="alert">Accesso non riuscito. Riprova.</p>}
    </form>
  );
}

async function simulateLogin() {
  await new Promise((resolve) => setTimeout(resolve, 300));
}

export default function App() {
  return <LoginForm onLogin={simulateLogin} />;
}
```

Il blocco dei campi comunica l'attesa e la ref impedisce invii simultanei anche prima di un nuovo render. Il successo svuota la password; un errore mantiene i dati per il tentativo successivo. Il reset aggiorna lo stato React, non soltanto il DOM.

`method="post"` evita un fallback GET con credenziali nella query, ma da solo non fornisce HTTPS, sessioni, CSRF o un endpoint di login. Il form non promette funzionamento senza JavaScript. Non registrare password nei log o nello storage; non normalizzarle con `trim()`. La callback deve gestire errori HTTP, autenticazione e le eventuali risorse della richiesta. Un lock client non garantisce idempotenza sul server.

### Form non controllato e FormData

Modulo autonomo: legge e mostra preferenze locali, senza inviarle. `name` e la chiave della raccolta, distinta dalla label accessibile. `getAll` conserva le selezioni multiple; `Object.fromEntries` da solo perderebbe valori con la stessa chiave.

```jsx
import { useState } from "react";

export default function NativePreferences() {
  const [result, setResult] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setResult({
      nickname: String(data.get("nickname") ?? ""),
      newsletter: data.has("newsletter"),
      topics: data.getAll("topics"),
    });
  }

  return (
    <form onSubmit={handleSubmit} onReset={() => setResult(null)}>
      <label>Nickname<input name="nickname" defaultValue="Ada" required /></label>
      <label>
        <input name="newsletter" type="checkbox" defaultChecked={false} />Newsletter
      </label>
      <label>
        Argomenti
        <select name="topics" multiple defaultValue={["react"]}>
          <option value="react">React</option>
          <option value="js">JavaScript</option>
        </select>
      </label>
      <button type="submit">Leggi valori</button>
      <button type="reset">Ripristina</button>
      {result !== null && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </form>
  );
}
```

Non vengono inclusi i campi senza `name`, quelli disabilitati e le checkbox non selezionate. Una checkbox selezionata senza `value` usa normalmente `"on"`, non il booleano `true`. I radio di uno stesso gruppo condividono `name`; per un input file leggi `files` o i valori `File` di `FormData`, senza cercare di assegnare un percorso con `value`.

Un campo numerico restituisce ancora testo da `value`: definisci conversione, intervallo e comportamento del vuoto; non affidarti a `Number("")`, che produce zero. Il server deve comunque validare struttura e autorizzazioni.

## Varianti

### React Hook Form

Nel progetto dell'esempio, installa la versione usata qui e conserva il lockfile:

```sh
npm install --save-exact react-hook-form@7.90.0
```

`register` collega nome, eventi e ref al campo. `handleSubmit` valida prima di chiamare la callback. Questo esempio mostra errori dopo il submit e corregge i dati localmente; non usa un backend.

```jsx
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

export default function RegisteredNameForm() {
  const errorId = useId();
  const [saved, setSaved] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: "" },
  });
  return (
    <form noValidate onSubmit={handleSubmit((data) => setSaved(data.name.trim()))}>
      <label>
        Nome
        <input
          {...register("name", { validate: (value) => value.trim().length > 0 || "Inserisci un nome" })}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? errorId : undefined}
        />
      </label>
      {errors.name && <p id={errorId} role="alert">{errors.name.message}</p>}
      <button type="submit">Conferma nome</button>
      <p role="status">Ultimo nome confermato: {saved || "nessuno"}</p>
    </form>
  );
}
```

`noValidate` disattiva la UI di validazione nativa qui, per lasciare la gestione degli errori alla libreria. Non sovrascrivere accidentalmente gli handler/ref di `register`. Per widget controllati esterni valuta `Controller`, senza registrare due volte lo stesso campo.

`formState` espone anche `isDirty`, `touchedFields` e `isSubmitting`; `reset` ripristina valori e stato della libreria. Le callback asincrone devono gestire i propri errori: `handleSubmit` non rende riuscita una richiesta fallita. Per Zod/Yup e validazioni incrociate vedi [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]].

### Actions e form nativi

In React 19 una funzione passata ad `action` riceve `FormData`; dopo il successo vengono resettati i campi non controllati. Le Actions client non richiedono da sole un framework server; le Server Functions richiedono invece un ambiente che le supporti. Non confondere questo contratto con il classico `onSubmit(event)` dei nostri esempi: vedi [[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]].

Un form HTML con URL in `action` e un vero endpoint puo supportare navigazione nativa e progressive enhancement; bisogna progettare la risposta server. `preventDefault()` con una callback JavaScript non lo fornisce automaticamente.

## Errori comuni

- Non usare `event.preventDefault()` quando serve.
- Dimenticare label accessibili.
- Mescolare controlled e uncontrolled sullo stesso input.
- Validare solo lato client.
- Disabilitare submit senza comunicare stato.
- Perdere errori e touched state.

## Checklist

- Ogni input ha label o nome accessibile?
- Il submit gestisce errori e loading?
- Serve controlled o uncontrolled?
- La validazione e anche server-side?
- Il form resta usabile da tastiera?
- Una libreria form ridurrebbe complessita?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]
- [[Programmazione/Python/Pagine/Pydantic|Pydantic]]
- [[Programmazione/React/Pagine/Focus Management|Focus Management]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/useRef|useRef]]
- [[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]

## Fonti

Consultate il 2026-10-15; React 19.3.0 e React Hook Form 7.90.0.

- [Input controllati, default, checkbox e label](https://react.dev/reference/react-dom/components/input).
- [Eventi e propagazione](https://react.dev/learn/responding-to-events).
- [Select singoli e multipli](https://react.dev/reference/react-dom/components/select).
- [Form e Actions](https://react.dev/reference/react-dom/components/form).
- [FormData: campi inclusi ed esclusi](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData).
- [React Hook Form: introduzione ufficiale](https://github.com/react-hook-form/react-hook-form#quickstart) e [sorgente ufficiale della documentazione useForm](https://github.com/react-hook-form/documentation/blob/master/src/content/docs/useform.mdx).
