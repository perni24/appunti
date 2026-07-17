---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, nextjs, react, fullstack]
aliases: [Next.js con TypeScript]
prerequisites: [TypeScript con React, TypeScript con Node.js]
related: [API tipizzate, Validazione runtime e tipi statici]
---

# TypeScript con Next.js

## Sintesi

Next.js usa TypeScript per tipizzare componenti React, route, dati server-side, API route, server actions, config e integrazioni full-stack.

Il punto chiave e distinguere codice client, codice server e confini runtime: i tipi aiutano, ma i dati che attraversano rete, form o database vanno validati.

## Quando usarlo

- Applicazioni React full-stack.
- Route server-rendered o statiche.
- API route e server-side logic.
- Form con validazione.
- Progetti dove frontend e backend condividono tipi o schemi.

## Come funziona

Next.js rileva TypeScript e usa un `tsconfig` dedicato. I componenti possono essere server o client component; i tipi devono rispettare cosa puo girare nel browser e cosa resta sul server.

I contratti tra server e client devono essere serializzabili e validati quando arrivano da input esterno.

## API / Sintassi

```tsx
type PageProps = {
  params: {
    id: string;
  };
};

export default function Page({ params }: PageProps) {
  return <main>User {params.id}</main>;
}
```

## Esempio pratico

```tsx
type User = {
  id: string;
  email: string;
};

async function getUser(id: string): Promise<User> {
  return { id, email: "luca@example.com" };
}

export default async function UserPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser(params.id);

  return <h1>{user.email}</h1>;
}
```

Il dato e tipizzato, ma `getUser` deve comunque gestire errori reali.

## Varianti

- **Page e layout props**.
- **API route tipizzate**.
- **Server actions**.
- **Client components con props tipizzate**.
- **Schema condivisi tra form e backend**.

## Errori comuni

- **Usare tipi server in componenti client non serializzabili**.
- **Fidarsi dei parametri route senza validazione**.
- **Condividere moduli che importano API server nel client**.
- **Tipizzare response senza gestire errori HTTP**.
- **Non separare DTO e dominio**.

## Checklist

- Separare codice server e client.
- Validare route params, search params e form data.
- Tipizzare props di componenti pubblici.
- Usare schema runtime per input esterni.
- Non esporre segreti o moduli server nel client.

## Collegamenti

- [[TypeScript con React]]
- [[TypeScript con Node.js]]
- [[API tipizzate]]
- [[Schema validation con Zod]]
