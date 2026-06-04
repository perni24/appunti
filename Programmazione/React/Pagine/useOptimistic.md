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

Quando invii una action, aggiorni temporaneamente la UI prima della risposta.

## API / Sintassi

```jsx
function Comments({ comments }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, comment) => [...state, comment]
  );
}
```

## Esempio pratico

```jsx
async function submitComment(formData) {
  const text = formData.get("text");
  addOptimisticComment({ id: "temp", text });
  await createComment({ text });
}
```

La UI mostra subito il commento, poi si riallinea con dati reali.

## Varianti

- **Append ottimistico**: aggiunta lista.
- **Toggle ottimistico**: like/favorite.
- **Update ottimistico**: modifica campo.
- **Rollback manuale**: se action fallisce.
- **Cache optimistic update**: gestito da librerie data fetching.

## Errori comuni

- Usarlo per azioni con alta probabilita di fallimento.
- Non gestire rollback o messaggio errore.
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
- [useOptimistic](https://react.dev/reference/react/useOptimistic)
