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
  - architecture
  - frontend
aliases:
  - Feature-based architecture
  - Architettura per feature
prerequisites:
  - "[[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]"
  - "[[Programmazione/React/Pagine/Design system|Design system]]"
related:
  - "[[Programmazione/React/Pagine/API layer|API layer]]"
  - "[[Programmazione/React/Pagine/State colocato|State colocato]]"
title: Feature-based architecture
---

# Feature-based architecture

## Sintesi

La feature-based architecture raggruppa il codice attorno a una **capacita del prodotto** invece che soltanto al tipo di file. UI, regole, accesso ai dati e test di una stessa funzionalita restano vicini.

Non e una regola di React ne un albero di cartelle obbligatorio: il vantaggio dipende da responsabilita e dipendenze. Spostare gli stessi import circolari in `features/` non li risolve.

## Problema che risolve

In una struttura solo tecnica, una modifica a un flusso attraversa components, hooks, services e tests globali. Con molte funzionalita diventa difficile capire cosa appartiene a chi e cosa puo cambiare senza toccare il resto.

Organizzare per feature rende piu evidente il confine di modifica. Per un'app molto piccola poche cartelle tecniche sono spesso sufficienti: non creare dieci livelli vuoti in previsione di una crescita ipotetica.

## Concetto chiave

Una convenzione semplice per l'esempio:

```text
app -> features -> shared
app ------------> shared
```

- `app` compone schermate, router e provider; conosce le funzionalita disponibili.
- `features` contiene codice specifico del prodotto. Ogni feature espone soltanto il contratto necessario ai consumatori.
- `shared` contiene elementi realmente generici; non importa feature o bootstrap dell'app.

Il verso indica chi puo importare chi. Il flusso dei dati puo andare in entrambe le direzioni tramite props e callback: ricevere una callback non richiede importare il modulo che la implementa.

### API pubblica del modulo

Un piccolo `index.js` con export espliciti fornisce un punto d'ingresso stabile. Da `app`, un import del file pubblico lascia alla feature la possibilita di riorganizzare i dettagli interni.

Un import diretto di un componente interno puo funzionare perfettamente in JavaScript e violare comunque la convenzione architetturale. Il file pubblico non e un confine di sicurezza: i moduli client possono finire nel bundle e gli import interni restano tecnicamente possibili se non vengono controllati.

## Dettagli importanti

### Dimensione e dipendenze delle feature

Scegli confini in base a casi d'uso e motivi di cambiamento. `users`, `orders` o `reports` possono essere moduli utili, ma una tabella del database non determina automaticamente una feature. Due parti che cambiano sempre insieme potrebbero appartenere allo stesso modulo.

Per coordinare feature distinte preferisci la composizione nell'app. Se una dipendenza diretta e necessaria, rendila esplicita e usa l'API pubblica, evitando cicli. Non estrarre una funzione in shared soltanto per aggirare il ciclo: deve essere realmente indipendente dai domini coinvolti.

### Dati, stato e route

Una feature puo contenere `api`, `model`, `ui` e test, ma crea le sottocartelle quando aiutano. Nel piccolo esempio sotto bastano pochi file.

Lo stato temporaneo del form resta vicino alla UI che lo usa; dati server/cache e stato condiviso richiedono scelte separate. Una cartella non decide automaticamente lo scope dello stato o la strategia di cache.

Una route puo comporre piu feature. Nei framework con routing basato su file conserva i punti d'ingresso richiesti dal framework e importa da li i moduli applicativi; non rinominare arbitrariamente le sue cartelle speciali.

### Non confondere convenzioni diverse

- **Layer-based:** separazione globale per tipo tecnico, utile quando il progetto e piccolo e i confini sono semplici.
- **Ibrida:** feature di prodotto e shared tecnico; e la convenzione dell'esempio.
- **Vertical slice:** raggruppamento attorno a un caso d'uso; non implica duplicare ogni infrastruttura o avere deploy indipendenti.
- **Feature-Sliced Design:** metodologia specifica con layer e regole proprie. Usare una cartella features non significa averla adottata; la parola feature puo indicare un confine diverso.
- **Monorepo/package:** distribuzione fisica del codice, non sostituto dei confini logici. Un package separato ha costi di build, dipendenze e versionamento.

## Esempio

### Struttura minima completa

Esempio React 19/Vite, JavaScript ESM. Riusa `package.json`, `vite.config.js` e `index.html` di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]. Sostituisci il bootstrap e usa i file seguenti; non servono alias `@/` o dipendenze nuove.

```text
src/
  main.jsx
  app/
    App.jsx
    app.css
  features/
    profile/
      index.js
      ProfileEditor.jsx
      profileModel.js
  shared/
    ui/
      TextField.jsx
      field.css
```

`TextField.jsx` e `field.css` sono i due moduli completi di [[Programmazione/React/Pagine/Design system|Design system]]. Non copiarne una seconda implementazione dentro profile. I test possono stare accanto ai moduli o in una cartella di feature; non e obbligatorio un contenitore globale per tutti i test.

### Regola specifica della feature

`src/features/profile/profileModel.js`: policy **dimostrativa**, non una regola universale sui nomi. Il limite e misurato in unita UTF-16, non in caratteri percepiti; l'eventuale contratto backend deve precisarlo e validare autonomamente gli input.

```js
export function parseDisplayName(input) {
  if (typeof input !== "string") {
    return { ok: false, error: "Il nome deve essere testo." };
  }
  const value = input.trim();
  if (value.length === 0 || value.length > 40) {
    return { ok: false, error: "Inserisci da 1 a 40 unita UTF-16." };
  }
  return { ok: true, value };
}
```

La funzione non importa React, DOM o servizi. E testabile senza montare la UI. Trim e controllo di lunghezza non sono sanitizzazione HTML ne autorizzazione.

### UI e stato locale

`src/features/profile/ProfileEditor.jsx`: form controllato, senza backend. Applica un nome **solo nello stato locale** e lo mostra come testo; il reload perde la conferma.

```jsx
import { useId, useRef, useState } from "react";
import { TextField } from "../../shared/ui/TextField.jsx";
import { parseDisplayName } from "./profileModel.js";

export function ProfileEditor({ title, initialName = "" }) {
  const headingId = useId();
  const inputRef = useRef(null);
  const [draft, setDraft] = useState(initialName);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const result = parseDisplayName(draft);
    if (!result.ok) {
      setError(result.error);
      setConfirmed("");
      inputRef.current?.focus();
      return;
    }
    setDraft(result.value);
    setError("");
    setConfirmed(result.value);
  }

  return (
    <form className="profile-form" aria-labelledby={headingId}
      noValidate onSubmit={handleSubmit}>
      <h2 id={headingId}>{title}</h2>
      <TextField
        ref={inputRef}
        name="displayName"
        label="Nome visualizzato"
        hint="Da 1 a 40 unita UTF-16; spazi esterni rimossi."
        value={draft}
        required
        autoComplete="off"
        error={error}
        onChange={(event) => {
          setDraft(event.currentTarget.value);
          setError("");
          setConfirmed("");
        }}
      />
      <button type="submit">Applica in memoria</button>
      <p role="status">
        {error ? "Nome non valido." : confirmed ? `Nome locale: ${confirmed}` : ""}
      </p>
    </form>
  );
}
```

`noValidate` lascia la gestione del submit alla policy JavaScript del demo. L'attributo required mantiene la semantica del campo, ma non provoca qui il blocco nativo del form. Non e un modello di validazione server.

`initialName` inizializza lo stato al mount; una sua modifica successiva non riscrive la bozza. In un'app con cambio di utente o record definisci esplicitamente reset, key o contratto controllato. Il chiamante fornisce title non vuoto e initialName stringa.

### Punto d'ingresso e composizione

`src/features/profile/index.js`: API pubblica selettiva, non `export *` indiscriminato.

```js
export { ProfileEditor } from "./ProfileEditor.jsx";
```

All'interno della feature usa import diretti tra file, come quello del model sopra. Importare il proprio index dai moduli interni puo creare cicli inutili.

`src/app/App.jsx`: due istanze indipendenti della stessa feature e un tema comune.

```jsx
import { useState } from "react";
import { ProfileEditor } from "../features/profile/index.js";
import "../shared/ui/field.css";
import "./app.css";

export default function App() {
  const [dark, setDark] = useState(false);
  return (
    <main className="ds-theme" data-theme={dark ? "dark" : "light"}>
      <h1>Profili locali</h1>
      <button type="button" aria-pressed={dark}
        onClick={() => setDark((value) => !value)}>Tema scuro</button>
      <ProfileEditor title="Personale" initialName="Ada" />
      <ProfileEditor title="Lavoro" />
    </main>
  );
}
```

`src/app/app.css`: layout della pagina, non regole del campo condiviso.

```css
body { margin: 0; }
.ds-theme { min-height: 100vh; box-sizing: border-box; }
.profile-form { max-width: 36rem; margin-block: 2rem; }
.ds-theme button {
  max-width: 100%;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  background: var(--color-surface);
  font: inherit;
  overflow-wrap: anywhere;
}
.ds-theme button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
```

`src/main.jsx`, al posto del bootstrap dell'esempio base:

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode><App /></StrictMode>,
);
```

Con la toolchain della nota introduttiva, esegui separatamente `npm run dev` per il demo e `npm run build` per verificarne la compilazione. Non e un'app di gestione utenti completa: non ci sono autenticazione, richieste HTTP o persistenza.

### Verificare i confini

Nella convenzione adottata, questo import da `app/App.jsx` e da evitare anche se compila:

```js
// Controesempio: accoppia l'app al percorso interno della feature.
import { ProfileEditor } from "../features/profile/ProfileEditor.jsx";
```

Usa invece l'import da `index.js` gia mostrato. Alias come `@/` sono possibili, ma vanno configurati coerentemente in bundler, editor e test: React non li crea.

Automatizza le regole tramite lint o controllo del grafo degli import, con casi negativi. `no-restricted-imports` puo vietare percorsi noti, ma non e da solo un risolutore completo di confini, alias, import dinamici e cicli. Controlla le dipendenze effettive, non soltanto il nome delle cartelle.

## Limiti

- Il file pubblico non garantisce lazy loading, tree shaking o deploy separati; dipendono da import, effetti collaterali e toolchain.
- La cartella shared puo comunque diventare un punto di accoppiamento. Un helper apparentemente generico puo nascondere regole del dominio.
- Se molte feature devono conoscere gli stessi dettagli interni, rivedi il modello o la composizione prima di aggiungere altri barrel e adapter.
- La struttura non implementa sicurezza o backend. Dati e segreti non diventano privati perche un file si chiama model o internal.

## Errori comuni

- **Deep import dall'esterno:** i consumatori si rompono quando riordini i file della feature.
- **API pubblica enorme:** esportare tutto rende impossibile distinguere contratto e implementazione.
- **Shared dipendente dal prodotto:** un componente generale non deve importare profileModel o leggere la sessione dell'app senza un contratto esplicito.
- **Duplicazione o riuso senza criterio:** valuta se componenti simili condividono davvero un contratto e un motivo di cambiamento prima di copiarli o unificarli.
- **Cartelle prima delle responsabilita:** non aggiungere services, repositories e hooks se contengono solo passaggi senza logica.
- **Feature uguale a pagina:** un flusso puo attraversare piu route e una pagina puo comporre piu feature.
- **Migrazione totale senza test:** sposta una funzionalita alla volta, aggiorna import/test e verifica il comportamento prima di proseguire.

## Checklist

- Il confine e spiegabile con un caso d'uso o una responsabilita concreta.
- Consumatori esterni usano un'API pubblica piccola e documentata.
- Shared non conosce le feature; i moduli interni non importano il proprio barrel.
- Stato, dati server e routing hanno scelte esplicite, non inferite dalle cartelle.
- Regole di import, build e test rilevano modifiche incompatibili.
- L'organizzazione riduce il lavoro necessario a una modifica reale.

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/API layer|API layer]]
- [[Programmazione/React/Pagine/Design system|Design system]]
- [[Programmazione/React/Pagine/State colocato|State colocato]]
- [[Programmazione/React/Pagine/Linting e Formattazione|Linting e Formattazione]]

## Fonti

- [React: scomporre una UI e identificare stato e responsabilita](https://react.dev/learn/thinking-in-react).
- [Redux: organizzazione per feature, nel contesto Redux](https://redux.js.org/style-guide/#structure-files-as-feature-folders-with-single-file-logic).
- [Feature-Sliced Design: API pubblica](https://feature-sliced.design/docs/reference/public-api).
- [Feature-Sliced Design: layer e regole della metodologia](https://feature-sliced.design/docs/reference/layers).
- [ESLint: limiti e opzioni di no-restricted-imports](https://eslint.org/docs/latest/rules/no-restricted-imports).
- [React: preservare e resettare lo stato](https://react.dev/learn/preserving-and-resetting-state).
