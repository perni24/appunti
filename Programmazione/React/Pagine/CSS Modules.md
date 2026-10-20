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
  - CSS Modules
prerequisites:
  - "[[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]"
  - "[[Programmazione/React/Pagine/JSX|JSX]]"
related:
  - "[[Programmazione/React/Pagine/Styling base|Styling base]]"
  - "[[Programmazione/React/Pagine/Design system|Design system]]"
title: CSS Modules
---

# CSS Modules

## Sintesi

CSS Modules fa trasformare alla toolchain i nomi locali di classi e animazioni e restituisce a JavaScript una mappa di nomi utilizzabili. Riduce le collisioni fra file, **non crea un DOM isolato** e non e una funzione di React.

Questa nota usa React 19.3.0 e Vite 8.3.4 con il plugin React 6.1.2, come in [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Il supporto descritto e quello di Vite: non un import CSS nativo eseguibile direttamente dal browser senza trasformazione.

## Quando usarlo

Usalo quando vuoi mantenere file CSS separati, pseudo-classi e media query senza assegnare un prefisso manuale a ogni classe. Lo scope locale e utile tanto in una pagina quanto in una libreria di componenti; la dimensione del progetto da sola non impone una soluzione.

Mantieni globali solo le regole volutamente condivise, come reset e token. Per cambiare il tema puoi continuare a usare custom properties CSS ereditate.

## Come funziona

In Vite il suffisso `*.module.css` attiva la trasformazione. `styles.root` e la stringa prodotta per `.root`, non il nome letterale `root`; il formato generato non va copiato nel codice o negli snapshot dei test.

Schema minimo, da completare con il progetto della sezione pratica:

```css
.root {
  padding: 0.5rem 0.75rem;
}
```

Uso:

```jsx
import styles from "./Button.module.css";

export function Button({ children }) {
  return <button type="button" className={styles.root}>{children}</button>;
}
```

I due file del progetto seguente dichiarano entrambi `.root`, ma ricevono nomi locali diversi. La classe resta locale **al file**, non a ciascuna istanza: due pulsanti che importano lo stesso modulo usano gli stessi nomi.

## API / Sintassi

### Selezionare e combinare classi

Schemi JSX nel contesto di un componente che ha gia importato `styles`:

```jsx
<button type="button" className={`${styles.root} ${styles.selected}`}>
  Selezionato
</button>
```

Per un nome con trattino usa `styles["card-title"]`. Non presumere che `styles.cardTitle` esista: dipende dalla convenzione configurata. Un nome inesistente puo dare `undefined` senza un errore di compilazione JavaScript; controlla il DOM o aggiungi verifiche statiche appropriate.

L'ordine delle classi dentro `className` non stabilisce quale regola prevale. Contano cascata, specificita e ordine delle dichiarazioni CSS. Una lista lunga di condizioni puo usare un helper come `clsx`, ma non e necessario per due classi.

### Composizione CSS e scope globale

`composes: root` fa esportare piu classi per quella variante; non copia semplicemente tutte le dichiarazioni in una nuova regola. Va usato su una singola classe locale, prima delle altre dichiarazioni. Il progetto sotto include una variante composta effettivamente usata.

`:global(.external-label)` lascia globale quella parte del selettore. `.card :global(.external-label)` resta limitato ai discendenti di `.card`; `:global(.external-label)` da solo si applicherebbe ovunque. Un selettore nudo come `button` non diventa locale solo perche e scritto in un file module.

## Esempio pratico

Nel progetto introduttivo mantieni package.json, configurazione, HTML e `main.jsx`. Sostituisci `App.jsx` e aggiungi questi quattro file nella stessa cartella `src`:

```text
src/
  App.jsx
  App.module.css
  Button.jsx
  Button.module.css
  tokens.css
  main.jsx
```

`src/tokens.css`, regole volutamente globali:

```css
:root {
  font-family: system-ui, sans-serif;
  --color-text: #202520;
  --color-surface: #ffffff;
  --color-border: #89918a;
  --color-accent: #176b46;
  --color-on-accent: #ffffff;
  --color-focus: #854400;
}

* { box-sizing: border-box; }
body { margin: 0; background: #f5f6f5; }
button { font: inherit; }
```

`src/Button.module.css`:

```css
.root {
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  color: var(--color-text);
  overflow-wrap: anywhere;
  cursor: pointer;
}

.root:not(:disabled):hover { border-color: var(--color-accent); }
.root:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
.root:disabled { opacity: 0.55; cursor: not-allowed; }

.primary {
  composes: root;
  background: var(--color-accent);
  color: var(--color-on-accent);
}
```

`src/Button.jsx`: props come `disabled`, `onClick` e `aria-pressed` vengono inoltrate al pulsante. Le varianti sconosciute ricadono sullo stile base.

```jsx
import styles from "./Button.module.css";

export default function Button({
  children, variant = "secondary", className = "", type = "button", ...props
}) {
  const localClass = variant === "primary" ? styles.primary : styles.root;
  return (
    <button
      {...props}
      type={type}
      className={[localClass, className].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}
```

`src/App.module.css`:

```css
.root {
  max-width: 45rem;
  min-width: 0;
  margin-inline: auto;
  padding: 1rem;
  color: var(--color-text);
  overflow-wrap: anywhere;
}
.root h1 { font-size: 1.5rem; }

.card {
  border: 2px solid var(--color-border);
  border-radius: 4px;
  padding: 1rem;
  background: var(--color-surface);
  overflow-wrap: anywhere;
}
.selected { border-color: var(--color-accent); }
.card :global(.external-label) { font-weight: 700; }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
```

`src/App.jsx`:

```jsx
import { useState } from "react";
import Button from "./Button.jsx";
import styles from "./App.module.css";
import "./tokens.css";

export default function App() {
  const [selected, setSelected] = useState(false);
  const cardClass = [styles.card, selected && styles.selected]
    .filter(Boolean).join(" ");

  return (
    <main className={styles.root}>
      <h1>Preferenze progetto</h1>
      <article className={cardClass}>
        <h2>Profilo locale</h2>
        <p className="external-label">Dati locali</p>
        <p role="status">{selected ? "Scheda selezionata" : "Scheda non selezionata"}</p>
        <div className={styles.actions}>
          <Button
            variant="primary"
            aria-pressed={selected}
            onClick={() => setSelected((current) => !current)}
          >
            Seleziona scheda
          </Button>
          <Button disabled>Elimina (non disponibile)</Button>
        </div>
      </article>
    </main>
  );
}
```

`external-label` simula un nome globale condiviso: non richiede una libreria. Il bordo cambia insieme al testo e ad `aria-pressed`, quindi il colore non e l'unica indicazione della selezione. La scheda e un elemento ripetibile di esempio, non un contenitore necessario per ogni sezione di pagina.

Avvia `npm run dev` e controlla in Elements i nomi generati. Per verificare anche la build, esegui separatamente:

```sh
npm run build
```

```sh
npm run preview
```

## Varianti

- **CSS globale**: reset, tipografia di base e token; le variabili non sono rinominate automaticamente come le classi.
- **Composizione fra file**: possibile con `composes: nome from "./altro.module.css"`; evita cicli e regole in conflitto la cui precedenza dipende dall'ordine di moduli diversi.
- **Sass**: il suffisso puo essere `.module.scss`, ma serve installare il preprocessore. Non e richiesto dal progetto sopra.
- **Configurazione Vite**: nomi/esportazioni possono essere personalizzati. Se cambi il trasformatore CSS, controlla le opzioni specifiche invece di copiare una configurazione incompatibile.
- **Utility CSS e CSS-in-JS**: alternative con convenzioni e strumenti diversi, non prerequisiti di CSS Modules. Per il confronto vedi [[Programmazione/React/Pagine/Styling base|Styling base]].

## Errori comuni

- Scrivere `className="root"` aspettandosi di usare la `.root` locale.
- Credere che importare il CSS dentro un componente limiti le sue regole alla vita di quell'istanza: montaggio e smontaggio non sono un meccanismo di isolamento CSS.
- Lasciare token usati ma mai definiti: la dichiarazione puo diventare invalida. Definisci i valori o un fallback appropriato.
- Mettere reset, selettori di tag o `:global` indiscriminati nei moduli.
- Pensare che uno stile globale non possa raggiungere il componente: ereditarieta e cascata restano attive; non c'e Shadow DOM.
- Usare nomi generati come API pubblica o confondere l'ordine di `className` con la precedenza CSS.

## Checklist

- Il file e `*.module.css`?
- Gli stili globali restano separati?
- I token sono centralizzati?
- Le classi descrivono parti del componente?
- La composizione resta leggibile?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Styling base|Styling base]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Linting e Formattazione|Linting e Formattazione]]
- [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]

## Fonti

Consultate il 2026-10-15; progetto verificabile con le versioni indicate nella sintesi.

- [CSS Modules: contratto e mappa esportata](https://github.com/css-modules/css-modules).
- [Scope locale](https://github.com/css-modules/css-modules/blob/master/docs/local-scope.md).
- [Composizione e scope globale](https://github.com/css-modules/css-modules/blob/master/docs/composition.md).
- [Vite: CSS Modules e preprocessori](https://vite.dev/guide/features#css-modules).
- [Cascata CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction).
- [Custom properties ed ereditarieta](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties).
