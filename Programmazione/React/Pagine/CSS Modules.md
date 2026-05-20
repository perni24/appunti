---
date: 2026-05-20
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

## Concetto chiave

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

## Quando usarli

- Componenti con stile locale.
- Progetti piccoli e medi.
- Design system semplici.
- App che non richiedono runtime CSS-in-JS.

## Errori comuni

- Usare selettori globali dentro moduli locali.
- Duplicare troppe varianti invece di usare props o classi compose.
- Confondere CSS Modules con scoped CSS completo.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/React/Pagine/Styling base|Styling base]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]


