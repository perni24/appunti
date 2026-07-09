---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: base
tags: [clean-code, debito-tecnico, manutenzione]
aliases: [Debito tecnico, Technical debt]
prerequisites: [Clean Code]
related: [Manutenibilita del codice, Semplicita e complessita accidentale]
---

# Debito tecnico

## Sintesi

Il **debito tecnico** e il costo futuro generato da una scelta tecnica che rende piu veloce il presente ma piu costoso il cambiamento successivo.

Non tutto il debito e negativo: il problema nasce quando non viene riconosciuto, tracciato o ripagato.

## Problema che risolve

Il concetto aiuta a distinguere tra:

- scorciatoie consapevoli;
- scelte temporanee;
- degrado non controllato;
- complessita accumulata;
- lavoro invisibile che rallenta il team.

Senza questa distinzione, ogni problema di qualita sembra solo "codice brutto".

## Concetto chiave

Il debito tecnico funziona come un debito finanziario:

- permette di ottenere qualcosa prima;
- produce interessi nel tempo;
- puo essere gestito;
- diventa pericoloso se ignorato.

Gli interessi sono bug, lentezza nello sviluppo, paura di cambiare codice, test fragili e onboarding difficile.

## Dettagli importanti

- Il debito intenzionale deve essere documentato.
- Il debito non intenzionale nasce spesso da mancanza di conoscenza.
- Non tutto il debito va ripagato subito.
- Il debito in aree critiche costa piu del debito in codice periferico.
- Il refactoring e uno dei modi principali per ripagare debito.

## Esempio

Debito intenzionale:

```text
Implementiamo una soluzione semplice per validare il mercato.
Apriamo una issue per sostituirla prima della release pubblica.
```

Debito non controllato:

```text
Copiamo la stessa logica in cinque punti e nessuno sa quale sia la versione corretta.
```

## Limiti

- Il termine puo diventare una scusa per riscrivere tutto.
- Non ogni imperfezione e debito urgente.
- Alcuni compromessi sono corretti rispetto al contesto.
- Serve collegare il debito a impatti concreti, non solo a preferenze.

## Errori comuni

- Chiamare debito tecnico ogni codice che non piace.
- Non documentare scorciatoie temporanee.
- Ripagare debito in aree che non cambiano mai.
- Ignorare debito in aree centrali.
- Accumulare TODO senza ownership.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Clean Code]]
- [[Manutenibilita del codice]]
- [[Semplicita e complessita accidentale]]
- [[Commenti che spiegano il perche non il cosa]]

## Fonti

- Ward Cunningham, metafora del technical debt
- Martin Fowler, *Technical Debt Quadrant*
