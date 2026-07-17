---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, definitelytyped, at-types, typings]
aliases: [DefinitelyTyped, "@types"]
prerequisites: [Dichiarazioni e file d.ts, Typing di librerie JavaScript]
related: [Declaration Merging, Module augmentation]
---

# DefinitelyTyped

## Sintesi

**DefinitelyTyped** e il repository community che ospita dichiarazioni TypeScript per librerie JavaScript che non includono tipi propri.

I pacchetti vengono pubblicati su npm con nome `@types/nome-pacchetto`.

## Quando usarlo

- Quando una libreria JavaScript non include tipi.
- Quando TypeScript segnala che mancano declaration files.
- Quando vuoi contribuire correzioni ai tipi di una libreria.
- Quando usi librerie legacy molto diffuse.
- Quando vuoi capire come vengono modellate API JavaScript complesse.

## Come funziona

Se installi `@types/lodash`, TypeScript usa quelle dichiarazioni per tipizzare `lodash`. Molti pacchetti `@types` vengono inclusi automaticamente se si trovano in `node_modules/@types`, salvo configurazioni specifiche come `types` o `typeRoots`.

## API / Sintassi

```bash
npm install --save-dev @types/lodash
```

## Esempio pratico

```ts
import debounce from "lodash/debounce";

const save = debounce(() => {
  console.log("saved");
}, 300);
```

Con i tipi installati, TypeScript conosce parametri e ritorno di `debounce`.

## Varianti

- **Tipi inclusi nella libreria**: non serve `@types`.
- **Pacchetto `@types`**: tipi da DefinitelyTyped.
- **Dichiarazione locale**: fallback per librerie non coperte.
- **Contributo upstream**: correzione al repository dei tipi.

## Errori comuni

- **Installare `@types` quando il pacchetto ha gia tipi**: puo creare conflitti.
- **Versione dei tipi non allineata alla libreria**: possibili errori o API mancanti.
- **Pensare che `@types` aggiunga codice runtime**: aggiunge solo tipi.
- **Usare `skipLibCheck` per nascondere incompatibilita reali**: utile a volte, ma da capire.

## Checklist

- Controllare se la libreria include gia tipi.
- Installare `@types/*` come dev dependency.
- Verificare compatibilita tra versione libreria e tipi.
- Scrivere tipi locali solo se non esiste pacchetto affidabile.
- Contribuire fix se un tipo community e sbagliato.

## Collegamenti

- [[Typing di librerie JavaScript]]
- [[Dichiarazioni e file d.ts]]
- [[Module augmentation]]
- https://github.com/DefinitelyTyped/DefinitelyTyped
