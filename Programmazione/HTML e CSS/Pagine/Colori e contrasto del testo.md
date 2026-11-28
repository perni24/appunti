---
date: 2026-11-27
title: "Colori e contrasto del testo"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [css, colori, accessibilita]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Tipografia e spaziatura in CSS|Tipografia e spaziatura in CSS]]"
  - "[[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]"
---

# Colori e contrasto del testo

## Sintesi

Per decidere se un messaggio è leggibile, confronta il **colore del testo con il suo sfondo effettivo**. Per decidere se è comprensibile, chiediti invece cosa resta togliendo il colore. Una scritta rossa può avere un ottimo contrasto e lasciare comunque ambiguo il significato del rosso.

## Esempio: esito della verifica

```html
<p class="esito"><strong>Da correggere:</strong> manca il titolo della scheda.</p>
```

```css
.esito {
  color: #595959;
  background-color: #fff;
  border-inline-start: 0.25rem solid #a02828;
  padding-inline-start: 0.75rem;
}
```

La coppia `#595959` su bianco ha un rapporto di circa **7:1**. Se cambi solo il testo in `#777777`, il rapporto scende a circa **4,48:1**: non basta per una soglia di 4,5:1, anche se arrotondando a una cifra sembra sufficiente. Il bordo richiama l'attenzione; è la dicitura «Da correggere» a comunicare lo stato, anche senza il rosso.

## Quale soglia controllare?

Per il criterio WCAG 2.2 **1.4.3**, livello AA, il testo ordinario richiede almeno **4,5:1**; per il testo grande bastano **3:1**. «Grande» indica almeno 18 pt (24 CSS px), oppure 14 pt (circa 18,67 CSS px) in grassetto: usare un `h2` non garantisce di per sé la soglia ridotta. Esistono eccezioni, fra cui logotipi e testo di controlli inattivi; non estenderle a istruzioni o messaggi di errore.

## Errori comuni e verifica

- Misurare un colore preso dalla palette invece del risultato visibile. Con `opacity`, uno sfondo fotografico o un gradiente, la coppia effettiva può cambiare: verifica anche la zona con il contrasto peggiore.
- Usare due pallini, rosso e verde, senza etichette. Una differenza cromatica non sostituisce parole come «Da correggere» e «Pronto».
- Controllare solo il tema chiaro. Ispeziona testo e sfondo negli strumenti del browser per ogni tema e stato disponibile. Il contrasto del testo non dimostra da solo che bordi, icone e focus siano distinguibili.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Tipografia e spaziatura in CSS|Tipografia e spaziatura in CSS]]
- [[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]

## Fonti

- [W3C WAI: contrasto minimo del testo e definizione di testo grande](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C WAI: significato non affidato al solo colore](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
