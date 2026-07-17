---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, funzioni, type-annotations]
aliases: [Funzioni tipizzate TypeScript]
prerequisites: [Variabili e annotazioni di tipo, Inferenza dei tipi]
related: [Firme di funzione e overload, Generics]
---

# Funzioni tipizzate

## Sintesi

Le funzioni tipizzate dichiarano il tipo dei parametri e, quando utile, il tipo del valore restituito. Sono uno dei punti piu importanti di TypeScript, perche una funzione e spesso il confine tra parti diverse del programma.

Tipizzare bene una funzione significa rendere chiaro cosa accetta, cosa produce e quali errori il compilatore puo intercettare prima del runtime.

## Quando usarlo

- Funzioni esportate da un modulo.
- Callback passate a librerie o framework.
- Funzioni che ricevono oggetti complessi.
- Funzioni pubbliche usate da piu parti della codebase.
- Funzioni dove il ritorno deve rimanere stabile nel tempo.

## Come funziona

I parametri vengono annotati con `: Tipo`. Il ritorno puo essere inferito, ma per API pubbliche o funzioni complesse conviene dichiararlo esplicitamente.

TypeScript controlla che chi chiama la funzione passi valori compatibili e che il corpo della funzione restituisca il tipo dichiarato.

## API / Sintassi

```ts
function sum(a: number, b: number): number {
  return a + b;
}

const formatUser = (name: string, age: number): string => {
  return `${name} (${age})`;
};
```

## Esempio pratico

```ts
type User = {
  id: string;
  email: string;
  active: boolean;
};

function canReceiveEmail(user: User): boolean {
  return user.active && user.email.includes("@");
}

const result = canReceiveEmail({
  id: "u_1",
  email: "luca@example.com",
  active: true,
});
```

La funzione non accetta un oggetto generico: richiede un valore compatibile con `User`.

## Varianti

- **Function declaration**: `function fn(...) {}`.
- **Arrow function**: `const fn = (...) => ...`.
- **Function type alias**: `type Handler = (value: string) => void`.
- **Callback tipizzata**: parametro funzione passato ad altra funzione.
- **Generic function**: funzione che conserva il tipo tra input e output.

## Errori comuni

- **Lasciare parametri impliciti `any`**: con `noImplicitAny` attivo diventa errore.
- **Annotare ritorni troppo larghi**: `object`, `Function` o `any` nascondono informazioni.
- **Usare `void` pensando significhi assenza assoluta di valore**: indica che il chiamante non deve usare il ritorno.
- **Tipizzare callback in modo incompatibile**: una callback troppo specifica puo non essere accettabile dove serve una piu generale.

## Checklist

- Annotare sempre i parametri.
- Annotare il ritorno delle funzioni esportate o critiche.
- Usare type alias per firme riutilizzate.
- Preferire `unknown` ad `any` per input non validati.
- Lasciare inferire ritorni locali semplici quando migliora la leggibilita.

## Collegamenti

- [[Variabili e annotazioni di tipo]]
- [[Firme di funzione e overload]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]
