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
  - actions
  - forms
aliases:
  - useActionState
prerequisites:
  - "[[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]"
related:
  - "[[Programmazione/React/Pagine/useFormStatus|useFormStatus]]"
  - "[[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]"
title: useActionState
---

# useActionState

## Sintesi

`useActionState` collega il risultato di una Action allo stato del componente. Non gestisce automaticamente i valori digitati, non e una cache delle API e non e riservato ai form. Import da `react`, disponibile da React 19; riferimento degli esempi: React e React DOM 19.3.0.

## Quando usarlo

- Conferma o errore di un invio, distinti dalla bozza modificabile.
- Operazioni il cui risultato dipende dall'azione precedente.
- Interazioni asincrone anche senza form, con un dispatcher in una Transition.

Per stato UI sincrono basta spesso `useState` o `useReducer`; per dati remoti condivisi, cache e invalidazione vedi [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]].

## Come funziona

L'hook accoda le invocazioni e passa a ciascuna il risultato precedente. La coda riguarda questa istanza, non utenti o processi diversi. Non e una transazione database. Lo stato visibile puo restare quello gia confermato mentre le operazioni pendenti si completano.

L'azione puo avere effetti collaterali, a differenza del reducer puro di `useReducer`. Non mutare comunque `previousState`: restituisci un nuovo valore coerente con lo stato iniziale. [Riferimento useActionState](https://react.dev/reference/react/useActionState).

## API / Sintassi

```jsx
const [state, dispatchAction, isPending] = useActionState(
  reducerAction,
  initialState,
  // permalink opzionale, soltanto per l'integrazione server descritta sotto.
);
```

| Elemento | Significato |
| --- | --- |
| `reducerAction(previousState, payload)` | Calcola o attende il prossimo stato |
| `state` | Risultato disponibile per il rendering |
| `dispatchAction(payload)` | Avvia/accoda l'azione; identita stabile |
| `isPending` | L'hook ha Actions pendenti |

Nel form usa `action={dispatchAction}`: React crea il contesto di Action. In un evento normale racchiudi il dispatch in `startTransition`, come nel contatore sotto. Non dispatchare durante il rendering. Il payload di un form e `FormData`, **secondo argomento** della funzione originale.

## Esempio pratico

File `AliasForm.jsx`, montabile nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Il servizio locale rifiuta `admin` e `root`; non registra account e non persiste nulla. `save` e sostituibile per testare ritardi/fallimenti o collegare un adapter HTTP con lo stesso contratto.

```jsx
import { useActionState, useId, useState } from "react";

export const initialAliasState = {
  status: "idle",
  message: "",
  savedAlias: null,
  attempts: 0,
};

export async function reserveAliasDemo(alias) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return ["admin", "root"].includes(alias)
    ? { ok: false, message: "Alias riservato: scegli un altro nome." }
    : { ok: true };
}

export function makeAliasAction(save = reserveAliasDemo) {
  return async function saveAlias(previousState, formData) {
    const raw = formData.get("alias");
    const alias = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    const base = { ...previousState, attempts: previousState.attempts + 1 };
    if (!/^[a-z][a-z0-9_]{2,19}$/.test(alias)) {
      return {
        ...base,
        status: "invalid",
        message: "Usa 3-20 caratteri: iniziale a-z, poi a-z, 0-9 o _.",
      };
    }
    const result = await save(alias);
    if (!result.ok) {
      return { ...base, status: "error", message: result.message };
    }
    return {
      ...base,
      status: "success",
      message: `Confermato nella demo: ${alias}`,
      savedAlias: alias,
    };
  };
}

export default function AliasForm({ save = reserveAliasDemo }) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [state, formAction, isPending] = useActionState(
    makeAliasAction(save),
    initialAliasState,
  );

  return (
    <form action={formAction}>
      <label htmlFor={id}>Alias</label>
      <input
        id={id}
        name="alias"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        readOnly={isPending}
        required
        maxLength={20}
        aria-invalid={state.status === "invalid" && !isPending}
        aria-describedby={`${id}-message`}
      />
      <button type="submit" disabled={isPending}>Conferma alias</button>
      <button type="button" disabled={isPending} onClick={() => setDraft("")}>
        Svuota bozza
      </button>
      <p id={`${id}-message`} role="status">
        {isPending ? "Verifica in corso..." : state.message}
      </p>
      <p>Ultima conferma: {state.savedAlias ?? "nessuna"}</p>
      <p>Tentativi elaborati: {state.attempts}</p>
    </form>
  );
}
```

### Cosa verificare

1. `ab` produce un errore locale senza chiamare il servizio; `admin` viene rifiutato dal servizio dimostrativo.
2. `Ada_7` conferma `ada_7`, ma la bozza resta `Ada_7`: risultato normalizzato e testo digitato sono distinti.
3. Durante l'attesa non si puo inviare o modificare la bozza. `readOnly` non rimuove il valore dal form come farebbe un controllo gia disabilitato al momento della raccolta.
4. Un errore successivo conserva sia la bozza sia l'ultima conferma; aumenta il contatore dei tentativi realmente arrivati all'action. L'invio vuoto bloccato da `required` non e un tentativo elaborato.
5. Svuota bozza azzera solo il testo. Non cancella la conferma precedente e non riporta l'hook allo stato iniziale.

Il valore controllato evita la perdita del testo sul reset automatico del form. La validazione qui e parte del contratto didattico, non un criterio universale per nomi utente. In produzione va ripetuta sul server insieme ai controlli di autorizzazione e unicita.

Il contratto di `save` distingue esito previsto (`{ ok: false, message }`) e eccezione inattesa. Non c'e un catch indiscriminato: per un rigetto serve un [[Programmazione/React/Pagine/Error Boundaries|Error Boundary]] antenato. Un adapter reale deve classificare esplicitamente anche errori di trasporto e risposte HTTP; `fetch` non rigetta per ogni status HTTP di errore.

## Varianti

### Dispatch senza form

File indipendente `QueuedCounter.jsx`. Lascia il pulsante attivo per rendere visibile la coda; il ritardo e locale. Tre click devono portare a 3, non a tre aggiornamenti tutti calcolati dallo stesso zero.

```jsx
import { startTransition, useActionState } from "react";

export async function addAfterDelay(previous, delta) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return previous + delta;
}

export default function QueuedCounter({ apply = addAfterDelay }) {
  const [count, dispatch, isPending] = useActionState(apply, 0);
  return (
    <section aria-label="Contatore in coda">
      <button type="button" onClick={() => startTransition(() => dispatch(1))}>
        Aggiungi
      </button>
      <p>Confermati: {count}</p>
      <p role="status">{isPending ? "Elaborazione coda..." : "Pronto"}</p>
    </section>
  );
}
```

La serializzazione non e un meccanismo "vince l'ultima richiesta": gli invii vengono elaborati, non automaticamente scartati. Per lavoro indipendente in parallelo serve un'altra strategia; per feedback immediato vedi [[Programmazione/React/Pagine/useOptimistic|useOptimistic]]. Annullare una richiesta non effettua un rollback server.

### Stato iniziale, reset ed errori

Non usare una nuova prop `initialState` per ripristinare uno stato gia avviato. Per un nuovo ciclo puoi rimontare il componente con una `key` diversa, sapendo che perdi anche bozza e altro stato locale. Un reset visuale non annulla effetti remoti.

Un errore previsto restituito mantiene il form disponibile. Un'eccezione viene rilanciata dall'hook al boundary e le azioni ancora in coda vengono cancellate: non assumere che vengano ritentate. Ripristinare il boundary non garantisce che ripetere una mutazione sia sicuro.

### Server Functions e permalink

Con un framework compatibile la funzione puo essere server-side. Stato e payload devono rispettare il protocollo serializzabile di React; `previousState` e i campi inviati non sono dati attendibili per autorizzare una scrittura.

Il terzo argomento `permalink` serve alla navigazione di un form con Server Function prima del caricamento JavaScript. La destinazione deve rendere lo stesso form con la stessa funzione e permalink. Non e un endpoint da chiamare con `fetch`, una cache, un router generico o persistenza dello stato dopo un reload. Dopo l'interattivita non influisce sull'invio. Questa variante non e implementata nei demo locali. [Form server in Next.js](https://nextjs.org/docs/app/guides/forms).

## Errori comuni

- Leggere `formData` dal primo argomento dopo aver aggiunto l'hook.
- Dispatch async fuori da una Action e poi aspettarsi `isPending` coerente; in sviluppo React segnala l'uso scorretto.
- Confondere il ritorno del dispatcher con il nuovo stato da leggere subito: usa lo `state` del render successivo.
- Restituire forme incoerenti, dimenticare un return o trattare ogni errore come successo.
- Usare lo stato dell'hook come cache globale o prova di autorizzazione.
- Azzerare una bozza mentre la richiesta e pendente senza decidere come gestire la risposta tardiva.

## Checklist

- Action, payload e risultato hanno un contratto esplicito?
- Ho separato bozza, risultato confermato ed errore?
- Ho verificato attesa, rifiuto previsto, rigetto inatteso e secondo invio?
- Il reset e voluto e non viene scambiato per cancellazione della mutazione?
- L'azione e client-only oppure esiste davvero l'integrazione server necessaria?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]
- [[Programmazione/React/Pagine/useOptimistic|useOptimistic]]
- [[Programmazione/React/Pagine/useFormStatus|useFormStatus]]
- [[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]
- [[Programmazione/React/Pagine/useReducer|useReducer]]
- [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]

## Fonti

- [React: useActionState](https://react.dev/reference/react/useActionState).
- [React DOM: form](https://react.dev/reference/react-dom/components/form).
- [React: startTransition](https://react.dev/reference/react/startTransition).
- [Next.js: form e Server Actions](https://nextjs.org/docs/app/guides/forms).

Documentazione consultata il 2026-10-16. Gli esempi verificano il flusso locale, non un sistema di registrazione, database o autenticazione.
