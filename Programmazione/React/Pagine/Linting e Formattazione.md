---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - react
  - linting
  - formatting
  - tooling
aliases:
  - Linting React
  - Formattazione React
  - ESLint
  - Prettier
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/ESLint|ESLint]]"
  - "[[Programmazione/JavaScript/Pagine/Prettier|Prettier]]"
related:
  - "[[Programmazione/React/Pagine/useEffect|useEffect]]"
  - "[[Programmazione/React/Pagine/React Compiler|React Compiler]]"
title: Linting e Formattazione
---

# Linting e Formattazione

## Obiettivo

Configurare **ESLint per JavaScript/JSX e regole React Hooks**, e **Prettier per lo stile**, con comandi riproducibili in editor e CI. Un controllo verde significa solo che sono passate le regole abilitate: non sostituisce type checking, test, build o audit di accessibilita.

## Quando usarlo

Usali dall'inizio di un progetto mantenuto nel tempo, prima che le convenzioni divergano tra editor e sviluppatori. In un'app esistente integra la configurazione del framework: non sovrascriverla con un esempio generico.

## Procedura

### 1. Fissare versioni compatibili

Baseline verificata con Node 24.14.0, React 19.3.0, ESLint 10.13.0, @eslint/js 10.0.1 e React Hooks 7.1.1. Progetto npm JavaScript con JSX automatico; non e una configurazione TypeScript.

Installa core e globali:

```sh
npm install --save-dev --save-exact eslint@10.13.0 @eslint/js@10.0.1 globals@17.13.0
```

Installa il plugin React ufficiale:

```sh
npm install --save-dev --save-exact eslint-plugin-react-hooks@7.1.1
```

Installa formatter e configurazione che disabilita le regole stilistiche in conflitto:

```sh
npm install --save-dev --save-exact prettier@3.9.10 eslint-config-prettier@10.1.8
```

Versiona package.json e lockfile. ESLint 10 richiede Node ^20.19.0, ^22.13.0 oppure >=24: e il runtime del linter, non il target browser. Configurazioni e plugin sono codice eseguito da Node, quindi non caricare progetti non fidati senza isolarli.

**Compatibilita controllata il 2026-10-18:** eslint-plugin-react 7.37.5 e eslint-plugin-jsx-a11y 6.10.2 non dichiarano ESLint 10 nelle peer dependency. Questa baseline non li installa e non usa force/legacy-peer-deps per aggirare il vincolo. ESLint 9 e fuori manutenzione dal 2026-08-06: non e proposto come soluzione predefinita per un nuovo progetto. Ricontrolla versioni e supporto prima di aggiungere quei plugin. [Supporto ESLint](https://eslint.org/version-support/), [plugin React](https://github.com/jsx-eslint/eslint-plugin-react), [plugin JSX a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y).

### 2. Configurare file e ambienti

File `eslint.config.mjs` alla root del progetto. L'estensione mjs rende la configurazione ESM anche senza type module nel package.

```js
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  globalIgnores([
    "**/dist/**",
    "**/coverage/**",
    "**/test-results/**",
    "**/playwright-report/**",
    "**/cypress/screenshots/**",
    "**/cypress/videos/**",
  ]),
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    linterOptions: { reportUnusedDisableDirectives: "error" },
    rules: { eqeqeq: "error" },
  },
  {
    files: ["src/**/*.{js,jsx}"],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["*.config.{js,mjs,cjs}", "scripts/**/*.{js,mjs,cjs}", "e2e/**/*.{js,mjs}"],
    languageOptions: { globals: globals.nodeBuiltin },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },
  {
    files: ["src/**/*.test.{js,jsx}", "test/**/*.js"],
    languageOptions: { globals: globals.jest },
  },
  prettier,
]);
```

Il preset Hooks include regole fondamentali e diagnostiche del Compiler, ma **non attiva la compilazione React**. Mantieni il preset nel tempo, valutando le differenze quando aggiorni il plugin. [Regole React Hooks](https://react.dev/reference/eslint-plugin-react-hooks).

ESLint 10 riconosce gli identificatori JSX nello scope: un componente importato e usato solo come `<Card />` non e inutilizzato, mentre un componente non definito puo essere segnalato. Questo non aggiunge tutte le regole di eslint-plugin-react, per esempio il controllo delle key nelle liste. [Migrazione ESLint 10](https://eslint.org/docs/latest/use/migrate-to-10.0.0).

I blocchi si combinano per i file corrispondenti; quelli successivi possono sovrascrivere impostazioni precedenti. Configura solo i globali effettivi:

- window/document per src; process nei file Node, non indiscriminatamente nei componenti browser.
- require/module nei .cjs; i moduli ESM Node non ricevono automaticamente require o __dirname.
- test/expect/jest solo nei percorsi Jest indicati. Per Vitest o Cypress servono globali/plugin appropriati; Playwright importa test/expect esplicitamente.
- Node 24 ha alcune API web, quindi non tutti i globali "web" sono necessariamente vietati in uno script Node.

Gli ignore globali sono distinti dalle esclusioni di un singolo blocco. node_modules e ignorato di default; .gitignore non viene importato automaticamente da ESLint. Non usare .eslintignore o env del vecchio formato in questa configurazione. [Configurazione](https://eslint.org/docs/latest/use/configure/configuration-files), [ignore](https://eslint.org/docs/latest/use/configure/ignore).

### 3. Separare la formattazione

File `.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "endOfLine": "lf"
}
```

File `.prettierignore`:

```text
dist/
coverage/
test-results/
playwright-report/
cypress/screenshots/
cypress/videos/
package-lock.json
```

Ignorare il lockfile nel formatter non significa ignorarlo in Git: va versionato e gestito da npm. eslint-config-prettier, messo per ultimo, **non esegue Prettier** e non formatta il codice; disabilita regole in conflitto. Non e necessario eseguire il formatter come regola ESLint. [Integrazione Prettier](https://prettier.io/docs/integrating-with-linters).

## Snippet

### Script del progetto

Integra in package.json, senza rimuovere build, test e altri script:

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix --max-warnings 0",
    "format": "prettier . --write",
    "format:check": "prettier . --check"
  }
}
```

Controllo senza scrivere nei sorgenti:

```sh
npm run lint
```

```sh
npm run format:check
```

Correzioni automatiche, **modificano i file**: controlla il diff e riesegui i test dopo l'operazione. Una fix non puo risolvere ogni problema semantico.

```sh
npm run lint:fix
```

```sh
npm run format
```

Con max-warnings 0 anche una warning fa fallire il comando. Prettier --check restituisce 1 per file non formattati; ESLint distingue problemi rilevati da errori di configurazione. Non ignorare exit code non zero in CI. [CLI ESLint](https://eslint.org/docs/latest/use/command-line-interface), [CLI Prettier](https://prettier.io/docs/cli).

### Esempio positivo e controesempio

Modulo completo `src/TitleCounter.jsx`, con effect di sincronizzazione e cleanup. Solo questa istanza del demo possiede il titolo del documento; in un'app reale va coordinato con router o framework.

```jsx
import { useEffect, useState } from "react";

export default function TitleCounter({ title = "Contatore" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <section>
      <h2>{title}</h2>
      <p>Conteggio: {count}</p>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Incrementa
      </button>
    </section>
  );
}
```

Controesempio **intenzionalmente errato**, da provare separatamente come src/BrokenTitle.jsx, non da conservare nell'app:

```jsx
import { useEffect } from "react";

export default function BrokenTitle({ title }) {
  useEffect(() => {
    document.title = title;
  }, []);
  return <h2>{title}</h2>;
}
```

exhaustive-deps segnala title mancante. Aggiungi la dipendenza necessaria o ripensa la sincronizzazione: non rimuovere l'array o disabilitare la regola solo per nascondere il warning. Se un calcolo deriva da props/state, spesso va fatto durante render, senza effect. [exhaustive-deps](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps).

Per capire quali regole sono realmente attive su un file:

```sh
npx --no-install eslint --print-config src/TitleCounter.jsx
```

### Editor e CI

Configura l'editor per usare versioni locali e la stessa root del progetto; scegli un solo formatter per il file. Il formatter al salvataggio non sostituisce il controllo nel repository.

In un job CI del progetto installa le devDependencies con npm ci, poi esegui lint e format:check, seguiti da test, type check quando previsto e build. Non usare fix/write nel gate di controllo. I pre-commit hook riducono gli errori locali, ma possono essere saltati: la CI resta indipendente. Questa nota non installa hook o modifica le Actions del vault.

## Adattamenti comuni

- **TypeScript:** usa parser e preset typescript-eslint compatibili, scoped ai file corretti; regole type-aware richiedono informazioni del progetto. tsc resta un controllo separato. Aggiungere ts al glob non basta.
- **Next o altro framework:** integra i preset specifici e verifica config finale, regole duplicate e compatibilita; non applicare la baseline browser a tutto il codice server.
- **JSX e accessibilita:** aggiungi plugin compatibili per controlli ulteriori. La baseline non segnala ogni immagine senza alt, label mancante o key assente; usa anche [[Programmazione/React/Pagine/Test di accessibilita|test nel browser]].
- **Fast Refresh:** il plugin dedicato controlla confini di export, non sostituisce Hooks; va configurato secondo bundler e versione.
- **Eccezioni:** locali, motivate e verificabili. reportUnusedDisableDirectives segnala soppressioni non piu necessarie; non disabilitare globalmente exhaustive-deps per un singolo caso.
- **Aggiornamenti:** controlla engines/peer dependency, release note e configurazione risultante; separa eventuale riformattazione dalle modifiche funzionali.

## Debug rapido

| Sintomo | Controllo |
| --- | --- |
| JSX non analizzato | Glob include jsx e parserOptions abilita JSX |
| process not defined nel client | Configurazione sbagliata o codice Node finito nel browser |
| jest/cy/test non definiti | Percorso e runner effettivo; non rendere tutti i globali universali |
| Installazione rifiuta le peer dependency | Compatibilita reale del plugin, non force come prima soluzione |
| Lint passa ma format:check fallisce | Regole statiche e stile sono due gate diversi |
| File generati analizzati | Ignore globali ESLint e ignore Prettier sono separati |
| Stile oscilla a ogni salvataggio | Due formatter oppure regole stilistiche riattivate dopo prettier |
| Errori solo in CI | Node, lockfile, cwd, devDependencies, case dei percorsi e configurazione locale |

## Checklist finale

- Lint e format sono negli script?
- L'editor usa la stessa config?
- Versioni, engines e peer dependency sono compatibili?
- File JSX, test e configurazioni ricevono soltanto i globali appropriati?
- Le regole Hooks sono attive e i warning fanno fallire il gate?
- La CI controlla senza riscrivere i file e senza omettere le devDependencies?
- Le eccezioni sono motivate e il diff delle fix viene controllato?
- Test, tipi, build e accessibilita hanno verifiche distinte?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]
- [[Programmazione/React/Pagine/useEffect|useEffect]]
- [[Programmazione/React/Pagine/React Compiler|React Compiler]]
- [[Programmazione/React/Pagine/Feature-based architecture|Feature-based architecture]]
- [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]
- [[Programmazione/JavaScript/Pagine/Prettier|Prettier]]
- [[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilita]]

## Fonti

- [ESLint: configurazione](https://eslint.org/docs/latest/use/configure/configuration-files), [ignore](https://eslint.org/docs/latest/use/configure/ignore), [migrazione 10](https://eslint.org/docs/latest/use/migrate-to-10.0.0) e [supporto versioni](https://eslint.org/version-support/).
- [React: plugin Hooks](https://react.dev/reference/eslint-plugin-react-hooks) e [dipendenze](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps).
- [Prettier: CLI](https://prettier.io/docs/cli), [integrazione con linter](https://prettier.io/docs/integrating-with-linters) e [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier).
- Versioni verificate indicate nella procedura; una baseline riproducibile non equivale alla configurazione completa di qualsiasi framework.
