---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - file
  - organizzazione
aliases:
  - Organizzazione dei file
  - Organizzare file nel codice
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Struttura delle cartelle]]"
  - "[[Programmazione/Clean Code/Pagine/Moduli piccoli]]"
  - "[[Programmazione/Clean Code/Pagine/Confini tra moduli]]"
title: Organizzazione dei file
---

# Organizzazione dei file

## Sintesi

Organizzare i file significa rendere prevedibile **dove intervenire per una modifica concreta**. La struttura delle cartelle indica le aree del progetto; la scelta del singolo file decide quali regole si leggono, si testano e cambiano insieme.

## Esempio: cambia la tariffa di spedizione

Nel progetto di esempio il checkout espone il costo di spedizione, ma non decide il prezzo. La tariffa dipende dal peso del pacco. Se domani cambia la soglia, chi legge dovrebbe poter arrivare dalla richiesta del cliente alla regola e al suo test senza cercare fra `utils`, `helpers` e `common`.

```text
src/
  checkout/
    submit-order.mjs
  shipping/
    index.mjs
    rates.mjs
    rates.test.mjs
  main.mjs
```

| Cambiamento | Primo file da aprire | Perché |
| --- | --- | --- |
| Varia la tariffa oltre 500 grammi | `shipping/rates.mjs` e `rates.test.mjs` | Sono la decisione e gli esempi ai suoi limiti. |
| Il checkout deve mostrare il costo separatamente | `checkout/submit-order.mjs` | Cambia l'uso del risultato, non il calcolo. |
| Si sostituisce un servizio esterno all'avvio | `main.mjs` | È il punto in cui questo progetto costruisce e collega i collaboratori. |
| Un altro modulo deve usare la tariffa | `shipping/index.mjs` | Controlla prima se esiste già un ingresso pubblico. |

## Quando separare un file

Estrai un file se puoi nominare la decisione che contiene e indicare chi ne ha bisogno. Non dividere una funzione e il suo unico helper solo per ridurre il numero di righe. Mettere il test accanto al codice è una convenzione di questo esempio: anche una directory `tests/` va bene se il test pertinente si trova facilmente e il runner lo scopre.

## Limiti ed errori comuni

- Due trasformazioni apparentemente identiche in moduli diversi non meritano automaticamente un `shared/utils.mjs`. Prima chiedi se devono cambiare per lo stesso requisito.
- Spostare un file non sposta automaticamente i suoi consumatori: verifica import, test, fixture, percorsi usati dagli script e riferimenti nella documentazione. Per una libreria, controlla anche gli ingressi già pubblicati.
- Non duplicare codice solo per far combaciare un albero ideale. Rispetta i percorsi richiesti dal framework; applica le convenzioni locali dove hai libertà di scelta.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Clean Code|Clean Code]]
- [[Programmazione/Clean Code/Pagine/Struttura delle cartelle|Struttura delle cartelle]]
- [[Programmazione/Clean Code/Pagine/Moduli piccoli|Moduli piccoli]]
- [[Programmazione/Clean Code/Pagine/Confini tra moduli|Confini tra moduli]]
- [[Programmazione/Clean Code/Pagine/Convenzioni di progetto|Convenzioni di progetto]]

## Fonti

- Steve McConnell, *Code Complete*; Robert C. Martin, *Clean Code*
- Angular, [Style guide: Project structure](https://angular.dev/style-guide#project-structure). Un esempio di convenzioni per funzionalità, non una struttura obbligatoria per Node.
