---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, clean-architecture, architecture, backend]
aliases: [Clean Architecture TypeScript]
prerequisites: [Domain modeling, Pattern Repository e Service]
related: [Dependency injection, DTO e modelli di dominio]
---

# Clean architecture

## Sintesi

Clean architecture organizza il codice separando dominio, casi d'uso, adapter e infrastruttura. In TypeScript questo significa usare tipi e interfacce per dipendere da contratti, non da dettagli come framework HTTP, ORM o database.

Il vantaggio e testabilita e indipendenza dai dettagli tecnici; il costo e maggiore struttura.

## Quando usarlo

- Backend con dominio non banale.
- App che deve durare nel tempo.
- Sistemi con piu adapter: HTTP, queue, CLI, cron.
- Progetti dove testare casi d'uso e importante.
- Team che vuole confini architetturali espliciti.

## Come funziona

Le dipendenze puntano verso il centro:

- dominio;
- use case;
- interfacce/port;
- adapter e infrastruttura.

Il dominio non importa Express, Fastify, ORM o librerie cloud.

## API / Sintassi

```ts
interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

## Esempio pratico

```ts
class RegisterUser {
  constructor(private readonly users: UserRepository) {}

  async execute(email: string): Promise<User> {
    const existing = await this.users.findByEmail(email);

    if (existing) {
      throw new Error("Email gia registrata");
    }

    const user = { id: crypto.randomUUID(), email };
    await this.users.save(user);
    return user;
  }
}
```

Il caso d'uso dipende da `UserRepository`, non da SQL o HTTP.

## Varianti

- **Hexagonal architecture**.
- **Ports and adapters**.
- **Layered architecture**.
- **Feature-based architecture**.
- **Modular monolith**.

## Errori comuni

- **Applicare clean architecture a CRUD banale**: puo essere overhead.
- **Mettere framework nel dominio**.
- **Creare troppe interfacce senza bisogno**.
- **Confondere separazione con cartelle profonde**.

## Checklist

- Separare dominio, use case e infrastruttura.
- Dipendere da interfacce ai confini.
- Tenere controller e adapter sottili.
- Testare use case senza database reale.
- Applicare il pattern dove la complessita lo giustifica.

## Collegamenti

- [[Domain modeling]]
- [[Pattern Repository e Service]]
- [[Dependency injection]]
