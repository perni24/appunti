---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - storybook
  - design-system
  - testing
aliases:
  - Storybook
prerequisites:
  - "[[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props]]"
related:
  - "[[Programmazione/React/Pagine/Visual regression testing|Visual regression testing]]"
title: Storybook
---

# Storybook

## Obiettivo

Costruire un catalogo eseguibile dei componenti React: ogni **story** descrive uno stato riproducibile del componente, senza dover navigare nell'applicazione per raggiungerlo. Il catalogo aiuta sviluppo, documentazione e confronto con il design; non e automaticamente una suite di test completa.

## Quando usarlo

- Componenti condivisi, molte varianti, stati difficili da riprodurre e design system.
- Collaborazione tra chi sviluppa e chi definisce interazioni, contenuti e aspetto.
- Per una piccola app con pochi componenti locali il costo di mantenimento puo superare il beneficio.

## Procedura

### 1. Scegliere framework e versioni

Esempio JavaScript ESM per React con Vite: baseline Storybook **10.6.2**, React **19.3.0**, Vite **8.3.4**, Vitest **5.0.5**, Playwright **1.62.1**, Node **24.14.0**. Non mescolare configurazioni di vecchie major o pacchetti Storybook di versioni diverse. Per Next.js scegli la relativa integrazione, non questa configurazione alla cieca.

In un progetto React/Vite gia esistente, la strada assistita e:

```bash
npm create storybook@10.6.2
```

Il comando modifica dipendenze, script e file di configurazione: controlla il diff. Gli esempi sotto mostrano invece una **configurazione manuale minima**; integra i file esistenti, senza cancellare plugin o script dell'app. Non occorre eseguire entrambe le procedure.

Dipendenze del catalogo, con React/react-dom e Vite gia installati:

```bash
npm install --save-dev --save-exact storybook@10.6.2 @storybook/react-vite@10.6.2 @storybook/addon-docs@10.6.2
```

Per i test delle storie in un browser reale:

```bash
npm install --save-dev --save-exact @storybook/addon-vitest@10.6.2 vitest@5.0.5 @vitest/browser-playwright@5.0.5 playwright@1.62.1
```

```bash
npx playwright install chromium
```

Su CI Linux possono servire anche le dipendenze di sistema del browser. Conserva il lockfile e usa `npm ci` nelle esecuzioni riproducibili.

### 2. Distinguere i file

| File o campo | Responsabilita |
| --- | --- |
| `.storybook/main.js` | Framework, addon e glob che individua le storie |
| `.storybook/preview.js` | CSS, parametri e contesto comuni alle storie |
| `Button.stories.jsx` | Stati e interazioni del componente reale, importato da `src` |
| `args` | Input del componente; le storie possono sovrascrivere i valori comuni |
| `argTypes` | Controlli e metadati degli input, non validazione runtime delle props |
| `play` | Interazioni e assertion successive al rendering della storia |
| `vitest.storybook.config.js` | Esecuzione automatizzata delle storie, separata dagli altri test |

### 3. Definire stati osservabili

Non creare una seconda implementazione del componente dentro Storybook. Importa quella dell'app e costruisci i casi con dati fittizi: normale, disabled, errore, vuoto, caricamento e contenuti lunghi quando applicabili. Per un input includi etichetta, descrizione, valore lungo, errore e focus.

I Controls aiutano a esplorare props; i casi importanti vanno salvati come storie esplicite, altrimenti non diventano casi ripetibili in CI.

## Snippet

### Configurazione del catalogo

Campi da **unire** a `package.json`, senza sostituire il resto:

```json
{
  "type": "module",
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test:stories": "vitest run --config vitest.storybook.config.js"
  }
}
```

`.storybook/main.js`:

```js
export default {
  stories: ["../src/**/*.stories.jsx"],
  framework: { name: "@storybook/react-vite", options: {} },
  addons: ["@storybook/addon-docs", "@storybook/addon-vitest"],
  core: { disableTelemetry: true },
};
```

`.storybook/preview.js`: importa il CSS usato dai componenti. Qui il file e dedicato al piccolo esempio; nell'app reale importa anche reset, token e font necessari.

```js
import "../src/button.css";

export default {
  parameters: { layout: "padded" },
};
```

### Componente e storie

`src/Button.jsx`: pulsante nativo, non un elemento generico con un gestore click. Il default `type="button"` evita submit accidentali dentro un form.

```jsx
export function Button({
  children,
  variant = "primary",
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`button button--${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

`src/button.css`:

```css
.button {
  box-sizing: border-box;
  max-width: 100%;
  padding: 12px 18px;
  border: 2px solid #176344;
  border-radius: 4px;
  font: 600 16px/1.4 Arial, sans-serif;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.button--primary {
  color: #ffffff;
  background: #176344;
}
.button--secondary {
  color: #176344;
  background: #ffffff;
}
.button:focus-visible {
  outline: 3px solid #101010;
  outline-offset: 3px;
}
.button:disabled {
  color: #4b5563;
  background: #e5e7eb;
  border-color: #6b7280;
  cursor: not-allowed;
}
```

`src/Button.stories.jsx`, formato CSF a oggetti:

```jsx
import { expect, fn } from "storybook/test";
import { Button } from "./Button.jsx";

export default {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Salva",
    variant: "primary",
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    variant: { options: ["primary", "secondary"], control: "radio" },
    onClick: { control: false },
  },
};

export const Primary = {};
export const Secondary = { args: { variant: "secondary" } };
export const LongLabel = {
  args: { children: "Salva tutte le modifiche della configurazione corrente" },
};

export const Disabled = {
  args: { disabled: true },
  play: async ({ args, canvas, userEvent }) => {
    args.onClick.mockClear();
    const button = canvas.getByRole("button", { name: "Salva" });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Activated = {
  play: async ({ args, canvas, userEvent }) => {
    args.onClick.mockClear();
    const button = canvas.getByRole("button", { name: "Salva" });
    await expect(button).toBeEnabled();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
```

`canvas` limita le query alla storia; `fn()` permette di verificare le chiamate, non solo di mostrarle nel pannello Actions. Attendi interazioni e assertion. Il reset locale rende esplicita l'indipendenza delle verifiche anche quando la storia viene rieseguita. Per contenuti in un portal fuori dal canvas occorrono query sul contenitore corretto.

`autodocs` con l'addon Docs genera la pagina del componente: non aggiunge automaticamente test visuali, controlli di accessibilita o una documentazione del dominio.

### Test delle storie

L'addon della baseline applica automaticamente le annotazioni del preview. Non aggiungere il vecchio setup con `setProjectAnnotations` solo perche presente in una guida di una major precedente; un eventuale setup personalizzato serve per ulteriori esigenze del progetto.

`vitest.storybook.config.js`, configurazione dedicata al catalogo:

```js
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

export default defineConfig({
  plugins: [
    storybookTest({
      configDir: fileURLToPath(new URL("./.storybook", import.meta.url)),
    }),
  ],
  test: {
    name: "stories",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: { channel: process.env.BROWSER_CHANNEL || undefined },
      }),
      instances: [{ browser: "chromium" }],
    },
  },
});
```

Il default usa Chromium installato da Playwright. `BROWSER_CHANNEL=chrome` e un'alternativa per Chrome gia installato; un browser che si aggiorna automaticamente e meno riproducibile. Integra alias/plugin applicativi quando necessari; non supporre che questa configurazione separata erediti tutti i tuoi test o servizi.

Comandi indipendenti, dalla radice del progetto dimostrativo:

```bash
npm run storybook
```

```bash
npm run test:stories
```

```bash
npm run build-storybook
```

Il primo avvia il catalogo, normalmente su `http://localhost:6006`. Il secondo esegue cinque storie, comprese le assertion nelle due `play`. Il terzo genera `storybook-static/`: **compilare non equivale a eseguire i test**. Servi l'output via HTTP; non usare `file://`.

## Adattamenti comuni

- **Provider e router:** usa decorators per il contesto necessario; crea store/cache isolati per caso e ripristina gli effetti. Evita provider di produzione che contattano servizi reali all'import.
- **Rete:** dati fissi per componenti presentazionali; mock espliciti, per esempio MSW, per quelli che caricano dati. Nessuna credenziale, account reale o dato personale nelle storie.
- **Accessibilita:** integra l'addon dedicato o test axe separati e controlli manuali. Un pulsante cliccabile o uno screenshot corretto non certificano accessibilita.
- **Immagini di riferimento:** usa un confronto pixel esplicito come nella nota collegata. Il test `play` verifica comportamento, non margini, colori o font.
- **Pubblicazione:** il catalogo statico contiene storie, asset e dati inclusi nel bundle; applica controllo accessi se non deve essere pubblico. Un servizio esterno di visual testing e facoltativo, non necessario per usare Storybook.

## Debug rapido

| Sintomo | Controllo |
| --- | --- |
| Nessuna storia | Glob, estensione `.stories.jsx`, export default e export nominati |
| Componente diverso dall'app | CSS, font, decorator, dimensioni del contenitore e dati |
| Browser non trovato | Installazione Playwright o valore di `BROWSER_CHANNEL` |
| Build verde ma `play` rotte | Eseguire `test:stories` in CI, non soltanto `build-storybook` |
| Test instabili | Effetti senza cleanup, rete reale, dati casuali, mock condivisi o attese arbitrarie |
| Errore di provider | Aggiungere il contesto effettivamente richiesto, senza nascondere il problema con mock generici |

## Checklist finale

- Componente reale e stati critici raggiungibili nel catalogo.
- Storie con input deterministici, errori e contenuti limite quando pertinenti.
- Test delle interazioni e build eseguiti separatamente.
- Test visuali/accessibilita presenti se richiesti, non dati per impliciti.
- Lockfile, configurazioni e storie versionati; output generati esclusi da Git.
- Nessun segreto nel catalogo pubblicabile; documentazione mantenuta insieme al componente.

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Visual regression testing|Visual regression testing]]
- [[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilita]]
- [[Programmazione/React/Pagine/Testing Jest|Testing Jest]]

## Fonti

- [Storybook: installazione](https://storybook.js.org/docs/get-started/install).
- [React con Vite](https://storybook.js.org/docs/get-started/frameworks/react-vite).
- [Controls e args](https://storybook.js.org/docs/essentials/controls).
- [Interaction tests](https://storybook.js.org/docs/writing-tests/interaction-testing).
- [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon).
- [Decorators](https://storybook.js.org/docs/writing-stories/decorators).
- [Pubblicare Storybook](https://storybook.js.org/docs/sharing/publish-storybook).
- [Vitest: provider Playwright](https://vitest.dev/config/browser/playwright).
