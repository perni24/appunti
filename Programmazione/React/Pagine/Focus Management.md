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
  - focus
aliases:
  - Focus Management
  - Keyboard navigation
prerequisites:
  - "[[Programmazione/React/Pagine/useRef|useRef]]"
related:
  - "[[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]"
title: Focus Management
---

# Focus Management

## Sintesi

Focus management significa mantenere prevedibile la destinazione dell'input da tastiera quando la UI cambia. Il focus DOM, osservabile con `document.activeElement`, non coincide con una selezione applicativa o con il cursore di lettura di uno screen reader.

La regola di partenza e lasciare funzionare l'ordine naturale del documento. Sposta il focus quando serve a proseguire un'attivita, non a ogni render o aggiornamento dei dati.

## Quando usarlo

Serve quando apri un editor o un dialog, rimuovi il controllo attivo, mostri errori di un form o navighi in una SPA. Uno skip link permette inoltre di saltare una navigazione ripetitiva.

La comparsa di un toast o un refetch in background normalmente non giustificano rubare il focus. Per aggiornamenti informativi usa, quando adatta, una live region.

## Come funziona

Un nodo creato da un cambiamento di stato non esiste ancora immediatamente dopo `setState`. Per focalizzarlo puoi usare un effect dopo il commit oppure una callback ref con un contratto preciso. Non usare un timeout arbitrario per indovinare quando il DOM sara pronto.

Se il nodo focalizzato viene smontato, identifica una destinazione sensata: il controllo che ha avviato l'azione, il prossimo elemento della lista o il titolo della sezione. Non tentare di focalizzare un riferimento ormai scollegato dal documento.

## API / Sintassi

| Strumento | Comportamento |
| --- | --- |
| `ref.current?.focus()` | Focus programmatico su un nodo disponibile e focalizzabile |
| `focus({ preventScroll: true })` | Evita lo scroll automatico; assicurati che il controllo resti visibile |
| `tabIndex={0}` | Inserisce nell'ordine di Tab secondo il DOM |
| `tabIndex={-1}` | Consente focus programmatico senza aggiungere uno stop di Tab |
| `tabIndex` positivo | Altera l'ordine naturale; generalmente da evitare |
| `disabled` | Disabilita un controllo nativo, normalmente escludendolo dalla tabulazione |
| `inert` | Rende non interattivo un sottoalbero; diverso dal solo `aria-hidden` |
| `:focus-visible` | Stile del focus quando il browser ritiene necessario evidenziarlo |

Non aggiungere `tabIndex={0}` a ogni elemento di testo. Titoli e paragrafi rimangono leggibili dalle tecnologie assistive senza diventare tutti stop di Tab.

## Esempio pratico

### Editor inline con ritorno del focus

Modulo completo. Non e un dialog: la pagina rimane utilizzabile e non viene applicata una focus trap. L'editor si apre soltanto su richiesta; Salva, Annulla ed Escape ritornano al pulsante iniziale dopo il commit.

```jsx
import { useEffect, useRef, useState } from "react";

export default function EditableName() {
  const [name, setName] = useState("Ada");
  const [draft, setDraft] = useState(name);
  const [editing, setEditing] = useState(false);
  const buttonRef = useRef(null);
  const inputRef = useRef(null);
  const restoreFocus = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
    else if (restoreFocus.current) {
      buttonRef.current?.focus();
      restoreFocus.current = false;
    }
  }, [editing]);

  function closeEditor() {
    restoreFocus.current = true;
    setEditing(false);
  }

  return (
    <section className="focus-demo">
      <h2>Nome della bozza</h2>
      {editing ? (
        <form onSubmit={event => {
          event.preventDefault();
          setName(draft.trim());
          closeEditor();
        }} onKeyDown={event => {
          if (event.key === "Escape" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            closeEditor();
          }
        }}>
          <label>Nuovo nome <input ref={inputRef} value={draft}
            onChange={event => setDraft(event.target.value)} /></label>
          <button type="submit">Salva nome</button>
          <button type="button" onClick={closeEditor}>Annulla</button>
        </form>
      ) : (
        <>
          <p>Nome: {name || "Senza nome"}</p>
          <button type="button" ref={buttonRef} onClick={() => {
            setDraft(name);
            setEditing(true);
          }}>Modifica nome</button>
        </>
      )}
    </section>
  );
}
```

Il flag in ref evita uno spostamento al mount iniziale. Le modifiche al testo non rilanciano l'effect, quindi non sottraggono il focus a un altro controllo. Il salvataggio modifica solo la bozza locale; vuoto significa "Senza nome". Eventuali regole di dominio vanno aggiunte separatamente.

Stile facoltativo del modulo, senza eliminare il focus predefinito negli altri casi:

```css
.focus-demo :is(button, input):focus-visible {
  outline: 3px solid #156b50;
  outline-offset: 3px;
}
```

### Skip link

Questo layout e unico nella pagina, quindi l'ID `main-content` e stabile e non duplicato. `tabIndex={-1}` permette di focalizzare il contenuto senza aggiungere uno stop alla normale tabulazione.

```jsx
export function PageLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Salta al contenuto</a>
      <nav aria-label="Principale"><a href="#main-content">Contenuto</a></nav>
      <main id="main-content" tabIndex={-1}>
        <h1>Preferenze</h1>
        <label><input type="checkbox" /> Riepilogo email</label>
      </main>
    </>
  );
}
```

```css
.skip-link {
  position: fixed;
  inset-block-start: 0.5rem;
  inset-inline-start: 0.5rem;
  transform: translateY(-200%);
  z-index: 1000;
  background: white;
  color: #111;
  padding: 0.5rem;
}
.skip-link:focus { transform: none; }
```

Non nascondere lo skip link con `display: none`: non sarebbe raggiungibile da tastiera. Verifica che header fissi non coprano la destinazione e conserva una gerarchia di titoli coerente.

## Varianti

- **Dialog modale**: apertura, focus iniziale, isolamento dello sfondo, Escape e ritorno. Per l'esempio nativo completo vedi Portals; non duplicare una focus trap artigianale basata soltanto su un elenco di selettori.
- **Widget compositi**: roving tabindex significa uno stop di Tab, altri elementi a -1 e spostamenti del focus con i tasti previsti dal pattern. Non applicare le stesse frecce indiscriminatamente a tabs, menu e combobox.
- **aria-activedescendant**: il focus DOM resta sul contenitore/input mentre una relazione indica l'elemento attivo. Non e equivalente a chiamare focus sui figli.
- **Errori di form**: dopo la validazione focalizza il primo campo errato o un riepilogo collegato ai campi. Non farlo a ogni battitura; rendi presenti descrizioni e messaggi prima dello spostamento.
- **Navigazione SPA**: coordina titolo del documento, focus e scroll dopo una navigazione significativa. Un cambio di filtro o un refetch non sono automaticamente una nuova pagina; verifica prima cosa offre il router/framework.

## Errori comuni

- Rimuovere `outline` senza un'alternativa percepibile.
- Focalizzare un elemento con `hidden`, `disabled`, dentro `inert` o non ancora montato.
- Usare `aria-hidden` come focus trap: non blocca Tab.
- Catturare Escape globalmente e chiudere piu overlay o interferire con composizione IME e widget interni.
- Impostare focus a ogni render o usare key instabili che rimontano l'input durante la digitazione.
- Rendere un drawer non modale una trappola da cui non si puo uscire con Tab.

## Checklist

- Ordine DOM, ordine visivo e ordine di Tab sono comprensibili?
- L'apertura sposta il focus solo quando richiesto e dopo il commit?
- Chiusura, rimozione e cambio route hanno una destinazione valida?
- Invio, Spazio, Tab, Shift+Tab ed Escape seguono il contratto del widget?
- Focus visibile anche con zoom, header fissi e temi ad alto contrasto?
- Sono stati provati browser e tecnologie assistive del pubblico previsto?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]
- [[Programmazione/React/Pagine/Portals|Portals]]
- [[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilita]]
- [[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]

## Fonti

- [WAI-ARIA APG: interfaccia da tastiera](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).
- [React: manipolare il DOM con le ref](https://react.dev/learn/manipulating-the-dom-with-refs).
- [MDN: focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus), [tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex) e [inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert).
- Esempi riferiti a React e React DOM 19.3.0. La navigazione da tastiera automatizzata non equivale a un audit con screen reader.
