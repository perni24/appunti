---
date: 2026-06-02
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - react
  - css
  - styling
aliases: []
prerequisites: []
related: []
---

# CSS Modules

## Sintesi

I **CSS Modules** permettono di scrivere CSS locale a un componente React, evitando collisioni globali tra nomi di classi.

## Quando usarlo

### Quando usarli
- Componenti con stile locale.
- Progetti piccoli e medi.
- Design system semplici.
- App che non richiedono runtime CSS-in-JS.

## Come funziona

### Concetto chiave
Il file CSS viene importato come oggetto JavaScript. Le classi vengono trasformate in nomi univoci durante la build.

```css
/* Button.module.css */
.button {
  padding: 8px 12px;
}
```

```jsx
import styles from "./Button.module.css";

export function Button() {
  return <button className={styles.button}>Salva</button>;
}
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

- Usare selettori globali dentro moduli locali.
- Duplicare troppe varianti invece di usare props o classi compose.
- Confondere CSS Modules con scoped CSS completo.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/React/Pagine/Styling base|Styling base]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]
