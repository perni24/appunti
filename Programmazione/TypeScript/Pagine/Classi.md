---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, classi, oop]
aliases: [Classi TypeScript]
prerequisites: [Type Aliases e Interfaces, Funzioni tipizzate]
related: [Visibilita e modificatori di accesso, Classi astratte, Implementazione di interfacce]
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

Una classe puo dichiarare proprieta, costruttore e metodi. TypeScript controlla che le proprieta siano inizializzate, che i metodi ricevano parametri corretti e che le istanze rispettino la forma dichiarata.

La classe esiste anche a runtime: a differenza di `type` e `interface`, produce codice JavaScript.

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
}
```

## Esempio pratico

```ts
class Timer {
  private startedAt: number | null = null;

  start(): void {
    this.startedAt = Date.now();
  }

  elapsedMs(): number {
    if (this.startedAt === null) {
      return 0;
    }

    return Date.now() - this.startedAt;
  }
}
```

La classe incapsula lo stato interno `startedAt` e offre metodi pubblici per usarlo.

## Varianti

- **Classe semplice**: stato e metodi.
- **Classe con ereditarieta**: `extends`.
- **Classe che implementa interfacce**: `implements`.
- **Classe astratta**: base non istanziabile.
- **Classe con generics**: tipo parametrico per stato o metodi.

## Errori comuni

- **Usare classi per semplici record dati**: spesso basta un oggetto tipizzato.
- **Mettere troppa logica nel costruttore**: rende difficile test e gestione errori.
- **Ignorare inizializzazione delle proprieta**: con `strictPropertyInitialization` attivo TypeScript segnala il problema.
- **Confondere tipo della classe e valore della classe**: una classe e sia tipo dell'istanza sia valore runtime.

## Checklist

- Usare classi quando servono stato e comportamento insieme.
- Tenere invarianti interne protette.
- Preferire composizione a ereditarieta profonda.
- Inizializzare sempre le proprieta.
- Valutare se `type` o `interface` bastano per dati semplici.

## Collegamenti

- [[Visibilita e modificatori di accesso]]
- [[Classi astratte]]
- [[Implementazione di interfacce]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]
