---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Testing Cypress e Playwright]
prerequisites: []
related: []
---
# Testing Cypress e Playwright

## Sintesi

Nota su Testing Cypress e Playwright in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

Il **testing end-to-end** (**E2E**) verifica il comportamento dell'applicazione dal punto di vista dell'utente, attraversando piu parti del sistema: UI, routing, chiamate API, stato applicativo e flussi reali.

Nel frontend React, gli strumenti piu usati per questo tipo di test sono **Cypress** e **Playwright**.

> [!INFO] Punto chiave
> Un test E2E non serve a verificare un singolo componente isolato. Serve a validare un flusso utente completo, per esempio login, checkout, navigazione o compilazione di un form.

---

## 1. Cosa significa E2E

Un test E2E simula un utente che usa l'applicazione nel browser.

Esempi:
- visita una pagina;
- clicca un link;
- compila un form;
- effettua login;
- naviga in una dashboard;
- verifica che un risultato sia visibile.

Rispetto a [[Programmazione/React/Pagine/Testing Jest]], il livello e piu alto:
- Jest testa componenti o logica in modo piu isolato;
- E2E testa flussi completi e integrazione tra parti.

---

## 2. Perche servono

I test E2E sono utili per intercettare problemi che i test unitari non vedono:
- routing rotto;
- form collegati male alle API;
- autenticazione non funzionante;
- regressioni nei flussi principali;
- errori di integrazione tra componenti;
- problemi reali nel browser.

Un componente puo passare tutti i test unitari ma fallire nel flusso completo dell'app.

---

## 3. Cosa testare con E2E

Conviene usare E2E per i flussi critici:
- login e logout;
- registrazione;
- checkout;
- creazione o modifica di risorse;
- ricerca e filtri principali;
- navigazione tra pagine importanti;
- permessi e route protette;
- submit di form complessi.

Non conviene usare E2E per ogni dettaglio piccolo, perche sono test piu costosi da mantenere.

---

## 4. Cypress

**Cypress** e uno strumento molto diffuso per test E2E e component testing.

Punti forti:
- developer experience molto buona;
- runner interattivo;
- debug visivo semplice;
- API leggibile;
- ottima ergonomia per testare flussi frontend.

Esempio concettuale:

```javascript
describe("Login", () => {
  it("permette il login con credenziali valide", () => {
    cy.visit("/login");

    cy.findByLabelText("Email").type("user@example.com");
    cy.findByLabelText("Password").type("password123");
    cy.findByRole("button", { name: "Accedi" }).click();

    cy.url().should("include", "/dashboard");
    cy.findByText("Benvenuto").should("be.visible");
  });
});
```

L'approccio migliore resta orientato all'utente: label, ruoli e testo visibile sono preferibili a selettori fragili.

---

## 5. Playwright

**Playwright** e uno strumento moderno per test E2E multi-browser.

Punti forti:
- supporto solido a Chromium, Firefox e WebKit;
- auto-waiting robusto;
- API potente;
- parallelizzazione;
- tracciamento e debugging avanzato;
- ottimo per CI e scenari cross-browser.

Esempio concettuale:

```javascript
import { test, expect } from "@playwright/test";

test("login con credenziali valide", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Accedi" }).click();

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("Benvenuto")).toBeVisible();
});
```

Anche qui il test lavora sul comportamento osservabile, non sui dettagli interni React.

---

## 6. Cypress vs Playwright

| Caratteristica | Cypress | Playwright |
| :--- | :--- | :--- |
| **Developer experience locale** | Molto forte | Molto buona |
| **Multi-browser** | Buono | Molto forte |
| **Debug visuale** | Ottimo | Ottimo con trace viewer |
| **CI e parallelizzazione** | Buoni | Molto forti |
| **API orientata all'utente** | Buona, spesso con Testing Library | Nativa e molto solida |

La scelta dipende dal progetto:
- Cypress e spesso molto comodo per team frontend e debug locale;
- Playwright e spesso preferito per test cross-browser e pipeline CI robuste.

---

## 7. Selettori robusti

Un test E2E fragile spesso fallisce per motivi non importanti.

Selettori fragili:

```javascript
cy.get(".btn-primary").click();
```

Selettori migliori:

```javascript
cy.findByRole("button", { name: "Salva" }).click();
```

oppure, quando serve un identificatore tecnico stabile:

```javascript
page.getByTestId("save-button");
```

Regola pratica:
- preferisci ruoli, label e testo quando rappresentano il comportamento utente;
- usa `data-testid` per elementi difficili da identificare semanticamente;
- evita classi CSS e struttura DOM interna.

---

## 8. Gestione delle API nei test E2E

I test E2E possono usare strategie diverse:
- backend reale in ambiente di test;
- API mockate;
- intercept delle request;
- fixture controllate.

La scelta dipende dallo scopo del test.

### Backend reale
Piu vicino alla produzione, ma piu lento e fragile.

### Mock o intercept
Piu controllabile e veloce, ma meno end-to-end in senso stretto.

Non esiste una sola risposta corretta. L'importante e sapere cosa stai validando.

---

## 9. Autenticazione nei test

Testare il login completo e utile, ma non va ripetuto in ogni scenario.

Strategie comuni:
- un test dedicato verifica il flusso login reale;
- gli altri test partono da uno stato autenticato preparato;
- si usa storage state, cookie o API helper per creare sessione.

Questo evita test lenti e ripetitivi.

Si collega a [[Programmazione/React/Pagine/Gestione Autenticazione]] e [[Programmazione/React/Pagine/React Router]], soprattutto per route protette.

---

## 10. Flakiness

La **flakiness** e uno dei problemi principali dei test E2E: un test passa a volte e fallisce altre senza cambi reali nel codice.

Cause comuni:
- attese temporali fisse;
- dati non deterministici;
- dipendenza da servizi esterni instabili;
- animazioni non gestite;
- race condition tra UI e API;
- selettori fragili.

Meglio evitare:

```javascript
await page.waitForTimeout(1000);
```

Meglio aspettare condizioni reali:

```javascript
await expect(page.getByText("Salvato")).toBeVisible();
```

---

## 11. E2E e accessibilita

I test E2E possono aiutare anche sull'accessibilita:
- navigazione da tastiera;
- focus dopo apertura modal;
- label e ruoli usati nei selector;
- integrazione con controlli automatici.

Non sostituiscono [[Programmazione/React/Pagine/Test di accessibilita]], ma possono rafforzare i flussi principali.

Quando i test usano `getByRole` e `getByLabel`, spingono anche il markup verso scelte piu accessibili.

---

## 12. Quando non usare E2E

Non tutto va testato end-to-end.

Evita E2E per:
- pura logica di utilita;
- rendering banale di componenti piccoli;
- edge case gia coperti bene da unit test;
- dettagli visuali minori;
- combinazioni troppo numerose e costose.

Per questi casi, [[Programmazione/React/Pagine/Testing Jest]] o test di componente sono spesso piu economici e manutenibili.

---

## 13. Piramide dei test

Una strategia sana di test frontend di solito combina:
- molti unit/component test;
- alcuni integration test;
- pochi E2E sui flussi critici.

Gli E2E hanno alto valore, ma anche costo alto:
- piu lenti;
- piu complessi;
- piu sensibili all'ambiente;
- piu costosi da debuggare.

Per questo vanno usati sui percorsi che proteggono davvero il prodotto.

---

## 14. Best Practices

1. **Testa flussi utente critici, non ogni dettaglio:** login, checkout, route protette e submit importanti sono ottimi candidati.
2. **Usa selettori orientati all'utente:** ruoli, label e testo rendono i test piu robusti e accessibili.
3. **Evita attese fisse:** aspetta condizioni reali della UI o della rete.
4. **Riduci flakiness controllando dati e ambiente:** fixture, seed e sessioni stabili rendono i test piu affidabili.
5. **Non ripetere login completo in ogni test:** prepara sessioni quando il login non e l'oggetto del test.
6. **Scegli Cypress o Playwright in base al contesto:** debug locale e DX da un lato, cross-browser e CI robusta dall'altro.

---
