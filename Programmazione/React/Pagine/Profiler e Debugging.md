---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - debugging
  - profiler
  - performance
aliases:
  - Profiler e Debugging
  - React DevTools
prerequisites:
  - "[[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]"
  - "[[Programmazione/React/Pagine/useState|useState]]"
related:
  - "[[Programmazione/React/Pagine/useEffect|useEffect]]"
  - "[[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]"
title: Profiler e Debugging
---

# Profiler e Debugging

## Obiettivo

Riprodurre un difetto, trovare la causa e verificare la correzione. Prima distingui **risultato sbagliato** da **risultato corretto ma lento**: un render frequente non e automaticamente un problema di performance.

React DevTools mostra componenti, props e stato; il Profiler misura il lavoro React. Gli strumenti del browser servono anche per rete, JavaScript, layout e paint. Gli esempi seguenti usano React 19.3.0 e il progetto Vite di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]].

## Quando usarlo

| Sintomo | Primo strumento |
| --- | --- |
| Valore o selezione errati | React DevTools, pannello Components |
| Handler o calcolo sbagliati | Breakpoint in Sources e stack delle chiamate |
| Richiesta duplicata, lenta o fallita | Network e controllo degli effect |
| Interazione lenta | Profiler React e registrazione Performance del browser |
| Stile non applicato | Elements, Styles e Computed |

Installa l'estensione React Developer Tools dai collegamenti ufficiali e apri gli strumenti del browser sulla pagina dell'app, non su una pagina statica qualsiasi. Components e Profiler sono pannelli dell'estensione; non occorre installarla come dipendenza di produzione.

## Procedura

### Correttezza prima delle prestazioni

1. Annota input, azione, risultato atteso e risultato osservato. Riduci il caso senza eliminare il comportamento che causa il difetto.
2. In Components seleziona il componente interessato e risali a quello che possiede lo stato. Confronta props e Hook prima/dopo l'azione; una modifica manuale in DevTools e un esperimento temporaneo, non una correzione dei sorgenti.
3. Metti un breakpoint nell'handler tramite Sources. Ispeziona argomenti, variabili locali e call stack; se l'errore e asincrono, controlla anche Promise ed eventuali eccezioni catturate.
4. Per la rete verifica URL, metodo, status, payload e tempi. Un HTTP 404 non diventa automaticamente un rifiuto di `fetch`. Confronta il momento della richiesta con setup e cleanup degli effect.
5. Correggi la causa e aggiungi una prova del comportamento. Riprova anche reset, cambio di props e smontaggio se sono coinvolti.

Evita dump indiscriminati di props/stato: possono contenere token o dati personali. Un log nel render conta invocazioni del componente, non commit del DOM. Per controllare uno snapshot registra campi primitivi specifici, senza informazioni sensibili.

### Registrare un'interazione

1. Mantieni dati, browser e dimensione della finestra confrontabili; disattiva log non necessari. Annota se stai usando sviluppo, produzione normale o build con profiling.
2. Nel Profiler avvia una registrazione, esegui una sola sequenza ripetibile e fermala. Esamina i commit e i componenti del sottoalbero coinvolto, non soltanto il colore del grafico.
3. Cerca aggiornamenti che trascinano liste grandi, props ricreate inutilmente o effect che innescano altri aggiornamenti. Le informazioni sulle cause dipendono da versione e impostazioni degli strumenti: il solo callback `onRender` non spiega quale prop sia cambiata.
4. Se il costo React non spiega il ritardo, registra anche Performance nel browser: JavaScript esterno a React, layout, paint e rete restano possibili cause.
5. Cambia una cosa per volta e ripeti piu volte la stessa interazione. Confronta risultati e correttezza, non un solo numero in millisecondi.

Le React Performance tracks possono affiancare eventi React, rete e attivita JavaScript nella timeline dei browser compatibili. Sono strumentazione distinta dal pannello Profiler dell'estensione; disponibilita e dettaglio dipendono dalla build.

## Snippet

### Profilare un sottoalbero

Sostituisci soltanto `src/App.jsx` del progetto introduttivo. Il filtro locale su 200 elementi rende verificabile mount, aggiornamento e stato vuoto; **non e un benchmark** e non contiene un rallentamento artificiale.

```jsx
import { Profiler, useState } from "react";

const items = Array.from({ length: 200 }, (_, index) => ({
  id: index + 1,
  label: `Voce ${index + 1}`,
}));

export function handleRender(
  id, phase, actualDuration, baseDuration, startTime, commitTime
) {
  console.log("[react-profile]", {
    id, phase, actualDuration, baseDuration, startTime, commitTime,
  });
}

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visible = items.filter((item) =>
    item.label.toLowerCase().includes(normalized)
  );

  return (
    <section>
      <label>
        Cerca voci
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <button type="button" onClick={() => setQuery("")}>Azzera filtro</button>
      <p role="status">Risultati: {visible.length}</p>
      {visible.length === 0 ? <p>Nessuna voce</p> : (
        <ul>
          {visible.map((item) => <li key={item.id}>{item.label}</li>)}
        </ul>
      )}
    </section>
  );
}

export default function App() {
  return (
    <main>
      <h1>Ricerca locale</h1>
      <Profiler id="SearchPanel" onRender={handleRender}>
        <SearchPanel />
      </Profiler>
    </main>
  );
}
```

Avvia lo sviluppo dalla cartella del progetto:

```sh
npm run dev
```

Apri la console, scrivi ` VOCE 20 `: devono rimanere `Voce 20` e `Voce 200`. Una ricerca inesistente mostra zero risultati; Azzera filtro ripristina 200 righe. Controlla i record con prefisso `[react-profile]`, non i messaggi del dev server.

### Leggere il callback

| Campo | Significato |
| --- | --- |
| `id` | Etichetta del sottoalbero, qui SearchPanel |
| `phase` | `mount`, `update` o `nested-update` |
| `actualDuration` | Millisecondi di rendering React per l'aggiornamento misurato |
| `baseDuration` | Stima del rendering completo del sottoalbero senza ottimizzazioni |
| `startTime` | Timestamp di inizio del render |
| `commitTime` | Timestamp del commit, condiviso dai profiler dello stesso commit |

`baseDuration` non e una seconda esecuzione realmente cronometrata senza memoizzazione. `commitTime` non e la durata del commit. Questi dati non misurano da soli latenza di rete, layout, paint o tempo completo fra input e schermata visibile. Non sommare profiler annidati come se fossero regioni disgiunte.

Non aggiornare lo stato della UI da `handleRender`: la strumentazione potrebbe generare altri aggiornamenti. I log stessi hanno un costo; l'esempio serve a leggere i campi, non a confrontare microsecondi fra dispositivi.

### Sviluppo e produzione

```sh
npm run build
```

```sh
npm run preview
```

La build di produzione ordinaria disabilita il profiling: l'app continua a funzionare ma non devi aspettarti gli stessi record `onRender`. Per misurare con la strumentazione React in produzione serve la specifica build con profiling, da configurare secondo la toolchain; non basta impostare un flag nel componente.

Strict Mode aggiunge controlli in sviluppo, quindi non equiparare il numero di log o i tempi del dev server all'esperienza di produzione. Anche Fast Refresh puo alterare una sessione: riparti da un reload quando serve una riproduzione pulita.

## Adattamenti comuni

- Restringi il Profiler al sottoalbero sospetto; usa identificatori distinti per confrontare regioni diverse.
- Per array grandi misura se serve virtualizzazione; non aggiungere `memo` o `useMemo` ovunque senza verificare cosa costa.
- Per un bug di identita controlla `key`, posizione e tipo del componente: un remount puo sembrare un reset inspiegabile.
- Per effect ripetuti controlla dipendenze, cleanup e identita di oggetti/funzioni, non nascondere il sintomo rimuovendo Strict Mode.
- Strumenti aggiuntivi del tipo "why did this render" sono diagnostica opzionale con compatibilita e costo propri, non una prova automatica di spreco.

## Debug rapido

| Problema | Controllo |
| --- | --- |
| Non vedo Components | Estensione attiva, pagina/frame corretti e app React montata |
| Non vedo record del callback | Build con profiling, sottoalbero montato, filtro della console |
| Dopo un setter leggo il vecchio valore | Snapshot del render, non necessariamente aggiornamento fallito |
| Stato perso al cambio vista | Smontaggio, nuova key o componente definito dentro un altro |
| Profiler veloce ma pagina lenta | Performance browser, rete, layout e codice esterno a React |
| Stile apparentemente ignorato | Selettore, classe generata, cascata e variabili CSS in Computed |

## Checklist finale

- Riproduzione scritta e comportamento atteso verificabile?
- Dati sensibili esclusi da log, screenshot e registrazioni condivise?
- Build, strumenti e condizioni del confronto annotati?
- Costo React distinto dal costo totale dell'interazione?
- Correzione minima e test di regressione aggiunto?
- Misurazione ripetuta senza cambiare contemporaneamente dati e ambiente?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]
- [[Programmazione/React/Pagine/Virtualizzazione delle liste|Virtualizzazione delle liste]]
- [[Programmazione/React/Pagine/Batching|Batching]]
- [[Programmazione/React/Pagine/React Compiler|React Compiler]]
- [[Programmazione/React/Pagine/useState|useState]]
- [[Programmazione/React/Pagine/useEffect|useEffect]]
- [[Programmazione/JavaScript/Pagine/Source maps e debugging|Source maps e debugging]]

## Fonti

Consultate il 2026-10-15; esempio con React 19.3.0, Vite 8.3.4 e plugin React 6.1.2. L'interfaccia dell'estensione puo cambiare indipendentemente dalla versione React.

- [React Developer Tools: installazione e pannelli](https://react.dev/learn/react-developer-tools).
- [Profiler: callback, metriche e limiti della build](https://react.dev/reference/react/Profiler).
- [React Performance tracks](https://react.dev/reference/dev-tools/react-performance-tracks).
- [Chrome: pannello Performance](https://developer.chrome.com/docs/devtools/performance/overview).
- [Chrome: breakpoint JavaScript](https://developer.chrome.com/docs/devtools/javascript/breakpoints).
- [React Strict Mode](https://react.dev/reference/react/StrictMode).
