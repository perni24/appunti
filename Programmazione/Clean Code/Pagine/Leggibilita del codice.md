---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: base
tags: [clean-code, leggibilita, qualita-codice]
aliases: [Leggibilita del codice, Codice leggibile]
prerequisites: [Clean Code]
related: [Nomi che rivelano intenzione, Codice esplicito vs codice implicito]
---

# Leggibilita del codice

## Sintesi

La **leggibilita del codice** e la facilita con cui una persona riesce a capire cosa fa un blocco di codice, perche lo fa e quali vincoli deve rispettare.

Un codice leggibile riduce errori, velocizza review e rende piu sicure le modifiche.

## Problema che risolve

Il codice difficile da leggere rallenta ogni attivita successiva: debug, estensione, refactoring, onboarding e review.

Quando il lettore deve ricostruire troppe informazioni implicite, aumenta il rischio di modificare il comportamento sbagliato.

## Concetto chiave

La leggibilita dipende da tre livelli:

1. **locale**: nomi, espressioni, condizioni, funzioni;
2. **strutturale**: file, moduli, dipendenze, flusso;
3. **di dominio**: quanto il codice rappresenta bene il problema reale.

Un codice leggibile non obbliga il lettore a tenere troppi dettagli in memoria.

## Dettagli importanti

- I nomi sono parte della documentazione.
- Le condizioni complesse vanno nominate o scomposte.
- Una funzione dovrebbe far capire rapidamente il proprio scopo.
- L'ordine del codice dovrebbe seguire il flusso naturale di lettura.
- Il codice leggibile espone intenzioni, non solo operazioni.

## Esempio

Condizione difficile da leggere:

```js
if (user.age >= 18 && user.status === "active" && !user.banned) {
  allowAccess();
}
```

Condizione esplicitata:

```js
const canAccess = user.age >= 18 && user.status === "active" && !user.banned;

if (canAccess) {
  allowAccess();
}
```

La seconda versione permette al lettore di ragionare sul concetto, non solo sui dettagli.

## Limiti

- Rendere il codice piu leggibile non significa aggiungere commenti ovunque.
- Scomporre troppo puo rendere difficile seguire il flusso.
- In codice ad alte prestazioni alcune ottimizzazioni possono ridurre leggibilita.
- La leggibilita dipende anche dalle convenzioni del linguaggio.

## Errori comuni

- Usare nomi corti fuori contesto.
- Scrivere condizioni annidate senza nominarle.
- Mescolare livelli di astrazione nella stessa funzione.
- Rendere impliciti effetti collaterali importanti.
- Pensare che "io lo capisco" sia sufficiente.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Clean Code]]
- [[Nomi che rivelano intenzione]]
- [[Codice esplicito vs codice implicito]]
- [[Funzioni piccole]]

## Fonti

- Robert C. Martin, *Clean Code*
- Steve McConnell, *Code Complete*
