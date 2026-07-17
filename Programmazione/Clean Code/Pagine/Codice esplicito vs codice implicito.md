---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, leggibilita, esplicito]
aliases: [Codice esplicito vs codice implicito, Codice esplicito]
prerequisites: [Clean Code]
related: [Leggibilita del codice, Principio del minimo stupore]
---

# Codice esplicito vs codice implicito

## Sintesi

Il **codice esplicito** mostra chiaramente dati, dipendenze, condizioni ed effetti. Il **codice implicito** richiede al lettore di dedurre informazioni nascoste da contesto, convenzioni o stato globale.

Il codice esplicito e spesso piu lungo, ma piu facile da cambiare con sicurezza.

## Problema che risolve

Quando troppe informazioni sono implicite, il lettore deve sapere "come funziona tutto" prima di cambiare anche una piccola parte.

Questo aumenta bug, regressioni e dipendenza da conoscenza tribale.

## Concetto chiave

Rendere esplicito significa esporre:

- input necessari;
- output attesi;
- dipendenze;
- stato modificato;
- errori possibili;
- assunzioni importanti.

Non significa scrivere piu codice senza motivo, ma ridurre ambiguita.

## Dettagli importanti

- Le dipendenze passate come parametri sono piu visibili di quelle globali.
- I nomi possono rendere esplicita un'intenzione.
- Una validazione esplicita ai confini evita assunzioni interne fragili.
- I default impliciti vanno documentati o resi chiari.
- Le convenzioni aiutano solo se sono condivise dal team.

## Esempio

Dipendenza implicita:

```js
function sendWelcomeEmail(user) {
  emailClient.send(user.email, "Welcome");
}
```

Dipendenza esplicita:

```js
function sendWelcomeEmail(user, emailClient) {
  emailClient.send(user.email, "Welcome");
}
```

La seconda versione e piu testabile e rende evidente cosa serve alla funzione.

## Limiti

- Esplicitare ogni dettaglio puo rendere il codice rumoroso.
- Alcune convenzioni implicite sono normali nei framework.
- Dipendenze passate ovunque possono indicare un problema di design.
- Serve equilibrio tra chiarezza e ergonomia.

## Errori comuni

- Nascondere dipendenze in singleton o variabili globali.
- Usare configurazioni invisibili senza fallback chiari.
- Affidarsi a side effects non documentati.
- Non validare input esterni.
- Confondere codice conciso con codice chiaro.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Leggibilita del codice]]
- [[Principio del minimo stupore]]
- [[Naming di variabili e funzioni]]
- [[Funzioni con responsabilita singola]]

## Fonti

- Robert C. Martin, *Clean Code*
- Steve McConnell, *Code Complete*
