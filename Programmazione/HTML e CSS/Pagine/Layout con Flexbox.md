---
date: 2026-11-27
title: "Layout con Flexbox"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [css, flexbox, layout]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]"
  - "[[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]"
---

# Layout con Flexbox

## Sintesi

Flexbox dispone i **figli diretti** di un contenitore lungo un asse principale, in riga o colonna. È adatto a una barra di azioni, a un gruppo di filtri o a una sequenza in cui conta soprattutto come distribuire lo spazio lungo quell'asse.

## Esempio: un titolo e un link

```html
<div class="barra">
  <strong>Appunti di frontend</strong>
  <a href="#catalogo">Vai al catalogo</a>
</div>
<section id="catalogo"><h2>Catalogo</h2></section>
```

```css
.barra {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}
.barra > a {
  margin-inline-start: auto;
}
```

Su una riga il margine automatico assorbe lo spazio libero prima del link, che si sposta alla fine. Restringendo il contenitore, `flex-wrap: wrap` permette agli elementi di distribuirsi su più righe. Ogni riga distribuisce il proprio spazio: Flexbox **non mantiene colonne allineate fra righe diverse**.

## Le proprietà da non scambiare

| Proprietà | Su cosa agisce |
| --- | --- |
| `flex-direction` | Sul contenitore: `row` segue l'asse inline, `column` quello di blocco. Non significano sempre orizzontale e verticale. |
| `justify-content` | Distribuisce lo spazio disponibile lungo l'asse principale. |
| `align-items` | Allinea gli elementi sull'asse trasversale. |
| `flex: 1 1 12rem` | Sul figlio: può crescere, può restringersi, parte da una base di `12rem`. Non garantisce una larghezza finale esatta. |

Se un figlio con testo lungo non si restringe, controllare la dimensione minima automatica del flex item: `min-inline-size: 0` può permettere la riduzione in una riga; per una stringa indivisibile può servire anche `overflow-wrap: anywhere`. Usare `order` per cambiare l'ordine visivo non riordina la navigazione da tastiera: partire da un ordine HTML sensato.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Diagnosticare overflow in Flexbox e Grid|Diagnosticare overflow in Flexbox e Grid]]
- [[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]
- [[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]

## Fonti

- [W3C: Flexible Box Layout](https://www.w3.org/TR/css-flexbox-1/)
