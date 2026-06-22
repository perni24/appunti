---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, module-augmentation, declaration-merging, dts]
aliases: [Augmentazione moduli TypeScript]
prerequisites: [Declaration Merging, Moduli ES e CommonJS]
related: [Dichiarazioni e file d.ts, Typing di librerie JavaScript]
---

# Module augmentation

## Sintesi

La **module augmentation** permette di estendere le dichiarazioni di tipo esportate da un modulo esistente.

E utile quando una libreria prevede plugin, patch o estensioni, oppure quando devi aggiungere informazioni di tipo a un modulo che viene modificato a runtime.

## Quando usarlo

- Estendere tipi di librerie con plugin.
- Aggiungere metodi a prototipi o istanze fornite da moduli.
- Tipizzare integrazioni non coperte dai tipi originali.
- Modellare framework che permettono augmentation.
- Correggere localmente tipi incompleti.

## Come funziona

Si usa `declare module "nome-modulo"` e si ridichiara l'interfaccia o il tipo esportato da estendere. TypeScript fonde le dichiarazioni.

## API / Sintassi

```ts
declare module "some-library" {
  interface Options {
    customFlag?: boolean;
  }
}
```

## Esempio pratico

```ts
// express.d.ts
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}
```

Il tipo `Request` viene esteso per includere `user`, spesso aggiunto da middleware di autenticazione.

## Varianti

- **Module augmentation**: estende un modulo importabile.
- **Global augmentation**: estende tipi globali.
- **Patch di tipi locali**: corregge tipi non aggiornati.
- **Plugin typing**: aggiunge API in base a plugin installati.

## Errori comuni

- **Augmentare il modulo sbagliato**: molte librerie riesportano tipi da pacchetti interni.
- **Dimenticare di includere il file `.d.ts` nel progetto**.
- **Usare augmentation per nascondere design poco chiaro**.
- **Credere che aggiunga runtime code**: modifica solo i tipi.

## Checklist

- Verificare il modulo esatto da augmentare.
- Mettere l'augmentation in un file dedicato.
- Assicurarsi che il file sia incluso dal `tsconfig`.
- Documentare quale runtime code aggiunge davvero la proprieta.
- Preferire tipi locali se non serve estendere una libreria.

## Collegamenti

- [[Declaration Merging]]
- [[Dichiarazioni e file d.ts]]
- [[Typing di librerie JavaScript]]
