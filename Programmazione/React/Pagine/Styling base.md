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

# Styling base

## Sintesi

Lo **styling base** in React riguarda i modi principali per applicare CSS ai componenti: classi globali, CSS Modules, inline style, utility class e librerie dedicate.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Strategie comuni
- CSS globale.
- [[Programmazione/React/Pagine/CSS Modules|CSS Modules]].
- Inline style.
- Utility CSS.
- CSS-in-JS.
- Component library.
### Regola pratica
Usa CSS normale o CSS Modules per componenti semplici. Usa astrazioni piu forti solo quando devi gestire tema, varianti, design system o stati complessi.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

### Esempio con className
```jsx
export function Alert() {
  return <div className="alert alert-error">Errore</div>;
}
```
### Esempio con style inline
```jsx
export function Box() {
  return <div style={{ display: "flex", gap: 8 }} />;
}
```

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/React/Pagine/CSS Modules|CSS Modules]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Componenti Funzionali vs Componenti a Classe|Componenti]]
