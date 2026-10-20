---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - react
  - actions
  - forms
aliases:
  - Actions
  - Form actions
  - React Actions
prerequisites:
  - "[[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]"
related:
  - "[[Programmazione/React/Pagine/useActionState|useActionState]]"
  - "[[Programmazione/React/Pagine/Server Components|Server Components]]"
title: Actions e form actions
---

# Actions e form actions

## Sintesi

Le Actions collegano un'interazione a una Transition, anche asincrona. Con React 19 una funzione passata a `<form action>` partecipa a questo meccanismo: non e semplicemente un altro nome per `onSubmit`.

Il codice puo restare nel browser. L'esecuzione sul server richiede invece una Server Function e un framework compatibile. Riferimento: React e React DOM 19.3.0; gli esempi qui sono client-only.

## Problema che risolve

Un invio comprende almeno dati, lavoro in corso e risultato. Gestire questi aspetti separatamente puo lasciare pulsanti attivi durante il salvataggio o mostrare una conferma prima della risposta. Le Actions forniscono un contesto coordinato, ma non implementano al posto dell'applicazione validazione, persistenza o autorizzazione.

Per una ricerca locale o un form gia gestito da React Hook Form, `onSubmit` rimane un'opzione valida: non occorre migrare solo per usare una API recente.

## Concetto chiave

| Meccanismo | Contratto | Dove esegue il lavoro |
| --- | --- | --- |
| `onSubmit={handler}` | Riceve un evento; il codice decide se impedire la navigazione | Browser |
| `action="/endpoint"` | Invio HTML verso una URL | Endpoint esistente |
| `action={clientAction}` | Riceve `FormData`, esegue una Action | Browser, eventualmente chiama una API |
| `action={serverFunction}` | Il framework trasporta la chiamata | Server del framework |

Il suffisso `Action` e una convenzione, non sposta codice sul server. Una normale callback async non acquista automaticamente il contesto di una Action. Vedi la [presentazione delle Actions in React 19](https://react.dev/blog/2024/12/05/react-19).

## Dettagli importanti

### Invio e dati

La funzione di `action` riceve **un argomento**, il `FormData`, non l'evento. Con `useActionState` la funzione originale riceve invece **stato precedente e payload**: al form va passato il dispatcher restituito dall'hook.

`name` identifica i campi inviati; `id` serve anche a collegare la label. Controlli disabilitati e checkbox non selezionate non contribuiscono come normali campi; nomi ripetuti richiedono `getAll`. `get` puo restituire stringa, `File` o `null`: non convertire ciecamente tutto con `String`. Il pulsante submit usato puo aggiungere il proprio `name/value`. [FormData su MDN](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData).

### Pending e risultato

- `useFormStatus`, importato da `react-dom`, osserva il form **antenato**. Va chiamato in un componente figlio del form, non nel componente che restituisce quel form.
- `useActionState`, da `react`, conserva il risultato dell'azione e offre `isPending`.
- `useOptimistic` puo mostrare un risultato provvisorio; la conferma o il fallimento restano da riconciliare con i dati reali.

### Reset non significa salvataggio riuscito

Una form action risolta normalmente provoca il reset dei controlli non controllati ai valori iniziali. React non interpreta un oggetto `{ error: ... }` come un'eccezione: anche un errore applicativo restituito normalmente puo accompagnarsi al reset.

Un input controllato conserva invece il valore nello stato React. La nota su `useActionState` applica questa scelta per non perdere la bozza. Il return di una semplice form action non diventa automaticamente un messaggio nella UI. [Contratto del componente form](https://react.dev/reference/react-dom/components/form).

## Esempio

File `LabelPreview.jsx`, da montare in un progetto React 19 come quello di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. La trasformazione e locale: **nessuna richiesta HTTP o persistenza**. Il ritardo rende osservabile il pending, non simula un server affidabile.

```jsx
import { startTransition, useId, useState } from "react";
import { useFormStatus } from "react-dom";

export async function formatLabelDemo(text, mode) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mode === "upper" ? text.toUpperCase() : text.toLowerCase();
}

function LabelFields({ id }) {
  const { pending } = useFormStatus();
  return (
    <fieldset disabled={pending}>
      <legend>Anteprima etichetta</legend>
      <label htmlFor={id}>Testo</label>
      <input id={id} name="text" required maxLength={60} />
      <button type="submit" name="mode" value="upper">Maiuscolo</button>
      <button type="submit" name="mode" value="lower">Minuscolo</button>
      <p role="status">{pending ? "Elaborazione..." : "Pronto"}</p>
    </fieldset>
  );
}

export default function LabelPreview({ format = formatLabelDemo }) {
  const id = useId();
  const [result, setResult] = useState("");

  async function previewAction(formData) {
    const rawText = formData.get("text");
    const mode = formData.get("mode");
    const text = typeof rawText === "string" ? rawText.trim() : "";
    if (!text || text.length > 60 || !["upper", "lower"].includes(mode)) {
      setResult("Inserisci testo non vuoto e scegli una trasformazione.");
      return;
    }
    const label = await format(text, mode);
    startTransition(() => setResult(`Risultato: ${label}`));
  }

  return (
    <section aria-label="Trasformazione etichetta">
      <form action={previewAction}>
        <LabelFields id={id} />
      </form>
      <p aria-live="polite">{result}</p>
    </section>
  );
}
```

Prova `Ciao`, poi Maiuscolo: durante l'attesa i controlli sono disabilitati; alla fine compare `CIAO` e l'input torna vuoto. I dati sono stati raccolti **prima** della disabilitazione. Con soli spazi compare il messaggio e l'input si resetta ugualmente: qui e una scelta dimostrativa esplicita, non una strategia adatta a una lunga bozza.

L'aggiornamento di `result` dopo `await` e racchiuso in un ulteriore `startTransition`, necessario nella versione indicata per marcarlo come Transition. Questo non va applicato all'aggiornamento immediato di un input controllato mentre si digita. [startTransition](https://react.dev/reference/react/startTransition).

Se `format` rigetta, l'errore non viene trasformato in un falso successo: occorre un [[Programmazione/React/Pagine/Error Boundaries|Error Boundary]] antenato. Il componente dimostrativo non include un servizio remoto o una politica di retry.

## Limiti

- La prop `formAction` su un pulsante puo sostituire l'action del form. Una funzione action implica semantica POST anche se si scrive `method="get"`; una funzione client non genera per questo una richiesta HTTP automatica.
- Una pagina statica Vite o Quartz non diventa un backend aggiungendo `"use server"`. Le Server Functions richiedono infrastruttura compatibile; `output: "export"` non ospita mutazioni server.
- Il funzionamento prima dell'hydration o senza JavaScript dipende dall'integrazione server e dal punto in cui si rende il form. Non e una proprieta del demo client. Vedi la [guida ai form di Next.js](https://nextjs.org/docs/app/guides/forms).
- In un'app reale il server deve validare input e permessi. Disabilitare il bottone non impedisce richieste costruite manualmente, invii da altre schede o retry di rete: eventuale idempotenza e vincoli appartengono anche al backend.
- Un aggiornamento ottimistico non conferma una scrittura. Annullare l'attesa del browser non annulla necessariamente l'effetto gia eseguito dal server.

## Errori comuni

- Chiamare `preventDefault` sul parametro di una action: e `FormData`, non un evento.
- Passare direttamente al form una funzione che si aspetta `(previousState, formData)` senza il dispatcher.
- Mostrare "Salvato" dopo aver soltanto letto un campo: lettura e conferma del backend sono eventi diversi.
- Perdere la bozza perche si pensava che `{ error: ... }` impedisse il reset.
- Leggere `pending` fuori dal form o nascondere errori inattesi con un catch che restituisce sempre successo.

## Checklist

- So dove viene eseguita la funzione e quali effetti produce?
- Ho provato invio vuoto, fallimento, attesa e secondo invio?
- Il risultato e distinto dalla bozza e il reset e intenzionale?
- I messaggi sono annunciabili e i controlli hanno label?
- Per mutazioni reali ho definito autorizzazione, validazione e gestione dei duplicati sul server?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useActionState|useActionState]]
- [[Programmazione/React/Pagine/useOptimistic|useOptimistic]]
- [[Programmazione/React/Pagine/useFormStatus|useFormStatus]]
- [[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]
- [[Programmazione/React/Pagine/Server Components|Server Components]]
- [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]
- [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG]]

## Fonti

- [React 19: Actions](https://react.dev/blog/2024/12/05/react-19).
- [React DOM: form](https://react.dev/reference/react-dom/components/form) e [useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus).
- [React: startTransition](https://react.dev/reference/react/startTransition).
- [MDN: FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData).
- [Next.js: form e Server Actions](https://nextjs.org/docs/app/guides/forms).

Documentazione consultata il 2026-10-16. Gli esempi locali non sono un collaudo di Server Actions, autenticazione o database.
