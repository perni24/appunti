---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, leggibilita, design-api]
aliases: [Principio del minimo stupore, Principle of least astonishment]
prerequisites: [Clean Code]
related: [Leggibilita del codice, Codice esplicito vs codice implicito]
---

# Principio del minimo stupore

## Sintesi

Il **principio del minimo stupore** dice che il codice dovrebbe comportarsi nel modo piu prevedibile possibile per chi lo legge o lo usa.

Se un nome, una funzione o un modulo fanno una cosa sorprendente, il codice diventa piu difficile da usare correttamente.

## Problema che risolve

Molti bug nascono da aspettative sbagliate. Una funzione sembra innocua ma modifica stato globale. Un getter esegue una chiamata di rete. Un metodo chiamato `validate` salva dati.

Il principio riduce queste sorprese.

## Concetto chiave

Un codice prevedibile allinea:

- nome;
- comportamento;
- effetti collaterali;
- errori possibili;
- costo operativo;
- livello di astrazione.

Quando questi elementi non sono coerenti, il lettore viene tratto in inganno.

## Dettagli importanti

- Un nome deve promettere solo cio che la funzione fa davvero.
- Gli effetti collaterali importanti devono essere visibili.
- Le API dovrebbero seguire convenzioni del linguaggio e del progetto.
- Il comportamento speciale va reso esplicito.
- Le eccezioni alla regola devono essere rare e motivate.

## Esempio

Nome sorprendente:

```js
function getUser(id) {
  auditAccess(id);
  return database.findUser(id);
}
```

Nome piu onesto:

```js
function getUserAndRecordAccess(id) {
  auditAccess(id);
  return database.findUser(id);
}
```

Il secondo nome rende visibile l'effetto collaterale.

## Limiti

- Non tutte le sorprese possono essere eliminate.
- Alcune API storiche hanno nomi imperfetti ma ormai stabili.
- Rendere tutto esplicito puo creare nomi troppo lunghi.
- La prevedibilita dipende anche dalle convenzioni del contesto.

## Errori comuni

- Usare nomi troppo generici.
- Nascondere operazioni costose dietro metodi apparentemente semplici.
- Modificare stato dentro funzioni che sembrano pure.
- Usare convenzioni opposte a quelle del linguaggio.
- Far dipendere il comportamento da configurazioni invisibili.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Leggibilita del codice]]
- [[Codice esplicito vs codice implicito]]
- [[Naming di variabili e funzioni]]
- [[Nomi che rivelano intenzione]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
