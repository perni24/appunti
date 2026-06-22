---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, react, frontend, props, hooks]
aliases: [React con TypeScript]
prerequisites: [Type Aliases e Interfaces, Generics, Union e Intersection Types]
related: [TypeScript con Next.js, API tipizzate]
---

# TypeScript con React

## Sintesi

TypeScript con React serve a tipizzare props, state, eventi, hook, componenti e dati provenienti da API. Il vantaggio principale e rendere esplicito il contratto tra componenti e ridurre errori durante refactor e composizione UI.

Non sostituisce test, validazione runtime o gestione corretta dello stato: controlla il codice staticamente.

## Quando usarlo

- Applicazioni React con componenti riutilizzabili.
- Props complesse o componenti condivisi.
- Form e validazioni.
- Hook custom.
- UI che consuma API esterne.
- Design system e librerie di componenti.

## Come funziona

Le props si descrivono con `type` o `interface`. Gli hook inferiscono molti tipi automaticamente, ma in alcuni casi serve annotare state, reducer, ref o callback.

I dati esterni dovrebbero entrare come `unknown` o DTO validati, non come tipi fidati solo perche arrivano da `fetch`.

## API / Sintassi

```tsx
type ButtonProps = {
  label: string;
  disabled?: boolean;
  onClick(): void;
};

function Button({ label, disabled = false, onClick }: ButtonProps) {
  return (
    <button disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}
```

## Esempio pratico

```tsx
type User = {
  id: string;
  email: string;
};

type UserListProps = {
  users: readonly User[];
  onSelect(user: User): void;
};

function UserList({ users, onSelect }: UserListProps) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <button onClick={() => onSelect(user)}>{user.email}</button>
        </li>
      ))}
    </ul>
  );
}
```

Le props dichiarano chiaramente dati richiesti e callback.

## Varianti

- **Component props**: `type Props = { ... }`.
- **Hook custom generici**: preservano tipi tra input e output.
- **Reducer tipizzati**: action come discriminated union.
- **Ref tipizzati**: `useRef<HTMLInputElement | null>(null)`.
- **Componenti polimorfici**: piu avanzati, spesso usati nei design system.

## Errori comuni

- **Usare `React.FC` senza motivo**: non e obbligatorio e puo aggiungere vincoli non desiderati.
- **Tipizzare male eventi**: usare tipi React specifici per `ChangeEvent`, `MouseEvent`, ecc.
- **Fidarsi dei dati API senza validazione**.
- **Usare `any` nelle props**: rompe il contratto tra componenti.
- **Rendere opzionali props obbligatorie**: nasconde stati UI non gestiti.

## Checklist

- Tipizzare props e callback.
- Usare discriminated union per stati UI complessi.
- Validare dati esterni prima di renderizzarli.
- Evitare `any` nei componenti condivisi.
- Lasciare inferire state semplice, annotare state complesso.

## Collegamenti

- [[TypeScript con Next.js]]
- [[API tipizzate]]
- [[Discriminated Unions]]
- [[Validazione runtime e tipi statici]]
