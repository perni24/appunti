---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [react, debugging, profiler, performance]
aliases: [Profiler e Debugging, React DevTools]
prerequisites: []
related: []
---

# Profiler e Debugging

## Sintesi

React DevTools e il Profiler aiutano a capire struttura dei componenti, props, state, render e costi di aggiornamento. Il debugging React deve distinguere bug di stato, bug di rendering, side effect e problemi di performance.

## Quando usarlo

Usa DevTools per ispezionare componenti e props. Usa Profiler quando sospetti render inutili, componenti lenti, liste pesanti o update troppo frequenti.

## Come funziona

Il Profiler registra una interazione e mostra:

- quali componenti hanno renderizzato;
- quanto tempo hanno impiegato;
- perche sono stati aggiornati;
- quale commit e stato costoso.

## API / Sintassi

Debug nel codice:

```jsx
console.log({ props, state });
```

Profiler component:

```jsx
<Profiler id="SearchResults" onRender={handleRender}>
  <SearchResults />
</Profiler>
```

Callback:

```jsx
function handleRender(id, phase, actualDuration) {
  console.log(id, phase, actualDuration);
}
```

## Esempio pratico

Workflow:

1. riproduci il problema;
2. ispeziona props e state con DevTools;
3. registra interazione con Profiler;
4. individua commit o componenti costosi;
5. applica una modifica mirata;
6. misura di nuovo.

## Varianti

- **React DevTools Components**: struttura componenti.
- **Profiler**: costo render.
- **Console/debugger**: flusso logico.
- **Network panel**: data fetching.
- **Why did this render**: analisi render inutili.
- **Test**: blocca regressioni.

## Errori comuni

- Ottimizzare prima di misurare.
- Confondere render frequente con problema reale.
- Ignorare costi di commit DOM.
- Usare memoization casuale.
- Non riprodurre il problema con dati realistici.

## Checklist

- Il problema e correttezza o performance?
- Il profiler mostra un collo di bottiglia reale?
- Le props cambiano per identita instabile?
- Ci sono effect che causano loop?
- La modifica e stata rimisurata?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[useMemo e useCallback]]
- [[Virtualizzazione delle liste]]
- [[Batching]]
- [[React Compiler]]
