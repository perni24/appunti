---
date: 2026-11-27
title: "Tabelle dati accessibili in HTML"
area: Programmazione
topic: HTML e CSS
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [html, tabelle, accessibilita]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]"
---

# Tabelle dati accessibili in HTML

## Sintesi

Una tabella serve quando il significato di un valore dipende dall'incrocio tra una riga e una colonna. Se leggendo «6» bisogna sapere *quale corso* e *quale turno*, quelle due informazioni sono intestazioni, non semplicemente testo in grassetto. Per affiancare elementi senza queste relazioni usa invece CSS Grid.

## Esempio: posti disponibili per laboratorio

```html
<table>
  <caption>Posti disponibili per laboratorio e turno</caption>
  <thead>
    <tr>
      <th scope="col">Laboratorio</th>
      <th scope="col">Mattina</th>
      <th scope="col">Pomeriggio</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">HTML</th>
      <td>8</td>
      <td>6</td>
    </tr>
    <tr>
      <th scope="row">CSS</th>
      <td>4</td>
      <td>9</td>
    </tr>
  </tbody>
</table>
```

`caption` dà un nome all'intera tabella. `th scope="col"` identifica l'intestazione per i dati di una colonna; `th scope="row"` quella di una riga. Il **6** si legge quindi «HTML, Pomeriggio: 6 posti». `thead` e `tbody` raggruppano righe: non trasformano un `td` in un'intestazione.

## Se le intestazioni sono più complesse

`colspan` e `rowspan` fanno occupare più celle a un elemento: non bastano da soli a rendere evidente ogni relazione. Se possibile, dividi un prospetto a più livelli in tabelle semplici con titoli distinti. Se più intestazioni devono restare associate a una cella e l'associazione non è deducibile per riga o colonna, assegna un `id` univoco a ciascun `th` e indica in `headers` sul `td` gli ID pertinenti separati da spazi.

## Verifica pratica

- Nei controlli di accessibilità del browser cerca una tabella con il nome della didascalia e intestazioni distinte per riga e colonna. Un bordo o il grassetto non danno queste informazioni.
- Con uno screen reader, entra nella tabella e spostati tra le celle con i suoi comandi per tabelle: passando da 8 a 6 cambia il turno, non il laboratorio. Non aspettarti che `Tab` si fermi su ogni numero: i dati non sono controlli.
- Su schermi stretti non nascondere intestazioni necessarie per interpretare i valori. Se serve lo scorrimento orizzontale, limitalo alla tabella e verifica che sia utilizzabile anche senza mouse.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/HTML semantico e navigazione|HTML semantico e navigazione]]
- [[Programmazione/HTML e CSS/Pagine/Layout con CSS Grid|Layout con CSS Grid]]

## Fonti

- [W3C WAI: tabelle con intestazioni di riga e colonna](https://www.w3.org/WAI/tutorials/tables/two-headers/)
- [W3C WAI: tabelle con più livelli di intestazioni](https://www.w3.org/WAI/tutorials/tables/multi-level/)
