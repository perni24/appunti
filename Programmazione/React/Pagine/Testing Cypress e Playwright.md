---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: "non revisionato"
difficulty: intermediate
tags: [react, testing, e2e, cypress, playwright]
aliases: [Testing Cypress, Testing Playwright, E2E React]
prerequisites: []
related: []
---

# Testing Cypress e Playwright

## Sintesi

Cypress e Playwright permettono di testare applicazioni nel browser. Sono adatti a test end-to-end, integrazione UI, flussi utente, routing, form, autenticazione e regressioni critiche.

## Quando usarlo

Usali per flussi che devono funzionare davvero nel browser: login, checkout, creazione risorse, navigazione, permessi, form complessi e integrazioni API.

## Come funziona

Playwright:

```ts
test("login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByRole("button", { name: "Accedi" }).click();
  await expect(page.getByText("Dashboard")).toBeVisible();
});
```

## API / Sintassi

Concetti:

- aprire pagina;
- cercare elementi con locator accessibili;
- simulare interazioni;
- verificare risultati;
- intercettare o preparare dati;
- eseguire su piu browser.

## Esempio pratico

Test form:

```ts
await page.goto("/users/new");
await page.getByLabel("Email").fill("luca@example.com");
await page.getByRole("button", { name: "Salva" }).click();
await expect(page.getByText("Utente creato")).toBeVisible();
```

## Varianti

- **E2E reale**: frontend + backend.
- **Component testing**: componente in browser.
- **API mocking**: backend simulato.
- **Cross-browser**: Chromium, Firefox, WebKit.
- **Visual assertions**: integrate o con tool esterni.
- **Auth setup**: stato autenticato riusabile.

## Errori comuni

- Testare troppi dettagli fragili.
- Dipendere da dati non controllati.
- Usare sleep fissi.
- Non isolare stato tra test.
- Rendere la suite lenta e instabile.
- Usare selettori CSS invece di ruoli o test id stabili.

## Checklist

- Il flusso e davvero critico?
- I dati test sono controllati?
- I locator sono stabili e accessibili?
- I test evitano attese fisse?
- La suite gira in CI?
- Errori e screenshot sono conservati?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Testing Jest]]
- [[Visual regression testing]]
- [[Test di accessibilita]]
- [[React Router]]
