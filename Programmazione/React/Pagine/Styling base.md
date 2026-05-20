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

# Styling base

## Sintesi

Lo **styling base** in React riguarda i modi principali per applicare CSS ai componenti: classi globali, CSS Modules, inline style, utility class e librerie dedicate.

## Strategie comuni

- CSS globale.
- [[Programmazione/React/Pagine/CSS Modules|CSS Modules]].
- Inline style.
- Utility CSS.
- CSS-in-JS.
- Component library.

## Esempio con className

```jsx
export function Alert() {
  return <div className="alert alert-error">Errore</div>;
}
```

## Esempio con style inline

```jsx
export function Box() {
  return <div style={{ display: "flex", gap: 8 }} />;
}
```

## Regola pratica

Usa CSS normale o CSS Modules per componenti semplici. Usa astrazioni piu forti solo quando devi gestire tema, varianti, design system o stati complessi.

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

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/React/Pagine/CSS Modules|CSS Modules]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Componenti Funzionali vs Componenti a Classe|Componenti]]


