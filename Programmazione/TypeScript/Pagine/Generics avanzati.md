---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, generics, type-system, advanced-types]
aliases: [Advanced generics TypeScript]
prerequisites: [Generics, Conditional Types, Keyof e typeof]
related: [Utility Types, Mapped Types, Infer nei Conditional Types]
---

# Generics avanzati

## Sintesi

I generics avanzati usano vincoli, parametri multipli, default, `keyof`, conditional types e inferenza per costruire API riutilizzabili senza perdere precisione.

La regola pratica e semplice: un generic e utile quando collega piu parti del tipo, per esempio input e output, chiave e valore, payload e risultato.

## Quando usarlo

- API che preservano il tipo dell'input.
- Helper per leggere proprieta da oggetti.
- Repository, cache, client HTTP o SDK tipizzati.
- Utility type riutilizzabili.
- Componenti o funzioni con vincoli tra parametri.

## Come funziona

Un generic puo avere un constraint con `extends`, un valore default e piu parametri collegati tra loro. TypeScript usa il contesto della chiamata per inferire i parametri di tipo.

## API / Sintassi

```ts
function getProperty<TObject, TKey extends keyof TObject>(
  object: TObject,
  key: TKey
): TObject[TKey] {
  return object[key];
}
```

## Esempio pratico

```ts
type Entity = {
  id: string;
};

class Repository<T extends Entity> {
  private items = new Map<string, T>();

  save(item: T): void {
    this.items.set(item.id, item);
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }
}

type User = Entity & {
  email: string;
};

const users = new Repository<User>();
users.save({ id: "u_1", email: "luca@example.com" });
```

Il vincolo `T extends Entity` permette al repository di usare `id` senza conoscere tutti gli altri campi dell'entita.

## Varianti

- **Constraint**: `T extends SomeType`.
- **Default type parameter**: `<T = string>`.
- **Parametri collegati**: `<TObject, TKey extends keyof TObject>`.
- **Generic su classi/interfacce**: `Repository<T>`.
- **Generic con conditional types**: tipo risultato dipendente da input.

## Errori comuni

- **Usare generics decorativi**: se `T` non collega nulla, spesso non serve.
- **Vincolare troppo presto**: constraint rigidi riducono riuso.
- **Usare `any` dentro un generic**: rompe la precisione che il generic dovrebbe preservare.
- **Rendere API semplici troppo astratte**: peggiora leggibilita.

## Checklist

- Verificare che ogni parametro generico abbia uno scopo.
- Usare constraint solo quando servono proprieta specifiche.
- Preferire inferenza alla specifica manuale del tipo.
- Dare nomi espliciti quando i parametri sono molti.
- Testare i casi limite con chiamate reali.

## Collegamenti

- [[Generics]]
- [[Conditional Types]]
- [[Keyof e typeof]]
- [[Utility Types]]
