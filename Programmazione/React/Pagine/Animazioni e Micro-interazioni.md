---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - animation
  - ux
aliases:
  - Animazioni React
  - Micro-interazioni
  - Framer Motion
  - React Spring
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/Focus Management|Focus Management]]"
title: Animazioni e Micro-interazioni
---

# Animazioni e Micro-interazioni

## Sintesi

Un'animazione puo rendere comprensibile un cambiamento, ma il significato dell'interazione deve restare chiaro anche senza movimento. React aggiorna lo stato dell'interfaccia; CSS, Web Animations API o una libreria gestiscono l'interpolazione visiva.

Motion for React, gia noto come Framer Motion, e React Spring sono soluzioni diverse. Negli esempi si usano i pacchetti `motion` con import da `motion/react` e `@react-spring/web`.

## Quando usarlo

Usale per feedback di un controllo, ingresso/uscita di contenuti, riordino e continuita tra stati. Per un cambio di colore o opacita basta spesso CSS; per uscita dal DOM, layout coordinato o fisica puo servire una libreria.

Non ritardare il risultato di un'azione soltanto per aspettare un'animazione. Skeleton, toast e transizioni non sostituiscono testo di stato, gestione del focus o annunci accessibili.

## Come funziona

Una transition CSS interpola tra valori quando cambia lo stile di un nodo ancora presente. Se React lo smonta immediatamente, non puo eseguire una normale transizione di uscita su quel nodo. `opacity: 0`, inoltre, non elimina da sola layout, focus o interazione.

Il lifecycle visivo puo quindi durare piu di quello logico: un elemento in uscita rimane brevemente nel DOM, ma non dovrebbe continuare a ricevere azioni. Animare `transform` e `opacity` spesso riduce il lavoro di layout rispetto a dimensioni e posizione, ma non garantisce automaticamente prestazioni o accelerazione GPU: misura sulla UI reale.

## API / Sintassi

| Strumento | Ruolo |
| --- | --- |
| CSS `transition` | Cambiamenti semplici su nodi presenti |
| CSS `@keyframes` | Sequenze temporali, anche ripetute se giustificate |
| Motion `initial`, `animate`, `exit` | Stati di ingresso, destinazione e uscita |
| `AnimatePresence` | Mantiene i figli in uscita fino al termine dell'animazione |
| React Spring `useSpring` | Valori interpolati con un modello a molla |
| `prefers-reduced-motion` | Preferenza da usare per adattare o eliminare movimento non essenziale |

La media query CSS non modifica automaticamente animazioni avviate da JavaScript. Una regola universale con durata `0.01ms` non e una soluzione completa: puo interferire con logiche che aspettano eventi di fine, non elimina tutti i loop e non governa ogni libreria.

## Esempio pratico

### Feedback con CSS

Modulo `CssFeedback.jsx` e relativo `feedback.css`. Il testo di stato si aggiorna subito; la classe controlla soltanto l'aspetto.

```jsx
import { useState } from "react";
import "./feedback.css";

export default function CssFeedback() {
  const [saved, setSaved] = useState(false);
  return <>
    <button type="button" className="feedback-button" aria-pressed={saved}
      onClick={() => setSaved(value => !value)}>Preferiti</button>
    <p role="status">{saved ? "Aggiunto ai preferiti" : "Non nei preferiti"}</p>
  </>;
}
```

```css
.feedback-button {
  padding: 0.5rem 0.75rem;
  color: #111;
  background: #fff;
  border: 1px solid #555;
  transition: transform 150ms ease, background-color 150ms ease;
}
.feedback-button[aria-pressed="true"] { background: #b8e6d0; }
.feedback-button:hover { transform: translateY(-2px); }
.feedback-button:focus-visible { outline: 3px solid #156b50; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  .feedback-button { transition: none; }
  .feedback-button:hover { transform: none; }
}
```

### Ingresso e uscita con Motion

Installa la dipendenza solo nel progetto che usa questo esempio:

```bash
npm install motion@14.2.0
```

Modulo completo. Non e un vero salvataggio: il pulsante mostra un feedback dimostrativo. La live region rimane montata e distinta dal contenuto animato.

```jsx
import { useState } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";

function Notice({ reduce }) {
  const present = useIsPresent();
  return (
    <motion.div aria-hidden={!present} inert={!present}
      initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : 8 }}
      transition={{ duration: reduce ? 0 : 0.18 }}>
      <p>I dettagli della bozza sono aggiornati.</p>
    </motion.div>
  );
}

export default function MotionFeedback() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const reduce = useReducedMotion() === true;
  return <>
    <button type="button" onClick={() => {
      setVisible(true); setMessage("Bozza aggiornata (demo).");
    }}>Mostra feedback</button>
    <button type="button" onClick={() => setVisible(false)}>Nascondi feedback</button>
    <p role="status">{message}</p>
    <AnimatePresence initial={false}>
      {visible && <Notice key="notice" reduce={reduce} />}
    </AnimatePresence>
  </>;
}
```

`AnimatePresence` resta montato mentre cambia il figlio con key stabile. Metterlo dentro lo stesso `visible && ...` eliminerebbe anche il gestore dell'uscita. `useIsPresent` rende il nodo in uscita inerte e non esposto alle tecnologie assistive; i due pulsanti sono esterni e non perdono il focus.

`MotionConfig reducedMotion="user"` e una politica alternativa: disabilita animazioni di transform e layout, ma non elimina necessariamente opacita e colori. Qui la preferenza riduce anche la durata a zero. Durante un'uscita le props del figlio rimosso non vengono aggiornate normalmente; per preferenze cambiate proprio durante quell'intervallo serve una politica esplicita, non una promessa di interruzione universale.

### Feedback con React Spring

Esempio alternativo, non richiede Motion:

```bash
npm install @react-spring/web@10.1.2
```

```jsx
import { useState } from "react";
import { animated, useReducedMotion, useSpring } from "@react-spring/web";

export default function SpringFeedback() {
  const [active, setActive] = useState(false);
  const reduce = useReducedMotion();
  const styles = useSpring({
    transform: active ? "scale(1.04)" : "scale(1)",
    immediate: reduce === true,
    config: { tension: 220, friction: 24 },
  });
  return <>
    <animated.button type="button" aria-pressed={active} style={styles}
      onClick={() => setActive(value => !value)}>Modalita compatta</animated.button>
    <p role="status">{active ? "Modalita attiva" : "Modalita disattiva"}</p>
  </>;
}
```

`animated` applica i valori della molla; non serve aggiornare manualmente lo state React a ogni frame. `tension` e `friction` non sono millisecondi di durata. L'Hook `useReducedMotion` di React Spring agisce anche sulla politica globale `skipAnimation`: in un'app reale centralizzalo nella root, anziche moltiplicarlo in ogni widget. Nel demo il componente e la root dell'esempio.

## Varianti

- **Web Animations API**: controllo imperativo, utile quando servono oggetti Animation; gestisci cancellazione e cleanup.
- **Layout e drag**: una libreria aiuta, ma non aggiunge automaticamente un'alternativa da tastiera al trascinamento.
- **View Transitions**: integrazione dipendente da browser e framework; verifica supporto, fallback e versione prima di adottarla.
- **Toast reali**: richiedono durata adeguata, eventuale pausa, azioni accessibili e gestione delle notifiche; il demo non e un notification manager.

## Errori comuni

- Specificare `exit` senza un gestore di presenza ancora montato.
- Confondere invisibilita con indisponibilita: un nodo trasparente puo essere ancora focalizzabile.
- Lasciare feedback essenziale solo nel colore, movimento o animazione di un'icona.
- Impostare `transition: all` senza controllare quali proprieta vengono interpolate.
- Attendere una fine animazione come unica condizione per salvare dati o sbloccare un flusso.
- Ignorare richieste di movimento ridotto, loop persistenti e cambi di focus durante l'uscita.

## Checklist

- Senza animazione il risultato resta comprensibile e immediato?
- La preferenza di movimento ridotto e rispettata da CSS e JavaScript?
- Nodi in uscita, focus e annunci hanno un comportamento definito?
- Key e mount/unmount sono coerenti, anche con azioni ripetute rapidamente?
- Sono state misurate prestazioni su dispositivi realistici, senza assumere 60 FPS dai soli test funzionali?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Focus Management|Focus Management]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]
- [[Programmazione/React/Pagine/Visual regression testing|Visual regression testing]]

## Fonti

- [Motion: AnimatePresence](https://motion.dev/docs/react-animate-presence), [accessibilita](https://motion.dev/docs/react-accessibility) e [useReducedMotion](https://motion.dev/docs/react-use-reduced-motion).
- [React Spring: useSpring](https://www.react-spring.dev/docs/components/use-spring) e [useReducedMotion](https://www.react-spring.dev/docs/utilities/use-reduced-motion).
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).
- Versioni degli esempi: React/React DOM 19.3.0, Motion 14.2.0 e React Spring Web 10.1.2. I due Hook omonimi appartengono a librerie distinte e non hanno necessariamente lo stesso effetto globale.
