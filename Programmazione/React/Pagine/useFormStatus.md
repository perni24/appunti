---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - react
  - hooks
  - forms
aliases:
  - useFormStatus
prerequisites:
  - "[[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]"
related:
  - "[[Programmazione/React/Pagine/useActionState|useActionState]]"
  - "[[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]"
title: useFormStatus
---

# useFormStatus

## Sintesi

`useFormStatus` legge lo stato dell'invio del form antenato. E un hook di **React DOM**, non di `react`, e non gestisce il risultato dell'operazione. Riferimento: React e React DOM 19.3.0; API stabile da React 19.

## Quando usarlo

Usalo per un pulsante submit, un gruppo di controlli o un messaggio riusabile che deve seguire il form in cui viene montato. Evita di passare pending attraverso molti componenti intermedi, ma passare esplicitamente una prop resta corretto quando il controllo non e nel form o non vuoi accoppiarlo a React DOM.

## Come funziona

Il contesto viene dall'antenato nell'albero React. Un componente che chiama l'hook e poi restituisce `<form>` **non osserva quel form**. Estrai un componente figlio e rendilo al suo interno. Un fratello esterno non acquisisce il contesto assegnando soltanto `form="id"` al suo pulsante.

Il pending termina anche in caso di fallimento: `false` non significa "salvato". `data` non e lo stato corrente degli input ne un archivio dell'ultimo risultato. Il risultato va gestito separatamente, per esempio con `useActionState`. [Riferimento useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus).

## API / Sintassi

```jsx
import { useFormStatus } from "react-dom";

// Dentro un componente discendente del form.
const { pending, data, method, action } = useFormStatus();
```

| Campo | Uso |
| --- | --- |
| `pending` | Indica un invio pendente del form osservato |
| `data` | `FormData` dell'invio, oppure `null` se non disponibile |
| `method` | Metadato del form durante l'invio; a riposo `null` nella versione provata |
| `action` | Riferimento alla funzione associata all'invio, oppure `null` |

Leggi `data` senza modificarlo: non usarlo per correggere silenziosamente un payload che l'action sta elaborando. `get` puo restituire una stringa, un `File` o `null`; campi con lo stesso nome richiedono `getAll`. Non mostrare password o altri dati sensibili nel messaggio pending. [FormData su MDN](https://developer.mozilla.org/en-US/docs/Web/API/FormData).

## Esempio pratico

File `PreviewPanels.jsx`, montabile nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Due form riusano lo stesso componente per i controlli. La trasformazione e locale, senza HTTP, account o persistenza; il ritardo serve solo a osservare l'attesa.

```jsx
import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";

export async function previewLabelDemo(text) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return text.toUpperCase();
}

export function PreviewFields({ id, title, draft, onDraftChange, message }) {
  const { pending, data } = useFormStatus();
  const submitted = data?.get("label");
  const pendingText = typeof submitted === "string" ? submitted : "";

  return (
    <fieldset>
      <legend>{title}</legend>
      <label htmlFor={id}>Etichetta</label>
      <input
        id={id}
        name="label"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        readOnly={pending}
        required
        maxLength={40}
        aria-describedby={`${id}-message`}
      />
      <button type="submit" disabled={pending}>
        {pending ? "Elaborazione..." : "Genera anteprima"}
      </button>
      <p id={`${id}-message`} role="status">
        {pending ? `In elaborazione: ${pendingText}` : message}
      </p>
    </fieldset>
  );
}

export function PreviewForm({ title, transform = previewLabelDemo }) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [state, formAction] = useActionState(generatePreview, {
    result: "",
    message: "Pronto per una nuova anteprima.",
  });

  async function generatePreview(previous, formData) {
    const raw = formData.get("label");
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value || value.length > 40) {
      return { ...previous, message: "Inserisci da 1 a 40 caratteri non vuoti." };
    }
    const result = await transform(value);
    if (typeof result !== "string") throw new TypeError("Anteprima non valida.");
    return { result, message: `Anteprima pronta: ${result}` };
  }

  return (
    <form action={formAction} aria-label={title}>
      <PreviewFields
        id={id}
        title={title}
        draft={draft}
        onDraftChange={setDraft}
        message={state.message}
      />
      <p>Ultima anteprima: {state.result || "nessuna"}</p>
    </form>
  );
}

export default function PreviewPanels({ transform = previewLabelDemo }) {
  return (
    <>
      <PreviewForm title="Etichetta principale" transform={transform} />
      <PreviewForm title="Etichetta secondaria" transform={transform} />
    </>
  );
}
```

### Cosa osservare

Invia `ciao` nel primo form: il suo pulsante entra in attesa e il messaggio legge il payload raccolto. Il secondo form resta utilizzabile. Alla risposta il primo mostra `CIAO`; la bozza e mantenuta perche controllata, non per merito di `useFormStatus`.

Il pending descrive il lavoro; `state.message` e `state.result` descrivono l'esito. Con soli spazi compare un errore di validazione e non viene chiamata la trasformazione. Un rigetto inatteso di `transform` richiede un [[Programmazione/React/Pagine/Error Boundaries|Error Boundary]] antenato: il demo non lo nasconde dietro una conferma fittizia.

Ogni istanza genera ID distinti e conserva i propri dati. Se avvii entrambe insieme, non usare questo esempio per dedurre che ogni Transition debba completarsi indipendentemente: React puo raggruppare Actions pendenti. [Limiti delle Transition](https://react.dev/reference/react/useTransition).

## Varianti

- **Solo pulsante**: estrai un componente che legge `pending`; un altro componente figlio puo leggere `data` per il feedback.
- **Solo onSubmit async**: una Promise avviata nel gestore non viene automaticamente tracciata dall'hook. Gestisci pending esplicito oppure adotta il contesto Action appropriato; `onSubmit` non e sbagliato in se.
- **useActionState fuori form**: `isPending` segue l'hook, mentre `useFormStatus` richiede un form antenato. Non sono indicatori intercambiabili di ogni operazione asincrona.
- **Server Function**: possibile con framework compatibile; questo hook non crea il backend o il progressive enhancement. Vedi [[Programmazione/React/Pagine/Server Components|Server Components]].

## Limiti

Nelle prove con React DOM 19.3.0, a riposo `data`, `method` e `action` tornano `null`. Durante una function action client senza prop `method`, il metadato `method` risulta `get`, letto dal form DOM: non prova che sia partita una richiesta. La semantica POST documentata per le function actions non va dedotta da questo campo. Il demo esegue solo JavaScript locale; per l'invio HTTP fai riferimento al [componente form](https://react.dev/reference/react-dom/components/form), non a questo hook come analizzatore di rete.

Il flag non indica avanzamento percentuale, autorizzazione, validita dei dati o riuscita della scrittura. Un pulsante disabilitato evita normali invii ripetuti dalla UI, non richieste costruite manualmente; controlli e idempotenza server restano responsabilita dell'applicazione.

## Errori comuni

- Importarlo da `react` invece di `react-dom`.
- Chiamarlo nel componente che restituisce il form e aspettarsi che osservi un discendente.
- Credere che un attributo HTML `form` trasferisca il contesto React a un componente esterno.
- Confondere `data` con un collegamento live agli input o conservarlo come risultato permanente.
- Scrivere "salvato" soltanto perche `pending` e tornato falso.
- Aspettarsi pending da qualunque fetch avviata da onSubmit o da un effetto.

## Checklist

- Il lettore dell'hook e davvero un discendente React del form?
- Invio, esito e bozza sono gestiti separatamente?
- I controlli hanno label e un tipo di pulsante esplicito?
- Ho provato due istanze, validazione, attesa e rigetto?
- Il messaggio non espone dati sensibili e non promette un falso successo?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]
- [[Programmazione/React/Pagine/useActionState|useActionState]]
- [[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]
- [[Programmazione/React/Pagine/useOptimistic|useOptimistic]]
- [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]

## Fonti

- [React DOM: useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus).
- [React DOM: form](https://react.dev/reference/react-dom/components/form).
- [React: useActionState](https://react.dev/reference/react/useActionState).
- [React: useTransition](https://react.dev/reference/react/useTransition).
- [MDN: FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData).

Documentazione consultata il 2026-10-16. Il demo locale non verifica Server Functions, persistenza o invio senza JavaScript.
