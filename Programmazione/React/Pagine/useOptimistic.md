---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: advanced
tags: [react, hooks, optimistic-ui]
aliases: [useOptimistic, Optimistic UI]
prerequisites: []
related: []
---

# useOptimistic

## Sintesi

`useOptimistic` permette di mostrare subito uno stato ottimistico mentre una action asincrona e ancora in corso. Migliora la percezione di velocita, ma richiede gestione corretta di errori e rollback.

## Quando usarlo

Usalo per azioni dove il successo e probabile e l'utente beneficia di feedback immediato: aggiungere commenti, like, preferiti, elementi in lista o piccole mutazioni.

## Come funziona

```jsx
const [optimisticItems, addOptimisticItem] = useOptimistic(
  items,
  (currentItems, newItem) => [...currentItems, newItem]
);
```

Il setter ottimistico deve essere chiamato dentro una Action, per esempio una funzione passata a `<form action>` oppure una funzione eseguita con `startTransition`. Fuori da una Action React mostra un warning e lo stato ottimistico puo apparire solo brevemente.

## API / Sintassi

```jsx
function Comments({ comments, createComment }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, comment) => [...state, { ...comment, pending: true }]
  );

  async function submitAction(formData) {
    const text = formData.get("text");
    const draft = { id: crypto.randomUUID(), text };

    addOptimisticComment(draft);
    await createComment(draft);
  }

  return (
    <>
      <form action={submitAction}>
        <input name="text" />
        <button type="submit">Invia</button>
      </form>
      {optimisticComments.map((comment) => (
        <p key={comment.id} aria-busy={comment.pending}>
          {comment.text}
        </p>
      ))}
    </>
  );
}
```

## Esempio pratico

La prop `action` del form esegue `submitAction` nel contesto richiesto da React. Durante l'attesa viene mostrato il draft; quando il parent aggiorna `comments`, lo stato ottimistico converge con quello canonico. Se l'Action fallisce e il valore base non cambia, React torna automaticamente al valore precedente; l'applicazione deve comunque mostrare l'errore all'utente.

## Varianti

- **Append ottimistico**: aggiunta lista.
- **Toggle ottimistico**: like/favorite.
- **Update ottimistico**: modifica campo.
- **Ripristino dal valore base**: al termine di una Action fallita lo stato ottimistico temporaneo scompare; gestisci separatamente messaggio di errore ed eventuali effetti esterni.
- **Cache optimistic update**: gestito da librerie data fetching.

## Errori comuni

- Usarlo per azioni con alta probabilita di fallimento.
- Non gestire il messaggio di errore o presumere che gli effetti esterni siano annullati automaticamente.
- Chiamare il setter ottimistico fuori da una Action.
- Creare id temporanei non riconciliati.
- Usare optimistic UI per operazioni critiche senza conferma.
- Duplicare elementi quando arriva risposta server.

## Checklist

- Il successo e abbastanza probabile?
- Esiste fallback in caso di errore?
- Gli id temporanei vengono riconciliati?
- La UI comunica pending se necessario?
- Una cache library gestirebbe meglio il caso?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Actions e form actions]]
- [[useActionState]]
- [[Data Fetching e Cache]]

## Fonti

- [React - useOptimistic](https://react.dev/reference/react/useOptimistic)
- [React - Actions](https://react.dev/reference/react/useTransition#perform-non-blocking-updates-with-actions)
