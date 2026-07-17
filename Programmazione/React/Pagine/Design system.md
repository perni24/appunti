---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, design-system, ui]
aliases: [Design system, Component library]
prerequisites: []
related: []
---

# Design system

## Sintesi

Un design system e un insieme coerente di token, componenti, pattern, linee guida e documentazione per costruire UI consistenti. In React spesso si concretizza in una libreria di componenti riusabili.

## Quando usarlo

Serve quando piu schermate, team o prodotti devono condividere linguaggio visivo, accessibilita e comportamento. Per progetti piccoli basta spesso una UI kit leggera.

## Come funziona

Livelli:

```text
design tokens -> componenti base -> pattern composti -> pagine
```

Esempio:

```jsx
<Button variant="primary" size="sm">
  Salva
</Button>
```

Il componente incapsula stile, stati, focus e accessibilita.

## API / Sintassi

Token:

```css
:root {
  --color-primary: #1f6feb;
  --space-2: 8px;
}
```

Componente:

```jsx
function Button({ variant = "primary", children, ...props }) {
  return <button data-variant={variant} {...props}>{children}</button>;
}
```

## Esempio pratico

Un input del design system deve includere:

- label;
- descrizione opzionale;
- errore;
- stato disabled;
- focus visible;
- attributi ARIA;
- test.

## Varianti

- **Token-only**: solo variabili e linee guida.
- **Component library**: componenti React.
- **Headless components**: logica senza stile.
- **Storybook**: documentazione interattiva.
- **Design system multi-brand**: token per tema.

## Errori comuni

- Creare componenti troppo rigidi.
- Ignorare accessibilita.
- Non documentare varianti e limiti.
- Aggiungere componenti duplicati.
- Non versionare breaking changes.
- Confondere design system e raccolta casuale di componenti.

## Checklist

- Esistono token condivisi?
- I componenti sono accessibili?
- Varianti e stati sono documentati?
- Storybook o docs sono aggiornati?
- I componenti sono testati?
- Le API sono stabili?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Storybook]]
- [[Visual regression testing]]
- [[WAI-ARIA]]
- [[CSS Modules]]
- [[Compound Components Pattern]]
