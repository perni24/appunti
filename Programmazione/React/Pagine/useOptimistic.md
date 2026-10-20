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
  - optimistic-ui
aliases:
  - useOptimistic
  - Optimistic UI
prerequisites:
  - "[[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]"
  - "[[Programmazione/React/Pagine/useActionState|useActionState]]"
related:
  - "[[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]"
  - "[[Programmazione/React/Pagine/useFormStatus|useFormStatus]]"
title: useOptimistic
---

# useOptimistic

## Sintesi

`useOptimistic` mostra una previsione temporanea sopra un valore di base mentre una Action e in corso. Non salva dati e non conferma la riuscita dell'operazione. Disponibile da React 19; riferimento di questa nota: React e React DOM 19.3.0.

## Quando usarlo

E utile per commenti, preferiti o piccole modifiche reversibili quando il feedback immediato aiuta davvero. Mostra chiaramente quali dati sono provvisori. Per una prenotazione, un pagamento o una cancellazione irreversibile, una conferma pessimista puo essere piu comprensibile e sicura.

Se la previsione deve comparire in molte viste che condividono dati remoti, valuta la strategia della cache descritta in [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]: questo hook non sostituisce query, invalidazione o refetch.

## Come funziona

I livelli da tenere separati sono tre:

| Livello | Nel demo sotto |
| --- | --- |
| Bozza | Testo controllato nell'input |
| Base confermata | Array `comments` del parent |
| Vista ottimistica | Base piu il commento in attesa |

Il reducer deve essere puro: niente UUID, richieste o mutazioni dei suoi argomenti. Se cambia la base durante l'attesa, React ricalcola la previsione sulla base nuova. Alla fine usa il valore di base corrente, non necessariamente una fotografia precedente. [Contratto di useOptimistic](https://react.dev/reference/react/useOptimistic).

Un invio riuscito senza aggiornare la base puo quindi far sparire il commento. Il ripristino della vista dopo un errore non annulla una scrittura gia avvenuta sul server; serve una riconciliazione applicativa quando l'esito e incerto.

## API / Sintassi

```jsx
import { useOptimistic } from "react";

// Dentro un componente; addPending e una funzione pura.
const [visibleComments, addOptimistic] = useOptimistic(comments, addPending);
```

Il reducer e opzionale: con `useOptimistic(value)` il setter accetta il prossimo valore oppure un updater puro. Con il reducer, come qui, passi invece un payload che il reducer combina con lo stato corrente.

Il setter va chiamato dentro una Action, per esempio una form action o la callback di `startTransition`. Non basta chiamare la funzione `saveAction`: il nome non crea il contesto. Fuori contesto React segnala l'errore in sviluppo. L'hook restituisce due valori, non un flag pending: nel demo il pending dell'operazione viene da `useActionState`.

## Esempio pratico

File completo `CommentsDemo.jsx`, montabile nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Eseguilo su localhost o HTTPS per usare `crypto.randomUUID`. Il servizio e **locale**, senza HTTP o persistenza: normalizza gli spazi e rifiuta il testo `rifiuta`. Il parametro `createComment` e sostituibile nei test.

Il contratto richiede una risposta con `id`, `requestId` e `text`. `requestId` correla previsione e risposta; nel demo e anche la key stabile. Una vera API deve definire esplicitamente questa correlazione. Una chiave client, da sola, non garantisce idempotenza server.

```jsx
import { startTransition, useActionState, useId, useOptimistic, useState } from "react";

export class CommentRejected extends Error {}

export function addPending(comments, draft) {
  if (comments.some((item) => item.requestId === draft.requestId)) return comments;
  return [...comments, { ...draft, pending: true }];
}

export function mergeConfirmed(comments, saved) {
  const others = comments.filter((item) =>
    item.id !== saved.id && item.requestId !== saved.requestId
  );
  return [...others, { ...saved, pending: false }];
}

export async function createCommentDemo({ requestId, text }) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (text.toLowerCase() === "rifiuta") {
    throw new CommentRejected("Commento rifiutato dalla demo.");
  }
  return { id: `demo-${requestId}`, requestId, text: text.replace(/\s+/g, " ") };
}

export function readComment(formData) {
  const value = formData.get("text");
  return typeof value === "string" ? value.trim() : "";
}

export function checkReply(reply, requestId) {
  if (!reply || typeof reply.id !== "string" || !reply.id ||
      reply.requestId !== requestId || typeof reply.text !== "string") {
    throw new TypeError("Risposta commento non valida.");
  }
  return { id: reply.id, requestId: reply.requestId, text: reply.text };
}

export function Comments({ comments, onConfirm, createComment = createCommentDemo }) {
  const id = useId();
  const [draftText, setDraftText] = useState("");
  const [visibleComments, addOptimistic] = useOptimistic(comments, addPending);
  const [state, formAction, isPending] = useActionState(submitComment, { message: "" });

  async function submitComment(_previous, formData) {
    const text = readComment(formData);
    if (!text || text.length > 200) {
      return { message: "Inserisci da 1 a 200 caratteri non vuoti." };
    }
    const draft = { requestId: crypto.randomUUID(), text };
    addOptimistic(draft);

    try {
      const saved = checkReply(await createComment(draft), draft.requestId);
      startTransition(() => onConfirm(saved));
      return { message: "Commento confermato nella demo." };
    } catch (error) {
      if (!(error instanceof CommentRejected)) throw error;
      return { message: error.message };
    }
  }

  return (
    <section aria-label="Commenti della demo">
      <form action={formAction}>
        <label htmlFor={id}>Commento</label>
        <textarea
          id={id}
          name="text"
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          readOnly={isPending}
          required
          maxLength={200}
          aria-describedby={`${id}-message`}
        />
        <button type="submit" disabled={isPending}>Invia commento</button>
        <button type="button" disabled={isPending} onClick={() => setDraftText("")}>
          Svuota bozza
        </button>
        <p id={`${id}-message`} role="status">
          {isPending ? "Invio in corso..." : state.message}
        </p>
      </form>
      <ul aria-label="Commenti">
        {visibleComments.map((comment) => (
          <li key={comment.requestId}>
            {comment.text} {comment.pending ? "(in attesa)" : "(confermato)"}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function CommentsDemo({ createComment = createCommentDemo }) {
  const [comments, setComments] = useState([]);
  function confirm(saved) {
    setComments((current) => mergeConfirmed(current, saved));
  }
  return <Comments comments={comments} onConfirm={confirm} createComment={createComment} />;
}
```

### Come leggere l'esempio

1. Il testo viene controllato prima di creare la previsione. UUID generato nell'azione, non nel reducer.
2. Durante l'attesa compare il testo con un'etichetta esplicita; non viene annunciato un falso successo.
3. La risposta valida aggiorna il parent tramite updater, conservando eventuali altri commenti arrivati nel frattempo. Il controllo per `requestId` evita di aggiungere di nuovo una previsione gia confermata.
4. Il testo confermato puo differire da quello digitato: qui gli spazi ripetuti vengono normalizzati. La bozza controllata rimane disponibile anche dopo il reset automatico del form.
5. Con `rifiuta` la previsione scompare al termine, compare l'errore e la bozza resta modificabile. Un bug o un'altra eccezione non viene spacciato per rifiuto previsto: serve un [[Programmazione/React/Pagine/Error Boundaries|Error Boundary]] antenato.

`onConfirm` ha un contratto sincrono: aggiorna lo stato React, non avvia un salvataggio nascosto. L'ulteriore `startTransition` dopo `await` marca l'aggiornamento della base come parte della transizione nella versione indicata. [startTransition](https://react.dev/reference/react/startTransition).

## Varianti

- **Toggle o modifica campo**: prevedi il nuovo valore, ma lascia prevalere quello confermato dalla risposta.
- **Rimozione**: nascondere subito una riga rende difficile spiegare un errore; marcarla come in eliminazione puo essere piu chiaro.
- **Cache condivisa**: le policy di TanStack Query o del framework coordinano i lettori; evita due strategie ottimistiche indipendenti sullo stesso dato.
- **Invii concorrenti**: il demo disabilita il normale invio durante il pending. Non e una soluzione generale per scritture concorrenti; servono identita, ordine e gestione degli errori per operazione. React puo raggruppare Actions pendenti: non dedurre scadenze indipendenti dalla sola presenza dell'hook.

## Limiti

Un rigetto di rete puo arrivare dopo una scrittura riuscita. Non trattarlo automaticamente come il `CommentRejected` locale: bisogna verificare lo stato autorevole, segnalare l'incertezza e valutare la sicurezza di un retry. Il demo non implementa autenticazione, deduplicazione server, offline, persistenza, cache o cancellazione. Un reload perde tutti i commenti.

## Errori comuni

- Aspettarsi che il valore restituito dal servizio aggiorni automaticamente la base.
- Usare un array catturato prima dell'await e sovrascrivere aggiunte successive.
- Generare UUID nel reducer o usare indici della lista per correlare le risposte.
- Ripristinare un vecchio array completo dopo un errore, perdendo aggiornamenti altrui.
- Non attendere la Promise nell'Action: la previsione puo terminare prima del lavoro.
- Confondere rimozione della previsione e rollback di una transazione remota.

## Checklist

- La previsione e distinguibile dalla conferma?
- Il reducer e puro e la risposta aggiorna la base corrente?
- Ho provato successo normalizzato, rifiuto, retry e aggiornamento della base durante attesa?
- Bozza, errori e correlazione delle identita hanno una politica esplicita?
- So cosa fare se il server ha scritto ma la risposta non arriva?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Actions e form actions|Actions e form actions]]
- [[Programmazione/React/Pagine/useActionState|useActionState]]
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/useFormStatus|useFormStatus]]
- [[Programmazione/React/Pagine/Error Boundaries|Error Boundaries]]

## Fonti

- [React: useOptimistic](https://react.dev/reference/react/useOptimistic).
- [React: Actions e limiti delle Transition](https://react.dev/reference/react/useTransition).
- [React: startTransition](https://react.dev/reference/react/startTransition).
- [React DOM: form e reset](https://react.dev/reference/react-dom/components/form).

Documentazione consultata il 2026-10-16. Il servizio didattico non e un backend e la previsione non e una conferma di scrittura.
