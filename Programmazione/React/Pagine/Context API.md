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
  - context
  - state
aliases:
  - Context API
  - React Context
prerequisites:
  - "[[Programmazione/React/Pagine/useState|useState]]"
  - "[[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e flusso dei dati]]"
related:
  - "[[Programmazione/React/Pagine/Custom Hooks|Custom Hooks]]"
  - "[[Programmazione/React/Pagine/State Management Esterno|State Management Esterno]]"
title: Context API
---

# Context API

## Sintesi

Context permette a un componente di leggere un valore fornito da un antenato senza inoltrarlo come prop attraverso tutti i livelli intermedi. Il suo ambito e un sottoalbero React, non necessariamente tutta l'applicazione.

Il Context **distribuisce un valore**, non possiede da solo lo stato: questo puo vivere in `useState`, in un reducer o in uno store. Gli esempi usano React 19.3.0 e il progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]].

## Quando usarlo

Usalo per tema, lingua, sessione visualizzata, feature flag o dipendenze condivise da componenti distanti. Prima valuta props esplicite e composizione con `children`: per pochi livelli possono essere piu leggibili.

Non esiste un divieto per dati aggiornati frequentemente. Il costo dipende da consumatori, struttura e frequenza: misura, separa responsabilita e valuta selector di uno store quando serve una sottoscrizione piu selettiva. Context da solo non implementa cache di rete, persistenza o autorizzazione server.

## Come funziona

1. `createContext(defaultValue)`, normalmente a livello di modulo, crea l'oggetto che provider e consumatori devono condividere.
2. Il provider specifica `value` per il suo sottoalbero.
3. `useContext(Context)` legge il provider corrispondente piu vicino **sopra** il componente e si sottoscrive ai cambiamenti.

Il default e un fallback statico usato solo se manca il provider. Un provider con `value={undefined}` fornisce proprio `undefined`, non riattiva il default. Un provider restituito dal componente non influenza una `useContext` chiamata nello stesso componente: influenza i suoi discendenti.

Due provider dello stesso Context possono avere stati indipendenti. Un provider annidato sostituisce il valore visto dal proprio sottoalbero, senza modificare quello esterno. L'ambito segue l'albero React, anche con un [[Programmazione/React/Pagine/Portals|portal]], non la sola posizione degli elementi nel DOM.

## API / Sintassi

Da React 19 puoi usare `<ThemeContext value={...}>`; `<ThemeContext.Provider value={...}>` resta utilizzabile ed e la forma richiesta nelle versioni precedenti. Esempio completo dei tre casi di fallback, da usare come `src/App.jsx` indipendente dal demo successivo:

```jsx
import { createContext, useContext } from "react";

export const ThemeContext = createContext("light");

export function ThemeLabel({ label }) {
  const theme = useContext(ThemeContext);
  return <p>{label}: {String(theme)}</p>;
}

export default function FallbackDemo() {
  return (
    <main>
      <h1>Valori del Context</h1>
      <ThemeLabel label="Senza provider" />
      <ThemeContext value="dark">
        <ThemeLabel label="Provider esterno" />
        <ThemeContext value={undefined}>
          <ThemeLabel label="Provider interno" />
        </ThemeContext>
      </ThemeContext>
    </main>
  );
}
```

Risultato: `light`, `dark`, `undefined`. `String` serve qui solo a rendere osservabile l'ultimo valore, che normalmente non produrrebbe testo come child.

## Esempio pratico

Sostituisci `src/App.jsx` del progetto introduttivo. Un provider controlla la lingua principale; un secondo provider governa una sezione indipendente. Non e un sistema completo di traduzione: il testo tradotto e volutamente limitato al saluto.

```jsx
import { createContext, memo, useContext, useId, useMemo, useState } from "react";

export const LocaleContext = createContext(null);

export function useLocale() {
  const value = useContext(LocaleContext);
  if (value === null || value === undefined) {
    throw new Error("useLocale richiede LocaleProvider");
  }
  return value;
}

export function LocaleProvider({ children, initialLocale = "it" }) {
  const [locale, setLocale] = useState(initialLocale);
  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function LocaleControls({ label }) {
  const { locale, setLocale } = useLocale();
  const selectId = useId();
  return (
    <p>
      <label htmlFor={selectId}>{label}</label>{" "}
      <select id={selectId} value={locale}
        onChange={(event) => setLocale(event.target.value)}>
        <option value="it">Italiano</option>
        <option value="en">English</option>
      </select>
    </p>
  );
}

export const LocaleView = memo(function LocaleView({ label }) {
  const { locale } = useLocale();
  return <p role="status">{label}: {locale === "it" ? "Ciao" : "Hello"}</p>;
});

export default function LocaleDemo() {
  return (
    <LocaleProvider>
      <main>
        <h1>Lingue indipendenti</h1>
        <LocaleControls label="Lingua principale" />
        <LocaleView label="Principale" />
        <section aria-label="Sezione locale">
          <h2>Sezione locale</h2>
          <LocaleProvider initialLocale="en">
            <LocaleControls label="Lingua sezione" />
            <LocaleView label="Sezione" />
          </LocaleProvider>
        </section>
      </main>
    </LocaleProvider>
  );
}
```

Contratto: `initialLocale` e `it` oppure `en`; il select genera solo questi valori. Il guard di `useLocale` rileva provider assente o valore nullo, non valida ogni possibile oggetto ricevuto. Per Context che ammettono `false`, `0` o stringa vuota, un generico `if (!value)` sarebbe scorretto.

Prova a cambiare "Lingua principale": il saluto principale cambia, quello della sezione resta indipendente. Cambia poi "Lingua sezione". Anche `LocaleView`, pur essendo avvolto in `memo`, riceve il nuovo Context. `initialLocale` inizializza lo stato; modificarlo dopo il mount non e un comando di reset.

### Identita e aggiornamenti

React confronta il vecchio e il nuovo `value` con `Object.is`. Se cambia l'oggetto `{ locale, setLocale }`, i consumatori di quel Context vengono aggiornati anche se usano soltanto `setLocale`: la destrutturazione non e un selector di campi.

Il `useMemo` del provider riusa l'oggetto quando `locale` non cambia, finche la cache e valida. Non blocca i render normali provocati dal genitore e non rende il valore immutabile. Mutare un oggetto in-place non e un modo corretto per notificare cambiamenti.

Se serve, separa Context di domini diversi o stato e dispatch. In un provider con reducer, il dispatch ha identita stabile; chi legge solo il Context delle azioni non deve sottoscriversi a tutto lo stato. Questo non garantisce che il componente non venga mai renderizzato per altri motivi.

## Varianti

- **Context di configurazione**: tema, locale, feature flag.
- **Context di sessione**: utente e permessi mostrati dalla UI; i controlli reali restano sul server, non nel provider.
- **Context + reducer**: un proprietario dello stato distribuisce dati e azioni ai discendenti; non aggiunge persistenza o cache da solo.
- **Context multipli**: separare domini o stato/azioni limita accoppiamenti e sottoscrizioni non necessarie.
- **Hook wrapper**: centralizza l'accesso e puo rilevare l'assenza del provider, senza creare un'altra copia dello stato.
- **Provider di test**: permette di fornire valori deterministici; importa lo stesso oggetto Context, non crearne uno omonimo diverso.

## Errori comuni

- Usare Context per tutto lo stato: le bozze di un singolo campo spesso devono restare locali.
- Creare Context dentro un componente o duplicare il modulo: provider e consumatore devono riferirsi allo stesso oggetto.
- Cercare il provider sotto il consumatore oppure aspettarsi il default con un provider `undefined`.
- Mettere valori non correlati in un unico oggetto e aspettarsi che `memo` impedisca gli aggiornamenti da Context.
- Memoizzare senza misurare: separare responsabilita puo essere piu utile che aggiungere cache.
- Confondere disponibilita del dato con autenticazione, persistenza o invalidazione di dati remoti.

## Checklist

- Il dato serve a componenti distanti?
- Sono chiari il proprietario, il default e l'ambito del provider?
- Provider e consumatori importano lo stesso Context?
- Testati assenza, annidamento e aggiornamenti del valore?
- La frequenza degli aggiornamenti causa un problema misurato?
- Serve separare Context o adottare selector di uno store?
- Reset, persistenza e cache sono gestiti separatamente quando richiesti?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/State Management Esterno|State Management Esterno]]
- [[Programmazione/React/Pagine/useReducer|useReducer]]
- [[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]
- [[Programmazione/React/Pagine/Internazionalizzazione|Internazionalizzazione]]
- [[Programmazione/React/Pagine/Custom Hooks|Custom Hooks]]
- [[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]

## Fonti

- [React: createContext](https://react.dev/reference/react/createContext), fallback e provider da React 19.
- [React: useContext](https://react.dev/reference/react/useContext), risoluzione, identita e aggiornamenti.
- [React: reducer e Context](https://react.dev/learn/scaling-up-with-reducer-and-context), separazione di stato e dispatch.
- [React: memo](https://react.dev/reference/react/memo), differenza fra props e Context consumato.
- [React: createPortal](https://react.dev/reference/react-dom/createPortal), continuita del Context nell'albero React.

Documentazione React 19.3 consultata il 2026-10-15.
