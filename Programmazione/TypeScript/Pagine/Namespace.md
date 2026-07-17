---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, namespace, modules, legacy]
aliases: [Namespaces TypeScript]
prerequisites: [Moduli ES e CommonJS, Declaration Merging]
related: [Module augmentation, Dichiarazioni e file d.ts]
---

# Namespace

## Sintesi

I namespace sono un meccanismo TypeScript storico per organizzare codice e dichiarazioni sotto un nome comune.

Nei progetti moderni si preferiscono quasi sempre i moduli ES. I namespace restano importanti per capire vecchi progetti, file `.d.ts` e alcuni pattern di declaration merging.

## Quando usarlo

- Manutenzione di codice TypeScript legacy.
- Dichiarazioni `.d.ts` per librerie globali.
- Pattern storici senza module bundler.
- Merging con classi, funzioni o enum.
- Lettura di tipi complessi di vecchie librerie.

## Come funziona

Un namespace crea uno scope nominato. I membri devono essere esportati con `export` per essere accessibili dall'esterno.

## API / Sintassi

```ts
namespace MathUtils {
  export function sum(a: number, b: number): number {
    return a + b;
  }
}

MathUtils.sum(1, 2);
```

## Esempio pratico

```ts
function buildLabel(value: string): string {
  return buildLabel.prefix + value;
}

namespace buildLabel {
  export const prefix = "label:";
}

const label = buildLabel("user");
```

Questo mostra declaration merging tra funzione e namespace.

## Varianti

- **Internal namespace**: organizzazione dentro un progetto legacy.
- **Ambient namespace**: `declare namespace` in file `.d.ts`.
- **Namespace merging**: namespace associato a funzione, classe o enum.
- **ES modules**: alternativa moderna consigliata.

## Errori comuni

- **Usare namespace in nuovi progetti con moduli ES**: spesso non serve.
- **Confondere namespace e modulo**: i moduli sono basati su file/import/export.
- **Non esportare membri necessari**: restano privati al namespace.
- **Creare globali impliciti**: peggiora isolamento.

## Checklist

- Preferire moduli ES nei nuovi progetti.
- Usare namespace soprattutto per legacy o declaration files.
- Capire merging quando leggi tipi esistenti.
- Evitare namespace globali non necessari.
- Documentare quando un namespace serve per compatibilita.

## Collegamenti

- [[Moduli ES e CommonJS]]
- [[Declaration Merging]]
- [[Dichiarazioni e file d.ts]]
