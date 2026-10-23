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
  - module-resolution
  - modules
  - nodejs
aliases:
  - Risoluzione moduli TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
  - "[[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Path aliases]]"
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Node.js]]"
title: Module resolution
---

# Module resolution

## Sintesi

La module resolution associa un import a un file o a un pacchetto. TypeScript cerca informazioni di tipo; Node o il bundler devono poi trovare un'implementazione eseguibile. Sono passaggi collegati, ma non identici.

Esempi verificabili con TypeScript **5.9.3** e Node **24.14.0**.

## Quando usarlo

- Un import funziona nell'editor ma fallisce dopo la build.
- Un pacchetto espone dichiarazioni o entry point diversi per ESM e CommonJS.
- Devi scegliere tra esecuzione diretta in Node e compilazione con un bundler.

## Come funziona

### Tipo di import e ambiente

| Import | Cosa verificare |
| --- | --- |
| `"node:fs/promises"` | Modulo built-in Node e dichiarazioni fornite da `@types/node` |
| `"./config.js"` | Percorso relativo, estensione e posizione nell'output |
| `"example-package"` | Pacchetto installato e suoi entry point pubblici |
| `"example-package/internal"` | Il sottopercorso deve essere esportato se esiste un'export map |
| `"@/shared/label"` | Alias configurato anche nello strumento che esegue o impacchetta |
| `"#shared/label"` | Mappatura interna tramite `imports` del `package.json` |

I nomi dei pacchetti nella tabella sono illustrativi: non sono dipendenze da installare.

`NodeNext` modella i moduli Node moderni, scegliendo regole ESM o CommonJS in base al formato del file e dell'import emesso. `Bundler` supporta anche import relativi senza estensione e altri comportamenti tipici dei bundler. Accettare un import in quel modo non garantisce che Node sappia caricarlo direttamente.

### Dichiarazioni e codice eseguito

Nell'esempio sotto, TypeScript cerca `config.ts` per un import scritto come `"./config.js"`; Node carichera `dist/config.js`. Il compilatore non cambia quell'import.

Un `.d.ts` puo invece dichiarare un modulo privo di implementazione: il type checking puo riuscire e il caricamento fallire. Per questo aggiungere un `declare module` fittizio non risolve una dipendenza mancante.

## API / Sintassi

Per JavaScript compilato destinato direttamente a Node, usa una coppia coerente:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

E un frammento, non una configurazione completa. Per un bundler, una coppia comune e `module: "ESNext"` con `moduleResolution: "Bundler"` e `noEmit: true`.

## Esempio pratico

Usa il `package.json` ESM e il `tsconfig.json` Node completi della nota [[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS|Moduli ES e CommonJS]], con `typescript` e `@types/node` installati.

`src/config.ts`:

```ts
export function loadConfig(): { label: string } {
  return { label: "Configurazione caricata" };
}
```

`src/app.ts`:

```ts
import { loadConfig } from "./config.js";

console.log(loadConfig().label);
```

Compila dalla radice del progetto:

```sh
npm exec -- tsc -p tsconfig.json
```

Esegui: stampa `Configurazione caricata`.

```sh
node dist/app.js
```

### Diagnosi di un import

Traccia la ricerca dei moduli senza emettere nuovi file:

```sh
npm exec -- tsc -p tsconfig.json --noEmit --traceResolution
```

Leggi il blocco relativo all'import interessato: file cercati, dichiarazione trovata, condizioni applicate. I tentativi falliti intermedi non sono necessariamente errori; conta l'esito finale.

Controlla anche la configurazione effettiva:

```sh
npm exec -- tsc -p tsconfig.json --showConfig
```

Se il controllo passa ma Node fallisce, confronta il testo dell'import emesso con i file distribuiti. Cambiare solo `moduleResolution` non riscrive i percorsi.

## Varianti

- **Export map**: con `exports`, un pacchetto rende disponibili sottopercorsi espliciti. Un file presente su disco non e automaticamente un import pubblico.
- **Condizioni**: `import`, `require`, `types` e `default` possono indirizzare verso file diversi. La condizione `types`, quando presente, va prima delle condizioni di esecuzione corrispondenti; il runtime deve comunque avere un target JavaScript valido.
- **Alias**: `paths` descrive una risoluzione che un altro strumento deve supportare. Non usarlo per aggirare `exports` o puntare dentro `node_modules`.
- **Workspace**: preferisci veri pacchetti collegati dal package manager, con API pubbliche, anziche alias diretti ai sorgenti degli altri package.
- **Modalita storiche**: `Node10` (anche chiamata `Node`) e `Classic` non modellano le moderne regole Node di `exports` / `imports`. Mantienile soltanto se richieste da una toolchain esistente.

## Errori comuni

- Passare a `Bundler` soltanto per nascondere un errore di estensione in un backend senza bundler.
- Ignorare maiuscole/minuscole: un import tollerato dal filesystem locale puo fallire in CI.
- Confondere un problema di risoluzione con un problema di export: trovare il file non significa che quel nome sia esportato.
- Usare una versione TypeScript diversa tra editor e CI senza accorgersene.

## Checklist

- Quale ambiente risolvera l'import finale?
- Il formato del file e quello atteso?
- Sono presenti sia le dichiarazioni sia il JavaScript necessario?
- I sottopercorsi rispettano `exports`?
- La traccia e la prova runtime confermano la stessa destinazione logica?

## Fonti

- [TypeScript: moduleResolution](https://www.typescriptlang.org/tsconfig/moduleResolution.html)
- [TypeScript: risoluzione dei moduli](https://www.typescriptlang.org/docs/handbook/modules/reference.html#module-resolution)
- [Node 24.14.0: package entry points ed export map](https://nodejs.org/download/release/v24.14.0/docs/api/packages.html#package-entry-points)

## Collegamenti

- [[Programmazione/TypeScript/Pagine/tsconfig|tsconfig]]
- [[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS|Moduli ES e CommonJS]]
- [[Programmazione/TypeScript/Pagine/Path aliases|Path aliases]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
