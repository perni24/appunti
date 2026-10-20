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
  - accessibility
  - aria
aliases:
  - WAI-ARIA
  - ARIA
prerequisites:
  - "[[Programmazione/React/Pagine/JSX|JSX]]"
related:
  - "[[Programmazione/React/Pagine/Focus Management|Focus Management]]"
title: WAI-ARIA
---

# WAI-ARIA

## Sintesi

WAI-ARIA descrive ruoli, stati e relazioni che il browser espone alle tecnologie assistive. Non implementa il comportamento di un controllo: `role="button"` non aggiunge focus, attivazione da tastiera o gestione dei click.

Prima scegli l'HTML appropriato, poi aggiungi la semantica mancante. Un `<button>` funzionante e preferibile a un `div` che tenta di imitarlo. React non cambia queste regole.

## Quando usarlo

Usala per comunicare apertura di un pannello, stato di un toggle, descrizioni ed errori di un campo, pagina corrente o aggiornamenti di stato. Per widget complessi come combobox e tabs, segui il pattern WAI-ARIA pertinente o usa una libreria accessibile verificata nel contesto dell'app.

Non aggiungere ruoli ridondanti a tutti gli elementi: `nav`, `main`, `button` e `input` hanno gia una semantica nativa.

## Come funziona

Un controllo deve avere un **nome accessibile**, uno scopo riconoscibile e, dove necessario, uno stato. Il nome di un pulsante deriva normalmente dal testo; quello di un campo da una `label` associata. Il placeholder non sostituisce la label.

`aria-labelledby` usa il testo di elementi identificati da ID; `aria-label` fornisce una stringa alternativa e puo sovrascrivere il nome ottenuto dal contenuto. Non usare una label invisibile diversa dal testo visibile: puo rendere piu difficile anche l'uso dei comandi vocali.

`aria-describedby` aggiunge una **descrizione**, non cambia il nome. Gli ID devono esistere ed essere univoci: `useId` e adatto alle associazioni all'interno di componenti riusabili, non alle key delle liste.

## API / Sintassi

In JSX gli attributi ARIA mantengono il trattino, mentre gli attributi React sono per esempio `htmlFor` e `tabIndex`.

| Attributo | Uso e limite |
| --- | --- |
| `aria-expanded` + `aria-controls` | Stato di apertura e ID del pannello; non lo aprono da soli |
| `aria-pressed` | Stato di un pulsante toggle, con etichetta stabile |
| `aria-current="page"` | Link alla pagina corrente; non equivale a `aria-selected` |
| `aria-invalid` | Campo non valido; non esegue validazione |
| `aria-describedby` | ID di istruzioni o messaggi, separati da spazi |
| `role="status"` | Aggiornamento non urgente, con live region implicitamente polite |
| `role="alert"` | Messaggio urgente, potenzialmente interruttivo; usarlo con misura |
| `aria-disabled` | Comunica indisponibilita, ma non blocca eventi o tabulazione |
| `aria-hidden` | Esclude dall'albero di accessibilita, non nasconde visivamente ne disabilita il focus |

Frammento di navigazione, da usare nella pagina effettivamente corrente:

```jsx
<nav aria-label="Navigazione principale">
  <a aria-current="page" href="/dashboard">Dashboard</a>
</nav>
```

## Esempio pratico

### Disclosure con HTML nativo

Modulo completo: il pannello viene nascosto con `hidden`, mentre gli attributi ARIA descrivono lo stesso stato. Il pulsante mantiene il focus; Invio e Spazio funzionano nativamente.

```jsx
import { useId, useState } from "react";

export default function Details() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <section>
      <h2>Preferenze</h2>
      <button type="button" aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen(value => !value)}>Dettagli notifiche</button>
      <div id={panelId} hidden={!open}>
        <label><input type="checkbox" defaultChecked /> Riepilogo settimanale</label>
      </div>
    </section>
  );
}
```

Qui non servono `role="button"`, `tabIndex` o un handler `onKeyDown`. Il checkbox nascosto non deve restare raggiungibile con Tab; non sovrascrivere `hidden` con CSS che mostri nuovamente il pannello.

### Nome, descrizione, errore e stato

Altro modulo indipendente. `noValidate` disattiva la UI di validazione nativa per mostrare quella del demo; non e una raccomandazione generale. La regola del nome e soltanto didattica, non una validazione di identita.

```jsx
import { useId, useState } from "react";

export default function NameForm() {
  const id = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  function handleSubmit(event) {
    event.preventDefault();
    const cleanName = name.trim();
    setStatus("");
    if (cleanName.length < 3) {
      setError("Inserisci un nome di almeno tre caratteri.");
      return;
    }
    setError("");
    setStatus(`Bozza salvata per ${cleanName}.`);
  }

  return (
    <form noValidate onSubmit={handleSubmit} aria-label="Profilo dimostrativo">
      <label htmlFor={id}>Nome visualizzato</label>
      <input id={id} value={name} required
        onChange={event => { setName(event.target.value); setError(""); setStatus(""); }}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, error ? errorId : null].filter(Boolean).join(" ")} />
      <p id={hintId}>Almeno tre caratteri, esclusi gli spazi iniziali e finali.</p>
      {error && <p id={errorId} role="alert">{error}</p>}
      <button type="submit">Salva bozza</button>
      <p role="status">{status}</p>
    </form>
  );
}
```

La regione `status` esiste prima dell'aggiornamento del testo. Non aggiungere annunci a ogni tasto premuto. L'errore e collegato al campo, non indicato soltanto da un colore; il messaggio di successo non sposta il focus. La combinazione esatta di annunci dipende da browser e screen reader, e va provata manualmente.

Questo form non invia richieste e non gestisce un riepilogo errori multi-campo: per quel flusso vedi Focus Management e Validazione Dati. Il reset dell'errore durante la modifica significa "da rivalidare al submit", non "gia valido".

## Varianti

- **Landmark**: preferisci HTML nativo; assegna nomi distinti a piu navigazioni quando necessario.
- **Toggle**: un `button` con `aria-pressed` e diverso da una checkbox nativa; scegli in base allo scopo.
- **Widget composito**: tabs, menu e combobox richiedono un modello di tastiera specifico, non soltanto ruoli.
- **Dialog**: un `div` con `role="dialog" aria-modal="true"` non diventa modale. La nota Portals contiene un esempio con `<dialog>` e `showModal()`.

## Errori comuni

- Usare `ariaLabel` invece di `aria-label`, ID duplicati o riferimenti a nodi assenti.
- Scrivere `aria-hidden="false"` su un figlio per annullare un antenato nascosto: non funziona cosi.
- Applicare `aria-hidden="true"` a un controllo ancora focalizzabile o al suo contenitore.
- Usare `aria-disabled` come sostituto automatico di `disabled`: il primo non impedisce le azioni.
- Usare `aria-selected` su un pulsante generico senza un ruolo che lo supporti.
- Considerare zero segnalazioni automatiche una certificazione di accessibilita.

## Checklist

- HTML, ruolo e comportamento da tastiera descrivono lo stesso controllo?
- Nome visibile e nome accessibile sono coerenti?
- ID e descrizioni restano validi anche con due istanze del componente?
- Stato ARIA, visibilita e disponibilita reale sono sincronizzati?
- Sono stati provati tastiera, zoom e tecnologie assistive oltre ai controlli automatici?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Focus Management|Focus Management]]
- [[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilita]]
- [[Programmazione/React/Pagine/Portals|Portals]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]

## Fonti

- [WAI-ARIA APG: principi iniziali](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) e [nomi e descrizioni accessibili](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/).
- [React: useId](https://react.dev/reference/react/useId).
- [MDN: aria-disabled](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled), [aria-hidden](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden) e [live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions).
- Esempi riferiti a React e React DOM 19.3.0. I test del DOM e le analisi automatiche non verificano la voce effettiva di uno screen reader.
