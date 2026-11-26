---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - design
  - coesione
  - accoppiamento
aliases:
  - Coesione e accoppiamento
  - Cohesion and coupling
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Moduli piccoli]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Separazione delle responsabilita]]"
  - "[[Programmazione/Clean Code/Pagine/Confini tra moduli]]"
  - "[[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]"
title: Coesione e accoppiamento
---

# Coesione e accoppiamento

## Sintesi

La **coesione** riguarda l'interno di un modulo: le sue parti collaborano alla stessa decisione? L'**accoppiamento** riguarda una relazione: che cosa deve sapere un modulo dell'altro per usarlo correttamente? Non sono estremi di una stessa scala. Un modulo può essere coeso e, al tempo stesso, dipendere da dettagli fragili.

## Esempio: il report delle iscrizioni

Un report che seleziona iscrizioni attive e le presenta in ordine alfabetico ha uno scopo riconoscibile. Se però legge direttamente colonne, codici di stato e date della tabella utenti, conosce anche il modo in cui quei dati sono conservati. Rinominare una colonna può rompere il report pur lasciando immutata la nozione di «iscrizione attiva».

| Scelta | Che cosa migliora | Che cosa può ancora andare storto |
| --- | --- | --- |
| Spostare il report fuori da un `UserService` che invia anche newsletter e crea fatture | La coesione: il report non cambia più per una modifica alla newsletter. | Può continuare a conoscere lo schema SQL. |
| Chiedere `listActiveMembers()` a una sorgente che restituisce i soli dati concordati | L'accoppiamento allo schema: la sorgente può adattarsi a una rinomina interna. | Restano vere dipendenze dal significato di «attivo», dai campi restituiti e dalla gestione degli errori. |
| Spostare la query in `common` ma far interpretare al report gli stessi codici del database | Cambia il percorso del codice. | La conoscenza della rappresentazione resta nel chiamante. |

## Come verificarlo in review

Immagina due modifiche indipendenti. Per cambiare l'ordinamento alfabetico dovresti intervenire sul report; per cambiare la codifica dello stato nel database non dovresti riscrivere il report né i suoi test. Se invece cambia **chi ha diritto** a comparire, può essere corretto rivedere entrambi: è cambiato il significato del contratto, non solo la sua implementazione.

## Limiti ed errori comuni

Non usare il conteggio degli import come misura assoluta. Una sola dipendenza da un oggetto globale può nascondere più vincoli di tre collaboratori ben definiti. Una dipendenza ciclica merita indagine, ma aggiungere un'interfaccia per ogni chiamata non garantisce né minor accoppiamento né maggiore coesione.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Moduli piccoli|Moduli piccoli]]
- [[Programmazione/Clean Code/Pagine/Confini tra moduli|Confini tra moduli]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]
- [[Programmazione/Clean Code/Pagine/Separazione delle responsabilita|Separazione delle responsabilita]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]

## Fonti

- Martin Fowler, [Reducing Coupling](https://martinfowler.com/ieeeSoftware/coupling.pdf)
- Robert C. Martin, *Clean Architecture*; David Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules*
