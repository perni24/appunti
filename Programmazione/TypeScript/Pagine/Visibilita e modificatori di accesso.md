---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: base
tags: [typescript, classi, access-modifiers, oop]
aliases: [Visibilita e modificatori di accesso]
prerequisites: [Classi]
related: [Classi astratte, Implementazione di interfacce]
---

# Visibilita e modificatori di accesso

## Sintesi

TypeScript aggiunge modificatori di accesso alle classi: `public`, `private`, `protected` e `readonly`. Servono a descrivere quali parti di una classe possono essere usate dall'esterno e quali devono restare interne.

La visibilita aiuta a mantenere invarianti e API piu chiare, ma non sostituisce automaticamente tutte le protezioni runtime.

## Quando usarlo

- Quando una classe ha stato interno da non esporre.
- Quando vuoi distinguere API pubblica e dettagli di implementazione.
- Quando una sottoclasse deve accedere a una parte protetta.
- Quando vuoi impedire riassegnazioni dopo il costruttore.
- Quando una classe rappresenta un oggetto di dominio con invarianti.

## Come funziona

`public` e il default. `private` impedisce l'accesso TypeScript fuori dalla classe. `protected` consente accesso alla classe e alle sottoclassi. `readonly` impedisce riassegnazione dopo l'inizializzazione.

JavaScript supporta anche campi privati runtime con `#field`, diversi da `private` TypeScript.

## API / Sintassi

```ts
class Account {
  public readonly id: string;
  private balance: number;

  constructor(id: string, initialBalance: number) {
    this.id = id;
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }
}
```

## Esempio pratico

```ts
class Password {
  private constructor(private readonly value: string) {}

  static create(value: string): Password {
    if (value.length < 8) {
      throw new Error("Password troppo corta");
    }

    return new Password(value);
  }

  matches(candidate: string): boolean {
    return this.value === candidate;
  }
}
```

Il costruttore privato forza la creazione tramite `Password.create`, dove viene applicata la validazione.

## Varianti

- **`public`**: accessibile ovunque.
- **`private`**: accessibile solo nella classe.
- **`protected`**: accessibile nella classe e nelle sottoclassi.
- **`readonly`**: assegnabile solo in dichiarazione o costruttore.
- **`#private`**: privato JavaScript a runtime.

## Errori comuni

- **Usare `private` pensando sia sempre runtime-private**: `private` e soprattutto controllo TypeScript; `#private` e runtime.
- **Abusare di `protected`**: aumenta accoppiamento tra base e sottoclassi.
- **Rendere tutto pubblico**: espone dettagli e rende difficile cambiare implementazione.
- **Usare `readonly` pensando congeli oggetti annidati**: impedisce riassegnazione, non mutazione profonda.

## Checklist

- Esporre solo metodi e proprieta che fanno parte dell'API.
- Rendere privato lo stato interno.
- Usare `readonly` per identita e dipendenze immutabili.
- Preferire `#private` se serve privacy runtime.
- Evitare gerarchie che dipendono troppo da `protected`.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Classi|Classi]]
- [[Classi astratte]]
- [[Implementazione di interfacce]]
