---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, interfaces, implements, oop]
aliases: [implements TypeScript]
prerequisites: [Type Aliases e Interfaces, Classi]
related: [Classi, Classi astratte, Generics]
---

# Implementazione di interfacce

## Sintesi

Una classe puo usare `implements` per dichiarare che rispetta una o piu interfacce. Questo permette di separare il contratto dalla classe concreta.

L'interfaccia descrive cosa deve essere disponibile; la classe decide come implementarlo.

## Quando usarlo

- Quando vuoi dipendere da un contratto invece che da una classe concreta.
- Quando piu classi devono offrire la stessa API.
- Quando applichi dependency injection.
- Quando vuoi rendere testabile un servizio.
- Quando vuoi separare dominio, infrastruttura e implementazioni concrete.

## Come funziona

`implements` obbliga la classe a fornire le proprieta e i metodi richiesti dall'interfaccia. TypeScript verifica la compatibilita in modo strutturale: conta la forma, non il nome nominale della classe.

L'interfaccia non esiste a runtime, quindi non puo essere usata direttamente con `instanceof`.

## API / Sintassi

```ts
interface Logger {
  info(message: string): void;
  error(message: string): void;
}

class ConsoleLogger implements Logger {
  info(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }
}
```

## Esempio pratico

```ts
interface EmailSender {
  send(to: string, subject: string): Promise<void>;
}

class SmtpEmailSender implements EmailSender {
  async send(to: string, subject: string): Promise<void> {
    console.log(`Sending ${subject} to ${to}`);
  }
}

async function notify(sender: EmailSender): Promise<void> {
  await sender.send("luca@example.com", "Benvenuto");
}
```

`notify` dipende dall'interfaccia, quindi puo ricevere implementazioni diverse.

## Varianti

- **Classe che implementa una interface**: `class A implements B`.
- **Classe che implementa piu interfacce**: `implements A, B`.
- **Interface generica**: `interface Repository<T>`.
- **Classe astratta**: alternativa quando serve codice condiviso.

## Errori comuni

- **Pensare che `implements` cambi il runtime**: e solo controllo statico.
- **Usare `instanceof Interface`**: impossibile, perche l'interfaccia non esiste a runtime.
- **Interfacce troppo grandi**: rendono le classi difficili da implementare e testare.
- **Confondere `extends` e `implements`**: una classe estende un'altra classe, ma implementa interfacce.

## Checklist

- Usare interfacce piccole e focalizzate.
- Dipendere dal contratto quando serve flessibilita.
- Non usare `implements` se una classe concreta basta.
- Ricordare che il controllo e strutturale.
- Usare type guard runtime se devi distinguere valori a runtime.

## Collegamenti

- [[Type Aliases e Interfaces]]
- [[Programmazione/TypeScript/Pagine/Classi|Classi]]
- [[Classi astratte]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]
