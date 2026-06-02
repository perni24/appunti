---
date: 2026-06-02
area: Programmazione
topic: React
type: operational-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - react
  - testing
  - design-system
aliases: []
prerequisites: []
related: []
---

# Storybook

## Sintesi

**Storybook** e uno strumento per sviluppare, documentare e testare componenti UI in isolamento.

## Quando usarlo

- Design system.
- Componenti riusabili.
- Stati complessi: loading, error, empty.
- Documentazione UI condivisa.

## Come funziona

### Concetto chiave
Una story descrive uno stato visivo di un componente. Questo permette di vedere varianti senza navigare l'intera applicazione.

```jsx
import { Button } from "./Button";

export default {
  component: Button
};

export const Primary = {
  args: {
    variant: "primary",
    children: "Salva"
  }
};
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

### Procedura
1. Da completare.
2. Da completare.
3. Da completare.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

- Scrivere story non rappresentative.
- Non includere stati limite.
- Lasciare Storybook scollegato dai test o dal design system.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Visual regression testing|Visual regression testing]]
- [[Programmazione/React/Pagine/Testing Jest|Testing Jest]]
