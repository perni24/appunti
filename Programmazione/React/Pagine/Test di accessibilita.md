---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, accessibility, testing]
aliases: [Test di accessibilita, A11y testing]
prerequisites: []
related: []
---

# Test di accessibilita

## Sintesi

I test di accessibilita verificano che componenti e pagine siano usabili da tastiera, screen reader e utenti con esigenze diverse. I test automatici aiutano, ma non sostituiscono controlli manuali.

## Quando usarlo

Usali per form, modali, menu, navigazione, componenti custom, design system, route principali e flussi critici.

## Come funziona

Testing Library incoraggia query accessibili:

```jsx
screen.getByRole("button", { name: /salva/i });
```

Questo verifica che il componente esponga ruolo e nome accessibile.

## API / Sintassi

Esempio:

```jsx
render(<LoginForm />);

expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
expect(screen.getByRole("button", { name: /accedi/i })).toBeEnabled();
```

Con strumenti automatici puoi rilevare violazioni comuni, ma serve anche test tastiera.

## Esempio pratico

Test modal:

```jsx
render(<Dialog open />);

expect(screen.getByRole("dialog")).toBeInTheDocument();
expect(screen.getByRole("button", { name: /chiudi/i })).toHaveFocus();
```

## Varianti

- **Unit a11y**: componenti con Testing Library.
- **Automated scans**: axe o strumenti simili.
- **Keyboard testing**: tab, shift-tab, Escape, Enter.
- **E2E a11y**: Playwright/Cypress su flussi reali.
- **Manual screen reader check**: indispensabile per componenti complessi.

## Errori comuni

- Affidarsi solo a test automatici.
- Testare per classi CSS invece che ruoli accessibili.
- Ignorare focus management.
- Non testare errori form.
- Non verificare stati dinamici ARIA.

## Checklist

- Le query usano role/label/testo accessibile?
- La navigazione tastiera funziona?
- Focus iniziale e ritorno focus sono corretti?
- Gli errori form sono annunciabili?
- I componenti custom seguono pattern ARIA?
- Esiste almeno un controllo manuale sui flussi critici?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[WAI-ARIA]]
- [[Focus Management]]
- [[Testing Jest]]
- [[Testing Cypress e Playwright]]
