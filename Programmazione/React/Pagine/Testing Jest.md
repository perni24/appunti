---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: "non revisionato"
difficulty: intermediate
tags: [react, testing, jest, vitest]
aliases: [Testing Jest, Testing Library, Unit test React]
prerequisites: []
related: []
---

# Testing Jest

## Sintesi

I test unitari e component test in React verificano rendering, interazioni e comportamento osservabile. Oggi si usano spesso Testing Library con Jest o Vitest.

La filosofia consigliata e testare come l'utente usa la UI, non dettagli interni del componente.

## Quando usarlo

Usali per componenti riusabili, logica di form, custom hook, rendering condizionale, error state, accessibilita base e regressioni.

## Come funziona

```jsx
render(<Button onClick={handleClick}>Salva</Button>);

await user.click(screen.getByRole("button", { name: /salva/i }));

expect(handleClick).toHaveBeenCalled();
```

Query per ruolo e nome accessibile rendono il test piu vicino all'esperienza reale.

## API / Sintassi

Render:

```jsx
render(<Component />);
```

Query:

```jsx
screen.getByRole("button", { name: /salva/i });
screen.getByLabelText(/email/i);
```

Interazione:

```jsx
const user = userEvent.setup();
await user.type(input, "luca@example.com");
```

## Esempio pratico

```jsx
test("mostra errore quando email e vuota", async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.click(screen.getByRole("button", { name: /accedi/i }));

  expect(screen.getByText(/email obbligatoria/i)).toBeInTheDocument();
});
```

## Varianti

- **Unit test**: funzioni pure.
- **Component test**: rendering e interazione.
- **Hook test**: custom hook.
- **Mock API**: MSW o mock del client.
- **Snapshot test**: da usare con cautela.
- **Vitest**: alternativa moderna a Jest in progetti Vite.

## Errori comuni

- Testare implementazione invece del comportamento.
- Usare snapshot enormi.
- Cercare elementi per classi CSS.
- Non testare stati errore.
- Mockare troppo.
- Ignorare accessibilita delle query.

## Checklist

- Il test descrive comportamento utente?
- Usa role, label o testo accessibile?
- Copre errori e stati importanti?
- I mock sono minimi?
- Il test e deterministico?
- I custom hook critici sono coperti?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Testing Cypress e Playwright]]
- [[Test di accessibilita]]
- [[Storybook]]
- [[Custom Hooks]]
