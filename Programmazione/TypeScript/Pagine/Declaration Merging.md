---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, declaration-merging, interfaces, ambient-declarations]
aliases: [Declaration merging TypeScript]
prerequisites: [Type Aliases e Interfaces, Dichiarazioni e file d.ts]
related: [Module augmentation, Namespace, Typing di librerie JavaScript]
---

# Declaration Merging

## Sintesi

Il **declaration merging** e il meccanismo con cui TypeScript combina dichiarazioni separate con lo stesso nome in un'unica dichiarazione.

E usato soprattutto con `interface`, namespace e dichiarazioni ambientali. E potente, ma va usato con cautela perche puo rendere meno esplicita l'origine di un tipo.

## Quando usarlo

- Estendere tipi di librerie esistenti.
- Aggiungere proprieta a oggetti globali.
- Modellare pattern JavaScript storici.
- Scrivere file `.d.ts`.
- Comprendere tipi di librerie che usano merging.

## Come funziona

Se due interface hanno lo stesso nome nello stesso scope, TypeScript le fonde. Il risultato contiene i membri di entrambe.

```ts
interface User {
  id: string;
}

interface User {
  email: string;
}

const user: User = {
  id: "u_1",
  email: "luca@example.com",
};
```

## API / Sintassi

```ts
interface Window {
  appVersion: string;
}

window.appVersion = "1.0.0";
```

## Esempio pratico

```ts
declare global {
  interface Window {
    analytics?: {
      track(event: string): void;
    };
  }
}

window.analytics?.track("page_view");
```

Questo pattern estende il tipo globale `Window`.

## Varianti

- **Interface merging**: piu interface con lo stesso nome.
- **Namespace merging**: namespace combinati o associati a funzioni/classi.
- **Global augmentation**: estensione di tipi globali.
- **Module augmentation**: estensione di tipi esportati da un modulo.

## Errori comuni

- **Creare collisioni accidentali di nomi**: due interface uguali si fondono.
- **Modificare globali senza controllo**: aumenta accoppiamento.
- **Usare merging quando basta esportare un tipo nuovo**: meno esplicito.
- **Dimenticare `export {}` nei file di augment globali**: puo cambiare lo scope del file.

## Checklist

- Usare declaration merging solo quando serve davvero estendere dichiarazioni esistenti.
- Tenere augment globali in file dedicati.
- Documentare perche un tipo viene esteso.
- Preferire tipi espliciti quando non serve augment.
- Testare che l'augment sia incluso dal `tsconfig`.

## Collegamenti

- [[Module augmentation]]
- [[Dichiarazioni e file d.ts]]
- [[Typing di librerie JavaScript]]
