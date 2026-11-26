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
  - solid
  - dipendenze
aliases:
  - Dependency Inversion Principle
  - DIP
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/SOLID]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]"
  - "[[Programmazione/Clean Code/Pagine/Confini tra moduli]]"
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
title: Dependency Inversion Principle
---

# Dependency Inversion Principle

## Sintesi

Il **Dependency Inversion Principle** (DIP) riguarda la direzione delle dipendenze nel **codice sorgente**. Il caso d'uso definisce il servizio di cui ha bisogno nel proprio linguaggio; l'adattatore conosce quel contratto e traduce il servizio concreto. A runtime il caso d'uso chiama comunque l'adattatore: non c'è contraddizione.

## Esempio: accodare un benvenuto

La politica applicativa richiede di saltare i contatti non verificati. Per un contatto verificato considera conclusa l'operazione solo quando il trasporto **accetta** il messaggio; non promette che sia stato consegnato. Due file TypeScript, con i percorsi di import dell'output JavaScript.

**`welcome.ts`: il caso d'uso e il suo contratto.**

```ts
export interface WelcomeQueue {
  enqueueWelcome(address: string): Promise<void>;
}

export async function welcome(
  contact: { address: string; verified: boolean },
  queue: WelcomeQueue,
): Promise<"skipped" | "queued"> {
  if (!contact.verified) return "skipped";
  await queue.enqueueWelcome(contact.address);
  return "queued";
}
```

**`mail-adapter.ts`: la traduzione verso il trasporto.**

```ts
import type { WelcomeQueue } from "./welcome.js";

type Transport = {
  submit(message: { to: string; template: string }): Promise<{ accepted: boolean }>;
};

export function mailQueue(transport: Transport): WelcomeQueue {
  return {
    async enqueueWelcome(address) {
      const result = await transport.submit({ to: address, template: "welcome" });
      if (!result.accepted) throw new Error("Messaggio non accettato");
    },
  };
}
```

All'avvio, il codice che compone l'applicazione costruisce `mailQueue(transport)` e lo passa a `welcome`. Solo quel punto deve conoscere entrambi i moduli. **Nel sorgente** l'adattatore importa il contratto da `welcome.ts`, non viceversa; **durante l'esecuzione** `welcome` invoca `enqueueWelcome` e questo invoca `submit`. Un rifiuto o un errore del trasporto non deve diventare `"queued"`.

## DIP, injection e limiti

Passare `SmtpClient` al costruttore sarebbe già *dependency injection*, ma se il caso d'uso richiedesse proprio quel tipo conoscerebbe ancora l'infrastruttura. Qui l'iniezione collega gli oggetti; il DIP decide **quale vocabolario può attraversare il confine**. Non servono un container né un'interfaccia per ogni funzione pura. Se il contratto espone ancora il tipo di risposta del provider, aver rinominato il client non risolve il problema.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/SOLID|SOLID]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]
- [[Programmazione/Clean Code/Pagine/Confini tra moduli|Confini tra moduli]]
- [[Programmazione/Clean Code/Pagine/Coesione e accoppiamento|Coesione e accoppiamento]]
- [[Programmazione/Clean Code/Pagine/Separazione delle responsabilita|Separazione delle responsabilita]]

## Fonti

- Robert C. Martin, [The Clean Architecture: The Dependency Rule](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- Martin Fowler, [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)
