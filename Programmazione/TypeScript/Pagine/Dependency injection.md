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
  - dependency-injection
  - architecture
  - testing
aliases:
  - DI TypeScript
  - Iniezione dipendenze
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Implementazione di interfacce]]"
  - "[[Programmazione/TypeScript/Pagine/Classi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Pattern Repository e Service]]"
  - "[[Programmazione/TypeScript/Pagine/Clean architecture]]"
  - "[[Programmazione/TypeScript/Pagine/Testing in TypeScript]]"
title: Dependency injection
---

# Dependency injection

## Sintesi

La dependency injection consiste nel **ricevere le collaborazioni dall'esterno**, invece di costruirle o cercarle dentro il codice che le usa. Una funzione passata come parametro e gia una forma di DI: non servono necessariamente classi, decorator o container.

Baseline: **TypeScript 5.9.3**, `strict: true`, target **ES2022**, **Node 24.14.0**.

## Quando usarlo

- Repository, servizi esterni, clock e generatori di ID.
- Test deterministici senza invii o chiamate di rete reali.
- Implementazioni da selezionare alla composizione dell'app.
- Gestione esplicita di dipendenze con durata e risorse proprie.

Evita di introdurre un'interfaccia per ogni classe senza un confine utile. Anche ricevere una classe concreta e DI; il grado di accoppiamento dipende dal contratto scelto.

## Come funziona

Il **composition root** e il punto esterno che crea gli oggetti e li collega. Chi usa una dipendenza non decide automaticamente come costruirla, quanto deve vivere o chi deve chiuderla.

Distinzioni utili:

- **Dependency injection**: il meccanismo con cui ricevi una collaborazione.
- **Dependency inversion**: la direzione delle dipendenze tra policy e dettagli.
- **Service locator**: il componente cerca una dipendenza in un registro; tende a nascondere cio che serve per usarlo.
- **Container**: automatizza parte della costruzione e delle durate; non rende corretta l'architettura da solo.

Le interface TypeScript vengono eliminate nell'output. Un container runtime non puo usare direttamente il nome di un'interfaccia come valore: servono token reali, per esempio Symbol, stringhe o classi, secondo l'API del framework.

## API / Sintassi

I tre blocchi TS seguenti costituiscono un unico modulo.

```ts
interface Clock {
  now(): Date;
}

class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

type Message = Readonly<{
  to: string;
  subject: string;
  createdAt: string;
}>;

interface Mailer {
  send(message: Message): Promise<void>;
}
```

Il contratto del clock richiede una Date valida; il mailer segnala un fallimento rifiutando la Promise. La firma, da sola, non specifica retry, idempotenza o consegna esattamente una volta.

## Esempio pratico

### Service e test double

```ts
class NotificationService {
  constructor(
    private readonly mailer: Mailer,
    private readonly clock: Clock,
  ) {}

  async welcome(email: string): Promise<void> {
    await this.mailer.send({
      to: email,
      subject: "Benvenuto",
      createdAt: this.clock.now().toISOString(),
    });
  }
}

class RecordingMailer implements Mailer {
  #messages: Message[] = [];

  async send(message: Message): Promise<void> {
    this.#messages.push({ ...message });
  }

  get messages(): readonly Message[] {
    return this.#messages.map((message) => ({ ...message }));
  }
}
```

RecordingMailer e **solo un test double in memoria**. Non invia posta. Il service assume un destinatario gia validato dal livello precedente: un parametro string non verifica formato o possesso della casella.

### Composizione deterministica

```ts
async function demoNotifications(): Promise<readonly Message[]> {
  const mailer = new RecordingMailer();
  const clock: Clock = {
    now: () => new Date("2026-01-01T00:00:00.000Z"),
  };
  const service = new NotificationService(mailer, clock);

  await service.welcome("ada@example.test");
  return mailer.messages;
}
```

Da un entry point ESM o test asincrono, `await demoNotifications()` restituisce un messaggio con data fissa. Il test puo controllarne i campi e verificare che un mailer che rifiuta faccia rifiutare anche welcome.

Per il tempo reale puoi costruire SystemClock nel composition root. Non cambiare il service e non leggere new Date direttamente al suo interno: altrimenti il clock iniettato diventerebbe inutile.

## Varianti

### Modalita di passaggio

- **Constructor injection**: dipendenze necessarie per l'intera vita dell'oggetto.
- **Parametro funzione**: utile per collaborazioni locali o funzioni pure.
- **Factory**: crea un componente con dipendenze gia legate, senza richiedere una classe.
- **Setter/property injection**: utile in casi specifici, ma puo lasciare l'oggetto parzialmente inizializzato.
- **Container**: sensato con grafi e lifecycle complessi; partire da wiring manuale spesso rende il contratto piu chiaro.

Se passi un metodo come callback, considera il binding di this. Un wrapper come `() => clock.now()` conserva il ricevente, mentre passare `clock.now` puo perderlo.

### Durata e risorse

- **Singleton**: condiviso per l'app; non deve trattenere dati privati di una singola richiesta.
- **Request-scoped**: specifico di una richiesta o unita di lavoro.
- **Transient**: nuova istanza per ogni costruzione, non necessariamente un nuovo processo o thread.
- **Owner delle risorse**: chi crea pool, connessioni e timer deve avere una politica di chiusura. Un service che riceve un pool condiviso non dovrebbe chiuderlo dopo ogni chiamata.

Non catturare una dipendenza request-scoped dentro un singleton: puo diventare una dipendenza con durata sbagliata. I dettagli dei container e dei decorator variano; non mescolare configurazioni legacy e decorator standard senza verificare il framework.

## Errori comuni

- Interfaccia usata come token runtime nonostante la sua cancellazione.
- Service che riceve una dipendenza ma poi ne costruisce un'altra internamente.
- Fake che restituisce sempre successo, nascondendo il contratto di fallimento.
- Container globale consultato ovunque.
- Mutazione condivisa tra test o richieste.
- Confondere Promise risolta del provider con prova di consegna al destinatario.

## Checklist

- Dipendenze visibili nella firma o nel costruttore.
- Composizione separata dall'uso.
- Tempo, ID e I/O sostituibili dove serve determinismo.
- Fallimenti e durata delle risorse documentati.
- Test double identificato come tale.
- Test d'integrazione separati dell'adapter esterno.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Implementazione di interfacce|Implementazione di interfacce]]
- [[Programmazione/TypeScript/Pagine/Pattern Repository e Service|Pattern Repository e Service]]
- [[Programmazione/TypeScript/Pagine/Clean architecture|Clean architecture]]
- [[Programmazione/TypeScript/Pagine/Testing in TypeScript|Testing in TypeScript]]
- [[Programmazione/TypeScript/Pagine/Decorators|Decorators]]

## Fonti

- [Martin Fowler: injection, container e service locator](https://martinfowler.com/articles/injection.html).
- [TypeScript: classi e contratti](https://www.typescriptlang.org/docs/handbook/2/classes.html).
- [TypeScript: tipi e cancellazione delle annotazioni](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
