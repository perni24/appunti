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
  - formattazione
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]"
related:
  - "[[Programmazione/JavaScript/Pagine/ESLint|ESLint]]"
  - "[[Programmazione/JavaScript/Pagine/Testing|Testing]]"
title: Prettier
---

# Prettier

## Sintesi

**Prettier** rende uniforme la formattazione: indentazione, spazi, virgolette e disposizione delle righe. Analizza la sintassi e ristampa il codice; non esegue il programma e non ne dimostra la correttezza.

Riferimento degli esempi: **Prettier 3.9.10**, provato con Node.js 24.14.0. La versione e fissata per rendere il risultato ripetibile, non come promessa di essere sempre quella piu recente.

## Quando usarlo

- Team e CI che devono applicare lo stesso stile senza correzioni manuali.
- JavaScript, TypeScript, JSON, CSS, HTML e Markdown supportati.
- Editor che formatta al salvataggio, affiancato da un controllo nel repository.

Non aggiunge controlli sui tipi o test. Anche [[Programmazione/JavaScript/Pagine/ESLint|ESLint]] rileva soltanto le categorie coperte dalle regole abilitate: nessuno dei due certifica l'assenza di bug.

## Come funziona

### Parser e risultato

Il parser viene normalmente scelto dal nome del file. Una sintassi invalida puo impedire la formattazione; una variabile inesistente o un algoritmo sbagliato possono invece essere formattati senza errori.

Con la stessa versione, opzioni e input si cerca un risultato stabile. Un aggiornamento, anche piccolo, puo cambiare l'output: separa l'aggiornamento del formatter e la riformattazione dai cambi funzionali.

### Configurazione ed esclusioni

La configurazione si cerca partendo dalla posizione del file e risalendo le directory; non e una preferenza globale dell'utente. Puoi usare `.prettierrc.json`, un campo `prettier` nel package o una configurazione JavaScript, ma evita definizioni concorrenti.

La CLI legge anche `.editorconfig`; le opzioni Prettier esplicite prevalgono su quelle ricavate da EditorConfig. Per differenze mirate usa `overrides`, non un parser JavaScript forzato globalmente su JSON, CSS e Markdown.

`.prettierignore` esclude file interi. La CLI considera anche `.gitignore` nella directory da cui viene eseguita e ignora normalmente `node_modules`. Gli ignore del linter sono un'altra configurazione. Esegui gli script dalla root del progetto.

## API / Sintassi

### Installazione e comandi

In un progetto npm gia inizializzato:

```powershell
npm install --save-dev --save-exact prettier@3.9.10
```

Versiona `package.json` e `package-lock.json`; in CI usa `npm ci` seguito dallo script di controllo. Non omettere le devDependencies nel job che esegue il formatter. Senza installazione locale, `npx prettier` puo scaricare un'altra versione: gli script del progetto evitano questo equivoco.

| Comando CLI | Effetto | Uso |
| --- | --- | --- |
| `prettier . --check` | Controlla senza riscrivere | CI e controllo preliminare |
| `prettier . --write` | Sovrascrive i file selezionati | Formattazione locale |
| `prettier src/user.js` | Scrive il risultato su stdout | Ispezione di un file |
| `prettier --find-config-path src/user.js` | Mostra la configurazione trovata | Diagnosi editor/CLI |

Per `--check`: exit code **0** significa formato conforme, **1** differenze, **2** errore dello strumento, della configurazione o del parsing. Leggi la diagnostica: non tutti i fallimenti sono file da riformattare.

I glob passati direttamente alla CLI vanno quotati, per esempio `"src/**/*.js"`, per farli interpretare a Prettier anche su shell diverse. I comandi della tabella presuppongono il binario locale disponibile tramite uno script npm.

### Opzioni da interpretare correttamente

- `printWidth: 100` e una preferenza di impaginazione, **non un limite invalicabile**: una stringa lunga puo superarlo.
- `singleQuote: false` preferisce virgolette doppie in JavaScript, senza imporre escape inutili in tutti i casi.
- `semi: true` controlla i punti e virgola, non rende il codice piu corretto.
- `endOfLine: "lf"` rende esplicito lo stile dei fine riga.
- `proseWrap: "preserve"` conserva il wrapping della prosa Markdown; non disabilita ogni altra formattazione del file.

## Esempio pratico

Progetto isolato `format-demo/`. Se integri gli script in un package esistente, **unisci i campi** invece di sostituire il package completo.

### File di configurazione

`package.json`:

```json
{
  "name": "format-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "format": "prettier . --write",
    "format:check": "prettier . --check",
    "format:file": "prettier"
  },
  "devDependencies": {
    "prettier": "3.9.10"
  }
}
```

`.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 100,
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.md",
      "options": { "proseWrap": "preserve" }
    }
  ]
}
```

`.prettierignore`, con sintassi simile a gitignore:

```text
dist/
coverage/
vendor/
package-lock.json
```

Qui il lockfile e lasciato a npm; non significa che debba essere escluso da Git. `dist/` e `coverage/` sono output, `vendor/` contiene eventuale codice di terzi.

### Prima e dopo

`src/user.js`, volutamente non formattato:

```js
const user={name:"Luca",roles:["admin","editor"]};function hasRole(role){return user.roles.includes(role)}
```

Con la configurazione mostrata il risultato e:

```js
const user = { name: "Luca", roles: ["admin", "editor"] };
function hasRole(role) {
  return user.roles.includes(role);
}
```

Prettier non aggiunge automaticamente una riga vuota fra le due dichiarazioni. L'esempio dimostra il formato, non un sistema di autorizzazione: ruoli conservati nel client non proteggono un backend.

### Esecuzione

Dalla directory che contiene questi file, installa le dipendenze e genera il lockfile:

```powershell
npm install
```

Controlla il solo esempio; prima della formattazione l'exit code atteso e 1:

```powershell
npm run format:file -- src/user.js --check
```

**Il comando seguente sovrascrive i file supportati non esclusi.** Prima controlla le modifiche pendenti con Git, poi ispeziona il diff:

```powershell
npm run format
```

Verifica l'intero progetto senza riscrivere:

```powershell
npm run format:check
```

Per diagnosticare quale configurazione governa un file:

```powershell
npm run format:file -- --find-config-path src/user.js
```

Lo script `format:file` non contiene gia `.`: accetta un percorso o un'opzione di diagnosi senza aggiungere un secondo input.

## Varianti

### API JavaScript

Per strumenti che elaborano una stringa fidata, `tools/preview-format.mjs`:

```js
import * as prettier from "prettier";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const file = new URL("../src/user.js", import.meta.url);
const source = await readFile(file, "utf8");
const options = await prettier.resolveConfig(file, { editorconfig: true });
const formatted = await prettier.format(source, { ...options, filepath: fileURLToPath(file) });
process.stdout.write(formatted);
```

```powershell
node tools/preview-format.mjs
```

Le API principali sono asincrone. `format` restituisce testo, non salva il file e non applica da sola la selezione/ignore della CLI; qui la lettura riguarda deliberatamente un file noto. `resolveConfig` puo restituire `null`; il percorso fornisce l'estensione per inferire il parser. `fileURLToPath` converte correttamente l'URL in un percorso filesystem, anche con spazi o su Windows.

### Editor, hook e linter

Configura l'editor per usare versione e opzioni locali. Il salvataggio automatico non sostituisce `format:check` in CI. Un hook pre-commit e facoltativo: per limitarsi ai file staged serve uno strumento come lint-staged; non e una proprieta implicita di ogni hook.

Se regole stilistiche ESLint confliggono, `eslint-config-prettier` disattiva quelle incompatibili e va dopo le configurazioni che le attivano. **Non esegue Prettier**. Lint e formato possono restare due script separati; non e obbligatorio eseguire il formatter come regola ESLint.

Per layout eccezionali puoi usare `// prettier-ignore` prima del nodo JavaScript interessato, senza escludere l'intero file. Configurazioni JavaScript e plugin eseguono codice: usa soltanto progetti e dipendenze fidati.

## Errori comuni

- CI e editor producono diff diversi: controlla versione locale, configurazione effettiva, fine riga e file esclusi.
- `--check` fallisce: distinguere differenze di stile da errore di parsing; `--write` non ripara qualunque JavaScript invalido.
- Formattare output o sorgenti di terzi: restringi l'ambito o aggiungi ignore.
- Applicare `--write .` indiscriminatamente al vault: gli esempi volutamente errati o non formattati nelle note possono venire alterati.
- Aspettarsi refactoring, import ordinati o eliminazione di codice inutilizzato: non sono garanzie del formatter di base.
- Aggiungere molti flag diversi in CI/editor: condividi una configurazione piccola e stabile.

## Checklist

- Versione locale esatta e lockfile presenti.
- Formattazione separata da lint, tipi e test.
- `.prettierignore` verificato prima della prima scrittura.
- Editor e CI usano le stesse impostazioni.
- Diff controllato e test eseguiti dopo una riformattazione estesa.
- Aggiornamenti del formatter trattati come cambiamenti espliciti.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Supply chain security npm|Supply chain security npm]]

## Fonti

Documentazione ufficiale consultata il 2026-10-13; CLI e API provate con Prettier 3.9.10.

- [Installazione e versione locale](https://prettier.io/docs/install).
- [CLI: check, write, exit code e ricerca configurazione](https://prettier.io/docs/cli).
- [Configurazione e EditorConfig](https://prettier.io/docs/configuration).
- [Opzioni e significato di printWidth](https://prettier.io/docs/options).
- [File e nodi esclusi](https://prettier.io/docs/ignore).
- [API asincrone](https://prettier.io/docs/api).
- [Integrazione con i linter](https://prettier.io/docs/integrating-with-linters).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
