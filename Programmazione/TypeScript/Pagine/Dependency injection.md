---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, dependency-injection, architecture, testing]
aliases: [DI TypeScript, Iniezione dipendenze]
prerequisites: [Implementazione di interfacce, Classi]
related: [Pattern Repository e Service, Clean architecture, Testing in TypeScript]
---

# Dependency injection

## Sintesi

La dependency injection consiste nel passare a una classe o funzione le dipendenze di cui ha bisogno, invece di crearle internamente.

In TypeScript migliora testabilita, separazione delle responsabilita e sostituzione di implementazioni, soprattutto in backend e architetture a servizi.

## Quando usarlo

- Service che dipendono da repository.
- Client esterni sostituibili.
- Test con fake o mock.
- Applicazioni con piu implementazioni.
- Clean architecture o ports/adapters.

## Come funziona

La dipendenza viene passata tramite costruttore, parametro funzione o container DI. Il codice dipende da un'interfaccia o tipo astratto, non da una classe concreta.

## API / Sintassi

```ts
interface Clock {
  now(): Date;
}

class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
```

## Esempio pratico

```ts
interface Mailer {
  send(to: string, subject: string): Promise<void>;
}

class NotificationService {
  constructor(private readonly mailer: Mailer) {}

  async welcome(email: string): Promise<void> {
    await this.mailer.send(email, "Benvenuto");
  }
}
```

Nei test puoi passare un `Mailer` fake senza inviare email reali.

## Varianti

- **Constructor injection**.
- **Function parameter injection**.
- **Factory injection**.
- **DI container**.
- **Manual wiring** nel composition root.

## Errori comuni

- **Usare container DI per tutto**: spesso basta passare parametri.
- **Dipendere da classi concrete invece che contratti**.
- **Nascondere dipendenze globali**.
- **Creare interfacce inutili per ogni classe**.

## Checklist

- Passare dipendenze esplicitamente.
- Usare interfacce dove serve sostituibilita.
- Tenere wiring in un punto chiaro.
- Usare fake nei test.
- Evitare container se il progetto e piccolo.

## Collegamenti

- [[Implementazione di interfacce]]
- [[Pattern Repository e Service]]
- [[Clean architecture]]
- [[Testing in TypeScript]]
