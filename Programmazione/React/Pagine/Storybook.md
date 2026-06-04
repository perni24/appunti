---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: "non revisionato"
difficulty: intermediate
tags: [react, storybook, design-system, testing]
aliases: [Storybook]
prerequisites: []
related: []
---

# Storybook

## Sintesi

Storybook permette di sviluppare, documentare e testare componenti UI in isolamento. E utile per design system, component library, stati visuali e collaborazione tra design e sviluppo.

## Quando usarlo

Usalo quando hai componenti riusabili, molte varianti, stati da documentare o un design system. Per app piccole puo essere superfluo.

## Come funziona

Ogni componente ha storie che descrivono varianti:

```jsx
export default {
  title: "UI/Button",
  component: Button,
};

export const Primary = {
  args: {
    variant: "primary",
    children: "Salva",
  },
};
```

## API / Sintassi

Installazione tipica:

```bash
npx storybook@latest init
npm run storybook
```

Storia con args:

```jsx
export const Disabled = {
  args: {
    disabled: true,
    children: "Disabilitato",
  },
};
```

## Esempio pratico

Per un input documenta:

- default;
- disabled;
- errore;
- con descrizione;
- con valore lungo;
- focus/interaction test se previsto.

## Varianti

- **Component stories**: varianti visuali.
- **Docs mode**: documentazione.
- **Interaction tests**: test su eventi.
- **A11y addon**: controlli accessibilita.
- **Visual regression**: snapshot visuali.
- **Design system catalog**: libreria componenti.

## Errori comuni

- Scrivere storie solo per happy path.
- Non documentare stati errore e disabled.
- Lasciare storie rotte fuori dalla CI.
- Usare dati reali sensibili.
- Duplicare documentazione e componenti senza sincronizzazione.

## Checklist

- Ogni componente critico ha storie?
- Stati principali sono coperti?
- Le storie usano dati sicuri?
- Storybook gira in CI?
- A11y e visual regression sono integrati se servono?
- Le storie aiutano davvero chi usa il componente?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Design system]]
- [[Visual regression testing]]
- [[Test di accessibilita]]
- [[Testing Jest]]
