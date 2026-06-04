---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, accessibility, aria]
aliases: [WAI-ARIA, ARIA]
prerequisites: []
related: []
---

# WAI-ARIA

## Sintesi

WAI-ARIA aggiunge semantica accessibile quando HTML nativo non basta. In React va usato con cautela: prima scegli elementi HTML corretti, poi aggiungi ARIA solo per colmare lacune reali.

Regola pratica: no ARIA e meglio di ARIA sbagliata.

## Quando usarlo

Usa ARIA per componenti custom come dialog, combobox, tab, accordion, menu, live region e controlli non rappresentabili bene con HTML standard.

## Come funziona

```jsx
<button aria-expanded={open} aria-controls="panel">
  Dettagli
</button>
<div id="panel" hidden={!open}>
  Contenuto
</div>
```

ARIA comunica stato e relazione agli assistive technology.

## API / Sintassi

Attributi comuni:

```jsx
aria-label
aria-labelledby
aria-describedby
aria-expanded
aria-controls
aria-current
aria-live
role
```

Esempio:

```jsx
<nav aria-label="Navigazione principale">
  <a aria-current="page" href="/dashboard">Dashboard</a>
</nav>
```

## Esempio pratico

Dialog:

```jsx
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Conferma</h2>
  <button>Chiudi</button>
</div>
```

Serve anche focus management: ARIA da sola non basta.

## Varianti

- **Role**: assegna ruolo semantico.
- **State ARIA**: expanded, selected, checked.
- **Relationship ARIA**: labelledby, describedby, controls.
- **Live regions**: aggiornamenti annunciati.
- **Landmarks**: navigation, main, complementary.

## Errori comuni

- Usare `div` cliccabili invece di `button`.
- Aggiungere role sbagliati.
- Non sincronizzare ARIA con lo stato reale.
- Usare ARIA per correggere HTML non semantico quando esiste elemento nativo.
- Dimenticare tastiera e focus.

## Checklist

- Esiste un elemento HTML nativo adatto?
- Il ruolo ARIA e corretto?
- Gli stati ARIA seguono lo state React?
- Il componente funziona da tastiera?
- Focus e annunci sono testati?
- I test a11y coprono il componente?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Focus Management]]
- [[Test di accessibilita]]
- [[Portals]]
- [[Design system]]
