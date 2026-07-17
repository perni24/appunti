---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, complessita, leggibilita]
aliases: [Complessita cognitiva, Cognitive complexity]
prerequisites: [Leggibilita del codice, Complessita ciclomatica]
related: [Guard clauses, Funzioni piccole, Codice testabile]
---

# Complessita cognitiva

## Sintesi

La **complessita cognitiva** misura quanto e difficile per una persona seguire il flusso del codice.

Rispetto alla complessita ciclomatica, si concentra di piu su annidamenti, salti mentali e struttura leggibile.

## Problema che risolve

Due funzioni possono avere un numero simile di rami, ma una puo essere molto piu difficile da leggere.

La difficolta aumenta quando il lettore deve tenere in memoria:

- annidamenti profondi;
- condizioni negative;
- stati temporanei;
- eccezioni al flusso;
- side effects nascosti;
- livelli di astrazione mescolati.

## Concetto chiave

Il codice pulito riduce il lavoro mentale necessario per capire il flusso.

Una funzione con poca complessita cognitiva permette di identificare rapidamente percorso principale, casi speciali e responsabilita.

## Esempio

Annidamento difficile:

```js
if (user) {
  if (user.active) {
    if (!user.locked) {
      sendWelcomeEmail(user);
    }
  }
}
```

Con guard clauses:

```js
if (!user) return;
if (!user.active) return;
if (user.locked) return;

sendWelcomeEmail(user);
```

Il secondo esempio riduce profondita e rumore.

## Dettagli importanti

- Annidamento profondo pesa molto sulla lettura.
- Condizioni nominate sono spesso piu leggibili di espressioni lunghe.
- Il flusso principale dovrebbe essere visibile.
- Funzioni pure e dati immutabili riducono sorpresa.
- Una buona struttura puo valere piu di una metrica bassa.

## Limiti

- La percezione di complessita dipende anche dal dominio.
- Una metrica automatica non sostituisce code review.
- Alcuni algoritmi sono intrinsecamente complessi.
- Spezzare troppo puo spostare la fatica sulla navigazione tra file.

## Errori comuni

- Usare condizioni negative complesse.
- Tenere molti stati temporanei mutabili.
- Mescolare validazione, decisione e side effects.
- Nascondere il percorso principale in mezzo ai casi speciali.
- Considerare leggibile solo cio che e corto.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Leggibilita del codice]]
- [[Guard clauses]]
- [[Complessita ciclomatica]]
- [[Funzioni piccole]]
- [[Codice testabile]]

## Fonti

- SonarSource, *Cognitive Complexity*
- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
