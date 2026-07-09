---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: base
tags: [clean-code, file, organizzazione]
aliases: [Organizzazione dei file, Organizzare file nel codice]
prerequisites: [Clean Code]
related: [Struttura delle cartelle, Moduli piccoli, Confini tra moduli]
---

# Organizzazione dei file

## Sintesi

L'**organizzazione dei file** riguarda come distribuire codice, test, configurazioni e documentazione dentro un progetto.

Una buona organizzazione rende prevedibile dove cercare una cosa e dove aggiungere una modifica.

## Problema che risolve

Quando i file sono organizzati in modo casuale, ogni modifica richiede esplorazione. Il lettore deve capire se una funzione sta in `utils`, `helpers`, `common`, `services` o in un file senza responsabilita chiara.

Questa incertezza aumenta duplicazione e rende piu facile inserire codice nel posto sbagliato.

## Concetto chiave

Un progetto leggibile ha regole chiare su:

- dove stanno i moduli di dominio;
- dove stanno entry point e adapter;
- dove stanno test e fixture;
- dove stanno configurazioni;
- dove stanno utility realmente condivise;
- dove sta la documentazione.

L'organizzazione deve aiutare il lettore a ricostruire il sistema.

## Dettagli importanti

- File troppo grandi nascondono responsabilita diverse.
- File troppo piccoli e frammentati possono rendere difficile seguire il flusso.
- Le cartelle dovrebbero riflettere confini reali, non solo tipi tecnici.
- I test dovrebbero essere facili da associare al codice testato.
- Le utility generiche vanno tenute sotto controllo: spesso diventano discariche.

## Esempio

Organizzazione debole:

```text
src/
  helpers.ts
  utils.ts
  functions.ts
  data.ts
  app.ts
```

Organizzazione piu leggibile:

```text
src/
  orders/
    order-service.ts
    order-policy.ts
    order-repository.ts
  users/
    user-service.ts
    user-repository.ts
  shared/
    date-format.ts
```

La seconda struttura mostra concetti e confini piu chiaramente.

## Limiti

- Non esiste una struttura valida per ogni progetto.
- Nei progetti piccoli una struttura troppo articolata puo essere rumore.
- Nei framework alcune posizioni sono imposte o convenzionali.
- La struttura deve evolvere quando il dominio cambia.

## Errori comuni

- Creare cartelle `utils` e `helpers` per qualunque cosa.
- Separare solo per tipo tecnico senza considerare il dominio.
- Lasciare file enormi con molte responsabilita.
- Spostare file senza aggiornare import, test e documentazione.
- Cambiare struttura spesso senza una regola condivisa.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Clean Code]]
- [[Struttura delle cartelle]]
- [[Moduli piccoli]]
- [[Confini tra moduli]]
- [[Convenzioni di progetto]]

## Fonti

- Steve McConnell, *Code Complete*
- Robert C. Martin, *Clean Code*
