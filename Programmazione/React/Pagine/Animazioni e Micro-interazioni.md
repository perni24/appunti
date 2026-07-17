---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, animation, ux]
aliases: [Animazioni React, Micro-interazioni, Framer Motion, React Spring]
prerequisites: []
related: []
---

# Animazioni e Micro-interazioni

## Sintesi

Animazioni e micro-interazioni comunicano cambiamento, feedback e continuita nella UI. In React possono essere gestite con CSS, Web Animations API o librerie come Framer Motion e React Spring.

Devono migliorare comprensione e feedback, non decorare senza scopo.

## Quando usarlo

Usale per transizioni di stato, apertura/chiusura, drag, feedback su azioni, skeleton, toast e cambi layout. Evitale se peggiorano performance o accessibilita.

## Come funziona

CSS semplice:

```css
.panel {
  transition: opacity 150ms ease;
}
```

React controlla stato e classi:

```jsx
<div className={open ? "panel open" : "panel"} />
```

## API / Sintassi

Con Framer Motion:

```jsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
```

Rispetto preferenze utente:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms;
    transition-duration: 0.01ms;
  }
}
```

## Esempio pratico

Toast:

```jsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 8 }}
>
  Salvato
</motion.div>
```

## Varianti

- **CSS transitions**: semplici e leggere.
- **CSS animations**: loop o keyframe.
- **Framer Motion**: animazioni dichiarative.
- **React Spring**: animazioni fisiche.
- **View transitions**: API browser/framework in evoluzione.
- **Reduced motion**: accessibilita.

## Errori comuni

- Animare proprieta costose.
- Ignorare `prefers-reduced-motion`.
- Usare animazioni lente su flussi operativi.
- Nascondere feedback importante dietro animazioni.
- Non gestire mount/unmount.

## Checklist

- L'animazione comunica qualcosa?
- Rispetta reduced motion?
- Usa proprieta performanti?
- Non blocca interazione?
- E testata su dispositivi lenti?
- Il fallback senza animazione resta chiaro?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Focus Management]]
- [[Design system]]
- [[Profiler e Debugging]]
- [[Visual regression testing]]
