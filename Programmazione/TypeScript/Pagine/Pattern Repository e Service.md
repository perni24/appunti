---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - typescript
  - repository-pattern
  - service-layer
  - architecture
aliases:
  - Repository e Service TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
  - "[[Programmazione/TypeScript/Pagine/Generics]]"
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Node.js]]"
related:
  - "[[Programmazione/TypeScript/Pagine/DTO e modelli di dominio]]"
  - "[[Programmazione/TypeScript/Pagine/Dependency injection]]"
  - "[[Programmazione/TypeScript/Pagine/Clean architecture]]"
title: Pattern Repository e Service
---

# Pattern Repository e Service

## Sintesi

Un **Repository** offre un contratto di accesso ai dati espresso in termini del problema. Un **Service applicativo** coordina un caso d'uso: legge, applica regole, scrive e comunica con altre dipendenze.

Interfacce e cartelle non garantiscono atomicita, isolamento o unicita. Queste proprieta devono essere definite nel contratto e realizzate dall'implementazione.

Baseline degli esempi: **TypeScript 5.9.3**, `strict: true`, target **ES2022**, **Node 24.14.0**.

## Quando usarlo

- Query o regole condivise da piu controller.
- Logica da testare senza avviare un database.
- Accesso a dati con implementazioni diverse.
- Operazioni con conflitti, transazioni o errori da rendere espliciti.

Per un CRUD molto piccolo, un modulo di funzioni puo bastare. Un wrapper che ricopia ogni metodo dell'ORM senza aggiungere un confine utile aumenta soltanto il lavoro.

## Come funziona

Il repository incapsula query e mapping; il service decide quali operazioni servono per il caso d'uso. Le regole proprie di un'entita possono vivere nel dominio, non necessariamente nel service.

Un contratto deve chiarire:

- cosa significa "non trovato", distinto da un errore I/O;
- se la scrittura inserisce, aggiorna o esegue un upsert;
- come tratta conflitti e concorrenza;
- se restituisce copie, entita vive o risultati paginati;
- quali operazioni appartengono alla stessa transazione.

**Cercare un'email e poi salvarla non ne garantisce l'unicita**: due richieste possono entrambe osservare l'assenza. Un controllo preliminare puo migliorare il messaggio, ma la garanzia deve essere nella scrittura atomica, per esempio tramite un vincolo UNIQUE nel database e gestione del relativo conflitto.

## API / Sintassi

I quattro blocchi TS seguenti formano un unico modulo. Il demo registra **contatti in memoria**, non crea account autenticati. Usa l'email come chiave testuale, senza validarne formato o possesso: tale verifica appartiene a un confine distinto.

```ts
type User = Readonly<{ id: string; email: string }>;
type InsertResult = "inserted" | "email_conflict" | "id_conflict";

interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  insertUnique(user: User): Promise<InsertResult>;
}

type RegisterResult =
  | { ok: true; user: User }
  | { ok: false; error: "empty_email" | "email_conflict" | "id_conflict" };
```

`insertUnique` deve verificare e inserire come una sola operazione rispetto alle altre scritture sulla stessa risorsa. L'interfaccia descrive questa promessa, ma il compilatore non puo provarla.

## Esempio pratico

### Repository in memoria

```ts
class MemoryUserRepository implements UserRepository {
  #byId = new Map<string, User>();
  #byEmail = new Map<string, string>();

  async findByEmail(email: string): Promise<User | null> {
    const id = this.#byEmail.get(email);
    const user = id === undefined ? undefined : this.#byId.get(id);
    return user === undefined ? null : { ...user };
  }

  async insertUnique(user: User): Promise<InsertResult> {
    if (this.#byEmail.has(user.email)) return "email_conflict";
    if (this.#byId.has(user.id)) return "id_conflict";

    const stored = { id: user.id, email: user.email };
    this.#byId.set(stored.id, stored);
    this.#byEmail.set(stored.email, stored.id);
    return "inserted";
  }
}
```

Nella singola istanza JavaScript il controllo e l'inserimento non hanno await intermedi, quindi non cedono il controllo ad altre chiamate. Non e una soluzione distribuita: due istanze hanno dati indipendenti e il processo perde tutto al riavvio.

Le copie separano lo stato interno dai chiamanti. Sono sufficienti qui perche i campi sono primitive; con oggetti annidati una copia superficiale non basta.

### Service applicativo

```ts
class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly nextId: () => string,
  ) {}

  async register(email: string): Promise<RegisterResult> {
    const normalized = email.trim();
    if (normalized.length === 0) {
      return { ok: false, error: "empty_email" };
    }

    const id = this.nextId();
    if (id.length === 0) throw new Error("ID generator returned an empty ID");

    const user: User = { id, email: normalized };
    const result = await this.users.insertUnique(user);
    if (result !== "inserted") {
      return { ok: false, error: result };
    }
    return { ok: true, user };
  }
}
```

Il service non usa findByEmail come blocco di concorrenza. Confronta email **case-sensitive dopo trim**: e una politica dimostrativa, non una regola universale sugli indirizzi. Una normalizzazione diversa richiede un vincolo database coerente.

Il generatore ID e iniettato per testarlo. Una collisione viene segnalata, non risolta sovrascrivendo un record. Gli errori inattesi del repository si propagano: non vengono trasformati tutti in "email gia presente".

### Prova del caso d'uso

```ts
async function demoRegistration() {
  let sequence = 0;
  const repository = new MemoryUserRepository();
  const service = new UserService(repository, () => `u${++sequence}`);

  const results = await Promise.all([
    service.register("ada@example.test"),
    service.register("ada@example.test"),
  ]);

  console.log(results.filter((result) => result.ok).length); // 1
  console.log(await repository.findByEmail("ada@example.test"));
  // { id: "u1", email: "ada@example.test" }
}
```

Invoca `await demoRegistration()` da un entry point ESM, oppure da un test asincrono. La nota Clean architecture mostra un progetto completo con comandi di compilazione.

## Varianti

- **Repository per aggregato**: espone operazioni coerenti con le invarianti, non automaticamente uno per tabella.
- **Domain service**: regola di dominio che non appartiene naturalmente a una singola entita; distinto dall'orchestrazione applicativa.
- **Query service**: letture ottimizzate che restituiscono proiezioni, senza ricostruire sempre un intero aggregato.
- **Unit of Work**: coordina scritture nella stessa transazione; aggiungere una Promise non crea una transazione.
- **Outbox**: per coordinare dati e messaggi con una politica di consegna. Non basta "salva, poi invia email" per garantire esattamente una consegna.

## Errori comuni

- Catch generale che converte un guasto del database in "non trovato".
- `save` ambiguo su insert/update e conflitti.
- Fake che ignora vincoli presenti nel database reale.
- Ritorno di modelli ORM o query builder che espone l'infrastruttura.
- Service unico che accumula tutte le responsabilita.

## Checklist

- Contratto minimo e significato degli errori documentati.
- Unicita e concorrenza garantite dal livello che scrive.
- Test del service con fake e test d'integrazione separati dell'adapter reale.
- Mapping e politica di copia espliciti.
- Transazioni e side effect progettati, non presunti.
- Astrazione giustificata dalla complessita.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]
- [[Programmazione/TypeScript/Pagine/Dependency injection|Dependency injection]]
- [[Programmazione/TypeScript/Pagine/Clean architecture|Clean architecture]]
- [[Programmazione/TypeScript/Pagine/Error Handling|Error Handling]]

## Fonti

- [Repository, catalogo di Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html).
- [Service Layer, catalogo di Martin Fowler](https://martinfowler.com/eaaCatalog/serviceLayer.html).
- [PostgreSQL 18: vincoli, inclusa unicita](https://www.postgresql.org/docs/18/ddl-constraints.html). Riferimento concettuale; il demo non esegue PostgreSQL.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
