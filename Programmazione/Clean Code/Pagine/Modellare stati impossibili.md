---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - modellazione
  - stati
aliases:
  - Modellare stati impossibili
  - Make illegal states unrepresentable
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Value objects]]"
  - "[[Programmazione/Clean Code/Pagine/Primitive obsession]]"
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
title: Modellare stati impossibili
---

# Modellare stati impossibili

## Sintesi

Rendere uno stato impossibile significa progettare il modello in modo che un programma ben tipizzato non possa costruire **una particolare combinazione**. Una risposta con `success: boolean`, `data?` ed `error?` permette sia «successo senza dati» sia «dati ed errore insieme». Se il protocollo ha due esiti esclusivi, rappresentali direttamente.

## Esempio: legare il contenuto all'esito

```ts
type User = { name: string };

type ApiResult =
  | { status: "success"; data: User; error?: never }
  | { status: "error"; error: string; data?: never };

function describe(result: ApiResult): string {
  switch (result.status) {
    case "success": return result.data.name;
    case "error": return result.error;
    default: {
      const unhandled: never = result;
      return unhandled;
    }
  }
}
```

Il discriminante `status` rende obbligatorio `data` nel successo ed `error` nel fallimento. I campi `?: never` vietano anche di assegnare una **variabile** con `status: "success"`, dati validi e una stringa `error`: senza quel divieto esplicito il controllo strutturale potrebbe accettare il campo in più. Con `strict` e `exactOptionalPropertyTypes: true` non è consentito nemmeno passare esplicitamente `error: undefined` al posto dell'assenza del campo.

## Tre garanzie diverse

| Domanda | Risposta del modello |
| --- | --- |
| Il programma può costruire un successo privo di dati? | Il compilatore lo rifiuta prima dell'esecuzione. |
| Cosa accade se si aggiunge un esito `pending`? | Il controllo con `never` segnala che `describe` non ha ancora gestito quel caso. |
| Un JSON ricevuto dalla rete rispetta la union? | Non lo sappiamo. Trattarlo come `unknown` e controllarne discriminante e contenuto prima di usarlo. Un cast non effettua questa verifica. |

## Limiti ed errori comuni

La union elenca **stati**, non **transizioni**: non impedisce, da sola, di passare da «pagato» a «bozza». Per una macchina a stati occorre anche stabilire da quale stato è consentita ogni operazione. Allo stesso modo un prezzo positivo richiede un controllo numerico, non soltanto un nome di tipo. Un risultato parziale legittimo va aggiunto come variante, non nascosto rendendo tutto opzionale.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Value objects|Value objects]]
- [[Programmazione/Clean Code/Pagine/Primitive obsession|Primitive obsession]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/TypeScript/Pagine/Discriminated Unions|Discriminated unions in TypeScript]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]

## Fonti

- TypeScript Handbook, [Discriminated unions ed exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- TypeScript TSConfig, [exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html)
- Yaron Minsky, *Effective ML*; Scott Wlaschin, *Domain Modeling Made Functional*
