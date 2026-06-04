---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [react, css, styling]
aliases: [Styling base, Styling React]
prerequisites: []
related: []
---

# Styling base

## Sintesi

Lo styling in React puo essere fatto con CSS globale, CSS Modules, utility CSS, CSS-in-JS o design system. La scelta deve dipendere da scala del progetto, team, performance, theming e manutenibilita.

## Quando usarlo

Serve in ogni progetto React. Per app piccole CSS globale e moduli bastano spesso; per prodotti grandi conviene introdurre token e componenti condivisi.

## Come funziona

CSS globale:

```jsx
import "./styles.css";
```

Classi:

```jsx
function Button() {
  return <button className="button">Salva</button>;
}
```

## API / Sintassi

Inline style:

```jsx
<div style={{ display: "flex", gap: 8 }} />
```

CSS Module:

```jsx
import styles from "./Card.module.css";

<article className={styles.card} />
```

Variabili CSS:

```css
:root {
  --color-text: #111;
}
```

## Esempio pratico

```css
.button {
  border: 0;
  padding: 8px 12px;
}

.button[data-variant="primary"] {
  background: var(--color-primary);
}
```

```jsx
<button className="button" data-variant="primary">Salva</button>
```

## Varianti

- **CSS globale**: reset, base, token.
- **CSS Modules**: scope locale.
- **Utility CSS**: composizione rapida.
- **CSS-in-JS**: stile vicino al componente.
- **Design tokens**: colori, spacing, typografia.
- **Component library**: stile incapsulato.

## Errori comuni

- Mescolare troppi approcci.
- Usare inline style per tutto.
- Non definire token.
- Ignorare stati hover, focus, disabled.
- Rompere accessibilita rimuovendo focus visible.
- Non controllare responsive e overflow.

## Checklist

- La strategia styling e coerente?
- Token e variabili sono centralizzati?
- Stati interattivi sono coperti?
- Focus visible resta evidente?
- Il CSS scala con il progetto?
- Le classi sono leggibili e mantenibili?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[CSS Modules]]
- [[Design system]]
- [[WAI-ARIA]]
- [[Animazioni e Micro-interazioni]]
