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
  - testing
  - visual-regression
aliases:
  - Visual regression testing
  - Test visuali
prerequisites:
  - "[[Programmazione/React/Pagine/Storybook|Storybook]]"
related:
  - "[[Programmazione/React/Pagine/Testing Cypress e Playwright|Testing Cypress e Playwright]]"
title: Visual regression testing
---

# Visual regression testing

## Obiettivo

Rilevare cambiamenti inattesi nell'aspetto della UI confrontando uno screenshot corrente con una **baseline**, cioe un'immagine di riferimento controllata e approvata. Un diff segnala una differenza, non decide se sia un bug: serve revisione umana.

Uno snapshot DOM o di un oggetto serializzato non e uno screenshot. Analogamente, un'immagine uguale non dimostra che click, validazione, autorizzazioni e accessibilita funzionino.

## Quando usarlo

- Componenti condivisi, regressioni CSS, temi e layout responsive ad alto impatto.
- Pagine con dati riproducibili e stati finali identificabili.
- Non fotografare indiscriminatamente ogni combinazione: scegli stati che proteggono requisiti reali e mantieni leggibili i diff.

## Procedura

### 1. Rendere il caso deterministico

Fissa dati, browser, sistema operativo, font, viewport, scala, lingua, fuso e tema. Attendi un segnale applicativo reale: contenuto caricato, immagini decodificate, font pronti. Un ritardo fisso o `networkidle` non garantiscono che la UI sia nello stato corretto.

Playwright attende screenshot consecutivi stabili prima del confronto, ma puo stabilizzarsi anche su una schermata vuota o un errore. Aggiungi assertion sul contenuto **prima** dello screenshot.

### 2. Separare baseline e risultati

| Elemento | Destinazione e uso |
| --- | --- |
| Baseline PNG | Versionata con i test dopo revisione umana |
| Immagine corrente | Risultato dell'esecuzione, non sostituisce automaticamente la baseline |
| Diff | Evidenzia pixel diversi, da leggere insieme alle due immagini |
| Report e trace | Artefatti della CI, con durata e accessi adeguati |

Genera e confronta le baseline nello stesso ambiente. Separarle per piattaforma evita collisioni, ma non uniforma Windows e Linux. Per una CI stabile fissa anche immagine del runner/container, versione del browser e font. Aggiornamenti del browser possono richiedere una nuova revisione delle immagini.

### 3. Verificare prima di approvare

1. Esegui i test senza aggiornamenti automatici.
2. Per un caso nuovo genera le immagini nell'ambiente scelto e ispezionale.
3. Per un fallimento confronta expected, actual e diff: cerca prima regressioni o dati instabili.
4. Aggiorna soltanto i casi cambiati intenzionalmente e controlla il diff Git.
5. Riesegui i test in modalita confronto e fai approvare la modifica in review.

## Snippet

### Progetto di partenza

Riusa **componente, CSS, configurazione e storie** della nota [[Programmazione/React/Pagine/Storybook|Storybook]]. Non serve riscrivere il componente per il test. La baseline qui usa `@playwright/test` **1.62.1**; il resto della toolchain e indicato nella nota collegata.

```bash
npm install --save-dev --save-exact @playwright/test@1.62.1 http-server@14.1.1
```

```bash
npx playwright install chromium
```

Il server statico e uno strumento locale di test, non un backend di produzione. Aggiungi questi script agli altri in `package.json`:

```json
{
  "scripts": {
    "test:visual": "playwright test --config playwright.visual.config.js",
    "report:visual": "playwright show-report playwright-report"
  }
}
```

### Configurazione Playwright

`playwright.visual.config.js`: avvia un server sull'output **gia compilato** di Storybook. `reuseExistingServer: false` evita di confrontare per errore una vecchia build servita da un altro processo.

```js
import { defineConfig } from "@playwright/test";

const port = Number(process.env.TEST_PORT || 6007);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./visual",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  updateSnapshots: "none",
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{projectName}/{platform}/{arg}{ext}",
  reporter: [["list"], ["html", { open: "never" }]],
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      threshold: 0,
      maxDiffPixels: 0,
    },
  },
  use: {
    baseURL,
    browserName: "chromium",
    channel: process.env.BROWSER_CHANNEL || undefined,
    deviceScaleFactor: 1,
    locale: "it-IT",
    timezoneId: "Europe/Rome",
    colorScheme: "light",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 720 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `node node_modules/http-server/bin/http-server storybook-static -a 127.0.0.1 -p ${port} -c-1`,
    url: `${baseURL}/iframe.html`,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
```

`threshold` misura la tolleranza della differenza di colore per pixel; `maxDiffPixels` limita quanti pixel diversi sono ammessi. `maxDiffPixelRatio` sarebbe un limite proporzionale. Qui sono scelte soglie rigorose per un piccolo esempio stabile, non un valore universale da copiare in ogni prodotto. Non aumentare la tolleranza per nascondere un ambiente variabile.

Il progetto `mobile` cambia il viewport: **non emula un telefono completo**, touch, CPU o browser mobile. `BROWSER_CHANNEL` ha lo stesso significato della nota Storybook; browser diversi richiedono progetti e baseline distinti.

### Test visuali

`visual/button.spec.js`: tre storie per due viewport, quindi sei confronti. L'URL `iframe.html` evita di includere toolbar e sidebar di Storybook nell'immagine. Gli ID dipendono da titolo ed export della storia e sono consultabili in `storybook-static/index.json`.

```js
import { test, expect } from "@playwright/test";

const cases = [
  { id: "primary", name: "Salva", disabled: false },
  { id: "disabled", name: "Salva", disabled: true },
  {
    id: "long-label",
    name: "Salva tutte le modifiche della configurazione corrente",
    disabled: false,
  },
];

for (const item of cases) {
  test(`Button ${item.id}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=ui-button--${item.id}&viewMode=story`);
    const button = page.getByRole("button", { name: item.name, exact: true });
    await expect(button).toBeVisible();
    if (item.disabled) await expect(button).toBeDisabled();
    else await expect(button).toBeEnabled();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot(`button-${item.id}.png`);
  });
}
```

I casi scelti non producono un cambiamento visivo dopo `play`. Per storie che cambiano aspetto, attendi anche lo stato finale della loro interazione; la semplice presenza iniziale di un pulsante non basta. I test di comportamento restano nel comando `test:stories`.

### Esecuzione e gestione delle immagini

Ricompila dopo ogni modifica al componente, alle storie o al CSS:

```bash
npm run build-storybook
```

Confronto ordinario, anche in CI:

```bash
npm run test:visual
```

Con `updateSnapshots: "none"` una baseline mancante provoca un fallimento senza crearla. Primo popolamento intenzionale, da controllare prima del commit:

```bash
npm run test:visual -- --update-snapshots=all
```

Aggiornamento mirato dopo un cambiamento approvato; modifica soltanto le immagini dei test selezionati:

```bash
npm run test:visual -- --project=desktop --grep "Button primary" --update-snapshots=all
```

Il comando di aggiornamento **scrive/sovrascrive file di riferimento**: non inserirlo nella CI ordinaria e non usarlo come soluzione automatica a un test rosso. Riesegui poi il confronto senza flag di aggiornamento.

```bash
npm run report:visual
```

Nel `.gitignore` del progetto dimostrativo:

```gitignore
node_modules/
storybook-static/
test-results/
playwright-report/
```

Non ignorare `visual/__screenshots__/`: contiene le baseline versionate. In CI conserva report, immagini e trace anche se il test fallisce; verifica che gli artefatti non contengano dati riservati. Questa nota non configura un workflow remoto.

## Adattamenti comuni

- **Singolo componente:** `expect(locator).toHaveScreenshot(...)` riduce il rumore ma non protegge il layout circostante. Usa nomi e percorsi univoci tra file di test.
- **Pagina intera:** `fullPage: true` include anche contenuto fuori viewport; controlla prima altezza, dati caricati e virtualizzazione, non cattura magicamente elementi non renderizzati.
- **Temi/browser:** aggiungi progetti o casi espliciti, ciascuno con il proprio riferimento. Il nome del progetto distingue le immagini.
- **Contenuti dinamici:** preferisci dati e orologio controllati. Un `mask` esclude un'area dal confronto visivo: non prova che quell'area funzioni, quindi conserva assertion separate e non mascherare il componente da proteggere.
- **Animazioni:** `animations: "disabled"` gestisce animazioni CSS/Web Animations, non ogni aggiornamento di canvas, video o timer JavaScript. `reducedMotion` esprime una preferenza, non obbliga l'app a rispettarla.
- **Servizi esterni:** possono gestire baseline, approvazioni e browser; valuta accessi, costo e dati caricati. Non sono indispensabili per confrontare screenshot locali.

## Debug rapido

| Sintomo | Controllo |
| --- | --- |
| Baseline mancante | Progetto/piattaforma corretti; generazione e approvazione iniziale intenzionali |
| Molti pixel diversi senza modifiche CSS | Browser, sistema, font, scala, dati e stato finale |
| Test passa su una UI sbagliata | Baseline iniziale errata o assertion preliminari insufficienti |
| Modifica CSS non rilevata | Ricompilare Storybook; controllare story ID, area catturata e soglie |
| Diff intermittente | Date casuali, richieste pendenti, immagini o font non pronti, animazioni |
| Porta occupata | Chiudere il proprio server di test o impostare `TEST_PORT`, senza riusare output ignoto |

Una prova utile della suite e introdurre temporaneamente una modifica evidente al CSS nella fixture: il confronto deve fallire producendo un diff. Ripristina il codice e verifica che torni verde **senza aggiornare le baseline**.

## Checklist finale

- Contenuto e stato corretti verificati prima dello screenshot.
- Ambiente documentato; font e dati sotto controllo.
- Baseline ispezionate e versionate, non aggiornate automaticamente in CI.
- Diff reali rilevati e artefatti disponibili anche in caso di errore.
- Stati, viewport e temi scelti in base al rischio, senza promessa di copertura totale.
- Test funzionali e accessibilita mantenuti separati dal confronto pixel.

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Storybook|Storybook]]
- [[Programmazione/React/Pagine/Testing Cypress e Playwright|Testing Cypress e Playwright]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Animazioni e Micro-interazioni|Animazioni e Micro-interazioni]]

## Fonti

- [Playwright: confronti visuali e ambienti di riferimento](https://playwright.dev/docs/test-snapshots).
- [Playwright: configurazione dei test](https://playwright.dev/docs/test-configuration).
- [Playwright: updateSnapshots e snapshotPathTemplate](https://playwright.dev/docs/api/class-testconfig).
- [Playwright: assertion sugli screenshot di pagina](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1).
- [Playwright: screenshot di locator](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-screenshot-1).
- [Playwright: server di test](https://playwright.dev/docs/test-webserver).
