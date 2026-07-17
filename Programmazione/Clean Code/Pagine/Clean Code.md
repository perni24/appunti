---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, qualita-codice, manutenibilita]
aliases: [Clean Code, Codice pulito]
prerequisites: []
related: [Leggibilita del codice, Manutenibilita del codice, Debito tecnico]
---

# Clean Code

## Sintesi

Il **Clean Code** e codice scritto in modo da essere capito, modificato e verificato con il minor attrito possibile.

Non significa codice elegante per gusto personale. Significa codice che riduce il costo futuro delle modifiche.

## Problema che risolve

Un programma puo funzionare oggi ma diventare difficile da cambiare domani. Il Clean Code affronta questo problema: rende il comportamento leggibile, le responsabilita chiare e gli errori piu facili da individuare.

Il punto centrale e che il codice viene letto molte piu volte di quante venga scritto.

## Concetto chiave

Codice pulito significa:

- nomi che spiegano intenzione;
- funzioni piccole e focalizzate;
- dipendenze visibili;
- comportamento esplicito;
- test e controlli comprensibili;
- struttura coerente con il dominio;
- poche sorprese per chi legge.

Il codice pulito non nasce da una singola regola, ma da molte decisioni locali coerenti.

## Dettagli importanti

- Un codice pulito puo usare astrazioni, ma solo quando aiutano davvero.
- La leggibilita vale piu della compattezza.
- La duplicazione non e sempre il male peggiore: a volte un'astrazione prematura costa di piu.
- Il codice pulito deve restare vicino al problema reale, non solo a un pattern.
- La qualita si vede quando arriva una modifica, non solo quando il codice viene scritto.

## Esempio

Codice poco chiaro:

```js
if (u.a && u.s > 0) {
  p(u);
}
```

Codice piu leggibile:

```js
if (user.isActive && user.remainingCredits > 0) {
  processUser(user);
}
```

Il secondo esempio non cambia il comportamento, ma riduce il lavoro mentale necessario per capirlo.

## Limiti

- Il Clean Code non sostituisce architettura, test e conoscenza del dominio.
- Non tutte le regole valgono in ogni linguaggio o contesto.
- Un codice troppo astratto puo sembrare pulito ma diventare difficile da seguire.
- La leggibilita va bilanciata con performance, compatibilita e vincoli reali.

## Errori comuni

- Confondere Clean Code con stile personale.
- Applicare regole senza capire il motivo.
- Estrarre funzioni solo per ridurre righe, non complessita.
- Creare astrazioni prima di vedere pattern reali.
- Ignorare il contesto del team e del progetto.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Leggibilita del codice]]
- [[Manutenibilita del codice]]
- [[Debito tecnico]]
- [[Funzioni con responsabilita singola]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
