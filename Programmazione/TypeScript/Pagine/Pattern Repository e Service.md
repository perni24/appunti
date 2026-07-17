---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, repository-pattern, service-layer, architecture]
aliases: [Repository e Service TypeScript]
prerequisites: [Interfaces, Generics, TypeScript con Node.js]
related: [DTO e modelli di dominio, Dependency injection, Clean architecture]
---

# Pattern Repository e Service

## Sintesi

Il pattern Repository separa l'accesso ai dati dalla logica applicativa. Il Service coordina casi d'uso e regole applicative usando repository, validator, client esterni e altri servizi.

In TypeScript questi pattern funzionano bene quando i contratti sono espliciti tramite interface, DTO e tipi di dominio.

## Quando usarlo

- Backend con database.
- Servizi che devono essere testabili.
- Applicazioni con logica di dominio non banale.
- Integrazione con piu fonti dati.
- Codebase dove vuoi separare infrastruttura e casi d'uso.

## Come funziona

Il repository espone metodi come `findById`, `save`, `delete`. Il service usa il repository per implementare una regola applicativa. Il dominio non dovrebbe conoscere dettagli SQL, ORM o HTTP.

## API / Sintassi

```ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

## Esempio pratico

```ts
type User = {
  id: string;
  email: string;
};

interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

class UserService {
  constructor(private readonly users: UserRepository) {}

  async register(email: string): Promise<User> {
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

Il service dipende da un'interfaccia, quindi puo essere testato con un repository fake.

## Varianti

- **Repository per aggregato**.
- **Service applicativo**.
- **Domain service**.
- **Query service** per letture ottimizzate.
- **Unit of Work** per transazioni complesse.

## Errori comuni

- **Repository troppo generico**: `find`, `save`, `update` senza dominio.
- **Service che diventa god object**.
- **Mettere logica di dominio nel controller**.
- **Esporre direttamente modelli ORM al resto dell'app**.

## Checklist

- Definire repository in termini di dominio.
- Tenere controller sottili.
- Testare service con repository fake.
- Separare DTO, dominio e persistenza.
- Evitare astrazioni se l'app e molto piccola.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Dependency injection]]
- [[Clean architecture]]
