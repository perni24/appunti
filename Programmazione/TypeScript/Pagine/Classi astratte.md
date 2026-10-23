---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - typescript
  - classi
  - abstract-classes
  - oop
aliases:
  - Abstract classes TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Classi]]"
  - "[[Programmazione/TypeScript/Pagine/Visibilita e modificatori di accesso]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Implementazione di interfacce]]"
  - "[[Programmazione/TypeScript/Pagine/Generics]]"
title: Classi astratte
---

# Classi astratte

## Sintesi

Una classe astratta definisce una base comune che TypeScript non permette di istanziare direttamente. Puo contenere metodi concreti, stato condiviso e membri astratti che le sottoclassi concrete devono implementare.

E utile quando vuoi condividere comportamento runtime tra piu classi, non solo descrivere una forma come farebbe una `interface`.

## Quando usarlo

- Quando piu classi condividono logica concreta.
- Quando vuoi imporre metodi obbligatori alle sottoclassi.
- Quando serve stato comune nella classe base.
- Quando un framework richiede ereditarieta.
- Quando una gerarchia e stabile e intenzionale.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022.

Si dichiara con `abstract class`. I metodi astratti non hanno corpo; una derivata puo restare astratta e rimandarne l'implementazione. Solo la derivata concreta deve soddisfare tutti i membri richiesti.

`abstract` e i membri astratti vengono eliminati nell'emissione. La classe base, il suo costruttore e i suoi metodi concreti restano JavaScript. Il divieto di `new` e statico: non viene generato automaticamente un controllo runtime. Un consumatore JavaScript puo quindi istanziare la base emessa, ma chiamare un membro astratto mancante fallira.

## API / Sintassi

```ts
abstract class Repository<T> {
  abstract findById(id: string): Promise<T | null>;

  async exists(id: string): Promise<boolean> {
    return (await this.findById(id)) !== null;
  }
}

// new Repository<string>(); // Errore: classe astratta.
```

Il contratto usa `null` per l'assenza. La base puo chiamare `findById` nei suoi metodi, ma non ne fornisce l'implementazione. Un adapter concreto deve rispettare anche questa convenzione; non basta promettere un tipo e restituire `undefined` tramite un cast.

## Esempio pratico

Repository in memoria per mostrare riuso di logica, non accesso a un database:

```ts
type User = {
  id: string;
  email: string;
};

abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;

  async requireByEmail(email: string): Promise<User> {
    const user = await this.findByEmail(email);

    if (user === null) {
      throw new Error("User not found");
    }

    return user;
  }
}

class InMemoryUserRepository extends UserRepository {
  constructor(private readonly users: readonly User[]) {
    super();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }
}

const repository = new InMemoryUserRepository([
  { id: "u_1", email: "luca@example.com" },
]);

async function demo(): Promise<string> {
  const user = await repository.requireByEmail("luca@example.com");
  return user.id;
}
```

`await demo()` restituisce `"u_1"` in un contesto asincrono. Per una email assente, `requireByEmail` restituisce una Promise rifiutata con `Error("User not found")`; `findByEmail` restituisce invece `null`. Gli errori dell'adapter si propagano, non diventano automaticamente "utente assente".

La ricerca e esatta e case-sensitive. Non sono implementati normalizzazione email, autorizzazioni, persistenza o copie difensive: l'array readonly e una vista statica, e gli oggetti restituiti restano condivisi. L'esempio serve a verificare il contratto e il metodo concreto della base.

### Costruttori concreti e astratti

```ts
abstract class Renderer {
  abstract render(): string;
}

class PlainRenderer extends Renderer {
  override render(): string {
    return "contenuto";
  }
}

function createRenderer(Constructor: new () => Renderer): Renderer {
  return new Constructor();
}

const renderer = createRenderer(PlainRenderer);
console.log(renderer.render()); // contenuto
// createRenderer(Renderer); // Errore: il costruttore e astratto.

const RendererType: abstract new () => Renderer = Renderer;
// new RendererType(); // Errore: non autorizza l'istanziazione.
```

Il tipo `Renderer` descrive l'istanza; `new () => Renderer` descrive un costruttore concreto senza argomenti. Una firma `abstract new` puo rappresentare anche una classe astratta, ma non permette di costruirla direttamente. La firma deve riflettere gli argomenti realmente richiesti dai costruttori.

### Evitare hook nel costruttore base

Non chiamare metodi astratti o sovrascrivibili dal costruttore base per inizializzare la derivata: il dispatch raggiunge la derivata prima che i suoi campi siano pronti. Effettua l'operazione dopo `new`, oppure passa alla base i dati gia necessari. L'ordine e mostrato in [[Programmazione/TypeScript/Pagine/Classi|Classi]].

## Varianti

- **Classe astratta con soli metodi astratti**: la classe esiste a runtime, le sole firme astratte no.
- **Classe astratta con template method**: base definisce algoritmo, sottoclassi completano passaggi.
- **Classe astratta generica**: parametrizzata su tipo di dominio.
- **Interface**: alternativa se non serve codice condiviso.

## Errori comuni

- **Usare classi astratte dove basta una interface**: crea vincoli runtime non necessari.
- **Creare ereditarieta profonda**: difficile da mantenere.
- **Mettere troppa logica nella base**: rende le sottoclassi fragili.
- **Confondere contratto e riuso**: interface per contratto, abstract class per contratto piu implementazione.
- **Pensare che `abstract` generi eccezioni protettive**: il divieto di istanziare viene dal checker, non da una guardia aggiunta nel costruttore.

## Checklist

- Usare classi astratte solo se serve codice condiviso.
- Tenere la gerarchia corta.
- Rendere chiari i metodi astratti obbligatori.
- Evitare stato mutabile complesso nella base.
- Valutare composizione prima dell'ereditarieta.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Classi|Classi]]
- [[Programmazione/TypeScript/Pagine/Visibilita e modificatori di accesso|Visibilita e modificatori di accesso]]
- [[Programmazione/TypeScript/Pagine/Implementazione di interfacce|Implementazione di interfacce]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]


## Fonti

- [TypeScript: abstract classes and members](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members).
- [TypeScript 4.2: abstract construct signatures](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-2.html#abstract-construct-signatures).
- [MDN: public class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields), ordine di inizializzazione.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
