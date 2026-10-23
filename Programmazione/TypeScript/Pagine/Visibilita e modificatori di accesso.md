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
  - access-modifiers
  - oop
aliases:
  - Visibilita e modificatori di accesso
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Classi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Classi astratte]]"
  - "[[Programmazione/TypeScript/Pagine/Implementazione di interfacce]]"
title: Visibilita e modificatori di accesso
---

# Visibilita e modificatori di accesso

## Sintesi

TypeScript usa `public`, `private` e `protected` per controllare l'accessibilita dei membri. `readonly` e invece un vincolo di scrittura, combinabile con la visibilita.

Questi vincoli sono statici. I campi JavaScript `#private` impongono invece un controllo di accesso anche a runtime. Nessuna delle due forme e cifratura o un sistema di autorizzazione.

## Quando usarlo

- Quando una classe ha stato interno da non esporre.
- Quando vuoi distinguere API pubblica e dettagli di implementazione.
- Quando una sottoclasse deve accedere a una parte protetta.
- Quando vuoi impedire riassegnazioni dopo il costruttore.
- Quando una classe rappresenta un oggetto di dominio con invarianti.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022.

| Sintassi | Controllo | Limite importante |
| --- | --- | --- |
| `public` | Accesso libero | Nessuna validazione |
| `private` | Accesso nella classe | Solo statico |
| `protected` | Accesso nelle derivate | Solo statico |
| `readonly` | Blocca riassegnazione | Non congela |
| `#value` | Privacy runtime | Non e una chiave stringa |

`public` e il default. `private` limita gli accessi diretti alla classe che dichiara il membro; `protected` li consente anche nelle derivate, con restrizioni sul tipo del receiver, non ai consumatori esterni. Il campo ordinario resta nel JavaScript emesso.

Per `readonly`, la scrittura e ammessa nella dichiarazione o nel costruttore della classe che dichiara il campo; i valori annidati possono restare mutabili. `#value` e invece un nome privato JavaScript, diverso dalla proprieta stringa `"#value"`.

I membri `private` e `protected` influenzano anche la compatibilita: due classi che dichiarano separatamente un membro privato omonimo non diventano compatibili solo perche hanno la stessa forma pubblica. E un limite importante alla regola della tipizzazione strutturale.

## API / Sintassi

```ts
class Progress {
  public readonly id: string;
  private value = 0;

  constructor(id: string) {
    this.id = id;
  }

  advance(delta: number): void {
    if (!Number.isFinite(delta) || delta < 0 || this.value + delta > 100) {
      throw new RangeError("Incremento non valido");
    }
    this.value += delta;
  }

  protected label(): string {
    return `${this.id}: ${this.value}%`;
  }
}

class ProgressSummary extends Progress {
  summary(): string {
    return this.label();
  }
}

const progress = new ProgressSummary("import");
progress.advance(25);
console.log(progress.summary()); // import: 25%
// progress.value; // Errore: private.
// progress.label(); // Errore: protected.
// progress.id = "other"; // Errore: readonly.
```

La sottoclasse usa un metodo protetto, non accede direttamente a `value`. Il controllo sugli incrementi e codice runtime esplicito, non un effetto di `private`. Da JavaScript il campo ordinario resta accessibile; TypeScript consente persino l'accesso con chiave letterale `progress["value"]` come via d'uscita per il suo `private`.

## Esempio pratico

Factory per un titolo locale, non per password o credenziali:

```ts
class NoteTitle {
  private constructor(public readonly value: string) {}

  static create(input: string): NoteTitle {
    const value = input.trim();
    if (value.length === 0 || value.length > 120) {
      throw new RangeError("Titolo vuoto o troppo lungo");
    }
    return new NoteTitle(value);
  }
}

console.log(NoteTitle.create("  Appunti  ").value); // Appunti
// new NoteTitle("bypass"); // Errore TypeScript: costruttore privato.
```

Il costruttore privato indirizza il codice TypeScript controllato verso la factory, ma JavaScript puo comunque chiamare il costruttore emesso. La factory assume una stringa gia acquisita correttamente e conta unita UTF-16 (`length`), non caratteri visivi. Per ingressi `unknown` occorre prima verificarne il tipo.

`public readonly value` e una *parameter property*: il compilatore genera l'assegnazione. Il solo type stripping non basta per questa sintassi; in un progetto che usa `erasableSyntaxOnly` usa un campo esplicito e `this.value = value`.

### Privacy runtime con `#`

```ts
class PrivateCounter {
  #value = 0;

  increment(): void {
    this.#value++;
  }

  read(): number {
    return this.#value;
  }
}

const counter = new PrivateCounter();
counter.increment();
console.log(counter.read()); // 1
console.log(Object.keys(counter)); // []
console.log(JSON.stringify(counter)); // {}
```

`#value` non viene enumerato o serializzato come una proprieta ordinaria. Accedere al nome privato fuori dal suo ambito e un errore di sintassi; invocare `read` su un oggetto privo del campo privato genera `TypeError`. Una sottoclasse non puo accedere direttamente al `#value` della base. I metodi pubblici possono comunque esporre il valore: non e un deposito sicuro di segreti.

### `readonly` e superficiale

```ts
class Preferences {
  readonly options = { compact: false };
}

const preferences = new Preferences();
preferences.options.compact = true; // Consentito.
// preferences.options = { compact: false }; // Errore statico.
console.log(Object.isFrozen(preferences.options)); // false
```

Il vincolo riguarda il riferimento `options`, non le sue proprieta. `readonly` viene eliminato nell'emissione; non equivale a `Object.freeze`, anch'esso superficiale per gli oggetti annidati.

## Varianti

- **`public`**: accessibile ovunque.
- **`private`**: controllo statico, inclusi accessi tra istanze della stessa classe.
- **`protected`**: accessibile nella classe e nelle sottoclassi.
- **`readonly`**: assegnabile solo in dichiarazione o costruttore.
- **`#private`**: privato JavaScript a runtime.

## Errori comuni

- **Conservare password in un campo `private` come misura di sicurezza**: non protegge il segreto; questa nota non implementa autenticazione o memorizzazione di credenziali.
- **Abusare di `protected`**: aumenta accoppiamento tra base e sottoclassi.
- **Rendere tutto pubblico**: espone dettagli e rende difficile cambiare implementazione.
- **Usare `readonly` pensando congeli oggetti annidati**: impedisce riassegnazione nel codice controllato, non mutazione profonda.

## Checklist

- Esporre solo metodi e proprieta che fanno parte dell'API.
- Rendere privato lo stato interno.
- Usare `readonly` per riferimenti che non devono essere riassegnati.
- Preferire `#private` se serve privacy runtime.
- Evitare gerarchie che dipendono troppo da `protected`.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Classi|Classi]]
- [[Programmazione/TypeScript/Pagine/Classi astratte|Classi astratte]]
- [[Programmazione/TypeScript/Pagine/Implementazione di interfacce|Implementazione di interfacce]]


## Fonti

- [TypeScript: Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html), visibilita e parameter properties.
- [TypeScript: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), membri privati e protetti.
- [MDN: private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements), comportamento JavaScript.
- [Node.js 24: TypeScript](https://nodejs.org/docs/latest-v24.x/api/typescript.html), limiti del type stripping.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
