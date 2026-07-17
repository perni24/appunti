---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, pipeline, trasformazioni]
aliases: [Pipeline di trasformazione, Transformation pipeline]
prerequisites: [Composizione di funzioni, Trasformazioni dichiarative]
related: [Funzioni pure e impure, Side effects controllati, Codice esplicito vs codice implicito]
---

# Pipeline di trasformazione

## Sintesi

Una **pipeline di trasformazione** organizza il codice come una sequenza di passaggi, dove ogni passaggio riceve un valore e produce il valore successivo.

E utile quando un dato attraversa normalizzazione, validazione, arricchimento, filtro e formattazione.

## Problema che risolve

Senza una pipeline, la trasformazione di un dato puo diventare una funzione lunga con molte variabili temporanee e condizioni annidate.

Questo rende difficile capire:

- qual e l'ordine dei passaggi;
- quali passaggi sono obbligatori;
- dove vengono introdotti gli effetti;
- quale forma ha il dato in ogni fase;
- dove inserire un nuovo comportamento.

## Concetto chiave

Una pipeline rende esplicito il percorso del dato.

Il codice dovrebbe permettere di leggere i passaggi dall'alto verso il basso, come una ricetta tecnica:

```text
input grezzo -> normalizzato -> validato -> trasformato -> output
```

## Dettagli importanti

- Ogni passaggio dovrebbe avere un nome chiaro.
- Le pipeline sono piu leggibili quando i passaggi sono puri.
- La validazione dovrebbe avvenire prima delle trasformazioni che assumono dati validi.
- I side effects dovrebbero stare all'inizio o alla fine, non sparsi in mezzo.
- Se il dato cambia forma, conviene rendere espliciti i nomi delle fasi.

## Esempio

```js
function importCustomer(rawCustomer) {
  const normalized = normalizeCustomer(rawCustomer);
  const validCustomer = validateCustomer(normalized);
  const customer = toCustomer(validCustomer);

  return saveCustomer(customer);
}
```

La funzione mostra il flusso principale. I dettagli vivono nei passaggi nominati.

## Limiti

- Non ogni flusso e lineare.
- Gestione errori e branching possono rendere la pipeline meno pulita.
- Una pipeline con troppi step puo diventare difficile da seguire.
- Se i passaggi hanno side effects nascosti, la pipeline diventa ingannevole.

## Errori comuni

- Inserire salvataggi, logica di rete o mutazioni nascoste dentro passaggi di trasformazione.
- Usare nomi vaghi come `step1`, `processData`, `handle`.
- Cambiare forma del dato senza renderlo chiaro.
- Continuare la pipeline dopo un errore di validazione.
- Creare pipeline generiche quando il dominio richiede passaggi espliciti.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Composizione di funzioni]]
- [[Trasformazioni dichiarative]]
- [[Funzioni pure e impure]]
- [[Side effects controllati]]
- [[Codice esplicito vs codice implicito]]

## Fonti

- Martin Fowler, *Refactoring*
- Robert C. Martin, *Clean Code*
- Eric Elliott, *Composing Software*
