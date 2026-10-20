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
  - e2e
  - cypress
  - playwright
aliases:
  - Testing Cypress
  - Testing Playwright
  - E2E React
prerequisites:
  - "[[Programmazione/React/Pagine/Testing Jest|Testing Jest]]"
  - "[[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]"
related:
  - "[[Programmazione/React/Pagine/Visual regression testing|Visual regression testing]]"
  - "[[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilita]]"
title: Testing Cypress e Playwright
---

# Testing Cypress e Playwright

## Obiettivo

Verificare un'app React in un **browser reale** con Playwright Test oppure Cypress: caricamento della build, interazioni, richieste e stati osservabili. Non occorre adottare entrambi nel proprio progetto; qui gli esempi equivalenti servono a confrontarli.

Il perimetro conta piu del nome del runner: **browser + API simulata non e un end-to-end completo del backend**. Per provare persistenza, autenticazione e autorizzazione servono anche servizi reali in un ambiente di test isolato.

## Quando usarlo

- Flussi critici: navigazione, form, autenticazione, creazione risorse e recupero dagli errori.
- Regressioni che dipendono da DOM reale, focus, layout o API del browser.
- Integrazione della build distribuita, distinta dai test in jsdom.

Non usare dati o account di produzione. La suite deve preparare e ripulire i propri dati e poter essere eseguita senza dipendere dall'ordine dei test.

## Procedura

### 1. Preparare la stessa app per entrambi i runner

Riparti da `src/ProfileForm.jsx` della nota [[Programmazione/React/Pagine/Testing Jest|Testing Jest]], senza duplicarne una variante specifica per i test. Servono package.json, React/React DOM 19.3.0 e Node 24.14.0; il package usa `"type": "module"`.

Installa la toolchain Vite usata nel demo, se non gia presente:

```sh
npm install --save-dev --save-exact vite@8.3.4 @vitejs/plugin-react@6.1.2
```

In package.json integra questi script, conservando gli altri campi:

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

File `vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ plugins: [react()] });
```

File `index.html`:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Test profilo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

File `src/profile-api.js`, adapter del contratto didattico:

```js
import { normalizeName } from "./ProfileForm.jsx";

export async function saveName(name) {
  const response = await fetch("/api/profile", {
    method: "PUT",
    credentials: "omit",
    cache: "no-store",
    redirect: "error",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: normalizeName(name) }),
  });
  if (response.status !== 200 ||
      !/^application\/json(?:\s*;|$)/i.test(response.headers.get("Content-Type") ?? "")) {
    throw new Error("Risposta profilo non valida");
  }
  const data = await response.json();
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("Profilo non valido");
  }
  return normalizeName(data.name);
}
```

File `src/main.jsx`:

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ProfileForm from "./ProfileForm.jsx";
import { saveName } from "./profile-api.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <main>
      <h1>Profilo</h1>
      <ProfileForm saveName={saveName} />
    </main>
  </StrictMode>
);
```

**Non e implementato alcun backend.** I test intercettano PUT /api/profile, restituiscono JSON con name e verificano l'adapter/UI. Visitando l'app fuori dai test, un salvataggio non ricevera quella risposta simulata. credentials omit rende esplicito che il demo non prova una sessione: un vero profilo richiede autenticazione, autorizzazione, protezione CSRF se pertinente e validazione server.

### 2. Scegliere il runner

| Aspetto | Playwright Test | Cypress |
| --- | --- | --- |
| Stile | API async/await e fixture come page | Coda di comandi cy; non normali Promise da attendere |
| Ricerca | getByRole, getByLabel, locator | get/contains; query Testing Library richiedono il plugin apposito |
| Attesa | Locator/actionability e expect web-first | Query e should vengono riprovati; then non e un'assertion ritentata |
| Server | webServer puo avviare e fermare l'anteprima | Avvio esterno prima della suite |
| Isolamento | Contesto browser separato per test | testIsolation per pagina, cookie e storage |

L'auto-wait non conosce il significato di "salvataggio completato": verifica uno stato applicativo. Non sostituirlo con sleep o networkidle indiscriminati. L'isolamento del browser non ripulisce automaticamente database e code sul server. [Playwright: buone pratiche](https://playwright.dev/docs/best-practices), [Cypress: retry](https://docs.cypress.io/app/core-concepts/retry-ability) e [isolamento](https://docs.cypress.io/app/core-concepts/test-isolation).

## Snippet

### Playwright: configurazione e tre test

Installa Playwright Test nella versione del demo:

```sh
npm install --save-dev --save-exact @playwright/test@1.62.1
```

Qui si usa **Chrome gia installato** tramite channel, non il Chromium scaricato da Playwright. Per usare i browser gestiti da Playwright cambia i project e installa i binari corrispondenti; non assumere che Chrome, Firefox e WebKit siano gia disponibili. Non serve un account cloud.

File `playwright.config.js`:

```js
import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.TEST_PORT ?? 4173);
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
```

File `e2e/profile.spec.js`:

```js
import { test, expect } from "@playwright/test";

test("successo: invia il nome normalizzato e mostra la conferma", async ({ page }) => {
  await page.route("**/api/profile", route => route.fulfill({
    status: 200, json: { name: "Ada Lovelace" },
  }));
  await page.goto("/");
  await page.getByLabel("Nome visualizzato").fill(" Ada ");
  const sent = page.waitForRequest(request => new URL(request.url()).pathname === "/api/profile");
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  const request = await sent;
  expect(request.method()).toBe("PUT");
  expect(request.postDataJSON()).toEqual({ name: "Ada" });
  await expect(page.getByRole("status")).toHaveText("Nome salvato: Ada Lovelace");
});

test("vuoto: errore applicativo senza richiesta", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/profile", route => {
    calls++;
    return route.fulfill({ status: 500, body: "unexpected" });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Inserisci un nome");
  expect(calls).toBe(0);
});

test("503 simulato: conserva la bozza e permette retry esplicito", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/profile", route => {
    calls++;
    return route.fulfill(calls === 1
      ? { status: 503, json: { error: "fixture unavailable" } }
      : { status: 200, json: { name: "Ada" } });
  });
  await page.goto("/");
  const input = page.getByLabel("Nome visualizzato");
  await input.fill("Ada");
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Salvataggio non confermato");
  await expect(input).toHaveValue("Ada");
  expect(calls).toBe(1);
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Nome salvato: Ada");
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(calls).toBe(2);
});
```

Compila prima di ogni esecuzione, per non testare una dist obsoleta:

```sh
npm run build
```

Avvia i test; webServer gestisce l'anteprima e fallisce se la porta e occupata:

```sh
npx --no-install playwright test
```

Attesi **3 test Chrome**. Le route sono configurate prima delle azioni e waitForRequest prima del click. Le assertion sul DOM sono attese; non usare expect(await locator.isVisible()) come sostituto equivalente dell'assertion ritentata toBeVisible. [Web server](https://playwright.dev/docs/test-webserver), [API simulate](https://playwright.dev/docs/mock).

### Cypress: configurazione e tre test equivalenti

Installa Cypress:

```sh
npm install --save-dev --save-exact cypress@16.2.0
```

Controlla il runtime; se il download del binario e stato saltato, esegui prima cypress install:

```sh
npx --no-install cypress verify
```

File `cypress.config.cjs`:

```js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  video: false,
  retries: 0,
  e2e: {
    baseUrl: `http://127.0.0.1:${process.env.TEST_PORT ?? 4173}`,
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: false,
    testIsolation: true,
  },
});
```

File `cypress/e2e/profile.cy.js`, senza plugin di selettori aggiuntivi:

```js
describe("Profilo con API simulata", () => {
  it("mostra il nome confermato e invia JSON normalizzato", () => {
    cy.intercept("PUT", "/api/profile", { statusCode: 200, body: { name: "Ada Lovelace" } }).as("saveProfile");
    cy.visit("/");
    cy.get('[data-cy="profile-name"]').type(" Ada ");
    cy.contains("button", /^Salva$/).click();
    cy.wait("@saveProfile").its("request.body").should("deep.equal", { name: "Ada" });
    cy.get('[role="status"]').should("have.text", "Nome salvato: Ada Lovelace");
  });

  it("non invia il form vuoto", () => {
    let calls = 0;
    cy.intercept("PUT", "/api/profile", req => {
      calls++;
      req.reply({ statusCode: 500, body: "unexpected" });
    });
    cy.visit("/");
    cy.contains("button", /^Salva$/).click();
    cy.get('[role="alert"]').should("contain.text", "Inserisci un nome");
    cy.then(() => { expect(calls).to.equal(0); });
  });

  it("conserva la bozza dopo 503 e permette un secondo invio", () => {
    let calls = 0;
    cy.intercept("PUT", "/api/profile", req => {
      calls++;
      req.reply(calls === 1
        ? { statusCode: 503, body: { error: "fixture unavailable" } }
        : { statusCode: 200, body: { name: "Ada" } });
    }).as("saveProfile");
    cy.visit("/");
    cy.get('[data-cy="profile-name"]').type("Ada");
    cy.contains("button", /^Salva$/).click();
    cy.wait("@saveProfile").its("response.statusCode").should("equal", 503);
    cy.get('[role="alert"]').should("contain.text", "Salvataggio non confermato");
    cy.get('[data-cy="profile-name"]').should("have.value", "Ada");
    cy.contains("button", /^Salva$/).click();
    cy.wait("@saveProfile").its("response.statusCode").should("equal", 200);
    cy.get('[role="status"]').should("have.text", "Nome salvato: Ada");
    cy.get('[role="alert"]').should("not.exist");
    cy.then(() => { expect(calls).to.equal(2); });
  });
});
```

Compila di nuovo dopo eventuali modifiche:

```sh
npm run build
```

In un terminale avvia l'anteprima, con porta libera:

```sh
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

In un secondo terminale avvia Cypress con Chrome installato:

```sh
npx --no-install cypress run --browser chrome --headless
```

Attesi **3 test**. Al termine ferma l'anteprima separatamente. cy.wait con alias attende una richiesta precisa, non un numero arbitrario di millisecondi. Non avviare server dentro i test Cypress. [Avvio app](https://docs.cypress.io/app/end-to-end-testing/testing-your-app), [intercept](https://docs.cypress.io/api/commands/intercept).

## Adattamenti comuni

- **Backend reale:** rimuovi le risposte simulate per il flusso scelto; prepara dati di test e verifica anche persistenza tramite rilettura o reload. Una conferma UI da sola non prova che il database sia aggiornato.
- **Autenticazione:** stato Playwright o cy.session possono ridurre login ripetuti, ma vanno validati e separati per utente/ruolo. L'isolamento browser non impedisce a due test di modificare lo stesso account server. Non salvare cookie/token nel repository. [Playwright auth](https://playwright.dev/docs/auth), [cy.session](https://docs.cypress.io/api/commands/session).
- **Browser e viewport:** aggiungi progetti/ambienti effettivamente supportati. Il demo verifica Chrome, non tutta la matrice browser; un viewport mobile non emula ogni dispositivo reale.
- **Component testing:** monta un componente in browser con setup dedicato; non equivale al caricamento dell'intera app. Configurazioni e supporto framework vanno verificati per il runner scelto.
- **Accessibilita e visual:** ruoli corretti aiutano i test, ma non sostituiscono audit, tastiera/screen reader e confronti visivi dedicati.
- **CI:** usa npm ci e build aggiornata, prepara runtime browser, avvia/ferma i servizi, conserva report degli errori. Se abiliti retry, rendi visibili i test flaky; non trasformarli in falsi successi.

Ignora nel Git del progetto i risultati generati e lo stato autenticato, non i sorgenti dei test:

```gitignore
test-results/
playwright-report/
playwright/.auth/
cypress/screenshots/
cypress/videos/
coverage/
```

Trace, screenshot e video possono contenere dati sensibili: controlla accesso e conservazione. Queste indicazioni non modificano il workflow GitHub Actions degli appunti.

## Debug rapido

| Sintomo | Controllo |
| --- | --- |
| Connection refused / app assente | Build, server, baseURL/baseUrl, host e porta coerenti |
| Playwright dice porta gia usata | Non riutilizzare un server casuale; ferma quello del demo o cambia TEST_PORT |
| cy.findByRole non esiste | Non e un comando Cypress nativo; manca il plugin Testing Library |
| Test passa con API rotta | L'intercept sta restituendo un successo simulato |
| Stato letto troppo presto | Usa expect web-first / should su uno stato specifico |
| Cypress then non riprova | Sposta l'assertion ritentabile in should; niente async/await sui comandi cy |
| Timeout su richiesta intercettata | Registra intercept/route prima dell'azione; controlla metodo e URL |
| Test isolato passa, suite no | Dati backend, storage, utenti o risorse condivise |

## Checklist finale

- E chiaro quali dipendenze sono reali e quali simulate?
- Build, browser e server sono quelli previsti, senza affidarsi a processi preesistenti?
- Le assertion verificano payload, successo ed errore, non solo la presenza di un pulsante?
- Ogni test ha dati e sessione indipendenti, senza sleep fissi?
- I flussi E2E veri verificano anche il backend e i permessi?
- CI propaga i fallimenti e non pubblica cookie, token o trace sensibili?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Testing Jest|Testing Jest]]
- [[Programmazione/React/Pagine/Visual regression testing|Visual regression testing]]
- [[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilita]]
- [[Programmazione/React/Pagine/React Router|React Router]]
- [[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]
- [[Programmazione/React/Pagine/CSRF|CSRF]]

## Fonti

- [Playwright: configurazione](https://playwright.dev/docs/test-configuration), [webServer](https://playwright.dev/docs/test-webserver), [best practices](https://playwright.dev/docs/best-practices) e [mock API](https://playwright.dev/docs/mock).
- [Cypress: installazione](https://docs.cypress.io/app/get-started/install-cypress), [configurazione](https://docs.cypress.io/app/references/configuration), [retry-ability](https://docs.cypress.io/app/core-concepts/retry-ability), [test isolation](https://docs.cypress.io/app/core-concepts/test-isolation) e [then](https://docs.cypress.io/api/commands/then).
- Demo con Playwright Test 1.62.1, Cypress 16.2.0, Vite 8.3.4 e React 19.3.0. Runner, API simulate e limiti sono espliciti; non e una suite backend completa.
