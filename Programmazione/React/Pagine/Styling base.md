---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - react
  - css
  - styling
aliases:
  - Styling base
  - Styling React
prerequisites:
  - "[[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]"
  - "[[Programmazione/React/Pagine/JSX|JSX]]"
related:
  - "[[Programmazione/React/Pagine/CSS Modules|CSS Modules]]"
  - "[[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]"
title: Styling base
---

# Styling base

## Sintesi

React assegna classi e stili agli elementi; il browser applica le normali regole CSS. Non esiste una cascata speciale di React. Scegli una strategia coerente, definisci i token condivisi e verifica anche tastiera, stati interattivi e schermi stretti.

Il progetto qui usa CSS globale con nomi riconoscibili, React 19.3.0 e Vite 8.3.4. Non richiede una libreria di stile; per limitare i nomi di classe al file vedi [[Programmazione/React/Pagine/CSS Modules|CSS Modules]].

## Quando usarlo

Usa classi CSS per regole riutilizzabili, pseudo-classi e media query. Usa `style` per valori realmente dinamici, per esempio una dimensione calcolata o una custom property derivata dallo stato. Token e componenti condivisi aiutano quando gli stessi valori o comportamenti si ripetono, anche senza un grande design system.

## Come funziona

### CSS caricato dalla toolchain

In un modulo del progetto Vite:

```jsx
import "./styles.css";
```

L'import rende il foglio disponibile, ma non lo limita al componente che lo importa. Un selettore globale puo raggiungere qualsiasi elemento corrispondente. Controlla in Elements la classe applicata e in Computed il valore finale; una regola barrata in Styles e stata superata dalla cascata.

Quando due regole competono, "l'ultima vince" vale solo dopo aver considerato origine, importanza, layer e specificita. Cambiare l'ordine dei nomi dentro `className` non riordina il CSS. Evita `!important` come prima risposta a ogni conflitto.

### Semantica prima della decorazione

Un attributo `data-variant` e solo un gancio per il CSS; non cambia comportamento o significato accessibile. Una classe chiamata `disabled` non disabilita un pulsante: usa l'attributo HTML `disabled` quando serve. `aria-disabled` comunica uno stato ma non blocca automaticamente eventi e focus.

Mantieni il focus visibile da tastiera; non togliere `outline` senza sostituirlo con un indicatore adeguato. `:focus-visible` segue le euristiche del browser, non significa semplicemente "focus solo da tastiera". Gli stati selezionati/errori devono essere comprensibili anche senza distinguerne il colore.

## API / Sintassi

Schema JSX: `style` riceve un oggetto, non una stringa CSS. I nomi ordinari sono camelCase; i valori numerici diventano generalmente pixel, con eccezioni senza unita come `opacity` e `zIndex`.

```jsx
<div style={{ display: "flex", gap: 8, opacity: 0.9 }} />
```

Le chiavi delle custom properties mantengono i trattini: `style={{ "--space": "12px" }}`. Fornisci tu l'unita quando la variabile deve essere una lunghezza. Non puoi mettere `:hover` o `@media` in un normale oggetto `style`: scrivi quelle regole nel CSS.

I token con prefisso `--` seguono cascata ed ereditarieta. `var(--color-text, #202520)` fornisce un fallback se la variabile e assente o invalida come custom property; non corregge automaticamente un valore presente ma inadatto alla proprieta che lo usa. React non valida una palette o un foglio di stile arbitrario ricevuto dall'utente.

## Esempio pratico

### Preferenze con tema locale e spaziatura dinamica

Nel progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]] mantieni configurazione, HTML e main. Sostituisci `src/App.jsx` e aggiungi `src/styles.css`. Questa demo applica preferenze in memoria: non salva su disco o server e il reload ripristina i valori iniziali.

`src/App.jsx`:

```jsx
import { useState } from "react";
import "./styles.css";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [spacing, setSpacing] = useState(16);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("");

  function reset() {
    setTheme("light");
    setSpacing(16);
    setLocked(false);
    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!locked) setMessage("Preferenze applicate localmente.");
  }

  return (
    <main
      className="preferences"
      data-theme={theme}
      style={{ "--space": `${spacing}px` }}
    >
      <h1>Preferenze interfaccia</h1>
      <form className="preferences-form" onSubmit={handleSubmit}>
        <div className="preferences-fields">
          <label className="preferences-field">
            Tema
            <select value={theme} onChange={(event) => {
              setTheme(event.target.value);
              setMessage("");
            }}>
              <option value="light">Chiaro</option>
              <option value="dark">Scuro</option>
            </select>
          </label>
          <label className="preferences-field">
            Spaziatura: {spacing} px
            <input type="range" min="8" max="24" step="1"
              value={spacing} onChange={(event) => {
                setSpacing(Number(event.target.value));
                setMessage("");
              }} />
          </label>
        </div>
        <label className="preferences-toggle">
          <input type="checkbox" checked={locked}
            onChange={(event) => setLocked(event.target.checked)} />
          Blocca salvataggio
        </label>
        <div className="preferences-actions">
          <button className="preferences-button" data-variant="primary"
            type="submit" disabled={locked}>
            Salva preferenze
          </button>
          <button className="preferences-button" type="button" onClick={reset}>
            Ripristina
          </button>
        </div>
        <p className="preferences-status" role="status">{message}</p>
      </form>
    </main>
  );
}
```

`src/styles.css`:

```css
:root {
  font-family: system-ui, sans-serif;
  --color-text: #202520;
  --color-surface: #ffffff;
  --color-border: #89918a;
  --color-primary: #176b46;
  --color-on-primary: #ffffff;
  --color-focus: #854400;
}

* { box-sizing: border-box; }
body { margin: 0; background: #f5f6f5; }
button, input, select { font: inherit; }

.preferences {
  max-width: 48rem;
  min-width: 0;
  margin-inline: auto;
  padding: 1.5rem;
  color: var(--color-text);
  background: var(--color-surface);
  color-scheme: light;
  overflow-wrap: anywhere;
}
.preferences[data-theme="dark"] {
  --color-text: #f5f6f5;
  --color-surface: #202622;
  --color-border: #9ba49d;
  --color-primary: #91d9b3;
  --color-on-primary: #10271a;
  --color-focus: #f2c56b;
  color-scheme: dark;
}
.preferences h1 { margin: 0 0 1.5rem; font-size: 1.5rem; }
.preferences-form { display: grid; gap: var(--space, 16px); }
.preferences-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space, 16px);
}
.preferences-field { display: grid; gap: 0.5rem; min-width: 0; }
.preferences-field select,
.preferences-field input { width: 100%; min-width: 0; }
.preferences-field select { padding: 0.5rem; }
.preferences-toggle { display: flex; align-items: center; gap: 0.5rem; }
.preferences-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.preferences-button {
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  color: var(--color-text);
  overflow-wrap: anywhere;
  cursor: pointer;
  transition: border-color 120ms ease;
}
.preferences-button[data-variant="primary"] {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.preferences-button:not(:disabled):hover { border-color: var(--color-text); }
.preferences-button:disabled { opacity: 0.55; cursor: not-allowed; }
.preferences :focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
.preferences-status { margin: 0; min-height: 3rem; }

@media (max-width: 35rem) {
  .preferences { padding: 1rem; }
  .preferences-fields { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .preferences-button { transition: none; }
}
```

Il tema e locale a `main`, non a tutto il documento. `color-scheme` aiuta il browser a scegliere l'aspetto dei controlli nativi, ma non sostituisce la palette. Lo slider aggiorna una custom property; media query e stati restano nel CSS. La larghezza delle colonne puo ridursi grazie a `minmax(0, 1fr)` e `min-width: 0`.

### Verifica pratica

1. Avvia `npm run dev`. Cambia tema e spaziatura e controlla i valori calcolati in Computed.
2. Usa Tab per raggiungere ogni controllo: il focus deve essere visibile. Spunta Blocca salvataggio e verifica che il pulsante sia realmente disabilitato.
3. Prova Salva preferenze e Ripristina. La conferma e testuale e il reset ripristina anche tema, slider e checkbox.
4. Riduci la finestra a 390 px e ingrandisci il testo: controlla contenuti lunghi e assenza di scroll orizzontale della pagina. Non nascondere un difetto con `overflow-x: hidden` sul body.
5. Emula `prefers-reduced-motion: reduce` e verifica che la transizione del pulsante scompaia. Misura contrasto di testo, controlli e focus: un tema scuro da solo non garantisce accessibilita.

Controlla separatamente la build prodotta:

```sh
npm run build
```

```sh
npm run preview
```

## Varianti

- **CSS globale**: pochi strumenti, ma richiede una convenzione dei nomi e controllo della cascata.
- **CSS Modules**: nomi locali al file, mantenendo il normale CSS; non elimina ereditarieta e regole globali.
- **Utility CSS**: composizione mediante classi predefinite; convenzioni, generazione e configurazione dipendono dallo strumento scelto.
- **CSS-in-JS**: categoria di soluzioni, alcune runtime e altre con estrazione in build. Non assumere stessi costi, compatibilita SSR o requisiti CSP per tutte.
- **Design tokens e librerie di componenti**: distinguere valori condivisi da componenti con comportamento. Una libreria non rende automaticamente accessibili tutte le combinazioni d'uso.

## Errori comuni

- Importare un foglio globale aspettandosi scope locale.
- Usare inline style per media query, pseudo-classi o ogni dettaglio statico.
- Lasciare variabili CSS senza definizione o usare un numero senza unita per una lunghezza dinamica.
- Confondere uno stato decorativo con `disabled`, `aria-pressed` o altra semantica.
- Rimuovere focus, affidarsi solo al colore o impostare altezze fisse che tagliano testi lunghi.
- Aggiungere JavaScript per un adattamento che una media query risolve gia.

## Checklist

- La strategia styling e coerente?
- Token e variabili sono centralizzati?
- Stati interattivi sono coperti?
- Focus visible resta evidente?
- Il CSS scala con il progetto?
- Le classi sono leggibili e mantenibili?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/CSS Modules|CSS Modules]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]
- [[Programmazione/React/Pagine/Animazioni e Micro-interazioni|Animazioni e Micro-interazioni]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]

## Fonti

Documentazione consultata il 2026-10-15; esempio riferito alle versioni della sintesi.

- [React: className e style](https://react.dev/reference/react-dom/components/common).
- [Vite: import CSS](https://vite.dev/guide/features#css).
- [Cascata e precedenza](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction).
- [Custom properties, ereditarieta e fallback](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties).
- [Focus visibile](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible).
- [Attributo HTML disabled](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled).
- [Preferenza di movimento ridotto](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).
