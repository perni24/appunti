---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - performance
  - hot-path
aliases:
  - Hot path
  - Percorso critico
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Profiling prima del refactoring]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Performance e leggibilita]]"
  - "[[Programmazione/Clean Code/Pagine/Allocazioni inutili]]"
  - "[[Programmazione/Clean Code/Pagine/Cache e invalidazione]]"
title: Hot path
---

# Hot path

## Sintesi

Un **hot path** è un tratto che pesa sul costo del *carico osservato*. «È chiamato spesso» è un indizio: conta anche quanto costa ogni chiamata. Un'operazione rara e lenta può dominare la latenza di alcune richieste pur occupando pochi campioni nel profilo CPU complessivo.

## Esempio: lavoro costante ripetuto nel ciclo

Un filtro conta record per regione. `region` nei record è già normalizzata all'ingresso; il filtro ricevuto è una stringa ASCII da ripulire. La normalizzazione del filtro dipende dalla richiesta, non dalla riga. Spostarla prima del ciclo è lecito perché non ha effetti collaterali e il filtro non cambia.

```js
function countRegion(rows, input) {
  const wanted = input.trim().toLowerCase();
  let matches = 0;
  for (const row of rows) {
    if (row.region === wanted) matches++;
  }
  return matches;
}
```

Per un lotto di 10.000 righe vengono fatti sempre 10.000 confronti, ma la normalizzazione del **filtro** avviene una volta, non 10.000. Il costo algoritmico del ciclo resta lineare. Questo non autorizza a normalizzare allo stesso modo qualunque identificativo, per esempio un indirizzo email intero senza una regola di dominio.

## Prova locale: leggere un profilo CPU

In una directory di prova usa il blocco sopra come inizio di `region.mjs` e aggiungi questo carico riproducibile:

```js
const rows = Array.from({ length: 10_000 }, (_, i) => ({ region: i % 2 ? "eu" : "us" }));
let total = 0;
for (let i = 0; i < 80; i++) total += countRegion(rows, " EU ");
console.log(total);
```

Esegui con Node 24 in quella directory. Usa una directory vuota per non sovrascrivere un profilo con lo stesso nome.

```sh
node --cpu-prof --cpu-prof-name=region.cpuprofile region.mjs
```

Il totale atteso è `400000` (5.000 corrispondenze per 80 lotti). A fine processo Node scrive `region.cpuprofile`, ispezionabile con un visualizzatore di profili V8. Cerca i campioni **propri** della funzione e quelli **inclusivi** dei discendenti: sommare padre e figlio conta due volte parte del lavoro. Una prova così breve può campionare soprattutto avvio e preparazione: l'assenza della funzione tra i primi frame non dimostra che costi zero.

## Limiti e verifica

Confronta il profilo sul carico che motiva la modifica e misura l'intera operazione anche **senza** profiler. Non fissare nei test una percentuale di campioni o un tempo minimo di miglioramento. Con un archivio remoto a dominare l'attesa, ottimizzare il filtro può non cambiare affatto la latenza percepita.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Profiling prima del refactoring|Profiling prima del refactoring]]
- [[Programmazione/Clean Code/Pagine/Performance e leggibilita|Performance e leggibilita]]
- [[Programmazione/Clean Code/Pagine/Allocazioni inutili|Allocazioni inutili]]
- [[Programmazione/Clean Code/Pagine/Cache e invalidazione|Cache e invalidazione]]

## Fonti

- Brendan Gregg, *Systems Performance*
- Martin Thompson, *Mechanical Sympathy*
- Martin Fowler, *Refactoring*
- [Node.js CLI: generare un profilo CPU con --cpu-prof](https://nodejs.org/api/cli.html#--cpu-prof)
- [Brendan Gregg: campioni CPU, larghezza dei frame e stack](https://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html)
