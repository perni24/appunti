---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - design-system
  - ui
aliases:
  - Design system
  - Component library
prerequisites:
  - "[[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props]]"
  - "[[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]"
related:
  - "[[Programmazione/React/Pagine/Feature-based architecture|Feature-based architecture]]"
title: Design system
---

# Design system

## Sintesi

Un design system raccoglie decisioni condivise su aspetto, comportamento e uso della UI, insieme al processo con cui mantenerle. Include token, componenti, pattern, contenuti, documentazione e responsabilita di manutenzione.

Una **component library** e la parte implementata in codice. Storybook puo documentarla, ma installare Storybook o raccogliere alcuni pulsanti non crea automaticamente un design system.

## Problema che risolve

Quando schermate o team risolvono separatamente gli stessi problemi, cambiano colori, spaziature, errori, focus e comportamento dei controlli. Correggere ogni copia costa e rende incoerente l'esperienza.

Il sistema rende alcune decisioni riutilizzabili e verificabili. Serve soprattutto quando la ripetizione e reale: per una piccola app possono bastare token, pochi componenti e convenzioni locali, senza pubblicare subito un pacchetto.

## Concetto chiave

Separare **decisioni visive**, **contratti dei componenti** e **regole di prodotto**:

| Livello | Esempio | Responsabilita |
| --- | --- | --- |
| Token | Colore del bordo di errore | Valore condiviso e significato |
| Componente | Campo con label e descrizione | Semantica, stile e stati supportati |
| Pattern | Validazione di un form | Composizione, messaggi e gestione del focus |
| Prodotto | Regole del nome di un profilo | Dominio, dati e autorizzazioni |
| Governance | Proposta e deprecazione di una variante | Chi decide e come si migra |

Un campo generico puo mostrare un errore, ma non deve sapere quali nomi accetta il servizio utenti. Il chiamante decide quando validare; il componente espone correttamente il risultato.

## Dettagli importanti

### Token: valore e significato

Una distinzione utile, non una gerarchia obbligatoria per ogni progetto:

- **Primitivi:** palette e scale, per esempio `--neutral-900` o `--space-2`.
- **Semantici:** intenzione, per esempio `--color-text` e `--color-error`; possono cambiare tra temi.
- **Di componente:** un dettaglio specifico, per esempio il bordo di un campo, quando serve davvero un contratto separato.

Non trasformare ogni numero in un token pubblico. Un token deve ridurre decisioni arbitrarie, non aggiungere nomi senza significato. Le CSS custom properties sono una possibile implementazione, non l'unico formato dei design token.

Nel CSS le variabili sono soggette a cascata, ereditarieta e risoluzione nel punto in cui vengono definite. Definisci o ridefinisci gli alias semantici sul contenitore del tema: cambiare solo un valore su un discendente non ricalcola necessariamente un alias gia ereditato dal genitore.

### Contratto e accessibilita

Documenta props, default, eventi, elementi HTML, focus, stati e composizione consentita. Per un pulsante chiarisci `type`, `disabled` e differenza tra azione e link; per un input specifica label, descrizioni, errori, valore e callback.

Preferisci semantica nativa. `aria-invalid` descrive un errore ma non valida; `aria-disabled` non sostituisce il blocco nativo degli eventi. Headless significa che parte dello stile resta al chiamante, non che ogni utilizzo sia automaticamente accessibile.

### Evoluzione del sistema

Prima di aggiungere una variante verifica casi d'uso, alternative e responsabile della manutenzione. Mantieni insieme codice, esempi e indicazioni di uso. Una modifica a props, default, DOM, focus o token pubblici puo richiedere una migrazione anche se il codice continua a compilare.

Per librerie distribuite dichiara API pubblica, politica di compatibilita, changelog e deprecazioni. Con SemVer il significato di breaking change dipende da quel contratto: non ogni cambio di colore e automaticamente una major, ma una regressione di contrasto non diventa accettabile solo perche non rompe gli import.

## Esempio

### Campo controllato

Modulo `src/shared/ui/TextField.jsx`, **React 19**: `ref` e una prop inoltrata all'input. Per React 18 occorre un adattamento con `forwardRef`; non considerare identiche le due API.

```jsx
import { useId } from "react";

export function TextField({
  id,
  name,
  label,
  hint = "",
  error = "",
  value,
  onChange,
  required = false,
  disabled = false,
  autoComplete,
  ref,
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const description = [hint && hintId, error && errorId]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="ds-field">
      <label htmlFor={inputId}>
        {label}{required ? " (obbligatorio)" : ""}
      </label>
      {hint && <p id={hintId} className="ds-hint">{hint}</p>}
      <input
        ref={ref}
        id={inputId}
        name={name}
        type="text"
        className="ds-input"
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={description}
      />
      {error && <p id={errorId} className="ds-error">{error}</p>}
    </div>
  );
}
```

Contratto volutamente piccolo:

- `value` e sempre una stringa e `onChange` riceve l'evento React. Il componente non conserva una seconda copia del valore.
- `label` e testo visibile non vuoto; `hint` ed `error` sono stringhe. Il placeholder non sostituisce la label.
- `useId` viene chiamato anche quando `id` e fornito, senza hook condizionali. Se passi un ID esplicito, garantirne unicita e stabilita e responsabilita tua.
- L'errore resta testo React, non HTML. Le relazioni ARIA puntano solo a messaggi presenti.
- Non vengono inoltrate props arbitrarie che potrebbero sovrascrivere label, ID o descrizione. Per esigenze ulteriori estendi esplicitamente il contratto.
- `ref` permette al form di portare il focus sul campo invalido. Non introduce un autofocus globale a ogni render.

### Token e temi

`src/shared/ui/field.css`, da importare una volta nel punto di composizione dell'app. I componenti stanno dentro un contenitore `.ds-theme`; il tema scuro e esplicito, non viene ricavato automaticamente dalle preferenze del sistema.

```css
:root {
  --neutral-0: #ffffff;
  --neutral-900: #191919;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
}
.ds-theme {
  --color-surface: var(--neutral-0);
  --color-text: var(--neutral-900);
  --color-muted: #515151;
  --color-border: #656565;
  --color-error: #a11212;
  --color-focus: #005fcc;
  --color-disabled: #eeeeee;
  color: var(--color-text);
  background: var(--color-surface);
  padding: 1rem;
  font: 1rem/1.5 Arial, sans-serif;
}
.ds-theme[data-theme="dark"] {
  --color-surface: #191919;
  --color-text: #f5f5f5;
  --color-muted: #d0d0d0;
  --color-border: #aaaaaa;
  --color-error: #ffb4b4;
  --color-focus: #9bc7ff;
  --color-disabled: #333333;
}
.ds-field {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  margin-block: 1rem;
  overflow-wrap: anywhere;
}
.ds-field p { margin: 0; }
.ds-hint { color: var(--color-muted); }
.ds-error { color: var(--color-error); }
.ds-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: 4px;
  font: inherit;
  color: var(--color-text);
  background: var(--color-surface);
}
.ds-input[aria-invalid="true"] { border-color: var(--color-error); }
.ds-input:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
.ds-input:disabled {
  background: var(--color-disabled);
  cursor: not-allowed;
}
```

Il colore di errore e accompagnato da testo e `aria-invalid`: non e l'unico segnale. Il tema cambia i valori semantici senza cambiare il componente. Font, zoom, forced colors e contrasto dei temi reali vanno comunque verificati nell'applicazione.

Il form completo che usa questo modulo si trova in [[Programmazione/React/Pagine/Feature-based architecture|Feature-based architecture]]. Non serve duplicare TextField nella feature.

## Limiti

- Questo campo copre testo controllato, non checkbox, file, numero, textarea o combobox; ciascuno ha un contratto diverso.
- `required` usa la validazione nativa solo quando il form non la disattiva. Le regole del dominio e la validazione sul server restano separate.
- Il campo espone messaggi e relazioni, ma non decide quando annunciare errori, spostare focus o mostrare un riepilogo: appartengono al flusso del form.
- Una libreria non garantisce conformita completa in ogni composizione. Test automatici, test visuali, tastiera e tecnologie assistive coprono rischi differenti.
- Un sistema multi-brand richiede piu dei colori: tipografia, densita, icone, linguaggio e vincoli di accessibilita possono differire.

## Errori comuni

- **Promuovere ogni componente a shared:** una UI specifica del dominio non diventa generale solo perche viene usata due volte.
- **Molti booleani di variante:** combinazioni come primary/danger/compact producono stati ambigui; preferisci opzioni con combinazioni documentate quando servono.
- **Nascondere la semantica:** un wrapper stilizzato che perde name, disabled o ref rende difficile form, test e focus.
- **Centralizzare le regole del prodotto:** evita che un campo condiviso importi servizi utenti o decida la policy dei nomi.
- **Documentazione separata dal codice:** storie obsolete e componenti duplicati rendono il catalogo inattendibile.
- **Riutilizzo imposto:** un componente troppo rigido non giustifica eccezioni CSS sempre piu fragili; rivedi prima il contratto.

## Checklist

- Decisioni e token hanno un significato condiviso e un responsabile.
- API, default, stati, limiti e combinazioni supportate sono documentati.
- Nome accessibile, descrizioni, focus ed errori funzionano nella composizione reale.
- Esempi coprono normale, disabled, errore, testo lungo e temi pertinenti.
- Modifiche incompatibili hanno una migrazione; test e documentazione evolvono insieme.
- Il livello di investimento e proporzionato ai consumatori effettivi del sistema.

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Storybook|Storybook]]
- [[Programmazione/React/Pagine/Visual regression testing|Visual regression testing]]
- [[Programmazione/React/Pagine/WAI-ARIA|WAI-ARIA]]
- [[Programmazione/React/Pagine/CSS Modules|CSS Modules]]
- [[Programmazione/React/Pagine/Compound Components Pattern|Compound Components Pattern]]
- [[Programmazione/React/Pagine/Feature-based architecture|Feature-based architecture]]

## Fonti

- [USWDS: design token](https://designsystem.digital.gov/design-tokens/).
- [GOV.UK: criteri per contribuire componenti e pattern](https://design-system.service.gov.uk/community/contribution-criteria/).
- [React: useId](https://react.dev/reference/react/useId).
- [React: input controllati](https://react.dev/reference/react-dom/components/input).
- [React 19: ref come prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop).
- [WAI: notifiche e associazione degli errori nei form](https://www.w3.org/WAI/tutorials/forms/notifications/).
- [MDN: ereditarieta e risoluzione delle custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties).
- [Semantic Versioning](https://semver.org/).
