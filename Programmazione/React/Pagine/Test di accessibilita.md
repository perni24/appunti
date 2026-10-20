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
  - accessibility
  - testing
aliases:
  - Test di accessibilita
  - A11y testing
prerequisites:
  - "[[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]"
  - "[[Programmazione/React/Pagine/Testing Cypress e Playwright|Test nel browser]]"
related:
  - "[[Programmazione/React/Pagine/Focus Management|Focus Management]]"
  - "[[Programmazione/React/Pagine/Portals|Portals e dialog]]"
title: Test di accessibilita
---

# Test di accessibilita

## Obiettivo

Verificare **semantica, tastiera e stati dinamici** di una UI React, combinando assertion mirate, scansioni axe nel browser e prove manuali. Non basta trovare un ruolo nel DOM: il controllo deve essere utilizzabile e comprensibile nel flusso reale.

**Zero violazioni automatiche non certifica accessibilita o conformita WCAG.** Gli strumenti coprono solo una parte dei requisiti; servono valutazione umana e tecnologie assistive. [W3C: valutare l'accessibilita](https://www.w3.org/WAI/test-evaluate/).

## Quando usarlo

- Form, dialog, navigazione, menu, componenti riusabili e flussi critici.
- Cambiamenti di testo, markup, tema, focus e caricamento asincrono.
- Regressioni del design system e controlli ripetibili in CI.

Testa gli stati rilevanti, non solo la schermata iniziale: errore, successo, pannello aperto, contenuto vuoto e pending possono avere problemi diversi.

## Procedura

### 1. Separare i livelli di verifica

| Livello | Cosa osserva | Cosa non dimostra |
| --- | --- | --- |
| Lint JSX | Pattern statici coperti dalle regole attive | DOM finale, focus o annunci |
| Testing Library + jsdom | Ruolo, nome, descrizione e comportamento simulato | Layout e comportamento completo del browser |
| Playwright + axe | UI nel browser, tastiera e regole automatiche | Tutti i requisiti o la voce di uno screen reader |
| Verifica manuale | Usabilita, ordine logico, annunci e percezione | Assenza di regressioni future senza un processo ripetibile |

Una query getByRole con nome preciso e utile, ma non prova che il nome sia sensato, il focus visibile o l'ordine di lettura corretto. Un test id non e vietato: semplicemente non controlla la semantica. Vedi [[Programmazione/React/Pagine/Testing Jest|Testing Jest]] per setup e query.

### 2. Preparare una pagina di prova reale

Usa il progetto Vite e la configurazione Playwright della nota [[Programmazione/React/Pagine/Testing Cypress e Playwright|Testing Cypress e Playwright]]: Node 24.14.0, React/React DOM 19.3.0, Vite 8.3.4, Playwright Test 1.62.1 e Chrome installato. Il progetto usa type module, script build/preview e webServer con porta libera.

Questa pagina e un **demo separato**, non una sostituzione della tua app. Inserisci in src i moduli gia completi:

- Details.jsx e NameForm.jsx: i due moduli indipendenti di [[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]].
- PortalDemo.jsx e DialogDemo.jsx: i moduli di [[Programmazione/React/Pagine/Portals|Portals]], mantenendo il loro import relativo.

Non sono richiesti backend o dati personali: il form salva solo una bozza locale. Aggiungi lo strumento di scansione:

```sh
npm install --save-dev --save-exact @axe-core/playwright@4.14.0
```

Il pacchetto richiede Node >=22.12.0 nella versione usata. Conserva il lockfile e verifica le peer dependency quando cambi runner.

File `index.html` del demo, con destinazione del portal fuori dalla root React:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verifica accessibilita</title>
  </head>
  <body>
    <div id="root"></div>
    <div id="overlay-root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

File `src/main.jsx`:

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Details from "./Details.jsx";
import NameForm from "./NameForm.jsx";
import DialogDemo from "./DialogDemo.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <main>
      <h1>Verifica accessibilita</h1>
      <Details />
      <section>
        <h2>Bozza del profilo</h2>
        <NameForm />
      </section>
      <section>
        <h2>Conferma della bozza</h2>
        <DialogDemo />
      </section>
    </main>
  </StrictMode>
);
```

File `src/index.css`, limitato alla pagina dimostrativa:

```css
body { margin: 1rem; font-family: system-ui, sans-serif; color: #171717; background: #fff; }
main { max-width: 65ch; margin-inline: auto; }
input, button { font: inherit; max-width: 100%; box-sizing: border-box; }
:is(button, input):focus-visible { outline: 3px solid #125b94; outline-offset: 3px; }
dialog { max-width: min(30rem, calc(100% - 4rem)); }
```

### 3. Definire risultati osservabili

- Disclosure: Invio/Spazio aprono, aria-expanded segue lo stato, Tab non entra nel contenuto nascosto.
- Form: nome accessibile, errore associato al campo, aria-invalid coerente e stato di successo distinto.
- Dialog di conferma: nome, focus iniziale su Annulla, navigazione interna, Escape e ritorno al controllo di apertura. Non tutti i dialog devono focalizzare lo stesso tipo di elemento: il contratto dipende dal contenuto. [Pattern dialog WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

Il test non deve chiamare focus sul campo prima di verificare un autofocus atteso: nasconderebbe il difetto. La presenza di role=dialog o aria-modal non crea da sola la modalita.

## Snippet

File `e2e/accessibility.spec.js`. La configurazione precedente include gia i file .spec.js; il comando sotto seleziona soltanto questa suite.

```js
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function scan(page, testInfo, state) {
  const result = await new AxeBuilder({ page }).analyze();
  await testInfo.attach(`axe-${state}`, {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json",
  });
  expect(result.violations, `Violazioni nello stato ${state}`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }))
    .toHaveText("Verifica accessibilita");
});

test("scansione iniziale", async ({ page }, testInfo) => {
  await scan(page, testInfo, "initial");
});

test("disclosure da tastiera e contenuto nascosto", async ({ page }, testInfo) => {
  const toggle = page.getByRole("button", { name: "Dettagli notifiche" });
  const checkbox = page.getByRole("checkbox", { name: "Riepilogo settimanale" });
  await page.keyboard.press("Tab");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(checkbox).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Nome visualizzato")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(checkbox).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(checkbox).toBeFocused();
  await scan(page, testInfo, "expanded");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Nome visualizzato")).toBeFocused();
});

test("form: errore associato e conferma locale", async ({ page }, testInfo) => {
  const form = page.getByRole("form", { name: "Profilo dimostrativo" });
  const input = form.getByRole("textbox", { name: "Nome visualizzato" });
  await form.getByRole("button", { name: "Salva bozza" }).click();
  await expect(form.getByRole("alert")).toHaveText("Inserisci un nome di almeno tre caratteri.");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(/Inserisci un nome di almeno tre caratteri/);
  await scan(page, testInfo, "form-error");
  await input.fill("Ada");
  await input.press("Enter");
  await expect(form.getByRole("status")).toHaveText("Bozza salvata per Ada.");
  await expect(form.getByRole("alert")).toHaveCount(0);
  await expect(input).not.toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription("Almeno tre caratteri, esclusi gli spazi iniziali e finali.");
  await scan(page, testInfo, "form-success");
});

test("dialog: focus, Escape e conferma da tastiera", async ({ page }, testInfo) => {
  const opener = page.getByRole("button", { name: "Apri conferma" });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(opener).toBeFocused();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Conferma operazione" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Annulla" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Conferma", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Annulla" })).toBeFocused();
  await scan(page, testInfo, "dialog-open");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.keyboard.press("Space");
  await expect(dialog.getByRole("button", { name: "Annulla" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Bozza aggiornata" })).toBeVisible();
});
```

Compila il demo aggiornato:

```sh
npm run build
```

Esegui i quattro test; webServer avvia e ferma l'anteprima:

```sh
npx --no-install playwright test e2e/accessibility.spec.js
```

Attesi **quattro test e cinque scansioni**. Il report completo include anche incomplete: sono controlli inconcludenti da esaminare, non successi impliciti. La scansione usa le regole predefinite della versione axe indicata, senza esclusioni o filtri di tag. Non prova tutte le WCAG o tutti gli stati. [Playwright: test di accessibilita](https://playwright.dev/docs/accessibility-testing), [risultati axe](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md).

### Controllo manuale complementare

| Attivita | Cosa verificare |
| --- | --- |
| Solo tastiera | Ordine sensato, focus visibile/non coperto, assenza di trappole, chiusura e ritorno |
| Screen reader | Nome, ruolo, stato, istruzioni, errore e conferma annunciati nel momento utile |
| Zoom e viewport | Testo leggibile, reflow, controlli raggiungibili, dialog non tagliato |
| Tema e preferenze | Contrasto, informazione non affidata solo al colore, movimento ridotto |
| Navigazione SPA | Titolo, focus e annunci dopo cambi significativi di pagina |

Registra pagina, stato, browser/versione, tecnologia assistiva, passi, risultato atteso/osservato e difetto. Per esempio: Chrome + NVDA su Windows oppure Safari + VoiceOver su macOS, scelti in base agli utenti supportati. Le prove vanno realmente eseguite: non segnare "passato" perche esiste la checklist. [W3C: scelta degli strumenti](https://www.w3.org/WAI/test-evaluate/tools/selecting/).

## Adattamenti comuni

- **Dialog e portal:** scansiona la pagina, non soltanto root o main; altrimenti puoi escludere proprio il dialog montato altrove.
- **jsdom:** assertion semantiche utili, ma layout/contrasto e showModal richiedono browser e verifiche ulteriori.
- **Cypress:** serve un'integrazione axe esplicitamente installata e configurata; non usare comandi cy.injectAxe o cy.checkA11y come se fossero nativi.
- **Regole disabilitate:** documenta difetto, motivo, responsabile e criterio di rimozione dell'eccezione; non escludere tutto il form per rendere verde la CI.
- **Widget complessi:** aggiungi tasti del pattern specifico e stati realmente raggiungibili, non gli stessi tasti per menu, tabs e combobox.
- **Report:** allegati axe, HTML e trace possono contenere dati della pagina; usa fixture senza segreti e limita conservazione/accesso.

## Debug rapido

| Sintomo | Controllo |
| --- | --- |
| Query trova il pulsante ma Tab lo salta | hidden, disabled, inert e ordine DOM |
| Dialog presente ma focus fuori | showModal e focus management, non solo role o attributo open |
| Scan verde solo a pannello chiuso | Esegui una scansione dopo aver raggiunto e atteso lo stato aperto |
| Nessun errore ma incomplete presenti | Leggi evidenza e verifica manualmente i casi inconcludenti |
| Label visiva ma campo senza nome | Associazione htmlFor/id o label contenente input |
| Il test passa ma annuncio non si sente | Live region, tempistiche e combinazione browser/screen reader da provare |

## Checklist finale

- Semantica, tastiera e scansione sono verificate separatamente?
- Le assertion controllano nome, descrizione e stato, oltre alla presenza del nodo?
- Sono provati errori, apertura/chiusura e ripristino del focus?
- Scansioni e selettori includono eventuali portal?
- Incomplete ed eccezioni hanno una verifica esplicita?
- Zoom, focus visibile e screen reader sono stati controllati manualmente?
- Il rapporto distingue risultati automatici da prove non eseguite?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]
- [[Programmazione/React/Pagine/Focus Management|Focus Management]]
- [[Programmazione/React/Pagine/Testing Jest|Testing Jest]]
- [[Programmazione/React/Pagine/Testing Cypress e Playwright|Testing Cypress e Playwright]]
- [[Programmazione/React/Pagine/Portals|Portals e dialog]]
- [[Programmazione/React/Pagine/Linting e Formattazione|Linting e Formattazione]]

## Fonti

- [Playwright: accessibilita e allegati axe](https://playwright.dev/docs/accessibility-testing).
- [W3C: valutazione](https://www.w3.org/WAI/test-evaluate/), [selezione degli strumenti](https://www.w3.org/WAI/test-evaluate/tools/selecting/), [dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) e [disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).
- [axe-core: API e risultati](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md). Demo con axe 4.14.0 e Chrome; nessuna certificazione o verifica automatica della voce dello screen reader.
