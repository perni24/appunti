---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, classi, abstract-classes, oop]
aliases: [Abstract classes TypeScript]
prerequisites: [Classi, Visibilita e modificatori di accesso]
related: [Implementazione di interfacce, Generics]
---

# Classi astratte

## Sintesi

Una classe astratta definisce una base comune che non puo essere istanziata direttamente. Puo contenere metodi concreti, stato condiviso e metodi astratti che le sottoclassi devono implementare.

E utile quando vuoi condividere comportamento runtime tra piu classi, non solo descrivere una forma come farebbe una `interface`.

## Quando usarlo

- Quando piu classi condividono logica concreta.
- Quando vuoi imporre metodi obbligatori alle sottoclassi.
- Quando serve stato comune nella classe base.
- Quando un framework richiede ereditarieta.
- Quando una gerarchia e stabile e intenzionale.

## Come funziona

Si dichiara con `abstract class`. I metodi astratti non hanno corpo e devono essere implementati dalle sottoclassi concrete. I metodi normali, invece, possono essere ereditati.

## API / Sintassi

```ts
abstract class Repository<T> {
  abstract findById(id: string): Promise<T | null>;

  async exists(id: string): Promise<boolean> {
    return (await this.findById(id)) !== null;
  }
}
```

## Esempio pratico

```ts
type User = {
  id: string;
  email: string;
};

abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;

  async requireByEmail(email: string): Promise<User> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}
```

La classe base fornisce `requireByEmail`, mentre le implementazioni concrete decidono come cercare l'utente.

## Varianti

- **Classe astratta con soli metodi astratti**: simile a una interface, ma runtime.
- **Classe astratta con template method**: base definisce algoritmo, sottoclassi completano passaggi.
- **Classe astratta generica**: parametrizzata su tipo di dominio.
- **Interface**: alternativa se non serve codice condiviso.

## Errori comuni

- **Usare classi astratte dove basta una interface**: crea vincoli runtime non necessari.
- **Creare ereditarieta profonda**: difficile da mantenere.
- **Mettere troppa logica nella base**: rende le sottoclassi fragili.
- **Confondere contratto e riuso**: interface per contratto, abstract class per contratto piu implementazione.

## Checklist

- Usare classi astratte solo se serve codice condiviso.
- Tenere la gerarchia corta.
- Rendere chiari i metodi astratti obbligatori.
- Evitare stato mutabile complesso nella base.
- Valutare composizione prima dell'ereditarieta.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Classi|Classi]]
- [[Visibilita e modificatori di accesso]]
- [[Implementazione di interfacce]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]
