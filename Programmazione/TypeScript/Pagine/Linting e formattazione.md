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
  - eslint
  - prettier
  - linting
  - formatting
aliases:
  - Linting TypeScript
  - Formattazione TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Best Practices]]"
  - "[[Programmazione/TypeScript/Pagine/Strict mode]]"
title: Linting e formattazione
---

# Linting e formattazione

## Sintesi

**Type checking, linting e formattazione sono controlli diversi**. `tsc` controlla i contratti statici; ESLint cerca i problemi descritti dalle regole attive; Prettier uniforma la rappresentazione del codice. Nessuno dei tre dimostra la correttezza applicativa.

Baseline: **TypeScript 5.9.3**, **Node 24.14.0**, **ESLint 10.13.0**, **typescript-eslint 8.72.0**, **Prettier 3.9.10**. L'esempio usa flat config; non va copiato in un vecchio `.eslintrc`.

## Quando usarlo

- Feedback nell'editor e controlli ripetibili in CI.
- Gestione delle Promise e degli usi rischiosi di `any`.
- Code review concentrata sul comportamento, non sulla spaziatura.
- Regole condivise tra package, con configurazioni dei tipi coerenti.

## Come funziona

Le regole sintattiche leggono l'albero del codice. Quelle **type-aware** interrogano anche TypeScript: `projectService: true` associa i file al progetto TS, con un costo aggiuntivo.

Il preset recommendedTypeChecked non e una prova completa di sicurezza e puo cambiare con gli aggiornamenti. Congela versioni e lockfile; valuta le nuove diagnostiche quando aggiorni.

In particolare, **`void save()` non cattura un rifiuto**: scarta soltanto il valore dell'espressione. La regola no-floating-promises puo accettarlo per impostazione predefinita. Nel demo `ignoreVoid: false` rende esplicita una politica piu restrittiva; serve comunque un comportamento runtime sensato.

## API / Sintassi

Demo autonomo per sorgenti Node in `src/`. `package.json`:

```json
{
  "name": "typescript-lint-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "tsc --noEmit",
    "lint": "eslint src --max-warnings 0",
    "format:check": "prettier --check src",
    "format": "prettier --write src"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "@types/node": "24.19.2",
    "eslint": "10.13.0",
    "@eslint/js": "10.0.1",
    "typescript-eslint": "8.72.0",
    "prettier": "3.9.10"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

`eslint.config.mjs`:

```js
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/**", "coverage/**"] },
  {
    files: ["src/**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: false },
      ],
    },
  },
);
```

`import.meta.dirname` e disponibile nella baseline Node indicata. La configurazione applica il preset solo ai file TS di `src`; non dichiara di controllare anche test, JS, JSX o tutti i workspace.

Per estendere il perimetro allinea `files`, script e tsconfig. Un file fuori progetto puo generare un errore del parser type-aware: non disabilitare i controlli globalmente per nasconderlo.

## Esempio pratico

`src/save.ts` riceve una dipendenza asincrona e attende il suo completamento:

```ts
export async function save(
  persist: () => Promise<void>,
): Promise<"saved" | "failed"> {
  try {
    await persist();
    return "saved";
  } catch {
    return "failed";
  }
}
```

Il contratto del demo converte qualsiasi fallimento di `persist` nello stato `failed`. Non registra cause e non fa retry: per distinguere errori di dominio e problemi inattesi usa la nota Error Handling.

Queste due chiamate, aggiunte al file soltanto come **controesempio**, sono accettate da `tsc` ma segnalate dal lint configurato:

```ts
save(() => Promise.resolve());
void save(() => Promise.resolve());
```

Anche una Promise che risolve uno stato puo essere logicamente ignorata: il linter non dimostra che il chiamante usi correttamente `"failed"`. `await` attende, non interpreta il risultato. Analogamente una callback di `.catch()` che lancia o restituisce una Promise rifiutata puo generare un nuovo fallimento.

Dalla cartella del demo, senza i controesempi:

```bash
npm install
```

```bash
npm run check
```

```bash
npm run lint
```

```bash
npm run format:check
```

Il comando seguente **riscrive** i file di `src`; controlla il diff:

```bash
npm run format
```

In CI usa i comandi di verifica, non quelli di correzione automatica. `--max-warnings 0` fa fallire anche in presenza di warning.

## Varianti

- **Regole selettive**: iniziare con un preset e aggiungere regole motivate dai difetti reali.
- **Formatter separato**: questo preset non aggiunge regole di impaginazione. Se altri preset le attivano, valutare eslint-config-prettier per disabilitare i conflitti; non esegue Prettier.
- **Monorepo**: verificare l'associazione di ciascun file al suo tsconfig, senza assumere che un progetto radice includa tutto.
- **Editor**: deve usare versioni e configurazione locali, come la CI.

## Errori comuni

- Considerare `void` o una non-null assertion una gestione degli errori.
- Aspettarsi che il lint trovi ogni Promise perduta, codice morto o bug.
- Formattare file generati, dipendenze o output di build per errore.
- Aggiungere allowDefaultProject indiscriminatamente invece di correggere il perimetro.
- Usare `--fix` senza rivedere le modifiche.

## Checklist

- Parser, ESLint, TypeScript e Node compatibili.
- Tutti i file desiderati coperti dai comandi.
- Checker, lint, format check e test separati.
- Policy delle Promise esplicita.
- Lockfile condiviso; upgrade verificati.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Best Practices|Best Practices]]
- [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]]
- [[Programmazione/TypeScript/Pagine/Testing in TypeScript|Testing in TypeScript]]
- [[Programmazione/TypeScript/Pagine/Error Handling|Error Handling]]

## Fonti

- [ESLint: flat config](https://eslint.org/docs/latest/use/configure/configuration-files).
- [typescript-eslint: typed linting](https://typescript-eslint.io/getting-started/typed-linting/).
- [typescript-eslint: no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises/).
- [Prettier: CLI e comandi che modificano i file](https://prettier.io/docs/cli).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
