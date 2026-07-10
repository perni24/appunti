---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [react, css, styling]
aliases: [CSS Modules]
prerequisites: []
related: []
---

# CSS Modules

## Sintesi

CSS Modules permette di scrivere CSS locale a un componente. Le classi vengono trasformate in nomi unici in build, evitando collisioni globali.

## Quando usarlo

Usalo quando vuoi CSS tradizionale ma con scope locale, senza introdurre CSS-in-JS o utility framework. E adatto a componenti, pagine e design system piccoli/medi.

## Come funziona

File `Button.module.css`:

```css
.root {
  padding: 8px 12px;
}
```

Uso:

```jsx
import styles from "./Button.module.css";

export function Button({ children }) {
  return <button className={styles.root}>{children}</button>;
}
```

## API / Sintassi

Composizione classi:

```jsx
<button className={`${styles.root} ${styles.primary}`} />
```

Variabili CSS:

```css
.root {
  color: var(--color-text);
}
```

## Esempio pratico

```css
.card {
  border: 1px solid var(--border-color);
  padding: 16px;
}

.selected {
  border-color: var(--accent-color);
}
```

```jsx
<article className={selected ? `${styles.card} ${styles.selected}` : styles.card} />
```

## Varianti

- **CSS globale**: reset, token, base typography.
- **CSS Modules**: stile locale.
- **Utility CSS**: classi atomiche.
- **CSS-in-JS**: stile legato a runtime o build.
- **Design tokens**: variabili condivise.

## Errori comuni

- Mettere reset globali dentro module.
- Creare classi troppo generiche e non semantiche.
- Duplicare token invece di usare variabili.
- Costruire stringhe className complesse senza helper.
- Confondere scope locale e isolamento completo del DOM.

## Checklist

- Il file e `*.module.css`?
- Gli stili globali restano separati?
- I token sono centralizzati?
- Le classi descrivono parti del componente?
- La composizione resta leggibile?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Styling base]]
- [[Design system]]
- [[Programmazione/React/Pagine/Linting e Formattazione|Linting e Formattazione]]
