---
date: 2026-11-27
title: "Tipografia e spaziatura in CSS"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [css, tipografia, accessibilita]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Box model e dimensionamento|Box model e dimensionamento]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]"
  - "[[Programmazione/HTML e CSS/Pagine/Colori e contrasto del testo|Colori e contrasto del testo]]"
---

# Tipografia e spaziatura in CSS

## Sintesi

Tre scelte diverse regolano la lettura: la **dimensione dei caratteri**, la **distanza fra le righe** e la **lunghezza della riga**. Ingrandire il font senza lasciare crescere la scatola può rendere il testo meno leggibile, non più leggibile.

## Esempio: un estratto di appunto

```html
<article class="estratto">
  <h2>Come leggere una tabella</h2>
  <p>Prima di confrontare i valori, cerca il titolo e le intestazioni.
     Ogni numero ha senso soltanto nella riga e nella colonna a cui appartiene.</p>
</article>
```

```css
.estratto {
  font-family: system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  max-inline-size: 65ch;
  overflow-wrap: anywhere;
}

.estratto h2 {
  font-size: 1.5em;
  line-height: 1.2;
}

.estratto p {
  margin-block: 0 1em;
}
```

| Scelta | Cosa cambia nell'esempio |
| --- | --- |
| `1rem` sul testo | Segue la dimensione del font della radice. Se la radice passa da 16 a 20 px, anche il testo passa da 16 a 20 px. |
| `1.5em` per il font del titolo | Per la proprietà `font-size`, l'unità `em` si riferisce al font del genitore: il titolo passa da 24 a 30 px. |
| `line-height: 1.5` | Il fattore senza unità si eredita come numero. Nel paragrafo da 20 px produce righe da 30 px. Il titolo usa il proprio fattore 1.2. |
| `max-inline-size: 65ch` | Limita le righe quando c'è spazio; nei caratteri proporzionali non significa «esattamente 65 lettere». `ch` dipende dalla misura dello zero nel font. |

## Come provare il risultato

1. Imposta temporaneamente `font-size: 20px` sull'elemento `html` con gli strumenti del browser. Controlla le dimensioni calcolate del titolo e del paragrafo.
2. Restringi la finestra e aumenta la spaziatura fra parole e lettere: si devono formare più righe e l'articolo deve crescere in altezza senza perdere testo.
3. Ripeti con lo zoom del browser al 200%. Cambiare solo il font della radice è utile per capire le unità, ma **non simula** tutti gli effetti dello zoom.

## Errori comuni

- Fissare l'altezza del paragrafo e applicare `overflow: hidden`: una traduzione più lunga o la spaziatura personalizzata può far sparire le ultime righe.
- Considerare `65ch` o l'interlinea dell'esempio un requisito WCAG. Sono scelte tipografiche; il criterio sulla spaziatura riguarda la **possibilità di modificarla senza perdere contenuto o funzioni**.

## Collegamenti

- [[Programmazione/HTML e CSS/Pagine/Web font e stabilità del layout|Perché il testo va a capo quando arriva un web font]]
- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Layout responsive e media query|Layout responsive e media query]]
- [[Programmazione/HTML e CSS/Pagine/Colori e contrasto del testo|Colori e contrasto del testo]]

## Fonti

- [CSSWG: unità relative ai caratteri](https://www.w3.org/TR/css-values-4/#font-relative-lengths)
- [W3C WAI: modifiche alla spaziatura del testo](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)
