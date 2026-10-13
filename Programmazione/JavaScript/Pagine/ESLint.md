---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - javascript
  - tooling
  - linting
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Moduli|Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Testing|Testing]]"
  - "[[Programmazione/JavaScript/Pagine/Prettier|Prettier]]"
title: ESLint
---

# ESLint

## Sintesi

**ESLint** analizza staticamente il codice e applica regole configurate su sintassi, scope e pattern. Aiuta a intercettare errori e rendere condivise le convenzioni del progetto, ma **non dimostra che il programma funzioni**.

Lint, formattazione, type checking e test sono controlli complementari. La configurazione e i plugin sono codice eseguito da Node: "analisi statica" non significa che sia sicuro caricare una configurazione non fidata.

## Quando usarlo

Usalo su applicazioni, librerie e script mantenuti nel tempo, soprattutto in team o in CI. Parti da poche regole utili e dai preset compatibili con il progetto, poi aggiungi controlli che rispondono a problemi concreti.

Questa nota usa una baseline verificabile: **ESLint 10.12.0**, **@eslint/js 10.0.1**, **globals 17.13.0**, eseguiti con **Node.js 24.14.0**. Sono versioni di riferimento del demo, non un invito a considerarle sempre le ultime.

ESLint 10 richiede Node `^20.19.0 || ^22.13.0 || >=24`. Questo vincolo riguarda il runtime che esegue il linter, non quello a cui e destinato il programma analizzato. Controlla anche i requisiti e le peer dependency dei plugin quando aggiorni.

## Come funziona

### Cosa rileva davvero

| Controllo | Meccanismo | Limite |
| --- | --- | --- |
| Variabile non definita o inutilizzata | Regole core come `no-undef` e `no-unused-vars` | Dipende da scope e globali dichiarati |
| Uguaglianza con coercizione | `eqeqeq`, se attiva | Non stabilisce da sola la semantica di business corretta |
| Callback di `map` senza return | `array-callback-return`, se attiva | Non riconosce ogni abuso di `map` |
| Import verso file inesistenti | Plugin/resolver appropriati o strumenti di build | Non e garantito dal preset core |
| Promise dimenticate | Regole specifiche, spesso con informazioni di tipo | Non e un controllo automatico universale del core |
| Tipi, comportamento, sicurezza | Type checker, test e analisi dedicate | Lint verde non basta |

Il parser costruisce l'AST; le regole producono diagnostiche con posizione, severita ed eventuale correzione. Installare un plugin non attiva automaticamente tutte le sue regole.

### Flat config e versioni

ESLint 10 usa `eslint.config.*` e non supporta piu il vecchio formato `.eslintrc*`. Nel demo `eslint.config.mjs` e esplicitamente ESM, anche senza `"type": "module"` nel package.

I diversi oggetti dell'array si applicano ai file corrispondenti a `files`; quando piu configurazioni corrispondono, quelle successive possono sovrascrivere le impostazioni precedenti. Non mescolare proprieta del vecchio formato, come `env`, con la nuova configurazione.

In v10 la ricerca della configurazione parte dalla directory di **ciascun file analizzato** e risale: in un monorepo non assumere che conti soltanto la cwd del comando. Usa `--print-config` su un file concreto per vedere il risultato.

## API / Sintassi

Le severita sono `off`/0, `warn`/1 ed `error`/2. Una warning normalmente non fa fallire il comando; `--max-warnings 0` rende bloccante anche una sola warning.

| Exit code ordinario | Interpretazione |
| --- | --- |
| 0 | Nessun errore di lint e warning entro la soglia |
| 1 | Errori di lint o soglia warning superata |
| 2 | Problema di configurazione o errore interno |

Opzioni particolari possono modificare alcuni casi: non usare questa tabella per ignorare stderr o assumere che ogni errore sia un difetto del sorgente.

`--fix` modifica i file per le regole che offrono autofix. Non ripara qualsiasi errore e non sostituisce test o revisione del diff. `--fix-dry-run` calcola le correzioni senza scrivere i sorgenti.

## Esempio pratico

### 1. Progetto di prova e dipendenze

Usa una cartella separata dal vault. File `package.json`:

```json
{
  "name": "javascript-quality-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "lint:config": "eslint --print-config",
    "lint:fix": "eslint . --fix",
    "test": "node --test"
  }
}
```

In un progetto esistente integra gli script, senza sovrascrivere gli altri campi. Installa le versioni del demo:

```sh
npm install --save-dev --save-exact eslint@10.12.0 @eslint/js@10.0.1 globals@17.13.0
```

**Effetti:** download dal registro, aggiornamento di package.json/lockfile e creazione di node_modules. Versiona manifest, lockfile e configurazione, non node_modules. In CI o in un checkout con lockfile gia presente usa `npm ci`; non creare il lockfile durante ogni build.

### 2. Configurazione: eslint.config.mjs

```js
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";

export default defineConfig([
  globalIgnores(["**/dist/**", "**/coverage/**", "**/vendor/**"]),
  {
    name: "javascript-quality",
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2022 },
    linterOptions: { reportUnusedDisableDirectives: "error" },
    rules: {
      eqeqeq: ["error", "always"],
      "array-callback-return": "error",
      "prefer-const": "warn",
    },
  },
  {
    name: "node-esm",
    files: [
      "src/server/**/*.{js,mjs}",
      "scripts/**/*.{js,mjs}",
      "test/**/*.{js,mjs}",
      "eslint.config.mjs",
    ],
    languageOptions: { globals: globals.nodeBuiltin },
  },
  {
    name: "node-commonjs",
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  {
    name: "browser",
    files: ["src/browser/**/*.{js,mjs}"],
    languageOptions: { globals: globals.browser },
    rules: { "no-console": "warn" },
  },
]);
```

Decisioni del demo:

- `src/shared` non riceve globali browser o Node: segnala dipendenze accidentali da `window` o `process`.
- `src/browser` riceve le API browser; `src/server`, script e test ricevono quelle Node.
- I file `.js`/`.mjs` sono analizzati come moduli; `.cjs` e CommonJS. `globals.nodeBuiltin` evita di autorizzare `require` come globale nei file ESM.
- `ecmaVersion: 2022` controlla sintassi e globali ECMAScript del parser: **non transpila e non aggiunge polyfill**, ne verifica da solo ogni API del browser.
- `globalIgnores` esclude directory generate; gli ignore di un singolo oggetto hanno uno scope diverso. Flat config non importa automaticamente `.gitignore` o il vecchio `.eslintignore`.
- Le definizioni di globali dicono al linter quali nomi esistono; non creano tali variabili nel runtime.
- `reportUnusedDisableDirectives` segnala soppressioni non piu necessarie.

I percorsi sono un contratto della configurazione: adattali al tuo progetto. Non attivare insieme tutti i globali solo per eliminare `no-undef`.

### 3. Difetto intenzionale: src/shared/total.mjs

```js
export function calculateTotal(items) {
  let total = 0;
  items.map((item) => {
    total += item.price;
  });
  return total;
}
```

Esegui:

```sh
npm run lint
```

La regola attivata `array-callback-return` segnala la callback senza return. Il comando deve fallire: e un controesempio intenzionale, non il risultato atteso di una configurazione pulita.

La regola non sta dimostrando che "ogni uso di map per effetti collaterali e vietato". Se aggiungessi un return inutile, potresti far sparire la segnalazione senza migliorare il progetto. La scelta dell'algoritmo rimane una responsabilita di chi scrive e revisiona.

### 4. Correzione dello stesso file

Sostituisci il contenuto di `src/shared/total.mjs` con:

```js
export function calculateTotal(items) {
  return items.reduce((total, item) => total + item.price, 0);
}
```

Il lint passa. Il frammento presuppone un array denso con prezzi numerici: non e una validazione dei dati e non definisce una policy monetaria. Un array vuoto restituisce zero, ma stringhe o oggetti fuori contratto possono ancora produrre risultati sbagliati. Scrivi test per il dominio effettivo.

### 5. File per ambienti diversi

File `src/browser/title.mjs`:

```js
export function setTitle(text) {
  document.title = text;
}
```

File `src/server/runtime.mjs`:

```js
export function runtimeVersion() {
  return process.version;
}
```

Questi frammenti illustrano lo scope dei globali: non eseguire quello browser in Node aspettandoti un DOM. Spostare `runtime.mjs` in `src/shared` rende `process` non definito per la configurazione scelta.

File `test/total.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateTotal } from "../src/shared/total.mjs";

test("somma prezzi numerici e gestisce il caso vuoto", () => {
  assert.equal(calculateTotal([{ price: 2 }, { price: 3 }]), 5);
  assert.equal(calculateTotal([]), 0);
});
```

Una volta sostituito il controesempio, esegui i controlli separatamente:

```sh
npm run lint
```

```sh
npm test
```

Il test usa il runner Node e **importa** test/assertion: non occorre dichiarare globali Jest o Vitest.

## Varianti

### Diagnostica e correzioni

Mostra la configurazione effettiva per un file:

```sh
npm run lint:config -- src/browser/title.mjs
```

`--print-config` vuole un solo file: lo script dedicato non include il `.` di `lint`, che verrebbe interpretato come un ulteriore percorso.

Mostra come vengono trovati file e configurazione:

```sh
npm run lint -- --debug
```

Prova le correzioni senza scrivere i sorgenti e mostra l'output nel report JSON:

```sh
npm run lint -- --fix-dry-run --format json
```

Applica le correzioni disponibili:

```sh
npm run lint:fix
```

**Effetto:** l'ultimo comando puo riscrivere file. Controlla il diff e riesegui lint/test; in questo demo `lint:fix` non impone la soglia warning di `lint`. Evita di affidare il controllo della CI al solo comando di autofix.

Per accelerare esecuzioni ripetute puoi aggiungere `--cache`; il file cache e derivato e non va versionato. Non confondere "non analizzato", "ignorato" e "analizzato senza segnalazioni".

### Eccezioni motivate

Una soppressione locale deve indicare regola e motivo. Per esempio, solo in un file browser del demo dove `no-console` e attiva:

```js
// eslint-disable-next-line no-console -- diagnostica temporanea del bootstrap
console.info("Application started");
```

Rimuovila quando non serve. Un disable generico puo nascondere segnalazioni future; una warning non smette di essere rilevante solo perche non blocca l'exit code.

### TypeScript, framework e import

La configurazione proposta e per JavaScript, non abilita JSX, parsing TypeScript, React Hooks o risoluzione degli import. Aggiungi parser, plugin e preset compatibili soltanto dove necessari.

Per esempio, alcune regole di typescript-eslint sulle Promise richiedono informazioni di tipo e configurazione del progetto. Non equivale al solo parsing di `.ts` e non sostituisce `tsc --noEmit`. Un controllo degli import richiede un resolver coerente con alias, estensioni e moduli del progetto.

### Prettier, editor e CI

Delega la formattazione a [[Programmazione/JavaScript/Pagine/Prettier|Prettier]]. Se erediti regole stilistiche in conflitto, `eslint-config-prettier` puo disattivarle: non esegue Prettier e non e incluso nel demo.

Editor e CI devono usare la versione locale e la stessa configurazione. Su un checkout fidato e con dipendenze installate, `npm run lint` usa la CLI locale. `npx eslint` senza dipendenza disponibile puo proporre un download: non assumere che sia un controllo offline o riproducibile.

Non caricare configurazioni o plugin di provenienza sconosciuta con segreti disponibili. Per installazione, script e aggiornamenti consulta [[Programmazione/JavaScript/Pagine/Supply chain security npm|Supply chain security npm]].

## Errori comuni

- Aspettarsi analisi di import, Promise o React solo dal preset core.
- Confondere supporto della sintassi con compatibilita del runtime.
- Usare opzioni legacy in flat config o basarsi su una guida per un'altra major.
- Dichiarare globali browser in tutto il backend, o globali CommonJS in ogni modulo ESM.
- Escludere file problematici invece di capire perche vengono segnalati.
- Considerare `--fix` una correzione semantica completa.
- Avere versioni/configurazioni diverse fra editor e CI.
- Trattare "zero warning" come prova di correttezza o sicurezza.

## Checklist

- Runtime del linter, versioni e plugin sono compatibili e fissati nel lockfile?
- Il file di configurazione ha un formato di modulo esplicito?
- Glob, ignore e globali corrispondono davvero alla struttura del progetto?
- Conosci le regole attive e cio che non controllano?
- Le soppressioni hanno un motivo e quelle inutili vengono segnalate?
- Lint, formattazione, tipi e test rimangono verifiche distinte?
- Le correzioni automatiche vengono revisionate prima del commit?

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
- [[Programmazione/JavaScript/Pagine/Prettier|Prettier]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Supply chain security npm|Supply chain security npm]]

## Fonti

- [ESLint: installazione e requisiti](https://eslint.org/docs/latest/use/getting-started).
- [ESLint 10: migrazione e ricerca della configurazione](https://eslint.org/docs/latest/use/migrate-to-10.0.0).
- [ESLint: configurazione flat](https://eslint.org/docs/latest/use/configure/configuration-files).
- [ESLint: ignore globali e locali](https://eslint.org/docs/latest/use/configure/ignore).
- [ESLint: migrazione da eslintrc](https://eslint.org/docs/latest/use/configure/migration-guide).
- [ESLint: opzioni del linguaggio e globali](https://eslint.org/docs/latest/use/configure/language-options).
- [ESLint: CLI, fix ed exit code](https://eslint.org/docs/latest/use/command-line-interface).
- [ESLint: array-callback-return](https://eslint.org/docs/latest/rules/array-callback-return).
- [ESLint: eqeqeq](https://eslint.org/docs/latest/rules/eqeqeq).
- [typescript-eslint: lint con informazioni di tipo](https://typescript-eslint.io/getting-started/typed-linting/).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
