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
  - oop
aliases:
  - Classi TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
  - "[[Programmazione/TypeScript/Pagine/Funzioni tipizzate]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Visibilita e modificatori di accesso]]"
  - "[[Programmazione/TypeScript/Pagine/Classi astratte]]"
  - "[[Programmazione/TypeScript/Pagine/Implementazione di interfacce]]"
title: Classi
---

# Classi

## Sintesi

Le classi in TypeScript estendono le classi JavaScript aggiungendo tipi per proprieta, costruttori, metodi, visibilita e implementazione di interfacce.

Sono utili quando vuoi modellare oggetti con stato e comportamento, soprattutto in domini dove identita, invarianti e metodi hanno un ruolo importante.

## Quando usarlo

- Modelli di dominio con stato e comportamento.
- Servizi applicativi con dipendenze nel costruttore.
- Wrapper attorno ad API, client o risorse.
- Codice orientato a oggetti gia presente in JavaScript.
- Integrazione con framework o librerie che usano classi.

## Come funziona

Esempi indipendenti verificati con TypeScript 5.9.3, `strict: true` e target ES2022. Questa e la baseline dei test, non un'indicazione dell'ultima versione disponibile.

Una classe dichiara campi, costruttore e metodi. I controlli sui tipi non validano automaticamente i valori ricevuti da JavaScript o dalla rete. Con `strictPropertyInitialization` il checker richiede un'inizializzazione riconoscibile per i campi che non ammettono `undefined`; l'opzione e inclusa in `strict`, salvo override.

La classe esiste a runtime; le annotazioni vengono eliminate. `User` in posizione di tipo indica un'istanza; `typeof User` indica il costruttore e i membri statici. I metodi normali sono condivisi sul prototipo, mentre i campi appartengono alle singole istanze.

## API / Sintassi

```ts
class User {
  id: string;
  email: string;

  constructor(id: string, email: string) {
    this.id = id;
    this.email = email;
  }

  label(): string {
    return `${this.email} (${this.id})`;
  }

  static createGuest(): User {
    return new User("guest", "guest@example.com");
  }
}

const UserConstructor: typeof User = User;
const user: User = UserConstructor.createGuest();
console.log(user.label()); // guest@example.com (guest)
// user.createGuest(); // Errore: il metodo appartiene al costruttore.
```

Per una classe con soli membri pubblici compatibili, un oggetto ordinario puo soddisfare il tipo dell'istanza senza essere `instanceof User`. L'annotazione non cambia il prototipo del valore.

## Esempio pratico

Timer locale con orologio iniettabile. Il default usa `performance.now()` per misurare intervalli, non `Date.now()` che segue l'orologio civile e puo essere corretto:

```ts
class Timer {
  private startedAt: number | null = null;

  constructor(
    private readonly now: () => number = () => performance.now(),
  ) {}

  start(): void {
    this.startedAt = this.now();
  }

  elapsedMs(): number {
    if (this.startedAt === null) {
      return 0;
    }

    return this.now() - this.startedAt;
  }
}

let clock = 100;
const timer = new Timer(() => clock);
console.log(timer.elapsedMs()); // 0: non avviato.
timer.start();
clock = 145;
console.log(timer.elapsedMs()); // 45
```

Ogni `start()` riparte da zero; non ci sono pausa o accumulo. Un clock personalizzato deve restituire millisecondi finiti e non decrescenti: il tipo `() => number` non dimostra queste proprieta. `private readonly now` nel costruttore e una *parameter property*: crea e inizializza un campo, non e una semplice annotazione.

### Inizializzazione e asserzione `!`

```ts
class DeferredLabel {
  label!: string;
}

const deferred = new DeferredLabel();
console.log(deferred.label); // undefined, nonostante il tipo string.
// deferred.label.toUpperCase(); // Compila, ma genera TypeError.
```

`!` disattiva il controllo di assegnazione definitiva, non assegna un valore. Preferisci un inizializzatore, l'assegnazione nel costruttore oppure un tipo `string | undefined` con controllo prima dell'uso. Chiamare un metodo di inizializzazione dal costruttore non basta in generale al checker per dimostrare l'assegnazione.

### Metodi passati come callback

```ts
class Counter {
  value = 2;

  read(this: Counter): number {
    return this.value;
  }

  readBound = (): number => this.value;
}

const counter = new Counter();
const detached = counter.read;
// detached(); // Errore: manca il receiver richiesto dal parametro this.
const bound = counter.read.bind(counter);
const arrow = counter.readBound;
console.log(bound(), arrow()); // 2 2
```

Il parametro speciale `this` e eliminato nel JavaScript: controlla la chiamata, non fa binding. Per una callback usa `bind`, una closure o un campo arrow. Quest'ultimo cattura `this`, ma crea una funzione per istanza. Anche senza annotazione esplicita di `this`, estrarre un metodo normale puo perdere il receiver a runtime.

### Ereditarieta e ordine dei campi

```ts
class BaseLabel {
  label = "base";

  constructor() {
    console.log(this.label);
  }
}

class CustomLabel extends BaseLabel {
  override label = "custom";
}

const custom = new CustomLabel(); // Stampa base.
console.log(custom.label); // custom
```

Ordine: campi della base, costruttore della base, campi della derivata, corpo del costruttore della derivata. In un costruttore derivato serve `super()` prima di usare `this`. Evita chiamate a metodi sovrascrivibili nel costruttore base: potrebbero leggere stato derivato non ancora pronto.

`override` verifica che il membro esista nella base, non cambia quest'ordine. `noImplicitOverride` richiede di dichiarare gli override dei membri concreti e non e attivato automaticamente da `strict`.

### Ridichiarare solo un tipo con `declare`

```ts
type Entry = { id: string };
type DetailedEntry = Entry & { title: string };

class EntryHolder {
  entry: Entry;
  constructor(entry: Entry) {
    this.entry = entry;
  }
}

class DetailedHolder extends EntryHolder {
  declare entry: DetailedEntry;
  constructor(entry: DetailedEntry) {
    super(entry);
  }
}

console.log(new DetailedHolder({ id: "n_1", title: "Appunti" }).entry.title);
```

Con la semantica standard dei campi (`useDefineForClassFields`, default con target ES2022), un nuovo campo derivato puo sovrascrivere quello inizializzato dalla base. `declare` non emette un campo: restringe solo il tipo. Qui il costruttore passa davvero un `DetailedEntry`; `declare` da solo non verifica questa garanzia a runtime.

## Varianti

- **Classe semplice**: stato e metodi.
- **Classe con ereditarieta**: `extends`.
- **Classe che implementa interfacce**: `implements`.
- **Classe astratta**: base non istanziabile tramite codice TypeScript controllato.
- **Classe con generics**: tipo parametrico per stato o metodi.

## Errori comuni

- **Usare classi per semplici record dati**: spesso basta un oggetto tipizzato.
- **Mettere troppa logica nel costruttore**: rende difficile test e gestione errori.
- **Ignorare inizializzazione delle proprieta**: con `strictPropertyInitialization` attivo TypeScript segnala il problema.
- **Confondere tipo della classe e valore della classe**: una classe e sia tipo dell'istanza sia valore runtime.
- **Usare `!` come inizializzazione o `override` come binding**: non fanno nessuna delle due cose.

## Checklist

- Usare classi quando servono stato e comportamento insieme.
- Tenere invarianti interne protette.
- Preferire composizione a ereditarieta profonda.
- Inizializzare sempre le proprieta.
- Valutare se `type` o `interface` bastano per dati semplici.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Visibilita e modificatori di accesso|Visibilita e modificatori di accesso]]
- [[Programmazione/TypeScript/Pagine/Classi astratte|Classi astratte]]
- [[Programmazione/TypeScript/Pagine/Implementazione di interfacce|Implementazione di interfacce]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]


## Fonti

- [TypeScript: Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html), classi, `this` e dichiarazioni type-only.
- [TSConfig: strictPropertyInitialization](https://www.typescriptlang.org/tsconfig/strictPropertyInitialization.html), [useDefineForClassFields](https://www.typescriptlang.org/tsconfig/useDefineForClassFields.html) e [noImplicitOverride](https://www.typescriptlang.org/tsconfig/noImplicitOverride.html).
- [MDN: public class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields), semantica di inizializzazione.
- [MDN: performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now), misurazione monotona degli intervalli.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
